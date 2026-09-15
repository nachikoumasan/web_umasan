const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const K=require('../assets/js/uma-quest-core.js'),C=K.C;
const time=d=>new Date(d+'T12:00:00+09:00');
let s=K.fresh('trial');
assert.equal(K.phase('2026-09-30'),'before');assert.equal(K.phase(C.start),'during');assert.equal(K.phase(C.end),'during');assert.equal(K.phase('2026-12-01'),'after');
assert.equal(K.day(new Date('2026-09-30T14:59:59Z')),'2026-09-30');assert.equal(K.day(new Date('2026-09-30T15:00:00Z')),C.start);
assert.equal(K.released('2026-09-30').length,0);assert.equal(K.released('2026-10-03').length,3);assert.equal(K.released('2026-12-01').length,7);
assert.throws(()=>K.complete(s,'autumn-paper',time(C.start)));
s=K.complete(s,'autumn-door',time('2026-10-07'));assert.equal(K.summary(s,C.start).level,2);assert.equal(K.summary(s,C.start).stats.explore,1);
assert.equal(K.complete(s,'autumn-door',time('2026-10-08')),s);
const oldRecord=JSON.parse(JSON.stringify(s));delete oldRecord.questStates;delete oldRecord.journeyVersion;
const migrated=K.validate(oldRecord,'trial');assert.deepEqual(migrated.completed,s.completed);assert.equal(migrated.questStates['autumn-door'],'started');assert.equal(migrated.version,3);
let staged=K.fresh('trial');assert.throws(()=>K.advance(staged,'autumn-door','started',time(C.start)));
assert.throws(()=>K.advance(staged,'autumn-paper','opened',time(C.start)));
staged=K.advance(staged,'autumn-door','opened',time(C.start));assert.equal(K.validate(JSON.parse(JSON.stringify(staged)),'trial').questStates['autumn-door'],'opened');assert.equal(K.summary(staged,C.start).xp,0);
staged=K.advance(staged,'autumn-door','started',time(C.start));assert.equal(K.validate(JSON.parse(JSON.stringify(staged)),'trial').questStates['autumn-door'],'started');
assert.equal(K.advance(staged,'autumn-door','opened',time(C.start)),staged);
staged=K.complete(staged,'autumn-door',time(C.start));assert.equal(K.summary(staged,C.start).xp,100);assert.equal(K.summary(K.complete(staged,'autumn-door',time(C.start)),C.start).xp,100);
assert.equal(K.undo(staged,'autumn-door').questStates['autumn-door'],'started');
assert.throws(()=>K.validate({...staged,questStates:{'autumn-door':'hacked'}},'trial'));assert.throws(()=>K.validate({...staged,journeyVersion:99},'trial'));
assert.throws(()=>K.validate({...staged,completed:{toString:time(C.start).toISOString()}},'trial'));
s.titleId='first';s.favoriteId='autumn-door';
const serialized=JSON.stringify(s),restored=K.validate(JSON.parse(serialized),'trial');assert.deepEqual(restored,s);
const undone=K.undo(s,'autumn-door');assert.equal(K.summary(undone,C.end).level,1);assert.equal(undone.titleId,'');assert.equal(undone.favoriteId,'');assert.equal(K.summary(undone,C.end).trophies.some(t=>t.unlocked),false);
assert.equal(K.summary(s,'2026-12-01').canResult,true);assert.equal(K.summary(K.fresh('trial'),'2026-12-01').canResult,false);
for(const q of C.quests)s=K.complete(s,q.id,time('2026-12-01'));
assert.equal(K.summary(s,C.end).level,8);assert.equal(K.summary(s,C.end).trophies.find(t=>t.id==='all61').unlocked,false);
for(const change of [{eventId:'other'},{version:99},{mode:'participant'},{completed:{unknown:time(C.end).toISOString()}},{favoriteId:'not-cleared'},{name:'a'.repeat(17)},{titleId:'all61'},{completed:{'autumn-paper':'2026-09-01T00:00:00.000Z'}}])assert.throws(()=>K.validate({...s,...change},'trial'));
assert.ok(K.shareText('テスト').includes('【テスト】\nをクリアしました！'));assert.ok(K.shareText('テスト').includes('#旅するうまさん #うまさんからの挑戦状'));
const source=fs.readFileSync(path.join(__dirname,'../assets/js/uma-quest.js'),'utf8');
function appHarness(initial,failWrite=false,failRead=false){
 let stored=initial,writes=0;
 const nodes=new Map();const node=selector=>{if(!nodes.has(selector))nodes.set(selector,{textContent:'',value:'',hidden:false,disabled:false,addEventListener(){},close(){},showModal(){}});return nodes.get(selector);};
 const sandbox={window:{UmaQuestCore:K},URLSearchParams,location:{search:'?preview=1'},document:{querySelector:node,querySelectorAll:()=>[],addEventListener(){},fonts:{ready:Promise.resolve(),load:()=>Promise.resolve()}},localStorage:{getItem(){if(failRead)throw Error('denied');return stored;},setItem(k,v){if(failWrite)throw Error('quota');stored=v;writes++;}},setTimeout:()=>0,clearTimeout(){},setInterval(){},Image:class{decode(){return Promise.resolve();}},Date,console};
 const instrumented=source.replace(/render\(\);\s*\}\)\(\);\s*$/, 'this.test={commit,read,get:()=>({state,blocked,raw}),replaceRender:()=>{render=()=>{};}};})();');
 vm.runInNewContext(instrumented,sandbox);sandbox.test.replaceRender();return {api:sandbox.test,get stored(){return stored;},get writes(){return writes;}};
}
const corrupt=appHarness('{broken');assert.equal(corrupt.api.get().blocked,true);assert.equal(corrupt.api.commit(K.fresh('trial')),false);assert.equal(corrupt.stored,'{broken');assert.equal(corrupt.writes,0);
const denied=appHarness(null,true);assert.equal(denied.api.commit({...K.fresh('trial'),name:'test'}),false);assert.equal(denied.api.get().state.name,'');assert.equal(denied.writes,0);
const readDenied=appHarness(null,false,true);assert.equal(readDenied.api.get().blocked,true);
const normal=appHarness(null);assert.equal(normal.api.commit({...K.fresh('trial'),name:'テスト'}),true);assert.equal(JSON.parse(normal.stored).name,'テスト');assert.equal(normal.writes,1);
assert.equal(corrupt.api.commit(K.fresh('trial'),true),true);assert.equal(corrupt.api.get().blocked,false);
const html=fs.readFileSync(path.join(__dirname,'../uma_quest.html'),'utf8'),ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size);
for(const m of html.matchAll(/(?:src|href)="([^"]+)"/g)){if(!/^(?:#|\?|https?:)/.test(m[1]))assert.ok(fs.existsSync(path.join(__dirname,'..',m[1])),m[1]);}
assert.ok(html.indexOf('uma-quest-config.js')<html.indexOf('uma-quest-core.js'));assert.ok(html.indexOf('uma-quest-core.js')<html.indexOf('uma-quest.js'));
assert.ok(!/gtag|google-analytics|googletagmanager/.test(html));assert.ok(!/fetch\(/.test(source));
console.log('PASS: release dates/JST, completion/idempotency/undo, title and favorite reset, 7 ≠ 61, result eligibility, backups and invalid files, corrupt storage protection, denied reads/writes, explicit recovery, page references and script order.');

