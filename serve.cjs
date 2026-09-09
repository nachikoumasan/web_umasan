// Local preview only. No dependencies, writes, or external network access.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const mime = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml'};
http.createServer((req,res) => {
  let name;
  try { name = decodeURIComponent(new URL(req.url,'http://localhost').pathname); } catch { res.writeHead(400); res.end(); return; }
  if (name === '/web_umasan') { res.writeHead(302,{Location:'/web_umasan/'}); res.end(); return; }
  name = name.replace(/^\/web_umasan\//,'/');
  const file = path.resolve(root, '.' + (name.endsWith('/') ? name+'index.html' : name));
  if (!file.startsWith(root+path.sep)) { res.writeHead(403); res.end(); return; }
  fs.readFile(file,(error,body) => {
    if (error) {res.writeHead(404);res.end('Not found');return;}
    res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'text/plain; charset=utf-8','Cache-Control':'no-store'});res.end(body);
  });
}).listen(4279,'127.0.0.1',()=>console.log('Preview: http://127.0.0.1:4279/web_umasan/'));

