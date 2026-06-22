# Orchestrator-X — Plan Maestro Remasterizado 🎯

> **Stack**: Next.js 15 (App Router) + TailwindCSS + Shadcn/ui | FastAPI (Python 3.12) + Playwright | Ollama + gemma3:4b
> **Hardware**: Athlon 3000G | RX 580 8GB | 16GB RAM | Linux Mint
> **Tooling**: Node v24.16 | pnpm | Chromium/WebKit headless (Playwright) | Ollama activo en CPU

---

## 🧭 Visión General

SaaS de auditoría automática de arquitectura web. El cliente introduce una URL → extracción técnica (Playwright headless) → análisis estático (regex/heurística, 0 tokens) → pipeline de 3 agentes IA vía Ollama → dashboard premium con score, pérdida financiera y plan de acción.

---

## 📐 Estructura Monorepo

```
Orchestrator-X/
├── frontend/                    # Next.js 15 App Router
│   ├── src/
│   │   ├── app/                 # Layout, pages (dashboard, landing)
│   │   ├── components/          # Shadcn/ui + custom (AuditDashboard, ScoreGauge, etc.)
│   │   ├── lib/                 # API client, types, utils
│   │   └── styles/              # Tailwind config, globals
│   ├── package.json
│   └── tailwind.config.ts
├── backend/                     # FastAPI monolitico modular
│   ├── app/
│   │   ├── api/                 # Routers: extract, audit, health
│   │   ├── services/            # extractor.py (Playwright), analyzer.py (regex/heurística)
│   │   ├── agents/              # pipeline.py, prompts.py, models/ (Pydantic)
│   │   ├── core/                # Config, dependencies
│   │   └── main.py
│   ├── requirements.txt
│   └── pyproject.toml
├── Makefile                     # Orquestación: dev up, dev down, install
└── prompt-maestro.md            # ← ESTE DOCUMENTO
```

---

## 🏗️ Fases de Desarrollo (5 fases secuenciales)

### ✅ Fase 0 — Scaffolding & Tooling
| Acción | Detalle |
|--------|---------|
| Monorepo | pnpm workspace con frontend/ + backend/ |
| Frontend init | `pnpm create next-app` App Router + TypeScript estricto |
| Tailwind + Shadcn | Tema oscuro slate-950, bordes finos, tipografía mono |
| Backend init | FastAPI con uvicorn, estructura modular |
| Dev loop | `make dev` lanza frontend (:3000) + backend (:8000) simultáneos |
| **Hardware-aware** | Sin compilación en paralelo masiva. Chromium headless shell (más ligero) |

### ✅ Fase 1 — Backend: Extracción Técnica (Playwright + FastAPI)
| Acción | Detalle |
|--------|---------|
| `pip install playwright` | Paquete Python + enlace a chromium_headless_shell-1228 |
| `services/extractor.py` | Async headless: título, meta, H1-H3, detección de tecnologías (regex sobre scripts/tags/classes), tiempos de carga simulados |
| Detección heurística | Sin tokens: WordPress, React, Vue, Shopify, Next.js, analytics, CDNs |
| Endpoint | `POST /api/extract` → URL in → diccionario Python out |
| Output limpio | Sin HTML crudo al LLM — solo datos estructurados |

### ✅ Fase 2 — Pipeline de Agentes (Modelos Pydantic + Prompts + Ollama)
| Acción | Detalle |
|--------|---------|
| `models/audit.py` | AuditReport, TechStack, SEOBreakdown, AIRecommendation (Pydantic v2) |
| `agents/pipeline.py` | Orquestación secuencial: 3 agentes vía Ollama API |
| Agente 1 (Business) | Clasifica nicho (B2B, e-commerce, SaaS, etc.) |
| Agente 2 (Technical) | Cruza DOM + velocidad vs best practices |
| Agente 3 (Solutions) | Genera roadmap de integración de IA personalizado |
| Output final | JSON que valida contra AuditReport → ready para frontend |

### ✅ Fase 3 — Frontend: Dashboard de Resultados
| Acción | Detalle |
|--------|---------|
| `AuditDashboard.tsx` | Componente principal del reporte |
| Score general | Gauge circular o barra con nota 0-100 |
| Desglose | Infraestructura, SEO Técnico, UX/UI, Potencial IA |
| Botón pérdida financiera | Cálculo: "Tu web tarda X seg → pierdes Y% conversión" |
| Plan Next-Gen | Tarjetas con recomendaciones: título, impacto (alta/media/baja), descripción |
| Llamada al backend | `POST /api/audit` → encadena extracción → agentes → dashboard |

### ✅ Fase 4 — MVP Operativo Integrado
| Acción | Detalle |
|--------|---------|
| Formulario URL | Input + botón "Auditar" con estado de carga |
| Animación scanner | Micro-interacción mientras procesa (UX premium) |
| Pipeline completo | URL → Playwright → Análisis → Agentes → Dashboard |
| Manejo de errores | URL inválida, timeout, fallo de Ollama, rate limiting |
| Prueba con sitio real | igniciodev.gumroad.com, web de cliente real |

---

## ⚙️ Configuraciones Concluidas

| Elemento | Estado | Nota |
|----------|--------|------|
| **Ollama + gemma3:4b** | ✅ Activo (CPU) | Modelo 3.3GB, contexto 4096. GPU passthrough opcional post-MVP |
| **Playwright browsers** | ✅ Instalados | chromium-1228, webkit-2311, chromium_headless_shell-1228 |
| **Playwright Python** | ❌ Pendiente | `pip install playwright` en Fase 1 |
| **pnpm** | ✅ Disponible | Node v24.16 |
| **--legacy-peer-deps** | ⚠️ Fallback | Solo si hay conflicto con Next.js + Node v24 |
| **Chromium headless shell** | 🎯 Preferido | Más ligero que chromium completo para el scraper |

---

## 📡 MCPs para explorar (búsqueda delegada en paralelo)

Un subagente está investigando MCPs útiles para:
- Extracción/análisis web (SEO, Lighthouse, Wappalyzer)
- Integración con Ollama/LLMs
- Esquemas JSON/OpenAPI
- Análisis de rendimiento

Resultados se incorporarán al plan cuando estén listos.

---

## 🚀 Siguiente paso: Fase 0

Arrancar scaffolding del monorepo: frontend (Next.js 15 + Shadcn) + backend (FastAPI) + Makefile.
