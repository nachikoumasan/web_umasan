'use strict';
const $ = selector => document.querySelector(selector);
const canvas = $('#camera-canvas'), ctx = canvas.getContext('2d'), video = $('#camera-video');
const poseData = [
 ['front','いつものうまさん','assets/camera-pose-front.png'],
 ['wave','こんにちは','assets/camera-pose-wave.png'],
 ['sit','ひとやすみ','assets/camera-pose-sit.png'],
 ['side','おさんぽ','assets/camera-pose-side.png'],
 ['lantern','見つけた！','assets/camera-pose-lantern.png'],
 ['back','振り返って','assets/camera-pose-back.png']
];
let stream = null, source = null, facing = 'environment', phase = 'idle', animation = 0, photoUrl = null;
let poseImage = null, poseRequest = 0, capturedBlob = null, busy = false;
const transform = {x:.5,y:.66,size:.32,rotation:0,mirror:false};
const status = text => { $('#camera-status').textContent = text; };
const clamp = (n,a,b) => Math.max(a,Math.min(b,n));
function syncControls() {
 $('#size').value = Math.round(transform.size*100); $('#size-value').textContent = Math.round(transform.size*100)+'%';
 $('#rotation').value = Math.round(transform.rotation); $('#rotation-value').textContent = Math.round(transform.rotation)+'°';
 $('#mirror').setAttribute('aria-pressed',String(transform.mirror));
}
function closePanels() {
 ['poses','adjust'].forEach(name=>{ $('#'+name+'-panel').hidden=true; $('#'+name+'-toggle').setAttribute('aria-expanded','false'); });
}
function updateUI() {
 const editing = phase === 'edit', review = phase === 'review';
 document.querySelector('.capture-row').hidden = !source;
 $('#camera-welcome').hidden = !!source;
 canvas.hidden = !source;
 $('#edit-tools').hidden = !editing;
 $('#capture').hidden = review; $('#capture').disabled = !editing || !poseImage || busy;
 $('#flip').disabled = !editing || busy;
 $('#flip').textContent = source && source !== video ? 'カメラへ' : '前後切替';
 $('#retake').hidden = !review; $('#save').hidden = !review;
 $('#share').hidden = !review || !navigator.share;
 $('#save-help').hidden = !review;
}
function stopStream() { if(stream) stream.getTracks().forEach(t=>t.stop()); stream=null; }
function frameSize() {
 const w = source === video ? video.videoWidth : source.naturalWidth;
 const h = source === video ? video.videoHeight : source.naturalHeight;
 // Camera pixels are retained; very large imported photos are capped to a 4096px edge.
 const ratio = source === video ? 1 : Math.min(1,4096/Math.max(w,h));
 return {width:Math.round(w*ratio),height:Math.round(h*ratio)};
}
function draw() {
 if(!source || !poseImage || (phase!=='edit' && phase!=='capturing')) return;
 const size=frameSize(); if(!size.width || !size.height) return;
 if(canvas.width!==size.width || canvas.height!==size.height){canvas.width=size.width;canvas.height=size.height;}
 ctx.clearRect(0,0,canvas.width,canvas.height);
 ctx.drawImage(source,0,0,canvas.width,canvas.height);
 const w=Math.min(canvas.width,canvas.height)*transform.size, h=w*poseImage.naturalHeight/poseImage.naturalWidth;
 ctx.save();ctx.translate(transform.x*canvas.width,transform.y*canvas.height);ctx.rotate(transform.rotation*Math.PI/180);
 ctx.scale(transform.mirror?-1:1,1);ctx.drawImage(poseImage,-w/2,-h/2,w,h);ctx.restore();
}
function animate() { cancelAnimationFrame(animation); function tick(){if(phase==='edit')draw();animation=requestAnimationFrame(tick);}animation=requestAnimationFrame(tick); }
function ready() {
 phase='edit';capturedBlob=null;draw();updateUI();animate();
 const s=frameSize();status(`全体表示・${s.width} × ${s.height}px ／ うまさんをドラッグして移動`);
}
async function startCamera() {
 if(busy)return; busy=true;updateUI();status('カメラを準備しています…');
 try {
   if(!navigator.mediaDevices?.getUserMedia)throw new Error('unsupported');
   stopStream();
   stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:facing},width:{ideal:1920},height:{ideal:1920}},audio:false});
   video.srcObject=stream; await video.play(); source=video; ready();
 } catch(error) {
   if(source===video){source=null;phase='idle';}
   status(error.name==='NotAllowedError' ? 'カメラの使用が許可されていません。写真を選んで使うこともできます。' : 'カメラを起動できませんでした。HTTPS・端末の設定を確認するか、写真を選んでください。');
 } finally {busy=false;updateUI();}
}
$('#start').addEventListener('click',startCamera);
document.querySelectorAll('.photo-label').forEach(label=>{
 label.tabIndex=0;label.setAttribute('role','button');
 label.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();$('#photo-input').click();}});
});
$('#flip').addEventListener('click',()=>{if(source===video)facing=facing==='environment'?'user':'environment';startCamera();});
$('#photo-input').addEventListener('change',async event=>{
 const file=event.target.files[0];if(!file)return;
 const nextUrl=URL.createObjectURL(file), image=new Image();image.src=nextUrl;
 try{await image.decode();stopStream();if(photoUrl)URL.revokeObjectURL(photoUrl);photoUrl=nextUrl;source=image;closePanels();ready();}
 catch{URL.revokeObjectURL(nextUrl);status('この写真を読み込めませんでした。JPEG・PNGなどの画像を選んでください。');}
 event.target.value='';
});
poseData.forEach(([id,label,src])=>{
 const b=document.createElement('button');b.type='button';b.dataset.pose=id;b.setAttribute('aria-pressed','false');
 const img=document.createElement('img');img.src=src;img.alt='';const name=document.createElement('span');name.textContent=label;b.append(img,name);
 b.addEventListener('click',()=>selectPose(id));$('#pose-list').append(b);
});
async function selectPose(id){
 const row=poseData.find(p=>p[0]===id), request=++poseRequest, img=new Image();img.src=row[2];
 try{await img.decode();if(request!==poseRequest)return;poseImage=img;
 $('#pose-list').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.pose===id)));
 draw();updateUI();if(source)status(row[1]+'を選びました。位置と大きさはそのままです。');
 }catch{if(request===poseRequest)status('うまさんの画像を読み込めませんでした。別のポーズを選んでください。');}
}
['poses','adjust'].forEach(name=>$('#'+name+'-toggle').addEventListener('click',()=>{
 const open=$('#'+name+'-panel').hidden;closePanels();$('#'+name+'-panel').hidden=!open;$('#'+name+'-toggle').setAttribute('aria-expanded',String(open));
}));
$('#size').addEventListener('input',e=>{transform.size=Number(e.target.value)/100;syncControls();draw();});
$('#rotation').addEventListener('input',e=>{transform.rotation=Number(e.target.value);syncControls();draw();});
$('#mirror').addEventListener('click',()=>{transform.mirror=!transform.mirror;syncControls();draw();});
$('#reset').addEventListener('click',()=>{Object.assign(transform,{x:.5,y:.66,size:.32,rotation:0,mirror:false});syncControls();draw();});
// Convert screen coordinates into the visible full image, excluding contain letterboxing.
function point(event){const r=canvas.getBoundingClientRect(),scale=Math.min(r.width/canvas.width,r.height/canvas.height),w=canvas.width*scale,h=canvas.height*scale;
 return {x:(event.clientX-r.left-(r.width-w)/2)/w,y:(event.clientY-r.top-(r.height-h)/2)/h};}
