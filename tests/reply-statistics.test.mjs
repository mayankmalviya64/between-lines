import {readFile} from 'node:fs/promises';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
const source=await readFile(new URL('../lib/reply-statistics.ts',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
const {replyStatistics,cumulativeBands}=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64'));
const close=(actual,expected)=>assert(Math.abs(actual-expected)<1e-10,`${actual} differs from ${expected}`);
test('mean, interpolated percentiles, sample deviation, and mode reconcile on a known sample',()=>{
 const s=replyStatistics([9,4,5,2,7,4,5,4]);assert.equal(s.mean,5);assert.equal(s.median,4.5);close(s.sd,Math.sqrt(32/7));assert.deepEqual(s.modes,[4]);assert.equal(s.modeCount,3);assert.equal(s.q1,4);assert.equal(s.q3,5.5);assert.equal(s.iqr,1.5);close(s.p90,7.6);close(s.p95,8.3);assert.equal(s.min,2);assert.equal(s.max,9);
});
test('empty, single, tied modes, and identical observations remain meaningful',()=>{
 const empty=replyStatistics([]);assert.equal(empty.mean,null);assert.equal(empty.sd,null);assert.equal(empty.p95,null);assert.deepEqual(empty.modes,[]);
 const single=replyStatistics([3]);assert.equal(single.mean,3);assert.equal(single.median,3);assert.equal(single.sd,null);assert.deepEqual(single.modes,[]);
 assert.deepEqual(replyStatistics([1,1,2,2]).modes,[1,2]);assert.deepEqual(replyStatistics([1,2,3]).modes,[]);
 const equal=replyStatistics([0,0,0]);assert.equal(equal.sd,0);assert.equal(equal.iqr,0);assert.deepEqual(equal.modes,[0]);
});
test('waterfall starts, increments, and totals reconcile without double counting',()=>{
 const steps=cumulativeBands([2,3,0,5]);assert.deepEqual(steps.map(s=>[s.start,s.end,s.share]),[[0,20,20],[20,50,30],[50,50,0],[50,100,50]]);
 assert.equal(cumulativeBands([0,0])[1].end,0);
});
