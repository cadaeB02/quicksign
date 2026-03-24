import { IconCheckCircle, IconLock, IconDownload } from './Icons'

export default function CompletionScreen({ auditSummary, signers, onDownload, onStartOver }) {
  return (
    <div className="completion-screen">
      <div className="completion-card">
        <div className="completion-icon">
          <IconCheckCircle size={36} color="var(--success)" />
        </div>
        <h2>Document Signed!</h2>
        <p>Your document has been signed and is ready to download.</p>

        <div className="audit-summary">
          <h3><IconLock size={14} /> Audit Trail</h3>
          <div className="audit-row">
            <span className="label">Document</span>
            <span className="value">{auditSummary?.documentName || '—'}</span>
          </div>
          {auditSummary?.signers?.map((s, i) => (
            <div key={i} className="audit-row">
              <span className="label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: s.color, display: 'inline-block'
                }} />
                {s.name}
              </span>
              <span className="value">
                {s.signedCount} of {s.totalCount} fields
              </span>
            </div>
          ))}
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
            <IconDownload size={18} /> Download Signed PDF
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
