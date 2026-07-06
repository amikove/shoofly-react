import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

// ── Badge ────────────────────────────────────────────
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

export function StatusBadge({ status, validated, role }) {
  const { t } = useTranslation()
  const map = {
    active:           { label: t('statusBadge.active'),           variant: 'green'  },
    assigned:         { label: t('statusBadge.assigned'),         variant: 'blue'   },
    en_route:         { label: t('statusBadge.enRoute'),          variant: 'blue'   },
    pending:          { label: t('statusBadge.pending'),          variant: 'yellow' },
    cancelled:        { label: t('statusBadge.cancelled'),        variant: 'red'    },
    sous_reclamation: { label: t('statusBadge.sousReclamation'),  variant: 'orange' },
    completed:        { label: t('statusBadge.completed'),        variant: 'gray'   },
  }

  if (status === 'completed') {
    if (validated) {
      return <Badge variant="green">{t('statusBadge.missionTerminee')}</Badge>
    }
    if (role === 'oeil') {
      return <Badge variant="yellow">{t('statusBadge.attenteValidation')}</Badge>
    }
    return <Badge variant="yellow">{t('statusBadge.attenteValidation')}</Badge>
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
  return createPortal(
    <div
      className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={`bg-[#181818] border border-white/10 rounded-2xl p-6 shadow-xl ${sizes[size]} w-full max-h-[85vh] overflow-y-auto`}>
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-base font-bold">{title}</h2>
            {subtitle && <p className="text-xs text-[#AAA] mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="text-[#AAA] hover:text-white text-lg leading-none ml-4">✕</button>
        </div>
        {children}
      </div>
    </div>,
    document.body
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
export function Avatar({ name = '', size = 28, bgColor = 'bg-[#FF4D00]/10', textColor = 'text-[#FF4D00]', src = null }) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size }}
      />
    )
  }
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

// ── Toast Container ────────────────────────────────────────────
let toastCallback = null
export function setToastCallback(fn) { toastCallback = fn }
export function toast(msg, type = 'info', options = {}) { toastCallback?.(msg, type, options) }

// ── Pagination ──────────────────────────────────────────────────
// Composant générique réutilisable sur toutes les listes paginées (Admin Missions, Admin Problèmes, Missions Œil...)
// Props : page (page actuelle), pages (nombre total de pages), onPageChange (callback appelé avec le nouveau numéro)
export function Pagination({ page, pages, onPageChange }) {
  if (!pages || pages <= 1) return null // Rien à afficher s'il n'y a qu'une seule page

  const goTo = (p) => {
    if (p < 1 || p > pages || p === page) return
    onPageChange(p)
  }

  // Génère une liste compacte de numéros de page à afficher (avec "..." si besoin)
  const getPageNumbers = () => {
    const delta = 1 // nombre de pages visibles autour de la page actuelle
    const range = []
    for (let i = Math.max(1, page - delta); i <= Math.min(pages, page + delta); i++) range.push(i)
    if (range[0] > 1) range.unshift(range[0] > 2 ? '...' : 1)
    if (range[range.length - 1] < pages) range.push(range[range.length - 1] < pages - 1 ? '...' : pages)
    if (range[0] !== 1) range.unshift(1)
    return [...new Set(range)]
  }

  return (
    <div className="flex flex-col items-center gap-2 mt-5">
      <p className="text-[11px] text-[#666]">Page {page} / {pages}</p>
      <div className="flex items-center justify-center gap-1.5">
      <button
        onClick={() => goTo(page - 1)}
        disabled={page <= 1}
        className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#AAA] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        ← Précédent
      </button>

      {getPageNumbers().map((p, i) =>
        p === '...' ? (
          <span key={`dots-${i}`} className="px-2 text-xs text-[#555]">…</span>
        ) : (
          <button
            key={p}
            onClick={() => goTo(p)}
            className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
              p === page ? 'bg-[#FF4D00] text-white' : 'text-[#AAA] hover:text-white hover:bg-[#2A2A2A]'
            }`}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => goTo(page + 1)}
        disabled={page >= pages}
        className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#AAA] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        Suivant →
      </button>
      </div>
    </div>
  )
}
