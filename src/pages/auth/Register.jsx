import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authAPI } from '../../api'
import { VILLES, VILLES_LIST } from '../../constants/villes'
import { toast } from '../../components/ui'

import { useRef, useEffect } from 'react'


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
  const navigate = useNavigate()
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
      if (!form.first_name || !form.last_name || !form.email) { setError('Tous les champs sont requis.'); return }
      if (role === 'oeil' && !form.city) { setError('La ville est obligatoire pour un Å’il.'); return }
      if (role === 'oeil' && !form.quartier) { setError('Le quartier est obligatoire pour un Å’il.'); return }
      if (form.password.length < 6) { setError('Mot de passe : minimum 6 caractÃ¨res.'); return }
      if (form.password !== form.confirm) { setError('Les mots de passe ne correspondent pas.'); return }
    }
    setStep((s) => s + 1)
  }

  const submit = async () => {
    setLoading(true); setError('')
    try {
      await authAPI.register({ ...form, role })
      toast('Compte crÃ©Ã© ! Connectez-vous.', 'success')
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la crÃ©ation du compte.')
    } finally { setLoading(false) }
  }

  const stepDot = (n) => (
    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border transition-all ${
      n < step ? 'bg-green-500 border-green-500 text-white' :
      n === step ? 'bg-[#FF4D00] border-[#FF4D00] text-white' :
      'border-white/20 text-[#AAA]'
    }`}>{n < step ? 'âœ“' : n}</div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#FF4D00]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="relative z-10 w-full max-w-[460px] mx-4">
        <div className="bg-[#181818] border border-white/20 rounded-2xl p-9">
          <div className="font-display font-bold text-2xl mb-0.5">SHOOF<span className="text-[#FF4D00]">LY</span></div>
          <p className="text-sm text-[#AAA] mb-6">CrÃ©er votre compte</p>

          {/* Steps indicator */}
          <div className="flex items-center gap-2 mb-7">
            {stepDot(1)}<div className={`flex-1 h-px ${step > 1 ? 'bg-green-500' : 'bg-white/20'}`} />
            {stepDot(2)}<div className={`flex-1 h-px ${step > 2 ? 'bg-green-500' : 'bg-white/20'}`} />
            {stepDot(3)}
          </div>

          {/* Step 1: Role */}
          {step === 1 && (
            <div>
              <p className="text-sm font-semibold mb-4">Je suis :</p>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {[{id:'client',icon:'ðŸ‘¤',label:'Client',desc:'Je commande des missions'},{id:'oeil',icon:'ðŸ‘ï¸',label:'Å’il',desc:'J\'effectue des missions'}].map((r) => (
                  <button key={r.id} onClick={() => setRole(r.id)}
                    className={`flex flex-col items-center gap-1 py-5 rounded-xl border transition-all ${role===r.id?'border-[#FF4D00] bg-[#FF4D00]/10':'border-white/12 bg-[#222]'}`}>
                    <span className="text-3xl">{r.icon}</span>
                    <span className="text-sm font-semibold">{r.label}</span>
                    <span className="text-[11px] text-[#AAA]">{r.desc}</span>
                  </button>
                ))}
              </div>
              <button onClick={() => setStep(2)} className="btn btn-primary btn-lg w-full justify-center">Continuer â†’</button>
            </div>
          )}

          {/* Step 2: Infos */}
          {step === 2 && (
            <div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">PrÃ©nom</label><input className="input" value={form.first_name} onChange={set('first_name')} placeholder="Karim" /></div>
                <div><label className="label">Nom</label><input className="input" value={form.last_name} onChange={set('last_name')} placeholder="Benali" /></div>
              </div>
              <div className="mt-3"><label className="label">Email</label><input className="input" type="email" value={form.email} onChange={set('email')} placeholder="vous@email.com" /></div>
              <div className="mt-3"><label className="label">TÃ©lÃ©phone</label><input className="input" value={form.phone} onChange={set('phone')} placeholder="+212 6xx xxx xxx" /></div>
              
              <div className="mt-3">
                <Autocomplete
                  label="Ville"
                  required={role === 'oeil'}
                  value={form.city}
                  onChange={(v) => setForm((f) => ({ ...f, city: v, quartier: '' }))}
                  suggestions={VILLES_LIST}
                  placeholder="Ex: Rabat"
                />
              </div>
              {role === 'oeil' && (
                <div className="mt-3">
                  <Autocomplete
                    label="Quartier"
                    required
                    value={form.quartier}
                    onChange={(v) => setForm((f) => ({ ...f, quartier: v }))}
                    suggestions={VILLES[form.city] || []}
                    placeholder={form.city ? 'Ex: Agdal' : 'Choisir ville d\'abord'}
                    disabled={!form.city}
                  />
                </div>
              )}


              <div className="mt-3"><label className="label">Mot de passe</label><input className="input" type="password" value={form.password} onChange={set('password')} placeholder="Min. 6 caractÃ¨res" /></div>
              <div className="mt-3"><label className="label">Confirmer</label><input className="input" type="password" value={form.confirm} onChange={set('confirm')} placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢" /></div>
              {error && <p className="text-xs text-red-400 mt-3 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
              <div className="flex gap-2 mt-5">
                <button onClick={() => setStep(1)} className="btn btn-ghost">â† Retour</button>
                <button onClick={next} className="btn btn-primary flex-1 justify-center">Continuer â†’</button>
              </div>
            </div>
          )}

          {/* Step 3: Confirm */}
          {step === 3 && (
            <div>
              {role === 'oeil' ? (
                  <div className="mb-4 space-y-3">
                    <div>
                      <label className="label">Votre situation actuelle *</label>
                      <select className="input" value={form.situation} onChange={set('situation')} required>
                        <option value="">SÃ©lectionnez...</option>
                        {['Ã‰tudiant','SalariÃ©','Freelance','Auto-entrepreneur','En recherche d\'emploi','RetraitÃ©','Autre'].map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">DisponibilitÃ©</label>
                      <select className="input" value={form.disponibilite} onChange={set('disponibilite')}>
                        <option value="">SÃ©lectionnez...</option>
                        {['En semaine','Soirs','Week-ends','Temps plein'].map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">Motivation principale</label>
                      <select className="input" value={form.motivation} onChange={set('motivation')}>
                        <option value="">SÃ©lectionnez...</option>
                        {['Revenu complÃ©mentaire','Revenu principal','ExpÃ©rience professionnelle','FlexibilitÃ©','Autre'].map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">Date de naissance *</label>
                      <input type="date" className="input" value={form.birth_date} onChange={set('birth_date')} required />
                    </div>
                    <div><label className="label">Bio</label><textarea className="input resize-none h-20" value={form.bio} onChange={set('bio')} placeholder="DÃ©crivez votre expÃ©rience..." /></div>
                    <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-xs text-yellow-400">âš ï¸ Votre profil Å’il sera vÃ©rifiÃ© sous 24h.</div>
                  </div>
                ) : (
                  <div className="mb-4 space-y-3">
                    <div>
                      <label className="label">Quel profil vous correspond le mieux ?</label>
                      <select className="input" value={form.profil} onChange={set('profil')}>
                        <option value="">SÃ©lectionnez...</option>
                        {['Particulier','Entrepreneur / Chef d\'entreprise','Professionnel / SalariÃ©','ExpatriÃ© / Non-rÃ©sident (MRE)','Ã‰tudiant','Investisseur immobilier','Profession libÃ©rale (avocat, mÃ©decin, architecte...)','Autre'].map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">Pourquoi utilisez-vous Shoofly ?</label>
                      <select className="input" value={form.usage_reason} onChange={set('usage_reason')}>
                        <option value="">SÃ©lectionnez...</option>
                        {['Gagner du temps','Ã‰viter un dÃ©placement','VÃ©rifier avant un achat','GÃ©rer une dÃ©marche administrative','Superviser une activitÃ© Ã  distance','Autre'].map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">FrÃ©quence estimÃ©e</label>
                      <select className="input" value={form.usage_frequency} onChange={set('usage_frequency')}>
                        <option value="">SÃ©lectionnez...</option>
                        {['Une seule fois','Quelques fois par an','Une fois par mois','Plusieurs fois par mois','Chaque semaine'].map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">Date de naissance</label>
                      <input type="date" className="input" value={form.birth_date} onChange={set('birth_date')} />
                    </div>
                  </div>
                )}
              
              <div className="bg-[#222] rounded-xl p-4 mb-4 text-sm space-y-1 text-[#AAA]">
                <div className="text-white font-semibold mb-2">RÃ©capitulatif</div>
                <div>RÃ´le : <span className="text-white">{role === 'client' ? 'ðŸ‘¤ Client' : 'ðŸ‘ï¸ Å’il'}</span></div>
                <div>Nom : <span className="text-white">{form.first_name} {form.last_name}</span></div>
                <div>Email : <span className="text-white">{form.email}</span></div>
                {form.city && <div>Ville : <span className="text-white">{form.city}</span></div>}
                {form.quartier && <div>Quartier : <span className="text-white">{form.quartier}</span></div>}
              </div>
              <label className="flex items-start gap-2 mb-5 cursor-pointer">
                <input type="checkbox" id="cgu" className="mt-0.5 accent-[#FF4D00]" />
                <span className="text-xs text-[#AAA]">J'accepte les <span className="text-[#FF4D00]">conditions d'utilisation</span> et la <span className="text-[#FF4D00]">politique de confidentialitÃ©</span>.</span>
              </label>
              {error && <p className="text-xs text-red-400 mb-3 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
              <div className="flex gap-2">
                <button onClick={() => setStep(2)} className="btn btn-ghost">â† Retour</button>
                <button onClick={submit} disabled={loading} className="btn btn-primary flex-1 justify-center disabled:opacity-60">
                  {loading ? 'CrÃ©ation...' : 'CrÃ©er mon compte â†’'}
                </button>
              </div>
            </div>
          )}

          <Link to="/login" className="block text-center text-xs text-[#AAA] mt-5">DÃ©jÃ  un compte ? <span className="text-[#FF4D00]">Se connecter</span></Link>
        </div>
      </div>
    </div>
  )
}

