// Catégories et sous-catégories des tickets de support.
// Convention identique à CATEGORIES dans NewMissionModal.jsx : le libellé français
// sert à la fois de valeur envoyée au backend (colonne subcategory, texte libre) et
// de clé de traduction dans ticketCategories.subcategories.<libellé> (fr.json/ar.json).
//
// missionRelevant : si true, le formulaire de création de ticket propose de rattacher
// une mission existante lorsque cette sous-catégorie est sélectionnée.
// redirectRoute   : si non-null, le formulaire affiche un lien vers cette route avant
// la création du ticket (l'utilisateur peut quand même créer le ticket).
// manualNote      : si true, aucune route de redirection n'existe — un message est
// ajouté au message initial pour indiquer un traitement manuel par un admin.

export const TICKET_CATEGORIES = [
  {
    value: 'urgence',
    labelKey: 'urgence',
    icon: '🚨',
    color: '#E11D2E',
    roles: ['client', 'oeil'],
    subcategories: [
      { label: 'Accident pendant la mission', missionRelevant: true },
      { label: 'Agression, vol ou menace', missionRelevant: true },
      { label: 'Hospitalisation', missionRelevant: true },
      { label: 'Situation dangereuse', missionRelevant: true },
    ],
  },
  {
    value: 'mission',
    labelKey: 'mission',
    icon: '📋',
    roles: ['client', 'oeil'],
    subcategoriesByRole: {
      client: [
        { label: 'Ma mission est en retard', missionRelevant: true },
        { label: 'Mon Œil ne répond plus', missionRelevant: true },
        { label: "L'Œil ne s'est jamais présenté", missionRelevant: true },
      ],
      oeil: [
        { label: "Impossible d'accepter une mission", missionRelevant: true },
        { label: 'Client absent', missionRelevant: true },
        { label: 'Mauvaise adresse', missionRelevant: true },
        { label: 'Mission différente de la description', missionRelevant: true },
        { label: 'Client injoignable', missionRelevant: true },
        { label: "Besoin d'assistance", missionRelevant: true },
        { label: 'Empêchement grave', missionRelevant: true },
      ],
    },
  },
  {
    value: 'paiement',
    labelKey: 'paiement',
    icon: '💳',
    roles: ['client', 'oeil'],
    subcategoriesByRole: {
      client: [
        { label: 'Paiement refusé', missionRelevant: true },
        { label: 'Double paiement', missionRelevant: true },
        { label: 'Demande de remboursement', missionRelevant: true },
        { label: 'Coupon de réduction', missionRelevant: false },
        { label: 'Solde du portefeuille', missionRelevant: false },
        { label: 'Transaction inconnue', missionRelevant: false },
      ],
      oeil: [
        { label: 'Paiement non reçu', missionRelevant: true },
        { label: 'Montant incorrect', missionRelevant: true },
        { label: 'Retrait portefeuille', missionRelevant: false, redirectRoute: '/oeil/gains' },
      ],
    },
  },
  {
    value: 'compte',
    labelKey: 'compte',
    icon: '👤',
    roles: ['client', 'oeil'],
    subcategoriesByRole: {
      client: [
        { label: 'Problème de connexion', missionRelevant: false },
        { label: 'Je ne reçois pas le code SMS', missionRelevant: false },
        { label: 'Je ne reçois pas le code WhatsApp', missionRelevant: false },
        { label: 'Mon compte est bloqué', missionRelevant: false },
        { label: 'Supprimer mon compte', missionRelevant: false, redirectRoute: null },
      ],
      oeil: [
        { label: 'Changer mon RIB', missionRelevant: false, redirectRoute: null },
        { label: 'Mon compte est bloqué', missionRelevant: false, redirectRoute: '/oeil/suspendu' },
      ],
    },
  },
  {
    value: 'verification',
    labelKey: 'verification',
    icon: '🪪',
    roles: ['oeil'],
    subcategories: [
      { label: 'Validation CIN', missionRelevant: false, redirectRoute: '/oeil/verification-identite' },
      { label: 'Validation selfie', missionRelevant: false, redirectRoute: '/oeil/verification-identite' },
      { label: 'Validation IBAN', missionRelevant: false, redirectRoute: null },
    ],
  },
  {
    value: 'securite',
    labelKey: 'securite',
    icon: '🛡️',
    roles: ['client', 'oeil'],
    subcategoriesByRole: {
      client: [
        { label: 'Activité suspecte', missionRelevant: false },
        { label: "Quelqu'un utilise mon compte", missionRelevant: false },
        { label: 'Signaler une fraude', missionRelevant: false },
      ],
      oeil: [
        { label: 'Client agressif', missionRelevant: true },
        { label: 'Menaces', missionRelevant: true },
        { label: 'Harcèlement', missionRelevant: true },
        { label: "Tentative d'arnaque", missionRelevant: true },
      ],
    },
  },
  {
    value: 'assistance_technique',
    labelKey: 'assistanceTechnique',
    icon: '🛠️',
    roles: ['client', 'oeil'],
    subcategories: [
      { label: 'Bug', missionRelevant: false },
      { label: 'Application lente', missionRelevant: false },
      { label: 'Erreur', missionRelevant: false },
      { label: "Impossible d'envoyer des photos", missionRelevant: false },
      { label: "Impossible d'envoyer une vidéo", missionRelevant: false },
      { label: 'Localisation incorrecte', missionRelevant: false },
      { label: 'Notification absente', missionRelevant: false },
    ],
  },
  {
    value: 'reclamation',
    labelKey: 'reclamation',
    icon: '📢',
    roles: ['client', 'oeil'],
    subcategories: [
      { label: 'Réclamation générale', missionRelevant: true },
      { label: 'Signaler un utilisateur', missionRelevant: true },
      { label: 'Mauvaise expérience', missionRelevant: true },
    ],
  },
  {
    value: 'suggestion',
    labelKey: 'suggestion',
    icon: '💡',
    roles: ['client', 'oeil'],
    subcategories: [
      { label: 'Nouvelle fonctionnalité', missionRelevant: false },
      { label: "Amélioration de l'application", missionRelevant: false },
      { label: 'Nouvelle catégorie de missions', missionRelevant: false },
    ],
  },
  {
    value: 'autre',
    labelKey: 'autre',
    icon: '❓',
    roles: ['client', 'oeil'],
    subcategories: [],
  },
]

