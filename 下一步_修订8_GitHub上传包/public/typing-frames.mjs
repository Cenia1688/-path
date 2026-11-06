// Hand movement travels along the forearm and fades towards its fixed joints.
const smooth=value=>{const t=Math.max(0,Math.min(1,value));return t*t*(3-2*t);};
function armInfluence(x,y,from,to,radius,near,far){
  const dx=to[0]-from[0],dy=to[1]-from[1];
  const t=Math.max(0,Math.min(1,((x-from[0])*dx+(y-from[1])*dy)/(dx*dx+dy*dy)));
  const distance=Math.hypot(x-from[0]-t*dx,y-from[1]-t*dy);
  return smooth((1-distance/radius)/.4)*(far+(near-far)*smooth(t));
}
export function typingInfluence(x,y){
  const handDistance=Math.min(Math.hypot((x-261)/25,(y-287)/13),Math.hypot((x-282)/18,(y-276)/13));
  const fingers=smooth((1-handDistance)/.28);
  const leftForearm=armInfluence(x,y,[194,296],[248,282],11,1,0);
  const rightForearm=armInfluence(x,y,[298,264],[281,275],9,1,.18);
  const rightUpperArm=armInfluence(x,y,[283,226],[298,264],8,.18,0);
  return Math.max(fingers,leftForearm,rightForearm,rightUpperArm);
}
export function composeTypingFrame(base,variation,width,height){
  const result=new Uint8ClampedArray(base);
  const left=Math.floor(width*182/512),right=Math.ceil(width*312/512);
  const top=Math.floor(height*218/512),bottom=Math.ceil(height*310/512);
  for(let y=top;y<bottom;y++)for(let x=left;x<right;x++){
    const weight=typingInfluence(x*512/width,y*512/height);
    if(!weight)continue;
    const offset=(y*width+x)*4;
    for(let channel=0;channel<4;channel++)result[offset+channel]=base[offset+channel]*(1-weight)+variation[offset+channel]*weight;
  }
  return result;
}
