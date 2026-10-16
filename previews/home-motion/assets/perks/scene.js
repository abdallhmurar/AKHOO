import * as T from './vendor/three.module.js';

// Real geometry, local materials and procedural studio lighting. No model fetches.
function roundedBox(w,h,d,r=.07) {
  const s = new T.Shape(), x=-w/2+r, y=-h/2+r, width=w-2*r, height=h-2*r;
  s.moveTo(x,y); s.lineTo(x+width,y); s.lineTo(x+width,y+height); s.lineTo(x,y+height); s.closePath();
  const g = new T.ExtrudeGeometry(s,{depth:Math.max(.001,d-2*r),bevelEnabled:true,bevelThickness:r,bevelSize:r,bevelSegments:4,steps:1,curveSegments:8});
  g.translate(0,0,-(d-2*r)/2); g.computeVertexNormals(); return g;
}
function mesh(g,m,parent,x=0,y=0,z=0) { const obj=new T.Mesh(g,m); obj.position.set(x,y,z); parent.add(obj); return obj; }
function material(color,metalness=.25,roughness=.25) { return new T.MeshPhysicalMaterial({color,metalness,roughness,clearcoat:.8,clearcoatRoughness:.14,envMapIntensity:.65}); }
function starShape(radius,inner,points=5) {
  const s=new T.Shape();
  for(let i=0;i<points*2;i++){const a=i*Math.PI/points+Math.PI/2,r=i%2?inner:radius;const x=Math.cos(a)*r,y=Math.sin(a)*r;if(i===0)s.moveTo(x,y);else s.lineTo(x,y);}
  s.closePath(); return s;
}
function makeMedal() {
  const group=new T.Group(),metal=material('#ced8e2',.84,.22),face=material('#91a8b9',.76,.3),blue=material('#0054d5',.3,.23);
  for(const side of [-1,1]){const r=mesh(roundedBox(.36,1.15,.075,.025),blue,group,side*.29,.74,-.1);r.rotation.z=-side*.39;}
  const disc=mesh(new T.CylinderGeometry(.67,.67,.16,64),metal,group,0,-.08,0);disc.rotation.x=Math.PI/2;
  const inner=mesh(new T.CylinderGeometry(.575,.575,.03,64),face,group,0,-.08,.1);inner.rotation.x=Math.PI/2;
  mesh(new T.TorusGeometry(.60,.035,10,64),metal,group,0,-.08,.13);
  const g=new T.ExtrudeGeometry(starShape(.43,.20),{depth:.055,bevelEnabled:true,bevelThickness:.027,bevelSize:.027,bevelSegments:3,steps:1});
  mesh(g,metal,group,0,-.08,.13);
  return {group,update(time,pulse,animated){group.position.y=-.15;group.rotation.set(.07,(animated?Math.sin(time*.7)*.17:0)+pulse*Math.PI*2,-.08+(animated?Math.sin(time*.8)*.02:0));}};
}
function studioEnvironment(renderer) {
  const room=new T.Scene();room.background=new T.Color('#8495a8');
  for(const [x,y,z,w,h] of [[-3,2,3,2,5],[3,3,0,2,4],[0,5,-2,4,2]]){
    const panel=mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({color:new T.Color(3,3,3),side:T.DoubleSide}),room,x,y,z);panel.lookAt(0,0,0);
  }
  const gen=new T.PMREMGenerator(renderer),target=gen.fromScene(room,.05,.1,30,{size:128});
  gen.dispose();room.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});return target;
}
export function createMotion() {
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)'),items=[];
  const video=document.querySelector('#gift-video'),giftSlot=document.querySelector('#gift-scene');
  let preferenceWasReduced=reduced.matches,enabled=!reduced.matches,suspended=false,raf=0,last=0,time=0,disposed=false,giftVisible=true,videoFailed=false;
  const toggle=document.querySelector('#motion-toggle'),status=document.querySelector('#motion-status');
  function fallback(item){item.failed=true;item.slot.classList.remove('ready');item.renderer.dispose();updateToggle();sync();}
  const slot=document.querySelector('#medal-scene');let renderer,model,env;
  try {
    renderer=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
    renderer.setPixelRatio(Math.min(Math.max(window.devicePixelRatio||1,1.5),2));renderer.setClearColor(0,0);renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;
    const viewSize=2.6,scene=new T.Scene(),camera=new T.OrthographicCamera(-viewSize/2,viewSize/2,viewSize/2,-viewSize/2,.1,30);camera.position.set(0,1.05,7);camera.lookAt(0,.1,0);
    env=studioEnvironment(renderer);scene.environment=env.texture;scene.add(new T.HemisphereLight('#ecfaff','#466689',.9));
    for(const [x,y,z,intensity] of [[-3,4,5,2.6],[4,1,3,1.1],[0,4,-3,1.5]]){const light=new T.DirectionalLight('#ffffff',intensity);light.position.set(x,y,z);scene.add(light);}
    model=makeMedal();scene.add(model.group);const canvas=renderer.domElement;canvas.setAttribute('aria-hidden','true');slot.append(canvas);
    const item={slot,renderer,scene,camera,model,env,viewSize,visible:true,failed:false,pulse:0,remaining:0};items.push(item);
    canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();fallback(item);});
    const resize=()=>{if(item.failed||disposed)return;const {width,height}=slot.getBoundingClientRect();if(!width||!height)return;camera.left=-viewSize/2*width/height;camera.right=viewSize/2*width/height;camera.updateProjectionMatrix();renderer.setSize(width,height,false);render(item);};
    item.observer=new ResizeObserver(resize);item.observer.observe(slot);resize();slot.classList.add('ready');
  }catch(error){renderer?.dispose();env?.dispose();model?.group.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});slot.classList.remove('ready');slot.querySelector('canvas')?.remove();if(items[0])items[0].failed=true;console.warn('Medal 3D unavailable; using the static illustration.',error.message);}
  function render(item){if(item.failed)return;item.model.update(time,item.pulse,enabled&&!reduced.matches);item.renderer.render(item.scene,item.camera);}
  function canMove(){return !disposed&&enabled&&!reduced.matches&&!document.hidden&&!suspended;}
  function running(){return canMove()&&items.some(i=>i.visible&&!i.failed);}
  function videoShouldPlay(){return canMove()&&giftVisible&&!videoFailed;}
  function frame(now){raf=0;if(refreshPreference()){sync();return;}if(!running())return;const dt=last?Math.min((now-last)/1000,.05):0;if(last&&now-last<1000/30){raf=requestAnimationFrame(frame);return;}last=now;time+=dt;
    for(const item of items){if(item.failed||!item.visible)continue;if(item.remaining>0){item.remaining=Math.max(0,item.remaining-dt);item.pulse=item.remaining>0?1-item.remaining/1.5:0;}render(item);}raf=requestAnimationFrame(frame);
  }
  function sync(){if(raf)cancelAnimationFrame(raf);raf=0;last=0;refreshPreference();if(running())raf=requestAnimationFrame(frame);if(!videoShouldPlay())video.pause();else{video.muted=true;video.play().then(()=>{if(!videoShouldPlay())video.pause();}).catch(()=>{if(!videoFailed&&!disposed)document.querySelector('#gift-hint').textContent='المس لتشغيل الهدية';});}}
  function updateToggle(){const available=!videoFailed||items.some(i=>!i.failed);toggle.disabled=!available||reduced.matches;toggle.setAttribute('aria-pressed',String(enabled&&!reduced.matches&&available));toggle.querySelector('span').textContent=!available?'عرض ثابت':reduced.matches?'الحركة متوقفة حسب جهازك':enabled?'إيقاف الحركة':'تشغيل الحركة';toggle.querySelector('use').setAttribute('href',enabled?'#pause':'#play');const gift=document.querySelector('#gift-button'),canAnimate=enabled&&!reduced.matches&&!videoFailed;gift.disabled=!canAnimate;gift.setAttribute('aria-label',canAnimate?'إعادة حركة الهدية':'هدية مزايا أخو');document.querySelector('#gift-hint').textContent=canAnimate?'المس الهدية ✦':'كل مساعدة إلها قيمة';}
  function change(){enabled=!enabled;updateToggle();for(const item of items){item.remaining=0;item.pulse=0;render(item);}sync();}
  function refreshPreference(){if(disposed||preferenceWasReduced===reduced.matches)return false;preferenceWasReduced=reduced.matches;enabled=!preferenceWasReduced;if(preferenceWasReduced){video.pause();if(video.readyState>0)video.currentTime=0;}for(const item of items){item.remaining=0;item.pulse=0;render(item);}updateToggle();return true;}
  function mediaReady(){giftSlot.classList.add('ready');updateToggle();sync();}
  function mediaError(){videoFailed=true;video.pause();giftSlot.classList.remove('ready');updateToggle();sync();}
  video.addEventListener('loadeddata',mediaReady);video.addEventListener('error',mediaError);
  if(video.readyState>=2)giftSlot.classList.add('ready');
  if(video.error)videoFailed=true;
  toggle.addEventListener('click',change);reduced.addEventListener('change',sync);document.addEventListener('visibilitychange',sync);window.addEventListener('focus',sync);window.addEventListener('resize',sync);
  const intersection=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.target===giftSlot)giftVisible=entry.isIntersecting;else{const item=items.find(i=>i.slot===entry.target);if(item)item.visible=entry.isIntersecting;}}sync();});items.forEach(i=>intersection.observe(i.slot));intersection.observe(giftSlot);
  updateToggle();sync();
  return {
    play(kind){if(!enabled||reduced.matches)return false;if(kind==='gift'){if(videoFailed)return false;video.currentTime=0;status.textContent='حركة الهدية من البداية';sync();return true;}const item=items.find(i=>!i.failed);if(!item)return false;item.remaining=1.5;item.pulse=0;sync();return true;},
    suspend(value){suspended=value;sync();},
    dispose(){disposed=true;sync();intersection.disconnect();video.removeEventListener('loadeddata',mediaReady);video.removeEventListener('error',mediaError);toggle.removeEventListener('click',change);reduced.removeEventListener('change',sync);document.removeEventListener('visibilitychange',sync);window.removeEventListener('focus',sync);window.removeEventListener('resize',sync);items.forEach(i=>{i.observer?.disconnect();i.renderer.dispose();i.env.dispose();i.model.group.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});});}
  };
}
