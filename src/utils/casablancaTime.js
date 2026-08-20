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
