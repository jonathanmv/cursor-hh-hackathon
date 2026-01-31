import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const PROXY_BASE = 'http://localhost:3001';

interface Newsletter {
  id: string;
  subject: string;
  body: string;
  createdBy: string;
  createdAt: string;
  status: 'draft' | 'pending-review' | 'approved' | 'rejected';
  chatId?: string;
  feedback?: string;
}

function getStatusBadgeStyle(status: string): React.CSSProperties {
  return {
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 500,
    background:
      status === 'approved'
        ? 'rgba(102, 187, 106, 0.2)'
        : status === 'rejected'
        ? 'rgba(239, 83, 80, 0.2)'
        : 'rgba(255, 255, 255, 0.2)',
    color:
      status === 'approved'
        ? '#66BB6A'
        : status === 'rejected'
        ? '#EF5350'
        : 'white',
  };
}

function CopyIcon({ onClick, copied }: { onClick: () => void; copied: boolean }) {
  return (
    <button
      onClick={onClick}
      className="copy-button"
      style={{
        background: copied ? 'rgba(102, 187, 106, 0.2)' : 'rgba(0, 0, 0, 0.05)',
        border: 'none',
        borderRadius: '6px',
        padding: '6px 10px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '12px',
        color: copied ? '#43A047' : '#666',
        transition: 'all 0.2s',
        whiteSpace: 'nowrap',
      }}
      title={copied ? 'Copied!' : 'Copy to clipboard'}
    >
      {copied ? (
        <>
          <span style={{ fontSize: '14px' }}>&#x2713;</span>
          <span className="copy-text">Copied</span>
        </>
      ) : (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          <span className="copy-text">Copy</span>
        </>
      )}
    </button>
  );
}

