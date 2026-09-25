// Centre approximatif (centre-ville) de chaque ville de constants/villes.js — sert UNIQUEMENT à
// cadrer la carte du formulaire de mission avant que le client ne place l'épingle (chantier
// « lieu de mission », phase 2, 2026-09-24). Jamais utilisé comme lieu de mission : le serveur
// exige une position choisie par le client. Toute ville ajoutée à VILLES doit être ajoutée ici
// (à défaut, la carte s'ouvre sur tout le Maroc — dégradation sans erreur).
export const CITY_CENTROIDS = {
  'Rabat':       [34.0209, -6.8416],
  'Salé':        [34.0531, -6.7985],
  'Témara':      [33.9287, -6.9063],
  'Casablanca':  [33.5731, -7.5898],
  'Marrakech':   [31.6295, -7.9811],
  'Fès':         [34.0331, -5.0003],
  'Meknès':      [33.8935, -5.5473],
  'Tanger':      [35.7595, -5.8340],
  'Agadir':      [30.4278, -9.5981],
  'Oujda':       [34.6814, -1.9086],
  'Kénitra':     [34.2610, -6.5802],
  'Tétouan':     [35.5889, -5.3626],
  'Mohammedia':  [33.6861, -7.3829],
  'El Jadida':   [33.2316, -8.5007],
  'Safi':        [32.2994, -9.2372],
  'Béni Mellal': [32.3373, -6.3498],
  'Nador':       [35.1681, -2.9335],
  'Settat':      [33.0010, -7.6166],
  'Laâyoune':    [27.1253, -13.1625],
}

// Vue par défaut (tout le Maroc) quand aucune ville n'est choisie ou connue.
export const MOROCCO_VIEW = { center: [31.8, -7.1], zoom: 5 }
export const CITY_ZOOM = 12

export function cityView(city) {
  const c = CITY_CENTROIDS[city]
  return c ? { center: c, zoom: CITY_ZOOM } : MOROCCO_VIEW
}
