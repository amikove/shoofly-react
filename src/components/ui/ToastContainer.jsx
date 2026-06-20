import { useState, useEffect } from 'react'
import { setToastCallback } from './index'

export default function ToastContainer() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    setToastCallback((msg, type = 'info') => {
      const id = Date.now()
      setToasts((t) => [...t, { id, msg, type }])
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500)
    })
  }, [])

  const icons = { success: '✅', error: '❌', info: 'ℹ️' }
  const colors = {
    success: 'border-green-500/30 bg-green-500/10',
    error:   'border-red-500/30 bg-red-500/10',
    info:    'border-[#FF4D00]/30 bg-[#FF4D00]/10',
  }

  return (
    <div className="fixed bottom-6 right-6 z-[999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast-in flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium min-w-[240px] ${colors[t.type]}`}
        >
          <span>{icons[t.type]}</span>
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  )
}
