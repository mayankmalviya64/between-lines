export type Message={at:number;who:string;text:string};
export type DateOrder='AUTO'|'DMY'|'MDY';
const header=/^\[?(\d{1,4})[\/.\-](\d{1,2})[\/.\-](\d{1,4}),?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([ap]\.?\s*m\.?)?\]?\s*(?:[-–]\s*)?(.*)$/i;
function cleanExport(raw:string){return raw.replace(/[\uFEFF\u200e\u200f\u202a-\u202e\u2066-\u2069]/g,'').replace(/[\u202f\u00a0]/g,' ').replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-1632)).replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-1776)).replace(/[०-९]/g,c=>String(c.charCodeAt(0)-2406));}
function timestamp(m:RegExpMatchArray,order:string):number|null{
 const a=+m[1],b=+m[2],c=+m[3],iso=m[1].length===4;
 let year=iso?a:c;const month=iso?b:order==='DMY'?b:a,day=iso?c:order==='DMY'?a:b;
 if(year<100)year+=2000;
 let hour=+m[4];const minute=+m[5],second=+(m[6]||0);
 if(m[7]){if(hour<1||hour>12)return null;hour=hour%12+(m[7].toLowerCase().startsWith('p')?12:0);}
 if(month<1||month>12||day<1||day>31||hour>23||minute>59||second>59)return null;
 const date=new Date(year,month-1,day,hour,minute,second);
 return date.getFullYear()===year&&date.getMonth()===month-1&&date.getDate()===day?+date:null;
}
export function detectDateOrder(raw:string):'DMY'|'MDY'|'YMD'{
 const headers=cleanExport(raw).split(/\r\n|\n|\r/).map(line=>line.match(header)).filter((m):m is RegExpMatchArray=>!!m);
 if(!headers.length)throw Error('No messages found. Choose a WhatsApp exported .txt chat, without media.');
 const valid=(order:string)=>headers.every(m=>timestamp(m,order)!==null);
 const dmy=valid('DMY'),mdy=valid('MDY');
 if(!dmy&&!mdy)throw Error('The export contains an invalid or mixed date format. Choose the correct date order or export the original chat again.');
 if(dmy&&!mdy)return 'DMY';if(mdy&&!dmy)return 'MDY';
 if(headers.every(m=>m[1].length===4))return 'YMD';
 if(headers.every(m=>timestamp(m,'DMY')===timestamp(m,'MDY')))return 'DMY';
 throw Error('These dates could mean day/month or month/day. Select the export date format below; your file is retained and will be retried automatically.');
}
export function parseChat(raw:string,order:string='AUTO'):Message[]{
 const resolved=order==='AUTO'?detectDateOrder(raw):order;
 const out:Message[]=[];let current:Message|undefined;
 for(const line of cleanExport(raw).split(/\r\n|\n|\r/)){
 const m=line.match(header);if(!m){if(current)current.text+='\n'+line;continue;}current=undefined;
 const at=timestamp(m,resolved);if(at===null)throw Error('Some dates do not match the selected format. Choose Auto-detect or another date order.');
 const p=m[8].indexOf(': ');if(p<1){if(/(?:created (?:this |the )?group|added you|you were added|changed the group (?:description|name|icon))/i.test(m[8]))throw Error('Group chat detected. Upload rejected — only personal DMs are allowed.');continue;}
 current={at,who:m[8].slice(0,p).trim(),text:m[8].slice(p+2)};out.push(current);
 }
 if(!out.length)throw Error('No messages found. Choose a WhatsApp exported .txt chat, without media.');
 // More than two distinct senders identifies a group, even if its creation notice is absent.
 const participants=new Set(out.map(m=>m.who)).size;
 if(participants>2)throw Error('Group chat detected. Upload rejected — only personal DMs are allowed.');
 if(participants!==2)throw Error('This version supports exactly two participants. One-sided exports are not supported.');
 return out.sort((a,b)=>a.at-b.at);
}
export const isText=(s:string)=>!/(<media omitted>|image omitted|video omitted|audio omitted|sticker omitted|document omitted|contact card omitted|this message was deleted|you deleted this message|<attached:)/i.test(s);
export const words=(s:string)=>s.trim().split(/\s+/u).filter(Boolean).length;
const warm=/\b(thank(s| you)?|appreciate|proud of you|well done|take care|here for you|you got this|shukriya|dhanyavaad)\b|🤗|🙏/iu;
const affection=/\b(love you|miss you|darling|sweetheart|babe|baby|jaan|pyaar|ily)\b|❤️|💕|😘|🥰/iu;
// Compare real local-time intervals so minute-level settings and midnight
// crossings work correctly. Equal start/end times mean no excluded period.
export function overlapsExcludedPeriod(from:number,to:number,startMinute:number,endMinute:number){
 if(startMinute===endMinute||to<=from)return false;
 const day=new Date(from);day.setHours(0,0,0,0);day.setDate(day.getDate()-1);
 while(+day<=to){
  const begins=new Date(day);begins.setHours(Math.floor(startMinute/60),startMinute%60,0,0);
  const ends=new Date(day);ends.setHours(Math.floor(endMinute/60),endMinute%60,0,0);
  if(endMinute<startMinute)ends.setDate(ends.getDate()+1);
  if(from<+ends&&to>+begins)return true;
  day.setDate(day.getDate()+1);
 }
 return false;
}
export function analyse(all:Message[],start:number,end:number,maxGap:number,night:boolean,excludeStart=23*60,excludeEnd=7*60){
 const names=[...new Set(all.map(m=>m.who))];const filtered=all.filter(m=>m.at>=start&&m.at<=end);const turns:{who:string;first:number;last:number;count:number;text:string;lastText:string}[]=[];
 for(const m of all){const last=turns.at(-1);if(last&&last.who===m.who&&m.at-last.last<6*3600000){last.last=m.at;last.lastText=m.text;last.count+=isText(m.text)?words(m.text):0;}else turns.push({who:m.who,first:m.at,last:m.at,count:isText(m.text)?words(m.text):0,text:m.text,lastText:m.text});}
 const stats=names.map(who=>{const msgs=filtered.filter(m=>m.who===who),txt=msgs.filter(m=>isText(m.text));const replies:number[]=[];const openers:Record<string,number>=Object.create(null);const closers:Record<string,number>=Object.create(null);let starts=0;
 turns.forEach((t,i)=>{const next=turns[i+1];if(t.who===who&&t.last>=start&&t.last<=end&&next&&next.first-t.last>=6*3600000&&isText(t.lastText)){const word=t.lastText.match(/[\p{L}\p{N}]+(?:[’'][\p{L}\p{N}]+)*/gu)?.at(-1)?.toLocaleLowerCase();if(word)closers[word]=(closers[word]||0)+1;}if(t.who!==who||t.first<start||t.first>end)return;const p=turns[i-1];if(!p||t.first-p.last>=6*3600000){starts++;if(isText(t.text)){const word=t.text.match(/[\p{L}\p{N}]+(?:[’'][\p{L}\p{N}]+)*/u)?.[0].toLocaleLowerCase();if(word)openers[word]=(openers[word]||0)+1;}}if(!p||p.who===who||p.last<start)return;const gap=(t.first-p.last)/60000;if(gap>maxGap)return;
 if(night&&overlapsExcludedPeriod(p.last,t.first,excludeStart,excludeEnd))return;replies.push(gap);});
 const sorted=[...replies].sort((a,b)=>a-b),len=sorted.length;const median=len?(sorted[Math.floor((len-1)/2)]+sorted[Math.floor(len/2)])/2:null;
 const ownTurns=turns.filter(t=>t.who===who&&t.first>=start&&t.last<=end);
 return {who,closers:Object.entries(closers).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,5),closerCount:Object.values(closers).reduce((s,n)=>s+n,0),openers:Object.entries(openers).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,5),openerCount:Object.values(openers).reduce((s,n)=>s+n,0),messages:msgs.length,texts:txt.length,words:txt.reduce((s,m)=>s+words(m.text),0),detail:txt.filter(m=>words(m.text)>=20).length,questions:txt.filter(m=>/[?？]/.test(m.text)).length,warm:txt.filter(m=>warm.test(m.text)).length,affection:txt.filter(m=>affection.test(m.text)).length,days:new Set(msgs.map(m=>new Date(m.at).toDateString())).size,starts,replies,median,turnWords:ownTurns.length?ownTurns.reduce((s,t)=>s+t.count,0)/ownTurns.length:0};});
 const days=new Map<string,number[]>();for(const m of filtered){const d=new Date(m.at);const key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;const row=days.get(key)||[0,0];row[names.indexOf(m.who)]++;days.set(key,row);}
 return {stats,filtered,days:[...days].map(([day,counts])=>({day,A:counts[0],B:counts[1]}))};
}
export function demoChat():Message[]{const out:Message[]=[];const end=new Date();end.setHours(19,0,0,0);for(let day=59;day>=0;day--){for(let j=0;j<3+(day%5);j++){const at=+end-day*86400000+j*900000;const first=(day+j)%3===0?'Mitali':'Manush';out.push({at,who:first,text:j%3===0?'How was your day? I was thinking about our plans for the weekend. It would be lovely to catch up and hear everything.':'Thanks for checking in, I appreciate it!'});out.push({at:at+(2+(day*j)%25)*60000,who:first==='Mitali'?'Manush':'Mitali',text:j%2?'That sounds good! What time works for you?':'I am proud of you. You have been putting so much effort into this and I hope you take a little time for yourself too.'});}}return out.sort((a,b)=>a.at-b.at);}
export const duration=(m:number|null)=>m===null?'—':m<1?'<1 min':m<60?`${Math.round(m)} min`:`${(m/60).toFixed(1)} hr`;
