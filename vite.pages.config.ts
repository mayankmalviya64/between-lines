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
 source=source.replace("function track(event:string){void fetch('/api/events',",origin?`function track(event:string){void fetch(${JSON.stringify(origin+'/api/events')},`:"function track(event:string){return;void fetch('/api/events',");
 source=source.replaceAll('href="/analytics"','href="./?view=analytics"').replaceAll('href="/"','href="./"');
 if(!origin)source=source.replace('Anonymous event counters record page loads, import success/failure, demo use and filter use.','Usage tracking is not connected on this GitHub Pages deployment. When configured, anonymous event counters record page loads, import success/failure, demo use and filter use.');
 }
 if(id.endsWith('/app/analytics/page.tsx')){
 source=source.replace("async function refresh(){",origin?'async function refresh(){':"async function refresh(){setError('Usage tracking needs a separate analytics backend. It is not connected to this GitHub Pages deployment yet.');return;");
 source=source.replace("fetch('/api/analytics',",`fetch(${JSON.stringify(origin+'/api/analytics')},`).replaceAll('href="/"','href="./"');
 }
 return {code:source,map:null};
 }},react()],css:{postcss:resolve('.')},build:{outDir:resolve('pages-dist'),emptyOutDir:true}};
});
