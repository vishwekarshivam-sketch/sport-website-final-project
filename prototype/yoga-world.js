import { quality, motionPreference, pixelRatio, rendererOptions, tuneShadows, frameBudget, guardRenderer } from './render-policy.js';
/* A continuous mat unroll and architectural camera journey, with still reading intervals. */

const host=document.querySelector('.yg-journey'),stage=document.querySelector('.yg-stage'),mount=document.querySelector('.yg-canvas'),root=document.documentElement;
const preference=motionPreference(true);
const clamp=x=>Math.max(0,Math.min(1,x)),smooth=x=>{x=clamp(x);return x*x*x*(x*(x*6-15)+10);};

const chapters=[...host.querySelectorAll('section[id]')];
let instance=null,starting=false,boot,departed=false,lastReduced=preference.matches,readingAnchor;
window.yogaExperience={state:{ready:false,frames:0}};
function rememberReading(){
 if(preference.matches!==lastReduced)return;
 const chapter=chapters.filter(el=>el.getBoundingClientRect().top<=innerHeight*.35).at(-1)||chapters[0];
 readingAnchor={element:chapter,top:chapter.getBoundingClientRect().top};
}
rememberReading();addEventListener('scroll',rememberReading,{passive:true});addEventListener('resize',rememberReading,{passive:true});
function motionLayout(enabled){
 const anchor=readingAnchor;root.classList.toggle('yg-motion',enabled);
 if(anchor)scrollBy({top:anchor.element.getBoundingClientRect().top-anchor.top,behavior:'instant'});
 rememberReading();
}
function visible(starting=false){const r=host.getBoundingClientRect();return r.top<innerHeight&&r.bottom>(starting?Math.min(innerHeight*.45,450):120)&&!document.querySelector('.yg-lightbox').open;}
function observe(){
 if(!host||instance||starting||departed||preference.matches)return;
 boot?.disconnect();boot=new IntersectionObserver(entries=>{if(entries[0].isIntersecting&&visible(true)){boot.disconnect();start();}},{rootMargin:`-${Math.min(innerHeight*.45,450)}px 0px 0px 0px`});boot.observe(host);
}
async function start(){
 if(starting||instance||preference.matches||departed)return;starting=true;
 const resources=new Set(),keep=value=>(resources.add(value),value),events=new AbortController();
 const on=(target,name,fn,options={})=>target.addEventListener(name,fn,{...options,signal:events.signal});
 let renderer,scene,camera,world,frame=0,raf=0,last=0,dead=false,lost=false,width=0,height=0,layoutHeight=0,beats=[],readingZones=[],finaleTop=0,cursor=0,shadowCursor=-1,resizeObserver,intersectionObserver;
 const dispose=()=>{
  if(dead)return;dead=true;cancelAnimationFrame(raf);events.abort();resizeObserver?.disconnect();intersectionObserver?.disconnect();scene?.traverse(o=>o.shadow?.map?.dispose());resources.forEach(r=>r.dispose?.());resources.clear();renderer?.renderLists.dispose();renderer?.dispose();renderer?.domElement.remove();stage.classList.remove('is-ready');
  window.yogaExperience.state={...window.yogaExperience.state,ready:false,frames:frame,calls:0,geometries:0,textures:0};
 };
 try{
  const [T,{createYogaWorld},{createYogaScene,applyYogaPose},{createYogaRenderer}]=await Promise.all([import('./vendor/three.module.js'),import('./yoga-world-model.js?v=pavilion-1'),import('./yoga-scene.js?v=pavilion-1'),import('./yoga-renderer.js?v=pavilion-1')]);
  await document.fonts.ready;
  if(preference.matches||departed||!visible(true)){starting=false;dispose();observe();return;}
  renderer=new T.WebGLRenderer(rendererOptions({}));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;renderer.domElement.setAttribute('aria-hidden','true');mount.append(renderer.domElement);
  ({scene,camera}=createYogaScene(keep));
  world=await createYogaWorld(scene,keep);tuneShadows(scene);guardRenderer(renderer,()=>{dispose();motionLayout(false);});
  if(preference.matches||departed||!visible(true)){starting=false;dispose();observe();return;}
  const pipeline=createYogaRenderer(renderer,scene,keep);let portrait=false,compact=false;
  function measure(){
   const r=stage.getBoundingClientRect();if(width===r.width&&height===r.height&&layoutHeight===host.offsetHeight&&beats.length)return;
   width=r.width;height=r.height;layoutHeight=host.offsetHeight;portrait=height>width&&innerWidth<=1050;compact=height<700;

   renderer.setPixelRatio(pixelRatio(width,height));renderer.setSize(width,height,false);pipeline.resize(width,height);camera.aspect=width/Math.max(1,height);camera.updateProjectionMatrix();renderer.shadowMap.needsUpdate=true;
   const base=host.getBoundingClientRect().top+scrollY;
   beats=[...host.querySelectorAll('.yg-beat')].map(el=>{const top=el.getBoundingClientRect().top+scrollY-base;return {start:top-height*.15,end:top+el.offsetHeight-height*.55};});
   finaleTop=document.querySelector('#finale').getBoundingClientRect().top+scrollY-base;
   readingZones=[...host.querySelectorAll('.yg-section')].map(el=>{const top=el.getBoundingClientRect().top+scrollY-base;return {start:top-height*.6,end:top+el.offsetHeight-height*.3};});
  }
  function pose(){
   measure();const offset=Math.max(0,-host.getBoundingClientRect().top);cursor=0;
   for(let i=0;i<beats.length;i++){if(offset<beats[i].start)break;cursor=i+smooth((offset-beats[i].start)/Math.max(1,beats[i].end-beats[i].start));if(cursor<i+1)break;}
   const design=applyYogaPose(camera,world,cursor,width,height);
   if(cursor!==shadowCursor){renderer.shadowMap.needsUpdate=true;shadowCursor=cursor;}
   host.dataset.phase=cursor>=7?'landed':cursor===0?'opening':'unfolding';host.dataset.reading=String(readingZones.some(z=>offset>z.start&&offset<z.end));
   const bounds=world.mat.geometry.boundingBox,points=[];for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z])points.push(new T.Vector3(x,y,z).applyMatrix4(world.mat.object.matrixWorld).project(camera).toArray());
   window.yogaExperience.state={ready:!lost,frames:frame,...design,projectedMat:points,beats,finaleTop,stageHeight:height,buffer:[renderer.domElement.width,renderer.domElement.height],lost,...world.stats,...pipeline.stats};
  }
  function draw(time){
   raf=0;if(preference.matches){applyMotionPreference();return;}if(dead||lost||document.hidden||!visible())return;
   if(time-last<1000/60-.5){raf=requestAnimationFrame(draw);return;}last=time;pose();const renderStats=pipeline.render(camera,cursor);frame++;
   Object.assign(window.yogaExperience.state,{frames:frame,calls:renderStats.calls,triangles:renderStats.triangles,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures});
  }
  function wake(){if(!raf&&!dead&&!lost&&!document.hidden&&!preference.matches&&visible())raf=requestAnimationFrame(draw);}
  on(window,'scroll',()=>{if(visible())wake();else{cancelAnimationFrame(raf);raf=0;}},{passive:true});on(window,'resize',()=>{width=0;wake();},{passive:true});
  
  on(document,'visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;}else wake();});on(window,'pageshow',wake);on(window,'pagehide',()=>{cancelAnimationFrame(raf);raf=0;});
  on(document,'yogagallery',e=>{if(e.detail.open){cancelAnimationFrame(raf);raf=0;}else wake();});
  on(renderer.domElement,'webglcontextlost',e=>{e.preventDefault();lost=true;cancelAnimationFrame(raf);raf=0;stage.classList.remove('is-ready');scene.traverse(o=>{if(o.shadow?.map){o.shadow.map.dispose();o.shadow.map=null;}});resources.forEach(r=>r.dispose?.());Object.assign(window.yogaExperience.state,{ready:false,lost:true,geometries:0,textures:0});});
  on(renderer.domElement,'webglcontextrestored',()=>{lost=false;resources.forEach(r=>{if(r.isTexture)r.needsUpdate=true;});renderer.shadowMap.needsUpdate=true;pose();pipeline.render(camera,cursor);stage.classList.add('is-ready');Object.assign(window.yogaExperience.state,{ready:true,lost:false});wake();});
  resizeObserver=new ResizeObserver(()=>{width=0;wake();});resizeObserver.observe(stage);resizeObserver.observe(host);
  intersectionObserver=new IntersectionObserver(()=>{if(visible())wake();else{cancelAnimationFrame(raf);raf=0;}});intersectionObserver.observe(host);
  if(preference.matches||departed||!visible(true)){starting=false;dispose();observe();return;}
  instance={dispose,wake};starting=false;pose();renderer.shadowMap.needsUpdate=true;const renderStats=pipeline.render(camera,cursor);frame++;stage.classList.add('is-ready');Object.assign(window.yogaExperience.state,{ready:true,frames:frame,calls:renderStats.calls,triangles:renderStats.triangles,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures});wake();
 }catch(error){dispose();starting=false;instance=null;motionLayout(false);window.yogaExperience.state={ready:false,frames:frame,error:String(error)};console.warn('Yoga world: static reading retained.',error);}
}
function applyMotionPreference(){
 if(preference.matches===lastReduced)return;lastReduced=preference.matches;boot?.disconnect();
 if(preference.matches){instance?.dispose();instance=null;}motionLayout(!preference.matches);if(!preference.matches)observe();
}
const motionObserver=new ResizeObserver(applyMotionPreference);motionObserver.observe(host);preference.addEventListener('change',applyMotionPreference);
document.addEventListener('yogagallery',e=>{if(!e.detail.open&&!instance)observe();});
const ready=()=>requestAnimationFrame(observe);if(location.hash&&document.readyState!=='complete')addEventListener('load',ready,{once:true});else ready();
addEventListener('pagehide',e=>{if(!e.persisted){departed=true;boot?.disconnect();motionObserver.disconnect();instance?.dispose();instance=null;}});addEventListener('pageshow',()=>{departed=false;instance?instance.wake():observe();});
