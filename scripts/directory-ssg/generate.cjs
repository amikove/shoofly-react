#!/usr/bin/env node
// Chantier SEO annuaire — Phase 3 (2026-09-30). Point d'entrée du générateur SSG — voir lib.js pour
// les briques réutilisables et text-templates.js pour les textes fixes (copiés mot pour mot depuis
// seo-study/MODELES_TEXTES_SEO.md). Lancé par "npm run build" (package.json), AVANT vite build.
const fs = require('fs');
const path = require('path');
const L = require('./lib.cjs');
const T = require('./text-templates.cjs');

const PROPER_NOUN_CATEGORIES = new Set(['cnss', 'barid']); // {categorie} minuscule sauf noms propres
const CITY_AR = { Rabat: 'الرباط', 'Salé': 'سلا', 'Témara': 'تمارة' }; // noms arabes standards, non éditoriaux

function lowerFirst(catId, label) {
  if (PROPER_NOUN_CATEGORIES.has(catId)) return label;
  return label.charAt(0).toLowerCase() + label.slice(1);
}
function article(genre) { return genre === 'f' ? 'une' : 'un'; }
function cityLabel(city, lang) { return lang === 'ar' ? CITY_AR[city] : city; }

async function main() {
  const { categories, establishments, removed } = await L.loadData();
  const publishedCategories = categories; // déjà filtré is_published=true par l'export backend

  // ── Index ──────────────────────────────────────────────────────────────
  const byCity = {};
  const byCityCat = {};
  const byCityCatQuartier = {};
  for (const e of establishments) {
    if (e.category_id === 'urgences') { /* toujours listée mais gabarit spécial, pas de bouton mission */ }
    (byCity[e.city] ||= []).push(e);
    const k1 = `${e.city}|${e.category_id}`;
    (byCityCat[k1] ||= []).push(e);
    if (e.neighborhood_id) {
      const k2 = `${e.city}|${e.category_id}|${e.neighborhood_id}`;
      (byCityCatQuartier[k2] ||= []).push(e);
    }
  }
  const cities = Object.keys(L.CITY_SLUGS);

  const stats = { hub: 0, cat: 0, quartier: 0, fiche: 0 };
  const sitemapUrls = {}; // categoryId -> [{path, lang}]
  function addSitemap(catId, urlPath) { (sitemapUrls[catId] ||= []).push(urlPath); }

  // ── Fiches établissement ──────────────────────────────────────────────
  for (const e of establishments) {
    for (const lang of ['fr', 'ar']) {
      generateFiche(e, lang, byCity);
      stats.fiche++;
    }
    addSitemap(e.category_id, `/etablissements/${L.CITY_SLUGS[e.city]}/${e.slug}`);
  }

  // ── Pages ville × catégorie + quartier × catégorie ─────────────────────
  for (const city of cities) {
    for (const cat of publishedCategories) {
      if (cat.id === 'urgences') continue; // gabarit spécial, généré séparément ci-dessous
      const list = byCityCat[`${city}|${cat.id}`] || [];
      if (list.length < L.MIN_FOR_PAGE) continue;
      for (const lang of ['fr', 'ar']) { generateVilleCategorie(city, cat, list, lang); stats.cat++; }
      addSitemap(cat.id, `/etablissements/${L.CITY_SLUGS[city]}/${L.categorySlug(cat.id)}`);

      // Quartiers qualifiés pour cette ville×catégorie
      const quartierGroups = {};
      for (const e of list) if (e.neighborhood) (quartierGroups[e.neighborhood_id] ||= []).push(e);
      for (const [nbId, qList] of Object.entries(quartierGroups)) {
        if (qList.length < L.MIN_FOR_PAGE) continue;
        const nb = qList[0].neighborhood;
        for (const lang of ['fr', 'ar']) { generateQuartierCategorie(city, cat, nb, qList, list, lang); stats.quartier++; }
        addSitemap(cat.id, `/etablissements/${L.CITY_SLUGS[city]}/${L.categorySlug(cat.id)}/${L.slugify(nb.name_fr)}`);
      }
    }
    // Urgences : pages ville×catégorie SEULEMENT (pas de quartier, gabarit sans bouton mission)
    const urgList = byCityCat[`${city}|urgences`] || [];
    if (urgList.length >= L.MIN_FOR_PAGE) {
      const urgCat = publishedCategories.find((c) => c.id === 'urgences');
      for (const lang of ['fr', 'ar']) { generateVilleCategorieUrgences(city, urgCat, urgList, lang); stats.cat++; }
      addSitemap('urgences', `/etablissements/${L.CITY_SLUGS[city]}/urgences`);
    }
  }

  // ── Hub ville ───────────────────────────────────────────────────────────
  for (const city of cities) {
    for (const lang of ['fr', 'ar']) { generateHub(city, byCity[city] || [], publishedCategories, lang); stats.hub++; }
    addSitemap('_hubs', `/etablissements/${L.CITY_SLUGS[city]}`);
  }

  // ── Page d'entrée + liens vers l'annuaire (accueil, pied de page, espace client) ────────
  // Liste construite à partir des pages RÉELLEMENT générées ci-dessus (même seuil MIN_FOR_PAGE) :
  // aucun lien vers une catégorie qui n'a pas de page.
  const annuaireLinks = buildAnnuaireLinks(cities, byCityCat, publishedCategories);
  for (const lang of ['fr', 'ar']) generateEntree(annuaireLinks, lang);
  addSitemap('_hubs', '/etablissements');
  L.writeDataFile('annuaire-liens.json', JSON.stringify({ ...annuaireLinks, generated_at: new Date().toISOString() }, null, 2));
  L.writeDataFile('annuaire-noscript.html', annuaireNoscriptHtml(annuaireLinks));

  // ── Fiches retirées : pages de redirection (jamais dans les sitemaps) ────────────────
  const liveSlugs = new Set(establishments.map((e) => e.slug));
  const retiredStubs = generateRetiredStubs(removed, byCityCat, liveSlugs);
  L.writeDataFile('retired-stubs.json', JSON.stringify(retiredStubs.map((s) => ({ slug: s.slug, city: s.city, target: s.target }))));
  console.log('Pages de redirection (fiches retirées, FR+AR) :', retiredStubs.length * 2);

  writeRobotsAndSitemaps(publishedCategories, sitemapUrls);
  writeIndexNowKey();

  console.log('Pages générées (FR+AR confondus dans les compteurs ci-dessous, ×2 déjà inclus) :');
  console.log('  Hub ville      :', stats.hub);
  console.log('  Ville×catégorie / Urgences :', stats.cat);
  console.log('  Quartier×catégorie :', stats.quartier);
  console.log('  Fiches         :', stats.fiche);
  console.log('  TOTAL          :', stats.hub + stats.cat + stats.quartier + stats.fiche);

  // ── Vérification anti-régression SPA : aucune page annuaire n'écrase une route app existante ──
  checkNoSpaCollision();

  // ── Résumé machine pour le rapport de tests ─────────────────────────────
  L.writeDataFile('build-stats.json', JSON.stringify({ ...stats, total: stats.hub + stats.cat + stats.quartier + stats.fiche, generated_at: new Date().toISOString() }, null, 2));
}

