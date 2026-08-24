import ChatModal from '../../components/missions/ChatModal'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import AppLayout from '../../components/layout/AppLayout'
import { VILLES } from '../../constants/villes'
import { translateLocation } from '../../constants/villesTranslations'
import Topbar from '../../components/layout/Topbar'
import { missionsAPI, reportsAPI, mediaAPI } from '../../api'
import { StatusBadge, Spinner, EmptyState, toast, Pagination, Stars } from '../../components/ui'
import { useNotif } from '../../context/NotifContext'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useSocket } from '../../context/SocketContext'
import MissionHistoryModal from '../../components/missions/MissionHistoryModal'
import MissionSummaryModal from '../../components/missions/MissionSummaryModal'
import RateClientModal from '../../components/missions/RateClientModal'
import ComplianceModal from '../../components/missions/ComplianceModal'
import AssistanceModal from '../../components/missions/AssistanceModal'
import MissionPhotosModal from '../../components/missions/MissionPhotosModal'
import { getChatAccessState } from '../../utils/chatAccess'
import { CASABLANCA_TZ } from '../../utils/casablancaTime'

const TABS = ['priority', 'available', 'active', 'done']
const TYPE_ICONS = { immobilier:'🏠', file_attente:'⏳', audit:'🔎', personnalisee:'🎯' }

const EDIT_FIELD_LABELS = {
  title: 'title', description: 'description', address: 'address',
  city: 'city', quartier: 'quartier', scheduled_at: 'scheduledAt',
  duration_est: 'duration',
}

function formatEditFieldValue(key, value, t) {
  if (value === null || value === undefined || value === '') return '—'
  if (key === 'scheduled_at') {
    return `${new Date(value).toLocaleDateString('fr-FR', { timeZone: CASABLANCA_TZ, day:'numeric', month:'short' })} ${t('oeilMissions.editRequest.at')} ${new Date(value).toLocaleTimeString('fr-FR', { timeZone: CASABLANCA_TZ, hour:'2-digit', minute:'2-digit' })}`
  }
  if (key === 'duration_est') return `${value} min`
  return String(value)
}


export default function OeilMissions() {
  const { t, i18n } = useTranslation()
  const [complianceMission, setComplianceMission] = useState(null)
  // Garde anti-double-clic pour la candidature ("Je suis intéressé", onglets normal + priorité) :
  // le ref est vérifié de façon synchrone (avant tout re-render) pour bloquer un 2e clic
  // pendant la requête en vol ; le Set en state pilote juste l'affichage désactivé/label.
  const submittingInterestRef = useRef(new Set())
  const [submittingInterestIds, setSubmittingInterestIds] = useState(() => new Set())
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
  const { pendingAction, clearPending } = useNotif()
  const { user } = useAuth()
  const { onEvent } = useSocket() || {}
  const [historyMission, setHistoryMission] = useState(null)
  const [assistanceMission, setAssistanceMission] = useState(null)
  const [bonusCampaign, setBonusCampaign] = useState({ active: false, percent: 0 })

  // ── Cascade de confirmation par lot (candidate-confirm / candidate-decline) ──
  const [candidateMission, setCandidateMission] = useState(null)
  const [candidateActing, setCandidateActing] = useState(null) // 'confirm' | 'decline' | null
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => { missionsAPI.fiveStarBonus().then(({ data }) => setBonusCampaign(data)).catch(() => {}) }, [])

  const [summaryMission, setSummaryMission] = useState(null)
  const [ratingClientMission, setRatingClientMission] = useState(null)




  // Ouvrir le chat depuis une notification

