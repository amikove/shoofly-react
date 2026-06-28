import { useState, useEffect } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import Topbar from '../../components/layout/Topbar'
import { adminAPI } from '../../api'
import { Spinner, Avatar, toast } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const ALL_PERMISSIONS = [
  { key: 'dash',       label: '📊 Dashboard',              section: 'Vue' },
  { key: 'stats',      label: '📈 Statistiques',           section: 'Vue' },
  { key: 'missions',   label: '📋 Missions',               section: 'Gestion' },
  { key: 'users',      label: '👥 Œils & Clients',         section: 'Gestion' },
  { key: 'identity',   label: '🪪 Vérification identité',  section: 'Gestion' },
  { key: 'claims',     label: '🚨 Réclamations',           section: 'Gestion' },
  { key: 'moderation', label: '🛡️ Fraude & Modération',    section: 'Sécurité' },
  { key: 'finance',    label: '💰 Finance & Virements',    section: 'Finance' },
  { key: 'settings',   label: '⚙️ Paramètres système',     section: 'Système' },
  { key: 'audit',      label: '📝 Logs d\'audit',          section: 'Système' },
]

const PROFILES = {
  financier:     { label: '💰 Financier',     permissions: ['finance', 'claims', 'stats', 'dash'] },
  moderation:    { label: '🛡️ Modération',    permissions: ['moderation', 'identity', 'claims', 'dash'] },
  gestion:       { label: '👥 Gestion',       permissions: ['users', 'missions', 'identity', 'dash'] },
  technique:     { label: '⚙️ Technique',     permissions: ['settings', 'stats', 'audit', 'dash'] },
  admin_complet: { label: '📋 Admin complet', permissions: ['finance', 'claims', 'moderation', 'identity', 'users', 'missions', 'settings', 'dash', 'stats'] },
  personnalise:  { label: '✏️ Personnalisé',  permissions: [] },
}

const EMPTY_FORM = { first_name: '', last_name: '', email: '', password: '', phone: '', profile: 'gestion', permissions: [] }

