<p align="center">
  <img src="https://img.shields.io/badge/ORCHESTRATOR--X-ED2100?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48cG9seWdvbiBwb2ludHM9IjIwLDQgMzYsMzYgNCwzNiIgZmlsbD0iI0VEMjEwMCIvPjwvc3ZnPg==" alt="Orchestrator-X"/>
</p>

<h1 align="center" style="color:#ED2100; font-weight:800; letter-spacing:-1px; font-size:2.5rem;">
  ORCHESTRATOR-X
</h1>

<p align="center">
  <b style="color:#050505;">SaaS de auditoría web con IA</b><br>
  <span style="color:#666;">Extracción headless · Pipeline LLM · Dashboard premium · 100% local</span>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15-050505?style=flat-square&logo=next.js&logoColor=white" alt="Next.js 15"/>
  <img src="https://img.shields.io/badge/FastAPI-Python-ED2100?style=flat-square&logo=fastapi&logoColor=white" alt="FastAPI"/>
  <img src="https://img.shields.io/badge/Ollama-Gemma-050505?style=flat-square&logo=mlflow&logoColor=white" alt="Ollama"/>
  <img src="https://img.shields.io/badge/Playwright-Testing-e5e5e5?style=flat-square&logo=playwright&logoColor=white" alt="Playwright"/>
  <img src="https://img.shields.io/badge/Vulkan-RX_580-ED2100?style=flat-square&logo=vulkan&logoColor=white" alt="Vulkan"/>
  <img src="https://img.shields.io/badge/license-MIT-050505?style=flat-square" alt="MIT"/>
</p>

---

## 🔥 ¿Qué es?

Orchestrator-X analiza cualquier web, detecta su stack tecnológico, mide su madurez digital y genera recomendaciones automatizadas con **IA local** — sin depender de APIs externas, sin enviar datos a terceros, sin costes recurrentes.

**Pipeline completo en ~35 segundos** con aceleración GPU Vulkan (RX 580).

## 📊 Endpoints

| Ruta | Método | Descripción |
|------|--------|-------------|
| `/api/health` | `GET` | Health check del sistema (backend + playwright + ollama) |
| `/api/extract` | `POST` | Extracción técnica de una URL (0 tokens LLM) |
| `/api/audit` | `POST` | Pipeline completo: extracción → análisis IA → dashboard |

## 🛠️ Stack

| Capa | Tecnología |
|------|-----------|
| **Frontend** | Next.js 15 + Tailwind v4 + Shadcn/ui — tema oscuro slate-950 premium |
| **Backend** | FastAPI + Playwright + Python 3.12 |
| **IA** | Ollama + Gemma 3 4B (Vulkan GPU) — 100% local, 0 llamadas externas |
| **Infra** | Local-first · RX 580 8GB VRAM · Linux Mint |

## 🚀 Arranque rápido

```bash
# 1. Cargar modelo local
ollama run gemma3:4b

# 2. Instalar dependencias
make install

# 3. Arrancar (backend :8000 + frontend :3000)
make dev

# 4. Probar
curl http://localhost:8000/api/health
```

## 📋 Requisitos

| Requisito | Versión / Detalle |
|-----------|------------------|
| Python | ≥ 3.12 |
| Node.js | ≥ 20 |
| pnpm | Última estable |
| Ollama | Con `gemma3:4b` instalado |
| Playwright | `playwright install chromium` |
| GPU (opcional) | Vulkan — acelera inferencia ~8x |

## 📄 Licencia

MIT © 2026 Ignacio Badenes · [Ignición Dev](https://github.com/yosoyignicion)
