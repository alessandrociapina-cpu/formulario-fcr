import { useState, useEffect } from 'react'
import { Download, X } from 'lucide-react'

export default function InstallPrompt() {
  const [prompt, setPrompt] = useState(null)
  const [dismissed, setDismissed] = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    // Check if already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true)
      return
    }

    function handler(e) {
      e.preventDefault()
      setPrompt(e)
    }

    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => setInstalled(true))
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function handleInstall() {
    if (!prompt) return
    prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') setInstalled(true)
    setPrompt(null)
  }

  if (installed || dismissed || !prompt) return null

  return (
    <div className="mx-4 mt-4 bg-white border border-blue-200 rounded-2xl shadow-lg overflow-hidden">
      <div className="bg-blue-700 px-4 py-2 flex items-center justify-between">
        <span className="text-white text-xs font-bold">📲 Instalar Aplicativo</span>
        <button onClick={() => setDismissed(true)} className="text-blue-200 hover:text-white transition-colors">
          <X size={16} />
        </button>
      </div>
      <div className="px-4 py-3 flex items-center gap-3">
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-800">Adicionar à tela inicial</p>
          <p className="text-xs text-slate-500 mt-0.5">Acesse o app offline, direto do celular, sem abrir o navegador</p>
        </div>
        <button
          onClick={handleInstall}
          className="flex items-center gap-1.5 bg-blue-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-blue-700 active:scale-95 transition-all touch-manipulation whitespace-nowrap"
        >
          <Download size={15} /> Instalar
        </button>
      </div>
    </div>
  )
}
