import { useRef, useEffect, useState, useCallback } from 'react'
import { renderPdfPage, renderThumbnail } from '../utils/pdfUtils'
import SignatureField from './SignatureField'
import { IconPen, IconCalendar, IconChevronLeft, IconChevronRight, IconMinus, IconPlus, IconX } from './Icons'

export default function PDFViewer({
  pdf,
  fields,
  signers,
  selectedSignerId,
  currentPage,
  totalPages,
  scale,
  onPageChange,
  onScaleChange,
  onAddField,
  onMoveField,
  onResizeField,
  onDeleteField,
  onFieldClick,
  onAddSigner,
  onRemoveSigner,
}) {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })
  const thumbCanvasRefs = useRef({})
  const [newSignerName, setNewSignerName] = useState('')
  const [newSignerEmail, setNewSignerEmail] = useState('')

  useEffect(() => {
    if (!pdf || !canvasRef.current) return
    renderPdfPage(pdf, currentPage, canvasRef.current, scale).then(setCanvasSize)
  }, [pdf, currentPage, scale])

  useEffect(() => {
    if (!pdf) return
    for (let i = 1; i <= totalPages; i++) {
      const canvas = thumbCanvasRefs.current[i]
      if (canvas) renderThumbnail(pdf, i, canvas)
    }
  }, [pdf, totalPages])

  const handleCanvasClick = useCallback((e) => {
    if (e.target !== canvasRef.current) return
  }, [])

  const handleAddFieldClick = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (!selectedSignerId && signers.length > 0) {
      alert('Please select who this signature field is for using the "I am signing as" bar.')
      return
    }
    if (signers.length === 0) {
      alert('Please add at least one signer in the sidebar first.')
      return
    }
    const x = (canvasSize.width / 2) - 100
    const y = (canvasSize.height / 2) - 30
    onAddField({
      x: Math.max(0, x),
      y: Math.max(0, y),
      width: 200,
      height: 60,
      page: currentPage,
      signerId: selectedSignerId,
      type: 'signature',
    })
  }

  const handleAddDateClick = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (!selectedSignerId && signers.length > 0) {
      alert('Please select who this date field is for using the "I am signing as" bar.')
      return
    }
    if (signers.length === 0) {
      alert('Please add at least one signer in the sidebar first.')
      return
    }
    const x = (canvasSize.width / 2) - 60
    const y = (canvasSize.height / 2) - 12
    onAddField({
      x: Math.max(0, x),
      y: Math.max(0, y),
      width: 120,
      height: 28,
      page: currentPage,
      signerId: selectedSignerId,
      type: 'date',
    })
  }

  const handleAddSigner = () => {
    if (!newSignerName.trim()) return
    onAddSigner({ name: newSignerName.trim(), email: newSignerEmail.trim() })
    setNewSignerName('')
    setNewSignerEmail('')
  }

  const pageFields = fields.filter(f => f.page === currentPage)

  return (
    <div className="editor-layout">
      <div className="editor-sidebar">
        <div className="sidebar-section">
          <h3>Pages</h3>
          <div className="page-thumbnails">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => {
              const fieldCount = fields.filter(f => f.page === pageNum).length
              return (
                <div
                  key={pageNum}
                  className={`page-thumb ${currentPage === pageNum ? 'active' : ''}`}
                  onClick={() => onPageChange(pageNum)}
                >
                  <div className="page-thumb-preview">
                    <canvas ref={el => thumbCanvasRefs.current[pageNum] = el} />
                  </div>
                  <div className="page-thumb-info">
                    Page {pageNum}
                    <small>
                      {fieldCount > 0
                        ? `${fieldCount} field${fieldCount > 1 ? 's' : ''}`
                        : 'No fields'}
                    </small>
                  </div>
                  {fieldCount > 0 && (
                    <span className="badge badge-accent" style={{ marginLeft: 'auto' }}>
                      {fieldCount}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="sidebar-section">
          <h3>Signers</h3>
          <div className="signer-list">
            {signers.map(s => {
              const signerFieldCount = fields.filter(f => f.signerId === s.id).length
              return (
                <div key={s.id} className={`signer-item ${selectedSignerId === s.id ? 'active' : ''}`}>
                  <div className="signer-dot" style={{ background: s.color }} />
                  <div className="signer-item-info">
                    <div className="signer-item-name">{s.name}</div>
                    {s.email && <div className="signer-item-email">{s.email}</div>}
                  </div>
                  <span className="signer-item-fields">{signerFieldCount} fields</span>
                  <button
                    className="signer-remove-btn"
                    onClick={() => onRemoveSigner(s.id)}
                    title="Remove signer"
                  ><IconX size={10} /></button>
                </div>
              )
            })}
          </div>
          <div className="add-signer-inline">
            <input
              placeholder="Name"
              value={newSignerName}
              onChange={e => setNewSignerName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddSigner()}
            />
            <input
              placeholder="Email"
              value={newSignerEmail}
              onChange={e => setNewSignerEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddSigner()}
            />
            <button className="btn btn-secondary btn-sm" onClick={handleAddSigner}>
              <IconPlus size={14} />
            </button>
          </div>
        </div>

        <div className="sidebar-section">
          <h3>Signature Fields</h3>
          <button
            className="btn btn-primary add-field-btn"
            onClick={handleAddFieldClick}
            style={{ width: '100%', justifyContent: 'center' }}
            id="add-field-btn"
          >
            <IconPen size={14} /> Add Signature Field
          </button>
          <button
            className="btn btn-secondary add-field-btn"
            onClick={handleAddDateClick}
            style={{ width: '100%', justifyContent: 'center', marginTop: 6 }}
            id="add-date-btn"
          >
            <IconCalendar size={14} /> Add Date Field
          </button>
          <p style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)' }}>
            Fields are assigned to the currently selected signer
          </p>
        </div>
      </div>

      <div className="editor-canvas-area">
        <div className="editor-toolbar">
          <div className="toolbar-group">
            <button
              className="btn btn-icon btn-sm"
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
            ><IconChevronLeft size={16} /></button>
            <span className="page-display">{currentPage} / {totalPages}</span>
            <button
              className="btn btn-icon btn-sm"
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage >= totalPages}
            ><IconChevronRight size={16} /></button>

            <div className="toolbar-divider" />

            <button className="btn btn-icon btn-sm" onClick={() => onScaleChange(Math.max(0.5, scale - 0.25))}>
              <IconMinus size={16} />
            </button>
            <span className="zoom-display">{Math.round(scale * 100)}%</span>
            <button className="btn btn-icon btn-sm" onClick={() => onScaleChange(Math.min(3, scale + 0.25))}>
              <IconPlus size={16} />
            </button>
          </div>

          <div className="toolbar-group">
            <button
              className="btn btn-primary btn-sm add-field-btn"
              onClick={handleAddFieldClick}
              id="add-field-toolbar-btn"
            >
              <IconPen size={14} /> Signature
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleAddDateClick}
              id="add-date-toolbar-btn"
            >
              <IconCalendar size={14} /> Date
            </button>
          </div>
        </div>

        <div className="editor-canvas-wrapper" ref={containerRef}>
          <div
            className="pdf-page-container"
            style={{
              width: canvasSize.width || 'auto',
              height: canvasSize.height || 'auto',
            }}
          >
            <canvas ref={canvasRef} onClick={handleCanvasClick} />
            {pageFields.map(field => (
              <SignatureField
                key={field.id}
                field={field}
                scale={scale}
                signer={signers.find(s => s.id === field.signerId)}
                onMove={onMoveField}
                onResize={onResizeField}
                onDelete={onDeleteField}
                onClick={onFieldClick}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
