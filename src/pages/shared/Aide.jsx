import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import MesTickets from './MesTickets'
import MesSignalements from './MesSignalements'

// Page « Aide » client / Œil (chantier « barre mobile réduite », 2026-09-27) : regroupe
// « Mes tickets » et « Mes signalements » en 2 onglets. Chaque onglet est la page existante
// elle-même (même logique, mêmes appels), rendue avec le titre « Aide » et la barre d'onglets.
// L'onglet vit dans l'URL (?tab=tickets | signalements) : les anciennes routes /tickets et
// /mes-signalements y redirigent (App.jsx), deep-links compris (?openTicketId, state).
const TABS = [
  { key: 'tickets',      label: 'aide.tabs.tickets' },
  { key: 'signalements', label: 'aide.tabs.signalements' },
]

export default function Aide() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') === 'signalements' ? 'signalements' : 'tickets'

  const select = (key) => {
    if (key === tab) return
    const next = new URLSearchParams(searchParams)
    next.set('tab', key)
    next.delete('openTicketId')
    setSearchParams(next, { replace: true })
  }

  const tabs = (
    <div role="tablist" className="flex gap-1 bg-[#222] rounded-xl p-1 w-fit max-w-full mb-5">
      {TABS.map((tb) => (
        <button
          key={tb.key}
          type="button"
          role="tab"
          aria-selected={tab === tb.key}
          onClick={() => select(tb.key)}
          className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${tab === tb.key ? 'bg-[#2A2A2A] text-white' : 'text-[#AAA] hover:text-white'}`}
        >
          {t(tb.label)}
        </button>
      ))}
    </div>
  )

  return tab === 'tickets'
    ? <MesTickets title={t('aide.title')} tabs={tabs} />
    : <MesSignalements title={t('aide.title')} tabs={tabs} />
}
