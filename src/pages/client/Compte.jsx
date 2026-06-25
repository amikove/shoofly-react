import { useState } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import Topbar from '../../components/layout/Topbar'
import { authAPI } from '../../api'
import { useAuth } from '../../context/AuthContext'
import { toast, Avatar } from '../../components/ui'

export default function ClientCompte() {
  const { user, updateUser } = useAuth()
  const [saving, setSaving]  = useState(false)
  const [form, setForm]      = useState({
    first_name: user?.first_name || '',
    last_name:  user?.last_name  || '',
    phone:      user?.phone      || '',
    city:       user?.city       || '',
  })
  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' })

  const set  = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const setPw = (k) => (e) => setPwd((p) => ({ ...p, [k]: e.target.value }))

  const saveProfile = async () => {
    setSaving(true)
    try {
      const { data } = await authAPI.update(form)
      updateUser(data.user)
      toast('Profil mis à jour ✓', 'success')
    } catch { toast('Erreur', 'error') }
    finally { setSaving(false) }
  }

  const savePassword = async () => {
    if (pwd.next !== pwd.confirm) { toast('Les mots de passe ne correspondent pas', 'error'); return }
    setSaving(true)
    try {
      await authAPI.password({ current_password: pwd.current, new_password: pwd.next })
      setPwd({ current: '', next: '', confirm: '' })
      toast('Mot de passe modifié ✓', 'success')
    } catch (err) { toast(err.response?.data?.error || 'Erreur', 'error') }
    finally { setSaving(false) }
  }

  return (
    <AppLayout>
      <Topbar title="Mon compte" />
      <div className="p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">

          {/* Profil */}
          <div className="card">
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/10">
              <Avatar name={`${user?.first_name} ${user?.last_name}`} size={52} />
              <div>
                <div className="font-semibold text-base">{user?.first_name} {user?.last_name}</div>
                <div className="text-xs text-[#AAA] mt-0.5">{user?.email}</div>
              </div>
            </div>

            <h2 className="font-semibold text-sm mb-4">Informations personnelles</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className="label">Prénom</label><input className="input" value={form.first_name} onChange={set('first_name')} /></div>
              <div><label className="label">Nom</label><input className="input" value={form.last_name} onChange={set('last_name')} /></div>
            </div>
            <div className="mt-3"><label className="label">Email</label><input className="input" value={user?.email || ''} disabled /></div>
            <div className="mt-3"><label className="label">Téléphone</label><input className="input" value={form.phone} onChange={set('phone')} placeholder="+212 6xx xxx xxx" /></div>
            <div className="mt-3">
              <label className="label">Ville</label>
              <select className="input" value={form.city} onChange={set('city')}>
                {['Rabat','Casablanca','Salé','Témara','Marrakech','Fès','Tanger','Agadir'].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <button onClick={saveProfile} disabled={saving} className="btn btn-primary w-full justify-center mt-5 disabled:opacity-60">
              {saving ? 'Sauvegarde...' : 'Enregistrer'}
            </button>
          </div>

          {/* Sécurité */}
          <div className="card h-fit">
            <h2 className="font-semibold text-sm mb-4">Sécurité</h2>
            <div>
              <label className="label">Mot de passe actuel</label>
              <input type="password" className="input" value={pwd.current} onChange={setPw('current')} placeholder="••••••••" />
            </div>
            <div className="mt-3">
              <label className="label">Nouveau mot de passe</label>
              <input type="password" className="input" value={pwd.next} onChange={setPw('next')} placeholder="Min. 6 caractères" />
            </div>
            <div className="mt-3">
              <label className="label">Confirmer</label>
              <input type="password" className="input" value={pwd.confirm} onChange={setPw('confirm')} placeholder="••••••••" />
            </div>
            <button onClick={savePassword} disabled={saving} className="btn btn-ghost w-full justify-center mt-5 disabled:opacity-60">
              Changer le mot de passe
            </button>
          </div>

        </div>
      </div>
    </AppLayout>
  )
}