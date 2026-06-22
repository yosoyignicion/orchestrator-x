from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.extract import router as extract_router
from app.api.audit import router as audit_router

app = FastAPI(
    title="Orchestrator-X API",
    version="0.1.0",
    description="Backend de extracción técnica y pipeline de agentes IA",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(extract_router)
app.include_router(audit_router)


@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "0.1.0"}
