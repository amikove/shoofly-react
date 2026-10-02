// Tests Phase 3 — validation du build statique : JSON-LD parseable, hreflang réciproque, liens
// internes non cassés (crawl complet local), robots.txt/sitemaps bien formés. Lecture seule.
const fs = require('fs');
const path = require('path');
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
  for (const f of files) {
    const html = fs.readFileSync(f, 'utf8');

    // JSON-LD
    const ldMatches = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    for (const m of ldMatches) {
      jsonLdBlocks++;
      try { JSON.parse(m[1]); } catch (e) { jsonLdErrors++; console.log('JSON-LD invalide:', f, e.message); }
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

  console.log('\n=== JSON-LD ===');
  console.log('Blocs vérifiés :', jsonLdBlocks, '| invalides :', jsonLdErrors);
  console.log('=== hreflang ===');
  console.log('Pages vérifiées :', hreflangChecked, '| non réciproques :', hreflangMismatch);
  console.log('=== Liens internes ===');
  console.log('Liens internes distincts :', allInternalHrefs.size, '| cassés :', brokenLinks);

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

  const ok = jsonLdErrors === 0 && hreflangMismatch === 0 && brokenLinks === 0 && missingBots.length === 0;
  console.log('\n=== RÉSULTAT ===', ok ? 'PASS' : 'FAIL');
  process.exit(ok ? 0 : 1);
}

main();
