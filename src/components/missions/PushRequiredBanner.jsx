import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { requestPushPermission, pushSupported, isIOS, isAndroid, isStandalone } from '../../hooks/useNotifications'

// Chantier « lancer sans WhatsApp » (BOSS, 2026-10-23) — push désormais requis pour qu'un Œil
// vérifié puisse postuler (POST /missions/:id/interest, code PUSH_REQUIRED ; PUT .../verify-oeil,
// PUSH_REQUIRED). Bandeau PERSISTANT en haut du dashboard, distinct de NotificationBanner.jsx
// (flottante, tous rôles, soft nudge qui disparaît après un clic) : ici affichage permanent tant
// que l'Œil vérifié n'a pas d'abonnement push actif, avec 3 variantes (ask / iOS à installer /
// permission refusée). Priorité à la bannière « Œil non vérifié » existante : si elle s'affiche,
// l'Œil n'est pas encore vérifié, donc has_active_push n'a pas d'effet (condition ci-dessous).
export default function PushRequiredBanner() {
  const { t } = useTranslation()
  const { user, updateUser } = useAuth()

  if (!user || user.role !== 'oeil' || !user.is_verified || user.has_active_push) return null

  const deniedState = typeof Notification !== 'undefined' && Notification.permission === 'denied'
  const needsIosInstall = isIOS() && !isStandalone() && !pushSupported()

  const activate = async () => {
    const ok = await requestPushPermission()
    if (ok) updateUser({ has_active_push: true })
  }

  const deniedKey = isAndroid() ? 'deniedDescAndroid' : isIOS() ? 'deniedDescIos' : 'deniedDescOther'
  const desc = needsIosInstall
    ? t('pushRequiredBanner.iosDesc')
    : deniedState
      ? t(`pushRequiredBanner.${deniedKey}`)
      : t('pushRequiredBanner.desc')

  return (
    <div className="rounded-xl p-4 flex items-center gap-3 bg-orange-500/10 border border-orange-500/30">
      <span className="text-2xl flex-shrink-0">🔔</span>
      <div className="flex-1">
        <p className="text-sm font-semibold text-white">{t('pushRequiredBanner.title')}</p>
        <p className="text-xs text-[#AAA] mt-0.5">{desc}</p>
      </div>
      {!needsIosInstall && !deniedState && (
        <button onClick={activate} className="btn btn-primary btn-sm flex-shrink-0">
          {t('pushRequiredBanner.activateButton')}
        </button>
      )}
    </div>
  )
}
