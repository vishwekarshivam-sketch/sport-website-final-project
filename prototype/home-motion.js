import { quality, motionPreference, pixelRatio, rendererOptions, tuneShadows, frameBudget } from './render-policy.js';
import { createSportFlight } from './sport-flight.js?v=spin-1';
import { initEditorialMotion } from './editorial-motion.js?v=20261022-editorial-1';
import { openingSports, selectOpeningSport, sportFallback, createSportObjects } from './opening-sports.js?v=20261022-bat-mm-1';

// Original procedural sporting still life. Uses the locally vendored MIT Three.js.
const root = document.documentElement;
const homeState={ready:false,frames:0,progress:0};window.homeExperience={state:homeState};
const preference = motionPreference();
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
const sequence = document.querySelector('.opening-sequence');
const art = document.querySelector('.opening-art');
const mount = document.querySelector('#opening-canvas');
const pause = document.querySelector('#opening-motion');
// The optional named preview is deterministic; ordinary visits use a per-tab seven-sport cycle.
let storage;
try { storage = sessionStorage; } catch { /* Private/restricted storage: choose randomly. */ }
const requested = new URLSearchParams(location.search).get('sport');
const selectedSport = openingSports.find(sport => sport.id === requested) || selectOpeningSport(storage);
art.dataset.sport = selectedSport.id;
art.dataset.renderer = preference.matches ? 'fallback' : 'loading';
art.setAttribute('aria-label', selectedSport.description);

art.querySelector('.opening-fallback').innerHTML = sportFallback(selectedSport.id);

