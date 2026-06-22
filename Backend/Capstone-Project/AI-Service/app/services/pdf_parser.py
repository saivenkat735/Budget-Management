"""
PDF parsing + recursive character chunking.

We deliberately avoid LangChain here (it pulls a lot of transitive deps);
this is a small, self-contained implementation matching its standard splitter.
"""
from __future__ import annotations

import io
import logging
from typing import List, Tuple

from pypdf import PdfReader

from app.config import settings
from app.services.vector_store import Chunk

logger = logging.getLogger(__name__)


def extract_pages(pdf_bytes: bytes) -> List[Tuple[int, str]]:
    """Extract text per page from a PDF. Returns [(page_no_1based, text), ...]."""
    reader = PdfReader(io.BytesIO(pdf_bytes))
    pages: List[Tuple[int, str]] = []
    for i, page in enumerate(reader.pages, start=1):
        try:
            text = page.extract_text() or ""
        except Exception as exc:  # noqa: BLE001
            logger.warning("Failed to extract page %d: %s", i, exc)
            text = ""
        text = text.strip()
        if text:
            pages.append((i, text))
    return pages


def _split_text(
    text: str,
    chunk_size: int,
    chunk_overlap: int,
    separators: Tuple[str, ...] = ("\n\n", "\n", ". ", " ", ""),
) -> List[str]:
    """Recursive character splitter (a la LangChain) with no external dep.

    Tries the first separator; if a piece is still too big, recurses with
    a finer separator. Falls back to a hard slice when separators run out.
    """
    text = text.strip()
    if not text:
        return []
    if len(text) <= chunk_size:
        return [text]

    sep = separators[0]
    rest = separators[1:]

    # Hard-slice fallback (last resort)
    if sep == "":
        step = max(1, chunk_size - chunk_overlap)
        return [text[i: i + chunk_size] for i in range(0, len(text), step)]

    parts = text.split(sep)
    chunks: List[str] = []
    buffer = ""

    for part in parts:
        candidate = f"{buffer}{sep}{part}" if buffer else part
        if len(candidate) <= chunk_size:
            buffer = candidate
            continue

        if buffer:
            chunks.append(buffer)
            buffer = ""

        if len(part) > chunk_size:
            # Recurse with finer separators
            chunks.extend(_split_text(part, chunk_size, chunk_overlap, rest))
        else:
            buffer = part

    if buffer:
        chunks.append(buffer)

    # Stitch overlap from the tail of the previous chunk
    if chunk_overlap > 0 and len(chunks) > 1:
        overlapped = [chunks[0]]
        for i in range(1, len(chunks)):
            prev = overlapped[-1]
            tail = prev[-chunk_overlap:] if len(prev) > chunk_overlap else prev
            overlapped.append(f"{tail} {chunks[i]}".strip())
        chunks = overlapped

    return [c.strip() for c in chunks if c.strip()]


def chunk_pdf(
    pdf_bytes: bytes,
    *,
    person_id: str,
    doc_id: str,
    filename: str,
    chunk_size: int | None = None,
    chunk_overlap: int | None = None,
) -> List[Chunk]:
    """High-level helper: PDF bytes -> indexable Chunks with metadata."""
    cs = chunk_size or settings.chunk_size
    co = chunk_overlap or settings.chunk_overlap

    chunks: List[Chunk] = []
    global_index = 0
    for page_num, page_text in extract_pages(pdf_bytes):
        for piece in _split_text(page_text, cs, co):
            chunks.append(
                Chunk(
                    text=piece,
                    metadata={
                        "person_id": person_id,
                        "doc_id": doc_id,
                        "filename": filename,
                        "page": page_num,
                        "chunk_index": global_index,
                    },
                )
            )
            global_index += 1

    logger.info(
        "Chunked PDF '%s' for person=%s: %d chunks", filename, person_id, len(chunks),
    )
    return chunks
