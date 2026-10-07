import Model from '../lib/learning-model.js';

const canvas = document.querySelector('#learning-canvas');
const ctx = canvas.getContext('2d');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const timeline = Model.timeline();
const toggle = document.querySelector('#learning-toggle');
const progressBar = document.querySelector('#training-progress');
let playing = !reducedMotion.matches;
let elapsed = reducedMotion.matches ? 12000 : 0;
let previousTime = 0;
const W = 720, H = 620;
const field = { x: 62, y: 45, w: 596, h: 343 };
const project = (x,y) => [field.x+(x+1.8)/3.6*field.w,field.y+(1.15-y)/2.3*field.h];
const bg = [20,23,31], blue = [96,139,255], pale = [188,198,222];
const mix = (a,b,t) => a.map((v,i)=>Math.round(v+(b[i]-v)*t));
const rgb = a => `rgb(${a.join(',')})`;
const grid = document.createElement('canvas'); grid.width=120;grid.height=70;
const gridCtx=grid.getContext('2d');
let lastSnapshot=-1;
let contourPath=new Path2D();
let lastPaint=0;
const piece=document.querySelector('.learning-piece');
let pieceVisible=true;
new IntersectionObserver(entries=>{pieceVisible=entries[0].isIntersecting;},{rootMargin:'50px'}).observe(piece);
function render(){
  const progress=Math.min(1,Math.max(0,(elapsed-700)/9500));
  const index=Math.floor(progress*progress*(timeline.frames.length-1));
  const snap=timeline.frames[index];
  ctx.fillStyle=rgb(bg);ctx.fillRect(0,0,W,H);
  if(index!==lastSnapshot){
    const pixels=gridCtx.createImageData(120,70);
    for(let y=0;y<70;y++)for(let x=0;x<120;x++){
      const p=Model.forward(snap.w,-1.8+x/119*3.6,1.15-y/69*2.3).probability;
      const color=mix(bg,mix(blue,pale,p),.08+.24*Math.abs(p-.5)*2);
      const k=(y*120+x)*4; pixels.data[k]=color[0];pixels.data[k+1]=color[1];pixels.data[k+2]=color[2];pixels.data[k+3]=255;
    }
    gridCtx.putImageData(pixels,0,0);lastSnapshot=index;
    contourPath=new Path2D();
    for(let y=0;y<46;y++)for(let x=0;x<78;x++){
    const corners=[[x,y],[x+1,y],[x+1,y+1],[x,y+1]].map(([a,b])=>[a,b,Model.forward(snap.w,-1.8+a/78*3.6,1.15-b/46*2.3).probability-.5]);
    const crossing=[];
    for(let n=0;n<4;n++){const a=corners[n],b=corners[(n+1)%4];if((a[2]>=0)!==(b[2]>=0)){const t=a[2]/(a[2]-b[2]);crossing.push([field.x+(a[0]+t*(b[0]-a[0]))/78*field.w,field.y+(a[1]+t*(b[1]-a[1]))/46*field.h]);}}
      for(let i=0;i+1<crossing.length;i+=2){contourPath.moveTo(...crossing[i]);contourPath.lineTo(...crossing[i+1]);}
    }
  }
  ctx.save();ctx.beginPath();ctx.roundRect(field.x,field.y,field.w,field.h,12);ctx.clip();ctx.drawImage(grid,field.x,field.y,field.w,field.h);
  ctx.strokeStyle='#7483a866';ctx.lineWidth=1.2;ctx.stroke(contourPath);
  for(const d of timeline.data){const [x,y]=project(d.x,d.y);ctx.fillStyle=rgb(d.label?pale:blue);ctx.strokeStyle=rgb(bg);ctx.lineWidth=1.8;ctx.beginPath();if(d.label){ctx.moveTo(x,y-5);ctx.lineTo(x+5,y);ctx.lineTo(x,y+5);ctx.lineTo(x-5,y);ctx.closePath();}else ctx.arc(x,y,4.4,0,Math.PI*2);ctx.fill();ctx.stroke();}
  const sample=timeline.data[Math.floor(elapsed/320)%timeline.data.length];
  const [sx,sy]=project(sample.x,sample.y);ctx.strokeStyle='#f6f8ff';ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(sx,sy,10,0,Math.PI*2);ctx.stroke();ctx.restore();
  const f=Model.forward(snap.w,sample.x,sample.y);
  const inputs=[[92,472],[92,545]],middle=Array.from({length:8},(_,i)=>[360,426+i*22]),output=[628,503];
  const edge=(a,b,w)=>{ctx.strokeStyle=rgb(mix(bg,w>=0?blue:pale,.1+Math.min(.5,Math.abs(w)*.1)));ctx.lineWidth=.7+Math.min(1.7,Math.abs(w)*.3);ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke();};
  middle.forEach((p,i)=>{edge(inputs[0],p,snap.w[4*i]);edge(inputs[1],p,snap.w[4*i+1]);edge(p,output,snap.w[4*i+3]);});
  const node=(p,v,probability=false)=>{ctx.fillStyle=rgb(probability?mix(blue,pale,v):mix(bg,v>=0?blue:pale,.25+.75*Math.min(1,Math.abs(v))));ctx.strokeStyle=rgb(bg);ctx.lineWidth=2;ctx.beginPath();ctx.arc(...p,6,0,Math.PI*2);ctx.fill();ctx.stroke();};
  node(inputs[0],sample.x);node(inputs[1],sample.y);middle.forEach((p,i)=>node(p,f.hidden[i]));node(output,f.probability,true);
  progressBar.style.width=`${progress*100}%`;
  document.querySelector('#learning-status').textContent=progress>=1?'A boundary learned from these samples.':'A small network, learning.';
}
function loop(now){if(playing&&!document.hidden&&pieceVisible){elapsed+=previousTime?Math.min(now-previousTime,100):0;if(elapsed>18000)elapsed=0;if(now-lastPaint>50){render();lastPaint=now;}}previousTime=now;requestAnimationFrame(loop);}
function updateToggle(){toggle.innerHTML=playing?'Pause <span aria-hidden="true">Ⅱ</span>':'Play <span aria-hidden="true">▷</span>';toggle.setAttribute('aria-label',playing?'Pause learning animation':'Play learning animation');}
toggle.addEventListener('click',()=>{playing=!playing;updateToggle();});
document.querySelector('#learning-replay').addEventListener('click',()=>{elapsed=0;playing=true;updateToggle();render();});
reducedMotion.addEventListener('change',event=>{if(event.matches){playing=false;elapsed=12000;render();updateToggle();}});
if(reducedMotion.matches){toggle.innerHTML='Play <span aria-hidden="true">▷</span>';toggle.setAttribute('aria-label','Play learning animation');}
render();requestAnimationFrame(loop);
function time(){document.querySelector('#mumbai-time').textContent=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Kolkata',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date())+' IST';}
time();setInterval(time,60000);document.querySelector('#year').textContent=new Date().getFullYear();

document.querySelector('#copy-email').addEventListener('click',async()=>{const status=document.querySelector('#copy-status');try{await navigator.clipboard.writeText('hello@iamgaurav.online');status.textContent='Email copied.';}catch{status.textContent='hello@iamgaurav.online';}});
