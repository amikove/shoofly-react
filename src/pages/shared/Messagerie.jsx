import { useState, useEffect } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import Topbar from '../../components/layout/Topbar'
import { missionsAPI } from '../../api'
import { Spinner, EmptyState, toast } from '../../components/ui'
import ChatModal from '../../components/missions/ChatModal'
import { useAuth } from '../../context/AuthContext'

const STATUS_LABEL = {
  pending:   { label: 'En attente', color: 'text-yellow-400' },
  assigned:  { label: 'Assignée',   color: 'text-blue-400'   },
  en_route:  { label: 'En route',   color: 'text-purple-400' },
  completed: { label: 'Terminée',   color: 'text-green-400'  },
  cancelled: { label: 'Annulée',    color: 'text-red-400'    },
}

const TYPE_ICON = {
  immobilier: '🏠',
  file:       '📋',
  audit:      '🔍',
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 1)   return 'à l\'instant'
  if (mins < 60)  return `il y a ${mins} min`
  if (hours < 24) return `il y a ${hours}h`
  if (days === 1) return 'hier'
  return `il y a ${days}j`
}

export default function Messagerie() {
  const { user } = useAuth()
  const [inbox, setInbox]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [chatMission, setChatMission] = useState(null)

  const load = () => {
    setLoading(true)
    missionsAPI.inbox()
      .then(({ data }) => setInbox(data.inbox || []))
      .catch(() => toast('Erreur de chargement', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openChat = (mission) => {
    setChatMission(mission)
    missionsAPI.seen(mission.id).catch(() => {})
    setInbox(prev => prev.map(m => m.id === mission.id ? { ...m, unread_count: 0 } : m))
  }

  const totalUnread = inbox.reduce((acc, m) => acc + (m.unread_count || 0), 0)

  return (
    <AppLayout>
      <Topbar title={`Messagerie${totalUnread > 0 ? ` (${totalUnread})` : ''}`} />
      <div className="p-4 md:p-6 max-w-2xl mx-auto">
        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : inbox.length === 0 ? (
          <EmptyState icon="💬" title="Aucune conversation" description="Vos échanges avec les Œils apparaîtront ici." />
        ) : (
          <div className="card p-0 overflow-hidden">
            {inbox.map((m, i) => {
              const st = STATUS_LABEL[m.status] || { label: m.status, color: 'text-[#AAA]' }
              const otherName = user?.role === 'client' ? m.oeil_name : m.client_name
              return (
                <button
                  key={m.id}
                  onClick={() => openChat(m)}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left ${i < inbox.length - 1 ? 'border-b border-white/10' : ''}`}
                >
                  {/* Icône type */}
                  <div className="text-2xl shrink-0">{TYPE_ICON[m.type] || '📌'}</div>

                  {/* Contenu */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm truncate">{m.title}</span>
                      <span className={`text-[11px] shrink-0 ${st.color}`}>{st.label}</span>
                    </div>
                    <div className="text-xs text-[#AAA] truncate mt-0.5">
                      {otherName && <span className="text-white/60">{otherName} · </span>}
                      {m.last_message || 'Aucun message'}
                    </div>
                  </div>

                  {/* Droite */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-[11px] text-[#555]">{timeAgo(m.last_message_at)}</span>
                    {m.unread_count > 0 && (
                      <span className="bg-[#FF4D00] text-white text-[11px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {m.unread_count > 9 ? '9+' : m.unread_count}
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {chatMission && (
        <ChatModal
          mission={chatMission}
          onClose={() => { setChatMission(null); load() }}
        />
      )}
    </AppLayout>
  )
}