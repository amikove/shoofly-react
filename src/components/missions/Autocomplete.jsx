import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { translateLocation } from '../../constants/villesTranslations'

// ── Composant Autocomplete générique ──────────────────────
export default function Autocomplete({ label, value, onChange, suggestions, placeholder, disabled = false }) {
  const { i18n } = useTranslation()
  const [open, setOpen]     = useState(false)
  const [query, setQuery]   = useState(value || '')
  const ref                  = useRef(null)

  useEffect(() => { setQuery(value || '') }, [value])

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = query.length >= 1
    ? suggestions.filter((s) => s.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
    : suggestions.slice(0, 8)

  const select = (val) => {
    setQuery(val)
    onChange(val)
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <label className="label">{label}</label>
      <input
        className="input"
        value={query}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => { setQuery(e.target.value); onChange(''); setOpen(true) }}
        onFocus={() => setOpen(true)}
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-[#222] border border-white/20 rounded-xl overflow-hidden shadow-xl max-h-48 overflow-y-auto">
          {filtered.map((s) => (
            <div
              key={s}
              onMouseDown={() => select(s)}
              className="px-4 py-2.5 text-sm cursor-pointer hover:bg-[#FF4D00]/10 hover:text-white text-[#CCC] transition-colors"
            >
              {translateLocation(s, i18n.language)}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
