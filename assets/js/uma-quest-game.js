(() => {
'use strict';
const $=s=>document.querySelector(s),K=window.UmaQuestCore,C=K.C,screen=window.UmaQuestScreen,E=window.UmaQuestExport;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const make=(tag,cls,html='')=>{const e=document.createElement(tag);e.className=cls;e.innerHTML=html;return e;};
const shapes={home:'M3 11 12 3l9 8M5 10v11h5v-7h4v7h5V10',map:'m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2Zm6-2v16m6-14v16',record:'M6 3h12v18H6ZM9 7h6M9 11h6M9 15h4',bag:'M4 8h16v13H4ZM8 8V5a4 4 0 0 1 8 0v3M4 12h16M10 12v3h4v-3',menu:'M5 6h14M5 12h14M5 18h14'};
const icon=key=>'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="'+shapes[key]+'"/></svg>';
function sheet(id,title){const e=make('dialog','journey-sheet diary-sheet','<header><h2>'+title+'</h2><button type="button" aria-label="閉じる">×</button></header><div class="sheet-body"></div>');e.id=id;document.body.append(e);e.querySelector('button').onclick=()=>e.close();return e;}
function view(id,html){const e=make('section','journey-view diary-page',html);e.id=id;e.dataset.diaryView=id;e.hidden=true;$('.journey-main').append(e);return e;}
const questSheet=sheet('diary-quest-sheet','あなたへの挑戦状');questSheet.querySelector('.sheet-body').id='diary-quest-detail';
const areaSheet=sheet('diary-area-sheet','この場所の挑戦状');
let model,choiceIds=[],choiceDay='',selectedArea=0,areaPage=0;
const go=id=>screen.switchTab(id);
const nav=$('.journey-nav');nav.innerHTML=[['today','home','ホーム'],['diary-map','map','旅マップ'],['diary-result','record','記録'],['diary-bag','bag','持ちもの'],['diary-menu','menu','メニュー']].map(([id,i,label])=>'<button type="button" data-tab="'+id+'">'+icon(i)+'<span>'+label+'</span></button>').join('');
$('.journey-head a').hidden=true;$('.journey-head').append(make('h1','diary-page-title','今日の冒険'));
const headings={today:'今日の冒険','diary-map':'旅マップ',journal:'成長の記録','diary-bag':'持ちもの','diary-menu':'メニュー','diary-result':'冒険の記念カード',start:'うまさんからの挑戦状',level:'冒険の足あと'};
document.addEventListener('journey-view',e=>{$('.diary-page-title').textContent=headings[e.detail]||C.title;if(e.detail==='diary-result'){renderMemory();if(model?.t.canResult&&!model.blocked)prepareMemory();}if(e.detail==='diary-bag'&&model&&!model.blocked)prepareTrophies();});
const dashboard=make('div','diary-dashboard','<div class="diary-welcome"><div class="diary-bubble"><strong>おかえりなさい！</strong><p>今日も小さな冒険に<br>出かけよう！</p></div><img src="media/camera-pose-lantern.png" alt="扉の前であなたを迎えるうまさん"><div class="welcome-name"><span id="diary-name"></span><strong id="diary-level"></strong></div></div><div class="diary-home-paper"><h2 class="diary-divider">今日のクエスト</h2><div id="diary-choices"></div><div class="diary-lantern"><img src="media/icon-lantern.png" alt=""><div><p>ランタンの灯り <small>冒険の足あと</small></p><span id="diary-lights" aria-hidden="true"></span></div><strong id="diary-total"></strong></div><p id="diary-test-note" class="diary-test-note"></p></div>');$('#today').append(dashboard);
const areas=[{name:'朝やけの丘',sub:'小さな発見の場所',cats:['explore']},{name:'寄り道小道',sub:'つくって、やってみる',cats:['create','challenge']},{name:'ひとやすみの森',sub:'自分をいたわる場所',cats:['rest']}];
view('diary-map','<div class="diary-map-art"><div class="map-sky-note">日常の先に、まだ知らない景色。</div><svg class="map-route" viewBox="0 0 360 600" preserveAspectRatio="none" aria-hidden="true"><path d="M185 68 C360 165,0 155,112 292 S350 335,245 470 S160 515,158 575"/></svg><div id="diary-map-nodes"></div><div class="map-future"><span>♧</span>次の旅は、準備中。</div></div>');
view('diary-bag','<p class="diary-page-intro">小さな挑戦が、旅の宝物に。</p><div class="bag-cover"><img src="media/icon-bag-storybook.webp" alt=""><div><span>あなたの旅のコレクション</span><strong id="bag-count"></strong></div></div><div id="bag-content"></div><p class="diary-footnote">休んでも、集めた記録はなくなりません。</p>');
$('#bag-content').append($('#title-select').closest('label'),$('#trophies'));
// All trophies remain visible; selecting one changes only the detail below.
const catalogue=$('#trophies');catalogue.className='trophy-catalogue';
let catalogueItems=[],catalogueSelected='';
function renderCatalogue(){
 if(!catalogueItems.some(t=>t.id===catalogueSelected))catalogueSelected=catalogueItems[0]?.id||'';
 const selected=catalogueItems.find(t=>t.id===catalogueSelected);
 catalogue.innerHTML='<div class="catalogue-slots">'+catalogueItems.map(t=>'<button class="catalogue-slot '+(t.unlocked?'earned':'locked')+'" data-trophy="'+esc(t.id)+'" aria-pressed="'+(t.id===catalogueSelected)+'" aria-label="'+esc(t.name)+'・'+(t.unlocked?'獲得済み':'未獲得')+'"><img src="'+t.icon+'" alt=""><span>'+esc(t.name)+'</span><small>'+(t.unlocked?'獲得済み':'未獲得')+'</small></button>').join('')+'</div>'+(selected?'<section class="catalogue-detail" aria-live="polite"><div><strong>'+esc(selected.name)+'</strong><span>'+selected.progress+' / '+selected.target+'</span></div><p>'+esc(selected.rule)+'</p><progress value="'+selected.progress+'" max="'+selected.target+'" aria-label="'+esc(selected.name)+'の進捗"></progress><small>称号：'+esc(selected.title)+'</small></section>':'');
}
screen.renderTrophies=items=>{catalogueItems=items;renderCatalogue();};
catalogue.onclick=e=>{const entry=e.target.closest('[data-trophy]');if(entry){catalogueSelected=entry.dataset.trophy;renderCatalogue();catalogue.querySelector('[aria-pressed="true"]').focus({preventScroll:true});}};
$('#diary-bag').append(make('div','export-actions','<button id="trophy-save" disabled>画像を保存</button><button id="trophy-share">Xでシェア</button>'),make('p','export-note',''));
$('#diary-bag .export-note').id='trophy-note';$('#trophy-note').setAttribute('role','status');
view('diary-menu','<div class="menu-brand"><img src="media/camera-pose-sit.png" alt=""><div>旅するうまさん<small>まいにちの冒険手帳</small></div></div><div id="diary-settings-inline"></div>');
$('#journey-menu').hidden=true;
$('#diary-settings-inline').append($('#name-form'),$('#storage-error'),$('#journey-settings .storage-note'));
view('diary-result','<article id="diary-memory" class="diary-memory"><p class="diary-divider">あなたの冒険記録カード</p><div class="memory-owner"><strong id="memory-name"></strong><span id="memory-level"></span></div><p id="memory-title"></p><div class="memory-experience"><progress id="memory-exp" aria-label="次のレベルへの経験値"></progress><small id="memory-next"></small></div><div class="memory-picture"><img src="media/camera-pose-lantern.png" alt="あなたの冒険を祝ううまさん"><p>いつもの毎日も、<br>ちゃんと冒険だったよ。</p></div><div id="memory-numbers"></div><p id="memory-favorite"></p><p id="memory-date"></p></article><div class="memory-actions export-actions"><button id="memory-save" class="primary">画像を保存</button><button id="memory-share">Xでシェア</button></div><button id="memory-copy" class="text-button">投稿文をコピー</button><textarea id="memory-caption" readonly hidden aria-label="記念カードの投稿文"></textarea><p id="memory-note" class="diary-footnote" role="status"></p><p id="memory-export-note" class="diary-footnote" role="status"></p><button id="memory-retry" hidden>画像を作り直す</button><img id="memory-preview" hidden alt="名前と実際の記録が入った保存用画像">');
function selectQuest(id){document.dispatchEvent(new CustomEvent('diary-select-quest',{detail:id}));areaSheet.close();if(!questSheet.open)questSheet.showModal();}
$('#diary-choices').onclick=e=>{const b=e.target.closest('[data-diary-quest]');if(b)selectQuest(b.dataset.diaryQuest);};
function areaQuests(index){return K.released(model.date).filter(q=>areas[index].cats.includes(q.category));}
function renderArea(){const a=areas[selectedArea],all=areaQuests(selectedArea),pages=Math.max(1,Math.ceil(all.length/4));areaPage=Math.min(areaPage,pages-1);const qs=all.slice(areaPage*4,areaPage*4+4);areaSheet.querySelector('h2').textContent=a.name;areaSheet.querySelector('.sheet-body').innerHTML='<p>'+a.sub+'</p>'+qs.map(q=>'<button class="area-quest" data-area-quest="'+q.id+'"><img src="'+C.artwork[q.category]+'" alt=""><span>'+esc(q.title)+'<small>'+ (model.state.completed[q.id]?'達成済み ✓':model.state.questStates[q.id]==='started'?'挑戦中':'挑戦できます')+'</small></span><b>›</b></button>').join('')+(pages>1?'<div class="area-pager"><button data-area-page="-1" '+(!areaPage?'disabled':'')+'>前へ</button><span>'+(areaPage+1)+' / '+pages+'</span><button data-area-page="1" '+(areaPage===pages-1?'disabled':'')+'>次へ</button></div>':'');}
$('#diary-map-nodes').onclick=e=>{const b=e.target.closest('[data-area]');if(b){selectedArea=Number(b.dataset.area);areaPage=0;renderArea();areaSheet.showModal();}};
areaSheet.onclick=e=>{const b=e.target.closest('[data-area-quest]'),page=e.target.closest('[data-area-page]');if(b)selectQuest(b.dataset.areaQuest);if(page&&!page.disabled){areaPage+=Number(page.dataset.areaPage);renderArea();}};
function renderMap(){if(!model)return;$('#diary-map-nodes').innerHTML=areas.map((a,i)=>{const qs=areaQuests(i),done=qs.filter(q=>model.state.completed[q.id]).length;return '<button class="map-node node-'+i+(qs.length&&done===qs.length?' is-done':'')+'" data-area="'+i+'" '+(!qs.length?'disabled':'')+'><span class="map-pin" aria-hidden="true">'+(done?'✦':'◇')+'</span><strong>'+a.name+'</strong><small>'+ (qs.length?done+' / '+qs.length+' の足あと':'公開前')+'</small></button>';}).join('');}
function renderMemory(){if(!model)return;const {state,t,trial}=model;
 $('#memory-title').textContent=t.title;$('#memory-name').textContent=state.name||'名もなき冒険者';$('#memory-level').textContent='Lv. '+t.level;
 $('#memory-exp').max=t.expMax;$('#memory-exp').value=t.exp;$('#memory-exp').setAttribute('aria-label',t.isMaxLevel?'経験値（最高レベル達成）':'次のレベルへの経験値');$('#memory-next').textContent=K.experienceText(t);
 const largest=Math.max(1,...Object.values(t.stats));
 $('#memory-numbers').innerHTML='<strong>'+t.done.length+' の冒険</strong><div class="memory-stats">'+C.categories.map(c=>'<span><label for="ability-'+c.id+'">'+screen.statNames[c.id]+'</label><progress id="ability-'+c.id+'" value="'+t.stats[c.id]+'" max="'+largest+'" style="--ability-color:'+c.color+'" aria-label="'+screen.statNames[c.id]+'" title="4つの力のバランス"></progress><b>'+t.stats[c.id]+'</b></span>').join('')+'</div>';
 $('#memory-favorite').textContent=state.favoriteId?'★ '+K.byId[state.favoriteId].title:'';$('#memory-favorite').hidden=!state.favoriteId;
 $('#memory-date').textContent=(trial?'試用記録 · ':'')+C.start.replaceAll('-','.')+' — '+C.end.replaceAll('-','.');$('#memory-save').disabled=true;$('#memory-share').disabled=!t.canResult;
 $('#memory-note').textContent=t.canResult?'':t.done.length?'開催期間中に画像を作れます。':'1件クリアすると画像を作れます。';
}
const originalRefresh=screen.refresh;
screen.refresh=data=>{originalRefresh(data);if(data)model=data;if(!model)return;exportRevision++;cardFile=null;const {state,t,date}=model,released=K.released(date);
 if(choiceDay!==date||(choiceIds.length&&choiceIds.every(id=>state.completed[id])&&released.some(q=>!state.completed[q.id]))){choiceDay=date;const ordered=[...released.filter(q=>q.date===date&&!state.completed[q.id]),...released.filter(q=>q.date!==date&&!state.completed[q.id]),...released.filter(q=>state.completed[q.id])],picked=[],cats=new Set();for(const q of ordered)if(picked.length<3&&!cats.has(q.category)){picked.push(q);cats.add(q.category);}for(const q of ordered)if(picked.length<3&&!picked.includes(q))picked.push(q);choiceIds=picked.map(q=>q.id);}
 $('#diary-name').textContent=state.name;$('#diary-level').textContent='Lv. '+t.level;
 $('#diary-choices').dataset.count=choiceIds.length;$('#diary-choices').innerHTML=choiceIds.map(id=>{const q=K.byId[id],c=C.categories.find(c=>c.id===q.category),done=!!state.completed[id];return '<button class="diary-choice '+(done?'is-done':'')+'" data-diary-quest="'+q.id+'" style="--category-color:'+c.color+'"><span class="choice-icon"><img src="'+c.icon+'" alt=""></span><span class="choice-ribbon">'+c.name+'</span><strong>'+esc(q.title)+'</strong><small>'+ (done?'✓ 達成':state.questStates[id]==='started'?'挑戦中':'0 / 1')+'</small></button>';}).join('')||'<p class="empty">'+(model.earlyTest?'テストの挑戦状は9月29日から届きます。':'最初の挑戦状は10月1日に届きます。')+'</p>';
 $('#diary-lights').innerHTML=Array.from({length:Math.min(released.length,7)},(_,i)=>'<i class="'+(i<Math.floor(t.done.length*Math.min(released.length,7)/Math.max(released.length,1))?'lit':'')+'"></i>').join('');$('#diary-total').textContent=released.length&&t.done.length<=released.length?t.done.length+' / '+released.length:t.done.length+'件の足あと';$('#diary-test-note').textContent=model.earlyTest?'事前テスト · '+window.UmaQuestCalendar.testDay(date).replaceAll('-','/')+'分':model.septemberTest?'試用記録':C.start.replaceAll('-','.')+' — '+C.end.replaceAll('-','.');
 $('#bag-count').textContent=t.trophies.filter(x=>x.unlocked).length+' / '+t.trophies.length+' 個のトロフィー';renderMap();renderMemory();if(areaSheet.open)renderArea();if(document.body.dataset.journey==='diary-result'&&t.canResult&&!model.blocked)prepareMemory();if(document.body.dataset.journey==='diary-bag'&&!model.blocked)prepareTrophies();
};
const originalLevelUp=screen.levelUp;screen.levelUp=data=>{questSheet.close();areaSheet.close();originalLevelUp(data);};
// Only this canvas is exported; navigation and controls never enter the image.
let cardFile=null,exportRevision=0,cardUrl=null,trophyFile=null,trophyRevision=0;
async function prepareMemory(){const revision=++exportRevision;cardFile=null;$('#memory-save').disabled=true;$('#memory-share').disabled=false;$('#memory-preview').removeAttribute('src');$('#memory-retry').hidden=true;$('#memory-export-note').textContent='画像を準備しています…';const {state,t,trial}=model;
 $('#memory-caption').value=state.name+'の冒険記録\nLv.'+t.level+' · '+t.done.length+'件のクエストをクリア！\n#旅するうまさん #うまさんからの挑戦状\n'+C.url;
 try{

 const [scene,guide]=await Promise.all([E.image('media/quest/diary-home-v2.jpg'),E.image('media/camera-pose-lantern.png')]);
 const blob=await E.render(1080,1350,(x,art)=>{x.fillStyle='#fff0d1';x.fillRect(0,0,1080,1350);x.strokeStyle='#bb9355';x.lineWidth=3;x.strokeRect(34,34,1012,1282);x.strokeRect(43,43,994,1264);
 const text=(s,y,size=32,color='#56391f',max=920)=>{x.textAlign='center';x.font='600 '+size+'px "Yu Mincho",serif';x.fillStyle=color;x.fillText(String(s),540,y,max);};
 text(C.title,110,29);text('あなたの冒険記録カード',176,38);text(state.name||'名もなき冒険者',276,64);text(t.title,327,30);text('Lv. '+t.level,404,62);
 x.fillStyle='#dfcfad';x.fillRect(180,435,720,20);x.fillStyle='#77844c';x.fillRect(180,435,720*t.exp/t.expMax,20);text(K.experienceText(t),494,26);
 if(art&&scene)x.drawImage(scene,90,535,900,335);
 if(art&&guide){const scale=Math.min(260/guide.naturalWidth,305/guide.naturalHeight);x.drawImage(guide,200,550,guide.naturalWidth*scale,guide.naturalHeight*scale);}
 x.fillStyle='#fff5dfed';x.fillRect(565,610,365,155);x.textAlign='center';x.font='27px "Yu Mincho",serif';x.fillStyle='#56391f';x.fillText('いつもの毎日も、',747,660);x.fillText('ちゃんと冒険だったよ。',747,714);
 text(t.done.length+' の冒険',947,44);
 const largest=Math.max(1,...Object.values(t.stats));C.categories.forEach((c,i)=>{const y=1000+i*48;x.textAlign='left';x.font='600 27px "Yu Mincho",serif';x.fillStyle='#56391f';x.fillText(screen.statNames[c.id],180,y);x.fillStyle='#e1d3b6';x.fillRect(350,y-20,430,19);x.fillStyle=c.color;x.fillRect(350,y-20,430*t.stats[c.id]/largest,19);x.textAlign='right';x.fillStyle='#56391f';x.fillText(t.stats[c.id],875,y);});

 if(state.favoriteId)text('★ '+K.byId[state.favoriteId].title,1202,24);
 text((trial?'試用記録 · ':'')+C.start.replaceAll('-','.')+' — '+C.end.replaceAll('-','.'),1260,24);
 });if(revision!==exportRevision)return;
 cardFile=blob;if(cardUrl)URL.revokeObjectURL(cardUrl);cardUrl=URL.createObjectURL(blob);$('#memory-preview').src=cardUrl;$('#memory-save').disabled=$('#memory-share').disabled=false;$('#memory-export-note').textContent='';
 }catch(e){if(revision===exportRevision){$('#memory-export-note').textContent=E.errorCode(e)+'。もう一度お試しください。';$('#memory-retry').hidden=false;}}}
$('#memory-retry').onclick=()=>prepareMemory();
function recordCaption(){return model.state.name+'の冒険記録\nLv.'+model.t.level+' · '+model.t.done.length+'件のクエストをクリア！\n#旅するうまさん #うまさんからの挑戦状\n'+C.url;}
function downloadCard(){if(!cardFile)return;E.save(cardFile,'umasan-memory-lv'+model.t.level+'.png');$('#memory-export-note').textContent='保存した画像はXの投稿画面で添付できます。';}
function shareCard(){E.post(recordCaption());}
$('#memory-save').onclick=downloadCard;$('#memory-share').onclick=shareCard;$('#memory-copy').onclick=async()=>{try{await navigator.clipboard.writeText($('#memory-caption').value);$('#memory-export-note').textContent='投稿文をコピーしました。';}catch{$('#memory-caption').hidden=false;$('#memory-caption').focus();$('#memory-caption').select();$('#memory-export-note').textContent='文章を選択しました。端末のコピー操作をお使いください。';}};

function trophyCaption(){return model.state.name+'の冒険トロフィー\n'+model.t.trophies.filter(t=>t.unlocked).length+' / '+model.t.trophies.length+' 種を獲得！\n#旅するうまさん #うまさんからの挑戦状\n'+C.url;}
async function prepareTrophies(){const revision=++trophyRevision;trophyFile=null;$('#trophy-save').disabled=true;$('#trophy-note').textContent='画像を準備しています…';const {state,t}=model;
 try{const icons=await Promise.all(t.trophies.map(m=>E.image(m.icon)));const blob=await E.render(1080,1350,(x,art)=>{
 x.fillStyle='#fff3dc';x.fillRect(0,0,1080,1350);x.strokeStyle='#b58c48';x.lineWidth=4;x.strokeRect(40,40,1000,1270);
 const text=(str,y,size=34)=>{x.fillStyle='#56391f';x.font='600 '+size+'px "Yu Mincho",serif';x.textAlign='center';x.fillText(str,540,y,930);};
 text(C.title,110,28);text(state.name+'の宝物',220,60);text(t.trophies.filter(m=>m.unlocked).length+' / '+t.trophies.length+' 種のトロフィー',290,35);
 const rowHeight=Math.min(174,870/Math.ceil(t.trophies.length/2));
 t.trophies.forEach((m,i)=>{const left=80+(i%2)*470,top=345+Math.floor(i/2)*rowHeight;x.fillStyle=m.unlocked?'#f7dfab':'#e8e0cd';x.fillRect(left,top,450,rowHeight-14);x.strokeStyle=m.unlocked?'#ab803f':'#c9bba3';x.strokeRect(left,top,450,rowHeight-14);x.save();x.globalAlpha=m.unlocked?1:.32;const icon=icons[i];if(art&&icon)x.drawImage(icon,left+20,top+34,80,80);else{x.fillStyle='#94733e';x.font='60px serif';x.textAlign='center';x.fillText(m.unlocked?'★':'◇',left+60,top+94);}x.restore();x.textAlign='left';x.fillStyle='#56391f';x.font='600 26px "Yu Mincho",serif';x.fillText(m.name,left+120,top+58,310);x.font='23px "Yu Mincho",serif';x.fillText(m.unlocked?'獲得済み':m.progress+' / '+m.target,left+120,top+96,310);x.font='21px "Yu Mincho",serif';x.fillText(m.kind==='all'?'特別実績 · 全61件':m.kind==='count'?'累計'+m.target+'件':C.categories.find(c=>c.id===m.category).name+'を'+m.target+'件',left+120,top+131,310);});
 text((model.trial?'試用記録 · ':'')+C.start.replaceAll('-','.')+' — '+C.end.replaceAll('-','.'),1260,24);
 });if(revision!==trophyRevision)return;trophyFile=blob;$('#trophy-save').disabled=false;$('#trophy-save').textContent='画像を保存';$('#trophy-note').textContent='';
 }catch(e){if(revision===trophyRevision){$('#trophy-save').disabled=false;$('#trophy-save').textContent='画像を再作成';$('#trophy-note').textContent=E.errorCode(e)+'。再作成できます。';}}}
$('#trophy-save').onclick=()=>{if(trophyFile){E.save(trophyFile,'umasan-trophies.png');$('#trophy-note').textContent='保存した画像はXの投稿画面で添付できます。';}else prepareTrophies();};
$('#trophy-share').onclick=()=>{if(model)E.post(trophyCaption());};

go('today');
})();
