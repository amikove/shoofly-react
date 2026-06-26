import { useState, useEffect, useCallback } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import Topbar from '../../components/layout/Topbar'
import { missionsAPI } from '../../api'
import { StatusBadge, Spinner, EmptyState, toast } from '../../components/ui'
import NewMissionModal from '../../components/missions/NewMissionModal'
import RateModal from '../../components/missions/RateModal'
import ChatModal from '../../components/missions/ChatModal'
import { useAuth } from '../../context/AuthContext'
import { useNotif } from '../../context/NotifContext'
import { useNavigate } from 'react-router-dom'

const TYPE_ICONS = { immobilier:'🏠', file_attente:'⏳', audit:'🔎', personnalisee:'🎯' }

function InterestsModal({ mission, onClose, onHired }) {
  const [interests, setInterests] = useState([])
  const [loading, setLoading]     = useState(true)
  const [hiring, setHiring]       = useState(null)

  useEffect(() => {
    missionsAPI.interests(mission.id)
      .then(({ data }) => setInterests(data.interests || []))
      .catch(() => toast('Erreur chargement', 'error'))
      .finally(() => setLoading(false))
  }, [mission.id])

  

  const hire = async (oeilId) => {
    setHiring(oeilId)
    try {
      await missionsAPI.hire(mission.id, oeilId)
      toast('Œil embauché ! 🎉', 'success')
      onHired()
      onClose()
    } catch (err) {
      toast(err.response?.data?.error || 'Erreur', 'error')
    } finally { setHiring(null) }
  }

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
         onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-[#181818] border border-white/20 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="font-bold text-base">Œils intéressés</h2>
            <p className="text-xs text-[#AAA] mt-0.5">{mission.title}</p>
          </div>
          <button onClick={onClose} className="text-[#AAA] hover:text-white text-lg">✕</button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Spinner size="lg" /></div>
        ) : interests.length === 0 ? (
          <div className="text-center py-10 text-[#AAA]">
            <div className="text-4xl mb-3 opacity-30">👁️</div>
            <p className="text-sm">Aucun Œil intéressé pour le moment.</p>
            <p className="text-xs mt-1">Revenez dans quelques minutes.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {interests.map((o) => (
              <div key={o.id} className="bg-[#222] rounded-xl p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-[#FF4D00]/10 text-[#FF4D00] flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {o.first_name?.[0]}{o.last_name?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{o.first_name} {o.last_name}</div>
                  <div className="text-xs text-[#AAA] flex gap-3 mt-0.5 flex-wrap">
                    <span>📍 {o.city || '—'}</span>
                    <span>⭐ {o.rating_avg || '0'}/5 ({o.rating_count || 0} avis)</span>
                    <span>✅ {o.total_missions || 0} missions</span>
                  </div>
                  {o.bio && <p className="text-xs text-[#777] mt-1 line-clamp-2">{o.bio}</p>}
                  {o.message && (
                    <div className="mt-2 bg-[#2A2A2A] rounded-lg px-3 py-2 text-xs text-[#AAA] italic">
                      "{o.message}"
                    </div>
                  )}
                </div>
                <button
                  onClick={() => hire(o.id)}
                  disabled={hiring === o.id}
                  className="btn btn-primary btn-sm flex-shrink-0 disabled:opacity-50"
                >
                  {hiring === o.id ? '...' : 'Embaucher'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ReportViewer({ mission, onClose }) {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    missionsAPI.get(mission.id)
      .then(({ data }) => setReport(data.report || null))
      .catch(() => toast('Erreur chargement rapport', 'error'))
      .finally(() => setLoading(false))
  }, [mission.id])

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
         onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-[#181818] border border-white/20 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="font-display font-bold text-base">Rapport de mission</h2>
            <p className="text-xs text-[#AAA] mt-0.5">{mission.title}</p>
          </div>
          <button onClick={onClose} className="text-[#AAA] hover:text-white text-lg">✕</button>
        </div>
        {loading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : !report ? (
          <div className="text-center py-12 text-[#AAA]">
            <div className="text-4xl mb-3 opacity-30">📄</div>
            <p>Aucun rapport disponible pour cette mission.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-[#222] rounded-xl">
              <span className="text-sm font-semibold">Score global</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-[#333] rounded-full overflow-hidden">
                  <div className="h-full bg-[#FF4D00] rounded-full" style={{ width: `${report.score}%` }} />
                </div>
                <span className="font-bold text-[#FF4D00]">{report.score}/100</span>
              </div>
            </div>
            <div>
              <label className="label">Résumé</label>
              <div className="bg-[#222] rounded-xl p-4 text-sm text-[#AAA] leading-relaxed">{report.summary}</div>
            </div>
            {report.risk_points?.length > 0 && (
              <div>
                <label className="label">Points de vigilance</label>
                <div className="space-y-1">
                  {report.risk_points.map((r, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-[#AAA] bg-[#222] rounded-lg px-3 py-2">
                      <span className="text-yellow-400 mt-0.5">⚠️</span>
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}


function ClaimModal({ mission, onClose, onClaimed }) {
  const [comment, setComment] = useState('')
  const [saving, setSaving]   = useState(false)

  const submit = async () => {
    if (!comment.trim()) { toast('Commentaire obligatoire', 'error'); return }
    setSaving(true)
    try {
      await missionsAPI.claim(mission.id, comment)
      toast('Réclamation envoyée 🚨', 'info')
      onClaimed()
    } catch (err) {
      toast(err.response?.data?.error || 'Erreur', 'error')
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/75 z-[60] flex items-center justify-center p-4 backdrop-blur-sm"
         onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-[#181818] border border-white/20 rounded-2xl p-5 w-full max-w-sm shadow-xl">
        <h2 className="font-semibold mb-1">🚨 Réclamer cette mission</h2>
        <p className="text-xs text-[#AAA] mb-4">"{mission.title}" — Expliquez pourquoi vous contestez la validation.</p>
        <textarea
          className="input resize-none h-28 w-full"
          placeholder="Décrivez le problème en détail..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="btn btn-ghost flex-1 justify-center">Annuler</button>
          <button onClick={submit} disabled={saving || !comment.trim()} className="btn btn-primary flex-1 justify-center disabled:opacity-60">
            {saving ? 'Envoi...' : 'Envoyer la réclamation'}
          </button>
        </div>
      </div>
    </div>
  )
}


export default function ClientMissions() {

  const navigate = useNavigate()
  const [missions, setMissions]           = useState([])
  const [loading, setLoading]             = useState(true)
  const [showNew, setShowNew]             = useState(false)
  const [ratingMission, setRatingMission] = useState(null)
  const [chatMission, setChatMission]     = useState(null)
  const [reportMission, setReportMission] = useState(null)
  const [interestsMission, setInterestsMission] = useState(null)
  const [claimMission, setClaimMission] = useState(null)
  const [search, setSearch]               = useState('')
  const [statusFilter, setStatus]         = useState('')
  const [typeFilter, setType]             = useState('')
  const { pendingChatMissionId, clearPendingChat, getPending } = useNotif()




// Ouvrir le chat depuis une notification
useEffect(() => {
  const handler = (e) => {
    const id = e.detail
    if (id) {
      missionsAPI.get(id)
        .then(({ data }) => setChatMission(data.mission || data))
        .catch(() => {})
    }
  }
  window.addEventListener('shoofly-open-chat', handler)
  return () => window.removeEventListener('shoofly-open-chat', handler)
}, [])



  const load = useCallback(() => {
    setLoading(true)
    return missionsAPI.list({ search, status: statusFilter, type: typeFilter })
      .then(({ data }) => setMissions(data.missions || []))
      .catch(() => toast('Erreur de chargement', 'error'))
      .finally(() => setLoading(false))
  }, [search, statusFilter, typeFilter])

  useEffect(() => {
    load()
  }, [load])

  const cancel = async (id) => {
    
    if (!window.confirm('Confirmer l\'annulation ?')) return
    try {
      await missionsAPI.status(id, { status: 'cancelled' })
      setMissions(prev => prev.map(m => m.id === id ? { ...m, status: 'cancelled' } : m))
      toast('Mission annulée', 'info')
    } catch (err) {
      toast(err.response?.data?.error || 'Erreur', 'error')
    }
  }

  return (
    <AppLayout>
      <Topbar
        title="Mes missions"
        actions={
          <button onClick={() => setShowNew(true)} className="btn btn-primary btn-sm">
            + Nouvelle mission
          </button>
        }
      />
      <div className="p-6">
        <div className="flex flex-wrap gap-3 mb-5">
          <input className="input max-w-[220px]" placeholder="🔍 Rechercher..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className="input max-w-[160px]" value={statusFilter} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="assigned">Assigné</option>
            <option value="en_route">En route</option>
            <option value="active">En cours</option>
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
          <>
          {/* Desktop: tableau */}
<div className="hidden md:block card p-0">
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
              <div className="flex gap-1 flex-wrap">
                {m.status === 'pending' && (
                  <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setInterestsMission(m); }}
                    className="btn btn-ghost btn-sm" title="Voir les Œils intéressés">👁️</button>
                )}
                {['assigned','en_route','active'].includes(m.status) && (
                  <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setChatMission(m); }}
                    className="btn btn-ghost btn-sm" title="Chat avec l'Œil">💬</button>
                )}
                    {m.status === 'completed' && (
                      <>
                        {['airbnb','booking'].some(s => m.subcategory?.toLowerCase().includes(s.toLowerCase())) && (
                          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/client/missions/${m.id}/rapport`) }}
                            className="btn btn-ghost btn-sm" title="Rapport de visite">📄</button>
                        )}
                        {m.type === 'audit' && (
                          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/client/missions/${m.id}/audit`) }}
                            className="btn btn-ghost btn-sm" title="Rapport d'audit">📋</button>
                        )}
                      </>
                    )}

                {m.type === 'immobilier' && ['Airbnb','Booking'].some(s => m.subcategory?.includes(s)) && (
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/client/missions/${m.id}/rapport`); }}
                  className="btn btn-ghost btn-sm"
                  title="Rapport de visite Airbnb"
                >📋</button>
              )}

            {m.status === 'completed' && (
              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setRatingMission(m); }}
                className="btn btn-ghost btn-sm" title="Noter l'Œil">⭐</button>
            )}
            {m.status === 'completed' && !m.validated_at && m.completed_by_oeil_at && (
              (() => {
                const hours = (Date.now() - new Date(m.completed_by_oeil_at).getTime()) / 3600000;
                return hours < 12 ? (
                  <>
                    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); validateMission(m.id); }}
                      className="btn btn-ghost btn-sm text-green-400" title="Valider la mission">✅</button>
                    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setClaimMission(m); }}
                      className="btn btn-ghost btn-sm text-orange-400" title="Réclamer">🚨</button>
                  </>
                ) : null;
              })()
            )}
                
                
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>

{/* Mobile: cartes */}
<div className="md:hidden space-y-3">
  {missions.map((m) => (
    <div key={m.id} className="card">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm truncate">{m.title}</div>
          <div className="text-[11px] text-[#AAA] mt-0.5">
            {TYPE_ICONS[m.type]} · {m.oeil_name || 'Non assigné'} · {new Date(m.created_at).toLocaleDateString('fr-MA')}
          </div>
        </div>
        <div className="flex-shrink-0 flex flex-col items-end gap-1">
          <span className="text-green-400 font-bold text-sm">{parseFloat(m.price).toFixed(0)} MAD</span>
          <StatusBadge status={m.status} />
        </div>
      </div>
      <div className="flex gap-2 flex-wrap pt-2 border-t border-white/10">
        {m.status === 'pending' && (
          <button onClick={() => setInterestsMission(m)} className="btn btn-ghost btn-sm">👁️ Intéressés</button>
        )}
        {['assigned','en_route','active'].includes(m.status) && (
          <button onClick={() => setChatMission(m)} className="btn btn-ghost btn-sm">💬 Chat</button>
        )}
          {m.status === 'completed' && (
            <>
              {['airbnb','booking'].some(s => m.subcategory?.toLowerCase().includes(s.toLowerCase())) && (
                <button onClick={() => navigate(`/client/missions/${m.id}/rapport`)} className="btn btn-ghost btn-sm">📄 Rapport</button>
              )}
              {m.type === 'audit' && (
                <button onClick={() => navigate(`/client/missions/${m.id}/audit`)} className="btn btn-ghost btn-sm">📋 Audit</button>
              )}
            </>
          )}

          {m.type === 'immobilier' && ['Airbnb','Booking'].some(s => m.subcategory?.includes(s)) && (
            <button
              onClick={() => navigate(`/client/missions/${m.id}/rapport`)}
              className="btn btn-ghost btn-sm"
            >📋 Visite</button>
          )}

        {m.status === 'completed' && !m.validated_at && m.completed_by_oeil_at && (
          (() => {
            const hours = (Date.now() - new Date(m.completed_by_oeil_at).getTime()) / 3600000;
            return hours < 12 ? (
              <>
                <button onClick={() => validateMission(m.id)} className="btn btn-ghost btn-sm text-green-400">✅ Valider</button>
                <button onClick={() => setClaimMission(m)} className="btn btn-ghost btn-sm text-orange-400">🚨 Réclamer</button>
              </>
            ) : null;
          })()
        )}
        
        
      </div>
    </div>
    
  )

  
)}
</div>
          </>
        )}
      </div>

      <NewMissionModal
        open={showNew}
        onClose={() => setShowNew(false)}
        onCreated={() => { load(); toast('Mission créée ! 🎉', 'success') }}
      />

      {ratingMission && (
        <RateModal
          mission={ratingMission}
          onClose={() => setRatingMission(null)}
          onRated={() => { setRatingMission(null); load() }}
        />
      )}

{claimMission && (
  <ClaimModal mission={claimMission} onClose={() => setClaimMission(null)} onClaimed={() => { setClaimMission(null); load() }} />
)}

      {chatMission && (
        <ChatModal
          mission={chatMission}
          onClose={() => setChatMission(null)}
        />
      )}

      {reportMission && (
        <ReportViewer
          mission={reportMission}
          onClose={() => setReportMission(null)}
        />
      )}
      {interestsMission && (
  <InterestsModal
    mission={interestsMission}
    onClose={() => setInterestsMission(null)}
    onHired={() => { setInterestsMission(null); load() }}
  />
)}
    </AppLayout>
  )
}
