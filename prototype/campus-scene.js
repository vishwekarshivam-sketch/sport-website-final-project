import * as THREE from './vendor/three.module.js';

// Artistic shallow relief, in photograph pixel coordinates; not surveyed geometry.
const roofs = [[140,44,297,118,.24],[285,45,381,170,.27],[367,44,463,230,.32],[459,49,546,233,.31],[538,52,641,237,.29],[685,55,835,239,.34],[1012,270,1136,418,.24],[487,665,681,771,.27],[182,766,427,890,.35]];
const trees = [[76,180,100,220],[70,535,100,140],[260,665,190,70],[1050,104,88,170],[991,381,42,160],[1150,680,85,210],[760,849,170,70],[485,15,460,40]];
const smooth = t => { t=THREE.MathUtils.clamp(t,0,1);return t*t*(3-2*t); };
export function heightAt(x,y){
  let h=0;
  for(const [l,t,r,b,z] of roofs){const edge=Math.min(x-l,r-x,y-t,b-y);h=Math.max(h,z*smooth(edge/12));}
  for(const [cx,cy,rx,ry] of trees){const d=Math.hypot((x-cx)/rx,(y-cy)/ry);h=Math.max(h,.23*smooth((1-d)*3));}
  // Fade boundary relief so the photograph keeps clean edges.
  return h*smooth(Math.min(x,1280-x,y,892-y)/24);
}
export async function createCampusScene({stage,shell,motion,reduced,fine}){
  const status=document.querySelector('#scene-status');
  const view=document.querySelector('#scene-view');
  const original=document.querySelector('#campus-photo');
  const angle=document.querySelector('#campus-angle');
  const modeButtons=[...document.querySelectorAll('[data-campus-mode]')];
  const renderState=document.querySelector('#campus-render-state');
  const help=document.querySelector('#campus-help');
  function fallback(){renderState.textContent='Original photograph · 3D unavailable';help.textContent='The original campus photograph.';angle.disabled=true;document.querySelector('#campus-reset').disabled=true;modeButtons.forEach(b=>{b.disabled=b.dataset.campusMode!=='original';b.setAttribute('aria-pressed',String(b.dataset.campusMode==='original'));});}

  let renderer;
  try {renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});} catch {status.textContent='Original photograph · WebGL unavailable';stage.dataset.renderer='fallback';view.disabled=true;fallback();return;}
  const canvas=renderer.domElement;
  canvas.setAttribute('aria-hidden','true');canvas.className='campus-canvas';
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  let texture;
  try {texture=await new THREE.TextureLoader().loadAsync(original.src);}catch(error){renderer.dispose();fallback();throw error;}
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
  const scene=new THREE.Scene();
  const geometry=new THREE.PlaneGeometry(10,10*892/1280,160,112);
  const positions=geometry.attributes.position;
  for(let i=0;i<positions.count;i++)positions.setZ(i,heightAt((positions.getX(i)/10+.5)*1280,(.5-positions.getY(i)/(10*892/1280))*892));
  geometry.computeVertexNormals();
  const material=new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide});
  const mesh=new THREE.Mesh(geometry,material);scene.add(mesh);
  const base=new THREE.Mesh(new THREE.BoxGeometry(10,10*892/1280,.16),new THREE.MeshBasicMaterial({color:0x526b57}));
  base.position.z=-.085;scene.add(base);
  const border=new THREE.LineSegments(new THREE.EdgesGeometry(base.geometry),new THREE.LineBasicMaterial({color:0x9caf92}));border.position.copy(base.position);scene.add(border);

  const wireMaterial=new THREE.MeshBasicMaterial({color:0x82e8b6,wireframe:true});
  const camera=new THREE.OrthographicCamera(-5,5,3.484375,-3.484375,.1,100);
  camera.position.z=15;
  shell.append(canvas);
  canvas.dataset.vertices=String(positions.count);
  stage.dataset.renderer='webgl';
  let visible=true,lost=false,frame=0,px=0,py=0,currentX=0,currentY=0,currentZoom=.86;
  function enabled(){return motion.checked&&!reduced.matches&&view.value!=='original'&&!lost;}
  function updateVisibility(){
    const active=enabled();shell.classList.toggle('scene-active',active);
    mesh.material=view.value==='mesh'?wireMaterial:material;
    renderer.setClearColor(0x102d26,1);
    modeButtons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.campusMode===view.value)));
    angle.disabled=!active;document.querySelector('#campus-reset').disabled=!active;
    renderState.textContent=active?'LIVE 3D · DRAG TO EXPLORE':'ORIGINAL PHOTOGRAPH';
    help.textContent=active?'Drag across the campus to change your perspective.':'The original campus photograph. Enable motion in Design study to explore 3D.';
    if(lost)fallback();
    status.textContent=lost?'Original photograph · graphics context lost':active?(view.value==='mesh'?'3D relief · 35,840 triangles':'WebGL · photographic relief'):'Original photograph · motion off';
    schedule();
  }
  function draw(){
    frame=0;if(!visible||document.hidden||!enabled())return;
    const r=stage.getBoundingClientRect();
    const progress=THREE.MathUtils.clamp((innerHeight-r.top)/(innerHeight+r.height),0,1);
    const tx=THREE.MathUtils.degToRad(Number(angle.value))+px*.035,ty=-.50+(progress-.5)*.20+py*.03;
    const zoom=.86;
    currentX+=(tx-currentX)*.09;currentY+=(ty-currentY)*.09;currentZoom+=(zoom-currentZoom)*.09;
    camera.position.set(Math.sin(currentX)*15,Math.sin(currentY)*15,15);
    camera.lookAt(0,0,0);camera.zoom=currentZoom;camera.updateProjectionMatrix();
    renderer.render(scene,camera);
    canvas.dataset.camera=`${currentX.toFixed(3)},${currentY.toFixed(3)},${currentZoom.toFixed(3)}`;
    if(Math.abs(tx-currentX)+Math.abs(ty-currentY)+Math.abs(zoom-currentZoom)>.0001)schedule();
  }
  function schedule(){if(!frame&&visible&&!document.hidden&&enabled())frame=requestAnimationFrame(draw);}
  const resize=new ResizeObserver(()=>{const aspect=shell.clientWidth/shell.clientHeight;camera.left=-6;camera.right=6;camera.top=6/aspect;camera.bottom=-6/aspect;camera.updateProjectionMatrix();renderer.setSize(shell.clientWidth,shell.clientHeight,false);schedule();});resize.observe(shell);
  const intersection=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(!visible){cancelAnimationFrame(frame);frame=0;}else schedule();});intersection.observe(stage);
  let drag=null;
  shell.addEventListener('pointerdown',e=>{if(!enabled())return;drag={x:e.clientX,angle:Number(angle.value)};shell.setPointerCapture(e.pointerId);shell.classList.add('dragging');});
  shell.addEventListener('pointermove',e=>{if(drag){angle.value=String(THREE.MathUtils.clamp(drag.angle+(e.clientX-drag.x)/shell.clientWidth*90,-35,35));schedule();}else if(fine.matches){const r=shell.getBoundingClientRect();px=(e.clientX-r.left)/r.width-.5;py=.5-(e.clientY-r.top)/r.height;schedule();}});
  function endDrag(){drag=null;shell.classList.remove('dragging');px=py=0;schedule();}
  shell.addEventListener('pointerup',endDrag);shell.addEventListener('pointercancel',endDrag);shell.addEventListener('lostpointercapture',endDrag);
  shell.addEventListener('pointerleave',()=>{if(!drag){px=py=0;schedule();}});
  angle.addEventListener('input',schedule);
  modeButtons.forEach(button=>button.addEventListener('click',()=>{view.value=button.dataset.campusMode;updateVisibility();}));
  document.querySelector('#campus-reset').addEventListener('click',()=>{angle.value='-14';px=py=0;updateVisibility();});
  window.addEventListener('scroll',schedule,{passive:true});
  document.addEventListener('visibilitychange',schedule);
  motion.addEventListener('change',updateVisibility);view.addEventListener('change',updateVisibility);
  reduced.addEventListener('change',updateVisibility);
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();lost=true;stage.dataset.renderer='fallback';updateVisibility();});
  canvas.addEventListener('webglcontextrestored',()=>{lost=false;stage.dataset.renderer='webgl';updateVisibility();});
  updateVisibility();
}