// Notes pour les sous-catégories manualNote=true (RGPD/suppression de données) : aucun
// processus RGPD automatisé n'existe — le ticket est créé normalement, un texte est
// simplement ajouté au message initial pour prévenir un traitement manuel par un admin.
export const MANUAL_NOTE_SUFFIX =
  "\n\n[Cette demande sera traitée manuellement par un administrateur — aucun processus automatisé n'est disponible pour ce type de demande.]"

export function getCategoriesForRole(role) {
  return TICKET_CATEGORIES.filter((c) => c.roles.includes(role))
}

export function getSubcategoriesForRole(category, role) {
  if (!category) return []
  if (category.subcategoriesByRole) return category.subcategoriesByRole[role] || []
  return category.subcategories || []
}

// Correspondance documentée entre l'ancien champ libre "type" de
// mission_problem_reports (menu déroulant de l'ancien bouton "Signaler un
// problème", voir PROBLEM_TYPE_OPTIONS dans client/Missions.jsx et le <select>
// inline de oeil/Missions.jsx) et category/subcategory du nouveau système de
// tickets. Sert de référence si un script de reprise des anciennes données est
// un jour nécessaire ; le nouveau bouton (étape 7) n'appelle plus l'ancienne
// route et ouvre directement NewTicketModal pré-rempli avec mission_id +
// category='mission', laissant l'utilisateur choisir la sous-catégorie exacte.
//
// Simplification de TICKET_CATEGORIES (2026-07) : certaines entrées ci-dessous
// pointent désormais vers des sous-catégories supprimées ou déplacées (ex :
// "Le rapport semble incomplet", "Le comportement de l'Œil est inapproprié"
// n'existent plus dans 'mission' ; "Situation dangereuse" n'existe plus dans
// 'securite', seulement dans 'urgence'). C'est acceptable : cet objet est un
// mapping historique de documentation, jamais utilisé par du code actif (voir
// grep), pas une contrainte à maintenir synchronisée avec la liste actuelle.
export const LEGACY_PROBLEM_TYPE_MAPPING = {
  client: {
    'Œil ne répond plus': { category: 'mission', subcategory: 'Mon Œil ne répond plus' },
    "Œil n'est pas sur place": { category: 'mission', subcategory: "L'Œil ne s'est jamais présenté" },
    // Choix arbitraire : "travail insuffisant/non conforme" pourrait aussi correspondre à
    // "Les photos sont insuffisantes" — "Le rapport semble incomplet" retenu comme plus générique.
    'Travail insuffisant / non conforme': { category: 'mission', subcategory: 'Le rapport semble incomplet' },
    'Comportement irrespectueux': { category: 'mission', subcategory: "Le comportement de l'Œil est inapproprié" },
    'Autre problème': { category: 'mission', subcategory: null },
  },
  oeil: {
    // Choix arbitraire : pas d'équivalent exact "insulte" côté Œil — "Client agressif" retenu.
    'Client irrespectueux / insultant': { category: 'securite', subcategory: 'Client agressif' },
    'Client injoignable': { category: 'mission', subcategory: 'Client injoignable' },
    // Choix arbitraire : recoupe à la fois 'securite' et 'urgence' ("Situation dangereuse" existe
    // dans les deux) — classé en 'securite' (non-urgence) car l'ancien flux n'était jamais traité
    // en urgence immédiate ; à reconsidérer si on veut escalader ce cas en urgence par défaut.
    'Lieu dangereux': { category: 'securite', subcategory: 'Situation dangereuse' },
    // Choix arbitraire : pas d'équivalent exact "demande illégale" — "Tentative d'arnaque" retenu
    // comme le plus proche sémantiquement.
    'Demande illégale': { category: 'securite', subcategory: "Tentative d'arnaque" },
    'Autre problème': { category: 'mission', subcategory: null },
  },
}
