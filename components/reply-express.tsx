import {useState} from 'react';
import {duration} from '../lib/chat';

type Person = {who:string; replies:number[]; median:number|null};
const windows = [1,5,10,30,60,120,360];

export function ReplyExpress({people,avatars}:{people:Person[];avatars:string[]}) {
 const [minutes,setMinutes] = useState(5);
 // Reuse filtered replies so the tickets and dials honour every dashboard setting.
 function tally(person:Person,window:number) {
  const count=person.replies.filter(reply=>reply<=window).length;
  return {count,percent:person.replies.length?Math.round(count/person.replies.length*100):null};
 }
 return <section className="card full">
  <h2>The reply express 🚀</h2>
  <small>How quickly each person returns · current date, excluded-period and long-gap filters apply.</small>
  <div className="reply-people">{people.map((person,index)=><div className={'reply-person reply-person-'+index} key={person.who}>
   <div className="reply-person-heading"><span aria-hidden="true">{avatars[index]}</span><div><h3>{person.who}</h3><small>{person.replies.length} eligible replies</small></div></div>
   <div className="reply-ticket"><small>Typical reply · median</small><strong>{duration(person.median)}</strong></div>
   <div className="reply-stops">{windows.map(window=>{const value=tally(person,window);return <div className="reply-stop" key={window}><span className="stop-icon" aria-hidden="true">{window<=5?'⚡':window<=30?'🚲':'🚂'}</span><span>Within {window<60?window+' min':window/60+' hr'}</span><div><strong>{value.percent===null?'—':value.percent+'%'}</strong><small>{value.count} replies</small></div></div>;})}</div>
  </div>)}</div>
  <div className="reply-explorer"><h3>Set the clock, see your rhythm ⏱️</h3>
   <label className="field" htmlFor="reply-duration">Reply window · {minutes} minutes<input id="reply-duration" className="reply-slider" type="range" min="1" max="360" step="1" value={minutes} aria-valuetext={'Within '+minutes+' minutes'} onChange={event=>setMinutes(Number(event.target.value))}/></label>
   <div className="slider-ends"><small>1 minute</small><small>6 hours</small></div>
   <div className="reply-presets" role="group" aria-label="Common reply windows">{windows.map(window=><button className="secondary" key={window} aria-pressed={minutes===window} onClick={()=>setMinutes(window)}>{window<60?window+' min':window/60+' hr'}</button>)}</div>
   <div className="reply-dials" aria-live="polite">{people.map((person,index)=>{const value=tally(person,minutes);return <div className={'reply-dial-person dial-person-'+index} key={person.who}><span className="dial-avatar" aria-hidden="true">{avatars[index]}</span><h3>{person.who}</h3><div className="reply-dial"><svg viewBox="0 0 110 110" aria-hidden="true"><circle cx="55" cy="55" r="44" className="dial-track"/><circle cx="55" cy="55" r="44" pathLength="100" strokeDasharray={(value.percent??0)+' 100'} className="dial-progress"/></svg><strong>{value.percent===null?'—':value.percent+'%'}</strong></div><p>within {minutes} minutes</p><small>{value.count} of {person.replies.length} measured replies</small></div>;})}</div>
  </div>
  <div className="note">Reply gaps measure time between sent messages, not time after reading. Faster replies do not measure how much someone cares.</div>
 </section>;
}
