import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { usersAPI } from '../../api'
import { Modal, Avatar, Stars, Spinner, Badge } from '../ui'
import { translateLocation } from '../../constants/villesTranslations'

export default function OeilProfileModal({ oeil, onClose, onCommander }) {
  const { t, i18n } = useTranslation()
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab]         = useState('profil')

  useEffect(() => {
    if (!oeil?.id) return
    setLoading(true)
    setTab('profil')
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
      subtitle={t('oeilProfileModal.subtitle', { city: profile.city ? translateLocation(profile.city, i18n.language) : '—', count: profile.total_missions || 0 })}
      size="md"
    >
      {loading ? (
        <div className="flex justify-center py-10"><Spinner size="lg" /></div>
      ) : (
        <div>
          {/* En-tête */}
          <div className="flex items-center gap-4 mb-3">
            <Avatar name={`${profile.first_name} ${profile.last_name}`} size={60} src={profile.avatar_url} />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {profile.is_new_oeil ? (
                  <Badge variant="blue">{t('oeilProfileModal.newOeilBadge')}</Badge>
                ) : (
                  <>
                    <Stars value={profile.rating_avg || 0} />
                    <span className="text-sm font-semibold text-yellow-400">{profile.rating_avg || '—'}</span>
                    <span className="text-xs text-[#AAA]">{t('oeilProfileModal.reviewsCount', { count: profile.rating_count || 0 })}</span>
                  </>
                )}
              </div>
              {profile.is_available
                ? <Badge variant="green">{t('oeilProfileModal.available')}</Badge>
                : <Badge variant="gray">{t('oeilProfileModal.unavailable')}</Badge>
              }
            </div>
          </div>

          {/* Score de fiabilité */}
          {profile.is_new_oeil ? (
            <div className="flex items-center gap-2 rounded-xl px-3 py-2 mb-5 bg-blue-500/10 border border-blue-500/20">
              <span className="text-base">🆕</span>
              <p className="text-xs font-semibold text-white">{t('oeilProfileModal.newOeilBadge')}</p>
            </div>
          ) : profile.reliability_score !== undefined && profile.reliability_score !== null && (
            <div className={`flex items-center gap-2 rounded-xl px-3 py-2 mb-5 ${
              profile.reliability_score >= 95 ? 'bg-green-500/10 border border-green-500/20' :
              profile.reliability_score >= 90 ? 'bg-teal-500/10 border border-teal-500/20' :
              profile.reliability_score >= 80 ? 'bg-blue-500/10 border border-blue-500/20' :
              profile.reliability_score >= 70 ? 'bg-amber-500/10 border border-amber-500/20' :
              'bg-red-500/10 border border-red-500/20'
            }`}>
              <span className="text-base">
                {profile.reliability_score >= 95 ? '⭐⭐⭐⭐⭐' :
                 profile.reliability_score >= 90 ? '⭐⭐⭐⭐' :
                 profile.reliability_score >= 80 ? '⭐⭐⭐' :
                 profile.reliability_score >= 70 ? '⭐⭐' : '⭐'}
              </span>
              <div>
                <p className="text-xs font-semibold text-white">{t('oeilProfileModal.reliabilityScore', { score: profile.reliability_score })}</p>
                <p className="text-[10px] text-[#AAA]">
                  {profile.reliability_score >= 95 ? t('oeilProfileModal.reliability.excellent') :
                   profile.reliability_score >= 90 ? t('oeilProfileModal.reliability.veryGood') :
                   profile.reliability_score >= 80 ? t('oeilProfileModal.reliability.good') :
                   profile.reliability_score >= 70 ? t('oeilProfileModal.reliability.watch') : t('oeilProfileModal.reliability.critical')}
                </p>
              </div>
            </div>
          )}

          {/* Onglets */}
          <div className="flex gap-1 bg-[#222] rounded-xl p-1 mb-5">
            <button
              onClick={() => setTab('profil')}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                tab === 'profil' ? 'bg-[#2A2A2A] text-white' : 'text-[#AAA] hover:text-white'
              }`}
            >
              {t('oeilProfileModal.tabs.profil')}
            </button>
            <button
              onClick={() => setTab('avis')}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                tab === 'avis' ? 'bg-[#2A2A2A] text-white' : 'text-[#AAA] hover:text-white'
              }`}
            >
              {t('oeilProfileModal.tabs.avis')} {reviews.length > 0 && (
                <span className="ml-1 bg-[#FF4D00]/20 text-[#FF4D00] px-1.5 py-0.5 rounded-full text-[10px]">
                  {reviews.length}
                </span>
              )}
            </button>
          </div>

          {/* Contenu onglet Profil */}
          {tab === 'profil' && (
            <div className="space-y-4">
              {profile.bio && (
                <div>
                  <p className="text-xs text-[#AAA] uppercase tracking-wider font-semibold mb-1">{t('oeilProfileModal.bio')}</p>
                  <p className="text-sm text-white/80 leading-relaxed">{profile.bio}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#222] rounded-xl p-3 text-center">
                  <div className="text-xl font-bold text-white">{profile.total_missions || 0}</div>
                  <div className="text-xs text-[#AAA] mt-0.5">{t('oeilProfileModal.missions')}</div>
                </div>
                <div className="bg-[#222] rounded-xl p-3 text-center">
                  {profile.is_new_oeil ? (
                    <>
                      <div className="text-xl font-bold text-[#5AA0FF]">🆕</div>
                      <div className="text-xs text-[#AAA] mt-0.5">{t('oeilProfileModal.newOeilBadge')}</div>
                    </>
                  ) : (
                    <>
                      <div className="text-xl font-bold text-yellow-400">{profile.rating_avg || '—'}</div>
                      <div className="text-xs text-[#AAA] mt-0.5">{t('oeilProfileModal.averageRating')}</div>
                    </>
                  )}
                </div>
              </div>
              {!profile.bio && !profile.total_missions && (
                <p className="text-xs text-[#555] text-center py-4">{t('oeilProfileModal.noInfo')}</p>
              )}
            </div>
          )}

          {/* Contenu onglet Avis */}
          {tab === 'avis' && (
            <div>
              {reviews.length === 0 ? (
                <div className="text-center py-8 text-[#AAA]">
                  <div className="text-3xl mb-2 opacity-30">⭐</div>
                  <p className="text-sm">{t('oeilProfileModal.noReviews')}</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {reviews.map((r, i) => (
                    <div key={i} className="bg-[#222] rounded-xl p-3">
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
                      {r.comment
                        ? <p className="text-xs text-white/70 leading-relaxed">"{r.comment}"</p>
                        : <p className="text-xs text-[#555] italic">{t('oeilProfileModal.noComment')}</p>
                      }
                      <p className="text-[11px] text-[#AAA] mt-1.5">— {r.client_name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          {/* Actions */}
          <div className="flex gap-3 pt-5 mt-2 border-t border-white/10">
            {onCommander && (
              <button
                onClick={() => { onCommander(profile); onClose() }}
                disabled={!profile.is_available}
                className="btn btn-primary btn-lg flex-1 justify-center disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {profile.is_available ? t('oeilProfileModal.orderThisOeil') : t('oeilProfileModal.unavailable')}
              </button>
            )}
            <button onClick={onClose} className={`btn btn-ghost btn-lg ${!onCommander ? 'flex-1 justify-center' : ''}`}>{t('oeilProfileModal.close')}</button>
          </div>
        </div>
      )}
    </Modal>
  )
}