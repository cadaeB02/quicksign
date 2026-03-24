export default function CompletionScreen({ auditSummary, onDownload, onStartOver }) {
  return (
    <div className="completion-screen">
      <div className="completion-card">
        <div className="completion-icon">✅</div>
        <h2>Document Signed!</h2>
        <p>Your document has been signed and is ready to download.</p>

        <div className="audit-summary">
          <h3>🔒 Audit Trail</h3>
          <div className="audit-row">
            <span className="label">Document</span>
            <span className="value">{auditSummary?.documentName || '—'}</span>
          </div>
          <div className="audit-row">
            <span className="label">Signer</span>
            <span className="value">{auditSummary?.signerName || '—'}</span>
          </div>
          <div className="audit-row">
            <span className="label">Email</span>
            <span className="value">{auditSummary?.signerEmail || '—'}</span>
          </div>
          <div className="audit-row">
            <span className="label">Signed Fields</span>
            <span className="value">
              {auditSummary?.signedFields || 0} of {auditSummary?.totalFields || 0}
            </span>
          </div>
          <div className="audit-row">
            <span className="label">Completed</span>
            <span className="value">{auditSummary?.completedAtFormatted || '—'}</span>
          </div>
          <div className="audit-row">
            <span className="label">Doc Hash</span>
            <span className="value" style={{ fontSize: 10, fontFamily: 'monospace', wordBreak: 'break-all' }}>
              {auditSummary?.documentHash?.substring(0, 24) || '—'}...
            </span>
          </div>
        </div>

        <div className="completion-actions">
          <button
            className="btn btn-primary btn-lg"
            onClick={onDownload}
            id="download-btn"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            📥 Download Signed PDF
          </button>
          <button
            className="btn btn-secondary"
            onClick={onStartOver}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            Sign Another Document
          </button>
        </div>
      </div>
    </div>
  )
}
