const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { test, beforeEach, afterEach } = require('node:test');
const ts = require('typescript');
const { JSDOM } = require('jsdom');
const { indexedDB } = require('fake-indexeddb');
const root = path.resolve(__dirname, '..');
require.extensions['.ts'] = (mod, filename) => mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
}).outputText, filename);
let dom, app, web, FolioApp;
const html = fs.readFileSync(path.join(root,'index.html'),'utf8').replace(/<script[^>]*>[\s\S]*?<\/script>/g,'');
beforeEach(async () => {
  dom = new JSDOM(html,{url:'http://localhost/',pretendToBeVisual:true,runScripts:'dangerously'});
  for (const key of ['window','Window','document','navigator','MutationObserver','HTMLElement','HTMLInputElement','Node','Element','DOMException','localStorage','getComputedStyle','requestAnimationFrame','cancelAnimationFrame']) {
    const value = /AnimationFrame|getComputedStyle/.test(key) ? dom.window[key].bind(dom.window) : dom.window[key];
    Object.defineProperty(globalThis,key,{configurable:true,value});
  }
  window.matchMedia = () => ({matches:false,addEventListener(){},removeEventListener(){}});
  window.Range.prototype.getClientRects = () => [];
  window.Range.prototype.getBoundingClientRect = () => ({left:0,right:0,top:0,bottom:0,width:0,height:0});
  globalThis.indexedDB = indexedDB;
  for (const module of ['dompurify','../src/lib/preview.ts','../src/app.ts']) {
    try { delete require.cache[require.resolve(module)]; } catch {}
  }
  web = require('../src/lib/fs-web.ts');
  for(const note of await web.listNotes('')) await web.deleteNote(note.path);
  ({FolioApp} = require('../src/app.ts'));
  app = new FolioApp(); await app.init();
});
afterEach(() => { app.clearSaveTimer(); app.editor.destroy(); dom.window.close(); });
const edit = text => app.editor.view.dispatch({changes:{from:0,to:app.editor.getText().length,insert:text}});
const note = p => app.notes.find(n=>n.path===p);
async function pair() {
  const a = await web.createNote('', 'A', 'original A');
  const b = await web.createNote('', 'B', 'original B');
  await app.refreshLibrary(a); return {a,b};
}
test('undo never replaces a note with another note', async () => {
  const {a,b}=await pair(); edit('edited A'); await app.openNote(note(b));
  const {undo}=require('@codemirror/commands');
  assert.equal(undo(app.editor.view),false);
  assert.equal(app.editor.getText(),'original B');
  assert.equal(await web.readNote(a),'edited A');
});
test('theme, index refresh and reopening the same note preserve undo', async () => {
  await pair(); edit('edited A');
  const {undo,undoDepth}=require('@codemirror/commands');
  const depth=undoDepth(app.editor.view.state);
  app.editor.setTheme('dark'); app.editor.reconfigureWiki(); await app.openNote(app.current);
  assert.equal(undoDepth(app.editor.view.state),depth);
  assert.equal(undo(app.editor.view),true); assert.equal(app.editor.getText(),'original A');
});
test('a slow save never clears newer edits and switching flushes them', async () => {
  const {a,b}=await pair(); edit('first');
  const original=web.writeNote; let release;
  web.writeNote=(p,t)=>new Promise(resolve=>{release=()=>original(p,t).then(resolve);});
  try {
    const saving=app.saveCurrent(false); await Promise.resolve(); await Promise.resolve();
    edit('second'); await release(); await saving;
    assert.equal(app.dirty,true);
    web.writeNote=original; await app.openNote(note(b));
    assert.equal(await web.readNote(a),'second');
  } finally {web.writeNote=original;}
});
test('failed saves preserve dirty state, recovery journal and current note', async () => {
  const {a,b}=await pair(); edit('must survive'); const original=web.writeNote;
  web.writeNote=async()=>{throw new Error('disk full');};
  try {
    await assert.rejects(app.openNote(note(b)),/disk full/);
    assert.equal(app.current.path,a); assert.equal(app.dirty,true);
    assert.equal(require('../src/lib/drafts.ts').readDraft(a),'must survive');
  } finally {web.writeNote=original;}
  await app.saveCurrent(true); assert.equal(await web.readNote(a),'must survive');
});
test('a journaled edit is restored after a new app instance opens', async () => {
  const {a}=await pair(); edit('recovered draft'); app.clearSaveTimer(); app.editor.destroy();
  app=new FolioApp(); await app.init();
  assert.equal(app.current.path,a); assert.equal(app.editor.getText(),'recovered draft'); assert.equal(app.dirty,true);
  await app.saveCurrent(true); assert.equal(await web.readNote(a),'recovered draft');
});
test('duplicate import preserves existing files and returns new paths', async () => {
  const {a}=await pair();
  const imported=await require('../src/lib/disk.ts').importMarkdownFiles([{name:'A.md',type:'text/markdown',text:async()=> 'imported'}]);
  assert.notEqual(imported[0],a); assert.equal(await web.readNote(a),'original A');
  assert.equal(await web.readNote(imported[0]),'imported');
});
test('concurrent note creation does not overwrite either note', async () => {
  const paths=await Promise.all([web.createNote('','Concurrent','one'),web.createNote('','Concurrent','two')]);
  assert.equal(new Set(paths).size,2); assert.deepEqual(await Promise.all(paths.map(web.readNote)),['one','two']);
});
test('rename keeps both contents when destination name exists', async () => {
  const {a,b}=await pair(); const next=await web.renameNote(a,'B');
  assert.notEqual(next,b); assert.equal(await web.readNote(next),'original A');
  assert.equal(await web.readNote(b),'original B'); await assert.rejects(web.readNote(a));
});
test('delete cancels pending autosave and cannot resurrect the note', async () => {
  const {a}=await pair(); edit('last edit'); await app.removeNote(note(a));
  await new Promise(resolve=>setTimeout(resolve,500)); await assert.rejects(web.readNote(a));
});
test('preview removes executable HTML and dangerous links', async () => {
  app.renderPreview('<img src="bad" onerror="window.folioMarker=1"><script>window.folioMarker=2</script><a href="javascript:alert(1)">bad</a><iframe srcdoc="bad"></iframe>');
  const preview=app.els.previewRoot;
  preview.querySelector('img').dispatchEvent(new window.Event('error'));
  assert.equal(window.folioMarker,undefined);
  assert.equal(preview.querySelector('script,iframe,[onerror],[href^="javascript:"]'),null);
});
test('preview wiki links work while code examples stay literal', async () => {
  app.renderPreview('[[A|alias]]\n\n`[[A]]`\n\n```\n[[A]]\n```');
  assert.equal(app.els.previewRoot.querySelectorAll('[data-wiki-title]').length,1);
  assert.equal(app.els.previewRoot.querySelector('[data-wiki-title]').textContent,'alias');
  assert.equal(app.els.previewRoot.querySelectorAll('code').length,2);
  assert.equal(app.els.previewRoot.querySelector('code').textContent,'[[A]]');
});
test('refresh preserves current note and saves edits first', async () => {
  const {b}=await pair(); await app.openNote(note(b)); edit('edited B'); await app.refreshLibrary();
  assert.equal(app.current.path,b); assert.equal(await web.readNote(b),'edited B');
});
test('navigation actions are serialized', async () => {
  const {a,b}=await pair(); const seen=[];
  await Promise.all([app.runAction(async()=>{await app.openNote(note(b));seen.push(app.current.path);}),app.runAction(async()=>{await app.openNote(note(a));seen.push(app.current.path);})]);
  assert.deepEqual(seen,[b,a]); assert.equal(app.busy,false);
});
test('switching libraries clears stale backlink indexes', () => {
  const {NoteIndex}=require('../src/lib/noteIndex.ts'); const index=new NoteIndex();
  const notes=[{id:'a',title:'A',path:'/a',relativePath:'A.md',mtime:0},{id:'b',title:'B',path:'/b',relativePath:'B.md',mtime:0}];
  index.setNotes(notes); index.setContent('/a','[[B]]'); assert.equal(index.getBacklinks('/b').length,1);
  index.setNotes(notes); assert.equal(index.getBacklinks('/b').length,0);
});
test('portable note names exclude Windows reserved names and trailing dots', () => {
  const {safeNoteTitle}=require('../src/lib/names.ts');
  assert.equal(safeNoteTitle('CON'),'_CON'); assert.equal(safeNoteTitle('  title.  '),'title');
  assert.equal(safeNoteTitle('...'),'Bez názvu');
});
test('case-only filename collisions remain distinct in the wiki index',async()=>{
  const a=await web.createNote('','Case','one'); const b=await web.createNote('','case','two');
  assert.notEqual(a.toLowerCase(),b.toLowerCase());
});
test('wiki index ignores tilde fences, unclosed fences and inline code',()=>{
  const {parseWikiTargets}=require('../src/lib/noteIndex.ts');
  assert.deepEqual(parseWikiTargets('[[real]]\n\n~~~md\n[[example]]\n~~~\n\n`[[inline]]`\n\n```\n[[unfinished]]').map(l=>l.title),['real']);
});
test('native file replacement preserves the original if rename fails',async()=>{
  const Module=require('node:module'); const load=Module._load;
  const files=new Map([['/library/A.md','original']]); let fail=true;
  const mock={exists:async p=>files.has(p)||p==='/library',mkdir:async()=>{},writeTextFile:async(p,t)=>files.set(p,t),remove:async p=>files.delete(p),rename:async(a,b)=>{if(fail)throw new Error('rename failed');files.set(b,files.get(a));files.delete(a);}};
  Module._load=function(request,parent,isMain){
    if(request==='@tauri-apps/plugin-fs')return mock;
    if(request==='@tauri-apps/api/path')return {dirname:async p=>p.slice(0,p.lastIndexOf('/')),join:async(...parts)=>parts.join('/')};
    return load.call(this,request,parent,isMain);
  };
  try {
    delete require.cache[require.resolve('../src/lib/fs-tauri.ts')];
    const native=require('../src/lib/fs-tauri.ts');
    await assert.rejects(native.writeNote('/library/A.md','changed'),/rename failed/);
    assert.deepEqual([...files],[['/library/A.md','original']]);
    fail=false;await native.writeNote('/library/A.md','changed');
    assert.deepEqual([...files],[['/library/A.md','changed']]);
  }finally{Module._load=load;delete require.cache[require.resolve('../src/lib/fs-tauri.ts')];}
});
