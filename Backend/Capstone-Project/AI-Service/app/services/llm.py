"""
OpenAI-compatible chat client.

Defaults to Ollama (http://localhost:11434/v1, model=llama3.1) for free,
local inference with tool-calling support. Swap to real OpenAI by setting
LLM_PROVIDER=openai + LLM_API_KEY + LLM_BASE_URL=https://api.openai.com/v1.
"""
from __future__ import annotations

import logging

from openai import AsyncOpenAI

from app.config import settings

logger = logging.getLogger(__name__)

_client: AsyncOpenAI | None = None


def get_llm_client() -> AsyncOpenAI:
    """Lazy singleton for the OpenAI-compatible async client."""
    global _client
    if _client is None:
        _client = AsyncOpenAI(
            api_key=settings.llm_api_key,  # Ollama accepts any string
            base_url=settings.llm_base_url,
        )
        logger.info(
            "LLM client ready: provider=%s base_url=%s model=%s",
            settings.llm_provider,
            settings.llm_base_url,
            settings.llm_model,
        )
    return _client
