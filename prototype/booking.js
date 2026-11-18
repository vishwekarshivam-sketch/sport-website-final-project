/* Prepare an in-memory preference only. No booking API, POST, storage or confirmation. */
(() => {
 const form=document.querySelector('#booking-form');if(!form)return;const F=window.SportsForms,kind=form.dataset.kind,isBadminton=kind==='badminton',date=form.elements.date,slot=form.elements.slot,review=document.querySelector('#booking-review'),warning=document.querySelector('#booking-date-note');
 function tomorrow(){return F.istDate(1);}
 function preferences(){const u=new URL(location.href);u.searchParams.set('date',date.value);if(slot.value)u.searchParams.set('slot',slot.value);else u.searchParams.delete('slot');if(isBadminton){const court=form.querySelector('[name=court]:checked');court?u.searchParams.set('court',court.value):u.searchParams.delete('court');}history.replaceState(null,'',u);review.hidden=true;}
 function restore(){const u=new URL(location.href),d=tomorrow();date.value=d;warning.hidden=!(u.searchParams.get('date')&&u.searchParams.get('date')!==d);slot.value=u.searchParams.get('slot')||'';if(slot.selectedIndex<0)slot.value='';if(isBadminton){const court=u.searchParams.get('court');form.querySelectorAll('[name=court]').forEach(el=>el.checked=el.value===court);}review.hidden=true;}
 form.addEventListener('input',()=>{review.hidden=true;});
 form.addEventListener('change',ev=>{if(['court','slot'].includes(ev.target.name))preferences();});
 form.addEventListener('submit',ev=>{
  ev.preventDefault();const problems=F.required(form);const name=form.elements.name.value.trim(),roll=form.elements.roll.value.trim(),players=form.elements.players.value.split(',').map(v=>v.trim()).filter(Boolean),unique=new Set(players.map(v=>v.toLowerCase())),n=+form.elements.count.value,court=isBadminton?form.querySelector('[name=court]:checked')?.value:'Football turf';
  if(isBadminton&&!court)problems['court-6']='Choose Court 6 or Court 7 for your local preference.';
  if(!slot.value||slot.selectedOptions[0]?.disabled)problems['booking-slot']='Choose a source session time for your local preference.';
  if(unique.size!==players.length)problems['booking-players']='List each player roll number once.';
  if(!unique.has(roll.toLowerCase())&&roll)problems['booking-players']='Include your roll number among all players.';
  if(n!==players.length)problems['booking-count']='The player count must match the number of listed roll numbers.';
  if(date.value!==tomorrow()){date.value=tomorrow();warning.hidden=false;problems['booking-date']='The booking date has changed in India. Review the updated date and try again.';}
  if(F.errors(form,problems)){review.hidden=true;return;}
  F.review(review,[['Status','Nothing sent — no request sent, no reservation made.'],['Facility',isBadminton?'Badminton · Court '+court:court],['Preferred date (India)',date.value],['Selected session',slot.selectedOptions[0].textContent],['Name',name],['Roll number',roll],['LDAP contact',form.elements.ldap.value.trim()],['Player roll numbers',players.join(', ')],['Number of players',n]]);
 });
 document.querySelector('#booking-edit').addEventListener('click',()=>{review.hidden=true;slot.focus();});
 document.querySelector('#booking-clear').addEventListener('click',()=>{form.reset();F.clearErrors(form);date.value=tomorrow();review.hidden=true;warning.hidden=true;preferences();form.elements.name.focus();});
 window.addEventListener('popstate',restore);document.querySelectorAll('[data-enhanced]').forEach(el=>el.hidden=false);restore();
})();
