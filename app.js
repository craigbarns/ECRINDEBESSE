(() => {
  'use strict';
  const $ = (selector) => document.querySelector(selector);
  const menu = $('.menu-toggle');
  const navigation = $('#navigation');
  const closeMenu = () => {
    menu.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-label', 'Ouvrir le menu');
    navigation.classList.remove('is-open');
  };
  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    navigation.classList.toggle('is-open', open);
  });
  navigation.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
      closeMenu();
      menu.focus();
    }
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.header')) closeMenu();
  });
  window.matchMedia('(min-width:851px)').addEventListener('change', closeMenu);

  // Content is visible by default, including without JavaScript.
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.classList.add('js-reveal');
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    }), { threshold: 0.06 });
    document.querySelectorAll('.reveal').forEach(element => observer.observe(element));
  }

  const form = $('#contact-form');
  form.querySelector('[type="submit"]').disabled = false;
  const updateProfile = () => {
    const traveller = form.elements.profil.value === 'voyageur';
    $('#location-label').firstChild.textContent = traveller ? 'Où se déroule votre séjour ?' : 'Où se situe votre logement ?';
    form.elements.message.placeholder = traveller ? 'Vos dates, le nombre de voyageurs, vos petites envies…' : 'Votre logement, sa capacité, vos besoins…';
  };
  form.querySelectorAll('[name="profil"]').forEach(input => input.addEventListener('change', updateProfile));
  document.querySelectorAll('[data-profile]').forEach(link => link.addEventListener('click', () => {
    form.elements.profil.value = link.dataset.profile;
    if (link.dataset.service) form.elements.service.value = link.dataset.service;
    updateProfile();
  }));

  document.querySelectorAll('[data-dialog]').forEach(button => button.addEventListener('click', () => {
    document.getElementById(button.dataset.dialog).showModal();
  }));
  document.querySelectorAll('dialog').forEach(dialog => {
    dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {
      const bounds = dialog.getBoundingClientRect();
      if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
    });
  });

  form.addEventListener('submit', event => {
    event.preventDefault();
    for (const name of ['nom', 'message']) {
      const input = form.elements[name];
      input.setCustomValidity(input.value.trim() ? '' : 'Merci de renseigner ce champ.');
    }
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const profile = data.get('profil') === 'voyageur' ? 'Voyageur' : 'Propriétaire';
    const message = [
      'Bonjour Laetitia,', '',
      `Je suis ${profile.toLowerCase()} et je souhaite vous parler de mon projet.`, '',
      `Nom : ${data.get('nom').trim()}`,
      `E-mail : ${data.get('email').trim()}`,
      `Téléphone : ${data.get('telephone').trim() || 'Non renseigné'}`,
      `Lieu : ${data.get('lieu').trim() || 'À préciser'}`,
      `Prestation : ${data.get('service')}`, '',
      data.get('message').trim(), '',
      'Au plaisir d’échanger avec vous.'
    ].join('\n');
    $('#message-preview').value = message;
    $('#send-email').href = `mailto:contact@ecrindebesse.fr?subject=${encodeURIComponent(`Demande ${profile.toLowerCase()} — ${data.get('service')}`)}&body=${encodeURIComponent(message)}`;
    $('#copy-status').textContent = '';
    $('#request-dialog').showModal();
  });
  for (const name of ['nom', 'message']) form.elements[name].addEventListener('input', event => event.target.setCustomValidity(''));
  $('#copy-message').addEventListener('click', async () => {
    const preview = $('#message-preview');
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(preview.value);
      $('#copy-status').textContent = 'Message copié. Vous pouvez le coller dans votre e-mail.';
    } catch {
      preview.focus();
      preview.select();
      $('#copy-status').textContent = 'Le texte est sélectionné : utilisez Copier dans votre navigateur, ou Ctrl+C / ⌘C.';
    }
  });
  $('#year').textContent = new Date().getFullYear();
})();
