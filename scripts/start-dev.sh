#!/bin/bash
# Orchestrator-X Dev Launcher
# Arranca backend + frontend y abre el navegador

PROJECT_DIR="/home/ignicion/hermes-desktop/workspace/workflow/web-project/Orchestrator-X"
cd "$PROJECT_DIR" || { echo "❌ Error: no encuentra el proyecto"; exit 1; }

echo "🔥 Orchestrator-X — Arrancando..."
echo "   Backend  → http://localhost:8000"
echo "   Frontend → http://localhost:3000"
echo "   Navegador se abrirá automáticamente en unos segundos"
echo "   ─────────────────────────────────────────"
echo ""

# Abre el navegador después de 12s (compilación inicial Next.js)
(
  sleep 12
  URL="http://localhost:3000"
  if command -v firefox &>/dev/null; then
    firefox "$URL" &
  elif command -v xdg-open &>/dev/null; then
    xdg-open "$URL"
  elif command -v sensible-browser &>/dev/null; then
    sensible-browser "$URL"
  else
    echo "⚠️  No se pudo abrir el navegador. Abre manualmente: $URL"
  fi
) &

make dev
