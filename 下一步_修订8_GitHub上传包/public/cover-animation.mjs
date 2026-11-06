import {composeTypingFrame} from './typing-frames.mjs';
// One stable scene, with softly joined finger/wrist changes prepared before playback.
let dispose=()=>{};
export function mountCoverAnimation(){
  dispose();
  const canvas=document.querySelector('#cover-motion');
  if(!canvas)return;
  const still=document.querySelector('.cover-still');
  const ctx=canvas.getContext('2d');
  if(!ctx)return;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const sheet=new Image();
  let raf=0,alive=true,loaded=false,start=0;
  const prepared=[];
  const columns=3,rows=2,frames=6,cycle=2400;
  const sequence=[0,1,0,2,0,4,0,5,0,1,0,0];
  const drawFrame=(index,opacity)=>{
    const frame=prepared[index],sourceH=frame.height*.75,drawW=canvas.height*frame.width/sourceH;
    ctx.globalAlpha=opacity;
    ctx.drawImage(frame,0,frame.height/8,frame.width,sourceH,(canvas.width-drawW)/2,0,drawW,canvas.height);
  };
  const tick=time=>{
    if(!alive||document.hidden||reduced.matches)return;
    if(!start)start=time;
    const phase=((time-start)%cycle)/cycle*sequence.length,index=Math.floor(phase),fraction=phase-index;
    const mix=fraction*fraction*(3-2*fraction);
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.globalCompositeOperation='lighter';
    drawFrame(sequence[index],1-mix);
    drawFrame(sequence[(index+1)%sequence.length],mix);
    ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
    raf=requestAnimationFrame(tick);
  };
  const sync=()=>{
    cancelAnimationFrame(raf);start=0;
    canvas.hidden=!loaded||reduced.matches;
    if(still)still.hidden=loaded&&!reduced.matches;
    if(loaded&&!document.hidden&&!reduced.matches)raf=requestAnimationFrame(tick);
  };
  sheet.onload=()=>{
    if(!alive)return;
    const cellW=sheet.naturalWidth/columns,cellH=sheet.naturalHeight/rows;
    const scratch=document.createElement('canvas');scratch.width=cellW;scratch.height=cellH;
    const source=scratch.getContext('2d',{willReadFrequently:true});
    const read=index=>{source.clearRect(0,0,cellW,cellH);source.drawImage(sheet,index%columns*cellW,Math.floor(index/columns)*cellH,cellW,cellH,0,0,cellW,cellH);return source.getImageData(0,0,cellW,cellH);};
    const base=read(0);if(base.data[3]>32)return;
    for(let i=0;i<frames;i++){
      const variation=read(i),frame=document.createElement('canvas');frame.width=cellW;frame.height=cellH;
      const pixels=new ImageData(composeTypingFrame(base.data,variation.data,cellW,cellH),cellW,cellH);
      frame.getContext('2d').putImageData(pixels,0,0);prepared.push(frame);
    }
    loaded=true;sync();
  };
  sheet.src='/assets/home/sofa-frames.png';
  reduced.addEventListener('change',sync);
  document.addEventListener('visibilitychange',sync);
  dispose=()=>{alive=false;cancelAnimationFrame(raf);sheet.onload=null;reduced.removeEventListener('change',sync);document.removeEventListener('visibilitychange',sync);};
  sync();
}
