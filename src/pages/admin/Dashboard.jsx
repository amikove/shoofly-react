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
  { id: 'financier',   label: '💰 Financier' },
  { id: 'campagnes',   label: '🔗 Campagnes' },
  { id: 'claims',      label: '📋 Réclamations' },
]



const EXPENSE_CATEGORIES = ['Marketing', 'Influenceurs', 'Serveurs', 'SMS/WhatsApp', 'Salaires', 'Autre']

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

  // ── Campagnes ──
  const [campagnesData, setCampagnesData] = useState(null)
  const [loadingCampagnes, setLoadingCampagnes] = useState(true)
  const [urlGen, setUrlGen] = useState({ source: '', medium: '', campaign: '' })
  const [generatedUrl, setGeneratedUrl] = useState('')

  // ── Financier ──
  const [financeData, setFinanceData] = useState(null)
  const [loadingFinance, setLoadingFinance] = useState(true)
  const [expenses, setExpenses] = useState([])
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [newExpense, setNewExpense] = useState({ amount: '', category: EXPENSE_CATEGORIES[0], description: '', expense_date: new Date().toISOString().slice(0, 10) })
  const [savingExpense, setSavingExpense] = useState(false)

  // ── File d'attente ──
  const [fileAttenteData, setFileAttenteData] = useState(null)
  const [loadingFileAttente, setLoadingFileAttente] = useState(true)

  // ── Clients ──
  const [clientsData, setClientsData] = useState(null)
  const [loadingClients, setLoadingClients] = useState(true)

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
  const [funnelKpisA, setFunnelKpisA] = useState(null)
  const [funnelKpisB, setFunnelKpisB] = useState(null)
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

  const loadFinance = () => {
    if (!range?.from || !range?.to) return
    setLoadingFinance(true)
    const params = {
      date_from: range.from.toISOString(),
      date_to: range.to.toISOString(),
      ...(compareRange ? { compare_from: compareRange.from.toISOString(), compare_to: compareRange.to.toISOString() } : {}),
    }
    Promise.all([
      adminAPI.dashboardFinancier(params),
      adminAPI.listExpenses({ date_from: range.from.toISOString().slice(0, 10), date_to: range.to.toISOString().slice(0, 10) }),
    ])
      .then(([finRes, expRes]) => {
        setFinanceData(finRes.data)
        setExpenses(expRes.data.expenses || [])
      })
      .catch(() => toast('Erreur chargement financier', 'error'))
      .finally(() => setLoadingFinance(false))
  }

  useEffect(() => {
    if (tab !== 'financier') return
    loadFinance()
  }, [tab, range, compareRange])

  const addExpense = async () => {
    if (!newExpense.amount || parseFloat(newExpense.amount) <= 0) { toast('Montant invalide', 'error'); return }
    setSavingExpense(true)
    try {
      await adminAPI.addExpense({ ...newExpense, amount: parseFloat(newExpense.amount) })
      toast('Dépense ajoutée ✓', 'success')
      setShowExpenseForm(false)
      setNewExpense({ amount: '', category: EXPENSE_CATEGORIES[0], description: '', expense_date: new Date().toISOString().slice(0, 10) })
      loadFinance()
    } catch (err) {
      toast(err.response?.data?.error || 'Erreur', 'error')
    } finally { setSavingExpense(false) }
  }

  const removeExpense = async (id) => {
    try {
      await adminAPI.deleteExpense(id)
      toast('Dépense supprimée', 'info')
      loadFinance()
    } catch { toast('Erreur', 'error') }
  }

  useEffect(() => {
    if (tab !== 'campagnes' || !range?.from || !range?.to) return
    setLoadingCampagnes(true)
    adminAPI.dashboardCampagnes({ date_from: range.from.toISOString(), date_to: range.to.toISOString() })
      .then(({ data }) => setCampagnesData(data))
      .catch(() => toast('Erreur chargement campagnes', 'error'))
      .finally(() => setLoadingCampagnes(false))
  }, [tab, range])

  const generateUrl = () => {
    if (!urlGen.source || !urlGen.medium || !urlGen.campaign) {
      toast('Remplissez source, medium et campagne', 'error')
      return
    }
    const base = 'https://shoofly.ma'
    const params = new URLSearchParams({
      utm_source: urlGen.source,
      utm_medium: urlGen.medium,
      utm_campaign: urlGen.campaign,
    })
    setGeneratedUrl(`${base}/?${params.toString()}`)
  }

  const copyUrl = () => {
    navigator.clipboard.writeText(generatedUrl)
    toast('URL copiée ✓', 'success')
  }

  useEffect(() => {
    if (tab !== 'fileattente' || !range?.from || !range?.to) return
    setLoadingFileAttente(true)
    const params = {
      date_from: range.from.toISOString(),
      date_to: range.to.toISOString(),
      ...(compareRange ? { compare_from: compareRange.from.toISOString(), compare_to: compareRange.to.toISOString() } : {}),
    }
    adminAPI.dashboardFileAttente(params)
      .then(({ data }) => setFileAttenteData(data))
      .catch(() => toast('Erreur chargement file d\'attente', 'error'))
      .finally(() => setLoadingFileAttente(false))
  }, [tab, range, compareRange])

  useEffect(() => {
    if (tab !== 'clients' || !range?.from || !range?.to) return
    setLoadingClients(true)
    const params = {
      date_from: range.from.toISOString(),
      date_to: range.to.toISOString(),
      ...(compareRange ? { compare_from: compareRange.from.toISOString(), compare_to: compareRange.to.toISOString() } : {}),
    }
    adminAPI.dashboardClients(params)
      .then(({ data }) => setClientsData(data))
      .catch(() => toast('Erreur chargement clients', 'error'))
      .finally(() => setLoadingClients(false))
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
        setFunnelKpisA(resA.data.kpis)
        setFunnelKpisB(resB.data.kpis)
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
                    { label: 'Taux d\'abandon avant travail', value: `${alertData.current?.taux_abandon_avant ?? 0}%`, raw: alertData.current?.taux_abandon_avant, compare: alertData.comparison?.taux_abandon_avant, invert: true },
                    { label: 'Taux d\'abandon en cours de mission', value: `${alertData.current?.taux_abandon_pendant ?? 0}%`, raw: alertData.current?.taux_abandon_pendant, compare: alertData.comparison?.taux_abandon_pendant, invert: true },
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
                        <th>Délai moyen validation</th>
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
                            <td className={parseFloat(s.delai_moyen_validation) > 12 ? 'text-red-400' : 'text-white'}>
                              <ComparisonCell current={s.delai_moyen_validation} compare={cmp?.delai_moyen_validation} suffix="h" invert hasComparison={!!servicesData.comparison} />
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

            {!loadingFunnel && funnelKpisA && funnelKpisB && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="stat-card">
                  <div className="text-xs text-[#AAA] mb-1">Temps moyen avant 1ère candidature</div>
                  <div className="flex items-baseline gap-3">
                    <span className="text-lg font-bold text-[#FF4D00]">{funnelKpisA.temps_moyen_premiere_candidature} min</span>
                    <span className="text-lg font-bold text-blue-400">{funnelKpisB.temps_moyen_premiere_candidature} min</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="text-xs text-[#AAA] mb-1">Temps moyen jusqu'à sélection de l'Œil</div>
                  <div className="flex items-baseline gap-3">
                    <span className="text-lg font-bold text-[#FF4D00]">{funnelKpisA.temps_moyen_selection_oeil} min</span>
                    <span className="text-lg font-bold text-blue-400">{funnelKpisB.temps_moyen_selection_oeil} min</span>
                  </div>
                </div>
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
                    <div className="text-2xl font-bold text-white">
                      <ComparisonCell current={oeilsData.kpis.total_oeils} compare={oeilsData.kpisCompare?.total_oeils} hasComparison={!!oeilsData.kpisCompare} />
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="text-xs text-[#AAA] mb-1">Actifs</div>
                    <div className="text-2xl font-bold text-green-400">
                      <ComparisonCell current={oeilsData.kpis.actifs} compare={oeilsData.kpisCompare?.actifs} hasComparison={!!oeilsData.kpisCompare} />
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="text-xs text-[#AAA] mb-1">Inactifs</div>
                    <div className="text-2xl font-bold text-[#555]">
                      <ComparisonCell current={oeilsData.kpis.inactifs} compare={oeilsData.kpisCompare?.inactifs} invert hasComparison={!!oeilsData.kpisCompare} />
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="text-xs text-[#AAA] mb-1">Taux d'acceptation</div>
                    <div className="text-2xl font-bold text-blue-400">
                      <ComparisonCell current={oeilsData.kpis.acceptance_rate} compare={oeilsData.kpisCompare?.acceptance_rate} suffix="%" hasComparison={!!oeilsData.kpisCompare} />
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="text-xs text-[#AAA] mb-1">Délai moyen d'attribution</div>
                    <div className="text-2xl font-bold text-white">
                      <ComparisonCell current={oeilsData.kpis.avg_assignment_hours} compare={oeilsData.kpisCompare?.avg_assignment_hours} suffix="h" invert hasComparison={!!oeilsData.kpisCompare} />
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

                {/* Segmentation */}
                <p className="text-sm font-semibold mb-3">🧩 Segmentation</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="card">
                    <p className="text-xs text-[#AAA] uppercase tracking-wider font-semibold mb-3">Situation</p>
                    {oeilsData.segmentation.situation.map((s) => {
                      const total = oeilsData.segmentation.situation.reduce((sum, x) => sum + x.n, 0)
                      const pct = total > 0 ? Math.round((s.n / total) * 100) : 0
                      return (
                        <div key={s.label} className="flex items-center justify-between text-xs py-1.5 border-b border-white/5 last:border-0">
                          <span>{s.label}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-14 h-1.5 bg-[#222] rounded-full overflow-hidden">
                              <div className="h-full bg-blue-400" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-[#AAA] w-10 text-right">{s.n} ({pct}%)</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="card">
                    <p className="text-xs text-[#AAA] uppercase tracking-wider font-semibold mb-3">Motivation</p>
                    {oeilsData.segmentation.motivation.map((s) => {
                      const total = oeilsData.segmentation.motivation.reduce((sum, x) => sum + x.n, 0)
                      const pct = total > 0 ? Math.round((s.n / total) * 100) : 0
                      return (
                        <div key={s.label} className="flex items-center justify-between text-xs py-1.5 border-b border-white/5 last:border-0">
                          <span>{s.label}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-14 h-1.5 bg-[#222] rounded-full overflow-hidden">
                              <div className="h-full bg-[#FF4D00]" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-[#AAA] w-10 text-right">{s.n} ({pct}%)</span>
                          </div>
                        </div>
                      )
                    })}
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

        {tab === 'clients' && (
          <>
            <DateRangeFilter
              range={range}
              onChange={setRange}
              compareRange={compareRange}
              onCompareChange={setCompareRange}
            />

            {loadingClients ? (
              <div className="flex justify-center py-20"><Spinner size="lg" /></div>
            ) : clientsData && (
              <>
                {/* KPIs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="stat-card">
                    <div className="text-xs text-[#AAA] mb-1">Clients actifs</div>
                    <div className="text-2xl font-bold text-white">
                      <ComparisonCell current={clientsData.kpis.active_clients} compare={clientsData.kpisCompare?.active_clients} hasComparison={!!clientsData.kpisCompare} />
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="text-xs text-[#AAA] mb-1">Missions créées</div>
                    <div className="text-2xl font-bold text-white">
                      <ComparisonCell current={clientsData.kpis.total_missions} compare={clientsData.kpisCompare?.total_missions} hasComparison={!!clientsData.kpisCompare} />
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="text-xs text-[#AAA] mb-1">Panier moyen</div>
                    <div className="text-2xl font-bold text-green-400">
                      <ComparisonCell current={clientsData.kpis.avg_basket} compare={clientsData.kpisCompare?.avg_basket} suffix=" MAD" hasComparison={!!clientsData.kpisCompare} />
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="text-xs text-[#AAA] mb-1">Missions / client</div>
                    <div className="text-2xl font-bold text-blue-400">
                      <ComparisonCell current={clientsData.kpis.avg_missions_per_client} compare={clientsData.kpisCompare?.avg_missions_per_client} hasComparison={!!clientsData.kpisCompare} />
                    </div>
                  </div>
                </div>

                {/* Top clients */}
                <p className="text-sm font-semibold mb-3">🏆 Top clients</p>
                <div className="card p-0 mb-6">
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr><th>Client</th><th>Ville</th><th>Missions</th><th>Dépenses</th></tr>
                      </thead>
                      <tbody>
                        {clientsData.topClients.length === 0 ? (
                          <tr><td colSpan={4} className="text-center text-[#AAA] py-6">Aucun client sur cette période</td></tr>
                        ) : clientsData.topClients.map((c) => (
                          <tr key={c.id}>
                            <td className="font-medium">{c.first_name} {c.last_name}</td>
                            <td className="text-[#AAA]">{c.city || '—'}</td>
                            <td>{c.total_missions}</td>
                            <td className="text-green-400">{parseFloat(c.total_spent).toFixed(0)} MAD</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Segmentation par profil */}
                <p className="text-sm font-semibold mb-3">🧩 Segmentation par profil</p>
                <div className="card p-0">
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr><th>Profil</th><th>Clients</th><th>% du total</th><th>Missions</th><th>CA</th></tr>
                      </thead>
                      <tbody>
                        {clientsData.segmentation.length === 0 ? (
                          <tr><td colSpan={5} className="text-center text-[#AAA] py-6">Aucune donnée sur cette période</td></tr>
                        ) : (() => {
                          const total = clientsData.segmentation.reduce((s, x) => s + x.clients, 0)
                          return clientsData.segmentation.map((s) => {
                            const pct = total > 0 ? Math.round((s.clients / total) * 100) : 0
                            return (
                              <tr key={s.profil}>
                                <td className="font-medium">{s.profil}</td>
                                <td>{s.clients}</td>
                                <td>
                                  <div className="flex items-center gap-2">
                                    <div className="w-14 h-1.5 bg-[#222] rounded-full overflow-hidden">
                                      <div className="h-full bg-[#FF4D00]" style={{ width: `${pct}%` }} />
                                    </div>
                                    <span className="text-[#AAA] text-xs">{pct}%</span>
                                  </div>
                                </td>
                                <td>{s.total_missions}</td>
                                <td className="text-green-400">{parseFloat(s.revenue).toFixed(0)} MAD</td>
                              </tr>
                            )
                          })
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        

        {tab === 'fileattente' && (
          <>
            <DateRangeFilter
              range={range}
              onChange={setRange}
              compareRange={compareRange}
              onCompareChange={setCompareRange}
            />

            {loadingFileAttente ? (
              <div className="flex justify-center py-20"><Spinner size="lg" /></div>
            ) : fileAttenteData && (
              <>
                {/* KPIs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="stat-card">
                    <div className="text-xs text-[#AAA] mb-1">Missions créées</div>
                    <div className="text-2xl font-bold text-white">
                      <ComparisonCell current={fileAttenteData.kpis.total_missions} compare={fileAttenteData.kpisCompare?.total_missions} hasComparison={!!fileAttenteData.kpisCompare} />
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="text-xs text-[#AAA] mb-1">Complétées</div>
                    <div className="text-2xl font-bold text-green-400">
                      <ComparisonCell current={fileAttenteData.kpis.completed_missions} compare={fileAttenteData.kpisCompare?.completed_missions} hasComparison={!!fileAttenteData.kpisCompare} />
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="text-xs text-[#AAA] mb-1">Temps d'attente moyen</div>
                    <div className="text-2xl font-bold text-blue-400">
                      <ComparisonCell current={fileAttenteData.kpis.avg_wait_minutes} compare={fileAttenteData.kpisCompare?.avg_wait_minutes} suffix=" min" invert hasComparison={!!fileAttenteData.kpisCompare} />
                    </div>
                  </div>
                  <div className="stat-card border-[#FF4D00]/20">
                    <div className="text-xs text-[#AAA] mb-1">⏱️ Temps économisé (estimé)</div>
                    <div className="text-2xl font-bold text-[#FF4D00]">
                      <ComparisonCell current={fileAttenteData.kpis.hours_saved} compare={fileAttenteData.kpisCompare?.hours_saved} suffix="h" hasComparison={!!fileAttenteData.kpisCompare} />
                    </div>
                  </div>
                </div>

                {/* Organismes */}
                <p className="text-sm font-semibold mb-3">🏛️ Organismes les plus demandés</p>
                <div className="card p-0">
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr><th>Organisme</th><th>Missions</th></tr>
                      </thead>
                      <tbody>
                        {fileAttenteData.topOrganismes.length === 0 ? (
                          <tr><td colSpan={2} className="text-center text-[#AAA] py-6">Aucune mission sur cette période</td></tr>
                        ) : fileAttenteData.topOrganismes.map((o) => (
                          <tr key={o.organisme}>
                            <td className="font-medium">{o.organisme}</td>
                            <td>{o.missions}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {tab === 'financier' && (
          <>
            <DateRangeFilter
              range={range}
              onChange={setRange}
              compareRange={compareRange}
              onCompareChange={setCompareRange}
            />

            {loadingFinance ? (
              <div className="flex justify-center py-20"><Spinner size="lg" /></div>
            ) : financeData && (
              <>
                {/* KPIs financiers */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                  <div className="stat-card">
                    <div className="text-xs text-[#AAA] mb-1">Chiffre d'affaires</div>
                    <div className="text-2xl font-bold text-white">
                      <ComparisonCell current={financeData.current.revenue.toFixed(0)} compare={financeData.comparison?.revenue.toFixed(0)} suffix=" MAD" hasComparison={!!financeData.comparison} />
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="text-xs text-[#AAA] mb-1">Commission Shoofly</div>
                    <div className="text-2xl font-bold text-[#FF4D00]">
                      <ComparisonCell current={financeData.current.commission.toFixed(0)} compare={financeData.comparison?.commission.toFixed(0)} suffix=" MAD" hasComparison={!!financeData.comparison} />
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="text-xs text-[#AAA] mb-1">Payé aux Œils</div>
                    <div className="text-2xl font-bold text-blue-400">
                      <ComparisonCell current={financeData.current.paid_to_oeils.toFixed(0)} compare={financeData.comparison?.paid_to_oeils.toFixed(0)} suffix=" MAD" hasComparison={!!financeData.comparison} />
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="text-xs text-[#AAA] mb-1">Remboursements</div>
                    <div className="text-2xl font-bold text-red-400">
                      <ComparisonCell current={financeData.current.refunds.toFixed(0)} compare={financeData.comparison?.refunds.toFixed(0)} suffix=" MAD" invert hasComparison={!!financeData.comparison} />
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="text-xs text-[#AAA] mb-1">Dépenses</div>
                    <div className="text-2xl font-bold text-red-400">
                      <ComparisonCell current={financeData.current.expenses.toFixed(0)} compare={financeData.comparison?.expenses.toFixed(0)} suffix=" MAD" invert hasComparison={!!financeData.comparison} />
                    </div>
                  </div>
                  <div className="stat-card border-green-500/20">
                    <div className="text-xs text-[#AAA] mb-1">Profit net</div>
                    <div className={`text-2xl font-bold ${financeData.current.net_profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      <ComparisonCell current={financeData.current.net_profit.toFixed(0)} compare={financeData.comparison?.net_profit.toFixed(0)} suffix=" MAD" hasComparison={!!financeData.comparison} />
                    </div>
                  </div>
                </div>

                {/* Valorisation temps économisé */}
                <div className="card mb-6 bg-[#FF4D00]/5 border-[#FF4D00]/20">
                  <p className="text-xs text-[#AAA] mb-1">⏱️ Valeur estimée du temps économisé (file d'attente)</p>
                  <p className="text-xl font-bold text-[#FF4D00]">
                    {financeData.current.time_saved_value.toLocaleString('fr-FR')} MAD
                  </p>
                  <p className="text-[11px] text-[#555] mt-1">
                    Basé sur un taux horaire estimé de {financeData.current.hourly_rate_file_attente} MAD/h (gain moyen réel des Œils sur ces missions)
                  </p>
                </div>

                {/* Dépenses manuelles */}
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold">💸 Dépenses de la période</p>
                  <button onClick={() => setShowExpenseForm(v => !v)} className="btn btn-primary btn-sm">
                    + Ajouter une dépense
                  </button>
                </div>

                {showExpenseForm && (
                  <div className="card mb-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="label">Montant (MAD)</label>
                        <input type="number" className="input" value={newExpense.amount} onChange={(e) => setNewExpense(v => ({ ...v, amount: e.target.value }))} />
                      </div>
                      <div>
                        <label className="label">Catégorie</label>
                        <select className="input" value={newExpense.category} onChange={(e) => setNewExpense(v => ({ ...v, category: e.target.value }))}>
                          {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="label">Date</label>
                      <input type="date" className="input" value={newExpense.expense_date} onChange={(e) => setNewExpense(v => ({ ...v, expense_date: e.target.value }))} />
                    </div>
                    <div>
                      <label className="label">Description (optionnel)</label>
                      <input className="input" value={newExpense.description} onChange={(e) => setNewExpense(v => ({ ...v, description: e.target.value }))} placeholder="Ex: Campagne Instagram influenceur X" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={addExpense} disabled={savingExpense} className="btn btn-primary btn-sm disabled:opacity-50">
                        {savingExpense ? '...' : 'Enregistrer'}
                      </button>
                      <button onClick={() => setShowExpenseForm(false)} className="btn btn-ghost btn-sm">Annuler</button>
                    </div>
                  </div>
                )}

                <div className="card p-0">
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr><th>Date</th><th>Catégorie</th><th>Description</th><th>Montant</th><th>Ajouté par</th><th></th></tr>
                      </thead>
                      <tbody>
                        {expenses.length === 0 ? (
                          <tr><td colSpan={6} className="text-center text-[#AAA] py-6">Aucune dépense sur cette période</td></tr>
                        ) : expenses.map((e) => (
                          <tr key={e.id}>
                            <td className="text-xs text-[#AAA]">{new Date(e.expense_date).toLocaleDateString('fr-FR')}</td>
                            <td>{e.category}</td>
                            <td className="text-[#AAA] text-xs">{e.description || '—'}</td>
                            <td className="text-red-400 font-semibold">{parseFloat(e.amount).toFixed(0)} MAD</td>
                            <td className="text-xs text-[#AAA]">
                              {e.first_name ? `${e.first_name} ${e.last_name}` : e.category === 'Promotions' ? '🤖 Système (Promo)' : '—'}
                            </td>
                            <td>
                              <button onClick={() => removeExpense(e.id)} className="text-[#555] hover:text-red-400 text-xs">✕</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {tab === 'campagnes' && (
          <>
            {/* Générateur d'URL */}
            <div className="card mb-6">
              <p className="text-sm font-semibold mb-4">🔗 Générateur d'URL de campagne</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <div>
                  <label className="label">Source</label>
                  <input className="input" placeholder="facebook, instagram, tiktok..." value={urlGen.source} onChange={(e) => setUrlGen(v => ({ ...v, source: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Medium</label>
                  <input className="input" placeholder="paid, social, influencer..." value={urlGen.medium} onChange={(e) => setUrlGen(v => ({ ...v, medium: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Campagne</label>
                  <input className="input" placeholder="lancement_rabat, influenceur_x..." value={urlGen.campaign} onChange={(e) => setUrlGen(v => ({ ...v, campaign: e.target.value }))} />
                </div>
              </div>
              <button onClick={generateUrl} className="btn btn-primary btn-sm mb-3">Générer l'URL</button>

              {generatedUrl && (
                <div className="flex items-center gap-2 bg-[#222] rounded-lg p-3">
                  <code className="text-xs text-[#FF4D00] flex-1 break-all">{generatedUrl}</code>
                  <button onClick={copyUrl} className="btn btn-ghost btn-sm flex-shrink-0">📋 Copier</button>
                </div>
              )}
            </div>

            <DateRangeFilter range={range} onChange={setRange} compareRange={compareRange} onCompareChange={setCompareRange} />

            {loadingCampagnes ? (
              <div className="flex justify-center py-20"><Spinner size="lg" /></div>
            ) : campagnesData && (
              <>
                <p className="text-sm font-semibold mb-3">📊 Performance par campagne</p>
                <div className="card p-0">
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr><th>Source</th><th>Medium</th><th>Campagne</th><th>Inscriptions</th><th>Missions</th><th>CA</th></tr>
                      </thead>
                      <tbody>
                        {campagnesData.campaigns.length === 0 ? (
                          <tr><td colSpan={6} className="text-center text-[#AAA] py-6">Aucune donnée sur cette période</td></tr>
                        ) : campagnesData.campaigns.map((c, i) => (
                          <tr key={i}>
                            <td className="font-medium">{c.source}</td>
                            <td className="text-[#AAA]">{c.medium}</td>
                            <td className="text-[#AAA]">{c.campaign}</td>
                            <td>{c.inscriptions}</td>
                            <td>{c.missions}</td>
                            <td className="text-green-400">{parseFloat(c.revenue).toFixed(0)} MAD</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </>
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