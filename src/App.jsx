import { useState, useCallback, useRef } from 'react'
import UploadScreen from './components/UploadScreen'
import PDFViewer from './components/PDFViewer'
import SignatureModal from './components/SignatureModal'
import CompletionScreen from './components/CompletionScreen'
import { loadPdf, embedSignatures, downloadPdf } from './utils/pdfUtils'
import { hashDocument, createAuditEntry, buildAuditSummary } from './utils/auditTrail'

const SIGNER_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#ec4899', '#06b6d4']

const STEPS = [
  { num: 1, label: 'Upload' },
  { num: 2, label: 'Place Fields' },
  { num: 3, label: 'Sign' },
  { num: 4, label: 'Download' },
]

export default function App() {
  const [step, setStep] = useState(1)
  const [pdfFile, setPdfFile] = useState(null)
  const [pdfDoc, setPdfDoc] = useState(null)
  const [totalPages, setTotalPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [scale, setScale] = useState(1.5)
  const [fields, setFields] = useState([])
  const [signers, setSigners] = useState([])
  const [selectedSignerId, setSelectedSignerId] = useState(null)
  const [activeField, setActiveField] = useState(null)
  const [showSigModal, setShowSigModal] = useState(false)
  const [auditEntries, setAuditEntries] = useState([])
  const [auditSummary, setAuditSummary] = useState(null)
  const [signedPdfBytes, setSignedPdfBytes] = useState(null)

  const nextFieldId = useRef(1)
  const nextSignerId = useRef(1)

  // Upload
  const handleFileLoaded = useCallback(async (file) => {
    const bytesCopy = new Uint8Array(file.arrayBuffer).slice()
    const fileWithBytes = { ...file, bytes: bytesCopy }
    setPdfFile(fileWithBytes)
    const pdf = await loadPdf(new Uint8Array(file.arrayBuffer))
    setPdfDoc(pdf)
    setTotalPages(pdf.numPages)
    setCurrentPage(1)
    setStep(2)
  }, [])

  // Add signer
  const handleAddSigner = useCallback(({ name, email }) => {
    const id = nextSignerId.current++
    const color = SIGNER_COLORS[(id - 1) % SIGNER_COLORS.length]
    const newSigner = { id, name, email, color }
    setSigners(prev => [...prev, newSigner])
    // Auto-select the first signer
    setSelectedSignerId(prev => prev || id)
    setAuditEntries(prev => [...prev, createAuditEntry({
      signerName: name,
      signerEmail: email,
      action: `Signer "${name}" added to document`,
    })])
  }, [])

  // Remove signer
  const handleRemoveSigner = useCallback((id) => {
    setSigners(prev => prev.filter(s => s.id !== id))
    setFields(prev => prev.filter(f => f.signerId !== id))
    setSelectedSignerId(prev => prev === id ? null : prev)
  }, [])

  // Add field (assigned to selected signer)
  const handleAddField = useCallback(({ x, y, width, height, page, signerId }) => {
    const id = nextFieldId.current++
    setFields(prev => [...prev, {
      id, x, y, width, height, page,
      signerId: signerId || selectedSignerId,
      signed: false,
      signatureDataUrl: null,
      signedAt: null,
      signedByName: null,
      signedByEmail: null,
    }])
  }, [selectedSignerId])

  // Move, resize, delete
  const handleMoveField = useCallback((id, { x, y }) => {
    setFields(prev => prev.map(f => f.id === id ? { ...f, x, y } : f))
  }, [])

  const handleResizeField = useCallback((id, { width, height }) => {
    setFields(prev => prev.map(f => f.id === id ? { ...f, width, height } : f))
  }, [])

  const handleDeleteField = useCallback((id) => {
    setFields(prev => prev.filter(f => f.id !== id))
  }, [])

  // Field clicked — open signature modal
  const handleFieldClick = useCallback((field) => {
    if (field.signed) return
    // Check if the user selected themselves as this signer
    if (!selectedSignerId || field.signerId !== selectedSignerId) {
      const fieldSigner = signers.find(s => s.id === field.signerId)
      alert(`This field is assigned to ${fieldSigner?.name || 'another signer'}. Select yourself as "${fieldSigner?.name}" to sign it.`)
      return
    }
    setActiveField(field)
    setShowSigModal(true)
  }, [selectedSignerId, signers])

  // Signature applied
  const handleSignatureApplied = useCallback((dataUrl) => {
    if (!activeField) return
    const signer = signers.find(s => s.id === activeField.signerId)
    const now = new Date().toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      timeZoneName: 'short',
    })
    setFields(prev => prev.map(f =>
      f.id === activeField.id
        ? {
            ...f, signed: true, signatureDataUrl: dataUrl, signedAt: now,
            signedByName: signer?.name, signedByEmail: signer?.email,
          }
        : f
    ))
    setAuditEntries(prev => [...prev, createAuditEntry({
      signerName: signer?.name || 'Unknown',
      signerEmail: signer?.email || '',
      action: `Signature applied to field on page ${activeField.page}`,
    })])
    setShowSigModal(false)
    setActiveField(null)
  }, [activeField, signers])

  // Finalize
  const handleFinalize = useCallback(async () => {
    if (!pdfFile || fields.length === 0) return
    const unsignedFields = fields.filter(f => !f.signed)
    if (unsignedFields.length > 0) {
      const proceed = confirm(
        `${unsignedFields.length} field(s) are not signed yet. You can download now and share the PDF with other signers to sign their fields.\n\nContinue?`
      )
      if (!proceed) return
    }

    try {
      const pdfBytes = pdfFile.bytes instanceof Uint8Array
        ? pdfFile.bytes : new Uint8Array(pdfFile.arrayBuffer)

      const docHash = await hashDocument(pdfBytes.buffer)

      // Build per-signer summary
      const signerSummaries = signers.map(s => ({
        name: s.name,
        email: s.email,
        color: s.color,
        totalCount: fields.filter(f => f.signerId === s.id).length,
        signedCount: fields.filter(f => f.signerId === s.id && f.signed).length,
      }))

      const summary = buildAuditSummary({
        documentName: pdfFile.name,
        documentHash: docHash,
        signerName: signers.map(s => s.name).join(', '),
        signerEmail: signers.map(s => s.email).join(', '),
        fields,
        entries: [
          ...auditEntries,
          createAuditEntry({
            signerName: 'System',
            signerEmail: '',
            action: 'Document finalized and signed PDF generated',
          }),
        ],
      })
      summary.signers = signerSummaries

      const signedBytes = await embedSignatures({
        originalPdfBytes: pdfBytes,
        fields,
        auditSummary: summary,
        scale,
      })

      setSignedPdfBytes(signedBytes)
      setAuditSummary(summary)
      setStep(4)
    } catch (err) {
      console.error('Finalize error:', err)
      alert('Error generating signed PDF: ' + err.message)
    }
  }, [pdfFile, fields, signers, auditEntries, scale])

  // Download
  const handleDownload = useCallback(() => {
    if (!signedPdfBytes) return
    const name = pdfFile?.name?.replace('.pdf', '') || 'document'
    downloadPdf(signedPdfBytes, `${name}_signed.pdf`)
  }, [signedPdfBytes, pdfFile])

  // Start over
  const handleStartOver = useCallback(() => {
    setPdfFile(null)
    setPdfDoc(null)
    setTotalPages(0)
    setCurrentPage(1)
    setFields([])
    setSigners([])
    setSelectedSignerId(null)
    setAuditEntries([])
    setAuditSummary(null)
    setSignedPdfBytes(null)
    setStep(1)
    nextFieldId.current = 1
    nextSignerId.current = 1
  }, [])

  const hasFields = fields.length > 0
  const selectedSigner = signers.find(s => s.id === selectedSignerId)

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="app-logo">
          <div className="app-logo-icon">Q</div>
          <div>
            <h1>QuickSign</h1>
            <span>Free Document Signing</span>
          </div>
        </div>
        <div className="header-actions">
          {step >= 2 && step < 4 && (
            <>
              {selectedSigner && (
                <span
                  className="signer-pill"
                  style={{
                    background: `${selectedSigner.color}20`,
                    color: selectedSigner.color,
                    borderColor: selectedSigner.color,
                  }}
                >
                  <span className="dot" style={{ background: selectedSigner.color }} />
                  {selectedSigner.name}
                </span>
              )}
              {hasFields && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleFinalize}
                  id="finalize-btn"
                >
                  ✅ Finalize & Download
                </button>
              )}
            </>
          )}
        </div>
      </header>

      {/* Steps Bar */}
      <div className="steps-bar">
        {STEPS.map((s, i) => (
          <div key={s.num} style={{ display: 'flex', alignItems: 'center' }}>
            <div className={`step-item ${step === s.num ? 'active' : ''} ${step > s.num ? 'completed' : ''}`}>
              <div className="step-number">{step > s.num ? '✓' : s.num}</div>
              <span className="step-label">{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`step-connector ${step > s.num ? 'completed' : ''}`} />
            )}
          </div>
        ))}
      </div>

      {/* "I am signing as" bar */}
      {step >= 2 && step < 4 && signers.length > 0 && (
        <div className="who-signing-bar">
          <span className="label">I am signing as:</span>
          <div className="who-signing-pills">
            {signers.map(s => (
              <span
                key={s.id}
                className="signer-pill"
                onClick={() => setSelectedSignerId(s.id)}
                style={{
                  background: selectedSignerId === s.id ? `${s.color}30` : 'var(--bg-glass)',
                  color: selectedSignerId === s.id ? s.color : 'var(--text-muted)',
                  borderColor: selectedSignerId === s.id ? s.color : 'transparent',
                }}
              >
                <span className="dot" style={{ background: s.color }} />
                {s.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="app-main">
        {step === 1 && <UploadScreen onFileLoaded={handleFileLoaded} />}

        {(step === 2 || step === 3) && pdfDoc && (
          <PDFViewer
            pdf={pdfDoc}
            fields={fields}
            signers={signers}
            selectedSignerId={selectedSignerId}
            currentPage={currentPage}
            totalPages={totalPages}
            scale={scale}
            onPageChange={setCurrentPage}
            onScaleChange={setScale}
            onAddField={handleAddField}
            onMoveField={handleMoveField}
            onResizeField={handleResizeField}
            onDeleteField={handleDeleteField}
            onFieldClick={handleFieldClick}
            onAddSigner={handleAddSigner}
            onRemoveSigner={handleRemoveSigner}
          />
        )}

        {step === 4 && (
          <CompletionScreen
            auditSummary={auditSummary}
            signers={signers}
            onDownload={handleDownload}
            onStartOver={handleStartOver}
          />
        )}
      </main>

      {/* Signature Modal */}
      {showSigModal && (
        <SignatureModal
          onApply={handleSignatureApplied}
          onClose={() => { setShowSigModal(false); setActiveField(null) }}
        />
      )}
    </div>
  )
}
