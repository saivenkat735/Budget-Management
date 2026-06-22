"""Health / readiness endpoints."""
from __future__ import annotations

from fastapi import APIRouter

from app.config import settings

router = APIRouter()


@router.get("/health", summary="Liveness probe")
def health() -> dict:
    """Simple liveness check used by Docker HEALTHCHECK and the gateway."""
    return {
        "status": "ok",
        "service": settings.app_name,
        "version": settings.app_version,
        "llm_provider": settings.llm_provider,
        "embedding_provider": settings.embedding_provider,
    }
