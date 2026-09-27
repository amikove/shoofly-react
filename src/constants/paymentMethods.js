// Options de paiement du formulaire de mission — seule 'cash' est active aujourd'hui (PayZone n'a
// pas encore de clés de production réelles, voir décision de session 2026-08-13). 'payzone' reste
// déclarée ici, désactivée : la réactiver plus tard ne demande que enabled:true, aucun changement JSX.
// Source unique : NewMissionModal.jsx (choix du mode de paiement) et ticketCategories.js
// (sous-catégories « Paiement » client liées au paiement en ligne) lisent ce tableau.
export const PAYMENT_METHODS = [
  { value: 'cash', labelKey: 'cash', enabled: true },
  { value: 'payzone', labelKey: 'payzone', enabled: false },
]

export const DEFAULT_PAYMENT_METHOD = PAYMENT_METHODS.find((m) => m.enabled)?.value || 'cash'

// true dès qu'un mode de paiement autre que le cash est activé.
export const ONLINE_PAYMENT_ENABLED = PAYMENT_METHODS.some((m) => m.value !== 'cash' && m.enabled)
