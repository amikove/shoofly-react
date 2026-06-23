import { useState, useEffect } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import Topbar from '../../components/layout/Topbar'
import { missionsAPI, usersAPI } from '../../api'
import { StatusBadge, Spinner, EmptyState, toast } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import ChatModal from '../../components/missions/ChatModal'

export default function OeilDashboard() {
  const { user } = useAuth()
  const [pending, setPending]         = useState([])
  const [active, setActive]           = useState([])
  const [stats, setStats]             = useState(null)
  const [loading, setLoading]         = useState(true)
  const [chatMission, setChatMission] = useState(null)

  const load = () => {
    setLoading(true)
    Promise.all([
      missionsAPI.list({ mode: 'available', limit: 5 }),
      missionsAPI.list({ mode: 'mine', limit: 50 }),
      user?.id ? usersAPI.oeil(user.id).catch(() => null) : Promise.resolve(null),
    ])
      .then(([pRes, mRes, oRes]) => {
        setPending(pRes.data.missions || [])
        const all = mRes.data.missions || []
        setActive(all.filter(m => ['assigned','en_route','active'].includes(m.status)))
        const done     = all.filter(m => m.status === 'completed')
        const earnings = done.reduce((sum, m) => sum + (parseFloat(m.oeil_earning) || 0), 0)
        const profile  = oRes?.data?.oeil || oRes?.data?.user || {}
        setStats({
          completed:    profile.total_missions  || done.length,
          rating:       parseFloat(profile.rating_avg) || 0,
          rating_count: profile.rating_count    || 0,
          balance:      parseFloat(profile.balance)    || 0,
          earnings,
        })
      })
      .catch(() => toast('Erreur de chargement', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const interest = async (id) => {
  try {
    await missionsAPI.interest(id)
    setPending(prev => prev.map(m => m.id === id ? { ...m, interested: true } : m))
    toast('Intérêt exprimé 👁️ Le client va vous contacter.', 'success')
  } catch (err) {
    toast(err.response?.data?.error || 'Erreur', 'error')
  }
}



  const advance = async (mission) => {
    const next = { assigned:'en_route', en_route:'active', active:'completed' }[mission.status]
    if (!next) return
    try {
      await missionsAPI.status(mission.id, { status: next })
      toast(next === 'completed' ? 'Mission terminée ! 🎉' : 'Statut mis à jour ✓', 'success')
      load()
    } catch { toast('Erreur', 'error') }
  }

  const advanceLabel = {
    assigned: '🚗 En route',
    en_route: '▶️ Démarrer',
    active:   '✓ Terminer',
  }

  if (loading) return (
    <AppLayout>
      <Topbar title="Tableau de bord" />
      <div className="flex-1 flex items-center justify-center"><Spinner size="lg" /></div>
    </AppLayout>
  )

  return (
    <AppLayout>
      <Topbar title="Tableau de bord" />
      <div className="p-6 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="stat-card">
            <div className="text-xs text-[#AAA] mb-1">Missions complétées</div>
            <div className="text-2xl font-bold">{stats?.completed || 0}</div>
          </div>
          <div className="stat-card">
            <div className="text-xs text-[#AAA] mb-1">Note moyenne</div>
            <div className="text-2xl font-bold text-yellow-400">
              {stats?.rating ? `${stats.rating}★` : '—'}
            </div>
            {stats?.rating_count > 0 && (
              <div className="text-xs text-[#AAA] mt-1">{stats.rating_count} avis</div>
            )}
          </div>
          <div className="stat-card">
            <div className="text-xs text-[#AAA] mb-1">Revenus (missions)</div>
            <div className="text-2xl font-bold">
              {stats?.earnings?.toFixed(0) || 0}
              <span className="text-sm text-[#AAA] ml-1">MAD</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="text-xs text-[#AAA] mb-1">Solde disponible</div>
            <div className="text-2xl font-bold text-green-400">
              {stats?.balance?.toFixed(0) || 0}
              <span className="text-sm ml-1">MAD</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">

          {/* Missions disponibles */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-sm">
                Missions disponibles
                <span className="ml-2 text-xs bg-[#FF4D00]/15 text-[#FF4D00] px-2 py-0.5 rounded-full">
                  {pending.length}
                </span>
              </h2>
            </div>

            {pending.length === 0 ? (
              <EmptyState icon="🎯" title="Aucune mission disponible" description="Revenez bientôt !" />
            ) : pending.map((m) => (
              <div key={m.id} className="bg-[#222] rounded-xl p-3 mb-3 last:mb-0">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    <div className="font-semibold text-sm truncate">{m.title}</div>
                    <div className="text-xs text-[#AAA] mt-0.5">📍 {m.city}</div>
                  </div>
                  <div className="text-green-400 font-bold whitespace-nowrap text-sm">
                    {parseFloat(m.price).toFixed(0)} MAD
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => interest(m.id)}
                    disabled={m.interested}
                    className="btn btn-primary btn-sm flex-1 justify-center disabled:opacity-50"
                  >
                    {m.interested ? '👁️ Intérêt exprimé' : '👁️ Je suis intéressé'}
                  </button>
                </div> 


              </div>
            ))}
          </div>

          {/* Missions en cours */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-sm">
                Mes missions en cours
                <span className="ml-2 text-xs bg-blue-500/15 text-blue-400 px-2 py-0.5 rounded-full">
                  {active.length}
                </span>
              </h2>
            </div>

            {active.length === 0 ? (
              <EmptyState icon="📋" title="Aucune mission en cours" description="Acceptez une mission pour commencer." />
            ) : active.map((m) => (
              <div key={m.id} className="bg-[#222] rounded-xl p-3 mb-3 last:mb-0">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-semibold text-sm">{m.title}</div>
                    <div className="text-xs text-[#AAA]">Client : {m.client_name}</div>
                  </div>
                  <StatusBadge status={m.status} />
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => setChatMission(m)}
                    className="btn btn-ghost btn-sm flex-1 justify-center"
                  >
                    💬 Chat
                  </button>
                  {advanceLabel[m.status] && (
                    <button onClick={() => advance(m)} className="btn btn-primary btn-sm">
                      {advanceLabel[m.status]}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

      {chatMission && (
        <ChatModal
          mission={chatMission}
          onClose={() => setChatMission(null)}
        />
      )}
    </AppLayout>
  )
}
