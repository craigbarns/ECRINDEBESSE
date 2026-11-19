// Construit le site dans dist/ à partir de src/page.hbs et des contenus de content/*.json
// (modifiés par Laetitia depuis /admin). Lancé automatiquement par Netlify.
const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');
const setup = require('./src/helpers.js');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

const data = {};
for (const file of fs.readdirSync(path.join(ROOT, 'content'))) {
  if (file.endsWith('.json')) data[path.basename(file, '.json')] = JSON.parse(read(`content/${file}`));
}
// Pages par secteur (référencement local), modifiables dans l'admin
data.zones = fs.readdirSync(path.join(ROOT, 'content/zones')).filter(f => f.endsWith('.json'))
  .map(f => JSON.parse(read(`content/zones/${f}`))).filter(z => z.slug && z.publier !== false);

const partials = {};
for (const f of fs.readdirSync(path.join(ROOT, 'src/partials'))) partials[path.basename(f, '.hbs')] = read(`src/partials/${f}`);
const { render, renderZone, toOptimize, strip, SITE } = setup(Handlebars, { partials });
const icons = read('src/icons.html');
let html = render(read('src/page.hbs'), data, icons);
const zonePages = data.zones.map(z => ({ slug: z.slug, html: renderZone(read('src/zone.hbs'), data, icons, z) }));

// ---------- Copie des fichiers statiques ----------
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });
const copy = (src, dest) => fs.cpSync(path.join(ROOT, src), path.join(DIST, dest || src), { recursive: true });
['assets', 'admin', 'styles.css', 'upgrade.css', 'app.js', 'upgrade.js', 'google41e7d606cc4d3619.html', 'favicon.ico', 'site.webmanifest'].forEach(f => copy(f));
fs.writeFileSync(path.join(DIST, 'index.html'), html);
for (const z of zonePages) {
  fs.mkdirSync(path.join(DIST, z.slug), { recursive: true });
  fs.writeFileSync(path.join(DIST, z.slug, 'index.html'), z.html);
}

// ---------- Référencement : robots.txt, sitemap.xml, llms.txt ----------
const today = new Date().toISOString().slice(0, 10);
fs.writeFileSync(path.join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /admin/\n\nSitemap: ${SITE}/sitemap.xml\n`);
fs.writeFileSync(path.join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${SITE}/</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>1.0</priority></url>\n${data.zones.map(z => `  <url><loc>${SITE}/${z.slug}/</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>\n`).join('')}</urlset>\n`);
{
  const r = data.reglages, a = data.accueil, t = data.tarifs || {}, f = data.faq || {}, s = data.sancy || {};
  const lines = [
    `# Écrin de Besse — Conciergerie`, '',
    `> ${strip(r.seo_description)}`, '',
    `Écrin de Besse est une conciergerie locale et indépendante pour propriétaires de résidences secondaires et de locations saisonnières (Airbnb, gîtes, chalets, appartements) et pour leurs voyageurs, autour de Super-Besse et Besse-et-Saint-Anastaise, dans le massif du Sancy (Puy-de-Dôme, Auvergne). Fondée par Laetitia et Rémy.`, '',
    `## Zone d’intervention`, (s.lieux || []).map(l => `- ${l}`).join('\n'), `- ${strip(s.note)}`, '',
    `## Prestations`,
    ...(data.proprietaires.services || []).map(x => `- ${strip(x.titre)} : ${strip(x.texte)}`),
    `- Courses au drive récupérées et rangées avant l’arrivée des voyageurs`,
    `- Décorations à thème : ${(data.occasions.liste || []).map(o => strip(o.onglet)).join(', ')}`,
    `- Entretien et dépannage avec un partenaire multiservices : ${(data.entretien.metiers || []).map(m => m.nom).join(', ')}`, '',
    `## Tarifs indicatifs`,
    ...(t.prestations || []).map(p => `- ${strip(p.nom)} : ${p.prefixe ? p.prefixe + ' ' : ''}${p.prix} (${strip(p.detail)})`),
    `- ${strip(t.note)}`, '',
    `## Questions fréquentes`,
    ...(f.questions || []).flatMap(q => [`### ${strip(q.question)}`, strip(q.reponse), '']),
    `## Pages par secteur`,
    ...data.zones.map(z => `- [Conciergerie ${strip(z.lien)}](${SITE}/${z.slug}/) : ${strip(z.seo_description)}`), '',
    `## Contact`,
    `- Téléphone : ${r.telephone}`, `- E-mail : ${r.email}`, `- Site : ${SITE}/`, `- Demande de devis : ${SITE}/#contact`, ''
  ];
  fs.writeFileSync(path.join(DIST, 'llms.txt'), lines.join('\n'));
}

// Fichiers pour l'aperçu en direct dans l'admin
const pv = path.join(DIST, 'admin/preview');
fs.mkdirSync(pv, { recursive: true });
fs.copyFileSync(path.join(ROOT, 'src/helpers.js'), path.join(pv, 'helpers.js'));
fs.copyFileSync(require.resolve('handlebars/dist/handlebars.min.js'), path.join(pv, 'handlebars.min.js'));
fs.writeFileSync(path.join(pv, 'bundle.json'), JSON.stringify({ template: read('src/page.hbs'), zoneTemplate: read('src/zone.hbs'), partials, icons, data }));

// ---------- Optimisation des photos ----------
(async () => {
  let sharp = null;
  try { sharp = require('sharp'); } catch { console.warn('sharp indisponible : photos copiées sans optimisation'); }
  fs.mkdirSync(path.join(DIST, 'assets/opt'), { recursive: true });
  for (const [src, out] of toOptimize) {
    const from = path.join(ROOT, src), to = path.join(DIST, out);
    if (!fs.existsSync(from)) { console.warn('Photo introuvable :', src); continue; }
    try {
      if (!sharp) throw new Error('no sharp');
      await sharp(from).rotate().resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }).toFile(to);
    } catch {
      html = html.split('/' + out).join('/' + src);
      fs.writeFileSync(path.join(DIST, 'index.html'), html);
    }
  }
  console.log(`Site construit dans dist/ (${toOptimize.size} photo(s) optimisée(s)).`);
})();
