import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {test} from 'node:test';
import ts from 'typescript';
const moduleUrl=source=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText).toString('base64');
const optionsUrl=moduleUrl(await readFile(new URL('../lib/poll-options.ts',import.meta.url),'utf8'));
const source=(await readFile(new URL('../worker/poll.ts',import.meta.url),'utf8')).replace("'../lib/poll-options'",JSON.stringify(optionsUrl));
const {default:worker,PollMailbox}=await import(moduleUrl(source));
const uuid='00000000-0000-4000-8000-000000000001';
const origin='https://mayankmalviya64.github.io';
const env={POLL_TOKEN:'test-only-token',NOTIFY_EMAIL:'recipient@example.com',EMAIL_READY:'true',MAILBOX:{}};
function request(body={optionId:1,requestId:uuid},token=env.POLL_TOKEN,sourceOrigin=origin){return new Request('https://test/vote',{method:'POST',headers:{Origin:sourceOrigin,'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify(body)});}
test('only authenticated, allowed choices can reach the mail backend',async()=>{
 assert.equal((await worker.fetch(request(),{...env,EMAIL_READY:'false'})).status,503);
 assert.equal((await worker.fetch(request(undefined,'wrong'),env)).status,401);
 assert.equal((await worker.fetch(request(undefined,env.POLL_TOKEN,'https://other.example'),env)).status,403);
 assert.equal((await worker.fetch(request({optionId:4,requestId:uuid}),env)).status,400);
 assert.equal((await worker.fetch(request({optionId:1,requestId:'invalid'}),env)).status,400);
 let forwarded;
 const ready={...env,MAILBOX:{idFromName:()=>0,get:()=>({fetch:async request=>{forwarded=await request.json();return Response.json({ok:true});}})}};
 assert.equal((await worker.fetch(request({optionId:3,requestId:uuid,to:'attacker@example.com',chat:'private text'}),ready)).status,200);
 assert.deepEqual(forwarded,{optionId:3,requestId:uuid});
});
test('notification retries are idempotent, fixed-caption only, and failed email is not success',async()=>{
 const store=new Map();const state={blockConcurrencyWhile:fn=>fn(),storage:{get:async key=>store.get(key),put:async(key,value)=>store.set(key,value)}};
 const mailbox=new PollMailbox(state,env);let calls=0,payload;const original=globalThis.fetch;
 globalThis.fetch=async(url,init)=>{calls++;payload=Object.fromEntries(new URLSearchParams(init.body));assert.equal(url,'https://formsubmit.co/recipient%40example.com');return new Response('<h1>Thanks!</h1><p>The form was submitted successfully.</p>');};
 const vote=id=>new Request('https://internal/vote',{method:'POST',body:JSON.stringify({optionId:id,requestId:uuid})});
 try{
  assert.equal((await mailbox.fetch(vote(1))).status,200);assert.equal((await mailbox.fetch(vote(1))).status,200);assert.equal(calls,1);
  assert(payload.chosen_caption.includes('Muskan wins the sprint'));assert(!('chat' in payload));assert(!('passcode' in payload));
  assert.equal((await mailbox.fetch(vote(3))).status,409);
  store.clear();globalThis.fetch=async()=>Response.json({success:'true',message:'Please activate your email'});
  assert.equal((await mailbox.fetch(vote(1))).status,502);
  store.set('quota',{day:new Date().toISOString().slice(0,10),count:20});assert.equal((await mailbox.fetch(vote(1))).status,429);
 }finally{globalThis.fetch=original;}
});
