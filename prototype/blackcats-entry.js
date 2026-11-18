// Coordinate the incoming BlackCats canvas with the outgoing equipment captions.
// Lettering, panther and community timings remain owned by blackcats-motion.js.
const style=document.createElement('style');style.textContent=`
@media(prefers-reduced-motion:no-preference){
.bbc-sequence.entering-chapter .bbc-word{translate:0 calc((1 - var(--bbc-entry,1))*42px);clip-path:inset(calc((1 - var(--bbc-entry,1))*100%) 0 0 0)}
.bbc-sequence.entering-chapter .bbc-photo{scale:calc(.96 + var(--bbc-entry,1)*.04);clip-path:inset(calc((1 - var(--bbc-entry,1))*16%) 0 0 0)}
.sporting-home .arrival-composition .opening-art figcaption{opacity:calc(var(--arrival-equipment,1)*var(--equipment-exit,1))!important}
.sporting-home .arrival-composition .opening-footer{opacity:calc(var(--arrival-type,1)*var(--equipment-exit,1))!important}
}
.motion-paused .entering-chapter .bbc-word{translate:none!important;clip-path:none!important}
.motion-paused .entering-chapter .bbc-photo{scale:1!important;filter:none!important;clip-path:none!important}
.motion-paused .sporting-home .arrival-composition .opening-art figcaption,.motion-paused .sporting-home .arrival-composition .opening-footer{opacity:1!important}
.sporting-home .arrival-composition .opening-footer:focus-within{opacity:1!important}
.sports>.spirit-colophon{padding:0 0 65px}
`;document.head.append(style);
const equipment=document.querySelector('#opening');
let sequence,frame=0;
const clamp=value=>Math.max(0,Math.min(1,value));
const smooth=value=>value*value*(3-2*value);
function draw(){
 frame=0;if(!sequence)return;
 const top=sequence.getBoundingClientRect().top,vh=innerHeight;
 sequence.style.setProperty('--bbc-entry',smooth(clamp((vh-top)/(vh*.72))));
 equipment?.style.setProperty('--equipment-exit',1-smooth(clamp((vh*.9-top)/(vh*.6))));
}
function schedule(){if(!frame&&!document.hidden)frame=requestAnimationFrame(draw);}
function connect(){sequence=document.querySelector('.bbc-sequence');if(sequence){sequence.classList.add('entering-chapter');observer.disconnect();schedule();}}
const observer=new MutationObserver(connect);
const host=document.querySelector('#community');
if(host){observer.observe(host,{childList:true});connect();}
addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);addEventListener('pageshow',schedule);
document.addEventListener('visibilitychange',schedule);
