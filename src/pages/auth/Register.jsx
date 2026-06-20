import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authAPI } from '../../api'
import { toast } from '../../components/ui'

const CITIES = ['Rabat','Casablanca','Salé','Témara','Marrakech','Fès','Tanger','Agadir']

export default function Register() {
  const navigate = useNavigate()
  const [step, setStep]     = useState(1)
  const [role, setRole]     = useState('client')
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')
  const [form, setForm]     = useState({
    first_name:'', last_name:'', email:'', phone:'', city:'', password:'', confirm:'', zone:'', bio:''
  })

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const next = () => {
    setError('')
    if (step === 2) {
      if (!form.first_name || !form.last_name || !form.email) { setError('Tous les champs sont requis.'); return }
      if (form.password.length < 6) { setError('Mot de passe : minimum 6 caractères.'); return }
      if (form.password !== form.confirm) { setError('Les mots de passe ne correspondent pas.'); return }
    }
    setStep((s) => s + 1)
  }

  const submit = async () => {
    setLoading(true); setError('')
    try {
      await authAPI.register({ ...form, role })
      toast('Compte créé ! Connectez-vous.', 'success')
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la création du compte.')
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
          <p className="text-sm text-[#AAA] mb-6">Créer votre compte</p>

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
                {[{id:'client',icon:'👤',label:'Client',desc:'Je commande des missions'},{id:'oeil',icon:'👁️',label:'Œil',desc:'J\'effectue des missions'}].map((r) => (
                  <button key={r.id} onClick={() => setRole(r.id)}
                    className={`flex flex-col items-center gap-1 py-5 rounded-xl border transition-all ${role===r.id?'border-[#FF4D00] bg-[#FF4D00]/10':'border-white/12 bg-[#222]'}`}>
                    <span className="text-3xl">{r.icon}</span>
                    <span className="text-sm font-semibold">{r.label}</span>
                    <span className="text-[11px] text-[#AAA]">{r.desc}</span>
                  </button>
                ))}
              </div>
              <button onClick={() => setStep(2)} className="btn btn-primary btn-lg w-full justify-center">Continuer →</button>
            </div>
          )}

          {/* Step 2: Infos */}
          {step === 2 && (
            <div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Prénom</label><input className="input" value={form.first_name} onChange={set('first_name')} placeholder="Karim" /></div>
                <div><label className="label">Nom</label><input className="input" value={form.last_name} onChange={set('last_name')} placeholder="Benali" /></div>
              </div>
              <div className="mt-3"><label className="label">Email</label><input className="input" type="email" value={form.email} onChange={set('email')} placeholder="vous@email.com" /></div>
              <div className="mt-3"><label className="label">Téléphone</label><input className="input" value={form.phone} onChange={set('phone')} placeholder="+212 6xx xxx xxx" /></div>
              <div className="mt-3"><label className="label">Ville</label>
                <select className="input" value={form.city} onChange={set('city')}>
                  <option value="">Sélectionnez...</option>
                  {CITIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="mt-3"><label className="label">Mot de passe</label><input className="input" type="password" value={form.password} onChange={set('password')} placeholder="Min. 6 caractères" /></div>
              <div className="mt-3"><label className="label">Confirmer</label><input className="input" type="password" value={form.confirm} onChange={set('confirm')} placeholder="••••••••" /></div>
              {error && <p className="text-xs text-red-400 mt-3 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
              <div className="flex gap-2 mt-5">
                <button onClick={() => setStep(1)} className="btn btn-ghost">← Retour</button>
                <button onClick={next} className="btn btn-primary flex-1 justify-center">Continuer →</button>
              </div>
            </div>
          )}

          {/* Step 3: Confirm */}
          {step === 3 && (
            <div>
              {role === 'oeil' && (
                <div className="mb-4">
                  <div className="mb-3"><label className="label">Zone de couverture</label><input className="input" value={form.zone} onChange={set('zone')} placeholder="Ex: Rabat, Agdal, Hay Riad" /></div>
                  <div><label className="label">Bio</label><textarea className="input resize-none h-20" value={form.bio} onChange={set('bio')} placeholder="Décrivez votre expérience..." /></div>
                  <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-xs text-yellow-400">⚠️ Votre profil Œil sera vérifié sous 24h.</div>
                </div>
              )}
              <div className="bg-[#222] rounded-xl p-4 mb-4 text-sm space-y-1 text-[#AAA]">
                <div className="text-white font-semibold mb-2">Récapitulatif</div>
                <div>Rôle : <span className="text-white">{role === 'client' ? '👤 Client' : '👁️ Œil'}</span></div>
                <div>Nom : <span className="text-white">{form.first_name} {form.last_name}</span></div>
                <div>Email : <span className="text-white">{form.email}</span></div>
                {form.city && <div>Ville : <span className="text-white">{form.city}</span></div>}
              </div>
              <label className="flex items-start gap-2 mb-5 cursor-pointer">
                <input type="checkbox" id="cgu" className="mt-0.5 accent-[#FF4D00]" />
                <span className="text-xs text-[#AAA]">J'accepte les <span className="text-[#FF4D00]">conditions d'utilisation</span> et la <span className="text-[#FF4D00]">politique de confidentialité</span>.</span>
              </label>
              {error && <p className="text-xs text-red-400 mb-3 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
              <div className="flex gap-2">
                <button onClick={() => setStep(2)} className="btn btn-ghost">← Retour</button>
                <button onClick={submit} disabled={loading} className="btn btn-primary flex-1 justify-center disabled:opacity-60">
                  {loading ? 'Création...' : 'Créer mon compte →'}
                </button>
              </div>
            </div>
          )}

          <Link to="/login" className="block text-center text-xs text-[#AAA] mt-5">Déjà un compte ? <span className="text-[#FF4D00]">Se connecter</span></Link>
        </div>
      </div>
    </div>
  )
}
