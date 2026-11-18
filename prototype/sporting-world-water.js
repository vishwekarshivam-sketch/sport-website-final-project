import { quality } from './render-policy.js';
/* Original planar reflection/refraction water, using the local Three.js r180.
   Targets are bounded independently of the device's pixel ratio. */
import * as T from './vendor/three.module.js';

export function createWater(renderer, scene, compact) {
  if(quality.lite){
    const uniforms={time:{value:0}},material=new T.MeshStandardMaterial({color:'#397b72',metalness:.35,roughness:.24,transparent:true,opacity:.87,side:T.DoubleSide});
    material.onBeforeCompile=shader=>{shader.uniforms.time=uniforms.time;shader.vertexShader='uniform float time;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed.z+=sin(position.x*.7+time)*.025+sin(position.y*.9-time*.8)*.018;');};
    const water=new T.Mesh(new T.PlaneGeometry(60,65,24,28),material);water.rotation.x=-Math.PI/2;water.position.set(0,0,30.5);scene.add(water);
    return {water,uniforms,disturb(){},get interaction(){return {emitted:0,active:0,last:null};},resize(){},render(camera,time){uniforms.time.value=time;renderer.render(scene,camera);},dispose(){scene.remove(water);water.geometry.dispose();material.dispose();}};
  }
  const options={type:T.HalfFloatType,minFilter:T.LinearFilter,magFilter:T.LinearFilter,depthBuffer:true};
  const reflection=new T.WebGLRenderTarget(1,1,options);
  const refraction=new T.WebGLRenderTarget(1,1,options);
  refraction.depthTexture=new T.DepthTexture(1,1,T.UnsignedIntType);
  const compositeTarget=new T.WebGLRenderTarget(1,1,options);
  compositeTarget.depthTexture=new T.DepthTexture(1,1,T.UnsignedIntType);
  compositeTarget.samples=Math.min(4,renderer.capabilities.maxSamples);
  const compositeUniforms={image:{value:compositeTarget.texture},depth:{value:compositeTarget.depthTexture},inverseProjection:{value:new T.Matrix4()},pixel:{value:new T.Vector2()},submerged:{value:0},time:{value:0}};
  const compositeMaterial=new T.ShaderMaterial({depthTest:false,depthWrite:false,uniforms:compositeUniforms,
    vertexShader:`varying vec2 uvScreen;void main(){uvScreen=uv;gl_Position=vec4(position.xy,0.,1.);}`,
    fragmentShader:`
      varying vec2 uvScreen;uniform sampler2D image,depth;uniform mat4 inverseProjection;uniform vec2 pixel;uniform float submerged,time;
      vec3 viewPosition(vec2 uv){float d=texture2D(depth,uv).x;vec4 p=inverseProjection*vec4(uv*2.-1.,d*2.-1.,1.);return p.xyz/p.w;}
      void main(){
        vec2 uv=uvScreen;
        uv+=submerged*vec2(sin(uv.y*13.+time*.7),sin(uv.x*14.-time*.6))*.0015;
        vec3 p=viewPosition(uv),normal=normalize(cross(dFdx(p),dFdy(p)));
        if(dot(normal,-p)<0.)normal=-normal;
        float occ=0.;float angle=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)*6.283;
        float radius=clamp(350./max(-p.z,1.),3.,22.);
        for(int i=0;i<12;i++){
          float a=float(i)*2.39996+angle;
          vec2 offset=vec2(cos(a),sin(a))*pixel*radius*(.35+.65*float(i)/12.);
          vec3 diff=viewPosition(clamp(uv+offset,vec2(.001),vec2(.999)))-p;
          float dist=length(diff);
          occ+=max(0.,dot(normal,diff/max(dist,.0001))-.12)*(1.-smoothstep(.02,.8,dist));
        }
        vec3 colour=texture2D(image,uv).rgb;
        colour*=1.-min(.30,occ*.11);
        float vignette=smoothstep(.28,.85,length(uv-.5));
        colour*=1.-vignette*(.025+.10*submerged);
        gl_FragColor=vec4(colour,1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`});
  const compositeScene=new T.Scene(),compositeCamera=new T.OrthographicCamera(-1,1,1,-1,0,1);
  const quad=new T.Mesh(new T.PlaneGeometry(2,2),compositeMaterial);compositeScene.add(quad);
  const mirrorCamera=new T.PerspectiveCamera(),textureMatrix=new T.Matrix4();
  const bias=new T.Matrix4().set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1);
  const clipping=[new T.Plane(new T.Vector3(0,1,0),.06)];
  // A fixed-size impulse pool keeps cursor wakes bounded, even after long visits.
  const ripples=Array.from({length:12},()=>new T.Vector4(0,0,-100,0));
  let rippleIndex=0,rippleCount=0;
  const rippleShader=`
    uniform vec4 ripples[12];
    // Height and analytic XZ slope of a travelling, damped wave packet.
    vec3 cursorWave(vec2 p){
      vec3 wave=vec3(0.);
      for(int i=0;i<12;i++){
        float age=time-ripples[i].z;
        if(age<0.||age>2.8)continue;
        vec2 delta=p-ripples[i].xy;float d=length(delta);
        float front=d-age*2.6;
        float envelope=exp(-front*front*2.2)*exp(-age*1.05)*smoothstep(0.,.12,age)*(1.-smoothstep(2.3,2.8,age));
        float strength=ripples[i].w*envelope;
        float height=sin(front*7.5)*strength;
        float slope=(7.5*cos(front*7.5)-4.4*front*sin(front*7.5))*strength;
        wave+=vec3(height,delta/max(d,.001)*slope);
      }
      return wave;
    }`;
  const uniforms={
    reflection:{value:reflection.texture},refraction:{value:refraction.texture},depthMap:{value:refraction.depthTexture},
    textureMatrix:{value:textureMatrix},time:{value:0},eye:{value:new T.Vector3()},near:{value:.1},far:{value:250},
    resolution:{value:new T.Vector2(1,1)},sun:{value:new T.Vector3(-16,18,5).normalize()},ripples:{value:ripples},
  };
  const waterMaterial=new T.ShaderMaterial({uniforms,side:T.DoubleSide,vertexShader:`
    uniform mat4 textureMatrix;uniform float time;varying vec4 mirrorCoord;varying vec4 screenCoord;varying vec3 worldPosition;varying float viewDepth;
    ${rippleShader}
    void main(){vec3 p=position;
      p.z+=sin(p.x*1.7+time*.75)*.013+sin(p.y*2.1-time*.6)*.009;
      p.z+=cursorWave((modelMatrix*vec4(position,1.)).xz).x*.35;
      vec4 world=modelMatrix*vec4(p,1.);worldPosition=world.xyz;mirrorCoord=textureMatrix*world;
      vec4 view=modelViewMatrix*vec4(p,1.);viewDepth=-view.z;gl_Position=projectionMatrix*view;screenCoord=gl_Position;
    }`,fragmentShader:`
    uniform sampler2D reflection,refraction,depthMap;uniform float time,near,far;uniform vec3 eye,sun;uniform vec2 resolution;
    varying vec4 mirrorCoord,screenCoord;varying vec3 worldPosition;varying float viewDepth;
    ${rippleShader}
    float linearDepth(float z){return near*far/(far-z*(far-near));}
    float wave(vec2 p){
      float w=sin(p.x*1.7+p.y*.7+time*.85)*.028;
      w+=sin(p.y*2.6-p.x*.4-time*.65)*.02;
      w+=sin(p.x*4.8+p.y*3.2+time*1.1)*.008;
      w+=sin(p.x*8.-p.y*6.4-time*.85)*.003;
      w+=sin(p.x*.63-p.y*1.36+time*.37)*.034;
      w+=sin(p.x*3.3-p.y*2.7+sin(p.x*.8+time*.2))* .007;
      vec2 ring=p-vec2(-4.4,9.3);float d=length(ring);
      w+=sin(d*15.-time*1.5)*.012*exp(-abs(d-1.85)*1.4);
      return w;
    }
    void main(){vec2 p=worldPosition.xz;float e=.035;
      vec2 slope=vec2((wave(p+vec2(e,0))-wave(p-vec2(e,0)))/(2.*e),(wave(p+vec2(0,e))-wave(p-vec2(0,e)))/(2.*e));
      slope+=cursorWave(p).yz;
      vec3 n=normalize(vec3(-slope.x,1.,-slope.y));
      vec3 view=normalize(eye-worldPosition);float above=step(0.,eye.y);vec3 normal=n*mix(-1.,1.,above);
      vec2 distortion=n.xz*.035;vec2 suv=screenCoord.xy/screenCoord.w*.5+.5;
      vec2 ruv=mirrorCoord.xy/mirrorCoord.w;ruv=clamp(ruv+distortion,vec2(.002),vec2(.998));
      vec3 reflected=texture2D(reflection,ruv).rgb;
      vec2 refractUV=clamp(suv+distortion*.5,vec2(.002),vec2(.998));
      float depth=max(0.,linearDepth(texture2D(depthMap,refractUV).r)-viewDepth);
      vec3 transmitted=texture2D(refraction,refractUV).rgb;
      vec3 absorption=exp(-vec3(.44,.15,.10)*min(depth,25.));
      vec3 deep=vec3(.012,.085,.07);transmitted=transmitted*absorption+deep*(1.-absorption);
      float fresnel=.025+.975*pow(1.-max(dot(view,normal),0.),5.);
      vec3 col=mix(transmitted,reflected,clamp(fresnel*.94+.10,0.,.96));
      float spec=pow(max(dot(reflect(-sun,n),view),0.),200.);
      col+=vec3(1.,.73,.39)*spec*2.8;
      float shore=(1.-smoothstep(.02,.24,depth))*.07;col+=vec3(.85,.91,.77)*shore;
      if(above<.5){col=mix(transmitted,reflected,.3);col=mix(col,vec3(.06,.32,.29),.27);}
      gl_FragColor=vec4(col,1.);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`});
  const water=new T.Mesh(new T.PlaneGeometry(60,65,110,120),waterMaterial);
  water.rotation.x=-Math.PI/2;water.position.set(0,0,30.5);water.name='Reflective pool surface';scene.add(water);
  const direction=new T.Vector3(),target=new T.Vector3();
  return {water,uniforms,
    disturb(x,z,time,strength=.055){ripples[rippleIndex].set(x,z,time,strength);rippleIndex=(rippleIndex+1)%ripples.length;rippleCount++;},
    get interaction(){return {emitted:rippleCount,active:ripples.filter(r=>uniforms.time.value-r.z<2.8).length,last:rippleCount?ripples[(rippleIndex+ripples.length-1)%ripples.length].toArray():null};},
    resize(width,height){
      const scale=Math.min(compact?.6:.72,1120/width);
      const w=Math.max(1,Math.round(width*scale)),h=Math.max(1,Math.round(height*scale));
      reflection.setSize(w,h);refraction.setSize(w,h);uniforms.resolution.value.set(width,height);
      const dpr=renderer.getPixelRatio();compositeTarget.setSize(Math.round(width*dpr),Math.round(height*dpr));compositeUniforms.pixel.value.set(1/compositeTarget.width,1/compositeTarget.height);
    },
    render(camera,time){
      uniforms.time.value=time;uniforms.eye.value.copy(camera.position);uniforms.near.value=camera.near;uniforms.far.value=camera.far;
      const current=renderer.getRenderTarget(),shadowUpdate=renderer.shadowMap.autoUpdate;
      water.visible=false;
      // Refraction uses the actual submerged basin, not a coloured background.
      renderer.setRenderTarget(refraction);renderer.render(scene,camera);
      renderer.shadowMap.autoUpdate=false;
      mirrorCamera.copy(camera);mirrorCamera.position.y=-camera.position.y;
      camera.getWorldDirection(direction);target.copy(camera.position).add(direction);target.y=-target.y;
      mirrorCamera.up.set(0,-1,0);mirrorCamera.lookAt(target);mirrorCamera.updateMatrixWorld();
      textureMatrix.copy(bias).multiply(mirrorCamera.projectionMatrix).multiply(mirrorCamera.matrixWorldInverse);
      clipping[0].normal.y=camera.position.y<0?-1:1;
      const oldClipping=renderer.clippingPlanes;renderer.clippingPlanes=clipping;
      renderer.setRenderTarget(reflection);renderer.render(scene,mirrorCamera);
      renderer.clippingPlanes=oldClipping;water.visible=true;
      renderer.setRenderTarget(compositeTarget);renderer.render(scene,camera);
      compositeUniforms.inverseProjection.value.copy(camera.projectionMatrixInverse);
      compositeUniforms.submerged.value=T.MathUtils.smoothstep(-camera.position.y,-.02,.65);compositeUniforms.time.value=time;
      renderer.setRenderTarget(current);renderer.render(compositeScene,compositeCamera);renderer.shadowMap.autoUpdate=shadowUpdate;
    },
    dispose(){scene.remove(water);water.geometry.dispose();waterMaterial.dispose();reflection.dispose();refraction.dispose();compositeTarget.dispose();compositeMaterial.dispose();quad.geometry.dispose();}
  };
}
