import { useState, useEffect } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import Topbar from '../../components/layout/Topbar'
import { adminAPI, missionsAPI } from '../../api'
import { StatusBadge, Spinner, toast } from '../../components/ui'

export default function AdminDashboard() {
  const [stats, setStats]       = useState(null)
  const [missions, setMissions] = useState([])
  const [claims, setClaims]     = useState([])
  const [tab, setTab]           = useState('overview')
  const [loading, setLoading]   = useState(true)
  const [resolving, setResolving] = useState(null)

  useEffect(() => {
    Promise.all([
      adminAPI.stats(),
      missionsAPI.list({ status: 'active', limit: 5 }),
      adminAPI.claims(),
    ])
      .then(([sRes, mRes, cRes]) => {
        setStats(sRes.data)
        setMissions(mRes.data.missions || [])
        setClaims(cRes.data.claims || [])
      })
      .catch(() => toast('Erreur de chargement', 'error'))
      .finally(() => setLoading(false))
  }, [])

  const resolve = async (claimId, missionId, decision) => {
    setResolving(claimId)
    try {
      await adminAPI.resolveClaim(missionId, decision)
      setClaims(prev => prev.filter(c => c.id !== claimId))
      toast(decision === 'oeil' ? '✅ Résolu en faveur de l\'Œil' : '✅ Résolu en faveur du client', 'success')
    } catch (err) {
      toast(err.response?.data?.error || 'Erreur', 'error')
    } finally { setResolving(null) }
  }

  if (loading) return (
    <AppLayout><Topbar title="Vue globale" />
      <div className="flex-1 flex items-center justify-center"><Spinner size="lg" /></div>
    </AppLayout>
  )

  const cards = [
    { label: 'Total missions',    value: stats?.total_missions || 0,          color: 'text-white'     },
    { label: 'Clients actifs',    value: stats?.total_clients  || 0,          color: 'text-blue-400'  },
    { label: 'Œils actifs',       value: stats?.total_oeils    || 0,          color: 'text-[#FF4D00]' },
    { label: 'Revenu plateforme', value: `${stats?.total_revenue || 0} MAD`,  color: 'text-green-400' },
  ]

  return (
    <AppLayout>
      <Topbar title="Vue globale" />
      <div className="p-4 md:p-6 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {cards.map((c) => (
            <div key={c.label} className="stat-card">
              <div className="text-xs text-[#AAA] mb-1">{c.label}</div>
              <div className={`text-2xl font-bold ${c.color}`}>{c.value}</div>
            </div>
          ))}
        </div>

        {/* Onglets */}
        <div className="flex gap-2 border-b border-white/10 pb-0">
          <button
            onClick={() => setTab('overview')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === 'overview' ? 'border-[#FF4D00] text-white' : 'border-transparent text-[#AAA] hover:text-white'}`}
          >
            Missions en cours
          </button>
          <button
            onClick={() => setTab('claims')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${tab === 'claims' ? 'border-[#FF4D00] text-white' : 'border-transparent text-[#AAA] hover:text-white'}`}
          >
            🚨 Réclamations
            {claims.length > 0 && (
              <span className="bg-[#FF4D00] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {claims.length}
              </span>
            )}
          </button>
        </div>

        {/* Missions en cours */}
        {tab === 'overview' && (
          <div className="card">
            {missions.length === 0 ? (
              <div className="text-center py-8 text-[#AAA] text-sm">Aucune mission active</div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Mission</th><th>Client</th><th>Œil</th><th>Prix</th><th>Statut</th></tr></thead>
                  <tbody>
                    {missions.map((m) => (
                      <tr key={m.id}>
                        <td className="font-medium">{m.title}</td>
                        <td className="text-[#AAA]">{m.client_name}</td>
                        <td>{m.oeil_name || '—'}</td>
                        <td className="text-green-400">{parseFloat(m.price).toFixed(0)} MAD</td>
                        <td><StatusBadge status={m.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Réclamations */}
        {tab === 'claims' && (
          <div className="space-y-3">
            {claims.length === 0 ? (
              <div className="card text-center py-8 text-[#AAA] text-sm">✅ Aucune réclamation en cours</div>
            ) : claims.map((c) => (
              <div key={c.id} className="card space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-sm">{c.mission_title}</div>
                    <div className="text-xs text-[#AAA] mt-0.5">
                      Client : <span className="text-white">{c.client_name}</span> · Œil : <span className="text-white">{c.oeil_name}</span>
                    </div>
                    <div className="text-xs text-[#AAA] mt-0.5">
                      Prix : <span className="text-green-400">{c.mission_price} MAD</span> · Gain Œil : <span className="text-[#FF4D00]">{c.oeil_earning} MAD</span>
                    </div>
                  </div>
                  <span className="badge badge-orange shrink-0">🚨 En cours</span>
                </div>

                <div className="bg-[#222] rounded-xl p-3">
                  <div className="text-xs text-[#AAA] mb-1">Motif du client :</div>
                  <p className="text-sm text-white/80">{c.comment}</p>
                </div>

                <div className="text-xs text-[#555]">
                  Réclamé le {new Date(c.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => resolve(c.id, c.mission_id, 'oeil')}
                    disabled={resolving === c.id}
                    className="btn btn-primary btn-sm flex-1 justify-center disabled:opacity-60"
                  >
                    ✅ Valider en faveur de l'Œil
                  </button>
                  <button
                    onClick={() => resolve(c.id, c.mission_id, 'client')}
                    disabled={resolving === c.id}
                    className="btn btn-ghost btn-sm flex-1 justify-center text-orange-400 disabled:opacity-60"
                  >
                    🔄 Rembourser le client
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