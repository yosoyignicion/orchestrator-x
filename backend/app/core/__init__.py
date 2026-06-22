# Core config — loaded from env / .env with fallbacks
import os

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
LLM_MODEL = os.getenv("LLM_MODEL", "gemma3:4b")
EXTRACT_TIMEOUT_MS = int(os.getenv("EXTRACT_TIMEOUT_MS", "30000"))
