/* Theme: light (black and red) by default, manual override persisted */
(function () {
  const saved = localStorage.getItem('zinari-theme');
  setTheme(saved || 'light');
})();
function setTheme(mode) {
  document.documentElement.setAttribute('data-theme', mode);
  const icon = document.getElementById('themeIcon');
  if (icon) icon.className = mode === 'dark' ? 'ph ph-sun' : 'ph ph-moon';
}
function toggleTheme() {
  const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  setTheme(next);
  localStorage.setItem('zinari-theme', next);
}

function toggleMenu() {
  document.getElementById('mobileMenu').classList.toggle('open');
}
document.querySelectorAll('.mobile-menu a').forEach(a =>
  a.addEventListener('click', () => document.getElementById('mobileMenu').classList.remove('open')));

/* Hero showcase: auto-rotating produce poster. The hero retints per item.
   Colors are predefined per produce (not extracted from images) so every
   bg/ink pair holds WCAG AA contrast. Reduced motion: no autoplay, instant swaps. */
(function () {
  const PRODUCE = [
    { name: 'Avocados',    origin: 'Export grade',       bg: '#274D25', ink: '#F2F0E6', img: 'https://images.unsplash.com/photo-1519162808019-7de1683fa2ad?auto=format&fit=crop&w=800&h=800&q=80' },
    { name: 'Oranges',     origin: 'Meru and Kisii',     bg: '#A34E0F', ink: '#FFF3E4', img: 'https://images.unsplash.com/photo-1557800636-894a64c1696f?auto=format&fit=crop&w=800&h=800&q=80' },
    { name: 'Tomatoes',    origin: 'Thika and Mwea',     bg: '#93301C', ink: '#FFEFE8', img: 'https://images.unsplash.com/photo-1582284540020-8acbe03f4924?auto=format&fit=crop&w=800&h=800&q=80' },
    { name: 'Bananas',     origin: 'Multiple varieties', bg: '#E3B23C', ink: '#241903', img: 'https://images.unsplash.com/photo-1587132137056-bfbf0166836e?auto=format&fit=crop&w=800&h=800&q=80' },
    { name: 'Sukuma wiki', origin: 'Rift Valley',        bg: '#3E6B2A', ink: '#F2F5E9', img: 'https://images.unsplash.com/photo-1624300477446-d379e923eca8?auto=format&fit=crop&w=800&h=800&q=80' },
    { name: 'Plantains',   origin: 'Western Kenya',      bg: '#7A6E1E', ink: '#FCFAEC', img: 'https://images.unsplash.com/photo-1617631716600-6a454b430367?auto=format&fit=crop&w=800&h=800&q=80' }
  ];
  const hero = document.querySelector('.hero');
  const stage = document.getElementById('heroStage');
  if (!hero || !stage) return;
  const word = document.getElementById('heroWord');
  const img = document.getElementById('heroImg');
  const nameEl = document.getElementById('heroName');
  const originEl = document.getElementById('heroOrigin');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let idx = 0, timer = null, paused = false;

  PRODUCE.forEach(p => { const pre = new Image(); pre.src = p.img; });

  /* Scale the display word so any name fills the stage width without clipping */
  function fitWord() {
    const w = stage.clientWidth;
    const chars = Math.max(PRODUCE[idx].name.length, 4);
    word.style.fontSize = Math.min(w * 0.94 / (chars * 0.56), w * 0.3, 300) + 'px';
  }

  function setContent(p) {
    word.textContent = p.name;
    img.src = p.img;
    img.alt = 'Fresh ' + p.name.toLowerCase() + ' from Kenyan farms';
    fitWord();
  }

  function apply(i, instant) {
    idx = (i + PRODUCE.length) % PRODUCE.length;
    const p = PRODUCE[idx];
    hero.style.setProperty('--p-bg', p.bg);
    hero.style.setProperty('--p-ink', p.ink);
    nameEl.textContent = p.name;
    originEl.textContent = p.origin;
    if (reduce || instant) {
      setContent(p);
    } else {
      stage.classList.add('swapping');
      setTimeout(() => { setContent(p); stage.classList.remove('swapping'); }, 350);
    }
  }

  function start() { if (reduce || paused) return; stop(); timer = setInterval(() => apply(idx + 1), 5000); }
  function stop() { clearInterval(timer); timer = null; }

  hero.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') { apply(idx + 1); start(); }
    if (e.key === 'ArrowLeft') { apply(idx - 1); start(); }
  });
  hero.addEventListener('mouseenter', () => { paused = true; stop(); });
  hero.addEventListener('mouseleave', () => { paused = false; start(); });
  hero.addEventListener('focusin', () => { paused = true; stop(); });
  hero.addEventListener('focusout', e => {
    if (!hero.contains(e.relatedTarget)) { paused = false; start(); }
  });
  document.addEventListener('visibilitychange', () => { document.hidden ? stop() : start(); });
  window.addEventListener('resize', fitWord);

  apply(0, true);
  start();
})();

