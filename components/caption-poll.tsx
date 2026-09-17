import {useRef,useState} from 'react';
import {pollOptions as options} from '../lib/poll-options';
type PollOption={id:number;icon:string;text:string};
const captionKey='muskan-caption-pick-v1',partyKey='muskan-party-pick-v1';
const sentKey='muskan-combined-poll-sent-v1';
function savedChoice(key:string,choices:PollOption[]){
 try{const id=Number(localStorage.getItem(key));return choices.some(option=>option.id===id)?id:null;}catch{return null;}
}
function PollCard({choices,chosen,party,busy,onPick}:{choices:PollOption[];chosen:number|null;party?:boolean;busy:boolean;onPick:(id:number|null)=>void}){
 const selected=choices.find(option=>option.id===chosen);
 if(selected)return <div className="caption-poll"><p className="caption-chosen">{selected.text}</p><button className="caption-change" disabled={busy} onClick={()=>onPick(null)}>Change my pick</button></div>;
 return <div className="caption-poll"><h3>{party?'So, Muskan… who’s giving the party, as agreed? 🎉':'What do you think, Muskan? 👀'}</h3><p>{party?'The reply report is in. Time for the important decision.':'Pick the line you like best.'}</p><div className="caption-options" role="group" aria-label={party?'Choose who gives the party':'Choose your favourite line'}>{choices.map(option=><button disabled={busy} key={option.id} className="caption-option" onClick={()=>onPick(option.id)}><span aria-hidden="true">{option.icon}</span><span>{option.text}</span></button>)}</div></div>;
}
export function CaptionPolls({token,partyOptions}:{token?:string;partyOptions:PollOption[]}){
 const [picks,setPicks]=useState(()=>({caption:savedChoice(captionKey,options),party:savedChoice(partyKey,partyOptions)}));
 const [status,setStatus]=useState<'idle'|'sending'|'sent'|'error'>('idle');
 const sending=useRef(false),requestId=useRef('');
 async function notify(next:typeof picks){
  const caption=options.find(option=>option.id===next.caption);
  const party=partyOptions.find(option=>option.id===next.party);
  // The two answers form one submission. A partial answer never triggers an email.
  if(!caption||!party||sending.current)return;
  const signature=JSON.stringify([caption.text,party.text]);
  try{if(localStorage.getItem(sentKey)===signature){setStatus('sent');return;}}catch{}
  sending.current=true;setStatus('sending');
  try{
   if(!token||!/^[a-f0-9]{32}$/.test(token))throw Error('Not configured');
   // FormSubmit sends the email; Gmail is receive-only. No chat text or passcode is included.
   const response=await fetch('https://formsubmit.co/ajax/'+token,{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({_subject:'Both poll answers from Two People, Too Busy? 👀',_captcha:'false',_template:'table',_url:'https://mayankmalviya64.github.io/muskan-is-very-busyy/',caption_choice:caption.text,party_verdict:party.text,request_id:requestId.current,source:'A visitor to the unlocked gift answered both polls.'}),signal:AbortSignal.timeout(18000)});
   const result=await response.json() as {success?:boolean|string};
   if(!response.ok||!(result.success===true||result.success==='true'))throw Error('Notification failed');
   try{localStorage.setItem(sentKey,signature);}catch{}
   setStatus('sent');
  }catch{setStatus('error');}finally{sending.current=false;}
 }
 function pick(which:'caption'|'party',id:number|null){
  if(sending.current)return;
  const next={...picks,[which]:id};setPicks(next);setStatus('idle');
  try{const key=which==='caption'?captionKey:partyKey;if(id===null)localStorage.removeItem(key);else localStorage.setItem(key,String(id));}catch{}
  requestId.current=crypto.randomUUID();
  if(id!==null)void notify(next);
 }
 return <><PollCard choices={options} chosen={picks.caption} busy={status==='sending'} onPick={id=>pick('caption',id)}/><PollCard choices={partyOptions} chosen={picks.party} party busy={status==='sending'} onPick={id=>pick('party',id)}/><div className="caption-poll"><small role="status" aria-live="polite">{status==='sending'?'Sending both answers to Mayank… 💌':status==='sent'?'Both answers sent together to Mayank. 💌':status==='error'?'Your answers are saved, but the email didn’t go through. Please try again.':'Answer both polls and we’ll email your picks to Mayank together. 💌'}</small>{status==='error'&&<button className="secondary" onClick={()=>notify(picks)}>Send both answers again</button>}</div></>;
}
