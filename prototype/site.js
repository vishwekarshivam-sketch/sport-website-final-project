const menu=document.querySelector('.site-menu');
if(menu){
 const trigger=menu.querySelector('summary');
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&menu.open){menu.open=false;trigger.focus();}});
 document.addEventListener('pointerdown',event=>{if(menu.open&&!menu.contains(event.target))menu.open=false;});
 menu.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>{menu.open=false;}));
 document.addEventListener('focusin',event=>{if(menu.open&&!menu.contains(event.target))menu.open=false;});
}
const current=new URL(location.href);
document.querySelectorAll('.header nav a').forEach(link=>{
 const target=new URL(link.href);
 const normalize=path=>path.replace(/\/index\.html$/,'/');
 if(normalize(target.pathname)===normalize(current.pathname)&&(!target.hash||target.hash==='#campus'))link.setAttribute('aria-current','page');
});
