/* Progressive chapter navigation and a native, keyboard-accessible photo dialog. */
(()=>{
 const opening=document.querySelector('.yg-opening'),nav=document.querySelector('.yg-chapters'),links=[...nav.querySelectorAll('a')],sections=['overview','facilities','events','history','gallery','contact','finale'].map(id=>document.getElementById(id));
 const updateNav=()=>{
  nav.classList.toggle('is-visible',opening.getBoundingClientRect().bottom<=parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop)+1);
  const current=sections.filter(e=>e.getBoundingClientRect().top<=innerHeight*.35).at(-1),id=current?.id;
  const journey=document.querySelector('.yg-journey');journey.dataset.chapter=id||'opening';
  if(!document.querySelector('.yg-stage').classList.contains('is-ready'))journey.dataset.phase=id==='finale'?'landed':id?'playing':'opening';
  links.forEach(a=>{if(a.hash==='#'+id)a.setAttribute('aria-current','true');else a.removeAttribute('aria-current');});
 };updateNav();addEventListener('scroll',updateNav,{passive:true});addEventListener('resize',updateNav,{passive:true});addEventListener('pageshow',updateNav);
 const dialog=document.querySelector('.yg-lightbox');if(!dialog?.showModal)return;
 const photos=JSON.parse(document.querySelector('#yg-photos').textContent),image=dialog.querySelector('.yg-large-photo'),caption=dialog.querySelector('figcaption'),count=dialog.querySelector('.yg-photo-count'),status=dialog.querySelector('.yg-photo-status');
 let index=0,request=0,returnFocus;
 function show(next){index=(next+photos.length)%photos.length;const photo=photos[index],ticket=++request,preload=new Image();count.textContent='Photo '+(index+1)+' of '+photos.length;status.textContent='Loading photograph…';preload.src=photo.src;preload.decode().then(()=>{if(ticket!==request||!dialog.open)return;image.src=photo.src;image.alt=photo.alt;caption.textContent=photo.caption;status.textContent='';}).catch(()=>{if(ticket===request)status.textContent='Photograph unavailable. Try another photo.';});}
 document.querySelectorAll('[data-gallery]').forEach(a=>a.addEventListener('click',e=>{if(e.button!==0||e.metaKey||e.ctrlKey||e.altKey||e.shiftKey)return;const n=photos.findIndex(p=>p.id===a.dataset.gallery);if(n<0)return;e.preventDefault();returnFocus=a;image.removeAttribute('src');caption.textContent='';dialog.showModal();document.body.classList.add('yg-modal-open');document.dispatchEvent(new CustomEvent('yogagallery',{detail:{open:true}}));show(n);}));
 dialog.querySelector('.yg-close').addEventListener('click',()=>dialog.close());dialog.querySelectorAll('[data-photo-step]').forEach(b=>b.addEventListener('click',()=>show(index+Number(b.dataset.photoStep))));
 dialog.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();show(index+(e.key==='ArrowRight'?1:-1));}});
 dialog.addEventListener('close',()=>{++request;document.body.classList.remove('yg-modal-open');returnFocus?.focus({preventScroll:true});document.dispatchEvent(new CustomEvent('yogagallery',{detail:{open:false}}));});addEventListener('pagehide',()=>{if(dialog.open)dialog.close();});
})();