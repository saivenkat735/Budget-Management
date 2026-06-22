"""
HTTP client for the existing Spring Boot microservices.

The user's JWT is forwarded on every call so the Spring services still
see an authenticated request (and the Gateway filter is satisfied if
the AI service ever proxies through it).
"""
from __future__ import annotations

import logging
from typing import Any

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

_DEFAULT_TIMEOUT = httpx.Timeout(10.0)


class BackendError(Exception):
    """Raised when an upstream Spring service responds with an error."""


class BackendClient:
    """Async wrapper for calling Spring services with the user's JWT."""

    def __init__(self, jwt: str):
        self._headers = {"Authorization": f"Bearer {jwt}"}

    async def _get(self, url: str) -> Any:
        async with httpx.AsyncClient(timeout=_DEFAULT_TIMEOUT) as client:
            try:
                resp = await client.get(url, headers=self._headers)
                resp.raise_for_status()
            except httpx.HTTPStatusError as exc:
                logger.warning("Backend %s -> %d", url, exc.response.status_code)
                raise BackendError(
                    f"{url} -> {exc.response.status_code} {exc.response.text[:200]}"
                ) from exc
            except httpx.HTTPError as exc:
                raise BackendError(f"{url} -> network error: {exc}") from exc

            ct = resp.headers.get("content-type", "")
            if "application/json" in ct:
                return resp.json()
            text = resp.text
            # Some Spring endpoints (e.g. /bills/fixed-expenses) return a bare number
            try:
                return float(text) if "." in text else int(text)
            except (TypeError, ValueError):
                return text

    # ---- Accounts service (port 2001) ----
    async def get_accounts(self, person_id: str) -> Any:
        return await self._get(
            f"{settings.backend_accounts_url}/api/accounts/person/{person_id}"
        )

    # ---- Transactions service (port 2002) ----
    async def get_recent_transactions(self, person_id: str) -> Any:
        return await self._get(
            f"{settings.backend_transactions_url}/TransactionHistory/person/{person_id}/recent"
        )

    async def get_all_transactions(self, person_id: str) -> Any:
        return await self._get(
            f"{settings.backend_transactions_url}/TransactionHistory/person/{person_id}"
        )

    async def get_dashboard(self, person_id: str) -> Any:
        return await self._get(
            f"{settings.backend_transactions_url}/TransactionHistory/dashboard/{person_id}"
        )

    # ---- Bills service (port 9007) ----
    async def get_bills(self, person_id: str) -> Any:
        return await self._get(
            f"{settings.backend_bills_url}/bills/person/{person_id}"
        )

    # ---- Category service (port 2004) ----
    async def get_categories(self) -> Any:
        return await self._get(f"{settings.backend_category_url}/category")
