import { quality, treeAsset as treeURL, textureAsset } from './render-policy.js';
/* Original illustrative pavilion; NOT a reconstruction of the New SAC hall.
   Metre-scale architecture and equipment. CC0 maps and tree provenance documented. */
import * as T from './vendor/three.module.js';
import {createMat} from './yoga-mat-model.js?v=pavilion-1';
const hash=(x,y)=>{const n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n);};
export async function createYogaWorld(scene,keep){
 const own=x=>keep(x),m=(color,extra={})=>own(new T.MeshStandardMaterial({color,roughness:.8,...extra}));
 const folder=new URL('./assets/yoga/materials/',import.meta.url),loader=new T.TextureLoader();
 async function texture(name,color=false){const t=own(await loader.loadAsync(textureAsset(folder,name).href));t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=8;if(color)t.colorSpace=T.SRGBColorSpace;return t;}
 const maps=await Promise.all(['wood','plaster','stone'].map(async name=>{const [map,normalMap,roughnessMap]=await Promise.all([texture(name+'-color',true),texture(name+'-normal'),texture(name+'-rough')]);return {map,normalMap,roughnessMap};}));
 const wood=m('#e3c5a0',{...maps[0],normalScale:new T.Vector2(.45,.45)}),plaster=m('#efe3ce',{...maps[1],normalScale:new T.Vector2(.22,.22)}),stone=m('#e3dfcb',{...maps[2],normalScale:new T.Vector2(.4,.4)}),darkwood=m('#765740',{...maps[0],normalScale:new T.Vector2(.3,.3)});
 for(const timber of [wood,darkwood]){timber.onBeforeCompile=shader=>{shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\n#ifdef USE_INSTANCING\nattribute vec2 timberOffset;\n#endif').replace('#include <uv_vertex>','#include <uv_vertex>\n#ifdef USE_INSTANCING\nvMapUv+=timberOffset;vNormalMapUv+=timberOffset;vRoughnessMapUv+=timberOffset;\n#endif');shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
 float timberLuma=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));diffuseColor.rgb=mix(diffuseColor.rgb,vec3(timberLuma),.72)*1.65;`);};timber.customProgramCacheKey=()=> 'yoga-muted-timber-v2';}
 // Box UVs are expressed in world metres rather than stretched per component.
 const cache=new Map();function box(w,h,d,material,x,y,z,uvScale=.65,parent=scene){const key=[w,h,d,uvScale].join(':'),g=cache.get(key)||own(new T.BoxGeometry(w,h,d));if(!cache.has(key)){const uv=g.attributes.uv;for(let side=0;side<6;side++){const u=side<2?d:w,v=(side===2||side===3)?d:h;for(let j=0;j<4;j++){const i=side*4+j;uv.setXY(i,uv.getX(i)*u*uvScale,uv.getY(i)*v*uvScale);}}cache.set(key,g);}const o=new T.Mesh(g,material);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;parent.add(o);return o;}
 function mesh(g,material,parent=scene){const o=new T.Mesh(own(g),material);o.castShadow=o.receiveShadow=true;parent.add(o);return o;}
 function tube(points,r,material,parent=scene){const path=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));return mesh(new T.TubeGeometry(path,Math.max(16,points.length*10),r,8,false),material,parent);}
 const ground=box(65,.24,55,stone,0,-.7,0,.35);ground.name='Stone court and continuous ground';
 box(13.4,.42,10.5,plaster,-.7,-.24,.3);box(13.56,.08,10.65,stone,-.7,-.03,.3);
 // Many actual boards supply narrow recessed joints and end-grain thickness.
 const deckG=own(new T.BoxGeometry(.3,.045,3.453));const deckUV=deckG.attributes.uv;for(let n=0;n<24;n++){const side=Math.floor(n/4),u=deckUV.getX(n),v=deckUV.getY(n);deckUV.setXY(n,side===2||side===3?v*1.6:u*.12,side===2||side===3?.02+u*.06:v*.018);}const deck=own(new T.InstancedMesh(deckG,wood,129)),deckOffsets=new Float32Array(129*2),deckPose=new T.Object3D();for(let j=0;j<43;j++)for(let k=0;k<3;k++){const i=j*3+k,x=-7.18+j*.306,z=-4.65+k*3.47;deckPose.position.set(x,.0225,z+1.73);deckPose.updateMatrix();deck.setMatrixAt(i,deckPose.matrix);deck.setColorAt(i,new T.Color().setScalar(.91+hash(j,k)*.14));deckOffsets.set([hash(j,k+40),Math.floor(hash(j,k+60)*7)*.127],i*2);}deckG.setAttribute('timberOffset',new T.InstancedBufferAttribute(deckOffsets,2));deck.computeBoundingSphere();deck.castShadow=deck.receiveShadow=true;scene.add(deck);
 for(let i=0;i<3;i++)box(4.1+i*.5,.13, .42,stone,1.7,-.13-i*.13,5.8+i*.4,.55);
 // Walls flank real openings, thick jambs and lintels reveal their construction.
 box(.32,4.45,9.2,plaster,-7,2.18,-.2);box(13.5,1.12,.32,plaster,-.4,.52,-4.65);
 for(const x of [-6.9,-3.5,.05,3.6,6.2])box(.28,3.1,.35,plaster,x,2.61,-4.65);
 box(13.5,.44,.4,plaster,-.4,4.28,-4.65);
 for(const x of [-6.65,5.9])for(const z of [-4.2,4.65]){box(.18,4.15,.18,darkwood,x,2.12,z);box(.26,.1,.26,stone,x,.1,z);}
 for(const x of [-6.65,5.9])box(.22,.25,9.3,darkwood,x,4.25,.2);for(const z of [-4.25,4.65])box(12.9,.26,.24,darkwood,-.35,4.31,z);
 for(let j=0;j<42;j++)box(.12,.19,9.05,wood,-6.5+j*.299,4.48,.2,.55);
 // A solid shady bay to the left makes the room believable and offers visual rest.
 box(3.1,.13,9.12,plaster,-5.05,4.62,.2);
 // A built-in bench, cushions and open equipment shelving.
 box(3.15,.11,.52,wood,-4.7,.48,-3.9);for(const x of [-5.95,-3.5])box(.12,.48,.43,darkwood,x,.24,-3.9);
 const cotton=m('#c4bda2',{roughness:1});
 for(const x of [-5.5,-4.5]){const c=mesh(new T.SphereGeometry(1,24,16),cotton);c.position.set(x,.61,-3.9);c.scale.set(.42,.085,.22);}
 for(const x of [3.95,5.55])box(.075,1.48,.58,darkwood,x,.78,-3.92);for(const y of [.18,.78,1.43])box(1.72,.055,.64,wood,4.75,y,-3.92);
 const fiberCanvas=document.createElement('canvas');fiberCanvas.width=fiberCanvas.height=512;let ctx=fiberCanvas.getContext('2d');ctx.fillStyle='#a3a3a3';ctx.fillRect(0,0,512,512);for(let i=0;i<512;i++){ctx.strokeStyle=i%3?'#939393':'#bcbcbc';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,i);ctx.lineTo(512,i);ctx.stroke();}for(let i=0;i<18000;i++){const n=hash(i,4);ctx.fillStyle=n>.5?'#b8b8b8':'#818181';ctx.fillRect(hash(i,5)*512,hash(i,6)*512,1,1);}const fiber=own(new T.CanvasTexture(fiberCanvas));fiber.wrapS=fiber.wrapT=T.RepeatWrapping;fiber.repeat.set(14,30);fiber.anisotropy=8;
 const matSurface=m('#355f50',{bumpMap:fiber,bumpScale:.00035,roughness:.96}),matBack=m('#274b40',{bumpMap:fiber,bumpScale:.0003,roughness:.98});
 const mat=createMat(T,own,matSurface,matBack);mat.object.position.set(1.65,.046,1.5);mat.object.rotation.y=-.28;scene.add(mat.object);
 // Cork is a volumetric, bevelled original prop, not a flat card.
 const corkCanvas=document.createElement('canvas');corkCanvas.width=corkCanvas.height=512;ctx=corkCanvas.getContext('2d');ctx.fillStyle='#bba078';ctx.fillRect(0,0,512,512);for(let i=0;i<15000;i++){const v=hash(i,7);ctx.fillStyle=`rgba(${v>.5?'69,44,20':'239,213,169'},${.1+v*.3})`;ctx.beginPath();ctx.ellipse(hash(i,8)*512,hash(i,9)*512,1+hash(i,10)*3,.5+hash(i,11)*2,hash(i,12)*3,0,6.28);ctx.fill();}const corkTex=own(new T.CanvasTexture(corkCanvas));corkTex.colorSpace=T.SRGBColorSpace;corkTex.anisotropy=8;const cork=m('#e6cfaa',{map:corkTex,bumpMap:corkTex,bumpScale:.00035,roughness:1});
 function rounded(w,h,d,r,material,x,y,z,parent=scene){const shape=new T.Shape(),a=w/2-r,b=h/2-r;shape.moveTo(-a,-h/2);shape.lineTo(a,-h/2);shape.quadraticCurveTo(w/2,-h/2,w/2,-b);shape.lineTo(w/2,b);shape.quadraticCurveTo(w/2,h/2,a,h/2);shape.lineTo(-a,h/2);shape.quadraticCurveTo(-w/2,h/2,-w/2,b);shape.lineTo(-w/2,-b);shape.quadraticCurveTo(-w/2,-h/2,-a,-h/2);const g=new T.ExtrudeGeometry(shape,{depth:d-2*r,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:r*.45,bevelThickness:r,curveSegments:6});g.translate(0,0,-d/2+r);const uv=g.attributes.uv,p=g.attributes.position,n=g.attributes.normal;for(let i=0;i<p.count;i++){const nx=Math.abs(n.getX(i)),ny=Math.abs(n.getY(i)),nz=Math.abs(n.getZ(i));uv.setXY(i,(nx>ny&&nx>nz?p.getZ(i):p.getX(i))*5,(ny>nz?p.getZ(i):p.getY(i))*5);}const o=mesh(g,material,parent);o.position.set(x,y,z);return o;}
 const block=rounded(.23,.145,.095,.012,cork,2.27,.124,1.1);block.rotation.y=.12;rounded(.23,.095,.145,.012,cork,2.37,.255,1.09).rotation.y=-.1;
 for(let i=0;i<4;i++)rounded(.23,.095,.145,.012,cork,4.25+i*.27,.87,-3.9);
 const bolsterMat=m('#a9a28a',{bumpMap:fiber,bumpScale:.0004,roughness:1});
 const bolster=new T.Group();bolster.position.set(.56,.175,.61);bolster.rotation.y=.3;scene.add(bolster);const cushion=mesh(new T.CapsuleGeometry(.122,.48,10,32),bolsterMat,bolster);cushion.rotation.z=Math.PI/2;cushion.scale.z=.85;
 for(const x of [-.24,.24]){const seam=mesh(new T.TorusGeometry(.119,.0018,6,48),cotton,bolster);seam.rotation.y=Math.PI/2;seam.position.x=x;seam.scale.y=.85;}
 tube([[-.32,0,-.04],[-.36,.005,0],[-.32,0,.04]],.009,cotton,bolster);
 // Woven strap, two solid D rings and a compact folded tail.
 const strapMat=m('#d5c9a8',{bumpMap:fiber,bumpScale:.0003,roughness:1}),metal=m('#b7b4a4',{metalness:.85,roughness:.3});
 const strap=new T.Group();strap.position.set(2.25,.056,2.16);strap.rotation.y=-.4;scene.add(strap);const strapPath=new T.CatmullRomCurve3([[0,0,0],[.12,.002,-.08],[.31,.003,-.07],[.38,.003,.02],[.22,.002,.1],[.03,0,.08],[0,0,0]].map(p=>new T.Vector3(...p)));const strapG=own(new T.BufferGeometry()),sp=[],si=[];for(let i=0;i<=100;i++){const p=strapPath.getPoint(i/100),t=strapPath.getTangent(i/100),n=new T.Vector3(-t.z,0,t.x).multiplyScalar(.014);sp.push(p.x+n.x,p.y+.002,p.z+n.z,p.x-n.x,p.y+.002,p.z-n.z);if(i<100){let a=i*2;si.push(a,a+2,a+1,a+1,a+2,a+3);}}strapG.setAttribute('position',new T.Float32BufferAttribute(sp,3));strapG.setIndex(si);strapG.computeVertexNormals();const sm=new T.Mesh(strapG,strapMat);strap.add(sm);sm.castShadow=true;strapMat.side=T.DoubleSide;
 for(const z of [0,.013])tube([[0,.003,z],[-.018,.006,z],[-.025,.012,z+.018],[-.018,.006,z+.034],[0,.003,z+.034]],.002,metal,strap);
 rounded(.12,.018,.035,.004,strapMat,-.01,.01,.09,strap);
 // Folding yoga chair, with tube bends, seat/back, feet and rear cross brace.
 const chair=new T.Group();chair.position.set(3.65,.047,-.22);chair.rotation.y=-.32;scene.add(chair);const chairMetal=m('#68756b',{metalness:.55,roughness:.48});
 for(const x of [-.225,.225]){tube([[x,.02,.24],[x,.18,.15],[x,.46,-.04],[x,.79,-.12],[x,.88,-.13]],.011,chairMetal,chair);tube([[x,.02,-.25],[x,.16,-.16],[x,.43,.07],[x,.52,.13]],.011,chairMetal,chair);for(const z of [-.25,.24])box(.033,.018,.042,matBack,x,.009,z,.5,chair);}
 rounded(.45,.035,.41,.018,wood,0,.46,.03,chair);rounded(.445,.17,.028,.015,wood,0,.77,-.13,chair);tube([[-.225,.2,-.14],[0,.2,-.14],[.225,.2,-.14]],.009,chairMetal,chair);
 // One rolled spare on the shelf, distinct from the animated continuous strip.
 const spare=mesh(new T.CylinderGeometry(.055,.055,.64,48),matBack);spare.rotation.z=Math.PI/2;spare.position.set(4.7,.27,-3.91);
 // Contained water basin with thickness, submerged bed and real coping joints.
 box(5.6,.16,8.8,stone,9.1,-.52,.4,.5);const poolBed=m('#607c6b',{...maps[2],roughness:.7});box(5.1,.045,8.2,poolBed,9.1,-.42,.4,.6);
 for(const x of [6.46,11.74])box(.2,.3,8.65,stone,x,-.28,.4,.6);for(const z of [-3.84,4.64])box(5.5,.3,.2,stone,9.1,-.28,z,.6);
 for(let i=0;i<10;i++)box(.57,.09,.43,stone,6.5+i*.59,-.075,4.91,.7);
 // Planted beds beyond the openings anchor a real landscape around the room.
 box(39,2.8,.3,plaster,1, .7,-13.5,.6);box(.3,3.,30,plaster,19,.8,0,.6);
 const soil=m('#625843',{roughness:1});box(18,.16,3.5,soil,1,-.47,-7.1);box(4.5,.16,12,soil,15,-.47,-.3);
 const treeAsset=new URL('./assets/yoga/environment/',import.meta.url),treeTex=async(name,srgb)=>{const t=own(await loader.loadAsync(textureAsset(treeAsset,name).href));if(srgb)t.colorSpace=T.SRGBColorSpace;t.flipY=false;t.anisotropy=4;return t;};
 const [def,data,bark,branch,leaf,barkN,branchN]=await Promise.all([fetch(treeURL(treeAsset,'json')).then(r=>r.json()),fetch(treeURL(treeAsset,'bin')).then(r=>r.arrayBuffer()),treeTex('bark-color',true),treeTex('branch-color',true),treeTex('leaf-color',true),treeTex('bark-normal'),treeTex('branch-normal')]);
 const treeM={bark:m('#b7a995',{map:bark,normalMap:barkN}),branch:m('#b7a995',{map:branch,normalMap:branchN}),leaf:m('#d2d7b3',{map:leaf,alphaTest:.45,side:T.DoubleSide,roughness:1,emissiveMap:leaf,emissive:'#91a471',emissiveIntensity:.15})},trees=[[-5,-8.3,1.35],[3.2,-8.8,1.4],[13.8,-5.9,1.55],[15.1,3.4,1.45],[-12,-5.7,1.4],[11,-12,1.6]],o3=new T.Object3D();
 for(const primitive of def.primitives){const g=own(new T.BufferGeometry());for(const [name,a] of Object.entries(primitive.attributes)){const a2=new (name==='index'?Uint32Array:Float32Array)(data,a.offset,a.count);if(name==='index')g.setIndex(new T.BufferAttribute(a2,1));else g.setAttribute(name,new T.BufferAttribute(a2,name==='uv'?2:3));}g.computeBoundingSphere();const inst=own(new T.InstancedMesh(g,treeM[primitive.material],trees.length));trees.forEach(([x,z,s],i)=>{o3.position.set(x,-.4,z);o3.scale.setScalar(s);o3.rotation.set(0,i*1.7,0);o3.updateMatrix();inst.setMatrixAt(i,o3.matrix);});inst.computeBoundingSphere();inst.castShadow=inst.receiveShadow=true;scene.add(inst);}
 // Low tropical foliage: curved leaf geometry and stems, not green blobs.
 const leafMat=m('#527653',{side:T.DoubleSide,roughness:.85}),leafG=own(new T.PlaneGeometry(.13,.58,5,14));const lp=leafG.attributes.position;
 for(let i=0;i<lp.count;i++){const v=(lp.getY(i)+.29)/.58,u=lp.getX(i)/.065;lp.setXYZ(i,u*.065*Math.sin(Math.PI*v)**.6, v*.58,Math.sin(v*2.6)*.16+u*u*.018);}leafG.computeVertexNormals();
 const plants=own(new T.InstancedMesh(leafG,leafMat,420));for(let i=0;i<420;i++){const group=Math.floor(i/14),a=i%14*2.399,x=-7+hash(group,1)*19,z=-6.1-hash(group,2)*1.8;o3.position.set(x,-.4,z);o3.rotation.set(.28+hash(i,4)*.65,a,0);o3.scale.setScalar(.6+hash(i,3)*.9);o3.updateMatrix();plants.setMatrixAt(i,o3.matrix);plants.setColorAt(i,new T.Color().setHSL(.25+hash(i,5)*.06,.23,.23+hash(i,6)*.08));}plants.computeBoundingSphere();plants.castShadow=plants.receiveShadow=true;scene.add(plants);
 const sky=mesh(new T.SphereGeometry(120,24,16),own(new T.ShaderMaterial({side:T.BackSide,depthWrite:false,vertexShader:'varying vec3 p;void main(){p=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec3 p;void main(){float y=pow(max(0.,normalize(p).y),.5);gl_FragColor=vec4(mix(vec3(.86,.88,.79),vec3(.55,.68,.72),y),1.);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}'})));sky.castShadow=sky.receiveShadow=false;
 const faces=[];for(let i=0;i<6;i++){const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),g=x.createLinearGradient(0,0,0,64);g.addColorStop(0,i===3?'#84715a':'#c9dce1');g.addColorStop(.5,'#f1e6ce');g.addColorStop(1,'#887d64');x.fillStyle=g;x.fillRect(0,0,64,64);faces.push(c);}const probe=own(new T.CubeTexture(faces));probe.colorSpace=T.SRGBColorSpace;probe.needsUpdate=true;scene.environment=probe;scene.environmentIntensity=.36;
 return {mat,update(progress){const state=mat.update(progress);mat.object.updateMatrixWorld(true);return state;},stats:{architecture:'original illustrative pavilion',trees:trees.length,leafInstances:420,matLength:1.84,matThickness:.0048,deckBoards:129,props:['continuous mat','cork blocks','strap and D rings','seamed bolster','folding yoga chair','spare mat']}};
}
