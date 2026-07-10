import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import Topbar from '../../components/layout/Topbar'
import { adminAPI } from '../../api'
import { Spinner, EmptyState, Avatar, StatusBadge, Badge, Pagination, toast } from '../../components/ui'

const TABS_BASE = [
  { id: 'infos',      label: '👤 Infos personnelles' },
  { id: 'production', label: '📋 Production' },
  { id: 'financier',  label: '💰 Financier' },
  { id: 'problemes',  label: '🚨 Problèmes' },
]
const TAB_FIABILITE = { id: 'fiabilite', label: '🛡️ Fiabilité' }

const fmtDate = (d, opts) => d ? new Date(d).toLocaleDateString('fr-FR', opts || { day: 'numeric', month: 'short', year: 'numeric' }) : 'Non renseigné'
const fmtDateTime = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'
const val = (v) => (v === null || v === undefined || v === '') ? 'Non renseigné' : v

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
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('infos')
  const [page, setPage] = useState(1)

  const load = (p = page) => {
    setLoading(true)
    adminAPI.userProfile(userId, { page: p, limit: 20 })
      .then(({ data }) => setData(data))
      .catch(() => toast('Erreur de chargement de la fiche', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(1); setPage(1) }, [userId])
  useEffect(() => { if (tab === 'production') load(page) }, [page])

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
              <Badge variant={user.is_active ? 'green' : 'gray'}>{user.is_active ? 'Actif' : 'Inactif'}</Badge>
              {isOeil && reliability?.is_suspended && <Badge variant="red">Suspendu</Badge>}
            </div>
            <p className="text-xs text-[#AAA] mt-1">
              📍 {val(user.city)}{user.quartier ? ` · ${user.quartier}` : ''} · {user.email}
            </p>
            <p className="text-xs text-[#555] mt-0.5">Inscrit le {fmtDate(user.created_at)}</p>
          </div>
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

        {tab === 'infos' && <InfosTab user={user} isOeil={isOeil} />}
        {tab === 'production' && <ProductionTab production={production} isOeil={isOeil} page={page} setPage={setPage} />}
        {tab === 'financier' && <FinancierTab financial={financial} isOeil={isOeil} />}
        {tab === 'problemes' && <ProblemesTab problems={problems} />}
        {tab === 'fiabilite' && isOeil && <FiabiliteTab reliability={reliability} />}
      </div>
    </AppLayout>
  )
}

// ═══ Onglet Infos personnelles ═══
function InfosTab({ user, isOeil }) {
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
      <Field label="Statut" value={user.is_active ? 'Actif' : 'Inactif'} />
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
function FinancierTab({ financial, isOeil }) {
  const transactions = financial?.wallet_transactions || []
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
        <h3 className="text-sm font-semibold mb-2">Historique des transactions</h3>
        {transactions.length === 0 ? (
          <div className="card text-center py-8 text-[#AAA] text-sm">Aucune transaction</div>
        ) : (
          <div className="card p-0">
            <div className="table-wrap">
              <table>
                <thead><tr><th>Type</th><th>Motif</th><th>Montant</th><th>Date</th></tr></thead>
                <tbody>
                  {transactions.map(t => (
                    <tr key={t.id}>
                      <td><Badge variant={t.type === 'credit' ? 'green' : 'red'}>{t.type === 'credit' ? 'Crédit' : 'Débit'}</Badge></td>
                      <td className="text-[#AAA]">{t.reason}</td>
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
function FiabiliteTab({ reliability }) {
  if (!reliability) return null
  const events = reliability.events || []
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
