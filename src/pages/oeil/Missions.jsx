import ChatModal from '../../components/missions/ChatModal'
import { useState, useEffect, useCallback } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import { VILLES } from '../../constants/villes'
import Topbar from '../../components/layout/Topbar'
import { missionsAPI, reportsAPI } from '../../api'
import { StatusBadge, Spinner, EmptyState, toast, Pagination } from '../../components/ui'
import { useNotif } from '../../context/NotifContext'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import MissionHistoryModal from '../../components/missions/MissionHistoryModal'
import MissionSummaryModal from '../../components/missions/MissionSummaryModal'
import ComplianceModal from '../../components/missions/ComplianceModal'

const TABS = [
  { id: 'priority',  label: 'Prioritaires' },
  { id: 'available', label: 'Disponibles'  },
  { id: 'active',    label: 'En cours'     },
  { id: 'done',      label: 'TerminÃ©es'    },
]
const TYPE_ICONS = { immobilier:'ðŸ ', file_attente:'â³', audit:'ðŸ”Ž', personnalisee:'ðŸŽ¯' }
export default function OeilMissions() {
  const [complianceMission, setComplianceMission] = useState(null)
  const [tab, setTab]             = useState('available')
  const [missions, setMissions]   = useState([])
  const [priorityMissions, setPriorityMissions] = useState([])
  const [counts, setCounts] = useState({ priority: 0, available: 0, active: 0, done: 0 })
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [chatMission, setChatMission] = useState(null)
  const navigate = useNavigate()
  const [quartier, setQuartier] = useState('')
  // Pagination (uniquement sur l'onglet "Disponibles")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const { pendingChatMissionId, clearPendingChat, getPending } = useNotif()
  const { user } = useAuth()
  const [historyMission, setHistoryMission] = useState(null)
  const [transferMission, setTransferMission] = useState(null)
  const [transferReason, setTransferReason] = useState('')
  const [transferring, setTransferring] = useState(false)
  const [reportMission, setReportMission] = useState(null)
  const [reportType, setReportType] = useState('')
  const [reportDesc, setReportDesc] = useState('')
  const [reporting, setReporting] = useState(false)
  const [assistanceMission, setAssistanceMission] = useState(null)
  const [assistanceView, setAssistanceView] = useState('choice') // 'choice' | 'problem' | 'transfer'

  const doReport = async () => {
    if (!reportType) { toast('SÃ©lectionnez un type de problÃ¨me', 'error'); return }
    setReporting(true)
    try {
      await missionsAPI.reportProblem(reportMission.id, { type: reportType, description: reportDesc })
      toast('ProblÃ¨me signalÃ© â€” l\'Ã©quipe Shoofly a Ã©tÃ© alertÃ©e', 'success')
      setReportMission(null)
      setReportType('')
      setReportDesc('')
      load(tab)
    } catch (err) {
      toast(err.response?.data?.error || 'Erreur', 'error')
    } finally { setReporting(false) }
  }

  const doTransfer = async () => {
    if (!transferReason) { toast('Veuillez sÃ©lectionner une raison', 'error'); return }
    setTransferring(true)
    try {
      await missionsAPI.transfer(transferMission.id, { reason: transferReason })
      toast('EmpÃªchement signalÃ© â€” mission remise en prioritÃ©', 'info')
      setTransferMission(null)
      setTransferReason('')
      load()
    } catch (err) {
      toast(err.response?.data?.error || 'Erreur', 'error')
    } finally { setTransferring(false) }
  }
  const [summaryMission, setSummaryMission] = useState(null)




  // Ouvrir le chat depuis une notification

useEffect(() => {
  const handler = (e) => {
    const id = e.detail
    if (id) {
      setTab('active')
      missionsAPI.get(id)
        .then(({ data }) => setChatMission(data.mission || data))
        .catch(() => {})
    }
  }
  window.addEventListener('shoofly-open-chat', handler)
  return () => window.removeEventListener('shoofly-open-chat', handler)
}, [])

const load = useCallback((t) => {
  setLoading(true)
  setError('')

  // Charger les compteurs de tous les onglets en parallÃ¨le
  Promise.all([
    missionsAPI.list({ mode: 'available', is_priority: true, limit: 100 }),
    missionsAPI.list({ mode: 'available', limit: 100 }),
    missionsAPI.list({ mode: 'mine', limit: 100 }),
    missionsAPI.list({ mode: 'mine', status: 'completed', limit: 100 }),
  ]).then(([prioRes, availRes, activeRes, doneRes]) => {
    const prio = (prioRes.data.missions || []).filter(m => m.is_priority)
    setPriorityMissions(prio)
    setCounts({
      priority:  prio.length,
      available: (availRes.data.missions || []).filter(m => !m.is_priority).length,
      active:    (activeRes.data.missions || []).filter(m => ['assigned','en_route','active'].includes(m.status)).length,
      done:      (doneRes.data.missions || []).length,
    })
  }).catch(() => {})

  let params = {}
  if (t === 'priority') {
    params = { mode: 'available', is_priority: true }
  } else if (t === 'available') {
      // Tri fixe par date d'exÃ©cution la plus proche (missions urgentes en premier)
      params = { mode: 'available', sort: 'scheduled_asc', page, limit: 20, ...(quartier ? { quartier } : {}) }
  } else if (t === 'active') {
      params = { mode: 'mine', limit: 100 } // AlignÃ© avec le compteur pour Ã©viter la troncature par dÃ©faut (limit=20)
  } else {
      params = { mode: 'mine', status: 'completed', limit: 100 } // AlignÃ© avec le compteur pour Ã©viter la troncature par dÃ©faut (limit=20)
  }
  return missionsAPI.list(params)
      .then(({ data }) => {
        if (t === 'available') setTotalPages(data.pages || 1)
        let ms = data.missions || []
        if (t === 'priority') {
        ms = ms.filter(m => m.is_priority)
      } else if (t === 'available') {
        ms = ms.filter(m => !m.is_priority)
      } else if (t === 'active') {
        ms = ms.filter((m) => ['assigned','en_route','active','sous_reclamation'].includes(m.status))
      }
      setMissions(ms)
    })
    .catch((err) => {
      const msg = err.response?.data?.error || 'Erreur de chargement'
      setError(msg)
      toast(msg, 'error')
    })
    .finally(() => setLoading(false))
}, [quartier, page])

  // Revenir Ã  la page 1 si le filtre quartier change (Ã©vite une page vide hors limites)
  useEffect(() => { setPage(1) }, [quartier])




 // refuser les missions par l'oeil

  useEffect(() => { load(tab) }, [tab, load])


  const refuse = async (id, isAvailable = false) => {
    try {
      await missionsAPI.refuse(id, isAvailable)
      setMissions((prev) => prev.filter((m) => m.id !== id))
      toast(isAvailable ? 'Mission ignorÃ©e' : 'Mission refusÃ©e', 'info')
    } catch {
      toast('Erreur', 'error')
    }
  }

const interest = async (id) => {
    if (!complianceMission) { setComplianceMission(id); return }
    setComplianceMission(null)
    try {
      await missionsAPI.interest(id)
      setMissions((prev) => prev.map((m) => m.id === id ? { ...m, interested: true } : m))
      toast('IntÃ©rÃªt exprimÃ© ðŸ‘ï¸ Le client va vous contacter.', 'success')
    } catch (err) {
      toast(err.response?.data?.error || 'Erreur', 'error')
    }
  }


const [complianceAdvance, setComplianceAdvance] = useState(null)

const advance = async (mission, bypassed = false) => {
  const next = {
    assigned: 'en_route',
    en_route: 'active',
    active:   'completed',
  }[mission.status]

    if (!next) { toast('Statut invalide', 'error'); return }

    // Afficher compliance quand l'Å’il passe en "en_route"
    if (next === 'en_route' && !bypassed) {
      setComplianceAdvance(mission)
      return
    }

  const labels = {
    en_route:  'En route vers la mission âœ“',
    active:    'Mission dÃ©marrÃ©e âœ“',
    completed: 'Mission terminÃ©e ! Bien jouÃ© ðŸŽ‰',
  }

  // Bloquer si rapport obligatoire non soumis
  if (next === 'completed') {
    const isAudit  = mission.type === 'audit'
    const isAirbnb = ['airbnb','booking'].some(s => mission.subcategory?.toLowerCase().includes(s.toLowerCase()))

    if (isAudit || isAirbnb) {
      try {
        const { data: rData } = await reportsAPI.get(mission.id)

        if (!rData.report || !rData.report.submitted) {
          const url = isAudit
            ? `/oeil/missions/${mission.id}/audit`
            : `/oeil/missions/${mission.id}/rapport`
          toast('Vous devez soumettre le rapport avant de terminer la mission ðŸ“‹', 'error')
          setTimeout(() => navigate(url), 300)
          return
        }

      } catch {
        toast('Impossible de vÃ©rifier le rapport', 'error')
        return
      }
    }
  }

try {
    await missionsAPI.status(mission.id, { status: next })
    if (next === 'completed') {
      setMissions((prev) => prev.filter((m) => m.id !== mission.id))
      setTab('done')
      load('done')
    } else {
      setMissions((prev) => prev.map((m) => m.id === mission.id ? { ...m, status: next } : m))
    }
    toast(labels[next], 'success')
  } catch (err) {
    const msg = err.response?.data?.error || 'Erreur'
    toast(msg, 'error')
    if (msg.includes('rapport')) {
      const isAudit  = mission.type === 'audit'
      const isAirbnb = ['airbnb','booking'].some(s => mission.subcategory?.toLowerCase().includes(s.toLowerCase()))
      if (isAudit)  navigate(`/oeil/missions/${mission.id}/audit`)
      if (isAirbnb) navigate(`/oeil/missions/${mission.id}/rapport`)
    }
  }
}



  const emptyProps = {
    priority:  { icon:'ðŸŸ¢', title:'Aucune mission prioritaire', desc:'Toutes les missions sont couvertes.'           },
    available: { icon:'ðŸŽ¯', title:'Aucune mission disponible',  desc:'Toutes les missions ont Ã©tÃ© assignÃ©es. Revenez bientÃ´t !' },
    active:    { icon:'ðŸ“‹', title:'Aucune mission en cours',    desc:'Acceptez une mission pour commencer.'          },
    done:      { icon:'âœ…', title:'Aucune mission terminÃ©e',    desc:'Vos missions complÃ©tÃ©es apparaÃ®tront ici.'     },
  }

  const advanceLabel = {
    assigned: 'ðŸš— Je suis en route',
    en_route: 'â–¶ï¸ DÃ©marrer la mission',
    active:   'âœ“ Terminer la mission',
  }

  return (
    <AppLayout>
      <Topbar title="Missions" />
      <div className="p-4 md:p-6">
        <div className="flex gap-1 bg-[#222] rounded-xl p-1 w-fit mb-6 flex-wrap">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                tab === t.id ? 'bg-[#2A2A2A] text-white' : 'text-[#AAA] hover:text-white'
              }`}>
              {t.id === 'priority' && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
              {t.label}
              {t.id === 'priority' && counts.priority > 0 && (
                <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold">
                  {counts.priority}
                </span>
              )}
              {t.id !== 'priority' && counts[t.id] > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  tab === t.id
                    ? 'bg-[#FF4D00]/20 text-[#FF4D00]'
                    : 'bg-white/10 text-[#AAA]'
                }`}>
                  {counts[t.id]}
                </span>
              )}
            </button>
          ))}
        </div>
        {tab === 'priority' && (
  priorityMissions.length === 0 ? (
    <EmptyState icon="ðŸŸ¢" title="Aucune mission prioritaire" description="Toutes les missions sont couvertes." />
  ) : (
    <div className="space-y-3">
      <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3 mb-4">
        <p className="text-xs text-red-400 font-semibold">ðŸ”´ Ces missions nÃ©cessitent un Å’il de toute urgence</p>
        <p className="text-xs text-[#AAA] mt-0.5">L'Å’il prÃ©cÃ©dent a signalÃ© un empÃªchement â€” postulez rapidement.</p>
      </div>
      {priorityMissions.map((m) => (
        <div key={m.id} className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded font-bold">PRIORITÃ‰</span>
                <span className="font-semibold text-sm truncate">{m.title}</span>
              </div>
              <div className="text-xs text-[#AAA] space-y-0.5">
                <div>ðŸ“ {m.city} {m.quartier ? `Â· ${m.quartier}` : ''}</div>
                {m.scheduled_at && (
                  <div>ðŸ“… {new Date(m.scheduled_at).toLocaleDateString('fr-FR', { day:'numeric', month:'short' })} Ã  {new Date(m.scheduled_at).toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' })}</div>
                )}
                {m.transfer_deadline && (
                  <div className="text-red-400">â±ï¸ Expire Ã  {new Date(m.transfer_deadline).toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' })}</div>
                )}
              </div>
            </div>
            <div className="text-green-400 font-bold whitespace-nowrap text-sm">
              {parseFloat(m.oeil_earning || m.price).toFixed(0)} MAD
            </div>
          </div>
          <button
            onClick={() => user?.is_verified ? missionsAPI.interest(m.id).then(() => { toast('IntÃ©rÃªt exprimÃ© âœ“', 'success'); load(tab) }).catch(err => toast(err.response?.data?.error || 'Erreur', 'error')) : navigate('/oeil/verification-identite')}
            className="btn btn-sm w-full justify-center bg-red-500 text-white hover:bg-red-600"
          >
            âš¡ Je prends cette mission â†’
          </button>
        </div>
      ))}
    </div>
  )
)}    
    {tab === 'available' && (
      <div className="mb-4">
        <select
          className="input max-w-[200px]"
          value={quartier}
          onChange={(e) => setQuartier(e.target.value)}
        >
          <option value="">Tous les quartiers</option>
          {(VILLES[user?.city] || []).map((q) => (
            <option key={q} value={q}>{q}</option>
          ))}
        </select>
      </div>
    )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4 text-sm text-red-400">
            âŒ {error}
          </div>
        )}

        {tab !== 'priority' && (loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : missions.length === 0 ? (
          <EmptyState icon={emptyProps[tab].icon} title={emptyProps[tab].title} description={emptyProps[tab].desc} />
        ) : (
          <div className="space-y-3">
            {missions.map((m) => (
              <div key={m.id} className="card">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-11 h-11 bg-[#222] rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                      {TYPE_ICONS[m.type] || 'ðŸ“‹'}
                    </div>
                    <div className="min-w-0">
                      
                      <div className="font-semibold text-sm flex items-center gap-2 flex-wrap">
                        {m.title}
                        {m.is_urgent && <span className="badge badge-orange text-[10px]">ðŸš¨ Urgent</span>}
                        {m.under_surveillance && <span className="badge badge-red text-[10px]">âš ï¸ Sous surveillance</span>}
                      </div>

                      
                        <div className="text-xs text-[#AAA] mt-1 space-y-0.5">
                        <div className="flex flex-wrap gap-3">
                          <span>ðŸ“ {m.city}{m.quartier ? ` Â· ${m.quartier}` : ''}</span>
                          <span>ðŸ“… {m.scheduled_at ? `${new Date(m.scheduled_at).toLocaleDateString('fr-FR', { day:'numeric', month:'short', year:'numeric' })} Ã  ${new Date(m.scheduled_at).toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' })}` : 'â€”'}</span>
                          {m.client_name && <span>ðŸ‘¤ {m.client_name}</span>}
                          {tab !== 'available' && <StatusBadge status={m.status} validated={!!m.validated_at} role="oeil" />}
                        </div>
                        {m.address && <div>ðŸ  {m.address}</div>}
                        {m.description && <div className="text-[#666] line-clamp-2">ðŸ’¬ {m.description}</div>}
                      </div>
                      
                      {m.description && (
                        <p className="text-xs text-[#777] mt-1 line-clamp-1">{m.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">

                    <div className="text-green-400 font-bold text-base">{parseFloat(m.oeil_earning || m.price).toFixed(0)} MAD</div>
                    <div className="text-[11px] text-[#AAA]">votre gain</div>
                  </div>
                </div>

                <div className="flex gap-2 mt-4 pt-3 border-t border-white/10">
                  
                  {tab === 'available' && (
                      <>
                        <button
                          onClick={() => interest(m.id)}
                          disabled={m.interested || m.has_interested}
                          className="btn btn-sm flex-1 justify-center disabled:opacity-50 bg-green-500 text-white hover:bg-green-600"
                        >
                          {(m.interested || m.has_interested) ? 'âœ… Demande envoyÃ©e' : 'ðŸ‘ï¸ Je suis intÃ©ressÃ©'}
                        </button>
                        <button
                        onClick={() => refuse(m.id, true)}
                        className="btn btn-sm flex-1 justify-center bg-red-500 text-white hover:bg-red-600"
                      >
                        âœ• Ignorer
                      </button>


                      </>
                    )}

                  

                  {tab === 'active' && (
                    <>
                      <button onClick={() => setChatMission(m)} className="btn btn-ghost btn-sm">ðŸ’¬ Chat</button>
                      <button onClick={() => setHistoryMission(m)} className="btn btn-ghost btn-sm">ðŸ•</button>
                      

                        {['en_route','active'].includes(m.status) && ['airbnb','booking','Airbnb','Booking'].some(s => m.subcategory?.toLowerCase().includes(s.toLowerCase())) && (
                          <button onClick={() => navigate(`/oeil/missions/${m.id}/rapport`)} className="btn btn-ghost btn-sm">
                            ðŸ“‹ Rapport
                          </button>
                        )}
                        {['en_route','active'].includes(m.status) && m.type === 'audit' && (
                          <button onClick={() => navigate(`/oeil/missions/${m.id}/audit`)} className="btn btn-ghost btn-sm">
                            ðŸ“‹ Audit
                          </button>
                        )}

                      <button className="btn btn-ghost btn-sm">ðŸ“¸ Photos</button>
                      {advanceLabel[m.status] && (
                        <button onClick={() => advance(m)} className="btn btn-primary btn-sm flex-1 justify-center">
                          {advanceLabel[m.status]}
                        </button>
                      )}
                      {m.status === 'assigned' && (
                        <button onClick={() => refuse(m.id)} className="btn btn-ghost btn-sm text-red-400">
                          âœ• Refuser
                        </button>
                      )}
                    </>
                  )}
                  {tab === 'active' && ['assigned','en_route','active'].includes(m.status) && (
                    <button
                      onClick={() => setAssistanceMission(m)}
                      className="text-xs text-[#555] hover:text-orange-400 transition-colors mt-2 w-full text-center"
                    >
                      ðŸ†˜ Demander assistance
                    </button>
                  )}


                  {tab === 'done' && (
                    <button onClick={() => setSummaryMission(m)} className="btn btn-ghost btn-sm">ðŸ“„ RÃ©sumÃ©</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
        {tab === 'available' && <Pagination page={page} pages={totalPages} onPageChange={setPage} />}
      </div>
      {historyMission && (
        <MissionHistoryModal mission={historyMission} onClose={() => setHistoryMission(null)} />
      )}

      {assistanceMission && (
        <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#181818] border border-orange-500/30 rounded-2xl p-6 w-full max-w-md shadow-xl">

            {/* Choix initial */}
            {assistanceView === 'choice' && (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-xl">ðŸ†˜</div>
                  <div>
                    <h2 className="font-bold text-base">Demander assistance</h2>
                    <p className="text-xs text-[#AAA]">{assistanceMission.title}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <button
                    onClick={() => { setAssistanceView('problem'); setReportType(''); setReportDesc('') }}
                    className="w-full bg-[#222] hover:bg-[#2A2A2A] rounded-xl p-4 text-left transition-colors border border-white/5"
                  >
                    <p className="text-sm font-semibold text-orange-400 mb-1">âš ï¸ Signaler un problÃ¨me</p>
                    <p className="text-xs text-[#AAA]">Client irrespectueux, lieu dangereux, demande illÃ©gale...</p>
                  </button>
                  <button
                    onClick={() => { setAssistanceView('transfer'); setTransferReason('') }}
                    className="w-full bg-[#222] hover:bg-[#2A2A2A] rounded-xl p-4 text-left transition-colors border border-white/5"
                  >
                    <p className="text-sm font-semibold text-red-400 mb-1">ðŸš¨ EmpÃªchement majeur</p>
                    <p className="text-xs text-[#AAA]">Je ne peux pas effectuer cette mission</p>
                  </button>
                </div>
                <button onClick={() => setAssistanceMission(null)} className="btn btn-ghost w-full justify-center mt-4">Annuler</button>
              </>
            )}

            {/* Signaler un problÃ¨me */}
            {assistanceView === 'problem' && (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <button onClick={() => setAssistanceView('choice')} className="text-[#AAA] hover:text-white">â†</button>
                  <div>
                    <h2 className="font-bold text-base">Signaler un problÃ¨me</h2>
                    <p className="text-xs text-[#AAA]">{assistanceMission.title}</p>
                  </div>
                </div>
                <div className="mb-4">
                  <label className="label">Type de problÃ¨me *</label>
                  <select className="input" value={reportType} onChange={e => setReportType(e.target.value)}>
                    <option value="">SÃ©lectionner...</option>
                    <option value="Client irrespectueux / insultant">Client irrespectueux / insultant</option>
                    <option value="Client injoignable">Client injoignable</option>
                    <option value="Lieu dangereux">Lieu dangereux</option>
                    <option value="Demande illÃ©gale">Demande illÃ©gale</option>
                    <option value="Autre problÃ¨me">Autre problÃ¨me</option>
                  </select>
                </div>
                <div className="mb-5">
                  <label className="label">Description (optionnel)</label>
                  <textarea className="input resize-none h-20 w-full text-sm" placeholder="DÃ©crivez la situation..." value={reportDesc} onChange={e => setReportDesc(e.target.value)} />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setAssistanceView('choice')} className="btn btn-ghost flex-1 justify-center">Retour</button>
                  <button
                    onClick={async () => {
                      if (!reportType) { toast('SÃ©lectionnez un type', 'error'); return }
                      setReporting(true)
                      try {
                        await missionsAPI.reportProblem(assistanceMission.id, { type: reportType, description: reportDesc })
                        toast('ProblÃ¨me signalÃ© â€” Shoofly a Ã©tÃ© alertÃ© âœ“', 'success')
                        setAssistanceMission(null)
                        setAssistanceView('choice')
                        load(tab)
                      } catch (err) { toast(err.response?.data?.error || 'Erreur', 'error') }
                      finally { setReporting(false) }
                    }}
                    disabled={reporting || !reportType}
                    className="btn btn-sm flex-1 justify-center bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50"
                  >
                    {reporting ? '...' : 'Signaler â†’'}
                  </button>
                </div>
              </>
            )}

            {/* EmpÃªchement majeur */}
            {assistanceView === 'transfer' && (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <button onClick={() => setAssistanceView('choice')} className="text-[#AAA] hover:text-white">â†</button>
                  <div>
                    <h2 className="font-bold text-base">EmpÃªchement en cours de mission</h2>
                    <p className="text-xs text-[#AAA]">{assistanceMission.title}</p>
                  </div>
                </div>
                <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 mb-4">
                  <p className="text-xs text-white/80">Cette action est irrÃ©versible et rÃ©servÃ©e aux situations d'urgence rÃ©elle.</p>
                </div>
                <div className="bg-[#222] rounded-xl p-3 mb-4 space-y-1">
                  <p className="text-xs text-[#AAA]">ConsÃ©quences :</p>
                  {assistanceMission.status === 'assigned'
                    ? <p className="text-xs text-white/70">â€¢ Vous ne recevrez aucune rÃ©munÃ©ration</p>
                    : <>
                        <p className="text-xs text-white/70">â€¢ Vous recevrez 50% si un remplaÃ§ant est trouvÃ©</p>
                        <p className="text-xs text-white/70">â€¢ Cooldown 4 heures</p>
                      </>
                  }
                  <p className="text-xs text-white/70">â€¢ Cet incident sera notÃ© sur votre profil</p>
                </div>
                <div className="mb-5">
                  <label className="label">Raison (obligatoire)</label>
                  <select className="input" value={transferReason} onChange={e => setTransferReason(e.target.value)}>
                    <option value="">SÃ©lectionner une raison</option>
                    <option value="Urgence mÃ©dicale">Urgence mÃ©dicale</option>
                    <option value="Accident / incident">Accident / incident sur place</option>
                    <option value="ProblÃ¨me de sÃ©curitÃ©">ProblÃ¨me de sÃ©curitÃ©</option>
                    <option value="EmpÃªchement familial grave">EmpÃªchement familial grave</option>
                    <option value="Autre cas de force majeure">Autre cas de force majeure</option>
                  </select>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setAssistanceView('choice')} className="btn btn-ghost flex-1 justify-center">Retour</button>
                  <button
                    onClick={async () => {
                      if (!transferReason) { toast('SÃ©lectionnez une raison', 'error'); return }
                      setTransferring(true)
                      try {
                        await missionsAPI.transfer(assistanceMission.id, { reason: transferReason })
                        toast('EmpÃªchement signalÃ© â€” mission remise en prioritÃ©', 'info')
                        setAssistanceMission(null)
                        setAssistanceView('choice')
                        load(tab)
                      } catch (err) { toast(err.response?.data?.error || 'Erreur', 'error') }
                      finally { setTransferring(false) }
                    }}
                    disabled={transferring || !transferReason}
                    className="btn btn-sm flex-1 justify-center bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
                  >
                    {transferring ? '...' : 'Confirmer â†’'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

     
{summaryMission && (
  <MissionSummaryModal mission={summaryMission} onClose={() => setSummaryMission(null)} />
)}


  {complianceMission && (
    <ComplianceModal onAccept={() => interest(complianceMission)} />
  )}
  {complianceAdvance && (
    <ComplianceModal onAccept={() => { const m = complianceAdvance; setComplianceAdvance(null); advance(m, true) }} />
  )}

      {chatMission && (
        <ChatModal mission={chatMission} onClose={() => setChatMission(null)} />
      )}
    </AppLayout>
  )
}
