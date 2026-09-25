import { lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'

// Points d'entrée UNIQUES vers les cartes : Leaflet (JS + CSS) n'est téléchargé qu'au premier
// affichage d'une carte (formulaire de mission ouvert, lieu déplié), jamais au premier chargement
// de l'application. Ne jamais importer MapView / MapPicker / leafletSetup directement ailleurs.
const MapViewImpl = lazy(() => import('./MapView'))
const MapPickerImpl = lazy(() => import('./MapPicker'))

function MapFallback({ height }) {
  const { t } = useTranslation()
  return (
    <div style={{ height }} className="w-full rounded-xl bg-[#222] flex items-center justify-center text-xs text-[#777]">
      {t('missionLocation.loadingMap')}
    </div>
  )
}

export function MapView(props) {
  return (
    <Suspense fallback={<MapFallback height={props.height ?? 180} />}>
      <MapViewImpl {...props} />
    </Suspense>
  )
}

export function MapPicker(props) {
  return (
    <Suspense fallback={<MapFallback height={props.height ?? 200} />}>
      <MapPickerImpl {...props} />
    </Suspense>
  )
}
