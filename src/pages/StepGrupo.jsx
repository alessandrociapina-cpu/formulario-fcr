import EvalItem from '../components/EvalItem'
import ScoreBar from '../components/ScoreBar'
import { calcGroupScore } from '../utils/scoring'
import { SkipForward } from 'lucide-react'

const colorMap = {
  blue:    { header: 'bg-blue-800',    sub: 'text-blue-200',    skip: 'bg-blue-50 border-blue-200 text-blue-800',    toggle: 'bg-blue-600' },
  emerald: { header: 'bg-emerald-800', sub: 'text-emerald-200', skip: 'bg-emerald-50 border-emerald-200 text-emerald-800', toggle: 'bg-emerald-600' },
  amber:   { header: 'bg-amber-700',   sub: 'text-amber-100',   skip: 'bg-amber-50 border-amber-200 text-amber-800',  toggle: 'bg-amber-600' },
}

export default function StepGrupo({ group, answers, justificativas, observacoes, onChange, onJustify, onObs, skipped, onSkip }) {
  const score = skipped ? null : calcGroupScore(group.id, answers)
  const colors = colorMap[group.color] || colorMap.blue

  function handleSkipToggle() {
    const newSkipped = !skipped
    onSkip(group.id, newSkipped)
    if (newSkipped) {
      // Mark all evaluable items as N/A
      group.items.forEach((item) => {
        if (item.type === 'eval' || item.type === 'quality') {
          onChange(item.id, 'X')
        }
      })
    } else {
      // Clear all items so fiscal can re-evaluate
      group.items.forEach((item) => {
        if (item.type === 'eval' || item.type === 'quality') {
          onChange(item.id, null)
        }
      })
    }
  }

  return (
    <div>
      <div className={`${colors.header} text-white px-4 py-3`}>
        <h2 className="text-base font-bold">{group.label}</h2>
        {group.sublabel && <p className={`text-xs ${colors.sub} mt-0.5`}>{group.sublabel}</p>}
        <p className={`text-xs ${colors.sub} mt-0.5`}>
          Avaliação: <strong>ATENDE</strong> · <strong>NÃO ATENDE</strong> · <strong>N/A</strong>
        </p>
      </div>

      {/* Skip group toggle */}
      <div className={`mx-4 mt-3 mb-1 border rounded-xl p-3 flex items-center justify-between gap-3 ${colors.skip}`}>
        <div className="flex items-center gap-2">
          <SkipForward size={16} className="shrink-0" />
          <div>
            <p className="text-sm font-bold leading-tight">Não houve vistoria neste grupo</p>
            <p className="text-xs opacity-70 mt-0.5">Todos os itens serão definidos como N/A</p>
          </div>
        </div>
        <button
          onClick={handleSkipToggle}
          className={`relative inline-flex shrink-0 h-7 w-12 items-center rounded-full transition-colors duration-200 focus:outline-none ${skipped ? colors.toggle : 'bg-slate-300'}`}
        >
          <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${skipped ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>

      {!skipped && <ScoreBar score={score} label={`Conceito do Grupo ${group.id}`} />}

      {skipped ? (
        <div className="p-8 text-center text-slate-400">
          <SkipForward size={40} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm font-semibold">Grupo marcado como não vistoriado</p>
          <p className="text-xs mt-1">Todos os itens estão definidos como N/A e serão excluídos da pontuação</p>
        </div>
      ) : (
        <div className="bg-white divide-y divide-slate-50">
          {group.items.map((item) => (
            <EvalItem
              key={item.id}
              item={item}
              value={answers[item.id]}
              justificativa={justificativas[item.id]}
              observacao={observacoes[item.id]}
              onChange={onChange}
              onJustify={onJustify}
              onObs={onObs}
              groupColor={group.color}
            />
          ))}
        </div>
      )}

      {score && !skipped && (
        <div className="p-4 bg-slate-50 border-t border-slate-200">
          <p className="text-sm font-bold text-slate-700">
            Conceito do Grupo: {score.achieved.toFixed(1)} / {score.maxPossible} pontos ({Math.round(score.ratio * 100)}%)
          </p>
        </div>
      )}
    </div>
  )
}
