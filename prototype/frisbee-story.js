/* SI-unit quasi-steady disc aerodynamics, fixed 1/240 s integration.
   Lift/drag: Morrison (2005), after Hummel. See rebuild/PHYSICS.md.
   Scroll samples one continuous throw; reading intervals pause simulation time. */
export const PARAMETERS={mass:.175,radius:.1345,area:.0568,rho:1.23,gravity:9.81,CL0:.1,CLa:1.4,CD0:.08,CDa:2.72,alpha0:-4*Math.PI/180,dt:1/240};
const add=(a,b,s=1)=>a.map((v,i)=>v+s*b[i]),dot=(a,b)=>a.reduce((v,x,i)=>v+x*b[i],0),len=a=>Math.hypot(...a),norm=a=>a.map(v=>v/Math.max(1e-9,len(a))),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export const smoother=x=>{x=Math.max(0,Math.min(1,x));return x*x*x*(x*(x*6-15)+10);};
export function aerodynamicForces(velocity,normal,options={}){
 const p={...PARAMETERS,...options},speed=len(velocity),direction=norm(velocity),alpha=Math.max(-.45,Math.min(.6,-Math.asin(Math.max(-1,Math.min(1,dot(direction,normal)))))),q=.5*p.rho*speed*speed*p.area;
 const cl=p.CL0+p.CLa*alpha,cd=p.CD0+p.CDa*(alpha-p.alpha0)**2,liftDirection=norm(add(normal,direction,-dot(normal,direction))),lift=liftDirection.map(v=>v*q*cl),drag=direction.map(v=>-v*q*cd);
 return {alpha,cl,cd,lift,drag,acceleration:add(add(lift,drag).map(v=>v/p.mass),[0,-p.gravity,0]),speed,q};
}
export function simulateThrow(options={}){
 const p={...PARAMETERS,...options},I=.5*p.mass*p.radius*p.radius;
 let position=[0,1.45,20],velocity=options.velocity||[.6,1.4,-15.5],normal=norm(options.normal||[-.04,.979,.2]),omega=54,spin=0,time=0;
 const samples=[];let impact=-1;
 for(let k=0;k<240*9;k++){
  const forces=aerodynamicForces(velocity,normal,p);samples.push({time,position:[...position],velocity:[...velocity],normal:[...normal],omega,spin,alpha:forces.alpha,lift:forces.lift,drag:forces.drag});
  // Midpoint integration avoids the large trajectory error of frame-time Euler.
  const midVelocity=add(velocity,forces.acceleration,p.dt/2),midForces=aerodynamicForces(midVelocity,normal,p);
  position=add(position,midVelocity,p.dt);velocity=add(velocity,midForces.acceleration,p.dt);
  // Small pitching moment changes angular-momentum direction. High spin resists
  // reorientation; this simplified gyroscope omits wobble/full rigid-body dynamics.
  const moment=forces.q*(p.radius*2)*(-.012+.05*forces.alpha),axis=norm(cross(norm(velocity),normal));
  normal=norm(add(normal,axis,moment/Math.max(.012,I*omega)*p.dt));
  omega*=Math.exp(-.035*p.dt);spin+=omega*p.dt;time+=p.dt;
  const contactHeight=.014+p.radius*Math.hypot(normal[0],normal[2]);
  if(position[1]<=contactHeight){position[1]=contactHeight;impact=time;break;}
 }
 const impactVelocity=[...velocity],impactNormal=[...normal],impactOmega=omega,impactSpin=spin,start=[...position];
 // Dissipative ground phase: small bounce, frictional slide and settling tilt.
 for(let k=0;k<=240;k++){
  const t=k/240,decay=Math.exp(-7*t),normalGround=norm([impactNormal[0]*decay,1,impactNormal[2]*decay]),positionGround=[start[0]+impactVelocity[0]*(1-Math.exp(-6*t))/6,.014+p.radius*Math.hypot(normalGround[0],normalGround[2])+Math.max(0,-impactVelocity[1])*.035*Math.exp(-9*t)*Math.abs(Math.sin(18*t)),start[2]+impactVelocity[2]*(1-Math.exp(-6*t))/6];
  samples.push({time:time+t,position:positionGround,velocity:[impactVelocity[0]*Math.exp(-6*t),0,impactVelocity[2]*Math.exp(-6*t)],normal:normalGround,omega:impactOmega*decay,spin:impactSpin+impactOmega*(1-decay)/7,alpha:0,lift:[0,0,0],drag:[0,0,0],grounded:true});
 }
 return {samples,impactTime:impact,duration:samples.at(-1).time};
}
export const THROW=simulateThrow();
const timeStops=[0,.12,.27,.43,.60,.77,.92].map(x=>x*THROW.impactTime).concat(THROW.duration);
export function flightPose(cursor){
 cursor=Math.max(0,Math.min(7,cursor));const segment=Math.min(6,Math.floor(cursor)),progress=cursor-segment,time=timeStops[segment]+(timeStops[segment+1]-timeStops[segment])*progress;
 let low=0,high=THROW.samples.length-1;while(low<high){const mid=(low+high)>>1;if(THROW.samples[mid].time<time)low=mid+1;else high=mid;}
 const b=THROW.samples[low],a=THROW.samples[Math.max(0,low-1)],t=(time-a.time)/Math.max(1e-9,b.time-a.time),mix=k=>a[k].map((v,i)=>v+(b[k][i]-v)*t);
 const normal=norm(mix('normal'));return {position:mix('position'),velocity:mix('velocity'),normal,spin:a.spin+(b.spin-a.spin)*t,omega:a.omega+(b.omega-a.omega)*t,alpha:a.alpha+(b.alpha-a.alpha)*t,bank:Math.atan2(-normal[0],normal[1]),pitch:Math.atan2(normal[2],normal[1]),segment,progress,time,grounded:!!b.grounded,landed:cursor===7};
}
export const STOPS=timeStops.map((_,i)=>flightPose(i).position);
