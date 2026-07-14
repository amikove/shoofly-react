// Convertit avg_response_minutes (fourni par le backend, ou null si pas
// assez de données) en une unité lisible — minutes sous l'heure, heures au-delà.
export function getResponseTimeDisplay(avgResponseMinutes) {
  if (avgResponseMinutes === null || avgResponseMinutes === undefined) {
    return { hasData: false }
  }
  if (avgResponseMinutes < 60) {
    return { hasData: true, unit: 'minutes', value: Math.round(avgResponseMinutes) }
  }
  return { hasData: true, unit: 'hours', value: Math.round(avgResponseMinutes / 60) }
}
