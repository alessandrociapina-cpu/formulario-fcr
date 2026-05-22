import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { GROUPS, CABECALHO_FIELDS } from '../data/formSchema'
import { calcGroupScore, calcFormScore, scoreLabel } from './scoring'

const BLUE = [30, 64, 175]
const LIGHT_BLUE = [219, 234, 254]
const GREEN = [5, 150, 105]
const RED = [220, 38, 38]
const AMBER = [217, 119, 6]
const GRAY = [100, 116, 139]

function evalLabel(val) {
  if (val === '1') return 'ATENDE'
  if (val === '0') return 'NÃO ATENDE'
  if (val === 'X') return 'N/A'
  return val ?? '—'
}

function evalColor(val) {
  if (val === '1') return GREEN
  if (val === '0') return RED
  if (val === 'X') return GRAY
  return GRAY
}

function groupColorHeader(color) {
  if (color === 'blue') return BLUE
  if (color === 'emerald') return [6, 95, 70]
  if (color === 'amber') return [120, 53, 15]
  return BLUE
}

export async function generatePDF(state) {
  const { cabecalho, answers, justificativas, observacoes, fotos } = state
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210
  const MARGIN = 12
  const CONTENT = W - MARGIN * 2

  // ─── Header title
  doc.setFillColor(...BLUE)
  doc.rect(0, 0, W, 18, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('FORMULÁRIO DE CONFORMIDADE DA REPOSIÇÃO', W / 2, 7, { align: 'center' })
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, W / 2, 13, { align: 'center' })
  doc.setTextColor(0, 0, 0)

  // ─── Header fields
  const headerRows = []
  CABECALHO_FIELDS.forEach((f) => {
    const val = cabecalho[f.id] || '—'
    headerRows.push([{ content: f.label, styles: { fontStyle: 'bold', fontSize: 7 } }, { content: val, fontSize: 8 }])
  })

  autoTable(doc, {
    startY: 21,
    margin: { left: MARGIN, right: MARGIN },
    body: headerRows,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: { 0: { cellWidth: 70, fontStyle: 'bold', fillColor: [241, 245, 249] }, 1: { cellWidth: CONTENT - 70 } },
  })

  // ─── Photos
  const photosByPage = fotos.filter((f) => f.dataUrl)
  if (photosByPage.length > 0) {
    doc.addPage()
    doc.setFillColor(...BLUE)
    doc.rect(0, 0, W, 10, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('FOTOS DA FISCALIZAÇÃO', MARGIN, 7)
    doc.setTextColor(0, 0, 0)

    const thumbW = 56
    const thumbH = 42
    const cols = 3
    const gap = 4
    let startX = MARGIN
    let startY = 15

    for (let i = 0; i < photosByPage.length; i++) {
      const col = i % cols
      const row = Math.floor(i / cols)
      const x = startX + col * (thumbW + gap)
      const y = startY + row * (thumbH + 10)

      if (y + thumbH + 10 > 285) {
        doc.addPage()
        startY = 15
        doc.setFillColor(...BLUE)
        doc.rect(0, 0, W, 10, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(9)
        doc.text('FOTOS DA FISCALIZAÇÃO (cont.)', MARGIN, 7)
        doc.setTextColor(0, 0, 0)
      }

      try {
        doc.addImage(photosByPage[i].dataUrl, 'JPEG', x, y, thumbW, thumbH)
        doc.setFontSize(6)
        doc.setFont('helvetica', 'normal')
        const caption = photosByPage[i].name || `Foto ${i + 1}`
        doc.text(caption, x, y + thumbH + 3, { maxWidth: thumbW })
        if (photosByPage[i].lat && photosByPage[i].lon) {
          doc.text(`GPS: ${photosByPage[i].lat.toFixed(5)}, ${photosByPage[i].lon.toFixed(5)}`, x, y + thumbH + 7, { maxWidth: thumbW })
        }
      } catch { /* skip bad image */ }
    }
  }

  // ─── Groups
  for (const group of GROUPS) {
    doc.addPage()
    const hColor = groupColorHeader(group.color)
    doc.setFillColor(...hColor)
    doc.rect(0, 0, W, 14, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text(group.label, MARGIN, 8)
    if (group.sublabel) {
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.text(group.sublabel, MARGIN, 12.5)
    }
    doc.setTextColor(0, 0, 0)

    const tableBody = group.items.map((item) => {
      const val = answers[item.id]
      const isEval = item.type === 'eval'
      const label = isEval || item.type === 'quality' ? evalLabel(val) : (val || '—')
      const obs = []
      if (justificativas[item.id]) obs.push(`Justificativa: ${justificativas[item.id]}`)
      if (observacoes[item.id]) obs.push(`Obs: ${observacoes[item.id]}`)
      return [
        { content: item.id, styles: { halign: 'center', fontStyle: 'bold', fontSize: 7 } },
        { content: item.text, styles: { fontSize: 7 } },
        { content: item.peso > 0 ? String(item.peso) : '—', styles: { halign: 'center', fontSize: 7 } },
        {
          content: label,
          styles: {
            halign: 'center',
            fontStyle: 'bold',
            fontSize: 8,
            textColor: isEval ? evalColor(val) : [0, 0, 0],
          },
        },
        { content: obs.join('\n') || '—', styles: { fontSize: 6 } },
      ]
    })

    autoTable(doc, {
      startY: 17,
      margin: { left: MARGIN, right: MARGIN },
      head: [['Item', 'Descrição', 'Peso', 'Avaliação', 'Observações']],
      body: tableBody,
      theme: 'grid',
      headStyles: { fillColor: hColor, textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 90 },
        2: { cellWidth: 10 },
        3: { cellWidth: 26 },
        4: { cellWidth: CONTENT - 136 },
      },
      styles: { cellPadding: 2, overflow: 'linebreak' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    })

    const score = calcGroupScore(group.id, answers)
    const scoreText = score
      ? `Conceito do Grupo: ${score.achieved.toFixed(1)} / ${score.maxPossible} pontos (${Math.round(score.ratio * 100)}%)`
      : 'Conceito do Grupo: Grupo não avaliado (N/A)'

    const finalY = doc.lastAutoTable.finalY + 4
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...(score && score.ratio >= 0.8 ? GREEN : score && score.ratio >= 0.6 ? AMBER : RED))
    doc.text(scoreText, MARGIN, finalY)
    doc.setTextColor(0, 0, 0)
  }

  // ─── Summary page
  doc.addPage()
  doc.setFillColor(...BLUE)
  doc.rect(0, 0, W, 14, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('RESUMO DE PONTUAÇÃO', MARGIN, 9)
  doc.setTextColor(0, 0, 0)

  const formScore = calcFormScore(answers)
  const summaryBody = GROUPS.map((g) => {
    const s = formScore.groupScores.find((gs) => gs.id === g.id)?.score
    return [
      g.label,
      s ? String(s.achieved.toFixed(1)) : '—',
      s ? String(s.maxPossible) : '—',
      s ? `${Math.round(s.ratio * 100)}%` : 'N/A',
    ]
  })

  autoTable(doc, {
    startY: 17,
    margin: { left: MARGIN, right: MARGIN },
    head: [['Grupo', 'Pontos Obtidos', 'Pontos Máx.', 'Conceito']],
    body: summaryBody,
    theme: 'striped',
    headStyles: { fillColor: BLUE, textColor: [255, 255, 255], fontSize: 9 },
    styles: { fontSize: 9 },
  })

  const totalY = doc.lastAutoTable.finalY + 8
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  const totalLabel = `CONCEITO DO FORMULÁRIO: ${formScore.achieved.toFixed(1)} / ${formScore.maxPossible} pontos — ${scoreLabel(formScore.ratio)}`
  const tColor = formScore.ratio !== null && formScore.ratio >= 0.8 ? GREEN : formScore.ratio !== null && formScore.ratio >= 0.6 ? AMBER : RED
  doc.setTextColor(...tColor)
  doc.text(totalLabel, MARGIN, totalY)
  doc.setTextColor(0, 0, 0)

  // Signature line
  const sigY = totalY + 30
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.line(MARGIN, sigY, MARGIN + 70, sigY)
  doc.text('Fiscal Responsável', MARGIN, sigY + 4)
  doc.text(cabecalho.fiscal || '', MARGIN, sigY + 9)
  doc.line(W - MARGIN - 50, sigY, W - MARGIN, sigY)
  doc.text('Data / Hora', W - MARGIN - 50, sigY + 4)

  return doc
}
