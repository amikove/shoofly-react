import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import Topbar from '../../components/layout/Topbar'
import { missionsAPI, reportsAPI } from '../../api'
import { Spinner, toast } from '../../components/ui'

// ── Composant Note étoiles ─────────────────────────────────
function StarRating({ value, onChange, label }) {
  return (
    <div>
      {label && <label className="label">{label}</label>}
      <div className="flex gap-1 mt-1">
        {[1,2,3,4,5].map((s) => (
          <button key={s} type="button" onClick={() => onChange(s)}
            className={`text-2xl transition-all ${s <= (value||0) ? 'text-yellow-400' : 'text-white/20'}`}>
            ★
          </button>
        ))}
        {value && <span className="text-xs text-[#AAA] ml-2 self-center">{value}/5</span>}
      </div>
    </div>
  )
}

// ── Composant Oui/Non ──────────────────────────────────────
function OuiNon({ value, onChange, label }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5">
      <span className="text-sm text-[#CCC]">{label}</span>
      <div className="flex gap-2">
        {['oui','non'].map((v) => (
          <button key={v} type="button" onClick={() => onChange(v)}
            className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
              value === v
                ? v === 'oui' ? 'bg-green-500/20 border-green-500/40 text-green-400'
                              : 'bg-red-500/20 border-red-500/40 text-red-400'
                : 'border-white/12 text-[#AAA] hover:border-white/22'
            }`}>
            {v === 'oui' ? '✓ Oui' : '✗ Non'}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Composant Section ──────────────────────────────────────
function Section({ number, title, children }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="card mb-4">
      <button type="button" onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#FF4D00] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
            {number}
          </span>
          <span className="font-semibold text-sm">{title}</span>
        </div>
        <span className="text-[#AAA] text-sm">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="space-y-3">{children}</div>}
    </div>
  )
}

// ── Score calculator ───────────────────────────────────────
function calculateScore(data) {
  let score = 0
  // Propreté /20
  if (data.proprete_note) score += (data.proprete_note / 5) * 12
  if (data.sols_propres === 'oui') score += 2
  if (data.sdb_propre === 'oui') score += 2
  if (data.literie_propre === 'oui') score += 2
  if (data.odeurs === 'non') score += 2
  // Conformité /15
  if (data.conformite === 'oui') score += 15
  else if (data.conformite === 'partiellement') score += 8
  else if (data.photos_conformite === 'conformes') score += 5
  // Confort /15
  if (data.confort_lit) score += (data.confort_lit / 5) * 5
  if (data.confort_canape) score += (data.confort_canape / 5) * 5
  if (data.confort_global) score += (data.confort_global / 5) * 5
  // Équipements /15
  const equip = [data.wifi, data.clim, data.eau_chaude, data.tv, data.refrigerateur, data.micro_onde, data.machine_laver]
  const ok = equip.filter(e => e === 'oui' || e === 'fonctionnelle' || e === 'disponible').length
  score += (ok / equip.length) * 15
  // Bruit /10
  if (data.bruit_exterieur) score += (data.bruit_exterieur / 5) * 5
  if (data.isolation_phonique) score += (data.isolation_phonique / 5) * 5
  // Sécurité /10
  if (data.securite_note) score += (data.securite_note / 5) * 4
  if (data.porte_securisee === 'oui') score += 3
  if (data.quartier_rassurant === 'oui') score += 3
  // Environnement /10
  if (data.restaurants) score += (data.restaurants / 5) * 2.5
  if (data.commerces) score += (data.commerces / 5) * 2.5
  if (data.transports) score += (data.transports / 5) * 2.5
  if (data.interet_touristique) score += (data.interet_touristique / 5) * 2.5
  // Luminosité /5
  if (data.luminosite) score += (data.luminosite / 5) * 5
  return Math.min(100, Math.round(score))
}

function scoreLabel(s) {
  if (s >= 90) return { label: 'Excellent', color: 'text-green-400' }
  if (s >= 80) return { label: 'Très bon', color: 'text-green-400' }
  if (s >= 70) return { label: 'Correct', color: 'text-yellow-400' }
  if (s >= 60) return { label: 'Moyen', color: 'text-orange-400' }
  return { label: 'Décevant', color: 'text-red-400' }
}

// ── Page principale ────────────────────────────────────────
export default function AirbnbReport() {
  const { missionId } = useParams()
  const navigate = useNavigate()
  const [mission, setMission] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [data, setData] = useState({})
  const score = calculateScore(data)
  const { label: scoreLbl, color: scoreColor } = scoreLabel(score)

  const set = (key) => (value) => setData(d => ({ ...d, [key]: value }))
  const setCheck = (key) => (e) => setData(d => ({
    ...d, [key]: e.target.checked
      ? [...(d[key] || []), e.target.value]
      : (d[key] || []).filter(v => v !== e.target.value)
  }))

  useEffect(() => {
    Promise.all([
      missionsAPI.get(missionId),
      reportsAPI.get(missionId),
    ]).then(([mRes, rRes]) => {
      setMission(mRes.data.mission || mRes.data)
      if (rRes.data.report) {
        setData(rRes.data.report.data || {})
        setSubmitted(rRes.data.report.submitted || false)
      }
    }).catch(() => toast('Erreur chargement', 'error'))
      .finally(() => setLoading(false))
  }, [missionId])

  // Sauvegarde automatique toutes les 30s
  useEffect(() => {
    if (submitted) return
    const interval = setInterval(() => {
      reportsAPI.save(missionId, data, false).catch(() => {})
    }, 30000)
    return () => clearInterval(interval)
  }, [data, missionId, submitted])

  const save = async () => {
    setSaving(true)
    try {
      await reportsAPI.save(missionId, data, false)
      toast('Sauvegardé ✓', 'success')
    } catch { toast('Erreur sauvegarde', 'error') }
    finally { setSaving(false) }
  }

  const submit = async () => {
    if (!window.confirm('Soumettre le rapport ? Le client sera notifié.')) return
    setSaving(true)
    try {
      await reportsAPI.save(missionId, data, true)
      setSubmitted(true)
      toast('Rapport soumis ! 🎉', 'success')
    } catch { toast('Erreur soumission', 'error') }
    finally { setSaving(false) }
  }

  if (loading) return (
    <AppLayout><Topbar title="Rapport de visite" />
      <div className="flex-1 flex items-center justify-center"><Spinner size="lg" /></div>
    </AppLayout>
  )

  return (
    <AppLayout>
      <Topbar title="Rapport de visite" />
      <div className="p-4 md:p-6 max-w-2xl mx-auto pb-32">

        {/* Mission info */}
        <div className="card mb-4 flex items-center justify-between">
          <div>
            <div className="font-semibold text-sm">{mission?.title}</div>
            <div className="text-xs text-[#AAA]">📍 {mission?.city} · {mission?.subcategory}</div>
          </div>
          {submitted && <span className="badge badge-green">✓ Soumis</span>}
        </div>

        {/* Score en temps réel */}
        <div className="card mb-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-[#AAA] mb-0.5">Score Shoofly</div>
            <div className={`text-3xl font-bold ${scoreColor}`}>{score}<span className="text-sm text-[#AAA]">/100</span></div>
          </div>
          <div className={`text-sm font-semibold ${scoreColor}`}>{scoreLbl}</div>
        </div>

        {submitted && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-4 text-sm text-green-400 text-center">
            ✅ Rapport soumis — le client a été notifié
          </div>
        )}

        {/* Section 1 — Première impression */}
        <Section number="1" title="Première impression">
          <div>
            <label className="label">L'annonce correspond-elle à la réalité ?</label>
            <div className="flex gap-2 mt-1 flex-wrap">
              {['oui','partiellement','non'].map(v => (
                <button key={v} type="button" onClick={() => set('conformite')(v)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    data.conformite === v ? 'border-[#FF4D00] bg-[#FF4D00]/10 text-white' : 'border-white/12 text-[#AAA]'
                  }`}>
                  {v === 'oui' ? '✓ Oui totalement' : v === 'partiellement' ? '~ Partiellement' : '✗ Non'}
                </button>
              ))}
            </div>
          </div>
          <StarRating label="Note générale" value={data.note_generale} onChange={set('note_generale')} />
          <div>
            <label className="label">Commentaire</label>
            <textarea className="input resize-none h-20" value={data.commentaire_impression || ''}
              onChange={e => set('commentaire_impression')(e.target.value)}
              placeholder="Première impression générale..." disabled={submitted} />
          </div>
        </Section>

        {/* Section 2 — Propreté */}
        <Section number="2" title="Propreté">
          <StarRating label="État de propreté général" value={data.proprete_note} onChange={set('proprete_note')} />
          <OuiNon label="Sols propres" value={data.sols_propres} onChange={set('sols_propres')} />
          <OuiNon label="Salle de bain propre" value={data.sdb_propre} onChange={set('sdb_propre')} />
          <OuiNon label="Literie propre" value={data.literie_propre} onChange={set('literie_propre')} />
          <OuiNon label="Odeurs désagréables" value={data.odeurs} onChange={set('odeurs')} />
          <div className="bg-[#FF4D00]/5 border border-[#FF4D00]/20 rounded-lg p-3 text-xs text-[#FF4D00]">
            📸 Photos obligatoires pour cette section
          </div>
        </Section>

        {/* Section 3 — Confort */}
        <Section number="3" title="Confort">
          <StarRating label="Confort du lit" value={data.confort_lit} onChange={set('confort_lit')} />
          <StarRating label="Confort du canapé" value={data.confort_canape} onChange={set('confort_canape')} />
          <StarRating label="Niveau de confort global" value={data.confort_global} onChange={set('confort_global')} />
          <div>
            <label className="label">Commentaire</label>
            <textarea className="input resize-none h-16" value={data.commentaire_confort || ''}
              onChange={e => set('commentaire_confort')(e.target.value)}
              placeholder="Confort général..." disabled={submitted} />
          </div>
        </Section>

        {/* Section 4 — Bruit */}
        <Section number="4" title="Bruit">
          <StarRating label="Bruit extérieur (1=très bruyant, 5=très calme)" value={data.bruit_exterieur} onChange={set('bruit_exterieur')} />
          <StarRating label="Isolation phonique entre appartements" value={data.isolation_phonique} onChange={set('isolation_phonique')} />
          <OuiNon label="Fenêtres bien isolées" value={data.fenetres_isolees} onChange={set('fenetres_isolees')} />
          <div className="bg-[#FF4D00]/5 border border-[#FF4D00]/20 rounded-lg p-3 text-xs text-[#FF4D00]">
            🎥 Vidéo 30 secondes obligatoire (fenêtre ouverte puis fermée)
          </div>
        </Section>

        {/* Section 5 — Équipements */}
        <Section number="5" title="Équipements">
          <div className="grid grid-cols-1 gap-0">
            {[
              { key:'wifi', label:'Wifi', opts:['disponible','non disponible'] },
              { key:'clim', label:'Climatisation', opts:['fonctionnelle','non fonctionnelle'] },
              { key:'eau_chaude', label:'Eau chaude', opts:['fonctionnelle','non fonctionnelle'] },
              { key:'tv', label:'Télévision', opts:['fonctionnelle','non fonctionnelle'] },
              { key:'machine_laver', label:'Machine à laver', opts:['oui','non'] },
              { key:'seche_linge', label:'Sèche-linge', opts:['oui','non'] },
              { key:'fer_repasser', label:'Fer à repasser', opts:['oui','non'] },
              { key:'produits_nettoyage', label:'Produits de nettoyage fournis', opts:['oui','non'] },
            ].map(({ key, label, opts }) => (
              <OuiNon key={key} label={label}
                value={data[key] === opts[0] ? 'oui' : data[key] === opts[1] ? 'non' : data[key]}
                onChange={(v) => set(key)(v === 'oui' ? opts[0] : opts[1])} />
            ))}
          </div>
          {data.wifi === 'disponible' && (
            <StarRating label="Qualité Wifi" value={data.wifi_qualite} onChange={set('wifi_qualite')} />
          )}
          <div>
            <label className="label mt-2">Cuisine — équipements disponibles</label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {['Réfrigérateur','Micro-onde','Four','Cafetière','Bouilloire','Vaisselle suffisante'].map(item => (
                <label key={item} className="flex items-center gap-2 text-sm text-[#CCC] cursor-pointer">
                  <input type="checkbox" value={item}
                    checked={(data.cuisine || []).includes(item)}
                    onChange={setCheck('cuisine')}
                    className="accent-[#FF4D00]" disabled={submitted} />
                  {item}
                </label>
              ))}
            </div>
          </div>
        </Section>

        {/* Section 6 — Luminosité */}
        <Section number="6" title="Luminosité">
          <StarRating label="Luminosité naturelle" value={data.luminosite} onChange={set('luminosite')} />
          <div>
            <label className="label">Exposition</label>
            <div className="flex gap-2 mt-1 flex-wrap">
              {['Nord','Sud','Est','Ouest'].map(v => (
                <button key={v} type="button" onClick={() => set('exposition')(v)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    data.exposition === v ? 'border-[#FF4D00] bg-[#FF4D00]/10 text-white' : 'border-white/12 text-[#AAA]'
                  }`}>{v}</button>
              ))}
            </div>
          </div>
        </Section>

        {/* Section 7 — Sécurité */}
        <Section number="7" title="Sécurité">
          <StarRating label="Sentiment de sécurité" value={data.securite_note} onChange={set('securite_note')} />
          <OuiNon label="Porte sécurisée" value={data.porte_securisee} onChange={set('porte_securisee')} />
          <OuiNon label="Quartier rassurant" value={data.quartier_rassurant} onChange={set('quartier_rassurant')} />
          <OuiNon label="Éclairage extérieur" value={data.eclairage_exterieur} onChange={set('eclairage_exterieur')} />
        </Section>

        {/* Section 8 — Accessibilité */}
        <Section number="8" title="Accessibilité">
          <StarRating label="Facilité d'accès" value={data.acces_facilite} onChange={set('acces_facilite')} />
          <OuiNon label="Ascenseur" value={data.ascenseur} onChange={set('ascenseur')} />
          <OuiNon label="Escaliers difficiles" value={data.escaliers_difficiles} onChange={set('escaliers_difficiles')} />
          <OuiNon label="Parking disponible" value={data.parking} onChange={set('parking')} />
        </Section>

        {/* Section 9 — Environnement */}
        <Section number="9" title="Environnement">
          <StarRating label="Restaurants à proximité" value={data.restaurants} onChange={set('restaurants')} />
          <StarRating label="Commerces à proximité" value={data.commerces} onChange={set('commerces')} />
          <StarRating label="Transports à proximité" value={data.transports} onChange={set('transports')} />
          <StarRating label="Intérêt touristique du quartier" value={data.interet_touristique} onChange={set('interet_touristique')} />
          <div className="bg-[#FF4D00]/5 border border-[#FF4D00]/20 rounded-lg p-3 text-xs text-[#FF4D00]">
            📸 Photos du quartier obligatoires
          </div>
        </Section>

        {/* Section 10 — Vérification photos */}
        <Section number="10" title="Vérification des photos de l'annonce">
          <div className="flex gap-2 flex-wrap">
            {[
              { v:'conformes', label:'✓ Exactement conformes' },
              { v:'legerement', label:'~ Légèrement embellies' },
              { v:'tres', label:'⚠️ Très embellies' },
              { v:'trompeuses', label:'✗ Trompeuses' },
            ].map(({ v, label }) => (
              <button key={v} type="button" onClick={() => set('photos_conformite')(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  data.photos_conformite === v ? 'border-[#FF4D00] bg-[#FF4D00]/10 text-white' : 'border-white/12 text-[#AAA]'
                }`}>{label}</button>
            ))}
          </div>
        </Section>

        {/* Section 11 — Points forts/faibles */}
        <Section number="11" title="Points forts & faibles">
          <div>
            <label className="label">✅ Points forts</label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {['Vue agréable','Très propre','Très calme','Quartier agréable','Bien équipé','Moderne','Spacieux','Bonne connexion internet','Bon rapport qualité/prix'].map(item => (
                <label key={item} className="flex items-center gap-2 text-sm text-[#CCC] cursor-pointer">
                  <input type="checkbox" value={item}
                    checked={(data.points_forts || []).includes(item)}
                    onChange={setCheck('points_forts')}
                    className="accent-green-500" disabled={submitted} />
                  {item}
                </label>
              ))}
            </div>
          </div>
          <div className="mt-3">
            <label className="label">❌ Points faibles</label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {['Bruyant','Mauvaise odeur','Humidité','Équipement vétuste','Mauvaise literie','Photos trompeuses','Quartier peu rassurant','Difficulté de stationnement','Mauvaise connexion internet'].map(item => (
                <label key={item} className="flex items-center gap-2 text-sm text-[#CCC] cursor-pointer">
                  <input type="checkbox" value={item}
                    checked={(data.points_faibles || []).includes(item)}
                    onChange={setCheck('points_faibles')}
                    className="accent-red-500" disabled={submitted} />
                  {item}
                </label>
              ))}
            </div>
          </div>
        </Section>

        {/* Section 12 — Recommandation */}
        <Section number="12" title="Recommandation finale">
          <div className="flex gap-2 flex-wrap">
            {[
              { v:'oui_sans', label:'👍 Oui sans hésitation' },
              { v:'oui_reserves', label:'👌 Oui avec réserves' },
              { v:'moyennement', label:'😐 Moyennement' },
              { v:'non', label:'👎 Non' },
              { v:'eviter', label:'🚫 À éviter' },
            ].map(({ v, label }) => (
              <button key={v} type="button" onClick={() => set('recommandation')(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  data.recommandation === v ? 'border-[#FF4D00] bg-[#FF4D00]/10 text-white' : 'border-white/12 text-[#AAA]'
                }`}>{label}</button>
            ))}
          </div>
        </Section>

      </div>

      {/* Barre d'actions fixe en bas */}
      {!submitted && (
        <div className="fixed bottom-0 left-0 right-0 md:left-[220px] bg-[#181818] border-t border-white/12 p-4 flex gap-3 z-40">
          <button onClick={save} disabled={saving}
            className="btn btn-ghost flex-1 justify-center disabled:opacity-50">
            {saving ? '...' : '💾 Sauvegarder'}
          </button>
          <button onClick={submit} disabled={saving}
            className="btn btn-primary flex-1 justify-center disabled:opacity-50">
            {saving ? '...' : '✅ Soumettre le rapport'}
          </button>
        </div>
      )}
    </AppLayout>
  )
}