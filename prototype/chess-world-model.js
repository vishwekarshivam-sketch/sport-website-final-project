/* Original Staunton-inspired geometry. No external model, texture or font service. */
import * as T from './vendor/three.module.js';
import {INITIAL,positionAt} from './chess-story.js?v=knight-1';
export function createChessWorld(scene,keep){
 const geometry=new Map(),own=value=>(keep(value),value);
 const material=(color,extra={})=>own(new T.MeshStandardMaterial({color,roughness:.3,metalness:.12,...extra}));
 const black=material('#161c18'),white=material('#efede3',{roughness:.25,metalness:.03}),edge=material('#262f29',{roughness:.45});
 const mesh=(g,m,parent)=>{const result=new T.Mesh(g,m);result.castShadow=result.receiveShadow=true;parent.add(result);return result;};
 const cached=(key,build)=>{if(!geometry.has(key))geometry.set(key,own(build()));return geometry.get(key);};
 const lathe=(key,profile)=>cached(key,()=>new T.LatheGeometry(profile.map(([r,y])=>new T.Vector2(r,y)),40));
 const box=(x,y,z)=>cached(`box-${x}-${y}-${z}`,()=>new T.BoxGeometry(x,y,z));
 const sphere=(r)=>cached('sphere-'+r,()=>new T.SphereGeometry(r,24,16));
 const profiles={
  p:[[0,0],[.27,0],[.29,.045],[.29,.09],[.25,.14],[.21,.18],[.17,.27],[.115,.48],[.14,.57],[.19,.60],[.19,.66],[0,.67]],
  n:[[0,0],[.34,0],[.37,.055],[.37,.12],[.32,.17],[.29,.22],[.23,.27],[.22,.34],[.28,.39],[.28,.46],[0,.47]],
  k:[[0,0],[.35,0],[.38,.06],[.38,.12],[.33,.18],[.28,.23],[.28,.28],[.22,.33],[.15,.82],[.19,.96],[.28,1.01],[.28,1.09],[.21,1.15],[.17,1.22],[.18,1.34],[.14,1.42],[0,1.45]],
  q:[[0,0],[.33,0],[.36,.06],[.36,.13],[.31,.18],[.26,.23],[.23,.3],[.14,.83],[.19,.96],[.27,1.01],[.27,1.08],[.21,1.14],[.23,1.29],[.29,1.39],[.27,1.46],[0,1.46]],
  b:[[0,0],[.31,0],[.34,.06],[.34,.12],[.29,.18],[.23,.23],[.19,.29],[.12,.76],[.16,.89],[.23,.94],[.23,1.02],[.14,1.08],[0,1.12]],
  r:[[0,0],[.33,0],[.36,.06],[.36,.13],[.31,.18],[.25,.23],[.22,.28],[.21,.92],[.27,.98],[.31,1.05],[.31,1.15],[0,1.15]]
 };
 const board=new T.Group();scene.add(board);
 const frameShape=new T.Shape();frameShape.moveTo(-4.3,-4.3);frameShape.lineTo(4.3,-4.3);frameShape.lineTo(4.3,4.3);frameShape.lineTo(-4.3,4.3);frameShape.closePath();
 const frameG=own(new T.ExtrudeGeometry(frameShape,{depth:.18,bevelEnabled:true,bevelSize:.035,bevelThickness:.035,bevelSegments:2,steps:1}));frameG.rotateX(-Math.PI/2);
 const border=mesh(frameG,edge,board);border.position.y=-.26;
 const tileG=own(new T.BoxGeometry(.999,.12,.999)),tileWhite=material('#e9e7df',{roughness:.52,metalness:.02}),tileBlack=material('#202721',{roughness:.46,metalness:.06});
 const transform=new T.Object3D();for(const [parity,mat] of [[0,tileBlack],[1,tileWhite]]){
  const tiles=own(new T.InstancedMesh(tileG,mat,32));tiles.receiveShadow=true;let i=0;
  for(let rank=0;rank<8;rank++)for(let file=0;file<8;file++)if((file+rank)%2===parity){transform.position.set(file-3.5,-.065,3.5-rank);transform.updateMatrix();tiles.setMatrixAt(i++,transform.matrix);}
  tiles.instanceMatrix.needsUpdate=true;board.add(tiles);
 }
 const labelCanvas=document.createElement('canvas');labelCanvas.width=labelCanvas.height=512;const ctx=labelCanvas.getContext('2d');ctx.fillStyle='#c8c9b9';ctx.font='14px Faktum, Arial';ctx.textAlign='center';ctx.textBaseline='middle';
 for(let i=0;i<8;i++){ctx.fillText('abcdefgh'[i],(i+.5)/8*464+24,500);ctx.fillText(String(8-i),10,(i+.5)/8*464+24);}
 const labelMap=own(new T.CanvasTexture(labelCanvas));labelMap.colorSpace=T.SRGBColorSpace;
 const labels=mesh(own(new T.PlaneGeometry(8.7,8.7)),own(new T.MeshBasicMaterial({map:labelMap,transparent:true,depthWrite:false,opacity:.8})),board);labels.rotation.x=-Math.PI/2;labels.position.y=.009;labels.castShadow=false;
 const floor=mesh(own(new T.PlaneGeometry(150,150)),material('#dedfd6',{roughness:.95,metalness:0}),scene);floor.rotation.x=-Math.PI/2;floor.position.y=-.30;floor.castShadow=false;
 const actors=new Map();
 for(const piece of INITIAL){
  const anchor=new T.Group(),sculpture=new T.Group(),mat=piece.color==='black'?black:white;scene.add(anchor);anchor.add(sculpture);
  mesh(lathe(piece.type,profiles[piece.type]),mat,sculpture);
  const add=(g,x,y,z=0)=>{const obj=mesh(g,mat,sculpture);obj.position.set(x,y,z);return obj;};
  if(piece.type==='p')add(sphere(.20),0,.84);
  if(piece.type==='k'){add(sphere(.13),0,1.47);add(box(.095,.39,.09),0,1.66);add(box(.31,.095,.09),0,1.69);}
  if(piece.type==='q'){
   for(let j=0;j<7;j++){const a=j/7*Math.PI*2;add(sphere(.065),Math.cos(a)*.265,1.49+Math.sin(j*2.4)*.035,Math.sin(a)*.265);}
   add(sphere(.09),0,1.54);
  }
  if(piece.type==='r')for(let j=0;j<6;j++){const a=j/6*Math.PI*2;const tooth=add(box(.14,.20,.13),Math.cos(a)*.245,1.20,Math.sin(a)*.245);tooth.rotation.y=-a;}
  if(piece.type==='b'){
   const head=add(cached('bishop-head',()=>new T.SphereGeometry(.205,28,20,0,Math.PI*2,.1,Math.PI-.1)),0,1.26);head.position.set(0,1.27,0);head.scale.set(.9,1.5,.9);
   add(sphere(.065),0,1.6);
   // A dark diagonal mitre incision, rather than an unrelated cone.
   const cut=mesh(box(.022,.35,.012),piece.color==='white'?black:edge,sculpture);cut.position.set(.03,1.35,.181);cut.rotation.z=-.45;
  }
  if(piece.type==='n'){
   const horse=cached('horse-profile',()=>{
    const s=new T.Shape();s.moveTo(-.26,.47);s.bezierCurveTo(-.28,.73,-.42,.82,-.29,1.17);s.lineTo(-.1,1.56);s.lineTo(.02,1.73);s.lineTo(.08,1.51);s.lineTo(.28,1.44);s.lineTo(.55,1.16);s.lineTo(.63,1.01);s.lineTo(.49,.89);s.lineTo(.28,.99);s.lineTo(.14,.85);s.bezierCurveTo(.15,.69,.35,.63,.36,.47);s.closePath();
    const g=new T.ExtrudeGeometry(s,{depth:.28,bevelEnabled:true,bevelSize:.045,bevelThickness:.045,bevelSegments:3,curveSegments:12,steps:1});g.translate(-.1,0,-.14);return g;
   });add(horse,0,0);
   for(const z of [-.184,.184]){const eye=mesh(sphere(.027),piece.color==='black'?edge:black,sculpture);eye.position.set(.12,1.32,z);}
   const mane=mesh(box(.018,.32,.018),edge,sculpture);mane.position.set(-.26,1.04,.181);mane.rotation.z=-.43;
  }
  actors.set(piece.id,{anchor,sculpture});
 }
 function update(cursor,tip){
  const state=positionAt(cursor);
  for(const piece of state){const {anchor,sculpture}=actors.get(piece.id);anchor.visible=piece.scale>.001;anchor.position.set(piece.x,.025+piece.lift,piece.z);anchor.scale.setScalar(piece.scale);anchor.rotation.set(0,0,0);sculpture.position.set(0,0,0);
   if(piece.id==='h1'){anchor.position.z+=.39;sculpture.position.z=-.39;anchor.rotation.x=tip*1.50;}
  }
  return state;
 }
 update(0,0);
 return {update,stats:{pieceCount:INITIAL.length,boardSquares:64,originalGeometry:true}};
}
