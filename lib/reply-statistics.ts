// Percentiles interpolate between sorted observations: rank = (n - 1) × p.
export function percentile(sorted:number[],p:number):number|null{
 if(!sorted.length)return null;
 const position=(sorted.length-1)*p,lower=Math.floor(position),weight=position-lower;
 return sorted[lower]+(sorted[Math.ceil(position)]-sorted[lower])*weight;
}
export function replyStatistics(replies:number[]){
 const sorted=[...replies].sort((a,b)=>a-b),n=sorted.length;
 const mean=n?sorted.reduce((sum,value)=>sum+value,0)/n:null;
 // Sample standard deviation uses n - 1; a single reply has no estimable spread.
 const sd=n>1?Math.sqrt(sorted.reduce((sum,value)=>sum+(value-mean!)**2,0)/(n-1)):null;
 // Group mode by the nearest minute rather than claiming sub-minute precision.
 const frequencies=new Map<number,number>();sorted.forEach(value=>{const minute=Math.round(value);frequencies.set(minute,(frequencies.get(minute)||0)+1);});
 const top=[...frequencies.values()].reduce((max,value)=>Math.max(max,value),0);
 const modes=top>1?[...frequencies].filter(([,count])=>count===top).map(([minute])=>minute):[];
 const q1=percentile(sorted,.25),q3=percentile(sorted,.75);
 return {n,mean,median:percentile(sorted,.5),sd,modes,modeCount:top,q1,q3,iqr:q1===null||q3===null?null:q3-q1,p90:percentile(sorted,.9),p95:percentile(sorted,.95),min:n?sorted[0]:null,max:n?sorted[n-1]:null};
}
export function cumulativeBands(counts:number[]){
 const total=counts.reduce((sum,count)=>sum+count,0);let cumulative=0;
 return counts.map(count=>{const start=total?cumulative/total*100:0;cumulative+=count;return {count,start,end:total?cumulative/total*100:0,share:total?count/total*100:0};});
}
