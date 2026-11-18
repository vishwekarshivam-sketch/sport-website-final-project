/* Shared progressive rendering policy. Hints choose a starting budget, never a GPU score. */
const reduce=matchMedia('(prefers-reduced-motion: reduce)'),connection=navigator.connection;
const touch=matchMedia('(pointer:coarse)').matches,small=Math.min(screen.width||innerWidth,screen.height||innerHeight)<800;
const lowMemory=navigator.deviceMemory>0&&navigator.deviceMemory<=4,lowCores=navigator.hardwareConcurrency>0&&navigator.hardwareConcurrency<=4;
export const quality={tier:lowMemory&&lowCores?'low':(touch&&small)||lowMemory||lowCores?'balanced':'full',get static(){return reduce.matches||!!connection?.saveData;}};
quality.lite=quality.tier!=='full';quality.maxDpr=quality.lite?1:1.5;quality.maxPixels=quality.lite?700000:2200000;quality.shadow=quality.lite?512:2048;
document.documentElement.dataset.renderQuality=quality.tier;
export function motionPreference(heavy=false){return {get matches(){return quality.static||(heavy&&quality.tier==='low');},addEventListener(type,fn){reduce.addEventListener(type,fn);connection?.addEventListener(type,fn);}};}
export function pixelRatio(w,h){return Math.min(devicePixelRatio||1,quality.maxDpr,Math.sqrt(quality.maxPixels/Math.max(1,w*h)));}
export function rendererOptions(extra={}){return {antialias:!quality.lite,powerPreference:'low-power',...extra,preserveDrawingBuffer:false};}
export function tuneShadows(scene){scene.traverse(o=>{if(o.shadow){const s=Math.min(quality.shadow,o.shadow.mapSize.x);o.shadow.mapSize.set(s,s);}});}
/* A run of expensive submitted frames exits to the existing polished poster.
   This protects interaction on weak hardware; it is not a field FPS measurement. */
export function frameBudget(fallback,limit=48){let misses=0;return function(milliseconds){if(milliseconds>limit)misses++;else misses=Math.max(0,misses-1);if(misses>=5){misses=-1e6;document.documentElement.dataset.renderFallback='frame-budget';fallback();}};}
export function treeAsset(base,name){return quality.lite?new URL(`./assets/performance/tree-mobile.${name}`,import.meta.url):new URL(`tree.${name}`,base);}
export function textureAsset(base,name){return new URL(`${quality.lite?'mobile/':''}${name}.webp`,base);}

export function guardRenderer(renderer,fallback){
 const render=renderer.render.bind(renderer),dispose=renderer.dispose.bind(renderer);let sample=0,last=0,submitted=0,stopped=false;
 const fail=()=>{if(stopped)return;stopped=true;cancelAnimationFrame(sample);queueMicrotask(fallback);},cpu=frameBudget(fail),cadence=frameBudget(fail,40);
 function tick(now){sample=0;if(stopped||document.hidden||now-submitted>180){last=0;return;}if(last)cadence(now-last);last=now;sample=requestAnimationFrame(tick);}
 renderer.render=(...args)=>{const start=performance.now(),value=render(...args);submitted=performance.now();cpu(submitted-start);if(!sample&&!stopped){last=0;sample=requestAnimationFrame(tick);}return value;};
 renderer.dispose=()=>{stopped=true;cancelAnimationFrame(sample);dispose();};
}
