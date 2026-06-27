import { NavLink, useNavigate } from 'react-router-dom'

import { useAuth } from '../../context/AuthContext'
import { Avatar } from '../ui'
import { useNotifications } from '../../hooks/useNotifications'
import NotificationBanner from '../ui/NotificationBanner'
import { useState, useEffect } from 'react'
import { missionsAPI, adminAPI } from '../../api'

const MENUS = {
  client: [
    { to: '/client',           icon: '⊞',  label: 'Dashboard'   },
    { to: '/client/missions',  icon: '📋',  label: 'Missions'    },
    { to: '/client/messages',  icon: '💬',  label: 'Messages'    },
    { to: '/client/oeils',     icon: '👁️',  label: 'Les Œils'    },
    { to: '/client/compte',    icon: '👤',  label: 'Compte'      },
  ],
  oeil: [
    { to: '/oeil',             icon: '⊞',  label: 'Dashboard'   },
    { to: '/oeil/missions',    icon: '🎯',  label: 'Missions'    },
    { to: '/oeil/messages',    icon: '💬',  label: 'Messages'    },
    { to: '/oeil/compte',      icon: '👤',  label: 'Profil'      },
  ],

  admin: [
    { to: '/admin',              icon: '⊞',  label: 'Dashboard',    section: 'Vue globale' },
    { to: '/admin/missions',     icon: '📋',  label: 'Missions',     section: 'Vue globale' },
    { to: '/admin/oeils',        icon: '👁️',  label: 'Œils',         section: 'Gestion'     },
    { to: '/admin/clients',      icon: '👥',  label: 'Clients',      section: 'Gestion'     },
    { to: '/admin/reclamations', icon: '🚨',  label: 'Réclamations', section: 'Gestion', badge: 'claims' },
    { to: '/admin/messages-suspects', icon: '⚠️', label: 'Messages suspects', section: 'Gestion', badge: 'flagged' },
    { to: '/admin/fraude',       icon: '🛡️',  label: 'Fraude',       section: 'Gestion'     },
    { to: '/admin/parametres',   icon: '⚙️',  label: 'Paramètres',   section: 'Système'     },
  ],
}

const LABELS = {
  client: 'Espace Client',
  oeil:   'Espace Œil',
  admin:  'Super Admin',
}

