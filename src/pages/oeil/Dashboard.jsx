import { useState, useEffect } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import Topbar from '../../components/layout/Topbar'
import { missionsAPI, usersAPI } from '../../api'
import { StatusBadge, Spinner, EmptyState, toast } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import ChatModal from '../../components/missions/ChatModal'

export default function OeilDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [pending, setPending]         = useState([])
  const [active, setActive]           = useState([])
  const [stats, setStats]             = useState(null)
  const [loading, setLoading]         = useState(true)
  const [chatMission, setChatMission] = useState(null)
  const [transferMission, setTransferMission] = useState(null)
  const [transferReason, setTransferReason] = useState('')
  const [transferring, setTransferring] = useState(false)

  const doTransfer = async () => {
    if (!transferReason) { toast('Veuillez sélectionner une raison', 'error'); return }
    setTransferring(true)
    try {
      await missionsAPI.transfer(transferMission.id, { reason: transferReason })
      toast('Empêchement signalé — mission remise en priorité', 'info')
      setTransferMission(null)
      setTransferReason('')
      load()
    } catch (err) {
      toast(err.response?.data?.error || 'Erreur', 'error')
    } finally { setTransferring(false) }
  }

  const load = () => {
    setLoading(true)
    Promise.all([
      missionsAPI.list({ mode: 'available', sort: 'scheduled_asc', limit: 5 }), // Tri par date d'exécution la plus proche (aperçu des missions urgentes)
      missionsAPI.list({ mode: 'mine', limit: 50 }),
      user?.id ? usersAPI.oeil(user.id).catch(() => null) : Promise.resolve(null),
    ])
      .then(([pRes, mRes, oRes]) => {
        setPending(pRes.data.missions || [])
        const all = mRes.data.missions || []
        setActive(all.filter(m => ['assigned','en_route','active'].includes(m.status)))
        const done     = all.filter(m => m.status === 'completed')
        const earnings = done.reduce((sum, m) => sum + (parseFloat(m.oeil_earning) || 0), 0)
        const profile  = oRes?.data?.oeil || oRes?.data?.user || {}
        setStats({
          completed:    profile.total_missions  || done.length,
          rating:       parseFloat(profile.rating_avg) || 0,
          rating_count: profile.rating_count    || 0,
          balance:      parseFloat(profile.balance)    || 0,
          earnings,
        })
      })
      .catch(() => toast('Erreur de chargement', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const interest = async (id) => {
  try {
    await missionsAPI.interest(id)
    setPending(prev => prev.map(m => m.id === id ? { ...m, interested: true } : m))
    toast('Intérêt exprimé 👁️ Le client va vous contacter.', 'success')
  } catch (err) {
    toast(err.response?.data?.error || 'Erreur', 'error')
  }
}

const refuse = async (id) => {
  try {
    await missionsAPI.refuse(id, true)
    setPending(prev => prev.filter(m => m.id !== id))
    toast('Mission ignorée', 'info')
  } catch {
    toast('Erreur', 'error')
  }
}



  const advance = async (mission) => {
    const next = { assigned:'en_route', en_route:'active', active:'completed' }[mission.status]
    if (!next) return
    try {
      await missionsAPI.status(mission.id, { status: next })
      toast(next === 'completed' ? 'Mission terminée ! 🎉' : 'Statut mis à jour ✓', 'success')
      load()
    } catch { toast('Erreur', 'error') }
  }

  const advanceLabel = {
    assigned: '🚗 En route',
    en_route: '▶️ Démarrer',
    active:   '✓ Terminer',
  }

  if (loading) return (
    <AppLayout>
      <Topbar title="Tableau de bord" />
      <div className="flex-1 flex items-center justify-center"><Spinner size="lg" /></div>
    </AppLayout>
  )

  return (
    <AppLayout>
      <Topbar title="Tableau de bord" />
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">

        {/* Bannière vérification identité */}
        {!user?.is_verified && (
          <div className={`rounded-xl p-4 flex items-center gap-3 ${
            user?.id_verified_at === null && !user?.is_verified
              ? 'bg-orange-500/10 border border-orange-500/30'
              : 'bg-yellow-500/10 border border-yellow-500/30'
          }`}>
            <span className="text-2xl flex-shrink-0">
              {user?.id_verified_at ? '⏳' : '🛡️'}
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">
                {user?.id_verified_at ? 'Vérification en cours' : 'Identité non vérifiée'}
              </p>
              <p className="text-xs text-[#AAA] mt-0.5">
                {user?.id_verified_at
                  ? 'Notre équipe examine vos documents. Vous serez notifié dès validation.'
                  : 'Vérifiez votre identité pour pouvoir postuler aux missions.'}
              </p>
            </div>
            {!user?.id_verified_at && (
                <button
                  onClick={() => navigate('/oeil/verification-identite')}
                  className="btn btn-primary btn-sm flex-shrink-0"
                >
                  Vérifier →
                </button>
              )}
            </div>
          )}
          {/* Bannière photo de profil manquante */}
          {!user?.avatar_url && (
            <div className="rounded-xl p-4 flex items-center gap-3 bg-[#FF4D00]/10 border border-[#FF4D00]/30">
              <span className="text-2xl flex-shrink-0">📸</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">Ajoutez votre photo de profil</p>
                <p className="text-xs text-[#AAA] mt-0.5">
                  Un profil avec photo inspire plus confiance aux clients et vous aide à obtenir plus de missions.
                </p>
              </div>
              <button
                onClick={() => navigate('/oeil/compte')}
                className="btn btn-primary btn-sm flex-shrink-0"
              >
                Ajouter →
              </button>
            </div>
          )}
          {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div className="stat-card">
            <div className="text-xs text-[#AAA] mb-1">Missions complétées</div>
            <div className="text-2xl font-bold">{stats?.completed || 0}</div>
          </div>
          <div className="stat-card">
            <div className="text-xs text-[#AAA] mb-1">Note moyenne</div>
            <div className="text-2xl font-bold text-yellow-400">
              {stats?.rating ? `${stats.rating}★` : '—'}
            </div>
            {stats?.rating_count > 0 && (
              <div className="text-xs text-[#AAA] mt-1">{stats.rating_count} avis</div>
            )}
          </div>
          <div className="stat-card">
            <div className="text-xs text-[#AAA] mb-1">Revenus (missions)</div>
            <div className="text-2xl font-bold">
              {stats?.earnings?.toFixed(0) || 0}
              <span className="text-sm text-[#AAA] ml-1">MAD</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="text-xs text-[#AAA] mb-1">Solde disponible</div>
            <div className="text-2xl font-bold text-green-400">
              {stats?.balance?.toFixed(0) || 0}
              <span className="text-sm ml-1">MAD</span>
            </div>
          </div>
        </div>

        {/* Section PRIORITÉ */}
        {pending.filter(m => m.is_priority).length > 0 && (
          <div className="rounded-xl border-2 border-red-500/40 bg-red-500/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🔴</span>
              <h2 className="font-bold text-sm text-red-400 uppercase tracking-wider">Missions prioritaires</h2>
              <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {pending.filter(m => m.is_priority).length}
              </span>
            </div>
            <p className="text-xs text-[#AAA] mb-3">Ces missions nécessitent un Œil de toute urgence — l'Œil précédent a signalé un empêchement.</p>
            {pending.filter(m => m.is_priority).map((m) => (
              <div key={m.id} className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-2 last:mb-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded font-bold">PRIORITÉ</span>
                      <span className="font-semibold text-sm truncate">{m.title}</span>
                    </div>
                    <div className="text-xs text-[#AAA] mt-1 space-y-0.5">
                      <div>📍 {m.city} {m.quartier ? `· ${m.quartier}` : ''}</div>
                      {m.scheduled_at && <div>📅 {new Date(m.scheduled_at).toLocaleDateString('fr-FR', { day:'numeric', month:'short' })} à {new Date(m.scheduled_at).toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' })}</div>}
                      {m.transfer_deadline && <div className="text-red-400">⏱️ Expire à {new Date(m.transfer_deadline).toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' })}</div>}
                    </div>
                  </div>
                  <div className="text-green-400 font-bold whitespace-nowrap text-sm">
                    {parseFloat(m.oeil_earning || m.price).toFixed(0)} MAD
                  </div>
                </div>
                <button
                  onClick={() => user?.is_verified ? interest(m.id) : navigate('/oeil/verification-identite')}
                  disabled={m.interested || m.has_interested}
                  className="btn btn-sm w-full justify-center disabled:opacity-50 bg-red-500 text-white hover:bg-red-600"
                >
                  {(m.interested || m.has_interested) ? '✅ Demande envoyée' : '⚡ Je prends cette mission →'}
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">

          {/* Missions disponibles */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-sm">
                Missions disponibles
                <span className="ml-2 text-xs bg-[#FF4D00]/15 text-[#FF4D00] px-2 py-0.5 rounded-full">
                  {pending.length}
                </span>
              </h2>
            </div>

            {pending.length === 0 ? (
              <EmptyState icon="🎯" title="Aucune mission disponible" description="Revenez bientôt !" />
            ) : pending.map((m) => (
              <div key={m.id} className="bg-[#222] rounded-xl p-3 mb-3 last:mb-0">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    <div className="font-semibold text-sm truncate">{m.title}</div>
                    <div className="text-xs text-[#AAA] mt-0.5 space-y-0.5">
                      <div>📍 {m.city} {m.quartier ? `· ${m.quartier}` : ''}</div>
                      {m.address && <div>🏠 {m.address}</div>}
                      {m.scheduled_at && <div>📅 {new Date(m.scheduled_at).toLocaleDateString('fr-FR', { day:'numeric', month:'short', year:'numeric' })} à {new Date(m.scheduled_at).toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' })}</div>}
                      {m.description && <div className="text-[#666] line-clamp-2">💬 {m.description}</div>}
                    </div>
                  </div>
                 
                 <div className="text-green-400 font-bold whitespace-nowrap text-sm">
                    {parseFloat(m.oeil_earning || m.price).toFixed(0)} MAD
                  </div>

                </div>
                

                  <div className="flex gap-2">
                  <button
                      onClick={() => user?.is_verified ? interest(m.id) : navigate('/oeil/verification-identite')}
                      disabled={m.interested || m.has_interested}
                      className="btn btn-sm flex-1 justify-center disabled:opacity-50 bg-green-500 text-white hover:bg-green-600"
                    >
                      {(m.interested || m.has_interested) ? '✅ Demande envoyée' : user?.is_verified ? '👁️ Je suis intéressé' : '🛡️ Vérification requise'}
                    </button>
                    <button
                      onClick={() => refuse(m.id, true)}
                      className="btn btn-sm flex-1 justify-center bg-red-500 text-white hover:bg-red-600"
                    >
                      ✕ Ignorer
                    </button>
                  </div>


              </div>
            ))}
          </div>

          {/* Missions en cours */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-sm">
                Mes missions en cours
                <span className="ml-2 text-xs bg-blue-500/15 text-blue-400 px-2 py-0.5 rounded-full">
                  {active.length}
                </span>
              </h2>
            </div>

            {active.length === 0 ? (
              <EmptyState icon="📋" title="Aucune mission en cours" description="Acceptez une mission pour commencer." />
            ) : active.map((m) => (
              <div key={m.id} className="bg-[#222] rounded-xl p-3 mb-3 last:mb-0">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-semibold text-sm">{m.title}</div>
                    <div className="text-xs text-[#AAA] mt-0.5 space-y-0.5">
                      <div>👤 {m.client_name}</div>
                      <div>📍 {m.city} {m.quartier ? `· ${m.quartier}` : ''}</div>
                      {m.address && <div>🏠 {m.address}</div>}
                      {m.scheduled_at && <div>📅 {new Date(m.scheduled_at).toLocaleDateString('fr-FR', { day:'numeric', month:'short', year:'numeric' })} à {new Date(m.scheduled_at).toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' })}</div>}
                      {m.description && <div className="text-[#666] line-clamp-2">💬 {m.description}</div>}
                    </div>

                  </div>
                  <StatusBadge status={m.status} />
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => setChatMission(m)}
                    className="btn btn-ghost btn-sm flex-1 justify-center"
                  >
                    💬 Chat
                  </button>
                  {advanceLabel[m.status] && (
                    <button onClick={() => advance(m)} className="btn btn-primary btn-sm">
                      {advanceLabel[m.status]}
                    </button>
                  )}
                </div>
                {['assigned','en_route','active'].includes(m.status) && (
                  <button
                    onClick={() => { setTransferMission(m); setTransferReason('') }}
                    className="text-xs text-[#555] hover:text-red-400 transition-colors mt-2 w-full text-center"
                  >
                    Signaler un empêchement majeur
                  </button>
                )}




              </div>
            ))}
          </div>

        </div>
      </div>

{chatMission && <ChatModal mission={chatMission} onClose={() => setChatMission(null)} />}

      {transferMission && (
        <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#181818] border border-red-500/30 rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-xl flex-shrink-0">🚨</div>
              <h2 className="font-bold text-base">Empêchement en cours de mission</h2>
            </div>
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 mb-4 space-y-1.5">
              <p className="text-xs text-white/80">Cette action est irréversible et réservée aux situations d'urgence réelle. Le client a planifié ce rendez-vous — votre départ impacte directement sa mission.</p>
            </div>
            <div className="bg-[#222] rounded-xl p-3 mb-4 space-y-1">
              <p className="text-xs text-[#AAA]">Conséquences :</p>
              {['assigned'].includes(transferMission.status)
                ? <p className="text-xs text-white/70">• Vous ne recevrez aucune rémunération pour cette mission</p>
                : <>
                    <p className="text-xs text-white/70">• Vous recevrez 50% de la rémunération si un remplaçant est trouvé</p>
                    <p className="text-xs text-white/70">• Vous ne pourrez pas postuler pendant 4 heures</p>
                  </>
              }
              <p className="text-xs text-white/70">• Cet incident sera noté sur votre profil</p>
            </div>
            <div className="mb-5">
              <label className="label">Raison (obligatoire)</label>
              <select className="input" value={transferReason} onChange={e => setTransferReason(e.target.value)}>
                <option value="">Sélectionner une raison</option>
                <option value="Urgence médicale">Urgence médicale</option>
                <option value="Accident / incident">Accident / incident sur place</option>
                <option value="Problème de sécurité">Problème de sécurité</option>
                <option value="Empêchement familial grave">Empêchement familial grave</option>
                <option value="Autre cas de force majeure">Autre cas de force majeure</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setTransferMission(null)} className="btn btn-ghost flex-1 justify-center">Retour</button>
              <button
                onClick={doTransfer}
                disabled={transferring || !transferReason}
                className="btn btn-sm flex-1 justify-center bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
              >
                {transferring ? '...' : 'Confirmer l\'empêchement →'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
