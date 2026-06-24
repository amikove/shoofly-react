import { createContext, useContext, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'

const SocketContext = createContext(null)

export function SocketProvider({ children }) {
  const { user } = useAuth()
  const socketRef = useRef(null)

  useEffect(() => {
    const token = localStorage.getItem('shoofly_token')
    if (!user || !token) return

    socketRef.current = io(import.meta.env.VITE_API_URL || 'http://localhost:3001', {
      auth: { token },
    transports: ['websocket', 'polling'],
    })

    socketRef.current.on('connect', () => {
      console.log('🔌 Socket connecté')
    })

    socketRef.current.on('connect_error', (err) => {
      console.warn('Socket erreur:', err.message)
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
    socketRef.current?.on(event, callback)
    return () => socketRef.current?.off(event, callback)
  }

  return (
    <SocketContext.Provider value={{ joinMission, leaveMission, sendMessage, sendLocation, onEvent, socket: socketRef }}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => useContext(SocketContext)
