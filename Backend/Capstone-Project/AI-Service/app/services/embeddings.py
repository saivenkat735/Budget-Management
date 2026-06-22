"""
Embedding providers.

Default: `sentence-transformers/all-MiniLM-L6-v2` (free, runs locally on CPU,
384-dim vectors, ~80MB model on first download).

Swap to OpenAI by setting EMBEDDING_PROVIDER=openai in .env.
"""
from __future__ import annotations

import logging
from typing import List, Protocol

from app.config import settings

logger = logging.getLogger(__name__)


class Embedder(Protocol):
    """Anything that turns text into vectors."""

    def embed(self, texts: List[str]) -> List[List[float]]: ...
    def embed_one(self, text: str) -> List[float]: ...
    @property
    def dimension(self) -> int: ...


class SentenceTransformerEmbedder:
    """Local, free embeddings via sentence-transformers."""

    def __init__(self, model_name: str):
        # Lazy import so the heavy torch/transformers stack is only loaded
        # when this provider is actually requested.
        from sentence_transformers import SentenceTransformer

        logger.info("Loading sentence-transformer model '%s' (first run downloads ~80MB)", model_name)
        self._model = SentenceTransformer(model_name)
        self._dim = int(self._model.get_sentence_embedding_dimension() or 384)
        logger.info("Embedding model ready (dim=%d)", self._dim)

    def embed(self, texts: List[str]) -> List[List[float]]:
        if not texts:
            return []
        vectors = self._model.encode(
            texts,
            convert_to_numpy=True,
            show_progress_bar=False,
            normalize_embeddings=True,  # makes cosine similarity well-behaved
        )
        return [v.tolist() for v in vectors]

    def embed_one(self, text: str) -> List[float]:
        return self.embed([text])[0]

    @property
    def dimension(self) -> int:
        return self._dim


class OpenAIEmbedder:
    """OpenAI embeddings (e.g. text-embedding-3-small, 1536 dims)."""

    def __init__(self, model_name: str, api_key: str, base_url: str | None = None):
        from openai import OpenAI

        self._client = OpenAI(api_key=api_key, base_url=base_url)
        self._model_name = model_name
        # Common dimensions; small=1536, large=3072
        self._dim = 1536 if "small" in model_name else 3072

    def embed(self, texts: List[str]) -> List[List[float]]:
        if not texts:
            return []
        resp = self._client.embeddings.create(model=self._model_name, input=texts)
        return [d.embedding for d in resp.data]

    def embed_one(self, text: str) -> List[float]:
        return self.embed([text])[0]

    @property
    def dimension(self) -> int:
        return self._dim


_embedder: Embedder | None = None


def get_embedder() -> Embedder:
    """Singleton accessor for the configured embedder."""
    global _embedder
    if _embedder is None:
        provider = settings.embedding_provider.lower()
        if provider == "openai":
            _embedder = OpenAIEmbedder(
                model_name=settings.embedding_model,
                api_key=settings.llm_api_key,
                # None -> use OpenAI's default embeddings host (NOT Ollama)
                base_url=None,
            )
        else:
            _embedder = SentenceTransformerEmbedder(model_name=settings.embedding_model)
    return _embedder
