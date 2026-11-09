import {randomUUID} from 'node:crypto';
import type {BankAgent} from './bank-agent.js';
import {createOwnBankReader,type IdentityResolver} from './bank-access.js';

export interface WebsitePrincipal {accountId:string;}
export interface WebsiteBankDependencies {
 /** Must validate the real DuneHub session cookie against its server-side session store. */
 authenticate(request:Request):Promise<WebsitePrincipal|null>;
 /** Must enforce the deployed server-side personal-bank action permission. */
 canReadPersonalBank(principal:WebsitePrincipal):Promise<boolean>;
 identity:IdentityResolver;
 bank:BankAgent;
 origin:string;
 enabled:boolean;
}
/**
 * Same-origin website adapter. Deliberately NOT mounted in the standalone
 * service: DuneHub must inject its real session and permission resolvers.
 */
export function createSessionBankHandler(deps:WebsiteBankDependencies){
 const origin=new URL(deps.origin).origin;
 const read=createOwnBankReader(deps.identity,deps.bank);
 return async function handle(request:Request):Promise<Response|null>{
  const url=new URL(request.url);
  if(url.pathname!=='/api/v1/me/bank')return null;
  const requestId=randomUUID();
  const headers={'Cache-Control':'private, no-store','Vary':'Cookie','X-Request-ID':requestId,'X-Content-Type-Options':'nosniff'};
  const error=(status:number,code:string)=>Response.json({error:{code,requestId}},{status,headers});
  if(!deps.enabled)return error(404,'not_found');
  if(url.origin!==origin||request.headers.has('authorization')||
     request.headers.get('sec-fetch-site')==='cross-site'||
     (request.headers.has('origin')&&request.headers.get('origin')!==origin))
   return error(403,'forbidden');
  if(request.method!=='GET')return error(405,'method_not_allowed');
  if(url.search)return error(400,'unexpected_query');
  try{
   const principal=await deps.authenticate(request);
   if(!principal||!principal.accountId)return error(401,'unauthenticated');
   if(!await deps.canReadPersonalBank(principal))return error(403,'permission_denied');
   const initialLink=await deps.identity.resolveVerifiedIdentity(principal.accountId);
   const snapshot=await read(principal.accountId);
   const current=await deps.authenticate(request);
   if(!current||current.accountId!==principal.accountId)return error(401,'session_changed');
   if(!await deps.canReadPersonalBank(current))return error(403,'permission_changed');
   const currentLink=await deps.identity.resolveVerifiedIdentity(current.accountId);
   if(initialLink?.playerUuid!==currentLink?.playerUuid||
      (snapshot&&(!currentLink||currentLink.accountId!==current.accountId)))return error(409,'account_link_changed');
   if(!snapshot)return Response.json({data:{linked:false},meta:{requestId}},{headers});
   return Response.json({data:{linked:true,bank:snapshot},meta:{requestId}},{headers});
  }catch{return error(503,'bank_unavailable');}
 };
}
