// Transform the original opening photograph. Never create a second image.
const sheet=document.createElement('link');sheet.rel='stylesheet';sheet.href=new URL('./opening-flight.css?v=lando-1',import.meta.url).href;document.head.append(sheet);
const css=document.createElement('link');css.rel='stylesheet';css.href=new URL('./opening-arrival.css?v=reading-1',import.meta.url).href;document.head.append(css);
const root=document.documentElement, opening=document.querySelector('#opening');
const photo=document.querySelector('.spirit-backdrop');
const story=document.querySelector('.spirit-story');
const placeholder=document.createElement('div');placeholder.className='spirit-backdrop arrival-placeholder';placeholder.setAttribute('aria-hidden','true');photo.after(placeholder);placeholder.hidden=true;
opening.classList.add('arrival-composition');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let frame=0, active=false;
const clamp=v=>Math.max(0,Math.min(1,v));
const ease=(p,a,b)=>{const t=clamp((p-a)/(b-a));return t*t*(3-2*t);};
function state(){
 const enabled=!reduced.matches&&!root.classList.contains('motion-paused');
 if(enabled!==active){
  active=enabled;root.classList.toggle('single-photo-active',active);
  if(active){placeholder.hidden=false;document.body.append(photo);}
  else{placeholder.before(photo);placeholder.hidden=true;photo.style.cssText='';story.style.opacity='';}
 }
 schedule();
}
function draw(){
 frame=0;if(!active){root.style.setProperty('--arrival-equipment',1);return;}
 const top=opening.getBoundingClientRect().top;
 const p=clamp(1-top/innerHeight);
 const contract=ease(p,.2,.78),clear=ease(p,.8,1),small=innerWidth<=760;
 Object.assign(photo.style,{position:'fixed',inset:'auto',left:`${contract*(small?14:53)}vw`,top:`${contract*(small?38:21)}vh`,width:`${100-contract*(small?28:58)}vw`,height:`${100-contract*(small?57:40)}vh`,minHeight:'0',zIndex:'6',opacity:String(1-clear),visibility:p>=1?'hidden':'visible',pointerEvents:'none'});
 photo.style.setProperty('--arrival-shade',1-contract);
 story.style.opacity=1-ease(p,0,.2);
 opening.style.setProperty('--arrival-type',ease(p,.35,.8));
 root.style.setProperty('--arrival-equipment',ease(p,.8,1));
 opening.dataset.arrival=p>=1?'Equipment':p>.2?'Original photograph framing':'Opening';
}
function schedule(){if(!frame)frame=requestAnimationFrame(draw);}
addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);
reduced.addEventListener('change',state);
new MutationObserver(state).observe(root,{attributes:true,attributeFilter:['class']});
// Re-measure after fonts and layout settle, including a restored scroll position.
const layoutObserver=new ResizeObserver(schedule);
layoutObserver.observe(story);
document.fonts.ready.then(schedule);
addEventListener('pageshow',schedule);
css.onload=schedule;state();
