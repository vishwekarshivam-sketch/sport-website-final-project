import { quality, motionPreference, pixelRatio, rendererOptions, tuneShadows, frameBudget, guardRenderer } from './render-policy.js';
/* Native-scroll equipment portrait. Photography and useful content remain HTML. */
const hero=document.querySelector('.fb-hero'),stage=hero?.querySelector('.fb-stage'),mount=hero?.querySelector('.fb-scene');
const slug=document.body.dataset.sport;
const reduced=motionPreference();
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
const entryVisible=()=>{const r=mount.getBoundingClientRect();return Math.min(innerHeight,r.bottom)-Math.max(0,r.top)>=r.height*.15;};
let experience=null,boot=null,starting=false,departed=false;
window.sportDetailExperience={state:{ready:false,frames:0,progress:0}};

function observeEntry(){
 if(!mount||reduced.matches||departed||experience||starting)return;
 boot?.disconnect();boot=new IntersectionObserver(entries=>{if(entries[0].isIntersecting&&entries[0].intersectionRatio>=.15){boot.disconnect();start();}},{threshold:.15});
 boot.observe(mount);
}
async function start(){
 if(starting||experience||reduced.matches||departed)return;
 starting=true;
 const owned=new Set(),keep=value=>(owned.add(value),value),events=new AbortController();
 let renderer,scene,camera,environment,observer,resizeObserver,raf=0,active=true,lost=false,dead=false,frames=0,last=0,width=0,height=0;
 let pointerX=0,pointerY=0,aimX=0,aimY=0,progress=0;
 const on=(target,type,callback,options={})=>target.addEventListener(type,callback,{...options,signal:events.signal});
 const dispose=()=>{
  if(dead)return;dead=true;cancelAnimationFrame(raf);raf=0;events.abort();observer?.disconnect();resizeObserver?.disconnect();
  scene?.traverse(object=>{if(object.shadow?.map)object.shadow.map.dispose();});
  owned.forEach(value=>value.dispose?.());owned.clear();renderer?.dispose();renderer?.domElement.remove();
  mount.classList.remove('is-ready');hero.classList.remove('scene-enhanced','photo-arrived');hero.querySelectorAll('.is-on-photo').forEach(n=>n.classList.remove('is-on-photo'));
  hero.style.removeProperty('--opening-opacity');hero.style.removeProperty('--arrival-copy');
  window.sportDetailExperience.state={ready:false,frames,progress};
 };
 try{
  const [T,{createEquipment}]=await Promise.all([import('./vendor/three.module.js'),import('./sport-equipment.js?v=strike-1')]);
  if(reduced.matches||departed||!entryVisible()){starting=false;dispose();observeEntry();return;}
  renderer=new T.WebGLRenderer(rendererOptions({alpha:true}));
  renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
  renderer.domElement.setAttribute('aria-hidden','true');mount.append(renderer.domElement);
  guardRenderer(renderer,()=>{dispose();departed=true;experience=null;});scene=new T.Scene();camera=new T.PerspectiveCamera(34,1,.1,80);
  const studio=new T.Scene();studio.background=new T.Color('#b8b9aa');
  for(const [x,y,z,w,h,power] of [[-5,6,4,5,7,4],[5,4,-2,2.5,6,2.5],[0,8,-3,6,4,3]]){
   const panel=new T.Mesh(keep(new T.PlaneGeometry(w,h)),keep(new T.MeshBasicMaterial({color:new T.Color(power,power*.97,power*.9)})));
   panel.position.set(x,y,z);panel.lookAt(0,0,0);studio.add(panel);
  }
  const makeEnvironment=()=>{const pmrem=new T.PMREMGenerator(renderer);environment=keep(pmrem.fromScene(studio,.025));pmrem.dispose();scene.environment=environment.texture;};
  makeEnvironment();scene.environmentIntensity=.55;
  scene.add(new T.HemisphereLight(0xfff3dc,0x536349,1.0));
  const key=new T.DirectionalLight(0xfff0d8,2.45);key.position.set(-4,6,4);scene.add(key);
  const fill=new T.DirectionalLight(0xdce9da,.8);fill.position.set(5,2,-4);scene.add(fill);
  const ball=await createEquipment(slug,keep);scene.add(ball);
  const flight=ball.userData.strike?(await import('./sport-detail-flight.js?v=strike-1')).createDetailFlight(T,ball,slug):null;
  let action=null;
  // One soft contact plane avoids the sharply outlined seam shadows of the study.
  const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=256;
  const ctx=shadowCanvas.getContext('2d'),gradient=ctx.createRadialGradient(128,128,5,128,128,124);
  gradient.addColorStop(0,'#233c29c4');gradient.addColorStop(.16,'#233c2985');gradient.addColorStop(.45,'#233c2930');gradient.addColorStop(1,'#233c2900');
  ctx.fillStyle=gradient;ctx.fillRect(0,0,256,256);
  const shadowTexture=keep(new T.CanvasTexture(shadowCanvas));
  const contact=new T.Mesh(keep(new T.PlaneGeometry(ball.userData.shadowX,ball.userData.shadowZ)),keep(new T.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false,opacity:.7})));
  contact.rotation.x=-Math.PI/2;contact.position.set(.45,-1.005,0);scene.add(contact);
  const projected=new T.Vector3();
  function measure(){
   const rect=mount.getBoundingClientRect();if(rect.width===width&&rect.height===height)return;
   width=rect.width;height=rect.height;
   renderer.setPixelRatio(pixelRatio(width,height));
   if(flight){
    // Preserve the still life's original portrait framing, while letting the
    // approaching ball render beyond that frame across the whole sticky stage.
    const s=stage.getBoundingClientRect();renderer.setSize(s.width,s.height,false);
    Object.assign(renderer.domElement.style,{position:'absolute',left:'0px',top:(s.top-rect.top)+'px',width:s.width+'px',height:s.height+'px'});
    camera.setViewOffset(width,height,0,-(rect.top-s.top),s.width,s.height);
   }else{renderer.setSize(width,height,false);camera.aspect=width/Math.max(1,height);camera.updateProjectionMatrix();}
  }
  function paintProgress(){
   const distance=hero.offsetHeight-stage.offsetHeight;
   progress=clamp(-hero.getBoundingClientRect().top/Math.max(1,distance));
   hero.style.setProperty('--opening-opacity',1-smooth(.25,.47,progress));
   hero.style.setProperty('--arrival-copy',smooth(.73,.92,progress));
   
   if(!renderer)return;
   const s=stage.getBoundingClientRect(),r=flight?s:mount.getBoundingClientRect();
   ball.updateMatrixWorld(true);
   if(flight)flight.projectile.getWorldPosition(projected);else{projected.set(0,ball.userData.focusY,0);ball.localToWorld(projected);}projected.project(camera);
   const x=r.left-s.left+(projected.x*.5+.5)*r.width,y=r.top-s.top+(-projected.y*.5+.5)*r.height;
   const radius=Math.hypot(Math.max(x,s.width-x),Math.max(y,s.height-y));
   hero.style.setProperty('--reveal-x',x+'px');hero.style.setProperty('--reveal-y',y+'px');
   const revealRadius=radius*smooth(flight?.57:.36,.94,progress);
   hero.style.setProperty('--reveal-radius',revealRadius+'px');
   let darkBallRadius=0;
   if(flight&&['cricket','squash'].includes(slug)){
    const point=flight.projectile.getWorldPosition(new T.Vector3()).applyMatrix4(camera.matrixWorldInverse),size=flight.radius*flight.projectile.scale.x;
    darkBallRadius=size/Math.sqrt(Math.max(.01,point.z*point.z-size*size))*camera.projectionMatrix.elements[5]*s.height/2;
   }
   for(const node of hero.querySelectorAll('.fb-logo,.fb-top-nav,.fb-menu')){const rect=node.getBoundingClientRect();const cx=rect.left-s.left+rect.width/2,cy=rect.top-s.top+rect.height/2;node.classList.toggle('is-on-photo',Math.max(revealRadius,darkBallRadius)>Math.hypot(cx-x,cy-y)+35);}
  }
  function pose(time){
   measure();const portrait=innerWidth<800||(innerWidth<=1050&&innerHeight>innerWidth),close=smooth(.07,.35,progress)*(1-smooth(.52,.75,progress));
   pointerX+=(aimX-pointerX)*.09;pointerY+=(aimY-pointerY)*.09;
   const response=1-smooth(.17,.38,progress);
   const flat=['athletics','boardgames','indiangames'].includes(slug);
   const distance=portrait?Math.max(6.8,(ball.userData.width+.3)/(2*Math.tan(17*Math.PI/180)*camera.aspect)*1.12):8.2;
   camera.position.set((portrait?0:.3)+pointerX*.15*response,(flat?1.8:.65)+pointerY*.1*response,distance-close*.48);
   camera.lookAt(portrait?0:-1.45,.1+ball.userData.focusY*.5,0);camera.updateMatrixWorld();
   ball.position.set(portrait?.15:.45,-.003,0);contact.position.x=ball.position.x;
   let lift=0,turn=flight?0:.85*progress;
   if(slug==='basketball'){lift=.22*Math.sin(Math.PI*clamp(progress/.65));turn=progress*1.15;}
   if(slug==='volleyball'){lift=.35*smooth(.1,.55,progress);turn=progress*.65;}
   if(slug==='badminton'){lift=.17*smooth(.05,.5,progress);turn=progress*.6;}
   if(slug==='weightlifting'){lift=.12*smooth(.1,.5,progress);turn=progress*.15;}
   if(slug==='aquatics')turn=progress*.45;
   ball.position.y+=lift;contact.material.opacity=.7-lift*.65;
   ball.rotation.set(0,turn+pointerX*.09*response,0);
   if(flight){action=flight.update(progress,camera);contact.material.opacity=.7*(1-smooth(.26,.65,progress));}
   paintProgress();
  }
  function report(){window.sportDetailExperience.state={ready:!lost,slug,frames,progress,camera:camera.position.toArray(),rotation:ball.rotation.toArray().slice(0,3),geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,buffer:[renderer.domElement.width,renderer.domElement.height],lost,...(action?{strike:action}:{})};}
  function tick(time){
   raf=0;if(dead||lost||!active||document.hidden)return;
   if(reduced.matches){experience?.dispose();experience=null;return;}
   if(time-last<1000/30){raf=requestAnimationFrame(tick);return;}last=time;
   pose(time);if(progress<.94){renderer.render(scene,camera);frames++;}report();
   if(progress<.94&&Math.abs(aimX-pointerX)+Math.abs(aimY-pointerY)>.001)raf=requestAnimationFrame(tick);
  }
  function wake(){if(!raf&&!dead&&!lost&&active&&!document.hidden&&!reduced.matches)raf=requestAnimationFrame(tick);}
  const scroll=()=>{paintProgress();wake();};
  on(window,'pagehide',()=>{cancelAnimationFrame(raf);raf=0;});
  on(window,'scroll',scroll,{passive:true});on(window,'resize',()=>{measure();scroll();},{passive:true});
  on(window,'pageshow',scroll);on(document,'visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;}else wake();});
  on(stage,'pointermove',e=>{if(e.pointerType!=='mouse'||!matchMedia('(pointer:fine)').matches)return;const rect=stage.getBoundingClientRect();aimX=clamp((e.clientX-rect.left)/rect.width)*2-1;aimY=1-clamp((e.clientY-rect.top)/rect.height)*2;wake();},{passive:true});
  on(stage,'pointerleave',()=>{aimX=aimY=0;wake();});on(window,'blur',()=>{aimX=aimY=0;wake();});
  on(renderer.domElement,'webglcontextlost',e=>{e.preventDefault();lost=true;cancelAnimationFrame(raf);raf=0;scene.environment=null;owned.forEach(value=>value.dispose?.());owned.delete(environment);mount.classList.remove('is-ready');report();});
  on(renderer.domElement,'webglcontextrestored',()=>{lost=false;makeEnvironment();mount.classList.add('is-ready');last=0;pose(performance.now());renderer.render(scene,camera);frames++;report();wake();});
  observer=new IntersectionObserver(entries=>{active=entries[0].isIntersecting;if(active)wake();else{cancelAnimationFrame(raf);raf=0;}},{threshold:0});observer.observe(stage);
  resizeObserver=new ResizeObserver(()=>{measure();scroll();});resizeObserver.observe(stage);
  // A fast section shortcut can finish while a model import is still pending.
  // Never insert the taller cinematic above someone who has already left it.
  if(reduced.matches||departed||!entryVisible()){starting=false;dispose();observeEntry();return;}
  experience={dispose,wake};starting=false;
  // Commit layout once. Browser-restored/deep section entries are never scrolled.
  hero.classList.add('scene-enhanced');measure();pose(0);renderer.render(scene,camera);frames++;mount.classList.add('is-ready');report();wake();
 }catch(error){
  dispose();starting=false;experience=null;
  window.sportDetailExperience.state={ready:false,frames,progress,error:String(error)};
  console.warn('Sport page: static portrait available.',error);
 }
}
if(hero){
 const ready=()=>requestAnimationFrame(observeEntry);
 if(location.hash&&document.readyState!=='complete')window.addEventListener('load',ready,{once:true});else ready();
 reduced.addEventListener('change',()=>{boot?.disconnect();if(reduced.matches){experience?.dispose();experience=null;}else observeEntry();});
 window.addEventListener('pagehide',e=>{if(!e.persisted){departed=true;boot?.disconnect();experience?.dispose();experience=null;}});
 window.addEventListener('pageshow',()=>{departed=false;if(experience)experience.wake();else observeEntry();});
}
