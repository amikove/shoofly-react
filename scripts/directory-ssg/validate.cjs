// Tests Phase 3 — validation du build statique : JSON-LD parseable, hreflang réciproque, liens
// internes non cassés (crawl complet local), robots.txt/sitemaps bien formés. Lecture seule.
const fs = require('fs');
const path = require('path');
const L = require('./lib.cjs');
const PUBLIC_DIR = path.join(__dirname, '..', '..', 'public');

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith('.html')) out.push(full);
  }
}

function main() {
  const etabDirs = [path.join(PUBLIC_DIR, 'etablissements'), path.join(PUBLIC_DIR, 'ar', 'etablissements')];
  const files = [];
  for (const d of etabDirs) if (fs.existsSync(d)) walk(d, files);
  // Page d'entrée /etablissements (FR à la racine de public/, AR sous public/ar/).
  for (const f of [path.join(PUBLIC_DIR, 'etablissements.html'), path.join(PUBLIC_DIR, 'ar', 'etablissements.html')]) {
    if (fs.existsSync(f)) files.push(f); else { console.log('Page d\'entrée absente :', f); process.exitCode = 1; }
  }
  console.log('Fichiers HTML annuaire trouvés :', files.length);

  let jsonLdErrors = 0, jsonLdBlocks = 0;
  let hreflangMismatch = 0, hreflangChecked = 0;
  const allInternalHrefs = new Set();
  const existingPaths = new Set();
  for (const f of files) {
    const rel = '/' + path.relative(PUBLIC_DIR, f).replace(/\\/g, '/').replace(/\.html$/, '');
    existingPaths.add(rel);
  }
  // Autres fichiers statiques existants (hors annuaire) qui peuvent être ciblés par un lien interne.
  for (const f of fs.readdirSync(PUBLIC_DIR)) if (fs.statSync(path.join(PUBLIC_DIR, f)).isFile()) existingPaths.add('/' + f);

  let brokenLinks = 0;
  // Sous-catégorie pré-remplie (chantier 2026-10-02) — vérifie la valeur RÉELLEMENT présente dans le
  // HTML généré (donc aussi sensible à un bug d'échappement), pas seulement la cohérence interne de
  // lib.cjs (déjà garantie à la construction de DIRECTORY_CATEGORY_TO_SUBCATEGORY par sub()) :
  // caractère pour caractère contre la même liste que CATEGORIES.file_attente (NewMissionModal.jsx).
  let subcategoryChecked = 0, subcategoryInvalid = 0;
  let websiteChecked = 0, websiteInvalid = 0, externalChecked = 0, externalInvalid = 0;
  for (const f of files) {
    const html = fs.readFileSync(f, 'utf8');

    for (const m of html.matchAll(/href="(\/client\?[^"]+)"/g)) {
      const qs = m[1].replace(/&amp;/g, '&').split('?')[1] || '';
      const value = new URLSearchParams(qs).get('prefill_subcategory');
      if (value == null) continue;
      subcategoryChecked++;
      if (!L.FILE_ATTENTE_SUBCATEGORIES.has(value)) {
        subcategoryInvalid++;
        if (subcategoryInvalid <= 10) console.log('Sous-catégorie pré-remplie invalide:', JSON.stringify(value), 'dans', f);
      }
    }

    // JSON-LD
    const ldMatches = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    for (const m of ldMatches) {
      jsonLdBlocks++;
      let block;
      try { block = JSON.parse(m[1]); } catch (e) { jsonLdErrors++; console.log('JSON-LD invalide:', f, e.message); continue; }
      // Site web (chantier liens annuaire) : toute URL JSON-LD doit être absolue http(s), sans protocole = invalide.
      const urlField = block.url;
      if (urlField !== undefined) {
        websiteChecked++;
        if (!/^https?:\/\/[^\s]+\.[a-z]{2,}/i.test(urlField)) { websiteInvalid++; console.log('URL JSON-LD sans protocole ou invalide:', urlField, 'dans', f); }
      }
    }

    // Liens externes : nouvel onglet + rel="nofollow noopener" (les liens internes ne sont pas concernés)
    for (const a of html.matchAll(/<a\b([^>]*)href="(https?:\/\/[^"]+)"([^>]*)>/g)) {
      const attrs = a[1] + ' ' + a[3];
      externalChecked++;
      const rel = (attrs.match(/rel="([^"]*)"/) || [])[1] || '';
      if (!/target="_blank"/.test(attrs) || !/\bnofollow\b/.test(rel) || !/\bnoopener\b/.test(rel)) {
        externalInvalid++;
        if (externalInvalid <= 10) console.log('Lien externe sans rel/target conformes:', a[2], 'dans', f);
      }
    }

    // hreflang réciprocité : fr->ar doit exister et vice versa
    const hreflangFr = html.match(/hreflang="fr" href="([^"]+)"/);
    const hreflangAr = html.match(/hreflang="ar" href="([^"]+)"/);
    if (hreflangFr && hreflangAr) {
      hreflangChecked++;
      const frPath = hreflangFr[1].replace('https://shoofly.ma', '');
      const arPath = hreflangAr[1].replace('https://shoofly.ma', '');
      const frExists = existingPaths.has(frPath);
      const arExists = existingPaths.has(arPath);
      if (!frExists || !arExists) { hreflangMismatch++; console.log('hreflang cassé:', f, '-> fr exists:', frExists, 'ar exists:', arExists); }
    }

    // Liens internes /etablissements/... ou /ar/etablissements/...
    const hrefs = [...html.matchAll(/href="(\/(?:ar\/)?etablissements\/[^"#]+)"/g)].map((m) => m[1]);
    for (const h of hrefs) {
      allInternalHrefs.add(h);
      if (!existingPaths.has(h)) { brokenLinks++; if (brokenLinks <= 10) console.log('Lien cassé:', h, 'dans', f); }
    }
  }

  // ── Liens de l'annuaire (accueil, pied de page, espace client) ───────────
  // Chaque lien généré doit pointer vers une page qui existe réellement dans public/.
  let liensChecked = 0, liensBroken = 0;
  const liensFile = path.join(__dirname, '..', '..', 'directory-data', 'annuaire-liens.json');
  let liensJson = null;
  if (fs.existsSync(liensFile)) {
    liensJson = JSON.parse(fs.readFileSync(liensFile, 'utf8'));
    const expected = ['/etablissements'];
    for (const c of liensJson.cities) {
      expected.push(`/etablissements/${c.slug}`);
      for (const p of c.phares) expected.push(`/etablissements/${c.slug}/${p.slug}`);
    }
    for (const p of expected) {
      liensChecked++;
      if (!existingPaths.has(p)) { liensBroken++; console.log('Lien annuaire vers page absente:', p); }
    }
    // Pages entrée : version AR sous /ar (hreflang réciproque, déjà couvert par la boucle hreflang).
    for (const p of ['/ar/etablissements']) if (!existingPaths.has(p)) { liensBroken++; console.log('Page d\'entrée AR absente:', p); }
  } else {
    console.log('directory-data/annuaire-liens.json absent : vérification des liens annuaire ignorée (build non exécuté).');
  }

  // Bloc noscript de index.html (dist/, après vite build) : mêmes règles que ci-dessus.
  let noscriptChecked = 0, noscriptBroken = 0;
  const distIndex = path.join(__dirname, '..', '..', 'dist', 'index.html');
  if (fs.existsSync(distIndex)) {
    const indexHtml = fs.readFileSync(distIndex, 'utf8');
    const ns = indexHtml.match(/<noscript><section class="annuaire-liens">([\s\S]*?)<\/section><\/noscript>/);
    if (!ns) { noscriptBroken++; console.log('Bloc noscript annuaire absent de dist/index.html'); }
    else {
      for (const h of [...ns[1].matchAll(/href="(\/[^"]+)"/g)].map((m) => m[1])) {
        noscriptChecked++;
        if (!existingPaths.has(h)) { noscriptBroken++; console.log('Lien noscript vers page absente:', h); }
      }
    }
  } else {
    console.log('dist/index.html absent : vérification du bloc noscript ignorée (lancer le build).');
  }

  // Routage Vercel : cleanUrls + destination "/index" (une destination "/index.html" casse le SPA).
  const vercel = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'vercel.json'), 'utf8'));
  const routingOk = vercel.cleanUrls === true && vercel.rewrites?.some((r) => r.source === '/(.*)' && r.destination === '/index');

  // Sitemap : pages d'entrée référencées dans les hubs
  const hubsXml = fs.existsSync(path.join(PUBLIC_DIR, 'sitemap-hubs.xml')) ? fs.readFileSync(path.join(PUBLIC_DIR, 'sitemap-hubs.xml'), 'utf8') : '';
  const entryInSitemap = hubsXml.includes('https://shoofly.ma/etablissements</loc>') && hubsXml.includes('https://shoofly.ma/ar/etablissements</loc>');

  console.log('\n=== JSON-LD ===');
  console.log('Blocs vérifiés :', jsonLdBlocks, '| invalides :', jsonLdErrors);
  console.log('=== Sites web (JSON-LD url) ===');
  console.log('URL vérifiées :', websiteChecked, '| invalides :', websiteInvalid);
  console.log('=== Liens externes (target/rel) ===');
  console.log('Liens externes vérifiés :', externalChecked, '| non conformes :', externalInvalid);
  console.log('=== Liens annuaire (accueil / pied / espace client) ===');
  console.log('Pages liées vérifiées :', liensChecked, '| cassées :', liensBroken);
  console.log('Bloc noscript index.html — liens vérifiés :', noscriptChecked, '| cassés :', noscriptBroken);
  console.log('=== Page d\'entrée et routage ===');
  console.log('Entrée présente dans sitemap-hubs :', entryInSitemap ? 'oui' : 'NON');
  console.log('Routage vercel.json (cleanUrls + /index) :', routingOk ? 'OK' : 'NON CONFORME');
  console.log('=== hreflang ===');
  console.log('Pages vérifiées :', hreflangChecked, '| non réciproques :', hreflangMismatch);
  console.log('=== Liens internes ===');
  console.log('Liens internes distincts :', allInternalHrefs.size, '| cassés :', brokenLinks);
  console.log('=== prefill_subcategory ===');
  console.log('Liens "Créer une mission" avec sous-catégorie pré-remplie :', subcategoryChecked, '| invalides :', subcategoryInvalid);

  // robots.txt / sitemap
  const robots = fs.readFileSync(path.join(PUBLIC_DIR, 'robots.txt'), 'utf8');
  const requiredBots = ['Googlebot', 'Bingbot', 'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'Google-Extended', 'PerplexityBot', 'ClaudeBot'];
  const missingBots = requiredBots.filter((b) => !robots.includes(b));
  console.log('=== robots.txt ===');
  console.log('Bots manquants :', missingBots.length ? missingBots.join(', ') : 'aucun');

  const sitemapIndex = fs.readFileSync(path.join(PUBLIC_DIR, 'sitemap-index.xml'), 'utf8');
  const sitemapCount = (sitemapIndex.match(/<sitemap>/g) || []).length;
  let totalSitemapUrls = 0;
  for (const f of fs.readdirSync(PUBLIC_DIR)) {
    if (/^sitemap-.*\.xml$/.test(f)) {
      const xml = fs.readFileSync(path.join(PUBLIC_DIR, f), 'utf8');
      totalSitemapUrls += (xml.match(/<url>/g) || []).length;
    }
  }
  console.log('=== sitemaps ===');
  console.log('Sitemaps référencés dans l\'index :', sitemapCount, '| URLs totales (FR+AR) dans tous les sitemaps :', totalSitemapUrls);

  const ok = jsonLdErrors === 0 && hreflangMismatch === 0 && brokenLinks === 0 && missingBots.length === 0 && subcategoryInvalid === 0
    && websiteInvalid === 0 && externalInvalid === 0 && liensBroken === 0 && noscriptBroken === 0 && routingOk && entryInSitemap;
  console.log('\n=== RÉSULTAT ===', ok ? 'PASS' : 'FAIL');
  process.exit(ok ? 0 : 1);
}

main();
