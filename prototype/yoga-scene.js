/* Shared camera/light design for production and original look development. */
import * as T from './vendor/three.module.js';
export const ease=x=>{x=Math.max(0,Math.min(1,x));return x*x*x*(x*(x*6-15)+10);};
export const STAGES=[
 {camera:[3.3,1.55,4.3],target:[.15,.65,.4],unroll:.12},
 {camera:[4.1,2.6,6.4],target:[.1,1.,.1],unroll:.44},
 {camera:[3.6,1.6,4.1],target:[1.2,.45,.65],unroll:1},
 {camera:[4.8,2.8,6.9],target:[.7,1.,-1],unroll:1},
 {camera:[6,2.2,6.7],target:[2,1.,-1.6],unroll:1},
 {camera:[6.8,2.5,7.8],target:[4.2,1.1,-.9],unroll:1},
 {camera:[8.3,2.4,7.7],target:[6.7,1.15,-.7],unroll:1},
 {camera:[7.9,3.,8.5],target:[5.5,2.,-1.6],unroll:1}
];
export function createYogaScene(keep){const scene=new T.Scene();scene.background=new T.Color('#d8dfd1');scene.fog=new T.Fog('#d8dfd1',28,80);scene.add(new T.HemisphereLight('#e4eced','#8b7659',1.35));const sun=new T.DirectionalLight('#fff0d4',3.4);sun.position.set(-4,10,7);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-14,right:14,top:13,bottom:-13,near:.5,far:42});sun.shadow.bias=-.00005;sun.shadow.normalBias=.012;sun.shadow.radius=3;scene.add(sun);const fill=new T.DirectionalLight('#d7e6e2',.35);fill.position.set(10,5,-5);scene.add(fill);const camera=new T.PerspectiveCamera(48,1,.035,160);return {scene,camera,sun};}
export function applyYogaPose(camera,world,cursor,width,height){cursor=Math.max(0,Math.min(7,cursor));const i=Math.min(6,Math.floor(cursor)),t=ease(cursor-i),a=STAGES[i],b=STAGES[i+1],mix=k=>a[k].map((v,j)=>v+(b[k][j]-v)*t),c=mix('camera'),target=mix('target'),portrait=height>width&&width<=1050;
 if(portrait){const scale=(width<800?1.02:1.08)*(1+.24*ease(Math.max(0,Math.min(1,cursor-1)))*(1-ease(Math.max(0,Math.min(1,cursor-2)))));c[0]=target[0]+(c[0]-target[0])*scale;c[2]=target[2]+(c[2]-target[2])*scale;c[1]+=.8;target[0]+=1.15-1.15*ease(Math.max(0,Math.min(1,cursor-1)))+.6*ease(Math.max(0,Math.min(1,cursor-2)));target[1]+=.5;}
 if(height<500){c[1]+=.3;c[2]+=.5;}
 camera.fov=portrait?58:48;camera.aspect=width/height;camera.position.fromArray(c);camera.lookAt(new T.Vector3(...target));camera.updateProjectionMatrix();camera.updateMatrixWorld();const q=a.unroll+(b.unroll-a.unroll)*t,physical=world.update(q);return {cursor,unroll:q,camera:c,target,physical};}
