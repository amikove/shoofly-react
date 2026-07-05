import { createContext, useContext, useState, useCallback } from 'react'

const NotifContext = createContext(null)

export function NotifProvider({ children }) {
  const [pendingAction, setPendingAction] = useState(null) // { type: 'chat' | 'interests_modal', missionId }

  const setPending = useCallback((type, missionId) => {
    setPendingAction({ type, missionId })
  }, [])

  const clearPending = useCallback(() => {
    setPendingAction(null)
  }, [])

  return (
    <NotifContext.Provider value={{ pendingAction, setPending, clearPending }}>
      {children}
    </NotifContext.Provider>
  )
}

export const useNotif = () => useContext(NotifContext)
