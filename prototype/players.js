/* Archive-only directory: HTML is the source of truth and full no-JS fallback. */
(() => {
 const form=document.querySelector('#player-filters');if(!form)return;
 const rows=[...document.querySelectorAll('.player-row')],count=document.querySelector('#player-count'),empty=document.querySelector('#players-empty'),notice=document.querySelector('#player-notice');
 const fields={q:document.querySelector('#player-search'),sport:form.elements.sport,level:form.elements.level,gender:form.elements.gender,hostel:form.elements.hostel},reduce=matchMedia('(prefers-reduced-motion: reduce)');let animation;
 const cancel=()=>animation?.cancel();
 const normalize=s=>s.trim().toLocaleLowerCase('en');
 function state(){return Object.fromEntries(Object.entries(fields).map(([k,el])=>[k,el.value]));}
 function apply(motion=true){
  const s=state();let n=0;cancel();
  rows.forEach(row=>{const yes=(!s.q||normalize(row.dataset.name).includes(normalize(s.q)))&&['sport','level','gender','hostel'].every(k=>!s[k]||(s[k]==='missing'?!row.dataset[k]:row.dataset[k]===s[k]));row.hidden=!yes;if(yes)n++;});
  count.textContent=`${n} of ${rows.length} archived records`;empty.hidden=n!==0;
  if(motion&&!reduce.matches&&!document.hidden)animation=document.querySelector('#player-list').animate([{opacity:.65,transform:'translateY(5px)'},{opacity:1,transform:'none'}],{duration:160,easing:'ease-out'});
 }
 function sync(mode='pushState'){
  const url=new URL(location.href);Object.entries(state()).forEach(([k,v])=>v?url.searchParams.set(k,v):url.searchParams.delete(k));url.hash='directory';history[mode](null,'',url);notice.hidden=true;apply();
 }
 function restore(){const url=new URL(location.href);Object.entries(fields).forEach(([k,el])=>{let v=url.searchParams.get(k)||'';if(k==='hostel')v=v.replace(/^h/i,'');el.value=v;if(k!=='q'&&el.selectedIndex<0)el.value='';});apply(false);revealHash();}
 function revealHash(){
  const row=rows.find(el=>'#'+el.id===location.hash);if(!row)return;
  if(row.hidden){Object.values(fields).forEach(el=>el.value='');apply(false);const u=new URL(location.href);Object.keys(fields).forEach(k=>u.searchParams.delete(k));history.replaceState(null,'',u);notice.textContent='Filters cleared to show the linked record.';notice.hidden=false;}
  row.open=true;requestAnimationFrame(()=>row.scrollIntoView({block:'center'}));
 }
 form.addEventListener('submit',ev=>{ev.preventDefault();sync();});
 form.addEventListener('change',ev=>{if(ev.target!==fields.q)sync();});
 fields.q.addEventListener('input',()=>sync('replaceState'));
 const reset=()=>{form.reset();fields.q.value='';sync();};
 document.querySelector('#players-reset').addEventListener('click',reset);document.querySelector('#players-empty-reset').addEventListener('click',reset);
 document.querySelectorAll('[data-sport-shortcut]').forEach(link=>link.addEventListener('click',ev=>{ev.preventDefault();fields.sport.value=link.dataset.sportShortcut;sync();document.querySelector('#directory').scrollIntoView();}));
 document.querySelectorAll('[data-enhanced]').forEach(el=>el.hidden=false);
 window.addEventListener('popstate',restore);window.addEventListener('hashchange',revealHash);
 reduce.addEventListener('change',cancel);document.addEventListener('visibilitychange',()=>{if(document.hidden)cancel();});document.addEventListener('focusin',cancel);
 restore();
})();
