import { useRef, useState } from 'react'

export default function UploadScreen({ onFileLoaded }) {
  const fileInputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)

  const handleFile = (file) => {
    if (!file || file.type !== 'application/pdf') {
      alert('Please upload a valid PDF file.')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      onFileLoaded({
        name: file.name,
        arrayBuffer: e.target.result,
        bytes: new Uint8Array(e.target.result),
      })
    }
    reader.readAsArrayBuffer(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    handleFile(file)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => setDragOver(false)

  return (
    <div className="upload-screen">
      <div className="upload-container">
        <div className="upload-hero">
          <h2>Sign Documents for Free</h2>
          <p>
            Upload your PDF, place signature fields, sign, and download — 
            all in your browser. No account required. Legally compliant.
          </p>
        </div>

        <div
          className={`upload-dropzone ${dragOver ? 'drag-over' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          id="upload-dropzone"
        >
          <span className="upload-icon">📄</span>
          <h3>Drop your PDF here</h3>
          <p>
            or <span className="browse-link">browse files</span> to upload
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="upload-file-input"
            onChange={(e) => handleFile(e.target.files[0])}
            id="file-input"
          />
        </div>

        <div className="upload-features">
          <div className="upload-feature">
            <span className="upload-feature-icon">✍️</span>
            <h4>Draw or Type</h4>
            <p>Create your signature by drawing, typing, or uploading an image</p>
          </div>
          <div className="upload-feature">
            <span className="upload-feature-icon">🔒</span>
            <h4>Legally Binding</h4>
            <p>ESIGN Act &amp; UETA compliant with full audit trail</p>
          </div>
          <div className="upload-feature">
            <span className="upload-feature-icon">⚡</span>
            <h4>100% Free</h4>
            <p>No sign-up, no limits. Everything runs in your browser</p>
          </div>
        </div>
      </div>
    </div>
  )
}
