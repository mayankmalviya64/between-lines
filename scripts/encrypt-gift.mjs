import {readFile,writeFile} from 'node:fs/promises';
import {webcrypto} from 'node:crypto';
import {normalizePasscode} from '../pages/passcode-format.mjs';
import {parseChat} from '../lib/chat.ts';
// Pass the passcode on stdin, never as a command argument or committed source.
let input='';
for await(const chunk of process.stdin)input+=chunk;
const passcode=input.replace(/\r?\n$/,'');
if(!passcode)throw Error('Passcode required on stdin');
const file=process.argv[2];
const payload={welcome:'A little corner of the world, just for you.',note:'Muskan, some people make ordinary days a little brighter. This is a small gift for one of those people — you. Here’s to our conversations, our laughs, and all the little moments in between. 💛'};
if(file){payload.chat=await readFile(file,'utf8');payload.dateOrder=process.argv[3]||'AUTO';parseChat(payload.chat,payload.dateOrder);}
const salt=webcrypto.getRandomValues(new Uint8Array(16)),iv=webcrypto.getRandomValues(new Uint8Array(12));
const material=await webcrypto.subtle.importKey('raw',new TextEncoder().encode(normalizePasscode(passcode)),'PBKDF2',false,['deriveKey']);
const key=await webcrypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:600000,hash:'SHA-256'},material,{name:'AES-GCM',length:256},false,['encrypt']);
const encrypted=await webcrypto.subtle.encrypt({name:'AES-GCM',iv},key,new TextEncoder().encode(JSON.stringify(payload)));
await writeFile(new URL('../public/gift.enc.json',import.meta.url),JSON.stringify({version:1,salt:Buffer.from(salt).toString('base64'),iv:Buffer.from(iv).toString('base64'),ciphertext:Buffer.from(encrypted).toString('base64')}));
console.log(file?'Encrypted chat gift prepared.':'Encrypted preview gift prepared.');
