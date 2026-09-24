const previewDocument=title=>`# ${title}\n\n**Bold text** and *emphasis*.\n\n`+
  Array.from({length:40},(_,i)=>`Paragraph ${i+1}: preview scrolling keeps the whole note readable.`).join('\n\n');

async function expectPreviewScrolling(page,expect,title) {
  const pane=page.locator('#preview-pane');
  await expect(page.locator('#editor-root')).toBeHidden();
  await expect(page.locator('#preview-root h1')).toHaveText(title);
  await expect(page.locator('#preview-root strong')).toHaveText('Bold text');
  await expect(page.locator('#preview-root em')).toHaveText('emphasis');
  await expect(page.locator('#preview-root p')).toHaveCount(41);
  await page.evaluate(()=>Promise.all(document.getAnimations().filter(a=>a.effect.getTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{}))));
  await expect.poll(()=>page.evaluate(()=>{
    const surface=document.querySelector('.editor-pane').getBoundingClientRect();
    const pane=document.querySelector('#preview-pane').getBoundingClientRect();
    return Math.max(Math.abs(pane.width-surface.width),Math.abs(pane.height-surface.height),surface.right-innerWidth);
  })).toBeLessThan(2);
  const surface=await page.locator('.editor-pane').boundingBox();
  // The wheel must work in the empty margin too, not only over the text column.
  await page.mouse.move(surface.x+surface.width-24,surface.y+surface.height/2);
  await page.mouse.wheel(0,450);
  await expect.poll(()=>pane.evaluate(el=>el.scrollTop)).toBeGreaterThan(100);
  const before=await pane.evaluate(el=>el.scrollTop);
  await pane.press('PageDown');
  await expect.poll(()=>pane.evaluate(el=>el.scrollTop)).toBeGreaterThan(before+100);
}
async function expectEditingRestored(page,expect,title) {
  const editor=page.locator('.cm-content');
  await expect(editor).toBeFocused();
  // CodeMirror only renders the visible portion of a long document.
  await editor.press('Control+Home');
  await expect(editor).toContainText(`# ${title}`);
  await expect(editor).toContainText('Paragraph 1:');
  await editor.press('Control+End');
  await expect(editor).toContainText('Paragraph 40:');
}
module.exports={previewDocument,expectPreviewScrolling,expectEditingRestored};
