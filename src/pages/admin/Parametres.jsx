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
  reminder_before_mission_minutes_late: 45,
  refund_partial_threshold_hours: 2,
  refund_partial_rate: 0.5,
  new_oeil_mission_threshold: 10,
  reactivation_default_score: 70,
  ticket_auto_resolve_hours: 72,
  response_time_max_valid_minutes: 1440,
  response_time_min_turns: 3,
  dashboard_stuck_pending_hours: 24,
  dashboard_low_reliability_threshold: 70,
  urgent_mission_whatsapp_batch_size: 10,
  urgent_mission_whatsapp_batch_delay_minutes: 30,
  candidate_batch_size: 10,
  candidate_confirmation_minutes: 10,
  candidate_tiebreak_window_minutes: 5,
  transfer_cooldown_before_hours: 3,
  presence_confirmation_deadline_minutes: 120,
  presence_confirmation_deadline_minutes_sameday: 45,
  candidature_whatsapp_seuil_count: 3,
  candidature_whatsapp_seuil_minutes: 60,
  whatsapp_retry_max_attempts: 3,
  payment_attempt_abandoned_minutes: 30,
  no_show_h30_penalty_points: -20,
  no_show_h30_debit_cap_mad: 100,
  transfer_during_no_replacement_penalty_points: -70,
  transfer_during_no_replacement_debit_cap_mad: 100,
  transfer_before_no_replacement_penalty_points: -10,
  transfer_before_replacement_bonus_points: 5,
  late_cancel_penalty_tier1_points: -15,
  late_cancel_penalty_tier2_points: -35,
  late_cancel_penalty_tier3_points: -50,
  late_cancel_penalty_tier1_threshold_hours: 24,
  late_cancel_penalty_tier2_threshold_hours: 2,
  presence_confirmation_deadline_minutes_h45: 15,
  password_reset_token_expiry_hours: 1,
}

// rate stockée en base comme fraction (0.5) — affichée en % dans le formulaire
const PERCENT_FIELDS = ['refund_partial_rate']

const ADVANCED_GROUPS = [
  { key: 'candidateCascade', category: 'missions',    fields: ['candidate_batch_size', 'candidate_confirmation_minutes', 'candidate_tiebreak_window_minutes'] },
  { key: 'transferGrace',    category: 'missions',    fields: ['transfer_grace_minutes_queue', 'transfer_grace_minutes_other'] },
  { key: 'cooldowns',        category: 'missions',    fields: ['transfer_cooldown_hours', 'abandon_during_mission_cooldown_hours', 'transfer_cooldown_before_hours'] },
  { key: 'missionEdit',      category: 'missions',    fields: ['mission_edit_approval_minutes', 'mission_edit_approval_minutes_urgent', 'mission_edit_urgent_threshold_hours'] },
  { key: 'clientValidation', category: 'missions',    fields: ['client_validation_hours'] },
  { key: 'scheduleConflict', category: 'missions',    fields: ['schedule_conflict_window_hours'] },
  { key: 'staleMission',     category: 'missions',    fields: ['stale_mission_hours', 'stale_mission_min_lead_hours'] },
  { key: 'urgentWhatsappWaves', category: 'missions', fields: ['urgent_mission_whatsapp_batch_size', 'urgent_mission_whatsapp_batch_delay_minutes'] },
  { key: 'candidatureWhatsapp', category: 'missions', fields: ['candidature_whatsapp_seuil_count', 'candidature_whatsapp_seuil_minutes'] },
  { key: 'whatsappRetry',    category: 'missions',    fields: ['whatsapp_retry_max_attempts'] },
  { key: 'overdue',          category: 'missions',    fields: ['mission_overdue_verification_hours'] },
  { key: 'lateStart',        category: 'missions',    fields: ['late_start_alert_window_minutes', 'late_start_auto_transfer_minutes', 'no_show_h30_penalty_points', 'no_show_h30_debit_cap_mad'] },
  { key: 'reminders',        category: 'missions',    fields: ['reminder_before_mission_minutes_early', 'reminder_before_mission_minutes_late'] },
  { key: 'presenceConfirmation', category: 'missions', fields: ['presence_confirmation_deadline_minutes', 'presence_confirmation_deadline_minutes_sameday', 'presence_confirmation_deadline_minutes_h45'] },
  { key: 'refund',           category: 'missions',    fields: ['refund_partial_threshold_hours', 'refund_partial_rate'] },
  { key: 'paymentRetry',     category: 'missions',    fields: ['payment_attempt_abandoned_minutes'] },
  { key: 'newOeil',          category: 'reliability', fields: ['new_oeil_mission_threshold'] },
  { key: 'reactivation',     category: 'reliability', fields: ['reactivation_default_score'] },
  { key: 'transferPenalties', category: 'reliability', fields: ['transfer_during_no_replacement_penalty_points', 'transfer_during_no_replacement_debit_cap_mad', 'transfer_before_no_replacement_penalty_points', 'transfer_before_replacement_bonus_points'] },
  { key: 'lateCancelPenalty', category: 'reliability', fields: ['late_cancel_penalty_tier1_threshold_hours', 'late_cancel_penalty_tier1_points', 'late_cancel_penalty_tier2_threshold_hours', 'late_cancel_penalty_tier2_points', 'late_cancel_penalty_tier3_points'] },
  { key: 'ticketResolve',    category: 'support',     fields: ['ticket_auto_resolve_hours'] },
  { key: 'responseTime',     category: 'support',     fields: ['response_time_max_valid_minutes', 'response_time_min_turns'] },
  { key: 'dashboardAlerts',  category: 'dashboard',    fields: ['dashboard_stuck_pending_hours', 'dashboard_low_reliability_threshold'] },
  { key: 'passwordReset',    category: 'account',     fields: ['password_reset_token_expiry_hours'] },
]

