import { useState } from 'react'
import { casablancaStartOfDay, casablancaEndOfDay, casablancaAddDays, casablancaStartOfWeek, casablancaStartOfMonth } from '../../utils/casablancaTime'

const PRESETS = [
  { key: 'today',     label: "Aujourd'hui" },
  { key: 'yesterday', label: 'Hier' },
  { key: 'week',      label: 'Cette semaine' },
  { key: 'month',     label: 'Ce mois' },
  { key: 'custom',    label: 'Personnalisé' },
]

// Calcule les dates ISO (date_from, date_to) pour un preset donné — bornes calculées à Casablanca
// (voir utils/casablancaTime.js), jamais dans le fuseau de l'appareil de l'admin : un admin connecté
// depuis l'étranger doit voir le même "Aujourd'hui" qu'un admin au Maroc.
export function getPresetRange(preset) {
  const now = new Date()

  switch (preset) {
    case 'today':
      return { from: casablancaStartOfDay(now), to: casablancaEndOfDay(now) }
    case 'yesterday': {
      const y = casablancaAddDays(now, -1)
      return { from: casablancaStartOfDay(y), to: casablancaEndOfDay(y) }
    }
    case 'week':
      return { from: casablancaStartOfWeek(now), to: casablancaEndOfDay(now) }
    case 'month':
      return { from: casablancaStartOfMonth(now), to: casablancaEndOfDay(now) }
    default:
      return { from: casablancaStartOfDay(now), to: casablancaEndOfDay(now) }
  }
}

// Composant réutilisable : période principale + comparaison optionnelle repliée
export default function DateRangeFilter({ range, onChange, compareRange, onCompareChange }) {
  const [showCompare, setShowCompare] = useState(!!compareRange)
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [compareFrom, setCompareFrom] = useState('')
  const [compareTo, setCompareTo] = useState('')

  const selectPreset = (key) => {
    if (key === 'custom') {
      onChange({ preset: 'custom', ...(customFrom && customTo ? { from: casablancaStartOfDay(new Date(customFrom)), to: casablancaEndOfDay(new Date(customTo)) } : {}) })
    } else {
      onChange({ preset: key, ...getPresetRange(key) })
    }
  }

  const applyCustom = () => {
    if (customFrom && customTo) {
      onChange({ preset: 'custom', from: casablancaStartOfDay(new Date(customFrom)), to: casablancaEndOfDay(new Date(customTo)) })
    }
  }

  const applyCompare = () => {
    if (compareFrom && compareTo) {
      onCompareChange({ from: casablancaStartOfDay(new Date(compareFrom)), to: casablancaEndOfDay(new Date(compareTo)) })
    }
  }

  const clearCompare = () => {
    setShowCompare(false)
    onCompareChange(null)
  }

  return (
    <div className="bg-[#181818] border border-white/10 rounded-xl p-3 mb-5">
      <div className="flex flex-wrap items-center gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            onClick={() => selectPreset(p.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              range?.preset === p.key ? 'bg-[#FF4D00] text-white' : 'text-[#AAA] hover:text-white hover:bg-[#2A2A2A]'
            }`}
          >
            {p.label}
          </button>
        ))}

        {range?.preset === 'custom' && (
          <div className="flex items-center gap-2 ms-1">
            <input type="date" className="input py-1.5 text-xs max-w-[140px]" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
            <span className="text-xs text-[#555]">→</span>
            <input type="date" className="input py-1.5 text-xs max-w-[140px]" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
            <button onClick={applyCustom} className="btn btn-primary btn-sm">Appliquer</button>
          </div>
        )}

        <div className="ml-auto">
          {!showCompare ? (
            <button onClick={() => setShowCompare(true)} className="text-xs text-[#FF4D00] hover:underline">
              + Comparer à une autre période
            </button>
          ) : (
            <button onClick={clearCompare} className="text-xs text-[#555] hover:text-white">
              ✕ Retirer la comparaison
            </button>
          )}
        </div>
      </div>

      {showCompare && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/10">
          <span className="text-xs text-[#AAA]">Comparer à :</span>
          <input type="date" className="input py-1.5 text-xs max-w-[140px]" value={compareFrom} onChange={(e) => setCompareFrom(e.target.value)} />
          <span className="text-xs text-[#555]">→</span>
          <input type="date" className="input py-1.5 text-xs max-w-[140px]" value={compareTo} onChange={(e) => setCompareTo(e.target.value)} />
          <button onClick={applyCompare} className="btn btn-ghost btn-sm">Comparer</button>
        </div>
      )}
    </div>
  )
}