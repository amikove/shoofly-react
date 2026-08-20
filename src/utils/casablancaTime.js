// Fuseau horaire canonique de la plateforme (PROMPT 6, 2026-08-18). Toute heure affichée à un
// utilisateur ou saisie dans un formulaire doit passer par Africa/Casablanca explicitement — ne
// jamais dépendre du fuseau du navigateur/appareil (souvent différent du Maroc en prod : Œils,
// clients ou admins connectés depuis l'étranger). Le Maroc observe UTC+1 en permanence SAUF
// pendant le Ramadan (retour à UTC+0) : un offset fixe serait faux une partie de l'année, d'où
// l'usage systématique d'Intl.DateTimeFormat(timeZone: CASABLANCA_TZ), qui consulte la vraie base
// IANA tzdata (règle Ramadan incluse) plutôt qu'un décalage codé en dur.
export const CASABLANCA_TZ = 'Africa/Casablanca'

// Décalage (en minutes, Casablanca − UTC) au moment `utcGuess`. Ex. +60 en août (UTC+1), 0 pendant
// le Ramadan.
function casablancaOffsetMinutes(utcGuess) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: CASABLANCA_TZ, hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(utcGuess)
  const get = (type) => Number(parts.find((p) => p.type === type)?.value)
  const asUTC = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'))
  return (asUTC - utcGuess.getTime()) / 60000
}

// Convertit une heure murale voulue en Africa/Casablanca (ex. "2026-08-20" + "14:30", saisie dans
// un <input type="date">/<input type="time">) en instant UTC réel — CORRECTEMENT, quel que soit le
// fuseau du navigateur qui exécute ce code. Remplace `new Date(`${date}T${time}`).toISOString()`,
// qui interprète silencieusement la saisie dans le fuseau local du navigateur (bug PROMPT 6 : un
// Œil/client dont l'appareil n'est pas réglé sur le Maroc enregistrait une heure décalée).
export function casablancaWallTimeToISO(dateStr, timeStr) {
  const [year, month, day] = dateStr.split('-').map(Number)
  const [hour, minute] = timeStr.split(':').map(Number)
  const naiveUTC = Date.UTC(year, month - 1, day, hour, minute, 0)
  const offsetMinutes = casablancaOffsetMinutes(new Date(naiveUTC))
  return new Date(naiveUTC - offsetMinutes * 60000).toISOString()
}

// Inverse : depuis un instant ISO (valeur backend), donne les chaînes {date, time} telles que vues
// à Casablanca, prêtes pour préremplir <input type="date">/<input type="time">. Remplace un mélange
// bugué de toISOString() (UTC) et toTimeString() (fuseau navigateur) qui ne s'accordaient déjà pas
// entre eux.
export function casablancaDateTimeInputParts(iso) {
  if (!iso) return { date: '', time: '' }
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: CASABLANCA_TZ, hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  }).formatToParts(new Date(iso))
  const get = (type) => parts.find((p) => p.type === type)?.value
  return { date: `${get('year')}-${get('month')}-${get('day')}`, time: `${get('hour')}:${get('minute')}` }
}

// Date (jour civil) d'un instant telle que vue à Casablanca, format Y-M-D — utilisé pour comparer
// deux instants "même jour ?" sans jamais retomber sur le jour civil du fuseau navigateur.
export function casablancaYMD(date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: CASABLANCA_TZ, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date)
  const get = (type) => parts.find((p) => p.type === type)?.value
  return `${get('year')}-${get('month')}-${get('day')}`
}

// ── Bornes de calendrier (PROMPT B, 2026-08-18) ────────────────────────────────────────────────
// Ajouté pour DateRangeFilter.jsx (préréglages "Aujourd'hui/Hier/Cette semaine/Ce mois" du
// dashboard analytique admin), qui calculait ces bornes avec `Date.getFullYear()/getMonth()/
// getDate()` — donc dans le fuseau de l'appareil de l'admin plutôt qu'à Casablanca (rapport
// PROMPT 6 : "demanderait sa propre conception plutôt qu'un simple ajout de timeZone"). Toute
// nouvelle borne de calendrier (jour/semaine/mois) doit être ajoutée ici, jamais recalculée
// localement dans un composant.

// Année/mois/jour + jour de semaine ISO (1=lundi..7=dimanche) du jour civil à Casablanca contenant
// `when` — ignore totalement le fuseau de l'appareil qui exécute ce code.
function casablancaCalendarParts(when) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: CASABLANCA_TZ, year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short',
  }).formatToParts(when)
  const get = (type) => parts.find((p) => p.type === type)?.value
  const isoWeekday = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 }[get('weekday')]
  return { year: Number(get('year')), month: Number(get('month')), day: Number(get('day')), weekday: isoWeekday }
}

// Instant UTC réel de l'heure murale {year, month (1-indexé), day, hour, minute, second} à
// Casablanca — même principe que casablancaWallTimeToISO ci-dessus, en composantes numériques
// plutôt qu'en chaînes, pour construire les bornes ci-dessous.
function casablancaPartsToUTC(year, month, day, hour, minute, second) {
  const naiveUTC = Date.UTC(year, month - 1, day, hour, minute, second)
  const offsetMinutes = casablancaOffsetMinutes(new Date(naiveUTC))
  return new Date(naiveUTC - offsetMinutes * 60000)
}

// Début du jour civil (00:00:00.000) à Casablanca contenant `when`.
export function casablancaStartOfDay(when = new Date()) {
  const { year, month, day } = casablancaCalendarParts(when)
  return casablancaPartsToUTC(year, month, day, 0, 0, 0)
}

// Fin du jour civil (23:59:59.999) à Casablanca contenant `when` — calculée comme "minuit du jour
// suivant moins 1ms" plutôt que via l'heure 23:59:59 directement, pour rester correcte même les
// jours où Casablanca change d'offset (retour du Ramadan, UTC+1 → UTC+0).
export function casablancaEndOfDay(when = new Date()) {
  return new Date(casablancaStartOfDay(casablancaAddDays(when, 1)).getTime() - 1)
}

// Un instant représentatif (12h, hors de toute ambiguïté d'offset) du jour civil à Casablanca situé
// `days` jours avant/après (peut être négatif) celui de `when`. N'est utile qu'en entrée de
// casablancaStartOfDay/casablancaEndOfDay ci-dessus, qui n'en retiennent que le jour civil —
// n'essaie pas de préserver l'heure murale exacte de `when`.
export function casablancaAddDays(when, days) {
  const { year, month, day } = casablancaCalendarParts(when)
  // Arithmétique calendaire neutre — Date.UTC gère nativement les débordements de mois/année
  // (ex: day=0 recule d'un jour dans le mois précédent). L'instant réel n'est reconstruit qu'à
  // la fin, via casablancaPartsToUTC.
  const shifted = new Date(Date.UTC(year, month - 1, day + days))
  return casablancaPartsToUTC(shifted.getUTCFullYear(), shifted.getUTCMonth() + 1, shifted.getUTCDate(), 12, 0, 0)
}

// Lundi 00:00:00 (début de semaine ISO) à Casablanca de la semaine contenant `when`.
export function casablancaStartOfWeek(when = new Date()) {
  const { weekday } = casablancaCalendarParts(when)
  return casablancaStartOfDay(casablancaAddDays(when, -(weekday - 1)))
}

// 1er du mois, 00:00:00, à Casablanca, du mois contenant `when`.
export function casablancaStartOfMonth(when = new Date()) {
  const { year, month } = casablancaCalendarParts(when)
  return casablancaPartsToUTC(year, month, 1, 0, 0, 0)
}
