"""
Thin wrapper around a persistent ChromaDB collection.

We provide embeddings ourselves via `embeddings.py`, so we explicitly
do NOT use Chroma's built-in embedding function.
"""
from __future__ import annotations

import logging
import uuid
from dataclasses import dataclass, field
from typing import List, Optional

import chromadb
from chromadb.config import Settings as ChromaSettings

from app.config import settings
from app.services.embeddings import get_embedder

logger = logging.getLogger(__name__)


@dataclass
class Chunk:
    """A piece of text ready for indexing, with its metadata."""
    text: str
    metadata: dict = field(default_factory=dict)  # person_id, doc_id, filename, page, chunk_index
    chunk_id: Optional[str] = None  # auto-generated if None


@dataclass
class SearchResult:
    """One retrieved chunk + its similarity distance (smaller = closer)."""
    text: str
    metadata: dict
    distance: float


class VectorStore:
    """Persistent ChromaDB collection scoped per-person via metadata filters."""

    def __init__(self, persist_dir: str, collection_name: str):
        self._client = chromadb.PersistentClient(
            path=persist_dir,
            settings=ChromaSettings(anonymized_telemetry=False),
        )
        # hnsw:space=cosine -> distance in [0, 2]; smaller is more similar.
        self._collection = self._client.get_or_create_collection(
            name=collection_name,
            metadata={"hnsw:space": "cosine"},
        )
        self._embedder = get_embedder()
        logger.info(
            "VectorStore ready: dir=%s collection=%s existing_count=%d",
            persist_dir, collection_name, self._collection.count(),
        )

    # ---- Writes ----
    def add_chunks(self, chunks: List[Chunk]) -> List[str]:
        """Embed + persist a batch of chunks. Returns the IDs that were stored."""
        if not chunks:
            return []
        ids = [c.chunk_id or str(uuid.uuid4()) for c in chunks]
        texts = [c.text for c in chunks]
        metadatas = [c.metadata for c in chunks]
        embeddings = self._embedder.embed(texts)

        self._collection.add(
            ids=ids,
            embeddings=embeddings,
            documents=texts,
            metadatas=metadatas,
        )
        logger.info("Indexed %d chunks", len(ids))
        return ids

    # ---- Reads ----
    def similarity_search(
        self,
        query: str,
        top_k: int = 4,
        person_id: Optional[str] = None,
    ) -> List[SearchResult]:
        """Top-k similar chunks. If person_id given, only that user's chunks."""
        query_emb = self._embedder.embed_one(query)
        where = {"person_id": person_id} if person_id else None

        raw = self._collection.query(
            query_embeddings=[query_emb],
            n_results=top_k,
            where=where,
        )
        docs = (raw.get("documents") or [[]])[0]
        metas = (raw.get("metadatas") or [[]])[0]
        dists = (raw.get("distances") or [[]])[0]

        return [
            SearchResult(text=d or "", metadata=m or {}, distance=float(dist))
            for d, m, dist in zip(docs, metas, dists)
        ]

    # ---- Deletes ----
    def delete_document(self, doc_id: str, person_id: str) -> int:
        """Remove all chunks of a single document (scoped to the owning user)."""
        matches = self._collection.get(
            where={"$and": [{"doc_id": doc_id}, {"person_id": person_id}]}
        )
        ids = matches.get("ids") or []
        if ids:
            self._collection.delete(ids=ids)
        logger.info("Deleted %d chunks for doc=%s person=%s", len(ids), doc_id, person_id)
        return len(ids)


# ---- Singleton accessor ----
_store: VectorStore | None = None


def get_vector_store() -> VectorStore:
    """Lazy singleton; first call constructs the client and loads embeddings."""
    global _store
    if _store is None:
        _store = VectorStore(
            persist_dir=settings.chroma_persist_dir,
            collection_name=settings.chroma_collection,
        )
    return _store
