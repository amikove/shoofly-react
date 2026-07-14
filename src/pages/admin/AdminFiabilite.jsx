import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import Topbar from '../../components/layout/Topbar'
import { reliabilityAPI } from '../../api'
import { Spinner, Avatar, toast, Pagination } from '../../components/ui'
import { VILLES, VILLES_LIST } from '../../constants/villes'
import { translateLocation } from '../../constants/villesTranslations'

const MAIN_TABS = [
  { id: 'suspended', label: '🔴 Suspendus' },
  { id: 'requests',  label: '📨 Demandes' },
  { id: 'scores',    label: '📊 Toutes les notes' },
]

export default function AdminFiabilite() {
  const [activeTab, setActiveTab] = useState('suspended')

  return (
    <AppLayout>
      <Topbar title="🛡️ Fiabilité des Œils" />
      <div className="p-6">
        {/* Onglets principaux */}
        <div className="flex gap-1 bg-[#222] rounded-xl p-1 w-fit mb-5">
          {MAIN_TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${activeTab === t.id ? 'bg-[#2A2A2A] text-white' : 'text-[#AAA] hover:text-white'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === 'suspended' && <SuspendedTab />}
        {activeTab === 'requests' && <RequestsTab />}
        {activeTab === 'scores' && <ScoresTab />}
      </div>
    </AppLayout>
  )
}

// ═══════════════════════════════════════════════════════════
// ONGLET 1 — Œils suspendus, avec réactivation directe possible
// ═══════════════════════════════════════════════════════════
function SuspendedTab() {
  const { i18n } = useTranslation()
  const navigate = useNavigate()
  const [oeils, setOeils] = useState([])
  const [loading, setLoading] = useState(true)
  const [reactivating, setReactivating] = useState(null) // id de l'Œil en cours de réactivation (affiche le mini-formulaire)
  const [resetScore, setResetScore] = useState('70')
  const [acting, setActing] = useState({})

  const load = () => {
    setLoading(true)
    reliabilityAPI.adminSuspended()
      .then(({ data }) => setOeils(data.oeils || []))
      .catch(() => toast('Erreur chargement', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const reactivate = async (oeilId) => {
    setActing(a => ({ ...a, [oeilId]: true }))
    try {
      await reliabilityAPI.adminReactivate(oeilId, { reset_score: parseInt(resetScore) })
      toast('Compte réactivé ✓', 'success')
      setReactivating(null)
      setResetScore('70')
      load()
    } catch (err) {
      toast(err.response?.data?.error || 'Erreur', 'error')
    } finally {
      setActing(a => ({ ...a, [oeilId]: false }))
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (oeils.length === 0) return <div className="card text-center py-12 text-[#AAA]">✅ Aucun Œil suspendu actuellement</div>

  return (
    <div className="space-y-4">
      {oeils.map((o) => (
        <div key={o.id} className="card">
          <div className="flex items-center gap-3 mb-3">
            <Avatar name={`${o.first_name} ${o.last_name}`} size={44} />
            <div className="flex-1">
              <p className="font-semibold cursor-pointer hover:text-[#FF4D00] hover:underline w-fit" onClick={() => navigate(`/admin/users/${o.id}`)}>{o.first_name} {o.last_name}</p>
              <p className="text-xs text-[#AAA]">{o.email}</p>
              <p className="text-xs text-[#666] mt-0.5">📍 {translateLocation(o.city, i18n.language)}{o.quartier ? ` · ${translateLocation(o.quartier, i18n.language)}` : ''}</p>
            </div>
            <div className="text-right">
              <span className="badge badge-red">Score : {o.reliability_score}%</span>
              {o.suspended_at && (
                <p className="text-[10px] text-[#555] mt-1">Suspendu le {new Date(o.suspended_at).toLocaleDateString('fr-FR')}</p>
              )}
            </div>
          </div>

          {o.suspended_reason && (
            <div className="bg-[#222] rounded-xl p-3 mb-3">
              <p className="text-xs text-[#AAA] mb-1">Raison de la suspension :</p>
              <p className="text-sm text-white/80">{o.suspended_reason}</p>
            </div>
          )}

          {reactivating === o.id ? (
            <div className="space-y-3 border-t border-white/10 pt-3">
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
                  onClick={() => reactivate(o.id)}
                  disabled={acting[o.id]}
                  className="btn btn-primary btn-sm disabled:opacity-50"
                >
                  {acting[o.id] ? '...' : '✅ Confirmer la réactivation'}
                </button>
                <button onClick={() => { setReactivating(null); setResetScore('70') }} className="btn btn-ghost btn-sm">
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setReactivating(o.id)} className="btn btn-primary btn-sm">
              Réactiver directement
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// ONGLET 2 — Demandes d'examen en attente (contenu existant, inchangé)
// ═══════════════════════════════════════════════════════════
function RequestsTab() {
  const { i18n } = useTranslation()
  const navigate = useNavigate()
  const [requests, setRequests] = useState([])
  const [loading, setLoading]   = useState(true)
  const [history, setHistory]   = useState({})
  const [expanded, setExpanded] = useState(null)
  const [responding, setResponding] = useState(null)
  const [response, setResponse] = useState('')
  const [resetScore, setResetScore] = useState('70')
  const [acting, setActing]     = useState({})

  const load = () => {
    setLoading(true)
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

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (requests.length === 0) return <div className="card text-center py-12 text-[#AAA]">✅ Aucune demande d'examen en attente</div>

  return (
    <div className="space-y-4">
      {requests.map((r) => (
        <div key={r.id} className="card">
          <div className="flex items-center gap-3 mb-3">
            <Avatar name={`${r.first_name} ${r.last_name}`} size={44} />
            <div className="flex-1">
              <p className="font-semibold cursor-pointer hover:text-[#FF4D00] hover:underline w-fit" onClick={() => navigate(`/admin/users/${r.oeil_id}`)}>{r.first_name} {r.last_name}</p>
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
                    <span className={`font-bold whitespace-nowrap ms-2 ${e.points >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {e.points >= 0 ? '+' : ''}{e.points}
                    </span>
                  </div>
                  {e.mission_title && (
                    <div className="text-[#AAA] space-y-0.5 mt-1.5">
                      <div>📋 {e.mission_title}</div>
                      {e.client_first_name && <div>👤 {e.client_first_name} {e.client_last_name}</div>}
                      {e.mission_scheduled_at && <div>📅 {new Date(e.mission_scheduled_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })} à {new Date(e.mission_scheduled_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>}
                      {e.mission_city && <div>📍 {translateLocation(e.mission_city, i18n.language)}{e.mission_quartier ? ` · ${translateLocation(e.mission_quartier, i18n.language)}` : ''}</div>}
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
  )
}

// ═══════════════════════════════════════════════════════════
// ONGLET 3 — Toutes les notes, filtrable par ville/quartier, triable par score, paginé
// ═══════════════════════════════════════════════════════════
function ScoresTab() {
  const { i18n } = useTranslation()
  const navigate = useNavigate()
  const [oeils, setOeils] = useState([])
  const [loading, setLoading] = useState(true)
  const [city, setCity] = useState('')
  const [quartier, setQuartier] = useState('')
  const [sort, setSort] = useState('score_asc')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const load = () => {
    setLoading(true)
    reliabilityAPI.adminAllScores({
      ...(city ? { city } : {}),
      ...(quartier ? { quartier } : {}),
      sort,
      page,
      limit: 20,
    })
      .then(({ data }) => {
        setOeils(data.oeils || [])
        setTotalPages(data.pages || 1)
      })
      .catch(() => toast('Erreur chargement', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [city, quartier, sort, page])
  // Revenir à la page 1 si un filtre change (évite une page vide hors limites)
  useEffect(() => { setPage(1) }, [city, quartier, sort])
  // Réinitialiser le quartier si la ville change (évite un quartier orphelin d'une autre ville)
  useEffect(() => { setQuartier('') }, [city])

  return (
    <div>
      {/* Filtres */}
      <div className="flex flex-wrap gap-3 mb-5">
        <select className="input max-w-[180px]" value={city} onChange={(e) => setCity(e.target.value)}>
          <option value="">Toutes les villes</option>
          {VILLES_LIST.map((v) => (
            <option key={v} value={v}>{translateLocation(v, i18n.language)}</option>
          ))}
        </select>

        <select
          className="input max-w-[200px]"
          value={quartier}
          onChange={(e) => setQuartier(e.target.value)}
          disabled={!city}
        >
          <option value="">Tous les quartiers</option>
          {(VILLES[city] || []).map((q) => (
            <option key={q} value={q}>{translateLocation(q, i18n.language)}</option>
          ))}
        </select>

        <select className="input max-w-[200px]" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="score_asc">Score croissant (à surveiller en premier)</option>
          <option value="score_desc">Score décroissant (meilleurs en premier)</option>
          <option value="city_asc">Trier par ville</option>
          <option value="quartier_asc">Trier par quartier</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : oeils.length === 0 ? (
        <div className="card text-center py-12 text-[#AAA]">Aucun Œil trouvé pour ce filtre</div>
      ) : (
        <div className="card p-0">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Email</th>
                  <th>Ville</th>
                  <th>Quartier</th>
                  <th>Score</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {oeils.map((o) => (
                  <tr key={o.id}>
                    <td className="font-medium cursor-pointer hover:text-[#FF4D00] hover:underline" onClick={() => navigate(`/admin/users/${o.id}`)}>{o.first_name} {o.last_name}</td>
                    <td className="text-[#AAA]">{o.email}</td>
                    <td className="text-[#AAA]">{o.city ? translateLocation(o.city, i18n.language) : '—'}</td>
                    <td className="text-[#AAA]">{o.quartier ? translateLocation(o.quartier, i18n.language) : '—'}</td>
                    <td>
                      <span className={`badge ${o.reliability_score >= 70 ? 'badge-green' : o.reliability_score >= 50 ? 'badge-yellow' : 'badge-red'}`}>
                        {o.reliability_score}%
                      </span>
                    </td>
                    <td>
                      {o.is_suspended
                        ? <span className="badge badge-red">Suspendu</span>
                        : <span className="badge badge-green">Actif</span>}
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
  )
}