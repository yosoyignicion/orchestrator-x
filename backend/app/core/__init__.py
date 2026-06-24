"""Core config — loaded from env / .env with fallbacks.

Now detects both Ollama and LM Studio providers.
"""
import os

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
LM_STUDIO_URL = os.getenv("LM_STUDIO_URL", "http://localhost:1234/v1")
LLM_MODEL = os.getenv("LLM_MODEL", "gemma3:4b")
EXTRACT_TIMEOUT_MS = int(os.getenv("EXTRACT_TIMEOUT_MS", "30000"))
JOBS_DB_PATH = os.getenv("JOBS_DB_PATH", "data/jobs.db")
