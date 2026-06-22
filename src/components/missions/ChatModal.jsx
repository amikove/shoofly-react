import { useState, useEffect, useRef } from 'react'
import { missionsAPI, mediaAPI } from '../../api'
import { toast, Spinner } from '../ui'
import { useSocket } from '../../context/SocketContext'
import { useAuth } from '../../context/AuthContext'

export default function ChatModal({ mission, onClose }) {
  const { user }              = useAuth()
  const { onEvent, sendMessage, joinMission, leaveMission } = useSocket()
  const [messages, setMessages] = useState([])
  const [msg, setMsg]           = useState('')
  const [loading, setLoading]   = useState(true)
  const [sending, setSending]   = useState(false)
  const [uploading, setUploading] = useState(false)
  const bottomRef               = useRef(null)
  const fileRef                 = useRef(null)

  // Charger les messages existants
  useEffect(() => {
    if (!mission) return
    setLoading(true)
    missionsAPI.get(mission.id)
      .then(({ data }) => setMessages(data.messages || []))
      .catch(() => toast('Erreur chargement messages', 'error'))
      .finally(() => setLoading(false))

    // Rejoindre la room Socket.io
    joinMission?.(mission.id)

    // Écouter les nouveaux messages en temps réel
    const unsub = onEvent?.('new_message', (newMsg) => {
      setMessages(prev => {
        if (prev.find(m => m.id === newMsg.id)) return prev
        return [...prev, newMsg]
      })
    })

    return () => {
      leaveMission?.(mission.id)
      unsub?.()
    }
  }, [mission?.id])

  // Scroll automatique vers le bas
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    if (!msg.trim()) return
    const content = msg.trim()
    setMsg('')
    setSending(true)
    try {
      const { data } = await missionsAPI.message(mission.id, { content })
      setMessages(prev => [...prev, data.message || {
        id: Date.now(), content, sender_id: user?.id,
        sender_role: user?.role, created_at: new Date().toISOString()
      }])
    } catch {
      toast('Erreur envoi message', 'error')
      setMsg(content)
    } finally { setSending(false) }
  }

  const sendFile = async (file) => {
    if (!file) return
    const maxSize = 10 * 1024 * 1024 // 10 Mo
    if (file.size > maxSize) { toast('Fichier trop volumineux (max 10 Mo)', 'error'); return }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('caption', file.name)
      const { data } = await mediaAPI.upload(mission.id, formData)
      toast('Fichier envoyé ✓', 'success')
      // Ajouter un message système pour le fichier
      setMessages(prev => [...prev, {
        id: Date.now(),
        content: `📎 ${file.name}`,
        sender_id: user?.id,
        sender_role: user?.role,
        type: 'media',
        media_url: data.url,
        created_at: new Date().toISOString()
      }])
    } catch {
      toast('Erreur envoi fichier', 'error')
    } finally { setUploading(false) }
  }

  const formatTime = (iso) => {
    if (!iso) return ''
    const d = new Date(iso)
    return d.toLocaleTimeString('fr-MA', { hour: '2-digit', minute: '2-digit' })
  }

  const isMe = (m) => m.sender_id === user?.id

  if (!mission) return null

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
         onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-[#181818] border border-white/20 rounded-2xl w-full max-w-md flex flex-col shadow-[0_24px_60px_rgba(0,0,0,0.6)]"
           style={{ height: '560px' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 flex-shrink-0">
          <div>
            <div className="font-semibold text-sm">{mission.title}</div>
            <div className="text-xs text-[#AAA] mt-0.5">
              {user?.role === 'client'
                ? `Œil : ${mission.oeil_name || '—'}`
                : `Client : ${mission.client_name || '—'}`
              }
            </div>
          </div>
          <button onClick={onClose} className="text-[#AAA] hover:text-white text-lg">✕</button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <Spinner size="md" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-xs text-[#AAA] mt-8">
              Aucun message. Commencez la conversation.
            </div>
          ) : messages.map((m, i) => (
            <div key={m.id || i} className={`flex flex-col ${isMe(m) ? 'items-end' : m.type === 'system' ? 'items-center' : 'items-start'}`}>
              {m.type === 'system' ? (
                <div className="text-[11px] text-[#555] bg-[#222] px-3 py-1 rounded-full">
                  {m.content}
                </div>
              ) : (
                <div className={`max-w-[75%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                  isMe(m)
                    ? 'bg-[#FF4D00] text-white rounded-br-sm'
                    : 'bg-[#2A2A2A] text-white rounded-bl-sm'
                }`}>
                  {m.media_url ? (
                    <a href={m.media_url} target="_blank" rel="noreferrer"
                       className="flex items-center gap-1.5 underline">
                      📎 {m.content}
                    </a>
                  ) : m.content}
                </div>
              )}
              {m.type !== 'system' && (
                <div className="text-[10px] text-[#555] mt-0.5 px-1">
                  {formatTime(m.created_at)}
                </div>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="flex items-center gap-2 p-3 border-t border-white/10 flex-shrink-0">
          {/* Bouton fichier */}
          <input
            ref={fileRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={(e) => sendFile(e.target.files[0])}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#222] border border-white/12 text-[#AAA] hover:text-white hover:border-white/22 transition-all disabled:opacity-50 text-sm flex-shrink-0"
            title="Envoyer une photo ou vidéo"
          >
            {uploading ? '⏳' : '📎'}
          </button>

          {/* Input texte */}
          <input
            className="flex-1 bg-[#222] border border-white/20 rounded-lg px-3 py-2 text-sm text-white outline-none placeholder:text-white/20 focus:border-[#FF4D00]/50 transition-colors"
            placeholder="Votre message..."
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
            disabled={sending}
          />

          {/* Bouton envoyer */}
          <button
            onClick={send}
            disabled={sending || !msg.trim()}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#FF4D00] text-white disabled:opacity-50 hover:opacity-90 transition-all flex-shrink-0"
          >
            {sending ? '⏳' : '→'}
          </button>
        </div>
      </div>
    </div>
  )
}
