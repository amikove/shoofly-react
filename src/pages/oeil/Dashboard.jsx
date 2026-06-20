import { useState, useEffect } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import Topbar from '../../components/layout/Topbar'
import { missionsAPI, usersAPI } from '../../api'
import { StatusBadge, Spinner, EmptyState, Stars, toast } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'

export default function OeilDashboard() {
  const { user } = useAuth()
  const [pending, setPending] = useState([])
  const [active, setActive]   = useState([])
  const [stats, setStats]     = useState({ completed: 0, rating: 0, earnings: 0, balance: 0 })
  const [loading, setLoading] = useState(true)

  const load = () => {
    Promise.all([
      missionsAPI.list({ status: 'available', limit: 5 }),
      missionsAPI.list({ mode: 'mine', status: 'active', limit: 3 }),
    ])
      .then(([pRes, aRes]) => {
        setPending(pRes.data.missions || [])
        setActive(aRes.data.missions || [])
      })
      .catch(() => toast('Erreur de chargement', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const accept = async (id) => {
    try {
      await missionsAPI.accept(id)
      load()
      toast('Mission acceptée ! 🎉', 'success')
    } catch (err) { toast(err.response?.data?.error || 'Erreur', 'error') }
  }

  const complete = async (id) => {
    try {
      await missionsAPI.status(id, { status: 'completed' })
      load()
      toast('Mission terminée ! Bien joué 🎉', 'success')
    } catch { toast('Erreur', 'error') }
  }

  if (loading) return <AppLayout><Topbar title="Tableau de bord" /><div className="flex-1 flex items-center justify-center"><Spinner size="lg" /></div></AppLayout>

  return (
    <AppLayout>
      <Topbar title="Tableau de bord" />
      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="stat-card"><div className="text-xs text-[#AAA] mb-1">Missions complétées</div><div className="text-2xl font-bold">{stats.completed}</div></div>
          <div className="stat-card"><div className="text-xs text-[#AAA] mb-1">Note moyenne</div><div className="text-2xl font-bold text-yellow-400">{stats.rating || '—'}★</div></div>
          <div className="stat-card"><div className="text-xs text-[#AAA] mb-1">Revenus du mois</div><div className="text-2xl font-bold">{stats.earnings} <span className="text-sm text-[#AAA]">MAD</span></div></div>
          <div className="stat-card"><div className="text-xs text-[#AAA] mb-1">Solde disponible</div><div className="text-2xl font-bold text-green-400">{stats.balance} <span className="text-sm">MAD</span></div></div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Missions disponibles */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-sm">Missions disponibles</h2>
              <a href="/oeil/missions" className="text-xs text-[#FF4D00]">Voir tout</a>
            </div>
            {pending.length === 0 ? (
              <EmptyState icon="🎯" title="Aucune mission disponible" description="Revenez bientôt !" />
            ) : pending.map((m) => (
              <div key={m.id} className="bg-[#222] rounded-xl p-3 mb-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="font-semibold text-sm">{m.title}</div>
                    <div className="text-xs text-[#AAA]">📍 {m.city}</div>
                  </div>
                  <div className="text-green-400 font-bold whitespace-nowrap">{parseFloat(m.price).toFixed(0)} MAD</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => accept(m.id)} className="btn btn-primary btn-sm flex-1 justify-center">Accepter</button>
                  <button className="btn btn-ghost btn-sm">Détail</button>
                </div>
              </div>
            ))}
          </div>

          {/* Mission en cours */}
          <div className="card">
            <h2 className="font-semibold text-sm mb-4">Mission en cours</h2>
            {active.length === 0 ? (
              <EmptyState icon="📋" title="Aucune mission active" description="Acceptez une mission pour commencer." />
            ) : active.map((m) => (
              <div key={m.id} className="bg-[#222] rounded-xl p-4 mb-3">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-semibold text-sm">{m.title}</div>
                    <div className="text-xs text-[#AAA]">Client: {m.client_name}</div>
                  </div>
                  <StatusBadge status={m.status} />
                </div>
                <div className="flex gap-2">
                  <button className="btn btn-primary btn-sm flex-1 justify-center">📸 Photos</button>
                  <button className="btn btn-ghost btn-sm">💬 Chat</button>
                  <button onClick={() => complete(m.id)} className="btn btn-green btn-sm">✓ Terminer</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
