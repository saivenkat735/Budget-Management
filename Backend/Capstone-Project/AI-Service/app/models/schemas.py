"""Pydantic request/response schemas for the HTTP API."""
from __future__ import annotations

from datetime import datetime
from typing import Any, List, Optional

from pydantic import BaseModel, ConfigDict, Field


# ----- Knowledge base -----
class IngestResponse(BaseModel):
    doc_id: str
    filename: str
    chunk_count: int
    status: str


class DocumentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    filename: str
    chunk_count: int
    size_bytes: int
    status: str
    error: Optional[str] = None
    created_at: datetime


# ----- Chat -----
class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=4000)
    session_id: Optional[str] = Field(
        default=None,
        description="Conversation grouping key. If omitted, a new one is generated.",
    )


class SourceCitation(BaseModel):
    filename: str
    page: int
    snippet: str
    distance: float


class ToolCallTrace(BaseModel):
    name: str
    arguments: dict
    result_preview: str


class ChatResponse(BaseModel):
    session_id: str
    answer: str
    sources: List[SourceCitation] = []
    tools_used: List[ToolCallTrace] = []


class ChatHistoryItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    session_id: str
    role: str
    content: str
    tools_used: Optional[List[Any]] = None
    sources: Optional[List[Any]] = None
    created_at: datetime
