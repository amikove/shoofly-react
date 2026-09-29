// Téléphone (décisions BOSS D1, 2026-09-28) — code d'erreur serveur → clé i18n FR/AR, selon le rôle.
// Le serveur reste seul juge du format (Œil : mobile marocain ; client : marocain ou étranger) et
// de l'unicité ; ce fichier ne fait que traduire sa réponse.
export function phoneErrorKey(code, role) {
  if (code === 'INVALID_PHONE') return role === 'oeil' ? 'phone.errors.invalidOeil' : 'phone.errors.invalidClient'
  if (code === 'PHONE_TAKEN') return 'phone.errors.taken'
  if (code === 'PHONE_REQUIRED') return 'phone.errors.required'
  return null
}

// Exemple affiché dans le champ, selon le rôle
export const phonePlaceholder = (role) => (role === 'oeil' ? '+212 6xx xxx xxx' : '+212 6xx xxx xxx · +33 6 xx xx xx xx')
