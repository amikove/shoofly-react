// Chantier « première mission offerte + solde insuffisant côté Œil » (2026-09-28) — aides
// d'affichage (aucune règle métier : apply_block est calculé par le serveur, GET /missions?mode=available).
import { isIOS, isAndroid, isStandalone, pushSupported, requestPushPermission } from '../hooks/useNotifications'

// Postuler est-il bloqué pour cette mission ? (jamais pour une mission où l'Œil a déjà postulé)
export const isApplyBlocked = (m) => !!m?.apply_block && !(m.interested || m.has_interested)

// Libellé du bouton « Postuler » grisé
export function blockedApplyLabel(m, t) {
  return m.apply_block === 'FREE_MISSION_ALREADY_USED' ? t('oeilWallet.freeUsedButton') : t('oeilWallet.insufficientButton')
}

// Clic « Postuler » d'un Œil non vérifié (suspension de l'envoi de CIN, 2026-10-15) : vers la page
// d'upload si la vérification d'identité est active (comportement d'avant, réactivation future),
// sinon un simple rappel — éviter un clic qui renvoie vers une page aussitôt redirigée vers le
// dashboard (VerificationIdentite.jsx se masque elle-même quand le flag est désactivé).
export function onUnverifiedApplyClick(user, { navigate, toast, t }) {
  if (user?.identity_upload_enabled) navigate('/oeil/verification-identite')
  else toast(t('oeilDashboard.available.pendingValidationToast'), 'info')
}

// Suffixe de clé i18n pour le cas « permission refusée » (chantier « lancer sans WhatsApp », BOSS
// 2026-10-23, retouche demandée après validation : Android a 2 chemins de réactivation selon que
// Shoofly tourne en PWA installée ou dans l'onglet Chrome — isStandalone() distingue les deux,
// même signal que partout ailleurs dans ce chantier (PushRequiredBanner.jsx, NotificationBanner.jsx).
export function pushDeniedVariant() {
  if (isAndroid()) return isStandalone() ? 'AndroidApp' : 'AndroidBrowser'
  if (isIOS()) return 'Ios'
  return 'Other'
}

// Clic « Postuler » d'un Œil VÉRIFIÉ mais sans abonnement push actif (chantier « lancer sans
// WhatsApp », BOSS 2026-10-23 — serveur : POST /missions/:id/interest, code PUSH_REQUIRED). Même
// répartition de cas que le bandeau persistant du dashboard (PushRequiredBanner.jsx) : iOS hors
// PWA installée → pointe vers le guide d'installation déjà existant (InstallPwaBanner) ; permission
// navigateur refusée → explique comment la réactiver (Android app/navigateur, iPhone) puisqu'un
// nouveau prompt est impossible ; sinon, le clic sur le toast lui-même déclenche la demande +
// l'abonnement (fait office de bouton « Activer », sans ouvrir de second composant).
export function onPushRequiredApplyClick(user, { toast, t }) {
  if (isIOS() && !isStandalone() && !pushSupported()) {
    toast(t('pushRequiredBanner.toastIos'), 'info')
    return
  }
  if (typeof Notification !== 'undefined' && Notification.permission === 'denied') {
    toast(t(`pushRequiredBanner.toastDenied${pushDeniedVariant()}`), 'info')
    return
  }
  toast(t('pushRequiredBanner.toastAsk'), 'info', { onClick: () => requestPushPermission() })
}
