import { useTranslation } from 'react-i18next'
import { MapView } from './LazyMaps'
import useExclusiveMapToggle from '../../hooks/useExclusiveMapToggle'
import { readMissionLocation, googleMapsUrl, wazeUrl } from '../../utils/missionLocation'

// Lieu d'une mission, tel que le SERVEUR l'a servi (chantier « lieu de mission », phase 2) :
// épingle si la position exacte est reçue, cercle si seule la zone approximative l'est, rien
// sinon. Aucun test de is_private_residence ici : le masquage est fait côté serveur.
//   scope       préfixe de la clé « une seule carte ouverte » (voir useExclusiveMapToggle)
//   alwaysOpen  carte affichée d'office, sans bouton (fiche d'une seule mission, modale)
//   navButtons  boutons Google Maps / Waze — affichés SEULEMENT si l'exact est reçu
export default function MissionLocationPanel({ mission, scope, alwaysOpen = false, navButtons = false, height = 180, className = '' }) {
  const { t } = useTranslation()
  const loc = readMissionLocation(mission)
  const [openToggle, toggle] = useExclusiveMapToggle(`${scope}:${mission?.id}`)
  if (!loc) return null
  const open = alwaysOpen || openToggle
  const isExact = loc.kind === 'exact'

  return (
    <div className={`space-y-2 ${className}`}>
      {(!alwaysOpen || (navButtons && isExact)) && (
        <div className="flex flex-wrap items-center gap-2">
          {!alwaysOpen && (
            <button type="button" onClick={toggle} aria-expanded={open} className="btn btn-ghost btn-sm">
              {open ? t('missionLocation.hideMap') : t('missionLocation.showMap')}
            </button>
          )}
          {navButtons && isExact && (
            <>
              <a href={googleMapsUrl(loc.lat, loc.lng)} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
                🗺️ {t('missionLocation.openGoogleMaps')}
              </a>
              <a href={wazeUrl(loc.lat, loc.lng)} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
                🚗 {t('missionLocation.openWaze')}
              </a>
            </>
          )}
        </div>
      )}
      {open && (
        <>
          <MapView
            lat={loc.lat}
            lng={loc.lng}
            radius={isExact ? null : loc.radius}
            height={height}
            ariaLabel={t(isExact ? 'missionLocation.mapAriaExact' : 'missionLocation.mapAriaZone')}
          />
          {!isExact && (
            <p className="text-[11px] text-[#AAA]">{t('missionLocation.zoneCaption', { radius: Math.round(loc.radius) })}</p>
          )}
        </>
      )}
    </div>
  )
}
