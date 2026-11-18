/* Original procedural scene, authored for the approved sporting-world composition.
   World units are metres. +Z faces the pool/camera; the waterline is Y=0.
   No imagery is projected onto the architecture. */
import * as T from './vendor/three.module.js';
import titleOutlines from './assets/sporting-world/title-outlines.js';

export function createWorld(renderer, compact = false) {
  const scene = new T.Scene();
  const resources = new Set();
  const keep = value => { resources.add(value); return value; };
  let seed = 8931;
  const random = () => { seed = (Math.imul(1664525, seed) + 1013904223) >>> 0; return seed / 4294967296; };
  const v = (x,y,z) => new T.Vector3(x,y,z);
  const material = options => keep(new T.MeshStandardMaterial(options));
  function mesh(geometry, mat, x=0, y=0, z=0, parent=scene) {
    keep(geometry); const object = new T.Mesh(geometry,mat);
    object.position.set(x,y,z); object.castShadow = object.receiveShadow = true;
    parent.add(object); return object;
  }
  function box(w,h,d,mat,x,y,z,parent) { return mesh(new T.BoxGeometry(w,h,d),mat,x,y,z,parent); }
  function tube(points,r,mat,parent=scene,closed=false) {
    return mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points,closed),Math.max(24,points.length*2),r,6,closed),mat,0,0,0,parent);
  }
  function texture(size, painter, repeat=1) {
    const c=document.createElement('canvas');c.width=c.height=size;
    painter(c.getContext('2d'),size);
    const map=keep(new T.CanvasTexture(c)); map.wrapS=map.wrapT=T.RepeatWrapping;
    map.repeat.set(repeat,repeat); map.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
    return map;
  }
  const grain=texture(512,(ctx,s)=>{
    const data=ctx.createImageData(s,s);
    for(let i=0;i<data.data.length;i+=4){const c=135+random()*95;data.data[i]=data.data[i+1]=data.data[i+2]=c;data.data[i+3]=255;}
    ctx.putImageData(data,0,0);
    for(let i=0;i<3600;i++){const x=random()*s,y=random()*s;ctx.strokeStyle=`rgba(45,36,23,${.03+random()*.12})`;ctx.lineWidth=.4+random();ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+2,y-3,x+3+random()*4,y-2);ctx.stroke();}
  },3);
  const plaster=material({color:0xe9deca,roughness:.89,bumpMap:grain,bumpScale:.046});
  const plasterLight=material({color:0xf2e5ce,roughness:.86,bumpMap:grain,bumpScale:.035});
  const green=material({color:0x16483c,roughness:.83,bumpMap:grain,bumpScale:.025});
  const stone=material({color:0xb8afa1,roughness:.47,metalness:.24,bumpMap:grain,bumpScale:.018});
  const dark=material({color:0x143b31,roughness:.9});
  const chalk=material({color:0xf7e7ca,roughness:.85});
  const terracotta=material({color:0x9e3b22,roughness:.86,bumpMap:grain,bumpScale:.028,side:T.DoubleSide});
  const poolMat=material({color:0x639189,roughness:.71,bumpMap:grain,bumpScale:.02});
  const mineral=texture(512,(ctx,s)=>{
    ctx.fillStyle='#f5f0e6';ctx.fillRect(0,0,s,s);
    for(let i=0;i<900;i++){
      const x=random()*s,y=random()*s,r=3+random()*35,g=ctx.createRadialGradient(x,y,0,x,y,r);
      g.addColorStop(0,`rgba(122,102,80,${.004+random()*.009})`);g.addColorStop(1,'rgba(122,102,80,0)');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,2*r,2*r);
    }
    for(let i=0;i<15000;i++){const c=100+random()*100;ctx.fillStyle=`rgba(${c},${c-10},${c-20},.09)`;ctx.fillRect(random()*s,random()*s,.5+random()*1.2,.5+random()*1.8);}
  },2);
  mineral.colorSpace=T.SRGBColorSpace;
  for(const m of [plaster,plasterLight,stone]){m.map=mineral;m.bumpScale=.055;}


  // A procedural atmospheric sky also supplies the physically based materials' environment.
  const skyMaterial=keep(new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{sun:{value:v(-.8,.24,-.6).normalize()}},vertexShader:`varying vec3 direction;
    void main(){direction=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`varying vec3 direction;uniform vec3 sun;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
    void main(){vec3 d=normalize(direction);float h=max(d.y,0.);vec3 col=mix(vec3(1.,.72,.42),vec3(.13,.37,.70),smoothstep(-.02,.4,h));
      float glow=pow(max(dot(d,sun),0.),8.);col+=vec3(.6,.25,.07)*glow;
      float n=noise(d.xz/max(d.y+.14,.05)*5.)*.5+noise(d.xz/max(d.y+.14,.05)*13.)*.25;
      float cloud=smoothstep(.46,.66,n)*smoothstep(.02,.12,d.y)*(1.-smoothstep(.35,.7,d.y));col=mix(col,vec3(1.,.87,.64),cloud*.75);
      col+=vec3(3.,1.9,.8)*pow(max(dot(d,sun),0.),900.);gl_FragColor=vec4(col,1.);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }` }));
  const sky=mesh(new T.SphereGeometry(180,40,20),skyMaterial);sky.castShadow=sky.receiveShadow=false;sky.name='Atmosphere';
  const environmentScene=new T.Scene();environmentScene.add(new T.Mesh(sky.geometry,skyMaterial));
  const pmrem=new T.PMREMGenerator(renderer);
  const env=pmrem.fromScene(environmentScene,.025,.1,400);keep(env);pmrem.dispose();
  scene.environment=env.texture;scene.environmentIntensity=.3;
  scene.add(new T.HemisphereLight(0xb4d0f4,0x75512b,.65));
  const sun=new T.DirectionalLight(0xffc586,3.1);sun.position.set(-16,18,5);sun.target.position.set(0,3,-3);
  sun.castShadow=true;sun.shadow.mapSize.setScalar(compact?1536:2048);
  Object.assign(sun.shadow.camera,{left:-23,right:23,top:22,bottom:-14,near:1,far:65});
  sun.shadow.normalBias=.025;sun.shadow.bias=-.00015;sun.shadow.radius=5;sun.shadow.blurSamples=8;
  scene.add(sun,sun.target);
  const bounce=new T.DirectionalLight(0xc5deef,.28);bounce.position.set(8,8,-5);scene.add(bounce);

  // Pool basin: geometry remains below the surface throughout the camera descent.
  box(80,.3,65,poolMat,0,-4.4,16);
  box(.4,5,65,poolMat,-27,-2,16);box(.4,5,65,poolMat,27,-2,16);
  box(52,4.5,.35,poolMat,0,-2.05,-2.1);
  const poolLines=material({color:0x386b65,roughness:.8});
  for(let x=-22;x<=22;x+=4)box(.09,.015,38,poolLines,x,-4.235,15);

  // True arched openings. Side faces reveal the green thickness of the wall.
  function arch(width,height,radius,spring,depth,x,y,z,inside=green) {
    const shape=new T.Shape();shape.moveTo(-width/2,0);shape.lineTo(-width/2,height);shape.lineTo(width/2,height);shape.lineTo(width/2,0);
    shape.lineTo(radius,0);shape.lineTo(radius,spring);shape.absarc(0,spring,radius,0,Math.PI,false);shape.lineTo(-radius,0);shape.closePath();
    return mesh(new T.ExtrudeGeometry(shape,{depth,bevelEnabled:false,curveSegments:56}),[plaster,inside],x,y,z);
  }
  arch(11.4,50,3.55,11.0,1.15,-10,-.2,-6.3,plasterLight).name='Left athletics arch';
  // The farther left colonnade remains visible at wide aspect ratios.
  arch(8.4,50,3.1,10.1,1.05,-21.5,-.2,-5.2,plasterLight);
  box(11.7,52,2.5,plaster,.85,25.6,-7.8).name='Quiet central wall';
  box(.8,52,2.7,green,7.1,25.6,-7.8);
  arch(7.8,50,1.85,13.1,1.25,11.2,1.5,-12.5).name='Upper garden arch';
  box(5.4,52,3.3,plaster,17.6,25.6,-10.8);
  box(1.2,52,3.5,green,20.7,25.6,-10.8);
  box(20,52,4,plaster,31.4,25.6,-11.0);

  // Broad stair, each tread grounded and lit; all risers enter the same landing.
  const steps=10, rise=.35, run=.62;
  for(let i=0;i<steps;i++) {
    const top=.16+(i+1)*rise, front=2.6-i*run, back=-5.1;
    box(9.9,top+.35,front-back,plasterLight,.2,(top-.35)/2,(front+back)/2);
  }
  box(11.8,3.96,4.1,plaster,.8,1.63,-6.55);
  box(10.7,1.25,5.1,plasterLight,9.6,.275,.7).name='Lower equipment terrace';
  box(8.7,3.96,5.8,plaster,10.3,1.63,-4.7);
  box(6.7,5.55,5.5,plasterLight,13.05,2.425,-9.0).name='Shuttle terrace';
  box(2.5,4.9,5.7,green,7.7,1.9,-9.0);

  // The right terraces stay plain; the athletics track belongs outside the arch.

  // Soft local occlusion supplements real directional contact shadows.
  const ao=texture(128,(ctx,s)=>{const g=ctx.createRadialGradient(s/2,s/2,0,s/2,s/2,s/2);g.addColorStop(0,'rgba(29,28,14,.6)');g.addColorStop(.35,'rgba(29,28,14,.24)');g.addColorStop(1,'rgba(29,28,14,0)');ctx.fillStyle=g;ctx.fillRect(0,0,s,s);});
  const aoMat=keep(new T.MeshBasicMaterial({map:ao,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1}));
  function contact(x,y,z,w,d) {const m=mesh(new T.PlaneGeometry(w,d),aoMat,x,y+.008,z);m.rotation.x=-Math.PI/2;m.castShadow=m.receiveShadow=false;}
  const sphere=mesh(new T.SphereGeometry(1.5,64,40),stone,4.8,5.12,-4.95);sphere.name='Grounded oversized shot put';contact(4.8,3.66,-4.95,3.8,3.8);

  // Basketball: pebbled leather and four continuous inset-looking dark seams.
  const rubber=texture(256,(ctx,s)=>{ctx.fillStyle='#8d8d8d';ctx.fillRect(0,0,s,s);for(let y=0;y<s;y+=5)for(let x=0;x<s;x+=5){ctx.fillStyle=`rgb(${160+random()*80},${160+random()*80},${160+random()*80})`;ctx.beginPath();ctx.arc(x+(y%10?2:0),y,1.6,0,Math.PI*2);ctx.fill();}},4);
  const leather=material({color:0xab4b22,roughness:.77,bumpMap:rubber,bumpScale:.026});
  const seam=material({color:0x2e2518,roughness:.88});
  const basketball=new T.Group();basketball.name='Basketball';scene.add(basketball);basketball.position.set(12.45,1.76,1.1);basketball.rotation.set(.13,.3,-.22);
  const br=.86;mesh(new T.SphereGeometry(br,64,40),leather,0,0,0,basketball);
  const radial=(axis,curve=false)=>Array.from({length:150},(_,i)=>{const a=i/150*Math.PI*2;if(curve){const b=Math.PI/2+.75*Math.sin(a*2);return v(br*Math.sin(b)*Math.cos(a),br*Math.cos(b),br*Math.sin(b)*Math.sin(a));}return axis===0?v(0,Math.cos(a)*br,Math.sin(a)*br):axis===1?v(Math.cos(a)*br,0,Math.sin(a)*br):v(Math.cos(a)*br,Math.sin(a)*br,0);});
  for(let i=0;i<3;i++)tube(radial(i),.016,seam,basketball,true);tube(radial(0,true),.016,seam,basketball,true);contact(12.45,.9,1.1,2.1,2.1);

  const felt=material({color:0xb8c637,roughness:1,bumpMap:grain,bumpScale:.018});
  for(const [x,z,r,tilt] of [[13.2,-4.6,.36,.3],[13.94,-4.9,.4,-.5]]) {
    const ball=new T.Group();ball.name='Seamed tennis ball';scene.add(ball);ball.position.set(x,3.61+r,z);ball.rotation.z=tilt;
    mesh(new T.SphereGeometry(r,40,28),felt,0,0,0,ball);
    const points=Array.from({length:140},(_,i)=>{const a=i/140*Math.PI*2,b=Math.PI/2+.7*Math.sin(a*2);return v((r+.002)*Math.sin(b)*Math.cos(a),(r+.002)*Math.cos(b),(r+.002)*Math.sin(b)*Math.sin(a));});
    tube(points,.012,chalk,ball,true);contact(x,3.61,z,r*3,r*3);
  }

  // The cork tip is the local origin: the rotated feather body cannot float above its plinth.
  const shuttle=new T.Group();shuttle.name='Cork-grounded shuttlecock';scene.add(shuttle);shuttle.position.set(13.7,5.2,-7.6);shuttle.rotation.set(.1,0,-.56);shuttle.scale.setScalar(1.3);
  const cork=material({color:0xddc8a8,roughness:.95,bumpMap:grain,bumpScale:.018});
  mesh(new T.SphereGeometry(.205,32,24),cork,0,.205,0,shuttle);
  mesh(new T.CylinderGeometry(.195,.203,.16,32),chalk,0,.32,0,shuttle);
  mesh(new T.CylinderGeometry(.2,.2,.095,32),dark,0,.41,0,shuttle);
  const feather=material({color:0xfff7e2,roughness:.78,side:T.DoubleSide});
  const quill=material({color:0xd6cdb2,roughness:.86});
  for(let i=0;i<16;i++) {
    const a=i/16*Math.PI*2;const p=(radius,y,da=0)=>v(Math.cos(a+da)*radius,y,Math.sin(a+da)*radius);
    const points=[p(.16,.43),p(.45,1.25,-.12),p(.65,1.76,-.115),p(.7,1.89,-.025),p(.69,1.88,.045),p(.6,1.68,.15),p(.43,1.22,.15)];
    const pos=[];for(let k=1;k<points.length-1;k++)pos.push(...points[0].toArray(),...points[k].toArray(),...points[k+1].toArray());
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.computeVertexNormals();mesh(g,feather,0,0,0,shuttle);
    tube([p(.16,.43),p(.4,1.12),p(.68,1.85)],.009,quill,shuttle);
    for(let k=0;k<7;k++){const y=1.1+k*.09,r=.37+k*.039;tube([p(r,y),p(r+.07,y+.05,.11)],.0035,quill,shuttle);}
  }
  for(const [r,y] of [[.26,.72],[.35,.98]])tube(Array.from({length:48},(_,i)=>v(r*Math.cos(i/48*Math.PI*2),y,r*Math.sin(i/48*Math.PI*2))),.013,chalk,shuttle,true);
  // The spherical cork stays tangent even when tilted: rotate around its centre, then translate.
  shuttle.position.y=5.2+.205*1.3*(1-Math.cos(.56)*Math.cos(.1));contact(13.7+.205*1.3*Math.sin(.56),5.2,-7.6,1.05,.65);

  // Alternating ivory/green ring panels are real torus segments, partly below Y=0.
  const ring=new T.Group();ring.name='Partially immersed swimming ring';scene.add(ring);ring.position.set(-4.4,.07,9.3);ring.rotation.y=.12;
  const vinyl=[material({color:0xe8e2ca,roughness:.24,metalness:.04}),material({color:0x0d493a,roughness:.22,metalness:.08})];
  for(let i=0;i<10;i++){
    const panel=mesh(new T.TorusGeometry(1.44,.4,24,24,Math.PI*.2),vinyl[i%2],0,0,0,ring);panel.rotation.set(Math.PI/2,0,i*Math.PI*.2);panel.scale.z=.78;
  }
  // A fine weld at the outer diameter catches the low sun.
  const weld=mesh(new T.TorusGeometry(1.837,.014,6,120),vinyl[0],0,0,0,ring);weld.rotation.x=Math.PI/2;

  // Athletics ground beyond the left opening, with an actual oval track and field.
  const grass=material({color:0x778441,roughness:1,bumpMap:grain,bumpScale:.04});
  const ground=new T.Group();scene.add(ground);ground.position.set(-17,.12,-28);
  const field=mesh(new T.CircleGeometry(1,96),grass,0,0,0,ground);field.rotation.x=-Math.PI/2;field.scale.set(20,13,1);
  const track=mesh(new T.RingGeometry(1,1.22,128),terracotta,0,-.018,0,ground);track.rotation.x=-Math.PI/2;track.scale.set(20,13,1);
  for(let lane=0;lane<=6;lane++){
    const r=1+lane*.0367;const pts=Array.from({length:160},(_,i)=>{const a=i/160*Math.PI*2;return v(Math.cos(a)*20*r,0,Math.sin(a)*13*r);});tube(pts,.025,chalk,ground,true);
  }
  box(65,.3,55,grass,-18,-.4,-34);
  const lineMat=material({color:0xe1dfbd,roughness:1});
  for(const x of [-27,-7])box(.05,.02,17,lineMat,x,.01,-30);
  for(const z of [-38.5,-21.5])box(20,.02,.05,lineMat,-17,.01,z);
  const standMat=material({color:0xaaa68f,roughness:1});
  for(let i=0;i<9;i++){
    box(29,.23+i*.27,.9,standMat,-20,i*.135,-32-i*.78);
    // Individual understated seat divisions give the distant grandstand its scale.
    for(let j=0;j<33;j++)box(.68,.10,.43,chalk,-34+j*.87,.25+i*.27,-32-i*.78);
  }
  box(53,.08,4.4,terracotta,-23,.12,-9.2);
  for(let i=0;i<=6;i++)box(53,.012,.035,chalk,-23,.167,-11.3+i*.7);
  // A low kerb separates the pool court from the outdoor athletics surface.
  box(25,.12,.26,plasterLight,-17,.12,-6.4);
  const floodMat=material({color:0x6b746a,roughness:.45,metalness:.55});
  const lampMat=material({color:0xffecd1,emissive:0xffd099,emissiveIntensity:.5,roughness:.3});
  for(const [x,z,h] of [[-16,-31,12],[-29,-39,14],[-4,-40,13],[-34,-17,10]]) {
    mesh(new T.CylinderGeometry(.09,.16,h,12),floodMat,x,h/2,z);
    box(2.7,.11,.3,floodMat,x,h-.8,z);
    for(let a=0;a<4;a++)for(let b=0;b<3;b++){
      const lamp=mesh(new T.CylinderGeometry(.24,.3,.2,12),lampMat,x+(a-1.5)*.58,h+(b-1)*.5,z);lamp.rotation.x=Math.PI/2;
    }
  }

  // Layered mountain silhouettes, deliberately distant and hazed.
  for(let layer=0;layer<3;layer++) {
    const shape=new T.Shape();shape.moveTo(-95,0);
    for(let i=0;i<=70;i++){const x=-95+i*2.7,y=3+Math.sin(i*.15+layer)*2.2+Math.sin(i*.73)*1.3+random()*1.5;shape.lineTo(x,y);}
    shape.lineTo(94,-10);shape.closePath();
    const mountain=mesh(new T.ShapeGeometry(shape),material({color:[0xbcb8a4,0xaaa995,0x8e9b87][layer],roughness:1}),-5,1,-85+layer*8);mountain.castShadow=false;
  }

  // Instanced foliage: many leaf silhouettes, not green low-poly ball props.
  const leafShape=new T.Shape();leafShape.moveTo(0,0);leafShape.bezierCurveTo(-.06,.07,-.12,.16,-.1,.26);leafShape.bezierCurveTo(-.09,.35,-.035,.42,0,.48);leafShape.bezierCurveTo(.035,.42,.09,.35,.1,.26);leafShape.bezierCurveTo(.12,.16,.06,.07,0,0);
  const leafGeometry=keep(new T.ShapeGeometry(leafShape,4));
  const leafPositions=leafGeometry.attributes.position;for(let i=0;i<leafPositions.count;i++)leafPositions.setZ(i,Math.sin(leafPositions.getY(i)*6)*.035);leafGeometry.computeVertexNormals();
  const leafMat=material({color:0x586724,roughness:.9,side:T.DoubleSide});
  const leafCount=compact?5000:8100,leaves=new T.InstancedMesh(leafGeometry,leafMat,leafCount);leaves.castShadow=leaves.receiveShadow=true;scene.add(leaves);
  const dummy=new T.Object3D(),color=new T.Color();let leafIndex=0;
  const bark=material({color:0x5f5540,roughness:1,bumpMap:grain,bumpScale:.03});
  function foliage(cx,cy,cz,rx,ry,rz,count,scale=1) {
    for(let i=0;i<count&&leafIndex<leafCount;i++){
      const a=random()*Math.PI*2, b=Math.acos(random()*2-1),r=Math.cbrt(random());
      dummy.position.set(cx+Math.sin(b)*Math.cos(a)*rx*r,cy+Math.cos(b)*ry*r,cz+Math.sin(b)*Math.sin(a)*rz*r);
      dummy.rotation.set(random()*3,random()*6,random()*4);dummy.scale.setScalar(scale*(.6+random()*.8));dummy.updateMatrix();leaves.setMatrixAt(leafIndex,dummy.matrix);
      color.setHSL(.17+random()*.075,.3+random()*.3,.17+random()*.13);leaves.setColorAt(leafIndex,color);leafIndex++;
    }
  }
  for(let i=0;i<24;i++) {
    const x=-45+i*2.5,z=-44-random()*12,h=2.9+random()*2.2;
    mesh(new T.CylinderGeometry(.08,.2,h,7),bark,x,h/2,z);
    foliage(x,h,z,2,1.8,1.8,compact?95:150,1.05);
  }
  // Keep the garden behind the opening, with a rooted trunk clear of its jambs.
  // The former small trees intersected the solid walls and appeared unsupported.
  tube([v(11.2,0,-17),v(11.1,3.2,-17),v(11.5,6.2,-17)],.12,bark);
  tube([v(11.1,3.5,-17),v(10.1,5.1,-17.2),v(9.8,6,-17.3)],.065,bark);
  foliage(11.1,6.8,-17,2.5,1.8,1.3,compact?650:1000,.85);
  // Keep only the overhanging canopy; no disconnected tree against the terraces.
  for(const [x,y,z,scale] of [[13,18,-2,1.65],[-18,32,4,2]]) {
    tube([v(x-.5,y-1.3,z),v(x,y,z),v(x+1,y+.9,z)],.08*scale,bark);
    tube([v(x,y-.5,z),v(x-1.2,y+.3,z-.4),v(x-2,y+.7,z-.5)],.045*scale,bark);
    foliage(x,y+1,z,2.1*scale,1.3*scale,1.1*scale,compact?500:850,scale*.8);
  }
  leaves.count=leafIndex;

  const waterTime={value:0};
  poolMat.onBeforeCompile=shader=>{
    shader.uniforms.waterTime=waterTime;
    shader.vertexShader='varying vec3 poolPosition;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\npoolPosition=(modelMatrix*vec4(transformed,1.)).xyz;');
    shader.fragmentShader='varying vec3 poolPosition;uniform float waterTime;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
      vec2 c=poolPosition.xz+vec2(poolPosition.y*1.3,poolPosition.y*.7);
      float a=sin(c.x*2.4+sin(c.y*1.9+waterTime*.31)*1.4+waterTime*.24);
      float b=sin(c.y*2.7+sin(c.x*1.6-waterTime*.29)*1.2);
      float caustic=pow(1.-abs(a*b),15.);
      totalEmissiveRadiance+=vec3(.035,.075,.055)*caustic;
    `);
  };
  // Shallow freestanding Faktum lettering, physically resting on the landing.
  const titleGroup=new T.Group();scene.add(titleGroup);
  const letterFace=material({color:0x174b3c,roughness:.48,metalness:.16});
  const letterEdge=material({color:0x10372d,roughness:.55,metalness:.12});
  function titleLine(text,width,x,bottom){
    const shapes=[];let advance=0;
    for(const char of text){
      const glyph=titleOutlines[char],path=new T.ShapePath();
      for(const [op,...p] of glyph.commands){
        if(op==='M')path.moveTo(p[0]+advance,p[1]);
        else if(op==='L')path.lineTo(p[0]+advance,p[1]);
        else if(op==='C')path.bezierCurveTo(p[0]+advance,p[1],p[2]+advance,p[3],p[4]+advance,p[5]);
        else if(op==='Q')path.quadraticCurveTo(p[0]+advance,p[1],p[2]+advance,p[3]);
        else path.currentPath.closePath();
      }
      shapes.push(...path.toShapes(char!=='&'));advance+=glyph.advance-.025;
    }
    const g=new T.ExtrudeGeometry(shapes,{depth:.07,bevelEnabled:true,bevelThickness:.008,bevelSize:.006,bevelSegments:2,curveSegments:10,steps:1});
    g.computeBoundingBox();const bounds=g.boundingBox,scale=width/(bounds.max.x-bounds.min.x);
    g.translate(-bounds.min.x,-bounds.min.y,0);g.scale(scale,scale,1);
    const title=mesh(g,[letterFace,letterEdge],x,bottom,-5.25,titleGroup);title.name='Raised directory title: '+text;
    return title;
  }
  titleLine('Sports &',6.25,-3.35,5.65);
  titleLine('clubs.',5.3,-3.35,3.68);

  scene.updateMatrixWorld(true);
  const batches=new Map(),originals=[];
  scene.traverse(o=>{
    if(!o.isMesh||o.isInstancedMesh||o===sky)return;
    let parent=o,isTitle=false;while(parent){if(parent===ring)return;if(parent===titleGroup){isTitle=true;break;}parent=parent.parent;}
    const geometry=o.geometry.clone().applyMatrix4(o.matrixWorld);
    const flat=geometry.index?geometry.toNonIndexed():geometry;
    if(flat!==geometry)geometry.dispose();
    const mats=[].concat(o.material),groups=Array.isArray(o.material)?flat.groups:[{start:0,count:flat.attributes.position.count,materialIndex:0}];
    for(const group of groups){
      const mat=mats[group.materialIndex];
      if([plaster,plasterLight].includes(mat)){
        const pos=flat.attributes.position,norm=flat.attributes.normal,uv=flat.attributes.uv;
        for(let i=group.start;i<group.start+group.count;i++){
          const nx=Math.abs(norm.getX(i)),ny=Math.abs(norm.getY(i)),nz=Math.abs(norm.getZ(i));
          if(ny>=nx&&ny>=nz)uv.setXY(i,pos.getX(i)/5,pos.getZ(i)/5);
          else if(nx>=nz)uv.setXY(i,pos.getZ(i)/5,pos.getY(i)/5);
          else uv.setXY(i,pos.getX(i)/5,pos.getY(i)/5);
        }
      }
      const key=(isTitle?'title:':'scene:')+mat.uuid+':'+o.castShadow+':'+o.receiveShadow;
      if(!batches.has(key))batches.set(key,{parent:isTitle?titleGroup:scene,mat,cast:o.castShadow,receive:o.receiveShadow,position:[],normal:[],uv:[]});
      const b=batches.get(key);
      for(let i=group.start;i<group.start+group.count;i++){
        for(const [name,size] of [['position',3],['normal',3],['uv',2]]){
          const attr=flat.attributes[name];for(let k=0;k<size;k++)b[name].push(attr?attr.array[i*size+k]:0);
        }
      }
    }
    flat.dispose();originals.push(o);
  });
  for(const o of originals){o.removeFromParent();o.geometry.dispose();resources.delete(o.geometry);}
  for(const b of batches.values()){
    const g=keep(new T.BufferGeometry());
    for(const [name,size] of [['position',3],['normal',3],['uv',2]])g.setAttribute(name,new T.Float32BufferAttribute(b[name],size));
    const m=new T.Mesh(g,b.mat);m.castShadow=b.cast;m.receiveShadow=b.receive;b.parent.add(m);
  }

  return {scene,ring,sun,sky,titleGroup,resources,update(t){waterTime.value=t;},dispose(){
    scene.traverse(o=>{if(o.geometry)resources.add(o.geometry);if(o.material)for(const m of [].concat(o.material))resources.add(m);});
    for(const r of resources)r.dispose?.();sun.shadow.map?.dispose();
  }};
}
