import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { requestPushPermission, pushSupported, isIOS, isStandalone } from '../../hooks/useNotifications'

// Bannière d'activation des notifications.
//  - Navigateur standard, permission « default » : bouton « Activer » -> demande la permission
//    puis s'abonne au Web Push (requestPushPermission fait les deux).
//  - iOS Safari HORS PWA installée : la Push API n'existe pas tant que l'app n'est pas ajoutée à
//    l'écran d'accueil (exigence Apple). On affiche alors le GUIDE d'installation à la place du
//    bouton — le geste « Partager -> Sur l'écran d'accueil » doit être fait AVANT toute demande
//    de permission.
export default function NotificationBanner() {
  const { t } = useTranslation()
  const [show, setShow] = useState(false)

  // Dérivés synchrones et stables sur la vie du composant (pas de setState dans un effet).
  // 'granted' -> l'abonnement est (re)fait par le hook au montage ; 'denied' -> on n'insiste pas.
  const shouldOffer = 'Notification' in window && Notification.permission === 'default'
  const mode = isIOS() && !isStandalone() && !pushSupported() ? 'ios-install' : 'ask'

  useEffect(() => {
    if (!shouldOffer) return
    // Laisser respirer l'arrivée sur l'app avant de solliciter.
    const timer = setTimeout(() => setShow(true), 3000)
    return () => clearTimeout(timer)
  }, [shouldOffer])

  const allow = async () => {
    await requestPushPermission()
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed bottom-6 start-6 z-50 max-w-sm">
      <div className="bg-[#181818] border border-white/20 rounded-2xl p-4 shadow-[0_16px_40px_rgba(0,0,0,0.5)] flex gap-3">
        <div className="text-2xl flex-shrink-0">🔔</div>
        <div className="flex-1 min-w-0">
          {mode === 'ios-install' ? (
            <>
              <div className="font-semibold text-sm mb-0.5 break-words">{t('notificationBanner.iosTitle')}</div>
              <ol className="text-xs text-[#AAA] mb-3 leading-relaxed break-words list-decimal ps-4 space-y-0.5">
                <li>{t('notificationBanner.iosStep1')}</li>
                <li>{t('notificationBanner.iosStep2')}</li>
                <li>{t('notificationBanner.iosStep3')}</li>
              </ol>
              <button onClick={() => setShow(false)} className="btn btn-ghost btn-sm">
                {t('notificationBanner.gotIt')}
              </button>
            </>
          ) : (
            <>
              <div className="font-semibold text-sm mb-0.5 break-words">{t('notificationBanner.title')}</div>
              <div className="text-xs text-[#AAA] mb-3 leading-relaxed break-words">
                {t('notificationBanner.desc')}
              </div>
              <div className="flex gap-2">
                <button onClick={allow} className="btn btn-primary btn-sm">
                  {t('notificationBanner.allow')}
                </button>
                <button onClick={() => setShow(false)} className="btn btn-ghost btn-sm">
                  {t('notificationBanner.later')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
