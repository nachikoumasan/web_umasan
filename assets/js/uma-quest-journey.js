(() => {
'use strict';
const $=s=>document.querySelector(s),K=window.UmaQuestCore,C=K.C,E=window.UmaQuestExport;
const statNames={explore:'観察力',create:'創造力',challenge:'行動力',rest:'回復力'};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const make=(tag,cls,html='')=>{const e=document.createElement(tag);e.className=cls;e.innerHTML=html;return e;};
const app=make('div','journey-app');app.id='quest-app';document.body.prepend(app);
const brand=()=>'<img src="media/icon-horseshoe.webp" alt=""><span>うまさんからの挑戦状</span>';
const head=make('header','journey-head','<a href="./" aria-label="旅するうまさんのホーム">'+brand()+'</a><button type="button" id="journey-menu" aria-label="名前・設定を開く">☰</button>');app.append(head);
const main=make('main','journey-main');main.id='adventure';$('#adventure').removeAttribute('id');app.append(main);
function sheet(id,title){const el=make('dialog','journey-sheet','<header><h2>'+title+'</h2><button type="button" aria-label="閉じる">×</button></header><div class="sheet-body"></div>');el.id=id;document.body.append(el);el.querySelector('button').onclick=()=>el.close();return{el,body:el.querySelector('.sheet-body')};}
const settings=sheet('journey-settings','冒険の設定');
settings.body.append($('.profile-name'),$('#storage-error'));
settings.body.append(make('p','storage-note','このブラウザに保存されます。ブラウザのデータ削除などで記録が失われることがあります。'));
$('#journey-menu').onclick=()=>settings.el.showModal();
const today=$('#today');today.className='journey-view quest-view';main.append(today);document.querySelector('body>main').remove();
const start=make('section','journey-view start-view','<h1>ここから、<br>あなたの冒険。</h1><img class="door-guide" src="media/camera-pose-back.png" alt="あなたを誘ううまさん"><form id="departure-form" class="adventure-pass"><label for="journey-name">冒険者の名前</label><input id="journey-name" maxlength="16" required autocomplete="off"><p>ニックネームでOK</p><button class="primary" type="submit">この名前で出発する →</button><p class="first-storage">このブラウザに保存されます。データ削除などで記録が失われることがあります。</p></form>');start.id='journey-start';main.append(start);
$('#departure-form').onsubmit=e=>{e.preventDefault();document.dispatchEvent(new CustomEvent('journey-name',{detail:$('#journey-name').value}));};
const level=make('section','journey-view level-view','<p class="level-up-heading">LEVEL UP!</p><div class="level-emblem" aria-hidden="true"><span id="level-initial"></span></div><h1 id="level-name"></h1><p class="level-before"></p><p class="level-after"></p><p class="level-growth"></p><p class="level-xp"></p><div class="level-guide"><p>よし！<br>もっとすてきな景色が<br>待っているよ！</p><img src="media/camera-pose-wave.png" alt="あなたの成長を喜ぶ案内役のうまさん"></div><div class="export-actions"><button id="save-level" disabled>画像を保存</button><button id="share-level">Xでシェア</button></div><button id="continue-journey" class="text-button">冒険を続ける　›</button><p class="level-image-message" role="status"></p>');level.id='journey-level';main.append(level);
const particles=make('div','level-particles','<span>✦</span><span>❧</span><span>✧</span><span>✦</span><span>❧</span>');particles.setAttribute('aria-hidden','true');level.prepend(particles);
$('#continue-journey').onclick=()=>switchTab('today');
const nav=make('nav','journey-nav','<button data-tab="today" aria-current="page"><img src="media/icon-book-storybook.webp" alt="">クエスト</button><button data-tab="journal"><img src="media/icon-compass-storybook.webp" alt="">ステータス</button>');nav.setAttribute('aria-label','冒険メニュー');app.append(nav);
let model,active='today',growthFile=null,shareData=null,revision=0;
const growthCaption=data=>K.shareText(data.quest.title)+'\n'+data.state.name+' Lv.'+data.before.level+' → '+data.t.level;
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
function switchTab(id){if(id==='journal')id='diary-result';active=id;for(const [key,el]of [['today',today],['start',start],['level',level]])el.hidden=key!==id;main.querySelectorAll('[data-diary-view]').forEach(el=>el.hidden=el.dataset.diaryView!==id);document.body.dataset.journey=id;nav.hidden=['start','level'].includes(id);$('#journey-menu').hidden=true;nav.querySelectorAll('button').forEach(b=>{if(b.dataset.tab===id||(id==='diary-result'&&b.dataset.tab==='journal'))b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});document.dispatchEvent(new CustomEvent('journey-view',{detail:id}));window.scrollTo({top:0,behavior:'instant'});}
function refresh(data){
 if(data)model=data;if(!model)return;const{state,blocked}=model;
 if(!state.name.trim()&&!blocked){$('#journey-name').value=state.name;switchTab('start');}else if(active==='start')switchTab('today');
 if(blocked)switchTab('diary-menu');
}
function depart(){switchTab('today');if(!reduced()){app.classList.add('departing');setTimeout(()=>app.classList.remove('departing'),480);}}
function animateQuest(id,kind){const article=[...document.querySelectorAll('[data-quest-id]')].find(e=>e.dataset.questId===id&&e.getClientRects().length);if(article&&!reduced()){article.classList.add(kind);setTimeout(()=>article.classList.remove(kind),500);}}
function levelUp(data){
 const{state,before,after,quest}=data;
 $('#level-initial').textContent=[...(state.name||'旅')][0];$('#level-name').textContent=state.name;
 $('.level-before').textContent='Lv. '+before.level+' →';$('.level-after').textContent='Lv. '+after.level;
 $('.level-growth').textContent=statNames[quest.category]+' '+before.stats[quest.category]+' → '+after.stats[quest.category];$('.level-xp').textContent='+ '+quest.reward.xp+' EXP';
 switchTab('level');prepareGrowth({...data,t:after,kind:'level'});
}
async function prepareGrowth(data){
 const token=++revision;growthFile=null;shareData=data;$('#save-level').disabled=true;$('.level-image-message').textContent='画像を準備しています…';
 try{
 const guide=await E.image('media/camera-pose-wave.png');
 const blob=await E.render(1080,1350,(ctx,art)=>{
  const {state,t,before,quest}=data;
  const glow=ctx.createRadialGradient(540,510,10,540,510,720);glow.addColorStop(0,'#fff8c9');glow.addColorStop(1,'#fff5e7');ctx.fillStyle=glow;ctx.fillRect(0,0,1080,1350);
  ctx.strokeStyle='#b78b3f';ctx.lineWidth=3;ctx.strokeRect(45,45,990,1260);
  const text=(value,y,size=32,color='#50321d',max=900)=>{ctx.font='600 '+size+'px "Yu Mincho",serif';ctx.fillStyle=color;ctx.textAlign='center';ctx.fillText(String(value),540,y,max);};
  text(C.title,115,28);text('LEVEL UP!',235,86,'#886023');text(state.name,405,70);text(t.title,466,30);text('Lv. '+before.level+' →',570,44);text('Lv. '+t.level,750,145);
  text(statNames[quest.category]+' '+before.stats[quest.category]+' → '+t.stats[quest.category],880,48);text('+ '+quest.reward.xp+' EXP',975,58);
  if(art&&guide){const scale=Math.min(220/guide.naturalWidth,210/guide.naturalHeight);ctx.drawImage(guide,775,1040,guide.naturalWidth*scale,guide.naturalHeight*scale);}
  text('次の冒険も、あなたのペースで。',1130,28,'#715938',680);text((data.trial?'試用記録 · ':'')+C.start.replaceAll('-','.')+' — '+C.end.replaceAll('-','.'),1270,24);
 });if(token!==revision)return;
 growthFile=blob;$('#save-level').disabled=false;$('#save-level').textContent='画像を保存';$('.level-image-message').textContent='';
 }catch(e){if(token===revision){$('#save-level').disabled=false;$('#save-level').textContent='画像を再作成';$('.level-image-message').textContent=E.errorCode(e)+'。再作成できます。記録は保存済みです。';}}
}
$('#save-level').onclick=()=>{if(growthFile){E.save(growthFile,'umasan-level-lv'+shareData.t.level+'.png');$('.level-image-message').textContent='保存した画像はXの投稿画面で添付できます。';}else if(shareData)prepareGrowth(shareData);};
$('#share-level').onclick=()=>{if(shareData)E.post(growthCaption(shareData));};
switchTab('today');
window.addEventListener('load',()=>window.scrollTo({top:0,behavior:'instant'}));
window.UmaQuestScreen={statNames,refresh,depart,animateQuest,levelUp,switchTab,fitCard(){}};
})();
