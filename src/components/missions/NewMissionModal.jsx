import { useState, useRef, useEffect } from 'react'
import ComplianceModal from './ComplianceModalClient'
import { missionsAPI, usersAPI } from '../../api'
import { VILLES, VILLES_LIST } from '../../constants/villes'
import { toast } from '../ui'
import { useAuth } from '../../context/AuthContext'



// ── Composant Autocomplete générique ──────────────────────
function Autocomplete({ label, value, onChange, suggestions, placeholder, disabled = false }) {
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
              {s}
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
  'CNSS':                       129,
  'ANCFCC':                     109,
  "Services d'état civil":       85,
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
const CATEGORIES = {
  immobilier: {
    icon: '🏠', label: 'Immobilier',
    subcategories: ['Airbnb','Booking','Avito','Mubawab','Agence immobilière','Particulier','Autre'],
    placeholder: 'Ex: Visite appartement Agdal — Airbnb',
  },
  file_attente: {
    icon: '⏳', label: "File d'attente",
    subcategories: null,
    groups: [
      { label: 'Centres de santé', items: ['Hôpital & clinique','Cabinet de spécialiste','Laboratoire','Autre'] },
      { label: 'Administrations',  items: ['CNSS','ANCFCC','Services d\'état civil','Autre'] },
      { label: 'Services publics', items: ['ONEE','REDAL','RADEEMA','Autre'] },
      { label: 'Consulats et visas', items: ['Consulat étranger','Centre de visas','Autre'] },
      { label: 'Banques', items: ['Attijariwafa','CIH Bank','Banque Populaire','BMCE','BMCI','Al Barid Bank','Autre'] },
      { label: 'Éducation', items: ['Inscription universitaire','École privée','Bourse & dossier étudiant','Autre'] },
      { label: 'Autre', items: ['À préciser'] },
    ],
    placeholder: 'Ex: File CNSS — Dépôt dossier retraite',
  },
  audit: {
    icon: '🔎', label: 'Audit & Mystery Shop',
    subcategories: [
      'Restaurant (Temps d\'attente, Propreté, Qualité du service)',
      'Café (Accueil, Rapidité, Propreté)',
      'Hôtel (Check-in, Service client, Propreté)',
      'Salle de sport (Accueil commercial, État des équipements, Suivi coachs)',
      'Concession automobile (Qualité vendeur, Temps de prise en charge, Suivi commercial)',
      'Agence immobilière (Qualité accueil, Réactivité, Compétence commerciale)',
    ],
    groups: null,
    placeholder: 'Ex: Audit mystery shop — Restaurant Hassan',
  },
  personnalisee: {
    icon: '🎯', label: 'Personnalisée',
    subcategories: ['Présence physique','Accompagnement','Vérification','Livraison','Autre'],
    placeholder: 'Décrivez en une phrase votre besoin',
  },
}

function SubcategorySelector({ type, value, onChange }) {
  const cat = CATEGORIES[type]
  if (!cat) return null
  if (cat.subcategories) {
    return (
      <div>
        <label className="label">Sous-catégorie</label>
        <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">Sélectionnez...</option>
          {cat.subcategories.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
    )
  }
  if (cat.groups) {
    return (
      <div>
        <label className="label">Sous-catégorie *</label>
        <select className="input" value={value} onChange={(e) => onChange(e.target.value)} required>
          <option value="">Sélectionnez...</option>
          {cat.groups.map((g) => (
            <optgroup key={g.label} label={g.label}>
              {g.items.map((item) => (
                <option key={item} value={`${g.label} — ${item}`}>{item}</option>
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
  const { user }          = useAuth()
  const [type, setType]   = useState('immobilier')
  const [subcategory, setSub] = useState('')
  const [loading, setLoading] = useState(false)
  const [form, setForm]   = useState({ title: '', address: '', city: '', quartier: '', price: '', description: '', scheduled_date: '', scheduled_time: ''  })
  const [showCompliance, setShowCompliance] = useState(false)
  const [promoCode, setPromoCode]     = useState('')
  const [promoResult, setPromoResult] = useState(null)
  const [promoLoading, setPromoLoading] = useState(false)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const setVal = (k) => (v) => setForm((f) => ({ ...f, [k]: v }))

  const validatePromo = async () => {
    if (!promoCode.trim()) return
    if (!form.price) { toast('Entrez un budget avant d\'appliquer un code', 'error'); return }
    setPromoLoading(true)
    try {
      const { data } = await usersAPI.validatePromo({ code: promoCode, price: parseFloat(form.price) })
      setPromoResult(data)
      toast(`Code "${data.code}" appliqué — ${data.discount} MAD de réduction ✓`, 'success')
    } catch (err) {
      setPromoResult(null)
      toast(err.response?.data?.error || 'Code invalide', 'error')
    } finally { setPromoLoading(false) }
  }

  const removePromo = () => { setPromoCode(''); setPromoResult(null) }

  const changeType = (t) => { setType(t); setSub('') }

  // Quartiers disponibles selon la ville sélectionnée
  const quartiersDispos = VILLES[form.city] || VILLES_LIST

const submit = async (e) => {
    e.preventDefault()
console.log('bypassed:', e._bypassed, 'showCompliance:', showCompliance)
    if (!e._bypassed) { setShowCompliance(true); return }
    console.log('form:', form.title, form.city, form.price, form.quartier, form.scheduled_date, form.scheduled_time)

if (!form.title || !form.city || !form.price) {
      toast('Titre, ville et budget sont requis', 'error')
      return
    }
    if (form.title.trim().length < 6) {
      toast('Le titre de la mission doit contenir au moins 6 caractères', 'error')
      return
    }

const minPrice = getMinPrice(type, subcategory)
if (parseFloat(form.price) < minPrice) {
  toast(`Le budget minimum pour cette mission est de ${minPrice} MAD`, 'error')
  return
}


    if (!form.quartier) {
      toast('Quartier obligatoire', 'error')
      return
    }
    if (!form.scheduled_date || !form.scheduled_time) {
      toast('Date et heure de la mission obligatoires', 'error')
      return
    }
    if ((type === 'file_attente' || type === 'audit') && !subcategory) {
      toast('Veuillez sélectionner une sous-catégorie', 'error')
      return
    }

    setLoading(true)
    try {
      console.log('form values:', form.scheduled_date, form.scheduled_time, form.title, form.city, form.quartier, form.price)
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
  console.log('scheduled_at:', dt.toISOString(), 'valid:', !isNaN(dt))
  return dt.toISOString()
})(),
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
    } catch (err) {
      toast(err.response?.data?.error || 'Erreur lors de la création', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null
  const cat = CATEGORIES[type]

  return (
    <div
      className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#181818] border border-white/20 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-[0_24px_60px_rgba(0,0,0,0.6)]">

        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="font-display font-bold text-base">Nouvelle mission</h2>
            <p className="text-xs text-[#AAA] mt-0.5">
              {preselectedOeil
                ? `Mission directe pour ${preselectedOeil.first_name} ${preselectedOeil.last_name}`
                : 'Visible par tous les Œils disponibles'}
            </p>
          </div>
          <button onClick={onClose} className="text-[#AAA] hover:text-white text-lg">✕</button>
        </div>

        {/* Bannière Œil pré-sélectionné */}
        {preselectedOeil && (
          <div className="flex items-center gap-3 mb-5 p-3 bg-[#FF4D00]/10 border border-[#FF4D00]/25 rounded-xl">
            <div className="w-9 h-9 rounded-full bg-[#FF4D00]/20 flex items-center justify-center text-sm font-bold text-[#FF4D00]">
              {preselectedOeil.first_name?.[0]}{preselectedOeil.last_name?.[0]}
            </div>
            <div>
              <div className="text-sm font-semibold">👁️ {preselectedOeil.first_name} {preselectedOeil.last_name}</div>
              <div className="text-xs text-[#AAA]">Attribution directe • {preselectedOeil.city}</div>
            </div>
            <span className="ml-auto badge badge-orange text-[10px]">Direct</span>
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
              <span className="text-center leading-tight">{c.label}</span>
            </button>
          ))}
        </div>

        {/* Formulaire */}
        <form onSubmit={submit} className="space-y-3">

          <SubcategorySelector type={type} value={subcategory} onChange={setSub} />

          {/* Titre */}
          <div>
            <label className="label">Titre de la mission *</label>
            <input className="input" value={form.title} onChange={set('title')}
              placeholder={cat?.placeholder || 'Décrivez votre mission'} required />
          </div>

          {/* Ville + Quartier */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Autocomplete
              label="Ville *"
              value={form.city}
              onChange={(v) => { setVal('city')(v); setVal('quartier')('') }}
              suggestions={VILLES_LIST}
              placeholder="Ex: Rabat"
            />
            <Autocomplete
              label="Quartier *"
              value={form.quartier}
              onChange={setVal('quartier')}
              suggestions={VILLES[form.city] || []}
              placeholder={form.city ? 'Ex: Agdal' : 'Choisir ville d\'abord'}
              disabled={!form.city}
            />
          </div>

          {/* Adresse complète */}
          <div>
            <label className="label">Adresse précise</label>
            <input className="input" value={form.address} onChange={set('address')}
              placeholder="Rue, numéro, bâtiment..." />
          </div>

          {/* Description */}
          <div>
            <label className="label">Instructions particulières</label>
            <textarea className="input resize-none h-20" value={form.description} onChange={set('description')}
              placeholder={
                type === 'immobilier'   ? 'Ex: Vérifier cuisine, salle de bain, pression eau...' :
                type === 'file_attente' ? 'Ex: Guichet 3, dépôt dossier retraite...' :
                type === 'audit'        ? 'Ex: Grille d\'évaluation spécifique...' :
                'Décrivez précisément ce que vous attendez...'
              }
            />
          </div>





          {/* Date et heure */}


            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Date de la mission *</label>
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
              <label className="label">Heure de la mission *</label>
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
            <label className="label">Budget (MAD) *</label>
            <input type="number" className="input" value={form.price} onChange={set('price')}
              placeholder={`Min. ${getMinPrice(type, subcategory)} MAD`}
              min={getMinPrice(type, subcategory)} required />
            {subcategory && (
              <p className="text-[11px] text-[#AAA] mt-1">
                Budget minimum pour cette mission : <span className="text-[#FF4D00] font-semibold">{getMinPrice(type, subcategory)} MAD</span>
              </p>
            )}

          </div>

          {/* Code promo */}
          <div>
            <label className="label">Code promo</label>
            {promoResult ? (
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold text-green-400">{promoResult.code}</span>
                    <span className="text-xs text-[#AAA] ml-2">− {promoResult.discount} MAD</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-white">{promoResult.final_price} MAD</span>
                    <button onClick={removePromo} className="text-xs text-red-400 hover:text-red-300">✕ Retirer</button>
                  </div>
                </div>
                {promoResult.type === 'free' && (
                  <div className="border-t border-green-500/20 pt-2 space-y-1">
                    <p className="text-xs text-green-400">🎁 Mission offerte — 0 MAD pour vous</p>
                    <p className="text-xs text-[#AAA]">💸 Shoofly prend en charge la rémunération de l'Œil</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  className="input flex-1"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="Ex: WELCOME20"
                />
                <button
                  type="button"
                  onClick={validatePromo}
                  disabled={promoLoading || !promoCode.trim()}
                  className="btn btn-ghost btn-sm px-4 disabled:opacity-50"
                >
                  {promoLoading ? '...' : 'Appliquer'}
                </button>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading}
              className="btn btn-primary btn-lg flex-1 justify-center disabled:opacity-60">
              {loading ? 'Envoi en cours...' : (preselectedOeil ? `Assigner à ${preselectedOeil.first_name} →` : 'Envoyer la mission →')}
            </button>
            <button type="button" onClick={onClose} className="btn btn-ghost btn-lg">Annuler</button>
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