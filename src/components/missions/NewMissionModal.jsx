import { useState, useRef, useEffect } from 'react'
import ComplianceModal from './ComplianceModal'
import { missionsAPI } from '../../api'
import { toast } from '../ui'
import { useAuth } from '../../context/AuthContext'


// ── Données villes / quartiers ─────────────────────────────
const VILLES = {
  'Rabat': ['Agdal','Hassan','Océan','Souissi','Aviation','Hay Riad','Youssoufia','Akkari','Diour Jamaa','Médina','Orangers','Ryad','Centre Ville','Hay Nahda','Hay Fadoul','Takaddoum','Quartier Administratif','Mabella','Hay Taqadoum','Hay Al Matar','Quartier des Ministères'],
  'Salé': ['Bettana','Hay Salam','Tabriquet','Laâyoune','Médina','Hssaine','Sidi Moussa','Bab Lamrissa','Hay Karima','Hay Arrahma','Hay Al Majd','Attacharouk','Hay Essalam','Layayda','Ouled Mtaa','Hay Nasr','Sidi Taibi','Hay Al Wifaq','Hay Al Massira'],
  'Témara': ['Hay Al Fath','Massira','Oumassa','Centre Ville','Ain Attig','Menzeh','Hay Farah','Hay Al Amal','Hay Essalam','Hay Ennour','Hay Nakhil','Résidence Al Wifaq','Hay Nahda','Hay Rihane','Sidi Yahya','Mansouria'],
  'Casablanca': ['Maarif','Bourgogne','Gauthier','Hay Hassani','Ain Chock','Ain Sebaa','Anfa','Bernoussi','Bouskoura','CIL','Californie','Derb Sultan','Hay Mohammadi','Moulay Rachid','Sidi Belyout','Sbata','Médina','Oulfa','Ben M\'sick','Sidi Bernoussi','Roches Noires','Polo','Racine','Val Fleuri','Riviera','Hay Al Farah','Hay Ennakhil','Hay Inara','Lissasfa','Lahraouiyine','Sidi Maarouf','Dar Bouazza','Belvédère','Palmier','Sidi Othmane','Hay El Hana','Zenata','Tit Mellil','Hay Moulay Abdallah','Sidi Moumen','Nassim'],
  'Marrakech': ['Guéliz','Hivernage','Médina','Mellah','Daoudiate','Massira','Syba','M\'hamid','Targa','Azzouzia','Palmeraie','Hay Charaf','Douar Lahna','Sidi Youssef Ben Ali','Bab Doukkala','Ménara','Hay Al Majd','Tamansourt','Iziki','Hay Hassani','Hay Mohammadi','Mouassine','Bab Ghmat','Kennaria','Riad Zitoun','Arset El Maach','Hay Houta','Douar Azboun','Résidence Al Wifaq'],
  'Fès': ['Médina','Ville Nouvelle','Jdid','Saïss','Narjiss','Bensouda','Aouinat Hajjaj','Zouagha','Hay Amal','Hay Mahatta','Atlas','Agdal','Hay Nakhil','Sidi Brahim','Hay Essalam','Ain Chkef','Hay Wifaq','Hay Massira','Dokkarat','Hay Moulay Slimane','Hay Ennahda','Hay Karima','Oued Fès','Hay Al Farah','Ain Kadous'],
  'Meknès': ['Hamria','Médina','Ville Nouvelle','Ismaïlia','Marjane','Bassatine','Hay Salam','Hay Nour','Hay Wifaq','Hay Amal','Hay Inara','Résidence Ismaïlia','Hay Al Majd','Hay Doum','Riad','Hay Mansour','Hay Zitoune','Ain Smen','Borj Moulay Omar','Hay Karima'],
  'Tanger': ['Médina','Malabata','Marshan','Gzenaya','Mesnana','Iberia','California','Achakar','Boukhalef','Hay Karima','Bni Makada','Hay Amal','Dradeb','Ain Ktiouet','Hay Nakhil','Moujahidine','Val Fleuri','Hay Almohades','Hay Nahda','Rmilat','Souani','Branes','Hay Hassani','Hay Mohammadi','Charf','Tanger City Center'],
  'Agadir': ['Hay Mohammadi','Talborjt','Dakhla','Charaf','Bensergao','Anza','Tilila','Founty','Hay Salam','Hay Amal','Hay Al Massira','Tikiouine','Hay Hassani','Adrar','Cité Suisse','Résidence Yasmina','Hay Yassmine','Aourir','Hay Nahda','Hay Al Wifaq','Ait Melloul','Inezgane'],
  'Oujda': ['Médina','Lazaret','Sidi Maâfa','Hay Al Qods','Isly','Université','Hay Salam','Hay Amal','Hay Nakhil','Hay Wifaq','Ain Sfa','Hay Essalam','Hay Al Majd','Hay Riad','Sidi Ziane','Hay Karima','Hay Mohammadi','Hay Andalous','Ennakhil'],
  'Kénitra': ['Médina','Hay Mahatta','Hay Salam','Bir Rami','Saknia','Hay Amal','Hay Nakhil','Hay Wifaq','Hay Karima','Centre Ville','Hay Nassim','Hay El Wahda','Hay Hassani','Maamoura','Hay Mohammadi','Hay Al Farah','Résidence Al Wifaq','Hay Essalam'],
  'Tétouan': ['Médina','Ensanche','Martil','Mhannech','Azla','Hay Salam','Hay Amal','Hay Nahda','Hay Nakhil','Hay Wifaq','Hay Karima','Dersa','Touabel','Sidi Mandri','Hay Al Majd','Hay Mohammadi','Hay Hassani','Résidence Al Farah','Ain Lhout','Hay Riad'],
  'Mohammedia': ['Centre Ville','Ain Harrouda','Sidi Moumen','Médina','Hay Hassani','Hay Mohammadi','Hay Salam','Hay Amal','Hay Wifaq','Hay Nakhil','Hay Karima','Hay Al Majd','Hay Nassim','Sidi Maarouf','Hay Essalam','Résidence Al Wifaq','Hay Nahda','Ain Sbiaa'],
  'El Jadida': ['Médina','Hay Hassani','Azemmour','Centre Ville','Hay Salam','Hay Amal','Hay Mohammadi','Hay Wifaq','Hay Nakhil','Hay Karima','Hay Al Majd','Haouzia','Hay Essalam','Bir Jdid','Résidence Al Farah','Hay Nahda','Sidi Bouzid'],
  'Safi': ['Médina','Hay El Amal','Arsat Lhamra','Centre Ville','Hay Hassani','Hay Mohammadi','Hay Salam','Hay Wifaq','Hay Nakhil','Hay Karima','Hay Al Majd','Hay Essalam','Hay Nahda','Résidence Al Wifaq','Sidi Bouzid','Hay Inara','Jrifat'],
  'Béni Mellal': ['Centre Ville','Hay Amal','Oulad Yaïch','Médina','Hay Hassani','Hay Salam','Hay Mohammadi','Hay Wifaq','Hay Nakhil','Hay Karima','Hay Al Majd','Hay Essalam','Hay Nahda','Taboun','Ain Asserdoun','Résidence Al Farah','Hay Inara','Hay Riad'],
  'Nador': ['Centre Ville','Médina','Hay Salam','Hay Amal','Hay Nakhil','Hay Wifaq','Hay Karima','Hay Mohammadi','Hay Hassani','Beni Chiker','Hay Al Majd','Hay Nahda','Hay Essalam','Hay Riad','Résidence Al Wifaq','Azghangan'],
  'Settat': ['Centre Ville','Hay Salam','Hay Amal','Hay Nakhil','Hay Wifaq','Hay Karima','Hay Mohammadi','Hay Hassani','Hay Al Majd','Hay Nahda','Hay Essalam','Médina','Résidence Al Farah','Hay Riad'],
  'Laâyoune': ['Centre Ville','Hay Salam','Hay Amal','Hay Nakhil','Hay Wifaq','Hay Karima','Hay Mohammadi','Hay Hassani','Hay Al Majd','Hay Nahda','Hay Essalam','Cité Militaire','Résidence Al Wifaq','Hay Riad'],
}

