// Run with a local preview base URL as the first argument.
const assert=require('node:assert/strict'),fs=require('node:fs');
const base=process.argv[2]||'http://127.0.0.1:4280';
const C=require('../assets/js/uma-quest-config.js');
(async()=>{
 const page=await fetch(base+'/contents/uma_quest');assert.equal(page.status,200);
 const html=await page.text();
 const meta=name=>html.match(new RegExp('<meta (?:name|property)="'+name+'" content="([^"]+)"'))?.[1];
 assert.equal(meta('og:url'),C.url);assert.equal(new URL(C.url).pathname,'/contents/uma_quest');
 assert.equal(meta('og:image'),meta('twitter:image'));assert.equal(meta('twitter:card'),'summary_large_image');
 const image=await fetch(base+new URL(meta('og:image')).pathname);assert.equal(image.status,200);assert.equal(image.headers.get('content-type'),'image/webp');
 const bytes=Buffer.from(await image.arrayBuffer());assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.ok(bytes.length<5*1024*1024);
 for(const [old,query] of [['uma_quest',''],['uma_quest.html','?test=early'],['uma_quest/','?test=september']]){
  const response=await fetch(base+'/'+old+query,{redirect:'manual'});assert.equal(response.status,301);assert.equal(response.headers.get('location'),'/contents/uma_quest'+query);
 }
 for(const [file,query] of [['uma-quest.webmanifest',''],['uma-quest-early.webmanifest','?test=early'],['uma-quest-trial.webmanifest','?test=september']]){
  const response=await fetch(base+'/'+file);assert.equal(response.status,200);assert.match(response.headers.get('content-type'),/application\/manifest\+json/);
  const m=await response.json(),u=new URL(response.url);assert.equal(new URL(m.id,u).pathname,'/uma_quest.html');assert.equal(new URL(m.start_url,u).pathname,'/contents/uma_quest');assert.equal(new URL(m.start_url,u).search,query);
  assert.equal((await fetch(new URL(m.icons[0].src,u))).status,200);
 }
 for(const ref of html.matchAll(/(?:src|href)="([^"]+)"/g)){
  if(/^(?:https?:|#)/.test(ref[1]))continue;
  assert.equal((await fetch(new URL(ref[1],page.url))).status,200,ref[1]);
 }
 assert.ok(!fs.existsSync('uma_quest.html'),'only one event HTML source');
 console.log('PASS: old/new routes, query retention, three manifests, existing app identity, HTML resources, crawler-visible OGP and actual WebP bytes.');
})().catch(e=>{console.error(e);process.exitCode=1;});
