import { CABECALHO_FIELDS } from '../data/formSchema'

export default function StepCabecalho({ cabecalho, onChange }) {
  return (
    <div>
      <div className="bg-blue-800 text-white px-4 py-3">
        <h2 className="text-base font-bold">Cabeçalho da Vistoria</h2>
        <p className="text-xs text-blue-200 mt-0.5">Preencha os dados de identificação do local e do fiscal</p>
      </div>

      <div className="p-4 grid grid-cols-2 gap-3">
        {CABECALHO_FIELDS.map((f) => (
          <div key={f.id} className={f.colSpan === 2 ? 'col-span-2' : 'col-span-1'}>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              {f.label}
              {f.required && <span className="text-red-500 ml-0.5">*</span>}
              {f.autoGps && <span className="ml-1 text-[10px] text-blue-500 font-normal">📍 auto via foto</span>}
            </label>

            {f.type === 'date' && (
              <input
                type="date"
                className="field-input"
                value={cabecalho[f.id] || ''}
                onChange={(e) => onChange(f.id, e.target.value)}
              />
            )}

            {f.type === 'select' && (
              <select
                className="field-input"
                value={cabecalho[f.id] || ''}
                onChange={(e) => onChange(f.id, e.target.value)}
              >
                <option value="">Selecione...</option>
                {f.options.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            )}

            {f.type === 'dimensions' && (() => {
              const raw = cabecalho[f.id]
              const val = typeof raw === 'object' && raw !== null ? raw : { c: '', l: '' }
              const area = val.c && val.l ? (parseFloat(val.c) * parseFloat(val.l)).toFixed(2) : null
              return (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">Comprimento (m)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="field-input"
                        placeholder="Ex: 3.50"
                        value={val.c}
                        onChange={(e) => onChange(f.id, { ...val, c: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">Largura (m)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="field-input"
                        placeholder="Ex: 1.20"
                        value={val.l}
                        onChange={(e) => onChange(f.id, { ...val, l: e.target.value })}
                      />
                    </div>
                  </div>
                  {area && (
                    <p className="text-[11px] text-blue-600 font-semibold">
                      Área calculada: {area} m²
                    </p>
                  )}
                </div>
              )
            })()}

            {(f.type === 'text' || f.type === 'number' || !f.type) && (
              <input
                type={f.type === 'number' ? 'number' : 'text'}
                className="field-input"
                placeholder={f.placeholder || ''}
                value={cabecalho[f.id] || ''}
                onChange={(e) => onChange(f.id, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
