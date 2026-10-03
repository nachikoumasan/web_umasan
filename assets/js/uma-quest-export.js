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
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
const isIOS=()=>typeof navigator!=='undefined'&&(/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1));
const fallbackUrls=new WeakMap();let sharing=false;
function message(note,text){if(!note)return;const old=fallbackUrls.get(note);if(old){URL.revokeObjectURL(old);fallbackUrls.delete(note);}note.textContent=text;}
function link(note,text,url){if(!note)return;const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.textContent=text;note.append(' ',a);}
function imageFallback(blob,note){message(note,'画像を開き、長押しして写真に保存してください。');if(note){const url=URL.createObjectURL(blob);fallbackUrls.set(note,url);link(note,'画像を開く',url);}return 'fallback';}
async function save(blob,name,note){
 if(!blob||sharing)return;
 if(isIOS()){
  let file;try{if(typeof File!=='undefined')file=new File([blob],name,{type:'image/png'});}catch{/* Use the image link on older browsers. */}
  let supported=false;try{supported=!!(file&&navigator.share&&navigator.canShare?.({files:[file]}));}catch{/* Capability checks may be restricted. */}
  if(!supported)return imageFallback(blob,note);
  message(note,'共有メニューの「画像を保存」で写真に保存できます。');sharing=true;
  try{await navigator.share({files:[file]});return 'shared';}
  catch(e){if(e?.name==='AbortError'){message(note,'');return 'cancelled';}return imageFallback(blob,note);}
  finally{sharing=false;}
 }
 try{download(blob,name);message(note,'画像のダウンロードを開始しました。');return 'download';}catch{message(note,'画像を保存できませんでした。もう一度お試しください。');return 'error';}
}
const xURL=text=>'https://x.com/intent/post?text='+encodeURIComponent(text);
async function post(text,note){
 if(sharing)return;
 if(isIOS()&&typeof navigator.share==='function'){
  message(note,'共有先にXを選んでください。表示されない場合は「その他」を確認してください。');sharing=true;
  // Pass the event as a URL item so native share targets can request its web card.
  const url=window.UmaQuestConfig?.url;
  const payload=url&&text.includes(url)?{text:text.replace(url,'').trim(),url}:{text};
  try{await navigator.share(payload);return 'shared';}
  catch(e){if(e?.name==='AbortError'){message(note,'');return 'cancelled';}message(note,'共有メニューを開けませんでした。');link(note,'Xをブラウザで開く',xURL(text));return 'fallback';}
  finally{sharing=false;}
 }
 message(note,isIOS()?'この環境ではXをブラウザで開きます。':'');window.open(xURL(text),'_blank','noopener,noreferrer');return 'browser';
}
function errorCode(e){return e?.name==='SecurityError'?'画像の読み込み制限':e?.message==='NO_CANVAS'?'描画機能が利用不可':'画像変換に失敗';}
window.UmaQuestExport={image,render,save,post,xURL,errorCode};
})();
