/**
 * Branded N10 report-card PDF (jsPDF, white page, colored mark).
 * Letters only on skill rows (prev->now when prior exists) + overall glyph in the hero — Keep/Next/Stop/Overall prose stay ungraded.
 * Driving only — no PSI / sprocket / setup numbers.
 */
import { jsPDF } from 'jspdf'
import { formatLapTime } from './format'
import { splitLetter } from './grades'
import type { DriverSummary } from './summary'
import { KID_DESCS } from './summary'

/** Colored N10 mark (public/n10-mark.png), embedded so share works offline. */
const N10_MARK_PNG = 'data:image/png;base64,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'

const LIME = [200, 245, 66] as const // #c8f542
const LIME_BRIGHT = [200, 255, 0] as const // #c8ff00 overall glyph
const LIME_INK = [63, 98, 18] as const
const TEAL = [13, 148, 136] as const
const STOP = [190, 18, 60] as const
const INK = [10, 10, 10] as const
const SOFT = [82, 82, 82] as const
const MUTE = [115, 115, 115] as const
const RULE = [229, 229, 229] as const
const WASH = [250, 250, 250] as const

export type ReportPdfOpts = {
  /** Venue short name (e.g. Mosport) — no GPS coords. */
  trackLabel?: string
  /** Layout N / renamed label / Layout? — same string as in-app + TrackMap. */
  layoutLabel?: string
  dateLabel?: string
  /** Session type / class (e.g. Junior Light). */
  classLabel?: string
  /** Driver display name already in hero; optional chip for multi-page header row. */
  driverLabel?: string
}