export default function AppLayout({ children }) {
  const { user, logout }      = useAuth()
  const navigate               = useNavigate()
  const [isAvail, setIsAvail] = useState(true)

  const [unreadCount, setUnreadCount] = useState(0)

  const [claimsCount, setClaimsCount] = useState(0)

useEffect(() => {
  if (user?.role !== 'admin') return

  const [flaggedCount, setFlaggedCount] = useState(0)

    const fetchClaims = () => {
      adminAPI.claims()
        .then(({ data }) => setClaimsCount((data.claims || []).length))
        .catch(() => {})
    }
    const fetchFlagged = () => {
      adminAPI.flaggedMessages()
        .then(({ data }) => setFlaggedCount((data.messages || []).length))
        .catch(() => {})
    }
    fetchClaims()
    fetchFlagged()
    const interval = setInterval(() => { fetchClaims(); fetchFlagged() }, 60000)
    return () => clearInterval(interval)

}, [user])

useEffect(() => {
  if (!user) return
  const fetchUnread = () => {
    missionsAPI.inbox()
      .then(({ data }) => {
        const total = (data.inbox || []).reduce((acc, m) => acc + (m.unread_count || 0), 0)
        setUnreadCount(total)
      })
      .catch(() => {})
  }
  fetchUnread()
  const interval = setInterval(fetchUnread, 30000) // refresh toutes les 30s
  return () => clearInterval(interval)
}, [user])


  useNotifications({ onChatOpen: (missionId) => {
  window.__notifChatMissionId = missionId
  const route = user?.role === 'oeil' ? '/oeil/missions' : '/client/missions'
  navigate(route)
}})

  const role  = user?.role || 'client'
  const items = MENUS[role] || []

  const grouped = role === 'admin'
    ? items.reduce((acc, item) => {
        const s = item.section || 'Principal'
        if (!acc[s]) acc[s] = []
        acc[s].push(item)
        return acc
      }, {})
    : { Principal: items }

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="flex min-h-screen">

      {/* SIDEBAR — desktop uniquement */}
      <aside className="hidden md:flex w-[220px] flex-shrink-0 bg-[#181818] border-r border-white/20 flex-col fixed top-0 left-0 h-screen z-50">
        {/* Logo */}
        <div className="px-5 py-4 border-b border-white/20 bg-[#222]">
          <div className="font-display font-bold text-xl tracking-tight">
            SHOOF<span className="text-[#FF4D00]">LY</span>
          </div>
          <div className="text-[11px] uppercase tracking-widest text-[#AAA] mt-0.5">
            {LABELS[role]}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2">
          {Object.entries(grouped).map(([section, navItems]) => (
            <div key={section}>
              {Object.keys(grouped).length > 1 && (
                <div className="px-5 py-2 text-[10px] font-bold uppercase tracking-widest text-[#777] border-t border-white/10 mt-1">
                  {section}
                </div>
              )}

                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/client' || item.to === '/oeil' || item.to === '/admin'}
                    className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
                  >
                    <span className="w-4 text-center text-base">{item.icon}</span>
                    <span className="flex-1">{item.label}</span>
                    
                      {item.to.includes('/messages') && unreadCount > 0 && (
                        <span className="bg-[#FF4D00] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                      {item.badge === 'claims' && claimsCount > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                          {claimsCount > 9 ? '9+' : claimsCount}
                        </span>
                      )}

                      {item.badge === 'flagged' && flaggedCount > 0 && (
                      <span className="bg-orange-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                        {flaggedCount > 9 ? '9+' : flaggedCount}
                      </span>
                    )}


                  </NavLink>
                ))}

            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-white/20 bg-[#222]">
          {role === 'oeil' && (
            <button
              onClick={() => setIsAvail((v) => !v)}
              className={`flex items-center gap-2 w-full px-3 py-1.5 rounded-lg text-xs font-semibold mb-2 transition-all border ${
                isAvail
                  ? 'bg-green-500/10 text-green-400 border-green-500/30'
                  : 'bg-white/5 text-[#AAA] border-white/12'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isAvail ? 'bg-green-400' : 'bg-[#777]'}`} />
              {isAvail ? 'Disponible' : 'Indisponible'}
            </button>
          )}
          <div className="flex items-center gap-2">
            <Avatar name={`${user?.first_name || ''} ${user?.last_name || ''}`} size={30} />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold truncate">{user?.first_name} {user?.last_name}</div>
              <div className="text-[11px] text-[#AAA]">{LABELS[role]}</div>
            </div>
            <button
              onClick={handleLogout}
              className="text-[#AAA] hover:text-white text-xs px-1.5 py-1 rounded border border-white/12 hover:border-white/22 transition-all"
              title="Déconnexion"
            >✕</button>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="md:ml-[220px] flex-1 flex flex-col min-h-screen pb-[64px] md:pb-0">
        {/* Header mobile */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-[#181818] border-b border-white/12 sticky top-0 z-40">
          <div className="font-display font-bold text-lg">
            SHOOF<span className="text-[#FF4D00]">LY</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#AAA]">{user?.first_name}</span>
            <button onClick={handleLogout} className="text-[#AAA] text-xs px-2 py-1 rounded border border-white/12">✕</button>
          </div>
        </div>

        {children}
      </main>

      {/* BOTTOM NAV — mobile uniquement */}
      <nav className="mobile-nav">

          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/client' || item.to === '/oeil' || item.to === '/admin'}
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              <span className="icon" style={{ position: 'relative', display: 'inline-block' }}>
                {item.icon}
                {item.to.includes('/messages') && unreadCount > 0 && (
                  <span style={{
                    position: 'absolute', top: -4, right: -6,
                    background: '#FF4D00', color: 'white',
                    fontSize: 9, fontWeight: 700, borderRadius: '50%',
                    width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        <button
          onClick={handleLogout}
          style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:2, padding:'6px 4px', color:'#777', fontSize:10, fontWeight:500, background:'none', border:'none', cursor:'pointer' }}
        >
          <span style={{ fontSize:20 }}>↩</span>
          <span>Quitter</span>
        </button>
      </nav>

      <NotificationBanner />
    </div>
  )
}