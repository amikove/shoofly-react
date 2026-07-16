import { useTranslation } from 'react-i18next'
import MissionHistoryTimeline from './MissionHistoryTimeline'

export default function MissionHistoryModal({ mission, onClose }) {
  const { t } = useTranslation()

  if (!mission) return null

  return (
    <div className="fixed inset-0 bg-black/75 z-[60] flex items-center justify-center p-4 backdrop-blur-sm"
         onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-[#181818] border border-white/20 rounded-2xl p-5 w-full max-w-sm max-h-[80vh] flex flex-col shadow-xl">

        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div>
            <h2 className="font-semibold text-sm">{t('missionHistoryModal.title')}</h2>
            <p className="text-xs text-[#AAA] mt-0.5">{mission.title}</p>
          </div>
          <button onClick={onClose} aria-label={t('common.close')} className="text-[#AAA] hover:text-white text-lg">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <MissionHistoryTimeline missionId={mission.id} />
        </div>

        <button onClick={onClose} className="btn btn-ghost btn-sm mt-4 flex-shrink-0 w-full justify-center">
          {t('missionHistoryModal.close')}
        </button>
      </div>
    </div>
  )
}
