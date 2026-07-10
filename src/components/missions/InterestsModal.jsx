import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import OeilProfileModal from './OeilProfileModal'
import { missionsAPI } from '../../api'
import { Spinner, toast, Avatar } from '../ui'
import { translateLocation } from '../../constants/villesTranslations'

export default function InterestsModal({ mission, onClose, onHired }) {
  const { t, i18n } = useTranslation()
  const [interests, setInterests] = useState([])
  const [loading, setLoading]     = useState(true)
  const [hiring, setHiring]       = useState(null)
  const [hired, setHired]         = useState(false)
  const [profileOeil, setProfileOeil] = useState(null)

  useEffect(() => {
    missionsAPI.interests(mission.id)
      .then(({ data }) => setInterests(data.interests || []))
      .catch(() => toast(t('interestsModal.errorLoading'), 'error'))
      .finally(() => setLoading(false))
  }, [mission.id])

  const hire = async (oeilId) => {
    if (hired) return
    setHiring(oeilId)
    try {
      await missionsAPI.hire(mission.id, oeilId)
      setHired(true)
      toast(t('interestsModal.hiredToast'), 'success')
      onClose()
      setTimeout(() => onHired(), 300)
    } catch (err) {
      toast(err.response?.data?.error || t('interestsModal.genericError'), 'error')
    } finally { setHiring(null) }
  }

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
         onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-[#181818] border border-white/20 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="font-bold text-base">{t('interestsModal.title')}</h2>
            <p className="text-xs text-[#AAA] mt-0.5">{mission.title}</p>
          </div>
          <button onClick={onClose} className="text-[#AAA] hover:text-white text-lg">✕</button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Spinner size="lg" /></div>
        ) : interests.length === 0 ? (
          <div className="text-center py-10 text-[#AAA]">
            <div className="text-4xl mb-3 opacity-30">👁️</div>
            <p className="text-sm">{t('interestsModal.emptyTitle')}</p>
            <p className="text-xs mt-1">{t('interestsModal.emptyDesc')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {interests.map((o) => (
              <div key={o.id} className="bg-[#222] rounded-xl p-4 flex items-start gap-3 cursor-pointer hover:bg-[#282828] transition-colors" onClick={() => setProfileOeil(o)}>
                  <Avatar name={`${o.first_name} ${o.last_name}`} size={40} src={o.avatar_url} />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{o.first_name} {o.last_name}</div>
                  <div className="text-xs text-[#AAA] flex gap-3 mt-0.5 flex-wrap">
                    <span>📍 {o.city ? translateLocation(o.city, i18n.language) : '—'}</span>
                    <span>{t('interestsModal.ratingReviews', { rating: o.rating_avg || '0', count: o.rating_count || 0 })}</span>
                    <span>{t('interestsModal.missionsCount', { count: o.total_missions || 0 })}</span>
                  </div>
                  {o.bio && <p className="text-xs text-[#777] mt-1 line-clamp-2">{o.bio}</p>}
                  {o.message && (
                    <div className="mt-2 bg-[#2A2A2A] rounded-lg px-3 py-2 text-xs text-[#AAA] italic">
                      "{o.message}"
                    </div>
                  )}
                </div>
                <button
                    onClick={(e) => { e.stopPropagation(); hire(o.id) }}
                    disabled={hiring === o.id || hired}
                    className="btn btn-primary btn-sm flex-shrink-0 disabled:opacity-50"
                  >
                  {hiring === o.id ? t('interestsModal.hiring') : hired ? '✓' : t('interestsModal.hire')}
                </button>
              </div>
           ))}
          </div>
        )}
      </div>
      <OeilProfileModal oeil={profileOeil} onClose={() => setProfileOeil(null)} />
    </div>
  )
}