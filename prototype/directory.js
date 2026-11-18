(() => {
 const reduced=matchMedia('(prefers-reduced-motion:reduce)');
 document.body.classList.add('js-ribbons');
 const easing='cubic-bezier(.22,.7,.2,1)';
 if(!reduced.matches){
  document.querySelectorAll('.type-opening h1>span').forEach((el,i)=>el.animate([{opacity:0,transform:'translateY(65px)',clipPath:'inset(0 0 100% 0)'},{opacity:1,transform:'none',clipPath:'inset(0)'}],{duration:1100,delay:100+i*140,easing,fill:'backwards'}));
  document.querySelectorAll('.opening-photo').forEach((el,i)=>el.animate([{opacity:0,translate:'0 80px',scale:'.85'},{opacity:1,translate:'0 0',scale:'1'}],{duration:1400,delay:250+i*130,easing,fill:'backwards'}));
 }
 document.querySelectorAll('.ribbon-section').forEach(section=>{
  const track=section.querySelector('.ribbon-track'),cards=[...section.querySelectorAll('.ribbon-card')],panel=section.querySelector('.ribbon-detail'),photo=panel.querySelector('.detail-photo'),title=panel.querySelector('h3'),link=panel.querySelector('.detail-link'),status=section.querySelector('.ribbon-status');
  let selected=null,token=0,down=null,dragged=false;
  section.querySelector('.ribbon-arrows').hidden=false;
  const behavior=()=>reduced.matches?'instant':'smooth';
  const step=dir=>track.scrollBy({left:dir*(cards[0].offsetWidth+innerWidth*.05),behavior:behavior()});
  const update=()=>{section.querySelector('[data-step="-1"]').disabled=track.scrollLeft<3;section.querySelector('[data-step="1"]').disabled=track.scrollLeft>=track.scrollWidth-track.clientWidth-3;};
  section.querySelectorAll('[data-step]').forEach(button=>button.addEventListener('click',()=>step(Number(button.dataset.step))));
  track.addEventListener('scroll',update,{passive:true});new ResizeObserver(update).observe(track);update();
  track.addEventListener('keydown',event=>{if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();step(event.key==='ArrowRight'?1:-1);}});
  track.addEventListener('pointerdown',event=>{if(event.pointerType!=='mouse'||event.button!==0)return;down={x:event.clientX,left:track.scrollLeft};dragged=false;});
  track.addEventListener('pointermove',event=>{if(!down)return;const dx=event.clientX-down.x;if(Math.abs(dx)>7){dragged=true;track.classList.add('is-dragging');track.setPointerCapture(event.pointerId);track.scrollLeft=down.left-dx;}});
  const end=()=>{down=null;track.classList.remove('is-dragging');};track.addEventListener('pointerup',end);track.addEventListener('pointercancel',end);track.addEventListener('lostpointercapture',end);
  track.addEventListener('click',event=>{if(dragged){event.preventDefault();event.stopPropagation();dragged=false;}},true);
  const close=()=>{token++;panel.hidden=true;selected?.querySelector('button').setAttribute('aria-expanded','false');selected?.querySelector('button').focus({preventScroll:true});status.textContent='';};
  panel.querySelector('.detail-close').addEventListener('click',close);
  section.addEventListener('keydown',event=>{if(event.key==='Escape'&&!panel.hidden)close();});
  cards.forEach(card=>card.querySelector('button').addEventListener('click',async()=>{
   const id=++token;selected=card;cards.forEach(c=>c.querySelector('button').setAttribute('aria-expanded',String(c===card)));
   const image=new Image();image.src=card.querySelector('img').src;image.alt=card.querySelector('img').alt;
   try{await image.decode();}catch{status.textContent='The photograph could not load. The sport page is still available.';}
   if(id!==token)return;
   photo.replaceChildren(image);title.textContent=card.dataset.name;link.href=card.querySelector('a').href;link.replaceChildren(document.createTextNode('Explore '+card.dataset.name+' '));const arrow=document.createElement('span');arrow.textContent='↗';link.append(arrow);
   panel.hidden=false;status.textContent=card.dataset.name+' selected';
   if(!reduced.matches){image.animate([{clipPath:'inset(100% 0 0 0)',transform:'scale(1.07)'},{clipPath:'inset(0)',transform:'scale(1)'}],{duration:1000,easing});title.animate([{opacity:0,transform:'translateY(22px)'},{opacity:1,transform:'none'}],{duration:700,delay:150,fill:'backwards',easing});}
   panel.querySelector('.detail-close').focus({preventScroll:true});
   panel.scrollIntoView({behavior:behavior(),block:'center'});
  }));
 });
})();
