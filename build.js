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

const { render, toOptimize } = setup(Handlebars);
let html = render(read('src/page.hbs'), data, read('src/icons.html'));

// ---------- Copie des fichiers statiques ----------
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });
const copy = (src, dest) => fs.cpSync(path.join(ROOT, src), path.join(DIST, dest || src), { recursive: true });
['assets', 'admin', 'styles.css', 'upgrade.css', 'app.js', 'upgrade.js', 'google41e7d606cc4d3619.html'].forEach(f => copy(f));
fs.writeFileSync(path.join(DIST, 'index.html'), html);

// Fichiers pour l'aperçu en direct dans l'admin
const pv = path.join(DIST, 'admin/preview');
fs.mkdirSync(pv, { recursive: true });
fs.copyFileSync(path.join(ROOT, 'src/helpers.js'), path.join(pv, 'helpers.js'));
fs.copyFileSync(require.resolve('handlebars/dist/handlebars.min.js'), path.join(pv, 'handlebars.min.js'));
fs.writeFileSync(path.join(pv, 'bundle.json'), JSON.stringify({ template: read('src/page.hbs'), icons: read('src/icons.html'), data }));

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
