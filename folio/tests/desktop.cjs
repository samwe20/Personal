// Drives the release Tauri executable and its real Windows filesystem backend.
// WebView2 connection follows https://playwright.dev/docs/webview2.
// Only run on an ephemeral GitHub runner; never touch a developer's real library.
const {chromium,expect}=require('@playwright/test');
const {spawn,execFile}=require('node:child_process');
const {promisify}=require('node:util');
const fs=require('node:fs/promises');
const path=require('node:path');
const assert=require('node:assert/strict');
const {once}=require('node:events');
const {focusLayout}=require('./focus-layout.cjs');
if(process.platform!=='win32'||process.env.GITHUB_ACTIONS!=='true')throw new Error('Desktop smoke tests require an ephemeral Windows GitHub Actions runner.');
const root=path.resolve(__dirname,'..');
const output=path.join(root,'test-results/desktop');
const executable=process.env.FOLIO_DESKTOP_EXE||path.join(root,'src-tauri/target/release/folio.exe');
let child,browser,page,library;
const errors=[],checks=[];
const processLog=[];
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const editor=()=>page.locator('.cm-content');
async function launch() {
  browser=null;page=null;
  processLog.push(`Launching ${executable}`);
  child=spawn(executable,[],{windowsHide:true,env:{...process.env,WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS:'--remote-debugging-port=9224',WEBVIEW2_USER_DATA_FOLDER:path.join(output,'webview-profile')}});
  child.on('error',error=>errors.push(String(error)));
  child.stdout.on('data',data=>processLog.push(`stdout: ${data}`));
  child.stderr.on('data',data=>processLog.push(`stderr: ${data}`));
  child.on('exit',(code,signal)=>processLog.push(`Exit: code=${code}, signal=${signal}`));
  let lastError;
  for(let i=0;i<90;i++) {
    if(child.exitCode!==null||child.signalCode!==null)throw new Error(`Native process exited before WebView2 connected: ${processLog.join('\n')}`);
    try{browser=await chromium.connectOverCDP('http://127.0.0.1:9224',{timeout:1000});break;}catch(error){lastError=error;await pause(500);}
  }
  if(!browser)throw lastError;
  for(let i=0;i<50;i++) {
    page=browser.contexts()[0]?.pages().find(p=>!p.url().startsWith('devtools:'));
    if(page)break;await pause(200);
  }
  assert.ok(page,'Native WebView2 page exists');
  page.setDefaultTimeout(15000);
  page.on('pageerror',error=>errors.push(String(error)));
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
  await page.locator('#app').waitFor();
}
async function create(title,text) {
  if((await page.locator('#app').getAttribute('class')).includes('sidebar-collapsed'))await page.locator('#btn-toggle-sidebar').click();
  await page.locator('#btn-new-note').click();
  await expect(editor()).toHaveAttribute('contenteditable','true');
  await page.locator('#note-title').fill(title);await page.locator('#note-title').press('Enter');
  await expect(page.locator('.note-item.active .note-item-title')).toHaveText(title);
  await expect(editor()).toHaveAttribute('contenteditable','true');
  await editor().fill(text);
  await expect(page.locator('#status-save')).toHaveText('Automaticky uloženo');
  assert.equal(await fs.readFile(path.join(library,title+'.md'),'utf8'),text);
}
async function closeThroughApp() {
  const exited=once(child,'exit');
  // Same native CloseRequested path as the window's X button. No mock filesystem or IPC.
  await page.evaluate(()=>window.__TAURI_INTERNALS__.invoke('plugin:window|close',{label:'main'})).catch(error=>{
    if(!/closed|Target/.test(String(error)))throw error;
  });
  await Promise.race([exited,pause(15000).then(()=>{throw new Error('Native close did not complete');})]);
  await browser.close().catch(()=>{});browser=null;child=null;
}
async function main() {
  await fs.mkdir(output,{recursive:true});
  await launch();
  await expect(page.locator('#welcome')).toBeVisible();
  await page.locator('#welcome-demo').click();
  await expect(editor()).toHaveAttribute('contenteditable','true');
  library=(await page.locator('#library-path').textContent()).trim();
  assert.ok(path.resolve(library).toLowerCase().startsWith(path.resolve(process.env.USERPROFILE).toLowerCase()+path.sep));
  assert.match(await fs.readFile(path.join(library,'Vítejte ve Folio.md'),'utf8'),/Vítejte/);
  checks.push('Native startup, real Documents library and demo files');

  await create('Desktop QA A','Original desktop A');
  await create('Desktop QA B','Original desktop B');
  checks.push('Create, rename and autosave actual .md files');
  await page.locator('.note-item').filter({has:page.locator('.note-item-title',{hasText:/^Desktop QA A$/})}).click();
  await expect(editor()).toHaveText('Original desktop A');
  await editor().press('Control+z');await expect(editor()).toHaveText('Original desktop A');
  checks.push('Switching notes isolates Undo');

  await editor().fill('Theme test draft');await page.locator('#btn-theme').click();
  await editor().press('Control+z');await expect(editor()).toHaveText('Original desktop A');
  await page.locator('#btn-focus').click();await expect(page.locator('#app')).toHaveClass(/immersive-focus/);
  await expect.poll(()=>page.evaluate(()=>window.__TAURI_INTERNALS__.invoke('plugin:window|is_fullscreen',{label:'main'}))).toBe(true);
  await expect.poll(()=>focusLayout(page)).toEqual({fillsViewport:true,caretVisible:true,cursorAligned:true});
  await editor().press('Control+End');
  await page.keyboard.insertText(' Visible in Focus.');
  await expect(editor()).toContainText('Visible in Focus.');
  await expect.poll(()=>focusLayout(page)).toEqual({fillsViewport:true,caretVisible:true,cursorAligned:true});
  await page.screenshot({path:path.join(output,'folio-focus.png')});
  await page.locator('#btn-exit-focus').click();await expect(page.locator('#app')).not.toHaveClass(/immersive-focus/);
  await expect.poll(()=>page.evaluate(()=>window.__TAURI_INTERNALS__.invoke('plugin:window|is_fullscreen',{label:'main'}))).toBe(false);
  await expect.poll(async()=>(await focusLayout(page)).caretVisible).toBe(true);
  await page.locator('#btn-typewriter').click();
  await page.locator('#btn-focus').click();
  await expect.poll(()=>focusLayout(page)).toEqual({fillsViewport:true,caretVisible:true,cursorAligned:true});
  await page.locator('#btn-exit-focus').click();
  await expect(page.locator('#btn-typewriter')).toHaveAttribute('data-active','true');
  await expect.poll(async()=>(await focusLayout(page)).caretVisible).toBe(true);
  await page.locator('#btn-typewriter').click();
  checks.push('Theme keeps Undo; native Focus keeps text and caret visible with Typewriter on/off');

  await editor().fill('[[Desktop QA B|Open B]]');await page.locator('#btn-preview').click();
  await page.locator('#preview-root [data-wiki-title]').click();
  await expect(page.locator('#note-title')).toHaveValue('Desktop QA B');
  await page.locator('#btn-preview').click();
  checks.push('Preview and native wiki navigation');
  await editor().fill('Saved by closing the native window');
  await closeThroughApp();
  assert.equal(await fs.readFile(path.join(library,'Desktop QA B.md'),'utf8'),'Saved by closing the native window');
  checks.push('Native close flushes pending edits');

  await launch();await expect(page.locator('#note-title')).toHaveValue('Desktop QA B');
  await expect(editor()).toHaveText('Saved by closing the native window');
  checks.push('Restart restores saved note and settings');
  await page.screenshot({path:path.join(output,'folio-windows.png')});
  assert.deepEqual(errors,[],'No native frontend/IPC errors');
  await closeThroughApp();
  await fs.writeFile(path.join(output,'results.json'),JSON.stringify({passed:checks.length,checks,errors},null,2));
  console.log(JSON.stringify({passed:checks.length,checks},null,2));
}
main().catch(async error=>{
  console.error(error);errors.push(String(error));process.exitCode=1;
  await promisify(execFile)('powershell.exe',['-NoProfile','-File',path.join(__dirname,'desktop-diagnostics.ps1'),'-OutputDirectory',output],{windowsHide:true,timeout:15000}).catch(error=>processLog.push(String(error)));
  if(page) {
    await page.screenshot({path:path.join(output,'failure.png')}).catch(()=>{});
    await fs.writeFile(path.join(output,'failure.html'),await page.content().catch(()=>''));
  }
  await fs.writeFile(path.join(output,'results.json'),JSON.stringify({checks,errors},null,2));
}).finally(async()=>{
  await browser?.close().catch(()=>{});
  if(child&&!child.killed)child.kill();
  await fs.writeFile(path.join(output,'process.log'),processLog.join('\n'));
});
