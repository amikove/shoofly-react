import { useState } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import Topbar from '../../components/layout/Topbar'
import { authAPI, usersAPI } from '../../api'
import { useAuth } from '../../context/AuthContext'
import { toast, Avatar, Stars } from '../../components/ui'

export default function OeilCompte() {
  const { user, updateUser } = useAuth()
  const [saving, setSaving]  = useState(false)
  const [form, setForm]      = useState({
    first_name: user?.first_name || '',
    last_name:  user?.last_name  || '',
    phone:      user?.phone      || '',
    city:       user?.city       || '',
    zone:       user?.zone       || '',
    bio:        user?.bio        || '',
  })

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const save = async () => {
    setSaving(true)
    try {
      const { data } = await authAPI.update(form)
      updateUser(data.user)
      toast('Profil mis à jour ✓', 'success')
    } catch { toast('Erreur', 'error') }
    finally { setSaving(false) }
  }

  const requestWithdraw = () => toast('Fonctionnalité virement disponible bientôt', 'info')

  return (
    <AppLayout>
      <Topbar title="Mon profil" />
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* Profile */}
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
            <div className="mt-3"><label className="label">Zone de couverture</label><input className="input" value={form.zone} onChange={set('zone')} placeholder="Ex: Rabat, Agdal" /></div>
            <div className="mt-3"><label className="label">Bio</label><textarea className="input resize-none h-20" value={form.bio} onChange={set('bio')} placeholder="Décrivez votre expérience..." /></div>
            <button onClick={save} disabled={saving} className="btn btn-primary mt-5 disabled:opacity-60">
              {saving ? 'Sauvegarde...' : 'Enregistrer'}
            </button>
          </div>

          {/* Right column */}
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
              <h2 className="font-semibold text-sm mb-4">Disponibilités</h2>
              {['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map((j, i) => (
                <div key={j} className="flex items-center justify-between py-2 border-b border-white/10 last:border-0">
                  <span className="text-sm font-medium w-9">{j}</span>
                  <div className="flex items-center gap-2 flex-1 mx-3">
                    <input type="time" className="input py-1 px-2 text-xs max-w-[90px]" defaultValue={i < 5 ? '08:00' : '09:00'} />
                    <span className="text-[#AAA]">→</span>
                    <input type="time" className="input py-1 px-2 text-xs max-w-[90px]" defaultValue={i < 5 ? '20:00' : '14:00'} />
                  </div>
                  <div className={`w-8 h-4 rounded-full cursor-pointer transition-colors ${i < 6 ? 'bg-[#FF4D00]' : 'bg-[#333]'}`} />
                </div>
              ))}
              <button onClick={() => toast('Disponibilités enregistrées ✓', 'success')} className="btn btn-primary btn-sm mt-4">Enregistrer</button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
