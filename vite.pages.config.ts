import {defineConfig,loadEnv} from 'vite';
import react from '@vitejs/plugin-react';
import {resolve} from 'node:path';
// The original server app is retained. This adapter only changes the Pages bundle.
export default defineConfig(({mode})=>{
 const settings=loadEnv(mode,process.cwd(),'');
 const origin=settings.PAGES_ANALYTICS_ORIGIN?.replace(/\/$/,'')||'';
 if(origin&&!origin.startsWith('https://'))throw Error('Analytics origin must use HTTPS');
 return {root:resolve('pages'),base:'./',publicDir:resolve('public'),resolve:{alias:{'@':process.cwd()}},plugins:[{
 name:'pages-adapter',enforce:'pre',transform(source,id){
 if(id.endsWith('/app/page.tsx')){
 source=source.replace(/function track\(event:string\)\{[^\n]+\}/,'function track(event:string){trackUsage(event);}');
 source='import {trackUsage,UsageConsent} from "@/pages/usage";\n'+source;
 source=source.replace('<main className={kind', '<UsageConsent/><main className={kind');
 source=source.replace(/<p><strong>Privacy:<\/strong>[\s\S]*?<\/p>/,'<p><strong>Privacy:</strong> Chat contents, filenames, participant names and relationship type stay in this tab until you clear the chat or close/reload the page. Optional Google Analytics records visits, feature use and automatic interactions such as scrolling and outbound clicks only after you allow it. It uses cookies and collects technical browser/device information and interaction metadata, such as link URLs. Our custom events contain no conversation text or statistics. You can change your choice above. If no Measurement ID is configured, no Google Analytics is loaded. Hosting infrastructure may separately keep operational request logs.</p>');

 source=source.replaceAll('href="/analytics"','href="./?view=analytics"').replaceAll('href="/"','href="./"');

 }
 if(id.endsWith('/app/analytics/page.tsx')){
 source=source.replace("async function refresh(){",origin?'async function refresh(){':"async function refresh(){setError('Usage tracking needs a separate analytics backend. It is not connected to this GitHub Pages deployment yet.');return;");
 source=source.replace("fetch('/api/analytics',",`fetch(${JSON.stringify(origin+'/api/analytics')},`).replaceAll('href="/"','href="./"');
 }
 return {code:source,map:null};
 }},react()],css:{postcss:resolve('.')},build:{outDir:resolve('pages-dist'),emptyOutDir:true}};
});
