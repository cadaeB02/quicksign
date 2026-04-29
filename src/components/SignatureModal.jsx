import { useState, useRef, useEffect } from 'react'
import SignaturePad from 'signature_pad'
import { IconPen, IconKeyboard, IconUpload, IconX } from './Icons'

export default function SignatureModal({ onApply, onClose }) {
  const [activeTab, setActiveTab] = useState('draw')
  const [typedName, setTypedName] = useState('')
  const [uploadedImage, setUploadedImage] = useState(null)
  const canvasRef = useRef(null)
  const sigPadRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (activeTab === 'draw' && canvasRef.current && !sigPadRef.current) {
      const canvas = canvasRef.current
      canvas.width = canvas.offsetWidth
      canvas.height = 160
      sigPadRef.current = new SignaturePad(canvas, {
        backgroundColor: 'rgba(0, 0, 0, 0)',
        penColor: '#1a1a2e',
        minWidth: 1.5,
        maxWidth: 3,
      })
    }
    return () => {
      if (sigPadRef.current) {
        sigPadRef.current.off()
        sigPadRef.current = null
      }
    }
  }, [activeTab])

  const handleClear = () => {
    if (sigPadRef.current) sigPadRef.current.clear()
  }

  const handleApply = () => {
    let dataUrl = null

    if (activeTab === 'draw') {
      if (!sigPadRef.current || sigPadRef.current.isEmpty()) {
        alert('Please draw your signature first.')
        return
      }
      dataUrl = sigPadRef.current.toDataURL('image/png')
    } else if (activeTab === 'type') {
      if (!typedName.trim()) {
        alert('Please type your name.')
        return
      }
      const canvas = document.createElement('canvas')
      canvas.width = 400
      canvas.height = 120
      const ctx = canvas.getContext('2d')
      // Transparent background — no fillRect
      ctx.fillStyle = '#1a1a2e'
      ctx.font = '48px "Dancing Script", cursive'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(typedName, 200, 60)
      dataUrl = canvas.toDataURL('image/png')
    } else if (activeTab === 'upload') {
      if (!uploadedImage) {
        alert('Please upload a signature image.')
        return
      }
      dataUrl = uploadedImage
    }

    onApply(dataUrl)
  }

  const handleUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setUploadedImage(ev.target.result)
    reader.readAsDataURL(file)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create Your Signature</h2>
          <button className="modal-close" onClick={onClose}><IconX size={18} /></button>
        </div>

        <div className="modal-body">
          <div className="sig-tabs">
            <button
              className={`sig-tab ${activeTab === 'draw' ? 'active' : ''}`}
              onClick={() => setActiveTab('draw')}
            >
              <IconPen size={14} /> Draw
            </button>
            <button
              className={`sig-tab ${activeTab === 'type' ? 'active' : ''}`}
              onClick={() => setActiveTab('type')}
            >
              <IconKeyboard size={14} /> Type
            </button>
            <button
              className={`sig-tab ${activeTab === 'upload' ? 'active' : ''}`}
              onClick={() => setActiveTab('upload')}
            >
              <IconUpload size={14} /> Upload
            </button>
          </div>

          {activeTab === 'draw' && (
            <div className="sig-draw-area">
              <canvas ref={canvasRef} style={{ height: 160, background: 'rgba(255,255,255,0.05)', border: '1px dashed var(--border-subtle)' }} />
              {sigPadRef.current?.isEmpty() !== false && (
                <span className="sig-draw-hint">Draw your signature here</span>
              )}
              <button className="sig-clear-btn" onClick={handleClear}>
                Clear
              </button>
            </div>
          )}

          {activeTab === 'type' && (
            <div>
              <input
                type="text"
                className="sig-type-input"
                placeholder="Type your full name"
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                autoFocus
                id="sig-type-input"
              />
              {typedName && (
                <div className="sig-type-preview">
                  <span>{typedName}</span>
                </div>
              )}
            </div>
          )}

          {activeTab === 'upload' && (
            <div>
              <div
                className="sig-upload-area"
                onClick={() => fileInputRef.current?.click()}
              >
                <span style={{ display: 'block', marginBottom: 8 }}><IconUpload size={32} color="var(--text-muted)" /></span>
                <p style={{ color: 'var(--text-muted)' }}>
                  Click to upload a signature image (PNG, JPG)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  style={{ display: 'none' }}
                  onChange={handleUpload}
                />
              </div>
              {uploadedImage && (
                <div className="sig-upload-preview">
                  <img src={uploadedImage} alt="Uploaded signature" />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleApply} id="apply-signature-btn">
            Apply Signature
          </button>
        </div>
      </div>
    </div>
  )
}
