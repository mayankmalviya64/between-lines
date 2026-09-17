import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
const source=await readFile(new URL('../pages/gift-crypto.ts',import.meta.url),'utf8');
const formatSource=await readFile(new URL('../pages/passcode-format.mjs',import.meta.url),'utf8');
const formatUrl='data:text/javascript;base64,'+Buffer.from(formatSource).toString('base64');
const {normalizePasscode}=await import(formatUrl);
const compiled=ts.transpileModule(source.replace("'./passcode-format.mjs'",JSON.stringify(formatUrl)),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
const {deriveKey,decryptGift,encode,sessionValid,SESSION_MS}=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64'));
test('encrypted content requires the correct key and detects tampering',async()=>{
 const salt=encode(crypto.getRandomValues(new Uint8Array(16))),iv=crypto.getRandomValues(new Uint8Array(12));
 const key=await deriveKey('test-only-passcode',salt);
 const ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,new TextEncoder().encode(JSON.stringify({note:'private fixture'})));
 const envelope={version:1,salt,iv:encode(iv),ciphertext:encode(new Uint8Array(ciphertext))};
 assert.deepEqual(await decryptGift(envelope,key),{note:'private fixture'});
 await assert.rejects(decryptGift(envelope,await deriveKey('wrong-passcode',salt)));
 const damaged=new Uint8Array(ciphertext);damaged[0]^=1;
 await assert.rejects(decryptGift({...envelope,ciphertext:encode(damaged)},key));
 const saved=await crypto.subtle.exportKey('raw',key);
 const restored=await crypto.subtle.importKey('raw',saved,'AES-GCM',false,['decrypt']);
 assert.deepEqual(await decryptGift(envelope,restored),{note:'private fixture'});
});
test('unlock expires at exactly three hours without sliding renewal',()=>{
 const start=1000000,expiry=start+SESSION_MS;
 assert.equal(sessionValid(expiry,start),true);
 assert.equal(sessionValid(expiry,expiry-1),true);
 assert.equal(sessionValid(expiry,expiry),false);
 assert.equal(sessionValid(expiry,expiry+1),false);
 assert.equal(sessionValid(Infinity,start),false);
 assert.equal(sessionValid(start+SESSION_MS+1,start),false);
});
test('gift entry point excludes public analytics and AI routes',async()=>{
 const entry=await readFile(new URL('../pages/main.tsx',import.meta.url),'utf8');
 assert.equal(entry.includes("from './usage'"),false);
 assert.equal(entry.includes("from '../app/page'"),false);
 const gift=await readFile(new URL('../pages/gift.tsx',import.meta.url),'utf8');
 assert.equal(gift.includes('AiInsights'),false);
});

test('formatting differences unlock but changed words do not',async()=>{
 assert.equal(normalizePasscode('Hello, Special Friend?! 😂'),normalizePasscode('  HELLO special   friend  '));
 const salt=encode(crypto.getRandomValues(new Uint8Array(16))),iv=crypto.getRandomValues(new Uint8Array(12));
 const original=await deriveKey('Hello, Special Friend?! 😂',salt);
 const encrypted=await crypto.subtle.encrypt({name:'AES-GCM',iv},original,new TextEncoder().encode('{"ok":true}'));
 const envelope={version:1,salt,iv:encode(iv),ciphertext:encode(new Uint8Array(encrypted))};
 assert.deepEqual(await decryptGift(envelope,await deriveKey('HELLO special friend',salt)),{ok:true});
 await assert.rejects(decryptGift(envelope,await deriveKey('Hello other friend',salt)));
});
test('an existing unlock key still opens the previous envelope after update',async()=>{
 const oldKey=await crypto.subtle.generateKey({name:'AES-GCM',length:256},true,['encrypt','decrypt']);
 const newKey=await crypto.subtle.generateKey({name:'AES-GCM',length:256},true,['encrypt','decrypt']);
 const pack=async key=>{const iv=crypto.getRandomValues(new Uint8Array(12));const bytes=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,new TextEncoder().encode('{"session":"preserved"}'));return {version:1,salt:'',iv:encode(iv),ciphertext:encode(new Uint8Array(bytes))};};
 const envelope={...await pack(newKey),previous:await pack(oldKey)};
 assert.deepEqual(await decryptGift(envelope,oldKey),{session:'preserved'});
 assert.deepEqual(await decryptGift(envelope,newKey),{session:'preserved'});
});