const CATEGORY_ORDER = ['missions', 'reliability', 'support', 'dashboard', 'account']

// Les 4 réglages "de base" (cartes du haut) n'ont pas d'entrée adminAdvancedSettings.fields.* —
// libellés utilisés par le tableau d'aperçu de la réinitialisation (voir ci-dessous).
const BASIC_FIELD_LABELS = {
  commission: 'Commission SHOOFLY (%)',
  min_price: 'Tarif minimum (MAD)',
  five_star_bonus_active: 'Bonus qualité 5 étoiles — actif',
  five_star_bonus_percent: 'Bonus qualité 5 étoiles — pourcentage',
}

// Comparaison tolérante au formatage : la valeur seedée par schema.js ('0.20') et celle réécrite
// par un save du formulaire (String(0.2) => '0.2') sont numériquement identiques mais diffèrent en
// tant que chaînes — comparer les chaînes brutes ferait apparaître de faux positifs dans l'aperçu
// de réinitialisation. Même détection numérique que utils/settings.js (isNumeric) côté backend.
const isNumericStr = (s) => s !== '' && s !== undefined && s !== null && !isNaN(s)
const valuesEqual = (a, b) => {
  if (a === undefined) return false
  if (isNumericStr(a) && isNumericStr(b)) return Number(a) === Number(b)
  return String(a) === String(b)
}

