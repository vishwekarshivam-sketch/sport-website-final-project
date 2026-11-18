/* Local report preparation, with local image validation. No Firebase or delivery calls. */
(() => {
 const form=document.querySelector('#feedback-form');if(!form)return;const F=window.SportsForms,review=document.querySelector('#feedback-review'),file=form.elements.image,preview=document.querySelector('#attachment-preview'),image=preview.querySelector('img'),caption=preview.querySelector('p'),fileStatus=document.querySelector('#image-status');let objectURL='',generation=0,fileReady=false,fileProblem='';
 function release(){generation++;if(objectURL)URL.revokeObjectURL(objectURL);objectURL='';fileReady=false;fileProblem='';image.removeAttribute('src');image.hidden=true;fileStatus.textContent='';preview.hidden=true;}
 function clearImage(){release();file.value='';F.clearErrors(form);review.hidden=true;file.focus();}
 file.addEventListener('change',async()=>{
  review.hidden=true;release();const current=file.files[0];if(!current)return;preview.hidden=false;caption.textContent=current.name;let problem='';if(!['image/jpeg','image/png','image/gif','image/webp'].includes(current.type))problem='Choose a JPEG, PNG, GIF or WebP image.';else if(current.size>5*1024*1024)problem='Choose an image no larger than 5 MB.';
  if(problem){fileProblem=problem;F.errors(form,{'feedback-image':problem});return;}
  const token=generation;objectURL=URL.createObjectURL(current);image.src=objectURL;fileStatus.textContent='Reading image locally…';
  try{await image.decode();if(token!==generation)return;fileReady=true;image.hidden=false;caption.textContent=`${current.name} · ${(current.size/1024).toFixed(1)} KB · local preview`;fileStatus.textContent='Image ready for local review. Nothing has been uploaded.';F.clearErrors(form);}catch{if(token!==generation)return;fileProblem='This file could not be read as an image. Choose another image or remove it.';if(objectURL)URL.revokeObjectURL(objectURL);objectURL='';image.removeAttribute('src');F.errors(form,{'feedback-image':fileProblem});fileStatus.textContent='Image not attached.';}
 });
 document.querySelector('#remove-image').addEventListener('click',clearImage);
 form.addEventListener('input',()=>{review.hidden=true;});form.addEventListener('change',()=>{review.hidden=true;});
 form.addEventListener('submit',ev=>{
  ev.preventDefault();const problems=F.required(form),person=form.elements.person,second=form.elements.second;
  if(second.value&&second.value===person.value)problems['feedback-second']='Choose a different second recipient, or leave it blank.';
  if(file.files.length&&(!fileReady||fileProblem))problems['feedback-image']=fileProblem||'Wait for the local image check to finish, or remove the image.';
  if(F.errors(form,problems)){review.hidden=true;return;}
  F.review(review,[['Status','Local draft only — no report sent and no recipient notified.'],['Intended recipient (archive)',person.selectedOptions[0].textContent],['Additional recipient (archive)',second.value?second.selectedOptions[0].textContent:'None'],['Name',form.elements.name.value.trim()],['Roll number',form.elements.roll.value.trim()],['LDAP ID',form.elements.ldap.value.trim()],['Your report',form.elements.description.value.trim()],['Image',fileReady?file.files[0].name+' (local only)':'No image attached']]);
  document.querySelector('#recipient-contact').href='council.html#person-'+person.value;
 });
 document.querySelector('#feedback-edit').addEventListener('click',()=>{review.hidden=true;form.elements.description.focus();});
 document.querySelector('#feedback-clear').addEventListener('click',()=>{form.reset();release();F.clearErrors(form);review.hidden=true;form.elements.person.focus();});
 window.addEventListener('pagehide',()=>{if(objectURL)URL.revokeObjectURL(objectURL);});document.querySelectorAll('[data-enhanced]').forEach(el=>el.hidden=false);
})();
