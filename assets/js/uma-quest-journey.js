(() => {
'use strict';
const $=s=>document.querySelector(s),K=window.UmaQuestCore,C=K.C;
const statNames={explore:'観察力',create:'創造力',challenge:'行動力',rest:'回復力'};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const make=(tag,cls,html='')=>{const e=document.createElement(tag);e.className=cls;e.innerHTML=html;return e;};
const app=make('div','journey-app');app.id='quest-app';document.body.prepend(app);
const brand=()=>'<img src="media/icon-horseshoe.webp" alt=""><span>うまさんからの挑戦状</span>';
const head=make('header','journey-head','<a href="./" aria-label="旅するうまさんのホーム">'+brand()+'</a><button type="button" id="journey-menu" aria-label="名前・設定を開く">☰</button>');app.append(head);
const main=make('main','journey-main');main.id='adventure';$('#adventure').removeAttribute('id');app.append(main);
function sheet(id,title){const el=make('dialog','journey-sheet','<header><h2>'+title+'</h2><button type="button" aria-label="閉じる">×</button></header><div class="sheet-body"></div>');el.id=id;document.body.append(el);el.querySelector('button').onclick=()=>el.close();return{el,body:el.querySelector('.sheet-body')};}
const settings=sheet('journey-settings','冒険の設定');
settings.body.append($('.profile-name'),$('#storage-error'),$('.backup'),$('.dev-tools'),$('#phase-note'),$('#intro'));
$('#intro').style.display='none';
settings.body.append(make('p','storage-note','このブラウザに保存されます。ブラウザのデータ削除などで記録が失われることがあります。<br>同じ端末・同じブラウザで遊び、冒険の書を保存してください。プライベートブラウズでの継続利用は避けてください。'));
$('#journey-menu').onclick=()=>settings.el.showModal();
const history=sheet('journey-history','冒険の記録');history.body.append($('#history'));
const trophies=sheet('journey-trophies','トロフィーと称号');trophies.body.append($('#title-select').closest('label'),$('#trophies'));
const results=sheet('journey-results','冒険の記念カード');results.body.append($('#result'));$('#result').className='legacy-result';$('#result').hidden=false;
const past=sheet('journey-past','これまでのクエスト');past.body.append($('#past-list'));
const profile=$('.profile'),stats=$('#stats'),count=$('#clear-count');
const player=make('button','passport-name');player.type='button';player.id='passport-name';player.onclick=()=>settings.el.showModal();$('.profile-top').prepend(player);
const status=$('#journal');status.innerHTML='<div class="view-heading"><h1>ステータス</h1><p>今日のわたしも、少しずつ前へ。</p></div><div class="leather-book"><div class="passport"><p class="passport-label">冒険者証 <small>ADVENTURER PASS</small></p><div class="identity-mark" aria-hidden="true"></div></div></div>';
status.className='journey-view status-view';
const passport=status.querySelector('.passport');passport.append(profile,make('p','next-exp'),stats,count);
passport.append(make('p','gauge-note','ゲージは4つの力のバランスを表します。能力の上限ではありません。'));
const shareStatus=make('button','primary','成長をシェア');shareStatus.id='share-growth';passport.append(shareStatus);
const links=make('div','status-links','<button id="open-history">冒険の記録</button><button id="open-trophies">トロフィー・称号</button><button id="open-results">記念カードをつくる</button>');status.append(links);
$('#open-history').onclick=()=>history.el.showModal();$('#open-trophies').onclick=()=>trophies.el.showModal();$('#open-results').onclick=()=>results.el.showModal();
const extras=sheet('journey-extras','冒険の記録とご案内');
const more=make('button','mobile-more','記録・トロフィー　›');more.type='button';more.onclick=()=>extras.el.showModal();status.append(more);
for(const [label,target] of [['冒険の記録',history],['トロフィー・称号',trophies],['記念カードをつくる',results]]){const b=make('button','',label);b.type='button';b.onclick=()=>{extras.el.close();target.el.showModal();};extras.body.append(b);}
extras.body.append(make('p','storage-note','ゲージは4つの力のバランスを表します。能力の上限ではありません。'));
const today=$('#today');today.className='journey-view quest-view';today.querySelector('.section-title').remove();
today.prepend(make('div','quest-scene-heading','<div class="view-heading"><h1>クエスト</h1><p>今日も、すてきな発見を。</p><p id="journey-date"></p></div><img src="media/camera-pose-lantern.png" alt="挑戦状を届ける案内役のうまさん" class="desk-guide">'));
$('#past-quests').style.display='none';
const pastButton=make('button','past-link','これまでのクエスト　›');pastButton.onclick=()=>past.el.showModal();today.append(pastButton);
today.querySelector('.small-note').className='quest-help';
const instructions=sheet('journey-instructions','遊び方');instructions.body.append(make('p','',today.querySelector('.quest-help').innerHTML));
const help=make('button','mobile-help','遊び方');help.type='button';help.onclick=()=>instructions.el.showModal();today.append(help);
main.append(today,status);
const start=make('section','journey-view start-view','<h1>ここから、<br>あなたの冒険。</h1><img class="door-guide" src="media/camera-pose-back.png" alt="振り返ってあなたを誘う、うまさん"><form id="departure-form" class="adventure-pass"><label for="journey-name">冒険者の名前</label><input id="journey-name" maxlength="16" required autocomplete="off"><p>ニックネームでOK</p><button class="primary" type="submit">この名前で出発する　→</button><p class="first-storage">このブラウザに保存されます。データ削除などで記録が失われることがあります。<br>冒険の書でバックアップできます。</p><p class="first-storage">同じ端末・同じブラウザで遊んでね。プライベートブラウズでの継続利用は避けてください。</p></form>');start.id='journey-start';main.append(start);
$('#departure-form').onsubmit=e=>{e.preventDefault();document.dispatchEvent(new CustomEvent('journey-name',{detail:$('#journey-name').value}));};
const firstHelp=make('details','first-help','<summary>記録の保存について</summary>');start.querySelectorAll('.first-storage').forEach(p=>firstHelp.append(p));$('#departure-form').append(firstHelp);
const level=make('section','journey-view level-view','<p class="level-up-heading">LEVEL UP!</p><div class="level-emblem" aria-hidden="true"><span id="level-initial"></span></div><h1 id="level-name"></h1><p class="level-before"></p><p class="level-after"></p><p class="level-growth"></p><p class="level-xp"></p><div class="level-guide"><p>よし！<br>もっとすてきな景色が<br>待っているよ！</p><img src="media/camera-pose-wave.png" alt="あなたの成長を喜ぶ案内役のうまさん"></div><button id="share-level" class="primary" disabled>画像を保存・シェア</button><button id="continue-journey" class="text-button">冒険を続ける　›</button><p class="level-image-message" role="status"></p>');level.id='journey-level';main.append(level);
const particles=make('div','level-particles','<span>✦</span><span>❧</span><span>✧</span><span>✦</span><span>❧</span>');particles.setAttribute('aria-hidden','true');level.prepend(particles);
$('#continue-journey').onclick=()=>switchTab('today');
const nav=make('nav','journey-nav','<button data-tab="today" aria-current="page"><img src="media/icon-book-storybook.webp" alt="">クエスト</button><button data-tab="journal"><img src="media/icon-compass-storybook.webp" alt="">ステータス</button>');nav.setAttribute('aria-label','冒険メニュー');app.append(nav);
// Retire the old presentation containers, while every saved-data operation remains mounted.
$('.site-head').hidden=true;$('.hero').hidden=true;$('.tabs').hidden=true;document.querySelector('body>main').hidden=true;document.querySelector('body>footer').hidden=true;$('.preview-note').hidden=true;
const imageSheet=sheet('growth-image-sheet','あなたの成長の記録');imageSheet.body.innerHTML='<img id="growth-image" alt="名前と実際の成長記録を入れた画像"><button id="growth-download" class="primary" disabled>画像を保存</button><button id="growth-native-share" disabled>シェアする</button><p id="growth-image-note" role="status"></p>';
const caption=make('textarea','growth-caption');caption.readOnly=true;caption.setAttribute('aria-label','投稿文');imageSheet.body.append(caption);
const copyCaption=make('button','','投稿文をコピー');copyCaption.type='button';imageSheet.body.append(copyCaption);
let model,active='today',growthFile=null,shareData=null,revision=0;
const growthCaption=data=>data.kind==='level'?K.shareText(data.quest.title)+'\n'+data.state.name+' Lv.'+data.before.level+' → '+data.t.level:data.state.name+'の冒険記録　Lv.'+data.t.level+'\n#旅するうまさん #うまさんからの挑戦状\n'+C.url;
copyCaption.onclick=async()=>{try{await navigator.clipboard.writeText(caption.value);$('#growth-image-note').textContent='投稿文をコピーしました。投稿先は自分で選べます。';}catch{caption.focus();caption.select();$('#growth-image-note').textContent='投稿文を選択しました。端末のコピー操作をお使いください。';}};
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
function switchTab(id){active=id;for(const [key,el]of [['today',today],['journal',status],['start',start],['level',level]])el.hidden=key!==id;main.querySelectorAll('[data-diary-view]').forEach(el=>el.hidden=el.dataset.diaryView!==id);document.body.dataset.journey=id;nav.hidden=['start','level'].includes(id);$('#journey-menu').hidden=id==='level';nav.querySelectorAll('button').forEach(b=>{if(b.dataset.tab===id||(id==='diary-result'&&b.dataset.tab==='journal'))b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});document.dispatchEvent(new CustomEvent('journey-view',{detail:id}));window.scrollTo({top:0,behavior:'instant'});}
function refresh(data){
 if(data)model=data;if(!model)return;const{state,t,date,blocked}=model;
 player.textContent=state.name||'名もなき冒険者';$('.identity-mark').textContent=[...(state.name||'旅')][0];
 $('.next-exp').textContent='次のレベルまで '+(C.xpPerLevel-t.exp)+' EXP';
 const largest=Math.max(1,...Object.values(t.stats));
 stats.innerHTML=C.categories.map(c=>'<div class="ability"><img src="'+c.icon+'" alt=""><span>'+statNames[c.id]+'</span><progress value="'+t.stats[c.id]+'" max="'+largest+'" aria-label="'+statNames[c.id]+'のバランス"></progress><strong>'+t.stats[c.id]+'</strong></div>').join('');
 count.textContent='クリアしたクエスト　'+t.done.length;
 $('#journey-date').textContent=model.septemberTest?'9月のテストプレイ':Number(date.slice(5,7))+'月'+Number(date.slice(8,10))+'日';
 pastButton.hidden=!K.released(date).some(q=>q.date<date);shareStatus.disabled=blocked;
 if(!state.name.trim()&&!blocked){$('#journey-name').value=state.name;switchTab('start');}else if(active==='start')switchTab('today');
 if(blocked&&!settings.el.open)settings.el.showModal();
}
function depart(){switchTab('today');if(!reduced()){app.classList.add('departing');setTimeout(()=>app.classList.remove('departing'),480);}}
function animateQuest(id,kind){const article=[...document.querySelectorAll('[data-quest-id]')].find(e=>e.dataset.questId===id&&e.getClientRects().length);if(article&&!reduced()){article.classList.add(kind);setTimeout(()=>article.classList.remove(kind),500);}}
function levelUp(data){
 const{state,before,after,quest}=data;past.el.close();history.el.close();
 $('#level-initial').textContent=[...(state.name||'旅')][0];$('#level-name').textContent=state.name;
 $('.level-before').textContent='Lv. '+before.level+' →';$('.level-after').textContent='Lv. '+after.level;
 $('.level-growth').textContent=statNames[quest.category]+' '+before.stats[quest.category]+' → '+after.stats[quest.category];$('.level-xp').textContent='+ '+quest.reward.xp+' EXP';
 switchTab('level');prepareGrowth({...data,t:after,kind:'level'});
}
const imgCache=new Map();async function asset(src){if(!imgCache.has(src)){const i=new Image();i.src=src;imgCache.set(src,i.decode().then(()=>i));}return imgCache.get(src);}
async function prepareGrowth(data){
 const token=++revision;growthFile=null;shareData=data;caption.value=growthCaption(data);$('#share-level').disabled=true;$('#growth-download').disabled=true;$('#growth-native-share').disabled=true;$('#growth-image').removeAttribute('src');$('#growth-image-note').textContent='画像を準備しています…';$('.level-image-message').textContent='';
 try{
  await document.fonts.ready;await document.fonts.load('32px "Yu Mincho"','冒険者');
  const[book,guide]=await Promise.all([asset('media/quest/diary-map-v1.jpg'),asset('media/camera-pose-wave.png')]);if(token!==revision)return;
  const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1440;const ctx=canvas.getContext('2d'),{state,t,kind}=data;
  ctx.fillStyle='#fff6e5';ctx.fillRect(0,0,1080,1440);
  if(kind==='status'){ctx.drawImage(book,0,book.naturalHeight*.4,book.naturalWidth,book.naturalHeight*.33,80,240,920,220);ctx.fillStyle='#fff6e533';ctx.fillRect(80,240,920,220);const scale=Math.min(180/guide.naturalWidth,205/guide.naturalHeight);ctx.drawImage(guide,770,260,guide.naturalWidth*scale,guide.naturalHeight*scale);}else{const glow=ctx.createRadialGradient(540,510,10,540,510,720);glow.addColorStop(0,'#fff8c9');glow.addColorStop(1,'#fff5e7');ctx.fillStyle=glow;ctx.fillRect(0,0,1080,1440);ctx.save();ctx.translate(540,500);ctx.fillStyle='#e5b65335';for(let n=0;n<20;n++){ctx.rotate(Math.PI/10);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(-18,-650);ctx.lineTo(18,-650);ctx.fill();}ctx.restore();}
  ctx.strokeStyle='#b78b3f';ctx.lineWidth=3;ctx.strokeRect(50,50,980,1340);
  const text=(value,y,size=32,color='#50321d',max=780)=>{ctx.font='600 '+size+'px "Yu Mincho",serif';ctx.fillStyle=color;ctx.textAlign='center';ctx.fillText(String(value),540,y,max);};
  text(C.title,115,28);text(kind==='level'?'LEVEL UP!':'わたしの冒険の記録',210,kind==='level'?74:45,'#886023');
  ctx.fillStyle='#64733e';ctx.beginPath();ctx.arc(540,355,92,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#c7a45c';ctx.lineWidth=10;ctx.stroke();text([...(state.name||'旅')][0],383,64,'#fff2d0');
  text(state.name,520,64);text(t.title,573,27);
  if(kind==='level'){text('Lv. '+data.before.level+' →',648,42);text('Lv. '+t.level,770,118);text(statNames[data.quest.category]+' '+data.before.stats[data.quest.category]+' → '+t.stats[data.quest.category],875,45);text('+ '+data.quest.reward.xp+' EXP',960,56);}
  else{text('Lv. '+t.level,690,100);text(t.exp+' / '+C.xpPerLevel+' EXP',747,29);ctx.fillStyle='#e1d5b7';ctx.fillRect(230,772,620,18);ctx.fillStyle='#758444';ctx.fillRect(230,772,620*t.exp/C.xpPerLevel,18);text('次のレベルまで '+(C.xpPerLevel-t.exp)+' EXP',835,27);C.categories.forEach((c,i)=>text(statNames[c.id]+'　'+t.stats[c.id],915+i*68,36));text('クリアしたクエスト　'+t.done.length,1210,32);}
  if(kind==='level'){const scale=Math.min(250/guide.naturalWidth,260/guide.naturalHeight);ctx.drawImage(guide,765,1080,guide.naturalWidth*scale,guide.naturalHeight*scale);text('次の冒険も、あなたのペースで。',1145,28,'#715938',640);}
  text((data.trial?'試用記録 · ':'')+C.start.replaceAll('-','.')+' — '+C.end.replaceAll('-','.'),1350,24);
  const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('PNG生成に失敗しました。')),'image/png'));if(token!==revision)return;
  growthFile=new File([blob],'umasan-'+kind+'-lv'+t.level+'.png',{type:'image/png'});$('#growth-image').src=canvas.toDataURL('image/png');$('#share-level').disabled=false;$('#growth-download').disabled=false;$('#growth-native-share').disabled=false;$('#growth-image-note').textContent='名前と実際の成長記録を入れた画像です。';
 }catch(e){if(token===revision){$('#growth-image-note').textContent='画像を用意できませんでした。閉じてからもう一度お試しください。';$('.level-image-message').textContent='画像を用意できませんでした。ステータスから作り直せます。';}}
}
function download(){if(!growthFile)return;const url=URL.createObjectURL(growthFile),a=document.createElement('a');a.href=url;a.download=growthFile.name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);$('#growth-image-note').textContent='画像の保存を開始しました。画像の長押しからも保存できます。';}
async function share(){if(!growthFile)return;const data={files:[growthFile],title:C.title,text:growthCaption(shareData)};try{if(navigator.share&&navigator.canShare?.(data))await navigator.share(data);else{download();if(!imageSheet.el.open)imageSheet.el.showModal();}}catch(e){if(e.name!=='AbortError'){if(!imageSheet.el.open)imageSheet.el.showModal();$('#growth-image-note').textContent='共有できませんでした。「画像を保存」をお使いください。';}}}
shareStatus.onclick=()=>{imageSheet.el.showModal();prepareGrowth({...model,kind:'status'});};$('#share-level').onclick=share;$('#growth-download').onclick=download;$('#growth-native-share').onclick=share;
switchTab('today');
window.addEventListener('load',()=>window.scrollTo({top:0,behavior:'instant'}));
window.UmaQuestScreen={statNames,refresh,depart,animateQuest,levelUp,switchTab,fitCard(){}};
})();
