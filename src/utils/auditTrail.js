// Audit trail utilities for legal compliance

/**
 * Generate a SHA-256 hash of the PDF file bytes
 */
export async function hashDocument(pdfBytes) {
  const hashBuffer = await crypto.subtle.digest('SHA-256', pdfBytes)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Create an audit trail entry for a signature event
 */
export function createAuditEntry({ signerName, signerEmail, action }) {
  return {
    signerName,
    signerEmail,
    action,
    timestamp: new Date().toISOString(),
    timestampFormatted: new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short',
    }),
    userAgent: navigator.userAgent,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }
}

/**
 * Build a complete audit trail summary
 */
export function buildAuditSummary({ documentName, documentHash, signerName, signerEmail, fields, entries }) {
  return {
    documentName,
    documentHash,
    signerName,
    signerEmail,
    totalFields: fields.length,
    signedFields: fields.filter(f => f.signed).length,
    entries,
    completedAt: new Date().toISOString(),
    completedAtFormatted: new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short',
    }),
  }
}
