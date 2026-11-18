/* Source-first results. No live feed, score synthesis, or dependency on WebGL. */
(()=>{
'use strict';const $=s=>document.querySelector(s),panels=[...document.querySelectorAll('.overall-panel,.sport-panel')],motion=matchMedia('(prefers-reduced-motion: reduce)');let state={category:'boys',sport:'Athletics',q:''},animations=[];
const validSports=[...$('#gc-sport').options].map(o=>o.value),label=()=>$('#gc-sport').selectedOptions[0].textContent;
function read(){const u=new URL(location.href);state={category:u.searchParams.get('category')==='girls'?'girls':'boys',sport:validSports.includes(u.searchParams.get('sport'))?u.searchParams.get('sport'):'Athletics',q:u.searchParams.get('q')||''};}
function write(replace=false){const u=new URL(location.href);u.hash='';u.searchParams.set('category',state.category);u.searchParams.set('sport',state.sport);if(state.q)u.searchParams.set('q',state.q);else u.searchParams.delete('q');if(u.href!==location.href)history[replace?'replaceState':'pushState'](null,'',u);}
function rostrums(){
 const panel=document.querySelector('.overall-panel:not([hidden])'),podium=panel.querySelector('.podium'),overall=$('#overall-podium-world');
 podium.before(overall);podium.classList.add('rostrum-labels');overall.hidden=!!state.q.trim();
 const top=[...podium.querySelectorAll('.podium-place')].map((e,i)=>({name:e.querySelector('h3').textContent,points:parseFloat(e.querySelector('p').textContent),rank:i+1}));
 const detail=document.querySelector('.sport-panel:not([hidden]) .discipline:not([hidden])'),sportHost=$('#sport-podium'),sportStage=$('#sport-podium-world');
 const placement=[...detail.querySelectorAll('tbody tr')].slice(0,3).map(r=>({name:r.querySelector('th').textContent,points:+r.querySelector('td:last-child').textContent,rank:parseInt(r.querySelector('td').textContent,10)}));
 detail.querySelector('.discipline-content').prepend(sportHost);sportHost.hidden=!placement.length;sportStage.hidden=!placement.length;
 const labels=sportHost.querySelector('.sport-podium-labels');labels.replaceChildren();
 placement.forEach((r,i)=>{const a=document.createElement('article');a.dataset.index=i;a.className='sport-podium-place';const rank=document.createElement('small'),name=document.createElement('h4'),score=document.createElement('p');rank.textContent='Place '+r.rank;name.textContent=r.name;score.textContent=r.points+' points';a.append(rank,name,score);labels.append(a);});
 const fallback=(stage,rows)=>{const order=[rows[1],rows[0],rows[2]];stage.dataset.count=rows.length;stage.dataset.ranks=order.map(r=>r?.rank||'').join(',');stage.querySelectorAll('.rostrum-fallback i').forEach((el,i)=>{const r=order[i];el.hidden=!r;el.style.setProperty('--rank-height',r?({1:1.75,2:1.25,3:.95}[r.rank]||.8):0);el.querySelector('b').textContent=r?String(r.rank).padStart(2,'0'):'';});};
 fallback(overall,top);fallback(sportStage,placement);
 window.gcRankingData={overall:{key:state.category,rows:top},sport:{key:state.category+'-'+state.sport,rows:placement}};
 document.dispatchEvent(new CustomEvent('gc:rankings',{detail:window.gcRankingData}));
}
function render(animate=true){
 panels.forEach(p=>p.hidden=p.dataset.category!==state.category);document.querySelectorAll('.podium').forEach(p=>p.hidden=!!state.q.trim());$('#gc-sport').value=state.sport;$('#hostel-search').value=state.q;
 document.querySelectorAll('[data-category-switch]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.categorySwitch===state.category)));
 document.querySelectorAll('.discipline').forEach(d=>{d.hidden=d.dataset.sport!==state.sport;if(!d.hidden)d.open=true;});
 let count=0;document.querySelectorAll('.overall-panel tr[data-team]').forEach(r=>{r.hidden=!r.dataset.team.includes(state.q.trim().toLowerCase());if(!r.hidden&&r.closest('[data-category]').dataset.category===state.category)count++;});
 document.querySelectorAll('.hostel-empty').forEach(e=>e.hidden=count!==0);$('#hostel-count').textContent=`${count} ${count===1?'group':'groups'}${state.q.trim()?' matching':''}`;
 $('#sport-status').textContent=`${state.category==='boys'?'Boys':'Girls'}’ GC · 2025–26`;
 document.querySelectorAll('[data-match-category]').forEach(c=>c.hidden=c.dataset.matchCategory!==state.category);$('#match-missing').hidden=state.category!=='girls';
 animations.forEach(a=>a.cancel());animations=[];if(animate&&!motion.matches){for(const region of ['#overall-results','#sport-results','#match-results'])if($(region).animate)animations.push($(region).animate([{opacity:.65,transform:'translateY(6px)'},{opacity:1,transform:'translateY(0)'}],{duration:220,easing:'cubic-bezier(.2,.7,.3,1)'}));}
 rostrums();document.dispatchEvent(new CustomEvent('gc:category',{detail:state.category}));
}
function hash(){const id=location.hash.slice(1),target=id?document.getElementById(id):null;if(!target)return;const category=id.startsWith('girls-')?'girls':id.startsWith('boys-')?'boys':null;
 if(category){state.category=category;state.q='';if(target.classList.contains('discipline'))state.sport=target.dataset.sport;render(false);if(target.tagName==='DETAILS')target.open=true;requestAnimationFrame(()=>{target.scrollIntoView({block:'start',behavior:'instant'});const focus=target.querySelector('summary,h2');if(focus){if(focus.tagName!=='SUMMARY')focus.tabIndex=-1;focus.focus({preventScroll:true});}});}
}
function clear(){state.q='';write(true);render();$('#hostel-search').focus();}
try{read();render(false);document.querySelectorAll('[data-enhanced]').forEach(e=>e.hidden=false);document.documentElement.classList.add('gc-enhanced');hash();
 document.querySelectorAll('[data-category-switch]').forEach(b=>b.addEventListener('click',()=>{const anchor=['standings','disciplines','match-centre','sources'].map(id=>document.getElementById(id)).filter(e=>e.getBoundingClientRect().top<=document.querySelector('.gc-navigation').offsetHeight+Math.min(250,innerHeight*.3)).at(-1);const top=anchor?.getBoundingClientRect().top;state.category=b.dataset.categorySwitch;write();render();if(anchor)scrollBy({top:anchor.getBoundingClientRect().top-top,behavior:'instant'});}));
 $('#gc-sport').addEventListener('change',()=>{state.sport=$('#gc-sport').value;write();render();});$('#hostel-search').addEventListener('input',()=>{state.q=$('#hostel-search').value;write(true);render();});
 $('.hostel-filter').addEventListener('submit',e=>e.preventDefault());$('#hostel-reset').addEventListener('click',clear);document.querySelectorAll('[data-clear-search]').forEach(b=>b.addEventListener('click',clear));
 addEventListener('popstate',()=>{read();render(false);hash();});addEventListener('hashchange',hash);motion.addEventListener('change',()=>{if(motion.matches)animations.forEach(a=>a.cancel());});
}catch(error){panels.forEach(p=>p.hidden=false);document.querySelectorAll('.discipline,tr[data-team]').forEach(e=>e.hidden=false);document.querySelectorAll('[data-enhanced]').forEach(e=>e.hidden=true);document.documentElement.classList.remove('gc-enhanced');$('#match-missing').hidden=true;document.querySelectorAll('[data-match-category]').forEach(e=>e.hidden=false);console.error('Results enhancement unavailable; source tables remain readable.',error);}
})();
