import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import Topbar from '../../components/layout/Topbar'
import { missionsAPI } from '../../api'
import { Spinner, toast, Pagination } from '../../components/ui'

const STATUS_TABS = [
  { id: 'open',        label: 'Ouverts',   color: 'text-red-400'    },
  { id: 'in_progress', label: 'En cours',  color: 'text-amber-400'  },
  { id: 'resolved',    label: 'Résolus',   color: 'text-green-400'  },
  { id: 'dismissed',   label: 'Ignorés',   color: 'text-[#555]'     },
]

// Type complet (backend) → mot court affiché dans le tableau
const TYPE_SHORT = {
  'Client irrespectueux / insultant': 'Irrespectueux',
  'Client injoignable': 'Injoignable',
  'Lieu dangereux': 'Dangereux',
  'Demande illégale': 'Illégale',
  'Autre problème': 'Autre',
}

const typeColor = (type) => {
  if (type.includes('dangereux') || type.includes('illégale') || type.includes('insultant')) return 'text-red-400'
  if (type.includes('répond') || type.includes('place') || type.includes('injoignable')) return 'text-amber-400'
  return 'text-orange-400'
}

export default function AdminProblemes() {
  const navigate = useNavigate()
  const [reports, setReports]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [tab, setTab]           = useState('open')
  const [acting, setActing]     = useState({})
  const [noteModal, setNoteModal] = useState(null)
  const [adminNote, setAdminNote] = useState('')
  const [nextStatus, setNextStatus] = useState('resolved')
  const [selectedReport, setSelectedReport] = useState(null) // ligne cliquée, affiche le panneau détail

  // Pagination
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Filtres
  const [filterType, setFilterType] = useState('')
  const [filterCity, setFilterCity] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [availableCities, setAvailableCities] = useState([])

  // Tri sur la date d'exécution (colonne cliquable)
  const [sortByExecution, setSortByExecution] = useState(false)
  const [sortDir, setSortDir] = useState('asc')
  const [cancelModal, setCancelModal] = useState(null)
  const [cancelling, setCancelling] = useState(false)
  const [customAmount, setCustomAmount] = useState('')
  const [showCustomAmount, setShowCustomAmount] = useState(false)

  const doCancel = async (clientAtFault, refundAmount, refundPercent) => {
    setCancelling(true)
    try {
      const body = { status: 'cancelled' }
      if (refundPercent !== undefined) {
        body.refund_percent = refundPercent
      } else if (refundAmount !== undefined) {
        body.refund_amount = refundAmount
      } else {
        body.client_at_fault = clientAtFault
      }
      await missionsAPI.status(cancelModal.mission_id, body)
      toast('Mission annulée ✓', 'success')
      setCancelModal(null)
      setShowCustomAmount(false)
      setCustomAmount('')
      setSelectedReport(null)
      load()
    } catch (err) {
      toast(err.response?.data?.error || 'Erreur', 'error')
    } finally {
      setCancelling(false)
    }
  }
  const toggleExecutionSort = () => {
    if (!sortByExecution) { setSortByExecution(true); setSortDir('asc') }
    else if (sortDir === 'asc') { setSortDir('desc') }
    else { setSortByExecution(false) }
  }

  const load = () => {
    setLoading(true)
    const filters = {
      ...(filterType ? { type: filterType } : {}),
      ...(filterCity ? { city: filterCity } : {}),
      ...(filterRole ? { reporter_role: filterRole } : {}),
      ...(sortByExecution ? { sort: sortDir === 'asc' ? 'execution_asc' : 'execution_desc' } : {}),
    }
    missionsAPI.adminProblems(tab, page, filters)
      .then(({ data }) => {
        setReports(data.reports || [])
        setTotalPages(data.pages || 1)
        setAvailableCities(data.availableCities || [])
      })
      .catch(() => toast('Erreur chargement', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [tab, page, filterType, filterCity, filterRole, sortByExecution, sortDir])
  // Revenir à la page 1 si l'onglet ou un filtre change (évite une page vide hors limites)
  useEffect(() => { setPage(1) }, [tab, filterType, filterCity, filterRole])

  const resolve = async (id, status, note) => {
    setActing(a => ({ ...a, [id]: true }))
    try {
      await missionsAPI.resolveReport(id, { status, admin_note: note || null })
      toast(status === 'resolved' ? 'Ticket résolu ✓' : status === 'dismissed' ? 'Ticket ignoré' : 'Statut mis à jour', 'info')
      setNoteModal(null)
      setAdminNote('')
      setSelectedReport(null)
      load()
    } catch (err) {
      toast(err.response?.data?.error || 'Erreur', 'error')
    } finally { setActing(a => ({ ...a, [id]: false })) }
  }

  return (
    <AppLayout>
      <Topbar title="🚨 Problèmes en cours" />
      <div className="p-6 space-y-5">

        {/* Onglets statut */}
        <div className="flex gap-1 bg-[#222] rounded-xl p-1 w-fit">
          {STATUS_TABS.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setSelectedReport(null) }}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${tab === t.id ? 'bg-[#2A2A2A] text-white' : 'text-[#AAA] hover:text-white'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Filtres */}
        <div className="flex flex-wrap gap-3">
          <select className="input max-w-[200px]" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="">Tous les types</option>
            {Object.keys(TYPE_SHORT).map((t) => (
              <option key={t} value={t}>{TYPE_SHORT[t]}</option>
            ))}
          </select>
          <select className="input max-w-[180px]" value={filterCity} onChange={(e) => setFilterCity(e.target.value)}>
            <option value="">Toutes les villes</option>
            {availableCities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select className="input max-w-[180px]" value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
            <option value="">Tous les rapporteurs</option>
            <option value="client">Client</option>
            <option value="oeil">Œil</option>
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : reports.length === 0 ? (
          <div className="card text-center py-12 text-[#AAA]">✅ Aucun ticket dans cette catégorie</div>
        ) : (
          <>
            <div className="card p-0">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Réf</th>
                      <th>Type</th>
                      <th>Par</th>
                      <th>Rapporteur</th>
                      <th>Mission</th>
                      <th>Ville</th>
                      <th className="cursor-pointer select-none" onClick={toggleExecutionSort}>
                        Exécution {sortByExecution ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                      </th>
                      <th>Signalé le</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((r) => (
                      <tr key={r.id} className="cursor-pointer" onClick={() => setSelectedReport(r)}>
                        <td className="text-[#555] text-xs">#{String(r.mission_id).slice(-6).toUpperCase()}</td>
                        <td className={`font-medium ${typeColor(r.type)}`}>{TYPE_SHORT[r.type] || r.type}</td>
                        <td>
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#333] text-[#AAA] text-[10px] font-semibold">
                            {r.reporter_role === 'client' ? 'C' : 'O'}
                          </span>
                        </td>
                        <td>{r.reporter_first} {r.reporter_last}</td>
                        <td className="text-[#AAA]">{r.mission_title}</td>
                        <td className="text-[#AAA]">{r.city}</td>
                        <td className="text-[#AAA]">{r.scheduled_at ? new Date(r.scheduled_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '—'}</td>
                        <td className="text-xs text-[#555]">{new Date(r.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                        <td className="text-[#FF4D00] text-xs">Voir →</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <Pagination page={page} pages={totalPages} onPageChange={setPage} />
          </>
        )}

        {/* Panneau de détail (remplace les anciennes cartes) */}
        {selectedReport && (
          <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && setSelectedReport(null)}>
            <div className="bg-[#181818] border border-orange-500/30 rounded-2xl p-6 w-full max-w-lg shadow-xl">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <span className={`text-sm font-semibold ${typeColor(selectedReport.type)}`}>⚠️ {selectedReport.type}</span>
                  <p className="text-xs text-[#AAA] mt-1">
                    Signalé par{' '}
                    <span
                      className="text-white cursor-pointer hover:text-[#FF4D00] hover:underline"
                      onClick={(e) => { e.stopPropagation(); navigate(`/admin/users/${selectedReport.reporter_id}`) }}
                    >
                      {selectedReport.reporter_first} {selectedReport.reporter_last}
                    </span>
                    {' '}({selectedReport.reporter_role === 'client' ? 'Client' : 'Œil'})
                  </p>
                </div>
                <button onClick={() => setSelectedReport(null)} className="text-[#AAA] hover:text-white text-lg">✕</button>
              </div>

              <div className="bg-[#222] rounded-xl p-3 mb-3 space-y-1">
                <p className="text-xs font-semibold text-white">📋 {selectedReport.mission_title}</p>
                <p className="text-xs text-[#AAA]">📍 {selectedReport.city} · 📅 {selectedReport.scheduled_at ? new Date(selectedReport.scheduled_at).toLocaleDateString('fr-FR') : '—'}</p>
                <p className="text-xs text-[#AAA]">👥 Client : {selectedReport.client_first} {selectedReport.client_last} · 👁️ Œil : {selectedReport.oeil_first || '—'} {selectedReport.oeil_last || ''}</p>
              </div>

              {selectedReport.description && (
                <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-3 mb-3">
                  <p className="text-xs text-white/80">{selectedReport.description}</p>
                </div>
              )}

              {selectedReport.admin_note && (
                <div className="bg-[#222] rounded-xl p-3 mb-3">
                  <p className="text-[10px] text-[#555] mb-1">Note admin :</p>
                  <p className="text-xs text-[#AAA]">{selectedReport.admin_note}</p>
                </div>
              )}

              {(tab === 'open' || tab === 'in_progress') && (
                noteModal === selectedReport.id ? (
                  <div className="space-y-3 border-t border-white/10 pt-3">
                    <label className="label">Message pour le rapporteur (envoyé avec la décision)</label>
                    <textarea
                      className="input resize-none h-16 w-full text-sm"
                      placeholder="Ex : Nous avons pris contact avec le client concerné, merci pour votre signalement."
                      value={adminNote}
                      onChange={e => setAdminNote(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => resolve(selectedReport.id, nextStatus, adminNote)}
                        disabled={acting[selectedReport.id]}
                        className="btn btn-primary btn-sm disabled:opacity-50"
                      >
                        {acting[selectedReport.id] ? '...' : nextStatus === 'resolved' ? '✅ Marquer résolu' : nextStatus === 'in_progress' ? '🔄 Confirmer' : '🙈 Ignorer'}
                      </button>
                      <button onClick={() => { setNoteModal(null); setAdminNote('') }} className="btn btn-ghost btn-sm">Annuler</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2 border-t border-white/10 pt-3">
                    {tab === 'open' && (
                      <button onClick={() => { setNoteModal(selectedReport.id); setNextStatus('in_progress') }} className="btn btn-ghost btn-sm text-amber-400">
                        🔄 En cours
                      </button>
                    )}
                    <button onClick={() => { setNoteModal(selectedReport.id); setNextStatus('resolved') }} className="btn btn-primary btn-sm">
                      ✅ Résoudre
                    </button>
                    <button
                      onClick={() => resolve(selectedReport.id, 'dismissed', null)}
                      disabled={acting[selectedReport.id]}
                      className="btn btn-ghost btn-sm text-[#555] disabled:opacity-50"
                    >
                      {acting[selectedReport.id] ? '...' : '🙈 Ignorer'}
                    </button>
                    <button
                      onClick={() => setCancelModal(selectedReport)}
                      className="btn btn-ghost btn-sm text-red-400"
                    >
                      Annuler la mission
                    </button>
                    <button onClick={() => setSelectedReport(null)} className="btn btn-ghost btn-sm ml-auto">Fermer</button>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {cancelModal && (
          <div className="fixed inset-0 bg-black/80 z-[80] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-[#181818] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-xl">
              <h2 className="font-bold text-base mb-1">Annuler la mission</h2>
              <p className="text-xs text-[#AAA] mb-4">{cancelModal.mission_title}</p>

              {!showCustomAmount ? (
                <>
                  <p className="text-sm text-white/80 mb-4">
                    Cette annulation est-elle due à une faute du client (injoignable, comportement abusif, etc.) ?
                  </p>
                  <p className="text-xs text-[#555] mb-4">
                    Si oui, le remboursement suivra les règles habituelles (100%/50%/0% selon le délai). Si non, le client sera remboursé intégralement, quel que soit le délai.
                  </p>
                  <div className="flex gap-2 mb-2">
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
                  <button
                    onClick={() => setShowCustomAmount(true)}
                    className="btn btn-ghost w-full justify-center text-xs text-[#FF4D00]"
                  >
                    Définir un montant personnalisé
                  </button>
                </>
              ) : (
                <>
                  <label className="label">Pourcentage à rembourser au client (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="input w-full mb-4"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder="Ex: 30"
                  />
                  <p className="text-xs text-[#555] mb-4">
                    Prix de la mission : {cancelModal?.mission_price ? `${cancelModal.mission_price} MAD` : '—'}
                    {customAmount && cancelModal?.mission_price && (
                      <> → remboursement de {Math.round((parseFloat(customAmount) || 0) * cancelModal.mission_price / 100)} MAD</>
                    )}
                  </p>
                  <div className="flex gap-2 mb-2">
                    <button
                      onClick={() => doCancel(undefined, undefined, parseFloat(customAmount) || 0)}
                      disabled={cancelling || customAmount === ''}
                      className="btn btn-primary flex-1 justify-center disabled:opacity-50"
                    >
                      {cancelling ? '...' : 'Confirmer ce pourcentage'}
                    </button>
                  </div>
                  <button
                    onClick={() => setShowCustomAmount(false)}
                    className="btn btn-ghost w-full justify-center text-xs"
                  >
                    ← Retour
                  </button>
                </>
              )}

              <button
                onClick={() => { setCancelModal(null); setShowCustomAmount(false); setCustomAmount('') }}
                className="btn btn-ghost w-full justify-center mt-2 text-xs"
              >
                Fermer sans annuler
              </button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}