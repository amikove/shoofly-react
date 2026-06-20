import { useState, useEffect } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import Topbar from '../../components/layout/Topbar'
import { missionsAPI, usersAPI } from '../../api'
import { StatusBadge, Spinner, EmptyState, Avatar, Stars, toast } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import NewMissionModal from '../../components/missions/NewMissionModal'

export default function ClientDashboard() {
  const { user } = useAuth()
  const [missions, setMissions] = useState([])
  const [oeils, setOeils]       = useState([])
  const [stats, setStats]       = useState({ total:0, active:0, completed:0, budget:0 })
  const [loading, setLoading]   = useState(true)
  const [showNew, setShowNew]   = useState(false)

  useEffect(() => {
    Promise.all([
      missionsAPI.list({ limit: 5 }),
      usersAPI.oeils({ limit: 3, verified: true }),
    ])
      .then(([mRes, oRes]) => {
        const ms = mRes.data.missions || []
        setMissions(ms)
        setOeils(oRes.data.oeils || [])
        setStats({
          total:     ms.length,
          active:    ms.filter((m) => ['active','assigned','en_route'].includes(m.status)).length,
          completed: ms.filter((m) => m.status === 'completed').length,
          budget:    ms.reduce((s, m) => s + parseFloat(m.price || 0), 0),
        })
      })
      .catch(() => toast('Erreur de chargement', 'error'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <AppLayout>
      <Topbar title="Tableau de bord" />
      <div className="flex-1 flex items-center justify-center"><Spinner size="lg" /></div>
    </AppLayout>
  )

  return (
    <AppLayout>
      <Topbar
        title="Tableau de bord"
        actions={
          <button onClick={() => setShowNew(true)} className="btn btn-primary btn-sm">
            + Nouvelle mission
          </button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Missions totales', value: stats.total,                color: 'text-white'        },
            { label: 'En cours',         value: stats.active,               color: 'text-[#FF4D00]'    },
            { label: 'Complétées',       value: stats.completed,            color: 'text-green-400'    },
            { label: 'Budget dépensé',   value: `${stats.budget} MAD`,      color: 'text-white'        },
          ].map((s) => (
            <div key={s.label} className="stat-card">
              <div className="text-xs text-[#AAA] mb-1">{s.label}</div>
              <div className={`text-2xl font-bold tracking-tight ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Missions en cours */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-sm">Missions en cours</h2>
              <a href="/client/missions" className="text-xs text-[#FF4D00]">Voir tout</a>
            </div>
            {missions.filter((m) => ['active','assigned','pending'].includes(m.status)).length === 0 ? (
              <EmptyState icon="📋" title="Aucune mission active" description="Créez votre première mission." />
            ) : missions.filter((m) => ['active','assigned','pending'].includes(m.status)).slice(0,3).map((m) => (
              <div key={m.id} className="bg-[#222] rounded-xl p-4 mb-3">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-semibold text-sm">{m.title}</div>
                    <div className="text-xs text-[#AAA]">📍 {m.city} · {m.oeil_name || 'Non assigné'}</div>
                  </div>
                  <StatusBadge status={m.status} />
                </div>
                <div className="flex gap-2">
                  <a href={`/client/missions#${m.id}`} className="btn btn-primary btn-sm flex-1 justify-center">Voir →</a>
                </div>
              </div>
            ))}
          </div>

          {/* Œils favoris */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-sm">Œils disponibles</h2>
              <a href="/client/oeils" className="text-xs text-[#FF4D00]">Voir tous</a>
            </div>
            {oeils.length === 0 ? (
              <EmptyState icon="👁️" title="Aucun Œil" description="Les Œils disponibles apparaîtront ici." />
            ) : oeils.map((o) => (
              <div key={o.id} className="flex items-center gap-3 py-3 border-b border-white/10 last:border-0">
                <Avatar name={`${o.first_name} ${o.last_name}`} size={36} />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{o.first_name} {o.last_name}</div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Stars value={o.rating_avg || 0} />
                    <span className="text-[11px] text-[#AAA]">{o.rating_avg || '—'} · {o.total_missions || 0} missions</span>
                  </div>
                </div>
                {o.is_available
                  ? <span className="badge badge-green">Dispo</span>
                  : <span className="badge badge-gray">Occupé</span>
                }
              </div>
            ))}
          </div>
        </div>
      </div>

      <NewMissionModal open={showNew} onClose={() => setShowNew(false)} onCreated={(m) => {
        setMissions((ms) => [m, ...ms])
        setStats((s) => ({ ...s, total: s.total + 1 }))
        toast('Mission créée avec succès ! 🎉', 'success')
      }} />
    </AppLayout>
  )
}
