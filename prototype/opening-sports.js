import { createCricketBat } from './cricket-bat.js?v=bat-mm-1';
// Original procedural geometry and illustrations. No downloaded models or textures.
export const openingSports = [
  { id: 'tennis', name: 'Lawn tennis', description: 'A green lawn-tennis racket and seamed tennis ball.' },
  { id: 'badminton', name: 'Badminton', description: 'A slender green badminton racket and feathered shuttlecock.' },
  { id: 'cricket', name: 'Cricket', description: 'A willow-colored cricket bat and stitched red cricket ball.' },
  { id: 'football', name: 'Football', description: 'A classic football with ivory hexagons and dark pentagons.' },
  { id: 'basketball', name: 'Basketball', description: 'A terracotta basketball with dark seams.' },
  { id: 'table-tennis', name: 'Table tennis', description: 'A green rubber table-tennis paddle with a wooden handle and ivory ball.' },
  { id: 'volleyball', name: 'Volleyball', description: 'A volleyball with curved ivory, sage and green panels.' },
];
const storageKey = 'iitb-sports-opening-cycle-v2';
export function selectOpeningSport(storage, random = Math.random) {
  let next;
  try { const saved = storage?.getItem(storageKey); if (saved !== null && saved !== undefined) next = Number(saved); } catch {}
  if (!Number.isInteger(next) || next < 0 || next >= openingSports.length) next = Math.floor(random() * openingSports.length);
  const sport = openingSports[next];
  try { storage?.setItem(storageKey, String((next + 1) % openingSports.length)); } catch {}
  return sport;
}

export function sportFallback(id) {
  const defs = `<defs><pattern id="sport-strings" width="15" height="15" patternUnits="userSpaceOnUse"><path d="M15 0H0V15" fill="none" stroke="#a6a78c" stroke-width="1"/></pattern><radialGradient id="sport-ball" cx="30%" cy="25%"><stop stop-color="${id === 'basketball' ? '#d79a65' : id === 'cricket' ? '#a14940' : '#f1eedb'}"/><stop offset="1" stop-color="${id === 'basketball' ? '#9f552f' : id === 'cricket' ? '#5e2324' : '#b3bb87'}"/></radialGradient><clipPath id="sport-round"><circle cx="305" cy="300" r="150"/></clipPath></defs>`;
  const shadow = '<ellipse cx="300" cy="572" rx="165" ry="24" fill="#173f34" opacity=".08"/>';
  let shape;
  if (id === 'tennis' || id === 'badminton') {
    const badminton = id === 'badminton';
    shape = `<g transform="rotate(25 300 320)"><path d="${badminton ? 'M300 365V510' : 'M269 365L290 478H310L331 365'}" fill="none" stroke="#1a4c3d" stroke-width="${badminton ? 9 : 12}"/><rect x="287" y="470" width="26" height="124" rx="9" fill="#173f34"/><ellipse cx="300" cy="235" rx="${badminton ? 93 : 116}" ry="${badminton ? 125 : 155}" fill="url(#sport-strings)" stroke="#173f34" stroke-width="${badminton ? 10 : 18}"/></g>`;
    shape += badminton ? '<g transform="translate(450 407) rotate(-25)"><path d="M-12 0L-43-93Q0-115 43-93L12 0Z" fill="#eeeddb" stroke="#b7b79a"/>'+Array.from({length:9},(_,i)=>`<path d="M${(i-4)*3} 0L${(i-4)*10} -94" stroke="#b7b79a" fill="none"/>`).join('')+'<ellipse rx="17" ry="24" fill="#d7c3a0"/><path d="M-15-7H15" stroke="#173f34" stroke-width="7"/></g>' : '<circle cx="450" cy="395" r="48" fill="#b7c66c"/><path d="M420 357Q475 380 430 434" fill="none" stroke="#eeeddb" stroke-width="3"/>';
  } else if (id === 'cricket') {
    shape = '<g transform="rotate(24 300 320)"><path d="M273 230Q300 207 327 230L354 526Q354 548 300 548Q246 548 246 526Z" fill="#d6b783" stroke="#b39767" stroke-width="3"/><rect x="286" y="85" width="28" height="158" rx="10" fill="#234e3b"/><path d="M260 340L300 370L340 340V295L300 325L260 295Z" fill="#234e3b"/>'+Array.from({length:5},(_,i)=>`<path d="M${270+i*15} 390L${265+i*17} 526" stroke="#b39767" opacity=".5"/>`).join('')+'</g><circle cx="444" cy="433" r="44" fill="url(#sport-ball)"/><path d="M423 396Q463 438 425 470M430 394Q470 438 432 473" fill="none" stroke="#e5c7a0" stroke-width="2" stroke-dasharray="4 4"/>';
  } else if (id === 'table-tennis') {
    shape = '<g transform="rotate(26 300 320)"><rect x="277" y="340" width="46" height="210" rx="13" fill="#c8a674" stroke="#9e845c" stroke-width="4"/><ellipse cx="300" cy="240" rx="112" ry="142" fill="#d9bd8d"/><ellipse cx="300" cy="235" rx="105" ry="135" fill="#214d3d"/><path d="M287 410V525M310 410V525" stroke="#876e4b" stroke-width="3"/></g><circle cx="440" cy="422" r="29" fill="url(#sport-ball)"/>';
  } else {
    shape = '<circle cx="305" cy="300" r="150" fill="url(#sport-ball)"/>';
    if (id === 'football') shape += '<g clip-path="url(#sport-round)" fill="#203b30" stroke="#e7e4cf" stroke-width="3"><path d="M282 239L336 252L346 304L300 335L258 299Z"/><path d="M184 195L229 188L247 220L222 261L183 248Z"/><path d="M385 179L431 207L414 249L370 239L358 204Z"/><path d="M406 331L450 347L435 401L386 406L373 365Z"/><path d="M258 405L291 434L266 468L214 447L213 410Z"/><path d="M149 315L190 308L211 343L184 381L145 358Z"/></g>';
    if (id === 'basketball') shape += '<g clip-path="url(#sport-round)" fill="none" stroke="#423e2c" stroke-width="5"><path d="M155 300H455M305 150V450M225 160Q385 300 225 440M385 160Q225 300 385 440"/></g>';
    if (id === 'volleyball') shape += '<g clip-path="url(#sport-round)" fill="none" stroke-width="40"><path d="M163 212Q270 400 453 330" stroke="#244e3c"/><path d="M190 177Q310 369 453 290" stroke="#c3cda5"/><path d="M282 150Q470 260 340 444" stroke="#aab88b"/><path d="M240 162Q410 290 300 449" stroke="#eeeddb"/></g>';
  }
  return defs + shadow + shape;
}

