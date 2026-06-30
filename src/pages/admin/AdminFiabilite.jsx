import { useState, useEffect } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import Topbar from '../../components/layout/Topbar'
import { reliabilityAPI } from '../../api'
import { Spinner, Avatar, toast } from '../../components/ui'

export default function AdminFiabilite() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading]   = useState(true)
  const [history, setHistory]   = useState({})
  const [expanded, setExpanded] = useState(null)
  const [responding, setResponding] = useState(null)
  const [response, setResponse] = useState('')
  const [resetScore, setResetScore] = useState('70')
  const [acting, setActing]     = useState({})

  const load = () => {
    reliabilityAPI.adminRequests('pending')
      .then(({ data }) => setRequests(data.requests || []))
      .catch(() => toast('Erreur chargement', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const loadHistory = async (oeilId) => {
    if (history[oeilId]) { setExpanded(expanded === oeilId ? null : oeilId); return }
    try {
      const { data } = await reliabilityAPI.adminHistory(oeilId)
      setHistory(h => ({ ...h, [oeilId]: data.events }))
      setExpanded(oeilId)
    } catch { toast('Erreur', 'error') }
  }

  const decide = async (requestId, decision) => {
    setActing(a => ({ ...a, [requestId]: true }))
    try {
      await reliabilityAPI.decideRequest(requestId, {
        decision,
        response,
        reset_score: decision === 'approved' ? parseInt(resetScore) : undefined,
      })
      toast(decision === 'approved' ? 'Compte réactivé ✓' : 'Demande refusée', decision === 'approved' ? 'success' : 'info')
      setResponding(null)
      setResponse('')
      load()
    } catch (err) {
      toast(err.response?.data?.error || 'Erreur', 'error')
    } finally { setActing(a => ({ ...a, [requestId]: false })) }
  }

  return (
    <AppLayout>
      <Topbar title="🛡️ Fiabilité des Œils" />
      <div className="p-6">
        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : requests.length === 0 ? (
          <div className="card text-center py-12 text-[#AAA]">✅ Aucune demande d'examen en attente</div>
        ) : (
          <div className="space-y-4">
            {requests.map((r) => (
              <div key={r.id} className="card">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar name={`${r.first_name} ${r.last_name}`} size={44} />
                  <div className="flex-1">
                    <p className="font-semibold">{r.first_name} {r.last_name}</p>
                    <p className="text-xs text-[#AAA]">{r.email}</p>
                  </div>
                  <div className="text-right">
                    <span className="badge badge-red">Score : {r.reliability_score}%</span>
                    <p className="text-[10px] text-[#555] mt-1">{new Date(r.created_at).toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>

                <div className="bg-[#222] rounded-xl p-3 mb-3">
                  <p className="text-xs text-[#AAA] mb-1">Message de l'Œil :</p>
                  <p className="text-sm text-white/80">{r.message}</p>
                </div>

                <button
                  onClick={() => loadHistory(r.oeil_id)}
                  className="text-xs text-[#FF4D00] hover:underline mb-3"
                >
                  {expanded === r.oeil_id ? '▲ Masquer l\'historique' : '▼ Voir l\'historique détaillé'}
                </button>

                {expanded === r.oeil_id && (
                  <div className="space-y-2 max-h-72 overflow-y-auto mb-3">
                    {(history[r.oeil_id] || []).map((e, i) => (
                      <div key={i} className={`p-2.5 rounded-lg text-xs ${
                        e.is_grave ? 'bg-red-500/10 border border-red-500/20' : 'bg-[#222]'
                      }`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-white/80 font-medium">{e.reason}</span>
                          <span className={`font-bold whitespace-nowrap ml-2 ${e.points >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {e.points >= 0 ? '+' : ''}{e.points}
                          </span>
                        </div>
                        {e.mission_title && (
                          <div className="text-[#AAA] space-y-0.5 mt-1.5">
                            <div>📋 {e.mission_title}</div>
                            {e.client_first_name && <div>👤 {e.client_first_name} {e.client_last_name}</div>}
                            {e.mission_scheduled_at && <div>📅 {new Date(e.mission_scheduled_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })} à {new Date(e.mission_scheduled_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>}
                            {e.mission_city && <div>📍 {e.mission_city}{e.mission_quartier ? ` · ${e.mission_quartier}` : ''}</div>}
                            {e.mission_status && <div>🔄 Statut : {e.mission_status}</div>}
                            {e.media_count !== null && <div>📸 {e.media_count} média(s)</div>}
                          </div>
                        )}
                        <div className="text-[10px] text-[#555] mt-1.5">{new Date(e.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    ))}
                  </div>
                )}

                {responding === r.id ? (
                  <div className="space-y-3 border-t border-white/10 pt-3">
                    <textarea
                      className="input resize-none h-20 w-full text-sm"
                      placeholder="Réponse à l'Œil (optionnel)..."
                      value={response}
                      onChange={e => setResponse(e.target.value)}
                    />
                    <div>
                      <label className="label">Score de réintégration</label>
                      <input
                        type="number" min="50" max="90"
                        className="input max-w-[120px]"
                        value={resetScore}
                        onChange={e => setResetScore(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => decide(r.id, 'approved')}
                        disabled={acting[r.id]}
                        className="btn btn-primary btn-sm disabled:opacity-50"
                      >
                        {acting[r.id] ? '...' : '✅ Réactiver le compte'}
                      </button>
                      <button
                        onClick={() => decide(r.id, 'rejected')}
                        disabled={acting[r.id]}
                        className="btn btn-ghost btn-sm text-red-400 disabled:opacity-50"
                      >
                        ❌ Refuser
                      </button>
                      <button onClick={() => { setResponding(null); setResponse('') }} className="btn btn-ghost btn-sm ml-auto">
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setResponding(r.id)} className="btn btn-primary btn-sm">
                    Examiner la demande
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}