import { createContext, useContext, useState, useCallback } from 'react'

const NotifContext = createContext(null)

export function NotifProvider({ children }) {
  const [pendingChatMissionId, setPendingChatMissionId] = useState(null)

  const openChat = useCallback((missionId) => {
    setPendingChatMissionId(missionId)
  }, [])

  const clearPendingChat = useCallback(() => {
    setPendingChatMissionId(null)
  }, [])

  return (
    <NotifContext.Provider value={{ pendingChatMissionId, openChat, clearPendingChat }}>
      {children}
    </NotifContext.Provider>
  )
}

export const useNotif = () => useContext(NotifContext)