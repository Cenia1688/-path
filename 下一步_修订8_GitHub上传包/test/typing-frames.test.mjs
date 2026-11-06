import test from 'node:test';
import assert from 'node:assert/strict';
import {composeTypingFrame,typingInfluence} from '../public/typing-frames.mjs';
test('手腕带动前臂，头、躯干、腿、沙发和灯仍使用同一底图',()=>{
 const size=512*512*4,base=new Uint8ClampedArray(size).fill(50),different=new Uint8ClampedArray(size).fill(200);
 const frame=composeTypingFrame(base,different,512,512);
 for(let y=0;y<512;y++)for(let x=0;x<512;x++)if(x<182||x>=312||y<218||y>=310){const i=(y*512+x)*4;for(let c=0;c<4;c++)assert.equal(frame[i+c],base[i+c]);}
 assert.equal(frame[(287*512+261)*4],200);
 assert.ok(frame[(289*512+221)*4]>50);
 for(const [x,y] of [[194,296],[283,226],[250,250],[256,190],[40,250],[400,350]])assert.equal(frame[(y*512+x)*4],50);
 assert.equal(base[(287*512+261)*4],50);
});
test('离手腕越远带动越少，腕肘之间连续过渡，肩部归零',()=>{
 const values=[0,.1,.25,.5,.75,.9,1].map(t=>typingInfluence(194+54*t,296-14*t));
 assert.equal(values[0],0);
 for(let i=1;i<values.length;i++)assert.ok(values[i]>values[i-1]);
 assert.ok(Math.abs(typingInfluence(298,264)-.18)<.000001);
 assert.equal(typingInfluence(283,226),0);
 for(let t=0;t<1;t+=.01){const before=typingInfluence(194+54*t,296-14*t),after=typingInfluence(194+54*(t+.01),296-14*(t+.01));assert.ok(Math.abs(after-before)<.04);}
});
