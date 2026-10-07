
const LearningModel=(()=>{
 const H=8;
 function rng(seed){return ()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};}
 function dataset(){const random=rng(912);const data=[];for(let label=0;label<2;label++)for(let i=0;i<32;i++){const a=(i+.5)/32*Math.PI;data.push({x:(label?1-Math.cos(a):Math.cos(a))-.5+(random()-.5)*.13,y:(label?.45-Math.sin(a):Math.sin(a))-.35+(random()-.5)*.13,label});}return data;}
 function initial(){const random=rng(38);return Array.from({length:4*H+1},(_,i)=>i===4*H||i%4===2?0:(random()-.5)*1.5);}
 function forward(w,x,y){const hidden=Array.from({length:H},(_,i)=>Math.tanh(w[4*i]*x+w[4*i+1]*y+w[4*i+2]));const logit=hidden.reduce((sum,h,i)=>sum+h*w[4*i+3],w[4*H]);const probability=1/(1+Math.exp(-logit));return {hidden,logit,probability};}
 function loss(w,data){return data.reduce((sum,d)=>{const z=forward(w,d.x,d.y).logit;return sum+Math.max(z,0)-z*d.label+Math.log1p(Math.exp(-Math.abs(z)));},0)/data.length;}
 function gradient(w,data){const grad=Array(w.length).fill(0);for(const d of data){const f=forward(w,d.x,d.y),dz=f.probability-d.label;grad[4*H]+=dz;for(let i=0;i<H;i++){const dh=dz*w[4*i+3]*(1-f.hidden[i]**2);grad[4*i]+=dh*d.x;grad[4*i+1]+=dh*d.y;grad[4*i+2]+=dh;grad[4*i+3]+=dz*f.hidden[i];}}return grad.map(v=>v/data.length);}
 function train(w,data,rate=.25){const g=gradient(w,data);return w.map((v,i)=>v-rate*g[i]);}
 function timeline(){const data=dataset(),frames=[];let w=initial();for(let step=0;step<=2500;step++){if(step%5===0)frames.push({step,w:w.slice(),loss:loss(w,data)});if(step<2500)w=train(w,data);}return {data,frames};}
 return {H,dataset,initial,forward,loss,gradient,train,timeline};
})();


export default LearningModel;
