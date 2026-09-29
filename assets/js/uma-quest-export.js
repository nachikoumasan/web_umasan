(() => {
'use strict';
const images=new Map();
function image(src){if(!images.has(src))images.set(src,new Promise(resolve=>{const i=new Image();const timer=setTimeout(()=>resolve(null),5000);i.onload=()=>{clearTimeout(timer);resolve(i.naturalWidth?i:null);};i.onerror=()=>{clearTimeout(timer);images.delete(src);resolve(null);};i.src=src;}));return images.get(src);}
async function fonts(){let timer;try{await Promise.race([Promise.resolve().then(()=>document.fonts?.ready),new Promise(resolve=>{timer=setTimeout(resolve,2000);})]);}catch{/* The system serif font remains usable. */}finally{clearTimeout(timer);}}
async function png(canvas){
 if(canvas.toBlob){try{const blob=await new Promise((resolve,reject)=>{let timer=setTimeout(()=>reject(Error('ENCODE_TIMEOUT')),3000);canvas.toBlob(b=>{clearTimeout(timer);b?resolve(b):reject(Error('EMPTY_PNG'));},'image/png');});if(blob.size)return blob;}catch{/* Some mobile WebViews do not implement toBlob reliably. */}}
 const data=canvas.toDataURL('image/png');if(!data.startsWith('data:image/png;base64,'))throw Error('PNG_UNAVAILABLE');
 const bytes=Uint8Array.from(atob(data.split(',')[1]),c=>c.charCodeAt(0));return new Blob([bytes],{type:'image/png'});
}
async function render(width,height,draw){
 await fonts();let last;
 for(const [scale,art]of [[1,true],[2/3,true],[2/3,false]]){
  const canvas=document.createElement('canvas');canvas.width=Math.round(width*scale);canvas.height=Math.round(height*scale);
  try{const ctx=canvas.getContext('2d');if(!ctx)throw Error('NO_CANVAS');ctx.scale(scale,scale);await draw(ctx,art);return await png(canvas);}catch(e){last=e;}finally{canvas.width=canvas.height=1;}
 }
 throw last||Error('EXPORT_FAILED');
}
function save(blob,name){if(!blob)return;const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
const xURL=text=>'https://x.com/intent/post?text='+encodeURIComponent(text);
function post(text){window.open(xURL(text),'_blank','noopener,noreferrer');}
function errorCode(e){return e?.name==='SecurityError'?'画像の読み込み制限':e?.message==='NO_CANVAS'?'描画機能が利用不可':'画像変換に失敗';}
window.UmaQuestExport={image,render,save,post,xURL,errorCode};
})();
