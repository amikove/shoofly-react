import RateModal from '../../components/missions/RateModal'
import { useState, useEffect } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import Topbar from '../../components/layout/Topbar'
import { missionsAPI } from '../../api'
import { StatusBadge, Spinner, EmptyState, toast } from '../../components/ui'
import NewMissionModal from '../../components/missions/NewMissionModal'

const TYPE_ICONS = { immobilier:'🏠', file_attente:'⏳', audit:'🔎', personnalisee:'🎯' }

export default function ClientMissions() {
  const [missions, setMissions] = useState([])
  const [loading, setLoading]   = useState(true)
  const [showNew, setShowNew]   = useState(false)
  const [ratingMission, setRatingMission] = useState(null)
  const [search, setSearch]     = useState('')
  const [statusFilter, setStatus] = useState('')
  const [typeFilter, setType]   = useState('')

  const load = () => {
    setLoading(true)
    missionsAPI.list({ search, status: statusFilter, type: typeFilter })
      .then(({ data }) => setMissions(data.missions || []))
      .catch(() => toast('Erreur de chargement', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [search, statusFilter, typeFilter])

  const cancel = async (id) => {
    if (!confirm('Confirmer l\'annulation ?')) return
    try {
      await missionsAPI.status(id, { status: 'cancelled' })
      setMissions((ms) => ms.map((m) => m.id === id ? { ...m, status: 'cancelled' } : m))
      toast('Mission annulée', 'info')
    } catch { toast('Erreur', 'error') }
  }

  return (
    <AppLayout>
      <Topbar title="Mes missions" actions={
        <button onClick={() => setShowNew(true)} className="btn btn-primary btn-sm">+ Nouvelle mission</button>
      } />
      <div className="p-6">
        {/* Filtres */}
        <div className="flex flex-wrap gap-3 mb-5">
          <input className="input max-w-[220px]" placeholder="🔍 Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className="input max-w-[160px]" value={statusFilter} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Tous les statuts</option>
            <option value="active">Live</option>
            <option value="assigned">Assigné</option>
            <option value="pending">En attente</option>
            <option value="completed">Complétée</option>
            <option value="cancelled">Annulée</option>
          </select>
          <select className="input max-w-[160px]" value={typeFilter} onChange={(e) => setType(e.target.value)}>
            <option value="">Tous les types</option>
            <option value="immobilier">Immobilier</option>
            <option value="file_attente">File d'attente</option>
            <option value="audit">Audit</option>
            <option value="personnalisee">Personnalisée</option>
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : missions.length === 0 ? (
          <EmptyState icon="📋" title="Aucune mission trouvée" description="Créez votre première mission."
            action={<button onClick={() => setShowNew(true)} className="btn btn-primary">+ Nouvelle mission</button>} />
        ) : (
          <div className="card p-0">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Mission</th><th>Type</th><th>Œil</th>
                    <th>Date</th><th>Prix</th><th>Statut</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {missions.map((m) => (
                    <tr key={m.id}>
                      <td>
                        <div className="font-semibold">{m.title}</div>
                        <div className="text-[11px] text-[#AAA]">#{String(m.id).slice(-6).toUpperCase()}</div>
                      </td>
                      <td className="text-lg">{TYPE_ICONS[m.type] || '📋'}</td>
                      <td className="text-[#AAA]">{m.oeil_name || '—'}</td>
                      <td className="text-[#AAA] text-xs">{new Date(m.created_at).toLocaleDateString('fr-MA')}</td>
                      <td className="text-green-400 font-semibold">{parseFloat(m.price).toFixed(0)} MAD</td>
                      <td><StatusBadge status={m.status} /></td>
                      <td>
                        <div className="flex gap-1">
                          {['pending','assigned'].includes(m.status) && (
                            <button onClick={() => cancel(m.id)} className="btn btn-ghost btn-sm text-red-400">Annuler</button>
                          )}
                          
                          {m.status === 'completed' && (
  <button
    onClick={() => setRatingMission(m)}
    className="btn btn-ghost btn-sm"
  >
    ⭐ Noter
  </button>
)}

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

      <NewMissionModal open={showNew} onClose={() => setShowNew(false)} onCreated={(m) => {
        setMissions((ms) => [m, ...ms])
        toast('Mission créée ! 🎉', 'success')
      }} />

      {ratingMission && (
  <RateModal
    mission={ratingMission}
    onClose={() => setRatingMission(null)}
    onRated={() => { setRatingMission(null); load() }}
  />
)}

    </AppLayout>
  )
}
