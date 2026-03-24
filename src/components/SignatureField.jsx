import { useState, useRef, useEffect } from 'react'

export default function SignatureField({
  field,
  scale,
  onMove,
  onResize,
  onDelete,
  onClick,
}) {
  const [dragging, setDragging] = useState(false)
  const [resizing, setResizing] = useState(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 })

  // Drag handlers
  const handleMouseDown = (e) => {
    if (e.target.classList.contains('delete-btn') || e.target.classList.contains('resize-handle')) return
    e.preventDefault()
    setDragging(true)
    dragStart.current = {
      x: e.clientX - field.x,
      y: e.clientY - field.y,
    }
  }

  // Resize handlers
  const handleResizeStart = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setResizing(true)
    resizeStart.current = {
      x: e.clientX,
      y: e.clientY,
      w: field.width,
      h: field.height,
    }
  }

  useEffect(() => {
    if (!dragging) return
    const handleMove = (e) => {
      onMove(field.id, {
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y,
      })
    }
    const handleUp = () => setDragging(false)
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }
  }, [dragging, field.id, onMove])

  useEffect(() => {
    if (!resizing) return
    const handleMove = (e) => {
      const dx = e.clientX - resizeStart.current.x
      const dy = e.clientY - resizeStart.current.y
      onResize(field.id, {
        width: Math.max(120, resizeStart.current.w + dx),
        height: Math.max(50, resizeStart.current.h + dy),
      })
    }
    const handleUp = () => setResizing(false)
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }
  }, [resizing, field.id, onResize])

  return (
    <div
      className={`signature-field ${field.signed ? 'signed' : ''}`}
      style={{
        left: field.x,
        top: field.y,
        width: field.width,
        height: field.height,
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={() => onClick(field)}
      id={`sig-field-${field.id}`}
    >
      {field.signed && field.signatureDataUrl ? (
        <>
          <img
            src={field.signatureDataUrl}
            alt="Signature"
            className="signature-image"
            draggable={false}
          />
          {field.signedAt && (
            <span className="signature-timestamp">
              Signed: {field.signedAt}
            </span>
          )}
        </>
      ) : (
        <div className="signature-field-label">
          <span className="icon">✍️</span>
          <span>Double-click to sign</span>
        </div>
      )}

      {!field.signed && (
        <>
          <button
            className="delete-btn"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(field.id)
            }}
            title="Remove field"
          >
            ✕
          </button>
          <div className="resize-handle" onMouseDown={handleResizeStart} />
        </>
      )}
    </div>
  )
}
