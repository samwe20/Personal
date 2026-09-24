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
module.exports={focusLayout};
