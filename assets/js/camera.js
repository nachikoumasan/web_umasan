'use strict';
const $ = selector => document.querySelector(selector);
const canvas=$('#camera-canvas'),ctx=canvas.getContext('2d'),video=$('#camera-video'),app=$('.camera-app');
const poseData=[
 ['front','いつものうまさん','../media/camera-pose-front.png'],
 ['wave','こんにちは','../media/camera-pose-wave.png'],
 ['sit','ひとやすみ','../media/camera-pose-sit.png'],
 ['side','おさんぽ','../media/camera-pose-side.png'],
 ['lantern','見つけた！','../media/camera-pose-lantern.png'],
 ['back','振り返って','../media/camera-pose-back.png']
];
let stream=null,source=null,facing='environment',phase='idle',animation=0,photoUrl=null,busy=false;
let cameraZoom=1,sourceRequest=0,posesVisible=false,selectedId=null,nextStampId=0,loadingStamps=0;
const stamps=[],poseImages=new Map(),pointers=new Map();
let gesture=null,handleGesture=null;
const photoSave=UmasanImageSave.bind($('#save'),{image:$('#camera-review'),message:$('#save-help'),mode:'auto',readyMessage:'',downloadMessage:''});
UmasanCameraShare.bind($('#share'),{url:$('link[rel="canonical"]').href});
const status=(text,error=false)=>{$('#camera-status').textContent=text;app.classList.toggle('has-camera-error',error);};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const selectedStamp=()=>stamps.find(s=>s.id===selectedId);
const editable=()=>phase==='edit'&&!busy&&!app.classList.contains('is-immersive');
const angle=n=>((n+180)%360+360)%360-180;
function closePanels(){posesVisible=false;}
function updateUI(){
 const editing=phase==='edit',review=phase==='review';
 app.classList.toggle('is-editing',editing);app.classList.toggle('is-review',review);
 $('.capture-row').hidden=!source;$('#camera-welcome').hidden=!!source;
 $('.capture-row .photo-label').hidden=review;
 canvas.hidden=!source||review;$('#camera-review').hidden=!review;
 $('#pose-list').hidden=!editing||!posesVisible;
 $('#poses-toggle').hidden=!editing;$('#poses-toggle').disabled=busy;
 $('#poses-toggle').setAttribute('aria-expanded',String(posesVisible));
 $('#start').disabled=busy;$('#capture').hidden=review;$('#capture').disabled=!editing||busy||loadingStamps>0;
 $('#flip').disabled=!editing||busy;$('#view-only').disabled=!editing||busy;
 $('#flip').setAttribute('aria-label',source&&source!==video?'カメラへ切り替える':'前後のカメラを切り替える');
 $('#retake').hidden=!review;$('#save').hidden=!review;$('#share').hidden=!review;$('#save-help').hidden=!review;
 updateSelection();
}
function stopStream(){if(stream)stream.getTracks().forEach(t=>t.stop());stream=null;}
const videoHasFrame=()=>video.readyState>=2&&video.videoWidth>0&&video.videoHeight>0;
function playCamera(request){
 return new Promise((resolve,reject)=>{
  let elapsed=0,settled=false;
  const finish=error=>{if(settled)return;settled=true;clearInterval(timer);error?reject(error):resolve();};
  const check=()=>{
   if(request!==sourceRequest)return finish();
   if(videoHasFrame()&&!video.paused)return finish();
   if(!document.hidden)elapsed+=100;
   if(elapsed>=12000)finish(Object.assign(new Error('Camera frame unavailable'),{name:'CameraPreviewTimeout'}));
  };
  const timer=setInterval(check,100);
  video.muted=true;video.playsInline=true;
  try{Promise.resolve(video.play()).then(check,finish);}catch(error){finish(error);}
 });
}
function frameSize(){
 const w=source===video?video.videoWidth:source.naturalWidth,h=source===video?video.videoHeight:source.naturalHeight;
 if(source===video){const r=$('.camera-stage').getBoundingClientRect(),aspect=r.width/Math.max(1,r.height);
 return w/h>aspect?{width:Math.round(h*aspect),height:h}:{width:w,height:Math.round(w/aspect)};}
 const ratio=Math.min(1,4096/Math.max(w,h));return {width:Math.round(w*ratio),height:Math.round(h*ratio)};
}
function stampSize(s){const w=Math.min(canvas.width,canvas.height)*s.size;return {w,h:w*s.image.naturalHeight/s.image.naturalWidth};}
// Shared contain mapping keeps imported photos, hit testing, and handles aligned.
function displayFrame(){const r=canvas.getBoundingClientRect(),scale=Math.min(r.width/canvas.width,r.height/canvas.height);
 return {left:r.left+(r.width-canvas.width*scale)/2,top:r.top+(r.height-canvas.height*scale)/2,width:canvas.width*scale,height:canvas.height*scale,scale};}
