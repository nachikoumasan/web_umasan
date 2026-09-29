const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('assets/js/uma-quest-export.js','utf8');
let mode='normal',attempts=[],opened=[],downloads=[];
const sandbox={window:{open:(...args)=>opened.push(args)},Image:class{},Map,Promise,Error,Blob,URL,Uint8Array,atob,setTimeout,clearTimeout,document:{fonts:{ready:Promise.reject(Error('font'))},body:{append(){}},createElement(tag){if(tag==='a')return{click(){downloads.push(this.download);},remove(){}};const canvas={width:0,height:0,getContext(){attempts.push([this.width,this.height]);return{scale(){},drawImage(){if(mode==='taint')throw Error('image');}};},toBlob(cb){cb(mode==='null'||mode==='taint'?null:new Blob(['png']));},toDataURL(){if(mode==='taint')throw Error('tainted');return 'data:image/png;base64,cG5n';}};return canvas;}}};
vm.createContext(sandbox);vm.runInContext(source,sandbox);const E=sandbox.window.UmaQuestExport;
(async()=>{
 assert.equal(typeof sandbox.File,'undefined');let blob=await E.render(1080,1350,()=>{});assert.equal(blob.size,3);
 mode='null';blob=await E.render(1080,1350,()=>{});assert.equal(blob.size,3,'null toBlob falls back to PNG data URL');
 mode='taint';attempts=[];await assert.rejects(E.render(1080,1350,(ctx,art)=>{if(art)ctx.drawImage();}));assert.deepEqual(attempts,[[1080,1350],[720,900],[720,900]]);
 // Rendering failure from optional artwork recovers on a clean canvas without artwork.
 mode='normal';attempts=[];blob=await E.render(1080,1350,(_,art)=>{if(art)throw Error('art failed');});assert.equal(blob.size,3);assert.equal(attempts.length,3);
 const message='確認用 #旅するうまさん\nhttps://example.test/quest';E.post(message);assert.equal(new URL(opened[0][0]).hostname,'x.com');assert.equal(new URL(opened[0][0]).searchParams.get('text'),message);assert.equal(opened[0][2],'noopener,noreferrer');
 console.log('PASS: no File dependency, font fallback, null PNG fallback, smaller clean canvas retry, artwork fallback, encoded X intent.');
})().catch(e=>{console.error(e);process.exitCode=1;});
