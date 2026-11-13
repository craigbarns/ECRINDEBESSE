(() => {
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const header = document.querySelector('.header');
  const progress = document.querySelector('.scroll-progress');
  const parallax = document.querySelector('[data-parallax]');
  const tools = document.querySelector('.maintenance-media img');

  // Header givré, barre de progression, parallaxe
  let ticking = false;
  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 40);
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);
    if (!reduce) {
      for (const el of [parallax, tools]) {
        if (!el) continue;
        const r = el.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) continue;
        const ratio = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
        el.style.transform = `translate3d(0,${(ratio * -70).toFixed(1)}px,0)`;
      }
    }
    ticking = false;
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  // Neige qui tombe
  const startSnow = (canvas, density) => {
    if (reduce || !canvas) return;
    const ctx = canvas.getContext('2d');
    let w, h, flakes = [], running = false, raf;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const resize = () => {
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(w * h / density, 260));
      flakes = Array.from({ length: count }, () => make(true));
    };
    const make = (anywhere) => {
      const z = Math.random();
      return { x: Math.random() * w, y: anywhere ? Math.random() * h : -10, r: .6 + z * 2.6, s: .25 + z * 1.1, o: .25 + z * .6, a: Math.random() * Math.PI * 2, sw: .3 + Math.random() * .8 };
    };
    let wind = 0, windTarget = 0;
    canvas.parentElement.addEventListener('pointermove', e => { windTarget = (e.clientX / innerWidth - .5) * 1.4; });
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      wind += (windTarget - wind) * .02;
      for (const f of flakes) {
        f.a += .01 * f.sw; f.y += f.s; f.x += Math.sin(f.a) * f.sw * .6 + wind * f.s;
        if (f.y > h + 5 || f.x < -10 || f.x > w + 10) Object.assign(f, make(false), { x: Math.random() * w });
        ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${f.o})`; ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    resize(); addEventListener('resize', resize);
    new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !running) { running = true; draw(); }
      else if (!entry.isIntersecting && running) { running = false; cancelAnimationFrame(raf); }
    }).observe(canvas);
  };
  document.querySelectorAll('canvas.snow').forEach(c => startSnow(c, c.classList.contains('snow-soft') ? 14000 : 6500));

  // Occasions (contenu injecté depuis l'admin)
  const occasions = window.OCCASIONS || [];
  const tabs = [...document.querySelectorAll('[data-occasion]')];
  const panel = document.getElementById('panel-occasion');
  const copy = panel?.querySelector('.occasion-copy');
  const img = document.getElementById('occasion-img');
  const word = document.getElementById('occasion-word');
  const select = (tab, focus) => {
    const o = occasions[+tab.dataset.occasion];
    if (!o) return;
    tabs.forEach(t => { const on = t === tab; t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1; });
    panel.setAttribute('aria-labelledby', tab.id);
    if (focus) tab.focus();
    [copy, img, word].forEach(el => el.classList.add('swap'));
    setTimeout(() => {
      img.src = o.img; word.textContent = o.word;
      document.getElementById('occasion-eyebrow').textContent = o.eyebrow;
      document.getElementById('occasion-title').innerHTML = o.title;
      document.getElementById('occasion-text').innerHTML = o.text;
      document.getElementById('occasion-list').innerHTML = o.list.map(item => `<li>${item}</li>`).join('');
      img.alt = '';
      const done = () => [copy, img, word].forEach(el => el.classList.remove('swap'));
      img.complete ? requestAnimationFrame(done) : img.addEventListener('load', done, { once: true });
    }, reduce ? 0 : 320);
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(tab));
    tab.addEventListener('keydown', e => {
      const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (dir) { e.preventDefault(); select(tabs[(i + dir + tabs.length) % tabs.length], true); }
    });
  });
  // Préchargement discret des visuels d’occasion
  addEventListener('load', () => occasions.forEach(o => { const i = new Image(); i.src = o.img; }));
})();
(() => {
  // Barre d'action mobile : masquée sur le formulaire et le pied de page
  const bar = document.querySelector('.mobile-contact');
  const targets = [document.getElementById('contact'), document.querySelector('.footer')];
  const visible = new Set();
  if (bar && 'IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      entries.forEach(e => e.isIntersecting ? visible.add(e.target) : visible.delete(e.target));
      bar.classList.toggle('is-hidden', visible.size > 0);
    }, { threshold: 0.15 }).observe(targets[0]);
    targets.slice(1).forEach(t => t && new IntersectionObserver(entries => {
      entries.forEach(e => e.isIntersecting ? visible.add(e.target) : visible.delete(e.target));
      bar.classList.toggle('is-hidden', visible.size > 0);
    }, { threshold: 0.05 }).observe(t));
  }
  // Glisser du doigt entre les occasions
  const panel = document.getElementById('panel-occasion');
  const tabs = [...document.querySelectorAll('[data-occasion]')];
  if (panel && tabs.length) {
    let x0 = null, y0 = null;
    panel.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
    panel.addEventListener('touchend', e => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
      x0 = null;
      if (Math.abs(dx) < 50 || Math.abs(dy) > Math.abs(dx)) return;
      const i = tabs.findIndex(t => t.getAttribute('aria-selected') === 'true');
      tabs[(i + (dx < 0 ? 1 : -1) + tabs.length) % tabs.length].click();
    }, { passive: true });
  }
})();