// ── Générateurs de page ───────────────────────────────────────────────────

function nearest(e, all, n = 5) {
  return all.filter((o) => o.id !== e.id && o.lat && e.lat)
    .map((o) => ({ o, d: L.haversineMeters(e.lat, e.lng, o.lat, o.lng) }))
    .sort((a, b) => (a.o.category_id === e.category_id ? 0 : 1) - (b.o.category_id === e.category_id ? 0 : 1) || a.d - b.d)
    .slice(0, n).map((x) => x.o);
}

function generateFiche(e, lang, byCity) {
  const cat = e.category;
  const content = L.CONTENT[e.category_id];
  const quartierOuVille = e.neighborhood ? (lang === 'ar' ? e.neighborhood.name_ar || e.neighborhood.name_fr : e.neighborhood.name_fr) : cityLabel(e.city, lang);
  const catSingulier = content ? (lang === 'ar' ? content.singulier_ar : content.singulier_fr) : cat.label_fr;
  const catSingulierCap = catSingulier.charAt(0).toUpperCase() + catSingulier.slice(1);

  const title = lang === 'ar' ? `${e.name} — ${quartierOuVille}: العنوان والهاتف | شووفلي` : `${e.name} — ${quartierOuVille} : adresse et téléphone | Shoofly`;
  const meta = lang === 'ar'
    ? `${catSingulierCap} في ${quartierOuVille}. ${e.address ? 'العنوان، ' : ''}${e.phone ? 'الهاتف، ' : ''}وعين شووفلي لتنتظر بدلاً منك.`
    : `${catSingulierCap} à ${quartierOuVille}. ${e.address ? 'Adresse, ' : ''}${e.phone ? 'téléphone, ' : ''}et un Œil Shoofly pour attendre à votre place.`;

  const sousTitre = lang === 'ar' ? `${catSingulierCap} · ${quartierOuVille}` : `${catSingulierCap} · ${e.neighborhood ? e.neighborhood.name_fr + ', ' : ''}${e.city}`;

  // Carte d'infos compacte (refonte 2026-10-05) : une ligne par donnée présente, aucune ligne vide.
  // Coordonnées lues en nombres : elles entrent dans des URL, pas de chaîne brute.
  const lat = Number(e.lat), lng = Number(e.lng);
  const hasGeo = Boolean(e.lat && e.lng) && Number.isFinite(lat) && Number.isFinite(lng);
  const rows = [];
  if (e.address) {
    const itineraire = hasGeo ? ` <a href="https://www.google.com/maps/dir/?api=1&amp;destination=${lat},${lng}" rel="nofollow noopener" target="_blank">${L.esc(T.FICHE[lang].itineraire)}</a>` : '';
    rows.push(L.ficheRow('pin', T.FICHE[lang].adresse, `<span>${L.esc(e.address)}</span>${itineraire}`));
  }
  if (e.phone) rows.push(L.ficheRow('phone', T.FICHE[lang].tel, `<a href="tel:${L.esc(e.phone.replace(/[^+\d]/g, ''))}">${L.esc(e.phone)}</a>`));
  // Site normalisé une fois (protocole ajouté si absent) : même URL dans le lien visible et le JSON-LD.
  const website = L.normalizeWebsite(e.website);
  if (website) rows.push(L.ficheRow('globe', T.FICHE[lang].site, `<a href="${L.esc(website)}" rel="nofollow noopener" target="_blank">${L.esc(website)}</a>`));
  if (hasGeo) rows.push(L.ficheRow('map', null, `<a href="https://www.openstreetmap.org/?mlat=${lat}&amp;mlon=${lng}#map=17/${lat}/${lng}" rel="nofollow noopener" target="_blank">${L.esc(T.FICHE[lang].carte)}</a>`));
  const infoHtml = rows.length ? `<div class="fiche-card">${rows.join('')}</div>` : '';

  const isUrgence = e.category_id === 'urgences';
  const near = nearest(e, byCity[e.city] || []);
  const nearTitle = lang === 'ar' ? 'بالقرب منك' : 'À proximité';
  const nearHtml = near.length ? `<h2>${L.esc(nearTitle)}</h2><ul class="list">${near.map((o) => {
    const oq = o.neighborhood ? (lang === 'ar' ? o.neighborhood.name_ar || o.neighborhood.name_fr : o.neighborhood.name_fr) : cityLabel(o.city, lang);
    const oc = o.category ? (lang === 'ar' ? o.category.label_ar : o.category.label_fr) : '';
    return `<li><a class="card-name" href="${lang === 'ar' ? '/ar' : ''}/etablissements/${L.CITY_SLUGS[o.city]}/${o.slug}">${L.esc(o.name)}</a><div class="card-meta">${L.esc([oc, oq].filter(Boolean).join(' · '))}</div></li>`;
  }).join('')}</ul>` : '';

  const faqItems = [
    { q: lang === 'ar' ? `أين يقع ${e.name}؟` : `Où se trouve ${e.name} ?`,
      // §7.3 Q1 : "[SI adresse]{adresse}, [/SI]{quartier}, {ville}." — {quartier} n'est ajouté que
      // s'il existe VRAIMENT (sinon quartierOuVille == la ville, et l'ajouter en double serait faux,
      // ex. "Rabat, Rabat." — bug trouvé en relisant la 1re page générée, corrigé ici).
      r: lang === 'ar'
        ? `${e.address ? e.address + '، ' : ''}${e.neighborhood ? quartierOuVille + '، ' : ''}${cityLabel(e.city, lang)}.`
        : `${e.address ? e.address + ', ' : ''}${e.neighborhood ? quartierOuVille + ', ' : ''}${e.city}.` },
    { q: lang === 'ar' ? `هل يمكن تجنّب الطابور في ${e.name}؟` : `Peut-on éviter la file à ${e.name} ?`,
      r: lang === 'ar' ? 'نعم: يمكن لعين شووفلي أن تنتظر بدلاً منك وتنبّهك عندما يقترب دورك.' : 'Oui : un Œil Shoofly peut attendre sur place à votre place et vous prévenir quand votre tour approche.' },
  ];
  if (e.phone) faqItems.push({
    q: lang === 'ar' ? `ما هو رقم هاتف ${e.name}؟` : `Quel est le téléphone de ${e.name} ?`,
    r: lang === 'ar' ? `${e.phone}.` : `${e.phone}.`,
  });
  const faqItemsHtml = faqItems.map((it) => ({ q: it.q, r: L.esc(it.r) }));

  // Hiérarchie (refonte 2026-10-05, demande BOSS) : nom › étiquette › temps d'attente › CTA unique ›
  // infos › « Comment ça marche ? » replié › à proximité › FAQ (réponses repliées) › pied discret.
  // Aucun texte supprimé : seuls l'ordre, l'affichage et le bouton en doublon changent.
  const attenteTxt = content && content.has_attente ? (lang === 'ar' ? content.attente_ar : content.attente_fr) : '';
  const badgeHtml = attenteTxt ? `<p class="fiche-attente">${L.esc(`${lang === 'ar' ? T.FICHE.ar.attente : T.FICHE.fr.attente} ${attenteTxt}`)}</p>` : '';

  let body = '';
  if (isUrgence) {
    body += `<div class="urgence"><strong>${L.esc(T.URGENCES_BANDEAU[lang].fort)}</strong> ${L.esc(T.URGENCES_BANDEAU[lang].suite)}</div>`;
  }
  body += `<h1>${L.esc(e.name)}</h1><p class="fiche-kicker">${sousTitre}</p>${badgeHtml}`;
  if (!isUrgence) body += L.ficheCta(lang, L.missionHref(e));
  body += infoHtml;
  if (!isUrgence) body += L.ficheHow(lang, cat.domain);
  body += nearHtml;
  body += `<h2>${lang === 'ar' ? 'أسئلة شائعة' : 'Questions fréquentes'}</h2>` + L.faqDetails(faqItemsHtml);
  body += `<div class="fiche-foot">${L.nonAffiliationBlock(lang, e.name)}${L.signalementLinks(lang, e.id)}</div>`;

  const breadcrumbItems = lang === 'ar'
    ? [{ name: 'الرئيسية', path: '/ar' }, { name: cityLabel(e.city, lang), path: `/ar/etablissements/${L.CITY_SLUGS[e.city]}` }, { name: e.name, path: `/ar/etablissements/${L.CITY_SLUGS[e.city]}/${e.slug}` }]
    : [{ name: 'Accueil', path: '/' }, { name: e.city, path: `/etablissements/${L.CITY_SLUGS[e.city]}` }, { name: e.name, path: `/etablissements/${L.CITY_SLUGS[e.city]}/${e.slug}` }];
  const breadcrumbHtml = `<p class="crumbs">${breadcrumbItems.map((b) => `<a href="${b.path}">${L.esc(b.name)}</a>`).join(' › ')}</p>`;

  const jsonLd = [
    { '@context': 'https://schema.org', '@type': cat.schema_org_type, name: e.name,
      address: e.address ? { '@type': 'PostalAddress', streetAddress: e.address, addressLocality: e.city, addressCountry: 'MA' } : undefined,
      telephone: e.phone || undefined, url: website || undefined,
      geo: (e.lat && e.lng) ? { '@type': 'GeoCoordinates', latitude: e.lat, longitude: e.lng } : undefined },
    L.jsonLdBreadcrumb(breadcrumbItems),
    L.jsonLdFaq(faqItems.map((it) => ({ q: it.q, rPlain: it.r }))),
  ];
  if (!isUrgence) jsonLd.push(L.jsonLdShooflyService());

  const urlPath = `/etablissements/${L.CITY_SLUGS[e.city]}/${e.slug}`;
  const html = L.htmlShell({ lang, title, meta, canonicalPath: lang === 'ar' ? `/ar${urlPath}` : urlPath, alternatePath: urlPath, jsonLd, bodyHtml: body, breadcrumbHtml, mainClass: 'wrap fiche' });
  L.writeFile(`${lang === 'ar' ? '/ar' : ''}${urlPath}.html`, html);
}

