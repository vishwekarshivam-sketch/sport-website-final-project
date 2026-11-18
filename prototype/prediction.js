/* Local score exploration for archived source configuration. No votes or results service. */
(() => {
 const form=document.querySelector('#prediction-form');if(!form)return;const F=window.SportsForms,review=document.querySelector('#prediction-review'),a=form.elements.scoreA,b=form.elements.scoreB;
 function update(){[a,b].forEach((el,i)=>{document.querySelector(i?'#board-score-b':'#board-score-a').textContent=el.value!==''&&el.validity.valid?el.value:'—';});review.hidden=true;}
 form.addEventListener('input',update);form.addEventListener('change',update);
 form.addEventListener('submit',ev=>{ev.preventDefault();const errors=F.required(form),winner=form.querySelector('[name=winner]:checked')?.value;
  if(!winner)errors['prediction-knicks']='Choose a team for your local prediction.';
  if(a.value!==''&&b.value!==''&&a.validity.valid&&b.validity.valid){if(+a.value===+b.value)errors['prediction-score-b']='The archived configuration does not allow a draw. Choose different scores.';else if(winner&&((winner==='A')!== (+a.value>+b.value)))errors['prediction-score-a']='The higher score must match the team you selected.';}
  if(F.errors(form,errors)){review.hidden=true;return;}
  F.review(review,[['Status','Local exploration only — no prediction submitted or vote counted.'],['Archived source matchup','New York Knicks / San Antonio Spurs — fixture not verified'],['Your selected winner',winner==='A'?'New York Knicks':'San Antonio Spurs'],['Your score',`Knicks ${a.value} : ${b.value} Spurs`],['Actual result','Unavailable — no verified result service is connected.']]);
 });
 document.querySelector('#prediction-edit').addEventListener('click',()=>{review.hidden=true;a.focus();});document.querySelector('#prediction-clear').addEventListener('click',()=>{form.reset();F.clearErrors(form);update();document.querySelector('#prediction-knicks').focus();});
 document.querySelectorAll('[data-enhanced]').forEach(el=>el.hidden=false);
})();
