import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { missionsAPI } from '../../api'
import { toast } from '../ui'
import { useAuth } from '../../context/AuthContext'

const CASABLANCA_TZ = 'Africa/Casablanca'

function casablancaYMD(date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: CASABLANCA_TZ, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date)
  const get = (type) => parts.find((p) => p.type === type)?.value
  return `${get('year')}-${get('month')}-${get('day')}`
}

function dayLabel(scheduledAt, t) {
  const missionYMD  = casablancaYMD(new Date(scheduledAt))
  const todayYMD     = casablancaYMD(new Date())
  const tomorrowYMD  = casablancaYMD(new Date(Date.now() + 24 * 3600 * 1000))
  if (missionYMD === todayYMD) return t('presenceConfirmation.today')
  if (missionYMD === tomorrowYMD) return t('presenceConfirmation.tomorrow')
  return new Date(scheduledAt).toLocaleDateString('fr-FR', { timeZone: CASABLANCA_TZ, day: 'numeric', month: 'long' })
}

function timeLabel(scheduledAt) {
  return new Date(scheduledAt).toLocaleTimeString('fr-FR', { timeZone: CASABLANCA_TZ, hour: '2-digit', minute: '2-digit' })
}

// Bannière globale (montée une fois dans AppLayout) — visible sur toute la plateforme dès
// qu'un Œil a au moins une confirmation de présence en attente (J-1 20h ou H-2 même jour).
export default function PresenceConfirmationBanner() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [pending, setPending] = useState([])
  const [index, setIndex]     = useState(0)
  const [confirming, setConfirming] = useState(false)

  const fetchPending = useCallback(() => {
    missionsAPI.pendingConfirmations()
      .then(({ data }) => setPending(data.pending_confirmations || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (user?.role !== 'oeil') return
    fetchPending()
    const interval = setInterval(fetchPending, 60000)
    return () => clearInterval(interval)
  }, [user, fetchPending])

  if (user?.role !== 'oeil' || pending.length === 0) return null

  const safeIndex = Math.min(index, pending.length - 1)
  const current = pending[safeIndex]
  const clientName = `${current.client_first_name} ${current.client_last_name}`.trim()

  const confirm = async () => {
    setConfirming(true)
    try {
      await missionsAPI.confirmPresence(current.id)
      setPending((list) => list.filter((m) => m.id !== current.id))
      setIndex(0)
      toast(t('presenceConfirmation.confirmedToast'), 'success')
    } catch (err) {
      toast(err.response?.data?.error || t('presenceConfirmation.errorToast'), 'error')
    } finally {
      setConfirming(false)
    }
  }

  return (
    <div className="fixed top-[64px] md:top-4 inset-x-0 z-[70] flex justify-center px-4 pointer-events-none">
      <div className="pointer-events-auto w-full max-w-md bg-[#181818] border border-[#FF4D00]/40 rounded-2xl p-4 shadow-[0_16px_40px_rgba(0,0,0,0.5)] flex gap-3">
        <div className="text-2xl flex-shrink-0">⏰</div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium leading-relaxed break-words">
            {t('presenceConfirmation.text', {
              clientName,
              day: dayLabel(current.scheduled_at, t),
              time: timeLabel(current.scheduled_at),
            })}
          </div>
          <div className="flex items-center gap-3 mt-3">
            <button onClick={confirm} disabled={confirming} className="btn btn-primary btn-sm disabled:opacity-60">
              {confirming ? t('presenceConfirmation.confirming') : t('presenceConfirmation.confirmButton')}
            </button>
            {pending.length > 1 && (
              <div className="flex items-center gap-1.5 text-xs text-[#AAA]">
                <button
                  type="button"
                  onClick={() => setIndex((i) => (i - 1 + pending.length) % pending.length)}
                  aria-label={t('presenceConfirmation.previous')}
                  className="w-5 h-5 flex items-center justify-center rounded border border-white/12 hover:border-white/22 hover:text-white"
                >‹</button>
                <span>{t('presenceConfirmation.counter', { current: safeIndex + 1, total: pending.length })}</span>
                <button
                  type="button"
                  onClick={() => setIndex((i) => (i + 1) % pending.length)}
                  aria-label={t('presenceConfirmation.next')}
                  className="w-5 h-5 flex items-center justify-center rounded border border-white/12 hover:border-white/22 hover:text-white"
                >›</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
