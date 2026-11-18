/* Original instanced 3×3 geometry. Stickers remain attached to their cubies. */
import * as T from './vendor/three.module.js';
import {STATES,MOVES,turnSpec} from './rubik-story.js?v=cube-1';
const COLORS={U:'#f6f1d9',D:'#f2cf32',F:'#128b58',B:'#235ba9',R:'#d43521',L:'#ec811e'};
export function createRubikWorld(scene,keep){
 const cube=new T.Group();scene.add(cube);
 function rounded(w,h,r,depth,bevel){
  const shape=new T.Shape(),x=-w/2,y=-h/2;
  shape.moveTo(x+r,y);shape.lineTo(x+w-r,y);shape.quadraticCurveTo(x+w,y,x+w,y+r);shape.lineTo(x+w,y+h-r);shape.quadraticCurveTo(x+w,y+h,x+w-r,y+h);shape.lineTo(x+r,y+h);shape.quadraticCurveTo(x,y+h,x,y+h-r);shape.lineTo(x,y+r);shape.quadraticCurveTo(x,y,x+r,y);
  const g=keep(new T.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:bevel,bevelThickness:bevel,curveSegments:4}));g.translate(0,0,-depth/2);g.computeVertexNormals();return g;
 }
 const bodyGeo=rounded(.88,.88,.075,.88,.025),tileGeo=rounded(.76,.76,.065,.016,.012);
 const bodyMat=keep(new T.MeshStandardMaterial({color:'#171c19',roughness:.38,metalness:.06}));
 const bodies=new T.InstancedMesh(bodyGeo,bodyMat,26);bodies.castShadow=true;bodies.receiveShadow=true;bodies.frustumCulled=false;cube.add(bodies);
 const stickers={};
 for(const [face,color] of Object.entries(COLORS)){
  const mat=keep(new T.MeshStandardMaterial({color,roughness:.34,metalness:.025})),mesh=new T.InstancedMesh(tileGeo,mat,9);mesh.castShadow=true;mesh.receiveShadow=true;mesh.frustumCulled=false;cube.add(mesh);stickers[face]=mesh;
 }
 // The plane and restrained registration lines ground the cube in a physical studio.
 const floor=new T.Mesh(keep(new T.PlaneGeometry(200,200)),keep(new T.MeshStandardMaterial({color:'#e9e7db',roughness:1})));floor.rotation.x=-Math.PI/2;floor.position.y=-2.32;floor.receiveShadow=true;scene.add(floor);
 const linePoints=[];for(let n=-8;n<=8;n+=2){linePoints.push(-8,-2.315,n,8,-2.315,n,n,-2.315,-8,n,-2.315,8)}
 const lines=new T.LineSegments(keep(new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(linePoints,3))),keep(new T.LineBasicMaterial({color:'#728276',transparent:true,opacity:.10})));scene.add(lines);
 const scratch=new T.Object3D(),pieceQ=new T.Quaternion(),spin=new T.Quaternion(),faceQ=new T.Quaternion(),matrix=new T.Matrix4(),p=new T.Vector3(),normal=new T.Vector3(),z=new T.Vector3(0,0,1),axis=new T.Vector3(),a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3();
 let lastCursor=-1,report=[];
 function update(cursor){
  if(cursor===lastCursor)return report;lastCursor=cursor;
  const index=Math.min(8,Math.floor(cursor+1e-7)),fraction=cursor-index,source=STATES[index],spec=index<8?turnSpec(MOVES[index]):null,counts={U:0,D:0,F:0,B:0,R:0,L:0};report=[];
  if(spec){axis.set(0,0,0).setComponent(spec.axis,1);spin.setFromAxisAngle(axis,spec.angle*fraction);}
  for(const piece of source){
   const moving=spec&&piece.p[spec.axis]===spec.layer&&fraction>1e-7;
   matrix.makeBasis(a.fromArray(piece.basis[0]),b.fromArray(piece.basis[1]),c.fromArray(piece.basis[2]));pieceQ.setFromRotationMatrix(matrix);p.fromArray(piece.p);
   if(moving){p.applyQuaternion(spin);pieceQ.premultiply(spin);}
   scratch.position.copy(p);scratch.quaternion.copy(pieceQ);scratch.scale.set(1,1,1);scratch.updateMatrix();bodies.setMatrixAt(piece.id,scratch.matrix);
   for(const sticker of piece.stickers){
    normal.fromArray(sticker.normal);if(moving)normal.applyQuaternion(spin);
    faceQ.setFromUnitVectors(z,normal);scratch.position.copy(p).addScaledVector(normal,.477);scratch.quaternion.copy(faceQ);scratch.updateMatrix();stickers[sticker.face].setMatrixAt(counts[sticker.face]++,scratch.matrix);
   }
   report.push({id:piece.id,p:p.toArray(),q:pieceQ.toArray(),moving:!!moving});
  }
  bodies.instanceMatrix.needsUpdate=true;for(const mesh of Object.values(stickers))mesh.instanceMatrix.needsUpdate=true;
  return report;
 }
 update(0);return {update,stats:{cubies:26,stickers:54,bodyBatches:1,stickerBatches:6}};
}
