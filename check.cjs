const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync('index.html', 'utf8');
const ids = new Set([...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]));
const refs = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(m => m[1]);
const context = {window:{}};
vm.runInNewContext(fs.readFileSync('data/content.js', 'utf8'), context);
const {works,experiences} = context.window.UMASAN_CONTENT;
refs.push(...works.flatMap(x => [x.url, x.image, ...(x.gallery || []).map(g => g.src)]), ...experiences.map(x => x.image));
const auto = JSON.parse(fs.readFileSync('data/articles-auto.json', 'utf8'));
refs.push(...auto.experiences.flatMap(x => [x.url, x.image]));
for (const css of refs.filter(x => x && x.endsWith('.css') && !/^https?:/.test(x))) {
  refs.push(...[...fs.readFileSync(css, 'utf8').matchAll(/url\(['"]?(assets\/[^)'"\s]+)['"]?\)/g)].map(m => m[1]));
}
for (const script of refs.filter(x => x && x.endsWith('.js') && !/^https?:/.test(x))) {
  const source = fs.readFileSync(script, 'utf8');
  new vm.Script(source);
  refs.push(...[...source.matchAll(/["'](assets\/[^"'$]+)["']/g)].map(m => m[1]));
}
refs.splice(0, refs.length, ...refs.filter(Boolean));
const camera = fs.readFileSync('umasan-camera.html','utf8');
refs.push(...[...camera.matchAll(/(?:src|href|data-src)="(assets\/[^\"]+|index.html|camera\.(?:js|css))"/g)].map(m=>m[1]));
const cameraSource = fs.readFileSync('camera.js','utf8');
refs.push(...[...fs.readFileSync('camera.css','utf8').matchAll(/url\(['"]?(assets\/[^)'"\s]+)['"]?\)/g)].map(m => m[1]));
new vm.Script(cameraSource);
refs.push(...[...cameraSource.matchAll(/["'](assets\/[^"'$]+)["']/g)].map(m => m[1]));
const missing = refs.filter(x => x.startsWith('#') ? !ids.has(x.slice(1)) : !/^https?:/.test(x) && x !== './' && !fs.existsSync(x));
const duplicateIds = [...html.matchAll(/id="([^"]+)"/g)].length !== ids.size;
const mixed = experiences.some(x => /echo again/i.test(x.title));
new vm.Script(fs.readFileSync('app.js','utf8'));
for (const script of camera.matchAll(/<script>([\s\S]*?)<\/script>/g)) new vm.Script(script[1]);
console.log(JSON.stringify({checkedReferences:refs.length,missing,duplicateIds,worksMixedIntoExperiences:mixed,works:works.length,experiences:experiences.length,autoExperiences:auto.experiences.length},null,2));
if (missing.length || duplicateIds || mixed) process.exitCode=1;
