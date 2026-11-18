/* Source-bound portrait plates behind the book page; original geometry and motion. */
import * as T from './vendor/three.module.js';
export async function createPortraitPassage(scene,keep,base){
 const own=x=>keep(x),group=new T.Group();scene.add(group);group.visible=false;let entries=[];
 try{const response=await fetch(new URL('assets/yearbook/passage.json',base));if(!response.ok)throw new Error('Portrait manifest unavailable');entries=await response.json();}catch{return {group,count:0,pose(){}};}
 const loader=new T.TextureLoader(),materials=[],plates=[];
 await Promise.all(entries.map(async(entry,index)=>{let image=null;if(entry.portrait){try{image=await loader.loadAsync(new URL(entry.portrait,base));}catch{}}
 const canvas=document.createElement('canvas');canvas.width=480;canvas.height=660;const ctx=canvas.getContext('2d');ctx.fillStyle='#edece0';ctx.fillRect(0,0,480,660);ctx.fillStyle='#264438';ctx.fillRect(18,18,444,520);
 if(image){const img=image.image,scale=Math.max(444/img.width,520/img.height);ctx.save();ctx.beginPath();ctx.rect(18,18,444,520);ctx.clip();ctx.drawImage(img,18+(444-img.width*scale)/2,18+(520-img.height*scale)/2,img.width*scale,img.height*scale);ctx.restore();image.dispose();}else{ctx.fillStyle='#c5d1ad';ctx.font='130px Faktum';ctx.textAlign='center';ctx.fillText(entry.name.split(/\s+/).slice(0,2).map(x=>x[0]).join(''),240,330);ctx.textAlign='left';}
 ctx.fillStyle='#173f34';ctx.font='27px Faktum';const parts=entry.name.split(' ');if(ctx.measureText(entry.name).width>430){ctx.fillText(parts.slice(0,-1).join(' '),24,585);ctx.fillText(parts.at(-1),24,621);}else ctx.fillText(entry.name,24,594);
 const tex=own(new T.CanvasTexture(canvas));tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=4;const mat=own(new T.MeshBasicMaterial({map:tex,side:T.DoubleSide,transparent:true,opacity:0}));materials.push(mat);const mesh=new T.Mesh(own(new T.PlaneGeometry(1.35,1.85)),mat),ring=Math.floor(index/6),a=(index%6)/6*Math.PI*2+ring*.32;mesh.rotation.x=-Math.PI/2;mesh.rotation.z=(index%3-1)*.07;mesh.position.set(1.65+Math.cos(a)*2.3,-3-ring*7,.28+Math.sin(a)*2.3);group.add(mesh);plates.push({mesh,index,a,ring});
 }));
 return {group,count:plates.length,pose(p){const fade=Math.max(0,Math.min(1,(p-.58)/.12));group.visible=fade>0;materials.forEach(m=>m.opacity=fade);plates.forEach(({mesh,a,ring})=>{const twist=(p-.65)*.13;mesh.position.x=1.65+Math.cos(a+twist)*2.3;mesh.position.z=.28+Math.sin(a+twist)*2.3;});}};
}
