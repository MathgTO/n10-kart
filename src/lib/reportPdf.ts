/**
 * Build a school-report-card PDF (blob) for the native share sheet.
 * Letters only on the per-dimension rows — Keep / Start / Stop / Overall stay prose.
 */
import { jsPDF } from 'jspdf'
import type { DriverSummary } from './summary'

function wrap(doc: jsPDF, text: string, x: number, y: number, maxW: number, lineH = 5.2): number {
  const lines = doc.splitTextToSize(text, maxW) as string[]
  for (const line of lines) {
    doc.text(line, x, y)
    y += lineH
  }
  return y
}

export function buildReportCardPdf(summary: DriverSummary, opts?: { trackLabel?: string; dateLabel?: string }): Blob {
  const doc = new jsPDF({ unit: 'mm', format: 'letter' })
  const pageW = doc.internal.pageSize.getWidth()
  const margin = 16
  const maxW = pageW - margin * 2
  let y = 18

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(summary.title, margin, y)
  y += 7
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  const sub = [opts?.trackLabel, opts?.dateLabel].filter(Boolean).join(' · ')
  if (sub) {
    doc.setTextColor(80)
    doc.text(sub, margin, y)
    doc.setTextColor(0)
    y += 6
  }
  doc.setFontSize(9)
  doc.setTextColor(90)
  doc.text(summary.kid ? 'Driving only · Dad owns the kart checklist' : 'Driving only · setup is on the tuner card', margin, y)
  doc.setTextColor(0)
  y += 8

  const section = (title: string, body: string, extra?: string) => {
    if (y > 250) {
      doc.addPage()
      y = 18
    }
    doc.setDrawColor(180)
    doc.setLineWidth(0.3)
    doc.line(margin, y, pageW - margin, y)
    y += 6
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text(title.toUpperCase(), margin, y)
    y += 5.5
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    y = wrap(doc, body, margin, y, maxW)
    if (extra) {
      y += 1.5
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.text('Your drill', margin, y)
      y += 4.5
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      y = wrap(doc, extra, margin, y, maxW)
    }
    y += 3
  }

  const startTitle = summary.badDay ? 'Next focus' : 'Start doing'
  section('Keep doing', summary.keep.text)
  section(startTitle, summary.start.text, summary.start.drill)
  section('Stop doing', summary.stop.text)
  section('Overall summary', summary.overallSentence)

  if (y > 230) {
    doc.addPage()
    y = 18
  }
  doc.setDrawColor(180)
  doc.line(margin, y, pageW - margin, y)
  y += 6
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('REPORT CARD', margin, y)
  y += 7

  const rows = [...summary.face, ...summary.more, ...summary.fromVideo]
  doc.setFontSize(10)
  for (const r of rows) {
    if (y > 270) {
      doc.addPage()
      y = 18
    }
    doc.setFont('helvetica', 'normal')
    const grade = r.letter ? `${r.letter}${r.estimate ? ' (est.)' : ''}` : 'N/A'
    doc.text(r.label, margin, y)
    doc.setFont('helvetica', 'bold')
    doc.text(grade, pageW - margin, y, { align: 'right' })
    y += 5
    if (r.why) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(90)
      y = wrap(doc, r.why, margin, y, maxW - 20, 4)
      doc.setTextColor(0)
      doc.setFontSize(10)
    }
    y += 1.5
  }

  y += 4
  if (y > 270) {
    doc.addPage()
    y = 18
  }
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(8)
  doc.setTextColor(120)
  doc.text('N10 coach · draft report card · driving only', margin, y)

  return doc.output('blob')
}

export async function shareReportCardPdf(summary: DriverSummary, opts?: { trackLabel?: string; dateLabel?: string }): Promise<'shared' | 'saved' | 'cancelled'> {
  const blob = buildReportCardPdf(summary, opts)
  const file = new File([blob], summary.share.fileName, { type: 'application/pdf' })
  const nav = typeof navigator !== 'undefined' ? navigator : undefined
  const canFileShare = !!nav && typeof nav.canShare === 'function' && nav.canShare({ files: [file] })
  if (canFileShare && typeof nav!.share === 'function') {
    try {
      await nav!.share({ files: [file], title: summary.share.pdfTitle })
      return 'shared'
    } catch (e) {
      if ((e as { name?: string })?.name === 'AbortError') return 'cancelled'
    }
  }
  // Fallback: trigger a local download so the user still gets the PDF (then they can attach it themselves).
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = summary.share.fileName
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
  return 'saved'
}
