/* Finite, progressive enhancement. No service requests, storage or background loops. */
(() => {
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 const cancel=()=>document.querySelectorAll('[data-enter]').forEach(el=>el.getAnimations().forEach(a=>a.cancel()));
 if(!reduce.matches)document.querySelectorAll('[data-enter]').forEach(el=>{
  const settled=getComputedStyle(el).transform;
  el.animate([{transform:`${settled==='none'?'':settled} translateY(22px) rotateX(8deg)`},{transform:settled}],{duration:650,easing:'cubic-bezier(.2,.7,.2,1)'});
 });
 reduce.addEventListener('change',cancel);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)cancel();});
 document.addEventListener('focusin',cancel);
})();
