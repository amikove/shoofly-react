import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { missionsAPI } from '../../api'
import { toast } from '../ui'
import { useAuth } from '../../context/AuthContext'

// Bannière globale (montée une fois dans AppLayout, même pattern que PresenceConfirmationBanner) —
// visible sur toute la plateforme dès qu'un Œil a au moins une mission active dont le client vient
// d'être désactivé (PROMPT 6, 2026-08-18). L'Œil devient décisionnaire : honorer (rien ne change,
// juste un acquittement côté backend) ou annuler (sans aucune pénalité).
export default function ClientDisabledBanner() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [pending, setPending] = useState([])
  const [index, setIndex]     = useState(0)
  const [busy, setBusy]       = useState(null) // 'honor' | 'cancel' | null

  const fetchPending = useCallback(() => {
    missionsAPI.pendingClientDisabled()
      .then(({ data }) => setPending(data.pending_client_disabled || []))
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

  const honor = async () => {
    setBusy('honor')
    try {
      await missionsAPI.clientDisabledDecision(current.id, 'honor')
      setPending((list) => list.filter((m) => m.id !== current.id))
      setIndex(0)
      toast(t('clientDisabledBanner.honorToast'), 'success')
    } catch (err) {
      toast(err.response?.data?.error || t('clientDisabledBanner.errorToast'), 'error')
    } finally {
      setBusy(null)
    }
  }

  const cancel = async () => {
    if (!window.confirm(t('clientDisabledBanner.cancelConfirmPrompt', { missionTitle: current.title }))) return
    setBusy('cancel')
    try {
      await missionsAPI.clientDisabledDecision(current.id, 'cancel')
      setPending((list) => list.filter((m) => m.id !== current.id))
      setIndex(0)
      toast(t('clientDisabledBanner.cancelToast'), 'info')
    } catch (err) {
      toast(err.response?.data?.error || t('clientDisabledBanner.errorToast'), 'error')
    } finally {
      setBusy(null)
    }
  }

  return (
    // Positionnement (fixed / top / z-index) et empilement avec les bannières sœurs gérés par le
    // conteneur commun dans AppLayout ; celles qui rendent `null` ne prennent aucune place, donc
    // plus besoin d'un `top` décalé à la main pour éviter le chevauchement.
    <div className="w-full flex justify-center pointer-events-none">
      <div className="pointer-events-auto w-full max-w-md bg-[#181818] border border-red-500/40 rounded-2xl p-4 shadow-[0_16px_40px_rgba(0,0,0,0.5)] flex gap-3">
        <div className="text-2xl flex-shrink-0">⚠️</div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium leading-relaxed break-words">
            {t('clientDisabledBanner.text', { missionTitle: current.title })}
          </div>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <button onClick={honor} disabled={!!busy} className="btn btn-primary btn-sm disabled:opacity-60">
              {busy === 'honor' ? t('clientDisabledBanner.honorConfirming') : t('clientDisabledBanner.honorButton')}
            </button>
            <button onClick={cancel} disabled={!!busy} className="btn btn-ghost btn-sm text-red-400 disabled:opacity-60">
              {busy === 'cancel' ? t('clientDisabledBanner.cancelConfirming') : t('clientDisabledBanner.cancelButton')}
            </button>
            {pending.length > 1 && (
              <div className="flex items-center gap-1.5 text-xs text-[#AAA] ms-auto">
                <button
                  type="button"
                  onClick={() => setIndex((i) => (i - 1 + pending.length) % pending.length)}
                  aria-label={t('clientDisabledBanner.previous')}
                  className="w-5 h-5 flex items-center justify-center rounded border border-white/12 hover:border-white/22 hover:text-white"
                >‹</button>
                <span>{t('clientDisabledBanner.counter', { current: safeIndex + 1, total: pending.length })}</span>
                <button
                  type="button"
                  onClick={() => setIndex((i) => (i + 1) % pending.length)}
                  aria-label={t('clientDisabledBanner.next')}
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
