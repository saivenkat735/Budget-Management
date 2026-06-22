"""
Async SQLAlchemy engine + session, backed by SQLite (aiosqlite driver).

Replaces Supabase for chat history + document metadata. The whole
schema is created on app startup via init_db().
"""
from __future__ import annotations

import logging
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.config import settings

logger = logging.getLogger(__name__)


class Base(DeclarativeBase):
    """Declarative base for all ORM models."""


_engine = create_async_engine(settings.sqlite_url, echo=False, future=True)
_SessionLocal = async_sessionmaker(
    _engine, expire_on_commit=False, class_=AsyncSession
)


async def init_db() -> None:
    """Create tables once on startup. Imports models for side effects."""
    # Import models so they are registered on Base.metadata before create_all.
    from app.models import db_models  # noqa: F401

    async with _engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("SQLite schema ready (url=%s)", settings.sqlite_url)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency that yields one session per request and commits."""
    async with _SessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
