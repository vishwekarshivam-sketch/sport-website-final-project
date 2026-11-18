/* Detail-page adaptation of the homepage's wind-up → contact → flight grammar.
   Every pose is a function of native scroll, including the exact contact pose. */
export function createDetailFlight(T,assembly,slug){
 const {striker,projectile,surface,normal,radius}=assembly.userData.strike;
 const start=projectile.position.clone(),impact=new T.Vector3(),target=new T.Vector3(),axis=new T.Vector3(.65,1,.28).normalize();
 const hit=.26,clamp=x=>Math.max(0,Math.min(1,x)),ease=(a,b,p)=>{const t=clamp((p-a)/(b-a));return t*t*(3-2*t);};
 function swing(p){
  const wind=ease(0,.1,p),strike=ease(.1,hit,p),follow=ease(hit,.48,p);
  const low=slug==='cricket'||slug==='hockey',direction=low?1:-1;
  striker.rotation.set(.06*wind-.16*strike-.12*follow,-.3*wind+.54*strike+.38*follow,direction*(-.22*wind+.38*strike+.28*follow));
  striker.updateMatrix();
 }
 swing(hit);
 impact.copy(surface).addScaledVector(normal,radius).applyMatrix4(striker.matrix);
 swing(0);
 return {
  projectile,radius,hit,
  update(p,camera){
   swing(p);assembly.updateMatrixWorld(true);
   const incoming=ease(0,hit,p),flight=ease(hit,.7,p);
   if(p<=hit){
    projectile.position.lerpVectors(start,impact,incoming);
    // A small incoming arc resolves exactly at the shared strike point.
    projectile.position.y+=(slug==='hockey'?.025:.16)*Math.sin(incoming*Math.PI);
   }else{
    // Approach the viewer along a camera-space ray. The ball then owns the
    // photographic aperture, rather than zooming the bat/racket/stick assembly.
    target.set(0,0,.5).unproject(camera).sub(camera.position).normalize().multiplyScalar(1.35).add(camera.position);
    assembly.worldToLocal(target);
    projectile.position.lerpVectors(impact,target,flight);
    projectile.position.y+=.22*Math.sin(flight*Math.PI);
   }
   const growth=ease(.42,.7,p);projectile.scale.setScalar(1+(1.0/radius-1)*growth);
   projectile.quaternion.setFromAxisAngle(axis,Math.max(0,p-hit)*Math.PI*(slug==='cricket'?8:11));
   projectile.updateMatrixWorld(true);
   const currentSurface=surface.clone().addScaledVector(normal,radius).applyMatrix4(striker.matrix);
   return {phase:p<hit?'Approach':p<.42?'Strike':p<.7?'Flight':'Photograph',hit,contact:impact.toArray(),contactError:projectile.position.distanceTo(currentSurface),projectile:projectile.position.toArray(),scale:projectile.scale.x,strikerRotation:striker.rotation.toArray().slice(0,3)};
  }
 };
}
