import {createHash} from 'node:crypto';
import type {IdentityResolver,VerifiedIdentity} from './bank-access.js';
import type {WebsitePrincipal} from './session-bank.js';

/** Narrow database interface compatible with the DuneHub prepared-statement adapter. */
export interface ReadDatabase {
 prepare(sql:string):{bind(...values:unknown[]):{first():Promise<Record<string,unknown>|null>}};
}
const uuid=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/;

/** Reuses the existing DuneHub HttpOnly session cookie and SHA-256 session store. */
export function createDuneHubSessionAuth(db:ReadDatabase,now:()=>number=Date.now){
 return async function authenticate(request:Request):Promise<WebsitePrincipal|null>{
  const matches=(request.headers.get('cookie')||'').split(';').map(x=>x.trim()).filter(x=>x.startsWith('__Host-dune_session='));
  if(matches.length!==1)return null;
  const token=matches[0].slice('__Host-dune_session='.length);
  if(!/^[A-Za-z0-9_-]{43}$/.test(token))return null;
  const digest=createHash('sha256').update(token).digest('hex');
  const row=await db.prepare('SELECT a.id FROM site_sessions s JOIN site_accounts a ON a.id=s.user_id WHERE s.token_hash=? AND s.expires_at>? AND a.password_hash NOT LIKE '!%' AND a.role<>'memorial' AND NOT EXISTS(SELECT 1 FROM cp_account_ranks r WHERE r.user_id=a.id AND r.rank_key='memorial')').bind(digest,now()).first();
  return typeof row?.id==='string'&&row.id.length>0?{accountId:row.id}:null;
 };
}

/** Reads the existing DuneHub account-to-game link. This does not independently prove game ownership. */
export function createDuneHubIdentityResolver(db:ReadDatabase):IdentityResolver {
 return {async resolveVerifiedIdentity(accountId:string):Promise<VerifiedIdentity|null>{
  if(!accountId)return null;
  const row=await db.prepare('SELECT user_id,minecraft_uuid FROM site_game_links WHERE user_id=?').bind(accountId).first();
  if(!row)return null;
  if(row.user_id!==accountId||typeof row.minecraft_uuid!=='string'||!uuid.test(row.minecraft_uuid))throw Error('Invalid linked UUID');
  return {accountId,playerUuid:row.minecraft_uuid,verified:true};
 }};
}

/** 
 * Permission must come from the DEPLOYED server-side action resolver.
 * No fallback to staff, rank, menu visibility or the legacy MC permission list.
 */
export function createDuneHubBankPermission(
 resolveAction:(accountId:string,permission:'web.bank.personal.view')=>Promise<boolean>
){
 return async (principal:WebsitePrincipal):Promise<boolean>=>{
  if(!principal.accountId)return false;
  return (await resolveAction(principal.accountId,'web.bank.personal.view'))===true;
 };
}
