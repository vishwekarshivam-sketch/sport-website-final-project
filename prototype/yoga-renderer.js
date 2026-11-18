import { quality } from './render-policy.js';
/* Bounded planar reflection and screen-space contact shading, one renderer.
   Every pass is requested by native scroll/resize, never an idle animation loop. */
import * as T from './vendor/three.module.js';
export function createYogaRenderer(renderer,scene,keep){
 if(quality.lite){const material=keep(new T.MeshStandardMaterial({color:'#345b4a',metalness:.28,roughness:.25})),water=new T.Mesh(keep(new T.PlaneGeometry(5.05,8.2)),material);water.rotation.x=-Math.PI/2;water.position.set(9.1,-.245,.4);scene.add(water);return {resize(){},render(camera){renderer.render(scene,camera);return {calls:renderer.info.render.calls,triangles:renderer.info.render.triangles};},stats:{reflection:false,passes:1}};}

 const own=v=>keep(v),opts={type:renderer.extensions.has('EXT_color_buffer_float')?T.HalfFloatType:T.UnsignedByteType,minFilter:T.LinearFilter,magFilter:T.LinearFilter,depthBuffer:true};
 const reflection=own(new T.WebGLRenderTarget(1,1,opts)),target=own(new T.WebGLRenderTarget(1,1,opts));target.depthTexture=own(new T.DepthTexture(1,1,T.UnsignedIntType));reflection.samples=Math.min(2,renderer.capabilities.maxSamples);target.samples=Math.min(4,renderer.capabilities.maxSamples);
 const mirror=new T.PerspectiveCamera(),direction=new T.Vector3(),look=new T.Vector3(),matrix=new T.Matrix4(),bias=new T.Matrix4().set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),level=-.245;
 const waterUniforms={image:{value:reflection.texture},matrix:{value:matrix},eye:{value:new T.Vector3()},time:{value:0}};
 const waterMaterial=own(new T.ShaderMaterial({uniforms:waterUniforms,vertexShader:'uniform mat4 matrix;varying vec4 mirrorCoord;varying vec3 world;void main(){vec4 p=modelMatrix*vec4(position,1.);world=p.xyz;mirrorCoord=matrix*p;gl_Position=projectionMatrix*viewMatrix*p;}',fragmentShader:`uniform sampler2D image;uniform vec3 eye;uniform float time;varying vec4 mirrorCoord;varying vec3 world;
 void main(){vec2 p=world.xz;vec2 slope=vec2(cos(p.x*6.+p.y*1.4+time)*.018,cos(p.y*5.-p.x+time*.7)*.014);vec3 n=normalize(vec3(-slope.x,1.,-slope.y)),v=normalize(eye-world);float f=.035+.965*pow(1.-max(0.,dot(n,v)),5.);vec2 uv=clamp(mirrorCoord.xy/mirrorCoord.w+slope*.025,vec2(.002),vec2(.998));vec3 r=texture2D(image,uv).rgb;vec3 bed=vec3(.105,.18,.135);float rip=sin(p.x*14.+sin(p.y*8.)+time)*.008;vec3 col=mix(bed+ rip,r,clamp(.25+f*.72,0.,.97));gl_FragColor=vec4(col,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`}));
 const water=new T.Mesh(own(new T.PlaneGeometry(5.05,8.2)),waterMaterial);water.rotation.x=-Math.PI/2;water.position.set(9.1,level,.4);water.name='Bounded physically reflected courtyard water';scene.add(water);
 const uniforms={image:{value:target.texture},depth:{value:target.depthTexture},inverseProjection:{value:new T.Matrix4()},pixel:{value:new T.Vector2()}};
 const post=own(new T.ShaderMaterial({depthTest:false,depthWrite:false,uniforms,vertexShader:'varying vec2 v;void main(){v=uv;gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:`varying vec2 v;uniform sampler2D image,depth;uniform mat4 inverseProjection;uniform vec2 pixel;
 vec3 positionAt(vec2 uv){vec4 p=inverseProjection*vec4(uv*2.-1.,texture2D(depth,uv).x*2.-1.,1.);return p.xyz/p.w;}
 void main(){vec3 p=positionAt(v),normal=normalize(cross(dFdx(p),dFdy(p)));if(dot(normal,-p)<0.)normal=-normal;float occ=0.;float angle=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)*6.283;float radius=clamp(120./max(-p.z,.3),3.,28.);
 for(int i=0;i<16;i++){float a=float(i)*2.39996+angle;vec2 o=vec2(cos(a),sin(a))*pixel*radius*(.2+.8*float(i)/16.);vec3 diff=positionAt(clamp(v+o,vec2(.001),vec2(.999)))-p;float d=length(diff);occ+=max(0.,dot(normal,diff/max(d,.0001))-.12)*(1.-smoothstep(.015,.35,d));}
 vec3 col=texture2D(image,v).rgb*(1.-min(.28,occ*.08));col*=1.-smoothstep(.3,.85,length(v-.5))*.045;gl_FragColor=vec4(col,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`}));
 const postScene=new T.Scene(),postCamera=new T.OrthographicCamera(-1,1,1,-1,0,1);postScene.add(new T.Mesh(own(new T.PlaneGeometry(2,2)),post));
 const clip=[new T.Plane(new T.Vector3(0,1,0),-level-.005)];
 return {resize(w,h){const ratio=renderer.getPixelRatio(),rw=Math.round(w*ratio),rh=Math.round(h*ratio);target.setSize(rw,rh);const scale=Math.min(.6,900/w);reflection.setSize(Math.max(1,Math.round(w*scale)),Math.max(1,Math.round(h*scale)));uniforms.pixel.value.set(1/rw,1/rh);},render(camera,time=0){let calls=0,triangles=0;const account=()=>{calls+=renderer.info.render.calls;triangles+=renderer.info.render.triangles;};const current=renderer.getRenderTarget(),oldPlanes=renderer.clippingPlanes;waterUniforms.time.value=time;waterUniforms.eye.value.copy(camera.position);water.visible=false;mirror.copy(camera);mirror.position.y=2*level-camera.position.y;camera.getWorldDirection(direction);look.copy(camera.position).add(direction);look.y=2*level-look.y;mirror.up.set(0,-1,0);mirror.lookAt(look);mirror.updateMatrixWorld();matrix.copy(bias).multiply(mirror.projectionMatrix).multiply(mirror.matrixWorldInverse);renderer.clippingPlanes=clip;renderer.setRenderTarget(reflection);renderer.render(scene,mirror);account();renderer.clippingPlanes=oldPlanes;water.visible=true;renderer.setRenderTarget(target);renderer.render(scene,camera);account();uniforms.inverseProjection.value.copy(camera.projectionMatrixInverse);renderer.setRenderTarget(current);renderer.render(postScene,postCamera);account();return {calls,triangles};},stats:{reflection:true,reflectionMaxWidth:900,passes:3}};
}
