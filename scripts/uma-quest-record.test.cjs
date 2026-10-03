const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('assets/js/uma-quest-game.js','utf8'),block=source.slice(source.indexOf('let cardFile=null'),source.indexOf('function recordCaption()'));
const nodes=new Map(),drawn=[],bars=[];let fail=false;const $=s=>{if(!nodes.has(s))nodes.set(s,{removeAttribute(){}});return nodes.get(s);};
const ctx=new Proxy({fillText:t=>drawn.push(String(t)),fillRect:(...args)=>bars.push(args)},{get:(o,k)=>k in o?o[k]:()=>{}});
const K=require('../assets/js/uma-quest-core.js');
const model={state:{name:'名前確認',favoriteId:''},t:{...K.levelProgress(300),xp:300,title:'旅人',done:[1,2,3],stats:{explore:2,rest:1}},trial:true};
const C={title:'挑戦状',start:'2026-10-01',end:'2026-11-30',url:'https://example.test/quest',categories:[{id:'explore',color:'#889966'},{id:'rest',color:'#c3a155'}]};
const sandbox={$ ,model,C,K,URL,screen:{statNames:{explore:'観察力',rest:'回復力'}},E:{image:async()=>null,render:async(w,h,draw)=>{if(fail)throw Error('test');draw(ctx,false);return new Blob(['png']);},errorCode:()=> '画像変換に失敗'}};
vm.createContext(sandbox);vm.runInContext(block+';this.prepare=prepareMemory;',sandbox);
(async()=>{await sandbox.prepare();assert.equal($('#memory-save').disabled,false);assert.ok(drawn.includes('名前確認'));assert.ok(drawn.includes('Lv. 1'));assert.ok(drawn.includes('300 / 700 EXP ・ 次のレベルまで 400 EXP'));assert.ok(bars.some(r=>r[0]===350&&r[2]===215),'1 / 2 ability bar');fail=true;await sandbox.prepare();assert.equal($('#memory-retry').hidden,false);assert.equal($('#memory-share').disabled,false,'X stays usable when image fails');fail=false;await sandbox.prepare();assert.equal($('#memory-retry').hidden,true);
drawn.length=0;bars.length=0;Object.assign(model.t,K.levelProgress(6100),{xp:6100});await sandbox.prepare();assert.ok(drawn.includes('Lv. 10'));assert.ok(drawn.includes('最高レベル達成！ · 6100 EXP'));assert.ok(!drawn.some(t=>t.includes('次のレベルまで')));assert.ok(bars.some(r=>r[0]===180&&r[1]===435&&r[2]===720),'max-level bar is full');
assert.ok(!source.includes('catalogue-pager'));assert.ok(source.includes("E.post(trophyCaption(),"));assert.ok(source.includes("E.post(recordCaption(),"));
for(const [file,query] of [['uma-quest.webmanifest',''],['uma-quest-early.webmanifest','?test=early'],['uma-quest-trial.webmanifest','?test=september']]){const m=JSON.parse(fs.readFileSync('contents/'+file));assert.equal(m.start_url,'./uma_quest'+query+'#adventure');}
console.log('PASS: actual record data, EXP/ability graphs, image retry independent of X, all trophies on one page, per-mode shortcut URLs.');})().catch(e=>{console.error(e);process.exitCode=1;});
