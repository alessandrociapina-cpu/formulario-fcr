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
            {f.type === 'date' ? (
              <input
                type="date"
                className="field-input"
                value={cabecalho[f.id] || ''}
                onChange={(e) => onChange(f.id, e.target.value)}
              />
            ) : (
              <input
                type="text"
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
