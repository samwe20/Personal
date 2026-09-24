const {test,expect}=require('@playwright/test');
const {focusLayout,expectLineNavigation}=require('../focus-layout.cjs');
const editor=page=>page.locator('.cm-content');
async function newNote(page) {
  if((await page.locator('#app').getAttribute('class')).includes('sidebar-collapsed')) await page.locator('#btn-toggle-sidebar').click();
  await page.locator('#btn-new-note').click();
  await expect(editor(page)).toHaveAttribute('contenteditable','true');
}
test.beforeEach(async({page})=>{
  await page.goto('./');
  await expect(editor(page)).toHaveAttribute('contenteditable','true');
});
test('editing, theme changes, undo and reload preserve the intended note',async({page})=>{
  await newNote(page);await editor(page).fill('Browser test draft');
  await page.locator('#btn-theme').click();
  await editor(page).click();await page.keyboard.press('Control+z');
  await expect(editor(page)).not.toHaveText('Browser test draft');
  await editor(page).fill('Saved browser text');
  await expect(page.locator('#status-save')).toHaveText('Automaticky uloženo');
  await page.reload();await expect(editor(page)).toHaveText('Saved browser text');
  await newNote(page);const original=await editor(page).innerText();
  await page.keyboard.press('Control+z');await expect(editor(page)).toHaveText(original);
});
test('HTML preview strips executable attributes',async({page})=>{
  await editor(page).fill('<img src="bad" onerror="window.folioInjected=true">\n\n[[Backlinky|open note]]\n\n`[[literal]]`');
  await page.locator('#btn-preview').click();
  await expect(page.locator('#preview-root [onerror]')).toHaveCount(0);
  await expect(page.locator('#preview-root [data-wiki-title]')).toHaveCount(1);
  expect(await page.evaluate(()=>window.folioInjected)).toBeUndefined();
});
test('the first installed visit can reload offline',async({page,context})=>{
  await editor(page).fill('Offline content survives');
  await expect(page.locator('#status-save')).toHaveText('Automaticky uloženo');
  await page.evaluate(()=>navigator.serviceWorker.ready);
  await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller));
  await context.setOffline(true);await page.reload();
  await expect(editor(page)).toHaveText('Offline content survives');
  await editor(page).fill('Edited offline');
  await expect(page.locator('#status-save')).toHaveText('Automaticky uloženo');
  await page.reload();await expect(editor(page)).toHaveText('Edited offline');
});
test('importing the same file twice retains both notes',async({page})=>{
  const input=page.locator('#import-files');
  await input.setInputFiles({name:'Imported.md',mimeType:'text/markdown',buffer:Buffer.from('first copy')});
  await expect(editor(page)).toHaveText('first copy');
  await input.setInputFiles({name:'Imported.md',mimeType:'text/markdown',buffer:Buffer.from('second copy')});
  await expect(editor(page)).toHaveText('second copy');
  await expect(page.locator('#note-title')).toHaveValue('Imported 2');
  expect(await page.locator('.note-item-title').allTextContents()).toContain('Imported');
});

test('Focus keeps the writing surface and caret visible with Typewriter on or off',async({page,isMobile})=>{
  test.skip(isMobile,'Focus and Typewriter controls are desktop-only.');
  await newNote(page);
  const text='# Focus regression\n\nFirst paragraph.\n\nThe active line stays visible';
  for(const typewriter of [false,true]) {
    if((await page.locator('#btn-typewriter').getAttribute('data-active'))!==String(typewriter))await page.locator('#btn-typewriter').click();
    await editor(page).fill(text);await editor(page).press('Control+End');
    await page.locator('#btn-focus').click();
    await expect.poll(()=>focusLayout(page)).toEqual({fillsViewport:true,caretVisible:true,cursorAligned:true});
    await page.keyboard.insertText(' while typing.');
    await expect(editor(page)).toContainText('The active line stays visible while typing.');
    await expect.poll(()=>focusLayout(page)).toEqual({fillsViewport:true,caretVisible:true,cursorAligned:true});
    await page.locator('#btn-exit-focus').click();
    await expect(page.locator('#app')).not.toHaveClass(/immersive-focus/);
    await expect(page.locator('#btn-typewriter')).toHaveAttribute('data-active',String(typewriter));
    await expect.poll(async()=>(await focusLayout(page)).caretVisible).toBe(true);
  }
});

test('Focus respects Typewriter during line navigation and after reload',async({page,isMobile})=>{
  test.skip(isMobile,'Focus and Typewriter controls are desktop-only.');
  await newNote(page);
  await editor(page).fill(Array.from({length:40},(_,i)=>`Line ${i+1}: writing without distractions.`).join('\n'));
  await expect(page.locator('#status-save')).toHaveText('Automaticky uloženo');
  for(const typewriter of [false,true,false]) {
    if((await page.locator('#btn-typewriter').getAttribute('data-active'))!==String(typewriter))await page.locator('#btn-typewriter').click();
    await expectLineNavigation(page,expect,typewriter);
    await page.locator('#btn-focus').click();
    await expectLineNavigation(page,expect,typewriter);
    await page.reload();
    await expect(page.locator('#app')).toHaveClass(/immersive-focus/);
    await expectLineNavigation(page,expect,typewriter);
    await page.locator('#btn-exit-focus').click();
    await expect(page.locator('#btn-typewriter')).toHaveAttribute('data-active',String(typewriter));
    await expectLineNavigation(page,expect,typewriter);
  }
});
