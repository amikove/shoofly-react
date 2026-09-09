// Hook + helpers pour les notifications : in-app (toast), navigateur (service worker /
// new Notification), et abonnement Web Push.
//
// Chantier notifications push — Phase 2 :
//  - abonnement Web Push (pushManager.subscribe -> POST /api/push/subscribe), désabonnement
//  - sendPushNotification() passe désormais par le service worker (registration.showNotification)
//    quand il est là — même rendu et même gestion du clic que les push serveur (public/sw.js)
//  - L18 : TOUT évènement `notification` reçu en temps réel produit un retour (toast + notif
//    navigateur), plus seulement les ~4 formes chat/média/affectation/nouvelle-mission
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSocket } from '../context/SocketContext'
import { useAuth } from '../context/AuthContext'
import { toast } from '../components/ui'
import { pushAPI } from '../api'

// ── Détections d'environnement ────────────────────────────────
export function pushSupported() {
  return typeof navigator !== 'undefined'
    && 'serviceWorker' in navigator
    && 'PushManager' in window
    && 'Notification' in window
}
export function isIOS() {
  if (typeof navigator === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
    // iPadOS 13+ se présente comme un Mac tactile
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}
export function isStandalone() {
  return window.navigator.standalone === true
    || window.matchMedia('(display-mode: standalone)').matches
}

// ── Clé publique VAPID ───────────────────────────────────────
// Priorité à une clé de build (VITE_VAPID_PUBLIC_KEY) si fournie — sinon on la demande au
// backend (GET /api/push/vapid-public-key, non authentifiée). Mise en cache après le 1er appel.
let _vapidKey
async function getVapidKey() {
  if (_vapidKey !== undefined) return _vapidKey || null
  if (import.meta.env.VITE_VAPID_PUBLIC_KEY) {
    _vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY
    return _vapidKey
  }
  try {
    const { data } = await pushAPI.vapidKey()
    _vapidKey = data && data.key ? data.key : ''
  } catch {
    _vapidKey = ''
  }
  return _vapidKey || null
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

// ── Abonnement / désabonnement Web Push ──────────────────────
// Idempotent : réutilise l'abonnement navigateur existant s'il y en a un, et re-POST toujours
// vers le backend (rafraîchit last_seen_at, réactive un endpoint précédemment neutralisé).
export async function subscribeToPush() {
  if (!pushSupported() || Notification.permission !== 'granted') return { ok: false }
  try {
    const reg = await navigator.serviceWorker.ready
    let sub = await reg.pushManager.getSubscription()
    if (!sub) {
      const key = await getVapidKey()
      if (!key) return { ok: false, reason: 'no-vapid' }
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
      })
    }
    const json = sub.toJSON() // { endpoint, keys: { p256dh, auth } }
    await pushAPI.subscribe({
      subscription: { endpoint: json.endpoint, keys: json.keys },
      platform: 'web',
    })
    return { ok: true }
  } catch (e) {
    console.warn('[push] subscribeToPush échoué :', e && e.message)
    return { ok: false, reason: 'error' }
  }
}

export async function unsubscribeFromPush() {
  if (!('serviceWorker' in navigator)) return
  try {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    if (sub) {
      const endpoint = sub.endpoint
      await sub.unsubscribe()
      await pushAPI.unsubscribe(endpoint).catch(() => {})
    }
  } catch (e) {
    console.warn('[push] unsubscribeFromPush échoué :', e && e.message)
  }
}

// ── Demander la permission navigateur (+ s'abonner si accordée) ──
// Signature inchangée (NotificationBanner l'appelle). iOS : `Notification.requestPermission`
// n'existe qu'en PWA installée — `pushSupported()` renvoie false sinon, la bannière affiche
// alors le guide d'installation au lieu du bouton.
export async function requestPushPermission() {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'denied') return false
  let perm = Notification.permission
  if (perm === 'default') perm = await Notification.requestPermission()
  if (perm !== 'granted') return false
  await subscribeToPush()
  return true
}

// ── Notification navigateur (système) ────────────────────────
// Passe par le service worker quand il est disponible (rendu + clic cohérents avec les push
// serveur, et fonctionne même onglet en arrière-plan). Repli `new Notification()` sinon
// (iOS hors PWA, enregistrement SW KO). Ne lève jamais.
export function sendPushNotification(title, body, options = {}) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return

  const opts = {
    body: body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    tag: options.tag || 'shoofly',
    renotify: false,
    requireInteraction: options.urgent || false,
    data: { url: options.url || '/' },
  }

  if ('serviceWorker' in navigator) {
    Promise.race([
      navigator.serviceWorker.ready,
      new Promise((_, rej) => setTimeout(() => rej(new Error('sw-timeout')), 2000)),
    ])
      .then((reg) => reg.showNotification(title, opts))
      .catch(() => fallbackNotification(title, opts, options))
  } else {
    fallbackNotification(title, opts, options)
  }
}

function fallbackNotification(title, opts, options) {
  try {
    const n = new Notification(title, opts)
    n.onclick = () => {
      window.focus()
      if (options.url && options.url !== '/') window.location.href = options.url
      n.close()
    }
    setTimeout(() => n.close(), 5000)
  } catch {
    /* le constructeur Notification lève sur certains navigateurs mobiles — no-op */
  }
}

