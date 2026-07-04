import { useState } from 'react'
import { missionsAPI } from '../../api'
import { toast } from '../ui'

export default function RateModal({ mission, onClose, onRated }) {
  const [rating, setRating]   = useState(mission?.existing_rating?.score || 5)
  const [comment, setComment] = useState(mission?.existing_rating?.comment || '')
  const [loading, setLoading] = useState(false)
  const [hover, setHover]     = useState(0)
  const alreadyRated = !!mission?.existing_rating

  // Notes plateforme (NPS) — distinctes de la note de l'Œil
  const [npsFacilite, setNpsFacilite] = useState(0)
  const [npsReactivite, setNpsReactivite] = useState(0)
  const [npsUtilite, setNpsUtilite] = useState(0)
  const [npsRecommandation, setNpsRecommandation] = useState(0)
  const [platformComment, setPlatformComment] = useState('')
  const [hoverNps, setHoverNps] = useState({ key: null, value: 0 })

  const labels = {
    1: 'Décevant',
    2: 'Passable',
    3: 'Correct',
    4: 'Bien',
    5: 'Excellent !',
  }

  const submit = async () => {
    setLoading(true)
    try {
      await missionsAPI.rate(mission.id, {
        score: rating,
        comment,
        nps_facilite: npsFacilite || undefined,
        nps_reactivite: npsReactivite || undefined,
        nps_utilite: npsUtilite || undefined,
        nps_recommandation: npsRecommandation || undefined,
        platform_comment: platformComment || undefined,
      })
      toast(`Note ${rating}/5 envoyée ⭐ Merci !`, 'success')
      onRated?.()
      onClose()
    } catch (err) {
      toast(err.response?.data?.error || 'Erreur lors de la notation', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (!mission) return null

  return (
    <div
      className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#181818] border border-white/20 rounded-2xl p-6 w-full max-w-md shadow-[0_24px_60px_rgba(0,0,0,0.6)]">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="font-display font-bold text-base">Noter votre Œil</h2>
            <p className="text-xs text-[#AAA] mt-0.5">
              {mission.title} — Œil : {mission.oeil_name || '—'}
            </p>
          </div>
          <button onClick={onClose} className="text-[#AAA] hover:text-white text-lg">✕</button>
        </div>

        {/* Stars */}
        <div className="text-center py-4">
          <p className="text-sm text-[#AAA] mb-4">Comment s'est passée votre mission ?</p>
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
          <div className="text-lg font-bold text-yellow-400">
            {rating} — {labels[rating]}
          </div>
        </div>

        {/* Comment */}
        <div className="mb-5">
          <label className="label">Commentaire (optionnel)</label>
          <textarea
            className="input resize-none h-20"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Décrivez votre expérience..."
          />
        </div>

        {/* Séparation claire entre les 2 évaluations */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-white/10" />
          <p className="text-[11px] text-[#777] uppercase tracking-wider whitespace-nowrap">Et maintenant, votre avis sur Shoofly</p>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* NPS plateforme */}
        <div className="space-y-4 mb-5">
          {[
            { key: 'facilite', label: 'Facilité d\'utilisation', value: npsFacilite, setValue: setNpsFacilite },
            { key: 'reactivite', label: 'Réactivité du service', value: npsReactivite, setValue: setNpsReactivite },
            { key: 'utilite', label: 'Utilité du service', value: npsUtilite, setValue: setNpsUtilite },
            { key: 'recommandation', label: 'Recommanderiez-vous Shoofly ?', value: npsRecommandation, setValue: setNpsRecommandation },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between gap-3">
              <p className="text-xs text-[#AAA]">{item.label}</p>
              <div className="flex gap-1 flex-shrink-0">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => item.setValue(n)}
                    onMouseEnter={() => setHoverNps({ key: item.key, value: n })}
                    onMouseLeave={() => setHoverNps({ key: null, value: 0 })}
                    className={`text-lg transition-all duration-100 hover:scale-110 ${
                      n <= (hoverNps.key === item.key ? hoverNps.value : item.value) ? 'text-yellow-400' : 'text-white/20'
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Commentaire plateforme (optionnel) */}
        <div className="mb-5">
          <label className="label">Un commentaire sur Shoofly ? (optionnel)</label>
          <textarea
            className="input resize-none h-16"
            value={platformComment}
            onChange={(e) => setPlatformComment(e.target.value)}
            placeholder="Votre avis nous aide à nous améliorer..."
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={submit}
            disabled={loading}
            className="btn btn-primary btn-lg flex-1 justify-center disabled:opacity-60"
          >
            {loading ? 'Envoi...' : 'Envoyer ma note →'}
          </button>
          <button onClick={onClose} className="btn btn-ghost btn-lg">
            Annuler
          </button>
        </div>
      </div>
    </div>
  )
}
