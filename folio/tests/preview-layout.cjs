const previewDocument=title=>`# ${title}\n\n**Bold text** and *emphasis*.\n\n`+
  Array.from({length:40},(_,i)=>`Paragraph ${i+1}: preview scrolling keeps the whole note readable.`).join('\n\n');

async function expectPreviewScrolling(page,expect,title) {
  const pane=page.locator('#preview-pane');
  await expect(page.locator('#editor-root')).toBeHidden();
  await expect(page.locator('#preview-root h1')).toHaveText(title);
  await expect(page.locator('#preview-root strong')).toHaveText('Bold text');
  await expect(page.locator('#preview-root em')).toHaveText('emphasis');
  const surface=await page.locator('.editor-pane').boundingBox();
  const scrollArea=await pane.boundingBox();
  expect(Math.abs(scrollArea.width-surface.width)).toBeLessThan(2);
  expect(Math.abs(scrollArea.height-surface.height)).toBeLessThan(2);
  // The wheel must work in the empty margin too, not only over the text column.
  await page.mouse.move(surface.x+surface.width-24,surface.y+surface.height/2);
  await page.mouse.wheel(0,450);
  await expect.poll(()=>pane.evaluate(el=>el.scrollTop)).toBeGreaterThan(100);
  const before=await pane.evaluate(el=>el.scrollTop);
  await pane.press('PageDown');
  await expect.poll(()=>pane.evaluate(el=>el.scrollTop)).toBeGreaterThan(before+100);
}
module.exports={previewDocument,expectPreviewScrolling};