function generateVilleCategorie(city, cat, list, lang) {
  const content = L.CONTENT[cat.id];
  const label = lang === 'ar' ? cat.label_ar : (lang === 'fr' ? cat.label_fr : cat.label_fr);
  const labelLower = lang === 'ar' ? label : lowerFirst(cat.id, cat.label_fr);
  const ville = cityLabel(city, lang);
  const nb = list.length;

  const title = lang === 'ar' ? `${label} في ${ville}: القائمة والعناوين والانتظار | شووفلي` : `${label} à ${ville} : liste, adresses et attente | Shoofly`;
  const meta = lang === 'ar' ? `${nb} من ${label} في ${ville} مع العناوين وأرقام الهاتف. تجنّب الطابور: عين شووفلي تنتظر بدلاً منك.` : `${nb} ${labelLower} à ${ville} avec adresses et téléphones. Évitez la file : un Œil Shoofly attend à votre place.`;
  const h1 = lang === 'ar' ? `${label} في ${ville}` : `${label} à ${ville}`;
  const phrase = content ? (lang === 'ar' ? content.phrase_ar : content.phrase_fr) : '';
  const intro = lang === 'ar' ? `تم إحصاء ${nb} من ${label} في ${ville}. ${phrase}` : `${nb} ${labelLower} recensés à ${ville}. ${phrase}`;

  let body = `<h1>${L.esc(h1)}</h1><p class="intro">${L.esc(intro)}</p>`;
  body += L.blocShoofly(lang, L.missionHref(null));
  body += L.oeilPeut(lang, cat.domain);
  body += renderList(list, city, lang);

  const quartierLinks = [...new Set(list.filter((e) => e.neighborhood).map((e) => e.neighborhood_id))]
    .map((id) => list.find((e) => e.neighborhood_id === id).neighborhood)
    .filter((nbObj, i, arr) => arr.findIndex((x) => x.id === nbObj.id) === i);
  const qualifiedQuartiers = quartierLinks.filter((q) => list.filter((e) => e.neighborhood_id === q.id).length >= L.MIN_FOR_PAGE);
  if (qualifiedQuartiers.length) {
    body += `<div class="quartiers">${qualifiedQuartiers.map((q) => `<a class="chip" href="${lang === 'ar' ? '/ar' : ''}/etablissements/${L.CITY_SLUGS[city]}/${L.categorySlug(cat.id)}/${L.slugify(q.name_fr)}">${L.esc(lang === 'ar' ? (q.name_ar || q.name_fr) : q.name_fr)}</a>`).join('')}</div>`;
  }

  const faqItems = buildCategoryFaq(cat, content, ville, nb, quartierLinks.length, lang);
  body += `<h2>${lang === 'ar' ? 'أسئلة شائعة' : 'Questions fréquentes'}</h2>` + L.faqBlock(lang, faqItems.map((it) => ({ q: it.q, r: L.esc(it.r) })));
  body += L.nonAffiliationBlock(lang, null);

  const breadcrumbItems = lang === 'ar'
    ? [{ name: 'الرئيسية', path: '/ar' }, { name: ville, path: `/ar/etablissements/${L.CITY_SLUGS[city]}` }, { name: label, path: `/ar/etablissements/${L.CITY_SLUGS[city]}/${L.categorySlug(cat.id)}` }]
    : [{ name: 'Accueil', path: '/' }, { name: city, path: `/etablissements/${L.CITY_SLUGS[city]}` }, { name: label, path: `/etablissements/${L.CITY_SLUGS[city]}/${L.categorySlug(cat.id)}` }];
  const breadcrumbHtml = `<p class="crumbs">${breadcrumbItems.map((b) => `<a href="${b.path}">${L.esc(b.name)}</a>`).join(' › ')}</p>`;
  const jsonLd = [L.jsonLdBreadcrumb(breadcrumbItems), L.jsonLdFaq(faqItems.map((it) => ({ q: it.q, rPlain: it.r }))), L.jsonLdShooflyService()];

  const urlPath = `/etablissements/${L.CITY_SLUGS[city]}/${L.categorySlug(cat.id)}`;
  const html = L.htmlShell({ lang, title, meta, canonicalPath: lang === 'ar' ? `/ar${urlPath}` : urlPath, alternatePath: urlPath, jsonLd, bodyHtml: body, breadcrumbHtml });
  L.writeFile(`${lang === 'ar' ? '/ar' : ''}${urlPath}.html`, html);
}

