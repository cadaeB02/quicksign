import * as pdfjsLib from 'pdfjs-dist'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString()

/**
 * Load a PDF document from an ArrayBuffer
 */
export async function loadPdf(arrayBuffer) {
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  return pdf
}

/**
 * Render a PDF page onto a canvas
 */
export async function renderPdfPage(pdf, pageNum, canvas, scale = 1.5) {
  const page = await pdf.getPage(pageNum)
  const viewport = page.getViewport({ scale })
  canvas.width = viewport.width
  canvas.height = viewport.height
  const ctx = canvas.getContext('2d')
  await page.render({ canvasContext: ctx, viewport }).promise
  return { width: viewport.width, height: viewport.height }
}

/**
 * Render a thumbnail for a page
 */
export async function renderThumbnail(pdf, pageNum, canvas, maxWidth = 40) {
  const page = await pdf.getPage(pageNum)
  const viewport = page.getViewport({ scale: 1 })
  const scale = maxWidth / viewport.width
  const scaledViewport = page.getViewport({ scale })
  canvas.width = scaledViewport.width
  canvas.height = scaledViewport.height
  const ctx = canvas.getContext('2d')
  await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise
}

/**
 * Embed signatures into the PDF and add an audit trail page
 */
export async function embedSignatures({ originalPdfBytes, fields, auditSummary, scale = 1.5 }) {
  const pdfDoc = await PDFDocument.load(originalPdfBytes)
  const pages = pdfDoc.getPages()

  // Embed each signature into the PDF
  for (const field of fields) {
    if (!field.signed || !field.signatureDataUrl) continue

    const page = pages[field.page - 1]
    if (!page) continue

    const { width: pageWidth, height: pageHeight } = page.getSize()

    // Convert signature data URL to image
    const sigImageBytes = await fetch(field.signatureDataUrl).then(res => res.arrayBuffer())
    let sigImage
    if (field.signatureDataUrl.includes('image/png')) {
      sigImage = await pdfDoc.embedPng(sigImageBytes)
    } else {
      sigImage = await pdfDoc.embedJpg(sigImageBytes)
    }

    // Convert field position from canvas coords (scaled) to PDF coords
    const pdfX = (field.x / scale)
    const pdfY = pageHeight - (field.y / scale) - (field.height / scale)
    const pdfWidth = field.width / scale
    const pdfHeight = field.height / scale

    page.drawImage(sigImage, {
      x: pdfX,
      y: pdfY,
      width: pdfWidth,
      height: pdfHeight,
    })

    // Draw timestamp below signature
    if (field.signedAt) {
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
      const timestampText = `Signed: ${field.signedAt}`
      page.drawText(timestampText, {
        x: pdfX,
        y: pdfY - 12,
        size: 7,
        font,
        color: rgb(0.4, 0.4, 0.4),
      })
    }
  }

  // Add audit trail page
  if (auditSummary) {
    const auditPage = pdfDoc.addPage([612, 792]) // US Letter
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    let y = 740

    // Title
    auditPage.drawText('Certificate of Completion', {
      x: 50, y, size: 20, font: boldFont, color: rgb(0.1, 0.1, 0.1)
    })
    y -= 10

    // Divider line
    auditPage.drawLine({
      start: { x: 50, y },
      end: { x: 562, y },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    })
    y -= 25

    const drawRow = (label, value) => {
      auditPage.drawText(label, {
        x: 50, y, size: 10, font: boldFont, color: rgb(0.3, 0.3, 0.3)
      })
      auditPage.drawText(value || 'N/A', {
        x: 200, y, size: 10, font, color: rgb(0.1, 0.1, 0.1)
      })
      y -= 18
    }

    drawRow('Document:', auditSummary.documentName)
    drawRow('Document Hash:', auditSummary.documentHash?.substring(0, 32) + '...')
    drawRow('Signer Name:', auditSummary.signerName)
    drawRow('Signer Email:', auditSummary.signerEmail)
    drawRow('Signed Fields:', `${auditSummary.signedFields} of ${auditSummary.totalFields}`)
    drawRow('Completed At:', auditSummary.completedAtFormatted)

    y -= 10
    auditPage.drawLine({
      start: { x: 50, y },
      end: { x: 562, y },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    })
    y -= 25

    auditPage.drawText('Audit Trail', {
      x: 50, y, size: 14, font: boldFont, color: rgb(0.1, 0.1, 0.1)
    })
    y -= 20

    if (auditSummary.entries) {
      for (const entry of auditSummary.entries) {
        if (y < 60) break
        auditPage.drawText(`• ${entry.action}`, {
          x: 60, y, size: 9, font: boldFont, color: rgb(0.2, 0.2, 0.2)
        })
        y -= 14
        auditPage.drawText(`  ${entry.timestampFormatted}  |  ${entry.signerName} (${entry.signerEmail})`, {
          x: 60, y, size: 8, font, color: rgb(0.4, 0.4, 0.4)
        })
        y -= 14
        auditPage.drawText(`  Timezone: ${entry.timezone}`, {
          x: 60, y, size: 8, font, color: rgb(0.5, 0.5, 0.5)
        })
        y -= 18
      }
    }

    // Footer
    auditPage.drawText('This document was signed electronically using QuickSign. Electronic signatures are', {
      x: 50, y: 50, size: 7, font, color: rgb(0.5, 0.5, 0.5)
    })
    auditPage.drawText('legally binding under the ESIGN Act and UETA.', {
      x: 50, y: 40, size: 7, font, color: rgb(0.5, 0.5, 0.5)
    })
  }

  const signedPdfBytes = await pdfDoc.save()
  return signedPdfBytes
}

/**
 * Trigger a download of the signed PDF
 */
export function downloadPdf(pdfBytes, filename) {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
