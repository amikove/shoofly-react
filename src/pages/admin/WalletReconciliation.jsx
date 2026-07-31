import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useLocation } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import Topbar from '../../components/layout/Topbar'
import { adminAPI } from '../../api'
import { Spinner, toast, Pagination, Badge } from '../../components/ui'

const TABS = ['unresolved', 'resolved', 'all']

export default function WalletReconciliation() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const [alerts, setAlerts] = useState([])
  const [userMap, setUserMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('unresolved')
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [resolvingId, setResolvingId] = useState(null)
  const [highlightId, setHighlightId] = useState(null)
  const [reloadTick, setReloadTick] = useState(0)
  const highlightRef = useRef(null)

  // Une seule requête pour tous les utilisateurs (même pattern que Clients.jsx/Oeils.jsx) plutôt
  // qu'un GET /admin/profile/:userId (fiche lourde, plusieurs requêtes) par ligne affichée.
  useEffect(() => {
    adminAPI.users({})
      .then(({ data }) => {
        const map = {}
        ;(data.users || []).forEach((u) => { map[u.id] = u })
        setUserMap(map)
      })
      .catch(() => {})
  }, [])

  // Garde d'annulation : le tab peut changer juste après le montage (deep-link notification,
  // voir l'effet plus bas), déclenchant 2 requêtes quasi simultanées (unresolved puis all) — sans
  // ce guard, si la 1ère répond après la 2e, son résultat périmé écraserait le bon.
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    adminAPI.walletReconciliationAlerts({ status: tab, page, limit: 20 })
      .then(({ data }) => {
        if (cancelled) return
        setAlerts(data.alerts || [])
        setPages(data.pages || 1)
      })
      .catch(() => { if (!cancelled) toast(t('walletReconciliation.loadError'), 'error') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [tab, page, reloadTick, t])

  useEffect(() => { setPage(1) }, [tab])

  useEffect(() => {
    const openId = location.state?.openAlertId
    if (openId) { setTab('all'); setHighlightId(openId) }
  }, [location.state])

  useEffect(() => {
    if (highlightId && highlightRef.current) highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [highlightId, alerts])

  const resolve = async (id) => {
    setResolvingId(id)
    try {
      await adminAPI.resolveWalletReconciliationAlert(id)
      toast(t('walletReconciliation.resolveSuccess'), 'success')
      setReloadTick((x) => x + 1)
    } catch (err) {
      toast(err.response?.data?.error || t('walletReconciliation.resolveError'), 'error')
    } finally {
      setResolvingId(null)
    }
  }

  const userLabel = (a) => {
    const u = userMap[a.user_id]
    return u ? `${u.first_name} ${u.last_name}` : a.user_id
  }

  return (
    <AppLayout>
      <Topbar title={t('walletReconciliation.title')} />
      <div className="p-4 md:p-6 space-y-5">
        <div className="flex gap-1 bg-[#222] rounded-xl p-1 w-fit max-w-full overflow-x-auto">
          {TABS.map((s) => (
            <button key={s} onClick={() => setTab(s)}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${tab === s ? 'bg-[#2A2A2A] text-white' : 'text-[#AAA] hover:text-white'}`}>
              {t(`walletReconciliation.tabs.${s}`)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : alerts.length === 0 ? (
          <div className="card text-center py-12 text-[#AAA]">
            <div className="text-4xl mb-3">✅</div>
            <p className="text-sm">{t('walletReconciliation.empty')}</p>
          </div>
        ) : (
          <>
            <div className="card p-0">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>{t('walletReconciliation.table.user')}</th>
                      <th>{t('walletReconciliation.table.type')}</th>
                      <th>{t('walletReconciliation.table.storedBalance')}</th>
                      <th>{t('walletReconciliation.table.ledgerBalance')}</th>
                      <th>{t('walletReconciliation.table.discrepancy')}</th>
                      <th>{t('walletReconciliation.table.detectedAt')}</th>
                      <th>{t('walletReconciliation.table.status')}</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {alerts.map((a) => (
                      <tr
                        key={a.id}
                        ref={a.id === highlightId ? highlightRef : null}
                        className={a.id === highlightId ? 'bg-[#FF4D00]/10' : ''}
                      >
                        <td>
                          <span
                            className="text-white cursor-pointer hover:text-[#FF4D00] hover:underline"
                            onClick={() => navigate(`/admin/users/${a.user_id}`)}
                          >
                            {userLabel(a)}
                          </span>
                        </td>
                        <td>
                          <Badge variant={a.user_type === 'oeil' ? 'blue' : 'gray'}>{t(`login.roles.${a.user_type}`)}</Badge>
                        </td>
                        <td className="text-[#AAA]">{Number(a.stored_balance).toFixed(2)} MAD</td>
                        <td className="text-[#AAA]">{Number(a.ledger_balance).toFixed(2)} MAD</td>
                        <td className={`font-semibold ${Number(a.discrepancy) > 0 ? 'text-red-400' : 'text-yellow-400'}`}>
                          {Number(a.discrepancy) > 0 ? '+' : ''}{Number(a.discrepancy).toFixed(2)} MAD
                        </td>
                        <td className="text-xs text-[#AAA]">
                          {new Date(a.detected_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td>
                          {a.resolved_at ? (
                            <Badge variant="green">
                              {t('walletReconciliation.resolvedLabel')} {new Date(a.resolved_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                            </Badge>
                          ) : (
                            <Badge variant="orange">{t('walletReconciliation.tabs.unresolved')}</Badge>
                          )}
                        </td>
                        <td>
                          {!a.resolved_at && (
                            <button
                              onClick={() => resolve(a.id)}
                              disabled={resolvingId === a.id}
                              className="btn btn-primary btn-sm disabled:opacity-50"
                            >
                              {resolvingId === a.id ? '...' : t('walletReconciliation.resolve')}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <Pagination page={page} pages={pages} onPageChange={setPage} />
          </>
        )}
      </div>
    </AppLayout>
  )
}
