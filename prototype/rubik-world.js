import { quality, motionPreference, pixelRatio, rendererOptions, tuneShadows, frameBudget } from './render-policy.js';
/* One deterministic, native-scroll cube story; static HTML is always readable. */
import {MOVES} from './rubik-story.js?v=cube-1';
const host=document.querySelector('.rk-journey'),stage=document.querySelector('.rk-stage'),mount=document.querySelector('.rk-canvas'),root=document.documentElement;
const preference=motionPreference();
const clamp=x=>Math.max(0,Math.min(1,x)),smooth=x=>{x=clamp(x);return x*x*x*(x*(x*6-15)+10);};
const captions=['A little curiosity.','A new perspective.','Find your starting point.','Look a little closer.','More possibilities.','A shared challenge.','Better together.','One turn remains.','It all clicks.'];
const chapters=[...host.querySelectorAll('section[id]')];
let instance=null,starting=false,boot,departed=false,lastReduced=preference.matches,readingAnchor;
window.rubikExperience={state:{ready:false,frames:0}};
function rememberReading(){
 if(preference.matches!==lastReduced)return;
 const chapter=chapters.filter(el=>el.getBoundingClientRect().top<=innerHeight*.35).at(-1)||chapters[0];
 readingAnchor={element:chapter,top:chapter.getBoundingClientRect().top};
}
rememberReading();addEventListener('scroll',rememberReading,{passive:true});addEventListener('resize',rememberReading,{passive:true});
function motionLayout(enabled){
 const anchor=readingAnchor;root.classList.toggle('rk-motion',enabled);
 if(anchor)scrollBy({top:anchor.element.getBoundingClientRect().top-anchor.top,behavior:'instant'});
 rememberReading();
}
function visible(starting=false){const r=host.getBoundingClientRect();return r.top<innerHeight&&r.bottom>(starting?Math.min(innerHeight*.45,450):120)&&!document.querySelector('.rk-lightbox').open;}
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
  window.rubikExperience.state={...window.rubikExperience.state,ready:false,frames:frame,calls:0,geometries:0,textures:0};
 };
 try{
  const [T,{createRubikWorld}]=await Promise.all([import('./vendor/three.module.js'),import('./rubik-world-model.js?v=cube-1')]);
  await document.fonts.ready;
  if(preference.matches||departed||!visible(true)){starting=false;dispose();observe();return;}
  renderer=new T.WebGLRenderer(rendererOptions({}));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;renderer.domElement.setAttribute('aria-hidden','true');mount.append(renderer.domElement);
  scene=new T.Scene();scene.background=new T.Color('#e9e7db');camera=new T.PerspectiveCamera(42,1,.08,200);
  scene.add(new T.HemisphereLight('#fff9e9','#61745e',2.0));
  const key=new T.DirectionalLight('#fff7e7',3.2);key.position.set(-4,9,6);key.castShadow=true;key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-9,right:9,top:9,bottom:-9,near:.5,far:40});key.shadow.bias=-.00025;key.shadow.normalBias=.025;scene.add(key);
  const fill=new T.DirectionalLight('#dbe6dd',1.0);fill.position.set(7,7,8);scene.add(fill);
  world=createRubikWorld(scene,keep);
  const wide=[[[7,5.2,9],[-2,.0,0],38],[[7.5,4.5,8],[-1.2,0,0],40],[[6,5.5,9],[-1.6,0,0],39],[[3.5,6.5,10],[-1,0,0],40],[[0,5.5,11],[-1,0,0],38],[[-4,4.8,10],[-1,0,0],40],[[4,5.5,10],[-1.3,0,0],39],[[6,4.5,10],[-1.4,0,0],39],[[7,5.5,10],[-1.8,0,0],38]];
  const portrait=[[[7,5.2,9],[0,1.7,0],47],[[7,5,9],[0,.6,0],47],[[6,6,10],[0,.5,0],47],[[3.5,6.5,10],[0,.5,0],47],[[0,5.5,11],[0,.5,0],47],[[-4,4.8,10],[0,.5,0],47],[[4,5.5,10],[0,.5,0],47],[[6,4.5,10],[0,.5,0],47],[[7,5.5,10],[0,1.6,0],47]];
  let rail=wide;const target=new T.Vector3(),aPoint=new T.Vector3(),bPoint=new T.Vector3(),aAim=new T.Vector3(),bAim=new T.Vector3();
  function measure(){
   const r=stage.getBoundingClientRect();if(width===r.width&&height===r.height&&layoutHeight===host.offsetHeight&&beats.length)return;
   width=r.width;height=r.height;layoutHeight=host.offsetHeight;rail=innerWidth<=1050&&height>width||innerWidth<800?portrait:wide;
   if(innerWidth<800&&height<700)rail=portrait.map((point,i)=>i===0||i===8?[point[0].map(v=>v*1.35),[0,3.5,0],point[2]]:point);
   renderer.setPixelRatio(pixelRatio(width,height));renderer.setSize(width,height,false);camera.aspect=width/Math.max(1,height);camera.updateProjectionMatrix();renderer.shadowMap.needsUpdate=true;
   const base=host.getBoundingClientRect().top+scrollY;
   beats=[...host.querySelectorAll('.rk-beat')].map(el=>{const top=el.getBoundingClientRect().top+scrollY-base;return {start:top-height*.15,end:top+el.offsetHeight-height*.55};});
   finaleTop=document.querySelector('#finale').getBoundingClientRect().top+scrollY-base;
   readingZones=[...host.querySelectorAll('.rk-section')].map(el=>{const top=el.getBoundingClientRect().top+scrollY-base;return {start:top-height*.6,end:top+el.offsetHeight-height*.3};});
  }
  function pose(){
   measure();const offset=Math.max(0,-host.getBoundingClientRect().top);cursor=0;
   for(let i=0;i<beats.length;i++){if(offset<beats[i].start)break;cursor=i+smooth((offset-beats[i].start)/Math.max(1,beats[i].end-beats[i].start));if(cursor<i+1)break;}
   const segment=Math.min(7,Math.floor(cursor)),t=cursor-segment,a=rail[segment],b=rail[segment+1];
   camera.position.lerpVectors(aPoint.fromArray(a[0]),bPoint.fromArray(b[0]),t);target.lerpVectors(aAim.fromArray(a[1]),bAim.fromArray(b[1]),t);
   
   const fov=a[2]+(b[2]-a[2])*t;if(camera.fov!==fov){camera.fov=fov;camera.updateProjectionMatrix();}
   camera.lookAt(target);camera.updateMatrixWorld();const pieces=world.update(cursor);
   if(cursor!==shadowCursor){renderer.shadowMap.needsUpdate=true;shadowCursor=cursor;}
   host.style.setProperty('--solve-reveal',String(smooth((offset-(finaleTop-height*.45))/(height*.3))));host.dataset.phase=cursor>=8?'solved':cursor===0?'opening':'playing';host.dataset.reading=String(readingZones.some(z=>offset>z.start&&offset<z.end));
   const index=Math.min(8,Math.ceil(cursor-1e-5));document.querySelector('.rk-current-move').textContent=index===8?'Solved':index?MOVES[index-1]:'Scrambled';document.querySelector('.rk-current-caption').textContent=captions[index];
   window.rubikExperience.state={ready:!lost,frames:frame,cursor,pieces,camera:camera.position.toArray(),target:target.toArray(),beats,finaleTop,stageHeight:height,buffer:[renderer.domElement.width,renderer.domElement.height],lost,...world.stats};
  }
  function draw(time){
   raf=0;if(preference.matches){applyMotionPreference();return;}if(dead||lost||document.hidden||!visible())return;
   if(time-last<1000/60-.5){raf=requestAnimationFrame(draw);return;}last=time;pose();renderer.render(scene,camera);frame++;
   Object.assign(window.rubikExperience.state,{frames:frame,calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures});
  }
  function wake(){if(!raf&&!dead&&!lost&&!document.hidden&&!preference.matches&&visible())raf=requestAnimationFrame(draw);}
  on(window,'scroll',()=>{if(visible())wake();else{cancelAnimationFrame(raf);raf=0;}},{passive:true});on(window,'resize',()=>{width=0;wake();},{passive:true});
  
  on(document,'visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;}else wake();});on(window,'pageshow',wake);on(window,'pagehide',()=>{cancelAnimationFrame(raf);raf=0;});
  on(document,'rubikgallery',e=>{if(e.detail.open){cancelAnimationFrame(raf);raf=0;}else wake();});
  on(renderer.domElement,'webglcontextlost',e=>{e.preventDefault();lost=true;cancelAnimationFrame(raf);raf=0;stage.classList.remove('is-ready');scene.traverse(o=>{if(o.shadow?.map){o.shadow.map.dispose();o.shadow.map=null;}});resources.forEach(r=>r.dispose?.());Object.assign(window.rubikExperience.state,{ready:false,lost:true,geometries:0,textures:0});});
  on(renderer.domElement,'webglcontextrestored',()=>{lost=false;resources.forEach(r=>{if(r.isTexture)r.needsUpdate=true;});renderer.shadowMap.needsUpdate=true;pose();renderer.render(scene,camera);stage.classList.add('is-ready');Object.assign(window.rubikExperience.state,{ready:true,lost:false});wake();});
  resizeObserver=new ResizeObserver(()=>{width=0;wake();});resizeObserver.observe(stage);resizeObserver.observe(host);
  intersectionObserver=new IntersectionObserver(()=>{if(visible())wake();else{cancelAnimationFrame(raf);raf=0;}});intersectionObserver.observe(host);
  if(preference.matches||departed||!visible(true)){starting=false;dispose();observe();return;}
  instance={dispose,wake};starting=false;pose();renderer.shadowMap.needsUpdate=true;renderer.render(scene,camera);frame++;stage.classList.add('is-ready');Object.assign(window.rubikExperience.state,{ready:true,frames:frame,calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures});wake();
 }catch(error){dispose();starting=false;instance=null;motionLayout(false);window.rubikExperience.state={ready:false,frames:frame,error:String(error)};console.warn('Rubik world: static reading retained.',error);}
}
function applyMotionPreference(){
 if(preference.matches===lastReduced)return;lastReduced=preference.matches;boot?.disconnect();
 if(preference.matches){instance?.dispose();instance=null;}motionLayout(!preference.matches);if(!preference.matches)observe();
}
const motionObserver=new ResizeObserver(applyMotionPreference);motionObserver.observe(host);preference.addEventListener('change',applyMotionPreference);
document.addEventListener('rubikgallery',e=>{if(!e.detail.open&&!instance)observe();});
const ready=()=>requestAnimationFrame(observe);if(location.hash&&document.readyState!=='complete')addEventListener('load',ready,{once:true});else ready();
addEventListener('pagehide',e=>{if(!e.persisted){departed=true;boot?.disconnect();motionObserver.disconnect();instance?.dispose();instance=null;}});addEventListener('pageshow',()=>{departed=false;instance?instance.wake():observe();});
