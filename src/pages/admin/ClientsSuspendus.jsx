import { useState, useEffect, Fragment } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import Topbar from '../../components/layout/Topbar'
import { adminAPI } from '../../api'
import { Spinner, toast, Badge } from '../../components/ui'
import { CASABLANCA_TZ } from '../../utils/casablancaTime'

// PROMPT 2 point 6 (2026-08-17) — écran dédié aux clients touchés par le mécanisme de strike
// no-show (backend : utils/clientStrikes.js, routes/users.js GET/POST /admin/clients/...),
// distinct de la gestion Œil existante (AdminFiabilite.jsx). Structure calquée sur
// WalletReconciliation.jsx (tabs + table + action de résolution + reloadTick pour refetch).
const TABS = ['blocked', 'unblocked', 'all']

export default function ClientsSuspendus() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('blocked')
  const [unblockingId, setUnblockingId] = useState(null)
  const [reloadTick, setReloadTick] = useState(0)
  const [expandedId, setExpandedId] = useState(null)
  const [strikeHistory, setStrikeHistory] = useState({})

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    adminAPI.clientStrikes(tab)
      .then(({ data }) => { if (!cancelled) setClients(data.clients || []) })
      .catch(() => { if (!cancelled) toast(t('clientsSuspendus.loadError'), 'error') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [tab, reloadTick, t])

  const unblock = async (id) => {
    setUnblockingId(id)
    try {
      await adminAPI.unblockClient(id)
      toast(t('clientsSuspendus.unblockSuccess'), 'success')
      setReloadTick((x) => x + 1)
    } catch (err) {
      toast(err.response?.data?.error || t('clientsSuspendus.unblockError'), 'error')
    } finally {
      setUnblockingId(null)
    }
  }

  const toggleHistory = async (id) => {
    if (expandedId === id) { setExpandedId(null); return }
    setExpandedId(id)
    if (!strikeHistory[id]) {
      try {
        const { data } = await adminAPI.clientStrikeHistory(id)
        setStrikeHistory((prev) => ({ ...prev, [id]: data.strikes || [] }))
      } catch { /* silencieux — l'historique reste replié, la ligne principale reste utilisable */ }
    }
  }

  return (
    <AppLayout>
      <Topbar title={t('clientsSuspendus.title')} />
      <div className="p-4 md:p-6 space-y-5">
        <div className="flex gap-1 bg-[#222] rounded-xl p-1 w-fit max-w-full overflow-x-auto">
          {TABS.map((s) => (
            <button key={s} onClick={() => setTab(s)}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${tab === s ? 'bg-[#2A2A2A] text-white' : 'text-[#AAA] hover:text-white'}`}>
              {t(`clientsSuspendus.tabs.${s}`)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : clients.length === 0 ? (
          <div className="card text-center py-12 text-[#AAA]">
            <div className="text-4xl mb-3">✅</div>
            <p className="text-sm">{t('clientsSuspendus.empty')}</p>
          </div>
        ) : (
          <div className="card p-0">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>{t('clientsSuspendus.table.client')}</th>
                    <th>{t('clientsSuspendus.table.strikes')}</th>
                    <th>{t('clientsSuspendus.table.lastStrike')}</th>
                    <th>{t('clientsSuspendus.table.status')}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((c) => (
                    <Fragment key={c.id}>
                      <tr>
                        <td>
                          <span
                            className="text-white cursor-pointer hover:text-[#FF4D00] hover:underline"
                            onClick={() => navigate(`/admin/users/${c.id}`)}
                          >
                            {c.first_name} {c.last_name}
                          </span>
                          <div className="text-xs text-[#AAA]">{c.phone}</div>
                        </td>
                        <td>
                          <button onClick={() => toggleHistory(c.id)} className="text-[#FF4D00] hover:underline text-sm">
                            {c.client_noshow_strikes} {t('clientsSuspendus.table.strikesUnit')}
                          </button>
                        </td>
                        <td className="text-xs text-[#AAA]">
                          {c.last_strike_at
                            ? new Date(c.last_strike_at).toLocaleDateString('fr-FR', { timeZone: CASABLANCA_TZ, day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                            : '—'}
                        </td>
                        <td>
                          {c.is_active ? (
                            <Badge variant="green">{t('clientsSuspendus.tabs.unblocked')}</Badge>
                          ) : (
                            <Badge variant="red">{t('clientsSuspendus.tabs.blocked')}</Badge>
                          )}
                        </td>
                        <td>
                          {!c.is_active && (
                            <button
                              onClick={() => unblock(c.id)}
                              disabled={unblockingId === c.id}
                              className="btn btn-primary btn-sm disabled:opacity-50"
                            >
                              {unblockingId === c.id ? '...' : t('clientsSuspendus.unblock')}
                            </button>
                          )}
                        </td>
                      </tr>
                      {expandedId === c.id && (
                        <tr>
                          <td colSpan={5} className="bg-[#1A1A1A]">
                            {!strikeHistory[c.id] ? (
                              <div className="py-3 text-center"><Spinner size="sm" /></div>
                            ) : (
                              <ul className="py-2 px-4 space-y-1">
                                {strikeHistory[c.id].map((s) => (
                                  <li key={s.id} className="text-xs text-[#AAA]">
                                    {new Date(s.created_at).toLocaleDateString('fr-FR', { timeZone: CASABLANCA_TZ, day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                    {' — '}{s.mission_title}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
