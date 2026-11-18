/* Image handoff adapted from Codrops DraggableMenu demo.js.
   Copyright 2019 Codrops. MIT license; see SCATTERED-MENU.md.
   Native pointer/rendering integration is local to this project.
   See design/directory/SCATTERED-MENU.md for reference and adaptation notes. */
(()=>{
 const reduced=matchMedia('(prefers-reduced-motion:reduce)'),ease='cubic-bezier(.22,.7,.2,1)',dialog=document.querySelector('.scatter-gallery');let returnTo=null;
 const close=()=>{dialog.close();returnTo?.focus({preventScroll:true});};dialog.querySelector('.gallery-close').addEventListener('click',close);dialog.addEventListener('close',()=>returnTo?.focus({preventScroll:true}));
 document.querySelectorAll('.scatter-section').forEach(section=>{
  const data=JSON.parse(section.querySelector('.scatter-data').textContent),view=section.querySelector('.scatter-viewport'),strip=section.querySelector('.scatter-titles'),back=section.querySelector('.scatter-backdrop'),titles=[...section.querySelectorAll('.scatter-title')],explore=section.querySelector('.scatter-explore');
  let current=0,down=null,dx=0,moved=false,tx=0,pair=null,frame=0,settling=false;
  // Keep the outline underneath a clipped fill layer. Drag progress controls
  // both titles continuously; release completes or reverses the same wipe.
  titles.forEach((t,i)=>{t.dataset.label=t.textContent;t.dataset.number=String(i+1).padStart(2,'0');t.setAttribute('aria-label',t.textContent);});
  function fills(){titles.forEach((t,i)=>t.style.setProperty('--title-fill',i===current?'0%':'100%'));}
  function dragFill(){
   const next=Math.max(0,Math.min(titles.length-1,current+(dx<0?1:-1)));
   fills();if(next===current)return;
   const a=titles[current],b=titles[next];
   const distance=Math.abs((b.offsetLeft+b.offsetWidth/2)-(a.offsetLeft+a.offsetWidth/2));
   const progress=Math.min(1,Math.abs(dx)/Math.max(distance,1));
   a.style.setProperty('--title-fill',`${progress*100}%`);
   b.style.setProperty('--title-fill',`${(1-progress)*100}%`);
   view.classList.toggle('fill-from-right',dx>0);
  }
  function center(animate=true){fills();const title=titles[current];tx=view.clientWidth/2-title.offsetLeft-title.offsetWidth/2;strip.style.transition=animate&&!reduced.matches?'transform 850ms '+ease:'none';strip.style.transform=`translateX(${tx}px)`;titles.forEach((t,i)=>{t.classList.toggle('is-current',i===current);t.setAttribute('aria-pressed',String(i===current));});section.querySelector('.scatter-prev').disabled=current===0;section.querySelector('.scatter-next').disabled=current===titles.length-1;explore.setAttribute('aria-label','Explore '+data[current].name+' images');}
  function group(index){const layer=document.createElement('div');layer.className='scatter-photo-set';layer.dataset.index=index;data[index].photos.forEach(src=>{const img=new Image();img.loading='lazy';img.decoding='async';img.src=src.replace(/\.jpg$/,'.webp');img.alt='';img.className='scatter-thumb';img.draggable=false;layer.append(img);});return layer;}
  function photos(){back.replaceChildren(group(current));}
  function paint(p){
   if(!pair)return;pair.p=p;const sign=pair.next>pair.from?-1:1;
   pair.out.querySelectorAll('img').forEach(img=>{img.style.transformOrigin=sign<0?'100% 50%':'0% 50%';img.style.transform=`translateX(${sign*150*p}%) scale(${1+p},${1-.2*p})`;img.style.opacity=String(.45*(1-p));});
   pair.into.querySelectorAll('img').forEach(img=>{img.style.transformOrigin=sign<0?'0% 50%':'100% 50%';img.style.transform=`translateX(${-sign*150*(1-p)}%) scale(${2-p},${.8+.2*p})`;img.style.opacity=String(.45*p);});
  }
  function prepare(next){
   if(pair?.next===next)return;
   if(pair){cancelAnimationFrame(frame);pair.into.remove();pair.out.querySelectorAll('img').forEach(img=>{img.style.transform='';img.style.opacity='';});}
   pair=null;if(next===current)return;
   const out=back.firstElementChild,into=group(next);back.append(into);pair={from:current,next,out,into,p:0,target:0};paint(0);
  }
  function follow(){if(!pair||settling)return;paint(pair.p+(pair.target-pair.p)*.1);if(Math.abs(pair.target-pair.p)>.001)frame=requestAnimationFrame(follow);}
  function dragPhotos(){const next=Math.max(0,Math.min(titles.length-1,current+(dx<0?1:-1)));prepare(next);if(!pair)return;pair.target=Math.min(1,Math.abs(dx)/view.clientWidth);cancelAnimationFrame(frame);if(reduced.matches)paint(pair.target);else frame=requestAnimationFrame(follow);}
  function finishPhotos(commit){
   if(!pair)return;cancelAnimationFrame(frame);const start=pair.p,end=commit?1:0,began=performance.now();settling=true;
   function tick(now){const t=reduced.matches?1:Math.min(1,(now-began)/1000),e=1-Math.pow(1-t,5);paint(start+(end-start)*e);if(t<1){frame=requestAnimationFrame(tick);return;}if(commit){pair.out.remove();}else pair.into.remove();pair=null;settling=false;}
   frame=requestAnimationFrame(tick);
  }
  function select(n){if(settling)return;const next=Math.max(0,Math.min(titles.length-1,n));prepare(next);if(next===current){center();finishPhotos(false);return;}current=next;center();finishPhotos(true);}
  section.querySelector('.scatter-prev').addEventListener('click',()=>select(current-1));section.querySelector('.scatter-next').addEventListener('click',()=>select(current+1));
  titles.forEach((t,i)=>t.addEventListener('click',()=>{if(moved){moved=false;return;}select(i);}));
  view.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();select(current+(e.key==='ArrowRight'?1:-1));}});
  view.addEventListener('pointerdown',e=>{if(settling||e.button!==0||e.target.closest('.scatter-explore'))return;down={x:e.clientX,y:e.clientY};dx=0;moved=false;view.classList.add('is-dragging');strip.style.transition='none';});
  view.addEventListener('pointermove',e=>{if(!down)return;dx=e.clientX-down.x;if(Math.abs(dx)>8){if(Math.abs(e.clientY-down.y)>Math.abs(dx)&&e.pointerType==='touch'){down=null;view.classList.remove('is-dragging');center();return;}moved=true;dragFill();view.setPointerCapture(e.pointerId);strip.style.transform=`translateX(${tx+dx}px)`;dragPhotos();}});
  const release=()=>{if(!down)return;down=null;view.classList.remove('is-dragging');if(moved&&Math.abs(dx)>view.clientWidth*.055)select(current+(dx<0?1:-1));else{center();finishPhotos(false);}};
  view.addEventListener('pointerup',release);view.addEventListener('pointercancel',release);view.addEventListener('lostpointercapture',release);
  explore.addEventListener('click',()=>{
   if(settling)return;returnTo=explore;const item=data[current],origins=[...back.querySelectorAll('.scatter-photo-set:first-child img')].map(img=>img.getBoundingClientRect());dialog.querySelector('h2').textContent=item.name;const grid=dialog.querySelector('.gallery-grid');grid.replaceChildren(...item.photos.map((src,i)=>{const figure=document.createElement('figure'),img=new Image();img.src=src;img.alt=item.name+' — archive photograph '+(i+1);figure.append(img);return figure;}));const link=dialog.querySelector('.gallery-link');link.href=item.href;link.textContent='Explore '+item.name+' in detail ↗';dialog.showModal();dialog.scrollTop=0;
   if(!reduced.matches){grid.querySelectorAll('figure').forEach((el,i)=>{const to=el.getBoundingClientRect(),from=origins[i];if(!from||!to.width)return;el.animate([{transformOrigin:'0 0',transform:`translate(${from.left-to.left}px,${from.top-to.top}px) scale(${from.width/to.width},${from.height/Math.max(to.height,100)})`,opacity:.45},{transformOrigin:'0 0',transform:'none',opacity:1}],{duration:1200,delay:i*45,easing:ease,fill:'backwards'});});}
  });
  new ResizeObserver(()=>center(false)).observe(view);document.fonts.ready.then(()=>center(false));center(false);photos();
 });
})();
