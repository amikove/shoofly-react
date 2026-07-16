import { useTranslation } from 'react-i18next'

export default function MissionCreatedModal({ onWhatsApp, onClose }) {
  const { t } = useTranslation()
  return (
    <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-[#181818] border border-green-500/30 rounded-2xl p-6 w-full max-w-md shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-xl flex-shrink-0">
            ✅
          </div>
          <h2 className="font-bold text-base">{t('missionCreatedModal.title')}</h2>
        </div>
        <p className="text-sm text-white/80 leading-relaxed mb-5">
          {t('missionCreatedModal.description')}
        </p>
        <div className="flex flex-col gap-2">
          <button onClick={onWhatsApp} className="btn btn-primary w-full justify-center">
            {t('missionCreatedModal.whatsappButton')}
          </button>
          <button onClick={onClose} className="btn btn-ghost w-full justify-center">
            {t('missionCreatedModal.laterButton')}
          </button>
        </div>
      </div>
    </div>
  )
}