const editorialMotion = initEditorialMotion();
let paused = false;
let sceneControl;
let starting = false;
function motionEnabled() { return !paused && !preference.matches; }
function updatePreference() {
  root.classList.toggle('motion-paused', !motionEnabled());
  pause.hidden=false;pause.disabled = preference.matches;
  pause.setAttribute('aria-pressed', String(paused || preference.matches));
  pause.innerHTML = preference.matches ? 'Still view <span aria-hidden="true">○</span>' : paused ? 'Resume motion <span aria-hidden="true">▷</span>' : 'Pause motion <span aria-hidden="true">Ⅱ</span>';
  sceneControl?.update();
  editorialMotion.update(motionEnabled());
  if (motionEnabled() && !sceneControl && nearOpening()) startScene();
}
pause.addEventListener('click', () => { paused = !paused; updatePreference(); });
preference.addEventListener('change', updatePreference);
const reveal = new IntersectionObserver(entries => {
  entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); reveal.unobserve(entry.target); } });
}, { threshold: .09 });
document.querySelectorAll('[data-reveal]').forEach(el => reveal.observe(el));
root.classList.add('motion-ready');
updatePreference();
function nearOpening(){const r=sequence.getBoundingClientRect();return document.readyState==='complete'&&r.top<innerHeight+300&&r.bottom>0;}
new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)&&nearOpening()&&motionEnabled()&&!sceneControl)startScene();},{rootMargin:'300px'}).observe(sequence);
addEventListener('load',()=>{if(nearOpening()&&motionEnabled()&&!sceneControl)startScene();},{once:true});
async function startScene() {
  if (starting) return;
  starting = true;
  let renderer;
  try {
    const THREE = await import('./vendor/three.module.js');
    if(!motionEnabled()||!nearOpening())return;
    renderer = new THREE.WebGLRenderer(rendererOptions({alpha: true}));
    renderer.setPixelRatio(pixelRatio(innerWidth,innerHeight));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    renderer.setClearColor(0x000000, 0);
    const canvas = renderer.domElement;
    canvas.setAttribute('aria-hidden', 'true');
    canvas.id = 'opening-flight-canvas';
    Object.assign(canvas.style,{position:'fixed',inset:'0',width:'100vw',height:'100vh',pointerEvents:'none',zIndex:'25',visibility:'hidden'});
    document.body.append(canvas);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, .1, 80);
    camera.position.set(0, .15, 10); camera.lookAt(0, 0, 0);
    scene.add(new THREE.HemisphereLight(0xfff9e9, 0x647a59, 2.6));
    const key = new THREE.DirectionalLight(0xfff3d6, 4.2); key.position.set(-3, 5, 6); scene.add(key);
    const fill = new THREE.DirectionalLight(0xd9eadc, 2); fill.position.set(4, 1, -2); scene.add(fill);
    const assembly = new THREE.Group(); scene.add(assembly);
    const objects = createSportObjects(THREE, selectedSport.id);
    assembly.add(objects.main, objects.satellite);
    const flight = createSportFlight(THREE, objects, selectedSport.id);
    canvas.dataset.sport = selectedSport.id;
    // Soft contact shadows: small original radial texture, no expensive shadow maps.
    const shadowSource = document.createElement('canvas'); shadowSource.width = shadowSource.height = 128;
    const ctx = shadowSource.getContext('2d');
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 62);
    gradient.addColorStop(0, '#173f3455'); gradient.addColorStop(.4, '#173f3420'); gradient.addColorStop(1, '#173f3400');
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, 128, 128);
    const shadowTexture = new THREE.CanvasTexture(shadowSource);
    function shadow(width, height, x, y) {
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false }));
      mesh.position.set(x, y, -.7); scene.add(mesh); return mesh;
    }
    const mainShadow = shadow(3.5, .55, -.1, objects.ballOnly ? -1.75 : -2.27); const ballShadow = shadow(1.4, .3, 1.2, -2.24);
    ballShadow.visible = !objects.ballOnly;
    let visible = true, frame = 0, lost = false, current = 0, px = 0, py = 0, cx = 0, cy = 0;
    const born = performance.now();
    function progress() {
      const rect = sequence.getBoundingClientRect();
      return THREE.MathUtils.clamp(-rect.top / Math.max(1, rect.height - document.querySelector('.opening-sticky').offsetHeight + innerHeight * 1.4), 0, 1);
    }
    function draw(now) {
      frame = 0;
      if (document.hidden || lost || !motionEnabled()) return;
      if(!nearOpening()){canvas.style.visibility='hidden';return;}
      const range=sequence.getBoundingClientRect();
      canvas.style.visibility = range.top < innerHeight && range.bottom > -innerHeight*1.4 ? 'visible' : 'hidden';
      const target = progress(); current = target;
      cx += (px - cx) * .065; cy += (py - cy) * .065;
      const enter = Math.min(1, (now - born) / 1500); const eased = 1 - (1 - enter) ** 3;
      const action = flight.update(current);
      canvas.dataset.flight = action.phase;
      ballShadow.position.x = objects.satellite.position.x;
      ballShadow.material.opacity = action.shadow * .65;
      mainShadow.material.opacity = objects.ballOnly ? action.shadow : 1;
      assembly.rotation.y = 0; assembly.position.y = 0;
      // First pass: equipment follows its own section in normal document space.
      const rect = mount.getBoundingClientRect();
      const projectile = flight.projectile;
      const projectileVisible = projectile.visible;
      projectile.visible = false;
      camera.setViewOffset(rect.width,rect.height,-rect.left,-rect.top,innerWidth,innerHeight);
      renderer.autoClear = true;
      renderer.render(scene,camera);
      // Second pass: projectile has a full viewport frustum and can cross the divider.
      objects.main.visible = false; objects.satellite.visible = false;
      projectile.visible = projectileVisible;
      mainShadow.visible = ballShadow.visible = false;
      const anchorTop = Math.max(rect.top, innerWidth<=760 ? innerHeight*.3 : 10);
      camera.setViewOffset(rect.width,rect.height,-rect.left,-anchorTop,innerWidth,innerHeight);
      renderer.autoClear = false; renderer.clearDepth();
      renderer.render(scene,camera);
      objects.main.visible = true; objects.satellite.visible = true;
      mainShadow.visible = true; ballShadow.visible = !objects.ballOnly;
      canvas.dataset.pose = `${current.toFixed(3)},${cx.toFixed(3)},${cy.toFixed(3)}`;
      art.dataset.renderer = 'webgl';homeState.ready=true;homeState.frames++;homeState.progress=current;
      if (enter < 1 || Math.abs(target - current) + Math.abs(px - cx) + Math.abs(py - cy) > .0004) schedule();
    }
    function schedule() { if (!frame && !document.hidden && motionEnabled() && !lost) frame = requestAnimationFrame(draw); }
    function resize() {
      const width = mount.clientWidth, height = mount.clientHeight;
      if (!width || !height) return;
      const size = Math.max(2.7, (innerWidth <= 760 ? 2.25 : 2.15) / (width / height));
      camera.aspect = width / height;
      camera.fov = 2 * Math.atan(size / 10) * 180 / Math.PI; camera.updateProjectionMatrix();
      camera.clearViewOffset(); renderer.setPixelRatio(pixelRatio(innerWidth,innerHeight));renderer.setSize(innerWidth, innerHeight, false); schedule();
    }
    const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(mount);
    addEventListener('pagehide',e=>{cancelAnimationFrame(frame);frame=0;if(!e.persisted){resizeObserver.disconnect();scene.traverse(o=>{o.geometry?.dispose();for(const m of [o.material].flat().filter(Boolean)){for(const t of Object.values(m))if(t?.isTexture)t.dispose();m.dispose();}});renderer.dispose();canvas.remove();}});
    addEventListener('pageshow',resize);
    const sticky = document.querySelector('.opening-sticky');
    sticky.addEventListener('pointermove', event => {
      if (!finePointer.matches) return;
      const r = sticky.getBoundingClientRect(); px = (event.clientX - r.left) / r.width - .5; py = (event.clientY - r.top) / r.height - .5; schedule();
    });
    sticky.addEventListener('pointerleave', () => { px = py = 0; schedule(); });
    addEventListener('scroll', () => { const r=sequence.getBoundingClientRect(); if(r.top>=innerHeight || r.bottom<=-innerHeight*1.4)canvas.style.visibility='hidden'; schedule(); }, { passive: true });
    document.addEventListener('visibilitychange', () => { if (document.hidden) { cancelAnimationFrame(frame); frame = 0; } else schedule(); });
    canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); canvas.style.visibility='hidden'; lost = true; homeState.ready=false;art.dataset.renderer = 'fallback'; cancelAnimationFrame(frame); frame = 0; });
    canvas.addEventListener('webglcontextrestored', () => { lost = false; resize(); });
    sceneControl = { update() { mount.hidden=preference.matches;canvas.style.display=preference.matches?'none':'block';if(preference.matches||lost){homeState.ready=false;art.dataset.renderer='fallback';}else if(canvas.dataset.pose){art.dataset.renderer='webgl';homeState.ready=true;}if(!motionEnabled()){cancelAnimationFrame(frame);frame=0;}else schedule();} };
    resize(); sceneControl.update();
  } catch (error) {
    homeState.ready=false;renderer?.domElement.remove(); renderer?.dispose(); mount.replaceChildren(); art.dataset.renderer = 'fallback';
    console.warn('Sporting still life unavailable; static illustration retained.', error);
  } finally { starting = false; }
}
