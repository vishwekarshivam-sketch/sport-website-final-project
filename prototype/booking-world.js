import { quality, motionPreference, pixelRatio, rendererOptions, tuneShadows, frameBudget } from './render-policy.js';
/* Inside the lines: one procedural scene, existing local Three.js, event-driven rendering. */
(() => {
 const root=document.querySelector('#booking-world');if(!root)return;
 const hero=document.querySelector('.booking-hero'),mount=root.querySelector('.booking-world-canvas');
 const reduce=motionPreference(),fine=matchMedia('(hover:hover) and (pointer:fine)');
 const state={kind:root.dataset.kind,ready:false,frames:0,animating:false,camera:[],calls:0,triangles:0};window.bookingWorld={state};
 let instance,starting=false,entered=false,departed=false,failed=false;
 const pose={x:0,y:0};
 async function start(){
  if(instance||starting||failed||reduce.matches||departed||document.hidden)return;starting=true;
  let renderer,scene,raf=0,dead=false,lost=false,entry=null,width=0,height=0;const resources=new Set(),events=new AbortController(),keep=o=>(resources.add(o),o);
  function dispose(){if(dead)return;dead=true;cancelAnimationFrame(raf);events.abort();scene?.traverse(o=>o.shadow?.map?.dispose());resources.forEach(o=>o.dispose?.());renderer?.dispose();renderer?.domElement.remove();root.dataset.renderer='poster';state.ready=false;state.animating=false;instance=null;}
  try{
   const T=await import('./vendor/three.module.js');if(reduce.matches||departed||document.hidden){starting=false;return;}
   const bad=state.kind==='badminton';scene=new T.Scene();scene.background=new T.Color(bad?'#879c85':'#8da896');scene.fog=new T.Fog(bad?'#879c85':'#8da896',bad?22:45,bad?50:95);
   renderer=new T.WebGLRenderer(rendererOptions({alpha:false}));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;renderer.domElement.setAttribute('aria-hidden','true');mount.append(renderer.domElement);
   const camera=new T.PerspectiveCamera(49,1,.1,150);scene.add(new T.HemisphereLight('#f0f2dc','#284c35',2.1));
   const sun=new T.DirectionalLight('#fff0cd',2.8);sun.position.set(-12,22,12);sun.castShadow=true;sun.shadow.mapSize.set(quality.lite?512:1024,quality.lite?512:1024);Object.assign(sun.shadow.camera,{left:-25,right:25,top:25,bottom:-25,near:1,far:65});sun.shadow.normalBias=.025;scene.add(sun);
   const mat=(color,roughness=.8)=>keep(new T.MeshStandardMaterial({color,roughness}));
   const green=mat('#173f34'),post=mat(bad?'#73846a':'#304d3d'),ivory=mat('#edeed4'),wood=mat('#9f7851'),base=mat('#3c5b40');
   function box(w,h,d,material,x,y,z){const m=new T.Mesh(keep(new T.BoxGeometry(w,h,d)),material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;scene.add(m);return m;}
   function beam(a,b,r,material){const from=new T.Vector3(...a),to=new T.Vector3(...b),delta=to.clone().sub(from);const m=new T.Mesh(keep(new T.CylinderGeometry(r,r,delta.length(),8)),material);m.position.copy(from).add(to).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());m.castShadow=true;scene.add(m);return m;}
   function texture(w,h,paint){const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;paint(canvas.getContext('2d'),w,h);const map=keep(new T.CanvasTexture(canvas));map.colorSpace=T.SRGBColorSpace;map.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());return map;}
   let seed=73;const random=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
   const grass=bad?null:texture(quality.lite?384:768,quality.lite?512:1024,(c,w,h)=>{c.fillStyle='#356544';c.fillRect(0,0,w,h);for(let y=0;y<8;y++){c.fillStyle=y%2?'#346442':'#3b704b';c.fillRect(0,y*h/8,w,h/8);}for(let i=0;i<(quality.lite?10000:110000);i++){c.fillStyle=random()>.5?'#c4cc7626':'#0a311a24';c.fillRect(random()*w,random()*h,1,2+random()*3);}c.strokeStyle='#e5e9cf';c.lineWidth=3.5;c.strokeRect(w*.07,h*.045,w*.86,h*.91);c.beginPath();c.moveTo(w*.07,h*.5);c.lineTo(w*.93,h*.5);c.stroke();c.beginPath();c.ellipse(w*.5,h*.5,w*.13,h*.09,0,0,Math.PI*2);c.stroke();for(const bottom of [false,true]){const y=bottom?h*.955:h*.045,dir=bottom?-1:1;c.strokeRect(w*.29,y,w*.42,dir*h*.15);c.strokeRect(w*.39,y,w*.22,dir*h*.055);}c.fillStyle='#e5e9cf';c.beginPath();c.arc(w*.5,h*.5,4,0,Math.PI*2);c.fill();});
   const timber=!bad?null:texture(quality.lite?256:512,quality.lite?512:1024,(c,w,h)=>{c.fillStyle='#ba9969';c.fillRect(0,0,w,h);for(let x=0;x<w;x+=24){c.fillStyle=x%48?'#ae8a5e':'#c4a375';c.fillRect(x,0,23,h);for(let y=(x%72)*6;y<h;y+=210){c.fillStyle='#765d3c50';c.fillRect(x,y,24,1);}}for(let i=0;i<12000;i++){c.fillStyle='#6f502215';c.fillRect(random()*w,random()*h,.6,10+random()*24);}});
   const court=!bad?null:texture(quality.lite?256:512,quality.lite?512:1024,(c,w,h)=>{c.fillStyle='#285f4d';c.fillRect(0,0,w,h);for(let i=0;i<20000;i++){c.fillStyle='#d0dfb40b';c.fillRect(random()*w,random()*h,1,1);}c.strokeStyle='#f0edd1';c.lineWidth=3;c.strokeRect(w*.035,h*.035,w*.93,h*.93);c.strokeRect(w*.085,h*.035,w*.83,h*.93);c.beginPath();for(const y of [.12,.355,.5,.645,.88]){c.moveTo(w*.035,h*y);c.lineTo(w*.965,h*y);}c.moveTo(w*.5,h*.035);c.lineTo(w*.5,h*.355);c.moveTo(w*.5,h*.645);c.lineTo(w*.5,h*.965);c.stroke();});
   function floor(w,d,map,y=0){const material=keep(new T.MeshStandardMaterial({map,roughness:.91}));const m=new T.Mesh(keep(new T.PlaneGeometry(w,d)),material);m.rotation.x=-Math.PI/2;m.position.y=y;m.receiveShadow=true;scene.add(m);return m;}
   if(bad){floor(13,23,timber);floor(6.65,14.1,court,.014);box(13,.22,23,base,0,-.13,0);}
   else{floor(26,43,grass);box(26,.25,43,base,0,-.16,0);}
   const netTexture=texture(64,64,(c,w,h)=>{c.clearRect(0,0,w,h);c.strokeStyle='#ffffff';c.lineWidth=2;c.beginPath();c.moveTo(0,0);c.lineTo(w,0);c.moveTo(0,0);c.lineTo(0,h);c.stroke();});netTexture.colorSpace=T.NoColorSpace;
   function meshNet(w,h,x,y,z,angle=0,color='#b6c6a5',cell=.27){const map=keep(netTexture.clone());map.wrapS=map.wrapT=T.RepeatWrapping;map.repeat.set(w/cell,h/cell);const material=keep(new T.MeshStandardMaterial({color,alphaMap:map,transparent:true,opacity:.72,side:T.DoubleSide,depthWrite:false,roughness:.9}));const m=new T.Mesh(keep(new T.PlaneGeometry(w,h)),material);m.position.set(x,y,z);m.rotation.y=angle;scene.add(m);return m;}
   const side=bad?6.5:13,depth=bad?11.5:21.5,wall=bad?4:5.3;
   meshNet(depth*2,wall,-side,wall/2,0,Math.PI/2);meshNet(depth*2,wall,side,wall/2,0,Math.PI/2);meshNet(side*2,wall,0,wall/2,-depth);
   for(const x of [-side,side]){for(let z=-depth;z<=depth;z+=bad?3.8:5.3)beam([x,0,z],[x,wall,z],.045,post);beam([x,wall,-depth],[x,wall,depth],.04,post);beam([x,.18,-depth],[x,.18,depth],.035,post);}
   beam([-side,wall,-depth],[side,wall,-depth],.04,post);
   if(bad){
    meshNet(6.5,.76,0,1.14,0,0,'#d5dbc2',.085);box(6.5,.065,.035,ivory,0,1.55,0);
    for(const x of [-3.35,3.35]){beam([x,0,0],[x,1.6,0],.052,green);box(.4,.08,.45,green,x,.04,0);}
    // Distant hall structure frames the court; no named campus replica.
    box(13,2,.2,mat('#acb49a'),0,1,-11.8);for(const x of [-6.5,0,6.5]){box(.14,6,.2,post,x,3,-11.7);box(.14,6,.2,post,x,3,11.7);}beam([-6.5,5.8,-11.5],[6.5,5.8,-11.5],.075,ivory);
   }else{
    for(const z of [-19.6,19.6]){const direction=z<0?-1:1,back=z+direction*1.75;
     for(const x of [-3.4,3.4]){beam([x,0,z],[x,2.45,z],.07,ivory);beam([x,2.45,z],[x,2.45,back],.055,ivory);beam([x,0,back],[x,2.45,back],.045,ivory);meshNet(1.75,2.45,x,1.225,(z+back)/2,Math.PI/2,'#d8dfca',.19);}
     beam([-3.4,2.45,z],[3.4,2.45,z],.07,ivory);beam([-3.4,2.45,back],[3.4,2.45,back],.04,ivory);meshNet(6.8,2.45,0,1.225,back,0,'#d8dfca',.19);
    }
   }
   for(const z of [bad?-6:-12,bad?6:12]){const x=bad?5.1:11.4;box(.65,.12,2.1,wood,x,.58,z);for(const dz of [-.75,.75])box(.12,.55,.12,post,x,.28,z+dz);}
   function measure(){const w=innerWidth,h=innerHeight;if(w===width&&h===height)return;width=w;height=h;renderer.setPixelRatio(pixelRatio(w,h));renderer.setSize(w,h,false);camera.aspect=w/h;camera.fov=w<650?59:49;camera.setViewOffset(w,h,w<650?-w*.16:-w*.18,w<650?-h*.12:0,w,h);camera.updateProjectionMatrix();renderer.shadowMap.needsUpdate=true;}
   function draw(now){raf=0;if(dead||lost||document.hidden||reduce.matches)return;measure();let settle=1;
    if(entry!==null){settle=Math.min(1,(now-entry)/950);settle=1-(1-settle)**3;if(settle>=1){entry=null;state.animating=false;}}
    const progress=Math.max(0,Math.min(1,scrollY/Math.max(1,hero.offsetHeight)));state.progress=progress;
    if(progress>=1&&state.progressDrawn===1&&entry===null)return;state.progressDrawn=progress;
    const px=pose.x,py=pose.y;
    if(bad){camera.position.set(4.5+px*.3,3.3+(1-settle)*.7+progress*.35+py*.1,8.5+(1-settle)*1.1-progress*.6);camera.lookAt(-.6,1.05,-2.7);}
    else{camera.position.set(8.2+px*.45,5.1+(1-settle)*.8+progress*.45+py*.12,15.6+(1-settle)*1.2-progress*.7);camera.lookAt(-.5,1.4,-9);}
    renderer.render(scene,camera);state.frames++;state.calls=renderer.info.render.calls;state.triangles=renderer.info.render.triangles;state.camera=camera.position.toArray();state.ready=true;root.dataset.renderer='ready';root.dataset.frames=state.frames;if(entry!==null)raf=requestAnimationFrame(draw);
   }
   function request(){if(!raf&&!dead&&!lost&&!document.hidden&&!reduce.matches)raf=requestAnimationFrame(draw);}
   function settle(){cancelAnimationFrame(raf);raf=0;entry=null;state.animating=false;}
   function resize(){if(dead||lost||document.hidden)return;settle();state.progressDrawn=-1;draw(performance.now());}
   renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();lost=true;settle();root.dataset.renderer='poster';state.ready=false;},{signal:events.signal});
   renderer.domElement.addEventListener('webglcontextrestored',()=>{lost=false;renderer.shadowMap.needsUpdate=true;resize();},{signal:events.signal});
   instance={dispose,request,settle,resize};if(!entered&&scrollY<hero.offsetHeight){entry=performance.now();state.animating=true;}entered=true;state.ready=true;request();
  }catch(error){failed=true;state.error=String(error.message);dispose();root.dataset.renderer='poster';root.dataset.failure='unavailable';}
  starting=false;
 }
 addEventListener('scroll',()=>instance?.request(),{passive:true});addEventListener('resize',()=>instance?.resize(),{passive:true});
 hero.addEventListener('pointermove',event=>{if(!fine.matches)return;const r=hero.getBoundingClientRect();pose.x=(event.clientX/innerWidth-.5)*2;pose.y=(event.clientY-r.top)/r.height-.5;instance?.request();},{passive:true});
 hero.addEventListener('pointerleave',()=>{pose.x=pose.y=0;instance?.request();},{passive:true});
 document.addEventListener('focusin',()=>{instance?.settle();instance?.request();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)instance?.settle();else if(instance)instance.request();else start();});
 reduce.addEventListener('change',()=>{if(reduce.matches)instance?.dispose();else start();});
 addEventListener('pagehide',()=>{departed=true;instance?.dispose();});addEventListener('pageshow',()=>{departed=false;start();});start();
})();
