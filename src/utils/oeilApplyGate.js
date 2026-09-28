// Chantier « première mission offerte + solde insuffisant côté Œil » (2026-09-28) — aides
// d'affichage (aucune règle métier : apply_block est calculé par le serveur, GET /missions?mode=available).

// Postuler est-il bloqué pour cette mission ? (jamais pour une mission où l'Œil a déjà postulé)
export const isApplyBlocked = (m) => !!m?.apply_block && !(m.interested || m.has_interested)

// Libellé du bouton « Postuler » grisé
export function blockedApplyLabel(m, t) {
  return m.apply_block === 'FREE_MISSION_ALREADY_USED' ? t('oeilWallet.freeUsedButton') : t('oeilWallet.insufficientButton')
}
