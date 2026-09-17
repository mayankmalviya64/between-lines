import {useState} from 'react';
const options=[
 {id:1,icon:'🏆',text:'Muskan wins the sprint. Mayank trusts the comeback. 🏆'},
 {id:3,icon:'🍿',text:'The reply speeds differ. The movie opinions probably differ more. 🍿'},
 {id:7,icon:'😂',text:'Neither of us is winning an award for staying off WhatsApp. 😂'},
 {id:8,icon:'📅',text:'The numbers are in. Both sides reserve the right to blame their schedule. 📅'},
 {id:10,icon:'📊',text:'Two MBA grads, one chat, and finally some data behind “I was busy.” 📊'},
];
const storageKey='muskan-caption-pick-v1';
export function CaptionPoll(){
 // Save only the chosen option ID locally. No chat content or passcode is shared.
 const [chosen,setChosen]=useState<number|null>(()=>{try{const saved=Number(localStorage.getItem(storageKey));return options.some(option=>option.id===saved)?saved:null;}catch{return null;}});
 const selected=options.find(option=>option.id===chosen);
 function pick(id:number|null){setChosen(id);try{if(id===null)localStorage.removeItem(storageKey);else localStorage.setItem(storageKey,String(id));}catch{}}
 if(selected){
  const message=`Mayank, my pick for “Two People, Too Busy? 👀” is:\n\n${selected.text}`;
  return <div className="caption-poll"><p className="caption-chosen" aria-live="polite">{selected.text}</p><div className="caption-actions"><button className="caption-change" onClick={()=>pick(null)}>Change my pick</button><a className="secondary" href={'https://wa.me/?text='+encodeURIComponent(message)} target="_blank" rel="noreferrer">💬 Share my pick with Mayank</a></div><small>Choose Mayank in WhatsApp and tap Send. Your pick isn’t sent automatically.</small></div>;
 }
 return <div className="caption-poll"><h3>What do you think, Muskan? 👀</h3><p>Pick the line you like best.</p><div className="caption-options" role="group" aria-label="Choose your favourite line">{options.map(option=><button key={option.id} className="caption-option" onClick={()=>pick(option.id)}><span aria-hidden="true">{option.icon}</span><span>{option.text}</span></button>)}</div></div>;
}
