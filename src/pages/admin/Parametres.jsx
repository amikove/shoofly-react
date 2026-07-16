import { useState, useEffect } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import Topbar from '../../components/layout/Topbar'
import { adminAPI } from '../../api'
import { toast, Spinner } from '../../components/ui'

export default function AdminParametres() {
  const [params, setParams] = useState({ commission: 20, min_price: 80 })
  const [fiveStarBonusActive, setFiveStarBonusActive] = useState(false)
  const [fiveStarBonusPercent, setFiveStarBonusPercent] = useState(10)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)

  useEffect(() => {
    adminAPI.settings()
      .then(({ data }) => {
        const s = data.settings || {}
        setParams({
          commission:   parseFloat(s.commission || 0.20) * 100,
          min_price:    parseFloat(s.min_price   || 80),
        })
        setFiveStarBonusActive(s.five_star_bonus_active === 'true')
        setFiveStarBonusPercent(parseFloat(s.five_star_bonus_percent || 10))
      })
      .catch(() => toast('Erreur chargement', 'error'))
      .finally(() => setLoading(false))
  }, [])

  const set = (k) => (e) => setParams((p) => ({ ...p, [k]: e.target.value }))

  const save = async () => {
    setSaving(true)
    try {
      await adminAPI.saveSettings({
        commission:   parseFloat(params.commission) / 100,
        min_price:    parseFloat(params.min_price),
        five_star_bonus_active:  fiveStarBonusActive ? 'true' : 'false',
        five_star_bonus_percent: parseFloat(fiveStarBonusPercent),
      })
      toast('Paramètres enregistrés ✓', 'success')
    } catch { toast('Erreur sauvegarde', 'error') }
    finally { setSaving(false) }
  }

  if (loading) return <AppLayout><Topbar title="Paramètres" /><div className="flex justify-center py-20"><Spinner size="lg" /></div></AppLayout>

  return (
    <AppLayout>
      <Topbar title="Paramètres" />
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="font-semibold text-sm mb-4">Tarification plateforme</h2>
            {[
              ['Commission SHOOFLY (%)', 'commission', 'Ex: 20 pour 20%'],
              ['Tarif minimum (MAD)',    'min_price',   'Ex: 80'],
            ].map(([label, key, hint]) => (
              <div key={key} className="mb-3">
                <label className="label">{label}</label>
                <input type="number" className="input" value={params[key]} onChange={set(key)} />
                <p className="text-[11px] text-[#555] mt-1">{hint}</p>
              </div>
            ))}
            <button onClick={save} disabled={saving} className="btn btn-primary mt-2 disabled:opacity-60">
              {saving ? 'Sauvegarde...' : 'Enregistrer'}
            </button>
          </div>
          <div className="card">
            <h2 className="font-semibold text-sm mb-4">🎁 Campagne bonus qualité 5 étoiles</h2>
            <p className="text-[11px] text-[#555] mb-4">Bonus payé par Shoofly (non facturé au client) quand un client note une mission 5/5. Calculé sur le gain de l'Œil, pas sur le prix total de la mission.</p>
            <label className="flex items-center gap-2 mb-3 cursor-pointer">
              <input type="checkbox" checked={fiveStarBonusActive} onChange={(e) => setFiveStarBonusActive(e.target.checked)} />
              <span className="text-sm">{fiveStarBonusActive ? 'Campagne active' : 'Campagne inactive'}</span>
            </label>
            <div className="mb-3">
              <label className="label">Bonus (% du gain de l'Œil)</label>
              <input type="number" className="input" value={fiveStarBonusPercent} onChange={(e) => setFiveStarBonusPercent(e.target.value)} />
              <p className="text-[11px] text-[#555] mt-1">Ex: 10 pour 10% du gain de l'Œil</p>
            </div>
            <button onClick={save} disabled={saving} className="btn btn-primary mt-2 disabled:opacity-60">
              {saving ? 'Sauvegarde...' : 'Enregistrer'}
            </button>
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