useEffect(() => {
  if (!pendingAction || pendingAction.type !== 'chat') return
  const id = pendingAction.missionId
  if (!id) { clearPending(); return }

  setTab('active')
  const openChat = (mission) => {
    if (getChatAccessState(mission) === 'expired') {
      toast(t('oeilMissions.toasts.chatClosed'), 'info')
      return
    }
    setChatMission(mission)
  }
  const found = missions.find((m) => m.id === id) || priorityMissions.find((m) => m.id === id)
  if (found) {
    openChat(found)
    clearPending()
  } else {
    missionsAPI.get(id)
      .then(({ data }) => openChat(data.mission || data))
      .catch(() => {})
      .finally(() => clearPending())
  }
}, [pendingAction, missions, priorityMissions])

  // Ouvrir la modale de confirmation de candidature depuis une notification (voir Topbar.jsx
  // handleClick, cas 'mission_view' + title_key 'candidateConfirmRequestTitle'). Toujours une
  // lecture fraîche via missionsAPI.get (pas de fallback sur missions/priorityMissions déjà
  // chargées, contrairement à l'effet chat ci-dessus) : candidate_window_ends_at doit refléter
  // l'état réel au moment où l'Œil décide de confirmer/décliner, jamais une valeur
  // potentiellement périmée d'un load() antérieur.
  useEffect(() => {
    if (!pendingAction || pendingAction.type !== 'candidate_confirm') return
    const id = pendingAction.missionId
    if (!id) { clearPending(); return }

    missionsAPI.get(id)
      .then(({ data }) => setCandidateMission(data.mission || data))
      .catch(() => toast(t('oeilMissions.toasts.genericError'), 'error'))
      .finally(() => clearPending())
    // clearPending/t volontairement hors dépendances (même schéma que l'effet chat ci-dessus) :
    // ne doit réagir qu'à pendingAction.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingAction])

  // Pousse la modale de confirmation en direct dès l'arrivée de la notification (socket), sans
  // attendre que l'Œil pense à ouvrir la cloche — la fenêtre de confirmation ne dure que
  // quelques minutes (candidate_confirmation_minutes). L'event 'notification' est déjà émis
  // individuellement au bon Œil par notify()/emitToUser (backend) et déjà utilisé ailleurs
  // (Topbar.jsx, badge de cloche) : ici on ne fait que réagir au même event.
  useEffect(() => {
    if (!onEvent) return
    const unsub = onEvent('notification', (notif) => {
      if (notif.title_key !== 'candidateConfirmRequestTitle' || !notif.mission_id) return
      missionsAPI.get(notif.mission_id)
        .then(({ data }) => setCandidateMission(data.mission || data))
        .catch(() => {})
    })
    return () => unsub?.()
  }, [onEvent])

  // Horloge du compte à rebours affiché dans la modale — ne tourne que pendant qu'elle est
  // ouverte (même granularité, 60s, que les autres décomptes du projet : client/Dashboard.jsx,
  // PresenceConfirmationBanner.jsx). Resync initiale différée via setTimeout(...,0) plutôt qu'un
  // appel synchrone dans le corps de l'effet, pour rester exacte dès l'ouverture sans dépendre
  // du premier tick de 60s.
  useEffect(() => {
    if (!candidateMission) return
    const tick = () => setNow(Date.now())
    const resync = setTimeout(tick, 0)
    const iv = setInterval(tick, 60000)
    return () => { clearTimeout(resync); clearInterval(iv) }
  }, [candidateMission])

const load = useCallback((t) => {
  setLoading(true)
  setError('')

  // Charger les compteurs de tous les onglets en parallèle
  Promise.all([
    missionsAPI.list({ mode: 'available', is_priority: true, limit: 200 }),
      missionsAPI.list({ mode: 'available', limit: 200 }),
      missionsAPI.list({ mode: 'mine', limit: 200 }),
      missionsAPI.list({ mode: 'mine', status: 'completed', limit: 200 }),
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
      // Tri fixe par date d'exécution la plus proche (missions urgentes en premier)
      params = { mode: 'available', sort: 'scheduled_asc', page, limit: 20, ...(quartier ? { quartier } : {}) }
  } else if (t === 'active') {
      params = { mode: 'mine', limit: 200 } // Aligné avec le compteur pour éviter la troncature par défaut (limit=20)
  } else {
      params = { mode: 'mine', status: 'completed', limit: 200 } // Aligné avec le compteur pour éviter la troncature par défaut (limit=20)
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
      const msg = err.response?.data?.error || t('oeilMissions.toasts.loadingError')
      setError(msg)
      toast(msg, 'error')
    })
    .finally(() => setLoading(false))
}, [quartier, page])

  // Revenir à la page 1 si le filtre quartier change (évite une page vide hors limites)
  useEffect(() => { setPage(1) }, [quartier])




 // refuser les missions par l'oeil

  useEffect(() => { load(tab) }, [tab, load])

  // Réconciliation au retour en ligne (scope limité à cet écran, voir RAPPORT_DIAGNOSTIC
  // §2d/recommandation 5) : recharge la liste de l'onglet actif quand le navigateur
  // redevient en ligne, sans attendre une action manuelle de l'Œil.
  useEffect(() => {
    const handleOnline = () => load(tab)
    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [tab, load])


  const approveEditRequest = async (editRequestId) => {
    try {
      await missionsAPI.approveEditRequest(editRequestId)
      toast(t('oeilMissions.editRequest.approvedToast'), 'success')
      load(tab)
    } catch (err) {
      toast(err.response?.data?.error || t('oeilMissions.toasts.genericError'), 'error')
    }
  }

  const rejectEditRequest = async (editRequestId) => {
    if (!window.confirm(t('oeilMissions.editRequest.rejectConfirm'))) return
    try {
      await missionsAPI.rejectEditRequest(editRequestId)
      toast(t('oeilMissions.editRequest.rejectedToast'), 'info')
      load(tab)
    } catch (err) {
      toast(err.response?.data?.error || t('oeilMissions.toasts.genericError'), 'error')
    }
  }

  const refuse = async (id) => {
    try {
      await missionsAPI.refuse(id, true)
      setMissions((prev) => prev.filter((m) => m.id !== id))
      toast(t('oeilMissions.toasts.missionIgnored'), 'info')
    } catch {
      toast(t('oeilMissions.toasts.genericError'), 'error')
    }
  }

  const setInterestSubmitting = (id, submitting) => {
    if (submitting) submittingInterestRef.current.add(id)
    else submittingInterestRef.current.delete(id)
    setSubmittingInterestIds((prev) => {
      const next = new Set(prev)
      if (submitting) next.add(id); else next.delete(id)
      return next
    })
  }

  // Recharge l'état réel d'UNE mission précise (pas toute la liste) après une erreur qui
  // pourrait masquer un succès serveur (RAPPORT_DIAGNOSTIC §2c) : si son statut a bougé,
  // on retire la carte et on informe l'Œil du vrai résultat plutôt que de le laisser deviner.
  const reconcileMission = useCallback((id) => {
    missionsAPI.get(id).then(({ data }) => {
      const fresh = data.mission || data
      if (fresh.status === 'pending') return // toujours candidatable : rien à corriger à l'écran
      const gotIt = fresh.oeil_id === user?.id
      setMissions((prev) => prev.filter((m) => m.id !== id))
      setPriorityMissions((prev) => prev.filter((m) => m.id !== id))
      toast(
        gotIt ? t('oeilMissions.toasts.missionReconciledAssignedToYou') : t('oeilMissions.toasts.missionReconciledGone'),
        gotIt ? 'success' : 'info'
      )
    }).catch((err) => {
      // 403 (assignée à quelqu'un d'autre) / 404 (introuvable) : même verdict que "plus pending"
      if (err.response?.status === 403 || err.response?.status === 404) {
        setMissions((prev) => prev.filter((m) => m.id !== id))
        setPriorityMissions((prev) => prev.filter((m) => m.id !== id))
        toast(t('oeilMissions.toasts.missionReconciledGone'), 'info')
      }
    })
  }, [user, t])

  // "Mission non disponible"/"Mission plus disponible" peut vouloir dire "attribuée
  // entretemps" (à vous ou à un autre Œil) autant qu'un vrai rejet — ce n'est jamais un
  // rejet de VOTRE candidature en tant que telle, donc on le traite comme un conflit d'état.
  const isStateConflictError = (err) => {
    if (!err.response) return false
    const msg = err.response.data?.error
    return err.response.status === 409 || msg === 'Mission non disponible' || msg === 'Mission plus disponible'
  }

  const handleInterestError = (err, id) => {
    if (!err.response) {
      // Timeout/coupure réseau : le serveur a peut-être terminé le traitement malgré tout
      // (RAPPORT_DIAGNOSTIC §2c) — message neutre en attendant la vérification plutôt
      // qu'une erreur affirmée à tort.
      toast(t('oeilMissions.toasts.networkErrorReconciling'), 'info')
      reconcileMission(id)
    } else if (isStateConflictError(err)) {
      // Pas de toast générique ici : reconcileMission affiche le verdict définitif, plus
      // rassurant qu'un texte d'erreur brut sur un cas qui n'est pas forcément un échec.
      reconcileMission(id)
    } else {
      toast(err.response?.data?.error || t('oeilMissions.toasts.genericError'), 'error')
    }
  }

  const interest = async (id) => {
    if (!complianceMission) { setComplianceMission(id); return }
    if (submittingInterestRef.current.has(id)) return
    setInterestSubmitting(id, true)
    try {
      await missionsAPI.interest(id)
      setMissions((prev) => prev.map((m) => m.id === id ? { ...m, interested: true } : m))
      toast(t('oeilMissions.toasts.interestExpressed'), 'success')
    } catch (err) {
      handleInterestError(err, id)
    } finally {
      setComplianceMission(null)
      setInterestSubmitting(id, false)
    }
  }

  // Équivalent de interest() pour l'onglet "priorité" (transferts) : pas de ComplianceModal
  // sur ce flux (déjà acceptée une première fois par l'Œil précédent), appel réseau direct.
  const interestPriority = async (id) => {
    if (submittingInterestRef.current.has(id)) return
    setInterestSubmitting(id, true)
    try {
      await missionsAPI.interest(id)
      toast(t('oeilMissions.toasts.interestExpressedShort'), 'success')
      load(tab)
    } catch (err) {
      handleInterestError(err, id)
    } finally {
      setInterestSubmitting(id, false)
    }
  }

  // Confirmation/déclin d'une sollicitation de lot (candidate-confirm / candidate-decline).
  // Le backend est seul juge de la validité (403 si plus sollicité, 409 si mission déjà
  // tranchée entretemps) : on ferme systématiquement la modale et on recharge l'onglet plutôt
  // que de deviner l'issue côté client — même logique de confiance que reconcileMission.
  const confirmCandidate = async () => {
    if (!candidateMission) return
    setCandidateActing('confirm')
    try {
      const { data } = await missionsAPI.candidateConfirm(candidateMission.id)
      toast(
        data.already_confirmed ? t('oeilMissions.toasts.candidateAlreadyConfirmed') : t('oeilMissions.toasts.candidateConfirmed'),
        'success'
      )
    } catch (err) {
      toast(err.response?.data?.error || t('oeilMissions.toasts.genericError'), 'error')
    } finally {
      setCandidateActing(null)
      setCandidateMission(null)
      load(tab)
    }
  }

  const declineCandidate = async () => {
    if (!candidateMission) return
    setCandidateActing('decline')
    try {
      await missionsAPI.candidateDecline(candidateMission.id)
      toast(t('oeilMissions.toasts.candidateDeclined'), 'info')
    } catch (err) {
      toast(err.response?.data?.error || t('oeilMissions.toasts.genericError'), 'error')
    } finally {
      setCandidateActing(null)
      setCandidateMission(null)
      load(tab)
    }
  }


const [complianceAdvance, setComplianceAdvance] = useState(null)
const [photosMission, setPhotosMission] = useState(null)

const advance = async (mission, bypassed = false) => {
  const next = {
    assigned: 'en_route',
    en_route: 'active',
    active:   'completed',
  }[mission.status]

    if (!next) { toast(t('oeilMissions.toasts.invalidStatus'), 'error'); return }

    // Afficher compliance quand l'Œil passe en "en_route"
    if (next === 'en_route' && !bypassed) {
      setComplianceAdvance(mission)
      return
    }

  const labels = {
    en_route:  t('oeilMissions.advanceStatusLabels.enRoute'),
    active:    t('oeilMissions.advanceStatusLabels.active'),
    completed: t('oeilMissions.advanceStatusLabels.completed'),
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
          toast(t('oeilMissions.toasts.reportRequiredBeforeComplete'), 'error')
          setTimeout(() => navigate(url), 300)
          return
        }

      } catch {
        toast(t('oeilMissions.toasts.cannotVerifyReport'), 'error')
        return
      }
    } else {
      // Mission standard : au moins 1 photo envoyée par l'Œil lui-même (preuve de
      // déplacement, PROMPT 4). Vérif préalable côté client en plus de la garde backend,
      // pour ouvrir directement la modale plutôt que de laisser échouer l'appel de statut.
      try {
        const { data: mData } = await mediaAPI.list(mission.id)
        const myPhotos = (mData.media || []).filter(m => m.type === 'photo' && m.uploader_id === user.id)
        if (myPhotos.length < 1) {
          toast(t('oeilMissions.toasts.photoRequiredBeforeComplete'), 'error')
          setPhotosMission(mission)
          return
        }
      } catch {
        toast(t('oeilMissions.toasts.cannotVerifyPhotos'), 'error')
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
    const msg = err.response?.data?.error || t('oeilMissions.toasts.genericError')
    toast(msg, 'error')
    if (msg.includes('rapport')) {
      const isAudit  = mission.type === 'audit'
      const isAirbnb = ['airbnb','booking'].some(s => mission.subcategory?.toLowerCase().includes(s.toLowerCase()))
      if (isAudit)  navigate(`/oeil/missions/${mission.id}/audit`)
      if (isAirbnb) navigate(`/oeil/missions/${mission.id}/rapport`)
    } else if (msg.includes('photo')) {
      setPhotosMission(mission)
    }
  }
}



  // Minutes restantes avant candidate_window_ends_at (délai pour confirmer sa disponibilité,
  // voir advanceCandidateCascade côté backend) — arrondi au-dessus pour ne jamais afficher
  // "0 min" tant qu'il reste ne serait-ce que quelques secondes.
  const candidateMinutesLeft = candidateMission?.candidate_window_ends_at
    ? Math.max(0, Math.ceil((new Date(candidateMission.candidate_window_ends_at).getTime() - now) / 60000))
    : null

  const emptyProps = {
    priority:  { icon:'🟢', title: t('oeilMissions.empty.priority.title'),  desc: t('oeilMissions.empty.priority.desc')  },
    available: { icon:'🎯', title: t('oeilMissions.empty.available.title'), desc: t('oeilMissions.empty.available.desc') },
    active:    { icon:'📋', title: t('oeilMissions.empty.active.title'),    desc: t('oeilMissions.empty.active.desc')    },
    done:      { icon:'✅', title: t('oeilMissions.empty.done.title'),      desc: t('oeilMissions.empty.done.desc')      },
  }

  const advanceLabel = {
    assigned: t('oeilMissions.advanceLabel.assigned'),
    en_route: t('oeilMissions.advanceLabel.enRoute'),
    active:   t('oeilMissions.advanceLabel.active'),
  }

  return (
    <AppLayout>
      <Topbar title={t('oeilMissions.title')} />
      <div className="p-4 md:p-6">
        <div className="flex gap-1 bg-[#222] rounded-xl p-1 w-fit mb-6 flex-wrap">
          {TABS.map((tabId) => (
            <button key={tabId} onClick={() => setTab(tabId)}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                tab === tabId ? 'bg-[#2A2A2A] text-white' : 'text-[#AAA] hover:text-white'
              }`}>
              {tabId === 'priority' && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
              {t(`oeilMissions.tabs.${tabId}`)}
              {tabId === 'priority' && counts.priority > 0 && (
                <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold">
                  {counts.priority}
                </span>
              )}
              {tabId !== 'priority' && counts[tabId] > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  tab === tabId
                    ? 'bg-[#FF4D00]/20 text-[#FF4D00]'
                    : 'bg-white/10 text-[#AAA]'
                }`}>
                  {counts[tabId]}
                </span>
              )}
            </button>
          ))}
        </div>
        {tab === 'priority' && (
  priorityMissions.length === 0 ? (
    <EmptyState icon="🟢" title={t('oeilMissions.empty.priority.title')} description={t('oeilMissions.empty.priority.desc')} />
  ) : (
    <div className="space-y-3">
      <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3 mb-4">
        <p className="text-xs text-red-400 font-semibold">{t('oeilMissions.priorityBanner.text')}</p>
        <p className="text-xs text-[#AAA] mt-0.5">{t('oeilMissions.priorityBanner.subtext')}</p>
      </div>
      {priorityMissions.map((m) => (
        <div key={m.id} className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded font-bold">{t('oeilMissions.priorityBanner.badge')}</span>
                <span className="font-semibold text-sm truncate">{m.title}</span>
              </div>
              <div className="text-xs text-[#AAA] space-y-0.5">
                <div>📍 {translateLocation(m.city, i18n.language)} {m.quartier ? `· ${translateLocation(m.quartier, i18n.language)}` : ''}</div>
                {m.scheduled_at && (
                  <div>📅 {new Date(m.scheduled_at).toLocaleDateString('fr-FR', { timeZone: CASABLANCA_TZ, day:'numeric', month:'short' })} à {new Date(m.scheduled_at).toLocaleTimeString('fr-FR', { timeZone: CASABLANCA_TZ, hour:'2-digit', minute:'2-digit' })}</div>
                )}
                {m.transfer_deadline && (
                  <div className="text-red-400">⏱️ Expire à {new Date(m.transfer_deadline).toLocaleTimeString('fr-FR', { timeZone: CASABLANCA_TZ, hour:'2-digit', minute:'2-digit' })}</div>
                )}
              </div>
            </div>
            <div className="text-green-400 font-bold whitespace-nowrap text-sm">
              {parseFloat(m.oeil_earning || m.price).toFixed(0)} MAD
            </div>
          </div>
          {bonusCampaign.active && (
            <div className="text-[11px] text-[#FF4D00] mb-2">
              {t('oeilDashboard.fiveStarBonusHint', { bonus: (parseFloat(m.oeil_earning || m.price) * bonusCampaign.percent / 100).toFixed(0) })}
            </div>
          )}
          <button
            onClick={() => user?.is_verified ? interestPriority(m.id) : navigate('/oeil/verification-identite')}
            disabled={submittingInterestIds.has(m.id)}
            className="btn btn-sm w-full justify-center bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
          >
            {submittingInterestIds.has(m.id) ? t('oeilMissions.priorityBanner.interestButtonSending') : t('oeilMissions.priorityBanner.interestButton')}
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
          <option value="">{t('oeilMissions.filters.allQuartiers')}</option>
          {(VILLES[user?.city] || []).map((q) => (
            <option key={q} value={q}>{translateLocation(q, i18n.language)}</option>
          ))}
        </select>
      </div>
    )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4 text-sm text-red-400">
            ❌ {error}
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
                      {TYPE_ICONS[m.type] || '📋'}
                    </div>
                    <div className="min-w-0">
                      
                      <div className="font-semibold text-sm flex items-center gap-2 flex-wrap">
                        {m.title}
                        {m.is_urgent && <span className="badge badge-orange text-[10px]">{t('oeilMissions.card.urgentBadge')}</span>}
                        {m.under_surveillance && <span className="badge badge-red text-[10px]">{t('oeilMissions.card.underSurveillanceBadge')}</span>}
                      </div>

                      
                        <div className="text-xs text-[#AAA] mt-1 space-y-0.5">
                        <div className="flex flex-wrap gap-3">
                          <span>📍 {translateLocation(m.city, i18n.language)}{m.quartier ? ` · ${translateLocation(m.quartier, i18n.language)}` : ''}</span>
                          <span>📅 {m.scheduled_at ? `${new Date(m.scheduled_at).toLocaleDateString('fr-FR', { timeZone: CASABLANCA_TZ, day:'numeric', month:'short', year:'numeric' })} à ${new Date(m.scheduled_at).toLocaleTimeString('fr-FR', { timeZone: CASABLANCA_TZ, hour:'2-digit', minute:'2-digit' })}` : '—'}</span>
                          {m.client_name && (
                            <span className="inline-flex items-center gap-1">
                              👤 {m.client_name}
                              {m.client_rating_count > 0 && (
                                <span className="inline-flex items-center gap-0.5">
                                  <Stars value={m.client_rating_avg} />
                                  <span className="text-[10px]">({m.client_rating_count})</span>
                                </span>
                              )}
                            </span>
                          )}
                          {tab !== 'available' && <StatusBadge status={m.status} validated={!!m.validated_at} role="oeil" />}
                        </div>
                        {m.address && <div>🏠 {m.address}</div>}
                        {m.description && <div className="text-[#666] line-clamp-2">💬 {m.description}</div>}
                      </div>
                      
                      {m.description && (
                        <p className="text-xs text-[#777] mt-1 line-clamp-1">{m.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">

                    <div className="text-green-400 font-bold text-base">{parseFloat(m.oeil_earning || m.price).toFixed(0)} MAD</div>
                    <div className="text-[11px] text-[#AAA]">{t('oeilMissions.card.yourEarning')}</div>
                    {tab === 'available' && bonusCampaign.active && (
                      <div className="text-[11px] text-[#FF4D00] mt-1 max-w-[140px]">
                        {t('oeilDashboard.fiveStarBonusHint', { bonus: (parseFloat(m.oeil_earning || m.price) * bonusCampaign.percent / 100).toFixed(0) })}
                      </div>
                    )}
                  </div>
                </div>

                {tab === 'active' && m.pending_edit_request && (
                  <div className="mt-3 bg-[#FF4D00]/5 border border-[#FF4D00]/20 rounded-xl p-3">
                    <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                      <span className="text-xs font-semibold text-[#FF4D00]">✏️ {t('oeilMissions.editRequest.banner')}</span>
                      <span className="text-[11px] text-[#AAA]">
                        {t('oeilMissions.editRequest.expiresAt', { time: new Date(m.pending_edit_request.expires_at).toLocaleTimeString('fr-FR', { timeZone: CASABLANCA_TZ, hour:'2-digit', minute:'2-digit' }) })}
                      </span>
                    </div>
                    <div className="space-y-1.5 mb-3">
                      {Object.entries(m.pending_edit_request.proposed_changes).map(([key, value]) => (
                        <div key={key} className="text-xs">
                          <span className="text-[#AAA]">{t(`oeilMissions.editRequest.fields.${EDIT_FIELD_LABELS[key] || key}`)}: </span>
                          <span className="text-white/50 line-through">{formatEditFieldValue(key, m[key], t)}</span>
                          <span className="text-[#AAA] mx-1">→</span>
                          <span className="text-[#FF4D00] font-medium">{formatEditFieldValue(key, value, t)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => approveEditRequest(m.pending_edit_request.id)} className="btn btn-sm flex-1 justify-center bg-green-500 text-white hover:bg-green-600">
                        {t('oeilMissions.editRequest.accept')}
                      </button>
                      <button onClick={() => rejectEditRequest(m.pending_edit_request.id)} className="btn btn-sm flex-1 justify-center bg-red-500 text-white hover:bg-red-600">
                        {t('oeilMissions.editRequest.refuse')}
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 mt-4 pt-3 border-t border-white/10">

                  {tab === 'available' && (
                      <>
                        <button
                          onClick={() => interest(m.id)}
                          disabled={m.interested || m.has_interested || submittingInterestIds.has(m.id)}
                          className="btn btn-sm flex-1 justify-center disabled:opacity-50 bg-green-500 text-white hover:bg-green-600"
                        >
                          {(m.interested || m.has_interested)
                            ? t('oeilMissions.card.requestSent')
                            : submittingInterestIds.has(m.id)
                              ? t('oeilMissions.card.interestedSending')
                              : t('oeilMissions.card.interested')}
                        </button>
                        <button
                        onClick={() => refuse(m.id)}
                        className="btn btn-sm flex-1 justify-center bg-red-500 text-white hover:bg-red-600"
                      >
                        {t('oeilMissions.card.ignore')}
                      </button>


                      </>
                    )}

                  

                  {tab === 'active' && (
                    <>
                      <button onClick={() => setChatMission(m)} className="btn btn-ghost btn-sm">{t('oeilMissions.card.chat')}</button>
                      <button onClick={() => setHistoryMission(m)} className="btn btn-ghost btn-sm">🕐</button>


                        {['en_route','active'].includes(m.status) && ['airbnb','booking','Airbnb','Booking'].some(s => m.subcategory?.toLowerCase().includes(s.toLowerCase())) && (
                          <button onClick={() => navigate(`/oeil/missions/${m.id}/rapport`)} className="btn btn-ghost btn-sm">
                            {t('oeilMissions.card.reportButton')}
                          </button>
                        )}
                        {['en_route','active'].includes(m.status) && m.type === 'audit' && (
                          <button onClick={() => navigate(`/oeil/missions/${m.id}/audit`)} className="btn btn-ghost btn-sm">
                            {t('oeilMissions.card.auditButton')}
                          </button>
                        )}

                      {['en_route','active'].includes(m.status) && (
                        <button onClick={() => setPhotosMission(m)} className="btn btn-ghost btn-sm">
                          {t('oeilMissions.card.photosButton')}
                        </button>
                      )}
                      {advanceLabel[m.status] && (
                        <button onClick={() => advance(m)} className="btn btn-primary btn-sm flex-1 justify-center">
                          {advanceLabel[m.status]}
                        </button>
                      )}
                    </>
                  )}
                  {tab === 'active' && ['assigned','en_route','active'].includes(m.status) && (
                    <button
                      onClick={() => setAssistanceMission(m)}
                      className="text-xs text-[#555] hover:text-orange-400 transition-colors mt-2 w-full text-center"
                    >
                      {t('oeilMissions.card.askAssistance')}
                    </button>
                  )}


                  {tab === 'done' && (
                    <button onClick={() => setSummaryMission(m)} className="btn btn-ghost btn-sm">{t('oeilMissions.card.summaryButton')}</button>
                  )}
                  {tab === 'done' && m.status === 'completed' && (
                    m.client_rating_score_given
                      ? <span className="text-xs text-yellow-400 font-semibold self-center">{t('oeilMissions.card.clientRatedDisplay', { score: m.client_rating_score_given })}</span>
                      : <button onClick={() => setRatingClientMission(m)} className="btn btn-ghost btn-sm">{t('oeilMissions.card.rateClientButton')}</button>
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
        <AssistanceModal
          mission={assistanceMission}
          onClose={() => setAssistanceMission(null)}
          onSuccess={() => { setAssistanceMission(null); load(tab) }}
        />
      )}

     
{summaryMission && (
  <MissionSummaryModal mission={summaryMission} onClose={() => setSummaryMission(null)} />
)}

{ratingClientMission && (
  <RateClientModal
    mission={ratingClientMission}
    onClose={() => setRatingClientMission(null)}
    onRated={() => { setRatingClientMission(null); load(tab) }}
  />
)}


  {complianceMission && (
    <ComplianceModal onAccept={() => interest(complianceMission)} />
  )}
  {complianceAdvance && (
    <ComplianceModal onAccept={async () => {
      const m = complianceAdvance
      try {
        await advance(m, true)
      } finally {
        setComplianceAdvance(null)
      }
    }} />
  )}

      {chatMission && (
        <ChatModal mission={chatMission} onClose={() => setChatMission(null)} />
      )}

      {photosMission && (
        <MissionPhotosModal mission={photosMission} onClose={() => setPhotosMission(null)} />
      )}

      {candidateMission && (
        <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#181818] border border-[#FF4D00]/30 rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#FF4D00]/10 flex items-center justify-center text-xl flex-shrink-0">🎯</div>
              <div className="min-w-0">
                <h2 className="font-bold text-base">{t('oeilMissions.candidateConfirmModal.title')}</h2>
                <p className="text-xs text-[#AAA] truncate">{candidateMission.title}</p>
              </div>
            </div>

            <p className="text-sm text-[#CCC] mb-4">
              {t('oeilMissions.candidateConfirmModal.body', { missionTitle: candidateMission.title })}
            </p>

            {candidateMinutesLeft !== null && (
              <p className={`text-xs font-semibold mb-5 ${candidateMinutesLeft > 0 ? 'text-[#FF4D00]' : 'text-red-400'}`}>
                {candidateMinutesLeft > 0
                  ? t('oeilMissions.candidateConfirmModal.minutesLeft', { minutes: candidateMinutesLeft })
                  : t('oeilMissions.candidateConfirmModal.expired')}
              </p>
            )}

            <div className="flex gap-2">
              <button
                onClick={confirmCandidate}
                disabled={!!candidateActing}
                className="btn btn-sm flex-1 justify-center bg-green-500 text-white hover:bg-green-600 disabled:opacity-50"
              >
                {candidateActing === 'confirm' ? t('oeilMissions.candidateConfirmModal.confirming') : t('oeilMissions.candidateConfirmModal.confirmButton')}
              </button>
              <button
                onClick={declineCandidate}
                disabled={!!candidateActing}
                className="btn btn-sm flex-1 justify-center bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
              >
                {candidateActing === 'decline' ? t('oeilMissions.candidateConfirmModal.declining') : t('oeilMissions.candidateConfirmModal.declineButton')}
              </button>
            </div>
            <button
              onClick={() => setCandidateMission(null)}
              disabled={!!candidateActing}
              className="w-full text-center text-xs text-[#666] hover:text-white mt-3 disabled:opacity-50"
            >
              {t('oeilMissions.candidateConfirmModal.later')}
            </button>
          </div>
        </div>
      )}
    </AppLayout>
  )
}