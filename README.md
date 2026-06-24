<p align="center">
  <img src="https://img.shields.io/badge/ORCHESTRATOR--X-ED2100?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48cG9seWdvbiBwb2ludHM9IjIwLDQgMzYsMzYgNCwzNiIgZmlsbD0iI0VEMjEwMCIvPjwvc3ZnPg==" alt="Orchestrator-X"/>
</p>

<h1 align="center" style="color:#ED2100; font-weight:800; letter-spacing:-1px; font-size:2.5rem;">
  ORCHESTRATOR-X
</h1>

<p align="center">
  <b style="color:#050505;">Auditoría de arquitectura web con IA local</b><br>
  <span style="color:#666;">Extracción headless · Pipeline LLM híbrido · Cola de trabajos · Dashboard premium · 100% local</span>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-050505?style=flat-square&logo=next.js&logoColor=white" alt="Next.js 16"/>
  <img src="https://img.shields.io/badge/FastAPI-Python-ED2100?style=flat-square&logo=fastapi&logoColor=white" alt="FastAPI"/>
  <img src="https://img.shields.io/badge/Ollama-LLM-050505?style=flat-square&logo=mlflow&logoColor=white" alt="Ollama"/>
  <img src="https://img.shields.io/badge/LM_Studio-OpenAI-ED2100?style=flat-square&logo=openai&logoColor=white" alt="LM Studio"/>
  <img src="https://img.shields.io/badge/Playwright-Testing-e5e5e5?style=flat-square&logo=playwright&logoColor=white" alt="Playwright"/>
  <img src="https://img.shields.io/badge/Vulkan-RX_580-ED2100?style=flat-square&logo=vulkan&logoColor=white" alt="Vulkan"/>
  <img src="https://img.shields.io/badge/license-MIT-050505?style=flat-square" alt="MIT"/>
</p>

---

## 🔥 ¿Qué es?

**Orchestrator-X** analiza cualquier web, detecta su stack tecnológico, mide su madurez digital y genera un reporte dual (cliente + developer) con recomendaciones automatizadas vía **IA local** — Ollama o LM Studio, el que tengas conectado.

Sin APIs externas, sin enviar datos a terceros, sin costes recurrentes.

### Pipeline completo

```
URL → Extracción (Playwright headless, 0 tokens)
    → Análisis técnico (35+ fingerprints regex)
        → Pipeline LLM (Ollama / LM Studio auto-detectado)
            → Reporte dual guardado en historial SQLite
```

---

## ✨ Funcionalidades

| Característica | Detalle |
|---------------|---------|
| **Cola de trabajos** | Encola URLs, procesa una a una con progreso SSE en tiempo real |
| **Historial persistente** | SQLite local — todas las auditorías guardadas con búsqueda |
| **Reporte dual** | 👁️ Vista Cliente (gauges, métricas, impacto) + ⚙️ Vista Developer (stack, snippets, datos brutos) |
| **Auto-detect de IA** | Usa Ollama o LM Studio según lo que esté corriendo — sin config |
| **Extracción zero-tokens** | 35+ fingerprints regex: CMS, frameworks, CDNs, analytics |
| **Exportable** | JSON descargable desde la vista Developer |
| **100% local** | Sin datos a la nube, sin API keys, sin costes |

---

## 📊 Endpoints

| Ruta | Método | Descripción |
|------|--------|-------------|
| `/api/health` | `GET` | Health check + estado de proveedores IA |
| `/api/providers` | `GET` | Detecta Ollama y/o LM Studio disponibles |
| `/api/extract` | `POST` | Extracción técnica de una URL (0 tokens LLM) |
| `/api/audit` | `POST` | Pipeline directo (sin cola) |
| `/api/models` | `GET` | Lista modelos Ollama disponibles |
| `/api/jobs` | `POST` | Encola una nueva auditoría |
| `/api/jobs` | `GET` | Lista historial de trabajos |
| `/api/jobs/{id}` | `GET` | Detalle de un trabajo |
| `/api/jobs/{id}/stream` | `GET` | SSE — progreso en tiempo real |
| `/api/jobs/{id}` | `DELETE` | Elimina un trabajo del historial |