function generateVilleCategorieUrgences(city, cat, list, lang) {
  const label = lang === 'ar' ? cat.label_ar : cat.label_fr;
  const ville = cityLabel(city, lang);
  const nb = list.length;
  const title = lang === 'ar' ? `${label} في ${ville}: القائمة والعناوين والانتظار | شووفلي` : `${label} à ${ville} : liste, adresses et attente | Shoofly`;
  const meta = lang === 'ar' ? `${nb} من ${label} في ${ville} مع العناوين وأرقام الهاتف.` : `${nb} ${lowerFirst(cat.id, label)} à ${ville} avec adresses et téléphones.`;
  const h1 = lang === 'ar' ? `${label} في ${ville}` : `${label} à ${ville}`;

  let body = `<h1>${L.esc(h1)}</h1>`;
  body += `<div class="urgence"><strong>${L.esc(T.URGENCES_BANDEAU[lang].fort)}</strong> ${L.esc(T.URGENCES_BANDEAU[lang].suite)}</div>`;
  body += renderList(list, city, lang);
  body += L.nonAffiliationBlock(lang, null);

  const breadcrumbItems = lang === 'ar'
    ? [{ name: 'الرئيسية', path: '/ar' }, { name: ville, path: `/ar/etablissements/${L.CITY_SLUGS[city]}` }, { name: label, path: `/ar/etablissements/${L.CITY_SLUGS[city]}/urgences` }]
    : [{ name: 'Accueil', path: '/' }, { name: city, path: `/etablissements/${L.CITY_SLUGS[city]}` }, { name: label, path: `/etablissements/${L.CITY_SLUGS[city]}/urgences` }];
  const breadcrumbHtml = `<p class="crumbs">${breadcrumbItems.map((b) => `<a href="${b.path}">${L.esc(b.name)}</a>`).join(' › ')}</p>`;
  const jsonLd = [L.jsonLdBreadcrumb(breadcrumbItems)];

  const urlPath = `/etablissements/${L.CITY_SLUGS[city]}/urgences`;
  const html = L.htmlShell({ lang, title, meta, canonicalPath: lang === 'ar' ? `/ar${urlPath}` : urlPath, alternatePath: urlPath, jsonLd, bodyHtml: body, breadcrumbHtml });
  L.writeFile(`${lang === 'ar' ? '/ar' : ''}${urlPath}.html`, html);
}

