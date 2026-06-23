import { useState } from 'react'
import { missionsAPI } from '../../api'
import { toast } from '../ui'
import { useAuth } from '../../context/AuthContext'

// ── Catégories et sous-catégories ─────────────────────────
const CATEGORIES = {
  immobilier: {
    icon: '🏠',
    label: 'Immobilier',
    subcategories: [
      'Airbnb', 'Booking', 'Avito', 'Mubawab',
      'Agence immobilière', 'Particulier', 'Autre',
    ],
    placeholder: 'Ex: Visite appartement Agdal — Airbnb',
  },
  file_attente: {
    icon: '⏳',
    label: "File d'attente",
    subcategories: null, // groupes avec sous-groupes
    groups: [
      {
        label: 'Centres de santé',
        items: ['Hôpital & clinique', 'Cabinet de spécialiste', 'Laboratoire', 'Autre'],
      },
      {
        label: 'Administrations',
        items: ['CNSS', 'ANCFCC', 'Services d\'état civil', 'Autre'],
      },
      {
        label: 'Services publics',
        items: ['ONEE', 'REDAL', 'RADEEMA', 'Autre'],
      },
      {
        label: 'Consulats et visas',
        items: ['Consulat étranger', 'Centre de visas', 'Autre'],
      },
      {
        label: 'Banques',
        items: ['Attijariwafa', 'CIH Bank', 'Banque Populaire', 'BMCE', 'BMCI', 'Al Barid Bank', 'Autre'],
      },
      {
        label: 'Éducation',
        items: ['Inscription universitaire', 'École privée', 'Bourse & dossier étudiant', 'Autre'],
      },
      {
        label: 'Autre',
        items: ['À préciser'],
      },
    ],
    placeholder: 'Ex: File CNSS — Dépôt dossier retraite',
  },
  audit: {
    icon: '🔎',
    label: 'Audit & Mystery Shop',
    groups: [
      {
        label: 'Restaurant',
        items: ['Temps d\'attente', 'Propreté', 'Qualité du service', 'Audit complet'],
      },
      {
        label: 'Café',
        items: ['Accueil', 'Rapidité', 'Propreté', 'Audit complet'],
      },
      {
        label: 'Hôtel',
        items: ['Check-in', 'Service client', 'Propreté', 'Audit complet'],
      },
      {
        label: 'Salle de sport',
        items: ['Accueil commercial', 'État des équipements', 'Suivi et réactivité coachs', 'Audit complet'],
      },
      {
        label: 'Concession automobile',
        items: ['Qualité du vendeur', 'Temps de prise en charge', 'Suivi commercial', 'Audit complet'],
      },
      {
        label: 'Agence immobilière',
        items: ['Qualité de l\'accueil', 'Réactivité', 'Compétence commerciale', 'Audit complet'],
      },
    ],
    placeholder: 'Ex: Audit mystery shop — Restaurant Hassan',
  },
  personnalisee: {
    icon: '🎯',
    label: 'Personnalisée',
    subcategories: ['Présence physique', 'Accompagnement', 'Vérification', 'Livraison', 'Autre'],
    placeholder: 'Décrivez en une phrase votre besoin',
  },
}

