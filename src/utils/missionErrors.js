// Reformulation, côté affichage uniquement, des messages d'erreur techniques renvoyés par
// l'API mission — SANS toucher au message renvoyé par le backend lui-même.
//
// Réf. RAPPORT_CHANTIER_P3_UX_TECHNIQUE_DOUBLE_CLIC_NAVIGATION_SESSIONS_2026-09-06.md,
// bonus 1/2 : sur un double-clic « Valider »/« Annuler » (ou une action depuis un onglet
// périmé), la 2e requête est rejetée avec le message développeur brut
// « Transition invalide: cancelled → cancelled » (missionStateMachine.js:77 et
// missions.js:1828, tous deux préfixés « Transition invalide: »), affiché tel quel dans un
// toast rouge à côté du toast de succès. On ne reformule QUE ce préfixe : tout autre message
// backend (dont les phrases déjà claires type « payée en espèces… contactez le support »)
// passe inchangé.

const STALE_PREFIX = 'Transition invalide'

// Message à afficher pour une erreur d'action mission (annuler / valider).
export function friendlyMissionError(err, t) {
  if (!err?.response) return t('clientMissions.errors.network')
  const raw = err.response.data?.error
  if (typeof raw === 'string' && raw.startsWith(STALE_PREFIX)) {
    return t('clientMissions.errors.stale')
  }
  return raw || t('clientMissions.errors.generic')
}

// true quand l'erreur traduit un état de mission périmé (2e requête d'un double-clic,
// action depuis un autre onglet non rafraîchi, coupure réseau) — l'appelant doit alors
// resynchroniser sa vue plutôt que laisser des boutons obsolètes en place.
export function isStaleMissionError(err) {
  if (!err?.response) return true
  if (err.response.status === 409) return true
  const raw = err.response.data?.error
  return typeof raw === 'string' && raw.startsWith(STALE_PREFIX)
}
