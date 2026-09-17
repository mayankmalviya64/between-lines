import {useRef,useState} from 'react';
import {pollOptions as options} from '../lib/poll-options';
import config from '../pages/poll-config.json';
const storageKey='muskan-caption-pick-v1';
export function CaptionPoll({token}:{token?:string}){
 // The chosen option ID is sent after a click; chat text and the passcode never leave this browser.
 const [chosen,setChosen]=useState<number|null>(()=>{try{const saved=Number(localStorage.getItem(storageKey));return options.some(option=>option.id===saved)?saved:null;}catch{return null;}});
 const [status,setStatus]=useState<'idle'|'sending'|'sent'|'error'>('idle');
 const requestId=useRef('');
 const selected=options.find(option=>option.id===chosen);
 async function notify(id:number){
  setStatus('sending');
  try{
   if(!token||!config.origin.startsWith('https://'))throw Error('Not configured');
   const response=await fetch(config.origin+'/vote',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({optionId:id,requestId:requestId.current}),signal:AbortSignal.timeout(18000)});
   const result=await response.json() as {ok?:boolean};if(!response.ok||result.ok!==true)throw Error('Notification failed');setStatus('sent');
  }catch{setStatus('error');}
 }
 function pick(id:number|null){setChosen(id);setStatus('idle');try{if(id===null)localStorage.removeItem(storageKey);else localStorage.setItem(storageKey,String(id));}catch{}if(id!==null){requestId.current=crypto.randomUUID();void notify(id);}}
 if(selected)return <div className="caption-poll"><p className="caption-chosen">{selected.text}</p><div className="caption-actions"><button className="caption-change" disabled={status==='sending'} onClick={()=>pick(null)}>Change my pick</button>{status==='error'&&<button className="secondary" onClick={()=>notify(selected.id)}>Try notifying Mayank again</button>}</div><small role="status" aria-live="polite">{status==='sending'?'Letting Mayank know… 💌':status==='sent'?'Your pick is on its way to Mayank. 💌':status==='error'?'Your pick is saved, but the email didn’t go through. Please try again.':'Your pick is saved.'}</small></div>;
 return <div className="caption-poll"><h3>What do you think, Muskan? 👀</h3><p>Pick the line you like best. Your choice will be emailed to Mayank. 💌</p><div className="caption-options" role="group" aria-label="Choose your favourite line">{options.map(option=><button key={option.id} className="caption-option" onClick={()=>pick(option.id)}><span aria-hidden="true">{option.icon}</span><span>{option.text}</span></button>)}</div></div>;
}
