import { useTranslation } from 'react-i18next'
import MissionHistoryTimeline from './MissionHistoryTimeline'
import { formatHistoryDate } from '../../utils/missionHistoryFormat'
import { translateLocation } from '../../constants/villesTranslations'

const TYPE_ICONS = { immobilier: '🏠', file_attente: '⏳', audit: '🔎', personnalisee: '🎯' }
const TYPE_LABEL_KEYS = { immobilier: 'immobilier', file_attente: 'fileAttente', audit: 'audit', personnalisee: 'personnalisee' }

function Field({ label, value }) {
  return (
    <div>
      <div className="text-[11px] text-[#AAA] mb-0.5">{label}</div>
      <div className="text-sm text-white whitespace-pre-wrap break-words">{value}</div>
    </div>
  )
}

export default function MissionDetailModal({ mission, onClose }) {
  const { t, i18n } = useTranslation()

  if (!mission) return null

  const cityLabel = translateLocation(mission.city, i18n.language) || '—'
  const quartierLabel = mission.quartier ? translateLocation(mission.quartier, i18n.language) : null
  const addressParts = [quartierLabel, cityLabel, mission.address].filter(Boolean)

  return (
    <div className="fixed inset-0 bg-black/75 z-[60] flex items-center justify-center p-4 backdrop-blur-sm"
         onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-[#181818] border border-white/20 rounded-2xl p-5 w-full max-w-lg max-h-[85vh] flex flex-col shadow-xl">

        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div>
            <h2 className="font-semibold text-sm">{t('missionDetailModal.title')}</h2>
            <p className="text-xs text-[#AAA] mt-0.5">{mission.title}</p>
          </div>
          <button onClick={onClose} aria-label={t('common.close')} className="text-[#AAA] hover:text-white text-lg">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-5">

          {/* Détails de la mission */}
          <div className="bg-[#222] rounded-xl p-4 space-y-3">
            <Field label={t('missionDetailModal.fields.title')} value={mission.title} />

            <Field
              label={t('missionDetailModal.fields.type')}
              value={`${TYPE_ICONS[mission.type] || '📋'} ${t(`clientMissions.filters.${TYPE_LABEL_KEYS[mission.type] || mission.type}`)}`}
            />

            {mission.subcategory && (
              <Field label={t('missionDetailModal.fields.subcategory')} value={mission.subcategory} />
            )}

            <Field label={t('missionDetailModal.fields.address')} value={addressParts.join(', ') || '—'} />

            <Field label={t('missionDetailModal.fields.scheduledAt')} value={formatHistoryDate(mission.scheduled_at) || '—'} />

            <Field
              label={t('missionDetailModal.fields.duration')}
              value={mission.duration_est ? t('missionDetailModal.durationValue', { count: mission.duration_est }) : t('missionDetailModal.notSpecified')}
            />

            <Field
              label={t('missionDetailModal.fields.description')}
              value={mission.description?.trim() ? mission.description : t('missionDetailModal.noDescription')}
            />

            <Field label={t('missionDetailModal.fields.price')} value={`${parseFloat(mission.price).toFixed(0)} MAD`} />
          </div>

          {/* Historique */}
          <div>
            <div className="text-xs text-[#AAA] mb-3">{t('missionDetailModal.historyTitle')}</div>
            <MissionHistoryTimeline missionId={mission.id} />
          </div>
        </div>

        <button onClick={onClose} className="btn btn-ghost btn-sm mt-4 flex-shrink-0 w-full justify-center">
          {t('missionDetailModal.close')}
        </button>
      </div>
    </div>
  )
}
