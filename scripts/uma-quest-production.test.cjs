const assert=require('node:assert/strict');
const K=require('../assets/js/uma-quest-core.js'),C=K.C;
assert.equal(C.isDraft,false);assert.equal(C.productionComplete,true);
assert.equal(C.quests.length,61);assert.equal(new Set(C.quests.map(q=>q.id)).size,61);
assert.equal(C.eventId,'umasan-autumn-2026');assert.equal(C.version,3);
const categories=new Set(C.categories.map(c=>c.id));
let state=K.fresh('participant');
for(let i=0;i<61;i++){
 const q=C.quests[i],date=new Date(Date.UTC(2026,9,1+i)).toISOString().slice(0,10);
 assert.equal(q.date,date);assert.ok(q.title.trim());assert.ok(q.condition.trim());
 assert.ok(categories.has(q.category));assert.deepEqual(q.reward,{xp:100,stat:1});
 const boundary=new Date(date+'T00:00:00+09:00'),before=new Date(+boundary-1);
 assert.equal(K.released(K.day(before)).length,i);assert.equal(K.released(K.day(boundary)).length,i+1);
 assert.throws(()=>K.complete(state,q.id,before));
 state=K.complete(state,q.id,boundary);assert.equal(K.complete(state,q.id,boundary),state);
 assert.equal(K.summary(state,date).xp,(i+1)*100);
 assert.equal(K.summary(state,date).trophies.find(t=>t.id==='all61').unlocked,i===60);
 state=K.validate(JSON.parse(JSON.stringify(state)),'participant');
}
assert.equal(K.summary(state,C.end).level,10);
assert.equal(K.released('2026-09-30').length,0);assert.equal(K.released('2026-12-01').length,61);
// A participant backup from the original seven-quest version remains valid verbatim.
const ids=['autumn-door','autumn-tool-story','autumn-paper','autumn-base','autumn-colors','autumn-drawing','autumn-kindness'];
const legacy={eventId:C.eventId,version:3,mode:'participant',name:'冒険者',completed:Object.fromEntries(ids.map(id=>[id,'2026-10-07T03:00:00.000Z'])),titleId:'three',favoriteId:'autumn-door',onboarded:true,journeyVersion:1,questStates:Object.fromEntries(ids.map(id=>[id,'started']))};
assert.deepEqual(K.validate(JSON.parse(JSON.stringify(legacy)),'participant'),legacy);
assert.equal(K.summary(legacy,C.end).level,2);
assert.equal(K.summary(legacy,C.end).trophies.find(t=>t.id==='all61').unlocked,false);
assert.throws(()=>K.validate({...legacy,mode:'preflight'},'participant'));
assert.throws(()=>K.validate({...legacy,mode:'trial'},'participant'));
console.log('PASS: 61 production dates, every JST release boundary, future rejection, duplicate prevention, Lv.10, final trophy, seven-quest record compatibility, test isolation.');
