import { quality, motionPreference, pixelRatio, rendererOptions, tuneShadows, frameBudget, guardRenderer } from './render-policy.js';
/* A native-scroll journey through an authored landscape. No scroll interception. */
const host=document.querySelector('.ac-journey'),stage=document.querySelector('.ac-stage'),mount=document.querySelector('.ac-canvas');
const preference=motionPreference(true),fine=matchMedia('(pointer:fine)');
const clamp=x=>Math.max(0,Math.min(1,x)),smooth=t=>{t=clamp(t);return t*t*(3-2*t);};
let instance=null,starting=false,boot,departed=false,lastReduced=preference.matches;
window.adventureExperience={state:{ready:false,frames:0}};
if(host&&!preference.matches)host.classList.add('has-motion');
let communityView;
const rememberCommunity=()=>{if(preference.matches!==lastReduced)return;const r=document.querySelector('#people').getBoundingClientRect();communityView={top:r.top,bottom:r.bottom};};
rememberCommunity();addEventListener('scroll',rememberCommunity,{passive:true});addEventListener('resize',rememberCommunity,{passive:true});
function changeMotionLayout(enabled){
 const keepReading=communityView.top<innerHeight&&communityView.bottom>120,oldTop=communityView.top;
 host.classList.toggle('has-motion',enabled);
 if(keepReading)scrollBy({top:document.querySelector('#people').getBoundingClientRect().top-oldTop,behavior:'instant'});
 rememberCommunity();
}
const visible=()=>{const r=host.getBoundingClientRect();return r.top<innerHeight&&r.bottom>120&&!document.querySelector('.ac-lightbox')?.open;};
function observe(){
 if(!host||preference.matches||instance||starting||departed)return;
 boot?.disconnect();boot=new IntersectionObserver(entries=>{if(entries[0].isIntersecting){boot.disconnect();start();}},{rootMargin:'-120px 0px 0px 0px'});boot.observe(host);
}
async function start(){
 if(starting||instance||preference.matches||departed)return;starting=true;
 const resources=new Set(),keep=v=>(resources.add(v),v),events=new AbortController();
 let renderer,world,scene,camera,raf=0,dead=false,lost=false,frames=0,last=0,resizeObserver,observer,width=0,height=0,layoutHeight=0,progress=0,phase='landscape',px=0,py=0,aimX=0,aimY=0;
 const on=(target,name,fn,options={})=>target.addEventListener(name,fn,{...options,signal:events.signal});
 const dispose=()=>{if(dead)return;dead=true;cancelAnimationFrame(raf);raf=0;events.abort();resizeObserver?.disconnect();observer?.disconnect();scene?.traverse(o=>o.shadow?.map?.dispose());resources.forEach(r=>r.dispose?.());resources.clear();renderer?.dispose();renderer?.domElement.remove();stage.classList.remove('is-ready');window.adventureExperience.state={...window.adventureExperience.state,ready:false,frames,progress,calls:0,geometries:0,textures:0};};
 try{
  const [T,{createAdventureWorld}]=await Promise.all([import('./vendor/three.module.js'),import('./adventure-world-model.js?v=tent-1')]);
  if(preference.matches||departed||!visible()){starting=false;dispose();observe();return;}
  renderer=new T.WebGLRenderer(rendererOptions({}));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;
  renderer.domElement.setAttribute('aria-hidden','true');mount.append(renderer.domElement);
  scene=new T.Scene();scene.background=new T.Color('#b8bcaa');scene.fog=new T.FogExp2('#c1c5b2',.0065);
  camera=new T.PerspectiveCamera(55,1,.035,1000);
  scene.add(new T.HemisphereLight('#f1dec0','#263e2e',1.8));
  const sun=new T.DirectionalLight('#ffe0a4',3.1);sun.position.set(35,55,-22);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-42,right:42,top:42,bottom:-42,near:.5,far:160});sun.shadow.bias=-.0003;sun.shadow.normalBias=.07;sun.target.position.set(0,0,-14);scene.add(sun,sun.target);
  const fill=new T.DirectionalLight('#b5c9bf',.85);fill.position.set(-14,8,18);scene.add(fill);
  world=await createAdventureWorld(scene,keep);tuneShadows(scene);guardRenderer(renderer,()=>{dispose();changeMotionLayout(false);});
  const positions=[new T.Vector3(0,23.4,16),new T.Vector3(1.2,25.3,1),new T.Vector3(-2,25,-3),new T.Vector3(4,28.5,-16),new T.Vector3(8,25,-7)];
  const targets=[new T.Vector3(1,14,-65),new T.Vector3(4,18,-80),new T.Vector3(-13,26,-14),new T.Vector3(15,16,-95),new T.Vector3(15,23,-28)];
  let checkpoints=[],rail=[],entryStart=0,insideStart=0,exitStart=0,exitFinish=0;
  const target=new T.Vector3(),lerp=T.MathUtils.lerp;
  function measure(){
   const r=stage.getBoundingClientRect();if(r.width===width&&r.height===height&&host.offsetHeight===layoutHeight&&checkpoints.length)return;
   width=r.width;height=r.height;layoutHeight=host.offsetHeight;
   renderer.setPixelRatio(pixelRatio(width,height));renderer.setSize(width,height,false);camera.aspect=width/Math.max(1,height);camera.updateProjectionMatrix();renderer.shadowMap.needsUpdate=true;
   const base=host.getBoundingClientRect().top+scrollY,top=selector=>document.querySelector(selector).getBoundingClientRect().top+scrollY-base;
   checkpoints=[0,...['overview','climbing','trekking','outlook'].map(id=>top('#'+id)-height*.18)];
   entryStart=top('.ac-tent-entry')-height*.4;insideStart=top('#people')-height*.92;
   exitStart=top('.ac-tent-exit')-height*.2;exitFinish=host.offsetHeight-height;
   const portrait=innerWidth<800;
   rail=positions.map((position,i)=>{const point=position.clone(),aim=targets[i].clone();
    if(portrait){if(i===0)point.z+=13;if(i===4){point.y+=1;point.z+=9;aim.x+=2;aim.y-=2;}}
    return {offset:checkpoints[i],point,aim,fov:portrait?64:55,phase:'landscape'};
   });
   const campView=rail.at(-1);rail.push({...campView,offset:entryStart});
   const add=(offset,xyz,aim,phase)=>rail.push({offset,point:world.tentPoint(...xyz),aim:world.tentPoint(...aim),fov:portrait?76:72,phase});
   // The same local axis crosses both portals; no roof, pole or floor teleport.
   add(lerp(entryStart,insideStart,.38),[0,.86,5.6],[0,.72,-2.5],'approach');
   add(lerp(entryStart,insideStart,.68),[0,.70,2.6],[0,.70,-2.5],'entrance');
   add(lerp(entryStart,insideStart,.84),[0,.68,1.3],[0,.68,-3.5],'entrance');
   add(insideStart,[0,.68,.45],[0,.68,-4.5],'inside');
   add(exitStart,[0,.68,.45],[0,.68,-4.5],'inside');
   add(lerp(exitStart,exitFinish,.4),[0,.68,-1.2],[0,.74,-5.5],'exit');
   add(lerp(exitStart,exitFinish,.7),[0,.82,-2.9],[0,1.05,-15],'exit');
   add(exitFinish,[0,1.65,-5.6],[0,1.5,-32],'outside');
  }
  function pose(time){
   measure();const distance=Math.max(1,host.offsetHeight-height),offset=Math.max(0,-host.getBoundingClientRect().top);progress=clamp(offset/distance);
   let segment=0;while(segment<rail.length-2&&offset>=rail[segment+1].offset)segment++;
   const a=rail[segment],b=rail[segment+1],t=smooth((offset-a.offset)/Math.max(1,b.offset-a.offset));
   camera.position.lerpVectors(a.point,b.point,t);target.lerpVectors(a.aim,b.aim,t);
   const fov=lerp(a.fov,b.fov,t);if(camera.fov!==fov){camera.fov=fov;camera.updateProjectionMatrix();}
   px+=(aimX-px)*.08;py+=(aimY-py)*.08;
   const pointerWeight=1-smooth((offset-entryStart)/Math.max(1,insideStart-entryStart));camera.position.x+=px*.16*pointerWeight;camera.position.y+=py*.09*pointerWeight;
   phase=offset>=exitFinish?'outside':offset>=exitStart?'exit':offset>=insideStart?'inside':offset>=entryStart?'entrance':'landscape';
   host.dataset.place=phase;camera.lookAt(target);camera.updateMatrixWorld();world.update(time*.001);
  }
  function report(){window.adventureExperience.state={ready:!lost,frames,progress,phase,peopleTop:document.querySelector('#people').getBoundingClientRect().top,tentLocal:world.tentLocal(camera.position).toArray(),stops:{entry:entryStart,inside:insideStart,exit:exitStart,outside:exitFinish},camera:camera.position.toArray(),target:target.toArray(),calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures,buffer:[renderer.domElement.width,renderer.domElement.height],lost,...world.stats};}
  let activeUntil=0;
  function tick(time){raf=0;if(preference.matches){applyMotionPreference();return;}if(dead||lost||document.hidden||!visible())return;if(time-last<1000/30){raf=requestAnimationFrame(tick);return;}last=time;pose(time);renderer.render(scene,camera);frames++;report();if(time<activeUntil)raf=requestAnimationFrame(tick);}
  function wake(){activeUntil=performance.now()+650;if(!raf&&!dead&&!lost&&!document.hidden&&!preference.matches&&visible())raf=requestAnimationFrame(tick);}
  on(window,'scroll',()=>{if(visible())wake();else{cancelAnimationFrame(raf);raf=0;}},{passive:true});on(window,'resize',()=>{width=0;measure();wake();},{passive:true});
  on(stage,'pointermove',e=>{if(e.pointerType!=='mouse'||!fine.matches)return;aimX=e.clientX/innerWidth*2-1;aimY=1-e.clientY/innerHeight*2;},{passive:true});
  on(host,'pointermove',e=>{if(e.pointerType!=='mouse'||!fine.matches)return;aimX=e.clientX/innerWidth*2-1;aimY=1-e.clientY/innerHeight*2;},{passive:true});on(host,'pointerleave',()=>{aimX=aimY=0;});
  on(document,'visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;}else wake();});on(window,'pageshow',wake);on(window,'pagehide',()=>{cancelAnimationFrame(raf);raf=0;});
  on(document,'adventuregallery',e=>{if(e.detail.open){cancelAnimationFrame(raf);raf=0;}else wake();});
  on(renderer.domElement,'webglcontextlost',e=>{e.preventDefault();lost=true;cancelAnimationFrame(raf);raf=0;scene.traverse(o=>{if(o.shadow?.map){o.shadow.map.dispose();o.shadow.map=null;}});resources.forEach(r=>r.dispose?.());stage.classList.remove('is-ready');report();});
  on(renderer.domElement,'webglcontextrestored',()=>{lost=false;renderer.shadowMap.needsUpdate=true;pose(performance.now());renderer.render(scene,camera);frames++;stage.classList.add('is-ready');report();wake();});
  resizeObserver=new ResizeObserver(()=>{width=0;measure();wake();});resizeObserver.observe(stage);resizeObserver.observe(host);document.fonts.ready.then(()=>{if(dead)return;width=0;measure();wake();});
  observer=new IntersectionObserver(()=>{if(visible())wake();else{cancelAnimationFrame(raf);raf=0;}});observer.observe(host);
  if(preference.matches||departed||!visible()){starting=false;dispose();observe();return;}
  instance={dispose,wake};starting=false;measure();pose(0);renderer.shadowMap.needsUpdate=true;renderer.render(scene,camera);frames++;stage.classList.add('is-ready');report();wake();
 }catch(error){dispose();starting=false;instance=null;window.adventureExperience.state={ready:false,frames,error:String(error)};changeMotionLayout(false);console.warn('Adventure landscape: static view retained.',error);}
}
if(host){
 const ready=()=>requestAnimationFrame(observe);if(location.hash&&document.readyState!=='complete')addEventListener('load',ready,{once:true});else ready();
 preference.addEventListener('change',applyMotionPreference);
 // Some engines deliver media events late; CSS reflow also observes the change.
 const motionLayoutObserver=new ResizeObserver(applyMotionPreference);motionLayoutObserver.observe(host);
 addEventListener('pagehide',e=>{if(!e.persisted){departed=true;motionLayoutObserver.disconnect();boot?.disconnect();instance?.dispose();instance=null;}});addEventListener('pageshow',()=>{departed=false;instance?instance.wake():observe();});
}

function applyMotionPreference(){
 if(lastReduced===preference.matches)return;lastReduced=preference.matches;boot?.disconnect();
 if(preference.matches){instance?.dispose();instance=null;}
 changeMotionLayout(!preference.matches);
 if(!preference.matches)observe();
}
