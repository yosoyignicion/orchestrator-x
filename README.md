<h1 align="center">Orchestrator-X</h1>

<p align="center">
  <b>SaaS de auditoría web con IA</b><br>
  <i>Extracción headless · Pipeline LLM · Dashboard premium</i>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15-000?style=flat-square&logo=next.js" alt="Next.js 15"/>
  <img src="https://img.shields.io/badge/FastAPI-Python-009688?style=flat-square&logo=fastapi" alt="FastAPI"/>
  <img src="https://img.shields.io/badge/Ollama-Gemma-000?style=flat-square&logo=mlflow" alt="Ollama"/>
  <img src="https://img.shields.io/badge/Playwright-Testing-45ba4b?style=flat-square&logo=playwright" alt="Playwright"/>
  <img src="https://img.shields.io/badge/GPU-Vulkan_RX_580-e11d48?style=flat-square&logo=vulkan" alt="Vulkan"/>
</p>

---

## ¿Qué es?

Orchestrator-X analiza cualquier web, detecta su stack tecnológico, mide su madurez digital y genera un plan de acción automatizado con IA local — sin depender de APIs externas ni enviar datos a terceros.

**Pipeline completo en ~35 segundos** (con GPU Vulkan en RX 580).

## Stack

| Capa | Tecnología | Propósito |
|------|-----------|-----------|
| **Frontend** | Next.js 15 + Tailwind v4 + Shadcn/ui | Dashboard oscuro premium |
| **Backend** | FastAPI + Playwright | Extracción headless, API REST |
| **IA** | Ollama + Gemma 3 4B (Vulkan GPU) | Análisis y recomendaciones |
| **Infra** | Local-first · RX 580 8GB VRAM | Sin dependencias cloud |

## Endpoints

| Ruta | Método | Descripción |
|------|--------|-------------|
| `/api/health` | GET | Health check (backend + playwright + ollama) |
| `/api/extract` | POST | Extracción técnica de una URL (0 tokens LLM) |
| `/api/audit` | POST | Pipeline completo: extracción + análisis IA + dashboard |

## Arranque rápido

```bash
# 1. Instalar dependencias
make install

# 2. Arrancar servidores (requiere Ollama con gemma3:4b cargado)
make dev
```

## Requisitos

- Python ≥ 3.12
- Node.js ≥ 20
- pnpm
- Ollama con `gemma3:4b` instalado
- Playwright browsers: `playwright install chromium`
- GPU Vulkan (opcional, acelera ~8x la inferencia)

## Licencia

MIT
