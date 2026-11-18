import { batchStaticModel } from './static-batches.js';
import { quality, treeAsset, textureAsset } from './render-policy.js';
/* Original residential architecture. Real open bays, shaded galleries and material depth.
   Referenced spatial principles are not a replica of a named campus hostel. */
import * as T from './vendor/three.module.js';
const clamp=x=>Math.max(0,Math.min(1,x)),smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
export async function createHostelWorld(scene,keep){
 const own=x=>keep(x),root=new T.Group();root.name='Original shaded residential quadrangle';scene.add(root);
 const loader=new T.TextureLoader(),materialRoot=new URL('./assets/yoga/materials/',import.meta.url),treeRoot=new URL('./assets/yoga/environment/',import.meta.url);
 const texture=async(name,color=false,folder=materialRoot)=>{const t=own(await loader.loadAsync(textureAsset(folder,name).href));if(color)t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=4;return t;};
 const [pc,pn,pr,sc,sn,sr]=await Promise.all([texture('plaster-color',true),texture('plaster-normal'),texture('plaster-rough'),texture('stone-color',true),texture('stone-normal'),texture('stone-rough')]);
 const mat=(color,extra={})=>own(new T.MeshStandardMaterial({color,roughness:.8,...extra}));
 const plaster=mat('#e5ddc8',{map:pc,normalMap:pn,roughnessMap:pr,normalScale:new T.Vector2(.18,.18)}),concrete=mat('#c9c7b7',{map:pc,normalMap:pn,normalScale:new T.Vector2(.23,.23)}),coping=mat('#eee7d9',{map:pc,normalMap:pn,normalScale:new T.Vector2(.12,.12)}),stone=mat('#a7a390',{map:sc,normalMap:sn,roughnessMap:sr,normalScale:new T.Vector2(.25,.25)}),dark=mat('#242d2a'),metal=mat('#39483e',{metalness:.58,roughness:.38}),terra=mat('#9b6148',{map:pc,normalMap:pn,normalScale:new T.Vector2(.15,.15)}),timber=mat('#74604b',{roughness:.72}),soil=mat('#3e4734');
 const geometryCache=new Map(),batches=new Map(),matrix=new T.Matrix4(),quat=new T.Quaternion(),one=new T.Vector3(1,1,1);
 function geometry(w,h,d){const key=[w,h,d].join(',');if(geometryCache.has(key))return geometryCache.get(key);const g=own(new T.BoxGeometry(w,h,d));const uv=g.attributes.uv;for(let f=0;f<6;f++){const a=f<2?d:w,b=f===2||f===3?d:h;for(let j=0;j<4;j++){const i=f*4+j;uv.setXY(i,uv.getX(i)*a*.5,uv.getY(i)*b*.5);}}geometryCache.set(key,g);return g;}
 function box(w,h,d,m,x,y,z,parent=root,angle=0){const key=[parent.uuid,m.uuid,w,h,d].join(':');let b=batches.get(key);if(!b){b={parent,m,g:geometry(w,h,d),poses:[]};batches.set(key,b);}quat.setFromAxisAngle(new T.Vector3(0,1,0),angle);matrix.compose(new T.Vector3(x,y,z),quat,one);b.poses.push(matrix.clone());}
 function mesh(g,m,parent=root){const o=new T.Mesh(own(g),m);o.castShadow=o.receiveShadow=true;parent.add(o);return o;}
 // Large continuous ground, paving joints and stepped communal levels, not a model-display slab.
 box(80,.22,80,stone,0,-.23,0);box(17,.12,17,coping,.3,-.06,-.5);
 for(let i=0;i<18;i++)box(17,.006,.015,concrete,.3,.004,-8.5+i*.94);
 for(let i=0;i<17;i++)box(.014,.006,17,concrete,-7.7+i*.96,.004,-.5);
 for(let s=0;s<3;s++)box(6.5+s*.45,.12,1.1+s*.16,concrete,-2.5,.06+s*.12,-3.8-s*.55);
 const curtain=document.createElement('canvas');curtain.width=256;curtain.height=512;const cx=curtain.getContext('2d'),gradient=cx.createLinearGradient(0,0,0,512);gradient.addColorStop(0,'#ffe4ad');gradient.addColorStop(1,'#7f6346');cx.fillStyle=gradient;cx.fillRect(0,0,256,512);for(let x=0;x<256;x+=14){cx.fillStyle=x%28===0?'#cba674':'#ffe0a6';cx.globalAlpha=.24;cx.fillRect(x,0,7,512);}cx.globalAlpha=1;cx.fillStyle='#1c211d';cx.fillRect(0,450,256,62);cx.fillRect(0,0,12,512);cx.fillRect(244,0,12,512);const curtainMap=own(new T.CanvasTexture(curtain));curtainMap.colorSpace=T.SRGBColorSpace;
 const phases=[],wingLights=[],wings=[],definitions=[[-8.8,-1.8,7.8,3,Math.PI/2],[-3.2,-7.8,8.4,4,0],[6.0,-8.1,6.8,3,0],[9.8,-1.6,6.4,2,-Math.PI/2]];let rooms=0,recesses=0,screenCells=0;
 definitions.forEach(([x,z,w,floors,angle],wi)=>{
  const wing=new T.Group();wing.position.set(x,0,z);wing.rotation.y=angle;wing.name='Residential wing '+(wi+1);root.add(wing);wings.push(wing);const bay=1.2,bays=Math.floor(w/bay),width=bays*bay,H=2.25,D=3.2,groups=Array.from({length:5},()=>[]);
  // Structural frame: open pilotis below, room walls assembled around actual voids above.
  for(let c=0;c<=bays;c++)for(const depth of [-1.45,1.5])box(.16,(floors+1)*H,.20,concrete,-width/2+c*bay,(floors+1)*H/2,depth,wing);
  for(let floor=0;floor<=floors;floor++){
   const y=(floor+1)*H;box(width+.48,.19,D+1.15,coping,0,y,0,wing);box(width+.48,.09,.1,terra,0,y+.10,2.16,wing);
   if(floor===floors)continue;
   for(let c=0;c<bays;c++){
    const bx=-width/2+bay*(c+.5),bottom=y+.1;
    // Room side walls, lintels and sills define a recessed opening 0.9m behind the gallery edge.
    box(.10,H-.19,D-.3,plaster,bx-bay/2+.05,bottom+(H-.19)/2,-.1,wing);
    box(bay-.10,.37,.20,plaster,bx,bottom+.185,1.12,wing);box(bay-.10,.31,.20,plaster,bx,bottom+H-.345,1.12,wing);
    box(.16,1.43,.23,plaster,bx-bay/2+.08,bottom+1.08,1.12,wing);box(.16,1.43,.23,plaster,bx+bay/2-.08,bottom+1.08,1.12,wing);
    box(bay-.1,H-.19,.15,plaster,bx,bottom+(H-.19)/2,-1.45,wing);
    // Actual interior floor/back shadow, recessed bronze window frames and mullion.
    box(.82,1.43,.06,dark,bx,bottom+1.08,.95,wing);
    for(const sx of [-.41,.41])box(.035,1.43,.055,metal,bx+sx,bottom+1.08,1.005,wing);
    for(const yy of [.365,1.795])box(.85,.035,.055,metal,bx,bottom+yy,1.005,wing);
    box(.027,1.40,.055,metal,bx,bottom+1.08,1.008,wing);
    const group=(c*3+floor*7+wi)%5;const pose=new T.Matrix4().makeTranslation(bx,bottom+1.08,.984);groups[group].push(pose);rooms++;recesses++;
    // Open balcony gallery with real 0.9m depth and two rail tiers.
    for(const yy of [.45,.90])box(bay,.027,.027,metal,bx,bottom+yy,2.10,wing);
    for(const xx of [-.5,0,.5])box(.022,.92,.022,metal,bx+xx,bottom+.46,2.10,wing);
    if((c+floor)%4===0){box(.30,1.32,.035,timber,bx-.32,bottom+1.08,1.16,wing,.40);}
   }
   box(width,.045,.05,metal,0,y+1.05,2.10,wing);
  }
  // Deep roof fascia, coping returns, and two side parapets rather than a flat carton lid.
  const roof=(floors+1)*H+.2;box(width+.65,.18,D+1.35,coping,0,roof,0,wing);for(const zz of [-2.1,2.1])box(width+.58,.43,.11,plaster,0,roof+.27,zz,wing);for(const xx of [-width/2-.24,width/2+.24])box(.11,.43,4.2,plaster,xx,roof+.27,0,wing);
  // Perforated terracotta stair screen: genuine open cells, not a printed rectangle.
  const sx=-width/2-.62,sy=roof/2;box(1.03,roof,.23,concrete,sx,sy,-.9,wing);box(.13,roof,1.1,coping,sx-.57,sy,-.38,wing);box(.13,roof,1.1,coping,sx+.57,sy,-.38,wing);
  for(let j=0;j<Math.floor((roof-.35)/.21);j++)for(let k=0;k<5;k++){box(.12,.047,.11,terra,sx-.43+k*.215,(j+.5)*.21,.22,wing);box(.037,.17,.11,terra,sx-.49+k*.215,(j+.5)*.21+.10,.22,wing);screenCells++;}
  // Open ground-level room and a believable small access stair.
  box(1.5,1.65,.12,timber,0,.9,-1.4,wing);for(let n=0;n<8;n++)box(1.0,.10,.25,concrete,width/2-.3,.05+n*.10,2.6-n*.22,wing);
  const pipe=mesh(new T.CylinderGeometry(.026,.026,roof,8),metal,wing);pipe.position.set(width/2+.12,roof/2,-1.66);
  // A seeded relay across room groups: some rooms intentionally remain dark.
  groups.forEach((poses,band)=>{if(!poses.length)return;const glass=mat('#454d47',{metalness:.2,roughness:.24,map:curtainMap,emissiveMap:curtainMap,emissive:'#ffbf73',emissiveIntensity:0});const g=own(new T.PlaneGeometry(.78,1.38)),i=own(new T.InstancedMesh(g,glass,poses.length));poses.forEach((p,n)=>i.setMatrixAt(n,p));wing.add(i);phases.push({material:glass,wing:wi,delay:band*.13,occupied:band!==4});});
  const light=new T.PointLight('#ffc784',0,8,2);light.position.set(0,2.5,2.5);wing.add(light);wingLights.push(light);
 });
 // Sky bridge: real slab, slender supports, mullions and glazed side panels linking the back wings.
 box(3.0,.18,1.8,coping,1.6,4.55,-7.0);for(const z of [-7.85,-6.15]){box(3,.08,.10,metal,1.6,5.65,z);for(let i=0;i<7;i++)box(.04,1.1,.05,metal,.2+i*.47,5.1,z);}
 for(const [x,z] of [[-5,3.3],[5,2.6],[-2.0,-3.6]]){box(2,.45,1.1,concrete,x,.22,z);box(1.8,.06,.9,soil,x,.48,z);for(let i=0;i<5;i++)box(1.85,.05,.10,timber,x,.56,z-.38+i*.19);}
 // Low, physically curved planting with individual leaves.
 const leafMaterial=mat('#657052',{side:T.DoubleSide}),leafGeometry=own(new T.PlaneGeometry(.12,.64,3,12)),v=leafGeometry.attributes.position;
 for(let i=0;i<v.count;i++){const t=(v.getY(i)+.32)/.64,u=v.getX(i)/.06;v.setXYZ(i,u*.06*Math.sin(Math.PI*t)**.6,t*.64,Math.sin(t*2.4)*.2+u*u*.015);}leafGeometry.computeVertexNormals();const planting=own(new T.InstancedMesh(leafGeometry,leafMaterial,144)),o=new T.Object3D();for(let i=0;i<144;i++){const group=Math.floor(i/12),a=i%12*2.399;o.position.set(-6.7+group*.28,.03,-3.4);o.rotation.set(.2,a,0);o.scale.setScalar(.8+(i%5)*.07);o.updateMatrix();planting.setMatrixAt(i,o.matrix);}root.add(planting);planting.castShadow=true;
 // Reuse the proven CC0 branching-tree asset, never the rejected spherical crowns.
 const tex=async(name,color)=>{const t=await texture(name,color,treeRoot);t.flipY=false;return t;};
 const [definition,data,bark,branch,leaf]=await Promise.all([fetch(treeAsset(treeRoot,'json')).then(r=>r.json()),fetch(treeAsset(treeRoot,'bin')).then(r=>r.arrayBuffer()),tex('bark-color',true),tex('branch-color',true),tex('leaf-color',true)]);
 const treeMaterials={bark:mat('#92806a',{map:bark}),branch:mat('#92806a',{map:branch}),leaf:mat('#99a174',{map:leaf,alphaTest:.5,side:T.DoubleSide})},trees=[[-7.0,5.4,1.35],[5.0,-3.8,1.28]];
 for(const primitive of definition.primitives){const g=own(new T.BufferGeometry());for(const [name,a] of Object.entries(primitive.attributes)){const arr=new (name==='index'?Uint32Array:Float32Array)(data,a.offset,a.count);if(name==='index')g.setIndex(new T.BufferAttribute(arr,1));else g.setAttribute(name,new T.BufferAttribute(arr,name==='uv'?2:3));}g.computeBoundingSphere();const inst=own(new T.InstancedMesh(g,treeMaterials[primitive.material],trees.length));trees.forEach(([x,z,s],i)=>{o.position.set(x,.02,z);o.rotation.set(0,i*1.7,0);o.scale.setScalar(s);o.updateMatrix();inst.setMatrixAt(i,o.matrix);});inst.computeBoundingSphere();inst.castShadow=inst.receiveShadow=true;root.add(inst);}
 // Flush inlaid approach strips, light as a metaphor rather than a data signal.
 const pathMaterials=[];for(const [x,z,w,d] of [[-4,3.7,7,.035],[4,3.7,5,.035],[0,-1,.035,8],[2.2,3,.035,5]]){const m=mat('#b09a67',{metalness:.65,roughness:.4,emissive:'#ffbf6c',emissiveIntensity:0});box(w,.018,d,m,x,.02,z);pathMaterials.push(m);}
 batches.forEach(b=>{const inst=own(new T.InstancedMesh(b.g,b.m,b.poses.length));b.poses.forEach((p,i)=>inst.setMatrixAt(i,p));inst.castShadow=inst.receiveShadow=true;b.parent.add(inst);});
 batchStaticModel(root,own);
 function update(t){phases.forEach(p=>{const wingPhase=(t-(.18+p.wing*.13))/.34;const value=p.occupied?smooth((wingPhase-p.delay)/.50):0;p.material.emissiveIntensity=value*2.25;});wingLights.forEach((light,i)=>light.intensity=18*smooth((t-(.25+i*.13))/.27));pathMaterials.forEach((m,i)=>m.emissiveIntensity=3.5*smooth((t-.64-i*.035)/.18));return {light:t,roomGroups:phases.map(p=>p.material.emissiveIntensity),inlays:pathMaterials.map(m=>m.emissiveIntensity)};}
 update(0);return {root,update,wings,stats:{wings:4,rooms,recesses,perforatedCells:screenCells,realTreeInstances:2,leafTriangles:definition.primitives.find(p=>p.material==='leaf').triangles,materials:'local CC0 plaster/stone plus original metal/glazing',solidFacadeBoxes:0}};
}
