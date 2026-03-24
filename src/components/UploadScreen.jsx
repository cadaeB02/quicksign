import { useRef, useState } from 'react'
import { IconDocument, IconPen, IconShield, IconZap, IconUpload as IconUploadIcon, IconUsers, IconMousePointer, IconCheckCircle, IconSend } from './Icons'

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
          <span className="upload-icon"><IconDocument size={48} color="var(--accent-light)" /></span>
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
            <span className="upload-feature-icon"><IconPen size={24} color="var(--accent-light)" /></span>
            <h4>Draw or Type</h4>
            <p>Create your signature by drawing, typing, or uploading an image</p>
          </div>
          <div className="upload-feature">
            <span className="upload-feature-icon"><IconShield size={24} color="var(--success)" /></span>
            <h4>Legally Binding</h4>
            <p>ESIGN Act &amp; UETA compliant with full audit trail</p>
          </div>
          <div className="upload-feature">
            <span className="upload-feature-icon"><IconZap size={24} color="var(--warning)" /></span>
            <h4>100% Free</h4>
            <p>No sign-up, no limits. Everything runs in your browser</p>
          </div>
        </div>

        {/* How It Works */}
        <div className="how-it-works">
          <h3>How It Works</h3>
          <div className="steps-guide">
            <div className="guide-step">
              <div className="guide-step-num"><IconUploadIcon size={16} /></div>
              <div className="guide-step-content">
                <h4>Upload Your PDF</h4>
                <p>Drag & drop or browse to upload the document you need signed.</p>
              </div>
            </div>
            <div className="guide-step">
              <div className="guide-step-num"><IconUsers size={16} /></div>
              <div className="guide-step-content">
                <h4>Add Signers</h4>
                <p>In the sidebar, type each signer's name and email. Each person gets a unique color.</p>
              </div>
            </div>
            <div className="guide-step">
              <div className="guide-step-num"><IconMousePointer size={16} /></div>
              <div className="guide-step-content">
                <h4>Place Signature Fields</h4>
                <p>Select a signer from the "I am signing as" bar, then click "Add Signature Field" to place fields on the document.</p>
              </div>
            </div>
            <div className="guide-step">
              <div className="guide-step-num"><IconPen size={16} /></div>
              <div className="guide-step-content">
                <h4>Sign Your Fields</h4>
                <p>Double-click your fields to sign. Draw, type, or upload your signature.</p>
              </div>
            </div>
            <div className="guide-step">
              <div className="guide-step-num"><IconCheckCircle size={16} /></div>
              <div className="guide-step-content">
                <h4>Finalize & Download</h4>
                <p>Click "Finalize & Download" to embed your signatures into the PDF with timestamps and an audit trail.</p>
              </div>
            </div>
            <div className="guide-step">
              <div className="guide-step-num"><IconSend size={16} /></div>
              <div className="guide-step-content">
                <h4>Share for More Signatures</h4>
                <p>Send the PDF to the next signer. They open this site, upload the PDF, add themselves, sign their fields, and send it back.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
