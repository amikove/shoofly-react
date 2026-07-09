import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function MentionsLegales() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      <nav className="flex items-center justify-between px-6 md:px-16 py-5 border-b border-white/10">
        <button onClick={() => navigate('/')} className="font-display font-bold text-xl tracking-tight">
          SHOOF<span className="text-[#FF4D00]">LY</span>
        </button>
      </nav>
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="font-display font-bold text-3xl mb-2">{t('legal.mentionsLegales.pageTitle')}</h1>
        <p className="text-[#AAA] text-sm mb-10">{t('legal.mentionsLegales.lastUpdated')}</p>

        <div className="space-y-8 text-[#CCC] text-sm leading-relaxed">

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">{t('legal.mentionsLegales.section1.title')}</h2>
            <p className="mb-2 text-amber-400 text-xs">{t('legal.mentionsLegales.section1.warning')}</p>
            <ul className="space-y-2">
              {t('legal.mentionsLegales.section1.items', { returnObjects: true }).map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#FF4D00] mt-0.5">→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">{t('legal.mentionsLegales.section2.title')}</h2>
            <ul className="space-y-2">
              {t('legal.mentionsLegales.section2.items', { returnObjects: true }).map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#FF4D00] mt-0.5">→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">{t('legal.mentionsLegales.section3.title')}</h2>
            <p className="mb-2 text-amber-400 text-xs">{t('legal.mentionsLegales.section3.warning')}</p>
            <ul className="space-y-2">
              {t('legal.mentionsLegales.section3.items', { returnObjects: true }).map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#FF4D00] mt-0.5">→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">{t('legal.mentionsLegales.section4.title')}</h2>
            <p>{t('legal.mentionsLegales.section4.body')}</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">{t('legal.mentionsLegales.section5.title')}</h2>
            <p>{t('legal.mentionsLegales.section5.body')} <button onClick={() => navigate('/confidentialite')} className="text-[#FF4D00] hover:underline">{t('legal.mentionsLegales.section5.linkConfidentialite')}</button>.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">{t('legal.mentionsLegales.section6.title')}</h2>
            <p>{t('legal.mentionsLegales.section6.body')} <button onClick={() => navigate('/cgv')} className="text-[#FF4D00] hover:underline">{t('legal.mentionsLegales.section6.linkCgv')}</button>.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">{t('legal.mentionsLegales.section7.title')}</h2>
            <p>{t('legal.mentionsLegales.section7.body')}</p>
          </section>

        </div>
      </div>
    </div>
  )
}
