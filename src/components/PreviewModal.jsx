import { useRef, useEffect, useState } from 'react'
import { loadPdf, renderPdfPage } from '../utils/pdfUtils'
import { IconX, IconChevronLeft, IconChevronRight } from './Icons'

export default function PreviewModal({ pdfBytes, onClose }) {
  const canvasRef = useRef(null)
  const [pdfDoc, setPdfDoc] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!pdfBytes) return
    setLoading(true)
    loadPdf(new Uint8Array(pdfBytes)).then(pdf => {
      setPdfDoc(pdf)
      setTotalPages(pdf.numPages)
      setCurrentPage(1)
      setLoading(false)
    }).catch(err => {
      console.error('Preview load error:', err)
      setLoading(false)
    })
  }, [pdfBytes])

  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return
    renderPdfPage(pdfDoc, currentPage, canvasRef.current, 1.5)
  }, [pdfDoc, currentPage])

  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
        <div className="preview-header">
          <h2>PDF Preview</h2>
          <div className="preview-controls">
            {totalPages > 1 && (
              <div className="preview-nav">
                <button
                  className="btn btn-icon btn-sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                >
                  <IconChevronLeft size={16} />
                </button>
                <span className="page-display">{currentPage} / {totalPages}</span>
                <button
                  className="btn btn-icon btn-sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                >
                  <IconChevronRight size={16} />
                </button>
              </div>
            )}
            <button className="modal-close" onClick={onClose}>
              <IconX size={18} />
            </button>
          </div>
        </div>
        <div className="preview-body">
          {loading ? (
            <div className="preview-loading">Generating preview…</div>
          ) : (
            <canvas ref={canvasRef} className="preview-canvas" />
          )}
        </div>
      </div>
    </div>
  )
}
