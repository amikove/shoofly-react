import { useState, useEffect } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import Topbar from '../../components/layout/Topbar'
import { adminAPI } from '../../api'
import { Spinner, toast, Avatar } from '../../components/ui'
import DateRangeFilter, { getPresetRange } from '../../components/dashboard/DateRangeFilter'
import { ComparisonCell, DeltaBadge, delta } from '../../components/dashboard/ComparisonCell'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const MAIN_TABS = [
  { id: 'executif',    label: '📊 Exécutif' },
  { id: 'funnel',      label: '🔀 Funnel' },
  { id: 'alertes',     label: '🚨 Alertes' },
  { id: 'services',    label: '🛠️ Services' },
  { id: 'geo',         label: '🗺️ Géographique' },
  { id: 'oeils',       label: '👁️ Œils' },
  { id: 'clients',     label: '👥 Clients' },
  { id: 'fileattente', label: '⏳ File d\'attente' },
  { id: 'immobilier',  label: '🏠 Immobilier' },
  { id: 'financier',   label: '💰 Financier' },
  { id: 'claims',      label: '📋 Réclamations' },
]

const COMING_SOON_TABS = ['clients', 'fileattente', 'immobilier', 'financier']

const FUNNEL_STEPS = [
  { key: 'inscrits',  label: 'Inscrits' },
  { key: 'commande',  label: 'A créé une mission' },
  { key: 'assignee',  label: 'Mission assignée' },
  { key: 'completee', label: 'Mission complétée' },
  { key: 'revient',   label: 'Client revenu' },
]

const TYPE_LABELS = {
  immobilier: '🏠 Immobilier',
  file_attente: '⏳ File d\'attente',
  audit: '🔎 Audit',
  personnalisee: '🎯 Personnalisée',
}


