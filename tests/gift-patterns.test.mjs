import {readFile} from 'node:fs/promises';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
const source=await readFile(new URL('../lib/gift-patterns.ts',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
const {cleanGiftChat,replyBuckets,giftPatterns,repliesWithin,snapReplyMinutes,cumulativeReplyRows,replyRace,replyRaceInsight}=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64'));
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
 assert.deepEqual(a.openers[0].examples,[{text:'Hello there',at:time(8)},{text:'Hello again',at:time(15)}]);
 assert.equal(b.closers[0].word,'soon');assert.equal(b.closers[0].count,2);assert.deepEqual(b.closers[0].examples,[{text:'See you soon',at:time(9)}]);assert.equal(b.closers.some(p=>p.word==='friend'),false);
});

test('slider percentages are cumulative, inclusive, and handle empty samples',()=>{
 const replies=[0,1,2,5,10,30];
 assert.deepEqual(repliesWithin(replies,1),{count:2,total:6,percent:33});
 assert.deepEqual(repliesWithin(replies,5),{count:4,total:6,percent:67});
 assert.deepEqual(repliesWithin(replies,10),{count:5,total:6,percent:83});
 assert.deepEqual(repliesWithin(replies,360),{count:6,total:6,percent:100});
 assert.deepEqual(repliesWithin([],5),{count:0,total:0,percent:null});
});

test('drag steps preserve short windows, round by five, and stay in range',()=>{
 assert.deepEqual([1,2,3,7,8,12,13,178,359,360].map(snapReplyMinutes),[1,2,5,5,10,10,15,180,360,360]);
 assert.equal(snapReplyMinutes(-1),1);assert.equal(snapReplyMinutes(500),360);
});

test('card rows are cumulative and match slider percentages at every preset',()=>{
 const replies=[0,1,2,5,10,30,60,120,360];
 const rows=cumulativeReplyRows(replies);
 assert.deepEqual(rows.map(row=>row.count),[2,4,5,6,7,8,9]);
 assert.deepEqual(rows.map(row=>row.percent),[22,44,56,67,78,89,100]);
 for(const row of rows){const slider=repliesWithin(replies,row.minutes);assert.equal(row.count,slider.count);assert.equal(row.percent,slider.percent);}
 assert(cumulativeReplyRows([]).every(row=>row.count===0&&row.percent===null));
});

test('reply cups compare rates, handle ties, and change with the window',()=>{
 const people=[{who:'Muskan',replies:[0,10,10]},{who:'Mayank',replies:[2,2,2,2]}];
 assert.deepEqual(replyRace(people,1),{winner:'Muskan',tied:false});
 assert.deepEqual(replyRace(people,5),{winner:'Mayank',tied:false});
 assert.deepEqual(replyRace(people,10),{winner:null,tied:true});
 assert.deepEqual(replyRace([{who:'Muskan',replies:[]},people[1]],5),{winner:null,tied:false});
 assert.match(replyRaceInsight(people),/Muskan leads at 1 minute; Mayank leads at 5 minutes/);
});
