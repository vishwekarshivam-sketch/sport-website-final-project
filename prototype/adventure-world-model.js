import { quality } from './render-policy.js';
/* An authored, fictional landscape. Rock scan: Poly Haven rock_face_01 (CC0).
   Terrain, sky, mist, climbing rope, carabiner and tent are original; ferns are CC0 Poly Haven fern_02. */
import * as T from './vendor/three.module.js';
const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
const hash=(x,z)=>{const n=Math.sin(x*127.1+z*311.7)*43758.5453;return n-Math.floor(n);};
function noise(x,z){const a=Math.floor(x),b=Math.floor(z),u=smooth(0,1,x-a),v=smooth(0,1,z-b);return T.MathUtils.lerp(T.MathUtils.lerp(hash(a,b),hash(a+1,b),u),T.MathUtils.lerp(hash(a,b+1),hash(a+1,b+1),u),v);}
function fbm(x,z){let n=0,a=.5;for(let i=0;i<5;i++){n+=a*noise(x,z);x=x*2.03+3.7;z=z*2.07+9.2;a*=.5;}return n;}
const mesas=[[-64,-70,40,23,31],[44,-52,26,24,25],[-4,-122,85,27,43],[86,-151,62,32,52],[-111,-174,58,40,55],[10,-227,160,27,68]];
export function groundHeight(x,z){
 let h=-15+fbm(x*.055,z*.055)*5;
 for(const [cx,cz,rx,rz,height] of mesas){const q=Math.pow(Math.abs((x-cx)/rx),4)+Math.pow(Math.abs((z-cz)/rz),4),edge=1-q+(fbm(x*.065,z*.065)-.5)*.9;const ridge=height+(fbm(x*.045+8,z*.045)-.45)*13;h=Math.max(h,-15+ridge*smooth(-.2,.36,edge)+fbm(x*.13,z*.13)*2);}
 const near=smooth(-39,-7,z);h=T.MathUtils.lerp(h,20+fbm(x*.19,z*.19)*.7-.5,near);
 // A broad, connected shelf supports the camp rather than a floating platform.
 const shelf=smooth(0,1,1-(Math.pow((x-17)/12,4)+Math.pow((z+18)/13,4)));
 h=T.MathUtils.lerp(h,21.6+fbm(x*.18,z*.18)*.5,shelf);
 // Level only the shelter footprint so terrain cannot pierce the groundsheet.
 const dx=x-17,dz=z+18,lx=Math.cos(-.35)*dx-Math.sin(-.35)*dz,lz=Math.sin(-.35)*dx+Math.cos(-.35)*dz;
 const footprint=(1-smooth(1.65,2.05,Math.abs(lx)))*(1-smooth(1.9,2.3,Math.abs(lz)));
 return T.MathUtils.lerp(h,21.6+fbm(17*.18,-18*.18)*.5,footprint);
}
function standard(color,extra={}){return new T.MeshStandardMaterial({color,roughness:.92,...extra});}

