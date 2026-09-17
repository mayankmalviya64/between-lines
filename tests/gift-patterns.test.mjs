import {readFile} from 'node:fs/promises';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
const source=await readFile(new URL('../lib/gift-patterns.ts',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
const {cleanGiftChat,replyBuckets,giftPatterns}=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64'));
test('reply bands count every boundary once',()=>{
 const replies=[0,.99,1,4.99,5,9.99,10,29.99,30,119.99,120,360];
 assert.deepEqual(replyBuckets(replies).map(b=>b.count),[2,2,2,2,2,2]);
 assert.equal(replyBuckets([]).reduce((sum,b)=>sum+b.count,0),0);
});
test('deleted notices disappear and edited text is preserved',()=>{
 const texts=['This message was deleted','You deleted this message.','This message was edited','Hello again <This message was edited>','We discussed a deleted scene.'];
 const result=cleanGiftChat(texts.map((text,i)=>({at:i,who:'A',text})));
 assert.deepEqual(result.map(m=>m.text),['Hello again','We discussed a deleted scene.']);
});
test('six-hour pauses attribute first and last words; the unfinished final exchange has no closing',()=>{
 const time=(hour)=>+new Date(2026,8,1,hour);
 const messages=[{at:time(8),who:'A',text:'Hello there'},{at:time(9),who:'B',text:'See you soon'},{at:time(15),who:'A',text:'Hello again'},{at:time(16),who:'B',text:'See you soon'},{at:time(23),who:'B',text:'Night friend'}];
 const result=giftPatterns(messages);assert.equal(result.completed,2);
 const a=result.people.find(p=>p.who==='A'),b=result.people.find(p=>p.who==='B');
 assert.equal(a.starts,2);assert.equal(a.endings,0);assert.equal(b.starts,1);assert.equal(b.endings,2);
 assert.equal(a.openers[0].word,'hello');assert.equal(a.openers[0].count,2);assert.equal(a.openers[0].hour,8);
 assert.equal(b.closers[0].word,'soon');assert.equal(b.closers[0].count,2);assert.equal(b.closers.some(p=>p.word==='friend'),false);
});
