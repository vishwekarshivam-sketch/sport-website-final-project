// Deterministic strike/contact/flight poses, driven entirely by scroll position.
export function createSportFlight(THREE, objects, id) {
  const {main, satellite, ballOnly} = objects;
  const projectile = ballOnly ? main : satellite;
  const baseScale = projectile.scale.clone();
  const spinAxis = new THREE.Vector3(.65,1,.28).normalize();
  const spinBase = new THREE.Quaternion().setFromEuler(new THREE.Euler(.25,.35,-.2));
  const spin = new THREE.Quaternion();
  const turnsPerSecond = {tennis:1.6,cricket:1.25,'table-tennis':2.2,football:.8,basketball:1.1,volleyball:.95};
  const clamp = v => Math.max(0,Math.min(1,v));
  const ease = (p,a,b) => {const t=clamp((p-a)/(b-a));return t*t*(3-2*t);};
  const mix = THREE.MathUtils.lerp;
  const hit = .26;
  const contact = new THREE.Vector3();
  const localContact = new THREE.Vector3(0,id==='cricket'?-.75:id==='badminton'?1.04:id==='table-tennis'?.65:.86,id==='cricket'?.245:id==='badminton'?.19:id==='table-tennis'?.27:.36);
  function equipment(p) {
    const swing=ease(p,.08,hit), follow=ease(p,hit,.47);
    main.rotation.set(.10, mix(-.6,.12,swing)+follow*.35, mix(id==='cricket'?-.52:-.8,id==='cricket'?.12:.2,swing)+follow*.55);
    main.position.set(-.35-follow*.35,-.05-follow*.12,0);
    main.updateMatrixWorld(true);
  }
  // Exact world-space contact point, shared by the incoming and outgoing paths.
  if (!ballOnly) {equipment(hit);contact.copy(localContact).applyMatrix4(main.matrixWorld);}
  else contact.set(0,0,0);
  return {
    projectile,
    update(p) {
      const launch=ballOnly?.12:hit;
      const t = Math.max(0,(p-launch)/(1-launch)) * 3.6;
      if(!ballOnly)equipment(p);
      projectile.visible=p<1;
      projectile.scale.copy(baseScale);
      if(p<launch&&!ballOnly){
        const incoming=ease(p,0,hit);
        projectile.position.set(mix(1.45,contact.x,incoming),mix(-.35,contact.y,incoming),mix(1.3,contact.z,incoming));
      }else{
        // Constant launch velocity plus a fixed gravity vector projected into
        // camera space: the arc approaches, crests, then falls away naturally.
        const vz=ballOnly?8:10;
        projectile.position.set(contact.x + .16*t,contact.y + .9*t - 1.4*t*t,contact.z + vz*t - 4*t*t);
      }
      if(id==='badminton')projectile.rotation.set(-.3-t*.5,.2,-.3);
      else {
        spin.setFromAxisAngle(spinAxis,t*Math.PI*2*(turnsPerSecond[id]||1));
        projectile.quaternion.copy(spinBase).multiply(spin);
      }
      return {launch,phase:p<launch?'Ready':t<1.25?'Launch':p<.995?'Away':'Gone',shadow:1-ease(p,launch,.52)};
    }
  };
}
