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
      pick: (i, ...o) => o.slice(0, -1)[i % (o.length - 1)],
      lt: (a, b) => a < b
    });
    Object.entries(opts.partials || {}).forEach(([name, tpl]) => Handlebars.registerPartial(name, tpl));

    const typo = (html) => html.split(/(<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]+>)/).map(part =>
      part.startsWith('<') ? part : part.replace(/ ([?!:;»])/g, '&nbsp;$1').replace(/« /g, '«&nbsp;')
        .replace(/(\d) (%|€|h\b|m2|pers)/g, '$1&nbsp;$2').replace(/(\d) (\d{3})/g, '$1&nbsp;$2')).join('');

    const SITE = opts.siteUrl || 'https://ecrindebesse.fr';
    const strip = (s) => String(s || '').replace(/\*/g, '').replace(/\s*\n\s*/g, ' ').trim();
    const OFFICIEL = { 'Besse': 'Besse-et-Saint-Anastaise', 'Lac Chambon': 'Chambon-sur-Lac' };

    // Données structurées (Google et moteurs de réponse IA)
    const jsonld = (data) => {
      const r = data.reglages || {}, faq = (data.faq && data.faq.questions) || [];
      const lieux = (data.sancy && data.sancy.lieux) || [];
      const region = { '@type': 'AdministrativeArea', name: 'Puy-de-Dôme, Auvergne' };
      const areas = [{ '@type': 'AdministrativeArea', name: 'Massif du Sancy' }].concat(lieux.map(l => (
        l === 'Super-Besse' ? { '@type': 'Place', name: 'Super-Besse (station de ski)', containedInPlace: { '@type': 'City', name: 'Besse-et-Saint-Anastaise' } }
          : { '@type': 'City', name: OFFICIEL[l] || l, containedInPlace: region })));
      const offers = ((data.tarifs && data.tarifs.prestations) || []).map(p => {
        const o = { '@type': 'Offer', itemOffered: { '@type': 'Service', name: strip(p.nom), description: strip(p.detail) } };
        const m = String(p.prix || '').replace(/\s/g, '').match(/^(\d+(?:[.,]\d+)?)€$/);
        if (m) o.priceSpecification = Object.assign({ '@type': 'PriceSpecification', priceCurrency: 'EUR' },
          /d[eè]s|partir/i.test(p.prefixe || '') ? { minPrice: +m[1].replace(',', '.') } : { price: +m[1].replace(',', '.') });
        return o;
      });
      const tel = String(r.telephone || '').replace(/[^\d]/g, '');
      const graph = [
        { '@type': 'LocalBusiness', '@id': SITE + '/#conciergerie', name: 'Écrin de Besse', alternateName: 'Écrin de Besse Conciergerie',
          description: strip(r.seo_description), url: SITE + '/', logo: SITE + '/assets/sceau-vert.png', image: SITE + '/assets/og-image.jpg',
          telephone: tel.startsWith('0') ? '+33' + tel.slice(1) : tel, email: r.email, priceRange: '€€', currenciesAccepted: 'EUR',
          founder: { '@type': 'Person', name: 'Laetitia Cayla' }, areaServed: areas, knowsLanguage: 'fr',
          slogan: strip(data.contact && data.contact.pied_slogan),
          hasOfferCatalog: { '@type': 'OfferCatalog', name: 'Prestations de conciergerie et de location saisonnière', itemListElement: offers } },
        { '@type': 'WebSite', '@id': SITE + '/#site', url: SITE + '/', name: 'Écrin de Besse', inLanguage: 'fr-FR', publisher: { '@id': SITE + '/#conciergerie' } }
      ];
      if (faq.length) graph.push({ '@type': 'FAQPage', '@id': SITE + '/#faq', mainEntity: faq.map(q => ({
        '@type': 'Question', name: strip(q.question), acceptedAnswer: { '@type': 'Answer', text: strip(q.reponse) } })) });
      return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c');
    };

    const zonesOf = (data) => (data.zones || []).slice().sort((a, b) => (a.ordre || 99) - (b.ordre || 99));

    // Page d'un secteur (référencement local)
    const renderZone = (template, data, icons, zone) => {
      const zones = zonesOf(data);
      const lieux = (zone.lieux || []).map(l => ({ '@type': 'City', name: OFFICIEL[l] || l }));
      const url = SITE + '/' + zone.slug + '/';
      const graph = [
        { '@type': 'Service', '@id': url + '#service', name: strip(zone.surtitre).toLowerCase().replace(/^./, c => c.toUpperCase()),
          serviceType: 'Conciergerie de location saisonnière', description: strip(zone.seo_description), url,
          provider: { '@type': 'LocalBusiness', '@id': SITE + '/#conciergerie', name: 'Écrin de Besse', url: SITE + '/' }, areaServed: lieux },
        { '@type': 'BreadcrumbList', itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE + '/' },
          { '@type': 'ListItem', position: 2, name: strip(zone.lien), item: url }] }
      ];
      if ((zone.faq || []).length) graph.push({ '@type': 'FAQPage', mainEntity: zone.faq.map(q => ({
        '@type': 'Question', name: strip(q.question), acceptedAnswer: { '@type': 'Answer', text: strip(q.reponse) } })) });
      const ctx = Object.assign({}, data, { icons, site_url: SITE, base: '/', zone, zones,
        others: zones.filter(z => z.slug !== zone.slug),
        jsonld: JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c') });
      return typo(Handlebars.compile(template)(ctx));
    };

    // Assemble la page complète à partir des contenus
    const render = (template, data, icons) => {
      const occ = (data.occasions && data.occasions.liste) || [];
      const ctx = Object.assign({}, data, {
        icons, site_url: SITE, base: '', zones: zonesOf(data), jsonld: jsonld(data),
        occasionsJson: JSON.stringify(occ.map(o => ({
          word: o.mot || '', img: img(o.photo), eyebrow: o.surtitre || '', title: inline(o.titre), text: inline(o.texte), list: (o.points || []).map(esc)
        }))).replace(/</g, '\\u003c')
      });
      return typo(Handlebars.compile(template)(ctx));
    };

    return { render, renderZone, inline, paragraphs, img, toOptimize, strip, SITE };
  };
});
