/* Prepare a public source-route link; never fetch a certificate or collect credentials. */
(() => {
 const form=document.querySelector('#certificate-reference-form');if(!form)return;const F=window.SportsForms,result=document.querySelector('#certificate-link-review'),input=form.elements.reference;
 form.addEventListener('input',()=>{result.hidden=true;});
 form.addEventListener('submit',ev=>{ev.preventDefault();const reference=input.value.trim();const errors={};if(!/^[A-Za-z0-9_.-]{1,128}$/.test(reference))errors['certificate-reference']='Enter a reference using 1–128 letters, numbers, dots, underscores or hyphens. Use the original certificate link for other formats.';if(F.errors(form,errors))return;document.querySelector('#external-verification').href='https://gymkhana.iitb.ac.in/sports/certificate-verification/'+encodeURIComponent(reference);document.querySelector('#prepared-reference').textContent=reference;result.hidden=false;result.focus();});
 document.querySelector('#certificate-clear').addEventListener('click',()=>{form.reset();F.clearErrors(form);result.hidden=true;input.focus();});
 document.querySelectorAll('[data-enhanced]').forEach(el=>el.hidden=false);
})();
