import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { requestPushPermission } from '../../hooks/useNotifications'

// Bannière qui demande la permission push si pas encore accordée
export default function NotificationBanner() {
  const { t } = useTranslation()
  const [show, setShow]       = useState(false)
  const [granted, setGranted] = useState(false)

  useEffect(() => {
    if (!('Notification' in window)) return
    if (Notification.permission === 'default') {
      // Attendre 3 secondes avant d'afficher
      const timer = setTimeout(() => setShow(true), 3000)
      return () => clearTimeout(timer)
    }
    if (Notification.permission === 'granted') setGranted(true)
  }, [])

  const allow = async () => {
    const ok = await requestPushPermission()
    setGranted(ok)
    setShow(false)
  }

  if (!show || granted) return null

  return (
    <div className="fixed bottom-6 start-6 z-50 max-w-sm">
      <div className="bg-[#181818] border border-white/20 rounded-2xl p-4 shadow-[0_16px_40px_rgba(0,0,0,0.5)] flex gap-3">
        <div className="text-2xl flex-shrink-0">🔔</div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm mb-0.5 break-words">{t('notificationBanner.title')}</div>
          <div className="text-xs text-[#AAA] mb-3 leading-relaxed break-words">
            {t('notificationBanner.desc')}
          </div>
          <div className="flex gap-2">
            <button
              onClick={allow}
              className="btn btn-primary btn-sm"
            >
              {t('notificationBanner.allow')}
            </button>
            <button
              onClick={() => setShow(false)}
              className="btn btn-ghost btn-sm"
            >
              {t('notificationBanner.later')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
