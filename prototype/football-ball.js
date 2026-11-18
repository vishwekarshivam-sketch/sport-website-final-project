/* Original, unbranded 32-panel football. Units are relative to ball radius. */
import * as T from './vendor/three.module.js';

export function createFootball(keep) {
  const root = new T.Group();
  const v = (x, y, z) => new T.Vector3(x, y, z);
  const phi = (1 + Math.sqrt(5)) / 2;
  const vertices = [[-1,phi,0],[1,phi,0],[-1,-phi,0],[1,-phi,0],[0,-1,phi],[0,1,phi],[0,-1,-phi],[0,1,-phi],[phi,0,-1],[phi,0,1],[-phi,0,-1],[-phi,0,1]].map(a => v(...a).normalize());
  const faces = [[0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],[1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],[3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],[4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]];
  const edge = (a,b) => vertices[a].clone().multiplyScalar(2/3).addScaledVector(vertices[b],1/3).normalize();
  const polygons = faces.map(([a,b,c]) => ({points:[edge(a,b),edge(b,a),edge(b,c),edge(c,b),edge(c,a),edge(a,c)],dark:false}));
  vertices.forEach((normal,a) => {
    const neighbors = new Set();
    faces.filter(f => f.includes(a)).forEach(f => f.forEach(i => { if (i !== a) neighbors.add(i); }));
    const points = [...neighbors].map(b => edge(a,b));
    const tangent = points[0].clone().addScaledVector(normal,-points[0].dot(normal)).normalize();
    const binormal = new T.Vector3().crossVectors(normal,tangent);
    points.sort((p,q) => Math.atan2(p.dot(binormal),p.dot(tangent))-Math.atan2(q.dot(binormal),q.dot(tangent)));
    polygons.push({points,dark:true});
  });

  // Embossed pebbles have a broad raised face, narrow recessed borders and
  // irregular spacing, rather than coloured white noise or photographic grain.
  let seed = 3629;
  const random = () => { seed=(Math.imul(seed,1664525)+1013904223)>>>0; return seed/4294967296; };
  const canvas = document.createElement('canvas'); canvas.width=canvas.height=1024;
  const ctx = canvas.getContext('2d'); ctx.fillStyle='#505050'; ctx.fillRect(0,0,1024,1024);
  for(let row=-1;row<149;row++) for(let col=-1;col<149;col++) {
    const x=col*7+(row%2)*3.5+(random()-.5)*2, y=row*7+(random()-.5)*2;
    const r=2.7+random()*.9, gradient=ctx.createRadialGradient(x-.6,y-.8,.3,x,y,r);
    const shade=Math.round(165+random()*45);
    gradient.addColorStop(0,`rgb(${shade} ${shade} ${shade})`);gradient.addColorStop(.65,'#adadad');gradient.addColorStop(1,'#5d5d5d');
    ctx.fillStyle=gradient;ctx.beginPath();ctx.ellipse(x,y,r,r*(.72+random()*.22),random(),0,7);ctx.fill();
  }
  const grain=keep(new T.CanvasTexture(canvas)); grain.wrapS=grain.wrapT=T.RepeatWrapping;grain.repeat.set(1.6,1.6);grain.anisotropy=4;
  const materials = [
    keep(new T.MeshStandardMaterial({color:0xe9e2d1,roughness:.73,bumpMap:grain,bumpScale:.008})),
    keep(new T.MeshStandardMaterial({color:0x103b2c,roughness:.68,bumpMap:grain,bumpScale:.007}))
  ];
  const buffers = [{position:[],normal:[],uv:[]},{position:[],normal:[],uv:[]}];
  for(const polygon of polygons) {
    const center = polygon.points.reduce((s,p)=>s.add(p),new T.Vector3()).normalize();
    const points = polygon.points.map(p=>p.clone().lerp(center,.018).normalize());
    const tangent=points[0].clone().addScaledVector(center,-points[0].dot(center)).normalize();
    const binormal=new T.Vector3().crossVectors(center,tangent);
    const buffer=buffers[polygon.dark?1:0];
    const point = (p,amount,radius) => center.clone().lerp(p,amount).normalize().multiplyScalar(radius);
    const emit = (a,b,c,bevel=0) => {
      if(new T.Vector3().crossVectors(b.clone().sub(a),c.clone().sub(a)).dot(a)<0) [b,c]=[c,b];
      for(const p of [a,b,c]) {
        const radial=p.clone().normalize();
        const outward=radial.clone().addScaledVector(center,-radial.dot(center)).normalize();
        const normal=radial.clone().addScaledVector(outward,bevel).normalize();
        buffer.position.push(p.x,p.y,p.z);buffer.normal.push(normal.x,normal.y,normal.z);
        buffer.uv.push(radial.dot(tangent)*1.7+.5,radial.dot(binormal)*1.7+.5);
      }
    };
    const subdivide=(a,b,c,n)=>{
      if(!n){emit(a,b,c);return;}
      const ab=a.clone().add(b).normalize().multiplyScalar(1.002),bc=b.clone().add(c).normalize().multiplyScalar(1.002),ca=c.clone().add(a).normalize().multiplyScalar(1.002);
      subdivide(a,ab,ca,n-1);subdivide(ab,b,bc,n-1);subdivide(ca,bc,c,n-1);subdivide(ab,bc,ca,n-1);
    };
    points.forEach((p,i)=>{
      const q=points[(i+1)%points.length];
      subdivide(center.clone().multiplyScalar(1.002),point(p,.92,1.002),point(q,.92,1.002),3);
      // Three true geometric rings roll each panel edge into the seam channel.
      const rings=[[.92,1.002,0],[.965,1.001,.12],[.99,.998,.32],[1,.989,.55]];
      for(let j=0;j<rings.length-1;j++) {
        const [u,r,b]=rings[j], [next,nr,nb]=rings[j+1];
        const ringPoint=(t,amount,radius)=>{
          const from=point(p,amount,1),to=point(q,amount,1),axis=new T.Vector3().crossVectors(from,to).normalize();
          return from.applyAxisAngle(axis,Math.acos(T.MathUtils.clamp(from.dot(to),-1,1))*t).multiplyScalar(radius);
        };
        for(let k=0;k<8;k++) {
          const f=k/8,g=(k+1)/8;
          const a=ringPoint(f,u,r),bb=ringPoint(g,u,r),c=ringPoint(g,next,nr),d=ringPoint(f,next,nr);
          emit(a,bb,c,(b+nb)/2);emit(a,c,d,(b+nb)/2);
        }
      }
    });
  }
  const mesh=(geometry,material)=>{keep(geometry);const m=new T.Mesh(geometry,material);root.add(m);return m;};
  mesh(new T.SphereGeometry(.986,64,32),keep(new T.MeshStandardMaterial({color:0x183529,roughness:.9})));
  buffers.forEach((buffer,i)=>{
    const geometry=new T.BufferGeometry();
    geometry.setAttribute('position',new T.Float32BufferAttribute(buffer.position,3));
    geometry.setAttribute('normal',new T.Float32BufferAttribute(buffer.normal,3));
    geometry.setAttribute('uv',new T.Float32BufferAttribute(buffer.uv,2));mesh(geometry,materials[i]);
  });
  // Small, inset inflation valve. No invented manufacturer artwork.
  const valve=new T.Group();valve.position.copy(vertices[5]).multiplyScalar(1.001);valve.quaternion.setFromUnitVectors(v(0,0,1),vertices[5]);
  const rubber=keep(new T.MeshStandardMaterial({color:0x172a23,roughness:.88}));
  const rim=new T.Mesh(keep(new T.TorusGeometry(.018,.004,6,24)),rubber);valve.add(rim);
  const hole=new T.Mesh(keep(new T.CircleGeometry(.014,24)),rubber);hole.position.z=-.001;valve.add(hole);root.add(valve);
  return root;
}
