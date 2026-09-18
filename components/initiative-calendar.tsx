import {useMemo} from 'react';
import type {Message} from '../lib/chat';
import {aiWindow} from '../lib/ai';

const dateKey=(date:Date)=>[date.getFullYear(),date.getMonth()+1,date.getDate()].join('-');
const weekdays=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

// Inspect the full export before filtering: a window boundary is not a new conversation.
export function initiativeDays(chat:Message[],start:number,end:number) {
 const days=new Map<string,{active:boolean;starts:Map<string,number>}>();
 const messages=[...chat].sort((a,b)=>a.at-b.at);
 messages.forEach((message,index)=>{
  if(message.at<start||message.at>end)return;
  const key=dateKey(new Date(message.at));
  const day=days.get(key)??{active:true,starts:new Map<string,number>()};
  const previous=messages[index-1];
  // Sorted messages ensure only the earliest conversation start claims this day.
  if(day.starts.size===0&&(!previous||message.at-previous.at>=6*3600000)){
   day.starts.set(message.who,(day.starts.get(message.who)??0)+1);
  }
  days.set(key,day);
 });
 return days;
}

export function InitiativeCalendar({chat,people,avatars,names}:{chat:Message[];people:{who:string}[];avatars:string[];names:string[]}) {
 const window=useMemo(()=>aiWindow(),[chat]);
 const days=useMemo(()=>initiativeDays(chat,window.start,window.end),[chat,window]);
 const first=new Date(window.start),last=new Date(window.end);
 const months:Date[]=[];
 for(let date=new Date(first.getFullYear(),first.getMonth(),1);+date<=window.end;date=new Date(date.getFullYear(),date.getMonth()+1,1))months.push(date);
 return <div className="initiative-calendar">
  <h3>Who brought the first hello? 📅</h3>
  <p className="muted">Conversation starts from {first.toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'})} through {last.toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'})} · rolling last three months.</p>
  <div className="calendar-key">{people.map((person,index)=><span key={person.who}>{avatars[index]} {names[index]}</span>)}<span>· Messages, no new start</span><span>Blank: no recorded messages</span></div>
  <div className="calendar-months">{months.map(month=>{
   const count=new Date(month.getFullYear(),month.getMonth()+1,0).getDate();
   const offset=(month.getDay()+6)%7;
   return <section className="calendar-month" key={+month} aria-label={month.toLocaleDateString(undefined,{month:'long',year:'numeric'})}>
    <h4>{month.toLocaleDateString(undefined,{month:'long',year:'numeric'})}</h4>
    <div className="calendar-grid">{weekdays.map(day=><span className="calendar-weekday" key={day}>{day}</span>)}
     {Array.from({length:offset},(_,index)=><span aria-hidden="true" key={'space-'+index}/>)}
     {Array.from({length:count},(_,index)=>{
      const date=new Date(month.getFullYear(),month.getMonth(),index+1);
      // Include the boundary date even when the rolling range begins partway through it.
      const outside=+date<+new Date(first.getFullYear(),first.getMonth(),first.getDate())||+date>window.end;
      const day=outside?undefined:days.get(dateKey(date));
      const starters=people.map((person,personIndex)=>({who:person.who,index:personIndex,count:day?.starts.get(person.who)??0})).filter(person=>person.count>0);
      const description=outside?'Outside the three-month range':starters.length?starters.map(person=>names[person.index]+': '+person.count+' conversation '+(person.count===1?'start':'starts')).join('; '):day?'Messages, no new conversation start':'No recorded messages';
      return <div className={'calendar-day'+(outside?' outside':'')+(starters.length?' has-start':'')} key={index} tabIndex={outside?undefined:0} title={description} aria-label={date.toLocaleDateString()+': '+description}>
       <small>{index+1}</small><div className="calendar-avatars">{starters.map(person=><span className={'calendar-person calendar-person-'+person.index} key={person.who}>{avatars[person.index]}{person.count>1&&<sup>{person.count}</sup>}</span>)}{day&&!starters.length&&<span aria-hidden="true">·</span>}</div>
      </div>;
     })}
    </div>
   </section>;
  })}</div>
  <small>A new conversation begins after at least six hours of silence. Only the person who initiates the first conversation that day is shown; later starts do not change the avatar. The first message in the export counts as a start. Reply-time and dashboard date filters do not change this fixed three-month calendar. Blank days may also reflect missing export history.</small>
 </div>;
}
