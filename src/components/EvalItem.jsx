import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

export default function EvalItem({ item, value, justificativa, observacao, onChange, onJustify, onObs, groupColor, disabled }) {
  const [showObs, setShowObs] = useState(false)

  const borderColor = {
    blue: 'border-blue-100',
    emerald: 'border-emerald-100',
    amber: 'border-amber-100',
  }[groupColor] || 'border-slate-100'

  const badgeColor = {
    blue: 'bg-blue-50 text-blue-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
  }[groupColor] || 'bg-slate-50 text-slate-700'

  const isEval = item.type === 'eval'
  const isQuality = item.type === 'quality'
  const isText = item.type === 'text'
  const isNumber = item.type === 'number'
  const isDimensions = item.type === 'dimensions'
  const isInfo = item.peso === 0

  const showJustify = item.justify && value === '0'
  const missingJustify = showJustify && !justificativa?.trim()

  const dimVal = (typeof value === 'object' && value !== null) ? value : { c: '', l: '' }

  function handleDim(field, v) {
    onChange(item.id, { ...dimVal, [field]: v })
  }

  return (
    <div className={`border-b ${borderColor} last:border-b-0 ${disabled ? 'opacity-40 pointer-events-none' : ''}`}>
      <div className="p-3">
        <div className="flex items-start gap-2 mb-2">
          <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded ${badgeColor} mt-0.5`}>{item.id}</span>
          <div className="flex-1">
            <p className="text-xs text-slate-700 leading-relaxed font-medium">{item.text}</p>
            <span className="inline-block mt-1 text-[10px] text-slate-400 font-normal">
              {isInfo ? 'Informativo · Peso: 0' : `Peso: ${item.peso}`}
              {item.required && <span className="text-red-500 ml-1">*</span>}
            </span>
          </div>
        </div>

        {isEval && (
          <div className="flex gap-2">
            <button className={`eval-btn-atende ${value === '1' ? 'selected' : ''}`} onClick={() => onChange(item.id, value === '1' ? null : '1')}>✓ ATENDE</button>
            <button className={`eval-btn-nao ${value === '0' ? 'selected' : ''}`} onClick={() => onChange(item.id, value === '0' ? null : '0')}>✗ NÃO ATENDE</button>
            <button className={`eval-btn-na ${value === 'X' ? 'selected' : ''}`} onClick={() => onChange(item.id, value === 'X' ? null : 'X')}>N/A</button>
          </div>
        )}

        {isQuality && (
          <div className="flex gap-2">
            {['BOM', 'REGULAR', 'RUIM'].map((opt) => (
              <button
                key={opt}
                className={`flex-1 py-2.5 rounded-xl font-bold text-sm border-2 transition-all duration-150 touch-manipulation cursor-pointer min-h-[52px] ${
                  value === opt
                    ? opt === 'BOM' ? 'bg-emerald-500 text-white border-emerald-600 shadow-md'
                      : opt === 'REGULAR' ? 'bg-amber-500 text-white border-amber-600 shadow-md'
                      : 'bg-red-500 text-white border-red-600 shadow-md'
                    : 'border-slate-300 text-slate-600 bg-white hover:bg-slate-50 active:scale-95'
                }`}
                onClick={() => onChange(item.id, value === opt ? null : opt)}
              >
                {opt}
              </button>
            ))}
          </div>
        )}

        {(isText || isNumber) && (
          <input
            type={isNumber ? 'number' : 'text'}
            className="field-input"
            placeholder={item.placeholder || ''}
            value={value || ''}
            onChange={(e) => onChange(item.id, e.target.value || null)}
          />
        )}

        {isDimensions && (
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="text-[10px] text-slate-500 font-semibold block mb-1">Comprimento (m)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className={`field-input ${item.required && !dimVal.c ? 'border-amber-300' : ''}`}
                placeholder="Ex: 3,50"
                value={dimVal.c}
                onChange={(e) => handleDim('c', e.target.value)}
              />
            </div>
            <span className="text-slate-400 font-bold pb-2.5">×</span>
            <div className="flex-1">
              <label className="text-[10px] text-slate-500 font-semibold block mb-1">Largura (m)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className={`field-input ${item.required && !dimVal.l ? 'border-amber-300' : ''}`}
                placeholder="Ex: 0,80"
                value={dimVal.l}
                onChange={(e) => handleDim('l', e.target.value)}
              />
            </div>
            {dimVal.c && dimVal.l && (
              <div className="pb-2 text-xs text-slate-500 font-medium whitespace-nowrap">
                = {(parseFloat(dimVal.c) * parseFloat(dimVal.l)).toFixed(2)} m²
              </div>
            )}
          </div>
        )}

        {showJustify && (
          <div className="mt-2">
            <label className="text-xs font-semibold text-red-600 block mb-1">⚠ Justificativa obrigatória (caso negativo):</label>
            <textarea
              className={`field-input min-h-[72px] resize-none ${missingJustify ? 'border-red-400 focus:ring-red-400' : ''}`}
              placeholder="Descreva o motivo de não atendimento..."
              value={justificativa || ''}
              onChange={(e) => onJustify(item.id, e.target.value)}
            />
          </div>
        )}

        {isEval && (
          <button
            className="mt-2 flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600 transition-colors"
            onClick={() => setShowObs(!showObs)}
          >
            {showObs ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            Observações {observacao ? '(preenchido)' : '(opcional)'}
          </button>
        )}

        {showObs && (
          <textarea
            className="field-input mt-1 min-h-[60px] resize-none text-xs"
            placeholder="Observações adicionais sobre este item..."
            value={observacao || ''}
            onChange={(e) => onObs(item.id, e.target.value)}
          />
        )}
      </div>
    </div>
  )
}
