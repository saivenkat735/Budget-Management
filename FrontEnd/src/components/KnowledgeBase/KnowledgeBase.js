import React, { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import {
  FaCloudUploadAlt,
  FaFilePdf,
  FaTrash,
  FaSpinner,
  FaCheckCircle,
  FaExclamationTriangle,
} from 'react-icons/fa';
import Sidebar from '../Dashboard/Sidebar';
import aiApi from '../../utils/aiApi';
import './KnowledgeBase.css';

const KnowledgeBase = () => {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const fetchDocs = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await aiApi.listDocuments();
      setDocs(data || []);
    } catch (err) {
      const msg = err?.response?.data?.detail || err.message;
      toast.error(`Could not load documents: ${msg}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  const handleUpload = async (file) => {
    if (!file) return;
    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are supported.');
      return;
    }
    const max = 15 * 1024 * 1024;
    if (file.size > max) {
      toast.error('File too large (max 15 MB).');
      return;
    }
    try {
      setUploading(true);
      const { data } = await aiApi.ingest(file);
      toast.success(
        `Indexed "${data.filename}" into ${data.chunk_count} chunks.`
      );
      await fetchDocs();
    } catch (err) {
      const msg = err?.response?.data?.detail || err.message;
      toast.error(`Upload failed: ${msg}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (doc) => {
    if (!window.confirm(`Delete "${doc.filename}" from the knowledge base?`)) {
      return;
    }
    try {
      await aiApi.deleteDocument(doc.id);
      toast.success('Document removed.');
      setDocs((prev) => prev.filter((d) => d.id !== doc.id));
    } catch (err) {
      const msg = err?.response?.data?.detail || err.message;
      toast.error(`Delete failed: ${msg}`);
    }
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };
  const onDragLeave = () => setDragOver(false);
  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer?.files?.[0];
    if (f) handleUpload(f);
  };

  return (
    <div className="kb-layout">
      <Sidebar />
      <main className="kb-main">
        <header className="kb-header">
          <h1>📚 Knowledge Base</h1>
          <p>
            Upload financial PDFs (investment guides, bank statements, policy
            documents). BudgetWise AI will reference them when answering your
            questions.
          </p>
        </header>

        <section
          className={`kb-dropzone ${dragOver ? 'kb-dropzone--over' : ''} ${
            uploading ? 'kb-dropzone--busy' : ''
          }`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            hidden
            onChange={(e) => handleUpload(e.target.files?.[0])}
          />
          {uploading ? (
            <>
              <FaSpinner className="kb-spin" size={36} />
              <p>Parsing, chunking and embedding... this may take a minute.</p>
            </>
          ) : (
            <>
              <FaCloudUploadAlt size={48} />
              <p>
                <strong>Drag &amp; drop</strong> a PDF here or{' '}
                <span className="kb-link">click to browse</span>
              </p>
              <small>Up to 15 MB &middot; text-based PDFs work best</small>
            </>
          )}
        </section>

        <section className="kb-list">
          <h2>Your documents</h2>
          {loading ? (
            <p className="kb-empty">
              <FaSpinner className="kb-spin" /> Loading...
            </p>
          ) : docs.length === 0 ? (
            <p className="kb-empty">
              Nothing here yet. Upload a PDF to get started.
            </p>
          ) : (
            <table className="kb-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Chunks</th>
                  <th>Size</th>
                  <th>Status</th>
                  <th>Uploaded</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {docs.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <FaFilePdf className="kb-pdf-icon" /> {d.filename}
                    </td>
                    <td>{d.chunk_count}</td>
                    <td>{prettyBytes(d.size_bytes)}</td>
                    <td>
                      <StatusBadge status={d.status} error={d.error} />
                    </td>
                    <td>{new Date(d.created_at).toLocaleString()}</td>
                    <td>
                      <button
                        className="kb-delete"
                        onClick={() => handleDelete(d)}
                        aria-label="Delete document"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </main>
    </div>
  );
};

const StatusBadge = ({ status, error }) => {
  if (status === 'ready')
    return (
      <span className="kb-badge kb-badge--ok">
        <FaCheckCircle /> ready
      </span>
    );
  if (status === 'failed')
    return (
      <span
        className="kb-badge kb-badge--bad"
        title={error || 'Processing failed'}
      >
        <FaExclamationTriangle /> failed
      </span>
    );
  return (
    <span className="kb-badge kb-badge--wait">
      <FaSpinner className="kb-spin" /> {status}
    </span>
  );
};

const prettyBytes = (n) => {
  if (!n && n !== 0) return '-';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
};

export default KnowledgeBase;
