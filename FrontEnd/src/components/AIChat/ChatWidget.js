import React, { useEffect, useRef, useState } from 'react';
import {
  FaRobot,
  FaTimes,
  FaPaperPlane,
  FaTools,
  FaFilePdf,
  FaSpinner,
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import aiApi from '../../utils/aiApi';
import './ChatWidget.css';

const STORAGE_KEY = 'budgetwise.ai.session_id';

const ChatWidget = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]); // [{role, content, sources?, tools_used?}]
  const [sending, setSending] = useState(false);
  const [sessionId, setSessionId] = useState(
    () => localStorage.getItem(STORAGE_KEY) || ''
  );
  const listRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, sending]);

  // Greeting message on first open
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content:
            "Hi! I'm BudgetWise AI. Ask me anything about your spending, " +
            "bills, accounts, or any financial PDF you've uploaded.",
        },
      ]);
    }
  }, [open, messages.length]);

  // Don't render at all if the user is not logged in
  if (!user) return null;

  const handleSend = async (e) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setSending(true);

    try {
      const { data } = await aiApi.chat({
        question: text,
        session_id: sessionId || undefined,
      });

      if (data.session_id && data.session_id !== sessionId) {
        setSessionId(data.session_id);
        localStorage.setItem(STORAGE_KEY, data.session_id);
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.answer || '(no answer)',
          sources: data.sources || [],
          tools_used: data.tools_used || [],
        },
      ]);
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.message ||
        'Something went wrong contacting the AI service.';
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `⚠️ ${msg}`, isError: true },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleReset = () => {
    setMessages([]);
    setSessionId('');
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <>
      {/* Floating toggle button */}
      <button
        className={`ai-fab ${open ? 'ai-fab--open' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-label="Open AI assistant"
      >
        {open ? <FaTimes /> : <FaRobot />}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="ai-panel" role="dialog" aria-label="BudgetWise AI">
          <header className="ai-panel__header">
            <div className="ai-panel__title">
              <FaRobot /> <span>BudgetWise AI</span>
            </div>
            <div className="ai-panel__actions">
              <button
                className="ai-iconbtn"
                onClick={handleReset}
                title="Start a new conversation"
              >
                New
              </button>
              <button
                className="ai-iconbtn"
                onClick={() => setOpen(false)}
                title="Close"
              >
                <FaTimes />
              </button>
            </div>
          </header>

          <div className="ai-panel__messages" ref={listRef}>
            {messages.map((m, i) => (
              <Message key={i} m={m} />
            ))}
            {sending && (
              <div className="ai-msg ai-msg--assistant">
                <div className="ai-msg__bubble ai-msg__bubble--typing">
                  <FaSpinner className="ai-spin" /> thinking...
                </div>
              </div>
            )}
          </div>

          <form className="ai-panel__input" onSubmit={handleSend}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your finances..."
              disabled={sending}
              autoFocus
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              aria-label="Send"
            >
              <FaPaperPlane />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

const Message = ({ m }) => {
  const isUser = m.role === 'user';
  return (
    <div className={`ai-msg ${isUser ? 'ai-msg--user' : 'ai-msg--assistant'}`}>
      <div
        className={`ai-msg__bubble ${m.isError ? 'ai-msg__bubble--error' : ''}`}
      >
        {m.content}
      </div>

      {!isUser && Array.isArray(m.tools_used) && m.tools_used.length > 0 && (
        <div className="ai-badges">
          {m.tools_used.map((t, i) => (
            <span className="ai-badge ai-badge--tool" key={`tool-${i}`}>
              <FaTools /> {humanizeTool(t.name)}
            </span>
          ))}
        </div>
      )}

      {!isUser && Array.isArray(m.sources) && m.sources.length > 0 && (
        <details className="ai-sources">
          <summary>
            <FaFilePdf /> {m.sources.length} document source
            {m.sources.length === 1 ? '' : 's'}
          </summary>
          <ul>
            {m.sources.map((s, i) => (
              <li key={`src-${i}`}>
                <strong>
                  {s.filename} (p.{s.page})
                </strong>
                <div className="ai-source__snippet">{s.snippet}</div>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
};

const TOOL_LABELS = {
  get_accounts: 'Checked your accounts',
  get_recent_transactions: 'Pulled recent transactions',
  get_all_transactions: 'Reviewed full transaction history',
  get_upcoming_bills: 'Looked at your bills',
  get_categories: 'Looked at spending categories',
  get_spending_summary: 'Computed a financial summary',
};
const humanizeTool = (name) => TOOL_LABELS[name] || name;

export default ChatWidget;
