"""
Chat endpoints (the heart of the AI service).

POST /ai/chat            -> ask a question; runs Static RAG + Dynamic RAG (tool calling)
GET  /ai/chat/history    -> retrieve past turns (optionally filtered by session_id)

The orchestration:
  1. Static RAG  -> embed question, similarity-search the user's PDF chunks
  2. Build messages -> system prompt + retrieved context + chat history + question
  3. Dynamic RAG -> call LLM with tool schemas; loop tool-calls; collect final answer
  4. Persist user + assistant turns to SQLite
"""
from __future__ import annotations

import json
import logging
import uuid
from typing import Annotated, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.auth import CurrentUserDep
from app.models.db_models import ChatMessage
from app.models.schemas import (
    ChatHistoryItem,
    ChatRequest,
    ChatResponse,
    SourceCitation,
    ToolCallTrace,
)
from app.services.backend_client import BackendClient
from app.services.database import get_session
from app.services.llm import get_llm_client
from app.services.tools import TOOL_SCHEMAS, execute_tool
from app.services.vector_store import SearchResult, get_vector_store

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ai", tags=["chat"])

SYSTEM_PROMPT = """You are BudgetWise AI, a personal finance copilot.

You help the user understand their own spending, budget, bills, accounts,
and transactions. You also reference their uploaded financial documents (PDFs).

Rules:
- ALWAYS prefer calling a tool to look up the user's LIVE data before guessing.
- For general financial-literacy questions (definitions, advice patterns,
  comparing instruments), prefer the supplied document context.
- Be concise, factual, and use the rupee symbol (Rs.) when quoting amounts.
- If a tool returns an error or empty data, tell the user honestly and
  suggest what to do next (e.g. add an account, upload a statement).
- Never fabricate numbers. If unsure, say so.
"""

MAX_TOOL_ITERATIONS = 4
MAX_HISTORY_TURNS = 10


def _build_context_block(results: List[SearchResult]) -> tuple[str, List[SourceCitation]]:
    """Format retrieved chunks into a single system message + structured citations."""
    if not results:
        return "", []
    lines = ["Relevant excerpts from the user's uploaded documents:"]
    sources: List[SourceCitation] = []
    for i, r in enumerate(results, start=1):
        meta = r.metadata or {}
        fname = str(meta.get("filename", "document"))
        page = int(meta.get("page", 0))
        lines.append(f"[{i}] ({fname}, page {page}): {r.text}")
        sources.append(
            SourceCitation(
                filename=fname,
                page=page,
                snippet=r.text[:240] + ("..." if len(r.text) > 240 else ""),
                distance=r.distance,
            )
        )
    return "\n".join(lines), sources


async def _load_recent_history(
    session: AsyncSession,
    person_id: str,
    session_id: str,
    limit: int = MAX_HISTORY_TURNS,
) -> List[dict]:
    """Return the last N turns of this session in OpenAI message format."""
    stmt = (
        select(ChatMessage)
        .where(
            ChatMessage.person_id == person_id,
            ChatMessage.session_id == session_id,
        )
        .order_by(ChatMessage.created_at.desc())
        .limit(limit)
    )
    rows = (await session.execute(stmt)).scalars().all()
    rows = list(reversed(rows))
    return [{"role": r.role, "content": r.content} for r in rows]


