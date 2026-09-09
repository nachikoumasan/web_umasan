const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const pages = ['index.html', 'contents/umasan-camera.html'];
const refs = [], duplicateIds = [];
function add(value, base) {
  if (!value || /^(?:[a-z]+:|\/\/)/i.test(value)) return;
  const url = new URL(value, 'https://local.test/web_umasan/' + base);
  refs.push({file: decodeURIComponent(url.pathname).replace(/^\/web_umasan\//, ''), hash: url.hash, from: base});
}
for (const page of pages) {
  const html = read(page);
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  if (new Set(ids).size !== ids.length) duplicateIds.push(page);
  for (const m of html.matchAll(/(?:src|href|data-src)="([^"]+)"/g)) add(m[1], page);
  for (const m of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) new vm.Script(m[1]);
}
for (const name of fs.readdirSync(path.join(root, 'assets/css'))) {
  const file = 'assets/css/' + name;
  for (const m of read(file).matchAll(/url\(\s*['"]?([^)'"\s]+)['"]?\s*\)/g)) add(m[1], file);
}
for (const name of fs.readdirSync(path.join(root, 'assets/js'))) {
  const source = read('assets/js/' + name);
  new vm.Script(source);
  const page = name === 'camera.js' ? pages[1] : pages[0];
  for (const m of source.matchAll(/["']((?:\.\.\/)?media\/[^"'$]+)["']/g)) add(m[1], page);
  for (const m of source.matchAll(/fetch\(['"]([^'"]+)['"]/g)) add(m[1], page);
}
for (const side of ['left', 'right']) add(`media/ui-chevron-${side}.svg`, pages[0]);
const context = {window: {}};
vm.runInNewContext(read('assets/js/content.js'), context);
const {works, experiences} = context.window.UMASAN_CONTENT;
const auto = JSON.parse(read('data/articles-auto.json'));
for (const item of [...works, ...experiences, ...auto.experiences]) {
  add(item.url, pages[0]); add(item.image, pages[0]);
  for (const image of item.gallery || []) add(image.src, pages[0]);
}
const missing = refs.filter(ref => {
  const file = path.join(root, ref.file || 'index.html');
  if (!fs.existsSync(file)) return true;
  if (ref.hash && file.endsWith('.html')) return !read(ref.file).includes(`id="${ref.hash.slice(1)}"`);
  return false;
});
const mixed = experiences.some(x => /echo again/i.test(x.title));
console.log(JSON.stringify({checkedReferences: refs.length, missing, duplicateIds, worksMixedIntoExperiences: mixed, works: works.length, experiences: experiences.length, autoExperiences: auto.experiences.length}, null, 2));
if (missing.length || duplicateIds.length || mixed) process.exitCode = 1;
