import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import Topbar from '../../components/layout/Topbar'
import { useAuth } from '../../context/AuthContext'
import { adminAPI, missionsAPI } from '../../api'
import { Spinner, EmptyState, Avatar, StatusBadge, Badge, Pagination, toast } from '../../components/ui'
import { CASABLANCA_TZ } from '../../utils/casablancaTime'

const TABS_BASE = [
  { id: 'infos',      label: '👤 Infos personnelles' },
  { id: 'production', label: '📋 Production' },
  { id: 'financier',  label: '💰 Financier' },
  { id: 'problemes',  label: '🚨 Problèmes' },
]
const TAB_FIABILITE = { id: 'fiabilite', label: '🛡️ Fiabilité' }

const fmtDate = (d, opts) => d ? new Date(d).toLocaleDateString('fr-FR', { timeZone: CASABLANCA_TZ, ...(opts || { day: 'numeric', month: 'short', year: 'numeric' }) }) : 'Non renseigné'
const fmtDateTime = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { timeZone: CASABLANCA_TZ, day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'
const val = (v) => (v === null || v === undefined || v === '') ? 'Non renseigné' : v

// YYYY-MM-DD (pour <input type="date">), decale de `days` par rapport a une date ISO donnee.
const addDays = (iso, days) => {
  const d = new Date(iso)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

// <input type="date"> n'a pas d'heure ; sans le +23:59:59.999 sur la borne haute, l'API
// (created_at <= date_to) caste a minuit et exclut toute la journee choisie.
const endOfDayISO = (dateStr) => dateStr ? `${dateStr}T23:59:59.999` : undefined

// Pour un Œil, is_active ne reflète plus que le blocage anti-fraude (POST /anti-fraud/block) —
// la suspension admin/score passe désormais par is_suspended (reliability.is_suspended), qui
// prime dans l'affichage pour éviter un badge "Actif" contradictoire avec "Suspendu".
const statusBadge = (user, isOeil, reliability) => {
  if (isOeil && reliability?.is_suspended) return { label: 'Suspendu', variant: 'red' }
  return user.is_active ? { label: 'Actif', variant: 'green' } : { label: 'Inactif', variant: 'gray' }
}

const CLAIM_STATUS = {
  pending:         { label: 'En attente',                variant: 'yellow' },
  resolved_oeil:   { label: 'Résolue en faveur de l\'Œil', variant: 'green'  },
  resolved_client: { label: 'Résolue en faveur du client', variant: 'blue'   },
}

const REPORT_STATUS = {
  open:        { label: 'Ouvert',    variant: 'red'    },
  in_progress: { label: 'En cours',  variant: 'yellow' },
  resolved:    { label: 'Résolu',    variant: 'green'  },
  dismissed:   { label: 'Ignoré',    variant: 'gray'   },
}

export default function UserProfile() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const focusDate = location.state?.focusDate
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState(location.state?.tab || 'infos')
  const [page, setPage] = useState(1)
  // Pre-rempli une fenetre de +/-3j autour de focusDate (venant d'un clic depuis
  // /admin/wallet-reconciliation) ; vide sinon — accès direct = historique complet, inchangé.
  const [dateFrom, setDateFrom] = useState(() => focusDate ? addDays(focusDate, -3) : '')
  const [dateTo, setDateTo] = useState(() => focusDate ? addDays(focusDate, 3) : '')

  const load = (p = page, df = dateFrom, dt = dateTo) => {
    setLoading(true)
    adminAPI.userProfile(userId, { page: p, limit: 20, date_from: df || undefined, date_to: endOfDayISO(dt) })
      .then(({ data }) => setData(data))
      .catch(() => toast('Erreur de chargement de la fiche', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(1); setPage(1) }, [userId])
  useEffect(() => { if (tab === 'production') load(page) }, [page])

  const applyDateFilter = () => load(page, dateFrom, dateTo)
  const clearDateFilter = () => { setDateFrom(''); setDateTo(''); load(page, '', '') }

  // Désactivation manuelle d'un compte client (FE-3 constat 08) — équivalent du bouton déjà en
  // place sur Oeils.jsx (Suspendre/Activer), même route PUT /admin/:id/toggle-active, qui gère
  // déjà correctement is_active pour un client (branche non-Œil, avec déclenchement de
  // handleClientDisabled sur toute mission en cours — voir routes/users.js). Raison demandée
  // uniquement à la désactivation, jamais à la réactivation — même logique que Oeils.jsx.
  const toggleClientActive = async () => {
    let reason
    if (data.user.is_active) {
      const input = window.prompt('Pourquoi désactivez-vous ce compte client ?')
      if (input === null) return
      reason = input.trim() || undefined
    }
    try {
      await adminAPI.toggleActive(data.user.id, reason ? { reason } : undefined)
      toast('Statut modifié', 'info')
      load()
    } catch {
      toast('Erreur', 'error')
    }
  }

  if (loading && !data) {
    return (
      <AppLayout>
        <Topbar title="Fiche utilisateur" />
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      </AppLayout>
    )
  }

  if (!data) {
    return (
      <AppLayout>
        <Topbar title="Fiche utilisateur" />
        <div className="p-6"><EmptyState icon="❓" title="Introuvable" description="Cet utilisateur n'existe pas." /></div>
      </AppLayout>
    )
  }

  const { user, production, financial, problems, reliability } = data
  const isOeil = user.role === 'oeil'
  const tabs = isOeil ? [...TABS_BASE, TAB_FIABILITE] : TABS_BASE
  const status = statusBadge(user, isOeil, reliability)

  return (
    <AppLayout>
      <Topbar title={`${user.first_name} ${user.last_name}`} />
      <div className="p-6">

        {/* En-tête */}
        <div className="card flex items-center gap-4 mb-5">
          <Avatar name={`${user.first_name} ${user.last_name}`} size={64} src={user.avatar_url} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold">{user.first_name} {user.last_name}</h2>
              <Badge variant={isOeil ? 'orange' : 'blue'}>{isOeil ? 'Œil' : 'Client'}</Badge>
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>
            <p className="text-xs text-[#AAA] mt-1">
              📍 {val(user.city)}{user.quartier ? ` · ${user.quartier}` : ''} · {user.email}
            </p>
            <p className="text-xs text-[#555] mt-0.5">Inscrit le {fmtDate(user.created_at)}</p>
          </div>
          {!isOeil && (
            <button onClick={toggleClientActive} className={`btn btn-ghost btn-sm ${user.is_active ? 'text-red-400' : 'text-green-400'}`}>
              {user.is_active ? 'Désactiver' : 'Activer'}
            </button>
          )}
          <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm">← Retour</button>
        </div>

        {/* Onglets */}
        <div className="flex gap-1 bg-[#222] rounded-xl p-1 w-fit mb-5 flex-wrap">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${tab === t.id ? 'bg-[#2A2A2A] text-white' : 'text-[#AAA] hover:text-white'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'infos' && <InfosTab user={user} isOeil={isOeil} reliability={reliability} />}
        {tab === 'production' && <ProductionTab production={production} isOeil={isOeil} page={page} setPage={setPage} />}
        {tab === 'financier' && (
          <FinancierTab
            financial={financial}
            isOeil={isOeil}
            navigate={navigate}
            focusDate={focusDate}
            dateFrom={dateFrom}
            dateTo={dateTo}
            setDateFrom={setDateFrom}
            setDateTo={setDateTo}
            onApply={applyDateFilter}
            onClear={clearDateFilter}
            loading={loading}
          />
        )}
        {tab === 'problemes' && <ProblemesTab problems={problems} />}
        {tab === 'fiabilite' && isOeil && <FiabiliteTab reliability={reliability} onReload={() => load()} />}
      </div>
    </AppLayout>
  )
}

// ═══ Onglet Infos personnelles ═══
function InfosTab({ user, isOeil, reliability }) {
  const status = statusBadge(user, isOeil, reliability)
  return (
    <div className="card grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Prénom" value={user.first_name} />
      <Field label="Nom" value={user.last_name} />
      <Field label="Email" value={user.email} />
      <Field label="Téléphone" value={val(user.phone)} />
      <Field label="Ville" value={val(user.city)} />
      <Field label="Quartier" value={val(user.quartier)} />
      <Field label="Date de naissance" value={fmtDate(user.birth_date)} />
      <Field label="Date d'inscription" value={fmtDate(user.created_at)} />
      <Field label="Statut" value={status.label} />
      {!isOeil && <Field label="Profil" value={val(user.profil)} />}
      {isOeil && <Field label="Situation" value={val(user.situation)} />}
      {isOeil && <Field label="Motivation" value={val(user.motivation)} />}
    </div>
  )
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-[10px] text-[#777] uppercase tracking-wider font-semibold mb-1">{label}</p>
      <p className="text-sm text-white/90">{value}</p>
    </div>
  )
}

// ═══ Onglet Production ═══
function ProductionTab({ production, isOeil, page, setPage }) {
  const missions = production?.missions || []
  if (missions.length === 0) {
    return <EmptyState icon="📋" title="Aucune mission" description={isOeil ? "Cet Œil n'a exécuté aucune mission." : "Ce client n'a commandé aucune mission."} />
  }
  return (
    <div className="card p-0">
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Mission</th>
              <th>Type</th>
              <th>Statut</th>
              <th>Date</th>
              <th>{isOeil ? 'Gain net' : 'Prix'}</th>
            </tr>
          </thead>
          <tbody>
            {missions.map(m => (
              <tr key={m.id}>
                <td className="font-medium">{m.title}</td>
                <td className="text-[#AAA]">{m.type}</td>
                <td><StatusBadge status={m.status} /></td>
                <td className="text-[#AAA] text-xs">{fmtDate(m.scheduled_at || m.created_at)}</td>
                <td className={isOeil ? 'text-[#FF4D00] font-semibold' : 'text-green-400 font-semibold'}>
                  {isOeil
                    ? (m.oeil_earning !== null && m.oeil_earning !== undefined ? `${parseFloat(m.oeil_earning).toFixed(0)} MAD` : '—')
                    : (m.price !== null && m.price !== undefined ? `${parseFloat(m.price).toFixed(0)} MAD` : '—')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} pages={production.pages} onPageChange={setPage} />
    </div>
  )
}

// ═══ Onglet Financier ═══
function FinancierTab({ financial, isOeil, navigate, focusDate, dateFrom, dateTo, setDateFrom, setDateTo, onApply, onClear, loading }) {
  const transactions = financial?.wallet_transactions || []
  const hasFilter = !!(dateFrom || dateTo)
  const [highlightId, setHighlightId] = useState(null)
  const highlightRef = useRef(null)
  const highlightedOnceRef = useRef(false)

  // A l'ouverture (venant d'un clic depuis la reconciliation), surligne la transaction la
  // plus proche de focusDate — une seule fois, pas a chaque changement manuel du filtre.
  useEffect(() => {
    if (focusDate && transactions.length > 0 && !highlightedOnceRef.current) {
      highlightedOnceRef.current = true
      const target = new Date(focusDate).getTime()
      const nearest = transactions.reduce((best, t) => {
        const diff = Math.abs(new Date(t.created_at).getTime() - target)
        return diff < best.diff ? { id: t.id, diff } : best
      }, { id: null, diff: Infinity })
      setHighlightId(nearest.id)
    }
  }, [focusDate, transactions])

  useEffect(() => {
    if (highlightId && highlightRef.current) highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [highlightId, transactions])

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card text-center">
          <p className="text-[10px] text-[#777] uppercase tracking-wider font-semibold mb-1">
            {isOeil ? 'Total des gains' : 'Total dépensé'}
          </p>
          <p className="text-xl font-bold text-white">
            {(isOeil ? financial.total_earnings : financial.total_spent).toFixed(0)} MAD
          </p>
        </div>
        <div className="card text-center">
          <p className="text-[10px] text-[#777] uppercase tracking-wider font-semibold mb-1">Solde actuel</p>
          <p className="text-xl font-bold text-[#FF4D00]">{financial.balance.toFixed(0)} MAD</p>
        </div>
        {isOeil && (
          <div className="card text-center">
            <p className="text-[10px] text-[#777] uppercase tracking-wider font-semibold mb-1">Virements reçus</p>
            <p className="text-xl font-bold text-white">{(financial.wire_transfers || []).length}</p>
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
          <h3 className="text-sm font-semibold">Historique des transactions</h3>
          <div className="flex items-center gap-2 flex-wrap">
            <input type="date" className="input py-1.5 text-xs max-w-[140px]" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            <span className="text-xs text-[#555]">→</span>
            <input type="date" className="input py-1.5 text-xs max-w-[140px]" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            <button onClick={onApply} disabled={loading} className="btn btn-primary btn-sm disabled:opacity-50">Filtrer</button>
            {hasFilter && <button onClick={onClear} disabled={loading} className="btn btn-ghost btn-sm disabled:opacity-50">Réinitialiser</button>}
          </div>
        </div>
        {transactions.length === 0 ? (
          <div className="card text-center py-8 text-[#AAA] text-sm">Aucune transaction{hasFilter ? ' sur cette période' : ''}</div>
        ) : (
          <div className="card p-0">
            <div className="table-wrap">
              <table>
                <thead><tr><th>Type</th><th>Motif</th><th>Mission</th><th>Montant</th><th>Date</th></tr></thead>
                <tbody>
                  {transactions.map(t => (
                    <tr
                      key={t.id}
                      ref={t.id === highlightId ? highlightRef : null}
                      className={t.id === highlightId ? 'bg-[#FF4D00]/10' : ''}
                    >
                      <td><Badge variant={t.type === 'credit' ? 'green' : 'red'}>{t.type === 'credit' ? 'Crédit' : 'Débit'}</Badge></td>
                      <td className="text-[#AAA]">{t.reason}</td>
                      <td>
                        {t.mission_id ? (
                          <button
                            className="text-xs text-[#FF4D00] hover:underline"
                            onClick={() => navigate('/admin/missions', { state: { search: t.mission_id } })}
                          >
                            📋 Voir
                          </button>
                        ) : (
                          <span className="text-xs text-[#555]">—</span>
                        )}
                      </td>
                      <td className={t.type === 'credit' ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold'}>
                        {t.type === 'credit' ? '+' : '-'}{parseFloat(t.amount).toFixed(0)} MAD
                      </td>
                      <td className="text-xs text-[#555]">{fmtDateTime(t.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ═══ Onglet Problèmes remontés ═══
function ProblemesTab({ problems }) {
  const reports = problems?.reports || []
  const claims = problems?.claims || []
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold mb-2">Signalements ({reports.length})</h3>
        {reports.length === 0 ? (
          <div className="card text-center py-8 text-[#AAA] text-sm">✅ Aucun signalement</div>
        ) : (
          <div className="card p-0">
            <div className="table-wrap">
              <table>
                <thead><tr><th>Type</th><th>Mission</th><th>Statut</th><th>Date</th></tr></thead>
                <tbody>
                  {reports.map(r => {
                    const s = REPORT_STATUS[r.status] || { label: r.status, variant: 'gray' }
                    return (
                      <tr key={r.id}>
                        <td className="font-medium">{r.type}</td>
                        <td className="text-[#AAA]">{r.mission_title}</td>
                        <td><Badge variant={s.variant}>{s.label}</Badge></td>
                        <td className="text-xs text-[#555]">{fmtDateTime(r.created_at)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-2">Réclamations ({claims.length})</h3>
        {claims.length === 0 ? (
          <div className="card text-center py-8 text-[#AAA] text-sm">✅ Aucune réclamation</div>
        ) : (
          <div className="card p-0">
            <div className="table-wrap">
              <table>
                <thead><tr><th>Mission</th><th>Motif</th><th>Statut</th><th>Date</th></tr></thead>
                <tbody>
                  {claims.map(c => {
                    const s = CLAIM_STATUS[c.status] || { label: c.status, variant: 'gray' }
                    return (
                      <tr key={c.id}>
                        <td className="text-[#AAA]">{c.mission_title}</td>
                        <td className="max-w-[280px] truncate">{c.comment}</td>
                        <td><Badge variant={s.variant}>{s.label}</Badge></td>
                        <td className="text-xs text-[#555]">{fmtDateTime(c.created_at)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ═══ Onglet Fiabilité (Œil uniquement) ═══
function FiabiliteTab({ reliability, onReload }) {
  const [requalifying, setRequalifying] = useState(null) // id de la déclaration en cours de traitement
  const { hasPermission, isSuperAdmin } = useAuth()
  const canRequalify = isSuperAdmin || hasPermission('identity')
  if (!reliability) return null
  const events = reliability.events || []
  const urgenceDeclarations = reliability.urgence_declarations || []

  // Requalification a posteriori d'une déclaration d'urgence (PROMPT 1 point 5) : applique une
  // pénalité de fiabilité si le préavis était insuffisant, notifie l'Œil — irréversible (le
  // backend refuse toute 2e requalification sur la même déclaration), d'où la confirmation.
  const requalify = async (declaration) => {
    if (!window.confirm(`Requalifier la déclaration d'urgence sur "${declaration.mission_title}" comme non légitime ? Cette action peut appliquer une pénalité de fiabilité à l'Œil et ne peut pas être annulée.`)) return
    setRequalifying(declaration.id)
    try {
      const { data } = await missionsAPI.requalifyUrgence(declaration.id)
      toast(data.penalty?.points ? `Requalifiée — pénalité appliquée (${data.penalty.points} pts)` : 'Requalifiée — aucune pénalité (préavis suffisant)', 'success')
      onReload?.()
    } catch (err) {
      toast(err.response?.data?.error || 'Erreur lors de la requalification', 'error')
    } finally {
      setRequalifying(null)
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card text-center">
          <p className="text-[10px] text-[#777] uppercase tracking-wider font-semibold mb-1">Score de fiabilité</p>
          <p className={`text-xl font-bold ${reliability.reliability_score >= 70 ? 'text-green-400' : reliability.reliability_score >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
            {reliability.reliability_score}%
          </p>
        </div>
        <div className="card text-center">
          <p className="text-[10px] text-[#777] uppercase tracking-wider font-semibold mb-1">Note moyenne</p>
          <p className="text-xl font-bold text-yellow-400">{reliability.rating_avg || '—'} <span className="text-xs text-[#AAA]">({reliability.rating_count} avis)</span></p>
        </div>
        <div className="card text-center">
          <p className="text-[10px] text-[#777] uppercase tracking-wider font-semibold mb-1">Statut</p>
          {reliability.is_suspended
            ? <Badge variant="red">Suspendu</Badge>
            : <Badge variant="green">Actif</Badge>}
        </div>
      </div>

      {reliability.is_suspended && reliability.suspended_reason && (
        <div className="card">
          <p className="text-xs text-[#AAA] mb-1">Raison de la suspension {reliability.suspended_at ? `(${fmtDate(reliability.suspended_at)})` : ''} :</p>
          <p className="text-sm text-white/80">{reliability.suspended_reason}</p>
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold mb-2">Déclarations d'urgence ({urgenceDeclarations.length})</h3>
        {urgenceDeclarations.length === 0 ? (
          <div className="card text-center py-8 text-[#AAA] text-sm">Aucune déclaration d'urgence</div>
        ) : (
          <div className="space-y-2">
            {urgenceDeclarations.map(d => (
              <div key={d.id} className="p-3 rounded-xl text-xs bg-[#222] flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-white/80 font-medium truncate">{d.mission_title}</div>
                  <div className="text-[#AAA] mt-0.5">{d.reason}</div>
                  <div className="text-[10px] text-[#555] mt-1">{fmtDateTime(d.created_at)}</div>
                </div>
                {d.admin_requalified_at ? (
                  <Badge variant="gray">Requalifiée le {fmtDate(d.admin_requalified_at)}</Badge>
                ) : canRequalify ? (
                  <button
                    onClick={() => requalify(d)}
                    disabled={requalifying === d.id}
                    className="btn btn-ghost btn-sm text-red-400 disabled:opacity-50 flex-shrink-0"
                  >
                    {requalifying === d.id ? '...' : 'Requalifier'}
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-2">Historique des événements ({events.length})</h3>
        {events.length === 0 ? (
          <div className="card text-center py-8 text-[#AAA] text-sm">Aucun événement enregistré</div>
        ) : (
          <div className="space-y-2">
            {events.map(e => (
              <div key={e.id} className={`p-3 rounded-xl text-xs ${e.is_grave ? 'bg-red-500/10 border border-red-500/20' : 'bg-[#222]'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-white/80 font-medium">{e.reason}</span>
                  <span className={`font-bold ${e.points >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {e.points >= 0 ? '+' : ''}{e.points}
                  </span>
                </div>
                <div className="text-[10px] text-[#555] mt-1">{fmtDateTime(e.created_at)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
