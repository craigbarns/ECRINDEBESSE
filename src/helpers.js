// Aides de mise en forme partagées : construction du site (Node) et aperçu en direct dans l'admin (navigateur)
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.EcrinHelpers = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const ICONS = { sapin: 'i-tree', gateau: 'i-cake', coeur: 'i-heart', etoile: 'i-spark', goutte: 'i-drop', flamme: 'i-flame',
    ampoule: 'i-bulb', outil: 'i-tool', rouleau: 'i-brush', feuille: 'i-leaf', maison: 'i-house', cle: 'i-key', flocon: 'i-flake', sac: 'i-bag', cadeau: 'i-gift' };

  return function setup(Handlebars, opts) {
    opts = opts || {};
    const toOptimize = new Map();
    const esc = (s) => Handlebars.escapeExpression(s == null ? '' : String(s));
    // *mot* -> italique doré ; retour à la ligne -> <br>
    const inline = (s, tag = 'em') => esc(s).trim()
      .replace(/\*([^*]+)\*/g, `<${tag}>$1</${tag}>`)
      .replace(/\r?\n/g, '<br>\n');
    const paragraphs = (s) => String(s || '').split(/\r?\n\s*\r?\n/).map(x => x.trim()).filter(Boolean)
      .map(x => `<p>${inline(x)}</p>`).join('');
    // Photos envoyées depuis l'admin : version allégée générée à la construction
    const img = (p) => {
      if (!p) return '';
      p = String(p);
      if (/^(blob:|data:|https?:)/.test(p)) return p;
      if (/^\/?assets\/uploads\/.+\.(jpe?g|png|webp|avif|tiff?)$/i.test(p)) {
        if (opts.keepUploads) return '/' + p.replace(/^\//, '');
        const out = `/assets/opt/${p.split('/').pop().replace(/\.[^.]+$/, '')}.webp`;
        toOptimize.set(p.replace(/^\//, ''), out.replace(/^\//, ''));
        return out;
      }
      return p.startsWith('/') ? p : '/' + p;
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
      pick: (i, ...o) => o.slice(0, -1)[i % (o.length - 1)]
    });

    const typo = (html) => html.split(/(<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]+>)/).map(part =>
      part.startsWith('<') ? part : part.replace(/ ([?!:;»])/g, '&nbsp;$1').replace(/« /g, '«&nbsp;')
        .replace(/(\d) (%|€|h\b|m2|pers)/g, '$1&nbsp;$2').replace(/(\d) (\d{3})/g, '$1&nbsp;$2')).join('');

    // Assemble la page complète à partir des contenus
    const render = (template, data, icons) => {
      const occ = (data.occasions && data.occasions.liste) || [];
      const ctx = Object.assign({}, data, {
        icons,
        occasionsJson: JSON.stringify(occ.map(o => ({
          word: o.mot || '', img: img(o.photo), eyebrow: o.surtitre || '', title: inline(o.titre), text: inline(o.texte), list: (o.points || []).map(esc)
        }))).replace(/</g, '\\u003c')
      });
      return typo(Handlebars.compile(template)(ctx));
    };

    return { render, inline, paragraphs, img, toOptimize };
  };
});
