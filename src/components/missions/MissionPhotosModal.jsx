import { useTranslation } from 'react-i18next'
import PhotoUploadField from './PhotoUploadField'

// PROMPT 4 (2026-08-18) — point d'entrée "📸 Photos" (jusqu'ici sans action) sur la carte
// mission, et destination de repli quand advance() bloque une clôture faute de photo.
export default function MissionPhotosModal({ mission, onClose }) {
  const { t } = useTranslation()

  return (
    <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-[#181818] border border-white/12 rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-bold text-base">{t('oeilMissions.photosModal.title')}</h2>
          <button onClick={onClose} className="text-[#AAA] hover:text-white text-xl leading-none">✕</button>
        </div>
        <p className="text-xs text-[#AAA] mb-4">{t('oeilMissions.photosModal.subtitle')}</p>

        <PhotoUploadField missionId={mission.id} minRequired={1} />

        <button onClick={onClose} className="btn btn-ghost w-full justify-center mt-5">
          {t('oeilMissions.photosModal.close')}
        </button>
      </div>
    </div>
  )
}
