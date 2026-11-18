/* Original illustrative ceremonial cup. No imported trophy or institutional replica. */
import * as T from './vendor/three.module.js';
export function createChampionshipCup(scene,keep){
 const own=x=>keep(x),group=new T.Group();scene.add(group);
 const brush=document.createElement('canvas');brush.width=512;brush.height=512;const cx=brush.getContext('2d');cx.fillStyle='#a5a5a5';cx.fillRect(0,0,512,512);
 let seed=1958;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 for(let i=0;i<1800;i++){const y=random()*512,v=Math.floor(125+random()*48);cx.strokeStyle=`rgba(${v},${v},${v},.3)`;cx.beginPath();cx.moveTo(random()*120,y);cx.lineTo(350+random()*162,y+random()*.5);cx.stroke();}
 const bump=own(new T.CanvasTexture(brush));bump.wrapS=bump.wrapT=T.RepeatWrapping;bump.repeat.set(4,1);
 const bronze=own(new T.MeshPhysicalMaterial({color:'#bf9a60',metalness:.88,roughness:.27,bumpMap:bump,bumpScale:.007,clearcoat:.17,clearcoatRoughness:.35}));
 const bright=own(new T.MeshStandardMaterial({color:'#d5b77d',metalness:.9,roughness:.23}));
 const green=own(new T.MeshPhysicalMaterial({color:'#153c31',metalness:.24,roughness:.33,clearcoat:.5,clearcoatRoughness:.3}));
 const stone=own(new T.MeshStandardMaterial({color:'#e8e1d2',roughness:.78}));const dark=own(new T.MeshStandardMaterial({color:'#bfb7a3',roughness:.85}));
 const mesh=(g,m,parent=group)=>{const o=new T.Mesh(own(g),m);o.castShadow=o.receiveShadow=true;parent.add(o);return o;};
 const cylinder=(a,b,h,y,m,segments=96)=>{const o=mesh(new T.CylinderGeometry(a,b,h,segments),m);o.position.y=y;return o;};
 const ring=(r,t,y,m=bright)=>{const o=mesh(new T.TorusGeometry(r,t,12,128),m);o.rotation.x=Math.PI/2;o.position.y=y;return o;};
 cylinder(1.43,1.46,.13,.065,dark);cylinder(1.38,1.38,.59,.40,stone);cylinder(1.46,1.46,.09,.74,stone);
 const flute=own(new T.InstancedMesh(own(new T.CylinderGeometry(.022,.022,.50,6)),stone,112)),pose=new T.Object3D();
 for(let i=0;i<112;i++){const a=i/112*Math.PI*2;pose.position.set(Math.sin(a)*1.39,.40,Math.cos(a)*1.39);pose.updateMatrix();flute.setMatrixAt(i,pose.matrix);}flute.castShadow=flute.receiveShadow=true;group.add(flute);
 cylinder(.81,.88,.12,.86,green);cylinder(.76,.81,.23,1.025,green);cylinder(.83,.78,.055,1.17,bright);cylinder(.55,.68,.075,1.23,green);
 const stem=mesh(new T.LatheGeometry([[.44,1.26],[.38,1.32],[.23,1.39],[.17,1.53],[.17,1.67],[.24,1.76],[.34,1.83]].map(p=>new T.Vector2(...p)),96),bronze);
 ring(.24,.04,1.40);ring(.205,.035,1.68);
 const profile=[[.02,1.79],[.25,1.79],[.43,1.87],[.62,2.02],[.79,2.23],[.95,2.50],[1.07,2.82],[1.13,3.12],[1.145,3.21],[1.13,3.245],[1.09,3.245],[1.075,3.19],[1.04,2.88],[.91,2.55],[.75,2.29],[.59,2.08],[.4,1.93],[.22,1.87],[.02,1.87]];
 mesh(new T.LatheGeometry(profile.map(p=>new T.Vector2(...p)),160),bronze);ring(1.115,.027,3.23);ring(.43,.023,1.88);
 for(const side of [-1,1]){
  const points=[[side*1.10,3.08,0],[side*1.48,3.20,0],[side*1.70,2.97,0],[side*1.67,2.58,0],[side*1.39,2.28,0],[side*.86,2.28,0]].map(p=>new T.Vector3(...p));
  mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),80,.062,12,false),bronze);
  const cap=mesh(new T.SphereGeometry(.105,20,16),bright);cap.position.set(side*1.105,3.08,0);cap.scale.set(.65,1,1);
 }
 // Fine engraved bowl ring, radial stem knurl and restrained plaque fasteners.
 for(let i=0;i<48;i++){const a=i/48*Math.PI*2;const bead=mesh(new T.SphereGeometry(.011,6,6),bright);bead.position.set(Math.sin(a)*.235,1.40,Math.cos(a)*.235);}
 const plaque=mesh(new T.BoxGeometry(.68,.15,.025),bright);plaque.position.set(0,1.015,.79);
 const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=220;const ctx=canvas.getContext('2d');ctx.fillStyle='#d4b67e';ctx.fillRect(0,0,1024,220);ctx.fillStyle='#173f34';ctx.textAlign='center';ctx.font='38px Faktum';ctx.fillText('GENERAL CHAMPIONSHIP',512,98);ctx.font='26px Faktum';ctx.fillText('IIT BOMBAY',512,158);
 const label=own(new T.CanvasTexture(canvas));label.colorSpace=T.SRGBColorSpace;
 const face=mesh(new T.PlaneGeometry(.65,.14),own(new T.MeshBasicMaterial({map:label})));face.position.set(0,1.015,.805);
 for(const side of [-1,1]){const screw=mesh(new T.SphereGeometry(.012,8,8),bronze);screw.position.set(side*.31,1.015,.82);}
 const floor=mesh(new T.PlaneGeometry(200,200),own(new T.ShadowMaterial({color:'#173f34',opacity:.16})),scene);floor.rotation.x=-Math.PI/2;floor.position.y=-.012;floor.castShadow=false;
 return {group,bounds:{height:3.28,width:3.53},materials:{bronze,green,stone},stats:{flutes:112,originalGeometry:true}};
}
export function createStudioEnvironment(renderer,keep){
 const own=x=>keep(x),studio=new T.Scene();studio.background=new T.Color('#b0b5ae');
 const box=(w,h,d,x,y,z,intensity,color)=>{const mat=own(new T.MeshBasicMaterial({color:new T.Color(color).multiplyScalar(intensity),side:T.DoubleSide}));const o=new T.Mesh(own(new T.BoxGeometry(w,h,d)),mat);o.position.set(x,y,z);studio.add(o);};
 box(2,9,7,-5,4,1,3.3,'#fff1dc');box(.3,8,6,5,3,0,2.0,'#f1f6ff');box(8,.15,5,0,7,0,3,'#ffffff');box(6,5,.1,0,2,-6,.12,'#183a30');box(3,5,.1,0,3,6,1.1,'#fff9ed');
 const pmrem=new T.PMREMGenerator(renderer);const target=own(pmrem.fromScene(studio,.04,.1,30));pmrem.dispose();return target.texture;
}
