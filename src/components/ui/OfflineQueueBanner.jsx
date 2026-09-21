import { useTranslation } from 'react-i18next'
import { useOfflineQueue } from '../../hooks/useOfflineQueue'

// Bannière globale (montée dans AppLayout, même pattern que ConnectionLostBanner) — visible tant qu'au
// moins une action terrain est en attente d'envoi (réseau perdu, voir utils/offlineQueue.js). Rend
// `null` sinon : aucun espace consommé, comportement en ligne inchangé.
export default function OfflineQueueBanner() {
  const { t } = useTranslation()
  const { count } = useOfflineQueue()
  if (count === 0) return null

  return (
    // Positionnement et empilement gérés par le conteneur commun dans AppLayout.
    <div className="w-full flex justify-center pointer-events-none">
      <div role="status" className="pointer-events-auto max-w-md bg-[#181818] border border-yellow-500/40 rounded-2xl px-4 py-2.5 shadow-[0_16px_40px_rgba(0,0,0,0.5)] flex items-center gap-2.5">
        <div className="text-lg flex-shrink-0">⏳</div>
        <div className="text-sm font-medium">{t('offlineQueue.banner', { count })}</div>
      </div>
    </div>
  )
}
