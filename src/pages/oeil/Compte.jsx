import { useState } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import Topbar from '../../components/layout/Topbar'
import { useAuth } from '../../context/AuthContext'
import { toast, Avatar, Stars } from '../../components/ui'
import { authAPI, usersAPI } from '../../api'

const JOURS = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim']

const defaultDispo = () => JOURS.map((j, i) => ({
  jour: j,
  actif: i < 5,
  debut: i < 5 ? '08:00' : '09:00',
  fin:   i < 5 ? '20:00' : '14:00',
}))

export default function OeilCompte() {
  const { user, updateUser } = useAuth()
  const [saving, setSaving]  = useState(false)
  const [savingDispo, setSavingDispo] = useState(false)
  const [isAvailable, setIsAvailable] = useState(user?.is_available || false)
  const [togglingDispo, setTogglingDispo] = useState(false)
  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    last_name:  user?.last_name  || '',
    phone:      user?.phone      || '',
    city:       user?.city       || '',
    bio:        user?.bio        || '',
  })

  
  const parseDispo = (d) => {
  if (!d) return defaultDispo()
  if (typeof d === 'string') { try { return JSON.parse(d) } catch {} }
  if (Array.isArray(d) && d.length) return d
  return defaultDispo()
}
const [dispo, setDispo] = useState(() => parseDispo(user?.disponibilites))

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const toggleJour = (i) =>
    setDispo((d) => d.map((x, idx) => idx === i ? { ...x, actif: !x.actif } : x))

  const setHeure = (i, key, val) =>
    setDispo((d) => d.map((x, idx) => idx === i ? { ...x, [key]: val } : x))

  const save = async () => {
    setSaving(true)
    try {
      const { data } = await authAPI.update(form)
      updateUser(data.user)
      toast('Profil mis à jour ✓', 'success')
    } catch { toast('Erreur', 'error') }
    finally { setSaving(false) }
  }

  const saveDispo = async () => {
    setSavingDispo(true)
    try {
      const { data } = await authAPI.update({ disponibilites: dispo })
      updateUser(data.user)
      toast('Disponibilités enregistrées ✓', 'success')
    } catch { toast('Erreur', 'error') }
    finally { setSavingDispo(false) }
  }

  const toggleAvailable = async () => {
  setTogglingDispo(true)
  try {
    const { data } = await usersAPI.toggleAvailable()
    setIsAvailable(data.is_available)
    updateUser({ is_available: data.is_available })
    toast(data.is_available ? '🟢 Vous êtes maintenant disponible' : '🔴 Vous êtes maintenant hors ligne', 'info')
  } catch { toast('Erreur', 'error') }
  finally { setTogglingDispo(false) }
}

  const requestWithdraw = () => toast('Fonctionnalité virement disponible bientôt', 'info')

  return (
    <AppLayout>
      <Topbar title="Mon profil" />
      <div className="p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">

          {/* Profil */}
          <div className="card">
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/10">
              <Avatar name={`${user?.first_name} ${user?.last_name}`} size={52} />
              <div>
                <div className="font-semibold text-base">{user?.first_name} {user?.last_name}</div>
                <div className="flex items-center gap-1.5 mt-1">
                  <Stars value={user?.rating_avg || 0} />
                  <span className="text-xs text-[#AAA]">{user?.rating_avg || '—'} · {user?.total_missions || 0} missions</span>
                </div>
                {user?.is_verified && <span className="badge badge-green mt-1">✓ Vérifié</span>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className="label">Prénom</label><input className="input" value={form.first_name} onChange={set('first_name')} /></div>
              <div><label className="label">Nom</label><input className="input" value={form.last_name} onChange={set('last_name')} /></div>
            </div>
            <div className="mt-3"><label className="label">Email</label><input className="input" value={user?.email || ''} disabled /></div>
            <div className="mt-3"><label className="label">Téléphone</label><input className="input" value={form.phone} onChange={set('phone')} /></div>
            <div className="mt-3">
              <label className="label">Ville</label>
              <select className="input" value={form.city} onChange={set('city')}>
                {['Rabat','Casablanca','Salé','Témara','Marrakech','Fès','Tanger','Agadir'].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="mt-3"><label className="label">Bio</label><textarea className="input resize-none h-20" value={form.bio} onChange={set('bio')} placeholder="Décrivez votre expérience..." /></div>
            <button onClick={save} disabled={saving} className="btn btn-primary w-full justify-center mt-5 disabled:opacity-60">
              {saving ? 'Sauvegarde...' : 'Enregistrer'}
            </button>
          </div>

          {/* Colonne droite */}
          <div className="space-y-4">
            {/* Paiements */}
            <div className="card">
              <h2 className="font-semibold text-sm mb-4">Paiements</h2>
              <div className="flex items-center justify-between bg-[#222] rounded-xl p-4 mb-4">
                <div>
                  <div className="text-sm font-semibold">Solde disponible</div>
                  <div className="text-xs text-[#AAA]">Prêt à virer</div>
                </div>
                <div className="text-xl font-bold text-green-400">0 MAD</div>
              </div>
              <button onClick={requestWithdraw} className="btn btn-primary w-full justify-center">Demander un virement →</button>
            </div>

            {/* Disponibilités */}
            <div className="card">
              
              <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-sm">Disponibilités</h2>
                  <button
                    onClick={toggleAvailable}
                    disabled={togglingDispo}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors disabled:opacity-60 ${
                      isAvailable ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-[#333] text-[#AAA] border border-white/10'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-green-400' : 'bg-[#666]'}`} />
                    {togglingDispo ? '...' : isAvailable ? 'Disponible' : 'Hors ligne'}
                  </button>
                </div>

              {dispo.map((d, i) => (
                <div key={d.jour} className={`flex items-center gap-2 py-2 border-b border-white/10 last:border-0 transition-opacity ${!d.actif ? 'opacity-40' : ''}`}>
                  <span className="text-sm font-medium w-9 shrink-0">{d.jour}</span>
                  <input
                    type="time"
                    disabled={!d.actif}
                    value={d.debut}
                    onChange={(e) => setHeure(i, 'debut', e.target.value)}
                    className="input py-1 px-2 text-xs w-[82px] shrink-0"
                  />
                  <span className="text-[#AAA] shrink-0">→</span>
                  <input
                    type="time"
                    disabled={!d.actif}
                    value={d.fin}
                    onChange={(e) => setHeure(i, 'fin', e.target.value)}
                    className="input py-1 px-2 text-xs w-[82px] shrink-0"
                  />
                  {/* Toggle on/off */}
                  <button
                    onClick={() => toggleJour(i)}
                    className={`ml-auto w-10 h-5 rounded-full transition-colors shrink-0 relative ${d.actif ? 'bg-[#FF4D00]' : 'bg-[#333]'}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${d.actif ? 'left-5' : 'left-0.5'}`} />
                  </button>
                </div>
              ))}
              <button onClick={saveDispo} disabled={savingDispo} className="btn btn-primary btn-sm w-full justify-center mt-4 disabled:opacity-60">
                {savingDispo ? 'Sauvegarde...' : 'Enregistrer les disponibilités'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </AppLayout>
  )
}