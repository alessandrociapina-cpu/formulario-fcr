import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { GROUPS } from '../data/formSchema'
import { calcGroupScore, calcFormScore, scoreLabel } from './scoring'
import { SABESP_LOGO_B64 } from './sabespLogo'

// ─── Color palette
const BLUE       = [0, 70, 127]
const LIGHT_BG   = [235, 241, 250]
const WHITE      = [255, 255, 255]
const BLACK      = [0, 0, 0]
const GRAY_LINE  = [190, 190, 190]
const GREEN      = [0, 120, 0]
const RED_C      = [190, 0, 0]
const DARK_GRAY  = [80, 80, 80]
const AMBER      = [160, 100, 0]

// ─── Image compression helpers

// Convert any dataUrl to JPEG at given quality and max dimension
function compressToJpeg(dataUrl, maxPx = 600, quality = 0.50) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const ratio = Math.min(maxPx / img.width, maxPx / img.height, 1)
      const canvas = document.createElement('canvas')
      canvas.width  = Math.round(img.width  * ratio)
      canvas.height = Math.round(img.height * ratio)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => resolve(null)
    img.src = dataUrl
  })
}

// Convert PNG base64 (no prefix) to small JPEG dataUrl for PDF embedding
function pngB64ToJpeg(b64, maxPx = 400, quality = 0.65) {
  return compressToJpeg(`data:image/png;base64,${b64}`, maxPx, quality)
}

// ─── Helpers
function dimLabel(val) {
  if (!val) return ''
  if (typeof val === 'object') return `${val.c || '—'} × ${val.l || '—'} m`
  return String(val)
}

function evalLabel(val) {
  if (val === '1') return '1'
  if (val === '0') return '0'
  if (val === 'X') return 'X'
  return val != null ? String(val) : ''
}

function evalTextColor(val) {
  if (val === '1') return GREEN
  if (val === '0') return RED_C
  return DARK_GRAY
}

// Draw a labelled box (border + small label + bold value)
function cell(doc, x, y, w, h, label, value) {
  doc.setDrawColor(...GRAY_LINE)
  doc.setLineWidth(0.2)
  doc.rect(x, y, w, h)

  // label (tiny, gray)
  doc.setFontSize(5.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...DARK_GRAY)
  doc.text(label, x + 1, y + 3, { maxWidth: w - 2 })

  // value (bold, black)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...BLACK)
  const v = String(value || '')
  doc.text(v, x + 1, y + h - 1.8, { maxWidth: w - 2 })
}

// Add image maintaining aspect ratio inside a bounding box, centered
function addImageFit(doc, dataUrl, fmt, bx, by, bw, bh) {
  try {
    const props = doc.getImageProperties(dataUrl)
    const srcRatio = props.width / props.height
    let dw = bw
    let dh = bw / srcRatio
    if (dh > bh) { dh = bh; dw = bh * srcRatio }
    const ox = bx + (bw - dw) / 2
    const oy = by + (bh - dh) / 2
    doc.addImage(dataUrl, fmt, ox, oy, dw, dh)
  } catch { /* skip bad image */ }
}