@router.post(
    "/chat",
    response_model=ChatResponse,
    summary="Ask BudgetWise AI a question (Static RAG + Dynamic RAG via tool calling)",
)
async def chat(
    payload: ChatRequest,
    user: CurrentUserDep,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> ChatResponse:
    session_id = payload.session_id or str(uuid.uuid4())

    # 1. Static RAG ---------------------------------------------------------
    store = get_vector_store()
    try:
        retrieved = store.similarity_search(
            query=payload.question,
            top_k=settings.top_k_results,
            person_id=user.person_id,
        )
    except Exception as exc:  # noqa: BLE001
        logger.warning("Vector search failed: %s", exc)
        retrieved = []
    context_block, sources = _build_context_block(retrieved)

    # 2. Build the messages -------------------------------------------------
    history = await _load_recent_history(session, user.person_id, session_id)
    messages: List[dict] = [{"role": "system", "content": SYSTEM_PROMPT}]
    if context_block:
        messages.append({"role": "system", "content": context_block})
    messages.extend(history)
    messages.append({"role": "user", "content": payload.question})

    # 3. Dynamic RAG (tool-calling loop) -----------------------------------
    client = get_llm_client()
    backend = BackendClient(jwt=user.raw_token)
    tools_used: List[ToolCallTrace] = []
    final_answer: str = ""

    for iteration in range(MAX_TOOL_ITERATIONS):
        try:
            completion = await client.chat.completions.create(
                model=settings.llm_model,
                messages=messages,
                tools=TOOL_SCHEMAS,
                tool_choice="auto",
                temperature=0.2,
            )
        except Exception as exc:  # noqa: BLE001
            logger.exception("LLM call failed")
            raise HTTPException(
                status_code=502,
                detail=(
                    f"LLM provider error ({settings.llm_provider} @ "
                    f"{settings.llm_base_url}): {exc}"
                ),
            )

        msg = completion.choices[0].message
        tool_calls = getattr(msg, "tool_calls", None) or []

        if not tool_calls:
            final_answer = (msg.content or "").strip()
            break

        # Echo back the assistant turn that requested the tools (REQUIRED order)
        messages.append(
            {
                "role": "assistant",
                "content": msg.content or "",
                "tool_calls": [
                    {
                        "id": tc.id,
                        "type": "function",
                        "function": {
                            "name": tc.function.name,
                            "arguments": tc.function.arguments,
                        },
                    }
                    for tc in tool_calls
                ],
            }
        )

        # Execute each requested tool and append its reply
        for tc in tool_calls:
            name = tc.function.name
            try:
                args = json.loads(tc.function.arguments or "{}")
            except json.JSONDecodeError:
                args = {}

            result_json = await execute_tool(name, args, backend, user.person_id)
            tools_used.append(
                ToolCallTrace(
                    name=name,
                    arguments=args,
                    result_preview=(
                        result_json[:300] + ("..." if len(result_json) > 300 else "")
                    ),
                )
            )
            messages.append(
                {
                    "role": "tool",
                    "tool_call_id": tc.id,
                    "name": name,
                    "content": result_json,
                }
            )
    else:
        # Reached the iteration cap without breaking
        final_answer = (
            "I checked your data but couldn't reach a confident answer in time. "
            "Please rephrase or narrow your question."
        )

    if not final_answer:
        final_answer = "I'm not sure how to answer that. Could you rephrase?"

    # 4. Persist both turns ------------------------------------------------
    session.add(
        ChatMessage(
            person_id=user.person_id,
            session_id=session_id,
            role="user",
            content=payload.question,
        )
    )
    session.add(
        ChatMessage(
            person_id=user.person_id,
            session_id=session_id,
            role="assistant",
            content=final_answer,
            tools_used=[t.model_dump() for t in tools_used] or None,
            sources=[s.model_dump() for s in sources] or None,
        )
    )

    return ChatResponse(
        session_id=session_id,
        answer=final_answer,
        sources=sources,
        tools_used=tools_used,
    )


@router.get(
    "/chat/history",
    response_model=List[ChatHistoryItem],
    summary="Chat history for the current user (optionally filtered by session_id)",
)
async def chat_history(
    user: CurrentUserDep,
    session: Annotated[AsyncSession, Depends(get_session)],
    session_id: Optional[str] = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
) -> List[ChatHistoryItem]:
    stmt = select(ChatMessage).where(ChatMessage.person_id == user.person_id)
    if session_id:
        stmt = stmt.where(ChatMessage.session_id == session_id)
    stmt = stmt.order_by(ChatMessage.created_at.desc()).limit(limit)

    rows = (await session.execute(stmt)).scalars().all()
    rows = list(reversed(rows))
    return [ChatHistoryItem.model_validate(r) for r in rows]
