import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import AppLayout from '../../components/layout/AppLayout'
import Topbar from '../../components/layout/Topbar'
import { missionsAPI } from '../../api'
import { Spinner, EmptyState, toast } from '../../components/ui'
import ChatModal from '../../components/missions/ChatModal'
import { useAuth } from '../../context/AuthContext'

const STATUS_LABEL_KEY = {
  pending:          { key: 'pending',         color: 'text-yellow-400' },
  assigned:         { key: 'assigned',        color: 'text-blue-400'   },
  en_route:         { key: 'enRoute',         color: 'text-purple-400' },
  completed:        { key: 'completed',       color: 'text-green-400'  },
  cancelled:        { key: 'cancelled',       color: 'text-red-400'    },
  sous_reclamation: { key: 'sousReclamation', color: 'text-orange-400' },
}

const TYPE_ICON = {
  immobilier: '🏠',
  file:       '📋',
  audit:      '🔍',
}

function timeAgo(dateStr, t) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 1)   return t('messagerie.timeAgo.now')
  if (mins < 60)  return t('messagerie.timeAgo.minutes', { count: mins })
  if (hours < 24) return t('messagerie.timeAgo.hours', { count: hours })
  if (days === 1) return t('messagerie.timeAgo.yesterday')
  return t('messagerie.timeAgo.days', { count: days })
}

export default function Messagerie() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [inbox, setInbox]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [chatMission, setChatMission] = useState(null)

  const load = () => {
    setLoading(true)
    missionsAPI.inbox()
      .then(({ data }) => setInbox(data.inbox || []))
      .catch(() => toast(t('messagerie.errorLoading'), 'error'))
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
      <Topbar title={totalUnread > 0 ? t('messagerie.titleWithUnread', { count: totalUnread }) : t('messagerie.title')} />
      <div className="p-4 md:p-6 max-w-2xl mx-auto">
        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : inbox.length === 0 ? (
          <EmptyState icon="💬" title={t('messagerie.emptyTitle')} description={t('messagerie.emptyDesc')} />
        ) : (
          <div className="card p-0 overflow-hidden">
            {inbox.map((m, i) => {
              const st = STATUS_LABEL_KEY[m.status] || { key: null, color: 'text-[#AAA]' }
              const statusLabel = st.key ? t(`messagerie.status.${st.key}`) : m.status
              const otherName = user?.role === 'client' ? m.oeil_name : m.client_name
              return (
                <button
                  key={m.id}
                  onClick={() => openChat(m)}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-start ${i < inbox.length - 1 ? 'border-b border-white/10' : ''}`}
                >
                  {/* Icône type */}
                  <div className="text-2xl shrink-0">{TYPE_ICON[m.type] || '📌'}</div>

                  {/* Contenu */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm truncate">{m.title}</span>
                      <span className={`text-[11px] shrink-0 ${st.color}`}>{statusLabel}</span>
                    </div>
                    <div className="text-xs text-[#AAA] truncate mt-0.5">
                      {otherName && <span className="text-white/60">{otherName} · </span>}
                      {m.last_message || t('messagerie.noMessage')}
                    </div>
                  </div>

                  {/* Droite */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-[11px] text-[#555]">{timeAgo(m.last_message_at, t)}</span>
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