// Camera behavior without device access. Browser layout and real iPhone QA are separate.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=require('node:path').resolve(__dirname,'..');
const markup=fs.readFileSync(root+'/contents/umasan-camera.html','utf8');
const nodes=new Map();
function element(){return {
 hidden:false,value:'',textContent:'',children:[],attrs:{},dataset:{},events:{},style:{},
 classList:{toggle(){},contains(){return false;}},
 setAttribute(k,v){this.attrs[k]=v;},append(...items){this.children.push(...items);},
 addEventListener(k,fn){this.events[k]=fn;},querySelectorAll(){return this.children;},
 focus(){},setPointerCapture(){},getBoundingClientRect(){return rect;}
};}
let rect={left:0,top:0,width:375,height:667};
for(const [,id] of markup.matchAll(/id="([^"]+)"/g))nodes.set('#'+id,element());
for(const name of ['.camera-app','.camera-stage','.capture-row','.capture-row .photo-label','.camera-tools','.camera-header','.zoom-control'])nodes.set(name,element());
nodes.set('link[rel="canonical"]',{href:'https://web-umasan.nachiko-umasan0215.workers.dev/contents/umasan-camera.html'});
const drawCalls=[],context={clearRect(){},drawImage(...a){drawCalls.push(a);},save(){},translate(){},rotate(){},scale(){},restore(){}};
const canvas=nodes.get('#camera-canvas');canvas.getContext=()=>context;canvas.toBlob=fn=>fn({});
const video=nodes.get('#camera-video');video.videoWidth=1280;video.videoHeight=960;video.readyState=4;video.paused=false;video.play=async()=>{};
let requests=0,stopped=0,pendingCamera=null,resize;
const timers=new Set();
const sandbox={setInterval:fn=>{timers.add(fn);return fn;},clearInterval:fn=>timers.delete(fn),
 document:{querySelector:s=>{assert.ok(nodes.has(s),'Unknown selector '+s);return nodes.get(s);},querySelectorAll:()=>[],createElement:element,addEventListener(){}},
 navigator:{mediaDevices:{getUserMedia:async()=>{requests++;if(pendingCamera)return pendingCamera;return {getTracks:()=>[{stop(){stopped++;}}]};}}},
 Image:class {naturalWidth=100;naturalHeight=150;async decode(){}},
 UmasanCameraShare:{bind:()=>({clear(){},prepare(){}})},
 UmasanImageSave:{bind:()=>({clear(){},prepare:async()=>{}}),watermark(){throw Error("Camera photos must have no watermark");}},
 requestAnimationFrame:()=>1,cancelAnimationFrame(){},window:{addEventListener(){}},
 ResizeObserver:class {constructor(fn){resize=fn;}observe(){}},URL:{createObjectURL:()=> 'blob:test',revokeObjectURL(){}},
};
vm.createContext(sandbox);vm.runInContext(fs.readFileSync(root+'/assets/js/camera.js','utf8'),sandbox);
const read=code=>vm.runInContext(code,sandbox),tick=()=>new Promise(setImmediate);
const fire=(id,event,data={})=>nodes.get(id).events[event]({target:nodes.get(id),preventDefault(){},...data});
(async()=>{
 await tick();assert.equal(requests,1);assert.equal(read('phase'),'edit');
 assert.equal(canvas.width,540);assert.equal(canvas.height,960);assert.equal(read('stamps.length'),1);
 assert.equal(nodes.get('#stamp-selection').hidden,true);
 await Promise.all([read("addStamp('sit')"),read("addStamp('sit')")]);
 assert.equal(read('stamps.length'),3,'Repeated pose creates separate stamps');
 assert.notEqual(read('stamps[1].id'),read('stamps[2].id'));
 const original=read('JSON.stringify(stamps)');
 fire('#camera-canvas','pointerdown',{pointerId:1,clientX:10,clientY:10});
 fire('#camera-canvas','pointermove',{pointerId:1,clientX:50,clientY:50});
 assert.equal(read('JSON.stringify(stamps)'),original,'Background drag leaves stamps alone');
 fire('#camera-canvas','pointerup',{pointerId:1});
 fire('#camera-canvas','pointerdown',{pointerId:3,clientX:100,clientY:100});
 fire('#camera-canvas','pointerdown',{pointerId:4,clientX:200,clientY:100});
 fire('#camera-canvas','pointermove',{pointerId:4,clientX:300,clientY:100});
 assert.ok(Math.abs(read('cameraZoom')-2)<1e-10);assert.equal(read('JSON.stringify(stamps)'),original);
 const frame=drawCalls.filter(a=>a[0]===video).at(-1);assert.ok(Math.abs(frame[3]-270)<1e-10);assert.ok(Math.abs(frame[4]-480)<1e-10);
 fire('#camera-canvas','pointerup',{pointerId:3});fire('#camera-canvas','pointerup',{pointerId:4});
 // Start on the topmost stamp. A second finger scales and rotates only that stamp.
 const center=read('({x:stamps[2].x*375,y:stamps[2].y*667})');
 fire('#camera-canvas','pointerdown',{pointerId:5,clientX:center.x,clientY:center.y});
 assert.equal(read('selectedId'),3);assert.equal(nodes.get('#stamp-selection').hidden,false);
 fire('#camera-canvas','pointerdown',{pointerId:6,clientX:center.x+40,clientY:center.y});
 fire('#camera-canvas','pointermove',{pointerId:6,clientX:center.x+60,clientY:center.y+30});
 assert.ok(read('stamps[2].size')>.32);assert.ok(read('stamps[2].rotation')>0);
 assert.equal(read('stamps[0].size'),.32);assert.equal(read('stamps[1].size'),.32);assert.ok(Math.abs(read('cameraZoom')-2)<1e-10);
 fire('#camera-canvas','pointercancel',{pointerId:5});fire('#camera-canvas','pointerup',{pointerId:6});
 const beforeHandle=read('stamps[2].size');
 fire('#stamp-transform','pointerdown',{pointerId:7,clientX:center.x+50,clientY:center.y+60});
 fire('#stamp-transform','pointermove',{pointerId:7,clientX:center.x+100,clientY:center.y+120});
 assert.ok(read('stamps[2].size')>beforeHandle);assert.ok(Math.abs(read('cameraZoom')-2)<1e-10);
 fire('#stamp-transform','pointerup',{pointerId:7});
 rect={left:0,top:0,width:667,height:375};resize();assert.equal(canvas.width,1280);assert.equal(canvas.height,720);
 const beforeCapture=read('JSON.stringify(stamps)');drawCalls.length=0;
 await fire('#capture','click');assert.equal(read('phase'),'review');assert.equal(nodes.get('#stamp-selection').hidden,true);assert.equal(nodes.get('.capture-row .photo-label').hidden,true);
 assert.equal(drawCalls.filter(a=>a[0]!==video).length,3,'Every stamp is captured once');
 rect={left:0,top:0,width:375,height:667};resize();assert.equal(canvas.width,1280);
 fire('#retake','click');assert.equal(canvas.width,540);assert.equal(read('JSON.stringify(stamps)'),beforeCapture);
 fire('#stamp-delete','click');assert.equal(read('stamps.length'),2);
 read('selectedId=stamps[0].id');fire('#stamp-delete','click');read('selectedId=stamps[0].id');fire('#stamp-delete','click');
 assert.equal(read('stamps.length'),0);await fire('#capture','click');assert.equal(read('phase'),'review','Zero stamps is allowed');fire('#retake','click');
 let resolveCamera;pendingCamera=new Promise(resolve=>{resolveCamera=resolve;});const starting=read('startCamera()');
 await fire('#photo-input','change',{target:{files:[{}],value:'image'}});
 resolveCamera({getTracks:()=>[{stop(){stopped++;}}]});await starting;
 assert.equal(read('source===video'),false);assert.ok(stopped>0);
 const normalDraw=context.drawImage;context.drawImage=()=>{throw Object.assign(Error('draw failed'),{name:'InvalidStateError'});};
 await fire('#capture','click');assert.equal(read('busy'),false);assert.equal(read('phase'),'edit');assert.equal(nodes.get('#capture').disabled,false);assert.ok(nodes.get('#camera-status').textContent.includes('InvalidStateError'));context.drawImage=normalDraw;
 // A camera can connect while play() remains pending. A real frame is sufficient.
 pendingCamera=null;video.play=()=>new Promise(()=>{});const frameReady=read('startCamera()');await tick();for(const fn of [...timers])fn();await frameReady;assert.equal(read('phase'),'edit');
 // No decoded frame must not export the previous canvas or leave capture locked.
 video.readyState=0;await fire('#capture','click');assert.equal(read('busy'),false);assert.ok(nodes.get('#camera-status').textContent.includes('CameraFrameUnavailable'));
 const noFrame=read('startCamera()');await tick();for(let i=0;i<120;i++)for(const fn of [...timers])fn();await noFrame;assert.equal(read('busy'),false);assert.equal(nodes.get('#start').disabled,false);assert.ok(nodes.get('#camera-status').textContent.includes('CameraPreviewTimeout'));
 video.play=async()=>{throw {name:'NotAllowedError'};};await read('startCamera()');assert.ok(nodes.get('#camera-status').textContent.includes('\u63a5\u7d9a\u5f8c'));assert.equal(read('busy'),false);

 console.log('PASS: multiple stamps, independent selection/transform, background pinch, handle, rotation, clean capture, delete, empty capture, source race.');
})().catch(error=>{console.error(error);process.exitCode=1;});
