import { useState } from 'react'
import { missionsAPI } from '../../api'
import { toast } from '../ui'

const TYPES = [
  { id: 'immobilier',    icon: '🏠', label: 'Immobilier'     },
  { id: 'file_attente',  icon: '⏳', label: "File d'attente"  },
  { id: 'audit',         icon: '🔎', label: 'Audit'           },
  { id: 'personnalisee', icon: '🎯', label: 'Personnalisée'   },
]

export default function NewMissionModal({ open, onClose, onCreated, preselectedOeil }) {
  const [type, setType]     = useState('immobilier')
  const [loading, setLoading] = useState(false)
  const [form, setForm]     = useState({
    title: '', address: '', city: '', price: '', description: ''
  })

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    if (!form.title || !form.address || !form.price) {
      toast('Titre, adresse et budget sont requis', 'error')
      return
    }

    setLoading(true)
    try {
      const payload = {
        type,
        title:        form.title,
        address:      form.address,
        city:         form.city || form.address.split(',').pop().trim(),
        price:        parseFloat(form.price),
        description:  form.description,
        scheduled_at: new Date(Date.now() + 3600000).toISOString(),
      }

      // Modèle B — Attribution directe si Œil pré-sélectionné
      if (preselectedOeil?.id) {
        payload.oeil_id = preselectedOeil.id
      }

      const { data } = await missionsAPI.create(payload)
      onCreated?.(data.mission)
      onClose()
      setForm({ title: '', address: '', city: '', price: '', description: '' })
      setType('immobilier')
    } catch (err) {
      toast(err.response?.data?.error || 'Erreur lors de la création', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

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
                Mission assignée directement • {preselectedOeil.city}
              </div>
            </div>
            <span className="ml-auto badge badge-orange text-[10px]">Attribution directe</span>
          </div>
        )}

        {/* Type selector */}
        <div className="grid grid-cols-4 gap-2 mb-5">
          {TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setType(t.id)}
              className={`flex flex-col items-center gap-1 py-3 rounded-xl border text-xs font-medium transition-all ${
                type === t.id
                  ? 'border-[#FF4D00] bg-[#FF4D00]/10 text-white'
                  : 'border-white/12 bg-[#222] text-[#AAA] hover:border-white/22'
              }`}
            >
              <span className="text-xl">{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="label">Titre de la mission *</label>
            <input
              className="input"
              value={form.title}
              onChange={set('title')}
              placeholder={
                type === 'immobilier'   ? 'Ex: Visite appartement Agdal' :
                type === 'file_attente' ? 'Ex: File CNSS Hay Riad' :
                type === 'audit'        ? 'Ex: Audit café Hassan' :
                'Décrivez en une phrase votre besoin'
              }
              required
            />
          </div>

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

          <div>
            <label className="label">Description</label>
            <textarea
              className="input resize-none h-20"
              value={form.description}
              onChange={set('description')}
              placeholder={
                type === 'immobilier'   ? 'Ex: Vérifier cuisine, salle de bain, pression eau...' :
                type === 'file_attente' ? 'Ex: Dépôt dossier retraite, guichet 3...' :
                type === 'audit'        ? 'Ex: Accueil, propreté, temps de service...' :
                'Instructions particulières...'
              }
            />
          </div>

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
          </div>

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
