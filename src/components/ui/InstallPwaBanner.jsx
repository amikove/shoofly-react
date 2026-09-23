import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { isIOS, isAndroid, isStandalone } from '../../hooks/useNotifications'
import { usePwaInstallPrompt } from '../../hooks/usePwaInstallPrompt'

// Bandeau d'installation PWA — décision produit BOSS 2026-09-23 : complémentaire à l'invite
// native (qui ne se réaffiche plus une fois ignorée/fermée), ce bandeau reste affiché en
// permanence tant que l'app n'est pas installée — PAS de bouton fermer, pas de logique
// "rappeler plus tard". Client + Œil uniquement (jamais l'espace admin).
//  - Android/Chrome (et navigateurs compatibles) : dès que `status==='available'`, bouton
//    "Ajouter le raccourci" -> déclenche l'invite native capturée par utils/pwaInstallPrompt.js.
//    TANT QUE l'évènement n'est pas (encore, ou plus) disponible — `status` 'unavailable' (rien
//    reçu depuis le chargement de la page, ou déjà consommé sans refus explicite) OU 'dismissed'
//    (refusée) — un guide manuel dépliable ("Comment faire ?") est affiché À LA PLACE : jamais de
//    bandeau vide ni de bouton mort en attendant l'évènement. Si `beforeinstallprompt` arrive
//    après coup, `status` passe à 'available' et le bouton "Ajouter le raccourci" prend le relais
//    en une seule transition (pas d'aller-retour, cf. rapport de chantier pour le détail observé).
//    Sur acceptation ('accepted') sans `appinstalled` immédiat : `status` passe directement à
//    'installed' (cf. pwaInstallPrompt.js), le bandeau entier disparaît — jamais de bouton mort
//    en attendant un `appinstalled` qui tarderait ou n'arriverait jamais.
//  - iOS Safari (`beforeinstallprompt` n'existe pas sur ce navigateur) : bouton qui déplie le
//    guide d'installation déjà utilisé par NotificationBanner (mêmes textes,
//    notificationBanner.iosStep1/2) plutôt que d'en écrire un nouveau.
//  - Autre cas (desktop sans support détecté, `beforeinstallprompt` jamais déclenché) : rien à
//    proposer, on n'affiche pas un bouton/guide qui ne mènerait à rien -> masqué.
export default function InstallPwaBanner() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { status, promptInstall } = usePwaInstallPrompt()
  const [showGuide, setShowGuide] = useState(false)

  if (!user || user.role === 'admin') return null
  if (isStandalone()) return null
  if (status === 'installed') return null

  const ios = isIOS()
  const android = isAndroid()
  if (!ios && !android && status !== 'available') return null

  const textKey = user.role === 'oeil' ? 'installPwaBanner.textOeil' : 'installPwaBanner.textClient'
  const androidFallback = android && status !== 'available'
  const showManualGuide = ios || androidFallback

  return (
    // Positionnement (fixed / top / z-index) et empilement avec les bannières sœurs (dont
    // OfflineQueueBanner, PW-5) gérés par le conteneur commun dans AppLayout.
    <div className="w-full flex justify-center pointer-events-none">
      <div className="pointer-events-auto w-full max-w-md bg-[#181818] border border-white/20 rounded-2xl px-4 py-2.5 shadow-[0_16px_40px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-2.5">
          <div className="text-lg flex-shrink-0">📲</div>
          <div className="flex-1 min-w-0 text-sm font-medium break-words">
            {t(textKey)}
          </div>
          {showManualGuide ? (
            <button onClick={() => setShowGuide((v) => !v)} className="btn btn-primary btn-sm flex-shrink-0">
              {t(ios ? 'installPwaBanner.howTo' : 'installPwaBanner.howToAndroid')}
            </button>
          ) : (
            <button onClick={promptInstall} className="btn btn-primary btn-sm flex-shrink-0">
              {t('installPwaBanner.install')}
            </button>
          )}
        </div>
        {showManualGuide && showGuide && (
          <ol className="text-xs text-[#AAA] mt-2.5 pt-2.5 border-t border-white/10 leading-relaxed list-decimal ps-4 space-y-0.5">
            {ios ? (
              <>
                <li>{t('notificationBanner.iosStep1')}</li>
                <li>{t('notificationBanner.iosStep2')}</li>
              </>
            ) : (
              <li>{t('installPwaBanner.androidGuide')}</li>
            )}
          </ol>
        )}
      </div>
    </div>
  )
}
