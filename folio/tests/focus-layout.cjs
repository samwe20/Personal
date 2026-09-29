// Measure the actual writing surface and hit-test the caret, including clipping
// by ancestor elements. Text existing in the DOM is not enough to detect blank Focus.
async function focusLayout(page) {
  return page.evaluate(()=>{
    const pane=document.querySelector('.editor-pane').getBoundingClientRect();
    const selection=window.getSelection();
    // A selection's bounding box starts at its left edge, while the caret is
    // drawn at the active endpoint (also after Undo restores selected text).
    const range=selection?.focusNode?document.createRange():null;
    if(range) {
      range.setStart(selection.focusNode,selection.focusOffset);
      range.collapse(true);
    }
    const caret=range?.getBoundingClientRect();
    const x=caret?Math.max(caret.left,caret.right-1):0;
    const y=caret?(caret.top+caret.bottom)/2:0;
    const hit=caret&&document.elementFromPoint(x,y);
    const drawnCursor=document.querySelector('.cm-cursor')?.getBoundingClientRect();
    return {
      fillsViewport:pane.width>=innerWidth-2&&pane.height>=innerHeight-2,
      caretVisible:Boolean(caret&&caret.height>0&&x>=0&&x<innerWidth&&y>=0&&y<innerHeight&&hit?.closest('.cm-content')),
      cursorAligned:Boolean(caret&&drawnCursor&&Math.abs(drawnCursor.left-caret.left)<3&&Math.abs(drawnCursor.top-caret.top)<6),
    };
  });
}
// Check behavior, not just the button state: with Typewriter off, visible-line
// navigation moves the caret down the page without scrolling the document.
async function expectLineNavigation(page,expect,typewriter) {
  const settle=()=>page.evaluate(async()=>{
    for(let i=0;i<10;i++)await new Promise(requestAnimationFrame);
  });
  const position=()=>page.evaluate(()=>{
    const selection=window.getSelection();
    const range=document.createRange();
    range.setStart(selection.focusNode,selection.focusOffset);range.collapse(true);
    return {scroll:document.querySelector('.cm-scroller').scrollTop,y:range.getBoundingClientRect().top};
  });
  await page.locator('.cm-content').press('Control+Home');
  for(let i=0;i<6;i++)await page.keyboard.press('ArrowDown');
  await settle();
  const before=await position();
  for(let i=0;i<2;i++)await page.keyboard.press('ArrowDown');
  await settle();
  const after=await position();
  if(typewriter) {
    expect(after.scroll-before.scroll).toBeGreaterThan(20);
    expect(Math.abs(after.y-before.y)).toBeLessThan(3);
  } else {
    expect(Math.abs(after.scroll-before.scroll)).toBeLessThan(3);
    expect(after.y-before.y).toBeGreaterThan(20);
  }
  await expect.poll(async()=>(await focusLayout(page)).caretVisible).toBe(true);
}
module.exports={focusLayout,expectLineNavigation};
