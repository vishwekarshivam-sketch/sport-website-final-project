/* Progressive chapter navigation and a native, keyboard-accessible photo dialog. */
(()=>{
 const opening=document.querySelector('.dk-opening'),nav=document.querySelector('.dk-chapters'),links=[...nav.querySelectorAll('a')],sections=['overview','facilities','events','gallery','contact','finale'].map(id=>document.getElementById(id));
 const updateNav=()=>{
  nav.classList.toggle('is-visible',opening.getBoundingClientRect().bottom<=parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop)+1);
  const current=sections.filter(e=>e.getBoundingClientRect().top<=innerHeight*.35).at(-1),id=current?.id;
  document.querySelector('.dk-journey').dataset.chapter=id||'opening';
  const sceneBounds=document.querySelector('.dk-journey').getBoundingClientRect();document.querySelector('.dk-commentary').classList.toggle('is-in-view',sceneBounds.top<innerHeight&&sceneBounds.bottom>Math.min(innerHeight*.45,450));
  links.forEach(a=>{if(a.hash==='#'+id)a.setAttribute('aria-current','true');else a.removeAttribute('aria-current');});
 };updateNav();addEventListener('scroll',updateNav,{passive:true});addEventListener('resize',updateNav,{passive:true});addEventListener('pageshow',updateNav);
 // An explicit opt-in; every page load starts with the scene commentary hidden.
 const dock=document.querySelector('.dk-commentary'),toggle=dock.querySelector('button'),commentary=document.getElementById(toggle.getAttribute('aria-controls'));
 toggle.addEventListener('click',()=>{const show=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(show));commentary.hidden=!show;toggle.textContent=show?'Hide commentary':'Show commentary';});
 dock.hidden=false;
 const dialog=document.querySelector('.dk-lightbox');if(!dialog?.showModal)return;
 const photos=JSON.parse(document.querySelector('#dk-photos').textContent),image=dialog.querySelector('.dk-large-photo'),caption=dialog.querySelector('figcaption'),count=dialog.querySelector('.dk-photo-count'),status=dialog.querySelector('.dk-photo-status');
 let index=0,request=0,returnFocus;
 function show(next){index=(next+photos.length)%photos.length;const photo=photos[index],ticket=++request,preload=new Image();count.textContent='Photo '+(index+1)+' of '+photos.length;status.textContent='Loading photograph…';preload.src=photo.src;preload.decode().then(()=>{if(ticket!==request||!dialog.open)return;image.src=photo.src;image.alt=photo.alt;caption.textContent=photo.caption;status.textContent='';}).catch(()=>{if(ticket===request)status.textContent='Photograph unavailable. Try another photo.';});}
 document.querySelectorAll('[data-gallery]').forEach(a=>a.addEventListener('click',e=>{if(e.button!==0||e.metaKey||e.ctrlKey||e.altKey||e.shiftKey)return;const n=photos.findIndex(p=>p.id===a.dataset.gallery);if(n<0)return;e.preventDefault();returnFocus=a;image.removeAttribute('src');caption.textContent='';dialog.showModal();document.body.classList.add('dk-modal-open');document.dispatchEvent(new CustomEvent('chessgallery',{detail:{open:true}}));show(n);}));
 dialog.querySelector('.dk-close').addEventListener('click',()=>dialog.close());dialog.querySelectorAll('[data-photo-step]').forEach(b=>b.addEventListener('click',()=>show(index+Number(b.dataset.photoStep))));
 dialog.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();show(index+(e.key==='ArrowRight'?1:-1));}});
 dialog.addEventListener('close',()=>{++request;document.body.classList.remove('dk-modal-open');returnFocus?.focus({preventScroll:true});document.dispatchEvent(new CustomEvent('chessgallery',{detail:{open:false}}));});addEventListener('pagehide',()=>{if(dialog.open)dialog.close();});
})();
