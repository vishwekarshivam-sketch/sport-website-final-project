/* Four original residential wings, illustrative rather than named campus replicas. */
import * as T from './vendor/three.module.js';
export function createCourtyard(scene,keep){
 const own=x=>keep(x),root=new T.Group();root.name='Four-wing illustrative hostel courtyard';scene.add(root);
 const material=(c,extra={})=>own(new T.MeshStandardMaterial({color:c,roughness:.82,...extra}));
 const plaster=material('#e7e1d2'),edge=material('#f4f0e4'),shade=material('#466052'),glass=material('#263f35',{roughness:.38,metalness:.18}),terracotta=material('#a78364'),paving=material('#ddd9c8'),bark=material('#796a4f'),leaves=material('#607259'),metal=material('#213f34',{roughness:.6,metalness:.3});
 const cache=new Map();function box(w,h,d,mat,x,y,z,parent=root){const key=[w,h,d].join(',');let geometry=cache.get(key);if(!geometry){geometry=own(new T.BoxGeometry(w,h,d));cache.set(key,geometry);}const o=new T.Mesh(geometry,mat);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;parent.add(o);return o;}
 // A finite raised base with a paved shared quadrangle and inset approach strips.
 box(24,.18,22,paving,0,-.16,-2);box(12,.06,11.5,edge,0,-.045,-1);
 for(const x of [-5.8,5.8])box(.08,.015,11.5,terracotta,x,-.005,-1);
 for(const z of [-6.7,4.7])box(11.6,.015,.08,terracotta,0,-.005,z);
 for(let i=0;i<12;i++)box(11.5,.008,.015,plaster,0,.001,-6.3+i*.95);
 const buildingSpecs=[{x:-7.7,z:-4.8,w:6.3,d:2.8,f:3,angle:Math.PI/2},{x:0,z:-9.0,w:8.3,d:2.7,f:4,angle:0},{x:8.0,z:-5.0,w:6.0,d:2.7,f:3,angle:-Math.PI/2},{x:-7.5,z:3.2,w:4.8,d:2.8,f:2,angle:Math.PI/2}];
 const windowTransforms=[],railingTransforms=[],pilasterTransforms=[];
 buildingSpecs.forEach((s,index)=>{
  const b=new T.Group();b.name='Illustrative hostel wing '+(index+1);b.position.set(s.x,0,s.z);b.rotation.y=s.angle;root.add(b);const h=s.f*1.0;
  box(s.w,h,s.d,plaster,0,h/2,0,b);box(s.w+.25,.12,s.d+.25,edge,0,h+.08,0,b);
  for(const z of [-s.d/2,s.d/2])box(s.w,.30,.10,plaster,0,h+.27,z,b);
  // Recessed rooms, continuous shaded verandahs and slim green rails.
  for(let f=0;f<s.f;f++){
   box(s.w+.12,.12,.72,edge,0,f+1,s.d/2+.25,b);box(s.w,.06,.06,shade,0,f+.47,s.d/2+.62,b);box(s.w,.045,.045,shade,0,f+.78,s.d/2+.62,b);
   const count=Math.floor(s.w/.85);
   for(let i=0;i<count;i++){
    const x=-s.w/2+.48+i*.83;
    const node=new T.Object3D();node.position.set(x,f+.55,s.d/2+.012);node.scale.set(.50,.62,.025);node.updateMatrix();node.updateMatrixWorld();b.updateMatrixWorld(true);windowTransforms.push(new T.Matrix4().multiplyMatrices(b.matrixWorld,node.matrix));node.position.z=-s.d/2-.018;node.updateMatrix();windowTransforms.push(new T.Matrix4().multiplyMatrices(b.matrixWorld,node.matrix));
    const rail=new T.Object3D();rail.position.set(x,f+.55,s.d/2+.62);rail.scale.set(.035,.55,.035);rail.updateMatrix();railingTransforms.push(new T.Matrix4().multiplyMatrices(b.matrixWorld,rail.matrix));
   }
  }
  for(const x of [-s.w/2+.12,s.w/2-.12])box(.15,h,.18,edge,x,h/2,s.d/2+.55,b);
  // Open ground-floor entrance, roof water tank and an external stair flight.
  box(.65,.84,.035,glass,0,.42,s.d/2+.025,b);box(.9,.07,.9,terracotta,0,1.0,s.d/2+.35,b);
  const tank=new T.Mesh(own(new T.CylinderGeometry(.25,.25,.46,16)),shade);tank.position.set(s.w/2-.65,h+.47,0);b.add(tank);tank.castShadow=true;
  for(let n=0;n<7;n++)box(.8,.10,.26,edge,-s.w/2+.5,n*.1+.05,s.d/2+.9-n*.22,b);
 });
 const instanced=(transforms,mat)=>{const o=own(new T.InstancedMesh(own(new T.BoxGeometry(1,1,1)),mat,transforms.length));transforms.forEach((m,i)=>o.setMatrixAt(i,m));o.castShadow=o.receiveShadow=true;root.add(o);return o;};
 instanced(windowTransforms,glass);instanced(railingTransforms,metal);
 // Courtyard benches and planters give the building scale without invented people.
 for(const [x,z,angle] of [[-4,2.5,0],[4,2.5,0],[-3.6,-4.6,Math.PI/2],[3.6,-4.6,Math.PI/2]]){
  const b=new T.Group();b.position.set(x,0,z);b.rotation.y=angle;root.add(b);for(let i=0;i<3;i++)box(1.2,.05,.10,terracotta,0,.44,-.14+i*.14,b);for(const bx of [-.45,.45])box(.06,.44,.42,metal,bx,.22,0,b);
 }
 for(const [x,z] of [[-5,3.3],[5,3.3],[-5,-5.3],[5,-5.3]]){
  box(1.05,.25,1.05,edge,x,.10,z);const trunk=new T.Mesh(own(new T.CylinderGeometry(.07,.10,1.6,10)),bark);trunk.position.set(x,.9,z);trunk.castShadow=true;root.add(trunk);
  for(let i=0;i<4;i++){const crown=new T.Mesh(own(new T.IcosahedronGeometry(.7,1)),leaves);crown.position.set(x+Math.sin(i*2.4)*.35,1.85+i*.18,z+Math.cos(i*2.4)*.35);crown.scale.set(1,.85,1);crown.castShadow=true;root.add(crown);}
 }
 return {root,stats:{wings:4,windows:windowTransforms.length,illustrative:true}};
}