/* Scroll reveals: IntersectionObserver, no scroll listeners */
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.15 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
})();

/* Active nav state */
(function () {
  const links = document.querySelectorAll('.nav-links a');
  const map = {};
  links.forEach(l => { map[l.getAttribute('href').slice(1)] = l; });
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting && map[e.target.id]) {
        links.forEach(l => l.classList.remove('active'));
        map[e.target.id].classList.add('active');
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  document.querySelectorAll('section[id], header[id]').forEach(s => io.observe(s));
})();

/* Contact form: inline validation, then WhatsApp handoff (preserved behavior) */
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.remove('show'), 3200);
}
function handleContact(e) {
  e.preventDefault();
  const name = document.getElementById('c-name').value.trim();
  const contact = document.getElementById('c-contact').value.trim();
  const interest = document.getElementById('c-interest').value;
  const message = document.getElementById('c-message').value.trim();

  document.getElementById('f-name').classList.toggle('invalid', !name);
  document.getElementById('f-contact').classList.toggle('invalid', !contact);
  if (!name || !contact) return false;

  const text = ['Hello Zinari Ventures!', '', 'Name: ' + name, 'Contact: ' + contact, 'Interest: ' + interest, message ? '\n' + message : ''].join('\n');
  window.open('https://wa.me/254700000000?text=' + encodeURIComponent(text), '_blank');
  showToast('Redirecting to WhatsApp');
  return false;
}

document.getElementById('year').textContent = new Date().getFullYear();

/* Footer world clocks: live local time in key markets */
(function () {
  const els = document.querySelectorAll('.clock-time[data-tz]');
  if (!els.length) return;
  function tick() {
    els.forEach(el => {
      el.textContent = new Intl.DateTimeFormat('en-GB', {
        hour: '2-digit', minute: '2-digit', hour12: false, timeZone: el.dataset.tz
      }).format(new Date());
    });
  }
  tick();
  setInterval(tick, 30000);
})();

/* Process steps: hover (or tap) reveals the matching image in the preview panel */
(function () {
  const steps = document.querySelectorAll('#process .step[data-img]');
  const img = document.getElementById('processImg');
  if (!steps.length || !img) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  steps.forEach(s => { const pre = new Image(); pre.src = s.dataset.img; });
  function show(step) {
    steps.forEach(x => x.classList.toggle('active', x === step));
    if (img.dataset.cur === step.dataset.img) return;
    img.dataset.cur = step.dataset.img;
    if (reduce) { img.src = step.dataset.img; img.alt = step.dataset.alt || ''; return; }
    img.classList.add('swap');
    setTimeout(() => {
      img.src = step.dataset.img; img.alt = step.dataset.alt || '';
      img.classList.remove('swap');
    }, 200);
  }
  steps.forEach(s => {
    s.addEventListener('mouseenter', () => show(s));
    s.addEventListener('click', () => show(s));
  });
  show(steps[0]);
})();

/* Mobile process steps: inline image appears while the step is mid-viewport,
   disappears as it scrolls out. Desktop keeps the hover preview panel. */
(function () {
  const steps = document.querySelectorAll('#process .step[data-img]');
  if (!steps.length) return;
  steps.forEach(s => {
    const box = document.createElement('div');
    box.className = 'step-img';
    const im = document.createElement('img');
    im.src = s.dataset.img;
    im.alt = s.dataset.alt || '';
    im.loading = 'lazy';
    box.appendChild(im);
    s.lastElementChild.appendChild(box);
  });
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => e.target.classList.toggle('in-view', e.isIntersecting));
  }, { rootMargin: '-30% 0px -30% 0px', threshold: 0 });
  steps.forEach(s => io.observe(s));
})();
