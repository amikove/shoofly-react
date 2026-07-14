import { useState, useEffect } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import Topbar from '../../components/layout/Topbar'
import { adminAPI } from '../../api'
import { Spinner, toast } from '../../components/ui'
import ChatModal from '../../components/missions/ChatModal'

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

export default function AdminMessagesSuspects() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading]   = useState(true)
  const [chatMission, setChatMission] = useState(null)

  useEffect(() => {
    adminAPI.flaggedMessages()
      .then(({ data }) => setMessages(data.messages || []))
      .catch(() => toast('Erreur de chargement', 'error'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <AppLayout>
      <Topbar title="Messages suspects" />
      <div className="p-4 md:p-6 space-y-3">
        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : messages.length === 0 ? (
          <div className="card text-center py-12 text-[#AAA]">
            <div className="text-4xl mb-3">✅</div>
            <p className="text-sm">Aucun message suspect détecté</p>
          </div>
        ) : messages.map((m) => (
          <div key={m.id} className="card space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-orange-400 font-semibold text-sm">⚠️ Message suspect</span>
                  <span className="text-xs text-[#555]">{timeAgo(m.created_at)}</span>
                </div>
                <div className="text-xs text-[#AAA] mt-0.5">
                  Envoyé par <span className="text-white">{m.sender_name}</span>
                  <span className="ms-1 text-[#555]">({m.sender_role})</span>
                  {' '}dans <span className="text-white">{m.mission_title}</span>
                </div>
              </div>
            </div>

            <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-3">
              <div className="text-xs text-[#AAA] mb-1">Contenu du message :</div>
              <p className="text-sm text-white/80">{m.content}</p>
            </div>

            <button
              onClick={() => setChatMission({ id: m.mission_id, title: m.mission_title })}
              className="btn btn-ghost btn-sm"
            >
              💬 Voir la conversation →
            </button>
          </div>
        ))}
      </div>

      {chatMission && (
        <ChatModal mission={chatMission} onClose={() => setChatMission(null)} />
      )}
    </AppLayout>
  )
}