export function createSportObjects(THREE, id) {
  const main = new THREE.Group(), satellite = new THREE.Group();
  const v = (x, y, z = 0) => new THREE.Vector3(x, y, z);
  const mat = (color, roughness = .7, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
  const green = mat(0x174c3c, .3, .25), brass = mat(0xb7a67d, .36, .4), ivory = mat(0xe9e6cc), wood = mat(0xc7a774, .8), dark = mat(0x26382d);
  const add = (geometry, material, parent = main, x = 0, y = 0, z = 0) => {
    const mesh = new THREE.Mesh(geometry, material); mesh.position.set(x, y, z); parent.add(mesh); return mesh;
  };
  function tube(points, radius, material, parent = main, closed = false) {
    return add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points, closed), Math.max(8, points.length * 3), radius, 6, closed), material, parent);
  }
  const ring = (radius, y = 0, count = 96) => Array.from({length:count}, (_, i) => v(Math.cos(i/count*Math.PI*2)*radius,y,Math.sin(i/count*Math.PI*2)*radius));
  const sphere = (r, material, parent = satellite) => add(new THREE.SphereGeometry(r, 48, 32), material, parent);
  const noise = new Uint8Array(128*128); let seed = 113;
  for(let i=0;i<noise.length;i++){seed=seed*16807%2147483647;noise[i]=seed%256;}
  const bump = new THREE.DataTexture(noise,128,128,THREE.RedFormat); bump.wrapS=bump.wrapT=THREE.RepeatWrapping;bump.repeat.set(5,5);bump.needsUpdate=true;
  function ballMaterial(color, scale=.008) { const material=mat(color,.95);material.bumpMap=bump;material.bumpScale=scale;return material; }
  function wrappedGrip(y, length, radius = .1) {
    add(new THREE.CylinderGeometry(radius, radius*1.08, length, 12),mat(0x183d30,.95),main,0,y);
    tube(Array.from({length:200},(_,i)=>{const t=i/199, a=t*Math.PI*26;return v(Math.cos(a)*radius*1.04,y-length/2+t*length,Math.sin(a)*radius*1.04);}),.007,mat(0x698267));
  }
  function racket(badminton) {
    const rx=badminton?.67:.83, ry=badminton?.87:1.12, center=badminton?1.04:.86;
    const ellipse=(x,y,z=0)=>Array.from({length:96},(_,i)=>{const t=i/96*Math.PI*2;return v(Math.cos(t)*x,center+Math.sin(t)*y,z);});
    tube(ellipse(rx,ry),badminton?.039:.072,green,main,true);
    tube(ellipse(rx+.018,ry+.018,.029),.009,brass,main,true);
    const irx=rx-.046, iry=ry-.046;
    for(let x=-irx+.07;x<irx-.03;x+=.078){const y=iry*Math.sqrt(1-(x/irx)**2);tube([v(x,center-y,.008),v(x,center+y,.008)],.0045,ivory);}
    for(let y=-iry+.06;y<iry-.03;y+=.082){const x=irx*Math.sqrt(1-(y/iry)**2);tube([v(-x,center+y,.017),v(x,center+y,.017)],.0045,ivory);}
    if(badminton) tube([v(0,.17),v(0,-1.18)],.028,green);
    else {
      tube([v(-.39,-.12),v(-.28,-.53),v(-.09,-.95)],.048,green);
      tube([v(.39,-.12),v(.28,-.53),v(.09,-.95)],.048,green);
      tube([v(-.3,-.41),v(0,-.49),v(.3,-.41)],.034,green);
    }
    wrappedGrip(badminton?-1.59:-1.44,badminton?.84:1.13,badminton?.077:.099);
    add(new THREE.CylinderGeometry(.107,.116,.09,12),green,main,0,-2.02);
    if(!badminton){
      sphere(.35,ballMaterial(0xb5c56b,.012));
      const points=Array.from({length:160},(_,i)=>{const p=i/160*Math.PI*2,t=Math.PI/2+.62*Math.sin(p*2);return v(.352*Math.sin(t)*Math.cos(p),.352*Math.cos(t),.352*Math.sin(t)*Math.sin(p));});
      tube(points,.009,ivory,satellite,true);
    }else{
      // Sixteen overlapping feather vanes, a visible skeleton, cork and binding.
      add(new THREE.SphereGeometry(.13,32,20),mat(0xd5bea0,.95),satellite,0,-.18).scale.set(1,1.35,1);
      add(new THREE.CylinderGeometry(.133,.13,.075,32),green,satellite,0,-.11);
      const featherMaterial=mat(0xf0eedc,.85);featherMaterial.side=THREE.DoubleSide;
      for(let i=0;i<16;i++){
        const a=i/16*Math.PI*2;
        const point=(r,y,angle=a)=>v(Math.cos(angle)*r,y,Math.sin(angle)*r);
        const points=[point(.095,-.08),point(.39,.65,a-.15),point(.45,.88,a-.12),point(.48,.94,a),point(.45,.88,a+.12),point(.39,.65,a+.15)];
        const vertices=[];for(let j=1;j<points.length-1;j++)vertices.push(...points[0].toArray(),...points[j].toArray(),...points[j+1].toArray());
        const geom=new THREE.BufferGeometry();geom.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geom.computeVertexNormals();add(geom,featherMaterial,satellite);
        tube([point(.09,-.06),point(.25,.38),point(.465,.91)],.007,mat(0xbabc9d),satellite);
      }
      tube(ring(.23,.3,48),.008,ivory,satellite,true);tube(ring(.31,.5,48),.008,ivory,satellite,true);
    }
  }
  if(id==='tennis'||id==='badminton') racket(id==='badminton');
  if(id==='cricket') {
    main.add(createCricketBat(THREE));
    satellite.scale.setScalar(.55);
    sphere(.32,ballMaterial(0x812f2a,.004));
    const thread=mat(0xe4c8a3);
    for(const y of [-.024,.024])tube(ring(.321,y),.006,thread,satellite,true);
    for(let i=0;i<36;i++){const a=i/36*Math.PI*2;for(const sign of [-1,1])tube([v(Math.cos(a)*.318,sign*.036,Math.sin(a)*.318),v(Math.cos(a+.028)*.315,sign*.064,Math.sin(a+.028)*.315)],.0045,thread,satellite);}
  }
  if(id==='table-tennis') {
    const paddle=new THREE.Shape();paddle.absellipse(0,.65,.79,.96,0,Math.PI*2,false,0);
    add(new THREE.ExtrudeGeometry(paddle,{depth:.09,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.025,bevelThickness:.025,curveSegments:64}),wood,main,0,0,-.05);
    const front=add(new THREE.CircleGeometry(1,64),ballMaterial(0x1c503f,.003),main,0,.65,.077);front.scale.set(.77,.94,1);
    const back=add(new THREE.CircleGeometry(1,64),mat(0x9a493b),main,0,.65,-.077);back.rotation.y=Math.PI;back.scale.set(.77,.94,1);
    const handle=new THREE.Shape();handle.moveTo(-.11,-.13);handle.lineTo(-.16,-1.4);handle.quadraticCurveTo(0,-1.53,.16,-1.4);handle.lineTo(.11,-.13);handle.closePath();
    add(new THREE.ExtrudeGeometry(handle,{depth:.17,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.035,bevelThickness:.025}),wood,main,0,0,-.085);
    for(const x of [-.055,.055])tube([v(x,-.45,.12),v(x,-1.38,.12)],.012,mat(0x806b49));
    main.scale.setScalar(1.13);sphere(.21,mat(0xefecdc,.75));
  }
  const ballOnly=['football','basketball','volleyball'].includes(id);
  if(id==='basketball') {
    sphere(1.27,ballMaterial(0xb56b3d,.012),main);
    const seam=mat(0x3c3c2b,.9);
    for(let axis=0;axis<3;axis++){
      const points=Array.from({length:128},(_,i)=>{const t=i/128*Math.PI*2;return axis===0?v(0,Math.cos(t)*1.275,Math.sin(t)*1.275):axis===1?v(Math.cos(t)*1.275,0,Math.sin(t)*1.275):v(Math.cos(t)*1.275,Math.sin(t)*1.275,0);});tube(points,.014,seam,main,true);
    }
    tube(Array.from({length:160},(_,i)=>{const p=i/160*Math.PI*2,t=Math.PI/2+.64*Math.sin(p*2);return v(1.275*Math.sin(t)*Math.cos(p),1.275*Math.cos(t),1.275*Math.sin(t)*Math.sin(p));}),.014,seam,main,true);
  }
  // Project subdivided polygons onto a sphere: rounded panels with narrow seams.
  function panel(points, material, radius=1.29) {
    const center=points.reduce((a,p)=>a.add(p),v(0,0)).multiplyScalar(1/points.length);
    points=points.map(p=>p.clone().lerp(center,.025));
    const out=[];
    function triangle(a,b,c){for(const p of [a,b,c])out.push(...p.clone().normalize().multiplyScalar(radius).toArray());}
    const n=9;
    for(let edge=0;edge<points.length;edge++){
      const a=center,b=points[edge],c=points[(edge+1)%points.length];
      const at=(i,j)=>a.clone().multiplyScalar(1-(i+j)/n).addScaledVector(b,i/n).addScaledVector(c,j/n);
      for(let i=0;i<n;i++)for(let j=0;j<n-i;j++){triangle(at(i,j),at(i+1,j),at(i,j+1));if(i+j<n-1)triangle(at(i+1,j),at(i+1,j+1),at(i,j+1));}
    }
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(out,3));geometry.setAttribute('normal',new THREE.Float32BufferAttribute(out.map(value=>value/radius),3));material.side=THREE.DoubleSide;add(geometry,material);
  }
  if(id==='football') {
    sphere(1.281,mat(0x72796a),main);
    const ico=new THREE.IcosahedronGeometry(1,0),positions=ico.attributes.position,vertices=[],faces=[],keys=new Map();
    for(let i=0;i<positions.count;i+=3){const face=[];for(let j=0;j<3;j++){const p=v(positions.getX(i+j),positions.getY(i+j),positions.getZ(i+j)),key=p.toArray().map(x=>x.toFixed(5)).join(',');if(!keys.has(key)){keys.set(key,vertices.length);vertices.push(p);}face.push(keys.get(key));}faces.push(face);}
    const adjacent=vertices.map(()=>new Set());
    const edge=(a,b)=>vertices[a].clone().multiplyScalar(2).add(vertices[b]).multiplyScalar(1/3);
    for(const [a,b,c] of faces){adjacent[a].add(b).add(c);adjacent[b].add(a).add(c);adjacent[c].add(a).add(b);panel([edge(a,b),edge(b,a),edge(b,c),edge(c,b),edge(c,a),edge(a,c)],ivory);}
    vertices.forEach((normal,a)=>{const axis=v(0,1,0);if(Math.abs(normal.y)>.9)axis.set(1,0,0);const u=axis.cross(normal).normalize(),w=normal.clone().cross(u).normalize();const points=[...adjacent[a]].map(b=>edge(a,b));points.sort((p,q)=>Math.atan2(p.dot(w),p.dot(u))-Math.atan2(q.dot(w),q.dot(u)));panel(points,dark);});ico.dispose();
  }
  if(id==='volleyball') {
    sphere(1.278,mat(0x8b947f),main);
    const colors=[ivory,mat(0xc6cda7),mat(0x174c3c,.85)];
    const axes=[[v(1,0,0),v(0,0,1),v(0,1,0)],[v(-1,0,0),v(0,0,-1),v(0,1,0)],[v(0,1,0),v(1,0,0),v(0,0,1)],[v(0,-1,0),v(1,0,0),v(0,0,-1)],[v(0,0,1),v(1,0,0),v(0,1,0)],[v(0,0,-1),v(-1,0,0),v(0,1,0)]];
    axes.forEach(([normal,u,w],face)=>{for(let strip=0;strip<3;strip++){
      const points=[],uv=(i,j)=>{const x=-.992+i/32*1.984,y=-1+strip*2/3+.012+j/12*(2/3-.024),curve=.17*Math.sin((x+1)*Math.PI/2)*(1-y*y);return normal.clone().addScaledVector(u,x).addScaledVector(w,y+curve).normalize().multiplyScalar(1.29);};
      for(let i=0;i<32;i++)for(let j=0;j<12;j++)for(const [a,b] of [[i,j],[i+1,j],[i,j+1],[i+1,j],[i+1,j+1],[i,j+1]])points.push(...uv(a,b).toArray());
      const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(points,3));geometry.setAttribute('normal',new THREE.Float32BufferAttribute(points.map(x=>x/1.29),3));const material=colors[(strip+face)%3];material.side=THREE.DoubleSide;add(geometry,material);
    }});
  }
  return { main, satellite, ballOnly,
    update(progress, entrance, pointerX, pointerY) {
      if(ballOnly){
        main.rotation.set(.2+pointerY*.12+progress*.45,.35+pointerX*.2+progress*2.6,-.2+progress*.28);
        main.position.set(-.02-progress*.16,-.05+Math.sin(progress*Math.PI)*.35-(1-entrance)*.4,0);
      }else{
        main.rotation.set(.12+pointerY*.09+progress*.2,-.32+pointerX*.2+progress*.95,(id==='cricket'?.28:-.38)+progress*.55);
        main.position.set(-.12-progress*.22,-.08-(1-entrance)*.5,0);
        satellite.position.set(1.12-progress*2.35,-.52+Math.sin(progress*Math.PI)*(id==='badminton'?1.8:2.5)+(1-entrance)*.7,.65+Math.sin(progress*Math.PI)*.6);
        satellite.rotation.set( .4+progress*(id==='badminton'?1:4),.3+progress*(id==='badminton'?1.5:5),id==='badminton'?-.5:.25);
      }
    }
  };
}
