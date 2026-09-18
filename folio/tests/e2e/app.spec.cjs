const {test,expect}=require('@playwright/test');
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
