import {useState} from 'react';

const emojiOptions = ['👦🏻','🙎🏻‍♀️','🧑🏻','👨🏻','👩🏻','👦🏽','👩🏽','🧑🏽','🌻','🌸','🐻','🐱','🐶','🦊','🐼','💛'];

type Props = {name:string; avatar:string; onNameChange:(name:string)=>void; onAvatarChange:(emoji:string)=>void};

// All instances edit the same profile in the parent, so cards stay in sync.
export function ParticipantIdentity({name,avatar,onNameChange,onAvatarChange}:Props) {
 const [choosing,setChoosing] = useState(false);
 const [editing,setEditing] = useState(false);
 const [draft,setDraft] = useState(name);
 function saveName() {
  const value=draft.trim();
  if(value) onNameChange(value);
  setEditing(false);
 }
 return <div className="participant-identity">
  <button type="button" className="identity-avatar" aria-label={`Change avatar for ${name}`} aria-expanded={choosing} onClick={()=>setChoosing(!choosing)}>{avatar}</button>
  <div className="identity-name-wrap">{editing ? <input autoFocus className="input identity-name-input" aria-label={`Display name for ${name}`} maxLength={60} value={draft} onChange={event=>setDraft(event.target.value)} onBlur={saveName} onKeyDown={event=>{
   if(event.key==='Enter') {event.preventDefault();saveName();}
   if(event.key==='Escape') {setDraft(name);setEditing(false);}
  }}/> : <button type="button" className="identity-name" aria-label={`Edit name for ${name}`} onClick={()=>{setDraft(name);setEditing(true);}}>{name}</button>}</div>
  {choosing && <div className="avatar-choices identity-picker" role="group" aria-label={`Choose an avatar for ${name}`} onKeyDown={event=>{if(event.key==='Escape')setChoosing(false);}}>
   {emojiOptions.map(emoji=><button type="button" key={emoji} aria-label={`Choose ${emoji} for ${name}`} aria-pressed={avatar===emoji} onClick={()=>{onAvatarChange(emoji);setChoosing(false);}}>{emoji}</button>)}
   <button type="button" aria-label="Close avatar choices" onClick={()=>setChoosing(false)}>✕</button>
  </div>}
 </div>;
}
