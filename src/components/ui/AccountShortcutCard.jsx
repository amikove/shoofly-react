import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { isIOS, isAndroid, isStandalone } from '../../hooks/useNotifications'
import { usePwaInstallPrompt } from '../../hooks/usePwaInstallPrompt'

// Carte permanente « Raccourci sur l'écran d'accueil » (page Compte, Client + Œil) — décision
// produit BOSS 2026-09-23. Complémentaire à InstallPwaBanner (bandeau masqué par
// user.pwa_installed_at) : couvre les utilisateurs déjà marqués sur un autre appareil / après
// suppression du raccourci — pwa_installed_at n'est volontairement PAS une condition de masquage
// ici, c'est tout l'intérêt de cette carte. Duplique délibérément la logique d'affichage
// d'InstallPwaBanner (même hooks/fonctions, même invariant "aucun bouton mort") plutôt que d'en
// extraire un sous-composant partagé : les deux surfaces diffèrent sur le conteneur (carte vs
// bandeau flottant), le texte, et ce garde-fou même (pwa_installed_at) — voir rapport de chantier.
export default function AccountShortcutCard() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { status, promptInstall } = usePwaInstallPrompt()
  const [showGuide, setShowGuide] = useState(false)

  if (!user || user.role === 'admin') return null
  if (isStandalone()) return null
  // status est le singleton de session de pwaInstallPrompt.js (indépendant de pwa_installed_at) :
  // si CETTE session vient d'accepter l'invite, l'onglet reste non-standalone jusqu'au prochain
  // lancement depuis l'icône — sans cette garde (reprise d'InstallPwaBanner), la carte proposerait
  // encore un guide pour une action déjà faite. Non listé dans les règles d'affichage demandées
  // (qui ne couvrent pas ce cas), ajouté par cohérence avec le bandeau et "aucun bouton mort".
  if (status === 'installed') return null

  const ios = isIOS()
  const android = isAndroid()
  if (!ios && !android && status !== 'available') return null

  const showManualGuide = ios || (android && status !== 'available')
  // Même variante Android que InstallPwaBanner (option A validée BOSS 2026-09-23).
  const textKey = android ? 'accountShortcut.textAndroid' : 'accountShortcut.text'

  return (
    <div className="card mt-4 md:mt-6">
      <div className="flex items-center gap-3">
        <div className="text-lg flex-shrink-0">📲</div>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-sm">{t('accountShortcut.title')}</h2>
          <p className="text-xs text-[#AAA] mt-1">{t(textKey)}</p>
        </div>
        {showManualGuide ? (
          <button type="button" onClick={() => setShowGuide((v) => !v)} aria-expanded={showGuide} className="btn btn-primary btn-sm flex-shrink-0">
            {t('installPwaBanner.howTo')}
          </button>
        ) : (
          <button type="button" onClick={promptInstall} className="btn btn-primary btn-sm flex-shrink-0">
            {t('installPwaBanner.install')}
          </button>
        )}
      </div>
      {showManualGuide && showGuide && (
        <ol className="text-xs text-[#AAA] mt-3 pt-3 border-t border-white/10 leading-relaxed list-decimal ps-4 space-y-0.5">
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
  )
}
