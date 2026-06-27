import { useState, useEffect } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import Topbar from '../../components/layout/Topbar'
import { missionsAPI, usersAPI } from '../../api'
import { StatusBadge, Spinner, EmptyState, Avatar, Stars, toast } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import NewMissionModal from '../../components/missions/NewMissionModal'
import InterestsModal from '../../components/missions/InterestsModal'


export default function ClientDashboard() {
  const { user } = useAuth()
  const [missions, setMissions] = useState([])
  const [oeils, setOeils]       = useState([])
  const [stats, setStats]       = useState({ total:0, active:0, completed:0, budget:0 })
  const [loading, setLoading]   = useState(true)
  const [showNew, setShowNew]   = useState(false)
  const [interestsMission, setInterestsMission] = useState(null)

  useEffect(() => {

    Promise.all([
      missionsAPI.list({ limit: 5 }),
      usersAPI.oeils({ limit: 3, verified: true }),
      usersAPI.clientStats().catch(() => ({ data: {} })),
    ])
      .then(([mRes, oRes, sRes]) => {
        const ms = mRes.data.missions || []
        const s  = sRes?.data || {}
        setMissions(ms)
        setOeils(oRes.data.oeils || [])
        setStats({
          total:     s.total     ?? ms.length,
          active:    s.active    ?? ms.filter(m => ['active','assigned','en_route'].includes(m.status)).length,
          completed: s.completed ?? ms.filter(m => m.status === 'completed').length,
          budget:    parseFloat(s.total_spent || 0),
          wallet:    parseFloat(s.wallet_balance || 0),
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

  const activeMissions = missions.filter((m) => ['active','assigned','pending'].includes(m.status)).slice(0,3)

  return (
    <AppLayout>
      <Topbar
        title="Tableau de bord"
        actions={
          <button onClick={() => setShowNew(true)} className="btn btn-primary btn-sm">
            <span className="hidden sm:inline">+ Nouvelle mission</span>
            <span className="sm:hidden">+</span>
          </button>
        }
      />

      <div className="p-4 md:p-6 space-y-4 md:space-y-6">

        {/* Stats — 2 colonnes mobile, 4 desktop */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
          {[
            { label: 'Missions totales', value: stats.total,           color: 'text-white'     },
            { label: 'En cours',         value: stats.active,          color: 'text-[#FF4D00]' },
            { label: 'Complétées',       value: stats.completed,       color: 'text-green-400' },
            { label: 'Total dépensé',  value: `${Math.round(stats.budget || 0)} MAD`, color: 'text-green-400' },
            { label: 'Portefeuille',   value: `${Math.round(stats.wallet || 0)} MAD`, color: 'text-[#FF4D00]'  },
          ].map((s) => (
            <div key={s.label} className="stat-card">
              <div className="text-[11px] text-[#AAA] mb-1 leading-tight">{s.label}</div>
              <div className={`text-xl md:text-2xl font-bold tracking-tight ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Grille — 1 colonne mobile, 2 desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">

          {/* Missions en cours */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-sm">Missions en cours</h2>
              <a href="/client/missions" className="text-xs text-[#FF4D00]">Voir tout</a>
            </div>
            {activeMissions.length === 0 ? (
              <EmptyState icon="📋" title="Aucune mission active" description="Créez votre première mission." />
            ) : activeMissions.map((m) => (
              <div key={m.id} className="bg-[#222] rounded-xl p-3 mb-3 last:mb-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm truncate">{m.title}</div>
                    <div className="text-xs text-[#AAA] mt-0.5 truncate">
                      📍 {m.city} · {m.oeil_name || 'Non assigné'}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <StatusBadge status={m.status} />
                  </div>
                </div>
                  {m.status === 'pending' ? (
                    <button onClick={() => setInterestsMission(m)}
                      className="btn btn-primary btn-sm w-full justify-center">
                      👁️ Voir les Œils intéressés
                    </button>
                  ) : (
                    <a href="/client/missions" className="btn btn-primary btn-sm w-full justify-center">
                      Voir →
                    </a>
                  )}
              </div>
            ))}
          </div>

          {/* Œils disponibles */}
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
                  <div className="font-semibold text-sm truncate">{o.first_name} {o.last_name}</div>
                  <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                    <Stars value={o.rating_avg || 0} />
                    <span className="text-[11px] text-[#AAA]">
                      {o.rating_avg || '—'} · {o.total_missions || 0} missions
                    </span>
                  </div>
                </div>
                <span className={`badge flex-shrink-0 ${o.is_available ? 'badge-green' : 'badge-gray'}`}>
                  {o.is_available ? 'Dispo' : 'Occupé'}
                </span>
              </div>
            ))}
          </div>

        </div>
      </div>

      <NewMissionModal open={showNew} onClose={() => setShowNew(false)} onCreated={(m) => {
        setMissions((ms) => [m, ...ms])
        setStats((s) => ({ ...s, total: s.total + 1 }))
        toast('Mission créée ! 🎉', 'success')
      }} />


      {interestsMission && (
  <InterestsModal
    mission={interestsMission}
    onClose={() => setInterestsMission(null)}
    onHired={() => { setInterestsMission(null); load() }}
  />
)}


    </AppLayout>
  )
}