function generateQuartierCategorie(city, cat, nbObj, list, fullCityCatList, lang) {
  const content = L.CONTENT[cat.id];
  const label = lang === 'ar' ? cat.label_ar : cat.label_fr;
  const labelLower = lang === 'ar' ? label : lowerFirst(cat.id, cat.label_fr);
  const ville = cityLabel(city, lang);
  const quartier = lang === 'ar' ? (nbObj.name_ar || nbObj.name_fr) : nbObj.name_fr;
  const nb = list.length;
  const catSingulier = content ? (lang === 'ar' ? content.singulier_ar : content.singulier_fr) : label;
  const art = content ? article(content.genre) : 'un';

  const title = lang === 'ar' ? `${label} في ${quartier}، ${ville} | شووفلي` : `${label} à ${quartier}, ${ville} | Shoofly`;
  const meta = lang === 'ar' ? `${nb} من ${label} في ${quartier} (${ville}). العناوين وأرقام الهاتف، وعين شووفلي لتنتظر بدلاً منك.` : `${nb} ${labelLower} à ${quartier} (${ville}). Adresses, téléphones, et un Œil Shoofly pour attendre à votre place.`;
  const h1 = lang === 'ar' ? `${label} في ${quartier}` : `${label} à ${quartier}`;
  const phrase = content ? (lang === 'ar' ? content.phrase_ar : content.phrase_fr) : '';
  const intro = lang === 'ar' ? `هل تبحث عن ${catSingulier} في ${quartier}؟ إليك ${nb} مؤسسات في الحي. ${phrase}` : `Vous cherchez ${art} ${catSingulier} à ${quartier} ? Voici les ${nb} établissements recensés dans le quartier. ${phrase}`;

  let body = `<h1>${L.esc(h1)}</h1><p class="intro">${L.esc(intro)}</p>`;
  body += L.blocShoofly(lang, L.missionHref(null));
  body += L.oeilPeut(lang, cat.domain);
  body += renderList(list, city, lang);

  const backLabel = lang === 'ar' ? `كل ${label} في ${ville}` : `Tous les ${labelLower} à ${ville}`;
  body += `<p><a href="${lang === 'ar' ? '/ar' : ''}/etablissements/${L.CITY_SLUGS[city]}/${L.categorySlug(cat.id)}">${L.esc(backLabel)}</a></p>`;

  const faqItems = buildCategoryFaq(cat, content, ville, nb, 1, lang);
  body += `<h2>${lang === 'ar' ? 'أسئلة شائعة' : 'Questions fréquentes'}</h2>` + L.faqBlock(lang, faqItems.map((it) => ({ q: it.q, r: L.esc(it.r) })));
  body += L.nonAffiliationBlock(lang, null);

  const catPath = `/etablissements/${L.CITY_SLUGS[city]}/${L.categorySlug(cat.id)}`;
  const urlPath = `${catPath}/${L.slugify(nbObj.name_fr)}`;
  const breadcrumbItems = lang === 'ar'
    ? [{ name: 'الرئيسية', path: '/ar' }, { name: ville, path: `/ar/etablissements/${L.CITY_SLUGS[city]}` }, { name: label, path: `/ar${catPath}` }, { name: quartier, path: `/ar${urlPath}` }]
    : [{ name: 'Accueil', path: '/' }, { name: city, path: `/etablissements/${L.CITY_SLUGS[city]}` }, { name: label, path: catPath }, { name: quartier, path: urlPath }];
  const breadcrumbHtml = `<p class="crumbs">${breadcrumbItems.map((b) => `<a href="${b.path}">${L.esc(b.name)}</a>`).join(' › ')}</p>`;
  const jsonLd = [L.jsonLdBreadcrumb(breadcrumbItems), L.jsonLdFaq(faqItems.map((it) => ({ q: it.q, rPlain: it.r }))), L.jsonLdShooflyService()];

  const html = L.htmlShell({ lang, title, meta, canonicalPath: lang === 'ar' ? `/ar${urlPath}` : urlPath, alternatePath: urlPath, jsonLd, bodyHtml: body, breadcrumbHtml });
  L.writeFile(`${lang === 'ar' ? '/ar' : ''}${urlPath}.html`, html);
}

function generateHub(city, list, allCategories, lang) {
  const ville = cityLabel(city, lang);
  const title = lang === 'ar' ? `تجنّب الانتظار في ${ville}: الصحة والإدارات | شووفلي` : `Éviter la file d'attente à ${ville} : santé et administrations | Shoofly`;
  const meta = lang === 'ar' ? `مختبرات، أطباء، مستشفيات، الضمان الاجتماعي، المقاطعات… اعثر على مؤسسات ${ville} ودع عين شووفلي تنتظر بدلاً منك.` : `Laboratoires, médecins, hôpitaux, CNSS, arrondissements… Trouvez les établissements de ${ville} et confiez l'attente à un Œil Shoofly.`;
  const h1 = lang === 'ar' ? `أماكن الانتظار في ${ville}` : `Établissements où l'on attend à ${ville}`;
  const intro = lang === 'ar'
    ? `قاعة انتظار ممتلئة، طابور أمام الشباك، رقم لا يتقدم: في ${ville}، تبدأ كثير من الإجراءات بالانتظار. تجمع هذه الصفحة المؤسسات الصحية والإدارات في المدينة، مصنفة حسب الفئة والحي.`
    : `Salle d'attente pleine, file devant un guichet, ticket qui n'avance pas : à ${ville}, beaucoup de démarches commencent par une attente. Cette page regroupe les établissements de santé et les administrations de la ville, classés par catégorie et par quartier.`;

  let body = `<h1>${L.esc(h1)}</h1><p class="intro">${L.esc(intro)}</p>`;
  body += L.blocShoofly(lang, L.missionHref(null));

  const catCounts = {};
  for (const e of list) catCounts[e.category_id] = (catCounts[e.category_id] || 0) + 1;
  const catsWithPage = allCategories.filter((c) => (catCounts[c.id] || 0) >= L.MIN_FOR_PAGE);
  body += `<div class="cats">${catsWithPage.map((c) => {
    const catPath = c.id === 'urgences' ? 'urgences' : L.categorySlug(c.id);
    return `<a class="chip" href="${lang === 'ar' ? '/ar' : ''}/etablissements/${L.CITY_SLUGS[city]}/${catPath}">${L.esc(lang === 'ar' ? c.label_ar : c.label_fr)}<span class="badge">${catCounts[c.id]}</span></a>`;
  }).join('')}</div>`;

  const quartiers = [...new Map(list.filter((e) => e.neighborhood).map((e) => [e.neighborhood.id, e.neighborhood])).values()];
  if (quartiers.length) {
    const quartierTitle = lang === 'ar' ? 'الأحياء' : 'Quartiers';
    body += `<h2>${L.esc(quartierTitle)}</h2><div class="quartiers">${quartiers.map((q) => `<span class="chip">${L.esc(lang === 'ar' ? (q.name_ar || q.name_fr) : q.name_fr)}</span>`).join('')}</div>`;
  }

  const faqItemsPlain = T.FAQ_GENERALE.map((it) => ({ q: it[lang].q, r: it[lang].r }));
  body += `<h2>${lang === 'ar' ? 'أسئلة شائعة' : 'Questions fréquentes'}</h2>` + L.faqBlock(lang, faqItemsPlain.map((it) => ({ q: it.q, r: L.esc(it.r) })));

  const breadcrumbItems = lang === 'ar'
    ? [{ name: 'الرئيسية', path: '/ar' }, { name: ville, path: `/ar/etablissements/${L.CITY_SLUGS[city]}` }]
    : [{ name: 'Accueil', path: '/' }, { name: city, path: `/etablissements/${L.CITY_SLUGS[city]}` }];
  const breadcrumbHtml = `<p class="crumbs">${breadcrumbItems.map((b) => `<a href="${b.path}">${L.esc(b.name)}</a>`).join(' › ')}</p>`;
  const jsonLd = [L.jsonLdBreadcrumb(breadcrumbItems), L.jsonLdFaq(faqItemsPlain.map((it) => ({ q: it.q, rPlain: it.r }))), L.jsonLdShooflyService()];

  const urlPath = `/etablissements/${L.CITY_SLUGS[city]}`;
  const html = L.htmlShell({ lang, title, meta, canonicalPath: lang === 'ar' ? `/ar${urlPath}` : urlPath, alternatePath: urlPath, jsonLd, bodyHtml: body, breadcrumbHtml });
  L.writeFile(`${lang === 'ar' ? '/ar' : ''}${urlPath}.html`, html);
}

