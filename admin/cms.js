/* Espace d'administration Écrin de Besse : aperçu en direct, liens utiles, mode d'emploi */
(function () {
  // Après une invitation ou une récupération de mot de passe, revenir sur l'admin une fois connecté
  if (window.netlifyIdentity) {
    window.netlifyIdentity.on('init', (user) => {
      if (!user) window.netlifyIdentity.on('login', () => { document.location.href = '/admin/'; });
    });
  }

  const h = window.h, createClass = window.createClass;
  const SECTIONS = { accueil: '.hero', proprietaires: '#proprietaires', voyageurs: '#voyageurs', occasions: '#occasions',
    entretien: '#entretien', sancy: '#sancy', histoire: '#histoire', etapes: '.process', faq: '.faq', tarifs: '#tarifs',
    contact: '#contact', reglages: '.hero' };

  // ---------- Aperçu en direct : la vraie page, avec les modifications en cours ----------
  let bundle = null;
  const ready = fetch('/admin/preview/bundle.json', { cache: 'no-store' }).then(r => r.json()).then(b => { bundle = b; }).catch(() => {});

  const withAssets = (value, getAsset) => {
    if (Array.isArray(value)) return value.map(v => withAssets(v, getAsset));
    if (value && typeof value === 'object') { const o = {}; for (const k in value) o[k] = withAssets(value[k], getAsset); return o; }
    if (typeof value === 'string' && /^\/?assets\/uploads\//.test(value)) {
      try { const a = getAsset(value); return a ? String(a) : value; } catch (e) { return value; }
    }
    return value;
  };

  const Preview = createClass({
    getInitialState() { return { loaded: !!bundle }; },
    componentDidMount() {
      if (!bundle) ready.then(() => this.setState({ loaded: true }));
      this.scrollTimer = setTimeout(() => this.scrollToSection(), 400);
    },
    componentWillUnmount() { clearTimeout(this.scrollTimer); },
    scrollToSection() {
      const doc = this.props.document; if (!doc) return;
      const name = this.props.entry.get('slug');
      const el = doc.querySelector(SECTIONS[name] || '.hero');
      if (el) el.scrollIntoView({ block: 'start' });
    },
    render() {
      if (!bundle) return h('p', { style: { fontFamily: 'sans-serif', padding: '40px', color: '#63685e' } }, 'Chargement de l’aperçu…');
      const name = this.props.entry.get('slug');
      const data = Object.assign({}, bundle.data);
      data[name] = withAssets(this.props.entry.get('data').toJS(), this.props.getAsset);
      let html = '';
      try {
        const { render } = window.EcrinHelpers(window.Handlebars, { keepUploads: true });
        html = render(bundle.template, data, bundle.icons);
      } catch (e) { return h('p', { style: { padding: '40px' } }, 'Aperçu indisponible : ' + e.message); }
      const body = (html.split(/<body[^>]*>/)[1] || html).split('</body>')[0].replace(/<script[\s\S]*?<\/script>/g, '');
      return h('div', { className: 'ecrin-preview', dangerouslySetInnerHTML: { __html: body } });
    }
  });

  CMS.registerPreviewStyle('/styles.css');
  CMS.registerPreviewStyle('/upgrade.css');
  CMS.registerPreviewStyle('/admin/preview.css');
  Object.keys(SECTIONS).forEach(name => CMS.registerPreviewTemplate(name, Preview));

  // ---------- Liens utiles dans la barre du haut ----------
  const addLinks = () => {
    const bar = document.querySelector('[class*="AppHeaderActions"]');
    if (!bar || bar.querySelector('.eb-links')) return;
    const box = document.createElement('div');
    box.className = 'eb-links';
    box.innerHTML = '<a href="/admin/guide.html" target="_blank" rel="noopener">📖 Mode d’emploi</a>' +
      '<a href="https://www.ecrindebesse.fr" target="_blank" rel="noopener" class="eb-site">Voir mon site ↗</a>';
    bar.prepend(box);
  };
  new MutationObserver(addLinks).observe(document.documentElement, { childList: true, subtree: true });

  CMS.init();
})();
