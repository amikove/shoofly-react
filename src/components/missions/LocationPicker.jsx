import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { missionsAPI } from '../../api'
import { MapPicker } from '../map/LazyMaps'
import { cityView } from '../../constants/villesCentroids'
import { round6, isInMorocco, mapsLinkErrorKey, geolocErrorKey, GEOLOC_OPTIONS } from '../../utils/missionLocation'

// Bloc « 📍 Lieu de la mission » des formulaires de mission (création, modification client,
// modification admin) — chantier « lieu de mission », phase 2. Trois façons de placer l'épingle :
// déplacer la carte (épingle fixe au centre), « Ma position », ou coller un lien Google Maps
// (résolu par le serveur : POST /missions/resolve-maps-link). La carte reste la source de vérité :
// le client voit toujours le point retenu avant d'envoyer.
//   value            { lat, lng } | null
//   onChange         (value) => void
//   isPrivate        booléen affiché dans la case « logement privé »
//   onPrivateChange  (booléen) => void
//   required         création : le lieu est obligatoire (astérisque + texte d'aide)
export default function LocationPicker({ city, value, onChange, isPrivate, onPrivateChange, required = false }) {
  const { t } = useTranslation()
  const [link, setLink] = useState('')
  const [busy, setBusy] = useState(null) // 'geo' | 'link' | null
  const [notice, setNotice] = useState(null) // { tone: 'ok' | 'error', text }
  const linkInputId = useId()

  const locate = () => {
    if (!navigator.geolocation) { setNotice({ tone: 'error', text: t('missionLocation.geo.unsupported') }); return }
    setBusy('geo')
    setNotice(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setBusy(null)
        const lat = round6(pos.coords.latitude)
        const lng = round6(pos.coords.longitude)
        if (!isInMorocco(lat, lng)) { setNotice({ tone: 'error', text: t('missionLocation.geo.outOfArea') }); return }
        onChange({ lat, lng })
        setNotice({ tone: 'ok', text: t('missionLocation.geo.applied') })
      },
      (err) => {
        setBusy(null)
        setNotice({ tone: 'error', text: t(`missionLocation.geo.${geolocErrorKey(err)}`) })
      },
      GEOLOC_OPTIONS,
    )
  }

  const applyLink = async () => {
    if (!link.trim()) return
    setBusy('link')
    setNotice(null)
    try {
      const { data } = await missionsAPI.resolveMapsLink(link.trim())
      onChange({ lat: round6(Number(data.lat)), lng: round6(Number(data.lng)) })
      setLink('')
      setNotice({ tone: 'ok', text: t('missionLocation.link.applied') })
    } catch (err) {
      const key = mapsLinkErrorKey(err.response?.status, err.response?.data?.code)
      setNotice({ tone: 'error', text: t(`missionLocation.link.${key}`) })
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="bg-[#141414] border border-white/10 rounded-xl p-3 space-y-3">
      <div>
        <div className="label mb-1">📍 {t('missionLocation.sectionTitle')}{required ? ' *' : ''}</div>
        <p className="text-[11px] text-[#AAA]">{t('missionLocation.pickerHint')}</p>
      </div>

      <MapPicker value={value} fallbackView={cityView(city)} onChange={(v) => { onChange(v); setNotice(null) }} ariaLabel={t('missionLocation.pickerAria')} />

      <p className={`text-xs ${value ? 'text-green-400' : 'text-[#AAA]'}`}>
        {value ? t('missionLocation.pinPlaced') : t('missionLocation.pinMissing')}
      </p>

      <button type="button" onClick={locate} disabled={!!busy} className="btn btn-ghost btn-sm w-full justify-center disabled:opacity-50">
        {busy === 'geo' ? t('missionLocation.locating') : `📌 ${t('missionLocation.myPosition')}`}
      </button>

      <div>
        <label className="label" htmlFor={linkInputId}>{t('missionLocation.pasteLabel')}</label>
        <div className="flex gap-2">
          <input
            id={linkInputId}
            className="input flex-1 min-w-0"
            dir="ltr"
            inputMode="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyLink() } }}
            placeholder="https://maps.app.goo.gl/…"
          />
          <button type="button" onClick={applyLink} disabled={!!busy || !link.trim()} className="btn btn-ghost btn-sm px-4 disabled:opacity-50">
            {busy === 'link' ? t('missionLocation.pasteLoading') : t('missionLocation.pasteButton')}
          </button>
        </div>
      </div>

      {notice && (
        <p role={notice.tone === 'error' ? 'alert' : 'status'} className={`text-xs ${notice.tone === 'error' ? 'text-red-400' : 'text-green-400'}`}>
          {notice.text}
        </p>
      )}

      <label className="flex items-start gap-2 cursor-pointer">
        <input type="checkbox" className="mt-0.5 accent-[#FF4D00]" checked={!!isPrivate} onChange={(e) => onPrivateChange(e.target.checked)} />
        <span className="text-sm text-white">{t('missionLocation.privateLabel')}</span>
      </label>
      <div className="text-[11px] text-[#AAA] space-y-1 ps-6">
        <p>{t('missionLocation.privateHelp')}</p>
        <p className="text-amber-300/80">{t('missionLocation.privateWarning')}</p>
      </div>
    </div>
  )
}
