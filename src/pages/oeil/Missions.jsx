import ChatModal from '../../components/missions/ChatModal'
import { useState, useEffect, useCallback } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import Topbar from '../../components/layout/Topbar'
import { missionsAPI } from '../../api'
import { StatusBadge, Spinner, EmptyState, toast } from '../../components/ui'

const TABS = [
  { id: 'available', label: 'Disponibles' },
  { id: 'active',    label: 'En cours'    },
  { id: 'done',      label: 'Terminées'   },
]
const TYPE_ICONS = { immobilier:'🏠', file_attente:'⏳', audit:'🔎', personnalisee:'🎯' }

// Modal chat simple


export default function OeilMissions() {
  const [tab, setTab]           = useState('available')
  const [missions, setMissions] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [chatMission, setChatMission] = useState(null)

  const load = useCallback((t) => {
    setLoading(true)
    setError('')
    let params = {}
    if (t === 'available') {
      params = { mode: 'available' }
    } else if (t === 'active') {
      // Missions assigned, en_route ou active = toutes mes missions non terminées
      params = { mode: 'mine' }
    } else {
      params = { mode: 'mine', status: 'completed' }
    }
    missionsAPI.list(params)
      .then(({ data }) => {
        let ms = data.missions || []
        // Filtrer côté front selon l'onglet
        if (t === 'active') {
          ms = ms.filter((m) => ['assigned','en_route','active'].includes(m.status))
        }
        setMissions(ms)
      })
      .catch((err) => {
        const msg = err.response?.data?.error || 'Erreur de chargement'
        setError(msg)
        toast(msg, 'error')
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load(tab) }, [tab, load])

  // Bug 1 fix : après refus, retirer la mission du fil localement
  const refuse = async (id) => {
    try {
      await missionsAPI.refuse(id)
      setMissions((prev) => prev.filter((m) => m.id !== id))
      toast('Mission refusée', 'info')
    } catch {
      toast('Erreur', 'error')
    }
  }

  
  const interest = async (id) => {
  try {
    await missionsAPI.interest(id)
    setMissions((prev) => prev.map((m) => m.id === id ? { ...m, interested: true } : m))
    toast('Intérêt exprimé 👁️ Le client va vous contacter.', 'success')
  } catch (err) {
    toast(err.response?.data?.error || 'Erreur', 'error')
  }
}



  // Bug 3 fix : respecter les transitions assigned → en_route → active → completed
  const advance = async (mission) => {
    const next = {
      assigned: 'en_route',
      en_route: 'active',
      active:   'completed',
    }[mission.status]

    if (!next) { toast('Statut invalide', 'error'); return }

    const labels = {
      en_route:  'En route vers la mission ✓',
      active:    'Mission démarrée ✓',
      completed: 'Mission terminée ! Bien joué 🎉',
    }

    try {
      await missionsAPI.status(mission.id, { status: next })
      if (next === 'completed') {
        setMissions((prev) => prev.filter((m) => m.id !== mission.id))
        setTab('done')
        load('done')
      } else {
        setMissions((prev) => prev.map((m) => m.id === mission.id ? { ...m, status: next } : m))
      }
      toast(labels[next], 'success')
    } catch (err) {
      toast(err.response?.data?.error || 'Erreur', 'error')
    }
  }

  const emptyProps = {
    available: { icon:'🎯', title:'Aucune mission disponible', desc:'Toutes les missions ont été assignées. Revenez bientôt !' },
    active:    { icon:'📋', title:'Aucune mission en cours',   desc:'Acceptez une mission pour commencer.'                    },
    done:      { icon:'✅', title:'Aucune mission terminée',   desc:'Vos missions complétées apparaîtront ici.'               },
  }

  // Label du bouton d'avancement selon le statut
  const advanceLabel = {
    assigned: '🚗 Je suis en route',
    en_route: '▶️ Démarrer la mission',
    active:   '✓ Terminer la mission',
  }

  return (
    <AppLayout>
      <Topbar title="Missions" />
      <div className="p-6">
        <div className="flex gap-1 bg-[#222] rounded-xl p-1 w-fit mb-6">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                tab === t.id ? 'bg-[#2A2A2A] text-white' : 'text-[#AAA] hover:text-white'
              }`}>
              {t.label}
              {tab === t.id && !loading && (
                <span className="ml-1.5 text-[10px] bg-[#FF4D00]/20 text-[#FF4D00] px-1.5 py-0.5 rounded-full">
                  {missions.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4 text-sm text-red-400">
            ❌ {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : missions.length === 0 ? (
          <EmptyState icon={emptyProps[tab].icon} title={emptyProps[tab].title} description={emptyProps[tab].desc} />
        ) : (
          <div className="space-y-3">
            {missions.map((m) => (
              <div key={m.id} className="card">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-11 h-11 bg-[#222] rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                      {TYPE_ICONS[m.type] || '📋'}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-sm flex items-center gap-2 flex-wrap">
                        {m.title}
                        {m.is_urgent && <span className="badge badge-orange text-[10px]">🚨 Urgent</span>}
                      </div>
                      <div className="text-xs text-[#AAA] mt-1 flex flex-wrap gap-3">
                        <span>📍 {m.city}</span>
                        <span>📅 {m.scheduled_at ? new Date(m.scheduled_at).toLocaleDateString('fr-MA') : '—'}</span>
                        {m.client_name && <span>👤 {m.client_name}</span>}
                        {tab !== 'available' && <StatusBadge status={m.status} />}
                      </div>
                      {m.description && (
                        <p className="text-xs text-[#777] mt-1 line-clamp-1">{m.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-green-400 font-bold text-base">{parseFloat(m.price).toFixed(0)} MAD</div>
                    <div className="text-[11px] text-[#AAA]">net : {Math.round(m.price * 0.8)} MAD</div>
                  </div>
                </div>

                <div className="flex gap-2 mt-4 pt-3 border-t border-white/10">
                  {tab === 'available' && (
                    <button
                      onClick={() => interest(m.id)}
                      disabled={m.interested || m.has_interested}
                      className="btn btn-primary btn-sm flex-1 justify-center disabled:opacity-50"
                    >
                      {(m.interested || m.has_interested) ? '✅ Demande envoyée' : '👁️ Je suis intéressé'}
                    </button>
                  )}
                  
                {tab === 'active' && (
  <>
    <button onClick={() => setChatMission(m)} className="btn btn-ghost btn-sm">💬 Chat</button>
    <button className="btn btn-ghost btn-sm">📸 Photos</button>
    {advanceLabel[m.status] && (
      <button onClick={() => advance(m)} className="btn btn-primary btn-sm flex-1 justify-center">
        {advanceLabel[m.status]}
      </button>
    )}
    {m.status === 'assigned' && (
      <button
        onClick={() => refuse(m.id)}
        className="btn btn-ghost btn-sm text-red-400"
      >
        ✕ Refuser
      </button>
    )}
  </>
)}




                  {tab === 'done' && (
                    <button className="btn btn-ghost btn-sm">📄 Voir rapport</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bug 2 fix : modal chat */}
      {chatMission && (
        <ChatModal mission={chatMission} onClose={() => setChatMission(null)} />
      )}
    </AppLayout>
  )
}
