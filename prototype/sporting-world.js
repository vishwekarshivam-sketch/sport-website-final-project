import { quality, motionPreference, pixelRatio, rendererOptions, tuneShadows, frameBudget, guardRenderer } from './render-policy.js';
/* Directory-only progressive enhancement. Native scroll drives a real perspective
   camera; the explore link merely animates that same scroll position. */
const host=document.querySelector('.sporting-world');
if(host) boot();

async function boot(){
  const mount=host.querySelector('.world-canvas'),stage=host.querySelector('.world-stage');
  const copy=host.querySelector('.world-copy');
  const menu=document.querySelector('#sports'),reveal=menu.closest('.submerged-directory')||menu;
  const reduced=motionPreference(true);
  let renderer,world,water,camera,T,raf=0,travelFrame=0,resizeObserver,intersectionObserver;
  let waterUntil=performance.now()+1400;
  let visible=true,lost=false,paused=false,dead=false,ready=false,last=0,time=0,renderCount=0;
  let progress=0,start=0,distance=1,lastScroll=scrollY,underwater=false;
  let bufferWidth=0,bufferHeight=0,bufferRatio=0;
  const compact=matchMedia('(max-width:700px)').matches;
  const finePointer=matchMedia('(any-hover: hover) and (any-pointer: fine)');
  const pointer={x:0,y:0,aimX:0,aimY:0,clientX:0,clientY:0,overWater:false,inside:false};
  const clamp=x=>Math.max(0,Math.min(1,x));
  const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
  const mix=(a,b,t)=>a+(b-a)*t;
  const eventScope=new AbortController();
  const on=(target,event,callback,options={})=>target.addEventListener(event,callback,{...options,signal:eventScope.signal});
  function measure(){start=host.getBoundingClientRect().top+scrollY;distance=Math.max(1,host.offsetHeight-stage.offsetHeight);}
  function cancelTravel(){cancelAnimationFrame(travelFrame);travelFrame=0;host.classList.remove('world-travelling');}
  function gotoMenu(target,focus=true){
    cancelTravel();const top=target.getBoundingClientRect().top+scrollY-20;
    window.scrollTo({top,behavior:'instant'});
    if(focus){const heading=target.querySelector('h2');heading?.setAttribute('tabindex','-1');heading?.focus({preventScroll:true});}
    reveal.style.setProperty('--world-reveal','1');reveal.classList.add('world-menu-visible');
    history.replaceState(null,'',`#${target.id}`);
  }
  // Available before any module or WebGL work succeeds, including reduced motion.
  for(const link of host.querySelectorAll('[data-world-skip]'))on(link,'click',e=>{
    const target=document.querySelector(link.hash);if(target){e.preventDefault();gotoMenu(target);}
  });
  for(const name of ['wheel','touchstart','pointerdown'])on(window,name,()=>cancelTravel(),{passive:true});
  on(window,'keydown',e=>{if(['Escape','PageUp','PageDown','Home','End','ArrowUp','ArrowDown',' '].includes(e.key))cancelTravel();});
  function clearVisuals(){for(const key of ['copy','copy-shift','controls','wet','arrival'])host.style.removeProperty(`--world-${key}`);copy.inert=false;reveal.style.removeProperty('--world-reveal');reveal.classList.remove('world-menu-visible');}
  function fallback(reason){
    const reading=reveal.getBoundingClientRect(),keepReading=reading.top<innerHeight&&reading.bottom>0;
    ready=false;host.classList.remove('world-ready','world-enhanced');host.classList.add('world-static');
    cancelAnimationFrame(raf);raf=0;cancelTravel();clearVisuals();if(keepReading)scrollBy(0,reveal.getBoundingClientRect().top-reading.top);
    if(reason)console.warn('Sporting world: showing the accessible poster.',reason);
  }
  try{
    // Static preference does not download Three.js, create GPU resources or request frames.
    if(reduced.matches){host.classList.add('world-static');on(reduced,'change',()=>{eventScope.abort();boot();});return;}
    T=await import('./vendor/three.module.js');
    const [{createWorld},{createWater}]=await Promise.all([import('./sporting-world-model.js'),import('./sporting-world-water.js')]);
    renderer=new T.WebGLRenderer(rendererOptions({alpha:false}));
    renderer.setPixelRatio(pixelRatio(stage.clientWidth,stage.clientHeight));
    renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.04;
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=quality.lite?T.PCFSoftShadowMap:T.VSMShadowMap;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
    renderer.info.autoReset=false;
    renderer.domElement.setAttribute('aria-hidden','true');mount.append(renderer.domElement);
    world=createWorld(renderer,compact);water=createWater(renderer,world.scene,compact);tuneShadows(world.scene);
    camera=new T.PerspectiveCamera(44,1,.08,300);
    ready=true;
    const fogColor=new T.Color(0x286a65);
    const look=new T.Vector3(),offset=new T.Vector3(),up=new T.Vector3(0,1,0),right=new T.Vector3(1,0,0);
    let titlePortrait;
    const raycaster=new T.Raycaster(),surface=new T.Plane(up,0),hit=new T.Vector3(),cursor=new T.Vector2();
    const lastWake=new T.Vector3(Infinity,0,Infinity);let lastWakeTime=-10;
    function resetPointer(){pointer.aimX=pointer.aimY=0;pointer.inside=pointer.overWater=false;}
    on(window,'pointermove',e=>{
      if(e.pointerType!=='mouse'||!finePointer.matches||paused||lost||dead||!visible||progress>.2)return;
      const rect=stage.getBoundingClientRect();
      if(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom){resetPointer();return;}
      waterUntil=performance.now()+700;schedule();
      pointer.clientX=e.clientX;pointer.clientY=e.clientY;pointer.inside=true;
      pointer.aimX=clamp((e.clientX-rect.left)/rect.width)*2-1;
      pointer.aimY=1-clamp((e.clientY-rect.top)/rect.height)*2;
      pointer.overWater=!e.target.closest('a,button,summary,.header,.world-copy,.world-controls');
    },{passive:true});
    on(document.documentElement,'pointerleave',resetPointer);
    on(window,'blur',resetPointer);
    function pose(dt){
      measure();progress=reduced.matches?0:clamp((scrollY-start)/distance);
      const move=smooth(.08,.92,progress),dive=smooth(.25,.78,progress);
      const narrow=stage.clientWidth/stage.clientHeight<1;
      const z=narrow?55:22,x=narrow?2.5:0;
      const restFov=T.MathUtils.radToDeg(2*Math.atan(Math.tan(T.MathUtils.degToRad(22))*(narrow?.51:1.85)/camera.aspect));
      if(!paused){
        if(progress>.2)resetPointer();
        const ease=1-Math.exp(-dt*5.5);
        pointer.x=mix(pointer.x,pointer.aimX,ease);pointer.y=mix(pointer.y,pointer.aimY,ease);
        camera.position.set(mix(x,.2,move),mix(2.7,-2.9,dive),mix(z,11,move));
        camera.fov=mix(restFov,restFov+5,move);camera.updateProjectionMatrix();
        look.set(mix(x,.2,move),mix(5,-1.8,dive),-3);
        const influence=1-smooth(0,.2,progress);
        offset.copy(camera.position).sub(look);
        // Orbit the perspective camera around the architecture. Foreground and
        // distant objects then shift by different amounts, including reflections.
        offset.applyAxisAngle(right,-pointer.y*(narrow?.0095:.022)*influence);
        offset.applyAxisAngle(up,pointer.x*(narrow?.028:.065)*influence);
        camera.position.copy(look).add(offset);camera.lookAt(look);camera.updateMatrixWorld();
      }
      world.titleGroup.scale.set(narrow?1.6:1,narrow?1.6:1,1);
      world.titleGroup.position.set(narrow?1.4:0,narrow?8:0,narrow?-.9:0);
      if(titlePortrait!==narrow){renderer.shadowMap.needsUpdate=true;titlePortrait=narrow;}
      const wet=smooth(.15,-.7,camera.position.y); // inverted endpoints intentionally follow submersion
      underwater=camera.position.y<.04;
      world.scene.fog=underwater?new T.FogExp2(fogColor,.022+wet*.026):null;
      host.style.setProperty('--world-copy',1-smooth(.02,.2,progress));
      host.style.setProperty('--world-copy-shift',String(smooth(0,.2,progress)*24));
      host.style.setProperty('--world-controls',1-smooth(.18,.38,progress));
      host.style.setProperty('--world-wet',String(wet*.7));
      host.style.setProperty('--world-arrival',String(smooth(.72,.95,progress)));
      reveal.style.setProperty('--world-reveal',String(smooth(.64,.9,progress)));
      reveal.classList.toggle('world-menu-visible',progress>.7);
      copy.inert=progress>.24;
      // Controls retain keyboard access; focus restores their visibility in CSS.
    }
    function disturbWater(){
      if(paused||!pointer.inside||!pointer.overWater||progress>.12||underwater)return;
      const rect=stage.getBoundingClientRect();
      cursor.set((pointer.clientX-rect.left)/rect.width*2-1,1-(pointer.clientY-rect.top)/rect.height*2);
      raycaster.setFromCamera(cursor,camera);
      if(!raycaster.ray.intersectPlane(surface,hit)||Math.abs(hit.x)>26||hit.z<3.3||hit.z>60)return;
      const moved=lastWake.distanceToSquared(hit)>.16;
      if(time-lastWakeTime<(moved?.24:.65))return;
      // Reject the floating ring and any architecture in front of the pool.
      const distance=raycaster.ray.origin.distanceTo(hit);
      raycaster.far=distance-.08;
      const blocked=raycaster.intersectObjects([world.ring],true).length>0;
      raycaster.far=Infinity;if(blocked)return;
      water.disturb(hit.x,hit.z,time,moved?.06:.035);lastWake.copy(hit);lastWakeTime=time;
    }
    const failBudget=()=>{dead=true;fallback('Frame budget exceeded');water?.dispose();world?.dispose();renderer.dispose();mount.replaceChildren();};const budget=frameBudget(failBudget);guardRenderer(renderer,failBudget);
    function draw(now){
      const frameStart=performance.now();
      raf=0;if(dead||lost||!visible||document.hidden)return;
      const elapsed=now-last;
      if(elapsed<1000/30&&!paused){schedule();return;}
      const dt=Math.min(elapsed/1000,.05);
      if(!paused)time+=dt;
      last=now;pose(dt);disturbWater();
      if(!paused){world.ring.position.y=.07+Math.sin(time*.65)*.018;world.ring.rotation.z=Math.sin(time*.42)*.008;}
      world.update(time);renderer.info.reset();water.render(camera,time);renderCount++;
      if(!host.classList.contains('world-enhanced')){host.classList.remove('world-static');host.classList.add('world-enhanced');measure();}
      host.classList.add('world-ready');
      budget(performance.now()-frameStart);if(!dead&&!paused&&!reduced.matches&&progress<.97&&now<waterUntil)schedule();
    }
    function schedule(){if(!raf&&!lost&&!dead&&visible&&!document.hidden)raf=requestAnimationFrame(draw);}
    function resize(){
      if(lost||dead)return;
      const w=stage.clientWidth,h=stage.clientHeight;if(!w||!h)return;
      // Viewport-sized targets are reused throughout the native-scroll journey.
      const bh=Math.max(h,innerHeight),ratio=pixelRatio(w,bh);
      if(w!==bufferWidth||bh!==bufferHeight||ratio!==bufferRatio){
        renderer.setPixelRatio(ratio);renderer.setSize(w,bh,false);water.resize(w,bh);
        bufferWidth=w;bufferHeight=bh;bufferRatio=ratio;
      }
      camera.aspect=w/h;camera.updateProjectionMatrix();measure();schedule();
    }
    resizeObserver=new ResizeObserver(resize);resizeObserver.observe(stage);
    intersectionObserver=new IntersectionObserver(entries=>{
      visible=entries[0].isIntersecting;
      if(visible){last=performance.now();schedule();}else{cancelAnimationFrame(raf);raf=0;}
    },{threshold:0});intersectionObserver.observe(stage);
    on(window,'scroll',()=>{if(scrollY!==lastScroll){lastScroll=scrollY;waterUntil=performance.now()+400;resetPointer();schedule();}},{passive:true});
    on(document,'visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;cancelTravel();}else{last=performance.now();schedule();}});
    on(reduced,'change',()=>{
      cancelTravel();fallback();water?.dispose();world?.dispose();renderer.dispose();resizeObserver.disconnect();intersectionObserver.disconnect();dead=true;eventScope.abort();mount.replaceChildren();boot();
    });
    on(renderer.domElement,'webglcontextlost',e=>{
      e.preventDefault();lost=true;fallback();
      // Release old-context listeners/handles while GL is still lost; disposing
      // them after Three rebuilds its context produces invalid-handle warnings.
      water?.dispose();world?.dispose();water=null;world=null;
    });
    on(renderer.domElement,'webglcontextrestored',()=>{
      if(dead||reduced.matches)return;
      try{
        // Render-target environment data is regenerated after a graphics reset.
        world=createWorld(renderer,compact);water=createWater(renderer,world.scene,compact);tuneShadows(world.scene);
        lost=false;ready=true;bufferWidth=0;renderer.shadowMap.needsUpdate=true;host.classList.remove('world-static');host.classList.add('world-enhanced');resize();
        if(['#sports','#clubs'].includes(location.hash))gotoMenu(document.querySelector(location.hash),false);
      }catch(error){fallback(error);}
    });
    on(window,'pageshow',()=>{measure();schedule();});
    on(window,'pagehide',e=>{
      cancelTravel();cancelAnimationFrame(raf);raf=0;
      if(!e.persisted){dead=true;eventScope.abort();resizeObserver.disconnect();intersectionObserver.disconnect();water?.dispose();world?.dispose();renderer.dispose();}
    });
    // Read-only diagnostics are useful for browser verification; not exposed as UI.
    window.sportingWorld={get state(){return {ready,paused,visible,lost,progress,underwater,renderCount,camera:camera.position.toArray(),pointer:[pointer.x,pointer.y],ripples:water?.interaction,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures};}};
    resize();
    // Preserve direct collection links despite the enhanced section's new scroll height.
    if(['#sports','#clubs'].includes(location.hash))requestAnimationFrame(()=>gotoMenu(document.querySelector(location.hash),false));
  }catch(error){water?.dispose();world?.dispose();renderer?.dispose();mount.replaceChildren();fallback(error);}
}
