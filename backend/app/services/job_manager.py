"""Async job queue with SQLite persistence and SSE event streaming.

Each audit is a Job with lifecycle:
  queued → processing → done | error

Progress is streamed via in-memory event store for SSE subscribers.
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import sqlite3
import time
import uuid
from datetime import datetime, timezone
from typing import AsyncGenerator

from app.core import JOBS_DB_PATH

log = logging.getLogger(__name__)

# ── Schema ─────────────────────────────────────────────────────────────────
SCHEMA = """
CREATE TABLE IF NOT EXISTS jobs (
    id          TEXT PRIMARY KEY,
    type        TEXT NOT NULL DEFAULT 'audit',
    url         TEXT NOT NULL,
    model       TEXT,
    business_name TEXT DEFAULT '',
    sector      TEXT DEFAULT '',
    status      TEXT NOT NULL DEFAULT 'queued',
    progress    INTEGER NOT NULL DEFAULT 0,
    phase       TEXT DEFAULT '',
    result      TEXT DEFAULT '',
    error       TEXT DEFAULT '',
    created_at  TEXT NOT NULL,
    completed_at TEXT
);
"""


class Job:
    """Mutable job model — maps to jobs table rows."""

    __slots__ = (
        "id",
        "type",
        "url",
        "model",
        "business_name",
        "sector",
        "status",
        "progress",
        "phase",
        "result",
        "error",
        "created_at",
        "completed_at",
    )

    def __init__(self, row: dict | None = None):
        if row:
            self.id = row["id"]
            self.type = row["type"]
            self.url = row["url"]
            self.model = row["model"] or ""
            self.business_name = row.get("business_name", "")
            self.sector = row.get("sector", "")
            self.status = row["status"]
            self.progress = row["progress"] or 0
            self.phase = row["phase"] or ""
            self.result = row.get("result", "")
            self.error = row.get("error", "")
            self.created_at = row["created_at"]
            self.completed_at = row.get("completed_at")
        else:
            now = datetime.now(timezone.utc).isoformat()
            self.id = uuid.uuid4().hex[:12]
            self.type = "audit"
            self.url = ""
            self.model = ""
            self.business_name = ""
            self.sector = ""
            self.status = "queued"
            self.progress = 0
            self.phase = "En cola..."
            self.result = ""
            self.error = ""
            self.created_at = now
            self.completed_at = None

    def to_dict(self) -> dict:
        return {s: getattr(self, s) for s in self.__slots__}

    def to_json(self) -> str:
        return json.dumps(self.to_dict(), ensure_ascii=False, default=str)


# ── Database helpers ────────────────────────────────────────────────────────


def _get_db() -> sqlite3.Connection:
    os.makedirs(os.path.dirname(JOBS_DB_PATH) or ".", exist_ok=True)
    conn = sqlite3.connect(JOBS_DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA busy_timeout=5000")
    conn.executescript(SCHEMA)
    return conn


def _row_to_job(row: sqlite3.Row | None) -> Job | None:
    return Job(dict(row)) if row else None


def _run_sql(sql: str, params: tuple = ()) -> list[dict]:
    with _get_db() as db:
        cur = db.execute(sql, params)
        rows = cur.fetchall()
        if sql.strip().upper().startswith("INSERT"):
            db.commit()
        return [dict(r) for r in rows]


async def _run_sql_async(sql: str, params: tuple = ()) -> list[dict]:
    return await asyncio.to_thread(_run_sql, sql, params)


# ── Event stream (SSE) ──────────────────────────────────────────────────────


class JobEventStore:
    """In-memory event channel per job. Subscribers get progress updates."""

    def __init__(self):
        self._events: dict[str, asyncio.Event] = {}
        self._data: dict[str, str] = {}

    def publish(self, job_id: str, data: str):
        self._data[job_id] = data
        if job_id in self._events:
            self._events[job_id].set()

    async def subscribe(self, job_id: str) -> AsyncGenerator[str, None]:
        """SSE-compatible async generator. Yields events as they come."""
        # Send current state first
        if job_id in self._data:
            yield f"data: {self._data[job_id]}\n\n"

        while True:
            event = self._events.get(job_id)
            if event is None:
                event = asyncio.Event()
                self._events[job_id] = event
            await event.wait()
            event.clear()
            data = self._data.get(job_id, "")
            if data == "__DONE__":
                yield f"data: {data}\n\n"
                break
            yield f"data: {data}\n\n"

    def emit(self, job: Job):
        """Publish current job state to subscribers."""
        self.publish(job.id, job.to_json())
        if job.status in ("done", "error"):
            self.publish(job.id, "__DONE__")


# Singleton
event_store = JobEventStore()


# ── JobManager ──────────────────────────────────────────────────────────────


class JobManager:
    """Audit job queue with SQLite persistence."""

    def __init__(self):
        self._queue: asyncio.Queue[str] = asyncio.Queue()
        self._processing = False
        self._worker_task: asyncio.Task | None = None

    # ── CRUD ───────────────────────────────────────────────────────────

    async def enqueue(self, url: str, model: str | None = None, type: str = "audit") -> Job:
        """Create and queue a new job."""
        job = Job()
        job.url = url
        job.model = model or ""
        job.type = type
        job.status = "queued"
        job.phase = "En cola..."

        await _run_sql_async(
            "INSERT INTO jobs (id, type, url, model, status, progress, phase, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (job.id, job.type, job.url, job.model, job.status, job.progress, job.phase, job.created_at),
        )
        await self._queue.put(job.id)
        log.info("Job %s queued: %s", job.id, url)
        return job

    async def get_job(self, job_id: str) -> Job | None:
        rows = await _run_sql_async("SELECT * FROM jobs WHERE id = ?", (job_id,))
        return Job(rows[0]) if rows else None

    async def list_jobs(self, limit: int = 50, offset: int = 0) -> list[Job]:
        rows = await _run_sql_async(
            "SELECT * FROM jobs ORDER BY created_at DESC LIMIT ? OFFSET ?", (limit, offset)
        )
        return [Job(r) for r in rows]

    async def update_job(self, job: Job):
        """Persist job state and emit SSE event."""
        await _run_sql_async(
            """UPDATE jobs SET status=?, progress=?, phase=?, result=?, error=?, completed_at=?
               WHERE id=?""",
            (job.status, job.progress, job.phase, job.result, job.error, job.completed_at, job.id),
        )
        event_store.emit(job)

    async def delete_job(self, job_id: str):
        await _run_sql_async("DELETE FROM jobs WHERE id = ?", (job_id,))

    # ── Worker ─────────────────────────────────────────────────────────

    async def start_worker(self, process_fn):
        """Start the background worker loop.

        Args:
            process_fn: async callable(job, update_callback) — processes a job
                        and calls update_callback(job) to persist progress.
        """
        if self._processing:
            return
        self._processing = True
        self._worker_task = asyncio.create_task(self._worker_loop(process_fn))
        log.info("Job worker started")

    async def _worker_loop(self, process_fn):
        while self._processing:
            try:
                job_id = await asyncio.wait_for(self._queue.get(), timeout=5)
            except asyncio.TimeoutError:
                continue

            job = await self.get_job(job_id)
            if not job:
                continue

            async def update(j: Job):
                await self.update_job(j)

            try:
                log.info("Processing job %s: %s", job.id, job.url)
                await process_fn(job, update)
                job.status = "done"
                job.progress = 100
                job.completed_at = datetime.now(timezone.utc).isoformat()
            except Exception as e:
                log.error("Job %s failed: %s", job.id, e)
                job.status = "error"
                job.error = str(e)
                job.completed_at = datetime.now(timezone.utc).isoformat()

            await self.update_job(job)
            self._queue.task_done()

    async def stop_worker(self):
        self._processing = False
        if self._worker_task:
            self._worker_task.cancel()
            try:
                await self._worker_task
            except asyncio.CancelledError:
                pass


# Singleton
job_manager = JobManager()
