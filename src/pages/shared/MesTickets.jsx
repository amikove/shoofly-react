import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import Topbar from '../../components/layout/Topbar'
import { ticketsAPI } from '../../api'
import { Spinner, EmptyState, toast, Pagination } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import NewTicketModal from '../../components/tickets/NewTicketModal'

const STATUS_VARIANT = {
  open:        'text-orange-400',
  in_progress: 'text-amber-400',
  resolved:    'text-green-400',
  dismissed:   'text-[#555]',
}

export default function MesTickets() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const location = useLocation()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [selected, setSelected] = useState(null)
  const [showNewTicket, setShowNewTicket] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    ticketsAPI.mine(page)
      .then(({ data }) => { setTickets(data.tickets || []); setPages(data.pages || 1) })
      .catch(() => toast(t('mesTickets.loadError'), 'error'))
      .finally(() => setLoading(false))
  }, [page, t])

  useEffect(() => { load() }, [load])

  // Ouverture directe depuis une notification (voir Topbar.jsx handleClick)
  useEffect(() => {
    const openId = location.state?.openTicketId
    if (openId) openTicket(openId)
  }, [location.state])

  const openTicket = (id) => {
    ticketsAPI.get(id)
      .then(({ data }) => setSelected(data))
      .catch(() => toast(t('mesTickets.loadError'), 'error'))
  }

  return (
    <AppLayout>
      <Topbar
        title={t('mesTickets.title')}
        actions={<button onClick={() => setShowNewTicket(true)} className="btn btn-primary btn-sm">{t('mesTickets.newTicket')}</button>}
      />
      <div className="p-6">
        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : tickets.length === 0 ? (
          <EmptyState icon="🎫" title={t('mesTickets.emptyTitle')} description={t('mesTickets.emptyDesc')} />
        ) : (
          <>
            <div className="space-y-3">
              {tickets.map((tk) => (
                <div key={tk.id} className="card cursor-pointer hover:border-white/20 transition-colors" onClick={() => openTicket(tk.id)}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-sm flex items-center gap-2">
                        {tk.is_urgent && <span className="text-[#E11D2E]">🆘</span>}
                        {tk.reference}
                      </p>
                      <p className="text-xs text-[#AAA] mt-0.5">
                        {t(`ticketCategories.categories.${tk.category}`)}
                        {tk.subcategory && ` · ${t(`ticketCategories.subcategories.${tk.subcategory}`, tk.subcategory)}`}
                      </p>
                    </div>
                    <span className={`text-xs font-semibold ${STATUS_VARIANT[tk.status] || 'text-[#AAA]'}`}>
                      {t(`mesTickets.status.${tk.status}`)}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#555] mt-2">
                    {new Date(tk.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))}
            </div>
            <Pagination page={page} pages={pages} onPageChange={setPage} />
          </>
        )}
      </div>

      {selected && (
        <TicketThread
          ticket={selected.ticket}
          messages={selected.messages}
          currentUserId={user?.id}
          onClose={() => setSelected(null)}
          onSent={() => openTicket(selected.ticket.id)}
        />
      )}

      <NewTicketModal
        open={showNewTicket}
        onClose={() => setShowNewTicket(false)}
        onCreated={load}
      />
    </AppLayout>
  )
}

function TicketThread({ ticket, messages, currentUserId, onClose, onSent }) {
  const { t } = useTranslation()
  const [msg, setMsg] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = async () => {
    if (!msg.trim()) return
    const content = msg.trim()
    setMsg('')
    setSending(true)
    try {
      await ticketsAPI.addMessage(ticket.id, content)
      onSent()
    } catch {
      toast(t('mesTickets.sendError'), 'error')
      setMsg(content)
    } finally { setSending(false) }
  }

  const isMine = (m) => m.sender_id === currentUserId

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-[#181818] border border-white/20 rounded-2xl w-full max-w-md flex flex-col shadow-[0_24px_60px_rgba(0,0,0,0.6)]" style={{ height: 'min(600px, 85vh)' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 flex-shrink-0">
          <div>
            <div className="font-semibold text-sm flex items-center gap-2">
              {ticket.is_urgent && <span className="text-[#E11D2E]">🆘</span>}
              {ticket.reference}
            </div>
            <div className="text-xs text-[#AAA] mt-0.5">
              {t(`ticketCategories.categories.${ticket.category}`)}
              {ticket.subcategory && ` · ${t(`ticketCategories.subcategories.${ticket.subcategory}`, ticket.subcategory)}`}
              {' · '}
              <span className={STATUS_VARIANT[ticket.status]}>{t(`mesTickets.status.${ticket.status}`)}</span>
            </div>
          </div>
          <button onClick={onClose} aria-label={t('common.close')} className="text-[#AAA] hover:text-white text-lg">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
          {messages.map((m) => (
            <div key={m.id} className={`flex flex-col ${m.is_system ? 'items-center' : isMine(m) ? 'items-end' : 'items-start'}`}>
              {m.is_system ? (
                <div className="text-[11px] text-[#555] bg-[#222] px-3 py-1 rounded-full text-center">{m.content}</div>
              ) : (
                <>
                  <div className={`max-w-[75%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                    isMine(m) ? 'bg-[#FF4D00] text-white rounded-ee-sm' : 'bg-[#2A2A2A] text-white rounded-es-sm'
                  }`}>
                    {m.content}
                  </div>
                  <div className="text-[10px] text-[#555] mt-0.5 px-1">
                    {m.sender_role === 'admin' && !isMine(m) ? `${t('mesTickets.adminLabel')} · ` : ''}
                    {new Date(m.created_at).toLocaleTimeString('fr-MA', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="flex items-center gap-2 p-3 border-t border-white/10 flex-shrink-0">
          <input
            className="flex-1 bg-[#222] border border-white/20 rounded-lg px-3 py-2 text-sm text-white outline-none placeholder:text-white/20 focus:border-[#FF4D00]/50 transition-colors"
            placeholder={t('mesTickets.messagePlaceholder')}
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
            disabled={sending}
          />
          <button
            onClick={send}
            disabled={sending || !msg.trim()}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#FF4D00] text-white disabled:opacity-50 hover:opacity-90 transition-all flex-shrink-0"
          >
            {sending ? '⏳' : '→'}
          </button>
        </div>
      </div>
    </div>
  )
}
