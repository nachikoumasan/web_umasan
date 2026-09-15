(() => {
'use strict';
const K=window.UmaQuestCore,C=K.C,$=s=>document.querySelector(s),all=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const params=new URLSearchParams(location.search),septemberTest=params.get('test')==='september';
const trial=septemberTest||params.get('preview')==='1',mode=trial?'trial':'participant';
const key='umasan:quest:'+C.eventId+':'+mode+':v'+C.version;
let dateOverride='2026-10-07',state=K.fresh(mode),raw=null,blocked=false,pending=null,restore=null,undoId=null;
let photoItems=[],photoBusy=false,renderVersion=0,prepared=null,exportUrl=null,toastTimer;
const now=()=>trial?new Date(dateOverride+'T12:00:00+09:00'):new Date();
const date=()=>K.day(now()),stats=()=>K.summary(state,date());
function notice(text){clearTimeout(toastTimer);$('#notice').textContent=text;toastTimer=setTimeout(()=>{$('#notice').textContent='';},6500);}
function read(){
 try{raw=localStorage.getItem(key);state=raw===null?K.fresh(mode):K.validate(JSON.parse(raw),mode);blocked=false;}
 catch(e){blocked=true;$('#storage-error-text').textContent='保存内容の形式が違うか、ブラウザーの保存領域にアクセスできません。進行の変更を停止しています。';}
}
read();
function commit(next,force=false){
 if(blocked&&!force){notice('記録を保護しています。冒険の書から復元してください。');return false;}
 try{
  const clean=K.validate(next,mode);
  if(!force&&localStorage.getItem(key)!==raw){notice('別の画面で記録が変わりました。再読み込みしてから操作してください。');return false;}
  const serialized=JSON.stringify(clean);localStorage.setItem(key,serialized);state=clean;raw=serialized;blocked=false;render();return true;
 }catch(e){notice('保存できませんでした。変更は記録されていません。現在の冒険の書を保存してください。');return false;}
}
function category(id){return C.categories.find(c=>c.id===id);}
function questCard(q){
 const c=category(q.category),done=!!state.completed[q.id],stage=state.questStates[q.id],statName=window.UmaQuestScreen?.statNames[q.category]||c.name;
 if(!stage&&!done)return '<article class="sealed-quest"><button class="envelope" data-open="'+q.id+'" '+(blocked?'disabled':'')+' aria-label="'+esc(state.name||'冒険者')+'宛ての挑戦状を開く"><span class="envelope-to">'+esc(state.name||'冒険者')+'へ</span><span class="wax-seal" aria-hidden="true">♧</span><span class="envelope-title">うまさんからの<br><strong>挑戦状</strong></span></button><p class="delivery-note">今日の冒険が届いています。</p><button class="primary open-letter" data-open="'+q.id+'" '+(blocked?'disabled':'')+'>挑戦状を開く　→</button></article>';
 return '<article class="quest-letter '+(done?'quest-done':'')+'" data-quest-id="'+q.id+'"><div class="quest-top"><span class="category" style="background:'+c.color+'">'+c.name+'</span><time>'+q.date.replaceAll('-','.')+'</time></div><p class="letter-to">'+esc(state.name||'冒険者')+'へ</p><h3>'+esc(q.title)+'</h3><img class="quest-art" src="'+C.artwork[q.category]+'" alt=""><p class="description">'+esc(q.condition)+'</p><p class="reward">+ '+q.reward.xp+' EXP <small>'+statName+' +'+q.reward.stat+'</small></p>'+(done?'<p class="achievement-stamp">達成済み ✓</p><button data-share="'+q.id+'">このクリアをシェア</button>':stage==='started'?'<p class="quest-stage">挑戦中 · あなたのペースで</p><button class="primary" data-report="'+q.id+'" '+(blocked?'disabled':'')+'>達成を報告する</button>':'<button class="primary" data-start="'+q.id+'" '+(blocked?'disabled':'')+'>この挑戦を始める</button>')+'</article>';
}
function trophyRule(t){return t.kind==='category'?category(t.category).name+'を'+t.target+'件クリア':t.kind==='all'?'本番の全61件をクリア（本番データ準備中）':'累計'+t.target+'件クリア';}
function render(){
 const t=stats(),d=date(),p=K.phase(d);
 $('#storage-error').hidden=!blocked;$('#raw-backup').disabled=raw===null;
 $('#intro').hidden=state.onboarded;$('#intro-ok').disabled=blocked;
 $('#player-name').value=state.name;$('#player-name').disabled=blocked;
 $('#save-name').disabled=blocked;
 $('#level').textContent=t.level;$('#exp').max=C.xpPerLevel;$('#exp').value=t.exp;
 $('#exp-label').textContent=t.exp+' / '+C.xpPerLevel+' EXP';
 $('#rank').textContent=t.title+' · 累計 '+t.xp+' EXP';
 $('#phase-note').textContent=(trial?'試用モード · '+d+'（日本時間） · ':'')+(p==='before'?'10月1日に、最初の挑戦状をお届けします。':p==='after'?'イベント期間が終了しました。あなたの冒険を、記念の一枚に。':'2026年10月1日〜11月30日 · できる挑戦から、ひとつずつ。');
 const visible=K.released(d),today=visible.filter(q=>q.date===d),past=visible.filter(q=>q.date<d);
 $('#today-list').innerHTML=today.length?today.map(questCard).join(''):'<p class="empty">'+(p==='before'?'挑戦状は、まだ封を閉じています。':p==='after'?'二ヶ月の冒険、おつかれさま。<br>公開済みの挑戦にも、引き続き取り組めます。':'今日の新しい挑戦状はありません。<br>これまでの挑戦状から、気になる冒険を選んでね。')+'</p>';
 $('#past-quests').hidden=!past.length;$('#past-count').textContent=past.length+'件';$('#past-list').innerHTML=past.map(questCard).join('');
 $('#clear-count').textContent=t.done.length+'件の冒険';
 $('#stats').innerHTML=C.categories.map(c=>'<div class="stat"><img src="'+c.icon+'" alt=""><span>'+c.name+'</span><strong>'+t.stats[c.id]+'</strong></div>').join('');
 $('#history').innerHTML=t.done.length?[...t.done].sort((a,b)=>state.completed[b.id].localeCompare(state.completed[a.id])).map(q=>'<article class="history-row"><header><img class="history-icon" src="'+C.artwork[q.category]+'" alt=""><div><strong>'+esc(q.title)+'</strong><br><small>'+category(q.category).name+' · '+K.day(new Date(state.completed[q.id])).replaceAll('-','.')+'</small></div><span class="stamp">CLEAR</span></header><div class="history-actions"><button data-favorite="'+q.id+'" aria-pressed="'+(state.favoriteId===q.id)+'" '+(blocked?'disabled':'')+'>'+(state.favoriteId===q.id?'★ いちばんの冒険':'☆ いちばんに選ぶ')+'</button><button data-share="'+q.id+'">シェア</button><button data-undo="'+q.id+'" '+(blocked?'disabled':'')+'>取り消す</button></div></article>').join(''):'<p class="empty">手帳はまだ、まっさら。<br>あなたの「できた！」を待っています。</p>';
 $('#trophies').innerHTML=t.trophies.map(m=>'<article class="trophy-card '+(m.unlocked?'unlocked':'locked')+'"><img src="'+m.icon+'" alt=""><div><h3>'+m.name+'</h3><p>'+trophyRule(m)+'</p><progress value="'+m.progress+'" max="'+m.target+'" aria-label="'+m.name+'の進捗"></progress><small>'+m.progress+' / '+m.target+' · '+(m.unlocked?'獲得済み':'未獲得')+'</small></div></article>').join('');
 $('#title-select').innerHTML='<option value="">はじまりの冒険者</option>'+t.trophies.filter(m=>m.unlocked).map(m=>'<option value="'+m.id+'">'+m.title+'</option>').join('');$('#title-select').value=state.titleId;$('#title-select').disabled=blocked;
 renderResult(t);
 window.UmaQuestScreen?.refresh({state,t,date:d,blocked,trial,septemberTest});
}
function renderResult(t){
 $('#result-heading').textContent=t.final?'冒険クリア！':'冒険の途中経過';
 $('#result-note').textContent=t.canResult?(t.final?'あなたが重ねた小さな一歩が、一枚の物語になりました。':'途中の記録も、あなただけの冒険の証。'):'公開後に1件以上クリアすると、冒険の記念画像を作れます。';
 const favorite=K.byId[state.favoriteId],earned=t.trophies.filter(m=>m.unlocked);
 $('#certificate').hidden=!t.canResult;
 $('#certificate').setAttribute('aria-label',(state.name||'名もなき冒険者')+'、レベル'+t.level+'、'+t.title+'、'+t.done.length+'件クリア。'+C.categories.map(c=>c.name+t.stats[c.id]).join('、')+(favorite?'。いちばんの冒険：'+favorite.title:''));
 $('#certificate').innerHTML='<div class="certificate-top"><img src="media/icon-horseshoe.webp" alt=""><p>'+C.title+'<small>2026.10.01 — 11.30</small></p></div><p class="certificate-mode">'+(trial?'試用記録 · ':'')+(t.final?'冒険の修了証':'冒険の途中経過')+'</p><h3 class="certificate-name">'+esc(state.name||'名もなき冒険者')+' <span>Lv.'+t.level+'</span></h3><div class="ribbon">'+t.title+'</div><p class="certificate-count"><strong>'+t.done.length+'</strong> のクエストをクリア</p><div class="certificate-stats">'+C.categories.map(c=>'<div><span>'+c.name+'</span><strong>'+t.stats[c.id]+'</strong></div>').join('')+'</div><div class="certificate-vignettes">'+C.categories.map(c=>'<img src="'+C.artwork[c.id]+'" alt="">').join('')+'</div><div class="certificate-scene"><img src="media/scenery-lake.webp" alt="水彩風の湖と城"><img class="certificate-guide" src="media/camera-pose-lantern.png" alt="案内役のうまさん"><p>見つけて、つくって、やってみて、やすんで。<br>いつもの毎日が、少し好きになった。</p></div><div class="certificate-trophies">'+earned.map(m=>'<div><img src="'+m.icon+'" alt=""><span>'+m.name+'</span></div>').join('')+'</div>'+(favorite?'<div class="certificate-favorite"><small>★ いちばんの冒険</small><strong>'+esc(favorite.title)+'</strong></div>':'')+(photoItems.length?'<div class="certificate-photos count-'+photoItems.length+'">'+photoItems.map(p=>'<img src="'+p.url+'" alt="選んだ思い出の画像">').join('')+'</div>':'')+'<p class="certificate-footer">この先にも、きっとすてきな景色が待ってる。<br>旅するうまさん</p>';
 $('#result-caption').value='うまさんからの挑戦状\n'+(t.final?'冒険の記録':'冒険の途中経過')+'：'+t.done.length+'クエストをクリア！\n#旅するうまさん #うまさんからの挑戦状\n'+C.url;
 $('#copy-result').disabled=!t.canResult;
 prepareImage(t);
 window.UmaQuestScreen?.fitCard();
}
function showTab(id){all('[data-tab]').forEach(b=>{if(b.dataset.tab===id)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});all('.tab-panel').forEach(p=>p.hidden=p.id!==id);window.UmaQuestScreen?.switchTab(id);}
document.addEventListener('journey-name',e=>{
 const value=[...String(e.detail).trim()].slice(0,16).join('');
 if(!value){notice('冒険者の名前を入力してください。');return;}
 if(commit({...state,name:value,onboarded:true}))window.UmaQuestScreen?.depart();
});
document.addEventListener('click',e=>{
 const open=e.target.closest('[data-open]'),start=e.target.closest('[data-start]');
 if((open||start)&&!blocked){const id=(open||start).dataset[open?'open':'start'];try{if(commit(K.advance(state,id,open?'opened':'started',now())))window.UmaQuestScreen?.animateQuest(id,open?'opening':'starting');}catch(err){notice(err.message);}}
});
all('[data-tab]').forEach(b=>b.addEventListener('click',()=>showTab(b.dataset.tab)));
all('[data-close]').forEach(b=>b.addEventListener('click',()=>$('#'+b.dataset.close).close()));
$('#intro-ok').addEventListener('click',()=>commit({...state,onboarded:true}));
$('#player-name').addEventListener('change',e=>{if(!commit({...state,name:[...e.target.value.trim()].slice(0,16).join('')}))e.target.value=state.name;});
$('#save-name').addEventListener('click',()=>{if(commit({...state,name:[...$('#player-name').value.trim()].slice(0,16).join('')}))notice('表示名を保存しました。');});
$('#title-select').addEventListener('change',e=>{if(!commit({...state,titleId:e.target.value}))e.target.value=state.titleId;});
document.addEventListener('click',e=>{
 const report=e.target.closest('[data-report]'),share=e.target.closest('[data-share]'),fav=e.target.closest('[data-favorite]'),undo=e.target.closest('[data-undo]');
 if(report&&!blocked){pending={id:report.dataset.report,day:date()};$('#report-title').textContent=K.byId[pending.id].title;$('#report-dialog').showModal();}
 if(share)showClear(share.dataset.share);
 if(fav)commit({...state,favoriteId:state.favoriteId===fav.dataset.favorite?'':fav.dataset.favorite});
 if(undo){undoId=undo.dataset.undo;$('#undo-title').textContent=K.byId[undoId].title;$('#undo-dialog').showModal();}
});
$('#report-form').addEventListener('submit',e=>{
 e.preventDefault();if(!pending||state.completed[pending.id])return;
 const id=pending.id,before=stats();
 if(pending.day!==date()){$('#report-dialog').close();pending=null;render();notice('日付が変わりました。挑戦状をもう一度確認してください。');return;}
 try{
  const next=K.complete(state,id,now());
  if(!commit(next))return;
  pending=null;$('#report-dialog').close();
  const after=stats(),awards=after.trophies.filter(t=>t.unlocked&&!before.trophies.find(b=>b.id===t.id).unlocked);
  if(after.level>before.level&&window.UmaQuestScreen){window.UmaQuestScreen.levelUp({state,before,after,quest:K.byId[id],trial});return;}
  showClear(id,'EXP +'+K.byId[id].reward.xp+' · '+category(K.byId[id].category).name+' +'+K.byId[id].reward.stat+'\nLv.'+before.level+' → Lv.'+after.level+(awards.length?'\nトロフィー獲得：'+awards.map(t=>t.name).join('・'):''));
 }catch(e){notice(e.message);}
});
$('#confirm-undo').addEventListener('click',()=>{if(undoId&&commit(K.undo(state,undoId))){$('#undo-dialog').close();undoId=null;notice('達成を取り消し、実績を再計算しました。');}});
function showClear(id,reward='手帳に残した冒険を、だれかにも。'){
 if(!state.completed[id])return;
 $('#clear-title').textContent=K.byId[id].title;$('#clear-reward').textContent=reward;$('#quest-share-text').value=K.shareText(K.byId[id].title);$('#clear-dialog').showModal();
}
async function copy(selector){
 try{await navigator.clipboard.writeText($(selector).value);notice('投稿文をコピーしました。');}
 catch{$(selector).focus();$(selector).select();notice('文章を選択しました。コピー操作でコピーしてください。');}
}
$('#copy-quest').addEventListener('click',()=>copy('#quest-share-text'));
$('#copy-result').addEventListener('click',()=>copy('#result-caption'));
$('#share-quest').addEventListener('click',async()=>{
 if(!navigator.share){await copy('#quest-share-text');return;}
 try{await navigator.share({title:C.title,text:$('#quest-share-text').value});}catch(e){if(e.name!=='AbortError')notice('共有できませんでした。投稿文をコピーしてお使いください。');}
});
$('#share-x').addEventListener('click',()=>window.open('https://twitter.com/intent/tweet?text='+encodeURIComponent($('#quest-share-text').value),'_blank','noopener,noreferrer'));
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
function backup(){download(new Blob([blocked&&raw!==null?raw:JSON.stringify(state,null,2)],{type:'application/json'}),'umasan-adventure-'+mode+'.json');}
$('#export').addEventListener('click',backup);$('#raw-backup').addEventListener('click',backup);$('#backup-before-import').addEventListener('click',backup);
$('#retry-storage').addEventListener('click',()=>location.reload());
$('#open-import').addEventListener('click',()=>$('#import').click());
$('#import').addEventListener('change',async e=>{
 const f=e.target.files[0];e.target.value='';if(!f)return;
 try{if(f.size>100000)throw Error('ファイルが大きすぎます。');restore=K.validate(JSON.parse(await f.text()),mode);const t=K.summary(restore,date());$('#import-summary').textContent=(restore.name||'名もなき冒険者')+' ／ 復元後 '+t.done.length+'件 ／ Lv.'+t.level+' ／ '+(trial?'試用記録':'参加記録');$('#import-dialog').showModal();}
 catch(e){restore=null;notice('読み込めませんでした。現在の記録は変更していません。'+(e instanceof SyntaxError?'JSONの形式を確認してください。':e.message));}
});
$('#confirm-import').addEventListener('click',()=>{if(restore&&commit(restore,true)){restore=null;$('#import-dialog').close();notice('冒険の書を復元しました。');}});
$('#mode-description').textContent=septemberTest?'9月のテストプレイです。7件の仮クエストを、日付を待たずに遊べます。記録は本番とは別に保存します。':trial?'試用記録です。通常の参加記録とは別に保存します。':'参加記録モードです。実際の日本時間で公開済みのお題だけを表示します。';
$('#dev-controls').hidden=!trial;$('#mode-link').textContent=trial?'参加記録モードに戻る':'試用モードを開く';$('#mode-link').href=trial?'uma_quest.html#adventure':'?preview=1#adventure';
$('#preview-date').value=dateOverride;
function setDate(d){dateOverride=d;$('#preview-date').value=d;render();}
$('#preview-date').addEventListener('change',e=>{if(e.target.checkValidity()&&e.target.value)setDate(e.target.value);});
all('[data-date]').forEach(b=>b.addEventListener('click',()=>setDate(b.dataset.date)));
let lastDate=date();setInterval(()=>{if(!trial&&date()!==lastDate){lastDate=date();render();}},10000);
document.addEventListener('visibilitychange',()=>{if(!trial&&date()!==lastDate){lastDate=date();render();}});
$('#add-photos').addEventListener('click',()=>$('#photos').click());
$('#photos').addEventListener('change',async e=>{
 const files=[...e.target.files];e.target.value='';if(!files.length)return;
 if(files.length+photoItems.length>3){notice('画像は最大3枚です。枚数を減らして選んでください。');return;}
 photoBusy=true;$('#add-photos').disabled=true;prepared=null;$('#save-image').disabled=true;$('#share-image').disabled=true;
 const added=[];
 try{
  for(const file of files){
   if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>15*1024*1024)throw Error('PNG・JPEG・WebPの15MB以下の画像を選んでください。');
   const url=URL.createObjectURL(file),image=new Image();
   try{image.src=url;await image.decode();if(image.naturalWidth*image.naturalHeight>40000000)throw Error('画像が大きすぎます。縮小して選び直してください。');added.push({url,image});}
   catch(e){URL.revokeObjectURL(url);throw e;}
  }
  photoItems.push(...added);renderPhotos();
 }catch(e){added.forEach(p=>URL.revokeObjectURL(p.url));notice(e.message||'画像を読み込めませんでした。');}
 finally{photoBusy=false;$('#add-photos').disabled=photoItems.length>=3;renderResult(stats());}
});
function renderPhotos(){
 $('#photo-list').innerHTML=photoItems.map((p,i)=>'<div><img src="'+p.url+'" alt="思い出の画像 '+(i+1)+'"><button data-remove-photo="'+i+'">画像'+(i+1)+'を外す</button></div>').join('');
}
$('#photo-list').addEventListener('click',e=>{const b=e.target.closest('[data-remove-photo]');if(!b||photoBusy)return;const p=photoItems.splice(Number(b.dataset.removePhoto),1)[0];URL.revokeObjectURL(p.url);renderPhotos();$('#add-photos').disabled=false;renderResult(stats());});
const assetPaths=[...new Set(['media/scenery-lake.webp','media/camera-pose-lantern.png','media/icon-horseshoe.webp','media/quest/letter-paper-v1.jpg',...Object.values(C.artwork),...C.categories.map(c=>c.icon),...C.trophies.map(t=>t.icon)])];
const assets={};
const assetsReady=Promise.all(assetPaths.map(async src=>{const img=new Image();img.src=src;await img.decode();assets[src]=img;}));
assetsReady.catch(()=>{});
async function prepareImage(t){
 const revision=++renderVersion;prepared=null;$('#save-image').disabled=true;$('#share-image').disabled=true;
 if(exportUrl){URL.revokeObjectURL(exportUrl);exportUrl=null;}$('#export-image').removeAttribute('src');$('#export-preview').hidden=true;
 if(!t.canResult){$('#image-message').textContent='1件クリアすると画像を作れます。';return;}
 if(photoBusy)return;
 $('#image-message').textContent='フォントと画像を読み込んでいます…';
 try{
  await document.fonts.ready;await document.fonts.load('28px "Yu Mincho"','冒険の記録');await assetsReady;
  if(revision!==renderVersion)return;
  const canvas=drawCertificate(t);
  const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('書き出しに失敗しました。')),'image/png'));
  if(revision!==renderVersion)return;
  prepared=new File([blob],'umasan-'+(trial?'trial-':'')+'adventure.png',{type:'image/png'});
  exportUrl=URL.createObjectURL(prepared);$('#export-image').src=canvas.toDataURL('image/png');$('#export-preview').hidden=false;
  $('#save-image').disabled=false;$('#share-image').disabled=false;$('#image-message').textContent='画像の準備ができました。写真なしでも保存できます。';
 }catch(e){if(revision===renderVersion)$('#image-message').textContent='画像を準備できませんでした。再読み込みしてお試しください。';}
}
function drawCertificate(t){
 const canvas=document.createElement('canvas'),favorite=K.byId[state.favoriteId],photos=[...photoItems];
 canvas.width=1000;canvas.height=1380+(favorite?120:0)+(photos.length?320:0);
 const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height,ink='#51371f',gold='#af894d';
 ctx.fillStyle='#fcf7e9';ctx.fillRect(0,0,w,h);ctx.drawImage(assets['media/quest/letter-paper-v1.jpg'],0,0,w,h);ctx.strokeStyle=gold;ctx.lineWidth=3;ctx.strokeRect(24,24,w-48,h-48);ctx.lineWidth=1;ctx.strokeRect(34,34,w-68,h-68);
 const text=(s,y,size=28,color=ink)=>{ctx.fillStyle=color;ctx.font=size+'px "Yu Mincho",serif';ctx.textAlign='center';ctx.fillText(s,500,y,850);};
 const contain=(img,x,y,bw,bh)=>{const scale=Math.min(bw/img.naturalWidth,bh/img.naturalHeight);const iw=img.naturalWidth*scale,ih=img.naturalHeight*scale;ctx.drawImage(img,x+(bw-iw)/2,y+(bh-ih)/2,iw,ih);};
 text(C.title,100,34);text('2026.10.01 — 11.30',147,23,gold);text((trial?'試用記録 · ':'')+(t.final?'冒険の修了証':'冒険の途中経過'),204,23,gold);
 text(state.name||'名もなき冒険者',278,46);text('Lv.'+t.level,343,44);
 ctx.fillStyle='#e7d5a8';ctx.fillRect(230,374,540,60);text(t.title,415,29);
 text(t.done.length+' のクエストをクリア',519,49);
 C.categories.forEach((c,i)=>{const x=158+i*228;ctx.fillStyle=ink;ctx.font='24px "Yu Mincho",serif';ctx.textAlign='center';ctx.fillText(c.name,x,591);ctx.font='36px "Yu Mincho",serif';ctx.fillText(String(t.stats[c.id]),x,644);});
 C.categories.forEach((c,i)=>contain(assets[C.artwork[c.id]],108+i*228,665,100,100));
 const landscape=assets['media/scenery-lake.webp'],scene=document.createElement('canvas');scene.width=860;scene.height=245;
 const sceneCtx=scene.getContext('2d'),zoom=Math.max(scene.width/landscape.naturalWidth,scene.height/landscape.naturalHeight);
 sceneCtx.drawImage(landscape,(scene.width-landscape.naturalWidth*zoom)/2,(scene.height-landscape.naturalHeight*zoom)/2,landscape.naturalWidth*zoom,landscape.naturalHeight*zoom);
 const fade=sceneCtx.createLinearGradient(0,0,0,scene.height);fade.addColorStop(0,'transparent');fade.addColorStop(.18,'#000');fade.addColorStop(.72,'#000');fade.addColorStop(1,'transparent');sceneCtx.globalCompositeOperation='destination-in';sceneCtx.fillStyle=fade;sceneCtx.fillRect(0,0,scene.width,scene.height);
 ctx.save();ctx.globalAlpha=.7;ctx.drawImage(scene,70,770);ctx.restore();contain(assets['media/camera-pose-lantern.png'],710,795,210,235);
 text('いつもの毎日が、少し好きになった。',1035,25);
 const earned=t.trophies.filter(m=>m.unlocked);earned.forEach((m,i)=>{const width=Math.min(130,820/Math.max(earned.length,1)),x=500+(i-(earned.length-1)/2)*width;contain(assets[m.icon],x-28,1080,56,60);ctx.fillStyle=ink;ctx.font='16px "Yu Mincho",serif';ctx.textAlign='center';ctx.fillText(m.name,x,1170,width-5);});
 let y=1210;
 if(favorite){ctx.strokeStyle='#d3bd8f';ctx.strokeRect(80,y,840,100);text('★ いちばんの冒険',y+33,20,gold);text(favorite.title,y+76,29);y+=120;}
 if(photos.length){const gap=18,bw=(840-gap*(photos.length-1))/photos.length;photos.forEach((p,i)=>{ctx.fillStyle='#fffdf6';ctx.fillRect(80+i*(bw+gap),y,bw,280);contain(p.image,88+i*(bw+gap),y+8,bw-16,264);});y+=320;}
 text('この先にも、きっとすてきな景色が待ってる。',h-90,23,gold);
 text('旅するうまさん',h-50,24,ink);
 return canvas;
}
$('#save-image').addEventListener('click',()=>{if(prepared){download(prepared,prepared.name);notice('画像の保存を開始しました。');}});
$('#share-image').addEventListener('click',async()=>{
 if(!prepared)return;
 const file=prepared,data={files:[file],title:C.title,text:$('#result-caption').value};
 try{
  if(navigator.share&&navigator.canShare?.(data))await navigator.share(data);
  else{download(file,file.name);$('#image-message').textContent='画像の保存を開始しました。「投稿文をコピー」を押してSNSに添えてください。';}
 }catch(e){if(e.name!=='AbortError')$('#image-message').textContent='共有できませんでした。画像保存と投稿文コピーをご利用ください。';}
});
render();
})();

