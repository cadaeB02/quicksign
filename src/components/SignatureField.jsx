import { useState, useRef, useEffect } from 'react'
import { IconPen, IconX, IconCalendar } from './Icons'

const SIGNER_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#ec4899', '#06b6d4']

export default function SignatureField({
  field,
  scale,
  signer,
  onMove,
  onResize,
  onDelete,
  onClick,
}) {
  const [dragging, setDragging] = useState(false)
  const [resizing, setResizing] = useState(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 })

  const color = signer?.color || SIGNER_COLORS[0]
  const isDate = field.type === 'date'

  const handleMouseDown = (e) => {
    if (e.target.closest('.delete-btn') || e.target.classList.contains('resize-handle')) return
    e.preventDefault()
    setDragging(true)
    dragStart.current = { x: e.clientX - field.x, y: e.clientY - field.y }
  }

  const handleResizeStart = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setResizing(true)
    resizeStart.current = { x: e.clientX, y: e.clientY, w: field.width, h: field.height }
  }

  useEffect(() => {
    if (!dragging) return
    const handleMove = (e) => {
      onMove(field.id, { x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y })
    }
    const handleUp = () => setDragging(false)
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    return () => { window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp) }
  }, [dragging, field.id, onMove])

  useEffect(() => {
    if (!resizing) return
    const handleMove = (e) => {
      const dx = e.clientX - resizeStart.current.x
      const dy = e.clientY - resizeStart.current.y
      onResize(field.id, {
        width: Math.max(30, resizeStart.current.w + dx),
        height: Math.max(15, resizeStart.current.h + dy),
      })
    }
    const handleUp = () => setResizing(false)
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    return () => { window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp) }
  }, [resizing, field.id, onResize])

  return (
    <div
      className={`signature-field ${field.signed ? 'signed' : ''} ${isDate ? 'date-field' : ''}`}
      style={{
        left: field.x,
        top: field.y,
        width: field.width,
        height: field.height,
        borderColor: field.signed ? 'var(--success)' : color,
        background: field.signed ? 'transparent' : `${color}10`,
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={() => onClick(field)}
      id={`sig-field-${field.id}`}
    >
      {signer && !field.signed && (
        <span className="signer-name-tag" style={{ background: color, color: 'white' }}>
          {signer.name} {isDate ? '(Date)' : ''}
        </span>
      )}

      {field.signed && isDate ? (
        <span className="date-stamp" style={{ fontSize: Math.min(field.height * 0.6, 18) }}>
          {field.dateValue}
        </span>
      ) : field.signed && field.signatureDataUrl ? (
        <img src={field.signatureDataUrl} alt="Signature" className="signature-image" draggable={false} />
      ) : (
        <div className="signature-field-label" style={{ color }}>
          <span className="icon">
            {isDate
              ? <IconCalendar size={Math.min(20, field.height * 0.5)} color={color} />
              : <IconPen size={Math.min(20, field.height * 0.5)} color={color} />
            }
          </span>
          <span style={{ fontSize: Math.min(13, field.height * 0.35) }}>
            {isDate ? 'Double-click for date' : 'Double-click to sign'}
          </span>
        </div>
      )}

      {!field.signed && (
        <>
          <button
            className="delete-btn"
            onClick={(e) => { e.stopPropagation(); onDelete(field.id) }}
            title="Remove field"
          >
            <IconX size={12} color="white" />
          </button>
          <div className="resize-handle" style={{ background: color }} onMouseDown={handleResizeStart} />
        </>
      )}
    </div>
  )
}