export async function createAdventureWorld(scene,keep){
 const owned=value=>keep(value),meshes=[],animated=[];
 const mesh=(g,m,parent=scene)=>{owned(g);owned(m);const o=new T.Mesh(g,m);parent.add(o);meshes.push(o);return o;};
 const texture=async name=>{const t=await new T.TextureLoader().loadAsync(new URL('./assets/adventure/rock/textures/'+name,import.meta.url).href);t.flipY=false;t.anisotropy=4;owned(t);return t;};
 const [definition,binary,diffuse,normal,arm]=await Promise.all([
  fetch(new URL('./assets/adventure/rock/rock.gltf',import.meta.url)).then(r=>{if(!r.ok)throw Error('Rock geometry unavailable');return r.json();}),
  fetch(new URL('./assets/adventure/rock/rock_face_01.bin',import.meta.url)).then(r=>{if(!r.ok)throw Error('Rock buffer unavailable');return r.arrayBuffer();}),
  texture('rock_face_01_diff_1k.jpg'),texture('rock_face_01_nor_gl_1k.jpg'),texture('rock_face_01_arm_1k.jpg')
 ]);
 diffuse.colorSpace=T.SRGBColorSpace;for(const t of [diffuse,normal,arm]){t.wrapS=t.wrapT=T.RepeatWrapping;t.needsUpdate=true;}
 const access=index=>{const a=definition.accessors[index],view=definition.bufferViews[a.bufferView],size={SCALAR:1,VEC2:2,VEC3:3}[a.type],ArrayType=a.componentType===5123?Uint16Array:Float32Array;return new ArrayType(binary,(view.byteOffset||0)+(a.byteOffset||0),a.count*size);};
 const primitive=definition.meshes[0].primitives[0],rock=owned(new T.BufferGeometry());
 for(const [key,name,size] of [['POSITION','position',3],['NORMAL','normal',3],['TEXCOORD_0','uv',2]])rock.setAttribute(name,new T.BufferAttribute(access(primitive.attributes[key]),size));
 rock.setAttribute('uv1',rock.attributes.uv.clone());rock.setIndex(new T.BufferAttribute(access(primitive.indices),1));rock.computeBoundingSphere();
 const stone=owned(standard(0x9ba69c,{map:diffuse,normalMap:normal,normalScale:new T.Vector2(.85,.85),roughnessMap:arm,aoMap:arm,aoMapIntensity:1.1,side:T.DoubleSide}));
 const boulders=[[-10,-.2,7,2.2,3.8,2.3,.25],[12,-.2,5,2.5,4.4,2.8,-.65],[-14,-.2,-3,2.9,3.8,2.7,.1],[23,-.2,-3,3.3,4.2,3,-.5],[-13,-.2,-10,2.4,3.7,2.5,.8],[28,2,-25,2.4,3.4,2.7,-.4],[23,2,-37,3.6,3.1,3.3,.2],[5,19,13,2.6,.35,2.2,-.7]];
 const rocks=owned(new T.InstancedMesh(rock,stone,boulders.length));scene.add(rocks);rocks.castShadow=rocks.receiveShadow=true;
 const object=new T.Object3D();boulders.forEach(([x,y,z,sx,sy,sz,ry],i)=>{object.position.set(x,i===7?19:groundHeight(x,z)-.2,z);object.rotation.set(0,ry,0);object.scale.set(sx,sy,sz);object.updateMatrix();rocks.setMatrixAt(i,object.matrix);});rocks.instanceMatrix.needsUpdate=true;rocks.computeBoundingSphere();

 // One continuous terrain mesh: flat-topped ridgelines, eroded edges and a valley.
 const geometry=owned(new T.PlaneGeometry(360,370,quality.lite?70:220,quality.lite?72:226));geometry.rotateX(-Math.PI/2);geometry.translate(0,0,-128);
 const positions=geometry.attributes.position;
 for(let i=0;i<positions.count;i++){const x=positions.getX(i),z=positions.getZ(i);positions.setY(i,groundHeight(x,z));}
 geometry.computeVertexNormals();const colors=[];
 for(let i=0;i<positions.count;i++){
  const x=positions.getX(i),z=positions.getZ(i),up=geometry.attributes.normal.getY(i),patch=fbm(x*.3,z*.3),grass=smooth(.3,.87,up)*(1-smooth(-22,-4,z)*.28);
  const color=new T.Color().lerpColors(new T.Color('#77786a'),new T.Color().lerpColors(new T.Color('#4b6533'),new T.Color('#9ba65c'),patch),grass);
  color.multiplyScalar(.75+patch*.5);if(z>-20&&z<8){const worn=1-smooth(.25,1.1,Math.abs(x-(1-z*.35)));color.lerp(new T.Color('#8a8061'),worn*.45);}colors.push(color.r,color.g,color.b);
 }
 geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));
 for(let i=0;i<positions.count;i++)geometry.attributes.uv.setXY(i,positions.getX(i)*.23,positions.getZ(i)*.23);
 const groundDiffuse=await new T.TextureLoader().loadAsync(new URL('./assets/adventure/ground/rock_face_diff_1k.jpg',import.meta.url).href);owned(groundDiffuse);groundDiffuse.colorSpace=T.SRGBColorSpace;groundDiffuse.wrapS=groundDiffuse.wrapT=T.RepeatWrapping;groundDiffuse.anisotropy=4;
 const groundMaterial=owned(standard(0xffffff,{map:groundDiffuse,vertexColors:true}));
 groundMaterial.onBeforeCompile=shader=>{
  shader.vertexShader='varying vec3 acWorld;varying vec3 acNormal;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nacWorld=(modelMatrix*vec4(transformed,1.0)).xyz;acNormal=normalize(mat3(modelMatrix)*objectNormal);');
  shader.fragmentShader='varying vec3 acWorld;varying vec3 acNormal;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`vec3 blend=pow(abs(normalize(acNormal)),vec3(5.0));blend/=dot(blend,vec3(1.0));
   vec4 texel=texture2D(map,acWorld.zy*.23)*blend.x+texture2D(map,acWorld.xz*.23)*blend.y+texture2D(map,acWorld.xy*.23)*blend.z;
   diffuseColor*=vec4(mix(texel.rgb,vec3(dot(texel.rgb,vec3(.2126,.7152,.0722))),.85)*1.75,1.0);`);
 };
 const terrain=new T.Mesh(geometry,groundMaterial);terrain.receiveShadow=true;scene.add(terrain);

 // Low-cost broadleaf canopy masses break up the distant plateaus. They are
 // intentionally confined to the middle/far landscape, never close hero props.
 const crownGeometry=owned(new T.SphereGeometry(1,11,7)),cp=crownGeometry.attributes.position;for(let i=0;i<cp.count;i++){const x=cp.getX(i),y=cp.getY(i),z=cp.getZ(i),scale=.8+fbm(x*3+3,z*3)*.4;cp.setXYZ(i,x*scale,y*(.85+noise(x*4+2,z*3)*.25),z*scale);}crownGeometry.computeVertexNormals();
 const crowns=owned(new T.InstancedMesh(crownGeometry,owned(standard(0x697555)),quality.lite?300:1500));
 let crownCount=0;for(let i=0;i<1800&&crownCount<(quality.lite?300:1500);i++){
  const x=-140+hash(i,31)*280,z=-65-hash(i,45)*170,y=groundHeight(x,z),dx=groundHeight(x+.6,z)-y,dz=groundHeight(x,z+.6)-y;
  if(Math.abs(dx)+Math.abs(dz)>1.1)continue;
  const size=.16+hash(i,33)*.38;object.position.set(x,y+size*.65,z);object.rotation.set(0,hash(i,21)*6.28,0);object.scale.set(size,size*.8,size);object.updateMatrix();crowns.setMatrixAt(crownCount,object.matrix);crowns.setColorAt(crownCount,new T.Color().lerpColors(new T.Color('#667955'),new T.Color('#9caa6b'),hash(i,13)));crownCount++;
 }crowns.count=crownCount;crowns.computeBoundingSphere();scene.add(crowns);

 // A quiet sky, warm horizon and broad sun glow; no photographic dome.
 const skyUniforms={top:{value:new T.Color('#7e9ea5')},horizon:{value:new T.Color('#efd4a7')},sunDirection:{value:V(.3,.19,-1).normalize()}};
 const sky=mesh(new T.SphereGeometry(650,32,20),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:skyUniforms,
  vertexShader:'varying vec3 direction;void main(){direction=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:`varying vec3 direction;uniform vec3 top;uniform vec3 horizon;uniform vec3 sunDirection;
   float hashSky(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.54);}float noiseSky(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hashSky(i),hashSky(i+vec2(1.,0.)),f.x),mix(hashSky(i+vec2(0.,1.)),hashSky(i+vec2(1.,1.)),f.x),f.y);}float fbmSky(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=noiseSky(p)*a;p=p*2.1+3.;a*=.5;}return v;}
   void main(){vec3 d=normalize(direction);float h=pow(max(0.,d.y),.47);vec3 c=mix(horizon,top,h);float glow=pow(max(0.,dot(d,sunDirection)),18.);float disc=smoothstep(.9993,.9997,dot(d,sunDirection));float cloud=smoothstep(.46,.74,fbmSky(vec2(atan(d.x,d.z)*5.,d.y*24.)))*smoothstep(.01,.1,d.y)*(1.-smoothstep(.3,.55,d.y));c=mix(c,vec3(.65,.63,.54),cloud*.3);c+=vec3(.35,.20,.07)*glow+vec3(.7,.46,.2)*disc;gl_FragColor=vec4(c,1.);#include <tonemapping_fragment>\n#include <colorspace_fragment>}`.replace(';#include',';\n#include')
 }));sky.renderOrder=-10;

 // Feathery mist bands. Opacity and motion vary inside the layer, not its bounds.
 const mistUniforms=[];
 for(const [z,y,w,h,opacity] of [[-25,4,100,9,.25],[-54,9,140,10,.3],[-85,16,190,12,.3],[-135,20,260,14,.28],[-190,24,300,16,.24]]){
  const uniforms={time:{value:0},tint:{value:new T.Color('#dedac5')},alpha:{value:opacity},seed:{value:-z*.7}};mistUniforms.push(uniforms);
  const m=new T.ShaderMaterial({uniforms,transparent:true,depthWrite:false,side:T.DoubleSide,
   vertexShader:'varying vec2 uvMist;void main(){uvMist=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
   fragmentShader:`varying vec2 uvMist;uniform float time;uniform float alpha;uniform float seed;uniform vec3 tint;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.54);}float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
    void main(){vec2 uv=uvMist;float n=noise(vec2(uv.x*15.+time*.025+seed,uv.y*3.));n+=.5*noise(vec2(uv.x*31.-time*.013,uv.y*6.+seed));float envelope=exp(-pow((uv.y-.5)*4.,2.))*smoothstep(0.,.12,uv.x)*(1.-smoothstep(.85,1.,uv.x));gl_FragColor=vec4(tint,envelope*alpha*smoothstep(.2,1.1,n));\n#include <tonemapping_fragment>\n#include <colorspace_fragment>}`
  });const band=mesh(new T.PlaneGeometry(w,h),m);band.position.set(0,y,z);band.renderOrder=2;
 }

 // Scanned fern leaves retain their detailed silhouettes and PBR surface.
 const fernRoot=new URL('./assets/adventure/fern/',import.meta.url),fernTexture=async name=>{const t=await new T.TextureLoader().loadAsync(new URL('textures/'+name,fernRoot).href);t.flipY=false;t.anisotropy=4;return owned(t);};
 const [fernDefinition,fernBuffer,fernDiffuse,fernNormal,fernARM,fernAlpha]=await Promise.all([fetch(new URL('fern.gltf',fernRoot)).then(r=>r.json()),fetch(new URL('fern_02.bin',fernRoot)).then(r=>r.arrayBuffer()),fernTexture('fern_02_diff_1k.jpg'),fernTexture('fern_02_nor_gl_1k.jpg'),fernTexture('fern_02_arm_1k.jpg'),fernTexture('fern_02_alpha_1k.png')]);fernDiffuse.colorSpace=T.SRGBColorSpace;
 const fernAccess=index=>{const a=fernDefinition.accessors[index],v=fernDefinition.bufferViews[a.bufferView],size={SCALAR:1,VEC2:2,VEC3:3}[a.type];return new (a.componentType===5123?Uint16Array:Float32Array)(fernBuffer,(v.byteOffset||0)+(a.byteOffset||0),a.count*size);};
 const roots=[[-4,11],[-3.5,9],[-4,7],[-3,4],[4,8],[6,6],[7,2],[-6,-6],[-5,-9],[8,-16],[9,-17],[18,-11],[14,-20],[20,-15],[22,-18]];
 let fernShader;const fernMat=owned(standard(0xc1caa5,{map:fernDiffuse,alphaMap:fernAlpha,normalMap:fernNormal,normalScale:new T.Vector2(.5,.5),roughnessMap:fernARM,side:T.DoubleSide,alphaTest:.5}));
 fernMat.onBeforeCompile=shader=>{fernShader=shader;shader.uniforms.acTime={value:0};shader.vertexShader='uniform float acTime;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed.x+=sin(acTime*.6+instanceMatrix[3].x)*.045*position.y*position.y;transformed.z+=cos(acTime*.4+instanceMatrix[3].z)*.025*position.y;');};
 const fernPrimitive=fernDefinition.meshes[0].primitives[0],fernGeo=owned(new T.BufferGeometry());for(const [key,name,size] of [['POSITION','position',3],['NORMAL','normal',3],['TEXCOORD_0','uv',2]])fernGeo.setAttribute(name,new T.BufferAttribute(fernAccess(fernPrimitive.attributes[key]),size));fernGeo.setIndex(new T.BufferAttribute(fernAccess(fernPrimitive.indices),1));
 const ferns=owned(new T.InstancedMesh(fernGeo,fernMat,roots.length));scene.add(ferns);roots.forEach(([x,z],i)=>{object.position.set(x,groundHeight(x,z)+.03,z);object.rotation.set(0,hash(i,8)*6.28,0);object.scale.setScalar(1.8+hash(i,9)*1.6);object.updateMatrix();ferns.setMatrixAt(i,object.matrix);});ferns.computeBoundingSphere();

 // A real two-ended shelter: both triangular portals are holes in the mesh.
 // The camera rail uses this group's transform, never guessed world coordinates.
 const camp=new T.Group();camp.position.set(17,groundHeight(17,-18)+.04,-18);camp.rotation.y=-.35;scene.add(camp);
 const fabric=owned(standard(0xba8242,{side:T.DoubleSide,roughness:1,emissive:0x44260e,emissiveIntensity:.22})),cord=owned(standard(0xc0b18c)),metal=owned(standard(0x747e72,{metalness:.75,roughness:.35}));
 // Fine, original woven-canvas detail; no new downloaded texture or model.
 const weaveCanvas=document.createElement('canvas');weaveCanvas.width=weaveCanvas.height=128;const ink=weaveCanvas.getContext('2d');
 ink.fillStyle='#d4c6ad';ink.fillRect(0,0,128,128);for(let y=0;y<128;y++)for(let x=0;x<128;x++){ink.fillStyle=`rgba(66,45,24,${.025+hash(x,y)*.07+(x%4===0||y%4===0?.07:0)})`;ink.fillRect(x,y,1,1);}
 const weave=owned(new T.CanvasTexture(weaveCanvas));weave.colorSpace=T.SRGBColorSpace;weave.wrapS=weave.wrapT=T.RepeatWrapping;weave.repeat.set(6,7);fabric.map=weave;
 const clothPositions=[],clothUV=[],clothIndices=[];for(let j=0;j<=12;j++)for(let i=0;i<=16;i++){const x=i/16*3-1.5,z=j/12*3.5-1.75,y=1.7*(1-Math.abs(x)/1.5)-.07*Math.sin(j/12*Math.PI)*Math.sin(i/16*Math.PI);clothPositions.push(x,y,z);clothUV.push(i/16,j/12);}
 for(let j=0;j<12;j++)for(let i=0;i<16;i++){const a=j*17+i,b=a+17;clothIndices.push(a,b,a+1,b,b+1,a+1);}
 const clothG=new T.BufferGeometry();clothG.setAttribute('position',new T.Float32BufferAttribute(clothPositions,3));clothG.setAttribute('uv',new T.Float32BufferAttribute(clothUV,2));clothG.setIndex(clothIndices);clothG.computeVertexNormals();const cloth=mesh(clothG,fabric,camp);cloth.castShadow=true;
 const tube=(pts,r,mat,parent=scene,segments=40)=>mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts),segments,r,6,false),mat,parent);
 // Folded door leaves retain an uninterrupted opening from floor to apex.
 for(const z of [-1.755,1.755]){
  const vertices=[];for(const side of [-1,1]){const outer=[side*1.5,0,z],peak=[0,1.7,z],innerPeak=[0,1.4,z],inner=[side*.84,0,z];vertices.push(...outer,...peak,...innerPeak,...outer,...innerPeak,...inner);}
  const doorG=new T.BufferGeometry();doorG.setAttribute('position',new T.Float32BufferAttribute(vertices,3));doorG.computeVertexNormals();const leaves=mesh(doorG,owned(standard(0x976c38,{side:T.DoubleSide,roughness:1,emissive:0x482b12,emissiveIntensity:.18})),camp);leaves.castShadow=true;
  tube([V(-1.5,0,z),V(0,1.72,z),V(1.5,0,z)],.018,metal,camp,16);
  tube([V(-.84,.015,z),V(0,1.4,z),V(.84,.015,z)],.009,cord,camp,16);
 }
 for(const side of [-1,1])tube([V(side*1.4,.3,1.4),V(side*2.2,0,2.3)],.012,cord,camp,2);
 const floor=mesh(new T.PlaneGeometry(3.1,3.6),owned(standard(0x514735,{side:T.DoubleSide,roughness:1})),camp);floor.rotation.x=-Math.PI/2;floor.position.y=.025;
 // Interior seams, a ridge cord and a small warm lantern establish near depth.
 for(const z of [-.85,.85])tube([V(-1.47,.035,z),V(0,1.68,z),V(1.47,.035,z)],.006,cord,camp,16);
 tube([V(0,1.64,1.72),V(0,1.63,0),V(0,1.64,-1.72)],.009,cord,camp,12);
 const lamp=new T.Group();lamp.position.set(.58,.86,-.65);camp.add(lamp);
 const glow=mesh(new T.CylinderGeometry(.04,.05,.11,8),owned(new T.MeshBasicMaterial({color:0xffd18b})),lamp);
 for(const y of [-.065,.065]){const cap=mesh(new T.CylinderGeometry(.065,.065,.018,8),metal,lamp);cap.position.y=y;}
 tube([V(.58,.93,-.65),V(.4,1.24,-.65),V(0,1.64,-.65)],.005,cord,camp,8);
 const lantern=new T.PointLight(0xffbd69,1.15,4,2);lantern.position.copy(lamp.position);camp.add(lantern);
 camp.updateMatrixWorld(true);
 const tentPoint=(x,y,z)=>camp.localToWorld(V(x,y,z));

 // A physically placed rope coil and D-shaped carabiner on the foreground ledge.
 const kit=new T.Group();kit.position.set(3.3,groundHeight(3.3,9.5)+.08,9.5);kit.rotation.y=-.35;scene.add(kit);
 const ropeMat=owned(standard(0xae8b55)),ropePoints=[];for(let i=0;i<230;i++){const t=i/229,a=t*7*Math.PI,r=.28+.28*t;ropePoints.push(V(Math.cos(a)*r,.045+Math.sin(a*2)*.008,Math.sin(a)*r*.63));}
 tube(ropePoints,.028,ropeMat,kit,230);tube([V(.2,.04,.3),V(.8,.04,.5),V(.95,.04,1.2),V(.8,.0,2.0)],.028,ropeMat,kit,50);
 const carabiner=new T.Group();kit.add(carabiner);carabiner.position.set(.65,.055,.15);carabiner.rotation.x=-Math.PI/2;carabiner.rotation.z=-.4;
 const outline=[V(-.15,-.23,0),V(-.21,-.15,0),V(-.17,.18,0),V(-.1,.28,0),V(.1,.23,0),V(.16,.12,0),V(.12,-.17,0),V(.02,-.25,0),V(-.15,-.23,0)];tube(outline,.025,metal,carabiner,64);tube([V(.13,-.12,.005),V(.15,.14,.005)],.02,cord,carabiner,2);

 // The worn trail is part of the terrain's colour, not a floating tube or GPS line.

 const update=time=>{if(fernShader)fernShader.uniforms.acTime.value=time;mistUniforms.forEach(u=>u.time.value=time);};
 return {update,tentPoint,tentLocal:point=>camp.worldToLocal(point.clone()),camp:camp.position.clone(),stats:{tentPortals:2,tentDimensions:[3,1.7,3.5],scanInstances:boulders.length,fernInstances:roots.length,fictionalTerrain:true},sky};
}
