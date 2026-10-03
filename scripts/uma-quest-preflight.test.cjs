const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const calendar=require('../assets/js/uma-quest-calendar.js');
assert.equal(calendar.eventDay('2026-09-28'),'2026-09-30');
assert.equal(calendar.eventDay('2026-09-29'),'2026-10-01');
assert.equal(calendar.eventDay('2026-09-30'),'2026-10-02');
assert.equal(calendar.eventDay('2026-10-01'),'2026-10-03');
assert.equal(calendar.eventDay('2026-11-28'),'2026-11-30');
function load(search){const ctx={window:{},location:{search},URLSearchParams,Intl,Date};vm.createContext(ctx);for(const file of ['config','preflight','core'])vm.runInContext(fs.readFileSync('assets/js/uma-quest-'+file+'.js','utf8'),ctx);return ctx.window.UmaQuestCore;}
const K=load('?test=early'),normal=load(''),old=load('?test=september');
assert.deepEqual(Array.from(K.C.trophies.filter(t=>t.kind==='count'),t=>t.target),[1,3,10,20,40]);
assert.equal(K.C.trophies.length,10);
// Existing IDs and earned titles survive; added awards are derived from old history.
let prior=K.fresh('preflight');
for(const q of K.C.quests.slice(0,40))prior=K.complete(prior,q.id,new Date(q.date+'T12:00:00+09:00'));
prior.titleId='three';const migrated=K.validate(JSON.parse(JSON.stringify(prior)),'preflight');
assert.deepEqual(migrated.completed,prior.completed);assert.equal(migrated.titleId,'three');
assert.equal(K.summary(migrated,K.C.end).title,'日常の冒険者');
for(const threshold of [10,20,40]){
 for(const count of [threshold-1,threshold,threshold+1]){
  let record=K.fresh('preflight');
  for(const q of K.C.quests.slice(0,count))record=K.complete(record,q.id,new Date(q.date+'T12:00:00+09:00'));
  const result=K.summary(record,K.C.end),award=result.trophies.find(t=>t.id==='count-'+threshold);
  assert.equal(award.unlocked,count>=threshold);assert.equal(award.progress,Math.min(count,threshold));
  assert.equal(result.trophies.find(t=>t.id==='all61').unlocked,false);
  if(count===threshold){record.titleId=award.id;assert.equal(K.validate(JSON.parse(JSON.stringify(record)),'preflight').titleId,award.id);}
 }
}
assert.equal(K.C.quests.length,61);assert.equal(normal.C.quests.length,61);assert.equal(old.C.quests.length,61);
assert.equal(K.released(calendar.eventDay('2026-09-28')).length,0);
assert.equal(K.released(calendar.eventDay('2026-09-29')).length,1);
assert.equal(K.released(calendar.eventDay('2026-09-30')).length,2);
let state=K.fresh('preflight');
for(let n=0;n<61;n++){
 const q=K.C.quests[n];assert.equal(K.released(q.date).length,n+1);
 const date=new Date(q.date+'T12:00:00+09:00');state=K.complete(state,q.id,date);assert.equal(K.complete(state,q.id,date),state);
}
assert.equal(K.summary(state,K.C.end).level,10);assert.equal(K.summary(state,K.C.end).trophies.find(t=>t.id==='all61').unlocked,true);
const restored=K.validate(JSON.parse(JSON.stringify(state)),'preflight');assert.equal(Object.keys(restored.completed).length,61);
assert.throws(()=>K.validate(restored,'participant'));assert.throws(()=>K.validate(restored,'trial'));
assert.equal(K.summary(K.undo(restored,K.C.quests[60].id),K.C.end).trophies.find(t=>t.id==='all61').unlocked,false);
console.log('PASS: early-test calendar, 61 daily releases, shared production data with separate test dates, duplicate prevention, backup restore, mode isolation, 61-clear trophy and undo.');
