// Chantier « première mission offerte + solde insuffisant côté Œil » (2026-09-28) — aides
// d'affichage (aucune règle métier : apply_block est calculé par le serveur, GET /missions?mode=available).

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
