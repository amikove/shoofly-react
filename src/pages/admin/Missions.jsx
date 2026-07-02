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
  const [tab, setTab]                 = useState('all') // 'all' | 'priority'
  const [assignModal, setAssignModal] = useState(null)
  const [oeils, setOeils]             = useState([])
  const [selectedOeil, setSelectedOeil] = useState('')
  const [assigning, setAssigning]     = useState(false)
  const [oeilSearch, setOeilSearch]   = useState('')
    // Tri par colonne cliquable (tableau Admin Missions)
    const [sortBy, setSortBy] = useState(null)   // 'title' | 'client_name' | 'oeil_name' | 'price' | 'status'
    const [sortDir, setSortDir] = useState('asc') // 'asc' | 'desc'
    const handleSort = (col) => {
      if (sortBy === col) {
        setSortDir(d => d === 'asc' ? 'desc' : 'asc')
      } else {
        setSortBy(col)
        setSortDir('asc')
      }
    }
    const sortedMissions = [...missions].sort((a, b) => {
      if (!sortBy) return 0
      let va = a[sortBy], vb = b[sortBy]
      if (sortBy === 'price') {
        va = parseFloat(va) || 0; vb = parseFloat(vb) || 0
      } else if (sortBy === 'scheduled_at' || sortBy === 'transfer_deadline') {
        // Dates : valeurs absentes toujours relÃ©guÃ©es en fin de liste, quel que soit le sens du tri
        va = va ? new Date(va).getTime() : Infinity
        vb = vb ? new Date(vb).getTime() : Infinity
      } else {
        va = (va || '').toString().toLowerCase(); vb = (vb || '').toString().toLowerCase()
      }
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })

  const load = () => {
    setLoading(true)
    const params = tab === 'priority'
        ? { admin: true, is_priority: true, status: 'pending', sort: 'deadline_asc' } // PrioritÃ© : deadline de transfert la plus proche en premier
        : { search, status, admin: true, sort: 'created_desc' } // Toutes missions : les plus rÃ©centes en premier
    missionsAPI.list(params)
      .then(({ data }) => setMissions(data.missions || []))
      .catch(() => toast('Erreur', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [search, status, tab])

  const openAssign = async (mission) => {
    setAssignModal(mission)
    setSelectedOeil('')
    setOeilSearch('')
    try {
      const { data } = await usersAPI.oeils({ verified: true, limit: 50 })
      setOeils(data.oeils || [])
    } catch { toast('Erreur chargement Å’ils', 'error') }
  }

const doAssign = async () => {
    console.log('doAssign called', { selectedOeil, assignModal: assignModal?.id })
    if (!selectedOeil) { toast('SÃ©lectionnez un Å’il', 'error'); return }
    setAssigning(true)
    try {
      await missionsAPI.assignAdmin(assignModal.id, { oeil_id: selectedOeil })
      toast('Mission assignÃ©e âœ“', 'success')
      setAssignModal(null)
      load()
} catch (err) {
      console.error('Assign error:', err)
      toast(err.response?.data?.error || err.message || 'Erreur', 'error')
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
        {missions.filter(m => m.is_priority && m.status === 'pending').length > 0 && (
          <div className="rounded-xl border-2 border-red-500/40 bg-red-500/5 p-4 mb-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">ðŸ”´</span>
              <h2 className="font-bold text-sm text-red-400 uppercase tracking-wider">Missions prioritaires</h2>
              <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {missions.filter(m => m.is_priority && m.status === 'pending').length}
              </span>
            </div>
            <div className="space-y-2">
              {missions.filter(m => m.is_priority && m.status === 'pending').map(m => (
                <div key={m.id} className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-sm">{m.title}</div>
                    <div className="text-xs text-[#AAA]">{m.client_name} Â· {m.city}</div>
                    {m.transfer_deadline && (
                      <div className="text-xs text-red-400 mt-0.5">
                        â±ï¸ Expire Ã  {new Date(m.transfer_deadline).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => openAssign(m)}
                    className="btn btn-sm bg-red-500 text-white hover:bg-red-600 flex-shrink-0"
                  >
                    Affecter â†’
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Onglets */}
        <div className="flex gap-1 bg-[#222] rounded-xl p-1 w-fit mb-5">
          <button onClick={() => setTab('all')}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${tab === 'all' ? 'bg-[#2A2A2A] text-white' : 'text-[#AAA] hover:text-white'}`}>
            Toutes les missions
          </button>
          <button onClick={() => setTab('priority')}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${tab === 'priority' ? 'bg-[#2A2A2A] text-white' : 'text-[#AAA] hover:text-white'}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            Prioritaires
            {missions.filter(m => m.is_priority && m.status === 'pending').length > 0 && tab !== 'priority' && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {missions.filter(m => m.is_priority && m.status === 'pending').length}
              </span>
            )}
          </button>
        </div>

        {tab === 'all' && (
          <div className="flex flex-wrap gap-3 mb-5">
            <input className="input max-w-[220px]" placeholder="ðŸ” Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <select className="input max-w-[160px]" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Tous les statuts</option>
              <option value="active">Live</option>
              <option value="assigned">AssignÃ©</option>
              <option value="pending">En attente</option>
              <option value="completed">ComplÃ©tÃ©e</option>
              <option value="cancelled">AnnulÃ©e</option>
            </select>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : missions.length === 0 ? (
          <EmptyState icon="ðŸ“‹" title="Aucune mission" description="Aucun rÃ©sultat." />
        ) : (
          <div className="card p-0">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>RÃ©f</th>
                    <th className="cursor-pointer select-none" onClick={() => handleSort('title')}>Mission {sortBy === 'title' ? (sortDir === 'asc' ? 'â–²' : 'â–¼') : ''}</th>
                    <th className="cursor-pointer select-none" onClick={() => handleSort('client_name')}>Client {sortBy === 'client_name' ? (sortDir === 'asc' ? 'â–²' : 'â–¼') : ''}</th>
                    <th className="cursor-pointer select-none" onClick={() => handleSort('oeil_name')}>Å’il {sortBy === 'oeil_name' ? (sortDir === 'asc' ? 'â–²' : 'â–¼') : ''}</th>
                    <th className="cursor-pointer select-none" onClick={() => handleSort('price')}>Prix {sortBy === 'price' ? (sortDir === 'asc' ? 'â–²' : 'â–¼') : ''}</th>
                    {tab === 'priority' && (
                        <>
                          <th className="cursor-pointer select-none" onClick={() => handleSort('scheduled_at')}>ExÃ©cution {sortBy === 'scheduled_at' ? (sortDir === 'asc' ? 'â–²' : 'â–¼') : ''}</th>
                          <th className="cursor-pointer select-none" onClick={() => handleSort('transfer_deadline')}>Deadline {sortBy === 'transfer_deadline' ? (sortDir === 'asc' ? 'â–²' : 'â–¼') : ''}</th>
                        </>
                      )}
                    <th className="cursor-pointer select-none" onClick={() => handleSort('status')}>Statut {sortBy === 'status' ? (sortDir === 'asc' ? 'â–²' : 'â–¼') : ''}</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedMissions.map((m) => (
                    <tr key={m.id}>
                      <td className="text-[#AAA] text-xs">
                        #{String(m.id).slice(-6).toUpperCase()}
                        {m.is_priority && <span className="ml-1 text-[9px] bg-red-500 text-white px-1 py-0.5 rounded font-bold">PRIORITÃ‰</span>}
                      </td>
                      <td className="font-medium">{m.title}</td>
                      <td className="text-[#AAA]">{m.client_name}</td>
                      <td>{m.oeil_name || 'â€”'}</td>
                      <td className="text-green-400 font-semibold">{parseFloat(m.price).toFixed(0)} MAD</td>
                        {tab === 'priority' && (
                          <>
                            <td className="text-xs">
                              {m.scheduled_at
                                ? new Date(m.scheduled_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                                : 'â€”'}
                            </td>
                            <td className="text-xs text-red-400">
                              {m.transfer_deadline
                                ? new Date(m.transfer_deadline).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                                : 'â€”'}
                            </td>
                          </>
                        )}
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
              <div className="w-10 h-10 rounded-xl bg-[#FF4D00]/10 flex items-center justify-center text-xl">ðŸ“‹</div>
              <div>
                <h2 className="font-bold text-base">Affectation manuelle</h2>
                <p className="text-xs text-[#AAA]">{assignModal.title}</p>
              </div>
            </div>

            <div className="bg-[#222] rounded-xl p-3 mb-4">
              <p className="text-xs text-[#AAA]">âš ï¸ Ã€ utiliser aprÃ¨s confirmation tÃ©lÃ©phonique avec l'Å’il. L'Å’il sera immÃ©diatement notifiÃ©.</p>
            </div>

            
            {/* Infos transfert si applicable */}
            {assignModal?.is_priority && assignModal?.transferred_from && (
              <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3 mb-4 space-y-1">
                <p className="text-xs font-semibold text-red-400">Mission transfÃ©rÃ©e</p>
                {assignModal.transfer_reason && <p className="text-xs text-[#AAA]">Raison : {assignModal.transfer_reason}</p>}
                {assignModal.transfer_type && <p className="text-xs text-[#AAA]">Type : {assignModal.transfer_type === 'during' ? 'Pendant mission (50/50)' : 'Avant dÃ©marrage'}</p>}
                {assignModal.transfer_deadline && (
                  <p className="text-xs text-red-400">
                    â±ï¸ Expire Ã  {new Date(assignModal.transfer_deadline).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
            )}

            <div className="mb-4">
              <label className="label">
                Å’ils disponibles
                {assignModal?.city && <span className="ml-2 text-[#FF4D00] text-xs">ðŸ“ {assignModal.city} en prioritÃ©</span>}
              </label>
              <input
                className="input mb-2"
                placeholder="Rechercher par nom..."
                value={oeilSearch}
                onChange={e => setOeilSearch(e.target.value)}
              />
              <div className="max-h-56 overflow-y-auto space-y-1">
                {/* MÃªme ville en premier */}
                {sameCity.filter(o => `${o.first_name} ${o.last_name}`.toLowerCase().includes(oeilSearch.toLowerCase())).length > 0 && (
                  <p className="text-[10px] text-[#555] uppercase tracking-wider px-1 mb-1">MÃªme ville â€” {assignModal?.city}</p>
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
                      <div className="text-xs text-[#AAA]">ðŸ“ {o.city} Â· â­ {o.rating_avg || 'â€”'} Â· {o.total_missions || 0} missions</div>
                    </div>
                    {selectedOeil === o.id && <span className="text-[#FF4D00] text-sm">âœ“</span>}
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
                          <div className="text-xs text-[#AAA]">ðŸ“ {o.city} Â· â­ {o.rating_avg || 'â€”'} Â· {o.total_missions || 0} missions</div>
                        </div>
                        {selectedOeil === o.id && <span className="text-[#FF4D00] text-sm">âœ“</span>}
                      </div>
                    ))}
                  </>
                )}

                {filteredOeils.length === 0 && (
                  <p className="text-xs text-[#555] text-center py-4">Aucun Å’il trouvÃ©</p>
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
                {assigning ? '...' : 'Affecter cet Å’il â†’'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
