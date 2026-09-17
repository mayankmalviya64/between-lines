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
