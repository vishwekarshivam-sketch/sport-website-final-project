/* A constant-length strip wound as an Archimedean spiral, in metres.
   This is a prescribed, quasi-static unrolling constraint, not a rigid-body
   simulation. Scroll controls the laid length; it never scales the material. */
export const MAT={length:1.84,width:.64,thickness:.0048,core:.018,segments:560};
const clamp=x=>Math.max(0,Math.min(1,x));
export function matProfile(progress,options={}){
 const p={...MAT,...options},q=clamp(progress),laid=q*p.length,remaining=p.length-laid,a=p.thickness/(2*Math.PI);
 // The last partial turn relaxes onto the deck instead of retaining an empty core.
 const core=p.core*clamp(remaining/.14),F=r=>(r*Math.hypot(r,a)+a*a*Math.asinh(r/a))/(2*a),base=F(core);
 let low=core,high=Math.sqrt(core*core+2*a*remaining)+a;
 for(let i=0;i<38;i++){const mid=(low+high)/2;if(F(mid)-base>remaining)high=mid;else low=mid;}
 const outer=(low+high)/2,beta=outer?Math.atan(a/outer):0,cb=Math.cos(beta),sb=Math.sin(beta);
 function sample(s){
  s=Math.max(0,Math.min(p.length,s));if(s<=laid||remaining<1e-9)return {z:s-p.length/2,y:p.thickness/2,dy:0,dz:1,r:0};
  const u=s-laid,target=F(outer)-u;let r=Math.sqrt(Math.max(core*core,outer*outer-2*a*u));
  for(let k=0;k<6;k++)r=Math.max(core,Math.min(outer,r-(F(r)-target)*a/Math.hypot(r,a)));
  const angle=(outer-r)/a,sn=Math.sin(angle),cs=Math.cos(angle),z=r*sn,y=outer-r*cs,scale=Math.hypot(r,a),dz=(-a*sn+r*cs)/scale,dy=(a*cs+r*sn)/scale;
  return {z:laid-p.length/2+z*cb+y*sb,y:p.thickness/2-z*sb+y*cb,dy:-dz*sb+dy*cb,dz:dz*cb+dy*sb,r};
 }
 return {sample,laid,remaining,outerRadius:outer,coreRadius:core,progress:q,parameters:p};
}
export function createMat(T,keep,top,bottom){
 const N=MAT.segments,W=6,rows=N+1,count=rows*(W+1)*2,positions=new Float32Array(count*3),normals=new Float32Array(count*3),uvs=new Float32Array(count*2),indices=[];
 const idx=(side,i,j)=>side*rows*(W+1)+i*(W+1)+j;
 for(let side=0;side<2;side++)for(let i=0;i<N;i++)for(let j=0;j<W;j++){const a=idx(side,i,j),b=idx(side,i+1,j),c=idx(side,i+1,j+1),d=idx(side,i,j+1);if(side===0)indices.push(a,b,d,b,c,d);else indices.push(a,d,b,b,d,c);}
 const sidesStart=indices.length;for(let i=0;i<N;i++)for(const j of [0,W]){const a=idx(0,i,j),b=idx(0,i+1,j),c=idx(1,i+1,j),d=idx(1,i,j);if(j===0)indices.push(a,d,b,b,d,c);else indices.push(a,b,d,b,c,d);}
 for(const i of [0,N])for(let j=0;j<W;j++){const a=idx(0,i,j),b=idx(0,i,j+1),c=idx(1,i,j+1),d=idx(1,i,j);if(i===0)indices.push(a,b,d,b,c,d);else indices.push(a,d,b,b,d,c);}
 const g=keep(new T.BufferGeometry());g.setAttribute('position',new T.BufferAttribute(positions,3).setUsage(T.DynamicDrawUsage));g.setAttribute('normal',new T.BufferAttribute(normals,3).setUsage(T.DynamicDrawUsage));g.setAttribute('uv',new T.BufferAttribute(uvs,2));g.setIndex(indices);g.addGroup(0,N*W*6,0);g.addGroup(N*W*6,indices.length-N*W*6,1);
 const object=new T.Mesh(g,[top,bottom]);object.castShadow=object.receiveShadow=true;object.name='Continuous 1.84 m unrolling yoga mat';let previous=-1,state;
 function update(progress){if(progress===previous)return state;previous=progress;const curve=matProfile(progress);
  for(let i=0;i<=N;i++){const s=i/N*MAT.length,p=curve.sample(s),corner=.024,edge=Math.min(s,MAT.length-s),half=MAT.width/2-corner+Math.sqrt(Math.max(0,corner*corner-Math.max(0,corner-edge)**2));
   for(let side=0;side<2;side++)for(let j=0;j<=W;j++){const k=idx(side,i,j),sign=side===0?1:-1,x=(j/W*2-1)*half;positions.set([x,p.y+sign*MAT.thickness/2*p.dz,p.z-sign*MAT.thickness/2*p.dy],k*3);normals.set([0,sign*p.dz,-sign*p.dy],k*3);uvs.set([j/W,i/N],k*2);}
  }
  g.attributes.position.needsUpdate=g.attributes.normal.needsUpdate=true;g.computeBoundingBox();g.computeBoundingSphere();state={laidLength:curve.laid,remainingLength:curve.remaining,rollRadius:curve.outerRadius,progress:curve.progress};return state;
 }
 update(.08);return {object,update,geometry:g};
}
