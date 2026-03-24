import { useState } from 'react'

export default function SignerInfoForm({ onSubmit, initialValues }) {
  const [name, setName] = useState(initialValues?.name || '')
  const [email, setEmail] = useState(initialValues?.email || '')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) {
      alert('Please enter your name.')
      return
    }
    if (!email.trim() || !email.includes('@')) {
      alert('Please enter a valid email address.')
      return
    }
    onSubmit({ name: name.trim(), email: email.trim() })
  }

  return (
    <form className="signer-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="signer-name">Full Name *</label>
        <input
          id="signer-name"
          type="text"
          placeholder="John Doe"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="signer-email">Email Address *</label>
        <input
          id="signer-email"
          type="email"
          placeholder="john@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <button type="submit" className="btn btn-primary" style={{ width: '100%' }} id="save-signer-btn">
        Save & Continue
      </button>
    </form>
  )
}
