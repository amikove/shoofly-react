import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function CGV() {
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
        <h1 className="font-display font-bold text-3xl mb-2">{t('legal.cgv.pageTitle')}</h1>
        <p className="text-[#AAA] text-sm mb-10">{t('legal.cgv.lastUpdated')}</p>

        <div className="space-y-8 text-[#CCC] text-sm leading-relaxed">

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">{t('legal.cgv.section1.title')}</h2>
            <p>{t('legal.cgv.section1.body')}</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">{t('legal.cgv.section2.title')}</h2>
            <ul className="space-y-2">
              {t('legal.cgv.section2.items', { returnObjects: true }).map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#FF4D00] mt-0.5">→</span>
                  <span dangerouslySetInnerHTML={{__html: item.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')}} />
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">{t('legal.cgv.section3.title')}</h2>
            <p className="mb-3">{t('legal.cgv.section3.intro')}</p>
            <ul className="space-y-2">
              {t('legal.cgv.section3.items', { returnObjects: true }).map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#FF4D00] mt-0.5">→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3">{t('legal.cgv.section3.outro')}</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">{t('legal.cgv.section4.title')}</h2>
            <p className="mb-3">{t('legal.cgv.section4.body1')}</p>
            <p className="mb-3">{t('legal.cgv.section4.body2')}</p>
            <p>{t('legal.cgv.section4.body3')}</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">{t('legal.cgv.section5.title')}</h2>
            <ul className="space-y-2">
              {t('legal.cgv.section5.items', { returnObjects: true }).map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#FF4D00] mt-0.5">→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">{t('legal.cgv.section6.title')}</h2>
            <ul className="space-y-2">
              {t('legal.cgv.section6.items', { returnObjects: true }).map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#FF4D00] mt-0.5">→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">{t('legal.cgv.section7.title')}</h2>
            <ul className="space-y-2">
              {t('legal.cgv.section7.items', { returnObjects: true }).map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#FF4D00] mt-0.5">→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">{t('legal.cgv.section8.title')}</h2>
            <p className="mb-3">{t('legal.cgv.section8.intro')}</p>
            <ul className="space-y-2">
              {t('legal.cgv.section8.items', { returnObjects: true }).map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#FF4D00] mt-0.5">→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">{t('legal.cgv.section9.title')}</h2>
            <ul className="space-y-2">
              {t('legal.cgv.section9.items', { returnObjects: true }).map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#FF4D00] mt-0.5">→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">{t('legal.cgv.section10.title')}</h2>
            <ul className="space-y-2">
              {t('legal.cgv.section10.items', { returnObjects: true }).map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#FF4D00] mt-0.5">→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3">{t('legal.cgv.section10.outro')}</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">{t('legal.cgv.section11.title')}</h2>
            <p>{t('legal.cgv.section11.body')}</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">{t('legal.cgv.section12.title')}</h2>
            <p>{t('legal.cgv.section12.body')}</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">{t('legal.cgv.section13.title')}</h2>
            <p>{t('legal.cgv.section13.body')}</p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3">{t('legal.cgv.section14.title')}</h2>
            <p>{t('legal.cgv.section14.intro')} <strong className="text-white">legal@shoofly.ma</strong><br />{t('legal.cgv.section14.address')}</p>
          </section>

        </div>
      </div>
    </div>
  )
}
