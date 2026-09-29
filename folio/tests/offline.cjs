const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const dist=path.resolve(__dirname,'../dist');

async function installedWorker() {
  const handlers={}, stores=new Map([['another-app-cache',new Map()]]);
  const scope='https://folio.test/nested/folio/';
  let online=true;
  const fetch=async request=>{
    if(!online) throw new Error('offline');
    const url=typeof request==='string'?request:request.url;
    const relative=new URL(url).pathname.slice('/nested/folio/'.length)||'index.html';
    const filename=path.join(dist,relative);
    assert.ok(fs.existsSync(filename),'Precache entry exists: '+relative);
    return new Response(fs.readFileSync(filename));
  };
  const caches={keys:async()=>[...stores.keys()],delete:async key=>stores.delete(key),open:async key=>{
    if(!stores.has(key)) stores.set(key,new Map()); const store=stores.get(key);
    return {addAll:async urls=>{for(const url of urls)store.set(url,await fetch(url));},match:async req=>store.get(typeof req==='string'?req:req.url)?.clone()};
  }};
  const context=vm.createContext({URL,Set,caches,fetch,self:{location:{href:scope+'sw.js'},clients:{claim:async()=>{}},addEventListener:(event,handler)=>{handlers[event]=handler;}}});
  vm.runInContext(fs.readFileSync(path.join(dist,'sw.js'),'utf8'),context);
  let pending;handlers.install({waitUntil:p=>{pending=p;}});await pending;
  handlers.activate({waitUntil:p=>{pending=p;}});await pending;
  return {handlers,stores,scope,offline:()=>{online=false;}};
}
test('production precache contains every generated JS/CSS and leaves unrelated caches intact',async()=>{
  const {stores,scope}=await installedWorker();assert.ok(stores.has('another-app-cache'));
  const cache=[...stores.values()].find(store=>store.size>0);
  for(const name of fs.readdirSync(path.join(dist,'assets')).filter(n=>/\.(js|css)$/.test(n))) assert.ok(cache.has(scope+'assets/'+name),name);
});
test('offline navigation and scripts work on a nested deployment path',async()=>{
  const worker=await installedWorker();worker.offline();let response;
  worker.handlers.fetch({request:{method:'GET',mode:'navigate',url:worker.scope},respondWith:p=>{response=p;}});
  assert.match(await (await response).text(),/<title>Folio<\/title>/);
  const js=fs.readdirSync(path.join(dist,'assets')).find(name=>name.endsWith('.js'));
  worker.handlers.fetch({request:{method:'GET',mode:'cors',url:worker.scope+'assets/'+js},respondWith:p=>{response=p;}});
  assert.ok((await (await response).text()).length>0);
});
test('missing scripts and unrelated URLs never receive HTML fallback',async()=>{
  const {handlers,scope}=await installedWorker();
  for(const url of [scope+'missing.js','https://other.test/file.js','https://folio.test/another-app/']) {
    let handled=false;handlers.fetch({request:{method:'GET',mode:'cors',url},respondWith:()=>{handled=true;}});assert.equal(handled,false);
  }
});