export default function AdminDashboard() {
  const [tab, setTab] = useState('executif')

  // ── État période (partagé, visible dans tous les onglets) ──
  const [range, setRange] = useState({ preset: 'month', ...getPresetRange('month') })
  const [compareRange, setCompareRange] = useState(null)

  // ── Données exécutives ──
  const [execData, setExecData] = useState(null)
  const [loadingExec, setLoadingExec] = useState(true)

  // ── Alertes ──
  const [alertData, setAlertData] = useState(null)
  const [loadingAlert, setLoadingAlert] = useState(true)

  // ── Services ──
  const [servicesData, setServicesData] = useState(null)
  const [loadingServices, setLoadingServices] = useState(true)

  // ── Œils ──
  const [oeilsData, setOeilsData] = useState(null)
  const [loadingOeils, setLoadingOeils] = useState(true)

  // ── Géographique ──
  const [geoData, setGeoData] = useState(null)
  const [loadingGeo, setLoadingGeo] = useState(true)

  // ── Funnel (2 périodes indépendantes) ──
  const [funnelRangeA, setFunnelRangeA] = useState({ preset: 'month', ...getPresetRange('month') })
  const [funnelRangeB, setFunnelRangeB] = useState({ preset: 'week', ...getPresetRange('week') })
  const [funnelDataA, setFunnelDataA] = useState(null)
  const [funnelDataB, setFunnelDataB] = useState(null)
  const [loadingFunnel, setLoadingFunnel] = useState(true)
  const [customA, setCustomA] = useState({ from: '', to: '' })
  const [customB, setCustomB] = useState({ from: '', to: '' })

  // ── Réclamations (inchangé) ──
  const [claims, setClaims] = useState([])
  const [loadingClaims, setLoadingClaims] = useState(true)
  const [resolving, setResolving] = useState(null)

  useEffect(() => {
    if (!range?.from || !range?.to) return
    setLoadingExec(true)
    const params = {
      date_from: range.from.toISOString(),
      date_to: range.to.toISOString(),
      ...(compareRange ? { compare_from: compareRange.from.toISOString(), compare_to: compareRange.to.toISOString() } : {}),
    }
    adminAPI.dashboardExecutif(params)
      .then(({ data }) => setExecData(data))
      .catch(() => toast('Erreur chargement dashboard', 'error'))
      .finally(() => setLoadingExec(false))
  }, [range, compareRange])

  useEffect(() => {
    adminAPI.claims()
      .then(({ data }) => setClaims(data.claims || []))
      .catch(() => toast('Erreur de chargement', 'error'))
      .finally(() => setLoadingClaims(false))
  }, [])

  useEffect(() => {
    if (tab !== 'alertes' || !range?.from || !range?.to) return
    setLoadingAlert(true)
    const params = {
      date_from: range.from.toISOString(),
      date_to: range.to.toISOString(),
      ...(compareRange ? { compare_from: compareRange.from.toISOString(), compare_to: compareRange.to.toISOString() } : {}),
    }
    adminAPI.dashboardAlertes(params)
      .then(({ data }) => setAlertData(data))
      .catch(() => toast('Erreur chargement alertes', 'error'))
      .finally(() => setLoadingAlert(false))
  }, [tab, range, compareRange])

  useEffect(() => {
    if (tab !== 'oeils' || !range?.from || !range?.to) return
    setLoadingOeils(true)
    const params = {
      date_from: range.from.toISOString(),
      date_to: range.to.toISOString(),
      ...(compareRange ? { compare_from: compareRange.from.toISOString(), compare_to: compareRange.to.toISOString() } : {}),
    }
    adminAPI.dashboardOeils(params)
      .then(({ data }) => setOeilsData(data))
      .catch(() => toast('Erreur chargement Œils', 'error'))
      .finally(() => setLoadingOeils(false))
  }, [tab, range, compareRange])

  useEffect(() => {
    if (tab !== 'geo' || !range?.from || !range?.to) return
    setLoadingGeo(true)
    const params = {
      date_from: range.from.toISOString(),
      date_to: range.to.toISOString(),
      ...(compareRange ? { compare_from: compareRange.from.toISOString(), compare_to: compareRange.to.toISOString() } : {}),
    }
    adminAPI.dashboardGeo(params)
      .then(({ data }) => setGeoData(data))
      .catch(() => toast('Erreur chargement géo', 'error'))
      .finally(() => setLoadingGeo(false))
  }, [tab, range, compareRange])

  useEffect(() => {
    if (tab !== 'funnel' || !funnelRangeA?.from || !funnelRangeA?.to || !funnelRangeB?.from || !funnelRangeB?.to) return
    setLoadingFunnel(true)
    Promise.all([
      adminAPI.dashboardFunnel({ date_from: funnelRangeA.from.toISOString(), date_to: funnelRangeA.to.toISOString() }),
      adminAPI.dashboardFunnel({ date_from: funnelRangeB.from.toISOString(), date_to: funnelRangeB.to.toISOString() }),
    ])
      .then(([resA, resB]) => {
        setFunnelDataA(resA.data.steps)
        setFunnelDataB(resB.data.steps)
      })
      .catch(() => toast('Erreur chargement funnel', 'error'))
      .finally(() => setLoadingFunnel(false))
  }, [tab, funnelRangeA, funnelRangeB])

  useEffect(() => {
    if (tab !== 'services' || !range?.from || !range?.to) return
    setLoadingServices(true)
    const params = {
      date_from: range.from.toISOString(),
      date_to: range.to.toISOString(),
      ...(compareRange ? { compare_from: compareRange.from.toISOString(), compare_to: compareRange.to.toISOString() } : {}),
    }
    adminAPI.dashboardServices(params)
      .then(({ data }) => setServicesData(data))
      .catch(() => toast('Erreur chargement services', 'error'))
      .finally(() => setLoadingServices(false))
  }, [tab, range, compareRange])

  const resolve = async (claimId, missionId, decision) => {
    setResolving(claimId)
    try {
      await adminAPI.resolveClaim(missionId, decision)
      setClaims(prev => prev.filter(c => c.id !== claimId))
      toast(decision === 'oeil' ? '✅ Résolu en faveur de l\'Œil' : '✅ Résolu en faveur du client', 'success')
    } catch (err) {
      toast(err.response?.data?.error || 'Erreur', 'error')
    } finally { setResolving(null) }
  }

  const c = execData?.current
  const cmp = execData?.comparison

  const kpis = c ? [
    { label: 'Missions créées', value: c.total_missions, compare: cmp?.total_missions, color: 'text-white' },
    { label: 'Missions complétées', value: c.completed_missions, compare: cmp?.completed_missions, color: 'text-green-400' },
    { label: 'Missions annulées', value: c.cancelled_missions, compare: cmp?.cancelled_missions, color: 'text-red-400', invert: true },
    { label: 'Chiffre d\'affaires', value: `${parseFloat(c.revenue).toFixed(0)} MAD`, raw: parseFloat(c.revenue), compare: cmp ? parseFloat(cmp.revenue) : undefined, color: 'text-green-400' },
    { label: 'Commission Shoofly', value: `${parseFloat(c.commission).toFixed(0)} MAD`, raw: parseFloat(c.commission), compare: cmp ? parseFloat(cmp.commission) : undefined, color: 'text-[#FF4D00]' },
    { label: 'Nouveaux clients', value: c.new_clients, compare: cmp?.new_clients, color: 'text-blue-400' },
    { label: 'Nouveaux Œils', value: c.new_oeils, compare: cmp?.new_oeils, color: 'text-blue-400' },
    { label: 'Œils actifs', value: c.active_oeils, compare: cmp?.active_oeils, color: 'text-white' },
    { label: 'Clients actifs', value: c.active_clients, compare: cmp?.active_clients, color: 'text-white' },
  ] : []

  return (
    <AppLayout>
      <Topbar title="Vue globale" />
      <div className="p-4 md:p-6 space-y-5">

        {/* Onglets principaux */}
        <div className="flex gap-1 bg-[#222] rounded-xl p-1 w-fit">
          {MAIN_TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${tab === t.id ? 'bg-[#2A2A2A] text-white' : 'text-[#AAA] hover:text-white'}`}>
              {t.label}
              {t.id === 'claims' && claims.length > 0 && (
                <span className="bg-[#FF4D00] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {claims.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {tab === 'executif' && (
          <>
            {/* Filtre de période — toujours visible sur cet onglet */}
            <DateRangeFilter
              range={range}
              onChange={setRange}
              compareRange={compareRange}
              onCompareChange={setCompareRange}
            />

            {loadingExec ? (
              <div className="flex justify-center py-20"><Spinner size="lg" /></div>
            ) : (
              <>
                {/* KPIs */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {kpis.map((k) => {
                    const d = delta(k.raw !== undefined ? k.raw : k.value, k.compare)
                    const displayDelta = k.invert && d !== null ? -d : d
                    return (
                      <div key={k.label} className="stat-card">
                        <div className="text-xs text-[#AAA] mb-1">{k.label}</div>
                        <div className="flex items-baseline">
                          <span className={`text-2xl font-bold ${k.color}`}>{k.value}</span>
                          <DeltaBadge value={displayDelta} />
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Graphiques */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="card">
                    <p className="text-sm font-semibold mb-4">Missions par jour</p>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={execData.daily_series}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                        <XAxis dataKey="day" tick={{ fill: '#777', fontSize: 11 }} tickFormatter={(d) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} />
                        <YAxis tick={{ fill: '#777', fontSize: 11 }} />
                        <Tooltip
                          contentStyle={{ background: '#181818', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                          labelFormatter={(d) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                        />
                        <Bar dataKey="missions" fill="#FF4D00" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="card">
                    <p className="text-sm font-semibold mb-4">Chiffre d'affaires par jour</p>
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={execData.daily_series}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                        <XAxis dataKey="day" tick={{ fill: '#777', fontSize: 11 }} tickFormatter={(d) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} />
                        <YAxis tick={{ fill: '#777', fontSize: 11 }} />
                        <Tooltip
                          contentStyle={{ background: '#181818', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                          labelFormatter={(d) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                          formatter={(value) => [`${value} MAD`, 'CA']}
                        />
                        <Line type="monotone" dataKey="revenue" stroke="#2ECC71" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {tab === 'alertes' && (
          <>
            <DateRangeFilter
              range={range}
              onChange={setRange}
              compareRange={compareRange}
              onCompareChange={setCompareRange}
            />

            {loadingAlert ? (
              <div className="flex justify-center py-20"><Spinner size="lg" /></div>
            ) : alertData && (
              <>
                {/* Section instantanée */}
                <p className="text-xs text-[#AAA] uppercase tracking-wider font-semibold mb-2">🔴 État actuel — à traiter</p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                  <div className={`stat-card ${alertData.instant.suspended_oeils > 0 ? 'border-red-500/30' : ''}`}>
                    <div className="text-xs text-[#AAA] mb-1">Œils suspendus</div>
                    <div className={`text-2xl font-bold ${alertData.instant.suspended_oeils > 0 ? 'text-red-400' : 'text-white'}`}>{alertData.instant.suspended_oeils}</div>
                  </div>
                  <div className={`stat-card ${alertData.instant.missions_under_surveillance > 0 ? 'border-orange-500/30' : ''}`}>
                    <div className="text-xs text-[#AAA] mb-1">Sous surveillance</div>
                    <div className={`text-2xl font-bold ${alertData.instant.missions_under_surveillance > 0 ? 'text-orange-400' : 'text-white'}`}>{alertData.instant.missions_under_surveillance}</div>
                  </div>
                  <div className={`stat-card ${alertData.instant.missions_stuck_pending > 0 ? 'border-orange-500/30' : ''}`}>
                    <div className="text-xs text-[#AAA] mb-1">Bloquées &gt;24h</div>
                    <div className={`text-2xl font-bold ${alertData.instant.missions_stuck_pending > 0 ? 'text-orange-400' : 'text-white'}`}>{alertData.instant.missions_stuck_pending}</div>
                  </div>
                  <div className={`stat-card ${alertData.instant.missions_expired_deadline > 0 ? 'border-red-500/30' : ''}`}>
                    <div className="text-xs text-[#AAA] mb-1">Deadlines dépassées</div>
                    <div className={`text-2xl font-bold ${alertData.instant.missions_expired_deadline > 0 ? 'text-red-400' : 'text-white'}`}>{alertData.instant.missions_expired_deadline}</div>
                  </div>
                  <div className={`stat-card ${alertData.instant.low_reliability_oeils > 0 ? 'border-amber-500/30' : ''}`}>
                    <div className="text-xs text-[#AAA] mb-1">Œils sous 70%</div>
                    <div className={`text-2xl font-bold ${alertData.instant.low_reliability_oeils > 0 ? 'text-amber-400' : 'text-white'}`}>{alertData.instant.low_reliability_oeils}</div>
                  </div>
                  <div className="stat-card">
                    <div className="text-xs text-[#AAA] mb-1">Score fiabilité moyen</div>
                    <div className="text-2xl font-bold text-white">{alertData.instant.avg_reliability_score}%</div>
                  </div>
                </div>

                {/* Section période */}
                <p className="text-xs text-[#AAA] uppercase tracking-wider font-semibold mb-2">📈 Tendances sur la période</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { label: 'Transferts sans remplaçant', value: alertData.current?.transfer_failures ?? 0, compare: alertData.comparison?.transfer_failures, invert: true },
                    { label: 'Taux d\'annulation', value: `${alertData.current?.cancellation_rate ?? 0}%`, raw: alertData.current?.cancellation_rate, compare: alertData.comparison?.cancellation_rate, invert: true },
                  ].map((k) => {
                    const d = delta(k.raw !== undefined ? k.raw : k.value, k.compare)
                    const displayDelta = k.invert && d !== null ? -d : d
                    return (
                      <div key={k.label} className="stat-card">
                        <div className="text-xs text-[#AAA] mb-1">{k.label}</div>
                        <div className="flex items-baseline">
                          <span className="text-2xl font-bold text-white">{k.value}</span>
                          <DeltaBadge value={displayDelta} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </>
        )}

        {tab === 'services' && (
          <>
            <DateRangeFilter
              range={range}
              onChange={setRange}
              compareRange={compareRange}
              onCompareChange={setCompareRange}
            />

            {loadingServices ? (
              <div className="flex justify-center py-20"><Spinner size="lg" /></div>
            ) : !servicesData?.current?.length ? (
              <div className="card text-center py-16 text-[#AAA]">Aucune mission sur cette période</div>
            ) : (
              <div className="card p-0">
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Service</th>
                        <th>Missions</th>
                        <th>Taux complétion</th>
                        <th>CA</th>
                        <th>Commission</th>
                        <th>Note moyenne</th>
                      </tr>
                    </thead>
                    <tbody>
                      {servicesData.current.map((s) => {
                        const cmp = servicesData.comparison?.find(x => x.type === s.type)
                        const completionRate = s.total_missions > 0 ? Math.round((s.completed_missions / s.total_missions) * 1000) / 10 : 0
                        const cmpCompletionRate = cmp && cmp.total_missions > 0 ? Math.round((cmp.completed_missions / cmp.total_missions) * 1000) / 10 : undefined

                        return (
                          <tr key={s.type}>
                            <td className="font-medium">{TYPE_LABELS[s.type] || s.type}</td>
                            <td><ComparisonCell current={s.total_missions} compare={cmp?.total_missions} hasComparison={!!servicesData.comparison} /></td>
                            <td><ComparisonCell current={completionRate} compare={cmpCompletionRate} suffix="%" hasComparison={!!servicesData.comparison} /></td>
                            <td className="text-green-400"><ComparisonCell current={parseFloat(s.revenue).toFixed(0)} compare={cmp ? parseFloat(cmp.revenue).toFixed(0) : undefined} suffix=" MAD" hasComparison={!!servicesData.comparison} /></td>
                            <td className="text-[#FF4D00]"><ComparisonCell current={parseFloat(s.commission).toFixed(0)} compare={cmp ? parseFloat(cmp.commission).toFixed(0) : undefined} suffix=" MAD" hasComparison={!!servicesData.comparison} /></td>
                            <td className="text-yellow-400">
                              {s.avg_rating > 0 ? `${s.avg_rating} ★` : '—'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {tab === 'funnel' && (
          <>
            <p className="text-sm font-semibold mb-3">Entonnoir de conversion</p>

            <div className="grid gap-4 mb-3" style={{ gridTemplateColumns: '160px 1fr 1fr' }}>
              <div />
              <div>
                <select
                  className="input mb-2"
                  value={funnelRangeA.preset}
                  onChange={(e) => e.target.value === 'custom' ? setFunnelRangeA({ preset: 'custom' }) : setFunnelRangeA({ preset: e.target.value, ...getPresetRange(e.target.value) })}
                >
                  <option value="today">Aujourd'hui</option>
                  <option value="yesterday">Hier</option>
                  <option value="week">Cette semaine</option>
                  <option value="month">Ce mois</option>
                  <option value="custom">Personnalisé</option>
                </select>
                {funnelRangeA.preset === 'custom' && (
                  <div className="flex items-center gap-2">
                    <input type="date" className="input text-xs" value={customA.from} onChange={(e) => setCustomA(c => ({ ...c, from: e.target.value }))} />
                    <span className="text-xs text-[#555]">→</span>
                    <input type="date" className="input text-xs" value={customA.to} onChange={(e) => setCustomA(c => ({ ...c, to: e.target.value }))} />
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => customA.from && customA.to && setFunnelRangeA({ preset: 'custom', from: new Date(customA.from), to: new Date(customA.to) })}
                    >OK</button>
                  </div>
                )}
              </div>
              <div>
                <select
                  className="input mb-2"
                  value={funnelRangeB.preset}
                  onChange={(e) => e.target.value === 'custom' ? setFunnelRangeB({ preset: 'custom' }) : setFunnelRangeB({ preset: e.target.value, ...getPresetRange(e.target.value) })}
                >
                  <option value="today">Aujourd'hui</option>
                  <option value="yesterday">Hier</option>
                  <option value="week">Cette semaine</option>
                  <option value="month">Ce mois</option>
                  <option value="custom">Personnalisé</option>
                </select>
                {funnelRangeB.preset === 'custom' && (
                  <div className="flex items-center gap-2">
                    <input type="date" className="input text-xs" value={customB.from} onChange={(e) => setCustomB(c => ({ ...c, from: e.target.value }))} />
                    <span className="text-xs text-[#555]">→</span>
                    <input type="date" className="input text-xs" value={customB.to} onChange={(e) => setCustomB(c => ({ ...c, to: e.target.value }))} />
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => customB.from && customB.to && setFunnelRangeB({ preset: 'custom', from: new Date(customB.from), to: new Date(customB.to) })}
                    >OK</button>
                  </div>
                )}
              </div>
            </div>

            {loadingFunnel ? (
              <div className="flex justify-center py-20"><Spinner size="lg" /></div>
            ) : funnelDataA && funnelDataB && (
              <div className="grid gap-4" style={{ gridTemplateColumns: '160px 1fr 1fr' }}>
                {FUNNEL_STEPS.map((step, i) => {
                  const valA = funnelDataA.find(s => s.key === step.key)?.value || 0
                  const valB = funnelDataB.find(s => s.key === step.key)?.value || 0
                  const maxA = funnelDataA[0]?.value || 1
                  const maxB = funnelDataB[0]?.value || 1
                  const pctA = Math.round((valA / maxA) * 100)
                  const pctB = Math.round((valB / maxB) * 100)
                  return (
                    <>
                      <div key={`label-${step.key}`} className="text-xs text-[#AAA] text-right self-center">{step.label}</div>
                      <div key={`bar-a-${step.key}`} className="flex items-center gap-2">
                        <div className="flex-1 bg-[#222] rounded-lg overflow-hidden h-7">
                          <div className="h-full bg-[#FF4D00] rounded-lg" style={{ width: `${pctA}%` }} />
                        </div>
                        <span className="text-sm font-semibold w-8 flex-shrink-0">{valA}</span>
                      </div>
                      <div key={`bar-b-${step.key}`} className="flex items-center gap-2">
                        <div className="flex-1 bg-[#222] rounded-lg overflow-hidden h-7">
                          <div className="h-full bg-blue-500 rounded-lg" style={{ width: `${pctB}%` }} />
                        </div>
                        <span className="text-sm font-semibold w-8 flex-shrink-0">{valB}</span>
                      </div>
                    </>
                  )
                })}
              </div>
            )}
          </>
        )}

        {tab === 'geo' && (
          <>
            <DateRangeFilter
              range={range}
              onChange={setRange}
              compareRange={compareRange}
              onCompareChange={setCompareRange}
            />

            {loadingGeo ? (
              <div className="flex justify-center py-20"><Spinner size="lg" /></div>
            ) : !geoData?.current?.length ? (
              <div className="card text-center py-16 text-[#AAA]">Aucune mission sur cette période</div>
            ) : (
              <div className="card p-0">
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Ville</th>
                        <th>Missions</th>
                        <th>Taux complétion</th>
                        <th>CA</th>
                        <th>Œils actifs</th>
                      </tr>
                    </thead>
                    <tbody>
                      {geoData.current.map((g) => {
                        const cmp = geoData.comparison?.find(x => x.city === g.city)
                        const completionRate = g.total_missions > 0 ? Math.round((g.completed_missions / g.total_missions) * 1000) / 10 : 0
                        const cmpCompletionRate = cmp && cmp.total_missions > 0 ? Math.round((cmp.completed_missions / cmp.total_missions) * 1000) / 10 : undefined
                        return (
                          <tr key={g.city}>
                            <td className="font-medium">📍 {g.city}</td>
                            <td><ComparisonCell current={g.total_missions} compare={cmp?.total_missions} hasComparison={!!geoData.comparison} /></td>
                            <td><ComparisonCell current={completionRate} compare={cmpCompletionRate} suffix="%" hasComparison={!!geoData.comparison} /></td>
                            <td className="text-green-400"><ComparisonCell current={parseFloat(g.revenue).toFixed(0)} compare={cmp ? parseFloat(cmp.revenue).toFixed(0) : undefined} suffix=" MAD" hasComparison={!!geoData.comparison} /></td>
                            <td><ComparisonCell current={g.active_oeils} compare={cmp?.active_oeils} hasComparison={!!geoData.comparison} /></td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {tab === 'oeils' && (
          <>
            <DateRangeFilter
              range={range}
              onChange={setRange}
              compareRange={compareRange}
              onCompareChange={setCompareRange}
            />

            {loadingOeils ? (
              <div className="flex justify-center py-20"><Spinner size="lg" /></div>
            ) : oeilsData && (
              <>
                {/* KPIs */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                  <div className="stat-card">
                    <div className="text-xs text-[#AAA] mb-1">Total Œils</div>
                    <div className="flex items-baseline">
                      <span className="text-2xl font-bold text-white">{oeilsData.kpis.total_oeils}</span>
                      <DeltaBadge value={delta(oeilsData.kpis.total_oeils, oeilsData.kpisCompare?.total_oeils)} />
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="text-xs text-[#AAA] mb-1">Actifs</div>
                    <div className="flex items-baseline">
                      <span className="text-2xl font-bold text-green-400">{oeilsData.kpis.actifs}</span>
                      <DeltaBadge value={delta(oeilsData.kpis.actifs, oeilsData.kpisCompare?.actifs)} />
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="text-xs text-[#AAA] mb-1">Inactifs</div>
                    <div className="flex items-baseline">
                      <span className="text-2xl font-bold text-[#555]">{oeilsData.kpis.inactifs}</span>
                      <DeltaBadge value={delta(oeilsData.kpis.inactifs, oeilsData.kpisCompare?.inactifs) !== null ? -delta(oeilsData.kpis.inactifs, oeilsData.kpisCompare?.inactifs) : null} />
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="text-xs text-[#AAA] mb-1">Taux d'acceptation</div>
                    <div className="flex items-baseline">
                      <span className="text-2xl font-bold text-blue-400">{oeilsData.kpis.acceptance_rate}%</span>
                      <DeltaBadge value={delta(oeilsData.kpis.acceptance_rate, oeilsData.kpisCompare?.acceptance_rate)} />
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="text-xs text-[#AAA] mb-1">Délai moyen d'attribution</div>
                    <div className="flex items-baseline">
                      <span className="text-2xl font-bold text-white">{oeilsData.kpis.avg_assignment_hours}h</span>
                      <DeltaBadge value={delta(oeilsData.kpis.avg_assignment_hours, oeilsData.kpisCompare?.avg_assignment_hours) !== null ? -delta(oeilsData.kpis.avg_assignment_hours, oeilsData.kpisCompare?.avg_assignment_hours) : null} />
                    </div>
                  </div>
                </div>

                {/* Classement */}
                <p className="text-sm font-semibold mb-3">🏆 Classement (missions complétées)</p>
                <div className="card p-0 mb-6">
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr><th>Œil</th><th>Missions</th><th>Revenus</th><th>Note</th></tr>
                      </thead>
                      <tbody>
                        {oeilsData.ranking.length === 0 ? (
                          <tr><td colSpan={4} className="text-center text-[#AAA] py-6">Aucune mission complétée sur cette période</td></tr>
                        ) : oeilsData.ranking.map((o) => (
                          <tr key={o.id}>
                            <td>
                              <div className="flex items-center gap-2">
                                <Avatar name={`${o.first_name} ${o.last_name}`} size={28} src={o.avatar_url} />
                                <span className="font-medium">{o.first_name} {o.last_name}</span>
                              </div>
                            </td>
                            <td>{o.missions_completed}</td>
                            <td className="text-green-400">{parseFloat(o.revenue).toFixed(0)} MAD</td>
                            <td className="text-yellow-400">{o.rating_avg > 0 ? `${o.rating_avg} ★` : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Alertes */}
                <p className="text-sm font-semibold mb-3">🚨 Alertes</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="card">
                    <p className="text-xs text-[#AAA] uppercase tracking-wider font-semibold mb-2">Trop d'annulations</p>
                    {oeilsData.alerts.too_many_cancellations.length === 0 ? (
                      <p className="text-xs text-[#555]">Aucune</p>
                    ) : oeilsData.alerts.too_many_cancellations.map((o) => (
                      <div key={o.id} className="flex items-center justify-between text-xs py-1.5 border-b border-white/5 last:border-0">
                        <span>{o.first_name} {o.last_name}</span>
                        <span className="text-red-400 font-semibold">{o.n}</span>
                      </div>
                    ))}
                  </div>
                  <div className="card">
                    <p className="text-xs text-[#AAA] uppercase tracking-wider font-semibold mb-2">Mauvaises notes (&lt;3.5)</p>
                    {oeilsData.alerts.low_rating.length === 0 ? (
                      <p className="text-xs text-[#555]">Aucune</p>
                    ) : oeilsData.alerts.low_rating.map((o) => (
                      <div key={o.id} className="flex items-center justify-between text-xs py-1.5 border-b border-white/5 last:border-0">
                        <span>{o.first_name} {o.last_name}</span>
                        <span className="text-amber-400 font-semibold">{o.rating_avg} ★</span>
                      </div>
                    ))}
                  </div>
                  <div className="card">
                    <p className="text-xs text-[#AAA] uppercase tracking-wider font-semibold mb-2">Retards fréquents</p>
                    {oeilsData.alerts.frequent_delays.length === 0 ? (
                      <p className="text-xs text-[#555]">Aucun</p>
                    ) : oeilsData.alerts.frequent_delays.map((o) => (
                      <div key={o.id} className="flex items-center justify-between text-xs py-1.5 border-b border-white/5 last:border-0">
                        <span>{o.first_name} {o.last_name}</span>
                        <span className="text-orange-400 font-semibold">{o.n}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {COMING_SOON_TABS.includes(tab) && (
          <div className="card text-center py-16">
            <div className="text-4xl opacity-30 mb-3">🚧</div>
            <h3 className="text-sm font-semibold text-white mb-1">Bientôt disponible</h3>
            <p className="text-xs text-[#AAA] max-w-[280px] mx-auto leading-relaxed">
              Cet onglet est en cours de construction et sera activé prochainement.
            </p>
          </div>
        )}

        {tab === 'claims' && (
          <div className="space-y-3">
            {loadingClaims ? (
              <div className="flex justify-center py-20"><Spinner size="lg" /></div>
            ) : claims.length === 0 ? (
              <div className="card text-center py-8 text-[#AAA] text-sm">✅ Aucune réclamation en cours</div>
            ) : claims.map((c) => (
              <div key={c.id} className="card space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-sm">{c.mission_title}</div>
                    <div className="text-xs text-[#AAA] mt-0.5">
                      Client : <span className="text-white">{c.client_name}</span> · Œil : <span className="text-white">{c.oeil_name}</span>
                    </div>
                    <div className="text-xs text-[#AAA] mt-0.5">
                      Prix : <span className="text-green-400">{c.mission_price} MAD</span> · Gain Œil : <span className="text-[#FF4D00]">{c.oeil_earning} MAD</span>
                    </div>
                  </div>
                  <span className="badge badge-orange shrink-0">🚨 En cours</span>
                </div>

                <div className="bg-[#222] rounded-xl p-3">
                  <div className="text-xs text-[#AAA] mb-1">Motif du client :</div>
                  <p className="text-sm text-white/80">{c.comment}</p>
                </div>

                <div className="text-xs text-[#555]">
                  Réclamé le {new Date(c.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>

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
          </div>
        )}

      </div>
    </AppLayout>
  )
}