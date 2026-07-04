// Affiche "valeurComparaison → valeurActuelle (delta%)" si une comparaison est active,
// sinon juste la valeur actuelle. Réutilisé sur tous les onglets du dashboard.
function delta(current, compare) {
  if (compare === undefined || compare === null || isNaN(compare)) return null
  const c = parseFloat(compare)
  const v = parseFloat(current)
  if (c === 0) return v > 0 ? 100 : 0
  return Math.round(((v - c) / c) * 1000) / 10
}

export function DeltaBadge({ value }) {
  if (value === null || value === undefined) return null
  const positive = value >= 0
  return (
    <span className={`text-[11px] font-semibold ml-2 ${positive ? 'text-green-400' : 'text-red-400'}`}>
      {positive ? '▲' : '▼'} {Math.abs(value)}%
    </span>
  )
}

export function ComparisonCell({ current, compare, suffix = '', invert = false, hasComparison = false }) {
  if (!hasComparison || compare === undefined || compare === null) {
    return <span>{current}{suffix}</span>
  }
  const d = delta(current, compare)
  const displayDelta = invert && d !== null ? -d : d
  return (
    <span className="whitespace-nowrap">
      {compare}{suffix} → {current}{suffix}
      <DeltaBadge value={displayDelta} />
    </span>
  )
}

export { delta }