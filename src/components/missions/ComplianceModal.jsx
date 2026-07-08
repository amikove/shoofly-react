import { useTranslation } from 'react-i18next'

export default function ComplianceModal({ onAccept }) {
  const { t } = useTranslation()
  return (
    <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-[#181818] border border-orange-500/30 rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[85vh] overflow-y-auto">

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-xl flex-shrink-0">
            📋
          </div>
          <h2 className="font-bold text-base">{t('complianceModalOeil.title')}</h2>
        </div>

        {/* Rappels mission */}
        <div className="space-y-2 mb-4">
          <div className="flex items-start gap-3 bg-[#222] rounded-xl p-3">
            <span className="text-xl flex-shrink-0">📸</span>
            <div>
              <p className="text-sm font-semibold text-white">{t('complianceModalOeil.photos.title')}</p>
              <p className="text-xs text-[#AAA] mt-0.5">{t('complianceModalOeil.photos.desc')}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 bg-[#222] rounded-xl p-3">
            <span className="text-xl flex-shrink-0">📍</span>
            <div>
              <p className="text-sm font-semibold text-white">{t('complianceModalOeil.location.title')}</p>
              <p className="text-xs text-[#AAA] mt-0.5">{t('complianceModalOeil.location.desc')}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 bg-[#222] rounded-xl p-3">
            <span className="text-xl flex-shrink-0">⏱️</span>
            <div>
              <p className="text-sm font-semibold text-white">{t('complianceModalOeil.deadlines.title')}</p>
              <p className="text-xs text-[#AAA] mt-0.5">{t('complianceModalOeil.deadlines.desc')}</p>
            </div>
          </div>
        </div>

        {/* Règle anti-contact */}
        <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-4 mb-4">
          <p className="text-xs text-white/80 leading-relaxed">
            🚫 {t('complianceModalOeil.antiContactPrefix')} <strong className="text-white">SHOOFLY</strong>. {t('complianceModalOeil.antiContactMiddle')} <strong className="text-orange-400">{t('complianceModalOeil.antiContactStrong')}</strong> {t('complianceModalOeil.antiContactSuffix')}
          </p>
        </div>

        <div className="flex items-start gap-2 mb-5">
          <span className="text-green-400 mt-0.5">✓</span>
          <p className="text-xs text-[#AAA] leading-relaxed">
            {t('complianceModalOeil.acceptNotice')}
          </p>
        </div>

        <button
          onClick={onAccept}
          className="btn btn-primary w-full justify-center"
        >
          {t('complianceModalOeil.continueButton')}
        </button>
      </div>
    </div>
  )
}
