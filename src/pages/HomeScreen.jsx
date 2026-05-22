import { useState, useEffect } from 'react'
import { PlusCircle, FolderOpen, Trash2, ClipboardList } from 'lucide-react'
import { listVistorias, deleteVistoria, generateId } from '../utils/storage'

export default function HomeScreen({ onNew, onResume }) {
  const [vistorias, setVistorias] = useState([])

  useEffect(() => {
    listVistorias().then(setVistorias).catch(() => {})
  }, [])

  async function handleDelete(id, e) {
    e.stopPropagation()
    if (!confirm('Excluir este rascunho?')) return
    await deleteVistoria(id)
    setVistorias((prev) => prev.filter((v) => v.id !== id))
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-800 flex flex-col">
      <div className="p-6 text-white flex-1 flex flex-col">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
            <ClipboardList size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black leading-tight">FCR Vistoria</h1>
            <p className="text-blue-200 text-xs">Formulário de Conformidade da Reposição</p>
          </div>
        </div>
        <p className="text-blue-300 text-xs mb-8 mt-2">Versão 1.0 · Funciona offline · PDF + JSON gerados no dispositivo</p>

        <button
          onClick={() => onNew(generateId())}
          className="w-full flex items-center justify-center gap-3 bg-white text-blue-800 font-black py-4 rounded-2xl text-base shadow-xl hover:bg-blue-50 active:scale-95 transition-all touch-manipulation mb-6"
        >
          <PlusCircle size={22} />
          Nova Vistoria
        </button>

        {vistorias.length > 0 && (
          <div>
            <p className="text-blue-200 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FolderOpen size={13} /> Rascunhos salvos
            </p>
            <div className="space-y-2">
              {vistorias.map((v) => {
                const endereco = v.cabecalho?.endereco || 'Endereço não informado'
                const amostra = v.cabecalho?.num_amostra ? `Amostra nº ${v.cabecalho.num_amostra}` : 'Sem número'
                const savedAt = v._savedAt ? new Date(v._savedAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—'
                return (
                  <div
                    key={v.id}
                    onClick={() => onResume(v)}
                    className="bg-white/10 hover:bg-white/20 rounded-xl p-3 flex items-center justify-between cursor-pointer touch-manipulation transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-semibold truncate">{endereco}</p>
                      <p className="text-blue-300 text-xs mt-0.5">{amostra} · Salvo {savedAt}</p>
                    </div>
                    <button
                      onClick={(e) => handleDelete(v.id, e)}
                      className="ml-2 p-1.5 text-red-300 hover:text-red-100 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
