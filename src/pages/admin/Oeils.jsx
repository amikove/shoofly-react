import { useState, useEffect } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import Topbar from '../../components/layout/Topbar'
import { adminAPI } from '../../api'
import { Spinner, EmptyState, Avatar, Stars, toast } from '../../components/ui'

export default function AdminOeils() {
  const [oeils, setOeils]       = useState([])
  const [requests, setRequests] = useState([])
  const [loading, setLoading]   = useState(true)
  const [tab, setTab]           = useState('oeils')
  const [lightbox, setLightbox] = useState(null)
  const [rejecting, setRejecting] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [acting, setActing]     = useState({})

  const load = () => {
    setLoading(true)
    Promise.all([
      adminAPI.users({ role: 'oeil' }),
      adminAPI.identityRequests('pending'),
    ])
      .then(([oeилRes, reqRes]) => {
        setOeils(oeилRes.data.users || [])
        setRequests(reqRes.data.requests || [])
      })
      .catch(() => toast('Erreur de chargement', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const toggle = async (id) => {
    try { await adminAPI.toggleActive(id); load(); toast('Statut modifié', 'info') }
    catch { toast('Erreur', 'error') }
  }

  const approve = async (id) => {
    setActing((a) => ({ ...a, [id]: true }))
    try {
      await adminAPI.approveIdentity(id)
      toast('Identité approuvée ✓', 'success')
      load()
    } catch { toast('Erreur', 'error') }
    finally { setActing((a) => ({ ...a, [id]: false })) }
  }

  const reject = async (id) => {
    if (!rejectReason.trim()) { toast('Veuillez indiquer une raison', 'error'); return }
    setActing((a) => ({ ...a, [id]: true }))
    try {
      await adminAPI.rejectIdentity(id, { reason: rejectReason })
      toast('Demande rejetée', 'info')
      setRejecting(null)
      setRejectReason('')
      load()
    } catch { toast('Erreur', 'error') }
    finally { setActing((a) => ({ ...a, [id]: false })) }
  }

  return (
    <AppLayout>
      <Topbar title="Gestion des Œils" />
      <div className="p-6">

        {/* Onglets */}
        <div className="flex gap-1 bg-[#222] rounded-xl p-1 w-fit mb-6">
          <button
            onClick={() => setTab('oeils')}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${tab === 'oeils' ? 'bg-[#2A2A2A] text-white' : 'text-[#AAA] hover:text-white'}`}
          >
            👁️ Œils ({oeils.length})
          </button>
          <button
            onClick={() => setTab('pending')}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${tab === 'pending' ? 'bg-[#2A2A2A] text-white' : 'text-[#AAA] hover:text-white'}`}
          >
            🕐 En attente
            {requests.length > 0 && (
              <span className="ml-1.5 bg-orange-500 text-white px-1.5 py-0.5 rounded-full text-[10px]">{requests.length}</span>
            )}
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : tab === 'oeils' ? (
          oeils.length === 0 ? (
            <EmptyState icon="👁️" title="Aucun Œil" description="Aucun Œil enregistré." />
          ) : (
            <div className="card p-0">
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Œil</th><th>Ville</th><th>Statut</th><th>Missions</th><th>Note</th><th>Actions</th></tr></thead>
                  <tbody>
                    {oeils.map((o) => (
                      <tr key={o.id}>
                        <td>
                          <div className="flex items-center gap-2">
                            <Avatar name={`${o.first_name} ${o.last_name}`} size={26} />
                            <span className="font-medium">{o.first_name} {o.last_name}</span>
                          </div>
                        </td>
                        <td className="text-[#AAA]">{o.city || '—'}</td>
                        <td>
                          <span className={`badge ${o.is_verified ? 'badge-green' : 'badge-yellow'}`}>
                            {o.is_verified ? '✓ Vérifié' : 'En attente'}
                          </span>
                        </td>
                        <td className="text-center">{o.total_missions || 0}</td>
                        <td>
                          {o.rating_avg ? (
                            <div className="flex items-center gap-1">
                              <Stars value={o.rating_avg} />
                              <span className="text-xs text-[#AAA]">{o.rating_avg}</span>
                            </div>
                          ) : '—'}
                        </td>
                        <td>
                          <div className="flex gap-1">
                            <button onClick={() => toggle(o.id)} className={`btn btn-ghost btn-sm ${o.is_active ? 'text-red-400' : 'text-green-400'}`}>
                              {o.is_active ? 'Suspendre' : 'Activer'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        ) : (
          requests.length === 0 ? (
            <EmptyState icon="🕐" title="Aucune demande" description="Aucune demande de vérification en attente." />
          ) : (
            <div className="space-y-4">
              {requests.map((r) => (
                <div key={r.id} className="card">
                  {/* En-tête */}
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar name={`${r.first_name} ${r.last_name}`} size={44} />
                    <div>
                      <p className="font-semibold">{r.first_name} {r.last_name}</p>
                      <p className="text-xs text-[#AAA]">📍 {r.city || '—'} · {r.email}</p>
                      {r.phone && <p className="text-xs text-[#AAA]">📞 {r.phone}</p>}
                      <p className="text-xs text-[#555] mt-0.5">Soumis le {new Date(r.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                  </div>

                  {/* Documents */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[
                      { url: r.cin_recto, label: 'CIN Recto' },
                      { url: r.cin_verso, label: 'CIN Verso' },
                      { url: r.selfie,    label: 'Selfie' },
                    ].map(({ url, label }) => (
                      <div key={label} className="space-y-1">
                        <p className="text-xs text-[#AAA] text-center">{label}</p>
                        <img
                          src={url}
                          alt={label}
                          onClick={() => setLightbox(url)}
                          className="w-full h-28 object-cover rounded-xl cursor-pointer hover:opacity-80 transition-opacity border border-white/10"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  {rejecting === r.id ? (
                    <div className="space-y-3">
                      <textarea
                        className="input resize-none h-20 w-full text-sm"
                        placeholder="Raison du rejet (ex: photo floue, CIN expirée...)"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => reject(r.id)}
                          disabled={acting[r.id]}
                          className="btn btn-ghost btn-sm text-red-400 disabled:opacity-50"
                        >
                          {acting[r.id] ? '...' : '❌ Confirmer le rejet'}
                        </button>
                        <button onClick={() => { setRejecting(null); setRejectReason('') }} className="btn btn-ghost btn-sm">
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => approve(r.id)}
                        disabled={acting[r.id]}
                        className="btn btn-primary btn-sm disabled:opacity-50"
                      >
                        {acting[r.id] ? '...' : '✅ Approuver'}
                      </button>
                      <button
                        onClick={() => setRejecting(r.id)}
                        className="btn btn-ghost btn-sm text-red-400"
                      >
                        ❌ Rejeter
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/90 z-[80] flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <img src={lightbox} alt="Document" className="max-w-full max-h-full rounded-xl object-contain" />
          <button onClick={() => setLightbox(null)} className="absolute top-4 right-4 text-white text-2xl">✕</button>
        </div>
      )}
    </AppLayout>
  )
}