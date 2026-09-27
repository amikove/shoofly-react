import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { adminAPI } from '../../api'
import { Spinner } from '../ui'

// ── Onglet « Notifications » du tableau de bord admin (chantier 2 lot 1 bis, 2026-09-27) ──
// Efficacité des canaux : réception/clic push (accusés du service worker), lecture (in-app vs
// push), abonnements push par rôle, relances WhatsApp nécessaires vs évitées. Données agrégées
// côté serveur (GET /api/users/admin/dashboard/notifications), jamais de ligne individuelle.
// Filtres : période 7/30 jours, rôle, type (title_key), appareil (indicateurs push seulement).

const ROLES = ['client', 'oeil', 'admin']
const DEVICES = ['android', 'ios', 'desktop']
const PRESENCE_KINDS = ['presence_j1', 'presence_h2', 'presence_h45']
const NEEDED = ['sent', 'failed', 'skipped_no_phone']
const AVOIDED = ['skipped_confirmed', 'skipped_read', 'skipped_viewed']

const pct = (a, b) => (b > 0 ? `${Math.round((a / b) * 100)} %` : '—')

// Nombre + pourcentage empilés (lisible à 375 px, jamais coupé au milieu).
function NumPct({ n, of }) {
  return (
    <td className="text-end align-top py-1.5 whitespace-nowrap">
      {n}<span className="block text-[10px] text-[#777]">{pct(n, of)}</span>
    </td>
  )
}

function Kpi({ label, value, sub }) {
  return (
    <div className="stat-card min-w-0">
      <div className="text-xs text-[#AAA] mb-1 break-words">{label}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {sub && <div className="text-[11px] text-[#777] mt-1 break-words">{sub}</div>}
    </div>
  )
}

