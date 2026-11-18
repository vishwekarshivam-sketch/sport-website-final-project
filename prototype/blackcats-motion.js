import { motionPreference } from './render-policy.js';
// Original scroll choreography inspired by the supplied Ottografie recording.
// No dependency on home.css, no scroll interception, no time-based animation queue.
const host = document.querySelector('#community');
if (host) init();
async function init() {
  const css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = new URL('./blackcats-motion.css?v=panther-3', import.meta.url).href;
  const loaded = new Promise((resolve, reject) => { css.onload = resolve; css.onerror = reject; });
  document.head.append(css);
  try { await loaded; } catch { return; } // Existing community section remains complete.
  const sequence = document.createElement('section');
  sequence.className = 'bbc-sequence';
  sequence.setAttribute('aria-labelledby', 'bbc-heading');
  sequence.innerHTML = `
    <div class="bbc-stage">
      <h2 class="bbc-heading" id="bbc-heading">Bombay BlackCats</h2>
      
      <div class="bbc-word" data-word="bombay" aria-hidden="true"><span class="bbc-initial">B</span><span class="bbc-tail">ombay</span></div>
      <div class="bbc-word" data-word="blackcats" aria-hidden="true"><span class="bbc-initial">B</span><span class="bbc-tail">lackCats</span></div>
      <img class="bbc-photo bbc-photo-one" src="assets/football.jpg" width="1600" height="1200" loading="lazy" alt="" aria-hidden="true">
      <img class="bbc-photo bbc-photo-two" src="assets/aquatics.jpg" width="706" height="528" loading="lazy" alt="" aria-hidden="true">
      <img class="bbc-photo bbc-photo-three" src="assets/badminton.jpg" width="1280" height="960" loading="lazy" alt="" aria-hidden="true">
      <figure class="bbc-mark"><img src="../assets/official/brand/bombay-blackcats.png" width="333" height="339" loading="eager" alt="Bombay BlackCats panther emblem"></figure>
      <div class="bbc-controls"><a href="#bbc-story">Meet the BlackCats <span aria-hidden="true">↘</span></a><button type="button" aria-pressed="false">Pause motion</button></div>
    </div>`;
  const story = host.querySelector('.community-layout');
  story.id ||= 'bbc-story';
  sequence.querySelector('a').href = `#${story.id}`;
  host.prepend(sequence);
  host.classList.add('bbc-host');
  const stage = sequence.querySelector('.bbc-stage');
  // Move the existing content into the pinned canvas; never duplicate its heading.
  const panel = document.createElement('div');
  panel.className = 'bbc-story-panel';
  for (const node of [story, host.querySelector('.community-bottom'), host.querySelector('.motto')]) {
    node.removeAttribute('data-reveal');
    panel.append(node);
  }
  stage.append(panel);
  const words = [...sequence.querySelectorAll('.bbc-word')];
  const photos = [...sequence.querySelectorAll('.bbc-photo')];
  const mark = sequence.querySelector('.bbc-mark');
  const button = sequence.querySelector('button');
  const reduced = motionPreference();
  let frame = 0, sizes = [], localPaused = false, lastProgress = 0;
  const clamp = v => Math.max(0, Math.min(1, v));
  const ease = (p, a, b) => { const v = clamp((p-a)/(b-a)); return v*v*(3-2*v); };
  const mix = (a,b,t) => a+(b-a)*t;
  function paused() { return reduced.matches || localPaused || document.documentElement.classList.contains('motion-paused'); }
  function measure() {
    sizes = words.map(word => {
      const first = word.querySelector('.bbc-initial');
      const tail = word.querySelector('.bbc-tail');
      const scale = Number(word.dataset.scale) || 1;
      const range = document.createRange();
      range.selectNodeContents(tail);
      return { first: first.getBoundingClientRect().width / scale, tail: range.getBoundingClientRect().width / scale + 2 };
    });
    schedule();
  }
  function wordPose(index, expansion, top, scale, opacity) {
    const word = words[index], size = sizes[index];
    if (!size) return;
    const width = size.first + size.tail * expansion;
    word.style.width = `${width}px`;
    const tail = word.querySelector('.bbc-tail');
    tail.style.left = `${size.first}px`;
    tail.style.width = `${size.tail * expansion}px`;
    tail.style.overflow = expansion >= .999 ? "visible" : "clip";
    word.style.top = `${top}%`;
    word.style.transform = `translate(-50%,-50%) scale(${scale})`;
    word.style.opacity = opacity;
    word.dataset.scale = scale;
  }
  function draw() {
    frame = 0;
    if (document.hidden) return;
    const still = reduced.matches, compact=innerWidth<=760||innerHeight<=600;
    // Reduced motion uses ordinary document flow; pause freezes this canvas in place.
    if (still && panel.parentElement === stage) sequence.after(panel);
    else if (!still && panel.parentElement !== stage) stage.append(panel);
    const r = sequence.getBoundingClientRect();
    const actualProgress = clamp(-r.top / Math.max(1, r.height - stage.offsetHeight));
    if (!paused()) lastProgress = actualProgress;
    const progress = paused() && !still ? lastProgress : actualProgress;
    // Preserve the original lettering duration; the extra scroll is the emblem finale.
    const letteringEnd = compact ? .58 : 180 / 360;
    const p = still ? 1 : clamp(progress / letteringEnd);
    const finale = still ? 0 : clamp((progress - letteringEnd) / (1 - letteringEnd));
    const textOpacity = 1 - ease(finale, compact?.16:.06, compact?.42:.28);
    const green = ease(finale, .08, .42);
    const zoom = ease(finale, compact?0:.22, compact?.40:.67);
    const disappear = ease(finale, compact?.54:.62, compact?.76:.78);
    const storyOpacity = still ? 1 : ease(finale, compact?.55:.72, compact?.82:.88);
    panel.style.opacity = storyOpacity;
    panel.style.transform = still ? 'none' : `translateY(${(1-storyOpacity)*18}px)`;
    panel.inert = storyOpacity < .05;
    panel.setAttribute('aria-hidden', String(storyOpacity < .05));
    const expand = ease(p,.07,.25);
    const handoff = ease(p,.32,.46);
    const second = ease(p,.48,.66);
    const join = ease(p,.69,.86);
    const halfGap = parseFloat(getComputedStyle(words[0]).fontSize) * .78 * .46 / stage.offsetHeight * 100;
    wordPose(0, mix(expand*(1-handoff),1,join), mix(mix(50,35,handoff),48-halfGap,join), mix(1,.78,join), textOpacity);
    wordPose(1,second,mix(59,48+halfGap,join),mix(1,.78,join),ease(p,.36,.46)*textOpacity);
    photos.forEach((photo,i) => {
      const fade = (1-ease(p,.7,.85));
      photo.style.opacity = still ? '0' : String(fade);
      const distance = (p-.15)*[110,-90,130][i];
      photo.style.transform = `translate3d(0,${distance}px,0) scale(${1-p*.07})`;
    });
    const baseWidth = innerHeight <= 560 && innerWidth > 760 ? 55 : innerWidth <= 760 ? 80 : 92;
    const heroWidth = Math.min(innerWidth * .67, stage.offsetHeight * .62, 500);
    mark.style.opacity = ease(p,.8,.93) * (1-disappear);
    mark.style.width = `${mix(baseWidth, heroWidth, zoom)}px`;
    mark.style.top = `${mix(76,50,zoom)}%`;
    mark.style.transform = `translate(-50%,calc(-50% + ${(1-ease(p,.8,.93))*24}px))`;
    // Cover the ivory with the exact community green, without introducing another logo.
    stage.style.setProperty('--bbc-green', green);
    stage.style.setProperty('--bbc-controls-opacity', textOpacity);
    sequence.querySelector('.bbc-controls').style.pointerEvents = textOpacity < .01 ? 'none' : '';
    stage.style.color = green > .5 ? 'var(--paper)' : 'var(--ink)';
    sequence.dataset.phase = finale > .77 ? 'Community' : finale > .62 ? 'Emblem exit' : finale > .22 ? 'Emblem' : p < .32 ? 'Bombay' : p < .69 ? 'BlackCats' : 'Together';
  }
  function schedule() { if (!frame && !document.hidden) frame = requestAnimationFrame(draw); }
  function state() {
    sequence.classList.toggle('is-static',reduced.matches);
    // Preserve scroll geometry when paused to avoid moving the reader's position.
    button.disabled = reduced.matches;
    button.setAttribute('aria-pressed', String(paused()));
    button.textContent = reduced.matches ? 'Reduced motion' : paused() ? 'Resume motion' : 'Pause motion';
    schedule();
  }
  sequence.querySelector('a').addEventListener('click', event => {
    if (reduced.matches) return;
    event.preventDefault();
    lastProgress = 1;
    const top = sequence.getBoundingClientRect().top + scrollY + sequence.offsetHeight - stage.offsetHeight;
    window.scrollTo({top, behavior: paused() ? 'instant' : 'smooth'});
    schedule();
  });
  button.addEventListener('click', () => {
    const global = document.querySelector('#opening-motion');
    if (global && !global.disabled) global.click();
    else { localPaused = !localPaused; state(); }
  });
  new MutationObserver(state).observe(document.documentElement, { attributes:true, attributeFilter:['class'] });
  reduced.addEventListener('change', state);
  addEventListener('scroll', schedule, { passive:true });
  addEventListener('resize', measure, { passive:true });
  addEventListener('pageshow', schedule);
  document.addEventListener('visibilitychange', schedule);
  document.fonts.ready.then(measure);
  new ResizeObserver(measure).observe(stage);
  // Measure complete words before applying masks, then opt into sticky behavior.
  measure();
  sequence.classList.add('is-animated');
  state();
}
