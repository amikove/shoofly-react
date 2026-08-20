import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { missionsAPI } from '../../api'
import { toast } from '../ui'

// PROMPT 2 point 5 (2026-08-17) — symétrique de RateModal.jsx (client note l'Œil), volontairement
// plus simple : pas de section NPS plateforme (spécifique à l'expérience client, sans équivalent
// côté Œil notant un client).
export default function RateClientModal({ mission, onClose, onRated }) {
  const { t } = useTranslation()
  const [rating, setRating]   = useState(5)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [hover, setHover]     = useState(0)

  const submit = async () => {
    setLoading(true)
    try {
      await missionsAPI.rateClient(mission.id, { score: rating, comment: comment || undefined })
      toast(t('rateClientModal.sentToast', { rating }), 'success')
      onRated?.()
      onClose()
    } catch (err) {
      toast(err.response?.data?.error || t('rateClientModal.errorRating'), 'error')
    } finally {
      setLoading(false)
    }
  }

  if (!mission) return null

  return (
    <div
      className="fixed inset-0 bg-black/75 z-[110] flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#181818] border border-white/20 rounded-2xl p-6 w-full max-w-md shadow-[0_24px_60px_rgba(0,0,0,0.6)] max-h-[85vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="font-display font-bold text-base">{t('rateClientModal.title')}</h2>
            <p className="text-xs text-[#AAA] mt-0.5">
              {mission.title} — {mission.client_name || '—'}
            </p>
          </div>
          <button onClick={onClose} aria-label={t('common.close')} className="text-[#AAA] hover:text-white text-lg">✕</button>
        </div>

        <div className="text-center py-4">
          <p className="text-sm text-[#AAA] mb-4">{t('rateClientModal.howWasIt')}</p>
          <div className="flex justify-center gap-2 mb-3">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setRating(n)}
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}
                className={`text-4xl transition-all duration-100 hover:scale-110 ${
                  n <= (hover || rating) ? 'text-yellow-400' : 'text-white/20'
                }`}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <label className="label">{t('rateClientModal.commentLabel')}</label>
          <textarea
            className="input resize-none h-20"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t('rateClientModal.commentPlaceholder')}
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={submit}
            disabled={loading}
            className="btn btn-primary btn-lg flex-1 justify-center disabled:opacity-60"
          >
            {loading ? t('rateClientModal.sending') : t('rateClientModal.submit')}
          </button>
          <button onClick={onClose} className="btn btn-ghost btn-lg">
            {t('rateClientModal.cancel')}
          </button>
        </div>
      </div>
    </div>
  )
}
