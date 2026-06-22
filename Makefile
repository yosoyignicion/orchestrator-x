.PHONY: dev backend-dev install clean

# ─── Dev loop ────────────────────────────────────────────────
dev: frontend-dev backend-dev

frontend-dev:
	cd frontend && pnpm dev

backend-dev:
	cd backend && uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# ─── Install ─────────────────────────────────────────────────
install:
	cd frontend && pnpm install
	cd backend && uv sync

# ─── Clean ───────────────────────────────────────────────────
clean:
	rm -rf frontend/.next frontend/node_modules
	rm -rf backend/.venv
