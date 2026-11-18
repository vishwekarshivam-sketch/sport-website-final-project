/** Native-scroll choreography; no wheel interception, scroll replacement, or idle loop. */
export function initEditorialMotion() {
  const scene = document.querySelector('.spirit-scene');
  const photo = scene?.querySelector('.spirit-backdrop img');
  const lines = [...document.querySelectorAll('.spirit-line')];
  const cards = [...document.querySelectorAll('.sport-card')];
  const mobile = matchMedia('(max-width: 760px)');
  let enabled = true;
  let frame = 0;
  const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
  const smooth = v => v * v * (3 - 2 * v);
  const set = (el, key, value) => el.style.setProperty(key, value);

  function draw() {
    frame = 0;
    if (!enabled || document.hidden || !scene) return;
    const vh = innerHeight;
    const r = scene.getBoundingClientRect();
    if (r.bottom > 0 && r.top < vh) {
      const p = clamp(-r.top / Math.max(1, r.height - vh));
      set(photo, '--photo-drift', `${(p * 2.2).toFixed(3)}%`);
      set(photo, '--photo-scale', (1.11 - p * .055).toFixed(4));
    }
    // Each line crosses its own viewport threshold, so fast/reverse scrolling
    // always resolves to the correct pose, without a queue of timed animations.
    for (const line of lines) {
      const b = line.getBoundingClientRect();
      const p = smooth(clamp((vh * .96 - b.top) / (vh * .32)));
      set(line, '--line-rise', `${((1 - p) * 110).toFixed(2)}%`);
    }
    cards.forEach((card, index) => {
      // Measure the untransformed image layout so movement cannot feed back
      // into its own progress, which would cause jitter near a threshold.
      const offset = parseFloat(card.style.getPropertyValue('--card-drift')) || 0;
      const image = card.querySelector('.sport-image');
      const rect = image.getBoundingClientRect();
      const top = rect.top - offset;
      const p = clamp((vh - top) / (vh + rect.height));
      const reveal = smooth(clamp((vh * .99 - top) / Math.min(rect.height * .75, vh * .6)));
      const drift = mobile.matches ? 0 : (p - .5) * [32, -42, 26][index];
      set(card, '--card-drift', `${drift.toFixed(2)}px`);
      set(image, '--crop-top', `${((1 - reveal) * 9).toFixed(2)}%`);
      set(image, '--crop-bottom', `${((1 - reveal) * 38).toFixed(2)}%`);
      set(image, '--image-drift', `${((p - .5) * (mobile.matches ? 3 : 7)).toFixed(2)}%`);
      set(image, '--image-scale', (1.13 - reveal * .03).toFixed(4));
    });
  }
  function schedule() {
    if (enabled && !document.hidden && !frame) frame = requestAnimationFrame(draw);
  }
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule, { passive: true });
  addEventListener('pageshow', schedule);
  document.addEventListener('visibilitychange', schedule);
  // Font swaps and opening the directory may move section boundaries.
  const observer = new ResizeObserver(schedule);
  observer.observe(document.querySelector('main'));
  document.fonts.ready.then(schedule);
  scene?.querySelectorAll('img').forEach(img => img.addEventListener('load', schedule));
  return {
    update(active) {
      enabled = active;
      if (!enabled) { cancelAnimationFrame(frame); frame = 0; }
      else schedule();
    }
  };
}
