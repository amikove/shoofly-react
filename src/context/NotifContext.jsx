import { createContext, useContext, useRef, useState, useCallback } from 'react'

const NotifContext = createContext(null)

export function NotifProvider({ children }) {
  const [pendingChatMissionId, setPendingChatMissionId] = useState(null)
  const pendingRef = useRef(null)

  const openChat = useCallback((missionId) => {
    pendingRef.current = missionId
    setPendingChatMissionId(missionId)
  }, [])

  const clearPendingChat = useCallback(() => {
    pendingRef.current = null
    setPendingChatMissionId(null)
  }, [])

  const getPending = useCallback(() => pendingRef.current, [])

  return (
    <NotifContext.Provider value={{ pendingChatMissionId, openChat, clearPendingChat, getPending }}>
      {children}
    </NotifContext.Provider>
  )
}

export const useNotif = () => useContext(NotifContext)