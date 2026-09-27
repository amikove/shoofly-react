import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { useLogout } from '../../hooks/useLogout'

// Bas de la page Compte, client et Œil (chantier « barre mobile réduite », 2026-09-27) : la barre
// du bas n'a plus que 5 entrées — l'Aide (tickets + signalements) et la déconnexion sont ici.
// Même déconnexion que la barre latérale (useLogout).
export default function AccountFooterLinks() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const handleLogout = useLogout()
  if (!user || user.role === 'admin') return null

  return (
    <div className="mt-4 md:mt-6 rounded-xl border border-white/20 bg-[#181818] overflow-hidden">
      <Link
        to={`/${user.role}/aide`}
        className="flex items-center gap-3 px-5 py-4 text-sm font-medium text-white hover:bg-white/5 border-b border-white/10"
      >
        <span aria-hidden="true">🛟</span>
        <span className="flex-1">{t('compteLinks.aide')}</span>
        <span aria-hidden="true" className="text-[#777] rtl:rotate-180">›</span>
      </Link>
      <button
        type="button"
        onClick={handleLogout}
        className="w-full flex items-center gap-3 px-5 py-4 text-sm font-medium text-[#E11D2E] hover:bg-white/5 text-start"
      >
        <span aria-hidden="true">↩</span>
        <span className="flex-1">{t('appLayout.logout')}</span>
      </button>
    </div>
  )
}
