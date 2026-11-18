import { quality, motionPreference, pixelRatio, rendererOptions, tuneShadows, frameBudget, guardRenderer } from './render-policy.js';
/* Deterministic banked passes between still native-scroll reading chapters. */
import {flightPose} from './frisbee-story.js?v=field-3';
const host=document.querySelector('.uf-journey'),stage=document.querySelector('.uf-stage'),mount=document.querySelector('.uf-canvas'),root=document.documentElement;
const preference=motionPreference(true);
const clamp=x=>Math.max(0,Math.min(1,x)),smooth=x=>{x=clamp(x);return x*x*x*(x*(x*6-15)+10);};

const chapters=[...host.querySelectorAll('section[id]')];
let instance=null,starting=false,boot,departed=false,lastReduced=preference.matches,readingAnchor;
window.frisbeeExperience={state:{ready:false,frames:0}};
function rememberReading(){
 if(preference.matches!==lastReduced)return;
 const chapter=chapters.filter(el=>el.getBoundingClientRect().top<=innerHeight*.35).at(-1)||chapters[0];
 readingAnchor={element:chapter,top:chapter.getBoundingClientRect().top};
}
rememberReading();addEventListener('scroll',rememberReading,{passive:true});addEventListener('resize',rememberReading,{passive:true});
function motionLayout(enabled){
 const anchor=readingAnchor;root.classList.toggle('uf-motion',enabled);
 if(anchor)scrollBy({top:anchor.element.getBoundingClientRect().top-anchor.top,behavior:'instant'});
 rememberReading();
}
function visible(starting=false){const r=host.getBoundingClientRect();return r.top<innerHeight&&r.bottom>(starting?Math.min(innerHeight*.45,450):120)&&!document.querySelector('.uf-lightbox').open;}
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
  window.frisbeeExperience.state={...window.frisbeeExperience.state,ready:false,frames:frame,calls:0,geometries:0,textures:0};
 };
 try{
  const [T,{createFrisbeeWorld}]=await Promise.all([import('./vendor/three.module.js'),import('./frisbee-world-model.js?v=field-3')]);
  await document.fonts.ready;
  if(preference.matches||departed||!visible(true)){starting=false;dispose();observe();return;}
  renderer=new T.WebGLRenderer(rendererOptions({}));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.9;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;renderer.domElement.setAttribute('aria-hidden','true');mount.append(renderer.domElement);
  scene=new T.Scene();scene.background=new T.Color('#d6d8c6');scene.fog=new T.Fog('#cbd1bd',65,230);camera=new T.PerspectiveCamera(48,1,.008,600);
  scene.add(new T.HemisphereLight('#e0edff','#605b3e',1.35));
  const key=new T.DirectionalLight('#fff0dc',2.7);key.position.set(-30,48,25);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-63,right:63,top:63,bottom:-63,near:1,far:160});key.shadow.bias=-.000015;key.shadow.normalBias=.004;scene.add(key);
  const fill=new T.DirectionalLight('#bed5e8',.45);fill.position.set(7,7,8);scene.add(fill);
  world=await createFrisbeeWorld(scene,keep);tuneShadows(scene);guardRenderer(renderer,()=>{dispose();motionLayout(false);});
  if(preference.matches||departed||!visible(true)){starting=false;dispose();observe();return;}
  const target=new T.Vector3();let portrait=false,compact=false;
  function measure(){
   const r=stage.getBoundingClientRect();if(width===r.width&&height===r.height&&layoutHeight===host.offsetHeight&&beats.length)return;
   width=r.width;height=r.height;layoutHeight=host.offsetHeight;portrait=height>width&&innerWidth<=1050;compact=height<700;

   renderer.setPixelRatio(pixelRatio(width,height));renderer.setSize(width,height,false);camera.aspect=width/Math.max(1,height);camera.updateProjectionMatrix();renderer.shadowMap.needsUpdate=true;
   const base=host.getBoundingClientRect().top+scrollY;
   beats=[...host.querySelectorAll('.uf-beat')].map(el=>{const top=el.getBoundingClientRect().top+scrollY-base;return {start:top-height*.15,end:top+el.offsetHeight-height*.55};});
   finaleTop=document.querySelector('#finale').getBoundingClientRect().top+scrollY-base;
   readingZones=[...host.querySelectorAll('.uf-section')].map(el=>{const top=el.getBoundingClientRect().top+scrollY-base;return {start:top-height*.6,end:top+el.offsetHeight-height*.3};});
  }
  function pose(){
   measure();const offset=Math.max(0,-host.getBoundingClientRect().top);cursor=0;
   for(let i=0;i<beats.length;i++){if(offset<beats[i].start)break;cursor=i+smooth((offset-beats[i].start)/Math.max(1,beats[i].end-beats[i].start));if(cursor<i+1)break;}
   const flight=flightPose(cursor),p=flight.position;
   // Deliberately different camera distances and screen positions reveal actual
   // travel. It no longer cancels the throw with an identical camera translation.
   const offsets=[[.26,.31,.70],[.85,.7,3.8],[1.05,.8,4.4],[1.2,.85,3.6],[1.1,.85,2.8],[.9,.75,2.2],[.75,.65,1.7],[.4,.48,.82]];
   const screenBias=[-.22,-.55,-.65,-.55,-.5,-.4,-.3,-.2];
   const i=Math.min(6,Math.floor(cursor)),t=cursor-i,blend=smooth(t),o=offsets[i].map((v,k)=>v+(offsets[i+1][k]-v)*blend),bias=screenBias[i]+(screenBias[i+1]-screenBias[i])*blend;
   const distance=portrait?(compact?1.25:1.12)/(1+Math.max(0,o[2]-1)*.3):height<500?1.3:1;
   const follow=flightPose(Math.max(0,cursor-(portrait?.013:.022))).position;
   const portraitLift=portrait?(compact?.26:.22)*Math.min(2.5,Math.max(1,o[2])):.06;
   camera.position.set(follow[0]+o[0]*distance,follow[1]+o[1]*distance,follow[2]+o[2]*distance);
   target.set(p[0]+(portrait?0:bias),p[1]+portraitLift,p[2]);
   const fov=portrait?54:48;if(camera.fov!==fov){camera.fov=fov;camera.updateProjectionMatrix();}
   camera.lookAt(target);camera.updateMatrixWorld();const physical=world.update(flight),projected=world.projectBounds(camera);
   if(cursor!==shadowCursor){renderer.shadowMap.needsUpdate=true;shadowCursor=cursor;}
   host.dataset.phase=cursor>=7?'landed':cursor===0?'opening':'flying';host.dataset.reading=String(readingZones.some(z=>offset>z.start&&offset<z.end));
   window.frisbeeExperience.state={ready:!lost,frames:frame,cursor,simulationTime:flight.time,velocity:flight.velocity,normal:flight.normal,omega:flight.omega,grounded:flight.grounded,...physical,projected,camera:camera.position.toArray(),target:target.toArray(),beats,finaleTop,stageHeight:height,buffer:[renderer.domElement.width,renderer.domElement.height],lost,...world.stats};
  }
  function draw(time){
   raf=0;if(preference.matches){applyMotionPreference();return;}if(dead||lost||document.hidden||!visible())return;
   if(time-last<1000/60-.5){raf=requestAnimationFrame(draw);return;}last=time;pose();renderer.render(scene,camera);frame++;
   Object.assign(window.frisbeeExperience.state,{frames:frame,calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures});
  }
  function wake(){if(!raf&&!dead&&!lost&&!document.hidden&&!preference.matches&&visible())raf=requestAnimationFrame(draw);}
  on(window,'scroll',()=>{if(visible())wake();else{cancelAnimationFrame(raf);raf=0;}},{passive:true});on(window,'resize',()=>{width=0;wake();},{passive:true});
  
  on(document,'visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;}else wake();});on(window,'pageshow',wake);on(window,'pagehide',()=>{cancelAnimationFrame(raf);raf=0;});
  on(document,'frisbeegallery',e=>{if(e.detail.open){cancelAnimationFrame(raf);raf=0;}else wake();});
  on(renderer.domElement,'webglcontextlost',e=>{e.preventDefault();lost=true;cancelAnimationFrame(raf);raf=0;stage.classList.remove('is-ready');scene.traverse(o=>{if(o.shadow?.map){o.shadow.map.dispose();o.shadow.map=null;}});resources.forEach(r=>r.dispose?.());Object.assign(window.frisbeeExperience.state,{ready:false,lost:true,geometries:0,textures:0});});
  on(renderer.domElement,'webglcontextrestored',()=>{lost=false;resources.forEach(r=>{if(r.isTexture)r.needsUpdate=true;});renderer.shadowMap.needsUpdate=true;pose();renderer.render(scene,camera);stage.classList.add('is-ready');Object.assign(window.frisbeeExperience.state,{ready:true,lost:false});wake();});
  resizeObserver=new ResizeObserver(()=>{width=0;wake();});resizeObserver.observe(stage);resizeObserver.observe(host);
  intersectionObserver=new IntersectionObserver(()=>{if(visible())wake();else{cancelAnimationFrame(raf);raf=0;}});intersectionObserver.observe(host);
  if(preference.matches||departed||!visible(true)){starting=false;dispose();observe();return;}
  instance={dispose,wake};starting=false;pose();renderer.shadowMap.needsUpdate=true;renderer.render(scene,camera);frame++;stage.classList.add('is-ready');Object.assign(window.frisbeeExperience.state,{ready:true,frames:frame,calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures});wake();
 }catch(error){dispose();starting=false;instance=null;motionLayout(false);window.frisbeeExperience.state={ready:false,frames:frame,error:String(error)};console.warn('Frisbee world: static reading retained.',error);}
}
function applyMotionPreference(){
 if(preference.matches===lastReduced)return;lastReduced=preference.matches;boot?.disconnect();
 if(preference.matches){instance?.dispose();instance=null;}motionLayout(!preference.matches);if(!preference.matches)observe();
}
const motionObserver=new ResizeObserver(applyMotionPreference);motionObserver.observe(host);preference.addEventListener('change',applyMotionPreference);
document.addEventListener('frisbeegallery',e=>{if(!e.detail.open&&!instance)observe();});
const ready=()=>requestAnimationFrame(observe);if(location.hash&&document.readyState!=='complete')addEventListener('load',ready,{once:true});else ready();
addEventListener('pagehide',e=>{if(!e.persisted){departed=true;boot?.disconnect();motionObserver.disconnect();instance?.dispose();instance=null;}});addEventListener('pageshow',()=>{departed=false;instance?instance.wake():observe();});
