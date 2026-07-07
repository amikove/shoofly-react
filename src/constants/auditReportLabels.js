// Mappe les valeurs stockées (françaises, envoyées au backend) vers les clés i18n
// oeilAuditReport.sections.*.items — utilisé à la fois par le formulaire Œil
// (oeil/AuditReport.jsx) et par la vue client (client/AuditReportView.jsx),
// pour garantir un affichage traduit identique des deux côtés.

export const COMPETENCE_COMMERCIALE = [
  { value: 'A posé des questions pour comprendre votre besoin', key: 'aPoseQuestions' },
  { value: 'A présenté plusieurs options', key: 'aPresenteOptions' },
  { value: 'A expliqué les avantages', key: 'aExpliqueAvantages' },
  { value: 'A répondu clairement aux objections', key: 'aReponduObjections' },
  { value: 'A proposé un produit/service complémentaire', key: 'aProposeComplementaire' },
  { value: 'A tenté une vente additionnelle', key: 'aTenteVenteAdditionnelle' },
  { value: "N'a fait aucun effort commercial", key: 'aucunEffortCommercial' },
]

export const POINTS_POSITIFS = [
  { value: 'Personnel accueillant', key: 'personnelAccueillant' },
  { value: 'Service rapide', key: 'serviceRapide' },
  { value: 'Très propre', key: 'tresPropre' },
  { value: 'Bonne ambiance', key: 'bonneAmbiance' },
  { value: 'Produits attractifs', key: 'produitsAttractifs' },
  { value: 'Très professionnel', key: 'tresProfessionnel' },
  { value: 'Bons conseils', key: 'bonsConseils' },
  { value: 'Excellent rapport qualité/prix', key: 'excellentRapportQualitePrix' },
  { value: 'Très bonne organisation', key: 'tresBonneOrganisation' },
  { value: 'Forte confiance', key: 'forteConfiance' },
]

export const POINTS_NEGATIFS = [
  { value: 'Attente excessive', key: 'attenteExcessive' },
  { value: 'Personnel peu accueillant', key: 'personnelPeuAccueillant' },
  { value: 'Manque de professionnalisme', key: 'manqueProfessionnalisme' },
  { value: 'Mauvaise organisation', key: 'mauvaiseOrganisation' },
  { value: 'Prix peu clairs', key: 'prixPeuClairs' },
  { value: 'Établissement sale', key: 'etablissementSale' },
  { value: 'Manque de disponibilité', key: 'manqueDisponibilite' },
  { value: 'Produits mal présentés', key: 'produitsMalPresentes' },
  { value: 'Mauvais conseils', key: 'mauvaisConseils' },
  { value: 'Faible confiance', key: 'faibleConfiance' },
]

export const INCIDENTS = [
  { value: 'Aucun incident', key: 'aucunIncident' },
  { value: 'Personnel impoli', key: 'personnelImpoli' },
  { value: 'Conflit avec un client', key: 'conflitClient' },
  { value: 'Refus de service', key: 'refusService' },
  { value: 'Publicité trompeuse', key: 'publiciteTrompeuse' },
  { value: 'Non-respect des prix affichés', key: 'nonRespectPrix' },
  { value: "Problème d'hygiène", key: 'problemeHygiene' },
  { value: 'Information erronée', key: 'informationErronee' },
  { value: 'Autre', key: 'autre' },
]

function labelFor(list, i18nKeyPrefix, value, t) {
  const found = list.find((i) => i.value === value)
  return found ? t(`${i18nKeyPrefix}.${found.key}`) : value
}

export const competenceCommercialeLabel = (value, t) => labelFor(COMPETENCE_COMMERCIALE, 'oeilAuditReport.sections.s5.items', value, t)
export const pointsPositifsLabel = (value, t) => labelFor(POINTS_POSITIFS, 'oeilAuditReport.sections.s7.positiveItems', value, t)
export const pointsNegatifsLabel = (value, t) => labelFor(POINTS_NEGATIFS, 'oeilAuditReport.sections.s7.negativeItems', value, t)
export const incidentsLabel = (value, t) => labelFor(INCIDENTS, 'oeilAuditReport.sections.s8.items', value, t)
