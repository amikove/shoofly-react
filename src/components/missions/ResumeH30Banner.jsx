import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { missionsAPI } from '../../api'
import { toast } from '../ui'
import { useAuth } from '../../context/AuthContext'

// Bannière globale (montée une fois dans AppLayout, même pattern que PresenceConfirmationBanner /
// ClientDisabledBanner) — visible dès qu'un Œil a une mission transférée automatiquement à H+30
// pour non-démarrage (FE-1, audit-360, 2026-08-21) qu'il peut encore reprendre : POST
// /:id/resume-after-h30 existait déjà côté backend (Prompt A) mais n'était appelé nulle part.
// GET /pending-h30-resume (missions.js, ajouté pour ce chantier) est la seule source qui expose
// transferred_from/transfer_h30_no_show à CET Œil précis — voir le rapport de session pour le
// détail de la garde canSeeChat qui les masque partout ailleurs une fois oeil_id repassé à NULL.
// Un item disparaît de lui-même de cette liste dès qu'un remplaçant est confirmé (status quitte
// 'pending') : pas de logique supplémentaire nécessaire pour la garde "encore possible".
export default function ResumeH30Banner() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [pending, setPending] = useState([])
  const [index, setIndex]     = useState(0)
  const [resuming, setResuming] = useState(false)

  const fetchPending = useCallback(() => {
    missionsAPI.pendingH30Resume()
      .then(({ data }) => setPending(data.pending_h30_resume || []))
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

  const resume = async () => {
    setResuming(true)
    try {
      await missionsAPI.resumeAfterH30(current.id)
      setPending((list) => list.filter((m) => m.id !== current.id))
      setIndex(0)
      toast(t('resumeH30Banner.resumedToast'), 'success')
    } catch (err) {
      toast(err.response?.data?.error || t('resumeH30Banner.errorToast'), 'error')
    } finally {
      setResuming(false)
    }
  }

  return (
    // Positionnement (fixed / top / z-index) et empilement avec les bannières sœurs gérés par le
    // conteneur commun dans AppLayout ; les bannières masquées ne consomment aucun espace, donc
    // plus de `top` décalé à la main ni de delta constant à maintenir entre les bannières.
    <div className="w-full flex justify-center pointer-events-none">
      <div className="pointer-events-auto w-full max-w-md bg-[#181818] border border-[#FF4D00]/40 rounded-2xl p-4 shadow-[0_16px_40px_rgba(0,0,0,0.5)] flex gap-3">
        <div className="text-2xl flex-shrink-0">🔁</div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium leading-relaxed break-words">
            {t('resumeH30Banner.text', { missionTitle: current.title })}
          </div>
          <div className="flex items-center gap-3 mt-3">
            <button onClick={resume} disabled={resuming} className="btn btn-primary btn-sm disabled:opacity-60">
              {resuming ? t('resumeH30Banner.resuming') : t('resumeH30Banner.resumeButton')}
            </button>
            {pending.length > 1 && (
              <div className="flex items-center gap-1.5 text-xs text-[#AAA]">
                <button
                  type="button"
                  onClick={() => setIndex((i) => (i - 1 + pending.length) % pending.length)}
                  aria-label={t('resumeH30Banner.previous')}
                  className="w-5 h-5 flex items-center justify-center rounded border border-white/12 hover:border-white/22 hover:text-white"
                >‹</button>
                <span>{t('resumeH30Banner.counter', { current: safeIndex + 1, total: pending.length })}</span>
                <button
                  type="button"
                  onClick={() => setIndex((i) => (i + 1) % pending.length)}
                  aria-label={t('resumeH30Banner.next')}
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
