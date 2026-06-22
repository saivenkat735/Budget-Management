"""
Knowledge-base endpoints (Static RAG).

POST   /ai/ingest            -> upload + chunk + embed a PDF
GET    /ai/documents         -> list the current user's docs
DELETE /ai/documents/{id}    -> remove a doc and its chunks
"""
from __future__ import annotations

import logging
import uuid
from typing import Annotated, List

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUserDep
from app.models.db_models import KbDocument
from app.models.schemas import DocumentOut, IngestResponse
from app.services.database import get_session
from app.services.pdf_parser import chunk_pdf
from app.services.vector_store import get_vector_store

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ai", tags=["knowledge-base"])

MAX_PDF_BYTES = 15 * 1024 * 1024  # 15 MB cap


@router.post(
    "/ingest",
    response_model=IngestResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a PDF; it will be chunked + embedded into the knowledge base",
)
async def ingest_pdf(
    user: CurrentUserDep,
    session: Annotated[AsyncSession, Depends(get_session)],
    file: Annotated[UploadFile, File(...)],
) -> IngestResponse:
    if file.content_type not in {"application/pdf", "application/x-pdf"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Only PDF uploads are supported (got '{file.content_type}')",
        )

    pdf_bytes = await file.read()
    if not pdf_bytes:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Empty file")
    if len(pdf_bytes) > MAX_PDF_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"PDF too large (max {MAX_PDF_BYTES // (1024 * 1024)} MB)",
        )

    doc_id = str(uuid.uuid4())
    filename = file.filename or f"upload-{doc_id}.pdf"

    # Insert metadata row first so we always have a record, even if parsing fails.
    doc = KbDocument(
        id=doc_id,
        person_id=user.person_id,
        filename=filename,
        content_type=file.content_type,
        size_bytes=len(pdf_bytes),
        status="processing",
    )
    session.add(doc)
    await session.flush()

    try:
        chunks = chunk_pdf(
            pdf_bytes,
            person_id=user.person_id,
            doc_id=doc_id,
            filename=filename,
        )
        if not chunks:
            raise ValueError("No extractable text found in PDF (is it scanned/image-only?)")

        store = get_vector_store()
        store.add_chunks(chunks)

        doc.chunk_count = len(chunks)
        doc.status = "ready"
    except Exception as exc:  # noqa: BLE001
        logger.exception("Ingestion failed for doc %s", doc_id)
        doc.status = "failed"
        doc.error = str(exc)[:500]
        # Commit the failure record so the user can see it in the UI
        await session.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process PDF: {exc}",
        )

    return IngestResponse(
        doc_id=doc_id,
        filename=filename,
        chunk_count=doc.chunk_count,
        status=doc.status,
    )


@router.get(
    "/documents",
    response_model=List[DocumentOut],
    summary="List the current user's uploaded documents",
)
async def list_documents(
    user: CurrentUserDep,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> List[DocumentOut]:
    stmt = (
        select(KbDocument)
        .where(KbDocument.person_id == user.person_id)
        .order_by(KbDocument.created_at.desc())
    )
    rows = (await session.execute(stmt)).scalars().all()
    return [DocumentOut.model_validate(d) for d in rows]


@router.delete(
    "/documents/{doc_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a document (also removes its chunks from ChromaDB)",
)
async def delete_document(
    doc_id: str,
    user: CurrentUserDep,
    session: Annotated[AsyncSession, Depends(get_session)],
):
    stmt = select(KbDocument).where(
        KbDocument.id == doc_id,
        KbDocument.person_id == user.person_id,
    )
    doc = (await session.execute(stmt)).scalar_one_or_none()
    if doc is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Document not found")

    store = get_vector_store()
    store.delete_document(doc_id=doc_id, person_id=user.person_id)
    await session.delete(doc)
