// Hook pour gérer les notifications in-app et push navigateur
import { useEffect, useCallback } from 'react'
import { useSocket } from '../context/SocketContext'
import { useAuth } from '../context/AuthContext'
import { toast } from '../components/ui'

// ── Demander la permission push au navigateur ──────────────
export async function requestPushPermission() {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false

  const permission = await Notification.requestPermission()
  return permission === 'granted'
}

// ── Envoyer une notification push système ─────────────────
export function sendPushNotification(title, body, options = {}) {
  if (!('Notification' in window)) return
  if (Notification.permission !== 'granted') return

  const notification = new Notification(title, {
    body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: options.tag || 'shoofly',
    requireInteraction: options.urgent || false,
    ...options,
  })

  // Clic sur la notification → focus sur l'onglet
 notification.onclick = () => {
  window.focus()
  if (window.__notifChatMissionId) {
    window.location.href = options.url || '/client/missions'
  } else if (options.url) {
    window.location.href = options.url
  }
  notification.close()
}

  // Fermer automatiquement après 5 secondes
  setTimeout(() => notification.close(), 5000)
}

// ── Hook principal ─────────────────────────────────────────
export function useNotifications({ onChatOpen } = {}) {
  const { user } = useAuth()
  const { onEvent } = useSocket() || {}

  // Demander la permission push au montage
  useEffect(() => {
    if (user) {
      requestPushPermission()
    }
  }, [user])

  // Écouter les nouveaux messages via Socket.io
  useEffect(() => {
    if (!onEvent || !user) return
    console.log('🔔 useNotifications actif pour:', user.id)

const unsubAll = onEvent('*', (data) => {
  console.log('📡 Socket event reçu:', data)
})

    // Nouveau message reçu

    const unsubMessage = onEvent('new_message', (msg) => {
  if (msg.sender_id === user.id) return

  const senderName = msg.sender_name || (user.role === 'client' ? 'Votre Œil' : 'Votre client')
  const body = msg.body || msg.content?.slice(0, 60) || ''

  toast(`💬 ${senderName} — ${body}`, 'info')

  if (onChatOpen) {
    window.__notifChatMissionId = msg.mission_id
  }

  sendPushNotification(
    `💬 ${senderName}`,
    body,
    { tag: `message-${msg.mission_id}`, url: '/client/missions' }
  )
})

// Écouter les notifications directes (message reçu hors chat ouvert)
const unsubNotif = onEvent('notification', (notif) => {
  
  if (notif.type === 'message' || notif.title === 'Nouveau message' || notif.title === '📸 Médias reçus') {
    toast(`💬 ${notif.body}`, 'info')

    sendPushNotification(
      notif.title || 'Nouveau message',
      notif.body || '',
      { tag: `notif-${notif.missionId}`, url: '/client/missions' }
    )

    if (notif.missionId) {
      window.__notifChatMissionId = notif.missionId
    }
  }
})



    // Nouvelle mission disponible (pour les Œils)
    const unsubMission = onEvent('new_mission', (mission) => {
      if (user.role !== 'oeil') return

      toast(`🎯 Nouvelle mission : ${mission.title} — ${mission.city}`, 'info')

      sendPushNotification(
        '🎯 Nouvelle mission disponible',
        `${mission.title} — ${mission.city} · ${mission.price} MAD`,
        { tag: `mission-${mission.id}`, url: '/oeil/missions', urgent: mission.is_urgent }
      )
    })

    // Mission acceptée (pour le client)
    const unsubAccepted = onEvent('mission_accepted', (data) => {
      if (user.role !== 'client') return

      toast(`👁️ Votre Œil a accepté la mission : ${data.mission_title}`, 'success')

      sendPushNotification(
        '👁️ Œil assigné !',
        `${data.oeil_name} a accepté votre mission "${data.mission_title}"`,
        { tag: `accepted-${data.mission_id}`, url: '/client/missions' }
      )
    })

    // Mission terminée
    const unsubCompleted = onEvent('mission_completed', (data) => {
      if (user.role !== 'client') return

      toast(`✅ Mission terminée : ${data.mission_title}`, 'success')

      sendPushNotification(
        '✅ Mission terminée !',
        `"${data.mission_title}" a été complétée. Notez votre Œil.`,
        { tag: `completed-${data.mission_id}`, url: '/client/missions' }
      )
    })

    return () => {
      unsubMessage?.()
      unsubMission?.()
      unsubAccepted?.()
      unsubCompleted?.()
      unsubNotif?.()
      unsubAll?.()
    }
  }, [onEvent, user])
}
