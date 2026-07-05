import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { authAPI } from '../../api'
import { VILLES, VILLES_LIST } from '../../constants/villes'
import { captureAcquisitionParams, getAcquisitionParams, clearAcquisitionParams } from '../../utils/acquisitionTracking'
import { toast } from '../../components/ui'

import { useRef, useEffect } from 'react'

const OEIL_SITUATION_OPTIONS = [
  { value: 'Étudiant', key: 'etudiant' },
  { value: 'Salarié', key: 'salarie' },
  { value: 'Freelance', key: 'freelance' },
  { value: 'Auto-entrepreneur', key: 'autoEntrepreneur' },
  { value: "En recherche d'emploi", key: 'enRechercheEmploi' },
  { value: 'Retraité', key: 'retraite' },
  { value: 'Autre', key: 'autre' },
]

const OEIL_DISPO_OPTIONS = [
  { value: 'En semaine', key: 'enSemaine' },
  { value: 'Soirs', key: 'soirs' },
  { value: 'Week-ends', key: 'weekEnds' },
  { value: 'Temps plein', key: 'tempsPlein' },
]

const OEIL_MOTIVATION_OPTIONS = [
  { value: 'Revenu complémentaire', key: 'revenuComplementaire' },
  { value: 'Revenu principal', key: 'revenuPrincipal' },
  { value: 'Expérience professionnelle', key: 'experienceProfessionnelle' },
  { value: 'Flexibilité', key: 'flexibilite' },
  { value: 'Autre', key: 'autre' },
]

const CLIENT_PROFIL_OPTIONS = [
  { value: 'Particulier', key: 'particulier' },
  { value: "Entrepreneur / Chef d'entreprise", key: 'entrepreneur' },
  { value: 'Professionnel / Salarié', key: 'professionnel' },
  { value: 'Expatrié / Non-résident (MRE)', key: 'expatrie' },
  { value: 'Étudiant', key: 'etudiant' },
  { value: 'Investisseur immobilier', key: 'investisseurImmobilier' },
  { value: 'Profession libérale (avocat, médecin, architecte...)', key: 'professionLiberale' },
  { value: 'Autre', key: 'autre' },
]

const CLIENT_USAGE_REASON_OPTIONS = [
  { value: 'Gagner du temps', key: 'gagnerDuTemps' },
  { value: 'Éviter un déplacement', key: 'eviterDeplacement' },
  { value: 'Vérifier avant un achat', key: 'verifierAvantAchat' },
  { value: 'Gérer une démarche administrative', key: 'gererDemarcheAdmin' },
  { value: 'Superviser une activité à distance', key: 'superviserActivite' },
  { value: 'Autre', key: 'autre' },
]

const CLIENT_USAGE_FREQ_OPTIONS = [
  { value: 'Une seule fois', key: 'uneSeuleFois' },
  { value: 'Quelques fois par an', key: 'quelquesFoisParAn' },
  { value: 'Une fois par mois', key: 'uneFoisParMois' },
  { value: 'Plusieurs fois par mois', key: 'plusieursFoisParMois' },
  { value: 'Chaque semaine', key: 'chaqueSemaine' },
]

