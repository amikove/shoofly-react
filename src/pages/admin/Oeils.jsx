import { useState, useEffect } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import Topbar from '../../components/layout/Topbar'
import { adminAPI } from '../../api'
import { Spinner, EmptyState, Avatar, Stars, toast } from '../../components/ui'

export default function AdminOeils() {
  const [oeils, setOeils]   = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    adminAPI.users({ role: 'oeil' })
      .then(({ data }) => setOeils(data.users || []))
      .catch(() => toast('Erreur', 'error'))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const verify = async (id) => {
    try { await adminAPI.verifyOeil(id); load(); toast('Œil vérifié ✓', 'success') }
    catch { toast('Erreur', 'error') }
  }

  const toggle = async (id) => {
    try { await adminAPI.toggleActive(id); load(); toast('Statut modifié', 'info') }
    catch { toast('Erreur', 'error') }
  }

  return (
    <AppLayout>
      <Topbar title="Gestion des Œils" />
      <div className="p-6">
        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : oeils.length === 0 ? (
          <EmptyState icon="👁️" title="Aucun Œil" description="Aucun Œil enregistré." />
        ) : (
          <div className="card p-0">
            <div className="table-wrap">
              <table>
                <thead><tr><th>Œil</th><th>Ville</th><th>Statut</th><th>Missions</th><th>Note</th><th>Actions</th></tr></thead>
                <tbody>
                  {oeils.map((o) => (
                    <tr key={o.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <Avatar name={`${o.first_name} ${o.last_name}`} size={26} />
                          <span className="font-medium">{o.first_name} {o.last_name}</span>
                        </div>
                      </td>
                      <td className="text-[#AAA]">{o.city || '—'}</td>
                      <td>
                        <span className={`badge ${o.is_verified ? 'badge-green' : 'badge-yellow'}`}>
                          {o.is_verified ? '✓ Vérifié' : 'En attente'}
                        </span>
                      </td>
                      <td className="text-center">{o.total_missions || 0}</td>
                      <td>
                        {o.rating_avg ? (
                          <div className="flex items-center gap-1">
                            <Stars value={o.rating_avg} />
                            <span className="text-xs text-[#AAA]">{o.rating_avg}</span>
                          </div>
                        ) : '—'}
                      </td>
                      <td>
                        <div className="flex gap-1">
                          {!o.is_verified && <button onClick={() => verify(o.id)} className="btn btn-primary btn-sm">Valider</button>}
                          <button onClick={() => toggle(o.id)} className={`btn btn-ghost btn-sm ${o.is_active ? 'text-red-400' : 'text-green-400'}`}>
                            {o.is_active ? 'Suspendre' : 'Activer'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
