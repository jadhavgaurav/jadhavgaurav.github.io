import Model from './learning-model.js';

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

const cases={
  victus:{label:'AI SYSTEMS / PERSONAL PROJECT',title:'VICTUS',intro:'Making the path from a request to an action inspectable.',sections:[['The problem','An assistant that can call tools needs more than a useful answer. It needs context, a clear decision about which actions are allowed, and a record of what happened.'],['The build','VICTUS combines document retrieval, AI orchestration, tool policies, approval controls, and execution traces. The newer backend and frontend repositories are the current source entry points; the original monorepo records the earlier project.'],['The engineering focus','Treat tool permissions as part of the execution path. Keep retrieval and orchestration understandable. Expose traces so a person can inspect a request instead of treating the assistant as a black box.']],note:'Policy and approval behavior depend on the configured execution mode. The current backend is the best starting point for inspecting that behavior.',links:[['Current backend','https://github.com/jadhavgaurav/victus-backend'],['Current frontend','https://github.com/jadhavgaurav/victus-frontend'],['Original project','https://github.com/jadhavgaurav/PROJECT-VICTUS']]},
  inneed:{label:'FULL-STACK PRODUCT / PERSONAL PROJECT',title:'INNEED',intro:'The listing is only the beginning of a rental product.',sections:[['The problem','A rental marketplace has to handle more than discovery. Vendors need onboarding, renters need checkout, and both sides need a way to manage what happens after an order.'],['The build','INNEED brings listings, account and vendor workflows, the rental lifecycle, checkout, payment verification, disputes, and administration into one product.'],['The engineering focus','Follow the lifecycle beyond the happy path. Payment verification and order state have to agree; marketplace administration and disputes need a place in the product rather than a collection of manual workarounds.']],note:'The payment implementation includes Razorpay integration and verification. The repository contains the product workflows and setup details.',links:[['Explore the repository','https://github.com/jadhavgaurav/inneed']]},
  search:{label:'AI APPLICATION / PERSONAL PROJECT',title:'Multimodal Search',intro:'A sentence and an image can be two ways of asking the same question.',sections:[['The problem','Keyword search depends on labels. Visual search becomes more flexible when the query can describe the meaning of an image, or simply be another image.'],['The build','CLIP produces a shared embedding space for text and images. ChromaDB handles vector retrieval, FastAPI exposes the backend, and a React interface makes the search accessible.'],['The engineering focus','Connect model outputs to an end-to-end product flow: query, embedding, retrieval, result. Keep the model useful through the interface rather than presenting it as a disconnected notebook.']],note:'Explore the source for the embedding pipeline, retrieval flow, API, and interface.',links:[['Explore the repository','https://github.com/jadhavgaurav/multimodal-search-platform']]}
};
const dialog=document.querySelector('#case-dialog');
document.querySelectorAll('[data-case]').forEach(button=>button.addEventListener('click',()=>{const c=cases[button.dataset.case];document.querySelector('#case-content').innerHTML=`<span class="section-index">${c.label}</span><h2 id="case-title">${c.title}</h2><p class="case-intro">${c.intro}</p>${c.sections.map(([title,body])=>`<h3>${title}</h3><p>${body}</p>`).join('')}<p class="case-note">${c.note}</p><div class="inline-links">${c.links.map(([title,url])=>`<a href="${url}" target="_blank" rel="noopener noreferrer">${title}</a>`).join('')}</div>`;dialog.showModal();document.body.style.overflow='hidden';}));
function closeCase(){dialog.close();document.body.style.overflow='';}
document.querySelector('#case-close').addEventListener('click',closeCase);dialog.addEventListener('close',()=>{document.body.style.overflow='';});dialog.addEventListener('click',event=>{if(event.target===dialog){const b=dialog.getBoundingClientRect();if(event.clientX<b.left||event.clientX>b.right||event.clientY<b.top||event.clientY>b.bottom)closeCase();}});
document.querySelector('#copy-email').addEventListener('click',async()=>{const status=document.querySelector('#copy-status');try{await navigator.clipboard.writeText('hello@iamgaurav.online');status.textContent='Email copied.';}catch{status.textContent='hello@iamgaurav.online';}});

if(!reducedMotion.matches){
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}}),{threshold:.08});
  document.documentElement.classList.add('motion-ready');
  document.querySelectorAll('.project,.practice-item,.curiosity-card,.about-title,.about-copy').forEach(el=>{el.classList.add('reveal');observer.observe(el);});
}
