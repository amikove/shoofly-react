import { useState, useEffect } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import Topbar from '../../components/layout/Topbar'
import { usersAPI } from '../../api'
import { Spinner, EmptyState, Avatar, Stars, toast } from '../../components/ui'
import NewMissionModal from '../../components/missions/NewMissionModal'
import OeilProfileModal from '../../components/missions/OeilProfileModal'

function AvisPopup({ oeil, onClose }) {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!oeil?.id) return
    usersAPI.oeil(oeil.id)
      .then(({ data }) => setReviews(data.reviews || []))
      .catch(() => setReviews([]))
      .finally(() => setLoading(false))
  }, [oeil?.id])

  return (
    <div className="fixed inset-0 bg-black/75 z-[60] flex items-center justify-center p-4 backdrop-blur-sm"
         onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-[#181818] border border-white/20 rounded-2xl p-5 w-full max-w-sm max-h-[80vh] flex flex-col shadow-[0_24px_60px_rgba(0,0,0,0.6)]">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div>
            <div className="font-semibold text-sm">{oeil.first_name} {oeil.last_name}</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Stars value={oeil.rating_avg || 0} />
              <span className="text-xs text-yellow-400 font-semibold">{oeil.rating_avg || '—'}</span>
              <span className="text-xs text-[#AAA]">({oeil.rating_count || 0} avis)</span>
            </div>
          </div>
          <button onClick={onClose} className="text-[#AAA] hover:text-white text-lg">✕</button>
        </div>

        {/* Liste avis */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {loading ? (
            <div className="flex justify-center py-8"><Spinner size="md" /></div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8 text-[#AAA]">
              <div className="text-3xl mb-2 opacity-30">⭐</div>
              <p className="text-sm">Aucun avis pour le moment</p>
            </div>
          ) : reviews.map((r, i) => (
            <div key={i} className="bg-[#222] rounded-xl p-3">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <Stars value={r.score} />
                  <span className="text-xs font-semibold text-yellow-400">{r.score}/5</span>
                </div>
                <span className="text-[11px] text-[#555]">
                  {new Date(r.created_at).toLocaleDateString('fr-FR', { day:'numeric', month:'short', year:'numeric' })}
                </span>
              </div>
              {r.comment
                ? <p className="text-xs text-white/70 leading-relaxed">"{r.comment}"</p>
                : <p className="text-xs text-[#555] italic">Aucun commentaire</p>
              }
              <p className="text-[11px] text-[#AAA] mt-1.5">— {r.client_name}</p>
            </div>
          ))}
        </div>

        <button onClick={onClose} className="btn btn-ghost btn-sm mt-4 flex-shrink-0 w-full justify-center">
          Fermer
        </button>
      </div>
    </div>
  )
}

export default function ClientOeils() {
  const [oeils, setOeils]               = useState([])
  const [loading, setLoading]           = useState(true)
  const [search, setSearch]             = useState('')
  const [city, setCity]                 = useState('')
  const [showNew, setShowNew]           = useState(false)
  const [selectedOeil, setSelectedOeil] = useState(null)
  const [profileOeil, setProfileOeil]   = useState(null)
  const [avisOeil, setAvisOeil] = useState(null)

  useEffect(() => {
    setLoading(true)
    usersAPI.oeils({ search, city })
      .then(({ data }) => setOeils(data.oeils || []))
      .catch(() => toast('Erreur de chargement', 'error'))
      .finally(() => setLoading(false))
  }, [search, city])

  const handleCommander = (oeil) => {
    setSelectedOeil(oeil)
    setShowNew(true)
  }

  const handleClose = () => {
    setShowNew(false)
    setSelectedOeil(null)
  }

  return (
    <AppLayout>
      <Topbar title="Les Œils" />
      <div className="p-6">

        {/* Filtres */}
        <div className="flex flex-wrap gap-3 mb-5">
          <input
            className="input max-w-[220px]"
            placeholder="🔍 Nom, ville..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="input max-w-[160px]"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          >
            <option value="">Toutes les villes</option>
            {['Rabat','Casablanca','Salé','Témara'].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : oeils.length === 0 ? (
          <EmptyState icon="👁️" title="Aucun Œil trouvé" description="Modifiez vos filtres." />
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(270px,1fr))] gap-4">
            {oeils.map((o) => (
              <div key={o.id} className="card">
                <div className="flex items-center gap-3 mb-4">
                  <Avatar name={`${o.first_name} ${o.last_name}`} size={46} />
                  <div className="flex-1">
                    <div className="font-semibold">{o.first_name} {o.last_name}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Stars value={o.rating_avg || 0} />
                      <span className="text-xs text-[#AAA]">
                        {o.rating_avg || '—'} · {o.total_missions || 0} missions
                      </span>
                    </div>
                    <div className="text-xs text-[#AAA] mt-0.5">📍 {o.city}</div>
                  </div>
                  {o.is_available
                    ? <span className="badge badge-green">Dispo</span>
                    : <span className="badge badge-gray">Occupé</span>
                  }
                </div>

                {/* Bio */}
                {o.bio && (
                  <p className="text-xs text-[#AAA] mb-4 line-clamp-2">{o.bio}</p>
                )}

                {/* Zone de couverture */}
                {o.coverage_zone && (
                  <div className="text-xs text-[#777] mb-4">
                    🗺️ {o.coverage_zone}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    disabled={!o.is_available}
                    onClick={() => handleCommander(o)}
                    className="btn btn-primary btn-sm flex-1 justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                    title={!o.is_available ? 'Cet Œil est actuellement occupé' : ''}
                  >
                    {o.is_available ? 'Commander' : 'Indisponible'}
                  </button>

                  <button
                    onClick={() => setAvisOeil(o)}
                    className="btn btn-ghost btn-sm"
                    title="Voir les avis"
                  >
                    ★ Avis
                  </button>
                  <button
                    onClick={() => toast('Ajouté aux favoris ❤️', 'success')}
                    className="btn btn-ghost btn-sm"
                  >
                    ❤️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal profil Œil + avis */}
      <OeilProfileModal
        oeil={profileOeil}
        onClose={() => setProfileOeil(null)}
        onCommander={handleCommander}
      />

      {/* Modal nouvelle mission */}
      <NewMissionModal
        open={showNew}
        onClose={handleClose}
        preselectedOeil={selectedOeil}
        onCreated={() => {
          handleClose()
          toast(
            selectedOeil
              ? `Mission assignée directement à ${selectedOeil.first_name} 🎉`
              : 'Mission créée ! 🎉',
            'success'
          )
        }}
      />

      {avisOeil && (
  <AvisPopup oeil={avisOeil} onClose={() => setAvisOeil(null)} />
)}


    </AppLayout>
  )
}