function point(e){const r=displayFrame();return {x:(e.clientX-r.left)/r.width,y:(e.clientY-r.top)/r.height};}
function updateSelection(){
 const s=selectedStamp(),box=$('#stamp-selection');box.hidden=!s||!editable()||!source;
 if(box.hidden)return;
 const r=displayFrame(),stage=$('.camera-stage').getBoundingClientRect(),{w,h}=stampSize(s);
 Object.assign(box.style,{left:(r.left-stage.left+s.x*r.width)+'px',top:(r.top-stage.top+s.y*r.height)+'px',width:w*r.scale+'px',height:h*r.scale+'px',transform:`translate(-50%,-50%) rotate(${s.rotation}deg)`});
 $('#stamp-mirror').setAttribute('aria-pressed',String(s.mirror));
}
function draw(){
 if(!source||(phase!=='edit'&&phase!=='capturing'))return false;
 if(source===video&&!videoHasFrame())return false;
 const size=frameSize();if(!size.width||!size.height)return false;
 if(canvas.width!==size.width||canvas.height!==size.height){canvas.width=size.width;canvas.height=size.height;}
 ctx.clearRect(0,0,canvas.width,canvas.height);
 if(source===video){const scale=Math.max(canvas.width/video.videoWidth,canvas.height/video.videoHeight)*cameraZoom,sw=canvas.width/scale,sh=canvas.height/scale;
 ctx.drawImage(video,(video.videoWidth-sw)/2,(video.videoHeight-sh)/2,sw,sh,0,0,canvas.width,canvas.height);
 }else ctx.drawImage(source,0,0,canvas.width,canvas.height);
 for(const s of stamps){const {w,h}=stampSize(s);ctx.save();ctx.translate(s.x*canvas.width,s.y*canvas.height);ctx.rotate(s.rotation*Math.PI/180);ctx.scale(s.mirror?-1:1,1);ctx.drawImage(s.image,-w/2,-h/2,w,h);ctx.restore();}
 // Selection handles are DOM overlays and never enter the saved image.
 updateSelection();
 return true;
}
function animate(){cancelAnimationFrame(animation);function tick(){animation=requestAnimationFrame(tick);if(phase==='edit'){try{draw();}catch(error){status('映像を描画できませんでした。カメラ切替ボタンで再起動してください。('+error.name+')',true);}}}animation=requestAnimationFrame(tick);}
function ready(){photoSave.clear();phase='edit';draw();updateUI();animate();status('＋でうまさんを追加。タップで選択、右下のハンドルで拡大・回転。背景は2本指でズーム。');}
async function startCamera(){
 if(busy)return;const request=++sourceRequest;let stage='permission';busy=true;updateUI();status('カメラを準備しています…');
 try{
 if(!navigator.mediaDevices?.getUserMedia)throw new Error('unsupported');stopStream();
 const nextStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:facing},width:{ideal:1920},resizeMode:{ideal:'none'}},audio:false});
 if(request!==sourceRequest){nextStream.getTracks().forEach(t=>t.stop());return;}
 stream=nextStream;stage='playback';status('カメラは接続できました。映像を読み込んでいます…');video.srcObject=stream;await playCamera(request);if(request!==sourceRequest)return;
 source=video;cameraZoom=1;ready();
 }catch(error){if(request!==sourceRequest)return;stopStream();if(source===video){source=null;phase='idle';}
 const messages={NotAllowedError:'ブラウザまたはOSがカメラへのアクセスを拒否しました。',NotFoundError:'使用できるカメラが見つかりません。',NotReadableError:'カメラから映像を取得できません。他のカメラ使用アプリを閉じて再試行してください。'};
 status(stage==='playback'?'カメラの接続後、映像の再生を開始できませんでした。カメラを再起動してください。('+error.name+')':(messages[error.name]||'カメラを起動できませんでした。('+error.name+')'),true);
 }finally{if(request===sourceRequest){busy=false;updateUI();}}
}
function setImmersive(active){app.classList.toggle('is-immersive',active);$('.camera-header').inert=active;$('.camera-tools').inert=active;$('#view-only').setAttribute('aria-pressed',String(active));closePanels();clearGestures();updateUI();if(active)canvas.focus();else $('#view-only').focus();}
$('#view-only').addEventListener('click',()=>{if(source)setImmersive(true);});
$('.camera-stage').addEventListener('click',()=>{if(app.classList.contains('is-immersive'))setImmersive(false);});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){selectedId=null;setImmersive(false);}});
$('#start').addEventListener('click',startCamera);
$('#poses-toggle').addEventListener('click',()=>{posesVisible=!posesVisible;updateUI();});
document.querySelectorAll('.photo-label').forEach(label=>{label.tabIndex=0;label.setAttribute('role','button');label.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();$('#photo-input').click();}});});
$('#flip').addEventListener('click',()=>{if(source===video)facing=facing==='environment'?'user':'environment';startCamera();});
$('#photo-input').addEventListener('change',async event=>{
 const file=event.target.files[0];if(!file||phase==='capturing')return;const request=++sourceRequest,nextUrl=URL.createObjectURL(file),image=new Image();image.src=nextUrl;
 try{await image.decode();if(request!==sourceRequest){URL.revokeObjectURL(nextUrl);return;}busy=false;stopStream();if(photoUrl)URL.revokeObjectURL(photoUrl);photoUrl=nextUrl;source=image;closePanels();clearGestures();ready();}
 catch{URL.revokeObjectURL(nextUrl);if(request===sourceRequest){busy=false;updateUI();status('この写真を読み込めませんでした。JPEG・PNGなどの画像を選んでください。');}}event.target.value='';
});
poseData.forEach(([id,label,src])=>{const b=document.createElement('button');b.type='button';b.dataset.pose=id;b.setAttribute('aria-label',label+'を追加');const img=document.createElement('img');img.src=src;img.alt='';b.append(img);b.addEventListener('click',()=>{if(editable())addStamp(id);});$('#pose-list').append(b);});
async function addStamp(id,select=true){
 const row=poseData.find(p=>p[0]===id);loadingStamps++;closePanels();updateUI();
 try{
 if(!poseImages.has(id)){const image=new Image();image.src=row[2];poseImages.set(id,image.decode().then(()=>image).catch(error=>{poseImages.delete(id);throw error;}));}
 const image=await poseImages.get(id),offset=(nextStampId%5)*.045;
 const s={id:++nextStampId,pose:id,image,x:.42+offset,y:.44+offset,size:.32,rotation:0,mirror:false};stamps.push(s);
 if(select){selectedId=s.id;canvas.focus();}draw();if(source&&select)status(row[1]+'を追加しました。タップで選択、右下のハンドルで拡大・回転できます。');
 }catch{status('うまさんを読み込めませんでした。もう一度ポーズを選んでください。');}
 finally{loadingStamps--;updateUI();}
}
function hitStamp(p){
 for(let i=stamps.length-1;i>=0;i--){const s=stamps[i],{w,h}=stampSize(s),dx=(p.x-s.x)*canvas.width,dy=(p.y-s.y)*canvas.height,a=s.rotation*Math.PI/180;
 if(Math.abs(dx*Math.cos(a)+dy*Math.sin(a))<=w/2&&Math.abs(-dx*Math.sin(a)+dy*Math.cos(a))<=h/2)return s;}
 return null;
}
function clearGestures(){pointers.clear();gesture=null;handleGesture=null;}
function beginGesture(targetId){const pts=[...pointers.values()],s=stamps.find(s=>s.id===targetId);gesture={pts,targetId,zoom:cameraZoom,initial:s?{x:s.x,y:s.y,size:s.size,rotation:s.rotation}:null};}
canvas.addEventListener('pointerdown',e=>{
 if(!editable()||handleGesture||pointers.size>=2)return;
 canvas.setPointerCapture(e.pointerId);const p=point(e);
 if(!pointers.size){const hit=hitStamp(p);selectedId=hit?.id??null;closePanels();pointers.set(e.pointerId,p);beginGesture(selectedId);updateUI();}
 else{pointers.set(e.pointerId,p);beginGesture(gesture.targetId);}
});
canvas.addEventListener('pointermove',e=>{
 if(!editable()||!pointers.has(e.pointerId)||!gesture)return;pointers.set(e.pointerId,point(e));const pts=[...pointers.values()],s=stamps.find(s=>s.id===gesture.targetId),initial=gesture.initial;
 if(pts.length===1&&s){s.x=clamp(initial.x+pts[0].x-gesture.pts[0].x,0,1);s.y=clamp(initial.y+pts[0].y-gesture.pts[0].y,0,1);}
 else if(pts.length===2&&gesture.pts.length===2){
 const vector=arr=>({x:(arr[1].x-arr[0].x)*canvas.width,y:(arr[1].y-arr[0].y)*canvas.height}),a=vector(gesture.pts),b=vector(pts),scale=Math.hypot(b.x,b.y)/Math.max(1,Math.hypot(a.x,a.y));
 if(s){s.size=clamp(initial.size*scale,.08,1.5);s.rotation=angle(initial.rotation+(Math.atan2(b.y,b.x)-Math.atan2(a.y,a.x))*180/Math.PI);}
 else if(source===video)cameraZoom=clamp(gesture.zoom*scale,1,4);
 }draw();
});
['pointerup','pointercancel','lostpointercapture'].forEach(type=>canvas.addEventListener(type,e=>{if(!pointers.has(e.pointerId))return;const multi=pointers.size>1;pointers.delete(e.pointerId);if(!pointers.size){gesture=null;}else if(multi){beginGesture(null);}}));
function removeSelected(){const index=stamps.findIndex(s=>s.id===selectedId);if(index>=0)stamps.splice(index,1);selectedId=null;clearGestures();draw();canvas.focus();}
$('#stamp-delete').addEventListener('click',removeSelected);
$('#stamp-mirror').addEventListener('click',()=>{const s=selectedStamp();if(s){s.mirror=!s.mirror;draw();}});
const handle=$('#stamp-transform');
handle.addEventListener('pointerdown',e=>{
 const s=selectedStamp();if(!s||!editable())return;e.preventDefault();clearGestures();handle.setPointerCapture(e.pointerId);
 const p=point(e),dx=(p.x-s.x)*canvas.width,dy=(p.y-s.y)*canvas.height;
 handleGesture={pointerId:e.pointerId,id:s.id,size:s.size,rotation:s.rotation,distance:Math.max(1,Math.hypot(dx,dy)),angle:Math.atan2(dy,dx)};
});
handle.addEventListener('pointermove',e=>{
 const g=handleGesture,s=selectedStamp();if(!g||g.pointerId!==e.pointerId||!s||s.id!==g.id||!editable())return;
 const p=point(e),dx=(p.x-s.x)*canvas.width,dy=(p.y-s.y)*canvas.height;
 s.size=clamp(g.size*Math.hypot(dx,dy)/g.distance,.08,1.5);s.rotation=angle(g.rotation+(Math.atan2(dy,dx)-g.angle)*180/Math.PI);draw();
});
['pointerup','pointercancel','lostpointercapture'].forEach(type=>handle.addEventListener(type,e=>{if(handleGesture?.pointerId===e.pointerId)handleGesture=null;}));
handle.addEventListener('keydown',e=>{const s=selectedStamp();if(!s||!editable()||!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();if(e.key==='ArrowUp'||e.key==='ArrowDown')s.size=clamp(s.size+(e.key==='ArrowUp'?.02:-.02),.08,1.5);else s.rotation=angle(s.rotation+(e.key==='ArrowRight'?5:-5));draw();});
canvas.addEventListener('keydown',e=>{
 if(app.classList.contains('is-immersive')&&(e.key==='Enter'||e.key===' ')){e.preventDefault();setImmersive(false);return;}if(!editable())return;
 if(e.key==='Enter'){e.preventDefault();selectedId=stamps[(stamps.findIndex(s=>s.id===selectedId)+1)%stamps.length]?.id??null;draw();return;}
 const s=selectedStamp();if(!s)return;const moves={ArrowLeft:[-.01,0],ArrowRight:[.01,0],ArrowUp:[0,-.01],ArrowDown:[0,.01]};
 if(moves[e.key]){e.preventDefault();s.x=clamp(s.x+moves[e.key][0],0,1);s.y=clamp(s.y+moves[e.key][1],0,1);}
 else if(e.key==='+'||e.key==='='||e.key==='-'){e.preventDefault();s.size=clamp(s.size+(e.key==='-'?-.02:.02),.08,1.5);}
 else if(e.key.toLowerCase()==='r'){e.preventDefault();s.rotation=angle(s.rotation+(e.shiftKey?-5:5));}
 else if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();removeSelected();}draw();
});
$('#capture').addEventListener('click',async()=>{
 if(!editable()||loadingStamps)return;phase='capturing';busy=true;clearGestures();
 try{updateUI();if(!draw())throw Object.assign(new Error('Frame unavailable'),{name:'CameraFrameUnavailable'});const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw new Error('empty');const name='umasan-'+Date.now()+'.png';await photoSave.prepare({blob,name,marked:true});phase='review';closePanels();status(`${canvas.width} × ${canvas.height}pxで撮影しました。確認して保存してください。`);}
 catch(error){phase='edit';status('撮影できませんでした。もう一度試すか、カメラを再起動してください。('+error.name+')',true);}
 finally{busy=false;updateUI();}
});
$('#retake').addEventListener('click',()=>{if(source===video&&!stream)startCamera();else ready();});
window.addEventListener('pagehide',()=>{++sourceRequest;busy=false;stopStream();cancelAnimationFrame(animation);clearGestures();});
window.addEventListener('pageshow',event=>{if(event.persisted&&source===video&&phase!=='review')startCamera();});
new ResizeObserver(()=>{clearGestures();if(phase==='edit')draw();}).observe($('.camera-stage'));
addStamp('front',false);updateUI();startCamera();
