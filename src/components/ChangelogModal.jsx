import { X } from 'lucide-react'

const CHANGELOG = [
  {
    version: '1.1.0',
    date: '2026-05-22',
    changes: [
      'Botão para pular grupo inteiro (marcar tudo como N/A) quando não houver vistoria',
      'Campo de dimensões dividido em Comprimento e Largura separados (com cálculo automático de área)',
      'Prompt de instalação do app na tela inicial (Android/iOS)',
      'PDF reformulado em página única no padrão oficial FCR com logo Sabesp',
      'Histórico de versões adicionado',
    ],
  },
  {
    version: '1.0.0',
    date: '2026-05-22',
    changes: [
      'Lançamento inicial do FCR Vistoria PWA',
      'Wizard em 6 passos: Cabeçalho, Fotos, Leito Carroçável, Passeio/Piso, Sinalização, Revisão',
      'Extração automática de GPS e data EXIF das fotos',
      'Pontuação ponderada em tempo real por grupo e formulário',
      'Justificativa condicional obrigatória para "CASO NEGATIVO, JUSTIFIQUE"',
      'Funcionamento offline via Service Worker + auto-save no IndexedDB',
      'Exportação local de PDF + JSON sem envio para servidores',
      'Suporte a múltiplos rascunhos simultâneos',
    ],
  },
]

export default function ChangelogModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white w-full max-w-lg rounded-t-3xl shadow-2xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-black text-slate-900">Histórico de Versões</h2>
            <p className="text-xs text-slate-500 mt-0.5">FCR Vistoria — Melhorias e correções</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-6">
          {CHANGELOG.map((release) => (
            <div key={release.version}>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-blue-700 text-white text-xs font-black px-2.5 py-1 rounded-full">v{release.version}</span>
                <span className="text-xs text-slate-400">{release.date}</span>
              </div>
              <ul className="space-y-1.5">
                {release.changes.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="text-blue-500 mt-0.5 shrink-0">•</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="px-5 py-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-xl transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
