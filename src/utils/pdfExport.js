import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { GROUPS } from '../data/formSchema'
import { calcGroupScore, calcFormScore, scoreLabel } from './scoring'
import { SABESP_LOGO_B64 } from './sabespLogo'

// ─── Colors
const BLUE      = [0, 70, 127]
const LIGHT_BG  = [235, 241, 250]
const WHITE     = [255, 255, 255]
const BLACK     = [0, 0, 0]
const GRAY_LINE = [180, 180, 180]
const GREEN     = [0, 128, 0]
const RED       = [200, 0, 0]
const DARK_GRAY = [80, 80, 80]

function dimLabel(val) {
  if (!val) return '—'
  if (typeof val === 'object') {
    const c = val.c || '—'
    const l = val.l || '—'
    return `${c} × ${l} m`
  }
  return String(val)
}

function evalLabel(val) {
  if (val === '1')  return '1'
  if (val === '0')  return '0'
  if (val === 'X')  return 'X'
  if (val == null)  return ''
  return String(val)
}

function evalTextColor(val) {
  if (val === '1') return GREEN
  if (val === '0') return RED
  return DARK_GRAY
}

function drawBox(doc, x, y, w, h, label, value, labelSize = 6, valueSize = 7) {
  doc.setDrawColor(...GRAY_LINE)
  doc.setLineWidth(0.2)
  doc.rect(x, y, w, h)
  doc.setFontSize(labelSize)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...DARK_GRAY)
  doc.text(label, x + 1, y + 3.5)
  doc.setFontSize(valueSize)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...BLACK)
  doc.text(String(value || ''), x + 1, y + h - 1.5, { maxWidth: w - 2 })
}

