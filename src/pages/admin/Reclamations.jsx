import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import Topbar from '../../components/layout/Topbar'
import { adminAPI, missionsAPI } from '../../api'
import { Spinner, toast } from '../../components/ui'
import { CASABLANCA_TZ } from '../../utils/casablancaTime'

export default function AdminReclamations() {
  const navigate = useNavigate()
  const [claims, setClaims]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [resolving, setResolving] = useState(null)
  // PROMPT 2 (2026-08-17, section 0) — coché = le litige est un "client absent/injoignable" ;
  // une résolution "en faveur de l'Œil" avec ce motif (a) laisse la commission cash en attente
  // au lieu de la débiter automatiquement, (b) pose un strike no-show sur le client. Les deux
  // restent deux actions indépendantes dans le code (voir clientAbsent ci-dessous vs. les
  // boutons de la section "Commission en attente" plus bas) — jamais fusionnées.
  const [clientAbsent, setClientAbsent] = useState({})

  // PROMPT 2 — deux files distinctes de décisions commission différées (cash, litige "client
  // absent" résolu en faveur de l'Œil) : l'une vient d'une résolution manuelle ci-dessus
  // (claims), l'autre du silence du client à 12h (mission_assistance_requests, auto-validée
  // sans intervention humaine — jamais de strike associé à cette 2e file, voir backend).
  const [claimsCommissionPending, setClaimsCommissionPending] = useState([])
  const [assistanceCommissionPending, setAssistanceCommissionPending] = useState([])
  const [commissionLoading, setCommissionLoading] = useState(true)
  const [decidingId, setDecidingId] = useState(null)

  const load = () => {
    setLoading(true)
    adminAPI.claims()
      .then(({ data }) => setClaims(data.claims || []))
      .catch(() => toast('Erreur de chargement', 'error'))
      .finally(() => setLoading(false))
  }

  const loadCommissionPending = () => {
    setCommissionLoading(true)
    Promise.all([adminAPI.claimsCommissionPending(), missionsAPI.assistanceCommissionPending()])
      .then(([claimsRes, assistanceRes]) => {
        setClaimsCommissionPending(claimsRes.data.claims || [])
        setAssistanceCommissionPending(assistanceRes.data.assistance_requests || [])
      })
      .catch(() => toast('Erreur de chargement (commission en attente)', 'error'))
      .finally(() => setCommissionLoading(false))
  }

  useEffect(() => { load(); loadCommissionPending() }, [])

  const resolve = async (claimId, missionId, decision) => {
    setResolving(claimId)
    try {
      await adminAPI.resolveClaim(missionId, decision, decision === 'oeil' && clientAbsent[claimId] ? 'client_absent' : undefined)
      setClaims(prev => prev.filter(c => c.id !== claimId))
      toast(decision === 'oeil' ? '✅ Résolu en faveur de l\'Œil' : '✅ Résolu en faveur du client', 'success')
      if (decision === 'oeil' && clientAbsent[claimId]) loadCommissionPending()
    } catch (err) {
      toast(err.response?.data?.error || 'Erreur', 'error')
    } finally { setResolving(null) }
  }

  const decideClaimCommission = async (missionId, decision) => {
    setDecidingId(`claim-${missionId}`)
    try {
      await adminAPI.claimsCommissionDecide(missionId, decision)
      setClaimsCommissionPending(prev => prev.filter(c => c.mission_id !== missionId))
      toast(decision === 'debit' ? '✅ Commission débitée' : '✅ Commission libérée', 'success')
    } catch (err) {
      toast(err.response?.data?.error || 'Erreur', 'error')
    } finally { setDecidingId(null) }
  }

  const decideAssistanceCommission = async (assistanceRequestId, decision) => {
    setDecidingId(`assistance-${assistanceRequestId}`)
    try {
      await missionsAPI.assistanceCommissionDecide(assistanceRequestId, decision)
      setAssistanceCommissionPending(prev => prev.filter(a => a.id !== assistanceRequestId))
      toast(decision === 'debit' ? '✅ Commission débitée' : '✅ Commission libérée', 'success')
    } catch (err) {
      toast(err.response?.data?.error || 'Erreur', 'error')
    } finally { setDecidingId(null) }
  }

  return (
    <AppLayout>
      <Topbar title="Réclamations en cours" />
      <div className="p-4 md:p-6 space-y-3">
        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : claims.length === 0 ? (
          <div className="card text-center py-12 text-[#AAA]">
            <div className="text-4xl mb-3">✅</div>
            <p className="text-sm">Aucune réclamation en cours</p>
          </div>
        ) : claims.map((c) => (
          <div key={c.id} className="card space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                  <div className="font-semibold text-sm">
                    {c.mission_title}
                    <span className="text-[#555] font-normal ms-2 text-xs">#{String(c.mission_id).slice(-6).toUpperCase()}</span>
                  </div>
                  <div className="text-xs text-[#AAA] mt-0.5">
                    Client :{' '}
                    <span className="text-white cursor-pointer hover:text-[#FF4D00] hover:underline" onClick={() => navigate(`/admin/users/${c.client_id}`)}>
                      {c.client_name}
                    </span>
                    {' '}· Œil :{' '}
                    <span className="text-white cursor-pointer hover:text-[#FF4D00] hover:underline" onClick={() => navigate(`/admin/users/${c.oeil_id}`)}>
                      {c.oeil_name}
                    </span>
                </div>
                <div className="text-xs text-[#AAA] mt-0.5">
                  Prix : <span className="text-green-400">{c.mission_price} MAD</span> · Gain Œil : <span className="text-[#FF4D00]">{c.oeil_earning} MAD</span>
                </div>
              </div>
              <span className="text-xs text-[#555] shrink-0">
                {new Date(c.created_at).toLocaleDateString('fr-FR', { timeZone: CASABLANCA_TZ, day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <div className="bg-[#222] rounded-xl p-3">
              <div className="text-xs text-[#AAA] mb-1">Motif du client :</div>
              <p className="text-sm text-white/80">{c.comment}</p>
            </div>

            <label className="flex items-center gap-2 text-xs text-[#AAA] cursor-pointer">
              <input
                type="checkbox"
                checked={!!clientAbsent[c.id]}
                onChange={(e) => setClientAbsent(prev => ({ ...prev, [c.id]: e.target.checked }))}
              />
              Motif : client absent / injoignable
              {c.mission_price !== undefined && ' (mission cash : la commission ne sera pas débitée automatiquement, décision séparée ci-dessous une fois résolu)'}
            </label>

            <div className="flex gap-2">
              <button
                onClick={() => resolve(c.id, c.mission_id, 'oeil')}
                disabled={resolving === c.id}
                className="btn btn-primary btn-sm flex-1 justify-center disabled:opacity-60"
              >
                ✅ Valider en faveur de l'Œil
              </button>
              <button
                onClick={() => resolve(c.id, c.mission_id, 'client')}
                disabled={resolving === c.id}
                className="btn btn-ghost btn-sm flex-1 justify-center text-orange-400 disabled:opacity-60"
              >
                🔄 Rembourser le client
              </button>
            </div>
          </div>
        ))}

        <div className="pt-4">
          <h2 className="text-base font-semibold text-white mb-1">
            Commission en attente (litiges "client absent", cash)
          </h2>
          <p className="text-xs text-[#888] mb-3">
            ⚠️ Ne débitez la commission que si vous avez une preuve que le client a bien payé l'Œil (message, appel, autre trace) — dans le doute, libérez-la.
          </p>
          {commissionLoading ? (
            <div className="flex justify-center py-10"><Spinner size="lg" /></div>
          ) : claimsCommissionPending.length === 0 && assistanceCommissionPending.length === 0 ? (
            <div className="card text-center py-8 text-[#AAA]">
              <p className="text-sm">Aucune décision commission en attente</p>
            </div>
          ) : (
            <div className="space-y-3">
              {claimsCommissionPending.map((c) => (
                <div key={`claim-${c.mission_id}`} className="card space-y-2">
                  <div className="text-xs text-[#555]">Réclamation résolue — {c.mission_title}</div>
                  <div className="text-sm">
                    Œil :{' '}
                    <span className="text-white cursor-pointer hover:text-[#FF4D00] hover:underline" onClick={() => navigate(`/admin/users/${c.oeil_id}`)}>
                      {c.oeil_name}
                    </span>
                    {' '}· Commission due : <span className="text-[#FF4D00]">{c.mission_commission} MAD</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => decideClaimCommission(c.mission_id, 'debit')}
                      disabled={decidingId === `claim-${c.mission_id}`}
                      className="btn btn-primary btn-sm flex-1 justify-center disabled:opacity-60"
                    >
                      Débiter la commission
                    </button>
                    <button
                      onClick={() => decideClaimCommission(c.mission_id, 'release')}
                      disabled={decidingId === `claim-${c.mission_id}`}
                      className="btn btn-ghost btn-sm flex-1 justify-center text-green-400 disabled:opacity-60"
                    >
                      Libérer la commission
                    </button>
                  </div>
                </div>
              ))}
              {assistanceCommissionPending.map((a) => (
                <div key={`assistance-${a.id}`} className="card space-y-2">
                  <div className="text-xs text-[#555]">Auto-validée après délai (silence du client) — {a.mission_title}</div>
                  <div className="text-sm">
                    Œil :{' '}
                    <span className="text-white cursor-pointer hover:text-[#FF4D00] hover:underline" onClick={() => navigate(`/admin/users/${a.oeil_id}`)}>
                      {a.oeil_name}
                    </span>
                    {' '}· Commission due : <span className="text-[#FF4D00]">{a.mission_commission} MAD</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => decideAssistanceCommission(a.id, 'debit')}
                      disabled={decidingId === `assistance-${a.id}`}
                      className="btn btn-primary btn-sm flex-1 justify-center disabled:opacity-60"
                    >
                      Débiter la commission
                    </button>
                    <button
                      onClick={() => decideAssistanceCommission(a.id, 'release')}
                      disabled={decidingId === `assistance-${a.id}`}
                      className="btn btn-ghost btn-sm flex-1 justify-center text-green-400 disabled:opacity-60"
                    >
                      Libérer la commission
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}