// Câblage RÉEL de la file d'actions terrain hors-ligne (moteur : offlineQueue.js) : stockage navigateur,
// client axios de l'app (mêmes intercepteurs 401 / compte bloqué que toute requête), état réseau, Web
// Locks, et toasts d'information sur l'issue de chaque rejeu. start() est appelé UNE fois dans main.jsx.
import api from '../api/client'
import i18n from '../i18n/config'
import { toast } from '../components/ui'
import { createOfflineQueue } from './offlineQueue'

// localStorage peut lever (mode privé strict, stockage désactivé) : repli sur une mémoire de session —
// la file fonctionne alors le temps de la session, sans survivre à un rechargement.
function pickStorage() {
  try {
    const s = window.localStorage
    s.getItem('shoofly_offline_queue_probe')
    return s
  } catch {
    const mem = new Map()
    return { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => { mem.set(k, String(v)) } }
  }
}

// Même source que AuthContext.jsx (login() écrit shoofly_user, logout()/401 l'effacent).
function readUserId() {
  try {
    const u = JSON.parse(window.localStorage.getItem('shoofly_user') || 'null')
    return u && u.id ? u.id : null
  } catch {
    return null
  }
}

export const offlineQueue = createOfflineQueue({
  storage: pickStorage(),
  send: (path) => api.post(path),
  getUserId: readUserId,
  isOnline: () => navigator.onLine !== false,
  locks: typeof navigator !== 'undefined' && navigator.locks ? navigator.locks : null,
})

// Issue de chaque action rejouée : l'Œil est toujours informé (jamais d'échec silencieux).
offlineQueue.subscribe((event) => {
  if (event.type !== 'processed') return
  const { outcome, item, message } = event
  const action = i18n.t(`offlineQueue.actions.${item.type}`)
  if (outcome === 'sent') toast(i18n.t(`offlineQueue.sentToast.${item.type}`), 'success')
  else if (outcome === 'rejected') toast(i18n.t('offlineQueue.rejectedToast', { action, reason: message || i18n.t('offlineQueue.unknownReason') }), 'error')
  else if (outcome === 'expired') toast(i18n.t('offlineQueue.expiredToast', { action }), 'error')
  else if (outcome === 'failed') toast(i18n.t('offlineQueue.failedToast', { action }), 'error')
})
