import { quality, treeAsset, textureAsset } from './render-policy.js';
/* A metre-scale sports ground. Local CC0 grass/tree derivatives and original
   turf, grass blades, field fixtures and disc. See environment/PROVENANCE.json. */
import * as T from './vendor/three.module.js';
const hash=(x,z)=>{const n=Math.sin(x*127.1+z*311.7)*43758.5453;return n-Math.floor(n);};
export const groundHeight=(x,z)=>.008*Math.sin(x*.43)*Math.cos(z*.37)-.000022*x*x;
export async function createFrisbeeWorld(scene,keep){
 const own=v=>keep(v),mat=(color,extra={})=>own(new T.MeshStandardMaterial({color,roughness:.86,...extra}));
 const mesh=(g,m,parent=scene)=>{const o=new T.Mesh(own(g),m);parent.add(o);return o;};
 const asset=new URL('./assets/frisbee/environment/',import.meta.url),load=async(name,srgb=false)=>{const t=own(await new T.TextureLoader().loadAsync(textureAsset(asset,name).href));if(srgb)t.colorSpace=T.SRGBColorSpace;t.anisotropy=8;if(/^(leaf|bark|branch)/.test(name))t.flipY=false;return t;};
 const [color,normal,rough,bark,branch,leaf,barkNormal,branchNormal,treeDef,treeBuffer]=await Promise.all([load('grass-color',true),load('grass-normal'),load('grass-rough'),load('bark-color',true),load('branch-color',true),load('leaf-color',true),load('bark-normal'),load('branch-normal'),fetch(treeAsset(asset,'json')).then(r=>r.json()),fetch(treeAsset(asset,'bin')).then(r=>r.arrayBuffer())]);
 for(const t of [color,normal,rough])t.wrapS=t.wrapT=T.RepeatWrapping;
 const turfG=own(new T.PlaneGeometry(180,220,quality.lite?45:180,quality.lite?55:220));turfG.rotateX(-Math.PI/2);turfG.translate(0,0,-8);
 const pos=turfG.attributes.position,uv=turfG.attributes.uv,colors=[],c=new T.Color();
 for(let i=0;i<pos.count;i++){
  const x=pos.getX(i),z=pos.getZ(i);pos.setY(i,groundHeight(x,z));uv.setXY(i,x*.8,z*.8);
  const inField=Math.abs(x)<18.5&&Math.abs(z)<50,patch=hash(Math.floor(x*.3),Math.floor(z*.3));
  c.set(inField?'#8bb781':'#879766');c.multiplyScalar((inField?(Math.floor((z+50)/5)%2?.94:1.04):.85)+patch*.08);colors.push(c.r,c.g,c.b);
 }
 turfG.setAttribute('color',new T.Float32BufferAttribute(colors,3));turfG.computeVertexNormals();
 const turf=mesh(turfG,mat('#ffffff',{map:color,normalMap:normal,normalScale:new T.Vector2(.7,.7),roughnessMap:rough,vertexColors:true}));turf.receiveShadow=true;
 // Real individual blades supply parallax at low camera height. Beyond them the
 // physically textured turf remains continuous, without a geometry popping ring.
 const bladePositions=[],bladeNormals=[];
 for(let i=0;i<3;i++){
  const a=i*Math.PI/3,x=Math.cos(a)*.0017,z=Math.sin(a)*.0017,leanX=Math.cos(a+.8)*.008,leanZ=Math.sin(a+.8)*.008,h=.016+i*.004;
  bladePositions.push(-x,0,-z,x,0,z,leanX,h,leanZ);for(let j=0;j<3;j++)bladeNormals.push(-Math.sin(a)*.3,.8,Math.cos(a)*.3);
 }
 const bladeG=own(new T.BufferGeometry());bladeG.setAttribute('position',new T.Float32BufferAttribute(bladePositions,3));bladeG.computeVertexNormals();
 const bladeCount=quality.lite?3500:42000,grass=new T.InstancedMesh(bladeG,mat('#ffffff',{side:T.DoubleSide,roughness:1}),bladeCount),object=new T.Object3D();own(grass);scene.add(grass);
 for(let i=0;i<bladeCount;i++){const x=(hash(i,3)-.5)*18,z=-8+hash(i,4)*44;object.position.set(x,groundHeight(x,z)+.002,z);object.rotation.set(0,hash(i,5)*6.28,0);object.scale.setScalar(.6+hash(i,6)*.8);object.updateMatrix();grass.setMatrixAt(i,object.matrix);grass.setColorAt(i,new T.Color().setHSL(.20+hash(i,7)*.035,.45,.29+hash(i,8)*.09,T.SRGBColorSpace));}grass.computeBoundingSphere();grass.receiveShadow=true;
 // Measured field dimensions: 100 × 37 m; 18 m end zones. Painted marks follow
 // the ground surface, rather than floating glowing lines.
 const paint=mat('#e2deca',{roughness:1});const line=(x,z,w,l)=>{const o=mesh(new T.BoxGeometry(w,.009,l),paint);o.position.set(x,groundHeight(x,z)+.009,z);o.receiveShadow=true;};
 for(const x of [-18.5,18.5])line(x,0,.08,100);for(const z of [-50,-32,32,50])line(0,z,37,.08);
 for(const z of [-14,14]){line(0,z,1,.08);line(0,z,.08,1);}
 const coneMat=mat('#c26a2d',{roughness:.7}),coneG=own(new T.CylinderGeometry(.025,.13,.28,24,1,true)),coneBase=own(new T.BoxGeometry(.29,.025,.29));
 for(const x of [-18.5,18.5])for(const z of [-50,-32,32,50]){const cone=new T.Mesh(coneG,coneMat),base=new T.Mesh(coneBase,coneMat);cone.position.set(x,groundHeight(x,z)+.15,z);base.position.set(x,groundHeight(x,z)+.025,z);cone.castShadow=base.castShadow=true;scene.add(cone,base);}
 // Scanned branching geometry and individually textured leaves, instanced at the
 // perimeter with varied scale/rotation. Root placement uses the actual ground.
 const trees=[];for(let i=0;i<9;i++)trees.push([-29-hash(i,12)*7,-48+i*12,1.7+hash(i,13)*.65]);for(let i=0;i<9;i++)trees.push([29+hash(i,15)*7,-49+i*12,1.8+hash(i,16)*.65]);for(let i=0;i<7;i++)trees.push([-26+i*9,-64-hash(i,17)*5,1.8+hash(i,18)*.8]);
 const treeMats={bark:mat('#b3a48b',{map:bark,normalMap:barkNormal,normalScale:new T.Vector2(.6,.6),roughness:1}),branch:mat('#a99e81',{map:branch,normalMap:branchNormal,normalScale:new T.Vector2(.6,.6),roughness:1}),leaf:mat('#d2d9b7',{map:leaf,side:T.DoubleSide,alphaTest:.45,roughness:.95,emissiveMap:leaf,emissive:'#91aa6c',emissiveIntensity:.24})};
 let treeTriangles=0;
 for(const def of treeDef.primitives){const g=own(new T.BufferGeometry());for(const [name,a] of Object.entries(def.attributes)){const arr=new (name==='index'?Uint32Array:Float32Array)(treeBuffer,a.offset,a.count);if(name==='index')g.setIndex(new T.BufferAttribute(arr,1));else g.setAttribute(name,new T.BufferAttribute(arr,name==='uv'?2:3));}g.computeBoundingSphere();const inst=own(new T.InstancedMesh(g,treeMats[def.material],trees.length));scene.add(inst);trees.forEach(([x,z,s],i)=>{object.position.set(x,groundHeight(x,z),z);object.rotation.set(0,hash(i,21)*6.28,0);object.scale.set(s*(.8+hash(i,22)*.4),s,s*(.85+hash(i,23)*.3));object.updateMatrix();inst.setMatrixAt(i,object.matrix);});inst.computeBoundingSphere();inst.castShadow=true;inst.receiveShadow=true;treeTriangles+=def.triangles*trees.length;}
 // Three-dimensional perimeter fencing: tensioned chain link behind solid posts.
 const metal=mat('#46544b',{metalness:.6,roughness:.62}),galvanized=mat('#a6aaa0',{metalness:.65,roughness:.4}),wood=mat('#8b6440',{roughness:.9});
 const boxG=own(new T.BoxGeometry(1,1,1));function box(x,y,z,sx,sy,sz,m,parent=scene){const o=new T.Mesh(boxG,m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=o.receiveShadow=true;parent.add(o);return o;}
 const cylinderG=own(new T.CylinderGeometry(1,1,1,10));function pole(x,y,z,r,h,m=metal){const o=new T.Mesh(cylinderG,m);o.position.set(x,y,z);o.scale.set(r,h,r);o.castShadow=true;scene.add(o);return o;}
 const wireCanvas=document.createElement('canvas');wireCanvas.width=wireCanvas.height=128;const ink=wireCanvas.getContext('2d');ink.strokeStyle='#90978b';ink.lineWidth=1.3;ink.beginPath();ink.moveTo(-64,64);ink.lineTo(64,-64);ink.moveTo(0,128);ink.lineTo(128,0);ink.moveTo(64,192);ink.lineTo(192,64);ink.moveTo(-64,64);ink.lineTo(64,192);ink.moveTo(0,0);ink.lineTo(128,128);ink.moveTo(64,-64);ink.lineTo(192,64);ink.stroke();
 const wire=own(new T.CanvasTexture(wireCanvas));wire.wrapS=wire.wrapT=T.RepeatWrapping;wire.repeat.set(120,2.5);const fenceMat=mat('#8e9988',{map:wire,transparent:true,alphaTest:.3,side:T.DoubleSide,roughness:.9});
 for(const x of [-25,25]){for(let z=-56;z<=56;z+=4)pole(x,1.1,z,.038,2.2);const fence=mesh(new T.PlaneGeometry(112,2.2),fenceMat);fence.rotation.y=Math.PI/2;fence.position.set(x,1.1,0);for(const y of [.12,2.2]){const rail=pole(x,y,0,.023,112);rail.rotation.x=Math.PI/2;}}
 for(const z of [-56,56]){for(let x=-24;x<=24;x+=4)pole(x,1.1,z,.038,2.2);const fence=mesh(new T.PlaneGeometry(50,2.2),fenceMat);fence.position.set(0,1.1,z);}
 // Benches and lights make the environment read as a maintained sports ground.
 for(const z of [8,-6]){const bench=new T.Group();bench.position.set(-23,groundHeight(-23,z),z);scene.add(bench);for(const x of [-.9,.9]){box(x,.23,0,.07,.46,.48,metal,bench);box(x,.58,-.22,.06,.66,.055,metal,bench);}for(let j=0;j<4;j++)box(0,.47,-.18+j*.12,2.3,.055,.095,wood,bench);for(let j=0;j<3;j++)box(0,.68+j*.12,-.24,2.3,.09,.055,wood,bench);}
 for(const x of [-26,26])for(const z of [-38,38]){pole(x,7,z,.085,14,galvanized);box(x,13.8,z,1.8,.09,.1,metal);for(const dx of [-.6,0,.6]){const lamp=box(x+dx,13.68,z+.1,.36,.24,.26,metal);const glass=box(x+dx,13.62,z+.24,.3,.17,.018,mat('#d5d4b7',{metalness:.3,roughness:.25}));}}
 // A directional sky with a warm horizon and faint high cloud, rendered in 3D.
 const sky=mesh(new T.SphereGeometry(400,40,24),own(new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{top:{value:new T.Color('#91adbc')},horizon:{value:new T.Color('#e3deca')}},vertexShader:'varying vec3 d;void main(){d=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`varying vec3 d;uniform vec3 top;uniform vec3 horizon;void main(){vec3 n=normalize(d);float h=pow(max(0.,n.y),.45);vec3 c=mix(horizon,top,h);float wisps=sin(n.x*35.+sin(n.z*28.))*sin(n.z*17.+n.x*20.);float cloud=smoothstep(.65,.9,wisps)*smoothstep(.05,.3,n.y)*(1.-smoothstep(.45,.8,n.y));c=mix(c,vec3(.84,.85,.79),cloud*.025);gl_FragColor=vec4(c,1.);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>}`})));sky.renderOrder=-10;
 // A local six-face sky probe supplies broad outdoor reflections to the plastic,
 // metal and foliage. Canvas sources survive context loss for clean reupload.
 const faces=[];for(let face=0;face<6;face++){const c=document.createElement('canvas');c.width=c.height=64;const ctx=c.getContext('2d'),g=ctx.createLinearGradient(0,0,0,64);if(face===2){g.addColorStop(0,'#bed4e2');g.addColorStop(1,'#d5e0e5');}else if(face===3){g.addColorStop(0,'#6b7252');g.addColorStop(1,'#737657');}else{g.addColorStop(0,'#a8c7d9');g.addColorStop(.53,'#e5dfc9');g.addColorStop(.57,'#8e9674');g.addColorStop(1,'#68724c');}ctx.fillStyle=g;ctx.fillRect(0,0,64,64);faces.push(c);}const probe=own(new T.CubeTexture(faces));probe.colorSpace=T.SRGBColorSpace;probe.needsUpdate=true;scene.environment=probe;scene.environmentIntensity=.45;
 // A true 269 mm disc. A single smooth rolled profile avoids intersecting rings.
 const disc=new T.Group(),tilt=new T.Group(),spin=new T.Group();scene.add(disc);disc.add(tilt);tilt.add(spin);
 const profile=[[0,.006],[.06,.006],[.108,.005],[.122,.003],[.13,0],[.1345,-.006],[.134,-.011],[.13,-.014],[.126,-.012],[.124,-.004],[.11,-.001],[.06,.002],[0,.002]];
 const plastic=mat('#f6f1dd',{roughness:.38,metalness:0}),body=mesh(new T.LatheGeometry(profile.map(p=>new T.Vector2(...p)),160),plastic,spin);body.castShadow=true;body.receiveShadow=false;
 const printCanvas=document.createElement('canvas');printCanvas.width=printCanvas.height=1024;const p=printCanvas.getContext('2d');p.clearRect(0,0,1024,1024);p.strokeStyle='#204d3d';p.fillStyle='#204d3d';
 for(const r of [436,419]){p.lineWidth=r===436?6:2;p.beginPath();p.arc(512,512,r,0,Math.PI*2);p.stroke();}p.textAlign='center';p.font='500 39px Arial';p.fillText('U L T I M A T E',512,422);p.font='18px Arial';p.fillText('I I T   B O M B A Y',512,628);p.lineWidth=3;p.beginPath();p.arc(512,512,58,0,Math.PI*2);p.stroke();
 for(let i=0;i<3;i++){p.lineWidth=9;p.beginPath();p.arc(512,512,270,i*Math.PI*2/3,i*Math.PI*2/3+.45);p.stroke();}
 const printTex=own(new T.CanvasTexture(printCanvas));printTex.colorSpace=T.SRGBColorSpace;printTex.anisotropy=8;
 const printed=mesh(new T.CircleGeometry(.119,128),own(new T.MeshStandardMaterial({map:printTex,transparent:true,alphaTest:.1,roughness:.55,polygonOffset:true,polygonOffsetFactor:-1})),spin);printed.rotation.x=-Math.PI/2;printed.position.y=.0066;
 // Embossed grip ridges, wholly outside the printed crown.
 for(const radius of [.121,.123,.125]){const ring=mesh(new T.TorusGeometry(radius,.00065,6,160),plastic,spin);ring.rotation.x=Math.PI/2;ring.position.y=.0038;}
 const bounds=new T.Box3(),v=new T.Vector3(),up=new T.Vector3(0,1,0),n=new T.Vector3();
 return {update(pose){disc.position.fromArray(pose.position);disc.position.y+=groundHeight(disc.position.x,disc.position.z);tilt.quaternion.setFromUnitVectors(up,n.fromArray(pose.normal));spin.rotation.y=pose.spin;scene.updateMatrixWorld(true);bounds.setFromObject(body);return {discPosition:disc.position.toArray(),discQuaternion:tilt.quaternion.toArray(),spin:spin.rotation.y,bounds:[bounds.min.toArray(),bounds.max.toArray()]};},projectBounds(camera){if(!body.geometry.boundingBox)body.geometry.computeBoundingBox();const b=body.geometry.boundingBox;let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z]){v.set(x,y,z).applyMatrix4(body.matrixWorld).project(camera);minX=Math.min(minX,v.x);maxX=Math.max(maxX,v.x);minY=Math.min(minY,v.y);maxY=Math.max(maxY,v.y);}return [[minX,minY],[maxX,maxY]];},stats:{discProfilePoints:profile.length,discRimRadius:.1345,cones:8,grassBlades:bladeCount*3,scannedTreeInstances:trees.length,treeTriangles,fieldMetres:[100,37],originalGeometry:true}};
}
