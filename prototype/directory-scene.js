import {createSportObjects} from './opening-sports.js';
const mount=document.querySelector('#collection-canvas');
if(mount)init();
async function init(){
 const host=mount.parentElement,button=host.querySelector('button'),reduced=matchMedia('(prefers-reduced-motion:reduce)');
 if(reduced.matches)return;
 let renderer;
 try{
  const T=await import('./vendor/three.module.js');
  renderer=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
  renderer.setClearColor(0x000000,0);mount.append(renderer.domElement);
  const scene=new T.Scene(),camera=new T.PerspectiveCamera(34,1,.1,40);
  camera.position.set(0,3.5,8.7);camera.lookAt(0,1.1,0);
  scene.add(new T.HemisphereLight(0xfff5dd,0x6e7e5f,2.8));
  const key=new T.DirectionalLight(0xfff1cf,4);key.position.set(-4,6,5);scene.add(key);
  const fill=new T.DirectionalLight(0xe8f0dc,1.2);fill.position.set(5,3,-3);scene.add(fill);
  const assembly=new T.Group();scene.add(assembly);
  const ball=createSportObjects(T,'football').main;ball.scale.setScalar(.67);ball.position.set(-1.25,.88,.7);ball.rotation.set(.15,.2,-.12);assembly.add(ball);
  const badminton=createSportObjects(T,'badminton');
  // Only its shuttle enters this composition; no second racket or flight scene.
  const shuttle=badminton.satellite;shuttle.scale.setScalar(1.28);shuttle.position.set(-1.1,2.05,-.65);shuttle.rotation.set(.15,.1,-.65);assembly.add(shuttle);
  const wood=new T.MeshStandardMaterial({color:0x947044,roughness:.6});
  const knight=new T.Group();assembly.add(knight);knight.position.set(.55,0,-.5);knight.rotation.y=-.3;
  const lathePoints=[[0,0],[.49,0],[.53,.06],[.53,.13],[.46,.2],[.43,.25],[.44,.32],[.34,.4],[.25,.63],[.23,.83],[.32,.94],[.3,1.04],[0,1.04]].map(([x,y])=>new T.Vector2(x,y));
  const base=new T.Mesh(new T.LatheGeometry(lathePoints,48),wood);knight.add(base);
  const shape=new T.Shape();shape.moveTo(-.28,.9);shape.lineTo(-.36,1.25);shape.lineTo(-.28,1.6);shape.lineTo(-.37,1.83);shape.lineTo(-.17,2.18);shape.lineTo(.03,2.28);shape.lineTo(.11,2.56);shape.lineTo(.3,2.33);shape.lineTo(.44,2.22);shape.lineTo(.54,1.84);shape.lineTo(.25,1.68);shape.lineTo(.05,1.8);shape.lineTo(-.03,1.54);shape.lineTo(.32,1.16);shape.lineTo(.3,.9);shape.closePath();
  const neck=new T.Mesh(new T.ExtrudeGeometry(shape,{depth:.28,bevelEnabled:true,bevelSegments:4,bevelSize:.08,bevelThickness:.06,curveSegments:16}),wood);neck.position.z=-.14;knight.add(neck);
  const eyeMat=new T.MeshStandardMaterial({color:0x393a27,roughness:.7});
  for(const z of [-.215,.215]){const eye=new T.Mesh(new T.SphereGeometry(.035,12,8),eyeMat);eye.position.set(.27,2.14,z);knight.add(eye);}
  // A sculpted mane edge gives the knight a recognisable silhouette from above.
  for(let i=0;i<5;i++){const mane=new T.Mesh(new T.BoxGeometry(.11,.13,.32),wood);mane.position.set(-.32-i*.005,1.46+i*.12,0);mane.rotation.z=-.3;knight.add(mane);}
  const cube=new T.Group();assembly.add(cube);cube.position.set(1.48,.63,.85);cube.rotation.set(.06,-.4,-.08);
  const cubeMats=[0x698260,0xdad8bd,0xc49a67,0x234c3a,0xd6d7b3,0x9e624d].map(color=>new T.MeshStandardMaterial({color,roughness:.5}));
  const cubieGeometry=new T.BoxGeometry(.35,.35,.35);
  const core=new T.Mesh(new T.BoxGeometry(1.1,1.1,1.1),new T.MeshStandardMaterial({color:0x173f34,roughness:.8}));cube.add(core);
  for(let x=-1;x<=1;x++)for(let y=-1;y<=1;y++)for(let z=-1;z<=1;z++)if(Math.abs(x)+Math.abs(y)+Math.abs(z)>0){const cubie=new T.Mesh(cubieGeometry,cubeMats);cubie.position.set(x*.39,y*.39,z*.39);cube.add(cubie);}
  const shadowCanvas=document.createElement('canvas');shadowCanvas.width=128;shadowCanvas.height=128;
  const ctx=shadowCanvas.getContext('2d'),gradient=ctx.createRadialGradient(64,64,0,64,64,64);gradient.addColorStop(0,'#173f3460');gradient.addColorStop(.4,'#173f3420');gradient.addColorStop(1,'#173f3400');ctx.fillStyle=gradient;ctx.fillRect(0,0,128,128);
  const shadowTexture=new T.CanvasTexture(shadowCanvas);
  function shadow(x,z,width,depth){const mesh=new T.Mesh(new T.PlaneGeometry(width,depth),new T.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false}));mesh.rotation.x=-Math.PI/2;mesh.position.set(x,-.04,z);scene.add(mesh);}
  shadow(-1.25,.7,2.6,2.2);shadow(.55,-.5,2,1.8);shadow(1.48,.85,2,1.8);shadow(-1.1,-.65,1.5,1.2);
  let paused=false,pausedAt=0,visible=true,frame=0,category='all',pointerX=0,pointerY=0,started=performance.now(),last=started,lost=false;
  const origins=[ball,shuttle,knight,cube].map(o=>({x:o.position.x,y:o.position.y,z:o.position.z}));
  const objects=[ball,shuttle,knight,cube];
  const lerp=(a,b,t)=>a+(b-a)*t;
  function draw(now){
   frame=0;if(!visible||document.hidden||lost||reduced.matches)return;
   if(paused){renderer.render(scene,camera);return;}
   const dt=Math.min(.05,(now-last)/1000);last=now;
   const entrance=paused?1:Math.min(1,(now-started)/1150),ease=1-(1-entrance)**3;
   const blend=paused?1:1-Math.exp(-dt*6);
   let moving=false;
   objects.forEach((object,index)=>{
    const selected=category==='all'||(category==='sports'?index<2:index>=2);
    const targetZ=origins[index].z+(category!=='all'?(selected ? .22 : -.18):0);
    const targetY=origins[index].y+(1-ease)*(.25+index*.08)+(category!=='all'&&selected ? .08 : 0);
    object.position.z=lerp(object.position.z,targetZ,blend);object.position.y=lerp(object.position.y,targetY,blend);
    if(Math.abs(object.position.z-targetZ)+Math.abs(object.position.y-targetY)>.001)moving=true;
   });
   const targetX=paused?0:pointerY*.035,targetY=paused?0:pointerX*.08;
   assembly.rotation.x=lerp(assembly.rotation.x,targetX,blend);assembly.rotation.y=lerp(assembly.rotation.y,targetY,blend);
   moving ||= Math.abs(assembly.rotation.x-targetX)+Math.abs(assembly.rotation.y-targetY)>.0001;
   renderer.render(scene,camera);host.classList.add('is-ready');
   if(!paused&&(entrance<1||moving))schedule();
  }
  function schedule(){if(!frame&&visible&&!document.hidden&&!lost&&!reduced.matches){last=performance.now();frame=requestAnimationFrame(draw);}}
  function resize(){const w=mount.clientWidth,h=mount.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();schedule();}
  new ResizeObserver(resize).observe(mount);
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)schedule();else{cancelAnimationFrame(frame);frame=0;}},{rootMargin:'40px'}).observe(host);
  host.addEventListener('pointermove',event=>{if(paused||event.pointerType!=='mouse')return;const r=host.getBoundingClientRect();pointerX=(event.clientX-r.left)/r.width-.5;pointerY=(event.clientY-r.top)/r.height-.5;schedule();});
  host.addEventListener('pointerleave',()=>{pointerX=pointerY=0;schedule();});
  document.addEventListener('directory:filter',event=>{category=event.detail.category;schedule();});
  category=document.querySelector('[data-filter][aria-pressed=true]')?.dataset.filter||'all';
  button.hidden=false;button.addEventListener('click',()=>{
   paused=!paused;
   if(paused){pausedAt=performance.now();cancelAnimationFrame(frame);frame=0;}
   else{started+=performance.now()-pausedAt;schedule();}
   button.setAttribute('aria-pressed',String(paused));button.textContent=paused?'Resume motion':'Pause motion';
  });
  reduced.addEventListener('change',()=>{cancelAnimationFrame(frame);frame=0;if(!reduced.matches)schedule();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else schedule();});
  renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();lost=true;host.classList.remove('is-ready');button.hidden=true;});
  renderer.domElement.addEventListener('webglcontextrestored',()=>{lost=false;button.hidden=false;resize();});
  resize();
 }catch(error){renderer?.dispose();mount.replaceChildren();host.classList.remove('is-ready');button.hidden=true;console.warn('Collection illustration uses its static fallback.',error);}
}
