import { useEffect, useRef, useSyncExternalStore } from 'react'
import { offlineQueue } from '../utils/offlineQueueInstance'

// Actions terrain en attente d'envoi pour l'utilisateur courant : { items, count }. useSyncExternalStore
// (et non un setState en effet) : lecture réactive à la file, référence stable tant que rien ne change.
export function useOfflineQueue() {
  return useSyncExternalStore(offlineQueue.subscribe, offlineQueue.getSnapshot)
}

// Appelle `onProcessed(event)` chaque fois qu'une action mise en file vient d'être rejouée
// (event.outcome : 'sent' | 'rejected' | 'expired' | 'failed') — pour resynchroniser l'écran avec le
// serveur. Le callback le plus récent est toujours utilisé (ref), l'abonnement n'est posé qu'une fois.
export function useOfflineQueueProcessed(onProcessed) {
  const ref = useRef(onProcessed)
  useEffect(() => { ref.current = onProcessed })
  useEffect(() => offlineQueue.subscribe((event) => {
    if (event.type === 'processed' && ref.current) ref.current(event)
  }), [])
}
