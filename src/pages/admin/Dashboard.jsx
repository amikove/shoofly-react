import { useState, useEffect } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import Topbar from '../../components/layout/Topbar'
import { adminAPI, missionsAPI } from '../../api'
import { StatusBadge, Spinner, toast } from '../../components/ui'

export default function AdminDashboard() {
  const [stats, setStats]     = useState(null)
  const [missions, setMissions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      adminAPI.stats(),
      missionsAPI.list({ status: 'active', limit: 5 }),
    ])
      .then(([sRes, mRes]) => {
        setStats(sRes.data)
        setMissions(mRes.data.missions || [])
      })
      .catch(() => toast('Erreur de chargement', 'error'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <AppLayout><Topbar title="Vue globale" /><div className="flex-1 flex items-center justify-center"><Spinner size="lg" /></div></AppLayout>

  const cards = [
    { label: 'Total missions',    value: stats?.total_missions    || 0, color: 'text-white'      },
    { label: 'Clients actifs',    value: stats?.total_clients     || 0, color: 'text-blue-400'   },
    { label: 'Œils actifs',       value: stats?.total_oeils       || 0, color: 'text-[#FF4D00]'  },
    { label: 'Revenu plateforme', value: `${stats?.total_revenue  || 0} MAD`, color: 'text-green-400' },
  ]

  return (
    <AppLayout>
      <Topbar title="Vue globale" />
      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {cards.map((c) => (
            <div key={c.label} className="stat-card">
              <div className="text-xs text-[#AAA] mb-1">{c.label}</div>
              <div className={`text-2xl font-bold ${c.color}`}>{c.value}</div>
            </div>
          ))}
        </div>

        {/* Missions live */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm">Missions en cours</h2>
            <span className="badge badge-green">Live</span>
          </div>
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
      </div>
    </AppLayout>
  )
}