export async function generatePDF(state) {
  const { cabecalho, answers, justificativas, observacoes, fotos, skippedGroups = [] } = state
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const PW = 210
  const PH = 297
  const ML = 6
  const MR = 6
  const MT = 6
  const CW = PW - ML - MR   // 198mm content width

  let curY = MT

  // ══════════════════════════════════════════════
  // HEADER — title bar
  // ══════════════════════════════════════════════
  doc.setFillColor(...BLUE)
  doc.rect(ML, curY, CW, 7, 'F')
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...WHITE)
  doc.text('FORMULÁRIO DE CONFORMIDADE DA REPOSIÇÃO', PW / 2, curY + 5, { align: 'center' })
  curY += 7

  // ══════════════════════════════════════════════
  // HEADER FIELDS + LOGO
  // ══════════════════════════════════════════════
  const logoW = 22
  const logoH = 18
  const fieldsW = CW - logoW - 2
  const rowH = 6.5

  // Logo (top-right)
  try {
    doc.addImage(SABESP_LOGO_B64, 'PNG', ML + fieldsW + 2, curY + 1, logoW - 2, logoH - 2)
  } catch { /* skip if image fails */ }

  // Draw header fields (left side)
  const c = cabecalho
  const hFields = [
    ['nº Contrato / Descrição da Contratada Fiscalizada:', c.contrato_fiscalizada || '', fieldsW, rowH],
    ['Código e Descrição da Unidade Executante:', c.unidade_executante || '', fieldsW, rowH],
    ['Código e Descrição do TSS PAI', c.tss_pai || '', fieldsW * 0.6, rowH],
    ['nº OS:', c.num_os || '', fieldsW * 0.4, rowH, fieldsW * 0.6],
    ['Código e Descrição do TSE (Fiscalizado)', c.tse_fiscalizado || '', fieldsW * 0.6, rowH],
    ['PDE:', c.pde || '', fieldsW * 0.4, rowH, fieldsW * 0.6],
    ['Endereço Completo', c.endereco || '', fieldsW * 0.65, rowH],
    ['Data de Execução:', c.data_execucao || '', fieldsW * 0.35, rowH, fieldsW * 0.65],
  ]

  let fy = curY
  let prevOffset = 0
  hFields.forEach(([label, val, w, h, xOffset]) => {
    const x = ML + (xOffset || 0)
    if (!xOffset) {
      // new row
      prevOffset = 0
    }
    drawBox(doc, x, fy, w, h, label, val)
    if (xOffset) {
      // same row as previous
    } else {
      if (xOffset === undefined) fy += h
    }
    if (!xOffset && xOffset !== 0) fy += h
  })

  // Simpler approach — draw row by row
  fy = curY
  // Row 1: Contrato fiscalizada full width
  drawBox(doc, ML, fy, fieldsW, rowH, 'nº Contrato / Descrição da Contratada Fiscalizada:', c.contrato_fiscalizada || '')
  fy += rowH
  // Row 2: Unidade executante | nº Amostra
  drawBox(doc, ML, fy, fieldsW * 0.72, rowH, 'Código e Descrição da Unidade Executante:', c.unidade_executante || '')
  drawBox(doc, ML + fieldsW * 0.72, fy, fieldsW * 0.28, rowH, 'nº Amostra:', c.num_amostra || '')
  fy += rowH
  // Row 3: TSS PAI | Data amostra
  drawBox(doc, ML, fy, fieldsW * 0.72, rowH, 'Código e Descrição do TSS PAI', c.tss_pai || '')
  drawBox(doc, ML + fieldsW * 0.72, fy, fieldsW * 0.28, rowH, 'Data Amostra:', c.data_amostra || '')
  fy += rowH
  // Row 4: TSE | nº OS
  drawBox(doc, ML, fy, fieldsW * 0.72, rowH, 'Código e Descrição do TSE (Fiscalizado)', c.tse_fiscalizado || '')
  drawBox(doc, ML + fieldsW * 0.72, fy, fieldsW * 0.28, rowH, 'nº OS:', c.num_os || '')
  fy += rowH
  // Row 5: Endereço | PDE | Data execução
  drawBox(doc, ML, fy, fieldsW * 0.5, rowH, 'Endereço Completo', c.endereco || '')
  drawBox(doc, ML + fieldsW * 0.5, fy, fieldsW * 0.15, rowH, 'PDE:', c.pde || '')
  drawBox(doc, ML + fieldsW * 0.65, fy, fieldsW * 0.35, rowH, 'Data de Execução:', c.data_execucao || '')
  fy += rowH
  // Row 6: Bairro | Município | Coordenadas
  drawBox(doc, ML, fy, fieldsW * 0.28, rowH, 'Bairro', c.bairro || '')
  drawBox(doc, ML + fieldsW * 0.28, fy, fieldsW * 0.28, rowH, 'Município', c.municipio || '')
  drawBox(doc, ML + fieldsW * 0.56, fy, fieldsW * 0.44, rowH, 'Coordenadas GPS', c.coordenadas || '')
  fy += rowH
  // Row 7: Medidas | Contrato fiscalizadora | Fiscal
  drawBox(doc, ML, fy, fieldsW * 0.3, rowH, 'Medidas da Recomposição Informada:', c.medidas_recomposicao || '')
  drawBox(doc, ML + fieldsW * 0.3, fy, fieldsW * 0.5, rowH, 'nº Contrato / Descrição da Contratada Fiscalizadora:', c.contrato_fiscalizadora || '')
  drawBox(doc, ML + fieldsW * 0.8, fy, fieldsW * 0.2, rowH, 'Fiscal:', c.fiscal || '')
  fy += rowH

  curY = Math.max(fy, curY + logoH + 1)

  // ══════════════════════════════════════════════
  // PHOTOS SECTION
  // ══════════════════════════════════════════════
  const photosLabel = 'Fotos da Fiscalização (meramente ilustrativas, devem seguir os padrões estabelecidos nos procedimentos).'
  doc.setFillColor(...LIGHT_BG)
  doc.rect(ML, curY, CW, 5, 'F')
  doc.setDrawColor(...GRAY_LINE)
  doc.rect(ML, curY, CW, 5)
  doc.setFontSize(6)
  doc.setFont('helvetica', 'italic')
  doc.setTextColor(...DARK_GRAY)
  doc.text(photosLabel, ML + 1.5, curY + 3.5)
  curY += 5

  const photosToDraw = fotos.filter((f) => f.dataUrl).slice(0, 4)
  if (photosToDraw.length > 0) {
    const imgH = 22
    const imgW = Math.min(44, (CW - 2) / photosToDraw.length - 1)
    let px = ML + 1
    photosToDraw.forEach((foto) => {
      try {
        doc.addImage(foto.dataUrl, 'JPEG', px, curY + 0.5, imgW, imgH - 1)
      } catch { /* skip bad image */ }
      px += imgW + 1
    })
    curY += imgH
  } else {
    // Empty photo placeholder row
    doc.setDrawColor(...GRAY_LINE)
    doc.rect(ML, curY, CW, 18)
    doc.setFontSize(6)
    doc.setTextColor(180, 180, 180)
    doc.text('(sem fotos anexadas)', PW / 2, curY + 10, { align: 'center' })
    curY += 18
  }

  // ══════════════════════════════════════════════
  // EVALUATION TABLE
  // ══════════════════════════════════════════════
  doc.setFillColor(...BLUE)
  doc.rect(ML, curY, CW, 5, 'F')
  doc.setFontSize(6.5)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...WHITE)
  doc.text('Avaliação: 1-ATENDE, 0-NÃO ATENDE, X-NÃO AVALIADO e NÚMERO', PW / 2, curY + 3.5, { align: 'center' })
  curY += 5

  // Build all table rows across the 3 groups
  const tableBody = []

  for (const group of GROUPS) {
    const isSkipped = skippedGroups.includes(group.id)

    // Group header row
    tableBody.push([
      {
        content: group.label,
        colSpan: 4,
        styles: { fillColor: BLUE, textColor: WHITE, fontStyle: 'bold', fontSize: 7, cellPadding: 1.5 },
      },
    ])

    if (isSkipped) {
      tableBody.push([
        { content: '', styles: { cellPadding: 1 } },
        { content: '(grupo não vistoriado — todos os itens N/A)', colSpan: 2, styles: { textColor: DARK_GRAY, fontStyle: 'italic', fontSize: 6, cellPadding: 1 } },
        { content: '', styles: { cellPadding: 1 } },
      ])
    } else {
      group.items.forEach((item) => {
        const raw = answers[item.id]
        const isInfoType = item.peso === 0
        let displayVal = ''
        let textCol = BLACK

        if (item.type === 'dimensions') {
          displayVal = dimLabel(raw)
          textCol = DARK_GRAY
        } else if (isInfoType) {
          displayVal = raw || ''
          textCol = DARK_GRAY
        } else {
          displayVal = evalLabel(raw)
          textCol = evalTextColor(raw)
        }

        const obs = []
        if (justificativas[item.id]) obs.push(`Justif.: ${justificativas[item.id]}`)
        if (observacoes[item.id])   obs.push(`Obs.: ${observacoes[item.id]}`)

        tableBody.push([
          {
            content: item.id,
            styles: { halign: 'center', fontStyle: 'bold', fontSize: 6, cellPadding: 1 },
          },
          {
            content: item.text,
            styles: { fontSize: 6, cellPadding: 1 },
          },
          {
            content: displayVal,
            styles: { halign: 'center', fontStyle: 'bold', fontSize: 7, textColor: textCol, cellPadding: 1 },
          },
          {
            content: obs.join(' | ') || '',
            styles: { fontSize: 5.5, cellPadding: 1, textColor: DARK_GRAY },
          },
        ])
      })
    }

    // Conceito do Grupo row
    const score = isSkipped ? null : calcGroupScore(group.id, answers)
    const conceitoText = score
      ? `${score.achieved.toFixed(1)} / ${score.maxPossible} pts (${Math.round(score.ratio * 100)}%)`
      : 'N/A'
    const conceitoColor = score ? (score.ratio >= 0.8 ? GREEN : score.ratio >= 0.6 ? [180, 120, 0] : RED) : DARK_GRAY

    tableBody.push([
      {
        content: 'Conceito do Grupo:',
        colSpan: 2,
        styles: { fontStyle: 'bold', fontSize: 6.5, halign: 'right', fillColor: LIGHT_BG, cellPadding: 1.2 },
      },
      {
        content: conceitoText,
        colSpan: 2,
        styles: { fontStyle: 'bold', fontSize: 7, textColor: conceitoColor, fillColor: LIGHT_BG, cellPadding: 1.2 },
      },
    ])
  }

  autoTable(doc, {
    startY: curY,
    margin: { left: ML, right: MR },
    head: [[
      { content: 'Item', styles: { halign: 'center' } },
      { content: 'Item de Avaliação', styles: {} },
      { content: 'Avaliação', styles: { halign: 'center' } },
      { content: 'Observações', styles: {} },
    ]],
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: BLUE,
      textColor: WHITE,
      fontSize: 7,
      fontStyle: 'bold',
      cellPadding: 1.5,
    },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 120 },
      2: { cellWidth: 18 },
      3: { cellWidth: CW - 148 },
    },
    styles: { fontSize: 6, cellPadding: 1, overflow: 'linebreak', minCellHeight: 4 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  })

  curY = doc.lastAutoTable.finalY

  // ══════════════════════════════════════════════
  // CONCEITO DO FORMULÁRIO
  // ══════════════════════════════════════════════
  const formScore = calcFormScore(answers, skippedGroups)
  const ratioText = scoreLabel(formScore.ratio)
  const ptsText   = formScore.maxPossible > 0 ? `${formScore.achieved.toFixed(1)} / ${formScore.maxPossible} pts` : ''
  const finalColor = formScore.ratio !== null
    ? formScore.ratio >= 0.8 ? GREEN : formScore.ratio >= 0.6 ? [180, 120, 0] : RED
    : DARK_GRAY

  doc.setFillColor(...LIGHT_BG)
  doc.setDrawColor(...GRAY_LINE)
  const conceitoH = 7
  doc.rect(ML, curY, CW, conceitoH, 'FD')
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...BLACK)
  doc.text('Conceito do Formulário:', ML + 2, curY + 4.8)
  doc.setTextColor(...finalColor)
  doc.setFontSize(9)
  doc.text(`${ratioText}  ${ptsText}`, ML + 55, curY + 4.8)

  curY += conceitoH + 4

  // ══════════════════════════════════════════════
  // SIGNATURE
  // ══════════════════════════════════════════════
  if (curY + 12 < PH - 6) {
    doc.setDrawColor(...GRAY_LINE)
    doc.setLineWidth(0.3)
    doc.setFontSize(6.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...DARK_GRAY)
    // Fiscal line
    doc.line(ML, curY + 8, ML + 70, curY + 8)
    doc.text('Assinatura do Fiscal Responsável', ML, curY + 11.5)
    doc.setFont('helvetica', 'bold')
    doc.text(cabecalho.fiscal || '', ML, curY + 6.5)
    // Date line
    doc.setFont('helvetica', 'normal')
    doc.line(PW - MR - 45, curY + 8, PW - MR, curY + 8)
    doc.text('Data / Hora', PW - MR - 45, curY + 11.5)
    // Generated info
    doc.setFontSize(5.5)
    doc.setTextColor(160, 160, 160)
    doc.text(
      `Gerado em: ${new Date().toLocaleString('pt-BR')} — FCR Vistoria v1.1.0`,
      PW / 2, PH - 4,
      { align: 'center' }
    )
  }

  return doc
}