const pointers=new Map();let gesture=null;
function beginGesture(){const pts=[...pointers.values()];gesture={pts,x:transform.x,y:transform.y,size:transform.size,rotation:transform.rotation};}
canvas.addEventListener('pointerdown',e=>{if(phase!=='edit')return;canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,point(e));beginGesture();});
canvas.addEventListener('pointermove',e=>{
 if(!pointers.has(e.pointerId)||phase!=='edit')return;pointers.set(e.pointerId,point(e));const pts=[...pointers.values()];
 if(pts.length===1){transform.x=clamp(gesture.x+pts[0].x-gesture.pts[0].x,0,1);transform.y=clamp(gesture.y+pts[0].y-gesture.pts[0].y,0,1);}
 else if(gesture.pts.length>=2){
 const vector=arr=>({x:(arr[1].x-arr[0].x)*canvas.width,y:(arr[1].y-arr[0].y)*canvas.height}),a=vector(gesture.pts),b=vector(pts);
 transform.size=clamp(gesture.size*Math.hypot(b.x,b.y)/Math.max(1,Math.hypot(a.x,a.y)),.1,.9);
 transform.rotation=((gesture.rotation+(Math.atan2(b.y,b.x)-Math.atan2(a.y,a.x))*180/Math.PI+540)%360)-180;
 }syncControls();draw();
});
['pointerup','pointercancel','lostpointercapture'].forEach(type=>canvas.addEventListener(type,e=>{pointers.delete(e.pointerId);beginGesture();}));
canvas.addEventListener('wheel',e=>{if(phase!=='edit')return;e.preventDefault();transform.size=clamp(transform.size+(e.deltaY<0?.02:-.02),.1,.9);syncControls();draw();},{passive:false});
canvas.addEventListener('keydown',e=>{if(phase!=='edit')return;const moves={ArrowLeft:[-.01,0],ArrowRight:[.01,0],ArrowUp:[0,-.01],ArrowDown:[0,.01]};if(!moves[e.key])return;e.preventDefault();transform.x=clamp(transform.x+moves[e.key][0],0,1);transform.y=clamp(transform.y+moves[e.key][1],0,1);draw();});
$('#capture').addEventListener('click',async()=>{
 if(phase!=='edit'||!poseImage)return;phase='capturing';busy=true;updateUI();draw();
 try{capturedBlob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!capturedBlob)throw new Error('empty');phase='review';closePanels();status(`${canvas.width} × ${canvas.height}pxで撮影しました。確認して保存してください。`);}
 catch{phase='edit';status('撮影に失敗しました。もう一度お試しください。');}
 finally{busy=false;updateUI();}
});
$('#retake').addEventListener('click',()=>{ready();});
function download(){if(!capturedBlob)return;const url=URL.createObjectURL(capturedBlob),a=document.createElement('a');a.href=url;a.download='umasan-'+Date.now()+'.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);status('保存用の画像を開きました。端末のダウンロード先をご確認ください。');}
$('#save').addEventListener('click',download);
$('#share').addEventListener('click',async()=>{
 if(!capturedBlob)return;const file=new File([capturedBlob],'umasan.png',{type:'image/png'});
 if(!navigator.canShare?.({files:[file]})){status('この端末では画像の共有に対応していません。「画像を保存」を使ってください。');return;}
 try{await navigator.share({files:[file],title:'旅するうまさん'});}catch(e){if(e.name!=='AbortError')status('共有できませんでした。「画像を保存」を使ってください。');}
});
window.addEventListener('pagehide',()=>{stopStream();cancelAnimationFrame(animation);});
syncControls();selectPose('front');updateUI();
