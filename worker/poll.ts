import {pollOptions} from '../lib/poll-options';
type Env={POLL_TOKEN:string;NOTIFY_EMAIL:string;EMAIL_READY:string;MAILBOX:DurableObjectNamespace};
const origin='https://mayankmalviya64.github.io';
const json=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Access-Control-Allow-Origin':origin,'Cache-Control':'no-store'}});
export default {
 async fetch(request:Request,env:Env){
  const path=new URL(request.url).pathname;
  if(request.method==='OPTIONS'&&request.headers.get('Origin')===origin)return new Response(null,{status:204,headers:{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'POST','Access-Control-Allow-Headers':'Content-Type,Authorization','Access-Control-Max-Age':'600'}});
  if(path!=='/vote'||request.method!=='POST')return json({error:'Not found'},404);
  if(request.headers.get('Origin')!==origin)return json({error:'Forbidden'},403);
  if(!env.POLL_TOKEN||!env.NOTIFY_EMAIL||env.EMAIL_READY!=='true')return json({error:'Email notifications are not connected yet.'},503);
  // The random token is inside the encrypted gift, never the public JavaScript bundle.
  if(request.headers.get('Authorization')!==`Bearer ${env.POLL_TOKEN}`)return json({error:'Unlock the gift first.'},401);
  if(!request.headers.get('Content-Type')?.startsWith('application/json'))return json({error:'Expected JSON'},400);
  const text=await request.text();if(text.length>512)return json({error:'Request too large'},413);
  let vote:any;try{vote=JSON.parse(text);}catch{return json({error:'Invalid request'},400);}
  if(!pollOptions.some(option=>option.id===vote.optionId)||typeof vote.requestId!=='string'||!/^[0-9a-f-]{36}$/i.test(vote.requestId))return json({error:'Choose an available option'},400);
  // Accept no browser-supplied recipient, message body, names, or chat information.
  const response=await env.MAILBOX.get(env.MAILBOX.idFromName('muskan-caption')).fetch(new Request('https://mailbox/vote',{method:'POST',body:JSON.stringify({optionId:vote.optionId,requestId:vote.requestId})}));
  return json(await response.json(),response.status);
 }
};
export class PollMailbox{
 constructor(private state:DurableObjectState,private env:Env){}
 async fetch(request:Request){
  return this.state.blockConcurrencyWhile(async()=>{
   const vote=await request.json() as {optionId:number;requestId:string};
   const option=pollOptions.find(option=>option.id===vote.optionId);if(!option)return json({error:'Invalid option'},400);
   // Persistent idempotency prevents a retry or a double click from sending duplicate emails.
   const recordKey='vote:'+vote.requestId;const existing=await this.state.storage.get<{optionId:number;sent:boolean}>(recordKey);
   if(existing){if(existing.optionId!==vote.optionId)return json({error:'Request already used'},409);if(existing.sent)return json({ok:true});}
   const day=new Date().toISOString().slice(0,10),quota=await this.state.storage.get<{day:string;count:number}>('quota');
   const count=quota?.day===day?quota.count:0;if(count>=20)return json({error:'Today’s notification limit has been reached.'},429);
   await this.state.storage.put('quota',{day,count:count+1});
   try{
    const response=await fetch('https://formsubmit.co/ajax/'+encodeURIComponent(this.env.NOTIFY_EMAIL),{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({_subject:'A poll choice from Two People, Too Busy? 👀',_captcha:'false',_template:'table',_url:origin+'/muskan-is-very-busyy/',option:option.id,chosen_caption:option.text,source:'A visitor to the unlocked gift chose this caption.'}),signal:AbortSignal.timeout(12000)});
    const result=await response.json() as {success?:boolean|string;message?:string};
    if(!response.ok||!(result.success===true||result.success==='true')||/activat|confirm your email/i.test(result.message||''))return json({error:'The email could not be submitted. Please try again.'},502);
    await this.state.storage.put(recordKey,{optionId:vote.optionId,sent:true});return json({ok:true});
   }catch{return json({error:'The email service is temporarily unavailable. Please try again.'},502);}
  });
 }
}
