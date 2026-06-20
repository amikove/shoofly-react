import { useState } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import Topbar from '../../components/layout/Topbar'
import { toast } from '../../components/ui'

export default function AdminParametres() {
  const [params, setParams] = useState({ commission: 20, min_price: 80, urgency_fee: 30, accept_delay: 15 })
  const set = (k) => (e) => setParams((p) => ({ ...p, [k]: e.target.value }))

  return (
    <AppLayout>
      <Topbar title="Paramètres" />
      <div className="p-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="card">
            <h2 className="font-semibold text-sm mb-4">Tarification plateforme</h2>
            {[['Commission SHOOFLY (%)', 'commission'],['Tarif minimum (MAD)','min_price'],['Frais urgence (%)','urgency_fee'],['Délai acceptation (min)','accept_delay']].map(([label, key]) => (
              <div key={key} className="mb-3">
                <label className="label">{label}</label>
                <input type="number" className="input" value={params[key]} onChange={set(key)} />
              </div>
            ))}
            <button onClick={() => toast('Paramètres enregistrés ✓', 'success')} className="btn btn-primary mt-2">Enregistrer</button>
          </div>
          <div className="card">
            <h2 className="font-semibold text-sm mb-4">Villes couvertes</h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {['Rabat','Salé','Témara','Casablanca'].map((v) => (
                <span key={v} className="badge badge-blue cursor-pointer" onClick={() => toast(`${v} retiré`, 'info')}>{v} ✕</span>
              ))}
            </div>
            <div className="flex gap-2">
              <input className="input flex-1" placeholder="Ajouter une ville..." />
              <button onClick={() => toast('Ville ajoutée', 'success')} className="btn btn-primary btn-sm">Ajouter</button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
