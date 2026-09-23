import { useSyncExternalStore } from 'react'
import { subscribe, getSnapshot, promptInstall } from '../utils/pwaInstallPrompt'

// 'available' (prêt) | 'unavailable' (jamais déclenché — iOS, desktop sans support) |
// 'dismissed' (invite native refusée — repli guide manuel sur Android) | 'installed'.
// Même motif que useOfflineQueue.js.
export function usePwaInstallPrompt() {
  const status = useSyncExternalStore(subscribe, getSnapshot)
  return { status, promptInstall }
}
