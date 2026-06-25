// ── Badge ──────────────────────────────────────────────────
export function Badge({ children, variant = 'gray' }) {
  const variants = {
    green:  'badge-green',
    orange: 'badge-orange',
    blue:   'badge-blue',
    yellow: 'badge-yellow',
    red:    'badge-red',
    gray:   'badge-gray',
  }
  return (
    <span className={`badge ${variants[variant] || 'badge-gray'}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {children}
    </span>
  )
}

// ── Status Badge ───────────────────────────────────────────
export function StatusBadge({ status }) {
  const map = {
    active:    { label: 'Live',        variant: 'green'  },
    assigned:  { label: 'Assigné',     variant: 'blue'   },
    en_route:  { label: 'En route',    variant: 'blue'   },
    pending:   { label: 'En attente',  variant: 'yellow' },
    completed: { label: 'Complétée',   variant: 'gray'   },
    cancelled: { label: 'Annulée',        variant: 'red'    },
    sous_reclamation:  { label: '🚨 Réclamation', variant: 'orange' },
  }
  const { label, variant } = map[status] || { label: status, variant: 'gray' }
  return <Badge variant={variant}>{label}</Badge>
}

// ── Spinner ────────────────────────────────────────────────
export function Spinner({ size = 'md' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }
  return (
    <div className={`${sizes[size]} border-2 border-white/20 border-t-[#FF4D00] rounded-full animate-spin`} />
  )
}

// ── Empty State ────────────────────────────────────────────
export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-4xl opacity-30 mb-3">{icon}</div>
      <h3 className="text-sm font-semibold text-white mb-1">{title}</h3>
      <p className="text-xs text-[#AAA] max-w-[240px] leading-relaxed">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

// ── Modal ──────────────────────────────────────────────────
export function Modal({ open, onClose, title, subtitle, children, size = 'md' }) {
  if (!open) return null
  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }
  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${sizes[size]} w-full`}>
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-base font-bold">{title}</h2>
            {subtitle && <p className="text-xs text-[#AAA] mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="text-[#AAA] hover:text-white text-lg leading-none ml-4">✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ── Stars ──────────────────────────────────────────────────
export function Stars({ value, max = 5 }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={`text-xs ${i < Math.round(value) ? 'text-yellow-400' : 'text-white/20'}`}>★</span>
      ))}
    </div>
  )
}

// ── Avatar ─────────────────────────────────────────────────
export function Avatar({ name = '', size = 28, bgColor = 'bg-[#FF4D00]/10', textColor = 'text-[#FF4D00]' }) {
  const initials = name.split(' ').map((x) => x[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div
      className={`${bgColor} ${textColor} rounded-full flex items-center justify-center font-bold flex-shrink-0`}
      style={{ width: size, height: size, fontSize: size * 0.28 }}
    >
      {initials}
    </div>
  )
}

// ── Progress ───────────────────────────────────────────────
export function Progress({ value, color = 'bg-[#FF4D00]' }) {
  return (
    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${value}%` }} />
    </div>
  )
}

// ── Form Field ─────────────────────────────────────────────
export function Field({ label, error, children }) {
  return (
    <div className="mb-3">
      {label && <label className="label">{label}</label>}
      {children}
      {error && <p className="text-[11px] text-red-400 mt-1">{error}</p>}
    </div>
  )
}

// ── Toast Container ────────────────────────────────────────
let toastCallback = null
export function setToastCallback(fn) { toastCallback = fn }
export function toast(msg, type = 'info', options = {}) { toastCallback?.(msg, type, options) }
