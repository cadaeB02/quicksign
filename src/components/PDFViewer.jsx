import { useRef, useEffect, useState, useCallback } from 'react'
import { renderPdfPage, renderThumbnail } from '../utils/pdfUtils'
import SignatureField from './SignatureField'

export default function PDFViewer({
  pdf,
  fields,
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
}) {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })
  const thumbCanvasRefs = useRef({})

  // Render main page
  useEffect(() => {
    if (!pdf || !canvasRef.current) return
    renderPdfPage(pdf, currentPage, canvasRef.current, scale).then(setCanvasSize)
  }, [pdf, currentPage, scale])

  // Render thumbnails
  useEffect(() => {
    if (!pdf) return
    for (let i = 1; i <= totalPages; i++) {
      const canvas = thumbCanvasRefs.current[i]
      if (canvas) {
        renderThumbnail(pdf, i, canvas)
      }
    }
  }, [pdf, totalPages])

  const handleCanvasClick = useCallback((e) => {
    if (e.target !== canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    // Only add field if in "add" mode (handled by parent via onAddField)
  }, [])

  const handleAddFieldClick = () => {
    // Place a new field at the center of the visible canvas area
    const canvas = canvasRef.current
    if (!canvas) return
    const x = (canvasSize.width / 2) - 100
    const y = (canvasSize.height / 2) - 30
    onAddField({
      x: Math.max(0, x),
      y: Math.max(0, y),
      width: 200,
      height: 60,
      page: currentPage,
    })
  }

  const pageFields = fields.filter(f => f.page === currentPage)

  return (
    <div className="editor-layout">
      {/* Sidebar with page thumbnails */}
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
          <h3>Signature Fields</h3>
          <button
            className="btn btn-primary add-field-btn"
            onClick={handleAddFieldClick}
            style={{ width: '100%', justifyContent: 'center' }}
            id="add-field-btn"
          >
            ✍️ Add Signature Field
          </button>
          <p style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)' }}>
            Fields can be dragged and resized on the document
          </p>
        </div>
      </div>

      {/* Main canvas area */}
      <div className="editor-canvas-area">
        <div className="editor-toolbar">
          <div className="toolbar-group">
            <button
              className="btn btn-icon btn-sm"
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
            >
              ◀
            </button>
            <span className="page-display">
              {currentPage} / {totalPages}
            </span>
            <button
              className="btn btn-icon btn-sm"
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage >= totalPages}
            >
              ▶
            </button>

            <div className="toolbar-divider" />

            <button
              className="btn btn-icon btn-sm"
              onClick={() => onScaleChange(Math.max(0.5, scale - 0.25))}
            >
              −
            </button>
            <span className="zoom-display">{Math.round(scale * 100)}%</span>
            <button
              className="btn btn-icon btn-sm"
              onClick={() => onScaleChange(Math.min(3, scale + 0.25))}
            >
              +
            </button>
          </div>

          <div className="toolbar-group">
            <button
              className="btn btn-primary btn-sm add-field-btn"
              onClick={handleAddFieldClick}
              id="add-field-toolbar-btn"
            >
              ✍️ Add Field
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
