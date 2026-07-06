import { useTranslation } from 'react-i18next'

export default function LanguageToggle({ className = '' }) {
  const { i18n } = useTranslation()
  const isAr = i18n.language === 'ar'

  return (
    <div className={`inline-flex items-center bg-[#181818] border border-white/12 rounded-full p-1 gap-0.5 ${className}`}>
      <button
        type="button"
        onClick={() => i18n.changeLanguage('fr')}
        className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
          !isAr ? 'bg-[#FF4D00] text-white' : 'text-[#AAA] hover:text-white'
        }`}
      >
        FR
      </button>
      <button
        type="button"
        onClick={() => i18n.changeLanguage('ar')}
        className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
          isAr ? 'bg-[#FF4D00] text-white' : 'text-[#AAA] hover:text-white'
        }`}
      >
        AR
      </button>
    </div>
  )
}