// ── Composant sélecteur de sous-catégorie ──────────────────
function SubcategorySelector({ type, value, onChange }) {
  const cat = CATEGORIES[type]
  if (!cat) return null

  // Catégorie avec groupes (file_attente, audit)
  if (cat.groups) {
    return (
      <div>
        <label className="label">Sous-catégorie *</label>
        <select className="input" value={value} onChange={(e) => onChange(e.target.value)} required>
          <option value="">Sélectionnez...</option>
          {cat.groups.map((g) => (
            <optgroup key={g.label} label={g.label}>
              {g.items.map((item) => (
                <option key={item} value={`${g.label} — ${item}`}>
                  {item}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
    )
  }

  // Catégorie avec liste simple
  if (cat.subcategories) {
    return (
      <div>
        <label className="label">Sous-catégorie</label>
        <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">Sélectionnez...</option>
          {cat.subcategories.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
    )
  }

  return null
}

// ── Modal principale ───────────────────────────────────────
export default function NewMissionModal({ open, onClose, onCreated, preselectedOeil }) {
  const { user } = useAuth()
  const [type, setType]           = useState('immobilier')
  const [subcategory, setSub]     = useState('')
  const [loading, setLoading]     = useState(false)
  const [form, setForm]           = useState({
    title: '', address: '', city: '', price: '', description: ''
  })

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  // Reset sous-catégorie quand le type change
  const changeType = (t) => { setType(t); setSub('') }

  const submit = async (e) => {
    e.preventDefault()
    if (!form.title || !form.address || !form.price) {
      toast('Titre, adresse et budget sont requis', 'error')
      return
    }
    // File d'attente et audit nécessitent une sous-catégorie
    if ((type === 'file_attente' || type === 'audit') && !subcategory) {
      toast('Veuillez sélectionner une sous-catégorie', 'error')
      return
    }

    setLoading(true)
    try {
      const payload = {
        type,
        subcategory:  subcategory || null,
        title:        form.title,
        address:      form.address,
        city:         form.city || form.address.split(',').pop().trim(),
        price:        parseFloat(form.price),
        description:  form.description,
        scheduled_at: new Date(Date.now() + 3600000).toISOString(),
      }
      if (preselectedOeil?.id) payload.oeil_id = preselectedOeil.id

      const { data } = await missionsAPI.create(payload)
      onCreated?.(data.mission)
      onClose()
      setForm({ title: '', address: '', city: '', price: '', description: '' })
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
                : 'Visible par tous les Œils disponibles'
              }
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
              <div className="text-sm font-semibold">
                👁️ {preselectedOeil.first_name} {preselectedOeil.last_name}
              </div>
              <div className="text-xs text-[#AAA]">
                Attribution directe • {preselectedOeil.city}
              </div>
            </div>
            <span className="ml-auto badge badge-orange text-[10px]">Direct</span>
          </div>
        )}

        {/* Sélecteur de type */}
        <div className="grid grid-cols-4 gap-2 mb-5">
          {Object.entries(CATEGORIES).map(([id, c]) => (
            <button
              key={id}
              type="button"
              onClick={() => changeType(id)}
              className={`flex flex-col items-center gap-1 py-3 rounded-xl border text-xs font-medium transition-all ${
                type === id
                  ? 'border-[#FF4D00] bg-[#FF4D00]/10 text-white'
                  : 'border-white/12 bg-[#222] text-[#AAA] hover:border-white/22'
              }`}
            >
              <span className="text-xl">{c.icon}</span>
              <span className="text-center leading-tight">{c.label}</span>
            </button>
          ))}
        </div>

        {/* Formulaire */}
        <form onSubmit={submit} className="space-y-3">

          {/* Sous-catégorie */}
          <SubcategorySelector type={type} value={subcategory} onChange={setSub} />

          {/* Titre */}
          <div>
            <label className="label">Titre de la mission *</label>
            <input
              className="input"
              value={form.title}
              onChange={set('title')}
              placeholder={cat?.placeholder || 'Décrivez votre mission'}
              required
            />
          </div>

          {/* Adresse */}
          <div>
            <label className="label">Adresse complète *</label>
            <input
              className="input"
              value={form.address}
              onChange={set('address')}
              placeholder="Rue, quartier, ville"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="label">Instructions particulières</label>
            <textarea
              className="input resize-none h-20"
              value={form.description}
              onChange={set('description')}
              placeholder={
                type === 'immobilier'   ? 'Ex: Vérifier cuisine, salle de bain, pression eau...' :
                type === 'file_attente' ? 'Ex: Guichet 3, dépôt dossier retraite, numéro de rendez-vous...' :
                type === 'audit'        ? 'Ex: Grille d\'évaluation spécifique, critères prioritaires...' :
                'Décrivez précisément ce que vous attendez...'
              }
            />
          </div>

          {/* Budget */}
          <div>
            <label className="label">Budget (MAD) *</label>
            <input
              type="number"
              className="input"
              value={form.price}
              onChange={set('price')}
              placeholder={
                type === 'immobilier'   ? '200' :
                type === 'file_attente' ? '150' :
                type === 'audit'        ? '450' : '180'
              }
              min="50"
              required
            />
            <p className="text-[11px] text-[#AAA] mt-1">
              L'Œil recevra {form.price ? Math.round(parseFloat(form.price) * 0.8) : '—'} MAD (80%)
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-lg flex-1 justify-center disabled:opacity-60"
            >
              {loading ? 'Envoi en cours...' : (
                preselectedOeil
                  ? `Assigner à ${preselectedOeil.first_name} →`
                  : 'Envoyer la mission →'
              )}
            </button>
            <button type="button" onClick={onClose} className="btn btn-ghost btn-lg">
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
