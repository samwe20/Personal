import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openStore } from './store.js';
import { checkLogin, deliverMail, downloadMail } from './sync.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'public');
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
};

function send(res, status, body) {
  const data = JSON.stringify(body);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(data),
    'cache-control': 'no-store',
  });
  res.end(data);
}

function sendError(res, error) {
  const status = error.status || 400;
  send(res, status, { error: error.message || 'Něco se pokazilo.' });
}

async function readJson(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 1_000_000) throw new Error('Požadavek je moc velký.');
    chunks.push(chunk);
  }
  if (!size) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new Error('Požadavek není platný JSON.');
  }
}

function serveStatic(res, urlPath) {
  const requested = urlPath === '/' ? '/index.html' : urlPath;
  const filePath = path.resolve(PUBLIC, `.${requested}`);
  if (filePath !== PUBLIC && !filePath.startsWith(`${PUBLIC}${path.sep}`)) {
    send(res, 404, { error: 'Nenalezeno.' });
    return;
  }
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    send(res, 404, { error: 'Nenalezeno.' });
    return;
  }
  const body = fs.readFileSync(filePath);
  res.writeHead(200, {
    'content-type': TYPES[path.extname(filePath)] || 'application/octet-stream',
    'content-length': body.length,
    'cache-control': 'no-store',
  });
  res.end(body);
}

export function createServer(store) {
  return http.createServer(async (req, res) => {
    const url = new URL(req.url || '/', 'http://localhost');
    try {
      const { pathname } = url;
      if (req.method === 'GET' && pathname === '/api/mailbox') {
        send(res, 200, store.snapshot());
        return;
      }
      if (req.method === 'GET' && pathname.startsWith('/api/messages/')) {
        send(res, 200, store.read(decodeURIComponent(pathname.slice('/api/messages/'.length))));
        return;
      }
      if (req.method === 'POST' && pathname === '/api/messages') {
        const body = await readJson(req);
        const outgoing = store.buildOutgoing(body);
        if (body.action !== 'draft' && store.canSend()) {
          await deliverMail(store.credentials(), outgoing.message);
          outgoing.message.localOnly = false;
        }
        const saved = await store.commitOutgoing(outgoing);
        send(res, 201, saved);
        return;
      }
      if (req.method === 'PATCH' && pathname.startsWith('/api/messages/')) {
        const id = decodeURIComponent(pathname.slice('/api/messages/'.length));
        send(res, 200, await store.patch(id, await readJson(req)));
        return;
      }
      if (req.method === 'DELETE' && pathname.startsWith('/api/messages/')) {
        const id = decodeURIComponent(pathname.slice('/api/messages/'.length));
        send(res, 200, await store.trash(id));
        return;
      }
      if (req.method === 'POST' && pathname === '/api/folders') {
        const body = await readJson(req);
        send(res, 201, await store.createFolder(body.name));
        return;
      }
      if (req.method === 'DELETE' && pathname.startsWith('/api/folders/')) {
        const id = decodeURIComponent(pathname.slice('/api/folders/'.length));
        send(res, 200, await store.deleteFolder(id));
        return;
      }
      if (req.method === 'PUT' && pathname === '/api/account') {
        send(res, 200, await store.saveAccount(await readJson(req)));
        return;
      }
      if (req.method === 'POST' && pathname === '/api/account/check') {
        const account = store.previewAccount(await readJson(req));
        if (!account.password) throw new Error('Chybí heslo aplikace.');
        const result = await checkLogin(account);
        send(res, 200, result);
        return;
      }
      if (req.method === 'POST' && pathname === '/api/sync') {
        const body = await readJson(req);
        if (body && Object.keys(body).length) await store.saveAccount(body);
        const account = store.credentials();
        if (!account?.password) throw new Error('Nejdřív ulož e-mail a heslo aplikace.');
        const entries = await downloadMail(account, { limit: Number(body.limit) || 40 });
        send(res, 200, await store.applyRemote(entries));
        return;
      }
      if (req.method === 'POST' && pathname === '/api/demo/clear') {
        send(res, 200, await store.clearDemo());
        return;
      }
      if (req.method === 'GET') {
        serveStatic(res, pathname);
        return;
      }
      send(res, 404, { error: 'Nenalezeno.' });
    } catch (error) {
      if (!res.headersSent) sendError(res, error);
    }
  });
}

export function start(store = openStore(process.env.POSTA_DATA || path.join(ROOT, 'data', 'mailbox.json'))) {
  const port = Number(process.env.PORT || 1430);
  const host = process.env.HOST || '0.0.0.0';
  const server = createServer(store);
  server.listen(port, host, () => {
    console.log(`Pošta běží na http://localhost:${port}`);
  });
  return server;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  start();
}
