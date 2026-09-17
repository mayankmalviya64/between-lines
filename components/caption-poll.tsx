import {useRef,useState} from 'react';
import {pollOptions as options} from '../lib/poll-options';
const storageKey='muskan-caption-pick-v1';
export function CaptionPoll({token}:{token?:string}){
 // Send only the chosen caption to FormSubmit. Its hidden form ID is inside the encrypted gift.
 // No Gmail credentials, chat text, or passcode are sent; the Gmail address is receive-only.
 const [chosen,setChosen]=useState<number|null>(()=>{try{const saved=Number(localStorage.getItem(storageKey));return options.some(option=>option.id===saved)?saved:null;}catch{return null;}});
 const [status,setStatus]=useState<'idle'|'sending'|'sent'|'error'>('idle');
 const requestId=useRef('');
 const selected=options.find(option=>option.id===chosen);
 async function notify(id:number){
  setStatus('sending');
  try{
   if(!token||!/^[a-f0-9]{32}$/.test(token))throw Error('Not configured');
   const option=options.find(option=>option.id===id);if(!option)throw Error('Invalid option');
   const response=await fetch('https://formsubmit.co/ajax/'+token,{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({_subject:'A poll choice from Two People, Too Busy? 👀',_captcha:'false',_template:'table',_url:'https://mayankmalviya64.github.io/muskan-is-very-busyy/',option:id,chosen_caption:option.text,request_id:requestId.current,source:'A visitor to the unlocked gift chose this caption.'}),signal:AbortSignal.timeout(18000)});
   const result=await response.json() as {success?:boolean|string};if(!response.ok||!(result.success===true||result.success==='true'))throw Error('Notification failed');setStatus('sent');
  }catch{setStatus('error');}
 }
 function pick(id:number|null){setChosen(id);setStatus('idle');try{if(id===null)localStorage.removeItem(storageKey);else localStorage.setItem(storageKey,String(id));}catch{}if(id!==null){requestId.current=crypto.randomUUID();void notify(id);}}
 if(selected)return <div className="caption-poll"><p className="caption-chosen">{selected.text}</p><div className="caption-actions"><button className="caption-change" disabled={status==='sending'} onClick={()=>pick(null)}>Change my pick</button>{status==='error'&&<button className="secondary" onClick={()=>notify(selected.id)}>Try notifying Mayank again</button>}</div><small role="status" aria-live="polite">{status==='sending'?'Letting Mayank know… 💌':status==='sent'?'Your pick is on its way to Mayank. 💌':status==='error'?'Your pick is saved, but the email didn’t go through. Please try again.':'Your pick is saved.'}</small></div>;
 return <div className="caption-poll"><h3>What do you think, Muskan? 👀</h3><p>Pick the line you like best. Your choice will be emailed to Mayank. 💌</p><div className="caption-options" role="group" aria-label="Choose your favourite line">{options.map(option=><button key={option.id} className="caption-option" onClick={()=>pick(option.id)}><span aria-hidden="true">{option.icon}</span><span>{option.text}</span></button>)}</div></div>;
}
