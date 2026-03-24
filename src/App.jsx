import { useState, useCallback, useRef } from 'react'
import UploadScreen from './components/UploadScreen'
import PDFViewer from './components/PDFViewer'
import SignatureModal from './components/SignatureModal'
import SignerInfoForm from './components/SignerInfoForm'
import CompletionScreen from './components/CompletionScreen'
import { loadPdf, embedSignatures, downloadPdf } from './utils/pdfUtils'
import { hashDocument, createAuditEntry, buildAuditSummary } from './utils/auditTrail'

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
  const [signerInfo, setSignerInfo] = useState(null)
  const [showSignerForm, setShowSignerForm] = useState(false)
  const [activeField, setActiveField] = useState(null)
  const [showSigModal, setShowSigModal] = useState(false)
  const [auditEntries, setAuditEntries] = useState([])
  const [auditSummary, setAuditSummary] = useState(null)
  const [signedPdfBytes, setSignedPdfBytes] = useState(null)

  const nextFieldId = useRef(1)

  // Step 1: File uploaded
  const handleFileLoaded = useCallback(async (file) => {
    // IMPORTANT: Store a copy of the bytes BEFORE passing to pdf.js,
    // because pdf.js may transfer/detach the ArrayBuffer
    const bytesCopy = new Uint8Array(file.arrayBuffer).slice()
    const fileWithBytes = { ...file, bytes: bytesCopy }
    setPdfFile(fileWithBytes)
    const pdf = await loadPdf(new Uint8Array(file.arrayBuffer))
    setPdfDoc(pdf)
    setTotalPages(pdf.numPages)
    setCurrentPage(1)
    setStep(2)
    // Ask for signer info immediately
    setShowSignerForm(true)
  }, [])

  // Signer info submitted
  const handleSignerSubmit = useCallback((info) => {
    setSignerInfo(info)
    setShowSignerForm(false)
    setAuditEntries(prev => [...prev, createAuditEntry({
      signerName: info.name,
      signerEmail: info.email,
      action: 'Document opened and signer identified',
    })])
  }, [])

  // Add signature field
  const handleAddField = useCallback(({ x, y, width, height, page }) => {
    const id = nextFieldId.current++
    setFields(prev => [...prev, {
      id,
      x,
      y,
      width,
      height,
      page,
      signed: false,
      signatureDataUrl: null,
      signedAt: null,
    }])
  }, [])

  // Move field
  const handleMoveField = useCallback((id, { x, y }) => {
    setFields(prev => prev.map(f => f.id === id ? { ...f, x, y } : f))
  }, [])

  // Resize field
  const handleResizeField = useCallback((id, { width, height }) => {
    setFields(prev => prev.map(f => f.id === id ? { ...f, width, height } : f))
  }, [])

  // Delete field
  const handleDeleteField = useCallback((id) => {
    setFields(prev => prev.filter(f => f.id !== id))
  }, [])

  // Field clicked — open signature modal
  const handleFieldClick = useCallback((field) => {
    if (field.signed) return
    if (!signerInfo) {
      setShowSignerForm(true)
      return
    }
    setActiveField(field)
    setShowSigModal(true)
  }, [signerInfo])

  // Signature applied
  const handleSignatureApplied = useCallback((dataUrl) => {
    if (!activeField) return
    const now = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short',
    })
    setFields(prev => prev.map(f =>
      f.id === activeField.id
        ? { ...f, signed: true, signatureDataUrl: dataUrl, signedAt: now }
        : f
    ))
    setAuditEntries(prev => [...prev, createAuditEntry({
      signerName: signerInfo.name,
      signerEmail: signerInfo.email,
      action: `Signature applied to field on page ${activeField.page}`,
    })])
    setShowSigModal(false)
    setActiveField(null)
  }, [activeField, signerInfo])

  // Finalize — embed signatures into PDF
  const handleFinalize = useCallback(async () => {
    if (!pdfFile || fields.length === 0) return
    const unsignedFields = fields.filter(f => !f.signed)
    if (unsignedFields.length > 0) {
      const proceed = confirm(
        `${unsignedFields.length} field(s) are not signed. Continue without signing them?`
      )
      if (!proceed) return
    }

    try {
      const pdfBytes = pdfFile.bytes instanceof Uint8Array
        ? pdfFile.bytes
        : new Uint8Array(pdfFile.arrayBuffer)

      const docHash = await hashDocument(pdfBytes.buffer)
      const summary = buildAuditSummary({
        documentName: pdfFile.name,
        documentHash: docHash,
        signerName: signerInfo?.name,
        signerEmail: signerInfo?.email,
        fields,
        entries: [
          ...auditEntries,
          createAuditEntry({
            signerName: signerInfo?.name,
            signerEmail: signerInfo?.email,
            action: 'Document finalized and signed PDF generated',
          }),
        ],
      })

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
  }, [pdfFile, fields, signerInfo, auditEntries, scale])

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
    setSignerInfo(null)
    setAuditEntries([])
    setAuditSummary(null)
    setSignedPdfBytes(null)
    setShowSignerForm(false)
    setStep(1)
    nextFieldId.current = 1
  }, [])

  const allFieldsSigned = fields.length > 0 && fields.every(f => f.signed)
  const hasFields = fields.length > 0

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
              {!signerInfo && (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowSignerForm(true)}
                >
                  👤 Add Signer Info
                </button>
              )}
              {signerInfo && (
                <span className="badge badge-success" style={{ padding: '6px 12px' }}>
                  👤 {signerInfo.name}
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
            <div
              className={`step-item ${step === s.num ? 'active' : ''} ${step > s.num ? 'completed' : ''}`}
            >
              <div className="step-number">
                {step > s.num ? '✓' : s.num}
              </div>
              <span className="step-label">{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`step-connector ${step > s.num ? 'completed' : ''}`} />
            )}
          </div>
        ))}
      </div>

      {/* Main Content */}
      <main className="app-main">
        {step === 1 && <UploadScreen onFileLoaded={handleFileLoaded} />}

        {(step === 2 || step === 3) && pdfDoc && (
          <PDFViewer
            pdf={pdfDoc}
            fields={fields}
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
          />
        )}

        {step === 4 && (
          <CompletionScreen
            auditSummary={auditSummary}
            onDownload={handleDownload}
            onStartOver={handleStartOver}
          />
        )}
      </main>

      {/* Signer Info Modal */}
      {showSignerForm && (
        <div className="modal-overlay" onClick={() => setShowSignerForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Your Information</h2>
              <button className="modal-close" onClick={() => setShowSignerForm(false)}>✕</button>
            </div>
            <SignerInfoForm onSubmit={handleSignerSubmit} initialValues={signerInfo} />
          </div>
        </div>
      )}

      {/* Signature Modal */}
      {showSigModal && (
        <SignatureModal
          onApply={handleSignatureApplied}
          onClose={() => {
            setShowSigModal(false)
            setActiveField(null)
          }}
        />
      )}
    </div>
  )
}
