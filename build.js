// Construit le site dans dist/ à partir de src/page.hbs et des contenus de content/*.json
// (modifiés par Laetitia depuis /admin). Lancé automatiquement par Netlify.
const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

// ---------- Contenus ----------
const data = {};
for (const file of fs.readdirSync(path.join(ROOT, 'content'))) {
  if (file.endsWith('.json')) data[path.basename(file, '.json')] = JSON.parse(read(`content/${file}`));
}

// ---------- Aides de mise en forme ----------
const esc = (s) => Handlebars.escapeExpression(s == null ? '' : String(s));
// *mot* -> italique doré ; retour à la ligne -> <br>
const inline = (s, tag = 'em') => esc(s).trim()
  .replace(/\*([^*]+)\*/g, `<${tag}>$1</${tag}>`)
  .replace(/\r?\n/g, '<br>\n');
const paragraphs = (s) => String(s || '').split(/\r?\n\s*\r?\n/).map(x => x.trim()).filter(Boolean)
  .map(x => `<p>${inline(x)}</p>`).join('');

const ICONS = { sapin: 'i-tree', gateau: 'i-cake', coeur: 'i-heart', etoile: 'i-spark', goutte: 'i-drop', flamme: 'i-flame',
  ampoule: 'i-bulb', outil: 'i-tool', rouleau: 'i-brush', feuille: 'i-leaf', maison: 'i-house', cle: 'i-key', flocon: 'i-flake', sac: 'i-bag', cadeau: 'i-gift' };

// Photos envoyées depuis l'admin : redimensionnées et converties en WebP
const toOptimize = new Map();
const img = (p) => {
  if (!p) return '';
  if (/^\/?assets\/uploads\/.+\.(jpe?g|png|webp|avif|tiff?)$/i.test(p)) {
    const out = `/assets/opt/${path.basename(p).replace(/\.[^.]+$/, '')}.webp`;
    toOptimize.set(p.replace(/^\//, ''), out.replace(/^\//, ''));
    return out;
  }
  return p.startsWith('/') || /^https?:/.test(p) ? p : '/' + p;
};

Handlebars.registerHelper({
  t: (s, tag) => new Handlebars.SafeString(inline(s, typeof tag === 'string' ? tag : 'em')),
  p: (s) => new Handlebars.SafeString(paragraphs(s)),
  lines: (s) => new Handlebars.SafeString(String(s || '').split(/\r?\n/).filter(l => l.trim())
    .map((l, i) => `<span class="line"><span style="--d:${(0.25 + i * 0.15).toFixed(2)}s">${inline(l)}</span></span>`).join('')),
  img,
  icon: (name) => ICONS[name] || 'i-spark',
  tel: (s) => { const d = String(s || '').replace(/[^\d+]/g, ''); return d.startsWith('0') ? '+33' + d.slice(1) : d; },
  num: (i) => String(i + 1).padStart(2, '0'),
  add1: (i) => i + 1,
  delay: (i) => (i * 0.12).toFixed(2),
  pick: (i, ...opts) => opts.slice(0, -1)[i % (opts.length - 1)]
});

// Données des décorations pour l'animation des onglets
const occ = (data.occasions && data.occasions.liste) || [];
data.occasionsJson = JSON.stringify(occ.map(o => ({
  word: o.mot || '', img: img(o.photo), eyebrow: o.surtitre || '', title: inline(o.titre), text: inline(o.texte), list: (o.points || []).map(esc)
}))).replace(/</g, '\\u003c');
data.icons = read('src/icons.html');

let html = Handlebars.compile(read('src/page.hbs'))(data);

// Typographie française : espaces insécables avant ? ! : ; » et après « (texte seulement)
html = html.split(/(<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]+>)/).map(part =>
  part.startsWith('<') ? part : part.replace(/ ([?!:;»])/g, '&nbsp;$1').replace(/« /g, '«&nbsp;')).join('');

// ---------- Copie des fichiers statiques ----------
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });
const copy = (src, dest) => fs.cpSync(path.join(ROOT, src), path.join(DIST, dest || src), { recursive: true });
['assets', 'admin', 'styles.css', 'upgrade.css', 'app.js', 'upgrade.js'].forEach(f => copy(f));
fs.writeFileSync(path.join(DIST, 'index.html'), html);

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
      // repli : on garde la photo d'origine
      const fallback = '/' + src;
      html = html.split(out.startsWith('/') ? out : '/' + out).join(fallback);
      fs.writeFileSync(path.join(DIST, 'index.html'), html);
    }
  }
  console.log(`Site construit dans dist/ (${toOptimize.size} photo(s) optimisée(s)).`);
})();
