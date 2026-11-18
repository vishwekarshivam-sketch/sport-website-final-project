/* The Assembly. Native document, disclosures and links remain the foundation. */
(() => {
  'use strict';
  const root = document.documentElement;
  const abort = new AbortController();
  const signal = abort.signal;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const short = matchMedia('(max-height: 550px) and (min-width: 600px)');
  const opening = document.querySelector('.council-opening');
  const assembly = document.querySelector('.assembly');
  const dialog = document.querySelector('.find-dialog');
  const search = document.querySelector('#people-search');
  const results = [...document.querySelectorAll('.find-result')];
  const records = [...document.querySelectorAll('.secretary')];
  const animations = new Set();
  const seen = new WeakSet();
  const initialHash = !!location.hash;
  let opener, resultNavigation = false, frame = 0, openingVisible = true, departed = false, arrival;
  const state = {frames: 0, progress: 0, activeSecretary: '', reduced: reduced.matches, disposed: false};

  const animate = (el, keyframes, options) => {
    if (!el || reduced.matches || short.matches || document.hidden || departed || !el.animate) return;
    const animation = el.animate(keyframes, options);
    animations.add(animation);
    animation.finished.catch(() => {}).finally(() => animations.delete(animation));
    return animation;
  };
  const cancelAnimations = () => { animations.forEach(a => a.cancel()); animations.clear(); };

  // Photo failures reveal a labelled identity panel, never a substituted face.
  document.querySelectorAll('.person-photo').forEach(img => {
    const fail = () => {
      img.closest('.portrait')?.classList.remove('has-photo');
      img.hidden = true;
      img.closest('.photo-inner')?.getAnimations().forEach(a => a.cancel());
    };
    img.addEventListener('error', fail, {signal});
    if (img.complete && !img.naturalWidth) fail();
  });

  const draw = () => {
    frame = 0;
    if (departed || document.hidden || dialog.open) return;
    const chapter = document.elementFromPoint(20, Math.min(220, innerHeight * .35))?.closest('.chapter');
    if (chapter) document.querySelectorAll('.chapter-bar nav>a').forEach(link => {
      if (link.hash === '#' + chapter.id) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    if (!openingVisible && scrollY > opening.offsetHeight + 100) return;
    const p = reduced.matches || short.matches ? 1 : Math.min(1, Math.max(0, scrollY / Math.min(520, innerHeight * .65)));
    const s = p * p * (3 - 2 * p);
    root.style.setProperty('--fold', String(s));
    state.progress = s;
    state.frames++;
  };
  const requestDraw = () => {
    if (!frame && !departed && !document.hidden && !dialog.open) frame = requestAnimationFrame(draw);
  };
  const onScroll = () => { arrival?.cancel(); requestDraw(); };
  window.addEventListener('scroll', onScroll, {passive: true, signal});
  window.addEventListener('resize', () => { cancelAnimations(); requestDraw(); }, {passive: true, signal});
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(frame); frame = 0; cancelAnimations(); }
    else requestDraw();
  }, {signal});
  const updatePreference = () => { state.reduced = reduced.matches; cancelAnimations(); requestDraw(); };
  reduced.addEventListener('change', updatePreference, {signal});
  short.addEventListener('change', updatePreference, {signal});

  const targetFromHash = () => {
    let id;
    try { id = decodeURIComponent(location.hash.slice(1)); } catch { return null; }
    return id ? document.getElementById(id) : null;
  };
  const openTarget = target => {
    const record = target?.matches('.secretary') ? target : target?.closest('.secretary');
    if (record) {
      records.forEach(r => { if (r !== record) r.open = false; });
      record.open = true;
      state.activeSecretary = record.dataset.person;
    }
  };
  const resolveHash = () => { const target = targetFromHash(); openTarget(target); requestDraw(); };
  window.addEventListener('hashchange', resolveHash, {signal});
  resolveHash();
  if (initialHash) requestAnimationFrame(() => targetFromHash()?.scrollIntoView({behavior: 'instant', block: 'start'}));

  records.forEach(record => {
    record.addEventListener('toggle', () => {
      record.querySelector('summary').setAttribute('aria-expanded', String(record.open));
      if (!record.open) return;
      state.activeSecretary = record.dataset.person;
      records.forEach(r => { if (r !== record && r.open) r.open = false; });
      animate(record.querySelector('.secretary-detail .portrait'), [{opacity: .5, transform: 'translateY(10px)'}, {opacity: 1, transform: 'translateY(0)'}], {duration: 280, easing: 'cubic-bezier(.2,.7,.3,1)'});
    }, {signal});
    record.querySelector('summary').addEventListener('click', () => {
      if (!record.open) history.replaceState(null, '', '#' + record.id);
    }, {signal});
  });
  state.activeSecretary = document.querySelector('.secretary[open]')?.dataset.person || '';

  const normalise = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const filter = () => {
    const words = normalise(search.value).split(/\s+/).filter(Boolean);
    let count = 0;
    results.forEach(result => {
      result.hidden = !words.every(word => normalise(result.dataset.search).includes(word));
      if (!result.hidden) count++;
    });
    document.querySelector('#people-count').textContent = `${count} ${count === 1 ? 'person' : 'people'}`;
    document.querySelector('#people-empty').hidden = count !== 0;
  };
  search.addEventListener('input', filter, {signal});
  document.querySelector('#find-reset').addEventListener('click', () => { search.value = ''; filter(); search.focus(); }, {signal});
  document.querySelectorAll('[data-find-open]').forEach(button => {
    button.hidden = false;
    button.addEventListener('click', () => {
      opener = button;
      search.value = '';
      filter();
      cancelAnimations();
      cancelAnimationFrame(frame); frame = 0;
      dialog.showModal();
      root.classList.add('dialog-open');
      search.focus();
      animate(dialog, [{opacity: .6, transform: 'translateY(10px)'}, {opacity: 1, transform: 'translateY(0)'}], {duration: 160, easing: 'ease-out'});
    }, {signal});
  });
  const closeFind = () => dialog.close();
  document.querySelector('[data-find-close]').addEventListener('click', closeFind, {signal});
  dialog.addEventListener('close', () => {
    root.classList.remove('dialog-open');
    if (!resultNavigation) opener?.focus({preventScroll: true});
    resultNavigation = false;
    requestDraw();
  }, {signal});
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) closeFind();
  }, {signal});
  results.forEach(result => result.addEventListener('click', event => {
    const target = document.getElementById(result.hash.slice(1));
    if (!target) return;
    event.preventDefault();
    resultNavigation = true;
    closeFind();
    openTarget(target);
    history.pushState(null, '', result.hash);
    target.scrollIntoView({behavior: reduced.matches ? 'instant' : 'smooth', block: 'start'});
    const focus = target.matches('.secretary') ? target.querySelector('summary') : target.matches('h2') ? target : target.querySelector('h3');
    focus?.focus({preventScroll: true});
  }, {signal}));

  // Finite shutters are unobserved once settled and never conceal captions.
  let entryObserver, openingObserver, chapterObserver;
  if ('IntersectionObserver' in window) {
    openingObserver = new IntersectionObserver(entries => {
      openingVisible = entries[0].isIntersecting;
      if (openingVisible) requestDraw();
    });
    openingObserver.observe(opening);
    entryObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      entryObserver.unobserve(el);
      if (seen.has(el)) return;
      seen.add(el);
      if (initialHash || reduced.matches || short.matches || dialog.open) return;
      const target = el.querySelector('.has-photo .photo-inner');
      const delay = Math.min(195, parseFloat(getComputedStyle(el).getPropertyValue('--entry-delay')) || 0);
      animate(target, [{clipPath: 'inset(0 0 100% 0)'}, {clipPath: 'inset(0 0 0% 0)'}], {duration: innerWidth < 600 ? 560 : el.classList.contains('lead-portrait') ? 720 : 640, delay, easing: 'cubic-bezier(.22,.61,.36,1)'});
      const caption = el.nextElementSibling;
      if (caption?.classList.contains('member-caption')) animate(caption, [{opacity: .65, transform: 'translateY(8px)'}, {opacity: 1, transform: 'translateY(0)'}], {duration: 400, delay: delay + (innerWidth < 600 ? 100 : 140), easing: 'ease-out'});
    }), {rootMargin: '0px 0px -12% 0px', threshold: .01});
    document.querySelectorAll('[data-entry]').forEach(el => entryObserver.observe(el));
    chapterObserver = new IntersectionObserver(requestDraw, {rootMargin:'-65px 0px -48% 0px'});
    document.querySelectorAll('.chapter').forEach(el => chapterObserver.observe(el));
    const branch = document.querySelector('.web-branch');
    const branchObserver = new IntersectionObserver(entries => {
      if (!entries.some(e => e.isIntersecting)) return;
      if (!initialHash) animate(branch, [{transform:'scaleX(0)'}, {transform:'scaleX(1)'}], {duration:600, easing:'cubic-bezier(.22,.61,.36,1)'});
      branchObserver.disconnect();
    }, {rootMargin:'0px 0px -25% 0px'});
    branchObserver.observe(branch);
    signal.addEventListener('abort', () => branchObserver.disconnect(), {once:true});
  }
  if (!initialHash && scrollY < 4) arrival = animate(assembly, [{opacity: .65, transform: 'translateY(24px)'}, {opacity: 1, transform: 'translateY(0)'}], {duration: 700, easing: 'cubic-bezier(.22,.61,.36,1)'});
  requestDraw();
  window.addEventListener('pagehide', event => {
    cancelAnimationFrame(frame); frame = 0; cancelAnimations();
    if (!event.persisted) {
      departed = true; state.disposed = true;
      entryObserver?.disconnect(); openingObserver?.disconnect(); chapterObserver?.disconnect();
      abort.abort();
    }
  }, {signal});
  window.addEventListener('pageshow', () => { resolveHash(); requestDraw(); }, {signal});
  Object.defineProperty(window, 'councilExperience', {value: {state}, configurable: true});
})();
