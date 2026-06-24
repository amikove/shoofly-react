import { useState, useEffect } from 'react'
import { usersAPI } from '../../api'
import { Modal, Avatar, Stars, Spinner, Badge } from '../ui'

export default function OeilProfileModal({ oeil, onClose, onCommander }) {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!oeil?.id) return
    setLoading(true)
    usersAPI.oeil(oeil.id)
      .then(({ data }) => setData(data))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [oeil?.id])

  if (!oeil) return null

  const profile = data?.oeil || oeil
  const reviews = data?.reviews || []

  return (
    <Modal
      open={!!oeil}
      onClose={onClose}
      title={`${profile.first_name} ${profile.last_name}`}
      subtitle={`📍 ${profile.city || '—'} · ${profile.total_missions || 0} missions`}
      size="md"
    >
      {loading ? (
        <div className="flex justify-center py-10">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="space-y-5">

          {/* En-tête profil */}
          <div className="flex items-center gap-4">
            <Avatar name={`${profile.first_name} ${profile.last_name}`} size={60} />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Stars value={profile.rating_avg || 0} />
                <span className="text-sm font-semibold text-yellow-400">
                  {profile.rating_avg || '—'}
                </span>
                <span className="text-xs text-[#AAA]">
                  ({profile.rating_count || 0} avis)
                </span>
              </div>
              {profile.is_available
                ? <Badge variant="green">Disponible</Badge>
                : <Badge variant="gray">Indisponible</Badge>
              }
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <div>
              <p className="text-xs text-[#AAA] uppercase tracking-wider font-semibold mb-1">Bio</p>
              <p className="text-sm text-white/80 leading-relaxed">{profile.bio}</p>
            </div>
          )}

          {/* Zone de couverture */}
          {profile.coverage_zone && (
            <div>
              <p className="text-xs text-[#AAA] uppercase tracking-wider font-semibold mb-1">Zone couverte</p>
              <p className="text-sm text-white/80">🗺️ {profile.coverage_zone}</p>
            </div>
          )}

          {/* Avis clients */}
          <div>
            <p className="text-xs text-[#AAA] uppercase tracking-wider font-semibold mb-3">
              Avis clients {reviews.length > 0 && `(${reviews.length})`}
            </p>

            {reviews.length === 0 ? (
              <p className="text-xs text-[#555] text-center py-4">Aucun avis pour le moment</p>
            ) : (
              <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
                {reviews.map((r, i) => (
                  <div key={i} className="bg-white/5 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <Stars value={r.score} />
                        <span className="text-xs font-semibold text-yellow-400">{r.score}/5</span>
                      </div>
                      <span className="text-[11px] text-[#555]">
                        {new Date(r.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </span>
                    </div>
                    {r.comment ? (
                      <p className="text-xs text-white/70 leading-relaxed">"{r.comment}"</p>
                    ) : (
                      <p className="text-xs text-[#555] italic">Aucun commentaire</p>
                    )}
                    <p className="text-[11px] text-[#AAA] mt-1.5">— {r.client_name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={() => { onCommander(profile); onClose() }}
              disabled={!profile.is_available}
              className="btn btn-primary btn-lg flex-1 justify-center disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {profile.is_available ? 'Commander cet Œil →' : 'Indisponible'}
            </button>
            <button onClick={onClose} className="btn btn-ghost btn-lg">
              Fermer
            </button>
          </div>

        </div>
      )}
    </Modal>
  )
}
