// Mappe les valeurs stockées (françaises, envoyées au backend) vers les clés i18n
// oeilAirbnbReport.sections.* — utilisé à la fois par le formulaire Œil
// (oeil/AirbnbReport.jsx) et par la vue client (client/AirbnbReportView.jsx).

export const CUISINE_ITEMS = [
  { value: 'Réfrigérateur', key: 'refrigerateur' },
  { value: 'Micro-onde', key: 'microOnde' },
  { value: 'Four', key: 'four' },
  { value: 'Cafetière', key: 'cafetiere' },
  { value: 'Bouilloire', key: 'bouilloire' },
  { value: 'Vaisselle suffisante', key: 'vaisselle' },
]

export const POINTS_FORTS = [
  { value: 'Vue agréable', key: 'vueAgreable' },
  { value: 'Très propre', key: 'tresPropre' },
  { value: 'Très calme', key: 'tresCalme' },
  { value: 'Quartier agréable', key: 'quartierAgreable' },
  { value: 'Bien équipé', key: 'bienEquipe' },
  { value: 'Moderne', key: 'moderne' },
  { value: 'Spacieux', key: 'spacieux' },
  { value: 'Bonne connexion internet', key: 'bonneConnexion' },
  { value: 'Bon rapport qualité/prix', key: 'bonRapportQualitePrix' },
]

export const POINTS_FAIBLES = [
  { value: 'Bruyant', key: 'bruyant' },
  { value: 'Mauvaise odeur', key: 'mauvaiseOdeur' },
  { value: 'Humidité', key: 'humidite' },
  { value: 'Équipement vétuste', key: 'equipementVetuste' },
  { value: 'Mauvaise literie', key: 'mauvaiseLiterie' },
  { value: 'Photos trompeuses', key: 'photosTrompeuses' },
  { value: 'Quartier peu rassurant', key: 'quartierPeuRassurant' },
  { value: 'Difficulté de stationnement', key: 'difficulteStationnement' },
  { value: 'Mauvaise connexion internet', key: 'mauvaiseConnexion' },
]

function labelFor(list, i18nKeyPrefix, value, t) {
  const found = list.find((i) => i.value === value)
  return found ? t(`${i18nKeyPrefix}.${found.key}`) : value
}

export const cuisineLabel = (value, t) => labelFor(CUISINE_ITEMS, 'oeilAirbnbReport.sections.s5.kitchenItems', value, t)
export const pointsFortsLabel = (value, t) => labelFor(POINTS_FORTS, 'oeilAirbnbReport.sections.s11.strengths', value, t)
export const pointsFaiblesLabel = (value, t) => labelFor(POINTS_FAIBLES, 'oeilAirbnbReport.sections.s11.weaknesses', value, t)
