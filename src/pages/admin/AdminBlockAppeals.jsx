import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import Topbar from '../../components/layout/Topbar'
import { blockAppealsAPI } from '../../api'
import { Spinner, Avatar, toast } from '../../components/ui'
import { CASABLANCA_TZ } from '../../utils/casablancaTime'

// Traitement des contestations de comptes bloqués (is_active=false) — chantier L4 (2026-09-09).
// Symétrique de l'onglet « 📨 Demandes » de AdminFiabilite.jsx (demandes d'examen des Œils
// is_suspended) : même flux pending → approved|rejected + réponse admin. Ici la cible peut être
// un Œil OU un client, et l'approbation réactive le compte (is_active=true, deactivation_context
// remis à NULL ; strikes no-show purgés le cas échéant — voir routes/blockAppeals.js).

const TABS = [
  { id: 'pending',  label: '⏳ En attente' },
  { id: 'approved', label: '✅ Approuvées' },
  { id: 'rejected', label: '❌ Refusées' },
]

const CONTEXT_LABEL = {
  fraud_block:    { text: 'Blocage anti-fraude', cls: 'badge-red' },
  admin_toggle:   { text: 'Désactivation admin', cls: 'badge-yellow' },
  noshow_strikes: { text: 'Strikes no-show',     cls: 'badge-yellow' },
}

export default function AdminBlockAppeals() {
  const [tab, setTab] = useState('pending')
  return (
    <AppLayout>
      <Topbar title="🔓 Contestations de blocage" />
      <div className="p-6">
        <div className="flex gap-1 bg-[#222] rounded-xl p-1 w-fit mb-5">
          {TABS.map(x => (
            <button key={x.id} onClick={() => setTab(x.id)}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${tab === x.id ? 'bg-[#2A2A2A] text-white' : 'text-[#AAA] hover:text-white'}`}>
              {x.label}
            </button>
          ))}
        </div>
        {/* key={tab} : chaque changement d'onglet remonte la liste (spinner initial propre,
            sans setState synchrone dans un effet). */}
        <AppealsList key={tab} status={tab} />
      </div>
    </AppLayout>
  )
}

function AppealsList({ status }) {
  const navigate = useNavigate()
  const [appeals, setAppeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [responding, setResponding] = useState(null)
  const [response, setResponse] = useState('')
  const [acting, setActing] = useState({})

  const load = () => {
    blockAppealsAPI.adminList(status)
      .then(({ data }) => setAppeals(data.appeals || []))
      .catch(() => toast('Erreur chargement', 'error'))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const decide = async (id, decision) => {
    setActing(a => ({ ...a, [id]: true }))
    try {
      await blockAppealsAPI.decide(id, { decision, response })
      toast(decision === 'approved' ? 'Compte réactivé ✓' : 'Contestation refusée', decision === 'approved' ? 'success' : 'info')
      setResponding(null)
      setResponse('')
      load()
    } catch (err) {
      toast(err.response?.data?.error || 'Erreur', 'error')
    } finally { setActing(a => ({ ...a, [id]: false })) }
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (appeals.length === 0) return <div className="card text-center py-12 text-[#AAA]">Aucune contestation {status === 'pending' ? 'en attente' : status === 'approved' ? 'approuvée' : 'refusée'}</div>

  return (
    <div className="space-y-4">
      {appeals.map((a) => {
        const ctx = CONTEXT_LABEL[a.deactivation_context] || { text: a.deactivation_context || 'Inconnu', cls: 'badge-yellow' }
        return (
          <div key={a.id} className="card">
            <div className="flex items-center gap-3 mb-3">
              <Avatar name={`${a.first_name} ${a.last_name}`} size={44} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold cursor-pointer hover:text-[#FF4D00] hover:underline w-fit" onClick={() => navigate(`/admin/users/${a.user_id}`)}>
                  {a.first_name} {a.last_name}
                </p>
                <p className="text-xs text-[#AAA]">{a.email} · {a.user_role === 'oeil' ? 'Œil' : a.user_role === 'client' ? 'Client' : a.user_role}</p>
              </div>
              <div className="text-right shrink-0">
                <span className={`badge ${ctx.cls}`}>{ctx.text}</span>
                <p className="text-[10px] text-[#555] mt-1">{new Date(a.created_at).toLocaleDateString('fr-FR', { timeZone: CASABLANCA_TZ })}</p>
              </div>
            </div>

            <div className="bg-[#222] rounded-xl p-3 mb-3">
              <p className="text-xs text-[#AAA] mb-1">Message :</p>
              <p className="text-sm text-white/80 whitespace-pre-wrap">{a.message}</p>
            </div>

            {a.admin_response && (
              <div className="bg-[#181818] rounded-lg p-2.5 mb-3">
                <p className="text-[10px] text-[#777] mb-1">Réponse envoyée{a.reviewed_at ? ` le ${new Date(a.reviewed_at).toLocaleDateString('fr-FR', { timeZone: CASABLANCA_TZ })}` : ''} :</p>
                <p className="text-xs text-white/80">{a.admin_response}</p>
              </div>
            )}

            {status === 'pending' && (
              responding === a.id ? (
                <div className="space-y-3 border-t border-white/10 pt-3">
                  <textarea
                    className="input resize-none h-20 w-full text-sm"
                    placeholder="Réponse à l'utilisateur (optionnel)..."
                    value={response}
                    onChange={e => setResponse(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button onClick={() => decide(a.id, 'approved')} disabled={acting[a.id]} className="btn btn-primary btn-sm disabled:opacity-50">
                      {acting[a.id] ? '...' : '✅ Réactiver le compte'}
                    </button>
                    <button onClick={() => decide(a.id, 'rejected')} disabled={acting[a.id]} className="btn btn-ghost btn-sm text-red-400 disabled:opacity-50">
                      ❌ Refuser
                    </button>
                    <button onClick={() => { setResponding(null); setResponse('') }} className="btn btn-ghost btn-sm ml-auto">
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setResponding(a.id)} className="btn btn-primary btn-sm">
                  Examiner la contestation
                </button>
              )
            )}
          </div>
        )
      })}
    </div>
  )
}
