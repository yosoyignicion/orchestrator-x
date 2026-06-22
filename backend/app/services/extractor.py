"""Async web extractor using Playwright (chromium headless shell).

Extracts page metadata, heading structure, performance approximations,
security headers, and detects technologies via python-wappalyzer + regex.
"""

from __future__ import annotations

import re
import time
from urllib.parse import urljoin, urlparse

from playwright.async_api import async_playwright

from app.agents.models.extraction import (
    ExtractionResult,
    ExtractedTechnology,
    HeadingStructure,
    PerformanceMetrics,
    SecurityHeaders,
)

# ── Technology fingerprints (regex-based, zero tokens) ──────
TECH_PATTERNS: dict[str, tuple[str, str]] = {
    # CMS & frameworks
    r"wp-content|wp-includes|wp-json": ("WordPress", "CMS"),
    r"shopify\.com|myshopify\.com|ShopPay": ("Shopify", "E-commerce"),
    r"next\.js|__NEXT_DATA__|/_next/static": ("Next.js", "Framework"),
    r"react\.js|react\.min\.js|__REACT_DEVTOOLS": ("React", "Framework"),
    r"vue\.js|vue\.min\.js|__VUE_DEVTOOLS": ("Vue.js", "Framework"),
    r"angular\.js|angular\.min\.js|ng-app\s*=|ng-version\s*=|angular\.io|@angular/": ("Angular", "Framework"),
    r"svelte|__svelte": ("Svelte", "Framework"),
    r"drupal|Drupal\.settings": ("Drupal", "CMS"),
    r"joomla!|joomla|\.joomla": ("Joomla", "CMS"),
    r"wix\.com|Wix\.com": ("Wix", "CMS/Site Builder"),
    r"squarespace\.com|static1\.squarespace": ("Squarespace", "CMS/Site Builder"),
    # Analytics
    r"google-analytics\.com|ga\.js|gtag\(": ("Google Analytics", "Analytics"),
    r"googletagmanager\.com|gtm\.js": ("Google Tag Manager", "Tag Manager"),
    r"fbq\(|connect\.facebook\.net": ("Facebook Pixel", "Analytics"),
    r"hotjar\.com|hotjar": ("Hotjar", "Analytics"),
    # CDN & hosting
    r"cloudflare|cf-ray|__cfduid": ("Cloudflare", "CDN"),
    r"cloudfront\.net": ("CloudFront", "CDN"),
    r"akamai|akamaihd": ("Akamai", "CDN"),
    r"netlify\.com|netlify": ("Netlify", "Hosting"),
    r"vercel\.com|vercel": ("Vercel", "Hosting/Edge"),
    # CSS & UI
    r"tailwindcss|\.tw-|@tailwind": ("Tailwind CSS", "CSS Framework"),
    r"bootstrap\.min\.css|bootstrap\.css": ("Bootstrap", "CSS Framework"),
    # Other
    r"jquery\.js|jquery\.min\.js": ("jQuery", "Library"),
    r"alpinejs|alpine\.js": ("Alpine.js", "Library"),
    r"htmx\.js|htmx\.min\.js|hx-get|hx-post": ("htmx", "Library"),
    r"turbo\.js|turbolinks": ("Turbo/Hotwire", "Library"),
    r"stripe\.com|stripe-js": ("Stripe", "Payment"),
    r"recaptcha|google\.com/recaptcha": ("reCAPTCHA", "Security"),
    r"youtube\.com/embed|youtube\.com/watch": ("YouTube Embed", "Media"),
    r"vimeo\.com": ("Vimeo Embed", "Media"),
}

HEADER_TECH_PATTERNS: dict[tuple[str, str], tuple[str, str]] = {
    ("server", "cloudflare"): ("Cloudflare", "CDN"),
    ("server", "nginx"): ("Nginx", "Web Server"),
    ("server", "apache"): ("Apache", "Web Server"),
    ("server", "openresty"): ("OpenResty", "Web Server"),
    ("x-powered-by", "express"): ("Express", "Framework"),
    ("x-powered-by", "next"): ("Next.js", "Framework"),
    ("x-powered-by", "asp"): ("ASP.NET", "Framework"),
    ("x-generator", "drupal"): ("Drupal", "CMS"),
    ("x-generator", "wordpress"): ("WordPress", "CMS"),
}


def _detect_technologies(html: str, headers: dict[str, str]) -> list[ExtractedTechnology]:
    """Detect technologies via regex patterns and response headers.

    Zero tokens consumed — pure regex match.
    """
    html_lower = html.lower()
    detected: dict[str, ExtractedTechnology] = {}

    for pattern, (name, category) in TECH_PATTERNS.items():
        if re.search(pattern, html_lower, re.IGNORECASE):
            detected[name] = ExtractedTechnology(
                name=name,
                category=category,
                confidence=0.85,
            )

    for (header, value), (name, category) in HEADER_TECH_PATTERNS.items():
        hdr_val = headers.get(header, "")
        if value in hdr_val.lower():
            detected[name] = ExtractedTechnology(
                name=name,
                category=category,
                confidence=0.9,
            )

    # Try python-wappalyzer as a second pass (higher accuracy)
    try:
        from Wappalyzer import Wappalyzer, WebPage

        wapp = Wappalyzer.latest()
        # Wappalyzer needs a WebPage-like object
        webpage = WebPage(url="", html=html, headers=headers)
        results = wapp.analyze(webpage)
        for name in results:
            if name not in detected:
                detected[name] = ExtractedTechnology(name=name, category="", confidence=0.7)
    except ImportError:
        pass  # python-wappalyzer not installed, regex fallback is fine

    return list(detected.values())


