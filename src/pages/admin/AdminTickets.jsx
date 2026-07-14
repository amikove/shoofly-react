import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useLocation } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import Topbar from '../../components/layout/Topbar'
import { ticketsAPI } from '../../api'
import { Spinner, toast, Pagination } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { TICKET_CATEGORIES } from '../../constants/ticketCategories'

const STATUS_TABS = [
  { id: '',            label: 'Tous',      color: 'text-white'      },
  { id: 'open',        label: 'Ouverts',   color: 'text-orange-400' },
  { id: 'in_progress', label: 'En cours',  color: 'text-amber-400'  },
  { id: 'resolved',    label: 'Résolus',   color: 'text-green-400'  },
  { id: 'dismissed',   label: 'Ignorés',   color: 'text-[#555]'     },
]

const STATUS_VARIANT = {
  open:        'text-orange-400',
  in_progress: 'text-amber-400',
  resolved:    'text-green-400',
  dismissed:   'text-[#555]',
}

export default function AdminTickets() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterUrgent, setFilterUrgent] = useState('')
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [selected, setSelected] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    const params = { page, limit: 20 }
    if (tab) params.status = tab
    if (filterCategory) params.category = filterCategory
    if (filterUrgent) params.is_urgent = filterUrgent
    ticketsAPI.adminAll(params)
      .then(({ data }) => { setTickets(data.tickets || []); setPages(data.pages || 1) })
      .catch(() => toast('Erreur chargement', 'error'))
      .finally(() => setLoading(false))
  }, [page, tab, filterCategory, filterUrgent])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [tab, filterCategory, filterUrgent])

  const openTicket = (id) => {
    ticketsAPI.get(id)
      .then(({ data }) => setSelected(data))
      .catch(() => toast('Erreur chargement du ticket', 'error'))
  }

  // Ouverture directe depuis une notification (ticket urgent, nouveau message) — voir Topbar.jsx
  useEffect(() => {
    const openId = location.state?.openTicketId
    if (openId) openTicket(openId)
  }, [location.state])

  return (
    <AppLayout>
      <Topbar title="🎫 Tickets de support" />
      <div className="p-6 space-y-5">
        <div className="flex gap-1 bg-[#222] rounded-xl p-1 w-fit">
          {STATUS_TABS.map((s) => (
            <button key={s.id} onClick={() => setTab(s.id)}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${tab === s.id ? 'bg-[#2A2A2A] text-white' : 'text-[#AAA] hover:text-white'}`}>
              {s.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <select className="input max-w-[220px]" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="">Toutes les catégories</option>
            {TICKET_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{t(`ticketCategories.categories.${c.labelKey}`)}</option>
            ))}
          </select>
          <select className="input max-w-[160px]" value={filterUrgent} onChange={(e) => setFilterUrgent(e.target.value)}>
            <option value="">Urgents et non-urgents</option>
            <option value="true">Urgents uniquement</option>
            <option value="false">Non-urgents uniquement</option>
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : tickets.length === 0 ? (
          <div className="card text-center py-12 text-[#AAA]">✅ Aucun ticket</div>
        ) : (
          <>
            <div className="card p-0">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Réf</th>
                      <th>Catégorie</th>
                      <th>Par</th>
                      <th>Utilisateur</th>
                      <th>Statut</th>
                      <th>Créé le</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map((tk) => (
                      <tr
                        key={tk.id}
                        className={`cursor-pointer ${tk.is_urgent ? 'bg-[#E11D2E]/10' : ''}`}
                        onClick={() => openTicket(tk.id)}
                      >
                        <td className="text-xs">
                          {tk.is_urgent && <span className="text-[#E11D2E] mr-1">🆘</span>}
                          {tk.reference}
                        </td>
                        <td className="font-medium">
                          {t(`ticketCategories.categories.${tk.category}`)}
                          {tk.subcategory && <span className="text-[#AAA]"> · {t(`ticketCategories.subcategories.${tk.subcategory}`, tk.subcategory)}</span>}
                        </td>
                        <td>
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#333] text-[#AAA] text-[10px] font-semibold">
                            {tk.user_role === 'client' ? 'C' : 'O'}
                          </span>
                        </td>
                        <td>{tk.first_name} {tk.last_name}</td>
                        <td className={`text-xs font-semibold ${STATUS_VARIANT[tk.status]}`}>{t(`mesTickets.status.${tk.status}`)}</td>
                        <td className="text-xs text-[#555]">{new Date(tk.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                        <td className="text-[#FF4D00] text-xs">Voir →</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <Pagination page={page} pages={pages} onPageChange={setPage} />
          </>
        )}
      </div>

      {selected && (
        <AdminTicketDetail
          ticket={selected.ticket}
          messages={selected.messages}
          currentUserId={user?.id}
          onClose={() => setSelected(null)}
          onChanged={() => { openTicket(selected.ticket.id); load() }}
          navigate={navigate}
        />
      )}
    </AppLayout>
  )
}

function AdminTicketDetail({ ticket, messages, currentUserId, onClose, onChanged, navigate }) {
  const { t } = useTranslation()
  const [msg, setMsg] = useState('')
  const [sending, setSending] = useState(false)
  const [changingStatus, setChangingStatus] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = async () => {
    if (!msg.trim()) return
    const content = msg.trim()
    setMsg('')
    setSending(true)
    try {
      await ticketsAPI.addMessage(ticket.id, content)
      onChanged()
    } catch {
      toast('Erreur lors de l\'envoi', 'error')
      setMsg(content)
    } finally { setSending(false) }
  }

  const setStatus = async (status) => {
    setChangingStatus(true)
    try {
      await ticketsAPI.adminSetStatus(ticket.id, status)
      toast('Statut mis à jour', 'success')
      onChanged()
    } catch (err) {
      toast(err.response?.data?.error || 'Erreur', 'error')
    } finally { setChangingStatus(false) }
  }

  const isMine = (m) => m.sender_id === currentUserId

  return (
    <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`bg-[#181818] border rounded-2xl w-full max-w-lg flex flex-col shadow-xl ${ticket.is_urgent ? 'border-[#E11D2E]/50' : 'border-white/20'}`} style={{ height: 'min(640px, 88vh)' }}>
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-white/10 flex-shrink-0">
          <div>
            <div className="font-semibold text-sm flex items-center gap-2">
              {ticket.is_urgent && <span className="text-[#E11D2E]">🆘 URGENT</span>}
              {ticket.reference}
            </div>
            <p className="text-xs text-[#AAA] mt-1">
              {t(`ticketCategories.categories.${ticket.category}`)}
              {ticket.subcategory && ` · ${t(`ticketCategories.subcategories.${ticket.subcategory}`, ticket.subcategory)}`}
            </p>
            {ticket.mission_id && (
              <button
                className="text-xs text-[#FF4D00] hover:underline mt-1"
                onClick={() => navigate('/admin/missions', { state: { search: ticket.mission_id } })}
              >
                📋 Mission liée
              </button>
            )}
          </div>
          <button onClick={onClose} className="text-[#AAA] hover:text-white text-lg">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
          {messages.map((m) => (
            <div key={m.id} className={`flex flex-col ${m.is_system ? 'items-center' : isMine(m) ? 'items-end' : 'items-start'}`}>
              {m.is_system ? (
                <div className="text-[11px] text-[#555] bg-[#222] px-3 py-1 rounded-full text-center">{m.content}</div>
              ) : (
                <>
                  <div className={`max-w-[75%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                    isMine(m) ? 'bg-[#FF4D00] text-white rounded-br-sm' : 'bg-[#2A2A2A] text-white rounded-bl-sm'
                  }`}>
                    {m.content}
                  </div>
                  <div className="text-[10px] text-[#555] mt-0.5 px-1">
                    {!isMine(m) && `${m.sender_name} · `}
                    {new Date(m.created_at).toLocaleTimeString('fr-MA', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="px-4 py-2 border-t border-white/10 flex items-center gap-2 flex-wrap flex-shrink-0">
          {['open', 'in_progress', 'resolved', 'dismissed'].map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              disabled={changingStatus || ticket.status === s}
              className={`btn btn-ghost btn-sm ${STATUS_VARIANT[s]} disabled:opacity-30`}
            >
              {t(`mesTickets.status.${s}`)}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 p-3 border-t border-white/10 flex-shrink-0">
          <input
            className="flex-1 bg-[#222] border border-white/20 rounded-lg px-3 py-2 text-sm text-white outline-none placeholder:text-white/20 focus:border-[#FF4D00]/50 transition-colors"
            placeholder="Votre réponse..."
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