export default function NotificationsStats() {
  const { t } = useTranslation()
  const [days, setDays] = useState(7)
  const [role, setRole] = useState('')
  const [type, setType] = useState('')
  const [device, setDevice] = useState('')
  const [data, setData] = useState(null)
  // Clé des filtres dont la réponse est affichée : « en cours » = la clé courante n'est pas encore
  // chargée (aucun setState synchrone dans l'effet).
  const [loaded, setLoaded] = useState({ key: null, error: false })
  const key = `${days}|${role}|${type}|${device}`
  const loading = loaded.key !== key
  const error = !loading && loaded.error

  useEffect(() => {
    let alive = true
    const params = { days, ...(role && { role }), ...(type && { type }), ...(device && { device }) }
    adminAPI.dashboardNotifications(params)
      .then(({ data: d }) => { if (alive) { setData(d); setLoaded({ key, error: false }) } })
      .catch(() => { if (alive) setLoaded({ key, error: true }) })
    return () => { alive = false }
  }, [key, days, role, type, device])

  const duration = (s) => {
    if (s === null || s === undefined) return '—'
    if (s < 60) return t('adminNotifStats.seconds', { n: Math.round(s) })
    if (s < 3600) return t('adminNotifStats.minutes', { n: Math.round(s / 60) })
    return t('adminNotifStats.hours', { h: Math.floor(s / 3600), m: Math.round((s % 3600) / 60) })
  }
  const typeLabel = (key) => {
    const label = t(`notif.${key}`, { defaultValue: key, missionTitle: '…', count: '…', lateMinutes: '…', time: '…', deadlineTime: '…' })
    return label.length > 60 ? `${label.slice(0, 57)}…` : label
  }

  const selectCls = 'bg-[#181818] border border-[rgba(255,255,255,0.18)] rounded-lg px-2 py-1.5 text-xs text-white min-w-0 max-w-full'

  const relanceBlock = (kinds) => {
    const rows = (data?.relances || []).filter((r) => kinds.includes(r.kind))
    const sum = (outcomes) => rows.filter((r) => outcomes.includes(r.outcome)).reduce((a, r) => a + r.n, 0)
    const byOutcome = {}
    rows.forEach((r) => { byOutcome[r.outcome] = (byOutcome[r.outcome] || 0) + r.n })
    return { needed: sum(NEEDED), avoided: sum(AVOIDED), byOutcome }
  }

  return (
    <div className="space-y-4 min-w-0">
      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1 bg-[#222] rounded-xl p-1">
          {[7, 30].map((d) => (
            <button key={d} onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${days === d ? 'bg-[#2A2A2A] text-white' : 'text-[#AAA] hover:text-white'}`}>
              {t(`adminNotifStats.last${d}`)}
            </button>
          ))}
        </div>
        <select aria-label={t('adminNotifStats.role')} value={role} onChange={(e) => setRole(e.target.value)} className={selectCls}>
          <option value="">{t('adminNotifStats.allRoles')}</option>
          {ROLES.map((r) => <option key={r} value={r}>{t(`adminNotifStats.roles.${r}`)}</option>)}
        </select>
        <select aria-label={t('adminNotifStats.type')} value={type} onChange={(e) => setType(e.target.value)} className={`${selectCls} w-full sm:w-auto sm:max-w-[260px]`}>
          <option value="">{t('adminNotifStats.allTypes')}</option>
          {(data?.types || []).map((x) => <option key={x.title_key} value={x.title_key}>{typeLabel(x.title_key)} ({x.n})</option>)}
          {type && !(data?.types || []).some((x) => x.title_key === type) && <option value={type}>{typeLabel(type)}</option>}
        </select>
        <select aria-label={t('adminNotifStats.device')} value={device} onChange={(e) => setDevice(e.target.value)} className={selectCls}>
          <option value="">{t('adminNotifStats.allDevices')}</option>
          {DEVICES.map((d) => <option key={d} value={d}>{t(`adminNotifStats.devices.${d}`)}</option>)}
        </select>
      </div>

      {loading && !data ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : error ? (
        <div className="card text-center py-8 text-[#AAA] text-sm">{t('adminNotifStats.loadError')}</div>
      ) : data && (
        <div className={`space-y-4 ${loading ? 'opacity-60' : ''}`}>
          {/* Taux */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <Kpi label={t('adminNotifStats.pushReceived')} value={pct(data.push.delivered, data.push.sent)}
              sub={t('adminNotifStats.ofSent', { a: data.push.delivered, b: data.push.sent })} />
            <Kpi label={t('adminNotifStats.pushClicked')} value={pct(data.push.clicked, data.push.delivered)}
              sub={t('adminNotifStats.ofReceived', { a: data.push.clicked, b: data.push.delivered })} />
            <Kpi label={t('adminNotifStats.readGlobal')} value={pct(data.reads.read, data.reads.total)}
              sub={t('adminNotifStats.ofNotifs', { a: data.reads.read, b: data.reads.total })} />
            <Kpi label={t('adminNotifStats.readViaPush')} value={pct(data.reads.read_push, data.reads.read_push + data.reads.read_in_app)}
              sub={t('adminNotifStats.readSplit', { push: data.reads.read_push, app: data.reads.read_in_app })} />
            <Kpi label={t('adminNotifStats.medianPush')} value={duration(data.reads.median_s.push_click)} />
            <Kpi label={t('adminNotifStats.medianApp')} value={duration(data.reads.median_s.in_app)} />
          </div>
          <p className="text-[11px] text-[#777]">{t('adminNotifStats.note')}</p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Push par appareil */}
            <div className="card min-w-0">
              <p className="text-sm font-semibold mb-3">{t('adminNotifStats.byDevice')}</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="text-[#AAA]">
                    <th className="text-start py-1 px-2 whitespace-normal">{t('adminNotifStats.device')}</th>
                    <th className="text-end py-1 px-2 whitespace-normal">{t('adminNotifStats.sent')}</th>
                    <th className="text-end py-1 px-2 whitespace-normal">{t('adminNotifStats.received')}</th>
                    <th className="text-end py-1 px-2 whitespace-normal">{t('adminNotifStats.clicked')}</th>
                  </tr></thead>
                  <tbody>
                    {data.push.by_device.length === 0 && (
                      <tr><td colSpan={4} className="py-2 text-[#777]">{t('adminNotifStats.noData')}</td></tr>
                    )}
                    {data.push.by_device.map((r) => (
                      <tr key={r.device} className="border-t border-[rgba(255,255,255,0.08)]">
                        <td className="py-1.5 align-top">{t(`adminNotifStats.devices.${r.device}`, { defaultValue: r.device })}</td>
                        <td className="text-end align-top py-1.5">{r.sent}</td>
                        <NumPct n={r.delivered} of={r.sent} />
                        <NumPct n={r.clicked} of={r.delivered} />
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Abonnements push par rôle */}
            <div className="card min-w-0">
              <p className="text-sm font-semibold mb-1">{t('adminNotifStats.subscriptions')}</p>
              <p className="text-[11px] text-[#777] mb-3">{t('adminNotifStats.subscriptionsNote')}</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="text-[#AAA]">
                    <th className="text-start py-1 px-2 whitespace-normal">{t('adminNotifStats.role')}</th>
                    <th className="text-end py-1 px-2 whitespace-normal">{t('adminNotifStats.activeUsers')}</th>
                    <th className="text-end py-1 px-2 whitespace-normal">{t('adminNotifStats.withPush')}</th>
                  </tr></thead>
                  <tbody>
                    {data.subscriptions.length === 0 && (
                      <tr><td colSpan={3} className="py-2 text-[#777]">{t('adminNotifStats.noData')}</td></tr>
                    )}
                    {data.subscriptions.map((r) => (
                      <tr key={r.role} className="border-t border-[rgba(255,255,255,0.08)]">
                        <td className="py-1.5 align-top">{t(`adminNotifStats.roles.${r.role}`)}</td>
                        <td className="text-end align-top py-1.5">{r.users}</td>
                        <NumPct n={r.with_push} of={r.users} />
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Relances WhatsApp */}
          <div className="card min-w-0">
            <p className="text-sm font-semibold mb-1">{t('adminNotifStats.relances')}</p>
            <p className="text-[11px] text-[#777] mb-3">{t('adminNotifStats.relancesNote')}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[['presence', PRESENCE_KINDS], ['client', ['client_oeil_applied']]].map(([fam, kinds]) => {
                const b = relanceBlock(kinds)
                return (
                  <div key={fam} className="min-w-0">
                    <p className="text-xs font-semibold text-[#DDD] mb-2">{t(`adminNotifStats.relanceFamily.${fam}`)}</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-[#222] rounded-lg p-2 min-w-0">
                        <div className="text-[11px] text-[#AAA]">{t('adminNotifStats.needed')}</div>
                        <div className="text-lg font-bold text-[#FF4D00]">{b.needed}</div>
                      </div>
                      <div className="bg-[#222] rounded-lg p-2 min-w-0">
                        <div className="text-[11px] text-[#AAA]">{t('adminNotifStats.avoided')}</div>
                        <div className="text-lg font-bold text-green-400">{b.avoided}</div>
                      </div>
                    </div>
                    <ul className="mt-2 space-y-0.5 text-[11px] text-[#AAA]">
                      {Object.entries(b.byOutcome).map(([o, n]) => (
                        <li key={o} className="flex justify-between gap-2">
                          <span className="break-words min-w-0">{t(`adminNotifStats.outcomes.${o}`, { defaultValue: o })}</span>
                          <span className="text-white">{n}</span>
                        </li>
                      ))}
                      {Object.keys(b.byOutcome).length === 0 && <li className="text-[#777]">{t('adminNotifStats.noData')}</li>}
                    </ul>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
