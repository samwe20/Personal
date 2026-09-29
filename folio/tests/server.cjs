const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../dist');
const types = {'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.woff2':'font/woff2','.woff':'font/woff','.png':'image/png'};
const server = http.createServer((req,res) => {
  try {
    const url = new URL(req.url,'http://localhost');
    const relative = decodeURIComponent(url.pathname).replace(/^\/folio\//,'/').replace(/\/$/,'/index.html');
    const target=path.resolve(root,'.'+relative);
    if (!target.startsWith(root+path.sep)) {res.writeHead(403);res.end();return;}
    const data=fs.readFileSync(target);res.setHeader('Content-Type',types[path.extname(target)]||'application/octet-stream');
    res.setHeader('Cache-Control','no-cache');res.end(data);
  } catch {res.writeHead(404);res.end('Not found');}
});
server.listen(Number(process.env.PORT || 4173),'127.0.0.1',()=>console.log('Folio preview: http://127.0.0.1:4173/folio/'));