// Catégories « phares » proposées sur l'accueil et la page d'entrée (liste validée par BOSS). Seules
// celles qui ont réellement une page ville×catégorie sont retenues (voir buildAnnuaireLinks).
const PHARE_CATEGORY_IDS = ['laboratoires', 'hopitaux', 'cnss', 'arrondissement_etat_civil', 'banque', 'visite_technique'];

function buildAnnuaireLinks(cities, byCityCat, categories) {
  const catById = Object.fromEntries(categories.map((c) => [c.id, c]));
  return {
    cities: cities.map((city) => ({
      slug: L.CITY_SLUGS[city],
      fr: city,
      ar: CITY_AR[city],
      phares: PHARE_CATEGORY_IDS
        .filter((id) => catById[id] && (byCityCat[`${city}|${id}`] || []).length >= L.MIN_FOR_PAGE)
        .map((id) => ({ slug: L.categorySlug(id), fr: catById[id].label_fr, ar: catById[id].label_ar })),
    })),
  };
}

// Page d'entrée /etablissements (FR à la racine, AR sous /ar). Fichier à la racine de public/ :
// Vercel (cleanUrls) le sert sous /etablissements sans extension.
function generateEntree(links, lang) {
  const t = T.ENTREE_ANNUAIRE[lang];
  const base = lang === 'ar' ? '/ar' : '';
  const urlPath = '/etablissements';
  const cityBlocks = links.cities.map((c) => {
    const chips = c.phares.map((p) => `<a class="chip" href="${base}/etablissements/${c.slug}/${p.slug}">${L.esc(lang === 'ar' ? p.ar : p.fr)}</a>`).join('');
    return `<h3><a href="${base}/etablissements/${c.slug}">${L.esc(lang === 'ar' ? c.ar : c.fr)}</a></h3>${chips ? `<p class="card-meta">${L.esc(t.phares)}</p><div class="cats">${chips}</div>` : ''}`;
  }).join('');

  const body = `<h1>${L.esc(t.h1)}</h1><p class="intro">${L.esc(t.intro)}</p><h2>${L.esc(t.villes)}</h2>${cityBlocks}`;

  const breadcrumbItems = lang === 'ar'
    ? [{ name: t.accueil, path: '/ar' }, { name: t.annuaire, path: `/ar${urlPath}` }]
    : [{ name: t.accueil, path: '/' }, { name: t.annuaire, path: urlPath }];
  const breadcrumbHtml = `<p class="crumbs">${breadcrumbItems.map((b) => `<a href="${b.path}">${L.esc(b.name)}</a>`).join(' › ')}</p>`;
  const jsonLd = [L.jsonLdBreadcrumb(breadcrumbItems)];

  const html = L.htmlShell({ lang, title: t.title, meta: t.intro, canonicalPath: `${base}${urlPath}`, alternatePath: urlPath, jsonLd, bodyHtml: body, breadcrumbHtml });
  L.writeFile(`${base}${urlPath}.html`, html);
}

// Bloc inséré dans index.html (vite.config.js, plugin annuaire-noscript) : liens lisibles SANS JS.
// Visible uniquement sans JavaScript — la section React ne se rend qu'avec JS, donc pas de doublon.
function annuaireNoscriptHtml(links) {
  const home = links.cities.find((c) => c.slug === 'rabat');
  const section = (lang) => {
    const N = T.ACCUEIL_NOSCRIPT[lang];
    const base = lang === 'ar' ? '/ar' : '';
    const cityName = (c) => (lang === 'ar' ? c.ar : c.fr);
    const phareName = (p) => (lang === 'ar' ? p.ar : p.fr);
    const cityLinks = links.cities.map((c) => `<a href="${base}/etablissements/${c.slug}">${L.esc(cityName(c))}</a>`).join(' · ');
    const phareLinks = home && home.phares.length
      ? `<p>${L.esc(N.phares)} ${L.esc(cityName(home))} : ${home.phares.map((p) => `<a href="${base}/etablissements/${home.slug}/${p.slug}">${L.esc(phareName(p))}</a>`).join(' · ')}</p>`
      : '';
    return `<section class="annuaire-liens" lang="${lang}"${lang === 'ar' ? ' dir="rtl"' : ''}>
<h2>${L.esc(N.titre)}</h2>
<p>${L.esc(N.villes)} : ${cityLinks}</p>
${phareLinks}
<p><a href="${base}/etablissements">${L.esc(N.pied)}</a></p>
</section>`;
  };
  return `<noscript>${section('fr')}
${section('ar')}</noscript>
`;
}

