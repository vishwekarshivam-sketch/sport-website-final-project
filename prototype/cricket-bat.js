// Dimensions in millimetres; scaled uniformly only when placed in the homepage.
export const cricketBatDimensions = Object.freeze({length:864,handle:280,blade:584,width:108,depth:65,edge:40,spine:15,shoulder:90,toeRadius:12,handleOval:[29,25],capOval:[32,28]});
export function createCricketBat(T) {
  const group=new T.Group();
  const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
  const material=(color,roughness=.8)=>new T.MeshStandardMaterial({color,roughness,side:T.DoubleSide});
  const wood=material(0xd9bd91),rubber=material(0x194637,.94),cane=material(0xc4a477);
  const textureCanvas=document.createElement('canvas');textureCanvas.width=256;textureCanvas.height=1024;
  const ctx=textureCanvas.getContext('2d');ctx.fillStyle='#ead4ad';ctx.fillRect(0,0,256,1024);
  for(let i=0;i<38;i++){const x=(i*47.3)%256;ctx.strokeStyle=i%3?'#bfa47732':'#a88c6433';ctx.lineWidth=.3+(i%3)*.2;ctx.beginPath();ctx.moveTo(x,0);ctx.bezierCurveTo(x+1,300,x-1,700,x+.5,1024);ctx.stroke();}
  const texture=new T.CanvasTexture(textureCanvas);texture.colorSpace=T.SRGBColorSpace;wood.map=texture;
  function loft(rows,segments,sample,mat,name){
    const positions=[],uv=[],indices=[];
    for(let j=0;j<=rows;j++)for(let i=0;i<=segments;i++){positions.push(...sample(j/rows,i/segments));uv.push(i/segments,j/rows);}
    for(let j=0;j<rows;j++)for(let i=0;i<segments;i++){const a=j*(segments+1)+i,b=a+segments+1;indices.push(a,b,a+1,a+1,b,b+1);}
    for(const row of [0,rows]){const start=positions.length/3;const points=Array.from({length:segments},(_,i)=>sample(row/rows,i/segments));positions.push(...[0,1,2].map(axis=>points.reduce((s,p)=>s+p[axis],0)/segments));uv.push(.5,row/rows);for(let i=0;i<segments;i++)indices.push(start,row*(segments+1)+i,row*(segments+1)+i+1);}
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();const mesh=new T.Mesh(g,mat);mesh.name=name;group.add(mesh);return mesh;
  }
  const halfWidth=y=>y<12?42+Math.sqrt(Math.max(0,144-(12-y)**2)):y>494?54-(54-12.5)*smooth((y-494)/90):54;
  loft(160,128,(t,p)=>{
    const y=t*584,w=halfWidth(y),r=Math.min(3,w/4);
    // Maximum profile: 40 mm edges, 50 mm surrounding body, 15 mm added spine.
    const fullness=.55+.45*Math.sin(Math.PI*Math.min(y,494)/494);
    const shoulder=1-.65*smooth((y-494)/90),depth=fullness*shoulder;
    let x,z;
    if(p<.4){const u=p/.4*2-1;x=u*(w-r);z=10+4*(1-u*u);}
    else if(p<.5){const a=(p-.4)/.1*Math.PI;x=w-r+r*Math.sin(a);z=-10+20*Math.cos(a);}
    else if(p<.9){const u=1-(p-.5)/.4*2;x=u*(w-r);z=-30-6*(1-u*u)-15*Math.pow(1-u*u,3);}
    else {const a=(p-.9)/.1*Math.PI;x=-w+r-r*Math.sin(a);z=-10-20*Math.cos(a);}
    return [x,y,z*depth];
  },wood,'English willow blade • 584 × 108 mm');
  // Oval cane handle continues down into a long V splice.
  loft(96,64,(t,p)=>{const y=584+t*280,a=p*Math.PI*2,cap=smooth((y-854)/10),taper=.9+.1*smooth(t/.25);return [Math.cos(a)*(14.5*taper+1.5*cap),y,Math.sin(a)*(12.5*taper+1.5*cap)-2];},rubber,'Oval rubber grip • 280 mm');
  // Recessed V-shaped cane insert follows the convex face into the shoulders.
  const splice=new T.Shape();splice.moveTo(-12.5,584);splice.lineTo(12.5,584);splice.quadraticCurveTo(8,530,0,473);splice.quadraticCurveTo(-8,530,-12.5,584);
  const insert=new T.Mesh(new T.ShapeGeometry(splice,24),cane);const splicePositions=insert.geometry.attributes.position;for(let i=0;i<splicePositions.count;i++){const y=splicePositions.getY(i),x=splicePositions.getX(i),u=x/(halfWidth(y)-3),depth=(.55+.45*Math.sin(Math.PI*Math.min(y,494)/494))*(1-.65*smooth((y-494)/90));splicePositions.setZ(i,(10+4*(1-u*u))*depth+.15);}insert.geometry.computeVertexNormals();insert.name='Cane V splice';group.add(insert);
  // Closely spaced fine rubber ribs follow the same oval dimensions.
  for(let j=0;j<62;j++){const y=596+j*4.1,t=(y-584)/280,taper=.9+.1*smooth(t/.25),pts=[];for(let i=0;i<64;i++){const a=i/64*Math.PI*2;pts.push(new T.Vector3(Math.cos(a)*(14.5*taper+.25),y+Math.sin(a)*.4,Math.sin(a)*(12.5*taper+.25)-2));}const rib=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts,true),64,.32,4,true),material(0x315847,.95));group.add(rib);}
  group.userData.dimensionsMM=cricketBatDimensions;
  group.scale.setScalar(4.2/864);
  const wrapper=new T.Group();group.position.y=-2.1;wrapper.add(group);return wrapper;
}
