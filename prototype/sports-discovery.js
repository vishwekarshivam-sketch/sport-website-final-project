/* Explicit photo choices, ordinary links, no autoplay or navigation interception. */
(() => {
 const root=document.querySelector('.sports-discovery');if(!root)return;
 const data={
  aquatics:{name:'Aquatics',place:['The outdoor swimming pool and deck at IIT Bombay.','A little space to find your rhythm.'],people:['The IIT Bombay aquatics team at the 37th Inter IIT Aquatics Meet.','A team beyond your own lane.']},
  football:{name:'Football',place:['A football match on the IIT Bombay grass field.','A field full of possibilities.'],people:['The IIT Bombay football squad posing together on the field at night.','The people who become your team.']},
  badminton:{name:'Badminton',place:['An indoor badminton hall with green courts and spectator seating.','Room for one more rally.'],people:['IIT Bombay badminton players gathered together on an indoor court.','A shared love of the game.']}
 };
 const photo=root.querySelector('.discovery-photo'),caption=photo.querySelector('figcaption'),link=root.querySelector('.discovery-enter');
 const rows=[...root.querySelectorAll('[data-discovery]')],tabs=[...root.querySelectorAll('[data-discovery-view]')];
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),fine=matchMedia('(hover: hover) and (pointer: fine)');
 let selected='aquatics',view='place',ticket=0;
 photo.dataset.sport='aquatics';photo.dataset.view='place';
 function show(sport,nextView=view,announce=false){
  if(photo.dataset.sport===sport&&photo.dataset.view===nextView&&selected===sport&&view===nextView)return;
  selected=sport;view=nextView;const id=++ticket,entry=data[sport],img=new Image();
  rows.forEach(row=>{const active=row.dataset.discovery===sport;row.classList.toggle('is-selected',active);row.querySelector('button').setAttribute('aria-pressed',String(active));});
  tabs.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.discoveryView===view)));
  // Content and destination commit together, only once the selected photograph decodes.
  photo.setAttribute('aria-busy','true');
  img.alt=entry[view][0];img.src=`assets/discovery/${sport}-${view}.jpg`;
  img.decode().then(()=>{
   if(id!==ticket)return;
   const old=[...photo.querySelectorAll('img')];photo.insertBefore(img,caption);
   photo.dataset.view=view;photo.dataset.sport=sport;
   old.forEach(image=>image.setAttribute('aria-hidden','true'));
   caption.textContent=entry[view][1];link.href=`sports/${sport}.html`;
   link.replaceChildren(document.createTextNode(`Explore ${entry.name.toLowerCase()} `));const arrow=document.createElement('span');arrow.textContent='↗';arrow.setAttribute('aria-hidden','true');link.append(arrow);
   if(!reduced.matches&&!document.documentElement.classList.contains('motion-paused')){
    const animation=img.animate([{clipPath:'inset(0 0 100% 0)',transform:'scale(1.035)'},{clipPath:'inset(0)',transform:'scale(1)'}],{duration:700,easing:'cubic-bezier(.22,.7,.15,1)'});
    animation.finished.then(()=>old.forEach(image=>image.remove()),()=>old.forEach(image=>image.remove()));
   }else old.forEach(image=>image.remove());
   photo.removeAttribute('aria-busy');
   if(announce)root.querySelector('.discovery-status').textContent=`${entry.name}: ${view==='place'?'the place':'the people'} preview.`;
  }).catch(()=>{if(id===ticket){photo.removeAttribute('aria-busy');root.querySelector('.discovery-status').textContent='Photograph unavailable. The sport links remain available.';}});
 }
 rows.forEach(row=>{
  const key=row.dataset.discovery;
  row.addEventListener('pointerenter',event=>{if(fine.matches&&event.pointerType!=='touch'&&key!==selected)show(key);});
  row.addEventListener('focusin',()=>{if(key!==selected)show(key);});
  row.querySelector('button').addEventListener('click',()=>{
   show(key,view,true);
   if(!fine.matches)root.querySelector('.discovery-view').scrollIntoView({block:'center',behavior:reduced.matches?'auto':'smooth'});
  });
 });
 tabs.forEach(button=>button.addEventListener('click',()=>show(selected,button.dataset.discoveryView,true)));
 new MutationObserver(()=>{if(document.documentElement.classList.contains('motion-paused'))root.getAnimations({subtree:true}).forEach(animation=>animation.finish());}).observe(document.documentElement,{attributes:true,attributeFilter:['class']});
 reduced.addEventListener('change',()=>{if(reduced.matches)root.getAnimations({subtree:true}).forEach(animation=>animation.finish());});
 root.querySelectorAll('[hidden]').forEach(el=>el.hidden=false);
})();
