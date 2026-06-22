"""
FastAPI entrypoint for the BudgetWise AI microservice.

All endpoints live under the `/ai` prefix so the Spring Cloud Gateway
can route the whole service with a single `/ai/**` rule.
"""
from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import chat, documents, health
from app.services.database import init_db

logger = logging.getLogger("budgetwise.ai")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown hooks."""
    # Ensure local data directories exist (ChromaDB + SQLite live here)
    os.makedirs(settings.chroma_persist_dir, exist_ok=True)
    sqlite_path = settings.sqlite_url.split("///")[-1]
    if sqlite_path and sqlite_path != ":memory:":
        os.makedirs(os.path.dirname(sqlite_path) or ".", exist_ok=True)

    # Create SQLite tables (kb_documents, chat_messages) if they don't exist
    await init_db()

    logger.info("Starting %s v%s on port %d", settings.app_name, settings.app_version, settings.app_port)
    logger.info("LLM provider=%s model=%s base_url=%s", settings.llm_provider, settings.llm_model, settings.llm_base_url)
    logger.info("Embedding provider=%s model=%s", settings.embedding_provider, settings.embedding_model)
    logger.info("Chroma dir=%s collection=%s", settings.chroma_persist_dir, settings.chroma_collection)

    yield

    logger.info("Shutting down %s", settings.app_name)


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description=(
        "AI microservice for BudgetWise. Provides RAG-powered chat over the "
        "user's financial data (Dynamic RAG via LLM tool calling) and uploaded "
        "PDFs (Static RAG via ChromaDB)."
    ),
    lifespan=lifespan,
)

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Routers (all mounted under /ai so the gateway routes /ai/** here) ---
app.include_router(health.router, prefix="/ai", tags=["health"])
app.include_router(documents.router)  # already declares prefix="/ai"
app.include_router(chat.router)       # already declares prefix="/ai"
