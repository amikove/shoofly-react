import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import Topbar from '../../components/layout/Topbar'
import { missionsAPI, adminAPI } from '../../api'
import { StatusBadge, Spinner, EmptyState, toast, Pagination } from '../../components/ui'

export default function AdminMissions() {
 const navigate = useNavigate()
 const location = useLocation()
 const [missions, setMissions]       = useState([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState(location.state?.search || '')
  const [status, setStatus]           = useState('')
  const [tab, setTab]                 = useState('all') // 'all' | 'priority'
  const [assignModal, setAssignModal] = useState(null)
    const [oeils, setOeils]             = useState([])
    const [selectedOeil, setSelectedOeil] = useState('')
    const [assigning, setAssigning]     = useState(false)
    const [cancelModal, setCancelModal] = useState(null)
    const [cancelling, setCancelling]   = useState(false)
    const [overrideWarningModal, setOverrideWarningModal] = useState(null) // { message, reason } à confirmer avant affectation forcée (suspendu/bloqué proactif, ou 409 réactif ex. cooldown de transfert)

    const doCancel = async (clientAtFault) => {
      setCancelling(true)
      try {
        await missionsAPI.status(cancelModal.id, { status: 'cancelled', client_at_fault: clientAtFault })
        toast('Mission annulée ✓', 'success')
        setCancelModal(null)
        load()
      } catch (err) {
        toast(err.response?.data?.error || 'Erreur', 'error')
      } finally {
        setCancelling(false)
      }
    }
  const [oeilSearch, setOeilSearch]   = useState('')
    // Pagination (Admin Missions, onglets "Toutes les missions" et "Priorité")
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    // Tri par colonne cliquable — envoyé au backend, plus de tri en mémoire sur la page courante
      const [sortBy, setSortBy] = useState(null)   // 'title' | 'client' | 'oeil' | 'price' | 'status' | 'scheduled' | 'deadline'
      const [sortDir, setSortDir] = useState('asc') // 'asc' | 'desc'
      const handleSort = (col) => {
        if (sortBy === col) {
          setSortDir(d => d === 'asc' ? 'desc' : 'asc')
        } else {
          setSortBy(col)
          setSortDir('asc')
        }
      }

  const load = () => {
        setLoading(true)
        const defaultSort = tab === 'priority' ? 'deadline_asc' : 'created_desc'
        const activeSort = sortBy ? `${sortBy}_${sortDir}` : defaultSort
        const params = tab === 'priority'
          ? { admin: true, is_priority: true, status: 'pending', sort: activeSort, page, limit: 20 }
          : { search, status, admin: true, sort: activeSort, page, limit: 20 }
        missionsAPI.list(params)
        .then(({ data }) => {
          setMissions(data.missions || [])
          setTotalPages(data.pages || 1)
        })
        .catch(() => toast('Erreur', 'error'))
        .finally(() => setLoading(false))
    }

    useEffect(() => { load() }, [search, status, tab, page, sortBy, sortDir])
    // Revenir à la page 1 si on change de recherche, statut ou onglet (évite une page vide hors limites)
    useEffect(() => { setPage(1) }, [search, status, tab])

  const openAssign = async (mission) => {
    setAssignModal(mission)
    setSelectedOeil('')
    setOeilSearch('')
    try {
      const { data } = await missionsAPI.assignableOeils(mission.id)
      setOeils(data.oeils || [])
    } catch { toast('Erreur chargement Œils', 'error') }
  }

const doAssign = async (overrideWarning = false, overrideReason = '') => {
      if (!selectedOeil) { toast('Sélectionnez un Œil', 'error'); return }
      setAssigning(true)
      try {
        await missionsAPI.assignAdmin(assignModal.id, {
          oeil_id: selectedOeil,
          override_warning: overrideWarning,
          override_reason: overrideReason || undefined,
        })
        toast('Mission assignée ✓', 'success')
        setAssignModal(null)
        load()
      } catch (err) {
        if (err.response?.status === 409 && err.response?.data?.requires_confirmation) {
          setAssigning(false)
          setOverrideWarningModal({ message: err.response.data.error, reason: overrideReason })
          return
        }
      console.error('Assign error:', err)
      toast(err.response?.data?.error || err.message || 'Erreur', 'error')
    } finally { setAssigning(false) }
  }

  // Priorité d'affichage (état le plus sévère en premier), même logique que le badge
  // déjà ajouté dans AdminFiabilite.jsx (commit 0684179) : is_active=false > is_suspended >
  // is_verified=false > is_available=false > conflit de créneau > éligible. Les 2 premiers
  // sont overridable (confirmation admin) ; les 3 suivants ne le sont jamais (bouton désactivé).
  const oeilEligibility = (o) => {
    if (!o.is_active) return { severity: 'blocked', badgeClass: 'badge-red', label: '🚫 Bloqué (anti-fraude)' }
    if (o.is_suspended) return { severity: 'blocked', badgeClass: 'badge-red', label: 'Suspendu', reason: o.suspended_reason }
    if (!o.is_verified) return { severity: 'ineligible', badgeClass: 'badge-yellow', label: 'Non vérifié', explain: "Cet Œil n'est pas encore vérifié — impossible de l'assigner." }
    if (!o.is_available) return { severity: 'ineligible', badgeClass: 'badge-yellow', label: 'Indisponible', explain: "Cet Œil n'est pas disponible actuellement — impossible de l'assigner." }
    if (o.has_schedule_conflict) return { severity: 'ineligible', badgeClass: 'badge-yellow', label: 'Conflit de créneau', explain: 'Cet Œil a déjà une mission sur ce créneau — impossible de l\'assigner.' }
    return { severity: 'ok', badgeClass: 'badge-green', label: 'Disponible' }
  }

  // Message de confirmation proactif (avant tout appel réseau) — même style que les phrases
  // jointes côté serveur pour le 409 réactif (missions.js, POST /:id/assign-admin).
  const buildOverrideMessage = (o) => {
    const reasons = []
    if (!o.is_active) reasons.push('bloqué pour anti-fraude')
    if (o.is_suspended) reasons.push(o.suspended_reason ? `suspendu (raison : ${o.suspended_reason})` : 'suspendu')
    return `Cet Œil est ${reasons.join(' et ')}. Assigner quand même ?`
  }

  const handleAssignClick = () => {
    if (!selectedOeil) { toast('Sélectionnez un Œil', 'error'); return }
    const o = oeils.find(x => x.id === selectedOeil)
    const elig = o ? oeilEligibility(o) : null
    if (elig?.severity === 'blocked') {
      setOverrideWarningModal({ message: buildOverrideMessage(o), reason: '' })
      return
    }
    doAssign(false)
  }

  const filteredOeils = oeils.filter(o => {
    const matchSearch = `${o.first_name} ${o.last_name} ${o.city}`.toLowerCase().includes(oeilSearch.toLowerCase())
    const matchCity = !assignModal?.city || o.city === assignModal.city
    return matchSearch && matchCity
  })

  const sameCity = oeils.filter(o => o.city === assignModal?.city)
  const otherCity = oeils.filter(o => o.city !== assignModal?.city)
  const selectedOeilData = oeils.find(o => o.id === selectedOeil)
  const selectedElig = selectedOeilData ? oeilEligibility(selectedOeilData) : null

  return (
    <AppLayout>
      <Topbar title="Toutes les missions" />
      <div className="p-6">

        {/* Missions prioritaires */}
        {missions.filter(m => m.is_priority && m.status === 'pending').length > 0 && (
          <div className="rounded-xl border-2 border-red-500/40 bg-red-500/5 p-4 mb-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🔴</span>
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
        )}

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : missions.length === 0 ? (
          <EmptyState icon="📋" title="Aucune mission" description="Aucun résultat." />
        ) : (
          <div className="card p-0">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Réf</th>
                    <th className="cursor-pointer select-none" onClick={() => handleSort('title')}>Mission {sortBy === 'title' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</th>
                    <th className="cursor-pointer select-none" onClick={() => handleSort('client')}>Client {sortBy === 'client' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</th>
                    <th className="cursor-pointer select-none" onClick={() => handleSort('oeil')}>Œil {sortBy === 'oeil' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</th>
                    <th className="cursor-pointer select-none" onClick={() => handleSort('price')}>Prix {sortBy === 'price' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</th>
                    {tab === 'priority' && (
                        <>
                          <th className="cursor-pointer select-none" onClick={() => handleSort('scheduled')}>Exécution {sortBy === 'scheduled' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</th>
                          <th className="cursor-pointer select-none" onClick={() => handleSort('deadline')}>Deadline {sortBy === 'deadline' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</th>
                        </>
                      )}
                    <th className="cursor-pointer select-none" onClick={() => handleSort('status')}>Statut {sortBy === 'status' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {missions.map((m) => (
                    <tr key={m.id}>
                      <td className="text-[#AAA] text-xs">
                        #{String(m.id).slice(-6).toUpperCase()}
                        {m.is_priority && <span className="ms-1 text-[9px] bg-red-500 text-white px-1 py-0.5 rounded font-bold">PRIORITÉ</span>}
                      </td>
                      <td className="font-medium">{m.title}</td>
                      <td className="text-[#AAA]">
                        <span className="cursor-pointer hover:text-[#FF4D00] hover:underline" onClick={() => navigate(`/admin/users/${m.client_id}`)}>
                          {m.client_name}
                        </span>
                      </td>
                      <td>
                        {m.oeil_id
                          ? <span className="cursor-pointer hover:text-[#FF4D00] hover:underline" onClick={() => navigate(`/admin/users/${m.oeil_id}`)}>{m.oeil_name}</span>
                          : '—'}
                      </td>
                      <td className="text-green-400 font-semibold">{parseFloat(m.price).toFixed(0)} MAD</td>
                        {tab === 'priority' && (
                          <>
                            <td className="text-xs">
                              {m.scheduled_at
                                ? new Date(m.scheduled_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                                : '—'}
                            </td>
                            <td className="text-xs text-red-400">
                              {m.transfer_deadline
                                ? new Date(m.transfer_deadline).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                                : '—'}
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
                          {['pending', 'assigned', 'en_route', 'active'].includes(m.status) && (
                            <button
                              onClick={() => setCancelModal(m)}
                              className="btn btn-ghost btn-sm text-red-400"
                            >
                              Annuler
                            </button>
                          )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
              <Pagination page={page} pages={totalPages} onPageChange={setPage} />
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
                {assignModal?.city && <span className="ms-2 text-[#FF4D00] text-xs">📍 {assignModal.city} en priorité</span>}
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
                  .map(o => {
                    const elig = oeilEligibility(o)
                    return (
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
                      <div className="text-sm font-medium flex items-center gap-2 flex-wrap">
                        <span>{o.first_name} {o.last_name}</span>
                        <span className={`badge ${elig.badgeClass}`}>{elig.label}</span>
                      </div>
                      <div className="text-xs text-[#AAA]">📍 {o.city} · ⭐ {o.rating_avg || '—'} · {o.total_missions || 0} missions</div>
                      {elig.reason && <div className="text-[10px] text-[#777] mt-0.5">Raison : {elig.reason}</div>}
                    </div>
                    {selectedOeil === o.id && <span className="text-[#FF4D00] text-sm">✓</span>}
                  </div>
                    )
                  })}

                {/* Autres villes */}
                {oeilSearch === '' && otherCity.length > 0 && (
                  <>
                    <p className="text-[10px] text-[#555] uppercase tracking-wider px-1 mt-2 mb-1">Autres villes</p>
                    {otherCity.map(o => {
                      const elig = oeilEligibility(o)
                      return (
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
                          <div className="text-sm font-medium flex items-center gap-2 flex-wrap">
                            <span>{o.first_name} {o.last_name}</span>
                            <span className={`badge ${elig.badgeClass}`}>{elig.label}</span>
                          </div>
                          <div className="text-xs text-[#AAA]">📍 {o.city} · ⭐ {o.rating_avg || '—'} · {o.total_missions || 0} missions</div>
                          {elig.reason && <div className="text-[10px] text-[#777] mt-0.5">Raison : {elig.reason}</div>}
                        </div>
                        {selectedOeil === o.id && <span className="text-[#FF4D00] text-sm">✓</span>}
                      </div>
                      )
                    })}
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
                onClick={handleAssignClick}
                disabled={assigning || !selectedOeil || selectedElig?.severity === 'ineligible'}
                title={selectedElig?.severity === 'ineligible' ? selectedElig.explain : undefined}
                className="btn btn-primary flex-1 justify-center disabled:opacity-50"
              >
                {assigning ? '...' : 'Affecter cet Œil →'}
              </button>
            </div>
            {selectedElig?.severity === 'ineligible' && (
              <p className="text-xs text-[#F5C842] mt-2">{selectedElig.explain}</p>
            )}
          </div>
        </div>
      )}

      {cancelModal && (
        <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#181818] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="font-bold text-base mb-1">Annuler la mission</h2>
            <p className="text-xs text-[#AAA] mb-4">{cancelModal.title}</p>

            <p className="text-sm text-white/80 mb-4">
              Cette annulation est-elle due à une faute du client (injoignable, comportement abusif, etc.) ?
            </p>
            <p className="text-xs text-[#555] mb-4">
              Si oui, le remboursement suivra les règles habituelles (100%/50%/0% selon le délai). Si non, le client sera remboursé intégralement, quel que soit le délai.
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => doCancel(true)}
                disabled={cancelling}
                className="btn btn-ghost flex-1 justify-center text-amber-400 disabled:opacity-50"
              >
                {cancelling ? '...' : 'Oui, faute du client'}
              </button>
              <button
                onClick={() => doCancel(false)}
                disabled={cancelling}
                className="btn btn-primary flex-1 justify-center disabled:opacity-50"
              >
                {cancelling ? '...' : 'Non, rembourser 100%'}
              </button>
            </div>
            <button onClick={() => setCancelModal(null)} className="btn btn-ghost w-full justify-center mt-2 text-xs">
              Fermer sans annuler
            </button>
          </div>
        </div>
      )}

      {overrideWarningModal && (
        <div className="fixed inset-0 bg-black/80 z-[90] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#181818] border border-amber-500/30 rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">⚠️</span>
              <h2 className="font-bold text-base">Confirmation requise</h2>
            </div>
            <p className="text-sm text-white/80 mb-4">{overrideWarningModal.message}</p>
            <div className="mb-5">
              <label className="label">Raison de l'override (optionnel)</label>
              <textarea
                className="input"
                rows={2}
                value={overrideWarningModal.reason}
                onChange={(e) => setOverrideWarningModal(m => ({ ...m, reason: e.target.value }))}
                placeholder="Ex : mission urgente, aucun autre candidat disponible..."
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { const reason = overrideWarningModal.reason; setOverrideWarningModal(null); doAssign(true, reason) }}
                className="btn btn-primary flex-1 justify-center"
              >
                Confirmer quand même
              </button>
              <button
                onClick={() => setOverrideWarningModal(null)}
                className="btn btn-ghost flex-1 justify-center"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}