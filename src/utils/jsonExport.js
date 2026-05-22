import { GROUPS } from '../data/formSchema'
import { calcGroupScore, calcFormScore } from './scoring'

export function buildExportJson(state) {
  const { cabecalho, answers, justificativas, observacoes, fotos, vistoriaId } = state
  const formScore = calcFormScore(answers)

  const grupos = GROUPS.map((g) => {
    const score = calcGroupScore(g.id, answers)
    return {
      id: g.id,
      nome: g.label,
      conceito: score ? Math.round(score.ratio * 100) / 100 : null,
      pontos: score?.achieved ?? null,
      pontosMax: score?.maxPossible ?? null,
      itens: g.items.map((item) => ({
        id: item.id,
        texto: item.text,
        peso: item.peso,
        tipo: item.type,
        avaliacao: answers[item.id] ?? null,
        justificativa: justificativas[item.id] ?? null,
        observacao: observacoes[item.id] ?? null,
      })),
    }
  })

  return {
    meta: {
      versao: '1.0',
      geradoEm: new Date().toISOString(),
      vistoriaId,
    },
    cabecalho,
    grupos,
    conceitoFormulario: formScore.ratio !== null ? Math.round(formScore.ratio * 100) / 100 : null,
    pontosTotal: formScore.achieved,
    pontosMaxTotal: formScore.maxPossible,
    fotos: fotos.map((f) => ({
      id: f.id,
      nome: f.name,
      grupo: f.grupo ?? null,
      lat: f.lat ?? null,
      lon: f.lon ?? null,
      dataHora: f.datetime ? (f.datetime instanceof Date ? f.datetime.toISOString() : f.datetime) : null,
    })),
  }
}

export function downloadJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
