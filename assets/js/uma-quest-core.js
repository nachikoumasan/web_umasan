(function(root){
'use strict';
const C=typeof module==='object'&&module.exports?require('./uma-quest-config.js'):root.UmaQuestConfig;
const byId=Object.fromEntries(C.quests.map(q=>[q.id,q]));
const day=(date=new Date())=>new Intl.DateTimeFormat('en-CA',{timeZone:C.timeZone,year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
const phase=d=>d<C.start?'before':d>C.end?'after':'during';
const released=d=>C.quests.filter(q=>q.date<=d);
const fresh=mode=>({eventId:C.eventId,version:C.version,mode,name:'',completed:{},titleId:'',favoriteId:'',onboarded:false,journeyVersion:1,questStates:{}});
function summary(s,d){
 const done=Object.keys(s.completed).map(id=>byId[id]).filter(Boolean);
 const xp=done.reduce((n,q)=>n+q.reward.xp,0);
 const stats=Object.fromEntries(C.categories.map(c=>[c.id,done.filter(q=>q.category===c.id).reduce((n,q)=>n+q.reward.stat,0)]));
 const trophies=C.trophies.map(t=>{
  const progress=t.kind==='category'?done.filter(q=>q.category===t.category).length:done.length;
  const unlocked=t.kind==='all'?C.productionComplete&&C.quests.length===C.productionQuestCount&&done.length===C.productionQuestCount:progress>=t.target;
  return {...t,progress:Math.min(progress,t.target),unlocked};
 });
 return {done,xp,stats,level:C.initialLevel+Math.floor(xp/C.xpPerLevel),exp:xp%C.xpPerLevel,trophies,
  title:trophies.find(t=>t.id===s.titleId&&t.unlocked)?.title||'はじまりの冒険者',
  canResult:phase(d)!=='before'&&done.length>=C.resultMinClears,final:phase(d)==='after'};
}
function validate(data,mode){
 if(!data||data.eventId!==C.eventId||data.version!==C.version||data.mode!==mode||typeof data.name!=='string'||[...data.name].length>16||typeof data.titleId!=='string'||typeof data.favoriteId!=='string'||typeof data.onboarded!=='boolean'||!data.completed||typeof data.completed!=='object'||Array.isArray(data.completed))throw Error('このイベント・保存形式・モードに対応した冒険の書ではありません。');
 const s=fresh(mode);s.name=data.name;s.onboarded=data.onboarded;
 // Additive migration of existing v3 records. The storage key and earned history stay intact.
 if(data.journeyVersion!==undefined&&data.journeyVersion!==1)throw Error('この冒険の書の操作形式には対応していません。');
 if(data.questStates!==undefined){
  if(!data.questStates||typeof data.questStates!=='object'||Array.isArray(data.questStates))throw Error('挑戦の状態が正しくありません。');
  for(const [id,status]of Object.entries(data.questStates)){
   if(!Object.hasOwn(byId,id)||!['opened','started'].includes(status))throw Error('挑戦の状態が正しくありません。');
   s.questStates[id]=status;
  }
 }
 for(const [id,date]of Object.entries(data.completed)){
  if(!Object.hasOwn(byId,id)||typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(date)||!Number.isFinite(Date.parse(date))||new Date(date).toISOString()!==date||day(new Date(date))<byId[id].date)throw Error('クエストIDまたは達成日時が正しくありません。');
  s.completed[id]=date;
  s.questStates[id]='started';
 }
 if(data.favoriteId&&!s.completed[data.favoriteId])throw Error('いちばんの冒険に未達成のお題が指定されています。');
 if(data.titleId&&!summary(s,C.end).trophies.some(t=>t.id===data.titleId&&t.unlocked))throw Error('未獲得の称号が指定されています。');
 s.favoriteId=data.favoriteId;s.titleId=data.titleId;return s;
}
function complete(s,id,now){
 if(!byId[id]||byId[id].date>day(now)||phase(day(now))==='before')throw Error('まだ公開されていない挑戦状です。');
 if(s.completed[id])return s;
 return {...s,questStates:{...s.questStates,[id]:'started'},completed:{...s.completed,[id]:now.toISOString()}};
}
function advance(s,id,status,now){
 if(!Object.hasOwn(byId,id)||byId[id].date>day(now)||phase(day(now))==='before')throw Error('まだ公開されていない挑戦状です。');
 if(!['opened','started'].includes(status))throw Error('挑戦の状態が正しくありません。');
 if(s.completed[id]||s.questStates?.[id]==='started'||s.questStates?.[id]===status)return s;
 if(status==='started'&&s.questStates?.[id]!=='opened')throw Error('先に挑戦状を開いてください。');
 return {...s,questStates:{...s.questStates,[id]:status}};
}
function undo(s,id){
 const completed={...s.completed};delete completed[id];
 const next={...s,completed,favoriteId:s.favoriteId===id?'':s.favoriteId};
 if(!summary(next,C.end).trophies.some(t=>t.id===next.titleId&&t.unlocked))next.titleId='';
 return next;
}
function shareText(title){return '＝＝＝＝＝＝＝＝＝＝\n'+C.title+'\n【'+title+'】\nをクリアしました！\n＝＝＝＝＝＝＝＝＝＝\n\n#旅するうまさん #うまさんからの挑戦状\n'+C.url;}
const core={C,byId,day,phase,released,fresh,summary,validate,complete,undo,advance,shareText};
if(typeof module==='object'&&module.exports)module.exports=core;else root.UmaQuestCore=core;
})(typeof window==='object'?window:globalThis);

