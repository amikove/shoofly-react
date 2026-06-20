import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usersAPI } from '../../api'
import { useAuth } from '../../context/AuthContext'

export default function Topbar({ title, actions }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [notifs, setNotifs]   = useState([])
  const [unread, setUnread]   = useState(0)
  const [showNotifs, setShowNotifs] = useState(false)

  useEffect(() => {
    usersAPI.notifications()
      .then(({ data }) => {
        setNotifs(data.notifications || [])
        setUnread(data.unread || 0)
      })
      .catch(() => {})
  }, [])

  const markAll = async () => {
    await usersAPI.markRead({})
    setUnread(0)
    setNotifs((n) => n.map((x) => ({ ...x, is_read: true })))
  }

  return (
    <header className="h-[54px] bg-[#181818] border-b border-white/20 flex items-center justify-between px-6 sticky top-0 z-40 shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-[#AAA] hover:text-white text-sm px-2 py-1 rounded border border-white/12 hover:border-white/22 transition-all">←</button>
        <button onClick={() => navigate(1)}  className="text-[#AAA] hover:text-white text-sm px-2 py-1 rounded border border-white/12 hover:border-white/22 transition-all">→</button>
        <h1 className="font-display font-semibold text-[15px]">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifs((v) => !v)}
            className="relative p-2 border border-white/12 rounded-lg text-[#AAA] hover:text-white hover:border-white/22 transition-all"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#FF4D00] text-white text-[10px] font-bold min-w-[14px] h-3.5 rounded-full flex items-center justify-center px-0.5">
                {unread}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 top-10 w-[300px] bg-[#181818] border border-white/20 rounded-xl shadow-[0_16px_40px_rgba(0,0,0,0.5)] overflow-hidden z-50">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/12">
                <span className="text-sm font-semibold">Notifications</span>
                <button onClick={markAll} className="text-[11px] text-[#FF4D00]">Tout lire</button>
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {!notifs.length ? (
                  <div className="py-8 text-center text-xs text-[#AAA]">Aucune notification</div>
                ) : notifs.slice(0, 10).map((n) => (
                  <div key={n.id} className={`flex gap-2.5 px-4 py-3 border-b border-white/10 ${!n.is_read ? 'bg-[#FF4D00]/3' : ''}`}>
                    <span className="text-base flex-shrink-0">{n.type === 'mission' ? '📋' : n.type === 'media' ? '📸' : 'ℹ️'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium">{n.title}</div>
                      <div className="text-[11px] text-[#AAA] leading-relaxed">{n.body}</div>
                    </div>
                    {!n.is_read && <div className="w-1.5 h-1.5 rounded-full bg-[#FF4D00] flex-shrink-0 mt-1" />}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions custom */}
        {actions}
      </div>
    </header>
  )
}