export function buildReportCardPdf(summary: DriverSummary, opts?: ReportPdfOpts): Blob {
  const doc = new jsPDF({ unit: 'mm', format: 'letter' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 14
  const maxW = pageW - margin * 2
  const contentBottom = pageH - 18

  doc.setFillColor(255, 255, 255)
  doc.rect(0, 0, pageW, pageH, 'F')

  let y = margin

  // Brand strip
  try {
    doc.addImage(N10_MARK_PNG, 'PNG', margin, y - 1, 9, 9)
  } catch {
    /* optional */
  }
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setFillColor(LIME[0], LIME[1], LIME[2])
  doc.roundedRect(margin + 11, y, 12, 6.5, 1, 1, 'F')
  doc.setTextColor(LIME_INK[0], LIME_INK[1], LIME_INK[2])
  doc.text('N10', margin + 17, y + 4.6, { align: 'center' })
  doc.setFontSize(8)
  doc.setTextColor(MUTE[0], MUTE[1], MUTE[2])
  doc.text('PRIVATE SHARE', pageW - margin, y + 4.5, { align: 'right' })
  y += 11
  doc.setDrawColor(INK[0], INK[1], INK[2])
  doc.setLineWidth(0.6)
  doc.line(margin, y, pageW - margin, y)
  y += 8

  // Hero: name LEFT, overall glyph RIGHT
  const nameY = y + 2
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(28)
  doc.setTextColor(INK[0], INK[1], INK[2])
  doc.text(summary.name, margin, nameY + 8)

  if (summary.overall) {
    doc.setFontSize(7)
    doc.setTextColor(MUTE[0], MUTE[1], MUTE[2])
    doc.text('OVERALL SESSION GRADE', pageW - margin, nameY, { align: 'right' })
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(42)
    doc.setTextColor(LIME_BRIGHT[0], LIME_BRIGHT[1], LIME_BRIGHT[2])
    {
      const { base, suffix } = splitLetter(summary.overall)
      const pdfSuffix = suffix === '+' ? '+' : suffix ? '-' : ''
      const suffixW = 7 // mm reserved so bases share one x
      const letterRight = pageW - margin - suffixW
      doc.text(base, letterRight, nameY + 14, { align: 'right' })
      if (pdfSuffix) doc.text(pdfSuffix, letterRight + 1.2, nameY + 14, { align: 'left' })
    }
  }
  y = nameY + 16

  // Header row: date · session/class · driver · layout (same chip as in-app / TrackMap)
  const headerBits = [
    opts?.dateLabel,
    opts?.classLabel,
    opts?.driverLabel,
    opts?.layoutLabel || 'Layout?',
  ].filter(Boolean) as string[]
  // Venue short on the same row when present (layout chip is still first-class)
  const meta = [opts?.trackLabel, ...headerBits].filter(Boolean).join(' · ')
  if (meta) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(SOFT[0], SOFT[1], SOFT[2])
    doc.text(meta, margin, y)
    y += 6
  }

  const drawContinuingHeader = () => {
    // Compact header on continuation pages — layout chip always present
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(INK[0], INK[1], INK[2])
    doc.text(summary.name, margin, margin + 3)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(SOFT[0], SOFT[1], SOFT[2])
    const cont = [opts?.trackLabel, opts?.layoutLabel || 'Layout?', opts?.dateLabel, opts?.classLabel]
      .filter(Boolean)
      .join(' · ')
    if (cont) doc.text(cont, margin, margin + 8)
    doc.setDrawColor(RULE[0], RULE[1], RULE[2])
    doc.setLineWidth(0.3)
    doc.line(margin, margin + 11, pageW - margin, margin + 11)
  }

  if (summary.bestLap) {
    doc.setFillColor(WASH[0], WASH[1], WASH[2])
    doc.setDrawColor(RULE[0], RULE[1], RULE[2])
    doc.setLineWidth(0.3)
    doc.roundedRect(margin, y, maxW, 14, 2, 2, 'FD')
    doc.setFillColor(LIME[0], LIME[1], LIME[2])
    doc.rect(margin, y, 1.5, 14, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(MUTE[0], MUTE[1], MUTE[2])
    doc.text('YOUR BEST LAP', margin + 5, y + 5)
    doc.setFontSize(18)
    doc.setTextColor(INK[0], INK[1], INK[2])
    const lapStr = summary.bestLap.text.replace(/\s*(?:L|Lap)\s*\d+$/i, '').trim()
    doc.text(lapStr, margin + 5, y + 12)
    const lapW = doc.getTextWidth(lapStr) // measure at 18pt before shrinking
    doc.setFontSize(10)
    doc.setTextColor(SOFT[0], SOFT[1], SOFT[2])
    doc.text(`Lap ${summary.bestLap.lapNumber}`, margin + 5 + lapW + 3, y + 11.5)
    if (summary.theoreticalBest) {
      const right = pageW - margin - 4
      const gapBit = summary.theoreticalBest.gapText ? ` · ${summary.theoreticalBest.gapText}` : ''
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7)
      doc.setTextColor(MUTE[0], MUTE[1], MUTE[2])
      doc.text(`THEORETICAL BEST${gapBit}`, right, y + 5, { align: 'right' })
      doc.setFontSize(14)
      doc.setTextColor(INK[0], INK[1], INK[2])
      doc.text(formatLapTime(summary.theoreticalBest.ms), right, y + 12, { align: 'right' })
    }
    y += 18
  }

  const section = (
    title: string,
    body: string,
    accent: readonly [number, number, number],
    wash: boolean,
    extra?: string,
  ) => {
    const bodyLines = doc.splitTextToSize(body, maxW - 6) as string[]
    const drillLines = extra ? (doc.splitTextToSize(extra, maxW - 10) as string[]) : []
    const h = 5 + bodyLines.length * 4.4 + (extra ? 3 + 4 + drillLines.length * 4.2 + 4 : 2)
    if (y + h > contentBottom - 20) {
      doc.addPage()
      doc.setFillColor(255, 255, 255)
      doc.rect(0, 0, pageW, pageH, 'F')
      drawContinuingHeader()
      y = margin + 14
    }
    if (wash) {
      doc.setFillColor(WASH[0], WASH[1], WASH[2])
      doc.roundedRect(margin, y, maxW, h, 2, 2, 'F')
    }
    doc.setDrawColor(RULE[0], RULE[1], RULE[2])
    doc.setLineWidth(0.3)
    doc.roundedRect(margin, y, maxW, h, 2, 2, 'S')
    doc.setFillColor(accent[0], accent[1], accent[2])
    doc.rect(margin, y, 1.5, h, 'F')

    let yy = y + 4.5
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(accent[0], accent[1], accent[2])
    doc.text(title.toUpperCase(), margin + 5, yy)
    yy += 5
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(INK[0], INK[1], INK[2])
    for (const line of bodyLines) {
      doc.text(line, margin + 5, yy)
      yy += 4.4
    }
    if (extra) {
      yy += 1.5
      doc.setDrawColor(TEAL[0], TEAL[1], TEAL[2])
      doc.setFillColor(255, 255, 255)
      doc.setLineWidth(0.5)
      const dh = 4 + drillLines.length * 4.2 + 2
      doc.roundedRect(margin + 5, yy - 3, maxW - 10, dh, 1.5, 1.5, 'FD')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7)
      doc.setTextColor(TEAL[0], TEAL[1], TEAL[2])
      doc.text('YOUR DRILL', margin + 8, yy)
      yy += 4
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(INK[0], INK[1], INK[2])
      for (const line of drillLines) {
        doc.text(line, margin + 8, yy)
        yy += 4.2
      }
    }
    y += h + 3
  }

  const startTitle = summary.badDay ? 'Next focus' : 'Start doing'
  section('Keep doing', summary.keep.text, LIME_INK, false)
  section(startTitle, summary.start.text, TEAL, true, summary.start.drill)
  section('Stop doing', summary.stop.text, STOP, false)
  section('Overall', summary.overallSentence, INK, true)

  const rows = [...summary.face, ...summary.more, ...summary.fromVideo]
  if (rows.length && y < contentBottom - 28) {
    const showPrevLegend = rows.some((s) => s.prevLetter != null)
    doc.setDrawColor(RULE[0], RULE[1], RULE[2])
    doc.setLineWidth(0.3)
    doc.line(margin, y, pageW - margin, y)
    y += 5
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(MUTE[0], MUTE[1], MUTE[2])
    const cls = opts?.classLabel ? ` · ${opts.classLabel}` : ''
    doc.text(`SKILLS · THIS SESSION${cls}`.toUpperCase(), margin, y)
    if (showPrevLegend) {
      y += 3.5
      doc.setFontSize(7)
      doc.setTextColor(MUTE[0], MUTE[1], MUTE[2])
      // ASCII arrow — Helvetica cannot draw U+2192
      doc.text('prev -> now', margin, y)
    }
    y += 5

    const colW = (maxW - 10) / 2
    const rowH = 11
    let col = 0
    let rowY = y
    // Wider strip when any row shows prev->now so left-col grades never sit on right-col labels
    const gradeStrip = showPrevLegend ? 22 : 12

    /** Draw one letter grade right-aligned into a fixed letter+suffix slot (ASCII +/- only). */
    const drawGradeLetter = (
      letter: string,
      gradeRight: number,
      yy: number,
      size: number,
      color: readonly [number, number, number],
      suffixW: number,
      letterSlot: number,
    ) => {
      const { base, suffix } = splitLetter(letter)
      const pdfSuffix = suffix === '+' ? '+' : suffix ? '-' : ''
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(size)
      doc.setTextColor(color[0], color[1], color[2])
      const letterCenter = gradeRight - suffixW - letterSlot / 2
      doc.text(base, letterCenter, yy, { align: 'center' })
      if (pdfSuffix) doc.text(pdfSuffix, gradeRight - suffixW + 0.4, yy, { align: 'left' })
    }

    for (const r of rows) {
      if (rowY + rowH > contentBottom - 10) {
        doc.addPage()
        doc.setFillColor(255, 255, 255)
        doc.rect(0, 0, pageW, pageH, 'F')
        drawContinuingHeader()
        y = margin + 14
        rowY = y
        col = 0
      }
      const gutter = 10
      const x = margin + col * (colW + gutter)
      const textW = colW - gradeStrip
      const desc = KID_DESCS[r.dimId] ?? r.why ?? ''
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9.5)
      doc.setTextColor(INK[0], INK[1], INK[2])
      const labelLines = doc.splitTextToSize(r.label, textW) as string[]
      doc.text(labelLines[0] ?? '', x, rowY + 3.5)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      doc.setTextColor(SOFT[0], SOFT[1], SOFT[2])
      const dLines = doc.splitTextToSize(desc, textW) as string[]
      doc.text(dLines[0] ?? '', x, rowY + 7.5)

      // Helvetica cannot draw U+2212 / U+2192; use ASCII - and -> so we never get a " glyph
      const gradeRight = x + colW
      if (!r.letter) {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(12)
        doc.setTextColor(LIME_INK[0], LIME_INK[1], LIME_INK[2])
        doc.text('N/A', gradeRight, rowY + 4.5, { align: 'right' })
      } else if (r.prevLetter) {
        // Current letter at the right (lime), prev soft to its left with "->"
        const currSuffixW = 3.2
        const currLetterSlot = 4.5
        drawGradeLetter(r.letter, gradeRight, rowY + 4.5, 12, LIME_INK, currSuffixW, currLetterSlot)
        const arrowRight = gradeRight - currSuffixW - currLetterSlot - 0.8
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(8)
        doc.setTextColor(MUTE[0], MUTE[1], MUTE[2])
        doc.text('->', arrowRight, rowY + 4.3, { align: 'right' })
        const prevRight = arrowRight - 4.2
        drawGradeLetter(r.prevLetter, prevRight, rowY + 4.5, 10, SOFT, 2.8, 3.8)
      } else {
        // Fixed letter slot so C and C- share the same letter center; +/- hangs in suffix slot
        drawGradeLetter(r.letter, gradeRight, rowY + 4.5, 12, LIME_INK, 3.2, 4.5)
      }
      if (r.estimate && r.letter) {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(6.5)
        doc.setTextColor(MUTE[0], MUTE[1], MUTE[2])
        doc.text('est.', gradeRight, rowY + 8.5, { align: 'right' })
      }

      col += 1
      if (col > 1) {
        col = 0
        rowY += rowH
      }
    }
    y = rowY + (col === 0 ? 0 : rowH) + 4
  }

  if (y > contentBottom - 6) y = contentBottom - 6
  doc.setDrawColor(RULE[0], RULE[1], RULE[2])
  doc.setLineWidth(0.3)
  doc.line(margin, y, pageW - margin, y)
  y += 4
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(MUTE[0], MUTE[1], MUTE[2])
  doc.text('N10 coach · Driving only · No setup numbers · Opt-in private PDF', margin, y)
  doc.text(summary.share.fileName, pageW - margin, y, { align: 'right' })

  return doc.output('blob')
}

export async function shareReportCardPdf(
  summary: DriverSummary,
  opts?: ReportPdfOpts,
): Promise<'shared' | 'saved' | 'cancelled'> {
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
