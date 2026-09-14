import { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'

const HOVER_DELAY_MS = 2000
const VIEWPORT_MARGIN = 12
const TOOLTIP_WIDTH = 300
const GAP = 10

// Infobulle d'aide générique, déclenchée par survol prolongé (pas au clic, pas immédiat).
// Rendue dans un portail (document.body) en `position: fixed`, positionnée à partir du
// rectangle réel de l'élément survolé — nécessaire ici car le menu admin scrolle en
// `overflow-y-auto`, qui coupe aussi l'axe horizontal en CSS (un enfant `position: absolute`
// resterait invisible dès qu'il dépasse la largeur de la sidebar). Le placement est purement
// géométrique (calculé depuis getBoundingClientRect), donc valable aussi bien en LTR qu'en
// RTL sans logique spécifique — l'admin peut basculer la langue depuis la sidebar.
export default function HoverTooltip({ content, children, className = '' }) {
  const [visible, setVisible] = useState(false)
  const [anchorRect, setAnchorRect] = useState(null)
  const anchorRef = useRef(null)
  const timerRef = useRef(null)

  const clearTimer = () => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
  }

  const handleEnter = useCallback(() => {
    clearTimer()
    timerRef.current = setTimeout(() => {
      if (anchorRef.current) setAnchorRect(anchorRef.current.getBoundingClientRect())
      setVisible(true)
    }, HOVER_DELAY_MS)
  }, [])

  const handleLeave = useCallback(() => {
    clearTimer()
    setVisible(false)
  }, [])

  // Changement de page pendant le délai (clic rapide) ou démontage → pas de setState fantôme.
  useEffect(() => clearTimer, [])

  return (
    <div ref={anchorRef} className={className} onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      {children}
      {visible && anchorRect && createPortal(
        <TooltipBubble anchorRect={anchorRect}>{content}</TooltipBubble>,
        document.body
      )}
    </div>
  )
}

function TooltipBubble({ anchorRect, children }) {
  const ref = useRef(null)
  // Invisible au premier rendu : la position finale dépend de la hauteur réelle du contenu
  // (variable selon le nombre de lignes), mesurée puis appliquée avant peinture (voir
  // useLayoutEffect ci-dessous) pour éviter un flash à la mauvaise position.
  const [style, setStyle] = useState({ opacity: 0 })

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const vw = window.innerWidth
    const vh = window.innerHeight
    const h = el.offsetHeight

    // Horizontal : à droite de l'item s'il y a la place, sinon à gauche. Fonctionne aussi
    // bien pour une sidebar à gauche (LTR) qu'à droite (RTL) — aucune des deux n'est supposée.
    const placeRight = anchorRect.right + GAP + TOOLTIP_WIDTH <= vw - VIEWPORT_MARGIN
    const left = placeRight
      ? anchorRect.right + GAP
      : Math.max(VIEWPORT_MARGIN, anchorRect.left - GAP - TOOLTIP_WIDTH)

    // Vertical : centré sur l'item, puis pincé dans les bords du viewport pour les items
    // tout en haut / tout en bas du menu (jamais coupé par le bord de l'écran).
    const idealTop = anchorRect.top + anchorRect.height / 2 - h / 2
    const top = Math.min(Math.max(idealTop, VIEWPORT_MARGIN), vh - h - VIEWPORT_MARGIN)

    setStyle({ opacity: 1, left, top })
  }, [anchorRect])

  return (
    <div
      ref={ref}
      role="tooltip"
      className="fixed z-[200] pointer-events-none transition-opacity duration-150"
      style={{ ...style, width: TOOLTIP_WIDTH }}
    >
      <div className="bg-[#181818] border border-[#FF4D00]/30 rounded-xl shadow-[0_16px_40px_rgba(0,0,0,0.5)] p-3.5">
        {children}
      </div>
    </div>
  )
}
