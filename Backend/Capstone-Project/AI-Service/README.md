# BudgetWise AI Service 🤖💰

A standalone **Python FastAPI** microservice that adds AI capabilities to the existing
BudgetWise Spring Boot / React stack:

- 🧠 **Dynamic RAG** — LLM tool-calling into the existing Accounts / Bills / Transactions / Category Spring services so the chatbot can answer questions about the user's actual finances.
- 📚 **Static RAG** — Upload financial PDFs (investment guides, bank statements, etc.); they are chunked, embedded, and stored in **ChromaDB** for retrieval at query time.

## Tech stack

| Concern        | Choice (default)                            | Swappable to      |
|----------------|---------------------------------------------|-------------------|
| Web framework  | FastAPI + Uvicorn                           | —                 |
| Validation     | Pydantic v2 + pydantic-settings             | —                 |
| Vector store   | **ChromaDB** (persistent client)            | —                 |
| Embeddings     | **sentence-transformers** `all-MiniLM-L6-v2` (free, local) | OpenAI `text-embedding-3-small` |
| LLM            | **Ollama** `llama3.1` (free, local) via OpenAI-compatible API | OpenAI `gpt-4o-mini` |
| Auth           | JWT HS256 (same Base64 secret as Spring `Secure` service) | — |
| Relational DB  | **SQLite** (chat history + document metadata) | — |

---

## 0. Prerequisites

1. **Python 3.13** already installed (verified via `py --version`).
2. **Ollama** for the local LLM. Install once:
   - Download: https://ollama.com/download
   - Pull a tool-calling capable model:
     ```powershell
     ollama pull llama3.1
     ```
   - On Windows, Ollama auto-starts as a background service after install. Verify:
     ```powershell
     curl http://localhost:11434/api/tags
     ```
3. The five existing Spring services (Secure, Accounts, Bills, TransactionHistory, Category) and the Gateway must be runnable. They are used by the AI tool calls.

---

## 1. Install Python dependencies

