import { useState, useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import AppLayout from '../../components/layout/AppLayout'
import Topbar from '../../components/layout/Topbar'
import { adminAPI } from '../../api'
import { toast, Spinner, Pagination } from '../../components/ui'
import { CASABLANCA_TZ } from '../../utils/casablancaTime'

// ── Réglages plateforme — valeurs par défaut EXACTEMENT identiques aux valeurs seedées
// côté backend (config/settingsDefaults.js). Les 4 réglages de tarification plateforme
// (commission, min_price, bonus 5★) sont désormais dans le même état `advanced` que le
// reste, avec conversion d'affichage centralisée (toDisplay / toStorage plus bas) au lieu
// de trois états séparés. Rien n'est ajouté ni retiré par rapport à l'écran précédent :
// mêmes 71 clés, même contrat API (PUT /admin/settings, écriture partielle clé par clé). ──
const ADVANCED_DEFAULTS = {
  // Tarification plateforme — stockées en base sous forme brute : commission en fraction
  // (0.20 ⇒ affiché 20 %), min_price en MAD, five_star_bonus_active en 'true'/'false'.
  commission: 0.20,
  min_price: 80,
  five_star_bonus_active: false,
  five_star_bonus_percent: 10,
  transfer_grace_minutes_queue: 45,
  transfer_grace_minutes_other: 60,
  transfer_cooldown_hours: 4,
  abandon_during_mission_cooldown_hours: 48,
  mission_edit_approval_minutes: 120,
  mission_edit_approval_minutes_urgent: 30,
  mission_edit_urgent_threshold_hours: 4,
  client_validation_hours: 12,
  client_validation_reminder_hours: 6,
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
  candidate_batch_max_waves: 2,
  activity_photo_interval_minutes: 45,
  transfer_cooldown_before_hours: 3,
  presence_confirmation_deadline_minutes: 120,
  presence_confirmation_deadline_minutes_sameday: 45,
  candidature_whatsapp_seuil_count: 3,
  candidature_whatsapp_seuil_minutes: 60,
  candidature_relance_first_after_minutes: 60,
  candidature_relance_interval_minutes: 120,
  candidature_relance_imminent_threshold_minutes: 120,
  unread_whatsapp_email_fallback_minutes: 5,
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
  late_cancel_penalty_tier1_enabled: false,
  presence_confirmation_deadline_minutes_h45: 15,
  password_reset_token_expiry_hours: 1,
  // Anti-fraude (backend routes/antiFraud.js) — défauts identiques aux valeurs précédemment
  // codées en dur (voir settingsDefaults.js côté backend). Fenêtres de détection en JOURS,
  // sauf fraud_rating_spike_window_hours (heures) et les 2 seuils *_seconds.
  fraud_oeil_cancel_lookback_days: 7,
  fraud_oeil_nomedia_lookback_days: 30,
  fraud_oeil_too_fast_lookback_days: 30,
  fraud_oeil_too_fast_seconds: 300,
  fraud_rating_spike_window_hours: 48,
  fraud_client_cancel_lookback_days: 30,
  fraud_client_refund_lookback_days: 14,
  fraud_client_fake_mission_lookback_days: 30,
  fraud_client_fake_mission_seconds: 600,
  fraud_message_scan_lookback_days: 7,
  fraud_dashboard_recent_days: 7,
  fraud_dashboard_cancellations_days: 30,
}

// Réglages stockés en base comme fraction (0.20, 0.5) — affichés / saisis en pourcentage.
const PERCENT_FIELDS = ['refund_partial_rate', 'commission']
// Réglages stockés en 'true' / 'false' — affichés comme interrupteur.
const BOOLEAN_FIELDS = ['five_star_bonus_active', 'late_cancel_penalty_tier1_enabled']

// storage (base) → valeur affichée dans le champ
const toDisplay = (key, stored) => {
  if (BOOLEAN_FIELDS.includes(key)) return stored === true || stored === 'true'
  const n = parseFloat(stored)
  if (!Number.isFinite(n)) return ''
  return PERCENT_FIELDS.includes(key) ? n * 100 : n
}
// valeur affichée → storage (base). Renvoie une string pour les booléens (contrat backend).
const toStorage = (key, display) => {
  if (BOOLEAN_FIELDS.includes(key)) return display ? 'true' : 'false'
  const n = parseFloat(display)
  if (!Number.isFinite(n)) return display
  return PERCENT_FIELDS.includes(key) ? n / 100 : n
}

// Unité affichée à droite du champ, déduite du suffixe de la clé. `null` = entier nu
// (compteur, score, nombre de tours…). Aucune donnée i18n touchée : purement cosmétique.
const unitFor = (key) => {
  if (BOOLEAN_FIELDS.includes(key)) return null
  if (PERCENT_FIELDS.includes(key) || key === 'five_star_bonus_percent') return '%'
  if (key === 'min_price') return 'MAD'
  if (/_hours$/.test(key)) return 'h'
  if (/_minutes(_[a-z0-9]+)?$/.test(key)) return 'min'
  if (/_days$/.test(key)) return 'j'
  if (/_seconds$/.test(key)) return 's'
  if (/_points$/.test(key)) return 'pts'
  if (/_mad$/.test(key)) return 'MAD'
  return null
}

// Retire une parenthèse d'unité SEULE en fin de libellé (« … (min) », « … (jours) »),
// puisque l'unité est désormais affichée comme adornment du champ. Ne touche jamais une
// parenthèse porteuse de sens (« (h avant la mission) ») : plus d'un mot ⇒ pas de match.
const stripTrailingUnit = (label) =>
  label.replace(/\s*\((?:min|h|heures?|jours?|j|s|%|points?|pts|MAD)\)\s*$/i, '')

// 8 catégories, dans l'ordre du menu latéral. (Remplace l'ancien CATEGORY_ORDER à 6
// entrées : missions / reliability / support / dashboard / fraud / account.)
const CATEGORIES = [
  { key: 'tarification',  icon: '💰' },
  { key: 'delaisMission', icon: '⏱️' },
  { key: 'transferts',    icon: '🔄' },
  { key: 'validation',    icon: '✅' },
  { key: 'fiabilite',     icon: '⭐' },
  { key: 'communication', icon: '📱' },
  { key: 'antifraude',    icon: '🚨' },
  { key: 'securite',      icon: '🔒' },
]

// Groupe → catégorie → champs. Les groupes (titre + note i18n) restent l'unité atomique :
// un groupe entier va dans une seule catégorie, jamais éclaté. `basic:true` = les 4
// réglages de tarification plateforme, dont le libellé vient de BASIC_FIELD_LABELS et
// l'explication de basicExplanations.* (et non fields.* / fieldExplanations.*).
const ADVANCED_GROUPS = [
  // 💰 Tarification
  { key: 'platformPricing', category: 'tarification', basic: true, fields: ['commission', 'min_price', 'five_star_bonus_active', 'five_star_bonus_percent'] },
  { key: 'refund',          category: 'tarification', fields: ['refund_partial_threshold_hours', 'refund_partial_rate'] },
  // ⏱️ Délais mission
  { key: 'candidateCascade',    category: 'delaisMission', fields: ['candidate_batch_size', 'candidate_confirmation_minutes', 'candidate_tiebreak_window_minutes', 'candidate_batch_max_waves'] },
  { key: 'missionEdit',         category: 'delaisMission', fields: ['mission_edit_approval_minutes', 'mission_edit_approval_minutes_urgent', 'mission_edit_urgent_threshold_hours'] },
  { key: 'scheduleConflict',    category: 'delaisMission', fields: ['schedule_conflict_window_hours'] },
  { key: 'staleMission',        category: 'delaisMission', fields: ['stale_mission_hours', 'stale_mission_min_lead_hours'] },
  { key: 'reminders',           category: 'delaisMission', fields: ['reminder_before_mission_minutes_early', 'reminder_before_mission_minutes_late'] },
  { key: 'presenceConfirmation', category: 'delaisMission', fields: ['presence_confirmation_deadline_minutes', 'presence_confirmation_deadline_minutes_sameday', 'presence_confirmation_deadline_minutes_h45'] },
  { key: 'activityPhoto',       category: 'delaisMission', fields: ['activity_photo_interval_minutes'] },
  // 🔄 Transferts & cooldowns
  { key: 'transferGrace',      category: 'transferts', fields: ['transfer_grace_minutes_queue', 'transfer_grace_minutes_other'] },
  { key: 'cooldowns',          category: 'transferts', fields: ['transfer_cooldown_hours', 'abandon_during_mission_cooldown_hours', 'transfer_cooldown_before_hours'] },
  { key: 'lateStart',          category: 'transferts', fields: ['late_start_alert_window_minutes', 'late_start_auto_transfer_minutes', 'no_show_h30_penalty_points', 'no_show_h30_debit_cap_mad'] },
  { key: 'transferPenalties',  category: 'transferts', fields: ['transfer_during_no_replacement_penalty_points', 'transfer_during_no_replacement_debit_cap_mad', 'transfer_before_no_replacement_penalty_points', 'transfer_before_replacement_bonus_points'] },
  // ✅ Validation & litiges
  { key: 'clientValidation',   category: 'validation', fields: ['client_validation_hours', 'client_validation_reminder_hours'] },
  { key: 'overdue',            category: 'validation', fields: ['mission_overdue_verification_hours'] },
  { key: 'paymentRetry',       category: 'validation', fields: ['payment_attempt_abandoned_minutes'] },
  { key: 'ticketResolve',      category: 'validation', fields: ['ticket_auto_resolve_hours'] },
  { key: 'dashboardAlerts',    category: 'validation', fields: ['dashboard_stuck_pending_hours', 'dashboard_low_reliability_threshold'] },
  // ⭐ Fiabilité
  { key: 'newOeil',            category: 'fiabilite', fields: ['new_oeil_mission_threshold'] },
  { key: 'reactivation',       category: 'fiabilite', fields: ['reactivation_default_score'] },
  { key: 'lateCancelPenalty',  category: 'fiabilite', fields: ['late_cancel_penalty_tier1_enabled', 'late_cancel_penalty_tier1_threshold_hours', 'late_cancel_penalty_tier1_points', 'late_cancel_penalty_tier2_threshold_hours', 'late_cancel_penalty_tier2_points', 'late_cancel_penalty_tier3_points'] },
  { key: 'responseTime',       category: 'fiabilite', fields: ['response_time_max_valid_minutes', 'response_time_min_turns'] },
  // 📱 Communication
  { key: 'urgentWhatsappWaves', category: 'communication', fields: ['urgent_mission_whatsapp_batch_size', 'urgent_mission_whatsapp_batch_delay_minutes'] },
  { key: 'candidatureWhatsapp', category: 'communication', fields: ['candidature_whatsapp_seuil_count', 'candidature_whatsapp_seuil_minutes'] },
  { key: 'candidatureRelance',  category: 'communication', fields: ['candidature_relance_first_after_minutes', 'candidature_relance_interval_minutes', 'candidature_relance_imminent_threshold_minutes'] },
  { key: 'emailFallback',       category: 'communication', fields: ['unread_whatsapp_email_fallback_minutes'] },
  { key: 'whatsappRetry',       category: 'communication', fields: ['whatsapp_retry_max_attempts'] },
  // 🚨 Anti-fraude — mêmes clés que le backend (routes/antiFraud.js).
  { key: 'fraudOeil',       category: 'antifraude', fields: ['fraud_oeil_cancel_lookback_days', 'fraud_oeil_nomedia_lookback_days', 'fraud_oeil_too_fast_lookback_days', 'fraud_oeil_too_fast_seconds'] },
  { key: 'fraudRating',     category: 'antifraude', fields: ['fraud_rating_spike_window_hours'] },
  { key: 'fraudClient',     category: 'antifraude', fields: ['fraud_client_cancel_lookback_days', 'fraud_client_refund_lookback_days', 'fraud_client_fake_mission_lookback_days', 'fraud_client_fake_mission_seconds'] },
  { key: 'fraudMessages',   category: 'antifraude', fields: ['fraud_message_scan_lookback_days'] },
  { key: 'fraudDashboard',  category: 'antifraude', fields: ['fraud_dashboard_recent_days', 'fraud_dashboard_cancellations_days'] },
  // 🔒 Sécurité
  { key: 'passwordReset',   category: 'securite', fields: ['password_reset_token_expiry_hours'] },
]

const groupsByCategory = (cat) => ADVANCED_GROUPS.filter((g) => g.category === cat)

// Libellés des 4 réglages "de base" — servent AUSSI au tableau d'aperçu de la
// réinitialisation (BASIC_FIELD_LABELS[key] || t(fields.key)).
const BASIC_FIELD_LABELS = {
  commission: 'Commission SHOOFLY (%)',
  min_price: 'Tarif minimum (MAD)',
  five_star_bonus_active: 'Bonus qualité 5 étoiles — actif',
  five_star_bonus_percent: 'Bonus qualité 5 étoiles — pourcentage',
}

// Comparaison tolérante au formatage : '0.20' (seed) et '0.2' (String(0.2) après un save)
// sont numériquement égaux mais différents comme chaînes — comparer les chaînes brutes
// ferait de faux positifs dans l'aperçu de réinitialisation. Même détection numérique que
// utils/settings.js (isNumeric) côté backend.
const isNumericStr = (s) => s !== '' && s !== undefined && s !== null && !isNaN(s)
const valuesEqual = (a, b) => {
  if (a === undefined) return false
  if (isNumericStr(a) && isNumericStr(b)) return Number(a) === Number(b)
  return String(a) === String(b)
}

// Accent-insensible + minuscules, pour la recherche globale (nom OU description).
const fold = (s) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export default function AdminParametres() {
  const { t, i18n } = useTranslation()
  const [advanced, setAdvanced] = useState(ADVANCED_DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [savingCat, setSavingCat] = useState(null)   // clé de catégorie en cours de save | null
  const [activeCat, setActiveCat] = useState(CATEGORIES[0].key)
  const [query, setQuery] = useState('')
  const [highlightKey, setHighlightKey] = useState(null)
  const fieldRefs = useRef({})
  const highlightTimer = useRef(null)

  const [resetPreview, setResetPreview] = useState(null) // null | { rows:[{key,current,default}], defaultsRaw }
  const [resetLoading, setResetLoading] = useState(false)
  const [resetApplying, setResetApplying] = useState(false)

  // ── Historique des modifications (chantier "historique des réglages", 2026-09-04) — accès
  // global depuis le Topbar (même emplacement que "Réinitialiser aux valeurs par défaut"
  // ci-dessus), pas un lien par catégorie : settings_history est paginée côté serveur sur
  // TOUTES les clés, un filtre par catégorie forcerait à paginer côté client sur un
  // sous-ensemble déjà tronqué par page. Le filtre `historyKey` (optionnel, une seule clé à la
  // fois — même contrat que GET /admin/settings/history) suffit à retrouver un réglage précis
  // sans dupliquer un mécanisme de filtrage différent de celui du backend.
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyRows, setHistoryRows] = useState([])
  const [historyPage, setHistoryPage] = useState(1)
  const [historyPages, setHistoryPages] = useState(1)
  const [historyKey, setHistoryKey] = useState('')

  // Extrait de l'useEffect de montage pour être ré-appelable après une réinitialisation :
  // les champs reflètent immédiatement les valeurs restaurées sans recharger la page.
  const loadSettings = async () => {
    try {
      const { data } = await adminAPI.settings()
      const s = data.settings || {}
      const next = {}
      for (const [key, dflt] of Object.entries(ADVANCED_DEFAULTS)) {
        next[key] = toDisplay(key, s[key] !== undefined ? s[key] : dflt)
      }
      setAdvanced(next)
    } catch {
      toast(t('adminAdvancedSettings.loadError'), 'error')
    }
  }

  useEffect(() => { loadSettings().finally(() => setLoading(false)) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => clearTimeout(highlightTimer.current), [])

  const fieldLabel = (key) => BASIC_FIELD_LABELS[key] || t(`adminAdvancedSettings.fields.${key}`, { defaultValue: key })
  const fieldExplanation = (key) =>
    t(`adminAdvancedSettings.fieldExplanations.${key}`, { defaultValue: '' }) ||
    t(`adminAdvancedSettings.basicExplanations.${key}`, { defaultValue: '' })
  const groupTitle = (g) =>
    g.basic ? t('adminAdvancedSettings.groups.platformPricing.title') : t(`adminAdvancedSettings.groups.${g.key}.title`)

  // ── C10 (audit temps) : les notes de groupe qui citent la valeur d'un AUTRE réglage
  // (« 4h après un refus », « 45 min pour la file d'attente »…) sont désormais générées par
  // interpolation i18next depuis les valeurs réelles affichées, plutôt qu'écrites en dur —
  // un seuil modifié par l'admin n'entraîne plus une phrase d'exemple mensongère. Les
  // valeurs viennent de `advanced` : la note se met à jour en direct pendant l'édition.
  const n = (v) => { const x = Number(v); return Number.isFinite(x) ? x : 0 }
  const noteVars = useMemo(() => {
    const A = advanced
    return {
      batchSize: n(A.candidate_batch_size),
      confirmMin: n(A.candidate_confirmation_minutes),
      tiebreakMin: n(A.candidate_tiebreak_window_minutes),
      graceQueue: n(A.transfer_grace_minutes_queue),
      graceOther: n(A.transfer_grace_minutes_other),
      editThresholdH: n(A.mission_edit_urgent_threshold_hours),
      editUrgentMin: n(A.mission_edit_approval_minutes_urgent),
      editStdMin: n(A.mission_edit_approval_minutes),
      validationH: n(A.client_validation_hours),
      validationReminderH: n(A.client_validation_reminder_hours),
      validationExampleEnd: 9 + n(A.client_validation_hours),
      conflictH: n(A.schedule_conflict_window_hours),
      conflictBefore: 14 - n(A.schedule_conflict_window_hours),
      conflictAfter: 14 + n(A.schedule_conflict_window_hours),
      cdRefusH: n(A.transfer_cooldown_hours),
      cdAbandonH: n(A.abandon_during_mission_cooldown_hours),
      cdBeforeH: n(A.transfer_cooldown_before_hours),
      cdBeforeAfterH: Math.max(0, n(A.transfer_cooldown_before_hours) - 1),
      staleH: n(A.stale_mission_hours),
      staleLeadH: n(A.stale_mission_min_lead_hours),
      urgentBatch: n(A.urgent_mission_whatsapp_batch_size),
      urgentDelayMin: n(A.urgent_mission_whatsapp_batch_delay_minutes),
      lateAlertMin: n(A.late_start_alert_window_minutes),
      lateTransferMin: n(A.late_start_auto_transfer_minutes),
      reminderEarlyMin: n(A.reminder_before_mission_minutes_early),
      reminderLateMin: n(A.reminder_before_mission_minutes_late),
      refundThresholdH: n(A.refund_partial_threshold_hours),
      refundRatePct: n(A.refund_partial_rate),
      refundExampleBack: Math.round(300 * n(A.refund_partial_rate) / 100),
      lateCancelTier2H: n(A.late_cancel_penalty_tier2_threshold_hours),
      lateCancelTier3Pts: n(A.late_cancel_penalty_tier3_points),
      responseMaxH: Math.round(n(A.response_time_max_valid_minutes) / 60),
      responseMinTurns: n(A.response_time_min_turns),
    }
  }, [advanced])

  const groupNote = (g) =>
    g.basic ? '' : t(`adminAdvancedSettings.groups.${g.key}.note`, { defaultValue: '', ...noteVars })

  // ── Recherche globale : index nom + description + note de groupe, toutes catégories ──
  const searchIndex = useMemo(() => {
    const rows = []
    for (const cat of CATEGORIES) {
      for (const g of groupsByCategory(cat.key)) {
        const gt = groupTitle(g)
        const gn = groupNote(g)
        for (const key of g.fields) {
          const label = fieldLabel(key)
          rows.push({
            key, category: cat.key,
            haystack: fold([label, fieldExplanation(key), gt, gn, key].join(' ␟ ')),
          })
        }
      }
    }
    return rows
  }, [i18n.language, noteVars]) // eslint-disable-line react-hooks/exhaustive-deps

  const results = useMemo(() => {
    const q = fold(query.trim())
    if (!q) return []
    return searchIndex.filter((r) => r.haystack.includes(q))
  }, [query, searchIndex])

  const goToField = (key, category) => {
    setActiveCat(category)
    setQuery('')
    requestAnimationFrame(() => {
      const el = fieldRefs.current[key]
      if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' })
      setHighlightKey(key)
      clearTimeout(highlightTimer.current)
      highlightTimer.current = setTimeout(() => setHighlightKey(null), 1800)
    })
  }

  const onSearchKeyDown = (e) => {
    if (e.key === 'Escape') { setQuery(''); e.currentTarget.blur() }
    if (e.key === 'Enter' && results.length) { e.preventDefault(); goToField(results[0].key, results[0].category) }
  }

  // ── Édition + réinitialisation par champ (défaut local, aucun appel API) ──
  const setField = (key, value) => setAdvanced((a) => ({ ...a, [key]: value }))
  const resetField = (key) => setField(key, toDisplay(key, ADVANCED_DEFAULTS[key]))
  const isDirty = (key) => {
    const cur = advanced[key]
    const dflt = toDisplay(key, ADVANCED_DEFAULTS[key])
    if (BOOLEAN_FIELDS.includes(key)) return cur !== dflt
    return Number(cur) !== Number(dflt)
  }
  const fmtDefault = (key) => {
    const d = toDisplay(key, ADVANCED_DEFAULTS[key])
    if (BOOLEAN_FIELDS.includes(key)) return d ? t('adminAdvancedSettings.enabled') : t('adminAdvancedSettings.disabled')
    const u = unitFor(key)
    return u ? `${d} ${u}` : `${d}`
  }

  // ── Sauvegarde PAR CATÉGORIE : n'envoie que les clés de la catégorie affichée.
  // PUT /admin/settings n'écrit que les clés présentes et non-undefined dans le corps
  // (users.js) — l'envoi partiel est le contrat existant, aucun changement backend. ──
  const saveCategory = async (catKey) => {
    setSavingCat(catKey)
    try {
      // C3 (audit valeurs-temps, 2026-09-03) — garde de cohérence côté écran (le backend
      // PUT /admin/settings re-vérifie et refuse un 400 identique) : dans la catégorie
      // « Validation », client_validation_reminder_hours doit rester STRICTEMENT inférieur à
      // client_validation_hours (les 2 champs du groupe clientValidation), sinon le rappel
      // « à mi-parcours » partirait après l'auto-validation — cf. note du groupe.
      if (catKey === 'validation') {
        const vh = Number(advanced.client_validation_hours)
        const rh = Number(advanced.client_validation_reminder_hours)
        if (Number.isFinite(vh) && Number.isFinite(rh) && rh >= vh) {
          toast(t('adminAdvancedSettings.clientValidationReminderTooLate'), 'error')
          return
        }
      }
      const keys = groupsByCategory(catKey).flatMap((g) => g.fields)
      const payload = {}
      for (const key of keys) {
        const disp = advanced[key]
        if (!BOOLEAN_FIELDS.includes(key) && (disp === '' || disp === null || Number.isNaN(disp))) continue
        payload[key] = toStorage(key, disp)
      }
      await adminAPI.saveSettings(payload)
      toast(t('adminAdvancedSettings.savedToast'), 'success')
    } catch {
      toast(t('adminAdvancedSettings.saveError'), 'error')
    } finally {
      setSavingCat(null)
    }
  }

  // ── Aperçu de réinitialisation globale (inchangé : vérité DB + défauts backend) ──
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

  // ── Historique des modifications — chargement paginé, uniquement pendant que le modal est
  // ouvert (pas de fetch au montage de l'écran). Mêmes conventions que WalletReconciliation.jsx :
  // garde d'annulation (cancelled) contre une réponse périmée, page remise à 1 sur changement de
  // filtre. ──
  useEffect(() => {
    if (!historyOpen) return
    let cancelled = false
    setHistoryLoading(true)
    adminAPI.settingsHistory({ page: historyPage, limit: 20, ...(historyKey ? { setting_key: historyKey } : {}) })
      .then(({ data }) => {
        if (cancelled) return
        setHistoryRows(data.history || [])
        setHistoryPages(data.pages || 1)
      })
      .catch(() => { if (!cancelled) toast(t('adminSettingsHistory.loadError'), 'error') })
      .finally(() => { if (!cancelled) setHistoryLoading(false) })
    return () => { cancelled = true }
  }, [historyOpen, historyPage, historyKey, t])

  useEffect(() => { setHistoryPage(1) }, [historyKey])

  const openHistory = () => { setHistoryKey(''); setHistoryPage(1); setHistoryOpen(true) }

  const displayValue = (key, raw) => {
    if (raw === undefined || raw === null) return '—'
    if (BOOLEAN_FIELDS.includes(key)) return raw === 'true' ? t('adminAdvancedSettings.enabled') : t('adminAdvancedSettings.disabled')
    if (PERCENT_FIELDS.includes(key)) {
      const n = parseFloat(raw)
      return Number.isFinite(n) ? `${n * 100}%` : raw
    }
    return raw
  }

  if (loading) return <AppLayout><Topbar title={t('adminAdvancedSettings.screenTitle')} /><div className="flex justify-center py-20"><Spinner size="lg" /></div></AppLayout>

  const activeCatMeta = CATEGORIES.find((c) => c.key === activeCat) || CATEGORIES[0]

  return (
    <AppLayout>
      <Topbar
        title={t('adminAdvancedSettings.screenTitle')}
        actions={
          <div className="flex gap-2">
            <button onClick={openHistory} className="btn btn-ghost btn-sm">
              {t('adminSettingsHistory.button')}
            </button>
            <button onClick={openResetPreview} disabled={resetLoading} className="btn btn-ghost btn-sm disabled:opacity-60">
              {resetLoading ? t('adminSettingsReset.loading') : t('adminSettingsReset.button')}
            </button>
          </div>
        }
      />

      <div className="p-6">
        <p className="text-[11px] text-[#777] mb-4 max-w-2xl">{t('adminAdvancedSettings.sectionIntro')}</p>

        {/* ── Recherche globale ─────────────────────────────────────────── */}
        <div className="relative mb-5 max-w-xl">
          <input
            type="search"
            className="input pe-8"
            placeholder={t('adminAdvancedSettings.searchPlaceholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onSearchKeyDown}
            aria-label={t('adminAdvancedSettings.searchPlaceholder')}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label={t('adminAdvancedSettings.searchClear')}
              className="absolute end-2 top-1/2 -translate-y-1/2 text-[#777] hover:text-white text-sm"
            >✕</button>
          )}

          {query.trim() && (
            <div className="absolute z-30 mt-1 w-full bg-[#1c1c1c] border border-white/20 rounded-xl shadow-[0_16px_40px_rgba(0,0,0,0.5)] overflow-hidden">
              <div className="px-3 py-2 text-[10px] uppercase tracking-widest text-[#777] border-b border-white/10">
                {results.length
                  ? t('adminAdvancedSettings.searchResultsCount', { count: results.length })
                  : t('adminAdvancedSettings.searchNoResults', { query: query.trim() })}
              </div>
              <ul className="max-h-72 overflow-y-auto py-1">
                {results.slice(0, 40).map((r) => (
                  <li key={r.key}>
                    <button
                      type="button"
                      onClick={() => goToField(r.key, r.category)}
                      className="w-full text-start px-3 py-2 hover:bg-[#FF4D00]/10 flex flex-col gap-0.5"
                    >
                      <span className="text-[12px] text-white">{stripTrailingUnit(fieldLabel(r.key))}</span>
                      <span className="text-[10px] text-[#888] flex items-center gap-1">
                        <span>{CATEGORIES.find((c) => c.key === r.category)?.icon}</span>
                        {t(`adminAdvancedSettings.categories.${r.category}`)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* ── Sélecteur de catégorie mobile (le menu latéral devient déroulant) ── */}
        <select
          className="input md:hidden mb-4"
          value={activeCat}
          onChange={(e) => setActiveCat(e.target.value)}
          aria-label={t('adminAdvancedSettings.categoryNavLabel')}
        >
          {CATEGORIES.map((c) => (
            <option key={c.key} value={c.key}>{c.icon}  {t(`adminAdvancedSettings.categories.${c.key}`)}</option>
          ))}
        </select>

        <div className="md:flex md:gap-6 md:items-start">
          {/* ── Menu latéral (desktop) ─────────────────────────────────── */}
          <nav
            className="hidden md:block md:w-56 md:flex-shrink-0 md:sticky md:top-4"
            aria-label={t('adminAdvancedSettings.categoryNavLabel')}
          >
            <ul className="space-y-1">
              {CATEGORIES.map((c) => {
                const isActive = c.key === activeCat
                return (
                  <li key={c.key}>
                    <button
                      type="button"
                      onClick={() => setActiveCat(c.key)}
                      aria-current={isActive ? 'page' : undefined}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-start transition-colors border-s-2 ${
                        isActive
                          ? 'bg-[#FF4D00]/10 border-[#FF4D00] text-white font-semibold'
                          : 'border-transparent text-[#AAA] hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <span className="text-base leading-none">{c.icon}</span>
                      <span className="flex-1">{t(`adminAdvancedSettings.categories.${c.key}`)}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* ── Panneau de la catégorie active ─────────────────────────── */}
          <div className="flex-1 min-w-0">
            <div className="card">
              <h2 className="font-semibold text-base mb-1 flex items-center gap-2">
                <span>{activeCatMeta.icon}</span>
                {t(`adminAdvancedSettings.categories.${activeCat}`)}
              </h2>

              {/* "Villes couvertes" — maquette héritée, sans backend derrière (aucun état,
                  aucun appel API : les boutons ne font qu'un toast). Laissée intacte et
                  signalée dans le rapport de chantier ; sa suppression est une décision
                  produit distincte, pas un sous-effet de cette refonte de mise en page. */}
              {activeCat === 'tarification' && (
                <div className="mb-6 pb-6 border-b border-white/10">
                  <h3 className="text-[13px] font-semibold mb-1">Villes couvertes</h3>
                  <p className="text-[10px] text-[#777] mb-2">Maquette — non persistée (aucun backend).</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {['Rabat', 'Salé', 'Témara', 'Casablanca'].map((v) => (
                      <span key={v} className="badge badge-blue cursor-pointer" onClick={() => toast(`${v} retiré`, 'info')}>{v} ✕</span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input className="input flex-1" placeholder="Ajouter une ville..." />
                    <button onClick={() => toast('Ville ajoutée', 'success')} className="btn btn-primary btn-sm">Ajouter</button>
                  </div>
                </div>
              )}

              {groupsByCategory(activeCat).map((group) => {
                const note = groupNote(group)
                return (
                  <section key={group.key} className="mb-6 pb-6 border-b border-white/10 last:border-b-0 last:mb-0 last:pb-0">
                    <h3 className="text-[13px] font-semibold mb-1">{groupTitle(group)}</h3>
                    {note && <p className="text-[10px] text-[#FF4D00] mb-3 whitespace-pre-line">{note}</p>}

                    <div className="grid gap-4 sm:grid-cols-2">
                      {group.fields.map((key) => {
                        const isBool = BOOLEAN_FIELDS.includes(key)
                        const unit = unitFor(key)
                        const val = advanced[key]
                        const explanation = fieldExplanation(key)
                        return (
                          <div
                            key={key}
                            ref={(el) => { fieldRefs.current[key] = el }}
                            className={`rounded-lg transition-shadow ${highlightKey === key ? 'ring-2 ring-[#FF4D00] ring-offset-2 ring-offset-[#181818]' : ''}`}
                          >
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <label htmlFor={`set-${key}`} className="label mb-0">{stripTrailingUnit(fieldLabel(key))}</label>
                              <button
                                type="button"
                                onClick={() => resetField(key)}
                                title={t('adminAdvancedSettings.resetFieldTitle', { value: fmtDefault(key) })}
                                aria-label={t('adminAdvancedSettings.resetFieldTitle', { value: fmtDefault(key) })}
                                className={`shrink-0 text-[11px] leading-none ${isDirty(key) ? 'text-[#FF4D00] hover:opacity-80' : 'text-[#555] hover:text-[#AAA]'}`}
                              >↺</button>
                            </div>

                            {isBool ? (
                              <label className="flex items-center gap-2 cursor-pointer py-1.5">
                                <input
                                  id={`set-${key}`}
                                  type="checkbox"
                                  checked={!!val}
                                  onChange={(e) => setField(key, e.target.checked)}
                                />
                                <span className="text-sm">{val ? t('adminAdvancedSettings.enabled') : t('adminAdvancedSettings.disabled')}</span>
                              </label>
                            ) : (
                              <div className="flex items-center gap-2">
                                <input
                                  id={`set-${key}`}
                                  type="number"
                                  step="any"
                                  className="input"
                                  value={val ?? ''}
                                  onChange={(e) => setField(key, e.target.value === '' ? '' : parseFloat(e.target.value))}
                                />
                                {unit && <span className="text-[11px] text-[#777] shrink-0 w-9">{unit}</span>}
                              </div>
                            )}

                            {explanation && <p className="text-[10px] text-[#FF4D00] mt-1">{explanation}</p>}
                          </div>
                        )
                      })}
                    </div>
                  </section>
                )
              })}

              <button
                onClick={() => saveCategory(activeCat)}
                disabled={savingCat === activeCat}
                className="btn btn-primary mt-2 disabled:opacity-60"
              >
                {savingCat === activeCat ? t('adminAdvancedSettings.saving') : t('adminAdvancedSettings.save')}
              </button>
            </div>
          </div>
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

      {historyOpen && (
        <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#181818] border border-white/10 rounded-2xl p-6 w-full max-w-2xl shadow-xl max-h-[85vh] overflow-y-auto">
            <h2 className="font-bold text-base mb-1">{t('adminSettingsHistory.modalTitle')}</h2>
            <p className="text-[11px] text-[#777] mb-4">{t('adminSettingsHistory.trackedSinceNotice')}</p>

            <select
              className="input mb-4"
              value={historyKey}
              onChange={(e) => setHistoryKey(e.target.value)}
              aria-label={t('adminSettingsHistory.filterLabel')}
            >
              <option value="">{t('adminSettingsHistory.filterAll')}</option>
              {CATEGORIES.map((cat) => (
                <optgroup key={cat.key} label={`${cat.icon} ${t(`adminAdvancedSettings.categories.${cat.key}`)}`}>
                  {groupsByCategory(cat.key).flatMap((g) => g.fields).map((key) => (
                    <option key={key} value={key}>{stripTrailingUnit(fieldLabel(key))}</option>
                  ))}
                </optgroup>
              ))}
            </select>

            {historyLoading ? (
              <div className="flex justify-center py-10"><Spinner size="md" /></div>
            ) : historyRows.length === 0 ? (
              <p className="text-sm text-[#AAA] my-6 text-center">{t('adminSettingsHistory.empty')}</p>
            ) : (
              <>
                <div className="space-y-3">
                  {historyRows.map((entry) => (
                    <div key={entry.id} className="bg-[#141414] border border-white/5 rounded-xl p-3">
                      <div className="flex items-center justify-between text-[11px] text-[#AAA] mb-1.5">
                        <span className="font-medium text-white/80">{entry.admin_name || t('adminSettingsHistory.unknownAdmin')}</span>
                        <span>
                          {new Date(entry.changed_at).toLocaleDateString('fr-FR', { timeZone: CASABLANCA_TZ, day: 'numeric', month: 'short', year: 'numeric' })}
                          {' · '}
                          {new Date(entry.changed_at).toLocaleTimeString('fr-FR', { timeZone: CASABLANCA_TZ, hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="text-xs">
                        <span className="text-[#AAA]">{stripTrailingUnit(fieldLabel(entry.setting_key))}: </span>
                        <span className="text-white/50 line-through">{displayValue(entry.setting_key, entry.old_value)}</span>
                        <span className="text-[#AAA] mx-1">→</span>
                        <span className="text-[#FF4D00] font-medium">{displayValue(entry.setting_key, entry.new_value)}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <Pagination page={historyPage} pages={historyPages} onPageChange={setHistoryPage} />
              </>
            )}

            <button onClick={() => setHistoryOpen(false)} className="btn btn-ghost w-full justify-center mt-5">
              {t('adminSettingsHistory.close')}
            </button>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