---

## 🖥️ Frontend — Rutas

| Ruta | Descripción |
|------|-------------|
| `/` | Dashboard principal — auditoría rápida |
| `/queue` | Cola de auditorías con progreso SSE |
| `/history` | Historial completo con buscador |
| `/audit/[id]` | Detalle del reporte (pestañas Cliente / Developer) |

---

## 🛠️ Stack

| Capa | Tecnología |
|------|-----------|
| **Frontend** | Next.js 16 + React 19 + Tailwind v4 + Shadcn/ui |
| **Backend** | FastAPI + Playwright + Python 3.12 |
| **IA** | Ollama (cualquier modelo) **o** LM Studio (OpenAI-compatible) |
| **Persistencia** | SQLite (WAL mode, async vía asyncio.to_thread) |
| **Streaming** | SSE (Server-Sent Events) — progreso real, no polling |
| **Tema** | Escarlata `#ED2100` / Negro `#050505` / Blanco — dark-only |
| **GPU** | Vulkan (RX 580) — acelera inferencia ~8x |

---

## 🚀 Arranque rápido

```bash
# 1. Instalar dependencias
make install

# 2. Asegurar que tu IA local corre
#    Opción A: ollama run gemma3:4b
#    Opción B: Abre LM Studio, carga tu modelo, inicia servidor

# 3. Arrancar (backend :8000 + frontend :3000)
make dev

# 4. Abrir navegador
#    → http://localhost:3000
```

---

## 📁 Estructura del proyecto

```
Orchestrator-X/
├── frontend/                    # Next.js 16 App Router
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx              # Dashboard
│   │   │   ├── layout.tsx            # Root layout (Geist + JetBrains Mono)
│   │   │   ├── globals.css           # Tema escarlata/negro/blanco
│   │   │   ├── queue/page.tsx        # Cola de auditorías
│   │   │   ├── history/page.tsx      # Historial
│   │   │   └── audit/[id]/page.tsx   # Reporte dual
│   │   ├── components/          # Shadcn/ui + AuditDashboard, MaturityGauge, etc.
│   │   ├── lib/api.ts           # Cliente HTTP + SSE
│   │   └── types/audit.ts       # Tipos TypeScript
│   └── package.json
├── backend/                     # FastAPI modular
│   ├── app/
│   │   ├── api/                 # audit.py, extract.py, jobs.py, models.py
│   │   ├── services/            # extractor.py, job_manager.py, provider.py
│   │   ├── agents/              # pipeline.py (híbrido Ollama/LM Studio), prompts.py
│   │   ├── agents/models/       # Pydantic: AuditReport, Job, ExtractionResult
│   │   └── main.py              # FastAPI + lifespan worker
│   └── pyproject.toml
├── Makefile                     # dev, install, clean
└── README.md
```

---

## 📋 Requisitos

| Requisito | Versión / Detalle |
|-----------|------------------|
| Python | ≥ 3.12 |
| Node.js | ≥ 20 |
| pnpm | Última estable |
| Ollama **o** LM Studio | Al menos un proveedor local con modelo cargado |
| Playwright | `uv run playwright install chromium` |
| GPU (opcional) | Vulkan — acelera inferencia ~8x |

---

## 🧠 Proveedores de IA

Orchestrator-X detecta automáticamente qué proveedor está disponible:

- **Ollama** → `http://localhost:11434` — cualquier modelo (`gemma3:4b`, `llama3.2`, etc.)
- **LM Studio** → `http://localhost:1234` — modelos OpenAI-compatible (`gemma-4-e2b`, etc.)

Si ambos están activos, prioriza Ollama. Si solo uno responde, lo usa. Si ninguno, el botón de auditar se deshabilita.

---

## 📄 Licencia

MIT © 2026 Ignacio Badenes · [Ignición Dev](https://github.com/yosoyignicion)
