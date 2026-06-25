import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import Topbar from '../../components/layout/Topbar'
import { missionsAPI, reportsAPI } from '../../api'
import { Spinner, toast } from '../../components/ui'

// ── Composant Note étoiles ─────────────────────────────────
function StarRating({ value, onChange, label, disabled }) {
  return (
    <div className="py-2 border-b border-white/5 last:border-0">
      <div className="flex items-center justify-between">
        <span className="text-sm text-[#CCC]">{label}</span>
        <div className="flex gap-1">
          {[1,2,3,4,5].map((s) => (
            <button key={s} type="button" onClick={() => !disabled && onChange(s)}
              className={`text-xl transition-all ${s <= (value||0) ? 'text-yellow-400' : 'text-white/20'}`}>
              ★
            </button>
          ))}
          {value && <span className="text-xs text-[#AAA] ml-1 self-center">{value}/5</span>}
        </div>
      </div>
    </div>
  )
}

// ── Composant Note avec remarque ───────────────────────────
function CritereNote({ label, noteKey, remarqueKey, data, set, disabled }) {
  return (
    <div className="py-2 border-b border-white/5 last:border-0">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-[#CCC]">{label}</span>
        <div className="flex gap-1">
          {[1,2,3,4,5].map((s) => (
            <button key={s} type="button" onClick={() => !disabled && set(noteKey)(s)}
              className={`text-xl transition-all ${s <= (data[noteKey]||0) ? 'text-yellow-400' : 'text-white/20'}`}>
              ★
            </button>
          ))}
          {data[noteKey] && <span className="text-xs text-[#AAA] ml-1 self-center">{data[noteKey]}/5</span>}
        </div>
      </div>
      <input
        className="input text-xs py-1.5 mt-1"
        placeholder="Remarque..."
        value={data[remarqueKey] || ''}
        onChange={(e) => set(remarqueKey)(e.target.value)}
        disabled={disabled}
      />
    </div>
  )
}

// ── Composant Checkbox liste ───────────────────────────────
function CheckList({ items, dataKey, data, set, disabled, variant }) {
  const toggle = (item) => {
    const current = data[dataKey] || []
    const next = current.includes(item) ? current.filter(i => i !== item) : [...current, item]
    set(dataKey)(next)
  }
  return (
    <div className="grid grid-cols-1 gap-1.5 mt-2">
      {items.map(item => {
        const checked = (data[dataKey] || []).includes(item)
        const bg = checked
          ? variant === 'green' ? 'bg-green-500/20 border border-green-500/30'
          : variant === 'red'   ? 'bg-red-500/20 border border-red-500/30'
          : 'bg-white/5 border border-white/10'
          : 'border border-white/10'
        return (
          <label key={item} className={`flex items-center gap-2 text-sm cursor-pointer px-3 py-2 rounded-lg transition-all ${bg} ${checked ? variant === 'green' ? 'text-green-300' : variant === 'red' ? 'text-red-300' : 'text-white' : 'text-[#CCC]'}`}>
            <input type="checkbox" checked={checked}
              onChange={() => !disabled && toggle(item)}
              className={`w-4 h-4 ${variant === 'green' ? 'accent-green-500' : variant === 'red' ? 'accent-red-500' : 'accent-[#FF4D00]'}`}
              disabled={disabled} />
            {item}
          </label>
        )
      })}
    </div>
  )
}

// ── Composant Choix unique ─────────────────────────────────
function ChoixUnique({ items, dataKey, data, set, disabled }) {
  return (
    <div className="flex flex-col gap-2 mt-2">
      {items.map(({ v, label }) => (
        <button key={v} type="button"
          onClick={() => !disabled && set(dataKey)(v)}
          className={`px-3 py-2 rounded-lg text-sm text-left border transition-all ${
            data[dataKey] === v
              ? 'border-[#FF4D00] bg-[#FF4D00]/10 text-white'
              : 'border-white/12 text-[#AAA] hover:border-white/22'
          }`}>{label}</button>
      ))}
    </div>
  )
}

// ── Composant Section ──────────────────────────────────────
function Section({ number, title, children, photos }) {
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
      {open && (
        <div className="space-y-1">
          {children}
          {photos && (
            <div className="mt-3 bg-[#FF4D00]/5 border border-[#FF4D00]/20 rounded-lg p-3 text-xs text-[#FF4D00]">
              📸 Photos obligatoires pour cette section
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Score calculator ───────────────────────────────────────
function calculateScore(data) {
  // Première impression /10
  const pi = ['premiere_impression','aspect_exterieur','visibilite_enseigne','attractivite','impression_globale']
  const piAvg = pi.filter(k => data[k]).reduce((a,k) => a + data[k], 0) / (pi.filter(k => data[k]).length || 1)
  const piScore = (piAvg / 5) * 10

  // Accueil /20
  const ac = ['temps_prise_charge','politesse','sourire','disponibilite','professionnalisme_accueil','envie_rester']
  const acAvg = ac.filter(k => data[k]).reduce((a,k) => a + data[k], 0) / (ac.filter(k => data[k]).length || 1)
  const acScore = (acAvg / 5) * 20

  // Propreté /15
  const pr = ['proprete_generale','organisation','etat_mobilier','ambiance','confort']
  const prAvg = pr.filter(k => data[k]).reduce((a,k) => a + data[k], 0) / (pr.filter(k => data[k]).length || 1)
  const prScore = (prAvg / 5) * 15

  // Service /20
  const sv = ['rapidite_service','comprehension_besoin','pertinence_reponses','qualite_conseils','niveau_pro','connaissance_produit']
  const svAvg = sv.filter(k => data[k]).reduce((a,k) => a + data[k], 0) / (sv.filter(k => data[k]).length || 1)
  const svScore = (svAvg / 5) * 20

  // Compétence commerciale /15
  const cc = data.competence_commerciale || []
  const ccNeg = ['N\'a fait aucun effort commercial']
  const ccPos = cc.filter(i => !ccNeg.includes(i)).length
  const ccScore = Math.min(15, ccPos * 2.5)

  // Expérience client /15
  const ex = ['clarte_prix','transparence','simplicite_parcours','confiance_inspiree','satisfaction_generale']
  const exAvg = ex.filter(k => data[k]).reduce((a,k) => a + data[k], 0) / (ex.filter(k => data[k]).length || 1)
  const exScore = (exAvg / 5) * 15

  // Recommandation /5
  const recMap = { 'oui_sans': 5, 'probablement_oui': 4, 'peut_etre': 3, 'probablement_non': 1, 'certainement_non': 0 }
  const recScore = (recMap[data.achat_produit] || 0)

  return Math.min(100, Math.round(piScore + acScore + prScore + svScore + ccScore + exScore + recScore))
}

function scoreLabel(s) {
  if (s >= 90) return { label: '🟢 Excellent',      color: 'text-green-400'  }
  if (s >= 80) return { label: '🟢 Très bon',       color: 'text-green-400'  }
  if (s >= 70) return { label: '🟡 Correct',        color: 'text-yellow-400' }
  if (s >= 60) return { label: '🟠 À améliorer',    color: 'text-orange-400' }
  return              { label: '🔴 Critique',        color: 'text-red-400'    }
}

// ── Page principale ────────────────────────────────────────
export default function AuditReport() {
  const { missionId } = useParams()
  const navigate = useNavigate()
  const [mission, setMission]     = useState(null)
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [data, setData]           = useState({})

  const score = calculateScore(data)
  const { label: scoreLbl, color: scoreColor } = scoreLabel(score)

  const set = (key) => (value) => setData(d => ({ ...d, [key]: value }))

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


  // Cette partie va rendre tous les champs du formulaire obligatoire

  const validateForm = () => {
    const missing = []
    // Infos générales
    if (!data.date_visite)      missing.push('Date de visite')
    if (!data.heure_visite)     missing.push('Heure de visite')
    if (!data.duree_visite)     missing.push('Durée de visite')
    if (!data.clients_presents && data.clients_presents !== 0) missing.push('Nombre de clients présents')
    // Section 1
    if (!data.premiere_impression)  missing.push('S1 — Facilité à trouver')
    if (!data.aspect_exterieur)     missing.push('S1 — Aspect extérieur')
    if (!data.visibilite_enseigne)  missing.push('S1 — Visibilité enseigne')
    if (!data.attractivite)         missing.push('S1 — Attractivité')
    if (!data.impression_globale)   missing.push('S1 — Impression globale')
    // Section 2
    if (!data.temps_prise_charge)          missing.push('S2 — Temps prise en charge')
    if (!data.politesse)                   missing.push('S2 — Politesse')
    if (!data.sourire)                     missing.push('S2 — Sourire')
    if (!data.disponibilite)               missing.push('S2 — Disponibilité')
    if (!data.professionnalisme_accueil)   missing.push('S2 — Professionnalisme')
    if (!data.envie_rester)                missing.push('S2 — Envie de rester')
    // Section 3
    if (!data.proprete_generale)   missing.push('S3 — Propreté générale')
    if (!data.organisation)        missing.push('S3 — Organisation')
    if (!data.etat_mobilier)       missing.push('S3 — État du mobilier')
    if (!data.ambiance)            missing.push('S3 — Ambiance')
    if (!data.confort)             missing.push('S3 — Confort')
    // Section 4
    if (!data.rapidite_service)      missing.push('S4 — Rapidité')
    if (!data.comprehension_besoin)  missing.push('S4 — Compréhension besoin')
    if (!data.pertinence_reponses)   missing.push('S4 — Pertinence réponses')
    if (!data.qualite_conseils)      missing.push('S4 — Qualité conseils')
    if (!data.niveau_pro)            missing.push('S4 — Niveau pro')
    if (!data.connaissance_produit)  missing.push('S4 — Connaissance produit')
    // Section 5
    if (!data.competence_commerciale?.length) missing.push('S5 — Compétence commerciale (au moins 1)')
    // Section 6
    if (!data.clarte_prix)          missing.push('S6 — Clarté des prix')
    if (!data.transparence)         missing.push('S6 — Transparence')
    if (!data.simplicite_parcours)  missing.push('S6 — Simplicité parcours')
    if (!data.confiance_inspiree)   missing.push('S6 — Confiance inspirée')
    if (!data.satisfaction_generale) missing.push('S6 — Satisfaction générale')
    // Section 7
    if (!data.points_positifs?.length) missing.push('S7 — Au moins 1 point positif')
    if (!data.points_negatifs?.length) missing.push('S7 — Au moins 1 point négatif')
    // Section 8
    if (!data.incidents?.length)    missing.push('S8 — Au moins 1 incident (ou "Aucun incident")')
    // Section 9
    if (!data.achat_produit)        missing.push('S9 — Réponse achat produit')
    if (!data.recommandation_note)  missing.push('S9 — Note recommandation')
    return missing
  }

  const submit = async () => {
    const missing = validateForm()
    if (missing.length > 0) {
      toast(`⚠️ Champs manquants (${missing.length}) — faites défiler pour tout compléter`, 'error')
      return
    }
    if (!window.confirm('Soumettre le rapport ? Le client sera notifié.')) return
    
    setSaving(true)
    try {
      await reportsAPI.save(missionId, { ...data, score_final: score }, true)
      setSubmitted(true)
      toast('Rapport soumis ✅', 'success')
      setTimeout(() => navigate(-1), 1500)
    } catch { toast('Erreur soumission', 'error') }
    finally { setSaving(false) }
  }

  if (loading) return (
    <AppLayout><Topbar title="Rapport d'audit" />
      <div className="flex justify-center py-20"><Spinner size="lg" /></div>
    </AppLayout>
  )

  return (
    <AppLayout>
      <Topbar title="Audit Mystère" onBack={() => navigate(-1)} />
      <div className="p-4 md:p-6 pb-28 max-w-2xl mx-auto">

        {/* Score live */}
        <div className="card mb-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-[#AAA]">Score Shoofly</div>
            <div className={`text-3xl font-bold mt-1 ${scoreColor}`}>{score}/100</div>
            <div className={`text-sm font-medium mt-0.5 ${scoreColor}`}>{scoreLbl}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-[#AAA] mb-1">Mission</div>
            <div className="font-semibold text-sm">{mission?.title}</div>
            <div className="text-xs text-[#AAA] mt-0.5">📍 {mission?.city}</div>
          </div>
        </div>

        {submitted && (
          <div className="card mb-4 bg-green-500/10 border border-green-500/20 text-green-400 text-sm text-center py-3">
            ✅ Rapport soumis — lecture seule
          </div>
        )}

        {/* Infos générales (hors section) */}
        <div className="card mb-4">
          <h2 className="font-semibold text-sm mb-3">Informations de visite</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Date de visite</label>
              <input type="date" className="input" value={data.date_visite || ''} disabled={submitted}
                onChange={(e) => set('date_visite')(e.target.value)} />
            </div>
            <div>
              <label className="label">Heure de visite</label>
              <input type="time" className="input" value={data.heure_visite || ''} disabled={submitted}
                onChange={(e) => set('heure_visite')(e.target.value)} />
            </div>
            <div>
              <label className="label">Durée de visite (min)</label>
              <input type="number" className="input" value={data.duree_visite || ''} disabled={submitted}
                onChange={(e) => set('duree_visite')(e.target.value)} placeholder="Ex: 25" min="1" />
            </div>
            <div>
              <label className="label">Clients présents</label>
              <input type="number" className="input" value={data.clients_presents || ''} disabled={submitted}
                onChange={(e) => set('clients_presents')(e.target.value)} placeholder="Environ" min="0" />
            </div>
          </div>
        </div>

        {/* Section 1 — Première impression */}
        <Section number="1" title="Première impression" photos>
          <CritereNote label="Facilité à trouver l'établissement" noteKey="premiere_impression" remarqueKey="premiere_impression_rem" data={data} set={set} disabled={submitted} />
          <CritereNote label="Aspect extérieur" noteKey="aspect_exterieur" remarqueKey="aspect_exterieur_rem" data={data} set={set} disabled={submitted} />
          <CritereNote label="Visibilité de l'enseigne" noteKey="visibilite_enseigne" remarqueKey="visibilite_enseigne_rem" data={data} set={set} disabled={submitted} />
          <CritereNote label="Attractivité générale" noteKey="attractivite" remarqueKey="attractivite_rem" data={data} set={set} disabled={submitted} />
          <CritereNote label="Première impression globale" noteKey="impression_globale" remarqueKey="impression_globale_rem" data={data} set={set} disabled={submitted} />
        </Section>

        {/* Section 2 — Accueil */}
        <Section number="2" title="Accueil">
          <CritereNote label="Temps avant prise en charge" noteKey="temps_prise_charge" remarqueKey="temps_prise_charge_rem" data={data} set={set} disabled={submitted} />
          <CritereNote label="Politesse" noteKey="politesse" remarqueKey="politesse_rem" data={data} set={set} disabled={submitted} />
          <CritereNote label="Sourire" noteKey="sourire" remarqueKey="sourire_rem" data={data} set={set} disabled={submitted} />
          <CritereNote label="Disponibilité" noteKey="disponibilite" remarqueKey="disponibilite_rem" data={data} set={set} disabled={submitted} />
          <CritereNote label="Professionnalisme" noteKey="professionnalisme_accueil" remarqueKey="professionnalisme_accueil_rem" data={data} set={set} disabled={submitted} />
          <CritereNote label="L'accueil vous a-t-il donné envie de rester ?" noteKey="envie_rester" remarqueKey="envie_rester_rem" data={data} set={set} disabled={submitted} />
        </Section>

        {/* Section 3 — Propreté */}
        <Section number="3" title="Propreté et environnement" photos>
          <CritereNote label="Propreté générale" noteKey="proprete_generale" remarqueKey="proprete_generale_rem" data={data} set={set} disabled={submitted} />
          <CritereNote label="Organisation des lieux" noteKey="organisation" remarqueKey="organisation_rem" data={data} set={set} disabled={submitted} />
          <CritereNote label="État du mobilier" noteKey="etat_mobilier" remarqueKey="etat_mobilier_rem" data={data} set={set} disabled={submitted} />
          <CritereNote label="Ambiance générale" noteKey="ambiance" remarqueKey="ambiance_rem" data={data} set={set} disabled={submitted} />
          <CritereNote label="Confort" noteKey="confort" remarqueKey="confort_rem" data={data} set={set} disabled={submitted} />
        </Section>

        {/* Section 4 — Qualité du service */}
        <Section number="4" title="Qualité du service">
          <CritereNote label="Rapidité du service" noteKey="rapidite_service" remarqueKey="rapidite_service_rem" data={data} set={set} disabled={submitted} />
          <CritereNote label="Compréhension de votre besoin" noteKey="comprehension_besoin" remarqueKey="comprehension_besoin_rem" data={data} set={set} disabled={submitted} />
          <CritereNote label="Pertinence des réponses" noteKey="pertinence_reponses" remarqueKey="pertinence_reponses_rem" data={data} set={set} disabled={submitted} />
          <CritereNote label="Qualité des conseils" noteKey="qualite_conseils" remarqueKey="qualite_conseils_rem" data={data} set={set} disabled={submitted} />
          <CritereNote label="Niveau de professionnalisme" noteKey="niveau_pro" remarqueKey="niveau_pro_rem" data={data} set={set} disabled={submitted} />
          <CritereNote label="Connaissance du produit/service" noteKey="connaissance_produit" remarqueKey="connaissance_produit_rem" data={data} set={set} disabled={submitted} />
        </Section>

        {/* Section 5 — Compétence commerciale */}
        <Section number="5" title="Compétence commerciale">
          <div className="text-xs text-[#AAA] mb-2">Le personnel :</div>
          <CheckList
            items={[
              'A posé des questions pour comprendre votre besoin',
              'A présenté plusieurs options',
              'A expliqué les avantages',
              'A répondu clairement aux objections',
              'A proposé un produit/service complémentaire',
              'A tenté une vente additionnelle',
              "N'a fait aucun effort commercial",
            ]}
            dataKey="competence_commerciale" data={data} set={set} disabled={submitted}
          />
        </Section>

        {/* Section 6 — Expérience client */}
        <Section number="6" title="Expérience client">
          <CritereNote label="Clarté des prix" noteKey="clarte_prix" remarqueKey="clarte_prix_rem" data={data} set={set} disabled={submitted} />
          <CritereNote label="Transparence" noteKey="transparence" remarqueKey="transparence_rem" data={data} set={set} disabled={submitted} />
          <CritereNote label="Simplicité du parcours" noteKey="simplicite_parcours" remarqueKey="simplicite_parcours_rem" data={data} set={set} disabled={submitted} />
          <CritereNote label="Confiance inspirée" noteKey="confiance_inspiree" remarqueKey="confiance_inspiree_rem" data={data} set={set} disabled={submitted} />
          <CritereNote label="Satisfaction générale" noteKey="satisfaction_generale" remarqueKey="satisfaction_generale_rem" data={data} set={set} disabled={submitted} />
        </Section>

        {/* Section 7 — Observations */}
        <Section number="7" title="Observations importantes">
          <div className="text-xs text-[#AAA] mb-1">✅ Points positifs observés :</div>
                <CheckList
                items={['Personnel accueillant','Service rapide','Très propre','Bonne ambiance','Produits attractifs','Très professionnel','Bons conseils','Excellent rapport qualité/prix','Très bonne organisation','Forte confiance']}
                dataKey="points_positifs" data={data} set={set} disabled={submitted} variant="green"
                />
                <div className="text-xs text-[#AAA] mt-4 mb-1">❌ Points négatifs observés :</div>
                <CheckList
                items={['Attente excessive','Personnel peu accueillant','Manque de professionnalisme','Mauvaise organisation','Prix peu clairs','Établissement sale','Manque de disponibilité','Produits mal présentés','Mauvais conseils','Faible confiance']}
                dataKey="points_negatifs" data={data} set={set} disabled={submitted} variant="red"
                />
                        
                   
                  </Section>

        {/* Section 8 — Incidents */}
        <Section number="8" title="Incidents majeurs">
          <CheckList
            items={['Aucun incident','Personnel impoli','Conflit avec un client','Refus de service','Publicité trompeuse','Non-respect des prix affichés',"Problème d'hygiène",'Information erronée','Autre']}
            dataKey="incidents" data={data} set={set} disabled={submitted}
          />
          <div className="mt-3">
            <label className="label">Commentaire incidents</label>
            <textarea className="input resize-none h-16" value={data.incidents_commentaire || ''} disabled={submitted}
              onChange={(e) => set('incidents_commentaire')(e.target.value)}
              placeholder="Détaillez si nécessaire..." />
          </div>
        </Section>

        {/* Section 9 — Question clé Shoofly */}
        <Section number="9" title="Question clé Shoofly">
          <div className="mb-3">
            <div className="text-sm text-[#CCC] mb-2">Si vous étiez un vrai client, achèteriez-vous ce produit/service ?</div>
            <ChoixUnique
              items={[
                { v:'oui_sans',         label:'👍 Oui sans hésitation'  },
                { v:'probablement_oui', label:'👌 Probablement oui'     },
                { v:'peut_etre',        label:'😐 Peut-être'            },
                { v:'probablement_non', label:'👎 Probablement non'     },
                { v:'certainement_non', label:'🚫 Certainement non'     },
              ]}
              dataKey="achat_produit" data={data} set={set} disabled={submitted}
            />
          </div>
          <CritereNote label="Recommanderiez-vous cet établissement ?" noteKey="recommandation_note" remarqueKey="recommandation_rem" data={data} set={set} disabled={submitted} />
        </Section>

        {/* Section 10 — Commentaire libre */}
        <Section number="10" title="Commentaire libre">
          <textarea className="input resize-none h-32" value={data.commentaire_libre || ''} disabled={submitted}
            onChange={(e) => set('commentaire_libre')(e.target.value)}
            placeholder="Observations détaillées, contexte, éléments importants non couverts par le formulaire..." />
        </Section>

        {/* Récap score */}
        <div className="card mb-4">
          <h2 className="font-semibold text-sm mb-3">Score Shoofly automatique</h2>
          {[
            { label: 'Première impression', poids: 10  },
            { label: 'Accueil',             poids: 20  },
            { label: 'Propreté',            poids: 15  },
            { label: 'Service',             poids: 20  },
            { label: 'Comp. commerciale',   poids: 15  },
            { label: 'Expérience client',   poids: 15  },
            { label: 'Recommandation',      poids: 5   },
          ].map((r) => (
            <div key={r.label} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
              <span className="text-xs text-[#AAA]">{r.label}</span>
              <span className="text-xs text-white/60">{r.poids} pts</span>
            </div>
          ))}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
            <span className="font-semibold text-sm">Score global</span>
            <span className={`text-2xl font-bold ${scoreColor}`}>{score}/100</span>
          </div>
          <div className={`text-center text-sm font-medium mt-1 ${scoreColor}`}>{scoreLbl}</div>
        </div>

      </div>

      {/* Barre d'actions */}
      {!submitted && (
        <div className="fixed bottom-0 left-0 right-0 md:left-[220px] bg-[#181818] border-t border-white/12 p-4 flex gap-3 z-40">
          <button onClick={save} disabled={saving} className="btn btn-ghost flex-1 justify-center disabled:opacity-50">
            {saving ? '...' : '💾 Sauvegarder'}
          </button>
          <button onClick={submit} disabled={saving} className="btn btn-primary flex-1 justify-center disabled:opacity-50">
            {saving ? '...' : '✅ Soumettre'}
          </button>
        </div>
      )}
    </AppLayout>
  )
}