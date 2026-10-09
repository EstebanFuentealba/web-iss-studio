// Palette extraction works in SNES RGB555 space, so preview matches exported ROM.
const snap=value=>Math.round(Math.round(value*31/255)*255/31);
const distance=(a,b)=>a.reduce((sum,v,i)=>sum+(v-b[i])**2,0);
const hex=color=>'#'+color.map(v=>v.toString(16).padStart(2,'0')).join('');
export function imagePalette(data,count=4){
  const histogram=new Map();
  for(let i=0;i<data.length;i+=4){if(data[i+3]<128)continue;const color=[data[i],data[i+1],data[i+2]].map(snap),key=color.join(',');const entry=histogram.get(key);if(entry)entry.weight++;else histogram.set(key,{color,weight:1});}
  const points=[...histogram.values()].sort((a,b)=>b.weight-a.weight);
  if(!points.length)return Array(count).fill('#000000');
  const centers=[points[0].color.slice()];
  while(centers.length<Math.min(count,points.length)){
    const next=points.reduce((best,p)=>{const score=Math.min(...centers.map(c=>distance(c,p.color)))*p.weight;return score>best.score?{score,color:p.color}:best;},{score:-1});centers.push(next.color.slice());
  }
  for(let step=0;step<16;step++){
    const sums=centers.map(()=>({color:[0,0,0],weight:0}));
    for(const p of points){let best=0;centers.forEach((c,i)=>{if(distance(c,p.color)<distance(centers[best],p.color))best=i;});sums[best].weight+=p.weight;p.color.forEach((v,i)=>sums[best].color[i]+=v*p.weight);}
    sums.forEach((s,i)=>{if(s.weight)centers[i]=s.color.map(v=>snap(v/s.weight));});
  }
  while(centers.length<count)centers.push(centers[centers.length-1].slice());
  return centers.map(hex);
}
