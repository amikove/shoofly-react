import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'

const SocketContext = createContext(null)

export function SocketProvider({ children }) {
  const { user } = useAuth()
  const socketRef = useRef(null)
  const [connected, setConnected] = useState(false)

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

    socketRef.current.on('connect', () => {
      console.log('🔌 Socket connecté')
      setConnected(true)
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
      console.log('🔌 Socket reconnecté après', attempt, 'tentatives')
      setConnected(true)
    })

    return () => {
      socketRef.current?.disconnect()
    }
  }, [user])

  const joinMission = (missionId) => {
    socketRef.current?.emit('join_mission', missionId)
  }

  const leaveMission = (missionId) => {
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