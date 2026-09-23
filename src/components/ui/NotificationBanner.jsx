import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { requestPushPermission, pushSupported, isIOS, isStandalone } from '../../hooks/useNotifications'
import { useAuth } from '../../context/AuthContext'

// Bannière d'activation des notifications.
//  - Navigateur standard, permission « default » : bouton « Activer » -> demande la permission
//    puis s'abonne au Web Push (requestPushPermission fait les deux).
//  - iOS Safari HORS PWA installée : la Push API n'existe pas tant que l'app n'est pas ajoutée à
//    l'écran d'accueil (exigence Apple). On affiche alors le GUIDE d'installation à la place du
//    bouton — le geste « Partager -> Sur l'écran d'accueil » doit être fait AVANT toute demande
//    de permission.
//  - Décision produit BOSS 2026-09-23 : ce mode 'ios-install' fait doublon avec le guide iOS
//    d'InstallPwaBanner.jsx (AppLayout) pour Client/Œil — celui-ci reste affiché en permanence
//    tant que l'app n'est pas installée, donc le même conseil ne doit pas apparaître deux fois à
//    l'écran. InstallPwaBanner EXCLUT l'admin : pour lui, rien ne fait doublon, ce mode reste
//    donc actif exactement comme avant. Seul ce cas précis est concerné — permission « default »
//    standard ('ask', tous rôles/plateformes confondus, y compris Android) est INCHANGÉ.
export default function NotificationBanner() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [show, setShow] = useState(false)

  // Dérivés synchrones et stables sur la vie du composant (pas de setState dans un effet).
  // 'granted' -> l'abonnement est (re)fait par le hook au montage ; 'denied' -> on n'insiste pas.
  const shouldOffer = 'Notification' in window && Notification.permission === 'default'
  const iosNeedsInstall = isIOS() && !isStandalone() && !pushSupported()
  const isAdmin = user?.role === 'admin'
  // Client/Œil hors PWA installée : InstallPwaBanner couvre déjà ce guide, bannière masquée en
  // entier (pas de repli sur le mode 'ask' — la Push API n'y fonctionnerait de toute façon pas
  // tant que l'app n'est pas installée, ce serait un bouton mort).
  const suppressForInstallBanner = iosNeedsInstall && !isAdmin
  const mode = iosNeedsInstall ? 'ios-install' : 'ask'

  useEffect(() => {
    if (!shouldOffer || suppressForInstallBanner) return
    // Laisser respirer l'arrivée sur l'app avant de solliciter.
    const timer = setTimeout(() => setShow(true), 3000)
    return () => clearTimeout(timer)
  }, [shouldOffer, suppressForInstallBanner])

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
