// Curved chapter handoff, using native scrolling and the existing section boundary.
// Kept separate from typography and from the B/B letter choreography.
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let sequence, stage, frame = 0;
const style = document.createElement('style');
style.textContent = `
.bbc-sequence.has-curved-handoff{background:transparent}
.has-curved-handoff .bbc-stage{background:var(--paper)}
.has-curved-handoff .bbc-stage{clip-path:none;border-radius:0 0 50% 50% / 0 0 var(--handoff-curve,0px) var(--handoff-curve,0px)}
.has-curved-handoff .bbc-controls{bottom:calc(5% + var(--handoff-curve,0px))}
@media(prefers-reduced-motion:reduce){.has-curved-handoff .bbc-stage{border-radius:0}}
`;
document.head.append(style);
const clamp = v => Math.max(0,Math.min(1,v));
function draw() {
  frame = 0;
  if (!sequence || document.hidden) return;
  const quiet = reduced.matches || document.documentElement.classList.contains('motion-paused');
  const bottom = sequence.getBoundingClientRect().bottom;
  const height = stage.offsetHeight;
  // Start only after the full name has settled; the curved ivory edge then
  // travels upward with the document, exposing the green community chapter.
  const progress = clamp((height * 1.08 - bottom) / (height * 1.08));
  const curve = quiet ? 0 : Math.sin(progress*Math.PI) * Math.min(innerWidth*.14,height*.22);
  stage.style.setProperty('--handoff-curve',`${curve.toFixed(2)}px`);
}
function schedule(){if(!frame&&!document.hidden)frame=requestAnimationFrame(draw);}
function connect(){
  sequence=document.querySelector('.bbc-sequence');
  stage=sequence?.querySelector('.bbc-stage');
  if(!stage)return;
  sequence.classList.add('has-curved-handoff');
  observer.disconnect();schedule();
}
const observer=new MutationObserver(connect);
observer.observe(document.querySelector('#community'),{childList:true});
connect();
addEventListener('scroll',schedule,{passive:true});
addEventListener('resize',schedule,{passive:true});
addEventListener('pageshow',schedule);
reduced.addEventListener('change',schedule);
document.addEventListener('visibilitychange',schedule);
new MutationObserver(schedule).observe(document.documentElement,{attributes:true,attributeFilter:['class']});
