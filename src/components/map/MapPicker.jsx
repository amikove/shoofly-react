import { useCallback, useEffect, useRef } from 'react'
import { L, TILE_URL, TILE_OPTIONS, watchSize } from './leafletSetup'
import { round6 } from '../../utils/missionLocation'

const POINT_ZOOM = 17
const same = (a, b) => !!a && !!b && Math.abs(a.lat - b.lat) < 1e-6 && Math.abs(a.lng - b.lng) < 1e-6

// Sélection du lieu (chantier « lieu de mission », phase 2) : ÉPINGLE FIXE AU CENTRE, on déplace
// la carte (plus fiable au doigt qu'une épingle déplaçable dans une modale qui défile — audit
// §3.2). Seul un déplacement fait par l'utilisateur choisit un point : un zoom (centré) ou un
// recadrage fait par le code (ville choisie, « Ma position », lien Maps, valeur existante) ne
// déclenche jamais onChange — sinon le centre de la ville deviendrait le lieu sans action du client.
//   value         { lat, lng } | null — point choisi (recentre la carte quand il change)
//   fallbackView  { center, zoom }   — vue quand aucun point n'est choisi (ville ou Maroc)
export default function MapPicker({ value, fallbackView, onChange, height = 200, ariaLabel }) {
  const el = useRef(null)
  const mapRef = useRef(null)
  const lastCenter = useRef(null)   // dernier centre connu (zoom seul = centre inchangé)
  const expected = useRef(null)     // centre visé par le dernier recadrage fait par le code
  const onChangeRef = useRef(onChange)
  useEffect(() => { onChangeRef.current = onChange }, [onChange])

  // Montage unique : la vue initiale et les recadrages suivants sont gérés par les 2 effets
  // ci-dessous, pas par les dépendances de celui-ci.
  useEffect(() => {
    const map = L.map(el.current, {
      scrollWheelZoom: false,     // la modale reste défilable à la molette ; zoom par les boutons
      touchZoom: 'center',
      doubleClickZoom: 'center',
      boxZoom: false,
      zoomControl: true,
      attributionControl: true,
    })
    L.tileLayer(TILE_URL, TILE_OPTIONS).addTo(map)
    mapRef.current = map
    const onMoveEnd = () => {
      const c = map.getCenter()
      const center = { lat: c.lat, lng: c.lng }
      const wasExpected = same(center, expected.current)
      const unchanged = same(center, lastCenter.current)
      expected.current = null
      lastCenter.current = center
      if (wasExpected || unchanged) return
      onChangeRef.current?.({ lat: round6(center.lat), lng: round6(center.lng) })
    }
    map.on('moveend', onMoveEnd)
    const unwatch = watchSize(map, el.current)
    return () => { unwatch(); map.off('moveend', onMoveEnd); map.remove(); mapRef.current = null }
  }, [])

  const moveTo = useCallback((center, zoom) => {
    const map = mapRef.current
    if (!map) return
    const target = { lat: center[0], lng: center[1] }
    if (map._loaded && same(map.getCenter(), target) && map.getZoom() === zoom) return
    expected.current = target
    lastCenter.current = target
    map.setView(center, zoom, { animate: false })
  }, [])

  // Point choisi (restauration de brouillon, mission existante, « Ma position », lien Maps).
  const vLat = value?.lat ?? null
  const vLng = value?.lng ?? null
  useEffect(() => {
    if (vLat === null || vLng === null) return
    const map = mapRef.current
    if (map && map._loaded && same(map.getCenter(), { lat: vLat, lng: vLng })) return // vient d'un glisser
    moveTo([vLat, vLng], Math.max(map && map._loaded ? map.getZoom() : 0, POINT_ZOOM))
  }, [vLat, vLng, moveTo])

  // Aucun point : cadrage sur la ville (ou le Maroc), recalé quand la ville change.
  const fbKey = fallbackView ? `${fallbackView.center[0]},${fallbackView.center[1]},${fallbackView.zoom}` : ''
  useEffect(() => {
    if (vLat !== null && vLng !== null) return
    if (fallbackView) moveTo(fallbackView.center, fallbackView.zoom)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fbKey résume fallbackView
  }, [fbKey, vLat, vLng, moveTo])

  return (
    <div className="relative w-full" dir="ltr">
      <div ref={el} role="application" aria-label={ariaLabel} style={{ height }} className="w-full rounded-xl overflow-hidden isolate bg-[#222]" />
      {/* Épingle fixe : la pointe est au centre exact de la carte. Au-dessus de toute la carte (conteneur isolé),
          les contrôles Leaflet restent dans les coins. */}
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full z-[500] text-[30px] leading-[30px] drop-shadow">
        📍
      </div>
    </div>
  )
}
