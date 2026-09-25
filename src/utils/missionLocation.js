// ── Lieu de mission — fonctions PURES partagées (chantier « lieu de mission », phase 2) ──
// Aucune dépendance React / Leaflet : importable depuis Node pour les tests (le frontend n'a
// pas de lanceur de tests), et sans coût sur le bundle d'entrée.
//
// Règle d'affichage (audit §5, contrat backend §11) : le frontend NE DÉCIDE RIEN. Il affiche
// l'exact s'il reçoit location_lat/location_lng, sinon la zone s'il reçoit approx_lat/approx_lng
// + approx_radius_m, sinon rien. Jamais de `if (is_private_residence)` pour cacher une donnée
// reçue : le masquage est fait par le serveur (utils/missionVisibility.js).

// Types de mission pré-cochés « logement privé » dans le formulaire de création. COPIE de
// PRIVATE_RESIDENCE_TYPES (backend, src/constants/missionCategories.js), qui applique la même
// liste quand le client n'envoie pas la case : les deux listes doivent changer ENSEMBLE.
export const PRIVATE_RESIDENCE_TYPES = ['immobilier', 'personnalisee']
export function defaultIsPrivateResidence(type) {
  return PRIVATE_RESIDENCE_TYPES.includes(type)
}

// Boîte du Maroc — COPIE de MOROCCO_BOX (backend, src/utils/missionLocation.js). Sert seulement
// à refuser tôt une position « Ma position » hors du pays ; le serveur reste l'arbitre.
export const MOROCCO_BOX = { latMin: 20.5, latMax: 36.1, lngMin: -17.3, lngMax: -0.9 }
export function isInMorocco(lat, lng) {
  const b = MOROCCO_BOX
  return lat >= b.latMin && lat <= b.latMax && lng >= b.lngMin && lng <= b.lngMax
}

export const round6 = (x) => Math.round(x * 1e6) / 1e6

// Les colonnes NUMERIC arrivent en chaînes ("31.612347") → nombre, ou null.
export function toCoord(v) {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

// { kind: 'exact', lat, lng } | { kind: 'zone', lat, lng, radius } | null
export function readMissionLocation(m) {
  if (!m) return null
  const lat = toCoord(m.location_lat)
  const lng = toCoord(m.location_lng)
  if (lat !== null && lng !== null) return { kind: 'exact', lat, lng }
  const alat = toCoord(m.approx_lat)
  const alng = toCoord(m.approx_lng)
  const radius = toCoord(m.approx_radius_m)
  if (alat !== null && alng !== null && radius !== null && radius > 0) return { kind: 'zone', lat: alat, lng: alng, radius }
  return null
}

// Liens de navigation (audit §5) — seulement pour une position EXACTE reçue.
export const googleMapsUrl = (lat, lng) => `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
export const wazeUrl = (lat, lng) => `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`

// POST /missions/resolve-maps-link → suffixe de clé i18n missionLocation.link.*
export function mapsLinkErrorKey(status, code) {
  if (status === 400) return 'invalid'
  if (status === 422 && code === 'OUT_OF_AREA') return 'outOfArea'
  if (status === 422 && code === 'NAMED_PLACE') return 'namedPlace' // lieu désigné par son nom, sans position
  if (status === 422) return 'unrecognized'
  if (status === 429) return 'tooMany'
  if (status === 502 || status === 504) return 'unavailable'
  return 'generic'
}

// GeolocationPositionError.code → suffixe de clé i18n missionLocation.geo.*
export function geolocErrorKey(err) {
  if (!err) return 'unavailable'
  if (err.code === 1) return 'denied'
  if (err.code === 3) return 'timeout'
  return 'unavailable'
}

export const GEOLOC_OPTIONS = { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