// ── Deep-link d'une notification -> route in-app (role-aware) ──
// Miroir du switch de components/layout/Topbar.jsx (handleClick). Utilisé pour l'URL de la
// notif navigateur ET le onClick du toast.
export function notifDeepLink(notif, role) {
  const missionsRoute = role === 'oeil' ? '/oeil/missions' : '/client/missions'
  switch (notif && notif.action_type) {
    case 'chat':
    case 'interests_modal':
    case 'mission_view':                       return missionsRoute
    case 'admin_missions':                     return '/admin/missions'
    case 'admin_problems':                     return '/admin/problemes'
    case 'admin_messages_suspects':            return '/admin/messages-suspects'
    case 'admin_fiabilite':                    return '/admin/fiabilite'
    case 'admin_wallet_reconciliation':        return '/admin/wallet-reconciliation'
    case 'admin_missions_proches_validation':  return '/admin/missions-proches-validation'
    case 'admin_urgent_ticket':
    case 'admin_ticket_message':               return '/admin/tickets'
    case 'admin_block_appeals':                return '/admin/block-appeals'
    case 'ticket_view':                        return role === 'oeil' ? '/oeil/tickets' : '/client/tickets'
    case 'mes_signalements':                   return role === 'oeil' ? '/oeil/mes-signalements' : '/client/mes-signalements'
    case 'reliability_page':                   return role === 'oeil' ? '/oeil/compte' : missionsRoute
    case 'gains_page':                         return '/oeil/gains'
    case 'verification_page':                  return '/oeil/verification-identite'
    default:                                   return '/'
  }
}

function toastKind(type) {
  if (type === 'error') return 'error'
  if (type === 'success') return 'success'
  return 'info'
}

// ── Hook principal ─────────────────────────────────────────
export function useNotifications({ onChatOpen } = {}) {
  const { user } = useAuth()
  const { onEvent } = useSocket() || {}
  const navigate = useNavigate()

  // Au montage : si la permission est DÉJÀ accordée, (re)synchroniser l'abonnement push.
  // On NE demande PLUS la permission automatiquement ici (avant : prompt natif surprise dès le
  // 1er chargement) — c'est le rôle de NotificationBanner (bouton explicite + guide iOS).
  useEffect(() => {
    if (user && 'Notification' in window && Notification.permission === 'granted') {
      subscribeToPush()
    }
  }, [user])

  useEffect(() => {
    if (!onEvent || !user) return

    // ── Nouveau message chat (INCHANGÉ) ──────────────────────
    const unsubMessage = onEvent('new_message', (msg) => {
      if (msg.sender_id === user.id) return
      const senderName = msg.sender_name || (user.role === 'client' ? 'Votre Œil' : 'Votre client')
      const body = msg.body || msg.content?.slice(0, 60) || ''
      toast(`💬 ${senderName} — ${body}`, 'info')
      if (onChatOpen) window.__notifChatMissionId = msg.mission_id
      sendPushNotification(`💬 ${senderName}`, body, {
        tag: `message-${msg.mission_id}`,
        url: user.role === 'oeil' ? '/oeil/missions' : '/client/missions',
      })
    })

    // ── Notification directe ─────────────────────────────────
    const unsubNotif = onEvent('notification', (notif) => {
      if (!notif || !notif.title) return
      const mid = notif.mission_id || notif.missionId

      // Formes chat/média/affectation historiques — comportement INCHANGÉ (toast « 💬 … »).
      const isLegacyChatFamily = notif.type === 'message'
        || notif.title === 'Nouveau message'
        || notif.title === '📸 Médias reçus'
        || notif.title === 'Œil assigné 👁️'
      if (isLegacyChatFamily) {
        toast(`💬 ${notif.body}`, 'info')
        sendPushNotification(notif.title || 'Nouveau message', notif.body || '', {
          tag: `notif-${mid}`,
          url: user.role === 'oeil' ? '/oeil/missions' : '/client/missions',
        })
        if (mid) window.__notifChatMissionId = mid
        return
      }

      // L18 — TOUS les autres évènements (avant : aucun retour, ni toast ni notif navigateur).
      const url = notifDeepLink(notif, user.role)
      toast(
        `${notif.title}${notif.body ? ' — ' + notif.body : ''}`,
        toastKind(notif.type),
        url !== '/' ? { onClick: () => navigate(url) } : {},
      )
      // Chat pur déjà couvert par `new_message` (contexte plus riche) — pas de 2e notif navigateur.
      if (notif.action_type !== 'chat') {
        sendPushNotification(notif.title, notif.body || '', {
          tag: `notif-${notif.id || mid || Date.now()}`,
          url,
          urgent: notif.type === 'error',
        })
      }
    })

    // ── Nouvelle mission disponible (Œils) (INCHANGÉ) ─────────
    const unsubMission = onEvent('new_mission', (mission) => {
      if (user.role !== 'oeil') return
      toast(`🎯 Nouvelle mission : ${mission.title} — ${mission.city}`, 'info')
      sendPushNotification(
        '🎯 Nouvelle mission disponible',
        `${mission.title} — ${mission.city} · ${mission.price} MAD`,
        { tag: `mission-${mission.id}`, url: '/oeil/missions', urgent: mission.is_urgent },
      )
    })

    return () => {
      unsubMessage?.()
      unsubNotif?.()
      unsubMission?.()
    }
  }, [onEvent, user, navigate, onChatOpen])
}
