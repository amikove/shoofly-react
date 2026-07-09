import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { captureAcquisitionParams } from '../utils/acquisitionTracking'
import LanguageToggle from '../components/ui/LanguageToggle'
import useScrollReveal from '../hooks/useScrollReveal'

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

const TESTIMONIALS = ['item1', 'item2', 'item3', 'item4', 'item5', 'item6']

export default function Landing() {
  const { t, i18n } = useTranslation()
  useEffect(() => { captureAcquisitionParams() }, [])
  const navigate = useNavigate()

  const missionsReveal = useScrollReveal()
  const howItWorksReveal = useScrollReveal()
  const whyReveal = useScrollReveal()

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
      <section className="relative px-6 md:px-16 py-24 md:py-36 max-w-4xl mx-auto text-center overflow-hidden">
        <div className="inline-block bg-[#FF4D00]/10 border border-[#FF4D00]/20 text-[#FF4D00] text-xs font-semibold px-4 py-1.5 rounded-full mb-6">
          {t('landing.hero.badge')}
        </div>

            <div className="text-[#AAA] text-sm font-medium tracking-widest uppercase mb-4">
            {t('landing.hero.tagline')}
            </div>

            <div className="relative">
              <div
                aria-hidden="true"
                className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none"
              >
                <div className="w-[420px] h-[240px] md:w-[560px] md:h-[300px] bg-[#FF4D00]/10 rounded-full blur-3xl animate-pulse-slow" />
              </div>
              <h1
                className="relative font-display font-bold text-4xl md:text-5xl leading-tight mb-6 animate-fade-in-up"
                style={{ animationDelay: '150ms' }}
              >
                {t('landing.hero.title1')}<br />
                <span className="text-[#FF4D00]">{t('landing.hero.title2')}</span>
              </h1>
            </div>

            <p className="text-white/80 text-base md:text-lg max-w-2xl mx-auto mb-4 leading-relaxed">
            {t('landing.hero.paragraph1')}
            </p>
            <p className="text-[#FF4D00] font-semibold text-base md:text-lg mb-4">
            {t('landing.hero.paragraph2')}
            </p>
            <p className="text-[#AAA] text-base md:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
<strong className="font-display font-bold text-white">SHOOF<span className="text-[#FF4D00]">LY</span></strong>
              {i18n.language === 'ar' && (
                <strong className="font-display font-bold">
                  {' '}(<span className="text-white">شووف</span><span className="text-[#FF4D00]">لي</span>)
                </strong>
              )}
              {' '}{t('landing.hero.paragraph3')}            </p>

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
      <section
        ref={missionsReveal.ref}
        className={`px-6 md:px-16 py-20 bg-[#141414] transition-all duration-700 ${missionsReveal.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      >
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display font-bold text-2xl md:text-3xl text-center mb-3">
            {t('landing.missionsSection.title')}
          </h2>
          <p className="text-[#AAA] text-center mb-12">{t('landing.missionsSection.subtitle')}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {MISSIONS.map((m) => (
              <div key={m.key} className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-6 hover:scale-105 hover:border-[#FF4D00]/40 transition-all duration-200">
                <div className="text-4xl mb-4">{m.icon}</div>
                <div className="font-semibold mb-2">{t(`landing.missions.${m.key}.label`)}</div>
                <div className="text-xs text-[#AAA] leading-relaxed">{t(`landing.missions.${m.key}.desc`)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMMENT ÇA MARCHE */}
      <section
        ref={howItWorksReveal.ref}
        className={`px-6 md:px-16 py-20 transition-all duration-700 ${howItWorksReveal.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      >
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display font-bold text-2xl md:text-3xl text-center mb-3">
            {t('landing.howItWorks.title')}
          </h2>
          <p className="text-[#AAA] text-center mb-12">{t('landing.howItWorks.subtitle')}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((s) => (
              <div key={s.n} className="text-center rounded-2xl border border-transparent p-4 hover:scale-105 hover:border-[#FF4D00]/40 transition-all duration-200">
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
      <section
        ref={whyReveal.ref}
        className={`px-6 md:px-16 py-20 bg-[#141414] transition-all duration-700 ${whyReveal.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      >
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display font-bold text-2xl md:text-3xl text-center mb-12">
            {t('landing.why.title')}
          </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {WHY.map((w) => (
                    <div key={w.key} className="flex items-start gap-4 bg-[#1A1A1A] border border-white/10 rounded-2xl p-5 hover:scale-105 hover:border-[#FF4D00]/40 transition-all duration-200">
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

        {/* AVIS CLIENTS (exemples illustratifs) */}
        <TestimonialsSection t={t} />

        {/* FAQ */}
        <FaqSection t={t} />

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

// ── Section Avis clients (carrousel d'exemples illustratifs) ──────────────
function TestimonialsSection({ t }) {
  const reveal = useScrollReveal()
  const [index, setIndex] = useState(0)
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    if (hovered) return
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % TESTIMONIALS.length)
    }, 4500)
    return () => clearInterval(id)
  }, [hovered])

  const activeKey = TESTIMONIALS[index]

  return (
    <section
      ref={reveal.ref}
      className={`px-6 md:px-16 py-20 transition-all duration-700 ${reveal.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
    >
      <div className="max-w-3xl mx-auto">
        <h2 className="font-display font-bold text-2xl md:text-3xl text-center mb-3">
          {t('landing.testimonials.title')}
        </h2>
        <p className="text-[#AAA] text-center text-sm mb-12">
          {t('landing.testimonials.subtitle')}
        </p>

        <div
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <div className="bg-[#181818] border border-white/10 rounded-2xl p-8 md:p-10 min-h-[240px] flex flex-col justify-center hover:scale-105 hover:border-[#FF4D00]/40 transition-all duration-200">
            <p key={activeKey} className="text-white/90 text-base md:text-lg leading-relaxed mb-6 animate-fade-in">
              « {t(`landing.testimonials.items.${activeKey}.quote`)} »
            </p>
            <p className="text-[#FF4D00] text-sm font-semibold">
              {t(`landing.testimonials.items.${activeKey}.role`)}
            </p>
          </div>

          <div className="flex justify-center gap-2 mt-6">
            {TESTIMONIALS.map((key, i) => (
              <button
                key={key}
                onClick={() => setIndex(i)}
                aria-label={`${i + 1}`}
                className={`h-2 rounded-full transition-all duration-200 ${i === index ? 'w-6 bg-[#FF4D00]' : 'w-2 bg-white/20 hover:bg-white/40'}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Section FAQ (accordéon) ──────────────────────────────
function FaqSection({ t }) {
  const [openIndex, setOpenIndex] = useState(null)
  const reveal = useScrollReveal()

  const groups = [
    {
      title: t('landing.faq.groupTrust'),
      items: [
        { q: t('landing.faq.q1.q'), a: t('landing.faq.q1.a') },
        { q: t('landing.faq.q2.q'), a: t('landing.faq.q2.a') },
        { q: t('landing.faq.q3.q'), a: t('landing.faq.q3.a') },
        { q: t('landing.faq.q4.q'), a: t('landing.faq.q4.a') },
        { q: t('landing.faq.q5.q'), a: t('landing.faq.q5.a') },
      ],
    },
    {
      title: t('landing.faq.groupDesire'),
      items: [
        { q: t('landing.faq.q6.q'), a: t('landing.faq.q6.a') },
        { q: t('landing.faq.q7.q'), a: t('landing.faq.q7.a') },
        { q: t('landing.faq.q8.q'), a: t('landing.faq.q8.a') },
        { q: t('landing.faq.q9.q'), a: t('landing.faq.q9.a') },
      ],
    },
    {
      title: t('landing.faq.groupPractical'),
      items: [
        { q: t('landing.faq.q10.q'), a: t('landing.faq.q10.a') },
        { q: t('landing.faq.q11.q'), a: t('landing.faq.q11.a') },
        { q: t('landing.faq.q12.q'), a: t('landing.faq.q12.a') },
      ],
    },
  ]

  let globalIndex = -1

  return (
    <section
      ref={reveal.ref}
      className={`px-6 md:px-16 py-20 bg-[#141414] transition-all duration-700 ${reveal.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
    >
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-4">
          <h2 className="font-display font-bold text-2xl md:text-3xl mb-2">
            {t('landing.faq.introTitle')}
          </h2>
          <p className="text-[#AAA] max-w-xl mx-auto">{t('landing.faq.introSubtitle')}</p>
        </div>

        <div className="mt-12 space-y-8">
          {groups.map((group, gi) => (
            <div key={gi}>
              <p className="text-xs font-semibold text-[#FF4D00] uppercase tracking-wider mb-3">
                {group.title}
              </p>
              <div className="space-y-2">
                {group.items.map((item) => {
                  globalIndex++
                  const idx = globalIndex
                  const isOpen = openIndex === idx
                  return (
                    <div key={idx} className="border border-white/10 rounded-xl overflow-hidden bg-[#181818]">
                      <button
                        onClick={() => setOpenIndex(isOpen ? null : idx)}
                        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-start"
                      >
                        <span className="font-medium text-sm md:text-base">{item.q}</span>
                        <span className={`text-[#FF4D00] flex-shrink-0 transition-transform ${isOpen ? 'rotate-45' : ''}`}>
                          +
                        </span>
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-4 text-sm text-[#AAA] leading-relaxed">
                          {item.a}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
