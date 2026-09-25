import { useSyncExternalStore, useCallback } from 'react'

// Une seule mini-carte dépliée à la fois dans toute l'application (chantier « lieu de mission »,
// phase 2) : ouvrir le lieu d'une annonce referme celui de la précédente. Évite d'instancier N
// cartes Leaflet dans une liste de 20 à 200 missions (audit §4). Clé = portée + id de mission
// (`oeil-available:<id>`, `oeil-active:<id>`…), pour qu'une même mission affichée à deux endroits
// ne s'ouvre qu'à l'endroit cliqué.
let openKey = null
const listeners = new Set()
function subscribe(cb) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}
function setOpenKey(k) {
  openKey = k
  listeners.forEach((cb) => cb())
}

export default function useExclusiveMapToggle(key) {
  const open = useSyncExternalStore(subscribe, () => openKey === key)
  const toggle = useCallback(() => setOpenKey(openKey === key ? null : key), [key])
  return [open, toggle]
}
