/* Refracted moving light and cursor wakes, behind the unchanged menu content. */
(()=>{
  const host=document.querySelector('.submerged-directory');if(!host)return;
  const reduced=matchMedia('(prefers-reduced-motion:reduce)'),dialog=host.querySelector('.scatter-gallery');
  const canvas=host.querySelector('.water-ripple-field'),ctx=canvas.getContext('2d');
  const texture=new Image();texture.src='../assets/sporting-world/caustics.webp';
  let activeUntil=0;
  let visible=false,frame=0,last=0,time=0,width=1,height=1,pattern,wakes=[],lastWake=0;
  function resize(){
    width=host.clientWidth;height=host.clientHeight;
    const ratio=Math.min(1,1120/width);
    canvas.width=Math.ceil(width*ratio);canvas.height=Math.ceil(height*ratio);
    ctx.setTransform(ratio,0,0,ratio,0,0);pattern=texture.complete&&texture.naturalWidth?ctx.createPattern(texture,'repeat'):null;
  }
  function running(){return visible&&!reduced.matches&&!document.hidden&&!dialog?.open;}
  function update(){
    host.classList.toggle('water-running',running());
    cancelAnimationFrame(frame);frame=0;last=0;
    if(running()){activeUntil=performance.now()+1200;frame=requestAnimationFrame(draw);}else if(reduced.matches){ctx.clearRect(0,0,width,height);wakes=[];}
  }
  function draw(now){
    frame=0;if(!running())return;
    if(last&&now-last<1000/24){frame=requestAnimationFrame(draw);return;}
    const dt=last?Math.min((now-last)/1000,.08):0;last=now;time+=dt;
    ctx.clearRect(0,0,width,height);
    if(pattern){
      ctx.fillStyle=pattern;ctx.globalAlpha=.32;
      // Adjacent bands refract at different phases, so the light pattern itself
      // undulates rather than moving as one flat image.
      const band=16;
      for(let y=0;y<height;y+=band){
        const shift=Math.sin(y*.018+time*.95)*13+Math.sin(y*.007-time*.7)*9;
        ctx.save();ctx.beginPath();ctx.rect(0,y,width,band);ctx.clip();
        ctx.translate(shift+Math.sin(time*.25)*26,time*8);
        ctx.fillRect(-60,y-time*8-1,width+120,band+2);ctx.restore();
      }
    }
    wakes=wakes.filter(w=>time-w.born<3.2);
    for(const wake of wakes){
      const age=time-wake.born;
      for(let ring=0;ring<3;ring++){
        const radius=age*65-ring*16;if(radius<=0)continue;
        ctx.beginPath();ctx.ellipse(wake.x,wake.y,radius,radius*.57,0,0,Math.PI*2);
        ctx.globalAlpha=Math.max(0,(1-age/3.2))*.22;ctx.strokeStyle='#faffec';ctx.lineWidth=2.5;ctx.stroke();
        ctx.beginPath();ctx.ellipse(wake.x,wake.y+3,radius+3,radius*.57+2,0,0,Math.PI*2);
        ctx.globalAlpha=Math.max(0,(1-age/3.2))*.08;ctx.strokeStyle='#4e9788';ctx.lineWidth=2;ctx.stroke();
      }
    }
    ctx.globalAlpha=1;if(now<activeUntil)frame=requestAnimationFrame(draw);else host.classList.remove('water-running');
  }
  host.addEventListener('pointermove',e=>{
    if(e.pointerType!=='mouse'||!running()||time-lastWake<.2)return;
    const rect=host.getBoundingClientRect();
    activeUntil=performance.now()+3300;host.classList.add('water-running');if(!frame)frame=requestAnimationFrame(draw);
    wakes.push({x:e.clientX-rect.left,y:e.clientY-rect.top,born:time});
    if(wakes.length>12)wakes.shift();lastWake=time;
  },{passive:true});
  texture.onload=resize;new ResizeObserver(resize).observe(host);
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;update();},{threshold:0}).observe(host);
  if(dialog)new MutationObserver(update).observe(dialog,{attributes:true,attributeFilter:['open']});
  document.addEventListener('visibilitychange',update);reduced.addEventListener('change',update);
  window.addEventListener('pagehide',()=>{cancelAnimationFrame(frame);host.classList.remove('water-running');});
  window.addEventListener('pageshow',update);resize();update();
})();