const VILLES_LIST = Object.keys(VILLES)

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

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const setVal = (k) => (v) => setForm((f) => ({ ...f, [k]: v }))

  const changeType = (t) => { setType(t); setSub('') }

  // Quartiers disponibles selon la ville sélectionnée
  const quartiersDispos = VILLES[form.city] || VILLES_LIST

const submit = async (e) => {
    e.preventDefault()
    if (!showCompliance) { setShowCompliance(true); return }
    if (!form.title || !form.city || !form.price) {

      toast('Titre, ville et budget sont requis', 'error')
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
        scheduled_at: new Date(`${form.scheduled_date}T${form.scheduled_time}`).toISOString(),
      }
      if (preselectedOeil?.id) payload.oeil_id = preselectedOeil.id

      const { data } = await missionsAPI.create(payload)
      onCreated?.(data.mission)
      onClose()
      setForm({ title: '', address: '', city: '', quartier: '', price: '', description: '' })
      setType('immobilier')
      setSub('')
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
              placeholder={type === 'immobilier' ? '200' : type === 'file_attente' ? '150' : type === 'audit' ? '450' : '180'}
              min="50" required />

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
            <ComplianceModal onAccept={() => { setShowCompliance(false); submit({ preventDefault: () => {}, _bypassed: true }) }} />
          )}
        </form>
      </div>
    </div>
  )
}