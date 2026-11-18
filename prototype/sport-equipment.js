/* Original equipment portraits for the selected close-up direction.
   No external models, brand marks or reconstructed facilities. */
import * as T from './vendor/three.module.js';
const V=(x,y,z)=>new T.Vector3(x,y,z);
export async function createEquipment(slug,keep){
 const root=new T.Group(),materials=new Map();
 let strikerSource,projectileSource,pivotSource,surfaceSource,projectileRadius;
 const material=(color,roughness=.65,metalness=0,extra={})=>{
  const key=[color,roughness,metalness,JSON.stringify(extra)].join(':');
  if(!materials.has(key))materials.set(key,new T.MeshStandardMaterial({color,roughness,metalness,...extra}));
  return materials.get(key);
 };
 const green=material(0x174737,.61),ivory=material(0xeee6d4,.77),dark=material(0x152d24,.81),steel=material(0xbfc8c2,.29,.85),wood=material(0xd7b481,.72);
 const mesh=(geometry,mat=green,parent=root,x=0,y=0,z=0)=>{const m=new T.Mesh(geometry,mat);m.position.set(x,y,z);parent.add(m);return m;};
 const box=(w,h,d,mat,parent=root,x=0,y=0,z=0)=>mesh(new T.BoxGeometry(w,h,d),mat,parent,x,y,z);
 const sphere=(r,mat,parent=root,x=0,y=0,z=0)=>mesh(new T.SphereGeometry(r,r<.03?12:64,r<.03?8:40),mat,parent,x,y,z);
 const cylinder=(r,h,mat,parent=root,x=0,y=0,z=0)=>mesh(new T.CylinderGeometry(r,r,h,64,1),mat,parent,x,y,z);
 const tube=(pts,r,mat=ivory,parent=root,closed=false)=>mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts,closed),pts.length===2?1:Math.max(12,pts.length*3),r,6,closed),mat,parent);
 const ring=(r,t,mat,parent=root,x=0,y=0,z=0)=>mesh(new T.TorusGeometry(r,t,8,r<.1?32:80),mat,parent,x,y,z);
 const texture=(paint,size=512)=>{const c=document.createElement('canvas');c.width=c.height=size;paint(c.getContext('2d'),size);const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;return t;};
 let seed=571;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const grain=texture((c,s)=>{c.fillStyle='#8f8f8f';c.fillRect(0,0,s,s);for(let i=0;i<16000;i++){const n=Math.floor(75+random()*125);c.fillStyle=`rgb(${n} ${n} ${n})`;c.beginPath();c.ellipse(random()*s,random()*s,.5+random(),.7,random(),0,7);c.fill();}});
 const leather=(color,roughness=.8)=>new T.MeshStandardMaterial({color,roughness,bumpMap:grain,bumpScale:.008});
 const rounded=(w,h,r)=>{const s=new T.Shape();s.moveTo(-w/2+r,-h/2);s.lineTo(w/2-r,-h/2);s.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);s.lineTo(w/2,h/2-r);s.quadraticCurveTo(w/2,h/2,w/2-r,h/2);s.lineTo(-w/2+r,h/2);s.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r);s.lineTo(-w/2,-h/2+r);s.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);return s;};
 const plate=(w,h,d,r,mat,parent=root,x=0,y=0,z=0)=>mesh(new T.ExtrudeGeometry(rounded(w,h,r),{depth:d,bevelEnabled:true,bevelSize:.015,bevelThickness:.015,bevelSegments:3,curveSegments:16}),mat,parent,x,y,z);
 function ball(type,r=1,parent=root,x=0,y=0,z=0){
  if(type==='volleyball'){
   sphere(r*.987,dark,parent,x,y,z);
   const directions=[V(0,0,1),V(0,0,-1),V(1,0,0),V(-1,0,0),V(0,1,0),V(0,-1,0)];
   directions.forEach((normal,face)=>{const q=new T.Quaternion().setFromUnitVectors(V(0,0,1),normal);
    for(let stripe=0;stripe<3;stripe++){
     const positions=[],normals=[],uv=[],indices=[],segments=20;
     for(let j=0;j<=segments;j++)for(let i=0;i<=segments;i++){
      const a=-1+2*(stripe+i/segments)/3,b=-1+2*j/segments;
      const u=T.MathUtils.lerp(-1+2*stripe/3+.013,-1+2*(stripe+1)/3-.013,i/segments),v=T.MathUtils.lerp(-.987,.987,j/segments);
      const p=V(u,v,1).normalize().applyQuaternion(q);positions.push(p.x*r+x,p.y*r+y,p.z*r+z);normals.push(p.x,p.y,p.z);uv.push((a+1)/2,(b+1)/2);
     }
     for(let j=0;j<segments;j++)for(let i=0;i<segments;i++){const a=j*(segments+1)+i,b=a+segments+1;indices.push(a,a+1,b,b,a+1,b+1);}
     const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);mesh(g,leather((face+stripe)%4===0?0x2b5643:0xede8da),parent);
    }
   });return;
  }
  const g=new T.SphereGeometry(r,64,40),p=g.attributes.position,colors=[];
  for(let i=0;i<p.count;i++){
   const n=V(p.getX(i),p.getY(i),p.getZ(i)).normalize();
   const distance=type==='basketball'?Math.min(Math.abs(n.x),Math.abs(n.z),Math.abs(n.y-.32*Math.cos(n.x*Math.PI))):type==='tennis'?Math.abs(Math.abs(n.x)-.62+.16*Math.cos(n.y*Math.PI)):99;
   const seam=Math.exp(-Math.pow(distance/.018,2));
   p.setXYZ(i,n.x*r*(1-seam*.008),n.y*r*(1-seam*.008),n.z*r*(1-seam*.008));
   const color=new T.Color(type==='basketball'?0xa64923:type==='tennis'?0xb6c344:type==='cricket'?0x80362c:type==='squash'?0x182a24:0xece5d5);
   color.lerp(new T.Color(type==='tennis'?0xeee9d3:0x1d2c23),seam*.94);colors.push(color.r,color.g,color.b);
  }
  g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeVertexNormals();
  const mat=leather(0xffffff,type==='tennis'?1:.8);mat.vertexColors=true;
  if(type==='basketball'||type==='tennis'){
   const c=document.createElement('canvas');c.width=1024;c.height=512;const ctx=c.getContext('2d'),data=ctx.createImageData(c.width,c.height);
   const base=type==='basketball'?[170,74,35]:[182,195,68],seamColor=type==='tennis'?[238,233,211]:[29,44,35];
   for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){
    const theta=y/(c.height-1)*Math.PI,phi=x/(c.width-1)*Math.PI*2,nx=-Math.cos(phi)*Math.sin(theta),ny=Math.cos(theta),nz=Math.sin(phi)*Math.sin(theta);
    const d=type==='basketball'?Math.min(Math.abs(nx),Math.abs(nz),Math.abs(ny-.32*Math.cos(nx*Math.PI))):Math.abs(Math.abs(nx)-.62+.16*Math.cos(ny*Math.PI));
    const mix=1-T.MathUtils.smoothstep(d,.011,.022),i=(y*c.width+x)*4;
    for(let channel=0;channel<3;channel++)data.data[i+channel]=base[channel]*(1-mix)+seamColor[channel]*mix;data.data[i+3]=255;
   }
   ctx.putImageData(data,0,0);mat.map=new T.CanvasTexture(c);mat.map.colorSpace=T.SRGBColorSpace;mat.vertexColors=false;
  }
  mesh(g,mat,parent,x,y,z);
  if(type==='cricket'){
   const thread=material(0xded2b4,.93);for(const side of [-1,1]){
    const line=ring(r*1.002,r*.007,thread,parent,x,y,z);line.rotation.y=Math.PI/2+side*.033;
    for(let i=0;i<70;i++){const a=i/70*Math.PI*2,pts=[V(Math.cos(a),Math.sin(a),side*.045).normalize().multiplyScalar(r*1.006).applyAxisAngle(V(0,1,0),Math.PI/2).add(V(x,y,z)),V(Math.cos(a+.014),Math.sin(a+.014),side*.075).normalize().multiplyScalar(r*1.006).applyAxisAngle(V(0,1,0),Math.PI/2).add(V(x,y,z))];mesh(new T.TubeGeometry(new T.LineCurve3(...pts),1,r*.0045,4,false),thread,parent);}
   }
  }
  if(type==='squash'){for(const xoff of [-.025,.025])sphere(.012,material(0xd8b746),parent,x+xoff,y+.1,z+r*.96);}
 }
 function racket(kind){
  const group=new T.Group();root.add(group);const wide=kind==='tennis'?.64:.48,high=kind==='tennis'?.85:.91;
  strikerSource=group;pivotSource=V(0,-1.16,0);surfaceSource=V(0,.5,.05);
  const frame=ring(1,.047,green,group,0,.5,0);frame.scale.set(wide,high,1);
  const rim=ring(1,.012,steel,group,0,.5,.045);rim.scale.set(wide,high,1);
  const strings=material(0xdcd8bf,.83);
  for(let i=-9;i<=9;i++){const x=i/10*wide,len=high*Math.sqrt(1-x*x/(wide*wide));tube([V(x,.5-len,.006),V(x,.5+len,.006)],.0033,strings,group);}
  for(let i=-11;i<=11;i++){const y=i/12*high,len=wide*Math.sqrt(1-y*y/(high*high));tube([V(-len,.5+y,.012),V(len,.5+y,.012)],.0032,strings,group);}
  tube([V(-.29,-.24,0),V(-.2,-.6,0),V(0,-.88,0)],.035,green,group);tube([V(.29,-.24,0),V(.2,-.6,0),V(0,-.88,0)],.035,green,group);
  const grip=cylinder(.073,.73,dark,group,0,-1.16,0);grip.scale.z=.8;
  for(let i=0;i<22;i++){const r=ring(.075,.006,material(0x51614c,.91),group,0,-1.5+i*.031,0);r.rotation.x=Math.PI/2;r.scale.y=.8;}
  group.rotation.set(-.13,-.24,-.29);
  projectileRadius=kind==='tennis'?.28:.16;projectileSource=new T.Group();projectileSource.position.set(.63,-1.25,.4);root.add(projectileSource);
  ball(kind==='tennis'?'tennis':'squash',projectileRadius,projectileSource);
 }
 if(slug==='basketball')ball('basketball');
 else if(slug==='volleyball')ball('volleyball');
 else if(slug==='tennis'||slug==='squash')racket(slug);
 else if(slug==='cricket'){
  const {createCricketBat}=await import('./cricket-bat.js');const bat=createCricketBat(T);bat.traverse(o=>{if(o.isMesh&&o.geometry.type==='TubeGeometry'){const p=o.geometry.parameters;o.geometry.dispose();o.geometry=new T.TubeGeometry(p.path,32,p.radius,4,p.closed);}});bat.rotation.set(.04,-.32,-.23);root.add(bat);
  strikerSource=bat;pivotSource=V(0,1.55,0);surfaceSource=V(0,-.75,.065);
  projectileRadius=.27;projectileSource=new T.Group();projectileSource.position.set(.65,-1.65,.35);root.add(projectileSource);ball('cricket',projectileRadius,projectileSource);
 }
 else if(slug==='badminton'){
  const shuttle=new T.Group();root.add(shuttle);
  const cork=sphere(.22,leather(0xe0c7a5,.94),shuttle,0,-.9,0);cork.scale.y=1.15;
  cylinder(.215,.22,ivory,shuttle,0,-.73,0);cylinder(.22,.045,green,shuttle,0,-.67,0);
  const featherMat=material(0xf3ecda,.88,0,{side:T.DoubleSide});
  const featherMap=texture((c,s)=>{c.fillStyle='#e9e2cf';c.fillRect(0,0,s,s);c.strokeStyle='#938d7a4a';c.lineWidth=1.3;for(let j=0;j<70;j++){c.beginPath();c.moveTo(s/2,j*s/70);c.lineTo(0,j*s/70-s*.12);c.moveTo(s/2,j*s/70);c.lineTo(s,j*s/70-s*.12);c.stroke();}});featherMat.bumpMap=featherMap;featherMat.bumpScale=.003;
  for(let n=0;n<16;n++){
   const angle=n/16*Math.PI*2,radial=V(Math.cos(angle),0,Math.sin(angle)),side=V(-Math.sin(angle),0,Math.cos(angle));
   const curve=t=>radial.clone().multiplyScalar(.17+.65*t+.05*Math.sin(t*Math.PI)).add(V(0,-.64+1.75*t,0));
   const positions=[],uv=[],indices=[];
   for(let j=0;j<=24;j++)for(let i=0;i<=4;i++){const t=j/24,w=Math.pow(Math.sin(Math.PI*t),.45)*.16,u=(i/4-.5)*2,p=curve(t).addScaledVector(side,u*w);p.addScaledVector(radial,-u*u*.035);positions.push(p.x,p.y,p.z);uv.push(i/4,t);}
   for(let j=0;j<24;j++)for(let i=0;i<4;i++){const a=j*5+i,b=a+5;indices.push(a,b,a+1,a+1,b,b+1);}
   const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();mesh(g,featherMat,shuttle);
   tube(Array.from({length:24},(_,i)=>curve(i/23)),.009,ivory,shuttle);
  }
  const binding=ring(.37,.009,ivory,shuttle,0,-.2,0);binding.rotation.x=Math.PI/2;shuttle.rotation.set(-.17,.1,-.36);
 }
 else if(slug==='tabletennis'){
  const group=new T.Group();root.add(group);const head=new T.Shape();head.absellipse(0,.22,.58,.68,0,Math.PI*2,false,0);
  mesh(new T.ExtrudeGeometry(head,{depth:.09,bevelEnabled:true,bevelSize:.015,bevelThickness:.012,bevelSegments:3,curveSegments:64}),wood,group);
  const front=mesh(new T.ShapeGeometry(head,64),leather(0x163e30,.94),group,0,0,.106);const back=mesh(new T.ShapeGeometry(head,64),leather(0x8c3d2f,.93),group,0,0,-.015);back.rotation.y=Math.PI;
  plate(.23,.77,.11,.055,wood,group,0,-.72,-.01);box(.035,.68,.005,green,group,0,-.74,.118);group.rotation.set(-.08,-.37,-.3);
  ball('plain',.19,root,.68,-.78,.35);
 }
 else if(slug==='aquatics'){
  const goggles=new T.Group();root.add(goggles);const glass=material(0x8bb7a8,.17,.12,{transparent:true,opacity:.72,side:T.DoubleSide,depthWrite:false});
  for(const side of [-1,1]){
   const frame=ring(.41,.075,green,goggles,side*.49,.05,.1);frame.scale.set(1,.72,1);
   const seal=ring(.4,.035,ivory,goggles,side*.49,.05,.04);seal.scale.set(1,.72,1);
   const lens=mesh(new T.SphereGeometry(.36,48,24,0,Math.PI*2,0,Math.PI*.5),glass,goggles,side*.49,.05,.1);lens.geometry.rotateX(Math.PI/2);lens.scale.set(1,.72,.23);
   const buckle=plate(.16,.23,.06,.04,steel,goggles,side*.99,-.05,.02);buckle.rotation.y=side*.3;
  }
  tube([V(-.13,.06,.1),V(0,.12,.13),V(.13,.06,.1)],.033,green,goggles);
  for(const y of [-.08,.04])tube([V(-1.02,y,0),V(-1.08,y,-.48),V(-.6,y,-.85),V(.6,y,-.85),V(1.08,y,-.48),V(1.02,y,0)],.035,green,goggles);
  goggles.rotation.set(-.18,-.18,-.12);
 }
 else if(slug==='athletics'){
  const rail=plate(.17,2.6,.1,.04,steel);rail.rotation.x=-Math.PI/2;rail.position.y=-.2;
  for(const [side,z] of [[-1,-.35],[1,.35]]){
   const pedal=new T.Group();root.add(pedal);pedal.position.set(side*.3,0,z);pedal.rotation.x=-.65;
   plate(.5,.76,.08,.07,steel,pedal,0,0,0);plate(.43,.65,.025,.05,leather(0x1c4937,.95),pedal,0,0,.095);
   for(let i=0;i<8;i++)box(.37,.014,.015,ivory,pedal,0,-.27+i*.077,.123);
   const hinge=cylinder(.08,.62,steel,pedal,0,-.25,-.05);hinge.rotation.z=Math.PI/2;
  }
  for(let i=0;i<12;i++)cylinder(.017,.012,dark,root,0,-.087,-1.1+i*.2);
  const baton=cylinder(.075,1.2,green,root,.75,-.15,.1);baton.rotation.z=-.2;baton.rotation.x=Math.PI/2;
  root.rotation.y=-.4;
 }
 else if(slug==='weightlifting'){
  const bar=cylinder(.045,4.8,steel);bar.rotation.z=Math.PI/2;
  for(const side of [-1,1]){
   const sleeve=cylinder(.08,1.1,steel,root,side*1.8,0,0);sleeve.rotation.z=Math.PI/2;
   for(let i=0;i<3;i++){
    const x=side*(1.47+i*.18),radius=.68-i*.025,points=[new T.Vector2(.1,-.07),new T.Vector2(radius-.03,-.07),new T.Vector2(radius,-.05),new T.Vector2(radius,.05),new T.Vector2(radius-.03,.07),new T.Vector2(.1,.07)];
    const disc=mesh(new T.LatheGeometry(points,80),i===2?dark:green,root,x,0,0);disc.rotation.z=Math.PI/2;
    const rim=ring(radius-.06,.013,material(0x3e5d49,.8),root,x+side*.075,0,0);rim.rotation.y=Math.PI/2;
    const hub=cylinder(.13,.17,steel,root,x,0,0);hub.rotation.z=Math.PI/2;
   }
   for(let n=0;n<30;n++){const groove=ring(.047,.0015,dark,root,side*(.3+n*.026),0,0);groove.rotation.y=Math.PI/2;}
  }
  root.rotation.y=-.25;
 }
 else if(slug==='hockey'){
  const stick=new T.Group();root.add(stick);const pts=[V(0,1.6,0),V(0,.6,0),V(0,-.7,0),V(.02,-1.2,0),V(.25,-1.45,0),V(.55,-1.36,0),V(.61,-1.1,0)];
  strikerSource=stick;pivotSource=V(0,1.25,0);surfaceSource=V(.25,-1.45,.07);
  tube(pts,.07,ivory,stick);tube([V(0,.7,0),V(0,1.6,0)],.08,green,stick);
  for(let i=0;i<23;i++){const r=ring(.081,.004,material(0x4e6650,.9),stick,0,.72+i*.038,0);r.rotation.x=Math.PI/2;}
  stick.rotation.z=-.2;projectileRadius=.17;projectileSource=new T.Group();projectileSource.position.set(.57,-1.28,.3);root.add(projectileSource);sphere(projectileRadius,leather(0xeae4d7,.9),projectileSource);
 }
 else if(slug==='boardgames'){
  const board=new T.Group();root.add(board);const faceMap=texture((c,s)=>{
   c.fillStyle='#dfc99f';c.fillRect(0,0,s,s);c.strokeStyle='#5a4937';c.lineWidth=2;
   c.strokeRect(s*.17,s*.17,s*.66,s*.66);c.strokeRect(s*.2,s*.2,s*.6,s*.6);
   for(const x of [.2,.8])for(const y of [.2,.8]){c.fillStyle='#9b4737';c.beginPath();c.arc(s*x,s*y,s*.016,0,7);c.fill();}
   c.strokeStyle='#9b4737';c.lineWidth=2;c.beginPath();c.arc(s*.5,s*.5,s*.075,0,7);c.stroke();
   for(let n=0;n<8;n++){const a=n*Math.PI/4;c.beginPath();c.moveTo(s*.5,s*.5);c.lineTo(s*(.5+Math.cos(a)*.065),s*(.5+Math.sin(a)*.065));c.stroke();}
  },1024);faceMap.colorSpace=T.SRGBColorSpace;
  const boardMat=new T.MeshStandardMaterial({map:faceMap,roughness:.85});
  const base=plate(2.4,2.4,.09,.06,wood,board);base.rotation.x=-Math.PI/2;base.position.y=-.105;
  const face=mesh(new T.PlaneGeometry(2.2,2.2),boardMat,board,0,.02,0);face.rotation.x=-Math.PI/2;
  for(const x of [-1.03,1.03])for(const z of [-1.03,1.03]){cylinder(.09,.025,dark,board,x,.025,z);const lip=ring(.09,.008,green,board,x,.04,z);lip.rotation.x=Math.PI/2;}
  for(const x of [-1.18,1.18])box(.09,.1,2.4,green,board,x,.08,0);for(const z of [-1.18,1.18])box(2.4,.1,.09,green,board,0,.08,z);
  for(let i=0;i<7;i++){const a=i*Math.PI/3;cylinder(.065,.035,i===0?material(0x9d4433):i%2?dark:ivory,board,Math.cos(a)*.17,.045,Math.sin(a)*.17);}
  cylinder(.1,.035,ivory,board,.55,.05,.62);board.rotation.x=.45;board.rotation.y=-.2;
  const support=box(1.5,.35,.35,dark,root,0,-.23,-.85);support.rotation.x=.2;
 }
 else if(slug==='indiangames'){
  for(let row=0;row<2;row++)for(let col=0;col<3;col++){
   const tile=plate(.73,.73,.075,.03,(row+col)%2?green:ivory,root,(col-1)*.75,0,(row-.5)*.75);tile.rotation.x=-Math.PI/2;
   for(let n=0;n<4;n++){box(.07,.07,.035,(row+col)%2?green:ivory,root,(col-1)*.75-.29+n*.19,.04,(row-.5)*.75+.38);}
  }
  tube([V(-1.1,.09,0),V(1.1,.09,0)],.012,material(0xece7d4),root);
  // A coiled rope references tug of war without inventing a facility model.
  const pts=[];for(let i=0;i<220;i++){const t=i/219,a=t*Math.PI*8,r=.13+.27*t;pts.push(V(Math.cos(a)*r+.48,.14,Math.sin(a)*r+.2));}tube(pts,.027,material(0xa58b61,.95));root.rotation.x=.2;
 }
 else throw Error('Unknown equipment '+slug);
 // Consolidate opaque meshes by material. Source geometry is never shared with
 // homepage instances; the existing dimensioned bat authoring remains untouched.
 root.updateMatrixWorld(true);const groups=new Map();
 const sourcePivot=strikerSource?.localToWorld(pivotSource.clone()),sourceSurface=strikerSource?.localToWorld(surfaceSource.clone()),sourceNormal=strikerSource?V(0,0,1).transformDirection(strikerSource.matrixWorld):null,sourceCenter=projectileSource?.getWorldPosition(V(0,0,0));
 const roleOf=o=>{for(let n=o;n&&n!==root;n=n.parent){if(n===strikerSource)return 'striker';if(n===projectileSource)return 'projectile';}return 'still';};
 root.traverse(o=>{if(!o.isMesh)return;
  const role=roleOf(o),key=[role,o.material.color?.getHex(),o.material.roughness,o.material.metalness,o.material.map?.uuid||'',o.material.bumpMap?.uuid||'',o.material.transparent||false,o.material.opacity,o.material.side,o.material.vertexColors||false].join(':');
  if(!groups.has(key))groups.set(key,{role,material:o.material,geometries:[]});
  const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(o.matrixWorld);groups.get(key).geometries.push(g);
 });
 const result=new T.Group(),parts={};
 for(const {role,material:mat,geometries} of groups.values()){
  const merged=new T.BufferGeometry(),keys=['position','normal','uv'];if(mat.vertexColors)keys.push('color');
  for(const key of keys){const size=key==='uv'?2:3,arrays=geometries.map(g=>g.getAttribute(key)?.array||new Float32Array(g.getAttribute('position').count*size));const array=new Float32Array(arrays.reduce((n,a)=>n+a.length,0));let offset=0;arrays.forEach(a=>{array.set(a,offset);offset+=a.length;});merged.setAttribute(key,new T.BufferAttribute(array,size));}
  keep(merged);keep(mat);for(const value of Object.values(mat))if(value?.isTexture)keep(value);
  if(!parts[role]){parts[role]=new T.Group();parts[role].name=role;result.add(parts[role]);}
  parts[role].add(new T.Mesh(merged,mat));geometries.forEach(g=>g.dispose());
 }
 root.traverse(o=>{if(o.isMesh)o.geometry.dispose();});
 const bounds=new T.Box3().setFromObject(result),size=bounds.getSize(V(0,0,0)),center=bounds.getCenter(V(0,0,0));
 const max=(slug==='cricket'||slug==='hockey'||slug==='badminton'||slug==='tennis'||slug==='squash')?2.75:slug==='athletics'?3.1:slug==='weightlifting'?2.9:2.4;
 const scale=max/Math.max(size.x,size.y,size.z);
 result.traverse(child=>{if(!child.isMesh)return;child.geometry.translate(-center.x,-center.y,-center.z);child.geometry.scale(scale,scale,scale);child.geometry.translate(0,-1+size.y*scale/2,0);});
 result.userData={slug,width:size.x*scale,focusY:-1+size.y*scale/2,shadowX:Math.max(2,size.x*scale*1.5),shadowZ:Math.max(1.5,size.z*scale*1.5)};
 if(strikerSource){
  const normalize=p=>p.sub(center).multiplyScalar(scale).add(V(0,-1+size.y*scale/2,0));
  const pivot=normalize(sourcePivot),surface=normalize(sourceSurface),ballCenter=normalize(sourceCenter);
  parts.striker.traverse(o=>{if(o.isMesh)o.geometry.translate(-pivot.x,-pivot.y,-pivot.z);});parts.striker.position.copy(pivot);
  parts.projectile.traverse(o=>{if(o.isMesh)o.geometry.translate(-ballCenter.x,-ballCenter.y,-ballCenter.z);});parts.projectile.position.copy(ballCenter);
  // Batch by moving part, keeping the contact surface in the striker's frame.
  result.userData.strike={striker:parts.striker,projectile:parts.projectile,surface:surface.sub(pivot),normal:sourceNormal,radius:projectileRadius*scale};
 }
 return result;
}
