import {normalizePasscode} from './passcode-format.mjs';
// Derive a strong encryption key without publishing or storing the passcode.
export type Envelope={version:1;salt:string;iv:string;ciphertext:string;previous?:Envelope};
export const SESSION_MS=3*60*60*1000;
export function encode(bytes:Uint8Array){return btoa(Array.from(bytes,b=>String.fromCharCode(b)).join(''));}
export function decode(value:string){return Uint8Array.from(atob(value),c=>c.charCodeAt(0));}
export async function deriveKey(passcode:string,salt:string){
 const material=await crypto.subtle.importKey('raw',new TextEncoder().encode(normalizePasscode(passcode)),'PBKDF2',false,['deriveKey']);
 return crypto.subtle.deriveKey({name:'PBKDF2',salt:decode(salt),iterations:600000,hash:'SHA-256'},material,{name:'AES-GCM',length:256},true,['encrypt','decrypt']);
}
export async function decryptGift(envelope:Envelope,key:CryptoKey){
 if(envelope.version!==1)throw Error('Unsupported gift format');
 // Existing three-hour sessions can still use the previous encrypted gift.
 let bytes:ArrayBuffer;
 try{bytes=await crypto.subtle.decrypt({name:'AES-GCM',iv:decode(envelope.iv)},key,decode(envelope.ciphertext));}
 catch(error){if(!envelope.previous)throw error;bytes=await crypto.subtle.decrypt({name:'AES-GCM',iv:decode(envelope.previous.iv)},key,decode(envelope.previous.ciphertext));}
 return JSON.parse(new TextDecoder().decode(bytes));
}
export function sessionValid(expires:number,now=Date.now()){return Number.isFinite(expires)&&expires>now&&expires<=now+SESSION_MS;}