// Fiches retirées / non publiées (export `removed`, slug + ville + catégorie UNIQUEMENT) : une page
// minimale par URL ancienne, FR et AR. Décision BOSS (option c améliorée) : noindex, canonical vers la
// cible, redirection meta refresh + location.replace, lien visible de secours. Cible = ville×catégorie
// si la page existe (même seuil que la génération), sinon le hub de la ville. AUCUNE donnée de la
// fiche n'est écrite dans la page. Ces pages ne sont JAMAIS ajoutées aux sitemaps.
function generateRetiredStubs(removed, byCityCat, liveSlugs) {
  const stubs = [];
  let skipped = 0;
  for (const r of removed) {
    const citySlug = L.CITY_SLUGS[r.city];
    const validSlug = typeof r.slug === 'string' && /^[a-z0-9-]+$/.test(r.slug);
    if (!citySlug || !validSlug || !r.category_id) { skipped++; continue; }
    // Garde-fou : une URL retirée ne doit JAMAIS écraser une fiche encore publiée (slug unique en base,
    // mais l'export pourrait diverger) — on la signale et on la laisse de côté.
    if (liveSlugs.has(r.slug)) { console.warn(`(avertissement) fiche retirée "${r.slug}" a un slug encore publié — page de redirection NON générée.`); skipped++; continue; }
    const catPageExists = (byCityCat[`${r.city}|${r.category_id}`] || []).length >= L.MIN_FOR_PAGE;
    const catPath = r.category_id === 'urgences' ? 'urgences' : L.categorySlug(r.category_id);
    const hubPath = `/etablissements/${citySlug}`;
    const targetFr = catPageExists ? `${hubPath}/${catPath}` : hubPath;
    const oldFrPath = `${hubPath}/${r.slug}`;
    for (const lang of ['fr', 'ar']) {
      const base = lang === 'ar' ? '/ar' : '';
      const target = `${base}${targetFr}`;
      const canonical = `${L.SITE_URL}${target}`;
      const txt = T.REDIRECTION_RETIREE[lang];
      const html = `<!doctype html>
<html lang="${lang}" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex">
<title>${L.esc(txt.titre)}</title>
<link rel="canonical" href="${canonical}">
<meta http-equiv="refresh" content="0; url=${L.esc(target)}">
</head>
<body>
<p><a href="${L.esc(target)}">${L.esc(txt.lien)}</a></p>
<script>location.replace(${JSON.stringify(target)});</script>
</body>
</html>
`;
      L.writeFile(`${base}${oldFrPath}.html`, html);
    }
    stubs.push({ slug: r.slug, city: r.city, target: targetFr });
  }
  if (skipped) console.log(`Fiches retirées : ${skipped} ignorée(s) (ville/slug/catégorie invalide ou slug publié).`);
  return stubs;
}

function renderList(list, city, lang) {
  const labels = lang === 'ar' ? { fiche: 'التفاصيل' } : { fiche: 'Détails' };
  return `<ul class="list">${list.map((e) => {
    const q = e.neighborhood ? (lang === 'ar' ? e.neighborhood.name_ar || e.neighborhood.name_fr : e.neighborhood.name_fr) : '';
    return `<li>
<a class="card-name" href="${lang === 'ar' ? '/ar' : ''}/etablissements/${L.CITY_SLUGS[city]}/${e.slug}">${L.esc(e.name)}</a>
<div class="card-meta">${[q, e.address, e.phone].filter(Boolean).map(L.esc).join(' · ')}</div>
</li>`;
  }).join('')}</ul>`;
}

function buildCategoryFaq(cat, content, ville, nb, nbQuartiers, lang) {
  const items = [];
  if (content && content.has_attente) {
    const catSing = lang === 'ar' ? content.singulier_ar : content.singulier_fr;
    const attente = lang === 'ar' ? content.attente_ar : content.attente_fr;
    items.push({
      q: lang === 'ar' ? `كم يستغرق الانتظار في ${catSing} في ${ville}؟` : `Combien de temps attend-on dans un/une ${catSing} à ${ville} ?`.replace('un/une', article(content.genre)),
      r: lang === 'ar' ? `غالباً ما يجب احتساب ${attente}، حسب اليوم والساعة والمؤسسة. هذا الوقت يمكنك استرجاعه: عين شووفلي تنتظر بدلاً منك وتنبّهك عندما يقترب دورك.` : `Il faut souvent compter ${attente}, selon le jour, l'heure et l'établissement. Ce temps, vous pouvez le récupérer : un Œil attend à votre place et vous prévient quand votre tour approche.`,
    });
  }
  items.push({
    q: lang === 'ar' ? 'هل يمكن لعين شووفلي أن تعوّضني بالكامل؟' : 'Un Œil peut-il me remplacer complètement ?',
    r: lang === 'ar' ? 'تحتفظ بمكانك أو تأخذ لك رقماً. وإذا كان حضورك ضرورياً، تنبّهك في الوقت المناسب.' : 'Il garde votre place ou prend un ticket. Si votre présence est requise, il vous prévient à temps.',
  });
  const label = lang === 'ar' ? cat.label_ar : cat.label_fr;
  items.push({
    q: lang === 'ar' ? `كم عدد ${label} في ${ville}؟` : `Combien de ${lowerFirst(cat.id, cat.label_fr)} y a-t-il à ${ville} ?`,
    r: lang === 'ar' ? `يحصي شووفلي ${nb} مؤسسة في ${nbQuartiers} أحياء.` : `Shoofly en recense ${nb}, dans ${nbQuartiers} quartiers.`,
  });
  items.push({
    q: lang === 'ar' ? 'هل هناك معلومة خاطئة؟' : 'Une information est fausse ?',
    r: lang === 'ar' ? 'استخدم رابط "الإبلاغ عن خطأ" في الصفحة المعنية.' : 'Utilisez le lien « Signaler une erreur » sur la fiche concernée.',
  });
  return items;
}

