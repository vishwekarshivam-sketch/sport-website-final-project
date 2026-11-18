/* Eight user-confirmed facilities. Native scrolling and progressive links. */
(() => {
  const map = document.querySelector('.campus-map');
  if (!map) return;
  const overview = map.querySelector('.campus-overview');
  const visit = map.querySelector('.campus-visit');
  const triggers = [...map.querySelectorAll('[data-ground]')];
  let trigger = triggers[0];
  const grounds = JSON.parse(document.querySelector('#campus-grounds-data').textContent);
  const selector = map.querySelector('.campus-place-switch select');
  const note = map.querySelector('.campus-asset-note');
  const overviewButton = document.createElement('button');
  overviewButton.type='button';overviewButton.className='campus-context';
  overviewButton.setAttribute('aria-label','Return to campus overview');
  overviewButton.innerHTML='<span class="campus-context-photo"><img src="assets/performance/campus-640.webp" alt=""><i aria-hidden="true"></i></span><span>Campus overview</span>';
  map.querySelector('.campus-visit-art').append(overviewButton);
  const back = map.querySelector('.campus-return');
  const figure = map.querySelector('.campus-ground-photo');
  const caption = figure.querySelector('figcaption');
  let choices = [...map.querySelectorAll('[data-ground-photo]')];
  const counter = map.querySelector('.campus-photo-count');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let photos = grounds.cricket.photos;
  let current = 0, request = 0, open = false;
  function motionAllowed(){return !reduced.matches && !map.classList.contains('is-motion-paused');}
  function showPhoto(index){
    const next = (index + photos.length) % photos.length;
    const ticket = ++request;
    const photo = photos[next];
    current = next;
    const img = new Image();
    img.alt = photo.alt; img.width = 1600; img.height = 1200;
    img.src = photo.src;
    figure.setAttribute('aria-busy','true');
    img.decode().then(() => {
      if(ticket !== request) return;
      const old = figure.querySelector('img');
      figure.insertBefore(img,caption);
      old.remove();
      if(motionAllowed()) img.animate([{opacity:0,transform:'scale(1.035)'},{opacity:1,transform:'scale(1)'}],{duration:450,easing:'cubic-bezier(.2,.7,.2,1)'});
      current = next;
      caption.textContent = photo.caption;
      counter.textContent = `Photo ${next + 1} of ${photos.length}`;
      choices.forEach((button,i)=>button.setAttribute('aria-pressed',String(i===next)));
      figure.removeAttribute('aria-busy');
    }).catch(() => {
      if(ticket !== request) return;
      figure.removeAttribute('aria-busy');
      counter.textContent = 'Photo unavailable. Please try another.';
    });
  }
  function selectGround(key){
    const ground = grounds[key];
    photos = ground.photos;
    current = 0;
    selector.value = key;
    overviewButton.style.setProperty('--context-x',ground.x+'%');
    overviewButton.style.setProperty('--context-y',ground.y+'%');
    map.style.setProperty('--reveal-x',ground.x+'%');
    map.style.setProperty('--reveal-y',ground.y+'%');
    map.querySelector('#campus-ground-title').textContent = ground.title;
    map.querySelector('.campus-place-name').textContent = ground.name;
    map.querySelector('.campus-place-description').textContent = ground.description;
    note.textContent = ground.note;
    note.hidden = !ground.note;
    const link = map.querySelector('.campus-sport-link');
    link.href = `sports/${ground.sport}.html`;
    link.textContent = `Explore ${ground.sport === 'aquatics' ? 'aquatics' : ground.sport} ↗`;
    const group = map.querySelector('.campus-photo-choices');
    group.replaceChildren();
    photos.forEach((photo,i)=>{
      const button = document.createElement('button');
      button.type = 'button';button.textContent = photo.label;
      button.setAttribute('aria-pressed',String(i===0));
      button.addEventListener('click',()=>showPhoto(i));group.append(button);
    });
    choices = [...group.children];
    map.querySelectorAll('[data-photo-step]').forEach(button=>button.hidden=photos.length<2);
    showPhoto(0);
  }
  function enter(event){
    event.preventDefault();
    triggers.forEach(button=>button.setAttribute('aria-expanded','false'));
    trigger = event.currentTarget;
    selectGround(trigger.dataset.ground);
    const ground = grounds[trigger.dataset.ground];
    map.style.setProperty('--reveal-x',ground.x+'%');
    map.style.setProperty('--reveal-y',ground.y+'%');
    open = true;
    overview.inert = true;
    visit.inert = false;
    visit.removeAttribute('aria-hidden');
    trigger.setAttribute('aria-expanded','true');
    visit.getBoundingClientRect(); // Resolve the selected anchor before starting the reveal.
    map.classList.add('is-visiting');
    if(trigger.closest('.campus-place-list')) map.querySelector('.campus-map-stage').scrollIntoView({block:'start',behavior:motionAllowed()?'smooth':'auto'});
    figure.querySelector('img').loading = 'eager';
    // Visibility transitions can reject focus on their first frame.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if(open) back.focus({preventScroll:true});
    }));
  }
  function leave(){
    if(!open) return;
    open = false; ++request;
    figure.removeAttribute('aria-busy');
    map.classList.remove('is-visiting');
    overview.inert = false;
    visit.inert = true;
    visit.setAttribute('aria-hidden','true');
    trigger.setAttribute('aria-expanded','false');
    trigger.focus({preventScroll:true});
  }
  triggers.forEach(button=>{
    button.setAttribute('role','button');
    button.setAttribute('aria-expanded','false');
    button.setAttribute('aria-controls','cricket-visit');
    button.addEventListener('click',enter);
    button.addEventListener('keydown',event=>{if(event.key===' ') enter(event);});
  });
  selector.addEventListener('change',()=>{
    triggers.forEach(button=>button.setAttribute('aria-expanded','false'));
    selectGround(selector.value);
    trigger = triggers.find(button=>button.dataset.ground===selector.value);
    trigger.setAttribute('aria-expanded','true');
  });
  visit.addEventListener('transitionend', event => {
    if(event.target === visit && open && (document.activeElement === document.body || document.activeElement === trigger)) back.focus({preventScroll:true});
  });
  back.addEventListener('click',leave);
  overviewButton.addEventListener('click',leave);
  choices.forEach((button,i)=>button.addEventListener('click',()=>showPhoto(i)));
  map.querySelectorAll('[data-photo-step]').forEach(button=>button.addEventListener('click',()=>showPhoto(current+Number(button.dataset.photoStep))));
  map.addEventListener('keydown',event=>{
    if(!open) return;
    if(event.key==='Escape'){event.preventDefault();leave();}
    if((event.key==='ArrowRight'||event.key==='ArrowLeft') && event.target.closest('.campus-photo-controls, .campus-photo-choices')){
      event.preventDefault();showPhoto(current+(event.key==='ArrowRight'?1:-1));
    }
  });
  map.querySelectorAll('[hidden]').forEach(el=>el.hidden=false);
  note.hidden=true;
  visit.inert = true;
  visit.setAttribute('aria-hidden','true');
  map.classList.add('campus-map-ready');
  // Load the first ground view only when this section approaches the viewport.
  if ('IntersectionObserver' in window) {
    const preload = new IntersectionObserver(entries => {
      if(entries.some(entry => entry.isIntersecting)){
        figure.querySelector('img').loading = 'eager';
        preload.disconnect();
      }
    }, {rootMargin:'400px'});
    preload.observe(map);
  }
  const pause = document.querySelector('#opening-motion');
  if(pause){
    const sync=()=>map.classList.toggle('is-motion-paused',pause.getAttribute('aria-pressed')==='true');
    new MutationObserver(sync).observe(pause,{attributes:true,attributeFilter:['aria-pressed']});sync();
  }
})();
