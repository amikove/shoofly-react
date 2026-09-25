import { useEffect, useRef } from 'react'
import { L, TILE_URL, TILE_OPTIONS, pinIcon, watchSize } from './leafletSetup'

// Carte en LECTURE SEULE (chantier « lieu de mission », phase 2). `radius` fourni → cercle de la
// zone approximative (aucune épingle : le centre n'est PAS le lieu) ; sinon → épingle exacte.
// Pas de glisser, pas de molette, pas de clavier : la page reste défilable par-dessus la carte.
// Zoom tactile/boutons limité à ±2 niveaux autour de la vue initiale.
export default function MapView({ lat, lng, radius = null, height = 180, ariaLabel }) {
  const el = useRef(null)

  useEffect(() => {
    const map = L.map(el.current, {
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      touchZoom: 'center',
      zoomControl: true,
      attributionControl: true,
    })
    let unwatch = () => {}
    try {
      // La vue est posée AVANT d'ajouter les couches : circle.getBounds() exige une carte déjà
      // projetée (sinon « layerPointToLatLng of undefined ») — le cadrage du cercle est donc
      // calculé depuis le centre et le rayon (LatLng.toBounds, en mètres).
      if (radius) map.fitBounds(L.latLng(lat, lng).toBounds(radius * 2), { padding: [10, 10] })
      else map.setView([lat, lng], 16)
      L.tileLayer(TILE_URL, TILE_OPTIONS).addTo(map)
      if (radius) L.circle([lat, lng], { radius, color: '#FF4D00', weight: 2, fillColor: '#FF4D00', fillOpacity: 0.15, interactive: false }).addTo(map)
      else L.marker([lat, lng], { icon: pinIcon(), interactive: false, keyboard: false }).addTo(map)
      const z = map.getZoom()
      map.setMinZoom(Math.max(0, z - 2))
      map.setMaxZoom(Math.min(19, z + 2))
      unwatch = watchSize(map, el.current)
    } catch (e) {
      map.remove() // conteneur libéré : un nouvel essai de React ne tombe pas sur « already initialized »
      throw e
    }
    return () => { unwatch(); map.remove() }
  }, [lat, lng, radius])

  return (
    <div
      ref={el}
      dir="ltr"
      role="img"
      aria-label={ariaLabel}
      style={{ height }}
      className="w-full rounded-xl overflow-hidden isolate bg-[#222]"
    />
  )
}
