import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'

const SocketContext = createContext(null)

export function SocketProvider({ children }) {
  const { user } = useAuth()
  const socketRef = useRef(null)
  const [connected, setConnected] = useState(false)
  // Rooms mission actuellement rejointes côté client (via joinMission ci-dessous) — le serveur
  // (index.js) ne garde aucune trace des rooms d'un socket au-delà de sa connexion : une simple
  // coupure réseau reconnectée automatiquement par socket.io-client crée un NOUVEAU socket.id côté
  // serveur, qui n'est plus dans `mission:<id>` tant que join_mission n'est pas réémis. Sans ça,
  // un ChatModal resté ouvert pendant une coupure ne recevrait plus new_message/
  // mission_status_changed après reconnexion, sans qu'aucune erreur ne soit visible.
  const joinedMissionsRef = useRef(new Set())

  useEffect(() => {
    const token = localStorage.getItem('shoofly_token')
    if (!user || !token) return

    socketRef.current = io(import.meta.env.VITE_API_URL || 'http://localhost:3001', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    })

    // Hook de debug dev-only — permet de forcer une coupure/reconnexion depuis la console pour
    // vérifier manuellement le rejoin automatique des rooms (voir joinedMissionsRef ci-dessus).
    // Absent des builds de production (import.meta.env.DEV est éliminé statiquement par Vite).
    if (import.meta.env.DEV) window.__shooflySocket = socketRef.current

    socketRef.current.on('connect', () => {
      setConnected(true)
      // Rejoint automatiquement toutes les rooms mission actives — couvre aussi bien la 1ère
      // connexion (ensemble vide, no-op) qu'une reconnexion après coupure (voir commentaire sur
      // joinedMissionsRef ci-dessus).
      for (const missionId of joinedMissionsRef.current) {
        socketRef.current.emit('join_mission', missionId)
      }
    })

    socketRef.current.on('disconnect', (reason) => {
      console.warn('🔌 Socket déconnecté:', reason)
      setConnected(false)
      // Forcer la reconnexion si le serveur a coupé
      if (reason === 'io server disconnect') {
        socketRef.current.connect()
      }
    })

    socketRef.current.on('connect_error', (err) => {
      console.warn('Socket erreur:', err.message)
      setConnected(false)
    })

    socketRef.current.on('reconnect', (attempt) => {
      setConnected(true)
    })

    return () => {
      socketRef.current?.disconnect()
    }
  }, [user])

  const joinMission = (missionId) => {
    joinedMissionsRef.current.add(missionId)
    socketRef.current?.emit('join_mission', missionId)
  }

  const leaveMission = (missionId) => {
    joinedMissionsRef.current.delete(missionId)
    socketRef.current?.emit('leave_mission', missionId)
  }

  const sendMessage = (missionId, content) => {
    socketRef.current?.emit('send_message', { missionId, content })
  }

  const sendLocation = (missionId, lat, lng) => {
    socketRef.current?.emit('location_update', { missionId, lat, lng })
  }

  const onEvent = (event, callback) => {
    if (!socketRef.current) return () => {}
    socketRef.current.on(event, callback)
    return () => socketRef.current?.off(event, callback)
  }

  return (
    <SocketContext.Provider value={{ joinMission, leaveMission, sendMessage, sendLocation, onEvent, socket: socketRef, connected }}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => useContext(SocketContext)