export default function AdminGestion() {
  const { isSuperAdmin } = useAuth()
  const navigate = useNavigate()
  const [admins, setAdmins]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]         = useState(EMPTY_FORM)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing]   = useState(null)

  useEffect(() => {
    if (!isSuperAdmin) { navigate('/admin'); return }
    load()
  }, [])

  const load = () => {
    adminAPI.admins()
      .then(({ data }) => setAdmins(data.admins || []))
      .catch(() => toast('Erreur chargement', 'error'))
      .finally(() => setLoading(false))
  }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const selectProfile = (profile) => {
    const perms = PROFILES[profile]?.permissions || []
    setForm((f) => ({ ...f, profile, permissions: [...perms] }))
  }

  const togglePerm = (perm) => {
    setForm((f) => {
      const has = f.permissions.includes(perm)
      return {
        ...f,
        profile: 'personnalise',
        permissions: has ? f.permissions.filter(p => p !== perm) : [...f.permissions, perm]
      }
    })
  }

  const create = async () => {
    if (!form.first_name || !form.last_name || !form.email || !form.password) {
      toast('Tous les champs obligatoires', 'error'); return
    }
    setCreating(true)
    try {
      await adminAPI.createAdmin({
        first_name: form.first_name,
        last_name:  form.last_name,
        email:      form.email,
        password:   form.password,
        phone:      form.phone,
        profile:    form.profile !== 'personnalise' ? form.profile : null,
        permissions: form.permissions,
      })
      toast('Admin créé ✓', 'success')
      setShowForm(false)
      setForm(EMPTY_FORM)
      load()
    } catch (err) {
      toast(err.response?.data?.error || 'Erreur', 'error')
    } finally { setCreating(false) }
  }

  const updatePerms = async (id, permissions) => {
    try {
      await adminAPI.updateAdmin(id, { permissions })
      toast('Permissions mises à jour ✓', 'success')
      setEditing(null)
      load()
    } catch { toast('Erreur', 'error') }
  }

  const toggleActive = async (id, is_active) => {
    try {
      await adminAPI.updateAdmin(id, { is_active: !is_active })
      toast(!is_active ? 'Admin activé' : 'Admin suspendu', 'info')
      load()
    } catch { toast('Erreur', 'error') }
  }

  const remove = async (id) => {
    if (!window.confirm('Supprimer cet admin ?')) return
    try {
      await adminAPI.deleteAdmin(id)
      toast('Admin supprimé', 'info')
      load()
    } catch { toast('Erreur', 'error') }
  }

  const sections = [...new Set(ALL_PERMISSIONS.map(p => p.section))]

  return (
    <AppLayout>
      <Topbar title="👑 Gestion des Admins" />
      <div className="p-6 space-y-6">

        <div className="flex justify-end">
          <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
            {showForm ? 'Annuler' : '+ Nouvel admin'}
          </button>
        </div>

        {/* Formulaire création */}
        {showForm && (
          <div className="card space-y-5">
            <h2 className="font-semibold">Créer un compte admin</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className="label">Prénom *</label><input className="input" value={form.first_name} onChange={set('first_name')} /></div>
              <div><label className="label">Nom *</label><input className="input" value={form.last_name} onChange={set('last_name')} /></div>
              <div><label className="label">Email *</label><input type="email" className="input" value={form.email} onChange={set('email')} /></div>
              <div><label className="label">Mot de passe *</label><input type="password" className="input" value={form.password} onChange={set('password')} placeholder="Min. 8 caractères" /></div>
              <div><label className="label">Téléphone</label><input className="input" value={form.phone} onChange={set('phone')} /></div>
            </div>

            {/* Profils rapides */}
            <div>
              <label className="label mb-2">Profil rapide</label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(PROFILES).map(([key, p]) => (
                  <button
                    key={key}
                    onClick={() => selectProfile(key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      form.profile === key
                        ? 'bg-[#FF4D00]/20 border-[#FF4D00]/50 text-[#FF4D00]'
                        : 'bg-[#222] border-white/10 text-[#AAA] hover:text-white'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Permissions détaillées */}
            <div>
              <label className="label mb-2">Permissions</label>
              {sections.map(section => (
                <div key={section} className="mb-3">
                  <p className="text-xs text-[#555] uppercase tracking-wider mb-2">{section}</p>
                  <div className="space-y-1">
                    {ALL_PERMISSIONS.filter(p => p.section === section).map(p => (
                      <label key={p.key} className="flex items-center gap-3 cursor-pointer group">
                        <div
                          onClick={() => togglePerm(p.key)}
                          className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all cursor-pointer ${
                            form.permissions.includes(p.key)
                              ? 'bg-[#FF4D00] border-[#FF4D00]'
                              : 'border-white/20 group-hover:border-white/40'
                          }`}
                        >
                          {form.permissions.includes(p.key) && <span className="text-white text-[10px]">✓</span>}
                        </div>
                        <span className="text-sm">{p.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button onClick={create} disabled={creating} className="btn btn-primary w-full justify-center disabled:opacity-50">
              {creating ? 'Création...' : 'Créer l\'admin →'}
            </button>
          </div>
        )}

        {/* Liste admins */}
        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : admins.length === 0 ? (
          <div className="card text-center py-12 text-[#AAA]">Aucun admin créé</div>
        ) : (
          <div className="space-y-3">
            {admins.map((a) => (
              <div key={a.id} className="card">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar name={`${a.first_name} ${a.last_name}`} size={40} />
                  <div className="flex-1">
                    <p className="font-semibold">{a.first_name} {a.last_name}</p>
                    <p className="text-xs text-[#AAA]">{a.email}</p>
                  </div>
                  <span className={`badge ${a.is_active ? 'badge-green' : 'badge-gray'}`}>
                    {a.is_active ? 'Actif' : 'Suspendu'}
                  </span>
                </div>

                {/* Permissions actuelles */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {(a.permissions || []).length === 0
                    ? <span className="text-xs text-[#555]">Aucune permission</span>
                    : (a.permissions || []).map(p => (
                      <span key={p} className="badge badge-gray text-[10px]">
                        {ALL_PERMISSIONS.find(x => x.key === p)?.label || p}
                      </span>
                    ))
                  }
                </div>

                {/* Édition permissions */}
                {editing === a.id && (
                  <div className="bg-[#222] rounded-xl p-4 mb-3 space-y-3">
                    {sections.map(section => (
                      <div key={section}>
                        <p className="text-xs text-[#555] uppercase tracking-wider mb-2">{section}</p>
                        <div className="space-y-1">
                          {ALL_PERMISSIONS.filter(p => p.section === section).map(p => {
                            const has = (a.permissions || []).includes(p.key)
                            return (
                              <label key={p.key} className="flex items-center gap-3 cursor-pointer group">
                                <div
                                  onClick={() => {
                                    const newPerms = has
                                      ? a.permissions.filter(x => x !== p.key)
                                      : [...(a.permissions || []), p.key]
                                    setAdmins(prev => prev.map(x => x.id === a.id ? { ...x, permissions: newPerms } : x))
                                  }}
                                  className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 cursor-pointer transition-all ${
                                    has ? 'bg-[#FF4D00] border-[#FF4D00]' : 'border-white/20'
                                  }`}
                                >
                                  {has && <span className="text-white text-[10px]">✓</span>}
                                </div>
                                <span className="text-sm">{p.label}</span>
                              </label>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                    <div className="flex gap-2 pt-2">
                      <button onClick={() => updatePerms(a.id, a.permissions)} className="btn btn-primary btn-sm">Sauvegarder</button>
                      <button onClick={() => { setEditing(null); load() }} className="btn btn-ghost btn-sm">Annuler</button>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button onClick={() => setEditing(editing === a.id ? null : a.id)} className="btn btn-ghost btn-sm">
                    {editing === a.id ? 'Fermer' : '✏️ Permissions'}
                  </button>
                  <button onClick={() => toggleActive(a.id, a.is_active)} className={`btn btn-ghost btn-sm ${a.is_active ? 'text-red-400' : 'text-green-400'}`}>
                    {a.is_active ? 'Suspendre' : 'Activer'}
                  </button>
                  <button onClick={() => remove(a.id)} className="btn btn-ghost btn-sm text-red-400 ml-auto">
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}