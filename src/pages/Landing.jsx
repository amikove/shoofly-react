import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { captureAcquisitionParams } from '../utils/acquisitionTracking'
import LanguageToggle from '../components/ui/LanguageToggle'

const MISSIONS = [
  { icon: '🏠', key: 'immobilier' },
  { icon: '⏳', key: 'file' },
  { icon: '🔍', key: 'audit' },
  { icon: '🎯', key: 'custom' },
]

const STEPS = [
  { n: '01', key: 'step1' },
  { n: '02', key: 'step2' },
  { n: '03', key: 'step3' },
]

const WHY = [
  { icon: '✅', key: 'verifiedAgents' },
  { icon: '📡', key: 'realTimeTracking' },
  { icon: '📸', key: 'proofOfExecution' },
  { icon: '⭐', key: 'ratingsReviews' },
  { icon: '📊', key: 'fullReport' },
  { icon: '🔐', key: 'paymentReleased' },
  { icon: '📋', key: 'standardizedReports' },
]

export default function Landing() {
  const { t } = useTranslation()
  useEffect(() => { captureAcquisitionParams() }, [])
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">



      {/* NAV */}
      <nav className="flex items-center justify-between px-6 md:px-16 py-5 border-b border-white/10">
        <div className="font-display font-bold text-xl tracking-tight">
          SHOOF<span className="text-[#FF4D00]">LY</span>
        </div>
        <div className="flex items-center gap-3">
          <LanguageToggle />
          <button onClick={() => navigate('/login')}
            className="text-sm text-[#AAA] hover:text-white transition-colors">
            {t('landing.nav.login')}
          </button>
          <button onClick={() => navigate('/register')}
            className="bg-[#FF4D00] hover:bg-[#e04400] text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
            {t('landing.nav.register')}
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section className="px-6 md:px-16 py-24 md:py-36 max-w-4xl mx-auto text-center">
        <div className="inline-block bg-[#FF4D00]/10 border border-[#FF4D00]/20 text-[#FF4D00] text-xs font-semibold px-4 py-1.5 rounded-full mb-6">
          {t('landing.hero.badge')}
        </div>

            <div className="text-[#AAA] text-sm font-medium tracking-widest uppercase mb-4">
            {t('landing.hero.tagline')}
            </div>
            <h1 className="font-display font-bold text-4xl md:text-5xl leading-tight mb-6">
            {t('landing.hero.title1')}<br />
            <span className="text-[#FF4D00]">{t('landing.hero.title2')}</span>
            </h1>
            <p className="text-white/80 text-base md:text-lg max-w-2xl mx-auto mb-4 leading-relaxed">
            {t('landing.hero.paragraph1')}
            </p>
            <p className="text-[#FF4D00] font-semibold text-base md:text-lg mb-4">
            {t('landing.hero.paragraph2')}
            </p>
            <p className="text-[#AAA] text-base md:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
            <strong className="font-display font-bold text-white">SHOOF<span className="text-[#FF4D00]">LY</span></strong> {t('landing.hero.paragraph3')}
            </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={() => navigate('/register')}
            className="bg-[#FF4D00] hover:bg-[#e04400] text-white font-semibold px-8 py-4 rounded-2xl text-base transition-colors">
            {t('landing.hero.ctaCreateMission')}
          </button>
          <button onClick={() => navigate('/register')}
            className="border border-white/20 hover:border-white/40 text-white font-semibold px-8 py-4 rounded-2xl text-base transition-colors">
            {t('landing.hero.ctaBecomeOeil')}
          </button>
        </div>
      </section>

      {/* TYPES DE MISSIONS */}
      <section className="px-6 md:px-16 py-20 bg-[#141414]">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display font-bold text-2xl md:text-3xl text-center mb-3">
            {t('landing.missionsSection.title')}
          </h2>
          <p className="text-[#AAA] text-center mb-12">{t('landing.missionsSection.subtitle')}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {MISSIONS.map((m) => (
              <div key={m.key} className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-6 hover:border-[#FF4D00]/30 transition-colors">
                <div className="text-4xl mb-4">{m.icon}</div>
                <div className="font-semibold mb-2">{t(`landing.missions.${m.key}.label`)}</div>
                <div className="text-xs text-[#AAA] leading-relaxed">{t(`landing.missions.${m.key}.desc`)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMMENT ÇA MARCHE */}
      <section className="px-6 md:px-16 py-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display font-bold text-2xl md:text-3xl text-center mb-3">
            {t('landing.howItWorks.title')}
          </h2>
          <p className="text-[#AAA] text-center mb-12">{t('landing.howItWorks.subtitle')}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((s) => (
              <div key={s.n} className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-[#FF4D00]/10 border border-[#FF4D00]/20 flex items-center justify-center mx-auto mb-4">
                  <span className="font-display font-bold text-[#FF4D00] text-lg">{s.n}</span>
                </div>
                <div className="font-semibold mb-2">{t(`landing.steps.${s.key}.title`)}</div>
                <div className="text-sm text-[#AAA] leading-relaxed">{t(`landing.steps.${s.key}.desc`)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* POURQUOI SHOOFLY */}
      <section className="px-6 md:px-16 py-20 bg-[#141414]">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display font-bold text-2xl md:text-3xl text-center mb-12">
            {t('landing.why.title')}
          </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {WHY.map((w) => (
                    <div key={w.key} className="flex items-start gap-4 bg-[#1A1A1A] border border-white/10 rounded-2xl p-5 hover:border-[#FF4D00]/30 transition-colors">
                    <div className="w-12 h-12 rounded-xl bg-[#FF4D00]/10 flex items-center justify-center text-2xl flex-shrink-0">
                        {w.icon}
                    </div>
                    <div>
                        <div className="font-semibold text-sm mb-1">{t(`landing.why.${w.key}.label`)}</div>
                        <div className="text-xs text-[#AAA] leading-relaxed">{t(`landing.why.${w.key}.desc`)}</div>
                    </div>
                    </div>
                ))}
                </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="px-6 md:px-16 py-24 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display font-bold text-3xl md:text-4xl mb-4">
            {t('landing.finalCta.title')}
          </h2>
          <p className="text-[#AAA] mb-8">{t('landing.finalCta.subtitle')}</p>
          <button onClick={() => navigate('/register')}
            className="bg-[#FF4D00] hover:bg-[#e04400] text-white font-semibold px-10 py-4 rounded-2xl text-base transition-colors">
            {t('landing.finalCta.button')}
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="px-6 md:px-16 py-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="font-display font-bold text-lg">
          SHOOF<span className="text-[#FF4D00]">LY</span>
        </div>
        <div className="text-xs text-[#555]">{t('landing.footer.copyright')}</div>
        <div className="flex gap-4 text-xs text-[#555]">
          <button onClick={() => navigate('/login')} className="hover:text-white transition-colors">{t('landing.footer.login')}</button>
          <button onClick={() => navigate('/register')} className="hover:text-white transition-colors">{t('landing.footer.register')}</button>
          <button onClick={() => navigate('/cgv')} className="hover:text-white transition-colors">{t('landing.footer.cgv')}</button>
          <button onClick={() => navigate('/confidentialite')} className="hover:text-white transition-colors">{t('landing.footer.confidentiality')}</button>
          <button onClick={() => navigate('/verification')} className="hover:text-white transition-colors">{t('landing.footer.verification')}</button>
        </div>
      </footer>

    </div>
  )
}