export function NewsletterReview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [newsletter, setNewsletter] = useState<Newsletter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [showFeedbackInput, setShowFeedbackInput] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Editable fields
  const [editedSubject, setEditedSubject] = useState('');
  const [editedBody, setEditedBody] = useState('');
  const [isEditingSubject, setIsEditingSubject] = useState(false);
  const [isEditingBody, setIsEditingBody] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Copy state
  const [copiedSubject, setCopiedSubject] = useState(false);
  const [copiedBody, setCopiedBody] = useState(false);

  useEffect(() => {
    if (id) {
      fetchNewsletter(id);
    }
  }, [id]);

  useEffect(() => {
    if (newsletter) {
      setEditedSubject(newsletter.subject);
      setEditedBody(newsletter.body);
    }
  }, [newsletter]);

  useEffect(() => {
    if (newsletter) {
      setHasChanges(
        editedSubject !== newsletter.subject || editedBody !== newsletter.body
      );
    }
  }, [editedSubject, editedBody, newsletter]);

  async function fetchNewsletter(newsletterId: string) {
    try {
      const response = await fetch(`${PROXY_BASE}/newsletter/${newsletterId}`);
      if (!response.ok) {
        if (response.status === 404) {
          setError('Newsletter not found');
        } else {
          setError('Failed to load newsletter');
        }
        return;
      }
      const data = await response.json();
      setNewsletter(data);
    } catch {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveChanges() {
    if (!id || !newsletter) return;
    setSubmitting(true);
    try {
      const response = await fetch(`${PROXY_BASE}/newsletter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newsletter,
          subject: editedSubject,
          body: editedBody,
        }),
      });
      if (response.ok) {
        setNewsletter((prev) =>
          prev ? { ...prev, subject: editedSubject, body: editedBody } : null
        );
        setIsEditingSubject(false);
        setIsEditingBody(false);
      }
    } catch {
      setError('Failed to save changes');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleApprove() {
    if (!id) return;

    // Save changes first if there are any
    if (hasChanges) {
      await handleSaveChanges();
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${PROXY_BASE}/newsletter/${id}/approve`, {
        method: 'POST',
      });
      if (response.ok) {
        setNewsletter((prev) => (prev ? { ...prev, status: 'approved' } : null));
      }
    } catch {
      setError('Failed to approve newsletter');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReject() {
    if (!id || !feedback.trim()) return;
    setSubmitting(true);
    try {
      const response = await fetch(`${PROXY_BASE}/newsletter/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback }),
      });
      if (response.ok) {
        setNewsletter((prev) =>
          prev ? { ...prev, status: 'rejected', feedback } : null
        );
        setShowFeedbackInput(false);
      }
    } catch {
      setError('Failed to reject newsletter');
    } finally {
      setSubmitting(false);
    }
  }

  function copyToClipboard(text: string, type: 'subject' | 'body') {
    navigator.clipboard.writeText(text).then(() => {
      if (type === 'subject') {
        setCopiedSubject(true);
        setTimeout(() => setCopiedSubject(false), 2000);
      } else {
        setCopiedBody(true);
        setTimeout(() => setCopiedBody(false), 2000);
      }
    });
  }

  if (loading) {
    return (
      <>
        <style>{responsiveStyles}</style>
        <div className="container">
          <div className="loading-spinner">Loading...</div>
        </div>
      </>
    );
  }

  if (error || !newsletter) {
    return (
      <>
        <style>{responsiveStyles}</style>
        <div className="container">
          <div className="error-card">
            <h2 className="error-title">Oops!</h2>
            <p className="error-message">{error || 'Newsletter not found'}</p>
            <button className="back-button" onClick={() => navigate('/')}>
              Back to Office
            </button>
          </div>
        </div>
      </>
    );
  }

  const isApproved = newsletter.status === 'approved';
  const isRejected = newsletter.status === 'rejected';

  return (
    <>
      <style>{responsiveStyles}</style>
      <div className="container">
        <div className="card">
          {/* Header */}
          <div className="header">
            <div className="logo-section">
              <div className="logo">M</div>
              <span className="brand-name">MoneyChat</span>
            </div>
            <div style={getStatusBadgeStyle(newsletter.status)}>
              {newsletter.status === 'pending-review'
                ? 'Pending Review'
                : newsletter.status.charAt(0).toUpperCase() + newsletter.status.slice(1)}
            </div>
          </div>

          {/* Newsletter preview */}
          <div className="preview-section">
            <div className="preview-label">Newsletter Preview</div>

            {/* Subject Section */}
            <div className="subject-section">
              <div className="field-header">
                <div className="field-label">Subject</div>
                <div className="field-actions">
                  <CopyIcon
                    onClick={() => copyToClipboard(editedSubject, 'subject')}
                    copied={copiedSubject}
                  />
                  {!isApproved && !isRejected && !isEditingSubject && (
                    <button
                      className="edit-button"
                      onClick={() => setIsEditingSubject(true)}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      <span className="edit-text">Edit</span>
                    </button>
                  )}
                </div>
              </div>
              {isEditingSubject ? (
                <input
                  type="text"
                  value={editedSubject}
                  onChange={(e) => setEditedSubject(e.target.value)}
                  className="subject-input"
                  autoFocus
                  onBlur={() => setIsEditingSubject(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') setIsEditingSubject(false);
                    if (e.key === 'Escape') {
                      setEditedSubject(newsletter.subject);
                      setIsEditingSubject(false);
                    }
                  }}
                />
              ) : (
                <div className="subject-text">{editedSubject}</div>
              )}
            </div>

            {/* Body Section */}
            <div className="body-section">
              <div className="field-header">
                <div className="field-label">Body</div>
                <div className="field-actions">
                  <CopyIcon
                    onClick={() => copyToClipboard(editedBody, 'body')}
                    copied={copiedBody}
                  />
                  {!isApproved && !isRejected && !isEditingBody && (
                    <button
                      className="edit-button"
                      onClick={() => setIsEditingBody(true)}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      <span className="edit-text">Edit</span>
                    </button>
                  )}
                </div>
              </div>
              {isEditingBody ? (
                <textarea
                  value={editedBody}
                  onChange={(e) => setEditedBody(e.target.value)}
                  className="body-textarea"
                  autoFocus
                  rows={15}
                />
              ) : (
                <div className="body-content">
                  {formatMarkdown(editedBody)}
                </div>
              )}
            </div>
          </div>

          {/* Meta info */}
          <div className="meta-section">
            <div className="meta-item">
              <span className="meta-label">Created by</span>
              <span className="meta-value">{newsletter.createdBy || 'Max'}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Created at</span>
              <span className="meta-value">
                {new Date(newsletter.createdAt).toLocaleString()}
              </span>
            </div>
            {hasChanges && (
              <div className="meta-item">
                <span className="meta-label unsaved">Unsaved changes</span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          {!isApproved && !isRejected && (
            <div className="action-section">
              {isEditingBody && (
                <div className="edit-actions">
                  <button
                    className="cancel-edit-button"
                    onClick={() => {
                      setEditedBody(newsletter.body);
                      setIsEditingBody(false);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="save-edit-button"
                    onClick={() => setIsEditingBody(false)}
                  >
                    Done Editing
                  </button>
                </div>
              )}
              {!showFeedbackInput && !isEditingBody ? (
                <div className="main-actions">
                  <button
                    className="approve-button"
                    onClick={handleApprove}
                    disabled={submitting}
                  >
                    {submitting ? 'Processing...' : hasChanges ? 'Save & Approve' : 'Approve'}
                  </button>
                  <button
                    className="reject-button"
                    onClick={() => setShowFeedbackInput(true)}
                    disabled={submitting}
                  >
                    Deny
                  </button>
                </div>
              ) : showFeedbackInput ? (
                <div className="feedback-section">
                  <textarea
                    className="feedback-input"
                    placeholder="What changes would you like to see?"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows={3}
                  />
                  <div className="feedback-actions">
                    <button
                      className="cancel-button"
                      onClick={() => {
                        setShowFeedbackInput(false);
                        setFeedback('');
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      className="submit-feedback-button"
                      onClick={handleReject}
                      disabled={!feedback.trim() || submitting}
                    >
                      {submitting ? 'Sending...' : 'Send Feedback'}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* Approved/Rejected state */}
          {isApproved && (
            <div className="success-message">
              Newsletter approved! You can close this page.
            </div>
          )}

          {isRejected && (
            <div className="rejected-message">
              Feedback sent! We'll revise the newsletter based on your input.
              {newsletter.feedback && (
                <div className="feedback-display">
                  Your feedback: "{newsletter.feedback}"
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function formatMarkdown(text: string): JSX.Element[] {
  const lines = text.split('\n');
  const elements: JSX.Element[] = [];

  lines.forEach((line, index) => {
    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={index} className="md-h1">
          {line.slice(2)}
        </h1>
      );
    } else if (line.startsWith('## ')) {
      elements.push(
        <h2 key={index} className="md-h2">
          {line.slice(3)}
        </h2>
      );
    } else if (line.startsWith('### ')) {
      elements.push(
        <h3 key={index} className="md-h3">
          {line.slice(4)}
        </h3>
      );
    } else if (line.startsWith('- ')) {
      elements.push(
        <li key={index} className="md-li">
          {line.slice(2)}
        </li>
      );
    } else if (line.trim() === '') {
      elements.push(<br key={index} />);
    } else {
      elements.push(
        <p key={index} className="md-p">
          {line}
        </p>
      );
    }
  });

  return elements;
}

const responsiveStyles = `
  * {
    box-sizing: border-box;
  }

  .container {
    min-height: 100vh;
    min-height: 100dvh;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
  }

  .card {
    background: white;
    border-radius: 16px;
    max-width: 700px;
    width: 100%;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    overflow: hidden;
  }

  .header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 16px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
  }

  .logo-section {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .logo {
    width: 36px;
    height: 36px;
    background: white;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    color: #667eea;
    font-size: 18px;
    flex-shrink: 0;
  }

  .brand-name {
    color: white;
    font-size: 18px;
    font-weight: 600;
  }

  .preview-section {
    padding: 20px;
  }

  .preview-label {
    font-size: 12px;
    color: #9e9e9e;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 16px;
  }

  .subject-section {
    margin-bottom: 20px;
  }

  .field-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    flex-wrap: wrap;
    gap: 8px;
  }

  .field-label {
    font-size: 11px;
    color: #9e9e9e;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .field-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .edit-button {
    background: rgba(0, 0, 0, 0.05);
    border: none;
    border-radius: 6px;
    padding: 6px 10px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: #666;
    white-space: nowrap;
  }

  .subject-text {
    font-size: 18px;
    font-weight: 600;
    color: #1a1a2e;
    word-break: break-word;
  }

  .subject-input {
    font-size: 18px;
    font-weight: 600;
    color: #1a1a2e;
    width: 100%;
    padding: 8px 12px;
    border: 2px solid #667eea;
    border-radius: 8px;
    outline: none;
  }

  .body-section {
    margin-top: 20px;
  }

  .body-content {
    background: #f8f9fa;
    border-radius: 8px;
    padding: 16px;
    max-height: 50vh;
    overflow-y: auto;
    font-size: 14px;
    color: #333;
    line-height: 1.6;
  }

  .body-textarea {
    width: 100%;
    padding: 12px;
    border: 2px solid #667eea;
    border-radius: 8px;
    font-size: 14px;
    line-height: 1.6;
    resize: vertical;
    font-family: inherit;
    min-height: 250px;
    outline: none;
  }

  .md-h1 { font-size: 22px; margin-top: 16px; margin-bottom: 8px; }
  .md-h2 { font-size: 18px; margin-top: 14px; margin-bottom: 6px; }
  .md-h3 { font-size: 15px; margin-top: 12px; margin-bottom: 4px; }
  .md-li { margin-left: 20px; margin-bottom: 4px; }
  .md-p { margin-bottom: 8px; line-height: 1.6; }

  .meta-section {
    padding: 14px 20px;
    background: #f8f9fa;
    display: flex;
    gap: 20px;
    border-top: 1px solid #eee;
    flex-wrap: wrap;
  }

  .meta-item {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .meta-label {
    font-size: 11px;
    color: #9e9e9e;
    text-transform: uppercase;
  }

  .meta-label.unsaved {
    color: #FFA726;
  }

  .meta-value {
    font-size: 13px;
    color: #333;
    font-weight: 500;
  }

  .action-section {
    padding: 16px 20px;
    border-top: 1px solid #eee;
  }

  .main-actions {
    display: flex;
    gap: 12px;
    width: 100%;
  }

  .edit-actions {
    display: flex;
    gap: 12px;
    width: 100%;
    margin-bottom: 12px;
  }

  .cancel-edit-button,
  .save-edit-button {
    flex: 1;
    padding: 12px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
  }

  .cancel-edit-button {
    background: #f5f5f5;
    color: #666;
  }

  .save-edit-button {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    font-weight: 600;
  }

  .approve-button,
  .reject-button {
    flex: 1;
    padding: 14px 16px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.1s, opacity 0.1s;
  }

  .approve-button:active,
  .reject-button:active {
    transform: scale(0.98);
  }

  .approve-button:disabled,
  .reject-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .approve-button {
    background: linear-gradient(135deg, #66BB6A 0%, #43A047 100%);
    border: none;
    color: white;
  }

  .reject-button {
    background: transparent;
    border: 2px solid #EF5350;
    color: #EF5350;
  }

  .feedback-section {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .feedback-input {
    width: 100%;
    padding: 12px;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    font-size: 14px;
    resize: vertical;
    font-family: inherit;
  }

  .feedback-actions {
    display: flex;
    gap: 12px;
  }

  .cancel-button,
  .submit-feedback-button {
    flex: 1;
    padding: 12px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
  }

  .cancel-button {
    background: #f5f5f5;
    color: #666;
  }

  .submit-feedback-button {
    background: linear-gradient(135deg, #EF5350 0%, #E53935 100%);
    color: white;
    font-weight: 600;
  }

  .submit-feedback-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .success-message {
    padding: 20px;
    background: rgba(102, 187, 106, 0.1);
    color: #43A047;
    text-align: center;
    font-weight: 500;
    border-top: 1px solid rgba(102, 187, 106, 0.2);
  }

  .rejected-message {
    padding: 20px;
    background: rgba(239, 83, 80, 0.1);
    color: #E53935;
    text-align: center;
    border-top: 1px solid rgba(239, 83, 80, 0.2);
  }

  .feedback-display {
    margin-top: 8px;
    font-size: 13px;
    font-style: italic;
    opacity: 0.8;
  }

  .loading-spinner {
    color: white;
    font-size: 18px;
  }

  .error-card {
    background: white;
    border-radius: 16px;
    padding: 32px;
    text-align: center;
    max-width: 400px;
    width: 100%;
  }

  .error-title {
    font-size: 24px;
    color: #1a1a2e;
    margin: 0 0 8px 0;
  }

  .error-message {
    color: #666;
    margin-bottom: 24px;
  }

  .back-button {
    padding: 12px 24px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    border-radius: 8px;
    color: white;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
  }

  /* Mobile-specific styles */
  @media (max-width: 480px) {
    .container {
      padding: 0;
      align-items: flex-start;
    }

    .card {
      border-radius: 0;
      min-height: 100vh;
      min-height: 100dvh;
    }

    .header {
      padding: 14px 16px;
    }

    .brand-name {
      font-size: 16px;
    }

    .preview-section {
      padding: 16px;
    }

    .subject-text {
      font-size: 16px;
    }

    .subject-input {
      font-size: 16px;
    }

    .body-content {
      padding: 14px;
      max-height: 40vh;
    }

    .body-textarea {
      min-height: 200px;
      padding: 10px;
    }

    .md-h1 { font-size: 20px; }
    .md-h2 { font-size: 16px; }
    .md-h3 { font-size: 14px; }

    .meta-section {
      padding: 12px 16px;
      gap: 16px;
    }

    .action-section {
      padding: 16px;
      position: sticky;
      bottom: 0;
      background: white;
      box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
    }

    .main-actions {
      flex-direction: column;
    }

    .approve-button,
    .reject-button {
      padding: 16px;
      font-size: 16px;
    }

    .edit-button .edit-text,
    .copy-button .copy-text {
      display: none;
    }

    .field-actions {
      gap: 4px;
    }

    .feedback-actions {
      flex-direction: column;
    }

    .cancel-button,
    .submit-feedback-button {
      padding: 14px;
    }
  }

  /* Tablet styles */
  @media (min-width: 481px) and (max-width: 768px) {
    .container {
      padding: 20px;
    }

    .body-content {
      max-height: 45vh;
    }
  }

  /* Touch-friendly interactions */
  @media (hover: none) {
    .approve-button:hover,
    .reject-button:hover,
    .edit-button:hover,
    .copy-button:hover {
      opacity: 1;
    }
  }
`;
