(() => {
'use strict';
const $=s=>document.querySelector(s),K=window.UmaQuestCore,C=K.C,screen=window.UmaQuestScreen;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const element=(tag,cls,html='')=>{const el=document.createElement(tag);el.className=cls;el.innerHTML=html;return el;};
function sheet(id,title){const el=element('dialog','journey-sheet diary-sheet','<header><h2>'+title+'</h2><button aria-label="閉じる">×</button></header><div class="sheet-body"></div>');el.id=id;document.body.append(el);el.querySelector('button').onclick=()=>el.close();return el;}
const questSheet=sheet('diary-quest-sheet','あなたへの挑戦状');questSheet.querySelector('.sheet-body').id='diary-quest-detail';
const mapSheet=sheet('diary-map-sheet','旅マップ');
mapSheet.querySelector('.sheet-body').innerHTML='<p class="map-caption">道の先には、まだ知らない日常。</p><div class="diary-map"><svg viewBox="0 0 320 450" aria-hidden="true" preserveAspectRatio="none"><path d="M 220 408 C 25 325, 310 258, 100 181 S 180 80, 160 30"/></svg><div id="diary-map-nodes"></div></div><div class="map-pager"><button id="map-prev" aria-label="前の地図">‹</button><span id="map-page"></span><button id="map-next" aria-label="次の地図">›</button></div>';
const today=$('#today'),dashboard=element('div','diary-dashboard','<div class="diary-welcome"><div class="diary-bubble"><strong id="diary-greeting"></strong><p>今日も小さな冒険に<br>出かけよう！</p></div><img src="media/camera-pose-lantern.png" alt="今日の冒険へ案内するうまさん"><div class="welcome-name"><span id="diary-name"></span><strong id="diary-level"></strong></div></div><div class="diary-home-paper"><h2 class="diary-divider">いま選べるクエスト</h2><div id="diary-choices"></div><div class="diary-lantern"><img src="media/icon-lantern.png" alt=""><div><p>あなたが灯した冒険</p><span id="diary-lights" aria-hidden="true"></span></div><strong id="diary-total"></strong></div><button id="diary-main-action" class="primary">挑戦状をひらく</button><div class="diary-home-links"><button id="diary-open-map"><img src="media/icon-compass-storybook.webp" alt="">旅マップ</button><button id="diary-all">すべての挑戦状</button><button id="diary-help">遊び方</button></div></div>');
today.append(dashboard);
$('#diary-open-map').onclick=()=>{renderMap();mapSheet.showModal();};
$('#diary-all').onclick=()=>$('#journey-past').showModal();$('#diary-help').onclick=()=>$('#journey-instructions').showModal();
$('#diary-all').textContent='これまでの挑戦状';
$('.quest-scene-heading h1').textContent='今日の冒険';
$('.journey-head a span').textContent='旅するうまさん';
const navToday=$('.journey-nav [data-tab="today"]'),navJournal=$('.journey-nav [data-tab="journal"]');
navToday.lastChild.textContent='今日の冒険';navJournal.lastChild.textContent='成長の記録';
$('.passport-label').innerHTML='あなたの冒険手帳 <small>MY ADVENTURE JOURNAL</small>';
const typeCard=element('section','diary-type-card','<div><p>あなたのいまの称号</p><h2 id="diary-title"></h2><p id="diary-growth-note"></p></div><img src="media/camera-pose-sit.png" alt="冒険の記録に寄り添ううまさん">');
$('#journal .leather-book').after(typeCard);
const resultShortcut=element('button','diary-certificate-link','冒険の記念カード　›');resultShortcut.onclick=()=>$('#journey-results').showModal();typeCard.append(resultShortcut);
let model,choiceIds=[],choiceDay='',mapPage=0;
function selectQuest(id){document.dispatchEvent(new CustomEvent('diary-select-quest',{detail:id}));if(mapSheet.open)mapSheet.close();if(!questSheet.open)questSheet.showModal();}
$('#diary-choices').onclick=e=>{const b=e.target.closest('[data-diary-quest]');if(b)selectQuest(b.dataset.diaryQuest);};
$('#diary-main-action').onclick=()=>{const id=choiceIds.find(id=>!model.state.completed[id])||choiceIds[0];if(id)selectQuest(id);};
$('#diary-map-nodes').onclick=e=>{const b=e.target.closest('[data-map-quest]');if(b)selectQuest(b.dataset.mapQuest);};
$('#map-prev').onclick=()=>{mapPage--;renderMap();};$('#map-next').onclick=()=>{mapPage++;renderMap();};
function renderMap(){if(!model)return;const released=K.released(model.date),pages=Math.max(1,Math.ceil(released.length/3));mapPage=Math.max(0,Math.min(mapPage,pages-1));
 $('#diary-map-nodes').innerHTML=released.slice(mapPage*3,mapPage*3+3).map((q,i)=>'<button class="map-node node-'+i+(model.state.completed[q.id]?' is-done':'')+'" data-map-quest="'+q.id+'"><span class="map-pin" aria-hidden="true">'+(model.state.completed[q.id]?'✓':'◇')+'</span><strong>'+esc(q.title)+'</strong><small>'+ (model.state.completed[q.id]?'達成済み':model.state.questStates[q.id]==='started'?'挑戦中':'挑戦できます')+'</small></button>').join('')||'<p class="map-empty">最初の挑戦状は10月1日に届きます。</p>';
 $('#map-page').textContent=(mapPage+1)+' / '+pages+'　·　'+model.t.done.length+'件の足あと';$('#map-prev').disabled=mapPage===0;$('#map-next').disabled=mapPage===pages-1;
}
const originalRefresh=screen.refresh;
screen.refresh=data=>{originalRefresh(data);if(data)model=data;if(!model)return;const{state,t,date}=model,released=K.released(date);
 if(choiceDay!==date||(choiceIds.length&&choiceIds.every(id=>state.completed[id])&&released.some(q=>!state.completed[q.id]))){choiceDay=date;const ordered=[...released.filter(q=>q.date===date&&!state.completed[q.id]),...released.filter(q=>q.date!==date&&!state.completed[q.id]),...released.filter(q=>state.completed[q.id])];const picked=[],cats=new Set();for(const q of ordered){if(picked.length<3&&!cats.has(q.category)){picked.push(q);cats.add(q.category);}}for(const q of ordered){if(picked.length<3&&!picked.includes(q))picked.push(q);}choiceIds=picked.map(q=>q.id);}
 $('#diary-name').textContent=state.name;$('#diary-level').textContent='Lv. '+t.level;$('#diary-greeting').textContent='おかえりなさい。';
 $('#diary-choices').innerHTML=choiceIds.map(id=>{const q=K.byId[id],c=C.categories.find(c=>c.id===q.category),done=!!state.completed[id];return '<button class="diary-choice '+(done?'is-done':'')+'" data-diary-quest="'+q.id+'" style="--category-color:'+c.color+'"><span class="choice-icon"><img src="'+c.icon+'" alt=""></span><span class="choice-ribbon">'+c.name+'</span><strong>'+esc(q.title)+'</strong><small>'+ (done?'✓ 達成':state.questStates[id]==='started'?'挑戦中':'0 / 1')+'</small></button>';}).join('')||'<p class="empty">最初の挑戦状は10月1日に届きます。</p>';
 $('#diary-lights').innerHTML=Array.from({length:Math.min(released.length,7)},(_,i)=>'<i class="'+(i<t.done.length?'lit':'')+'"></i>').join('');$('#diary-total').textContent=t.done.length+'件';$('#diary-main-action').disabled=!choiceIds.length||model.blocked;
 $('#diary-title').textContent=t.title;const highest=Math.max(...Object.values(t.stats));const leading=C.categories.filter(c=>t.stats[c.id]===highest).map(c=>screen.statNames[c.id]);$('#diary-growth-note').textContent=highest?leading.join('・')+'が育っています。':'小さな「できた！」から、物語が始まります。';
 if(mapSheet.open)renderMap();
};
const originalLevelUp=screen.levelUp;screen.levelUp=data=>{questSheet.close();mapSheet.close();originalLevelUp(data);};
})();