function Autocomplete({ label, value, onChange, suggestions, placeholder, disabled = false, required = false }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(value || '')
  const ref = useRef(null)

  useEffect(() => { setQuery(value || '') }, [value])
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = query.length >= 1
    ? suggestions.filter((s) => s.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
    : suggestions.slice(0, 8)

  const select = (val) => { setQuery(val); onChange(val); setOpen(false) }

  return (
    <div ref={ref} className="relative">
      <label className="label">{label}{required && ' *'}</label>
      <input
        className="input"
        value={query}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => { setQuery(e.target.value); onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-[#222] border border-white/20 rounded-xl overflow-hidden shadow-xl max-h-48 overflow-y-auto">
          {filtered.map((s) => (
            <div key={s} onMouseDown={() => select(s)}
              className="px-4 py-2.5 text-sm cursor-pointer hover:bg-[#FF4D00]/10 hover:text-white text-[#CCC] transition-colors">
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Register() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  useEffect(() => { captureAcquisitionParams() }, [])
  const [step, setStep]     = useState(1)
  const [role, setRole]     = useState('client')
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

const [form, setForm] = useState({
  first_name:'', last_name:'', email:'', phone:'', city:'', quartier:'', password:'', confirm:'', zone:'', bio:'',
  birth_date:'', profil:'', usage_reason:'', usage_frequency:'', villes_cibles:'',
  situation:'', disponibilite:'', motivation:''
})

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const next = () => {
    setError('')
    if (step === 2) {
      if (!form.first_name || !form.last_name || !form.email) { setError(t('register.errors.allFieldsRequired')); return }
      if (role === 'oeil' && !form.city) { setError(t('register.errors.cityRequiredOeil')); return }
      if (role === 'oeil' && !form.quartier) { setError(t('register.errors.quartierRequiredOeil')); return }
      if (form.password.length < 6) { setError(t('register.errors.passwordMinLength')); return }
      if (form.password !== form.confirm) { setError(t('register.errors.passwordMismatch')); return }
    }
    setStep((s) => s + 1)
  }

  const submit = async () => {
    setLoading(true); setError('')
    try {
      const acquisition = getAcquisitionParams()
      await authAPI.register({ ...form, role, ...acquisition })
      clearAcquisitionParams()
      toast(t('register.toastAccountCreated'), 'success')
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.error || t('register.errors.accountCreationError'))
    } finally { setLoading(false) }
  }

  const stepDot = (n) => (
    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border transition-all ${
      n < step ? 'bg-green-500 border-green-500 text-white' :
      n === step ? 'bg-[#FF4D00] border-[#FF4D00] text-white' :
      'border-white/20 text-[#AAA]'
    }`}>{n < step ? '✓' : n}</div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#FF4D00]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="relative z-10 w-full max-w-[460px] mx-4">
        <div className="bg-[#181818] border border-white/20 rounded-2xl p-9">
          <div className="font-display font-bold text-2xl mb-0.5">SHOOF<span className="text-[#FF4D00]">LY</span></div>
          <p className="text-sm text-[#AAA] mb-6">{t('register.subtitle')}</p>

          {/* Steps indicator */}
          <div className="flex items-center gap-2 mb-7">
            {stepDot(1)}<div className={`flex-1 h-px ${step > 1 ? 'bg-green-500' : 'bg-white/20'}`} />
            {stepDot(2)}<div className={`flex-1 h-px ${step > 2 ? 'bg-green-500' : 'bg-white/20'}`} />
            {stepDot(3)}
          </div>

          {/* Step 1: Role */}
          {step === 1 && (
            <div>
              <p className="text-sm font-semibold mb-4">{t('register.step1.question')}</p>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {[{id:'client',icon:'👤',labelKey:'client'},{id:'oeil',icon:'👁️',labelKey:'oeil'}].map((r) => (
                  <button key={r.id} onClick={() => setRole(r.id)}
                    className={`flex flex-col items-center gap-1 py-5 rounded-xl border transition-all ${role===r.id?'border-[#FF4D00] bg-[#FF4D00]/10':'border-white/12 bg-[#222]'}`}>
                    <span className="text-3xl">{r.icon}</span>
                    <span className="text-sm font-semibold">{t(`register.step1.roles.${r.labelKey}.label`)}</span>
                    <span className="text-[11px] text-[#AAA]">{t(`register.step1.roles.${r.labelKey}.desc`)}</span>
                  </button>
                ))}
              </div>
              <button onClick={() => setStep(2)} className="btn btn-primary btn-lg w-full justify-center">{t('register.step1.continue')}</button>
            </div>
          )}

          {/* Step 2: Infos */}
          {step === 2 && (
            <div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">{t('register.step2.firstName')}</label><input className="input" value={form.first_name} onChange={set('first_name')} placeholder={t('register.step2.firstNamePlaceholder')} /></div>
                <div><label className="label">{t('register.step2.lastName')}</label><input className="input" value={form.last_name} onChange={set('last_name')} placeholder={t('register.step2.lastNamePlaceholder')} /></div>
              </div>
              <div className="mt-3"><label className="label">{t('register.step2.email')}</label><input className="input" type="email" value={form.email} onChange={set('email')} placeholder={t('register.step2.emailPlaceholder')} /></div>
              <div className="mt-3"><label className="label">{t('register.step2.phone')}</label><input className="input" value={form.phone} onChange={set('phone')} placeholder={t('register.step2.phonePlaceholder')} /></div>

              <div className="mt-3">
                <Autocomplete
                  label={t('register.step2.city')}
                  required={role === 'oeil'}
                  value={form.city}
                  onChange={(v) => setForm((f) => ({ ...f, city: v, quartier: '' }))}
                  suggestions={VILLES_LIST}
                  placeholder={t('register.step2.cityPlaceholder')}
                />
              </div>
              {role === 'oeil' && (
                <div className="mt-3">
                  <Autocomplete
                    label={t('register.step2.quartier')}
                    required
                    value={form.quartier}
                    onChange={(v) => setForm((f) => ({ ...f, quartier: v }))}
                    suggestions={VILLES[form.city] || []}
                    placeholder={form.city ? t('register.step2.quartierPlaceholder') : t('register.step2.quartierPlaceholderDisabled')}
                    disabled={!form.city}
                  />
                </div>
              )}


              <div className="mt-3"><label className="label">{t('register.step2.password')}</label><input className="input" type="password" value={form.password} onChange={set('password')} placeholder={t('register.step2.passwordPlaceholder')} /></div>
              <div className="mt-3"><label className="label">{t('register.step2.confirm')}</label><input className="input" type="password" value={form.confirm} onChange={set('confirm')} placeholder={t('register.step2.confirmPlaceholder')} /></div>
              {error && <p className="text-xs text-red-400 mt-3 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
              <div className="flex gap-2 mt-5">
                <button onClick={() => setStep(1)} className="btn btn-ghost">{t('register.step2.back')}</button>
                <button onClick={next} className="btn btn-primary flex-1 justify-center">{t('register.step2.continue')}</button>
              </div>
            </div>
          )}

          {/* Step 3: Confirm */}
          {step === 3 && (
            <div>
              {role === 'oeil' ? (
                  <div className="mb-4 space-y-3">
                    <div>
                      <label className="label">{t('register.step3.oeil.situationLabel')}</label>
                      <select className="input" value={form.situation} onChange={set('situation')} required>
                        <option value="">{t('register.step3.selectPlaceholder')}</option>
                        {OEIL_SITUATION_OPTIONS.map(o => <option key={o.value} value={o.value}>{t(`register.step3.oeil.situationOptions.${o.key}`)}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">{t('register.step3.oeil.disponibiliteLabel')}</label>
                      <select className="input" value={form.disponibilite} onChange={set('disponibilite')}>
                        <option value="">{t('register.step3.selectPlaceholder')}</option>
                        {OEIL_DISPO_OPTIONS.map(o => <option key={o.value} value={o.value}>{t(`register.step3.oeil.disponibiliteOptions.${o.key}`)}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">{t('register.step3.oeil.motivationLabel')}</label>
                      <select className="input" value={form.motivation} onChange={set('motivation')}>
                        <option value="">{t('register.step3.selectPlaceholder')}</option>
                        {OEIL_MOTIVATION_OPTIONS.map(o => <option key={o.value} value={o.value}>{t(`register.step3.oeil.motivationOptions.${o.key}`)}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">{t('register.step3.oeil.birthDateLabel')}</label>
                      <input type="date" className="input" value={form.birth_date} onChange={set('birth_date')} required />
                    </div>
                    <div><label className="label">{t('register.step3.oeil.bioLabel')}</label><textarea className="input resize-none h-20" value={form.bio} onChange={set('bio')} placeholder={t('register.step3.oeil.bioPlaceholder')} /></div>
                    <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-xs text-yellow-400">{t('register.step3.oeil.verificationNotice')}</div>
                  </div>
                ) : (
                  <div className="mb-4 space-y-3">
                    <div>
                      <label className="label">{t('register.step3.client.profilLabel')}</label>
                      <select className="input" value={form.profil} onChange={set('profil')}>
                        <option value="">{t('register.step3.selectPlaceholder')}</option>
                        {CLIENT_PROFIL_OPTIONS.map(o => <option key={o.value} value={o.value}>{t(`register.step3.client.profilOptions.${o.key}`)}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">{t('register.step3.client.usageReasonLabel')}</label>
                      <select className="input" value={form.usage_reason} onChange={set('usage_reason')}>
                        <option value="">{t('register.step3.selectPlaceholder')}</option>
                        {CLIENT_USAGE_REASON_OPTIONS.map(o => <option key={o.value} value={o.value}>{t(`register.step3.client.usageReasonOptions.${o.key}`)}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">{t('register.step3.client.usageFrequencyLabel')}</label>
                      <select className="input" value={form.usage_frequency} onChange={set('usage_frequency')}>
                        <option value="">{t('register.step3.selectPlaceholder')}</option>
                        {CLIENT_USAGE_FREQ_OPTIONS.map(o => <option key={o.value} value={o.value}>{t(`register.step3.client.usageFrequencyOptions.${o.key}`)}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">{t('register.step3.client.birthDateLabel')}</label>
                      <input type="date" className="input" value={form.birth_date} onChange={set('birth_date')} />
                    </div>
                  </div>
                )}

              <div className="bg-[#222] rounded-xl p-4 mb-4 text-sm space-y-1 text-[#AAA]">
                <div className="text-white font-semibold mb-2">{t('register.step3.recap.title')}</div>
                <div>{t('register.step3.recap.role')} <span className="text-white">{role === 'client' ? t('register.step3.recap.roleClient') : t('register.step3.recap.roleOeil')}</span></div>
                <div>{t('register.step3.recap.name')} <span className="text-white">{form.first_name} {form.last_name}</span></div>
                <div>{t('register.step3.recap.email')} <span className="text-white">{form.email}</span></div>
                {form.city && <div>{t('register.step3.recap.city')} <span className="text-white">{form.city}</span></div>}
                {form.quartier && <div>{t('register.step3.recap.quartier')} <span className="text-white">{form.quartier}</span></div>}
              </div>
              <label className="flex items-start gap-2 mb-5 cursor-pointer">
                <input type="checkbox" id="cgu" className="mt-0.5 accent-[#FF4D00]" />
                <span className="text-xs text-[#AAA]">{t('register.step3.terms.prefix')} <span className="text-[#FF4D00]">{t('register.step3.terms.cgu')}</span>{t('register.step3.terms.and')}<span className="text-[#FF4D00]">{t('register.step3.terms.privacy')}</span>{t('register.step3.terms.suffix')}</span>
              </label>
              {error && <p className="text-xs text-red-400 mb-3 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
              <div className="flex gap-2">
                <button onClick={() => setStep(2)} className="btn btn-ghost">{t('register.step3.back')}</button>
                <button onClick={submit} disabled={loading} className="btn btn-primary flex-1 justify-center disabled:opacity-60">
                  {loading ? t('register.step3.submitLoading') : t('register.step3.submitButton')}
                </button>
              </div>
            </div>
          )}

          <Link to="/login" className="block text-center text-xs text-[#AAA] mt-5">{t('register.alreadyAccount')} <span className="text-[#FF4D00]">{t('register.loginLink')}</span></Link>
        </div>
      </div>
    </div>
  )
}
