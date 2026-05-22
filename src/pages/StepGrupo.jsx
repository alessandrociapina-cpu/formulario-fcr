import EvalItem from '../components/EvalItem'
import ScoreBar from '../components/ScoreBar'
import { calcGroupScore } from '../utils/scoring'

const colorMap = {
  blue: { header: 'bg-blue-800', sub: 'text-blue-200' },
  emerald: { header: 'bg-emerald-800', sub: 'text-emerald-200' },
  amber: { header: 'bg-amber-700', sub: 'text-amber-100' },
}

export default function StepGrupo({ group, answers, justificativas, observacoes, onChange, onJustify, onObs }) {
  const score = calcGroupScore(group.id, answers)
  const colors = colorMap[group.color] || colorMap.blue

  return (
    <div>
      <div className={`${colors.header} text-white px-4 py-3`}>
        <h2 className="text-base font-bold">{group.label}</h2>
        {group.sublabel && <p className={`text-xs ${colors.sub} mt-0.5`}>{group.sublabel}</p>}
        <p className={`text-xs ${colors.sub} mt-0.5`}>
          Avaliação: <strong>ATENDE</strong> · <strong>NÃO ATENDE</strong> · <strong>N/A</strong> (não avaliado)
        </p>
      </div>

      <ScoreBar score={score} label={`Conceito do Grupo ${group.id}`} />

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

      {score && (
        <div className="p-4 bg-slate-50 border-t border-slate-200">
          <p className="text-sm font-bold text-slate-700">
            Conceito do Grupo: {score.achieved.toFixed(1)} / {score.maxPossible} pontos ({Math.round(score.ratio * 100)}%)
          </p>
        </div>
      )}
    </div>
  )
}