export default function AdminParametres() {
  const { t } = useTranslation()
  const [params, setParams] = useState({ commission: 20, min_price: 80 })
  const [fiveStarBonusActive, setFiveStarBonusActive] = useState(false)
  const [fiveStarBonusPercent, setFiveStarBonusPercent] = useState(10)
  const [advanced, setAdvanced] = useState(ADVANCED_DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [savingAdvanced, setSavingAdvanced] = useState(false)
  const [resetPreview, setResetPreview] = useState(null) // null | { rows: [{key,current,default}], defaultsRaw }
  const [resetLoading, setResetLoading] = useState(false)
  const [resetApplying, setResetApplying] = useState(false)

  // Extrait de l'useEffect de montage pour être ré-appelable après une réinitialisation, afin que
  // les champs affichés reflètent immédiatement les valeurs restaurées sans recharger la page.
  const loadSettings = async () => {
    try {
      const { data } = await adminAPI.settings()
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
    } catch {
      toast('Erreur chargement', 'error')
    }
  }

  useEffect(() => { loadSettings().finally(() => setLoading(false)) }, [])

  // Aperçu de réinitialisation : recharge la vérité DB actuelle (pas les valeurs du formulaire,
  // potentiellement non enregistrées) + les valeurs par défaut de schema.js, et ne garde que les
  // réglages qui diffèrent réellement.
  const openResetPreview = async () => {
    setResetLoading(true)
    try {
      const [curRes, defRes] = await Promise.all([adminAPI.settings(), adminAPI.settingsDefaults()])
      const current = curRes.data.settings || {}
      const defaults = defRes.data.defaults || {}
      const rows = Object.entries(defaults)
        .filter(([key, def]) => !valuesEqual(current[key], def))
        .map(([key, def]) => ({ key, current: current[key], default: def }))
      setResetPreview({ rows, defaultsRaw: defaults })
    } catch {
      toast(t('adminSettingsReset.loadErrorToast'), 'error')
    } finally {
      setResetLoading(false)
    }
  }

  // Confirmé : envoie l'intégralité des valeurs par défaut (pas seulement le sous-ensemble
  // affiché dans l'aperçu) — aucun réglage n'est exclu de la réinitialisation.
  const confirmReset = async () => {
    if (!resetPreview) return
    setResetApplying(true)
    try {
      await adminAPI.saveSettings(resetPreview.defaultsRaw)
      toast(t('adminSettingsReset.successToast'), 'success')
      setResetPreview(null)
      await loadSettings()
    } catch {
      toast(t('adminSettingsReset.errorToast'), 'error')
    } finally {
      setResetApplying(false)
    }
  }

  const fieldLabel = (key) => BASIC_FIELD_LABELS[key] || t(`adminAdvancedSettings.fields.${key}`, { defaultValue: key })

  const displayValue = (key, raw) => {
    if (raw === undefined || raw === null) return '—'
    if (key === 'five_star_bonus_active') return raw === 'true' ? 'Actif' : 'Inactif'
    if (key === 'commission' || PERCENT_FIELDS.includes(key)) {
      const n = parseFloat(raw)
      return Number.isFinite(n) ? `${n * 100}%` : raw
    }
    return raw
  }

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
      <Topbar
        title="Paramètres"
        actions={
          <button onClick={openResetPreview} disabled={resetLoading} className="btn btn-ghost btn-sm disabled:opacity-60">
            {resetLoading ? t('adminSettingsReset.loading') : t('adminSettingsReset.button')}
          </button>
        }
      />
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="font-semibold text-sm mb-4">Tarification plateforme</h2>
            {[
              ['Commission SHOOFLY (%)', 'commission'],
              ['Tarif minimum (MAD)',    'min_price'],
            ].map(([label, key]) => (
              <div key={key} className="mb-3">
                <label className="label">{label}</label>
                <input type="number" className="input" value={params[key]} onChange={set(key)} />
                <p className="text-[10px] text-[#FF4D00] mt-1">{t(`adminAdvancedSettings.basicExplanations.${key}`)}</p>
              </div>
            ))}
            <button onClick={save} disabled={saving} className="btn btn-primary mt-2 disabled:opacity-60">
              {saving ? 'Sauvegarde...' : 'Enregistrer'}
            </button>
          </div>
          <div className="card">
            <h2 className="font-semibold text-sm mb-4">🎁 Campagne bonus qualité 5 étoiles</h2>
            <p className="text-[10px] text-[#FF4D00] mb-4">{t('adminAdvancedSettings.basicExplanations.five_star_bonus_active')}</p>
            <label className="flex items-center gap-2 mb-3 cursor-pointer">
              <input type="checkbox" checked={fiveStarBonusActive} onChange={(e) => setFiveStarBonusActive(e.target.checked)} />
              <span className="text-sm">{fiveStarBonusActive ? 'Campagne active' : 'Campagne inactive'}</span>
            </label>
            <div className="mb-3">
              <label className="label">Bonus (% du gain de l'Œil)</label>
              <input type="number" className="input" value={fiveStarBonusPercent} onChange={(e) => setFiveStarBonusPercent(e.target.value)} />
              <p className="text-[10px] text-[#FF4D00] mt-1">{t('adminAdvancedSettings.basicExplanations.five_star_bonus_percent')}</p>
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
                      <p className="text-[10px] text-[#FF4D00] mb-2">{t(`adminAdvancedSettings.groups.${group.key}.note`)}</p>
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
                          <p className="text-[10px] text-[#FF4D00] mt-1">{t(`adminAdvancedSettings.fieldExplanations.${key}`)}</p>
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

      {resetPreview && (
        <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#181818] border border-orange-500/30 rounded-2xl p-6 w-full max-w-2xl shadow-xl max-h-[85vh] overflow-y-auto">
            <h2 className="font-bold text-base mb-1">{t('adminSettingsReset.modalTitle')}</h2>

            {resetPreview.rows.length === 0 ? (
              <>
                <p className="text-sm text-[#AAA] my-6">{t('adminSettingsReset.noDifference')}</p>
                <button onClick={() => setResetPreview(null)} className="btn btn-ghost w-full justify-center">
                  {t('adminSettingsReset.close')}
                </button>
              </>
            ) : (
              <>
                <p className="text-xs text-[#AAA] mb-4">{t('adminSettingsReset.warning', { count: resetPreview.rows.length })}</p>
                <div className="table-wrap mb-5">
                  <table>
                    <thead>
                      <tr>
                        <th>{t('adminSettingsReset.columnSetting')}</th>
                        <th>{t('adminSettingsReset.columnCurrent')}</th>
                        <th>{t('adminSettingsReset.columnDefault')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resetPreview.rows.map((row) => (
                        <tr key={row.key}>
                          <td>{fieldLabel(row.key)}</td>
                          <td className="text-[#FF4D4D]">{displayValue(row.key, row.current)}</td>
                          <td className="text-[#2ECC71]">{displayValue(row.key, row.default)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setResetPreview(null)} disabled={resetApplying} className="btn btn-ghost flex-1 justify-center">
                    {t('adminSettingsReset.cancel')}
                  </button>
                  <button onClick={confirmReset} disabled={resetApplying} className="btn btn-red flex-1 justify-center disabled:opacity-60">
                    {resetApplying ? t('adminSettingsReset.confirming') : t('adminSettingsReset.confirm', { count: resetPreview.rows.length })}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </AppLayout>
  )
}