```powershell
cd Backend\Capstone-Project\AI-Service
# The .venv is already created. If not:  py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

> ⏱️ First install downloads PyTorch + sentence-transformers + ChromaDB. Expect **5–10 minutes** and ~2 GB on disk. Subsequent starts are instant.

The first time the embedder loads, it downloads the `all-MiniLM-L6-v2` model (~80 MB) to your user cache.

---

## 2. Configure environment

The `.env` file is already created with sensible local defaults. Edit only if needed:

```ini
JWT_SECRET=5367566B59703373367639792F423F4528482B4D6251655468576D5A71347437  # must match Spring
LLM_PROVIDER=ollama
LLM_BASE_URL=http://localhost:11434/v1
LLM_MODEL=llama3.1
EMBEDDING_PROVIDER=sentence-transformers
EMBEDDING_MODEL=all-MiniLM-L6-v2
```

---

## 3. Run the service

```powershell
uvicorn app.main:app --reload --port 8000
```

Open http://localhost:8000/docs for the interactive Swagger UI.

Health check (no auth required):
```powershell
curl http://localhost:8000/ai/health
```

---

## 4. End-to-end test

Make sure every layer is running:

| Layer            | Port  | How                                                      |
|------------------|-------|----------------------------------------------------------|
| MySQL            | 3306  | Local install                                            |
| Ollama           | 11434 | Background service                                       |
| Secure           | 9099  | `cd Backend\Capstone-Project\Secure && .\mvnw spring-boot:run` |
| Accounts         | 2001  | `cd Backend\Capstone-Project\Accounts && .\mvnw spring-boot:run` |
| TransactionHistory | 2002 | `cd Backend\Capstone-Project\TransactionHistory && .\mvnw spring-boot:run` |
| Bills            | 9007  | `cd Backend\Capstone-Project\Bills\Bills && .\mvnw spring-boot:run` |
| Category         | 2004  | `cd Backend\Capstone-Project\Category && .\mvnw spring-boot:run` |
| Gateway          | 8080  | `cd Backend\Capstone-Project\GateWay && .\mvnw spring-boot:run` |
| **AI service**   | 8000  | `uvicorn app.main:app --reload --port 8000`              |
| React            | 3000  | `cd FrontEnd && npm start`                               |

Then drive the demo flow:

1. **Log in** at http://localhost:3000/login (or register a new account).
2. **Add an account** under Accounts, then a few **transactions** and **bills** so the AI has real data to query.
3. Click **📚 Knowledge Base** in the sidebar → drag any small financial PDF (an investment guide works great). Wait for the "Indexed into N chunks" toast.
4. Click the **floating 🤖 button** bottom-right and ask both kinds of questions:

   **Dynamic-RAG (tool-calling) examples:**
   - *"What's my total balance across all accounts?"*
   - *"How much have I spent this month?"*
   - *"Do I have any unpaid bills?"*
   - *"Give me a quick financial summary."*

   **Static-RAG (PDF retrieval) examples (after upload):**
   - *"Summarize the key points of the investment guide I uploaded."*
   - *"What does my uploaded document say about diversification?"*

   **Combined example (both fire):**
   - *"Based on the investment guide and my current spending, how much could I safely move into mutual funds each month?"*

Each assistant response shows:
- 🔧 **Tool badges** — every Spring API the LLM consulted.
- 📄 **Document sources** — collapsible citations with filename + page + snippet.

---

## 5. Project layout

```
AI-Service/
├── app/
│   ├── main.py              # FastAPI app + CORS + router wiring
│   ├── config.py            # Pydantic settings (loads .env)
│   ├── core/
│   │   └── auth.py          # JWT HS256 dependency → CurrentUser
│   ├── services/
│   │   ├── database.py      # SQLAlchemy async + SQLite
│   │   ├── embeddings.py    # sentence-transformers (default) | OpenAI
│   │   ├── vector_store.py  # ChromaDB wrapper, per-user scoped
│   │   ├── pdf_parser.py    # pypdf + recursive char splitter
│   │   ├── backend_client.py# httpx async → Spring services
│   │   ├── tools.py         # OpenAI tool schemas + executors
│   │   └── llm.py           # AsyncOpenAI client (Ollama-compatible)
│   ├── models/
│   │   ├── db_models.py     # KbDocument, ChatMessage ORM
│   │   └── schemas.py       # Pydantic request/response
│   └── routers/
│       ├── health.py        # GET /ai/health
│       ├── documents.py     # POST /ai/ingest, GET/DELETE /ai/documents
│       └── chat.py          # POST /ai/chat, GET /ai/chat/history
├── data/                    # Auto-created (gitignored): ChromaDB + SQLite
├── requirements.txt
├── .env / .env.example / .gitignore / Dockerfile
└── README.md
```

---

## 6. Endpoints

| Method | Path                    | Auth | Purpose                                          |
|--------|-------------------------|------|--------------------------------------------------|
| GET    | `/ai/health`            | ❌   | Liveness probe                                   |
| POST   | `/ai/ingest`            | ✅   | Upload a PDF → chunk + embed + persist           |
| GET    | `/ai/documents`         | ✅   | List the current user's uploaded documents      |
| DELETE | `/ai/documents/{id}`    | ✅   | Remove a document and its chunks                 |
| POST   | `/ai/chat`              | ✅   | Ask a question (Static + Dynamic RAG)            |
| GET    | `/ai/chat/history`      | ✅   | Retrieve previous chat turns                     |

All `✅` routes require `Authorization: Bearer <jwt>` issued by the Spring `Secure` service `/person/login`.

---

## 7. Switching providers

### Use OpenAI instead of Ollama
Edit `.env`:
```ini
LLM_PROVIDER=openai
LLM_BASE_URL=https://api.openai.com/v1
LLM_API_KEY=sk-...your-real-key...
LLM_MODEL=gpt-4o-mini
EMBEDDING_PROVIDER=openai
EMBEDDING_MODEL=text-embedding-3-small
```
Restart the service. No code changes needed.

---

## 8. Troubleshooting

| Symptom | Fix |
|--------|-----|
| `LLM provider error (... 502)` | Ollama not running. `ollama serve` then retry. |
| `Invalid token` on every call | The Spring `Secure` service issued the token with a different secret. Confirm both use the same `JWT_SECRET`. |
| Chat answers say "no data" | The Spring services aren't running on the expected ports. Confirm Accounts on 2001, TransactionHistory on 2002, Bills on 9007, Category on 2004. |
| PDF upload says "No extractable text" | The PDF is an image scan. Convert to text first, or wait until OCR is added in a future iteration. |
| Slow first response | First call loads the embedding model into memory (~10 s) and the LLM warms up. Subsequent calls are fast. |

---

## 9. Gateway integration

The Spring Cloud Gateway is already wired (see `GatewayConfig.java`):

```java
.route("ai-service", r -> r
    .path("/ai/**")
    .filters(f -> f.filter(authFilter.apply(new AuthenticationFilter.Config())))
    .uri("http://localhost:8000"))
```

So requests can also flow as: `React → http://localhost:8080/ai/*  →  AI Service`.
By default the React UI hits the AI service directly on `http://localhost:8000` (matching the existing per-service pattern in this codebase). Set `REACT_APP_AI_BASE_URL=http://localhost:8080` to route through the gateway instead.

