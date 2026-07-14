import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import ComplianceModal from './ComplianceModalClient'
import { missionsAPI, usersAPI } from '../../api'
import { VILLES, VILLES_LIST } from '../../constants/villes'
import { translateLocation } from '../../constants/villesTranslations'
import { toast } from '../ui'
import { useAuth } from '../../context/AuthContext'



// ── Composant Autocomplete générique ──────────────────────
function Autocomplete({ label, value, onChange, suggestions, placeholder, disabled = false }) {
  const { i18n } = useTranslation()
  const [open, setOpen]     = useState(false)
  const [query, setQuery]   = useState(value || '')
  const ref                  = useRef(null)

  useEffect(() => { setQuery(value || '') }, [value])

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = query.length >= 1
    ? suggestions.filter((s) => s.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
    : suggestions.slice(0, 8)

  const select = (val) => {
    setQuery(val)
    onChange(val)
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <label className="label">{label}</label>
      <input
        className="input"
        value={query}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => { setQuery(e.target.value); onChange(''); setOpen(true) }}
        onFocus={() => setOpen(true)}
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-[#222] border border-white/20 rounded-xl overflow-hidden shadow-xl max-h-48 overflow-y-auto">
          {filtered.map((s) => (
            <div
              key={s}
              onMouseDown={() => select(s)}
              className="px-4 py-2.5 text-sm cursor-pointer hover:bg-[#FF4D00]/10 hover:text-white text-[#CCC] transition-colors"
            >
              {translateLocation(s, i18n.language)}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const MIN_PRICES = {
  // Immobilier
  'Airbnb':              170,
  'Booking':             170,
  'Avito':               129,
  'Mubawab':             129,
  'Agence immobilière':  149,
  'Particulier':         129,
  // File d'attente
  'Hôpital & clinique':          99,
  'Cabinet de spécialiste':      85,
  'Laboratoire':                 69,
  'Centre de visite technique':  79,
    'CNSS':                       129,
    'ANCFCC':                     109,
    "Services d'état civil":       85,
    'Tribunal':                   109,
    "Centre d'immatriculation":    99,
    'Préfectures / Annexes administratives': 85,
    'Douane':                     129,
    'Bureau des passeports / Cartes nationales': 99,
    'Adoul / Notaires':           109,
    'CRI / Centres régionaux d\'investissement': 109,
    'Impôts (DGI)':                99,
  'ONEE':                        85,
  'REDAL':                       85,
  'RADEEMA':                     85,
  'Consulat étranger':          169,
  'Centre de visas':            149,
  'Attijariwafa':                69,
  'CIH Bank':                    69,
  'Banque Populaire':            69,
  'BMCE':                        69,
  'BMCI':                        69,
  'Al Barid Bank':               69,
  'Inscription universitaire':   99,
  'École privée':                85,
  'Bourse & dossier étudiant':   99,
  // Audit
  'Restaurant (Temps d\'attente, Propreté, Qualité du service)': 209,
  'Café (Accueil, Rapidité, Propreté)':                         169,
  'Hôtel (Check-in, Service client, Propreté)':                 299,
  'Salle de sport (Accueil commercial, État des équipements, Suivi coachs)': 249,
  'Concession automobile (Qualité vendeur, Temps de prise en charge, Suivi commercial)': 249,
  'Agence immobilière (Qualité accueil, Réactivité, Compétence commerciale)': 209,
  // Personnalisée
  'Présence physique':  85,
  'Accompagnement':    129,
  'Vérification':       99,
  'Livraison':          69,
  // Défaut par type
  '_immobilier':        129,
  '_file_attente':       85,
  '_audit':             209,
  '_personnalisee':      85,
  '_default':            50,
}

function getMinPrice(type, sub) {
  if (sub && MIN_PRICES[sub]) return MIN_PRICES[sub]
  return MIN_PRICES[`_${type}`] || MIN_PRICES['_default']
}

// ── Catégories et sous-catégories ─────────────────────────
// Note : les libellés de sous-catégories servent aussi de valeurs de données
// (clé de lookup MIN_PRICES + valeur envoyée au backend) : la value ne change jamais,
// seul le texte affiché est traduit via newMissionModal.subcategories/groupLabels.
const CATEGORIES = {
  immobilier: {
    icon: '🏠', labelKey: 'immobilier',
    subcategories: ['Airbnb','Booking','Avito','Mubawab','Agence immobilière','Particulier','Autre'],
    placeholderKey: 'immobilier',
  },
  file_attente: {
    icon: '⏳', labelKey: 'fileAttente',
    subcategories: null,
    groups: [
        { label: 'Véhicules & Transport', items: ['Centre de visite technique','Autre'] },
        { label: 'Centres de santé', items: ['Hôpital & clinique','Cabinet de spécialiste','Laboratoire','Autre'] },
        { label: 'Administrations',  items: ['CNSS','ANCFCC','Services d\'état civil','Tribunal','Centre d\'immatriculation','Préfectures / Annexes administratives','Douane','Bureau des passeports / Cartes nationales','Adoul / Notaires','CRI / Centres régionaux d\'investissement','Impôts (DGI)','Autre'] },
      { label: 'Services publics', items: ['ONEE','REDAL','RADEEMA','Autre'] },
      { label: 'Consulats et visas', items: ['Consulat étranger','Centre de visas','Autre'] },
      { label: 'Banques', items: ['Attijariwafa','CIH Bank','Banque Populaire','BMCE','BMCI','Al Barid Bank','Autre'] },
      { label: 'Éducation', items: ['Inscription universitaire','École privée','Bourse & dossier étudiant','Autre'] },
      { label: 'Autre', items: ['À préciser'] },
    ],
    placeholderKey: 'fileAttente',
  },
  audit: {
    icon: '🔎', labelKey: 'audit',
    subcategories: [
      'Restaurant (Temps d\'attente, Propreté, Qualité du service)',
      'Café (Accueil, Rapidité, Propreté)',
      'Hôtel (Check-in, Service client, Propreté)',
      'Salle de sport (Accueil commercial, État des équipements, Suivi coachs)',
      'Concession automobile (Qualité vendeur, Temps de prise en charge, Suivi commercial)',
      'Agence immobilière (Qualité accueil, Réactivité, Compétence commerciale)',
    ],
    groups: null,
    placeholderKey: 'audit',
  },
  personnalisee: {
    icon: '🎯', labelKey: 'personnalisee',
    subcategories: ['Présence physique','Accompagnement','Vérification','Livraison','Autre'],
    placeholderKey: 'personnalisee',
  },
}

function SubcategorySelector({ type, value, onChange, t }) {
  const cat = CATEGORIES[type]
  if (!cat) return null
  if (cat.subcategories) {
    return (
      <div>
        <label className="label">{t('newMissionModal.subcategoryLabel')}</label>
        <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">{t('newMissionModal.selectPlaceholder')}</option>
          {cat.subcategories.map((s) => <option key={s} value={s}>{t(`newMissionModal.subcategories.${s}`, s)}</option>)}
        </select>
      </div>
    )
  }
  if (cat.groups) {
    return (
      <div>
        <label className="label">{t('newMissionModal.subcategoryLabelRequired')}</label>
        <select className="input" value={value} onChange={(e) => onChange(e.target.value)} required>
          <option value="">{t('newMissionModal.selectPlaceholder')}</option>
          {cat.groups.map((g) => (
            <optgroup key={g.label} label={t(`newMissionModal.groupLabels.${g.label}`, g.label)}>
              {g.items.map((item) => (
                <option key={item} value={`${g.label} — ${item}`}>{t(`newMissionModal.subcategories.${item}`, item)}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
    )
  }
  return null
}

export default function NewMissionModal({ open, onClose, onCreated, preselectedOeil }) {
  const { t }             = useTranslation()
  const { user }          = useAuth()
  const [type, setType]   = useState('immobilier')
  const [subcategory, setSub] = useState('')
  const [loading, setLoading] = useState(false)
  const [form, setForm]   = useState({ title: '', address: '', city: '', quartier: '', price: '', description: '', scheduled_date: '', scheduled_time: ''  })
  const [replacementPreference, setReplacementPreference] = useState('fast')
  const [showCompliance, setShowCompliance] = useState(false)
  const [promoCode, setPromoCode]     = useState('')
  const [promoResult, setPromoResult] = useState(null)
  const [promoLoading, setPromoLoading] = useState(false)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const setVal = (k) => (v) => setForm((f) => ({ ...f, [k]: v }))

  const validatePromo = async () => {
    if (!promoCode.trim()) return
    if (!form.price) { toast(t('newMissionModal.errors.enterBudgetBeforePromo'), 'error'); return }
    setPromoLoading(true)
    try {
      const { data } = await usersAPI.validatePromo({ code: promoCode, price: parseFloat(form.price) })
      setPromoResult(data)
      toast(t('newMissionModal.promoAppliedToast', { code: data.code, discount: data.discount }), 'success')
    } catch (err) {
      setPromoResult(null)
      toast(err.response?.data?.error || t('newMissionModal.errors.invalidPromo'), 'error')
    } finally { setPromoLoading(false) }
  }

  const removePromo = () => { setPromoCode(''); setPromoResult(null) }

  const changeType = (newType) => { setType(newType); setSub('') }

  // Quartiers disponibles selon la ville sélectionnée
  const quartiersDispos = VILLES[form.city] || VILLES_LIST

const submit = async (e) => {
    e.preventDefault()

    if (!e._bypassed) { setShowCompliance(true); return }

if (!form.title || !form.city || !form.price) {
      toast(t('newMissionModal.errors.titleCityBudgetRequired'), 'error')
      return
    }
    if (form.title.trim().length < 6) {
      toast(t('newMissionModal.errors.titleTooShort'), 'error')
      return
    }

const minPrice = getMinPrice(type, subcategory)
if (parseFloat(form.price) < minPrice) {
  toast(t('newMissionModal.errors.budgetBelowMin', { min: minPrice }), 'error')
  return
}


    if (!form.quartier) {
      toast(t('newMissionModal.errors.quartierRequired'), 'error')
      return
    }
    if (!form.scheduled_date || !form.scheduled_time) {
      toast(t('newMissionModal.errors.dateTimeRequired'), 'error')
      return
    }
    if ((type === 'file_attente' || type === 'audit') && !subcategory) {
      toast(t('newMissionModal.errors.subcategoryRequired'), 'error')
      return
    }

    setLoading(true)
    try {
      const adresseFull = [form.quartier, form.city].filter(Boolean).join(', ')
      const payload = {
        type,
        subcategory:  subcategory || null,
        title:        form.title,
        address:      form.address || adresseFull,
        city:         form.city,
        quartier:     form.quartier || null,
        price:        parseFloat(form.price),
        description:  form.description,
        scheduled_at: (() => {
  const dt = new Date(`${form.scheduled_date}T${form.scheduled_time}`)
  return dt.toISOString()
})(),
        replacement_preference: replacementPreference,
      }
      if (preselectedOeil?.id) payload.oeil_id = preselectedOeil.id
      if (promoResult) {
        payload.promo_code      = promoResult.code
        payload.discount        = promoResult.discount
        payload.original_price  = promoResult.original_price
        payload.price           = promoResult.final_price
        if (promoResult.platform_amount) payload.platform_amount = promoResult.platform_amount
      }

      const { data } = await missionsAPI.create(payload)
      onCreated?.(data.mission)
      onClose()
    setForm({ title: '', address: '', city: '', quartier: '', price: '', description: '' })
          setType('immobilier')
          setSub('')
          setPromoCode('')
          setPromoResult(null)
          setReplacementPreference('fast')
    } catch (err) {
      toast(err.response?.data?.error || t('newMissionModal.errors.creationError'), 'error')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null
  const cat = CATEGORIES[type]
  const instructionsPlaceholder = type === 'immobilier'   ? t('newMissionModal.instructionsPlaceholder.immobilier') :
              type === 'file_attente' ? t('newMissionModal.instructionsPlaceholder.fileAttente') :
              type === 'audit'        ? t('newMissionModal.instructionsPlaceholder.audit') :
              t('newMissionModal.instructionsPlaceholder.default')

  return (
    <div
      className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#181818] border border-white/20 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-[0_24px_60px_rgba(0,0,0,0.6)]">

        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="font-display font-bold text-base">{t('newMissionModal.title')}</h2>
            <p className="text-xs text-[#AAA] mt-0.5">
              {preselectedOeil
                ? t('newMissionModal.subtitleDirect', { name: `${preselectedOeil.first_name} ${preselectedOeil.last_name}` })
                : t('newMissionModal.subtitleVisible')}
            </p>
          </div>
          <button onClick={onClose} aria-label={t('common.close')} className="text-[#AAA] hover:text-white text-lg">✕</button>
        </div>

        {/* Bannière Œil pré-sélectionné */}
        {preselectedOeil && (
          <div className="flex items-center gap-3 mb-5 p-3 bg-[#FF4D00]/10 border border-[#FF4D00]/25 rounded-xl">
            <div className="w-9 h-9 rounded-full bg-[#FF4D00]/20 flex items-center justify-center text-sm font-bold text-[#FF4D00]">
              {preselectedOeil.first_name?.[0]}{preselectedOeil.last_name?.[0]}
            </div>
            <div>
              <div className="text-sm font-semibold">👁️ {preselectedOeil.first_name} {preselectedOeil.last_name}</div>
              <div className="text-xs text-[#AAA]">{t('newMissionModal.directAssignment', { city: preselectedOeil.city })}</div>
            </div>
            <span className="ms-auto badge badge-orange text-[10px]">{t('newMissionModal.directBadge')}</span>
          </div>
        )}

        {/* Sélecteur de type */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
          {Object.entries(CATEGORIES).map(([id, c]) => (
            <button key={id} type="button" onClick={() => changeType(id)}
              className={`flex flex-col items-center gap-1 py-3 rounded-xl border text-xs font-medium transition-all ${
                type === id
                  ? 'border-[#FF4D00] bg-[#FF4D00]/10 text-white'
                  : 'border-white/12 bg-[#222] text-[#AAA] hover:border-white/22'
              }`}>
              <span className="text-xl">{c.icon}</span>
              <span className="text-center leading-tight">{t(`newMissionModal.categories.${c.labelKey}`)}</span>
            </button>
          ))}
        </div>

        {/* Formulaire */}
        <form onSubmit={submit} className="space-y-3">

          <SubcategorySelector type={type} value={subcategory} onChange={setSub} t={t} />
            {type === 'immobilier' && subcategory && (
              <div className="bg-[#FF4D00]/5 border border-[#FF4D00]/20 rounded-xl p-3 text-xs text-[#AAA] leading-relaxed">
                ⚠️ {t('newMissionModal.immobilierNotice')}
              </div>
            )}

          {/* Titre */}
          <div>
            <label className="label">{t('newMissionModal.titleLabel')}</label>
            <input className="input" value={form.title} onChange={set('title')}
              placeholder={cat ? t(`newMissionModal.placeholders.${cat.placeholderKey}`) : t('newMissionModal.titlePlaceholderDefault')} required />
          </div>

          {/* Ville + Quartier */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Autocomplete
              label={t('newMissionModal.cityLabel')}
              value={form.city}
              onChange={(v) => { setVal('city')(v); setVal('quartier')('') }}
              suggestions={VILLES_LIST}
              placeholder={t('newMissionModal.cityPlaceholder')}
            />
            <Autocomplete
              label={t('newMissionModal.quartierLabel')}
              value={form.quartier}
              onChange={setVal('quartier')}
              suggestions={VILLES[form.city] || []}
              placeholder={form.city ? t('newMissionModal.quartierPlaceholder') : t('newMissionModal.quartierPlaceholderDisabled')}
              disabled={!form.city}
            />
          </div>

          {/* Adresse complète */}
          <div>
            <label className="label">{t('newMissionModal.addressLabel')}</label>
            <input className="input" value={form.address} onChange={set('address')}
              placeholder={t('newMissionModal.addressPlaceholder')} />
          </div>

          {/* Description */}
          <div>
            <label className="label">{t('newMissionModal.instructionsLabel')}</label>
            <textarea className="input resize-none h-20" value={form.description} onChange={set('description')}
              placeholder={instructionsPlaceholder}
            />
          </div>





          {/* Date et heure */}


            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">{t('newMissionModal.dateLabel')}</label>
              <input
                type="date"
                className="input"
                style={{ colorScheme: 'dark', accentColor: '#FF4D00' }}
                value={form.scheduled_date}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setForm(f => ({ ...f, scheduled_date: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="label">{t('newMissionModal.timeLabel')}</label>
              <input
                type="time"
                className="input"
                style={{ colorScheme: 'dark', accentColor: '#FF4D00' }}
                value={form.scheduled_time}
                onChange={(e) => setForm(f => ({ ...f, scheduled_time: e.target.value }))}
                required
              />
            </div>
          </div>



          {/* Budget */}
          <div>
            <label className="label">{t('newMissionModal.budgetLabel')}</label>
            <input type="number" className="input" value={form.price} onChange={set('price')}
              placeholder={t('newMissionModal.budgetPlaceholder', { min: getMinPrice(type, subcategory) })}
              min={getMinPrice(type, subcategory)} required />
            {subcategory && (
              <p className="text-[11px] text-[#AAA] mt-1">
                {t('newMissionModal.budgetMinNotice')} <span className="text-[#FF4D00] font-semibold">{t('newMissionModal.budgetMinValue', { min: getMinPrice(type, subcategory) })}</span>
              </p>
            )}

          </div>

          {/* Code promo */}
          <div>
            <label className="label">{t('newMissionModal.promoLabel')}</label>
            {promoResult ? (
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold text-green-400">{promoResult.code}</span>
                    <span className="text-xs text-[#AAA] ml-2">{t('newMissionModal.promoDiscount', { amount: promoResult.discount })}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-white">{promoResult.final_price} MAD</span>
                    <button onClick={removePromo} className="text-xs text-red-400 hover:text-red-300">{t('newMissionModal.promoRemove')}</button>
                  </div>
                </div>
                {promoResult.type === 'free' && (
                  <div className="border-t border-green-500/20 pt-2 space-y-1">
                    <p className="text-xs text-green-400">{t('newMissionModal.promoFreeNotice')}</p>
                    <p className="text-xs text-[#AAA]">{t('newMissionModal.promoShooflyPays')}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  className="input flex-1"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder={t('newMissionModal.promoPlaceholder')}
                />
                <button
                  type="button"
                  onClick={validatePromo}
                  disabled={promoLoading || !promoCode.trim()}
                  className="btn btn-ghost btn-sm px-4 disabled:opacity-50"
                >
                  {promoLoading ? t('newMissionModal.promoApplying') : t('newMissionModal.promoApply')}
                </button>
              </div>
            )}
          </div>

          {/* Préférence de remplacement en cas d'empêchement */}
          <div>
            <label className="label">{t('newMissionModal.replacementPreference.label')}</label>
            <div className="grid grid-cols-1 gap-2">
              <button
                  type="button"
                  onClick={() => setReplacementPreference('fast')}
                  className={`flex items-start gap-3 text-start p-3 rounded-xl border transition-all ${
                    replacementPreference === 'fast'
                      ? 'border-[#FF4D00] bg-[#FF4D00]/10'
                      : 'border-white/12 bg-[#222] hover:border-white/22'
                  }`}
                >
                  <span className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    replacementPreference === 'fast' ? 'border-[#FF4D00]' : 'border-white/30'
                  }`}>
                    {replacementPreference === 'fast' && <span className="w-2 h-2 rounded-full bg-[#FF4D00]" />}
                  </span>
                  <div>
                    <div className="text-sm font-semibold">🟢 {t('newMissionModal.replacementPreference.fastTitle')}</div>
                    <p className="text-xs text-[#AAA] mt-1 leading-relaxed">{t('newMissionModal.replacementPreference.fastDesc')}</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setReplacementPreference('choose')}
                  className={`flex items-start gap-3 text-start p-3 rounded-xl border transition-all ${
                    replacementPreference === 'choose'
                      ? 'border-[#FF4D00] bg-[#FF4D00]/10'
                      : 'border-white/12 bg-[#222] hover:border-white/22'
                  }`}
                >
                  <span className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    replacementPreference === 'choose' ? 'border-[#FF4D00]' : 'border-white/30'
                  }`}>
                    {replacementPreference === 'choose' && <span className="w-2 h-2 rounded-full bg-[#FF4D00]" />}
                  </span>
                  <div>
                    <div className="text-sm font-semibold">🔵 {t('newMissionModal.replacementPreference.chooseTitle')}</div>
                    <p className="text-xs text-[#AAA] mt-1 leading-relaxed">{t('newMissionModal.replacementPreference.chooseDesc')}</p>
                  </div>
                </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading}
              className="btn btn-primary btn-lg flex-1 justify-center disabled:opacity-60">
              {loading ? t('newMissionModal.submitLoading') : (preselectedOeil ? t('newMissionModal.submitAssign', { name: preselectedOeil.first_name }) : t('newMissionModal.submitSend'))}
            </button>
            <button type="button" onClick={onClose} className="btn btn-ghost btn-lg">{t('newMissionModal.cancel')}</button>
          </div>

          {showCompliance && (
            <ComplianceModal onAccept={() => {
              setShowCompliance(false)
              setTimeout(() => submit({ preventDefault: () => {}, _bypassed: true }), 100)
            }} />
          )}
        </form>
      </div>
    </div>
  )
}