export async function generatePDF(state) {
  const { cabecalho, answers, justificativas, observacoes, fotos, skippedGroups = [] } = state

  // Pre-compress images BEFORE creating jsPDF to minimise PDF size
  const [logoJpeg, ...compressedPhotos] = await Promise.all([
    pngB64ToJpeg(SABESP_LOGO_B64, 400, 0.65),
    ...fotos.filter((f) => f.dataUrl).slice(0, 4).map((f) => compressToJpeg(f.dataUrl, 500, 0.45)),
  ])

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const PW   = 210
  const ML   = 7
  const MR   = 7
  const MT   = 7
  const CW   = PW - ML - MR   // 196 mm

  let curY = MT

  // ══════════════════════════════════════════════════
  // TITLE BAR
  // ══════════════════════════════════════════════════
  doc.setFillColor(...BLUE)
  doc.rect(ML, curY, CW, 7, 'F')
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...WHITE)
  doc.text('FORMULÁRIO DE CONFORMIDADE DA REPOSIÇÃO', PW / 2, curY + 4.8, { align: 'center' })
  curY += 7

  // ══════════════════════════════════════════════════
  // HEADER FIELDS + LOGO
  // Logo ratio W/H = 0.7181 (portrait)
  // Reserve a column on the right for the logo
  // ══════════════════════════════════════════════════
  const LOGO_RATIO = 0.7181
  const ROW_H      = 6.5
  const N_ROWS     = 7
  const HEADER_H   = ROW_H * N_ROWS   // 45.5 mm

  // Logo fits in a reserved strip on the right
  const LOGO_AREA_W = 22             // mm reserved for logo
  const LOGO_AREA_H = HEADER_H
  const FIELDS_W    = CW - LOGO_AREA_W - 1  // 1 mm gap

  // Calculate logo display dimensions maintaining ratio
  let logoDispW = LOGO_AREA_W - 2
  let logoDispH = logoDispW / LOGO_RATIO
  if (logoDispH > LOGO_AREA_H - 2) {
    logoDispH = LOGO_AREA_H - 2
    logoDispW = logoDispH * LOGO_RATIO
  }
  const logoX = ML + FIELDS_W + 1 + (LOGO_AREA_W - logoDispW) / 2
  const logoY = curY + (LOGO_AREA_H - logoDispH) / 2

  const c = cabecalho
  let fy = curY

  // Row 1 — Contrato fiscalizada (full fields width)
  cell(doc, ML, fy, FIELDS_W, ROW_H, 'nº Contrato / Descrição da Contratada Fiscalizada:', c.contrato_fiscalizada || '')
  fy += ROW_H

  // Row 2 — Unidade executante | nº Amostra
  cell(doc, ML,                    fy, FIELDS_W * 0.72, ROW_H, 'Código e Descrição da Unidade Executante:', c.unidade_executante || '')
  cell(doc, ML + FIELDS_W * 0.72,  fy, FIELDS_W * 0.28, ROW_H, 'nº Amostra:', c.num_amostra || '')
  fy += ROW_H

  // Row 3 — TSS PAI | Data amostra
  cell(doc, ML,                    fy, FIELDS_W * 0.72, ROW_H, 'Código e Descrição do TSS PAI:', c.tss_pai || '')
  cell(doc, ML + FIELDS_W * 0.72,  fy, FIELDS_W * 0.28, ROW_H, 'Data Amostra:', c.data_amostra || '')
  fy += ROW_H

  // Row 4 — TSE | nº OS
  cell(doc, ML,                    fy, FIELDS_W * 0.72, ROW_H, 'Código e Descrição do TSE (Fiscalizado):', c.tse_fiscalizado || '')
  cell(doc, ML + FIELDS_W * 0.72,  fy, FIELDS_W * 0.28, ROW_H, 'nº OS:', c.num_os || '')
  fy += ROW_H

  // Row 5 — Endereço | PDE | Data execução
  cell(doc, ML,                     fy, FIELDS_W * 0.52, ROW_H, 'Endereço Completo:', c.endereco || '')
  cell(doc, ML + FIELDS_W * 0.52,   fy, FIELDS_W * 0.14, ROW_H, 'PDE:', c.pde || '')
  cell(doc, ML + FIELDS_W * 0.66,   fy, FIELDS_W * 0.34, ROW_H, 'Data de Execução:', c.data_execucao || '')
  fy += ROW_H

  // Row 6 — Bairro | Município | Coordenadas
  cell(doc, ML,                     fy, FIELDS_W * 0.26, ROW_H, 'Bairro:', c.bairro || '')
  cell(doc, ML + FIELDS_W * 0.26,   fy, FIELDS_W * 0.26, ROW_H, 'Município:', c.municipio || '')
  cell(doc, ML + FIELDS_W * 0.52,   fy, FIELDS_W * 0.48, ROW_H, 'Coordenadas GPS:', c.coordenadas || '')
  fy += ROW_H

  // Row 7 — Medidas | Contrato fiscalizadora | Fiscal
  cell(doc, ML,                     fy, FIELDS_W * 0.28, ROW_H, 'Medidas da Recomposição Informada:', c.medidas_recomposicao || '')
  cell(doc, ML + FIELDS_W * 0.28,   fy, FIELDS_W * 0.52, ROW_H, 'nº Contrato / Descrição da Contratada Fiscalizadora:', c.contrato_fiscalizadora || '')
  cell(doc, ML + FIELDS_W * 0.80,   fy, FIELDS_W * 0.20, ROW_H, 'Fiscal:', c.fiscal || '')
  fy += ROW_H

  // Draw logo AFTER all cells (on top, no border) — uses pre-compressed JPEG
  if (logoJpeg) {
    try { addImageFit(doc, logoJpeg, 'JPEG', logoX, logoY, logoDispW, logoDispH) } catch { /* skip */ }
  }

  curY = fy  // = curY + HEADER_H

  // ══════════════════════════════════════════════════
  // PHOTOS SECTION
  // ══════════════════════════════════════════════════
  const PHOTO_STRIP_H = 5
  doc.setFillColor(...LIGHT_BG)
  doc.setDrawColor(...GRAY_LINE)
  doc.setLineWidth(0.2)
  doc.rect(ML, curY, CW, PHOTO_STRIP_H, 'FD')
  doc.setFontSize(6)
  doc.setFont('helvetica', 'italic')
  doc.setTextColor(...DARK_GRAY)
  doc.text(
    'Fotos da Fiscalização (meramente ilustrativas, devem seguir os padrões estabelecidos nos procedimentos).',
    ML + 1.5, curY + 3.5, { maxWidth: CW - 3 }
  )
  curY += PHOTO_STRIP_H

  const PHOTO_ROW_H  = compressedPhotos.length > 0 ? 24 : 14
  const PHOTO_GAP    = 1.5

  doc.setDrawColor(...GRAY_LINE)
  doc.rect(ML, curY, CW, PHOTO_ROW_H)

  if (compressedPhotos.length > 0) {
    const slotW = (CW - PHOTO_GAP * (compressedPhotos.length + 1)) / compressedPhotos.length
    compressedPhotos.forEach((jpegData, i) => {
      if (!jpegData) return
      const px = ML + PHOTO_GAP + i * (slotW + PHOTO_GAP)
      const py = curY + 1
      addImageFit(doc, jpegData, 'JPEG', px, py, slotW, PHOTO_ROW_H - 2)
    })
  } else {
    doc.setFontSize(6)
    doc.setTextColor(180, 180, 180)
    doc.text('(sem fotos anexadas)', PW / 2, curY + PHOTO_ROW_H / 2 + 1, { align: 'center' })
  }
  doc.setTextColor(...BLACK)
  curY += PHOTO_ROW_H

  // ══════════════════════════════════════════════════
  // EVALUATION TABLE — all 3 groups in one table
  // ══════════════════════════════════════════════════
  doc.setFillColor(...BLUE)
  doc.rect(ML, curY, CW, 5, 'F')
  doc.setFontSize(6.5)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...WHITE)
  doc.text('Avaliação: 1-ATENDE, 0-NÃO ATENDE, X-NÃO AVALIADO e NÚMERO', PW / 2, curY + 3.5, { align: 'center' })
  curY += 5

  const tableBody = []

  for (const group of GROUPS) {
    const isSkipped = skippedGroups.includes(group.id)

    tableBody.push([{
      content: group.label,
      colSpan: 4,
      styles: { fillColor: BLUE, textColor: WHITE, fontStyle: 'bold', fontSize: 7, cellPadding: 1.5 },
    }])

    if (isSkipped) {
      tableBody.push([
        { content: '', styles: { cellPadding: 1 } },
        { content: '(grupo não vistoriado — todos os itens N/A)', colSpan: 2, styles: { fontStyle: 'italic', fontSize: 6, textColor: DARK_GRAY, cellPadding: 1 } },
        { content: '', styles: { cellPadding: 1 } },
      ])
    } else {
      group.items.forEach((item) => {
        const raw = answers[item.id]
        let displayVal = ''
        let tCol = BLACK

        if (item.type === 'dimensions') {
          displayVal = dimLabel(raw)
          tCol = DARK_GRAY
        } else if (item.peso === 0) {
          displayVal = raw || ''
          tCol = DARK_GRAY
        } else {
          displayVal = evalLabel(raw)
          tCol = evalTextColor(raw)
        }

        const obs = []
        if (justificativas[item.id]) obs.push(`Justif.: ${justificativas[item.id]}`)
        if (observacoes[item.id])    obs.push(`Obs.: ${observacoes[item.id]}`)

        tableBody.push([
          { content: item.id,   styles: { halign: 'center', fontStyle: 'bold', fontSize: 6, cellPadding: 1 } },
          { content: item.text, styles: { fontSize: 6, cellPadding: 1 } },
          { content: displayVal, styles: { halign: 'center', fontStyle: 'bold', fontSize: 7, textColor: tCol, cellPadding: 1 } },
          { content: obs.join(' | ') || '', styles: { fontSize: 5.5, cellPadding: 1, textColor: DARK_GRAY } },
        ])
      })
    }

    const score     = isSkipped ? null : calcGroupScore(group.id, answers)
    const cText     = score ? `${score.achieved.toFixed(1)} / ${score.maxPossible} pts  (${Math.round(score.ratio * 100)}%)` : 'N/A'
    const cColor    = score ? (score.ratio >= 0.8 ? GREEN : score.ratio >= 0.6 ? AMBER : RED_C) : DARK_GRAY

    tableBody.push([
      { content: 'Conceito do Grupo:', colSpan: 2, styles: { fontStyle: 'bold', fontSize: 6.5, halign: 'right', fillColor: LIGHT_BG, cellPadding: 1.5 } },
      { content: cText, colSpan: 2, styles: { fontStyle: 'bold', fontSize: 7, textColor: cColor, fillColor: LIGHT_BG, cellPadding: 1.5 } },
    ])
  }

  const COL_ITEM  = 10
  const COL_DESC  = 118
  const COL_AVAL  = 18
  const COL_OBS   = CW - COL_ITEM - COL_DESC - COL_AVAL

  autoTable(doc, {
    startY: curY,
    margin: { left: ML, right: MR },
    head: [[
      { content: 'Item',        styles: { halign: 'center' } },
      { content: 'Item de Avaliação' },
      { content: 'Avaliação',   styles: { halign: 'center' } },
      { content: 'Observações' },
    ]],
    body: tableBody,
    theme: 'grid',
    headStyles: { fillColor: BLUE, textColor: WHITE, fontSize: 7, fontStyle: 'bold', cellPadding: 1.5 },
    columnStyles: {
      0: { cellWidth: COL_ITEM },
      1: { cellWidth: COL_DESC },
      2: { cellWidth: COL_AVAL },
      3: { cellWidth: COL_OBS },
    },
    styles: { fontSize: 6, cellPadding: 1, overflow: 'linebreak', minCellHeight: 4 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  })

  curY = doc.lastAutoTable.finalY

  // ══════════════════════════════════════════════════
  // CONCEITO DO FORMULÁRIO
  // ══════════════════════════════════════════════════
  const formScore  = calcFormScore(answers, skippedGroups)
  const ratioText  = scoreLabel(formScore.ratio)
  const ptsText    = formScore.maxPossible > 0 ? `${formScore.achieved.toFixed(1)} / ${formScore.maxPossible} pts` : ''
  const finalColor = formScore.ratio !== null
    ? formScore.ratio >= 0.8 ? GREEN : formScore.ratio >= 0.6 ? AMBER : RED_C
    : DARK_GRAY

  doc.setFillColor(...LIGHT_BG)
  doc.setDrawColor(...GRAY_LINE)
  doc.setLineWidth(0.3)
  const CH = 7
  doc.rect(ML, curY, CW, CH, 'FD')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...BLACK)
  doc.text('Conceito do Formulário:', ML + 2, curY + CH / 2 + 1.5)
  doc.setTextColor(...finalColor)
  doc.setFontSize(9)
  doc.text(`${ratioText}   ${ptsText}`, ML + 57, curY + CH / 2 + 1.5)
  curY += CH + 5

  // ══════════════════════════════════════════════════
  // SIGNATURE
  // ══════════════════════════════════════════════════
  const PH = 297
  if (curY + 14 < PH - 6) {
    doc.setDrawColor(...GRAY_LINE)
    doc.setLineWidth(0.3)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...DARK_GRAY)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(...BLACK)
    doc.text(c.fiscal || '', ML, curY + 5)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.setTextColor(...DARK_GRAY)
    doc.line(ML, curY + 8, ML + 75, curY + 8)
    doc.text('Assinatura do Fiscal Responsável', ML, curY + 11.5)

    doc.line(PW - MR - 50, curY + 8, PW - MR, curY + 8)
    doc.text('Data / Hora', PW - MR - 50, curY + 11.5)

    doc.setFontSize(5.5)
    doc.setTextColor(160, 160, 160)
    doc.text(
      `Gerado em: ${new Date().toLocaleString('pt-BR')} — FCR Vistoria v1.1.0`,
      PW / 2, PH - 5, { align: 'center' }
    )
  }

  return doc
}
