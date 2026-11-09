import {createHash,timingSafeEqual,randomUUID} from 'node:crypto';
import type {Config} from './config.js';

type Fetcher=typeof fetch;
const allowed=['GET'];
function secureEqual(a:string,b:string):boolean {
 const ah=createHash('sha256').update(a).digest();
 const bh=createHash('sha256').update(b).digest();
 return timingSafeEqual(ah,bh);
}
export function createApp(config:Config,fetcher:Fetcher=fetch){
 return async function handle(request:Request):Promise<Response>{
  const requestId=randomUUID();
  const headers={'Cache-Control':'no-store','X-Request-ID':requestId,'X-Content-Type-Options':'nosniff'};
  const ok=(data:unknown)=>Response.json({data,meta:{requestId}},{headers});
  const error=(status:number,code:string)=>Response.json({error:{code,requestId}},{status,headers});
  const url=new URL(request.url);
  if(url.pathname==='/healthz'&&request.method==='GET')return ok({status:'ok',enabled:config.enabled});
  if(!url.pathname.startsWith('/api/v1/'))return error(404,'not_found');
  if(!config.enabled)return error(404,'not_found');
  const auth=request.headers.get('authorization')||'';
  if(!auth.startsWith('Bearer ')||!secureEqual(auth.slice(7),config.serviceToken))return error(401,'unauthorized');
  if(!allowed.includes(request.method))return error(405,'method_not_allowed');
  if(url.search)return error(400,'unexpected_query');
  if(url.pathname==='/api/v1/status')return ok({service:'dunerealms-central-api',version:'0.1.0'});
  if(url.pathname==='/api/v1/servers'){
   if(!config.worldStatusUrl)return error(503,'upstream_unconfigured');
   try{
    const response=await fetcher(config.worldStatusUrl,{signal:AbortSignal.timeout(4500),redirect:'error'});
    if(!response.ok)return error(503,'upstream_unavailable');
    const payload:unknown=await response.json();
    if(!payload||typeof payload!=='object')return error(503,'upstream_invalid');
    const data=payload as Record<string,unknown>;
    if(!Number.isSafeInteger(data.checkedAt)||Math.abs(Date.now()-Number(data.checkedAt))>60000||
       !data.servers||typeof data.servers!=='object'||Array.isArray(data.servers))return error(503,'upstream_invalid');
    const servers:Record<string,{online:boolean;players?:number}>={};
    for(const [name,row] of Object.entries(data.servers as Record<string,unknown>)){
     if(!/^[a-z0-9-]{1,40}$/.test(name)||!row||typeof row!=='object')continue;
     const item=row as Record<string,unknown>;
     if(typeof item.online!=='boolean')continue;
     servers[name]={online:item.online,...(Number.isSafeInteger(item.players)&&Number(item.players)>=0?{players:Number(item.players)}:{})};
    }
    return ok({checkedAt:data.checkedAt,servers});
   }catch{return error(503,'upstream_unavailable');}
  }
  return error(404,'not_found');
 };
}
