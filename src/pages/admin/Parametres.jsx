import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import AppLayout from '../../components/layout/AppLayout'
import Topbar from '../../components/layout/Topbar'
import { adminAPI } from '../../api'
import { toast, Spinner } from '../../components/ui'

// ── Réglages avancés — valeurs par défaut EXACTEMENT identiques aux anciennes
// constantes codées en dur (voir AUDIT_SETTINGS_HARDCODED.md côté backend) ──
const ADVANCED_DEFAULTS = {
  transfer_grace_minutes_queue: 45,
  transfer_grace_minutes_other: 60,
  transfer_cooldown_hours: 4,
  abandon_during_mission_cooldown_hours: 48,
  candidate_window_minutes_fast: 10,
  candidate_window_minutes_choose_queue: 5,
  candidate_window_minutes_choose_other: 10,
  mission_edit_approval_minutes: 120,
  mission_edit_approval_minutes_urgent: 30,
  mission_edit_urgent_threshold_hours: 4,
  client_validation_hours: 12,
  schedule_conflict_window_hours: 4,
  stale_mission_hours: 12,
  stale_mission_min_lead_hours: 4,
  mission_overdue_verification_hours: 24,
  late_start_alert_window_minutes: 30,
  late_start_auto_transfer_minutes: 60,
  reminder_before_mission_minutes_early: 120,
  reminder_before_mission_minutes_late: 30,
  refund_partial_threshold_hours: 2,
  refund_partial_rate: 0.5,
  new_oeil_mission_threshold: 10,
  reactivation_default_score: 70,
  ticket_auto_resolve_hours: 72,
  response_time_max_valid_minutes: 1440,
  response_time_min_turns: 3,
  dashboard_stuck_pending_hours: 24,
  dashboard_low_reliability_threshold: 70,
}

// rate stockée en base comme fraction (0.5) — affichée en % dans le formulaire
const PERCENT_FIELDS = ['refund_partial_rate']

const ADVANCED_GROUPS = [
  { key: 'transferGrace',    category: 'missions',    fields: ['transfer_grace_minutes_queue', 'transfer_grace_minutes_other'] },
  { key: 'cooldowns',        category: 'missions',    fields: ['transfer_cooldown_hours', 'abandon_during_mission_cooldown_hours'] },
  { key: 'candidateWindow',  category: 'missions',    fields: ['candidate_window_minutes_fast', 'candidate_window_minutes_choose_queue', 'candidate_window_minutes_choose_other'] },
  { key: 'missionEdit',      category: 'missions',    fields: ['mission_edit_approval_minutes', 'mission_edit_approval_minutes_urgent', 'mission_edit_urgent_threshold_hours'] },
  { key: 'clientValidation', category: 'missions',    fields: ['client_validation_hours'] },
  { key: 'scheduleConflict', category: 'missions',    fields: ['schedule_conflict_window_hours'] },
  { key: 'staleMission',     category: 'missions',    fields: ['stale_mission_hours', 'stale_mission_min_lead_hours'] },
  { key: 'overdue',          category: 'missions',    fields: ['mission_overdue_verification_hours'] },
  { key: 'lateStart',        category: 'missions',    fields: ['late_start_alert_window_minutes', 'late_start_auto_transfer_minutes'] },
  { key: 'reminders',        category: 'missions',    fields: ['reminder_before_mission_minutes_early', 'reminder_before_mission_minutes_late'] },
  { key: 'refund',           category: 'missions',    fields: ['refund_partial_threshold_hours', 'refund_partial_rate'] },
  { key: 'newOeil',          category: 'reliability', fields: ['new_oeil_mission_threshold'] },
  { key: 'reactivation',     category: 'reliability', fields: ['reactivation_default_score'] },
  { key: 'ticketResolve',    category: 'support',     fields: ['ticket_auto_resolve_hours'] },
  { key: 'responseTime',     category: 'support',     fields: ['response_time_max_valid_minutes', 'response_time_min_turns'] },
  { key: 'dashboardAlerts',  category: 'dashboard',    fields: ['dashboard_stuck_pending_hours', 'dashboard_low_reliability_threshold'] },
]

const CATEGORY_ORDER = ['missions', 'reliability', 'support', 'dashboard']