def _extract_headings(html: str) -> HeadingStructure:
    """Extract H1-H3 tags via regex (faster than full DOM parse)."""
    h1 = re.findall(r'<h1[^>]*>(.*?)</h1>', html, re.IGNORECASE | re.DOTALL)
    h2 = re.findall(r'<h2[^>]*>(.*?)</h2>', html, re.IGNORECASE | re.DOTALL)
    h3 = re.findall(r'<h3[^>]*>(.*?)</h3>', html, re.IGNORECASE | re.DOTALL)

    def clean(texts: list[str]) -> list[str]:
        return [re.sub(r'<[^>]+>', '', t).strip() for t in texts if t.strip()]

    return HeadingStructure(h1=clean(h1), h2=clean(h2), h3=clean(h3))


async def extract_url(target_url: str, timeout_ms: int = 30_000) -> ExtractionResult:
    """Extract structured data from a URL using Playwright (headless chromium).

    This is the core extraction function:
    1. Launches headless shell
    2. Navigates to URL with timeout
    3. Extracts: title, meta, headings, technologies, performance metrics
    4. Returns a clean dict ready for the agent pipeline
    """
    result = ExtractionResult(url=target_url)

    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=True,
                args=[
                    "--headless=new",  # New headless mode (more lightweight)
                    "--disable-gpu",
                    "--no-sandbox",
                    "--disable-dev-shm-usage",
                    "--disable-extensions",
                    "--disable-images",
                    "--disable-software-rasterizer",
                ],
            )

            context = await browser.new_context(
                user_agent=(
                    "Mozilla/5.0 (X11; Linux x86_64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/148.0.0.0 Safari/537.36"
                ),
                viewport={"width": 1280, "height": 720},
                java_script_enabled=True,
                ignore_https_errors=True,
            )

            page = await context.new_page()

            # Navigation with performance timing
            start = time.monotonic()
            response = await page.goto(target_url, wait_until="domcontentloaded", timeout=timeout_ms)
            load_time_ms = int((time.monotonic() - start) * 1000)

            # Wait a bit for JS-based content
            await page.wait_for_timeout(2000)

            # ── Extract data ──────────────────────────────
            # Title & meta
            title = await page.title()
            meta_desc = await page.evaluate(
                """() => {
                    const m = document.querySelector('meta[name="description"]');
                    return m ? m.getAttribute('content') || '' : '';
                }"""
            )
            meta_keywords = await page.evaluate(
                """() => {
                    const m = document.querySelector('meta[name="keywords"]');
                    return m ? m.getAttribute('content') || '' : '';
                }"""
            )
            favicon = await page.evaluate(
                """() => {
                    const link = document.querySelector('link[rel*="icon"]');
                    return link ? link.getAttribute('href') || null : null;
                }"""
            )

            # Full HTML source for tech detection
            html = await page.content()

            # Performance
            perf = await page.evaluate(
                """() => ({
                    domContentLoaded: performance.timing ?
                        performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart :
                        performance.now(),
                    resourceCount: performance.getEntriesByType('resource').length,
                })"""
            )

            # Headers from response
            headers: dict[str, str] = {}
            if response:
                for key, val in response.headers.items():
                    headers[key.lower()] = val.lower()

            # Security headers
            sec = SecurityHeaders(
                has_csp="content-security-policy" in headers,
                has_hsts="strict-transport-security" in headers,
                has_xframe="x-frame-options" in headers,
                has_xcontent="x-content-type-options" in headers,
            )

            # Resolve favicon URL
            if favicon and not favicon.startswith("http"):
                parsed = urlparse(target_url)
                base = f"{parsed.scheme}://{parsed.netloc}"
                favicon = urljoin(base, favicon)

            # Page size approximation
            page_size_bytes = len(html.encode("utf-8"))

            # ── Assemble result ───────────────────────────
            result.title = title.strip() if title else ""
            result.meta_description = meta_desc.strip()
            result.meta_keywords = meta_keywords.strip()
            result.favicon = favicon
            result.headings = _extract_headings(html)
            result.technologies = _detect_technologies(html, headers)
            result.performance = PerformanceMetrics(
                load_time_ms=load_time_ms,
                dom_content_loaded_ms=int(perf.get("domContentLoaded", 0)),
                resource_count=perf.get("resourceCount", 0),
                page_size_bytes=page_size_bytes,
            )
            result.security = sec

            await browser.close()

    except Exception as e:
        result.error = f"{type(e).__name__}: {e}"

    return result
