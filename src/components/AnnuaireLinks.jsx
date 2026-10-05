import { useTranslation } from 'react-i18next'

// Liste des pages annuaire RÉELLEMENT générées (scripts/directory-ssg/generate.cjs, écrite dans
// directory-data/ au build). Absente en dev sans build : aucun lien n'est alors affiché, donc jamais
// de lien vers une page qui n'existe pas.
const modules = import.meta.glob('../../directory-data/annuaire-liens.json', { eager: true, import: 'default' })
const liens = Object.values(modules)[0] || null

// Les pages annuaire sont statiques et hors de la SPA : lien natif (pas de navigate React).
function annuaireHref(lang) {
  return `${lang === 'ar' ? '/ar' : ''}/etablissements`
}

export function AnnuaireLiensFooter({ className }) {
  const { t, i18n } = useTranslation()
  if (!liens) return null
  return <a href={annuaireHref(i18n.language)} className={className}>{t('annuaire.footerLink')}</a>
}

export function AnnuaireLienEspaceClient({ className }) {
  const { t, i18n } = useTranslation()
  if (!liens) return null
  return <a href={annuaireHref(i18n.language)} className={className}>{t('clientDashboard.findEstablishment')}</a>
}

// Section d'accueil : les villes (hub) et les catégories phares de Rabat.
export function AnnuaireAccueil() {
  const { t, i18n } = useTranslation()
  if (!liens) return null
  const ar = i18n.language?.startsWith('ar')
  const base = ar ? '/ar' : ''
  const rabat = liens.cities.find((c) => c.slug === 'rabat')
  return (
    <section className="px-6 md:px-16 py-12 border-t border-white/10">
      <h2 className="font-display font-bold text-2xl mb-6">{t('annuaire.homeTitle')}</h2>
      <div className="flex flex-wrap gap-3 mb-8">
        {liens.cities.map((c) => (
          <a key={c.slug} href={`${base}/etablissements/${c.slug}`}
            className="px-4 py-2 rounded-full border border-white/15 text-sm hover:border-[#FF4D00] transition-colors">
            {ar ? c.ar : c.fr}
          </a>
        ))}
      </div>
      {rabat && rabat.phares.length > 0 && (
        <>
          <p className="text-sm text-[#AAA] mb-3">
            {t('annuaire.homePhares', { city: ar ? rabat.ar : rabat.fr })}
          </p>
          <div className="flex flex-wrap gap-2">
            {rabat.phares.map((p) => (
              <a key={p.slug} href={`${base}/etablissements/${rabat.slug}/${p.slug}`}
                className="px-3 py-1.5 rounded-lg bg-[#181818] text-sm hover:text-[#FF4D00] transition-colors">
                {ar ? p.ar : p.fr}
              </a>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