function writeRobotsAndSitemaps(categories, sitemapUrls) {
  const robots = `User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: GPTBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: *
Allow: /

Sitemap: ${L.SITE_URL}/sitemap-index.xml
`;
  L.writeFile('/robots.txt', robots);

  // Vagues de soumission (décision Étape 3) : catégories à forte attente d'abord — ordre du
  // sitemap-index, PAS un filtre : toutes les pages existent, seul l'ORDRE de soumission diffère.
  const PRIORITY_FIRST = ['laboratoires', 'centres_sante_publics', 'hopitaux', 'medecine_generale', 'cnss', 'arrondissement_etat_civil'];
  const orderedCatIds = ['_hubs', ...PRIORITY_FIRST, ...categories.map((c) => c.id).filter((id) => !PRIORITY_FIRST.includes(id))];

  const today = new Date().toISOString().slice(0, 10);
  const sitemapFiles = [];
  for (const catId of orderedCatIds) {
    const urls = sitemapUrls[catId];
    if (!urls || !urls.length) continue;
    const fileName = catId === '_hubs' ? 'sitemap-hubs.xml' : `sitemap-${catId.replace(/_/g, '-')}.xml`;
    const urlEntries = urls.flatMap((p) => [
      `  <url><loc>${L.SITE_URL}${p}</loc><lastmod>${today}</lastmod><xhtml:link rel="alternate" hreflang="ar" href="${L.SITE_URL}/ar${p}"/></url>`,
      `  <url><loc>${L.SITE_URL}/ar${p}</loc><lastmod>${today}</lastmod><xhtml:link rel="alternate" hreflang="fr" href="${L.SITE_URL}${p}"/></url>`,
    ]);
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urlEntries.join('\n')}\n</urlset>\n`;
    L.writeFile(`/${fileName}`, xml);
    sitemapFiles.push(fileName);
  }
  const indexXml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapFiles.map((f) => `  <sitemap><loc>${L.SITE_URL}/${f}</loc><lastmod>${today}</lastmod></sitemap>`).join('\n')}\n</sitemapindex>\n`;
  L.writeFile('/sitemap-index.xml', indexXml);
  console.log('Sitemaps écrits (ordre de priorité de soumission) :', sitemapFiles.join(', '));
}

function writeIndexNowKey() {
  // Clé PRÉPARÉE, jamais envoyée (décision Étape 3) — le fichier de vérification doit être servi à
  // la racine (protocole IndexNow) ; aucun appel réseau n'est fait par ce script.
  //
  // Phase 4 ter, correctif #2 (2026-10-02) : IndexNow EXIGE que cette clé reste STABLE entre
  // soumissions (le fichier <clé>.txt à la racine fait foi de la propriété du site) — elle ne peut
  // donc plus être générée aléatoirement à chaque build comme avant. Lue depuis la variable
  // d'environnement INDEXNOW_KEY (à définir sur Vercel, Production ET Preview, avec la MÊME
  // valeur) ; absente ou invalide => avertissement, AUCUN fichier écrit, le build CONTINUE (ce
  // n'est pas une donnée bloquante comme DIRECTORY_EXPORT_TOKEN — IndexNow n'est qu'une
  // accélération de l'indexation, pas une dépendance du site).
  for (const f of fs.readdirSync(L.PUBLIC_DIR)) {
    if (/^[A-Za-z0-9_-]{8,128}\.txt$/.test(f)) fs.unlinkSync(path.join(L.PUBLIC_DIR, f)); // clé d'un run précédent
  }
  const key = process.env.INDEXNOW_KEY;
  if (!key) {
    console.warn('(avertissement) INDEXNOW_KEY absente — fichier de vérification IndexNow NON écrit (build non bloqué).');
    console.warn('Pour générer une clé stable : node -e "console.log(require(\'crypto\').randomBytes(16).toString(\'hex\'))" (32 caractères hex, ou tout texte de 8 à 128 caractères parmi a-z A-Z 0-9 - _).');
    console.warn('Puis la définir sur Vercel : Project Settings → Environment Variables → INDEXNOW_KEY, avec la MÊME valeur pour les environnements Production ET Preview (clé stable = même fichier à chaque build).');
    return;
  }
  if (!/^[A-Za-z0-9_-]{8,128}$/.test(key)) {
    console.warn(`(avertissement) INDEXNOW_KEY invalide (reçu ${key.length} caractère(s) — attendu 8 à 128 parmi a-z A-Z 0-9 - _) — fichier de vérification IndexNow NON écrit.`);
    return;
  }
  L.writeFile(`/${key}.txt`, key);
  L.writeDataFile('indexnow-key.json', JSON.stringify({ key, keyLocation: `${L.SITE_URL}/${key}.txt`, note: 'Préparée depuis INDEXNOW_KEY, jamais envoyée automatiquement à l\'API IndexNow — voir RAPPORT_PHASE3.md.' }, null, 2));
  console.log('Clé IndexNow écrite (stable, depuis INDEXNOW_KEY) :', key);
}

function checkNoSpaCollision() {
  const APP_ROOT_SEGMENTS = ['login', 'register', 'client', 'oeil', 'admin', 'forgot-password', 'reset-password', 'verification', 'confidentialite', 'cgv', 'mentions-legales', 'compte-bloque', 'payment'];
  const collision = APP_ROOT_SEGMENTS.find((s) => fs.existsSync(path.join(L.PUBLIC_DIR, 'etablissements', s)));
  if (collision) throw new Error(`Collision détectée : /etablissements/${collision} chevauche une route de l'app`);
  console.log('Vérification anti-collision SPA : OK (aucun chevauchement avec les routes app).');
}

main().catch((e) => { console.error('ERREUR BUILD:', e.message); process.exit(1); });
