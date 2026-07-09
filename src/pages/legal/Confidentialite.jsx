import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function Confidentialite() {
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
        <h1 className="font-display font-bold text-3xl mb-2">{t('legal.confidentialite.pageTitle')}</h1>
        <p className="text-[#AAA] text-sm mb-10">{t('legal.confidentialite.lastUpdated')}</p>

        <div className="space-y-8 text-[#CCC] text-sm leading-relaxed">

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">{t('legal.confidentialite.section1.title')}</h2>
            <p>{t('legal.confidentialite.section1.body')}</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">{t('legal.confidentialite.section2.title')}</h2>
            <p className="mb-3">{t('legal.confidentialite.section2.intro')}</p>
            <ul className="space-y-2">
              {t('legal.confidentialite.section2.items', { returnObjects: true }).map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#FF4D00] mt-0.5">→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">{t('legal.confidentialite.section3.title')}</h2>
            <p className="mb-3">{t('legal.confidentialite.section3.intro')}</p>
            <ul className="space-y-2">
              {t('legal.confidentialite.section3.items', { returnObjects: true }).map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#FF4D00] mt-0.5">→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">{t('legal.confidentialite.section4.title')}</h2>
            <p>{t('legal.confidentialite.section4.body')}</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">{t('legal.confidentialite.section5.title')}</h2>
            <ul className="space-y-2">
              {t('legal.confidentialite.section5.items', { returnObjects: true }).map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#FF4D00] mt-0.5">→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">{t('legal.confidentialite.section6.title')}</h2>
            <p className="mb-3">{t('legal.confidentialite.section6.intro')}</p>
            <ul className="space-y-2">
              {t('legal.confidentialite.section6.items', { returnObjects: true }).map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#FF4D00] mt-0.5">→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3">{t('legal.confidentialite.section6.outro')}</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">{t('legal.confidentialite.section7.title')}</h2>
            <p className="mb-3">{t('legal.confidentialite.section7.intro')}</p>
            <ul className="space-y-2">
              {t('legal.confidentialite.section7.items', { returnObjects: true }).map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#FF4D00] mt-0.5">→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3">{t('legal.confidentialite.section7.contact')} <strong className="text-white">privacy@shoofly.ma</strong></p>
            <p className="mt-2">{t('legal.confidentialite.section7.cndp')} <strong className="text-white">CNDP</strong> {t('legal.confidentialite.section7.cndpFull')}</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">{t('legal.confidentialite.section8.title')}</h2>
            <p>{t('legal.confidentialite.section8.body')}</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">{t('legal.confidentialite.section9.title')}</h2>
            <p className="mb-3">{t('legal.confidentialite.section9.intro')}</p>
            <ul className="space-y-2">
              {t('legal.confidentialite.section9.items', { returnObjects: true }).map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#FF4D00] mt-0.5">→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3">{t('legal.confidentialite.section9.outro')}</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">{t('legal.confidentialite.section10.title')}</h2>
            <p>{t('legal.confidentialite.section10.intro')} <strong className="text-white">privacy@shoofly.ma</strong><br />{t('legal.confidentialite.section10.address')}</p>
          </section>

        </div>
      </div>
    </div>
  )
}
