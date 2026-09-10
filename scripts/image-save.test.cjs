const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const code = fs.readFileSync(path.join(__dirname,'../assets/js/image-save.js'),'utf8');
function setup(supported=true) {
  const shares=[],downloads=[],revoked=[],requests=[],marks=[];
  let failure, counter=0;
  const button={events:{},setAttribute(k,v){this[k]=v},addEventListener(k,fn){this.events[k]=fn}};
  const image={},message={};
  const ctx={save(){},restore(){},drawImage(){},strokeText(...v){marks.push(v)},fillText(...v){marks.push(v)}};
  const context={window:{},File,Blob,
    Image:class{naturalWidth=420;naturalHeight=908;async decode(){}},
    document:{body:{append(){}},createElement(tag){assert.notEqual(tag,'dialog','Saving must not create a popup');return tag==='canvas'?{getContext:()=>ctx,toBlob(fn){fn(new Blob(['marked'],{type:'image/png'}))}}:{click(){downloads.push(this.download)},remove(){}}}},
    URL:{createObjectURL:()=>`blob:${++counter}`,revokeObjectURL:x=>revoked.push(x)},
    navigator:{canShare:()=>supported,share:async x=>{shares.push(x);if(failure)throw {name:failure}}},
    fetch:()=>new Promise(resolve=>requests.push(resolve))};
  vm.runInNewContext(code,context);
  const saver=context.window.UmasanImageSave.bind(button,{image,message});
  return {saver,button,image,message,shares,downloads,revoked,requests,marks,fail:x=>failure=x,click:()=>button.events.click({preventDefault(){}})};
}
(async()=>{
 const original=new Blob(['full resolution'],{type:'image/png'}), t=setup();
 await t.saver.prepare({blob:original,name:'photo.png',marked:true});
 assert.equal(t.shares.length,0);await t.click();
 assert.equal(await t.shares[0].files[0].text(),await original.text());
 assert.equal(t.shares[0].files[0].name,'photo.png');
 t.fail('AbortError');const text=t.message.textContent;await t.click();assert.equal(t.message.textContent,text);
 t.saver.clear();assert.equal(t.button['aria-disabled'],'true');assert.equal(t.revoked.length,1);
 const desktop=setup(false);await desktop.saver.prepare({blob:original,name:'wallpaper.jpg'});await desktop.click();
 assert.deepEqual(desktop.downloads,['wallpaper.png']);
 assert.equal(desktop.marks[0][0],'©旅する馬さん');assert.ok(desktop.marks[0][1]<420&&desktop.marks[0][2]<908);
 const race=setup();const pending=race.saver.prepare({src:'old.jpg',name:'old.jpg'});
 await race.saver.prepare({blob:original,name:'new.png',marked:true});
 race.requests[0]({ok:true,blob:async()=>original});await pending;await race.click();
 assert.equal(race.shares[0].files[0].name,'new.png');
 console.log('PASS: no extra dialog; explicit share; cancellation; download fallback; watermark; original camera pixels; stale selection cleanup.');
})().catch(e=>{console.error(e);process.exitCode=1});
