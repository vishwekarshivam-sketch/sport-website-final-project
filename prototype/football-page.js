/* Football-only progressive menu, section navigation and photographic lightbox. */
(() => {
 const menu=document.querySelector('.fb-menu'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
 if(menu){
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu.open){menu.open=false;menu.querySelector('summary').focus();}});
  document.addEventListener('pointerdown',e=>{if(menu.open&&!menu.contains(e.target))menu.open=false;});
  document.addEventListener('focusin',e=>{if(menu.open&&!menu.contains(e.target))menu.open=false;});
  menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{menu.open=false;}));
 }
 const links=[...document.querySelectorAll('.fb-jumps a')];
 const sections=links.map(a=>document.querySelector(a.getAttribute('href'))).filter(Boolean);
 const observer=new IntersectionObserver(entries=>{
  const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top);
  if(visible.length)links.forEach(a=>{if(a.hash==='#'+visible[0].target.id)a.setAttribute('aria-current','true');else a.removeAttribute('aria-current');});
 },{rootMargin:'-15% 0px -65% 0px',threshold:0});sections.forEach(s=>observer.observe(s));
 const photoObserver=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{if(!entry.isIntersecting)return;photoObserver.unobserve(entry.target);
   if(!reduced.matches)entry.target.animate([{clipPath:'inset(6% 0 6% 0)',transform:'translateY(12px)'},{clipPath:'inset(0)',transform:'translateY(0)'}],{duration:850,easing:'cubic-bezier(.2,.7,.2,1)'});
  });
 },{threshold:.12});document.querySelectorAll('.fb-facility .fb-image,.fb-gallery .fb-image').forEach(p=>photoObserver.observe(p));
 const dialog=document.querySelector('.fb-lightbox');if(!dialog?.showModal)return;
 const photos=JSON.parse(document.querySelector('#fb-photos').textContent),image=dialog.querySelector('.fb-large-photo'),caption=dialog.querySelector('figcaption'),status=dialog.querySelector('.fb-photo-status'),count=dialog.querySelector('.fb-photo-count');
 let current=0,request=0,returnFocus=null;
 function show(index){
  current=(index+photos.length)%photos.length;
  const photo=photos[current],ticket=++request,next=new Image();
  status.textContent='Loading photograph…';count.textContent=`Photo ${current+1} of ${photos.length}`;next.src=photo.src;
  next.decode().then(()=>{
   if(ticket!==request||!dialog.open)return;
   image.src=photo.src;image.alt=photo.alt;caption.textContent=photo.caption;status.textContent='';
   if(!reduced.matches)image.animate([{opacity:.45},{opacity:1}],{duration:300,easing:'ease-out'});
  }).catch(()=>{if(ticket===request)status.textContent='Photograph unavailable. Try another photo.';});
 }
 document.querySelectorAll('[data-gallery]').forEach(link=>link.addEventListener('click',e=>{
  if(e.button!==0||e.metaKey||e.ctrlKey||e.altKey||e.shiftKey)return;
  const index=photos.findIndex(p=>p.id===link.dataset.gallery);if(index<0)return;
  e.preventDefault();returnFocus=link;image.removeAttribute('src');image.alt='';caption.textContent='';dialog.showModal();document.body.classList.add('fb-modal-open');show(index);
 }));
 dialog.querySelector('.fb-photo-close').addEventListener('click',()=>dialog.close());
 dialog.querySelectorAll('[data-photo-step]').forEach(button=>button.addEventListener('click',()=>show(current+Number(button.dataset.photoStep))));
 dialog.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();show(current+(e.key==='ArrowRight'?1:-1));}});
 dialog.addEventListener('close',()=>{++request;document.body.classList.remove('fb-modal-open');returnFocus?.focus({preventScroll:true});});
 window.addEventListener('pagehide',()=>{if(dialog.open)dialog.close();});
})();
