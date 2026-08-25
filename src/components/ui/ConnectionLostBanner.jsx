import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useSocket } from '../../context/SocketContext'

// Bannière globale (montée une fois dans AppLayout, même pattern que PresenceConfirmationBanner /
// ClientDisabledBanner / ResumeH30Banner) — signale une perte PROLONGÉE de la connexion temps réel
// (socket.io). Délai avant affichage pour ignorer les micro-coupures/reconnexions normales
// (changement de réseau, veille de l'onglet, etc.) : socket.io retente déjà indéfiniment tout seul
// (reconnectionAttempts: Infinity, voir SocketContext.jsx), donc `connected` repasse à `true` de
// lui-même dans l'immense majorité des cas avant même que ce délai n'expire.
const SHOW_DELAY_MS = 5000

export default function ConnectionLostBanner() {
  const { t } = useTranslation()
  const { connected } = useSocket() || {}
  const [show, setShow] = useState(false)

  useEffect(() => {
    // setTimeout(…, 0) plutôt qu'un setState synchrone en tête d'effet — même convention que
    // l'horloge de compte à rebours de ResumeH30Banner/oeil/Missions.jsx (règle eslint
    // react-hooks/set-state-in-effect du projet).
    if (connected) {
      const id = setTimeout(() => setShow(false), 0)
      return () => clearTimeout(id)
    }
    const timer = setTimeout(() => setShow(true), SHOW_DELAY_MS)
    return () => clearTimeout(timer)
  }, [connected])

  if (!show) return null

  return (
    <div className="fixed top-[472px] md:top-[388px] inset-x-0 z-[70] flex justify-center px-4 pointer-events-none">
      <div className="pointer-events-auto max-w-md bg-[#181818] border border-yellow-500/40 rounded-2xl px-4 py-2.5 shadow-[0_16px_40px_rgba(0,0,0,0.5)] flex items-center gap-2.5">
        <div className="text-lg flex-shrink-0">📡</div>
        <div className="text-sm font-medium">{t('connectionLostBanner.text')}</div>
      </div>
    </div>
  )
}
