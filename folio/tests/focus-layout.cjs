// Measure the actual writing surface and hit-test the caret, including clipping
// by ancestor elements. Text existing in the DOM is not enough to detect blank Focus.
async function focusLayout(page) {
  return page.evaluate(()=>{
    const pane=document.querySelector('.editor-pane').getBoundingClientRect();
    const selection=window.getSelection();
    const caret=selection?.rangeCount?selection.getRangeAt(0).getBoundingClientRect():null;
    const x=caret?Math.max(caret.left,caret.right-1):0;
    const y=caret?(caret.top+caret.bottom)/2:0;
    const hit=caret&&document.elementFromPoint(x,y);
    return {
      fillsViewport:pane.width>=innerWidth-2&&pane.height>=innerHeight-2,
      caretVisible:Boolean(caret&&caret.height>0&&x>=0&&x<innerWidth&&y>=0&&y<innerHeight&&hit?.closest('.cm-content')),
    };
  });
}
module.exports={focusLayout};
