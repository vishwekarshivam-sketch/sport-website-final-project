/* Date-only, inclusive archive browsing. All source content exists without this file. */
(()=>{
 'use strict';
 const $=s=>document.querySelector(s),rows=[...document.querySelectorAll('.event-row')];
 const month=$('#event-month'),sport=$('#event-sport'),search=$('#event-search');
 const months=[...month.options].map(o=>o.value).filter(v=>/^\d{4}-\d{2}$/.test(v));
 const defaultMonth='2026-10',motion=matchMedia('(prefers-reduced-motion: reduce)');
 let state={month:defaultMonth,sport:'',q:'',day:''},animation;
 const fmt=(iso,options)=>new Intl.DateTimeFormat('en-GB',{timeZone:'UTC',...options}).format(new Date(iso+'T12:00:00Z'));
 const lastDay=m=>`${m}-${new Date(Date.UTC(+m.slice(0,4),+m.slice(5),0)).getUTCDate()}`;
 const matching=r=>(!state.sport||r.dataset.sport===state.sport)&&r.dataset.search.includes(state.q.trim().toLowerCase());
 function inPeriod(r){
  const {start,end}=r.dataset;
  if(state.month==='all')return true;
  if(state.month==='undated')return !start;
  const a=state.day||state.month+'-01',b=state.day||lastDay(state.month);
  return !!start&&start<=b&&end>=a;
 }
 function writeURL(replace=false){
  const u=new URL(location.href);u.hash='';
  for(const key of ['month','sport','q','day']){if(state[key])u.searchParams.set(key,state[key]);else u.searchParams.delete(key);}
  if(u.href!==location.href)history[replace?'replaceState':'pushState'](null,'',u);
 }
 function readURL(){
  const u=new URL(location.href),m=u.searchParams.get('month');
  state={month:[...months,'all','undated'].includes(m)?m:defaultMonth,sport:[...sport.options].some(o=>o.value===u.searchParams.get('sport'))?u.searchParams.get('sport'):'',q:u.searchParams.get('q')||'',day:''};
  const day=u.searchParams.get('day');
  if(months.includes(state.month)&&day&&/^\d{4}-\d{2}-\d{2}$/.test(day)&&day.startsWith(state.month+'-')&&day>=state.month+'-01'&&day<=lastDay(state.month))state.day=day;
 }
 function calendar(){
  const host=$('#calendar-days');host.replaceChildren();
  if(!months.includes(state.month)){$('#map-caption').textContent=state.month==='all'?'All original records, including those without dates.':'The source supplied no complete date for these records.';return;}
  const week=document.createElement('div');week.className='weekdays';week.setAttribute('aria-hidden','true');
  for(const d of ['M','T','W','T','F','S','S']){const s=document.createElement('span');s.textContent=d;week.append(s);}host.append(week);
  const grid=document.createElement('div');grid.className='day-grid';grid.setAttribute('role','group');grid.setAttribute('aria-label','Select a day in '+fmt(state.month+'-01',{month:'long',year:'numeric'}));
  const offset=(new Date(state.month+'-01T12:00:00Z').getUTCDay()+6)%7;
  for(let i=0;i<offset;i++)grid.append(document.createElement('span'));
  for(let n=1;n<=+lastDay(state.month).slice(-2);n++){
   const day=state.month+'-'+String(n).padStart(2,'0');
   const count=rows.filter(r=>matching(r)&&r.dataset.start&&r.dataset.start<=day&&r.dataset.end>=day).length;
   const b=document.createElement('button');b.type='button';b.dataset.day=day;b.setAttribute('aria-pressed',String(state.day===day));b.setAttribute('aria-label',fmt(day,{day:'numeric',month:'long',year:'numeric'})+`, ${count} ${count===1?'event':'events'}`);
   b.append(String(n));const small=document.createElement('small');small.textContent=count?String(count):'·';small.setAttribute('aria-hidden','true');b.append(small);grid.append(b);
  }
  host.append(grid);$('#map-caption').textContent='Select a day. Small numbers count matching events.';
 }
 function render(animate=true,rebuildCalendar=true){
  month.value=state.month;sport.value=state.sport;search.value=state.q;
  let count=0;rows.forEach(r=>{r.hidden=!(matching(r)&&inPeriod(r));if(!r.hidden)count++;});
  const title=state.month==='all'?'The whole season.':state.month==='undated'?'Dates not supplied.':fmt(state.month+'-01',{month:'long',year:'numeric'});
  $('#agenda-month').textContent=title;
  $('#event-count').textContent=`${count} ${count===1?'event':'events'}${state.day?' on this day':''}`;
  $('#event-empty').hidden=count!==0;
  $('#active-day').hidden=!state.day;
  $('#active-day').textContent=state.day?fmt(state.day,{weekday:'long',day:'numeric',month:'long'})+' · Includes events in progress.':'';
  $('#clear-day').hidden=!state.day;
  const index=months.indexOf(state.month);$('#month-prev').disabled=index<=0;$('#month-next').disabled=index<0||index===months.length-1;
  document.querySelectorAll('[data-month]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.month===state.month)));
  document.querySelectorAll('[data-period]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.period===state.month)));
  if(rebuildCalendar)calendar();else document.querySelectorAll('[data-day]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.day===state.day)));
  if(animation)animation.cancel();
  if(animate&&!motion.matches&&$('#event-list').animate)animation=$('#event-list').animate([{opacity:.65,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],{duration:180,easing:'cubic-bezier(.2,.7,.3,1)'});
 }
 function changeMonth(m){state.month=m;state.day='';writeURL();render();revealMonth();}
 function revealMonth(){const active=document.querySelector('[data-month][aria-pressed=true]');if(active){const strip=active.parentElement;strip.scrollLeft=active.offsetLeft-strip.offsetLeft-strip.clientWidth/2+active.clientWidth/2;}}
 function reset(){state={month:defaultMonth,sport:'',q:'',day:''};writeURL();render();revealMonth();}
 function openHash(){
  const id=location.hash.slice(1),row=rows.find(r=>r.id===id);if(!row)return false;
  state={month:row.dataset.start?row.dataset.start.slice(0,7):'undated',sport:'',q:'',day:''};render(false);row.open=true;
  requestAnimationFrame(()=>{row.scrollIntoView({block:'start',behavior:'instant'});row.querySelector('summary').focus({preventScroll:true});});revealMonth();return true;
 }
 try{
  readURL();render(false);
  document.querySelectorAll('[data-enhanced]').forEach(e=>e.hidden=false);revealMonth();openHash();
  month.addEventListener('change',()=>changeMonth(month.value));
  document.querySelectorAll('[data-month]').forEach(b=>b.addEventListener('click',()=>changeMonth(b.dataset.month)));
  document.querySelectorAll('[data-period]').forEach(b=>b.addEventListener('click',()=>changeMonth(b.dataset.period)));
  $('#month-prev').addEventListener('click',()=>changeMonth(months[months.indexOf(state.month)-1]));
  $('#month-next').addEventListener('click',()=>changeMonth(months[months.indexOf(state.month)+1]));
  sport.addEventListener('change',()=>{state.sport=sport.value;writeURL();render();});
  search.addEventListener('input',()=>{state.q=search.value;writeURL(true);render();});
  $('.calendar-filters').addEventListener('submit',e=>e.preventDefault());
  $('#calendar-days').addEventListener('click',e=>{const b=e.target.closest('[data-day]');if(!b)return;state.day=state.day===b.dataset.day?'':b.dataset.day;writeURL();render(true,false);});
  $('#calendar-days').addEventListener('keydown',e=>{const b=e.target.closest('[data-day]');if(!b||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(e.key))return;const bs=[...document.querySelectorAll('[data-day]')],i=bs.indexOf(b);let next=e.key==='Home'?0:e.key==='End'?bs.length-1:i+({ArrowLeft:-1,ArrowRight:1,ArrowUp:-7,ArrowDown:7}[e.key]);e.preventDefault();bs[Math.max(0,Math.min(bs.length-1,next))].focus();});
  $('#clear-day').addEventListener('click',()=>{state.day='';writeURL();render();month.focus();});
  $('#events-reset').addEventListener('click',reset);$('#empty-reset').addEventListener('click',()=>{reset();search.focus();});
  window.addEventListener('popstate',()=>{readURL();render(false);openHash();revealMonth();});
  window.addEventListener('hashchange',openHash);
  motion.addEventListener('change',()=>{if(motion.matches&&animation)animation.cancel();});
 }catch(error){
  rows.forEach(r=>r.hidden=false);document.querySelectorAll('[data-enhanced]').forEach(e=>e.hidden=true);$('#agenda-month').textContent='All archived events';$('#event-count').textContent='269 archived events';$('#event-empty').hidden=true;$('#active-day').hidden=true;console.error('Calendar enhancement unavailable; all records remain readable.',error);
 }
})();
