import { quality, motionPreference, pixelRatio, rendererOptions, tuneShadows, frameBudget } from './render-policy.js';
/* Source-ranked rostrums. Fixed geometry, one finite crown-light relay per new selection. */
const reduced=motionPreference(),hosts=[document.querySelector('#overall-podium-world'),document.querySelector('#sport-podium-world')],instances=new Map(),starting=new Set(),state={frames:0,active:0};window.gcRostrums={state,instances};
let departed=false;const visible=h=>{const r=h.getBoundingClientRect();return r.width>0&&r.height>0&&r.bottom>0&&r.top<innerHeight;};const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
const data=h=>window.gcRankingData?.[h.id.startsWith('overall')?'overall':'sport'];
async function start(host){
 if(instances.has(host)||starting.has(host)||reduced.matches||departed||!visible(host)||!data(host)?.rows.length)return;starting.add(host);
 const resources=new Set(),own=x=>(resources.add(x),x);let renderer,scene,camera,resize,raf=0,dead=false,width=0,height=0,signature='',startTime=0,duration=760,columns=[],from=[],target=[],angle=0,first=true;
 function dispose(){if(dead)return;dead=true;cancelAnimationFrame(raf);resize?.disconnect();renderer?.domElement.remove();scene?.traverse(o=>o.shadow?.map?.dispose());resources.forEach(o=>o.dispose?.());renderer?.dispose();host.classList.remove('is-ready');instances.delete(host);state.active=instances.size;}
 try{
  const [T,{createStudioEnvironment}]=await Promise.all([import('./vendor/three.module.js'),import('./gc-model.js?v=pursuit-1')]);await document.fonts.ready;
  if(departed||reduced.matches||!visible(host)){starting.delete(host);dispose();return;}
  renderer=new T.WebGLRenderer(rendererOptions({alpha:true}));renderer.setClearColor(0,0);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.0;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;renderer.domElement.setAttribute('aria-hidden','true');host.querySelector('.rostrum-canvas').append(renderer.domElement);
  scene=new T.Scene();scene.environment=createStudioEnvironment(renderer,own);scene.environmentIntensity=.75;scene.add(new T.HemisphereLight('#fff9e9','#66785e',1.8));const sun=new T.DirectionalLight('#fff1d2',3.1);sun.position.set(-3,7,5);sun.castShadow=true;sun.shadow.mapSize.set(quality.lite?512:1024,quality.lite?512:1024);Object.assign(sun.shadow.camera,{left:-10,right:10,top:6,bottom:-6,near:.1,far:25});sun.shadow.normalBias=.02;scene.add(sun);
  camera=new T.OrthographicCamera(-5,5,2,-2,.1,60);camera.position.set(0,4.5,9);camera.lookAt(0,.8,0);
  const cream=own(new T.MeshStandardMaterial({color:'#e8e2d3',roughness:.65})),green=own(new T.MeshPhysicalMaterial({color:'#294c3c',roughness:.35,metalness:.3,clearcoat:.3})),brass=own(new T.MeshStandardMaterial({color:'#c6a468',metalness:.85,roughness:.27}));
  const shape=new T.Shape();shape.moveTo(-.47,-.5);shape.lineTo(.47,-.5);shape.quadraticCurveTo(.5,-.5,.5,-.47);shape.lineTo(.5,.47);shape.quadraticCurveTo(.5,.5,.47,.5);shape.lineTo(-.47,.5);shape.quadraticCurveTo(-.5,.5,-.5,.47);shape.lineTo(-.5,-.47);shape.quadraticCurveTo(-.5,-.5,-.47,-.5);
  const geometry=own(new T.ExtrudeGeometry(shape,{depth:1,bevelEnabled:true,bevelSegments:2,bevelSize:.015,bevelThickness:.015,steps:1}));geometry.rotateX(-Math.PI/2);
  const mesh=(g,m,parent)=>{const o=new T.Mesh(g,m);o.castShadow=o.receiveShadow=true;parent.add(o);return o;};
  for(let i=0;i<3;i++){
   const g=new T.Group();scene.add(g);const base=mesh(geometry,green,g),body=mesh(geometry,cream,g),cap=mesh(geometry,own(brass.clone()),g);base.scale.set(1.05,.12,1.05);body.position.y=.12;cap.position.y=1.1;cap.scale.y=.055;
   const flutes=[];for(let k=0;k<8;k++){const f=mesh(own(new T.BoxGeometry(.018,1,.018)),cream,g);f.position.set(-.43+k*.123,.62,.525);flutes.push(f);}const faces=[];for(const side of [-1,1]){const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;const texture=own(new T.CanvasTexture(canvas));texture.colorSpace=T.SRGBColorSpace;const mat=own(new T.MeshBasicMaterial({map:texture,transparent:true}));const plate=mesh(own(new T.PlaneGeometry(.48,.48)),mat,g);plate.position.z=side*.55;if(side<0)plate.rotation.y=Math.PI;faces.push({canvas,texture,plate});}
   columns.push({g,base,body,cap,faces,flutes,height:.1,angle:0});
  }
  const floor=mesh(own(new T.PlaneGeometry(80,80)),own(new T.ShadowMaterial({color:'#071c13',opacity:.20})),scene);floor.rotation.x=-Math.PI/2;floor.position.y=-.02;floor.castShadow=false;
  function measure(){const r=host.getBoundingClientRect();if(r.width===width&&r.height===height)return;width=r.width;height=r.height;const aspect=width/Math.max(1,height),span=3.2;camera.left=-span*aspect/2;camera.right=span*aspect/2;camera.top=span/2;camera.bottom=-span/2;camera.updateProjectionMatrix();renderer.setPixelRatio(pixelRatio(width,height));renderer.setSize(width,height,false);columns.forEach((c,i)=>{c.g.position.x=(i-1)*span*aspect/3;c.g.scale.x=Math.min(2.3,span*aspect*.18);c.faces.forEach(f=>f.plate.scale.x=1/c.g.scale.x);});}
  function pose(finish=false){
   const elapsed=performance.now()-startTime;let running=false;
   columns.forEach((c,i)=>{const row=target[i];c.g.visible=!!row;if(!row)return;const t=finish?1:Math.max(0,Math.min(1,(elapsed-[80,0,160][i])/duration)),q=smooth(t);if(t<1)running=true;
    const value=row.height;c.height=value;c.angle=0;c.cap.material.emissive.set('#d8ab62');c.cap.material.emissiveIntensity=finish||t>=1?0:Math.sin(Math.PI*t)*.85;c.g.rotation.y=c.angle+[-.18,.10,.18][i];c.body.scale.y=Math.max(.06,value);c.cap.position.y=value+.12;c.flutes.forEach(f=>{f.scale.y=Math.max(.05,value-.08);f.position.y=value/2+.12;});c.faces.forEach(f=>{f.plate.position.y=value*.58+.12;});
   });return running;
  }
  function draw(finish=false){measure();const running=pose(finish);renderer.shadowMap.needsUpdate=true;renderer.render(scene,camera);state.frames++;host.classList.add('is-ready');return running;}
  function tick(){raf=0;if(dead||document.hidden||reduced.matches||!visible(host))return;if(draw()&&!state.paused)raf=requestAnimationFrame(tick);else first=false;}
  function update(animate=true){const d=data(host);if(!d)return;const next=d.key+JSON.stringify(d.rows);if(next===signature)return;signature=next;cancelAnimationFrame(raf);raf=0;from=columns.map(c=>({height:c.height,angle:c.angle}));angle=0;target=[d.rows[1],d.rows[0],d.rows[2]].map(r=>r?{...r,height:({1:1.75,2:1.25,3:.95}[r.rank]||.8)}:null);
   columns.forEach((c,i)=>c.faces.forEach(f=>{const ctx=f.canvas.getContext('2d');ctx.clearRect(0,0,256,256);if(target[i]){ctx.fillStyle='#173f34';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='96px Faktum';ctx.fillText(String(target[i].rank).padStart(2,'0'),128,128);}f.texture.needsUpdate=true;}));
   duration=650;startTime=performance.now();if(visible(host)){if(animate)raf=requestAnimationFrame(tick);else draw(true);}
  }
  const inst={dispose,update,resume(){if(!visible(host))return;update();draw(true);first=false;},host,renderer,columns,get signature(){return signature;}};instances.set(host,inst);state.active=instances.size;
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();cancelAnimationFrame(raf);host.classList.remove('is-ready');});renderer.domElement.addEventListener('webglcontextrestored',()=>{dispose();start(host);});
  resize=new ResizeObserver(()=>{width=0;if(visible(host)&&!reduced.matches){if(!raf)raf=requestAnimationFrame(tick);}});resize.observe(host);
  update(true);starting.delete(host);
 }catch(error){dispose();starting.delete(host);state.error=String(error);}
}
const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){if(instances.has(e.target))instances.get(e.target).resume();else start(e.target);} }),{threshold:.05});hosts.forEach(h=>observer.observe(h));
document.addEventListener('gc:rankings',()=>hosts.forEach(h=>{if(instances.has(h))instances.get(h).update();else if(visible(h))start(h);}));
document.addEventListener('visibilitychange',()=>{if(!document.hidden)instances.forEach(i=>i.resume());});
reduced.addEventListener('change',()=>{if(reduced.matches){[...instances.values()].forEach(i=>i.dispose());}else hosts.forEach(h=>{if(visible(h))start(h);});});
addEventListener('pagehide',()=>{departed=true;[...instances.values()].forEach(i=>i.dispose());});addEventListener('pageshow',()=>{departed=false;hosts.forEach(h=>{if(visible(h))start(h);});});
