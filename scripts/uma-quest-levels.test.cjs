const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const ctx={window:{},location:{search:'?test=early'},URLSearchParams,Intl,Date};vm.createContext(ctx);
for(const file of ['config','preflight','core'])vm.runInContext(fs.readFileSync('assets/js/uma-quest-'+file+'.js','utf8'),ctx);
const K=ctx.window.UmaQuestCore,at=clears=>[0,7,14,21,28,34,41,48,55,61].filter(n=>clears>=n).length;
let s=K.fresh('preflight'),previous=K.summary(s,K.C.start),levelUps=0;
assert.equal(previous.level,1);assert.equal(previous.exp,0);assert.equal(previous.nextExp,700);
for(let count=1;count<=61;count++){
 const q=K.C.quests[count-1];s=K.complete(s,q.id,new Date(q.date+'T12:00:00+09:00'));
 const t=K.summary(s,K.C.end);assert.equal(t.level,at(count));assert.equal(t.xp,count*100);
 assert.equal(t.level-previous.level,t.level===previous.level?0:1);if(t.level>previous.level)levelUps++;
 assert.ok(t.exp>=0&&t.exp<=t.expMax);assert.ok(t.nextExp>=0);
 assert.equal(t.isMaxLevel,count===61);if(count<61)assert.equal(t.exp+t.nextExp,t.expMax);
 // Duplicate completion and reload cannot add EXP or replay growth through stored levels.
 assert.equal(K.complete(s,q.id,new Date(q.date+'T12:00:00+09:00')),s);
 const restored=K.validate(JSON.parse(JSON.stringify(s)),'preflight');assert.equal(K.summary(restored,K.C.end).level,t.level);
 assert.deepEqual(restored.completed,s.completed);previous=t;
}
assert.equal(levelUps,9);assert.equal(previous.exp,previous.expMax);assert.equal(previous.nextExp,0);
assert.equal(K.levelProgress(6200).level,10);assert.equal(K.levelProgress(6200).exp,K.levelProgress(6200).expMax);
assert.equal(K.summary(K.undo(s,K.C.quests[60].id),K.C.end).level,9);
for(const threshold of K.C.levelThresholds.slice(1)){
 assert.equal(K.levelProgress(threshold-1).level+1,K.levelProgress(threshold).level);
 assert.equal(K.levelProgress(threshold).level,K.levelProgress(threshold+1).level);
}
console.log('PASS: all 61 clears, exactly nine level-ups, Lv.10 cap, every EXP boundary, full max-level bar, idempotency and existing-record recalculation.');
