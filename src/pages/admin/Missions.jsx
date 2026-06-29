import { useState, useEffect } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import Topbar from '../../components/layout/Topbar'
import { missionsAPI, adminAPI, usersAPI } from '../../api'
import { StatusBadge, Spinner, EmptyState, toast } from '../../components/ui'

export default function AdminMissions() {
  const [missions, setMissions]       = useState([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [status, setStatus]           = useState('')
  const [assignModal, setAssignModal] = useState(null)
  const [oeils, setOeils]             = useState([])
  const [selectedOeil, setSelectedOeil] = useState('')
  const [assigning, setAssigning]     = useState(false)
  const [oeilSearch, setOeilSearch]   = useState('')

  const load = () => {
    setLoading(true)
    missionsAPI.list({ search, status, admin: true })
      .then(({ data }) => setMissions(data.missions || []))
      .catch(() => toast('Erreur', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [search, status])

  const openAssign = async (mission) => {
    setAssignModal(mission)
    setSelectedOeil('')
    setOeilSearch('')
    try {
      const { data } = await usersAPI.oeils({ verified: true, limit: 50 })
      setOeils(data.oeils || [])
    } catch { toast('Erreur chargement Œils', 'error') }
  }

const doAssign = async () => {
    console.log('doAssign called', { selectedOeil, assignModal: assignModal?.id })
    if (!selectedOeil) { toast('Sélectionnez un Œil', 'error'); return }
    setAssigning(true)
    try {
      await missionsAPI.assignAdmin(assignModal.id, { oeil_id: selectedOeil })
      toast('Mission assignée ✓', 'success')
      setAssignModal(null)
      load()
    } catch (err) {
      toast(err.response?.data?.error || 'Erreur', 'error')
    } finally { setAssigning(false) }
  }

  const filteredOeils = oeils.filter(o => {
    const matchSearch = `${o.first_name} ${o.last_name} ${o.city}`.toLowerCase().includes(oeilSearch.toLowerCase())
    const matchCity = !assignModal?.city || o.city === assignModal.city
    return matchSearch && matchCity
  })

  const sameCity = oeils.filter(o => o.city === assignModal?.city)
  const otherCity = oeils.filter(o => o.city !== assignModal?.city)

  return (
    <AppLayout>
      <Topbar title="Toutes les missions" />
      <div className="p-6">

        {/* Missions prioritaires */}
        {missions.filter(m => m.is_priority).length > 0 && (
          <div className="rounded-xl border-2 border-red-500/40 bg-red-500/5 p-4 mb-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🔴</span>
              <h2 className="font-bold text-sm text-red-400 uppercase tracking-wider">Missions prioritaires</h2>
              <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {missions.filter(m => m.is_priority).length}
              </span>
            </div>
            <div className="space-y-2">
              {missions.filter(m => m.is_priority).map(m => (
                <div key={m.id} className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-sm">{m.title}</div>
                    <div className="text-xs text-[#AAA]">{m.client_name} · {m.city}</div>
                    {m.transfer_deadline && (
                      <div className="text-xs text-red-400 mt-0.5">
                        ⏱️ Expire à {new Date(m.transfer_deadline).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => openAssign(m)}
                    className="btn btn-sm bg-red-500 text-white hover:bg-red-600 flex-shrink-0"
                  >
                    Affecter →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

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
                  <tr><th>Réf</th><th>Mission</th><th>Client</th><th>Œil</th><th>Prix</th><th>Statut</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {missions.map((m) => (
                    <tr key={m.id}>
                      <td className="text-[#AAA] text-xs">
                        #{String(m.id).slice(-6).toUpperCase()}
                        {m.is_priority && <span className="ml-1 text-[9px] bg-red-500 text-white px-1 py-0.5 rounded font-bold">PRIORITÉ</span>}
                      </td>
                      <td className="font-medium">{m.title}</td>
                      <td className="text-[#AAA]">{m.client_name}</td>
                      <td>{m.oeil_name || '—'}</td>
                      <td className="text-green-400 font-semibold">{parseFloat(m.price).toFixed(0)} MAD</td>
                      <td><StatusBadge status={m.status} /></td>
                      <td>
                        {m.status === 'pending' && (
                          <button
                            onClick={() => openAssign(m)}
                            className="btn btn-ghost btn-sm text-[#FF4D00]"
                          >
                            Affecter
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal affectation manuelle */}
      {assignModal && (
        <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#181818] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#FF4D00]/10 flex items-center justify-center text-xl">📋</div>
              <div>
                <h2 className="font-bold text-base">Affectation manuelle</h2>
                <p className="text-xs text-[#AAA]">{assignModal.title}</p>
              </div>
            </div>

            <div className="bg-[#222] rounded-xl p-3 mb-4">
              <p className="text-xs text-[#AAA]">⚠️ À utiliser après confirmation téléphonique avec l'Œil. L'Œil sera immédiatement notifié.</p>
            </div>

            
            {/* Infos transfert si applicable */}
            {assignModal?.is_priority && assignModal?.transferred_from && (
              <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3 mb-4 space-y-1">
                <p className="text-xs font-semibold text-red-400">Mission transférée</p>
                {assignModal.transfer_reason && <p className="text-xs text-[#AAA]">Raison : {assignModal.transfer_reason}</p>}
                {assignModal.transfer_type && <p className="text-xs text-[#AAA]">Type : {assignModal.transfer_type === 'during' ? 'Pendant mission (50/50)' : 'Avant démarrage'}</p>}
                {assignModal.transfer_deadline && (
                  <p className="text-xs text-red-400">
                    ⏱️ Expire à {new Date(assignModal.transfer_deadline).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
            )}

            <div className="mb-4">
              <label className="label">
                Œils disponibles
                {assignModal?.city && <span className="ml-2 text-[#FF4D00] text-xs">📍 {assignModal.city} en priorité</span>}
              </label>
              <input
                className="input mb-2"
                placeholder="Rechercher par nom..."
                value={oeilSearch}
                onChange={e => setOeilSearch(e.target.value)}
              />
              <div className="max-h-56 overflow-y-auto space-y-1">
                {/* Même ville en premier */}
                {sameCity.filter(o => `${o.first_name} ${o.last_name}`.toLowerCase().includes(oeilSearch.toLowerCase())).length > 0 && (
                  <p className="text-[10px] text-[#555] uppercase tracking-wider px-1 mb-1">Même ville — {assignModal?.city}</p>
                )}
                {sameCity
                  .filter(o => `${o.first_name} ${o.last_name}`.toLowerCase().includes(oeilSearch.toLowerCase()))
                  .map(o => (
                  <div
                    key={o.id}
                    onClick={() => setSelectedOeil(o.id)}
                    className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                      selectedOeil === o.id
                        ? 'bg-[#FF4D00]/15 border border-[#FF4D00]/40'
                        : 'bg-[#222] hover:bg-[#2A2A2A]'
                    }`}
                  >
                    <div>
                      <div className="text-sm font-medium">{o.first_name} {o.last_name}</div>
                      <div className="text-xs text-[#AAA]">📍 {o.city} · ⭐ {o.rating_avg || '—'} · {o.total_missions || 0} missions</div>
                    </div>
                    {selectedOeil === o.id && <span className="text-[#FF4D00] text-sm">✓</span>}
                  </div>
                ))}

                {/* Autres villes */}
                {oeilSearch === '' && otherCity.length > 0 && (
                  <>
                    <p className="text-[10px] text-[#555] uppercase tracking-wider px-1 mt-2 mb-1">Autres villes</p>
                    {otherCity.map(o => (
                      <div
                        key={o.id}
                        onClick={() => setSelectedOeil(o.id)}
                        className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all opacity-60 ${
                          selectedOeil === o.id
                            ? 'bg-[#FF4D00]/15 border border-[#FF4D00]/40 opacity-100'
                            : 'bg-[#222] hover:bg-[#2A2A2A]'
                        }`}
                      >
                        <div>
                          <div className="text-sm font-medium">{o.first_name} {o.last_name}</div>
                          <div className="text-xs text-[#AAA]">📍 {o.city} · ⭐ {o.rating_avg || '—'} · {o.total_missions || 0} missions</div>
                        </div>
                        {selectedOeil === o.id && <span className="text-[#FF4D00] text-sm">✓</span>}
                      </div>
                    ))}
                  </>
                )}

                {filteredOeils.length === 0 && (
                  <p className="text-xs text-[#555] text-center py-4">Aucun Œil trouvé</p>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setAssignModal(null)} className="btn btn-ghost flex-1 justify-center">Annuler</button>
              <button
                onClick={doAssign}
                disabled={assigning || !selectedOeil}
                className="btn btn-primary flex-1 justify-center disabled:opacity-50"
              >
                {assigning ? '...' : 'Affecter cet Œil →'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}