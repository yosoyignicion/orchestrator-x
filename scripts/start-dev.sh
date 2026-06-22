#!/bin/bash
# Orchestrator-X Dev Launcher
# Arranca backend + frontend y abre el navegador

PROJECT_DIR="/home/ignicion/hermes-desktop/workspace/workflow/web-project/Orchestrator-X"

cd "$PROJECT_DIR" || { echo "Error: no encuentra el proyecto"; exit 1; }

echo "🔥 Orchestrator-X — Arrancando..."
echo ""

# Abre el navegador pasados 6 segundos (tiempo para que Next.js arranque)
(sleep 6 && xdg-open http://localhost:3000) &

# Arranca make dev (se queda en foreground para poder parar con Ctrl+C)
make dev
