import type {Message} from './chat';
// Keep edited text, but remove the export's edit annotation. Deleted notices add no text.
export function cleanGiftChat(messages:Message[]){
 // Use Mayank’s first name for both sender labels and mentions in displayed messages.
 const firstName=(value:string)=>value.replace(/\bMayank\s+Malviya\b/gi,'Mayank');
 return messages.map(message=>({...message,who:firstName(message.who),text:firstName(message.text).replace(/\s*[<\[]This message was edited[>\]]/gi,'').trim()}))
 .filter(message=>! /^(?:this message was deleted\.?|you deleted this message\.?|this message was edited\.?|<this message was deleted>|<this message was edited>)$/i.test(message.text));
}
export const replyStops=[{label:'Under 1 min',min:0,max:1,icon:'⚡'},{label:'1–5 min',min:1,max:5,icon:'🚀'},{label:'5–10 min',min:5,max:10,icon:'🛵'},{label:'10–30 min',min:10,max:30,icon:'☕'},{label:'30 min–2 hr',min:30,max:120,icon:'🌤️'},{label:'2–6 hr',min:120,max:Infinity,icon:'🌙'}];
export function replyBuckets(replies:number[]){return replyStops.map(stop=>({...stop,count:replies.filter(minutes=>minutes>=stop.min&&minutes<stop.max).length}));}
// “Within” is cumulative and includes replies exactly at the selected minute.
export function repliesWithin(replies:number[],minutes:number){
 const count=replies.filter(reply=>reply<=minutes).length;
 return {count,total:replies.length,percent:replies.length?Math.round(count/replies.length*100):null};
}
// Card rows use the very same inclusive counts and rounding as the slider dials.
export const replyWindows=[{label:'Within 1 min',minutes:1,icon:'⚡'},{label:'Within 5 min',minutes:5,icon:'🚀'},{label:'Within 10 min',minutes:10,icon:'🛵'},{label:'Within 30 min',minutes:30,icon:'☕'},{label:'Within 1 hr',minutes:60,icon:'🌤️'},{label:'Within 2 hr',minutes:120,icon:'🌆'},{label:'Within 6 hr',minutes:360,icon:'🌙'}];
export function cumulativeReplyRows(replies:number[]){return replyWindows.map(window=>({...window,...repliesWithin(replies,window.minutes)}));}
const wordPattern=/[\p{L}\p{N}]+(?:[’'][\p{L}\p{N}]+)*/gu;
export function giftPatterns(messages:Message[]){
 // A new exchange begins after six hours; the export's unfinished last exchange has no closing.
 const starts:Message[]=[],ends:Message[]=[];
 messages.forEach((message,index)=>{if(!index||message.at-messages[index-1].at>=6*3600000)starts.push(message);if(index<messages.length-1&&messages[index+1].at-message.at>=6*3600000)ends.push(message);});
 function phrases(events:Message[],who:string,last:boolean){
  const tally=new Map<string,{word:string;count:number;hours:number[];examples:{text:string;at:number}[]}>();
  events.filter(event=>event.who===who).forEach(event=>{const words=event.text.match(wordPattern);const word=(last?words?.at(-1):words?.[0])?.toLowerCase();if(!word||/(?:<media omitted>|(?:image|video|audio|sticker|document|contact card) omitted|<attached:)/i.test(event.text))return;const entry=tally.get(word)||{word,count:0,hours:[],examples:[]};entry.count++;entry.hours.push(new Date(event.at).getHours());
  // Keep up to two distinct, original statements so a word has readable context.
  if(entry.examples.length<2&&!entry.examples.some(example=>example.text===event.text))entry.examples.push({text:event.text,at:event.at});
  tally.set(word,entry);});
  return [...tally.values()].sort((a,b)=>b.count-a.count||a.word.localeCompare(b.word)).slice(0,3).map(entry=>{const hours=new Map<number,number>();entry.hours.forEach(hour=>hours.set(hour,(hours.get(hour)||0)+1));const hour=[...hours].sort((a,b)=>b[1]-a[1]||a[0]-b[0])[0][0];return {...entry,hour};});
 }
 return {completed:ends.length,people:[...new Set(messages.map(m=>m.who))].map(who=>({who,starts:starts.filter(m=>m.who===who).length,endings:ends.filter(m=>m.who===who).length,openers:phrases(starts,who,false),closers:phrases(ends,who,true)}))};
}

// Keep the first two minutes available; larger drag values settle on round steps.
export function snapReplyMinutes(minutes:number){
 const bounded=Math.max(1,Math.min(360,minutes));
 return bounded<=2?Math.round(bounded):Math.max(5,Math.round(bounded/5)*5);
}

// Compare exact reply fractions by cross multiplication; display rounding does not affect cups.
export function replyRace(people:{who:string;replies:number[]}[],minutes:number){
 const scores=people.map(person=>({who:person.who,...repliesWithin(person.replies,minutes)}));
 if(scores.length!==2||scores.some(score=>score.total===0))return {winner:null,tied:false};
 const left=scores[0].count*scores[1].total;
 const right=scores[1].count*scores[0].total;
 if(left===right)return {winner:null,tied:true};
 return {winner:left>right?scores[0].who:scores[1].who,tied:false};
}
export function replyRaceInsight(people:{who:string;replies:number[]}[]){
 const windows=[1,5,10,30];
 if(people.length!==2||people.some(person=>!person.replies.length))return 'A little more conversation before we hand out the cups. ⏳';
 const leads=people.map(person=>{const wins=windows.filter(minutes=>replyRace(people,minutes).winner===person.who);return wins.length?`${person.who} leads at ${wins.join(', ')} ${wins.length===1&&wins[0]===1?'minute':'minutes'}`:null;}).filter(Boolean);
 return leads.length?leads.join('; ')+'.':'A photo finish: you’re tied at 1, 5, 10 and 30 minutes. 🏁';
}
