// État d'accès en lecture au chat d'une mission, dérivé de chat_access_expires_at
// (API — voir Shoofly/backend/src/routes/missions.js, chatAccessExpiresAt) : ce champ
// est null tant que la mission est active ou en sous_reclamation, sinon closed_at + 24h.
// L'admin est toujours exempté (accès illimité, aligné avec le backend).
//   'open'    → chat normal (lecture + envoi)
//   'grace'   → clôturée depuis moins de 24h : lecture seule
//   'expired' → clôturée depuis plus de 24h : fermé
export function getChatAccessState(mission, isAdmin = false) {
  if (isAdmin) return 'open'
  const expiresAt = mission?.chat_access_expires_at
  if (!expiresAt) return 'open'
  return Date.now() <= new Date(expiresAt).getTime() ? 'grace' : 'expired'
}
