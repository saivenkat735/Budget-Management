"""
OpenAI-compatible function-calling tool definitions for Dynamic RAG.

The LLM (Ollama llama3.1 or OpenAI) chooses which tool to invoke; each tool
wraps a call to one of the existing Spring services via BackendClient. This
is the "Dynamic RAG via LLM tool calling" half of the project.
"""
from __future__ import annotations

import json
import logging
from datetime import datetime
from typing import Any, Awaitable, Callable, Dict, List

from app.services.backend_client import BackendClient, BackendError

logger = logging.getLogger(__name__)


# --- OpenAI tool schemas ---------------------------------------------------
TOOL_SCHEMAS: List[dict] = [
    {
        "type": "function",
        "function": {
            "name": "get_accounts",
            "description": (
                "List the user's bank/credit accounts with current balances. "
                "Use whenever the user asks about balances, account types, or "
                "how much money they have available."
            ),
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_recent_transactions",
            "description": (
                "Get the user's MOST RECENT transactions. Use for questions "
                "like 'what did I spend on yesterday' or 'recent activity'."
            ),
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_all_transactions",
            "description": (
                "Get the user's COMPLETE transaction history. Use for spending "
                "summaries, totals, or analysis over time."
            ),
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_upcoming_bills",
            "description": (
                "Get the user's bills (paid and unpaid). Use for questions "
                "about due dates, monthly fixed expenses, or upcoming bills."
            ),
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_categories",
            "description": (
                "List spending categories with amounts spent. Use for "
                "category-wise spending questions."
            ),
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_spending_summary",
            "description": (
                "Computed executive summary: total balance, net cash flow, "
                "unpaid bills total. Use this as a one-shot answer for "
                "'how am I doing financially?' or 'give me an overview'."
            ),
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
]


# --- Tool implementations --------------------------------------------------
async def _exec_get_accounts(client: BackendClient, person_id: str, **_) -> Any:
    return await client.get_accounts(person_id)


async def _exec_get_recent(client: BackendClient, person_id: str, **_) -> Any:
    return await client.get_recent_transactions(person_id)


async def _exec_get_all(client: BackendClient, person_id: str, **_) -> Any:
    return await client.get_all_transactions(person_id)


async def _exec_get_bills(client: BackendClient, person_id: str, **_) -> Any:
    return await client.get_bills(person_id)


async def _exec_get_categories(client: BackendClient, person_id: str, **_) -> Any:
    return await client.get_categories()


async def _exec_get_summary(client: BackendClient, person_id: str, **_) -> dict:
    """Cross-service aggregation: one call returns the whole picture."""
    accounts = await client.get_accounts(person_id)
    transactions = await client.get_all_transactions(person_id)
    bills = await client.get_bills(person_id)

    accounts_list = accounts if isinstance(accounts, list) else []
    total_balance = sum(
        float(a.get("balance", 0))
        for a in accounts_list
        if a.get("active", True)
    )

    txns = transactions if isinstance(transactions, list) else []
    total_credit = sum(
        float(t.get("amount", 0))
        for t in txns
        if str(t.get("transactionType", "")).upper() == "CREDIT"
    )
    total_debit = sum(
        float(t.get("amount", 0))
        for t in txns
        if str(t.get("transactionType", "")).upper() == "DEBIT"
    )

    bills_list = bills if isinstance(bills, list) else []
    unpaid = [b for b in bills_list if not b.get("isPaid")]
    unpaid_total = sum(float(b.get("amount", 0)) for b in unpaid)

    return {
        "total_balance": total_balance,
        "total_credit_all_time": total_credit,
        "total_debit_all_time": total_debit,
        "net": total_credit - total_debit,
        "account_count": len(accounts_list),
        "transaction_count": len(txns),
        "unpaid_bills_count": len(unpaid),
        "unpaid_bills_total": unpaid_total,
        "generated_at": datetime.utcnow().isoformat(),
    }


TOOL_EXECUTORS: Dict[str, Callable[..., Awaitable[Any]]] = {
    "get_accounts": _exec_get_accounts,
    "get_recent_transactions": _exec_get_recent,
    "get_all_transactions": _exec_get_all,
    "get_upcoming_bills": _exec_get_bills,
    "get_categories": _exec_get_categories,
    "get_spending_summary": _exec_get_summary,
}


async def execute_tool(
    name: str,
    arguments: dict,
    client: BackendClient,
    person_id: str,
) -> str:
    """Run a named tool and return its result as a JSON string for the LLM."""
    fn = TOOL_EXECUTORS.get(name)
    if fn is None:
        return json.dumps({"error": f"Unknown tool '{name}'"})

    try:
        result = await fn(client, person_id, **(arguments or {}))
        return json.dumps(result, default=str)
    except BackendError as exc:
        logger.warning("Tool %s backend error: %s", name, exc)
        return json.dumps({"error": str(exc)})
    except Exception as exc:  # noqa: BLE001
        logger.exception("Tool %s crashed", name)
        return json.dumps({"error": f"Tool execution failed: {exc}"})
