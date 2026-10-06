// Règle administrations (décision BOSS) — même logique que le serveur (backend utils/administrationHours.js).
// Une mission administrative ne peut pas commencer à partir de l'heure limite (réglage serveur,
// défaut 17 h, heure de Casablanca) ni un samedi ou un dimanche. Le serveur est l'autorité : cette
// fonction ne sert qu'à ne pas proposer les créneaux interdits dans le formulaire.
//
// Renvoie 'weekend', 'closed' ou null. date = 'YYYY-MM-DD', time = 'HH:MM' (heure de Casablanca).
export function administrationSlotProblem(date, time, closingHour) {
  if (!date || !time) return null
  const [y, mo, d] = date.split('-').map(Number)
  const weekday = new Date(Date.UTC(y, mo - 1, d)).getUTCDay() // 0 = dimanche, 6 = samedi
  if (weekday === 0 || weekday === 6) return 'weekend'
  if (Number(time.split(':')[0]) >= closingHour) return 'closed'
  return null
}

// Préfixe des sous-catégories « administration » (constants/missionCategories.js côté serveur).
export const ADMIN_SUBCATEGORY_PREFIX = 'Administrations — '
