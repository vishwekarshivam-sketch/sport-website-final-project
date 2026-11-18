import * as T from './vendor/three.module.js';
/* Bake only a caller-declared static model. Animated materials stay shared.
   Source objects/geometries remain owned by the runtime for deterministic disposal. */
export function batchStaticModel(root,keep){
 root.updateMatrixWorld(true);const inverse=root.matrixWorld.clone().invert(),groups=new Map(),matrix=new T.Matrix4(),instance=new T.Matrix4(),normal=new T.Matrix3(),v=new T.Vector3();
 root.traverse(o=>{if(!o.isMesh||Array.isArray(o.material)||o.instanceColor||o.geometry.morphAttributes.position)return;
  const g=o.geometry;if(!g.attributes.position||!g.attributes.normal||Object.keys(g.attributes).some(k=>!['position','normal','uv'].includes(k)))return;
  const key=[o.material.uuid,o.castShadow,o.receiveShadow].join(':');if(!groups.has(key))groups.set(key,{objects:[],material:o.material,cast:o.castShadow,receive:o.receiveShadow});groups.get(key).objects.push(o);
 });
 for(const b of groups.values()){
  if(b.objects.length<2)continue;const positions=[],normals=[],uvs=[],indices=[];
  for(const o of b.objects){const g=o.geometry,p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv,count=o.isInstancedMesh?o.count:1;
   for(let j=0;j<count;j++){matrix.multiplyMatrices(inverse,o.matrixWorld);if(o.isInstancedMesh){o.getMatrixAt(j,instance);matrix.multiply(instance);}normal.getNormalMatrix(matrix);const offset=positions.length/3;
    for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(matrix);positions.push(v.x,v.y,v.z);v.fromBufferAttribute(n,i).applyMatrix3(normal).normalize();normals.push(v.x,v.y,v.z);uvs.push(uv?.getX(i)||0,uv?.getY(i)||0);}
    const ix=g.index;if(ix)for(let i=0;i<ix.count;i++)indices.push(offset+ix.getX(i));else for(let i=0;i<p.count;i++)indices.push(offset+i);
   }
  }
  const g=keep(new T.BufferGeometry());g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));g.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));g.setIndex(indices);g.computeBoundingSphere();const mesh=new T.Mesh(g,b.material);mesh.castShadow=b.cast;mesh.receiveShadow=b.receive;root.add(mesh);b.objects.forEach(o=>o.removeFromParent());
 }
}