export default function AdminParametres() {
  const { t } = useTranslation()
  const [params, setParams] = useState({ commission: 20, min_price: 80 })
  const [fiveStarBonusActive, setFiveStarBonusActive] = useState(false)
  const [fiveStarBonusPercent, setFiveStarBonusPercent] = useState(10)
  const [advanced, setAdvanced] = useState(ADVANCED_DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [savingAdvanced, setSavingAdvanced] = useState(false)

  useEffect(() => {
    adminAPI.settings()
      .then(({ data }) => {
        const s = data.settings || {}
        setParams({
          commission:   parseFloat(s.commission || 0.20) * 100,
          min_price:    parseFloat(s.min_price   || 80),
        })
        setFiveStarBonusActive(s.five_star_bonus_active === 'true')
        setFiveStarBonusPercent(parseFloat(s.five_star_bonus_percent || 10))

        const nextAdvanced = {}
        for (const [key, defaultValue] of Object.entries(ADVANCED_DEFAULTS)) {
          const raw = s[key] !== undefined ? parseFloat(s[key]) : defaultValue
          nextAdvanced[key] = PERCENT_FIELDS.includes(key) ? raw * 100 : raw
        }
        setAdvanced(nextAdvanced)
      })
      .catch(() => toast('Erreur chargement', 'error'))
      .finally(() => setLoading(false))
  }, [])

  const setAdvancedField = (key) => (e) => {
    const value = e.target.value
    setAdvanced((a) => ({ ...a, [key]: value === '' ? '' : parseFloat(value) }))
  }

  const saveAdvanced = async () => {
    setSavingAdvanced(true)
    try {
      const payload = {}
      for (const [key, value] of Object.entries(advanced)) {
        const num = parseFloat(value)
        payload[key] = PERCENT_FIELDS.includes(key) ? num / 100 : num
      }
      await adminAPI.saveSettings(payload)
      toast('Réglages avancés enregistrés ✓', 'success')
    } catch { toast('Erreur sauvegarde', 'error') }
    finally { setSavingAdvanced(false) }
  }

  const set = (k) => (e) => setParams((p) => ({ ...p, [k]: e.target.value }))

  const save = async () => {
    setSaving(true)
    try {
      await adminAPI.saveSettings({
        commission:   parseFloat(params.commission) / 100,
        min_price:    parseFloat(params.min_price),
        five_star_bonus_active:  fiveStarBonusActive ? 'true' : 'false',
        five_star_bonus_percent: parseFloat(fiveStarBonusPercent),
      })
      toast('Paramètres enregistrés ✓', 'success')
    } catch { toast('Erreur sauvegarde', 'error') }
    finally { setSaving(false) }
  }

  if (loading) return <AppLayout><Topbar title="Paramètres" /><div className="flex justify-center py-20"><Spinner size="lg" /></div></AppLayout>

  return (
    <AppLayout>
      <Topbar title="Paramètres" />
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="font-semibold text-sm mb-4">Tarification plateforme</h2>
            {[
              ['Commission SHOOFLY (%)', 'commission', 'Ex: 20 pour 20%'],
              ['Tarif minimum (MAD)',    'min_price',   'Ex: 80'],
            ].map(([label, key, hint]) => (
              <div key={key} className="mb-3">
                <label className="label">{label}</label>
                <input type="number" className="input" value={params[key]} onChange={set(key)} />
                <p className="text-[11px] text-[#555] mt-1">{hint}</p>
              </div>
            ))}
            <button onClick={save} disabled={saving} className="btn btn-primary mt-2 disabled:opacity-60">
              {saving ? 'Sauvegarde...' : 'Enregistrer'}
            </button>
          </div>
          <div className="card">
            <h2 className="font-semibold text-sm mb-4">🎁 Campagne bonus qualité 5 étoiles</h2>
            <p className="text-[11px] text-[#555] mb-4">Bonus payé par Shoofly (non facturé au client) quand un client note une mission 5/5. Calculé sur le gain de l'Œil, pas sur le prix total de la mission.</p>
            <label className="flex items-center gap-2 mb-3 cursor-pointer">
              <input type="checkbox" checked={fiveStarBonusActive} onChange={(e) => setFiveStarBonusActive(e.target.checked)} />
              <span className="text-sm">{fiveStarBonusActive ? 'Campagne active' : 'Campagne inactive'}</span>
            </label>
            <div className="mb-3">
              <label className="label">Bonus (% du gain de l'Œil)</label>
              <input type="number" className="input" value={fiveStarBonusPercent} onChange={(e) => setFiveStarBonusPercent(e.target.value)} />
              <p className="text-[11px] text-[#555] mt-1">Ex: 10 pour 10% du gain de l'Œil</p>
            </div>
            <button onClick={save} disabled={saving} className="btn btn-primary mt-2 disabled:opacity-60">
              {saving ? 'Sauvegarde...' : 'Enregistrer'}
            </button>
          </div>
          <div className="card">
            <h2 className="font-semibold text-sm mb-4">Villes couvertes</h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {['Rabat','Salé','Témara','Casablanca'].map((v) => (
                <span key={v} className="badge badge-blue cursor-pointer" onClick={() => toast(`${v} retiré`, 'info')}>{v} ✕</span>
              ))}
            </div>
            <div className="flex gap-2">
              <input className="input flex-1" placeholder="Ajouter une ville..." />
              <button onClick={() => toast('Ville ajoutée', 'success')} className="btn btn-primary btn-sm">Ajouter</button>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="font-semibold text-base mb-1">{t('adminAdvancedSettings.sectionTitle')}</h2>
          <p className="text-[11px] text-[#555] mb-4">{t('adminAdvancedSettings.sectionIntro')}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {CATEGORY_ORDER.map((category) => (
              <div key={category} className="card">
                <h3 className="font-semibold text-sm mb-4">{t(`adminAdvancedSettings.categories.${category}`)}</h3>
                {ADVANCED_GROUPS.filter((g) => g.category === category).map((group) => (
                  <div key={group.key} className="mb-5 pb-5 border-b border-[#eee] last:border-b-0 last:mb-0 last:pb-0">
                    <h4 className="text-[12px] font-semibold mb-1">{t(`adminAdvancedSettings.groups.${group.key}.title`)}</h4>
                    {t(`adminAdvancedSettings.groups.${group.key}.note`, { defaultValue: '' }) && (
                      <p className="text-[11px] text-[#555] mb-2">{t(`adminAdvancedSettings.groups.${group.key}.note`)}</p>
                    )}
                    <div className={group.fields.length > 1 ? 'grid grid-cols-2 gap-3' : ''}>
                      {group.fields.map((key) => (
                        <div key={key} className="mb-2">
                          <label className="label">{t(`adminAdvancedSettings.fields.${key}`)}</label>
                          <input
                            type="number"
                            step="any"
                            className="input"
                            value={advanced[key]}
                            onChange={setAdvancedField(key)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <button onClick={saveAdvanced} disabled={savingAdvanced} className="btn btn-primary mt-4 disabled:opacity-60">
            {savingAdvanced ? t('adminAdvancedSettings.saving') : t('adminAdvancedSettings.save')}
          </button>
        </div>
      </div>
    </AppLayout>
  )
}