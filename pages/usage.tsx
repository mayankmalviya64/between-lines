import React,{useState} from 'react';
import config from './analytics-config.json';
export const measurementId=config.measurementId;
export const analyticsConfigured=/^G-[A-Z0-9]+$/.test(measurementId);
const allowed=new Set(['page_view','import_started','import_completed','import_failed','demo_opened','filter_used','relationship_changed','chat_cleared']);
const preferenceKey='between-lines-usage-consent';
function consent(){try{return localStorage.getItem(preferenceKey)==='yes'}catch{return false}}
let started=false;
function tag(...args:unknown[]){const w=window as any;w.dataLayer=w.dataLayer||[];w.dataLayer.push(arguments);}
export function trackUsage(event:string){
 if(!analyticsConfigured||!consent()||!allowed.has(event))return;
 if(!started){started=true;const w=window as any;w['ga-disable-'+measurementId]=false;
 tag('consent','default',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
 tag('js',new Date());tag('config',measurementId,{send_page_view:false,allow_google_signals:false,allow_ad_personalization_signals:false,cookie_prefix:'bl',cookie_domain:location.hostname,cookie_path:location.pathname,page_location:location.origin+location.pathname,page_referrer:'',page_title:'Between Lines'});
 const script=document.createElement('script');script.async=true;script.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(measurementId);document.head.appendChild(script);
 }
 tag('event',event,{send_to:measurementId,page_location:location.origin+location.pathname,page_referrer:'',page_title:'Between Lines'});
}
export function UsageConsent(){
 const [choice,setChoice]=useState(()=>{try{return localStorage.getItem(preferenceKey)||''}catch{return ''}});
 if(!analyticsConfigured)return null;
 function choose(yes:boolean){try{localStorage.setItem(preferenceKey,yes?'yes':'no')}catch{}setChoice(yes?'yes':'no');if(yes){(window as any)['ga-disable-'+measurementId]=false;if(started)tag('consent','update',{analytics_storage:'granted'});trackUsage('page_view');}else{(window as any)['ga-disable-'+measurementId]=true;if(started)tag('consent','update',{analytics_storage:'denied'});for(const entry of document.cookie.split(';')){const name=entry.trim().split('=')[0];if(name.startsWith('bl_ga')){document.cookie=name+'=; Max-Age=0; Path='+location.pathname;document.cookie=name+'=; Max-Age=0; Path='+location.pathname+'; Domain='+location.hostname;}}}}
 return <aside className="card" style={{maxWidth:1204,margin:'20px auto',padding:18}} aria-label="Usage analytics preference">{choice?<div className="inline"><small>Usage analytics: {choice==='yes'?'allowed':'off'}. You can change this at any time.</small><button className="secondary" onClick={()=>setChoice('')}>Change preference</button></div>:<><strong>Help improve Between Lines?</strong><p style={{fontSize:14,lineHeight:1.6}}>Allow Google Analytics to measure visits and feature use. It uses cookies and collects technical browser/device data. We never send chat text, participant names, filenames, relationship type or chat statistics. Declining does not affect analysis.</p><div className="inline"><button className="primary" onClick={()=>choose(true)}>Allow usage analytics</button><button className="secondary" onClick={()=>choose(false)}>No thanks</button></div></>}</aside>;
}
export function AnalyticsSettings(){return <main className="admin"><a className="secondary" href="./">Back to insights</a><h1>Usage analytics</h1><div className="card"><h2>{analyticsConfigured?'Google Analytics connected':'Google Analytics setup prepared'}</h2><p>{analyticsConfigured?'Open your Google Analytics account to see consented visits, imports, demo usage and filter events.':'The site owner needs to connect a Google Analytics Measurement ID before collection can begin. No usage data is being collected by this deployment yet.'}</p><a className="primary" href="https://analytics.google.com/" target="_blank" rel="noreferrer">Open Google Analytics</a><div className="note">Reports are protected by your Google account. We send only named usage events, with no conversation contents or metrics. Visits that decline analytics or block tracking will not appear.</div></div></main>}
