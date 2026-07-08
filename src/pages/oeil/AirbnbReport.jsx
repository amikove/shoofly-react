import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import Topbar from '../../components/layout/Topbar'
import { missionsAPI, reportsAPI } from '../../api'
import { Spinner, toast } from '../../components/ui'
import { translateLocation } from '../../constants/villesTranslations'
import { CUISINE_ITEMS, POINTS_FORTS, POINTS_FAIBLES } from '../../constants/airbnbReportLabels'

// ── Composant Note étoiles ─────────────────────────────────
function StarRating({ value, onChange, label }) {
  return (
    <div>
      {label && <label className="label">{label}</label>}
      <div className="flex gap-1 mt-1">
        {[1,2,3,4,5].map((s) => (
          <button key={s} type="button" onClick={() => onChange(s)}
            className={`text-2xl transition-all ${s <= (value||0) ? 'text-yellow-400' : 'text-white/20'}`}>
            ★
          </button>
        ))}
        {value && <span className="text-xs text-[#AAA] ml-2 self-center">{value}/5</span>}
      </div>
    </div>
  )
}

// ── Composant Oui/Non ──────────────────────────────────────
function OuiNon({ value, onChange, label }) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5">
      <span className="text-sm text-[#CCC]">{label}</span>
      <div className="flex gap-2">
        {['oui','non'].map((v) => (
          <button key={v} type="button" onClick={() => onChange(v)}
            className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
              value === v
                ? v === 'oui' ? 'bg-green-500/20 border-green-500/40 text-green-400'
                              : 'bg-red-500/20 border-red-500/40 text-red-400'
                : 'border-white/12 text-[#AAA] hover:border-white/22'
            }`}>
            {v === 'oui' ? t('oeilAirbnbReport.ouiNon.oui') : t('oeilAirbnbReport.ouiNon.non')}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Composant Section ──────────────────────────────────────
function Section({ number, title, children }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="card mb-4">
      <button type="button" onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#FF4D00] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
            {number}
          </span>
          <span className="font-semibold text-sm">{title}</span>
        </div>
        <span className="text-[#AAA] text-sm">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="space-y-3">{children}</div>}
    </div>
  )
}

// ── Score calculator ───────────────────────────────────────
function calculateScore(data) {
  let score = 0
  // Propreté /20
  if (data.proprete_note) score += (data.proprete_note / 5) * 12
  if (data.sols_propres === 'oui') score += 2
  if (data.sdb_propre === 'oui') score += 2
  if (data.literie_propre === 'oui') score += 2
  if (data.odeurs === 'non') score += 2
  // Conformité /15
  if (data.conformite === 'oui') score += 15
  else if (data.conformite === 'partiellement') score += 8
  else if (data.photos_conformite === 'conformes') score += 5
  // Confort /15
  if (data.confort_lit) score += (data.confort_lit / 5) * 5
  if (data.confort_canape) score += (data.confort_canape / 5) * 5
  if (data.confort_global) score += (data.confort_global / 5) * 5
  // Équipements /15
  const equip = [data.wifi, data.clim, data.eau_chaude, data.tv, data.refrigerateur, data.micro_onde, data.machine_laver]
  const ok = equip.filter(e => e === 'oui' || e === 'fonctionnelle' || e === 'disponible').length
  score += (ok / equip.length) * 15
  // Bruit /10
  if (data.bruit_exterieur) score += (data.bruit_exterieur / 5) * 5
  if (data.isolation_phonique) score += (data.isolation_phonique / 5) * 5
  // Sécurité /10
  if (data.securite_note) score += (data.securite_note / 5) * 4
  if (data.porte_securisee === 'oui') score += 3
  if (data.quartier_rassurant === 'oui') score += 3
  // Environnement /10
  if (data.restaurants) score += (data.restaurants / 5) * 2.5
  if (data.commerces) score += (data.commerces / 5) * 2.5
  if (data.transports) score += (data.transports / 5) * 2.5
  if (data.interet_touristique) score += (data.interet_touristique / 5) * 2.5
  // Luminosité /5
  if (data.luminosite) score += (data.luminosite / 5) * 5
  return Math.min(100, Math.round(score))
}

function scoreLabel(s, t) {
  if (s >= 90) return { label: t('oeilAirbnbReport.scoreLabels.excellent'), color: 'text-green-400' }
  if (s >= 80) return { label: t('oeilAirbnbReport.scoreLabels.veryGood'), color: 'text-green-400' }
  if (s >= 70) return { label: t('oeilAirbnbReport.scoreLabels.correct'), color: 'text-yellow-400' }
  if (s >= 60) return { label: t('oeilAirbnbReport.scoreLabels.average'), color: 'text-orange-400' }
  return { label: t('oeilAirbnbReport.scoreLabels.disappointing'), color: 'text-red-400' }
}

// ── Page principale ────────────────────────────────────────
export default function AirbnbReport() {
  const { t, i18n } = useTranslation()
  const { missionId } = useParams()
  const navigate = useNavigate()
  const [mission, setMission] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [data, setData] = useState({})
  const score = calculateScore(data)
  const { label: scoreLbl, color: scoreColor } = scoreLabel(score, t)

  const set = (key) => (value) => setData(d => ({ ...d, [key]: value }))
  const setCheck = (key) => (e) => setData(d => ({
    ...d, [key]: e.target.checked
      ? [...(d[key] || []), e.target.value]
      : (d[key] || []).filter(v => v !== e.target.value)
  }))

  useEffect(() => {
    Promise.all([
      missionsAPI.get(missionId),
      reportsAPI.get(missionId),
    ]).then(([mRes, rRes]) => {
      setMission(mRes.data.mission || mRes.data)
      if (rRes.data.report) {
        setData(rRes.data.report.data || {})
        setSubmitted(rRes.data.report.submitted || false)
      }
    }).catch(() => toast(t('oeilAirbnbReport.toasts.loadError'), 'error'))
      .finally(() => setLoading(false))
  }, [missionId])

  // Sauvegarde automatique toutes les 30s
  useEffect(() => {
    if (submitted) return
    const interval = setInterval(() => {
      reportsAPI.save(missionId, data, false).catch(() => {})
    }, 30000)
    return () => clearInterval(interval)
  }, [data, missionId, submitted])

  const save = async () => {
    setSaving(true)
    try {
      await reportsAPI.save(missionId, data, false)
      toast(t('oeilAirbnbReport.toasts.saved'), 'success')
    } catch { toast(t('oeilAirbnbReport.toasts.saveError'), 'error') }
    finally { setSaving(false) }
  }

  
  
// tous les champs du formulaire sont obligatoire

const validateAirbnb = () => {
    const missing = []
    // Section 1 — Première impression
    if (!data.conformite)        missing.push('S1 — Conformité annonce')
    if (!data.note_generale)     missing.push('S1 — Note générale')
    // Section 2 — Propreté
    if (!data.proprete_note)     missing.push('S2 — Note propreté')
    if (!data.sols_propres)      missing.push('S2 — Sols propres')
    if (!data.sdb_propre)        missing.push('S2 — Salle de bain')
    if (!data.literie_propre)    missing.push('S2 — Literie')
    if (!data.odeurs)            missing.push('S2 — Odeurs')
    // Section 3 — Confort
    if (!data.confort_lit)       missing.push('S3 — Confort lit')
    if (!data.confort_global)    missing.push('S3 — Confort global')
    // Section 4 — Bruit
    if (!data.bruit_exterieur)   missing.push('S4 — Bruit extérieur')
    if (!data.isolation_phonique) missing.push('S4 — Isolation phonique')
    // Section 6 — Luminosité
    if (!data.luminosite)        missing.push('S6 — Luminosité')
    // Section 7 — Sécurité
    if (!data.securite_note)     missing.push('S7 — Sécurité')
    if (!data.porte_securisee)   missing.push('S7 — Porte sécurisée')
    if (!data.quartier_rassurant) missing.push('S7 — Quartier rassurant')
    // Section 9 — Environnement
    if (!data.restaurants)       missing.push('S9 — Restaurants')
    if (!data.commerces)         missing.push('S9 — Commerces')
    if (!data.transports)        missing.push('S9 — Transports')
    // Section 10 — Photos
    if (!data.photos_conformite) missing.push('S10 — Conformité photos')
    // Section 11 — Points forts/faibles
    if (!data.points_forts?.length)  missing.push('S11 — Au moins 1 point fort')
    if (!data.points_faibles?.length) missing.push('S11 — Au moins 1 point faible')
    // Section 12 — Recommandation
    if (!data.recommandation)    missing.push('S12 — Recommandation finale')
    return missing
  }

  const submit = async () => {
    const missing = validateAirbnb()
    if (missing.length > 0) {
      toast(t('oeilAirbnbReport.toasts.missingFields', { count: missing.length }), 'error')
      return
    }
    if (!window.confirm(t('oeilAirbnbReport.confirmSubmit'))) return
    setSaving(true)
    try {
      await reportsAPI.save(missionId, data, true)
      setSubmitted(true)
      toast(t('oeilAirbnbReport.toasts.submitted'), 'success')
    } catch { toast(t('oeilAirbnbReport.toasts.submitError'), 'error') }
    finally { setSaving(false) }
  }



  if (loading) return (
    <AppLayout><Topbar title={t('oeilAirbnbReport.title')} />
      <div className="flex-1 flex items-center justify-center"><Spinner size="lg" /></div>
    </AppLayout>
  )

  return (
    <AppLayout>
      <Topbar title={t('oeilAirbnbReport.title')} />
      <div className="p-4 md:p-6 max-w-2xl mx-auto pb-32">

        {/* Mission info */}
        <div className="card mb-4 flex items-center justify-between">
          <div>
            <div className="font-semibold text-sm">{mission?.title}</div>
            <div className="text-xs text-[#AAA]">📍 {translateLocation(mission?.city, i18n.language)} · {mission?.subcategory ? t(`newMissionModal.subcategories.${mission.subcategory}`, mission.subcategory) : ''}</div>
          </div>
          {submitted && <span className="badge badge-green">{t('oeilAirbnbReport.submittedBadge')}</span>}
        </div>

        {/* Score en temps réel */}
        <div className="card mb-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-[#AAA] mb-0.5">{t('oeilAirbnbReport.scoreLabel')}</div>
            <div className={`text-3xl font-bold ${scoreColor}`}>{score}<span className="text-sm text-[#AAA]">/100</span></div>
          </div>
          <div className={`text-sm font-semibold ${scoreColor}`}>{scoreLbl}</div>
        </div>

        {submitted && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-4 text-sm text-green-400 text-center">
            {t('oeilAirbnbReport.submittedBanner')}
          </div>
        )}

        {/* Section 1 — Première impression */}
        <Section number="1" title={t('oeilAirbnbReport.sections.s1.title')}>
          <div>
            <label className="label">{t('oeilAirbnbReport.sections.s1.question')}</label>
            <div className="flex gap-2 mt-1 flex-wrap">
              {['oui','partiellement','non'].map(v => (
                <button key={v} type="button" onClick={() => set('conformite')(v)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    data.conformite === v ? 'border-[#FF4D00] bg-[#FF4D00]/10 text-white' : 'border-white/12 text-[#AAA]'
                  }`}>
                  {v === 'oui' ? t('oeilAirbnbReport.sections.s1.choices.oui') : v === 'partiellement' ? t('oeilAirbnbReport.sections.s1.choices.partiellement') : t('oeilAirbnbReport.sections.s1.choices.non')}
                </button>
              ))}
            </div>
          </div>
          <StarRating label={t('oeilAirbnbReport.sections.s1.generalNoteLabel')} value={data.note_generale} onChange={set('note_generale')} />
          <div>
            <label className="label">{t('oeilAirbnbReport.commentLabel')}</label>
            <textarea className="input resize-none h-20" value={data.commentaire_impression || ''}
              onChange={e => set('commentaire_impression')(e.target.value)}
              placeholder={t('oeilAirbnbReport.sections.s1.commentPlaceholder')} disabled={submitted} />
          </div>
        </Section>

        {/* Section 2 — Propreté */}
        <Section number="2" title={t('oeilAirbnbReport.sections.s2.title')}>
          <StarRating label={t('oeilAirbnbReport.sections.s2.cleanlinessNoteLabel')} value={data.proprete_note} onChange={set('proprete_note')} />
          <OuiNon label={t('oeilAirbnbReport.sections.s2.solsPropresLabel')} value={data.sols_propres} onChange={set('sols_propres')} />
          <OuiNon label={t('oeilAirbnbReport.sections.s2.sdbPropreLabel')} value={data.sdb_propre} onChange={set('sdb_propre')} />
          <OuiNon label={t('oeilAirbnbReport.sections.s2.literiePropreLabel')} value={data.literie_propre} onChange={set('literie_propre')} />
          <OuiNon label={t('oeilAirbnbReport.sections.s2.odeursLabel')} value={data.odeurs} onChange={set('odeurs')} />
          <div className="bg-[#FF4D00]/5 border border-[#FF4D00]/20 rounded-lg p-3 text-xs text-[#FF4D00]">
            {t('oeilAirbnbReport.photosRequiredNotice')}
          </div>
        </Section>

        {/* Section 3 — Confort */}
        <Section number="3" title={t('oeilAirbnbReport.sections.s3.title')}>
          <StarRating label={t('oeilAirbnbReport.sections.s3.confortLitLabel')} value={data.confort_lit} onChange={set('confort_lit')} />
          <StarRating label={t('oeilAirbnbReport.sections.s3.confortCanapeLabel')} value={data.confort_canape} onChange={set('confort_canape')} />
          <StarRating label={t('oeilAirbnbReport.sections.s3.confortGlobalLabel')} value={data.confort_global} onChange={set('confort_global')} />
          <div>
            <label className="label">{t('oeilAirbnbReport.commentLabel')}</label>
            <textarea className="input resize-none h-16" value={data.commentaire_confort || ''}
              onChange={e => set('commentaire_confort')(e.target.value)}
              placeholder={t('oeilAirbnbReport.sections.s3.commentPlaceholder')} disabled={submitted} />
          </div>
        </Section>

        {/* Section 4 — Bruit */}
        <Section number="4" title={t('oeilAirbnbReport.sections.s4.title')}>
          <StarRating label={t('oeilAirbnbReport.sections.s4.bruitExterieurLabel')} value={data.bruit_exterieur} onChange={set('bruit_exterieur')} />
          <StarRating label={t('oeilAirbnbReport.sections.s4.isolationPhoniqueLabel')} value={data.isolation_phonique} onChange={set('isolation_phonique')} />
          <OuiNon label={t('oeilAirbnbReport.sections.s4.fenetresIsoleesLabel')} value={data.fenetres_isolees} onChange={set('fenetres_isolees')} />
          <div className="bg-[#FF4D00]/5 border border-[#FF4D00]/20 rounded-lg p-3 text-xs text-[#FF4D00]">
            {t('oeilAirbnbReport.sections.s4.videoNotice')}
          </div>
        </Section>

        {/* Section 5 — Équipements */}
        <Section number="5" title={t('oeilAirbnbReport.sections.s5.title')}>
          <div className="grid grid-cols-1 gap-0">
            {[
              { key:'wifi', label: t('oeilAirbnbReport.sections.s5.equip.wifi'), opts:['disponible','non disponible'] },
              { key:'clim', label: t('oeilAirbnbReport.sections.s5.equip.clim'), opts:['fonctionnelle','non fonctionnelle'] },
              { key:'eau_chaude', label: t('oeilAirbnbReport.sections.s5.equip.eauChaude'), opts:['fonctionnelle','non fonctionnelle'] },
              { key:'tv', label: t('oeilAirbnbReport.sections.s5.equip.tv'), opts:['fonctionnelle','non fonctionnelle'] },
              { key:'machine_laver', label: t('oeilAirbnbReport.sections.s5.equip.machineLaver'), opts:['oui','non'] },
              { key:'seche_linge', label: t('oeilAirbnbReport.sections.s5.equip.secheLinge'), opts:['oui','non'] },
              { key:'fer_repasser', label: t('oeilAirbnbReport.sections.s5.equip.ferRepasser'), opts:['oui','non'] },
              { key:'produits_nettoyage', label: t('oeilAirbnbReport.sections.s5.equip.produitsNettoyage'), opts:['oui','non'] },
            ].map(({ key, label, opts }) => (
              <OuiNon key={key} label={label}
                value={data[key] === opts[0] ? 'oui' : data[key] === opts[1] ? 'non' : data[key]}
                onChange={(v) => set(key)(v === 'oui' ? opts[0] : opts[1])} />
            ))}
          </div>
          {data.wifi === 'disponible' && (
            <StarRating label={t('oeilAirbnbReport.sections.s5.wifiQualityLabel')} value={data.wifi_qualite} onChange={set('wifi_qualite')} />
          )}
          <div>
            <label className="label mt-2">{t('oeilAirbnbReport.sections.s5.kitchenLabel')}</label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {CUISINE_ITEMS.map(({ value, key }) => (
                <label key={value} className="flex items-center gap-2 text-sm text-[#CCC] cursor-pointer">
                  <input type="checkbox" value={value}
                    checked={(data.cuisine || []).includes(value)}
                    onChange={setCheck('cuisine')}
                    className="accent-[#FF4D00]" disabled={submitted} />
                  {t(`oeilAirbnbReport.sections.s5.kitchenItems.${key}`)}
                </label>
              ))}
            </div>
          </div>
        </Section>

        {/* Section 6 — Luminosité */}
        <Section number="6" title={t('oeilAirbnbReport.sections.s6.title')}>
          <StarRating label={t('oeilAirbnbReport.sections.s6.luminositeLabel')} value={data.luminosite} onChange={set('luminosite')} />
          <div>
            <label className="label">{t('oeilAirbnbReport.sections.s6.expositionLabel')}</label>
            <div className="flex gap-2 mt-1 flex-wrap">
              {['Nord','Sud','Est','Ouest'].map(v => (
                <button key={v} type="button" onClick={() => set('exposition')(v)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    data.exposition === v ? 'border-[#FF4D00] bg-[#FF4D00]/10 text-white' : 'border-white/12 text-[#AAA]'
                  }`}>{v}</button>
              ))}
            </div>
          </div>
        </Section>

        {/* Section 7 — Sécurité */}
        <Section number="7" title={t('oeilAirbnbReport.sections.s7.title')}>
          <StarRating label={t('oeilAirbnbReport.sections.s7.securiteNoteLabel')} value={data.securite_note} onChange={set('securite_note')} />
          <OuiNon label={t('oeilAirbnbReport.sections.s7.porteSecuriseeLabel')} value={data.porte_securisee} onChange={set('porte_securisee')} />
          <OuiNon label={t('oeilAirbnbReport.sections.s7.quartierRassurantLabel')} value={data.quartier_rassurant} onChange={set('quartier_rassurant')} />
          <OuiNon label={t('oeilAirbnbReport.sections.s7.eclairageExterieurLabel')} value={data.eclairage_exterieur} onChange={set('eclairage_exterieur')} />
        </Section>

        {/* Section 8 — Accessibilité */}
        <Section number="8" title={t('oeilAirbnbReport.sections.s8.title')}>
          <StarRating label={t('oeilAirbnbReport.sections.s8.accesFaciliteLabel')} value={data.acces_facilite} onChange={set('acces_facilite')} />
          <OuiNon label={t('oeilAirbnbReport.sections.s8.ascenseurLabel')} value={data.ascenseur} onChange={set('ascenseur')} />
          <OuiNon label={t('oeilAirbnbReport.sections.s8.escaliersDifficilesLabel')} value={data.escaliers_difficiles} onChange={set('escaliers_difficiles')} />
          <OuiNon label={t('oeilAirbnbReport.sections.s8.parkingLabel')} value={data.parking} onChange={set('parking')} />
        </Section>

        {/* Section 9 — Environnement */}
        <Section number="9" title={t('oeilAirbnbReport.sections.s9.title')}>
          <StarRating label={t('oeilAirbnbReport.sections.s9.restaurantsLabel')} value={data.restaurants} onChange={set('restaurants')} />
          <StarRating label={t('oeilAirbnbReport.sections.s9.commercesLabel')} value={data.commerces} onChange={set('commerces')} />
          <StarRating label={t('oeilAirbnbReport.sections.s9.transportsLabel')} value={data.transports} onChange={set('transports')} />
          <StarRating label={t('oeilAirbnbReport.sections.s9.interetTouristiqueLabel')} value={data.interet_touristique} onChange={set('interet_touristique')} />
          <div className="bg-[#FF4D00]/5 border border-[#FF4D00]/20 rounded-lg p-3 text-xs text-[#FF4D00]">
            {t('oeilAirbnbReport.sections.s9.photosNotice')}
          </div>
        </Section>

        {/* Section 10 — Vérification photos */}
        <Section number="10" title={t('oeilAirbnbReport.sections.s10.title')}>
          <div className="flex gap-2 flex-wrap">
            {[
              { v:'conformes', label: t('oeilAirbnbReport.sections.s10.choices.conformes') },
              { v:'legerement', label: t('oeilAirbnbReport.sections.s10.choices.legerement') },
              { v:'tres', label: t('oeilAirbnbReport.sections.s10.choices.tres') },
              { v:'trompeuses', label: t('oeilAirbnbReport.sections.s10.choices.trompeuses') },
            ].map(({ v, label }) => (
              <button key={v} type="button" onClick={() => set('photos_conformite')(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  data.photos_conformite === v ? 'border-[#FF4D00] bg-[#FF4D00]/10 text-white' : 'border-white/12 text-[#AAA]'
                }`}>{label}</button>
            ))}
          </div>
        </Section>

        {/* Section 11 — Points forts/faibles */}
        <Section number="11" title={t('oeilAirbnbReport.sections.s11.title')}>
          <div>
            <label className="label">{t('oeilAirbnbReport.sections.s11.strengthsLabel')}</label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {POINTS_FORTS.map(({ value, key }) => (
                <label key={value} className="flex items-center gap-2 text-sm text-[#CCC] cursor-pointer">
                  <input type="checkbox" value={value}
                    checked={(data.points_forts || []).includes(value)}
                    onChange={setCheck('points_forts')}
                    className="accent-green-500" disabled={submitted} />
                  {t(`oeilAirbnbReport.sections.s11.strengths.${key}`)}
                </label>
              ))}
            </div>
          </div>
          <div className="mt-3">
            <label className="label">{t('oeilAirbnbReport.sections.s11.weaknessesLabel')}</label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {POINTS_FAIBLES.map(({ value, key }) => (
                <label key={value} className="flex items-center gap-2 text-sm text-[#CCC] cursor-pointer">
                  <input type="checkbox" value={value}
                    checked={(data.points_faibles || []).includes(value)}
                    onChange={setCheck('points_faibles')}
                    className="accent-red-500" disabled={submitted} />
                  {t(`oeilAirbnbReport.sections.s11.weaknesses.${key}`)}
                </label>
              ))}
            </div>
          </div>
        </Section>

        {/* Section 12 — Recommandation */}
        <Section number="12" title={t('oeilAirbnbReport.sections.s12.title')}>
          <div className="flex gap-2 flex-wrap">
            {[
              { v:'oui_sans', label: t('oeilAirbnbReport.sections.s12.choices.ouiSans') },
              { v:'oui_reserves', label: t('oeilAirbnbReport.sections.s12.choices.ouiReserves') },
              { v:'moyennement', label: t('oeilAirbnbReport.sections.s12.choices.moyennement') },
              { v:'non', label: t('oeilAirbnbReport.sections.s12.choices.non') },
              { v:'eviter', label: t('oeilAirbnbReport.sections.s12.choices.eviter') },
            ].map(({ v, label }) => (
              <button key={v} type="button" onClick={() => set('recommandation')(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  data.recommandation === v ? 'border-[#FF4D00] bg-[#FF4D00]/10 text-white' : 'border-white/12 text-[#AAA]'
                }`}>{label}</button>
            ))}
          </div>
        </Section>

      </div>

      {/* Barre d'actions fixe en bas */}
      {!submitted && (
        <div className="fixed bottom-20 md:bottom-0 left-0 right-0 md:left-[220px] bg-[#181818] border-t border-white/12 p-4 flex gap-3 z-40">
          <button onClick={save} disabled={saving}
            className="btn btn-ghost flex-1 justify-center disabled:opacity-50">
            {saving ? '...' : t('oeilAirbnbReport.saveButton')}
          </button>
          <button onClick={submit} disabled={saving}
            className="btn btn-primary flex-1 justify-center disabled:opacity-50">
            {saving ? '...' : t('oeilAirbnbReport.submitButton')}
          </button>
        </div>
      )}
    </AppLayout>
  )
}