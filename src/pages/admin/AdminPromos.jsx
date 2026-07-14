import { useState, useEffect } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import Topbar from '../../components/layout/Topbar'
import { adminAPI } from '../../api'
import { Spinner, toast } from '../../components/ui'

const EMPTY_FORM = { code: '', type: 'percent', value: '', max_uses: '', max_uses_per_user: '1', expires_at: '', platform_amount: '' }

export default function AdminPromos() {
  const [promos, setPromos]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [form, setForm]         = useState(EMPTY_FORM)
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const load = () => {
    adminAPI.promos()
      .then(({ data }) => setPromos(data.promos || []))
      .catch(() => toast('Erreur chargement', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const create = async () => {
    if (!form.code) { toast('Code requis', 'error'); return }
    if (form.type !== 'free' && !form.value) { toast('Valeur requise', 'error'); return }
    setCreating(true)

    try {
      await adminAPI.createPromo({
        code:               form.code.toUpperCase(),
        type:               form.type,
        value:              form.type === 'free' ? 100 : parseFloat(form.value),
        platform_amount:    form.type === 'free' ? parseFloat(form.platform_amount) : null,
        max_uses:           form.max_uses ? parseInt(form.max_uses) : null,
        max_uses_per_user:  parseInt(form.max_uses_per_user) || 1,
        expires_at:         form.expires_at || null,
      })
      toast('Code créé ✓', 'success')
      setForm(EMPTY_FORM)
      setShowForm(false)
      load()
    } catch (err) {
      toast(err.response?.data?.error || 'Erreur', 'error')
    } finally { setCreating(false) }
  }

  const toggle = async (id) => {
    try { await adminAPI.togglePromo(id); load() }
    catch { toast('Erreur', 'error') }
  }

  const remove = async (id) => {
    if (!window.confirm('Supprimer ce code ?')) return
    try { await adminAPI.deletePromo(id); load(); toast('Code supprimé', 'info') }
    catch { toast('Erreur', 'error') }
  }

  const typeLabel = { percent: 'Pourcentage', fixed: 'Montant fixe', free: 'Gratuit' }
  const typeBadge = { percent: 'badge-yellow', fixed: 'badge-green', free: 'badge-red' }

  return (
    <AppLayout>
      <Topbar title="Codes Promo" />
      <div className="p-6 space-y-6">

        {/* Bouton créer */}
        <div className="flex justify-end">
          <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
            {showForm ? 'Annuler' : '+ Nouveau code'}
          </button>
        </div>

        {/* Formulaire création */}
        {showForm && (
          <div className="card space-y-4">
            <h2 className="font-semibold text-sm">Créer un code promo</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Code *</label>
                <input className="input uppercase" value={form.code} onChange={set('code')} placeholder="EX: WELCOME20" />
              </div>
              <div>
                <label className="label">Type *</label>
                <select className="input" value={form.type} onChange={set('type')}>
                  <option value="percent">Pourcentage (%)</option>
                  <option value="fixed">Montant fixe (MAD)</option>
                  <option value="free">Gratuit (100%)</option>
                </select>
              </div>
              {form.type !== 'free' && (
                <div>
                  <label className="label">{form.type === 'percent' ? 'Pourcentage (%)' : 'Montant (MAD)'} *</label>
                  <input type="number" className="input" value={form.value} onChange={set('value')}
                    placeholder={form.type === 'percent' ? 'Ex: 20' : 'Ex: 50'}
                    min={1} max={form.type === 'percent' ? 100 : undefined} />
                </div>
              )}
              {form.type === 'free' && (
                <div>
                  <label className="label">Montant payé à l'Œil par Shoofly (MAD) *</label>
                  <input type="number" className="input" value={form.platform_amount} onChange={set('platform_amount')}
                    placeholder="Ex: 200" min={1} />
                </div>
              )}
              <div>
                <label className="label">Utilisations max (total)</label>
                <input type="number" className="input" value={form.max_uses} onChange={set('max_uses')} placeholder="Illimité si vide" min={1} />
              </div>
              <div>
                <label className="label">Utilisations max par client</label>
                <input type="number" className="input" value={form.max_uses_per_user} onChange={set('max_uses_per_user')} placeholder="1" min={1} />
              </div>
              <div>
                <label className="label">Date d'expiration</label>
                <input type="date" className="input" value={form.expires_at} onChange={set('expires_at')} />
              </div>
            </div>
            <button onClick={create} disabled={creating} className="btn btn-primary w-full justify-center disabled:opacity-50">
              {creating ? 'Création...' : 'Créer le code →'}
            </button>
          </div>
        )}

        {/* Liste */}
        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : promos.length === 0 ? (
          <div className="card text-center py-12 text-[#AAA]">Aucun code promo créé</div>
        ) : (
          <div className="card p-0">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Type</th>
                    <th>Valeur</th>
                    <th>Utilisations</th>
                    <th>Expiration</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {promos.map((p) => (
                    <tr key={p.id}>
                      <td className="font-mono font-semibold">{p.code}</td>
                      <td><span className={`badge ${typeBadge[p.type]}`}>{typeLabel[p.type]}</span></td>
                      <td>
                        {p.type === 'percent' ? `${p.value}%` : p.type === 'free' ? '100%' : `${p.value} MAD`}
                      </td>
                      <td className="text-[#AAA]">
                        {p.used_count} / {p.max_uses || '∞'}
                        <span className="text-xs text-[#555] ms-1">(max {p.max_uses_per_user}×/client)</span>
                      </td>
                      <td className="text-[#AAA]">
                        {p.expires_at ? new Date(p.expires_at).toLocaleDateString('fr-FR') : '—'}
                      </td>
                      <td>
                          {(() => {
                            const isExpired = p.expires_at && new Date(p.expires_at) < new Date()
                            if (isExpired) return <span className="badge badge-red">Expiré</span>
                            return <span className={`badge ${p.is_active ? 'badge-green' : 'badge-gray'}`}>{p.is_active ? 'Actif' : 'Désactivé'}</span>
                          })()}
                        </td>
                        <td>
                          <div className="flex gap-1">
                            <button
                              onClick={() => toggle(p.id)}
                              disabled={p.expires_at && new Date(p.expires_at) < new Date()}
                              className={`btn btn-ghost btn-sm ${p.is_active ? 'text-yellow-400' : 'text-green-400'} disabled:opacity-40 disabled:cursor-not-allowed`}
                            >
                              {p.is_active ? 'Désactiver' : 'Activer'}
                            </button>
                          <button onClick={() => remove(p.id)} className="btn btn-ghost btn-sm text-red-400">
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}