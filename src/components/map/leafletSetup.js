// Réglages Leaflet communs à MapView et MapPicker. N'est importé QUE par ces deux modules, eux-
// mêmes chargés en différé (LazyMaps.jsx) : Leaflet et sa feuille de style restent hors du
// bundle d'entrée.
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Tuiles OSM publiques (décision Q8 : lancement). La politique d'usage d'OSM exige une
// attribution visible — ne jamais la retirer. Changer de fournisseur = changer ces 2 constantes.
export const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
export const TILE_OPTIONS = {
  maxZoom: 19,
  attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
}

// Épingle en divIcon (émoji) : les images d'icônes par défaut de Leaflet se cassent avec Vite.
export function pinIcon() {
  return L.divIcon({
    className: 'shoofly-map-pin',
    html: '<span style="font-size:30px;line-height:30px;display:block;filter:drop-shadow(0 2px 2px rgba(0,0,0,.6))">📍</span>',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
  })
}

// Redimensionne la carte quand son conteneur change de taille (modale qui s'ouvre, rotation
// d'écran) — sinon Leaflet garde la taille lue au montage et affiche des tuiles grises.
export function watchSize(map, el) {
  if (typeof ResizeObserver === 'undefined') return () => {}
  const ro = new ResizeObserver(() => map.invalidateSize())
  ro.observe(el)
  return () => ro.disconnect()
}

export { L }
