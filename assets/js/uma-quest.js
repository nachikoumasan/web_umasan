(() => {
'use strict';
const K=window.UmaQuestCore,C=K.C,$=s=>document.querySelector(s),all=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const params=new URLSearchParams(location.search),septemberTest=params.get('test')==='september';
const earlyTest=params.get('test')==='early';
const trial=earlyTest||septemberTest||params.get('preview')==='1',mode=earlyTest?'preflight':trial?'trial':'participant';
const key='umasan:quest:'+C.eventId+':'+mode+':v'+C.version;
let state=K.fresh(mode),raw=null,blocked=false;
let toastTimer;
let selectedQuestId='',questImage=null,questImageId='',questImageRevision=0;
const now=()=>earlyTest?new Date(window.UmaQuestCalendar.eventDay(K.day())+'T12:00:00+09:00'):trial?new Date('2026-10-07T12:00:00+09:00'):new Date();
const date=()=>K.day(now()),stats=()=>K.summary(state,date());
function notice(text){clearTimeout(toastTimer);$('#notice').textContent=text;toastTimer=setTimeout(()=>{$('#notice').textContent='';},6500);}
function read(){
 try{raw=localStorage.getItem(key);state=raw===null?K.fresh(mode):K.validate(JSON.parse(raw),mode);blocked=false;}
 catch(e){blocked=true;$('#storage-error-text').textContent='記録を読み込めませんでした。データは変更していません。';}
}
read();
function commit(next,force=false){
 if(blocked&&!force){notice('記録を保護しています。再読み込みをお試しください。');return false;}
 try{
  const clean=K.validate(next,mode);
  if(!force&&localStorage.getItem(key)!==raw){notice('別の画面で記録が変わりました。再読み込みしてから操作してください。');return false;}
  const serialized=JSON.stringify(clean);localStorage.setItem(key,serialized);state=clean;raw=serialized;blocked=false;render();return true;
 }catch(e){notice('保存できませんでした。変更は記録されていません。再読み込みをお試しください。');return false;}
}
function category(id){return C.categories.find(c=>c.id===id);}
function questCard(q){
 const c=category(q.category),done=!!state.completed[q.id],statName=window.UmaQuestScreen?.statNames[q.category]||c.name;
 return '<article class="quest-letter '+(done?'quest-done':'')+'" data-quest-id="'+q.id+'"><div class="quest-top"><span class="category" style="background:'+c.color+'">'+c.name+'</span><time>'+q.date.replaceAll('-','.')+'</time></div><p class="letter-to">'+esc(state.name||'冒険者')+'へ</p><h3>'+esc(q.title)+'</h3><img class="quest-art" src="'+C.artwork[q.category]+'" alt=""><p class="description">'+esc(q.condition)+'</p><p class="reward">+ '+q.reward.xp+' EXP <small>'+statName+' +'+q.reward.stat+'</small></p>'+(done?'<p class="achievement-stamp">達成済み ✓</p><div class="export-actions"><button data-save-quest="'+q.id+'" disabled>画像を保存</button><button data-share="'+q.id+'">Xでシェア</button></div><p id="quest-export-note" class="export-note" role="status"></p>':'<button class="primary" data-report="'+q.id+'" '+(blocked?'disabled':'')+'>できた！記録する</button>')+'</article>';
}
function trophyRule(t){return t.kind==='category'?category(t.category).name+'を'+t.target+'件クリア':t.kind==='all'?'特別実績 · '+(earlyTest?'試用の全61件をクリア':'本番の全61件をクリア（本番データ準備中）'):'累計'+t.target+'件クリア';}
function render(){
 const t=stats(),d=date();
 $('#storage-error').hidden=!blocked;
 $('#player-name').value=state.name;$('#player-name').disabled=blocked;$('#save-name').disabled=blocked;
 window.UmaQuestScreen?.renderTrophies(t.trophies.map(m=>({...m,rule:trophyRule(m)})));
 $('#title-select').innerHTML='<option value="">はじまりの冒険者</option>'+t.trophies.filter(m=>m.unlocked).map(m=>'<option value="'+m.id+'">'+m.title+'</option>').join('');
 $('#title-select').value=state.titleId;$('#title-select').disabled=blocked;
 window.UmaQuestScreen?.refresh({state,t,date:d,blocked,trial,septemberTest,earlyTest});
 renderSelectedQuest();
}
function renderSelectedQuest(){
 const slot=$('#diary-quest-detail');if(!slot||!selectedQuestId)return;
 questImageRevision++;questImage=null;questImageId='';
 const q=K.released(date()).find(q=>q.id===selectedQuestId);
 slot.innerHTML=q?questCard(q):'<p class="empty">この挑戦状はまだ公開されていません。</p>';
 if(q&&state.completed[q.id])prepareQuestImage(q);
}
document.addEventListener('diary-select-quest',e=>{if(K.released(date()).some(q=>q.id===e.detail)){selectedQuestId=e.detail;renderSelectedQuest();}});
function showTab(id){all('[data-tab]').forEach(b=>{if(b.dataset.tab===id)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});all('.tab-panel').forEach(p=>p.hidden=p.id!==id);window.UmaQuestScreen?.switchTab(id);}
document.addEventListener('journey-name',e=>{
 const value=[...String(e.detail).trim()].slice(0,16).join('');
 if(!value){notice('冒険者の名前を入力してください。');return;}
 if(commit({...state,name:value,onboarded:true}))window.UmaQuestScreen?.depart();
});
all('[data-tab]').forEach(b=>b.addEventListener('click',()=>showTab(b.dataset.tab)));
all('[data-close]').forEach(b=>b.addEventListener('click',()=>$('#'+b.dataset.close).close()));
$('#name-form').addEventListener('submit',e=>{e.preventDefault();const name=[...$('#player-name').value.trim()].slice(0,16).join('');if(!name)return;if(commit({...state,name})){notice('名前を保存しました。');}});
$('#title-select').addEventListener('change',e=>{if(!commit({...state,titleId:e.target.value}))e.target.value=state.titleId;});
document.addEventListener('click',e=>{
 const report=e.target.closest('[data-report]'),share=e.target.closest('[data-share]'),save=e.target.closest('[data-save-quest]');
 if(report)recordQuest(report.dataset.report);
 if(share&&state.completed[share.dataset.share])window.UmaQuestExport.post(K.shareText(K.byId[share.dataset.share].title));
 if(save&&state.completed[save.dataset.saveQuest]){const q=K.byId[save.dataset.saveQuest];if(questImage&&questImageId===q.id){window.UmaQuestExport.save(questImage,'umasan-quest-'+q.id+'.png');$('#quest-export-note').textContent='画像の保存を開始しました。';}else prepareQuestImage(q);}
});
function recordQuest(id){
 if(blocked||state.completed[id])return;
 const before=stats();
 try{
  const next=K.complete(state,id,now());
  if(!commit(next))return;
  const after=stats(),awards=after.trophies.filter(t=>t.unlocked&&!before.trophies.find(b=>b.id===t.id).unlocked);
  if(after.level>before.level&&window.UmaQuestScreen){window.UmaQuestScreen.levelUp({state,before,after,quest:K.byId[id],trial});return;}
  notice('EXP +'+K.byId[id].reward.xp+' · '+category(K.byId[id].category).name+' +'+K.byId[id].reward.stat+'\nLv.'+before.level+' → Lv.'+after.level+(awards.length?'\nトロフィー獲得：'+awards.map(t=>t.name).join('・'):''));
 }catch(e){notice(e.message);}
}
async function prepareQuestImage(q){
 const token=++questImageRevision,E=window.UmaQuestExport,button=$('[data-save-quest="'+q.id+'"]'),note=$('#quest-export-note');
 if(!button||!note)return;button.disabled=true;note.textContent='画像を準備しています…';
 const name=state.name||'冒険者',completed=K.day(new Date(state.completed[q.id])),summary=stats(),statName=window.UmaQuestScreen?.statNames[q.category]||category(q.category).name;
 try{
  const art=await E.image(C.artwork[q.category]);
  const blob=await E.render(1080,1350,(ctx,withArt)=>{
   ctx.fillStyle='#fff3dc';ctx.fillRect(0,0,1080,1350);ctx.strokeStyle='#b58c48';ctx.lineWidth=3;ctx.strokeRect(40,40,1000,1270);ctx.strokeRect(49,49,982,1252);
   const text=(value,y,size=34,color='#56391f')=>{ctx.fillStyle=color;ctx.font='600 '+size+'px "Yu Mincho",serif';ctx.textAlign='center';ctx.fillText(String(value),540,y,920);};
   text(C.title,120,30);text('冒険クリア！',235,70,'#697540');text(name,365,62);text('Lv. '+summary.level+' ・ '+summary.title,426,30);
   if(withArt&&art){const scale=Math.min(380/art.naturalWidth,380/art.naturalHeight);ctx.drawImage(art,540-art.naturalWidth*scale/2,477,art.naturalWidth*scale,art.naturalHeight*scale);}else{text('✦',720,130,'#a88644');}
   text(q.title,965,46);text('+ '+q.reward.xp+' EXP ・ '+statName+' +'+q.reward.stat,1050,36);text(completed.replaceAll('-','.')+' 達成',1140,28);text((trial?'試用記録 · ':'')+C.start.replaceAll('-','.')+' — '+C.end.replaceAll('-','.'),1260,24);
  });if(token!==questImageRevision)return;questImage=blob;questImageId=q.id;button.disabled=false;button.textContent='画像を保存';note.textContent='';
 }catch(e){if(token===questImageRevision){button.disabled=false;button.textContent='画像を再作成';note.textContent=E.errorCode(e)+'。再作成できます。';}}
}
$('#retry-storage').addEventListener('click',()=>location.reload());
$('#quest-manifest').href=earlyTest?'uma-quest-early.webmanifest':trial?'uma-quest-trial.webmanifest':'uma-quest.webmanifest';
let lastDate=date();
function refreshDate(){if((!trial||earlyTest)&&date()!==lastDate){lastDate=date();render();}}
setInterval(refreshDate,10000);document.addEventListener('visibilitychange',refreshDate);
render();
})();
