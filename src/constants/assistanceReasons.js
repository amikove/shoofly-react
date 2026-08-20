// Motifs fixes du flux "Demander assistance" (POST /missions/:id/assistance).
// Volontairement séparé de ticketCategories.js : ce flux est dédié (2 catégories, motifs
// fixes), pas une redirection vers la liste générale de tickets (~35 sous-catégories) — voir
// garde-fous du prompt frontend. Les libellés français ci-dessous sont envoyés tels quels au
// backend comme valeur du champ `reason` (texte libre côté serveur, non validé contre une
// liste — cf. RAPPORT_DEMANDER_ASSISTANCE.md §3.2), quelle que soit la langue de l'UI ; même
// convention que TICKET_CATEGORIES (le libellé français sert aussi de clé de traduction dans
// assistanceRequest.reasons.<libellé>). Chaînes vérifiées mot pour mot contre
// backend/_audit/e2e/family_K_assistance.js et routes/missions.js (POST /:id/assistance).
export const URGENCE_REASONS = [
  'Accident pendant la mission',
  'Agression, vol ou menace',
  'Hospitalisation',
  'Situation dangereuse',
  'Empêchement familial grave',
  'Autre cas de force majeure',
]

export const MISSION_REASONS = [
  'Client absent ou injoignable',
  'Mauvaise adresse',
  'Mission différente de la description',
  'Mission impossible à réaliser sur place',
]
