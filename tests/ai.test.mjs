import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {test} from 'node:test';
import ts from 'typescript';

// Compile the pure policy and Worker modules in memory. Tests never upload a
// conversation or call a real AI provider.
const moduleUrl = source => 'data:text/javascript;base64,' + Buffer.from(ts.transpileModule(source, {compilerOptions: {target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext}}).outputText).toString('base64');
const aiUrl = moduleUrl(await readFile(new URL('../lib/ai.ts', import.meta.url), 'utf8'));
const {aiWindow, prepareAiChat, MAX_AI_BYTES} = await import(aiUrl);
const workerSource = (await readFile(new URL('../worker/index.ts', import.meta.url), 'utf8')).replace("'../lib/ai'", JSON.stringify(aiUrl));
const {default: worker, DailyAiBudget} = await import(moduleUrl(workerSource));
const origin = 'https://mayankmalviya64.github.io';
const request = payload => new Request('https://worker.example/api/insights', {method: 'POST', headers: {Origin: origin, 'Content-Type': 'application/json'}, body: JSON.stringify(payload)});
const recent = () => ({at: Date.now() - 3600000, who: 'A', text: 'How did your presentation go?'});
const valid = {insights: [{title: 'A thoughtful check-in', observation: 'A asks about the presentation.', evidence: ['How did your presentation go?'], suggestion: 'Ask a follow-up.', uncertainty: 'One message does not establish a broader pattern.'}]};
function environment() {
  const calls = {ai: 0, budget: 0};
  return {calls, env: {ALLOWED_ORIGIN: origin, AI: {async run() {calls.ai++; return {choices: [{message: {content: JSON.stringify(valid), reasoning: "Private reasoning must not be returned"}}]};}}, AI_BUDGET: {idFromName: value => value, get: () => ({async fetch() {calls.budget++; return new Response(null, {status: 204});}})}}};
}

test('three calendar months clamp month ends, including leap years', () => {
  assert.equal(new Date(aiWindow(new Date('2026-05-31T12:30:00Z')).start).toISOString(), '2026-02-28T12:30:00.000Z');
  assert.equal(new Date(aiWindow(new Date('2024-05-31T12:30:00Z')).start).toISOString(), '2024-02-29T12:30:00.000Z');
  assert.equal(new Date(aiWindow(new Date('2026-01-15T00:00:00Z')).start).toISOString(), '2025-10-15T00:00:00.000Z');
});
test('preparation excludes old/future text and replaces speaker headers', () => {
  const now = new Date('2026-09-17T12:00:00Z');
  const result = prepareAiChat([
    {at: +new Date('2026-06-16'), who: 'Riya', text: 'OLD PRIVATE TEXT'},
    {at: +new Date('2026-07-01'), who: 'Riya', text: 'Hello'},
    {at: +new Date('2026-07-02'), who: 'Sam', text: 'Hi'},
    {at: +new Date('2026-10-01'), who: 'Sam', text: 'FUTURE TEXT'},
  ], now);
  assert.equal(result.excluded, 2);
  assert.deepEqual(result.messages.map(message => message.who), ['A', 'B']);
  assert.ok(!JSON.stringify(result.messages).includes('PRIVATE'));
});
test('backend rejects absent consent and old/future messages before inference or reservation', async () => {
  for (const payload of [
    {consent: false, messages: [recent()]},
    {consent: true, messages: [{...recent(), at: +new Date('2020-01-01')}]},
    {consent: true, messages: [{...recent(), at: Date.now() + 86400000}]},
  ]) {
    const {env, calls} = environment();
    assert.equal((await worker.fetch(request(payload), env)).status, 400);
    assert.deepEqual(calls, {ai: 0, budget: 0});
  }
});
test('oversize payload fails without inference and valid payload returns insights', async () => {
  const {env, calls} = environment();
  assert.equal((await worker.fetch(request({consent: true, messages: [{...recent(), text: 'x'.repeat(MAX_AI_BYTES + 2000)}]}), env)).status, 413);
  assert.equal(calls.ai, 0);
  const response = await worker.fetch(request({consent: true, messages: [recent()]}), env);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), valid);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
});
test('exhausted quota and malformed AI output fail safely', async () => {
  const {env, calls} = environment();
  env.AI_BUDGET.get = () => ({fetch: async () => new Response(null, {status: 429})});
  assert.equal((await worker.fetch(request({consent: true, messages: [recent()]}), env)).status, 429);
  assert.equal(calls.ai, 0);
  const second = environment();
  second.env.AI.run = async () => ({response: '<script>bad output</script>'});
  assert.equal((await worker.fetch(request({consent: true, messages: [recent()]}), second.env)).status, 502);
});
test('shared budget reserves atomically across concurrent requests and resets daily', async () => {
  let saved = {day: '2020-01-01', neurons: 8000, requests: 20};
  let queue = Promise.resolve();
  const storage = {get: async () => saved, put: async (_key, value) => {saved = value;}, transaction(callback) {const result = queue.then(() => callback(storage)); queue = result.then(() => {}); return result;}};
  const budget = new DailyAiBudget({storage});
  const responses = await Promise.all([1, 2, 3].map(() => budget.fetch(new Request('https://budget/reserve', {method: 'POST', body: JSON.stringify({neurons: 3500})}))));
  assert.deepEqual(responses.map(response => response.status), [204, 204, 429]);
  assert.equal(saved.neurons, 7000);
  assert.equal(saved.requests, 2);
});
