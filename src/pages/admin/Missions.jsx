import { useState, useEffect } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import Topbar from '../../components/layout/Topbar'
import { missionsAPI } from '../../api'
import { StatusBadge, Spinner, EmptyState, toast } from '../../components/ui'

export default function AdminMissions() {
  const [missions, setMissions] = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [status, setStatus]     = useState('')

  useEffect(() => {
    setLoading(true)
    missionsAPI.list({ search, status, admin: true })
      .then(({ data }) => setMissions(data.missions || []))
      .catch(() => toast('Erreur', 'error'))
      .finally(() => setLoading(false))
  }, [search, status])

  return (
    <AppLayout>
      <Topbar title="Toutes les missions" />
      <div className="p-6">
        <div className="flex flex-wrap gap-3 mb-5">
          <input className="input max-w-[220px]" placeholder="🔍 Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className="input max-w-[160px]" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Tous les statuts</option>
            <option value="active">Live</option>
            <option value="assigned">Assigné</option>
            <option value="pending">En attente</option>
            <option value="completed">Complétée</option>
            <option value="cancelled">Annulée</option>
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : missions.length === 0 ? (
          <EmptyState icon="📋" title="Aucune mission" description="Aucun résultat." />
        ) : (
          <div className="card p-0">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Réf</th><th>Mission</th><th>Client</th><th>Œil</th><th>Prix</th><th>Statut</th></tr>
                </thead>
                <tbody>
                  {missions.map((m) => (
                    <tr key={m.id}>
                      <td className="text-[#AAA] text-xs">#{String(m.id).slice(-6).toUpperCase()}</td>
                      <td className="font-medium">{m.title}</td>
                      <td className="text-[#AAA]">{m.client_name}</td>
                      <td>{m.oeil_name || '—'}</td>
                      <td className="text-green-400 font-semibold">{parseFloat(m.price).toFixed(0)} MAD</td>
                      <td><StatusBadge status={m.status} /></td>
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
