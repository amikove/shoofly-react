import { useState, useEffect } from 'react'
import { setToastCallback } from './index'

export default function ToastContainer() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    setToastCallback((msg, type = 'info', options = {}) => {
      const id = Date.now()
      setToasts((t) => [...t, { id, msg, type, onClick: options.onClick || null }])
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000)
    })
  }, [])

  const icons  = { success: '✅', error: '❌', info: '💬' }
  const colors = {
    success: 'border-green-500/30 bg-green-500/10',
    error:   'border-red-500/30 bg-red-500/10',
    info:    'border-[#FF4D00]/30 bg-[#FF4D00]/10',
  }

  const dismiss = (id) => setToasts((t) => t.filter((x) => x.id !== id))

  return (
    <div className="fixed bottom-6 right-6 z-[999] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          onClick={() => { t.onClick?.(); dismiss(t.id) }}
          className={`toast-in flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium min-w-[240px] max-w-[320px] transition-opacity ${colors[t.type]} ${t.onClick ? 'cursor-pointer hover:opacity-80' : ''}`}
        >
          <span className="flex-shrink-0">{icons[t.type]}</span>
          <span className="flex-1">{t.msg}</span>
          <button
            onClick={(e) => { e.stopPropagation(); dismiss(t.id) }}
            className="text-white/40 hover:text-white/80 flex-shrink-0 ml-1"
          >✕</button>
        </div>
      ))}
    </div>
  )
}