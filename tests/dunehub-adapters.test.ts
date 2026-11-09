import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createDuneHubSessionAuth,createDuneHubIdentityResolver,createDuneHubBankPermission} from '../src/dunehub-adapters.js';

const token='a'.repeat(43),digest=createHash('sha256').update(token).digest('hex');
const uuid='12345678-1234-4234-9234-123456789012';
function database({expired=false,unverified=false}={}){
 const queries:string[]=[];
 const db={
  prepare(sql:string){
   queries.push(sql);
   return {
    bind(...values:unknown[]){
     return {
      async first():Promise<Record<string,unknown>|null>{
       if(sql.includes('site_sessions'))return values[0]===digest&&!expired?{id:'alice'}:null;
       if(sql.includes('site_game_links'))return values[0]==='alice'&&!unverified?{user_id:'alice',minecraft_uuid:uuid}:null;
       throw Error('Unexpected query');
      }
     };
    }
   };
  }
 };
 return {db,queries};
}
test('DuneHub session authentication uses SHA-256 token lookup and expiration',async()=>{
 const {db,queries}=database();
 const auth=createDuneHubSessionAuth(db);
 const request=(cookie:string)=>new Request('https://cp.dunerealms.com/api/v1/me/bank',{headers:{Cookie:cookie}});
 assert.deepEqual(await auth(request('__Host-dune_session='+token)),{accountId:'alice'});
 assert.equal(await auth(request('__Host-dune_session=forged')),null);
 assert.equal(await auth(request('__Host-dune_session='+token+'; __Host-dune_session='+token)),null);
 assert.equal(await createDuneHubSessionAuth(database({expired:true}).db)(request('__Host-dune_session='+token)),null);
 assert.ok(queries[0].includes('expires_at>?'));
});
test('verified Minecraft link is account-bound and requires persistent identity',async()=>{
 const {db,queries}=database();
 const resolve=createDuneHubIdentityResolver(db);
 assert.deepEqual(await resolve.resolveVerifiedIdentity('alice'),{accountId:'alice',playerUuid:uuid,verified:true});
 assert.equal(await resolve.resolveVerifiedIdentity('bob'),null);
 assert.equal(await createDuneHubIdentityResolver(database({unverified:true}).db).resolveVerifiedIdentity('alice'),null);
 assert.ok(queries[0].includes('JOIN site_game_identities'));
});
test('bank permission must be explicitly granted by deployed action resolver',async()=>{
 const seen:string[]=[];
 const check=createDuneHubBankPermission(async(id,permission)=>{seen.push(id+':'+permission);return id==='alice';});
 assert.equal(await check({accountId:'alice'}),true);
 assert.equal(await check({accountId:'bob'}),false);
 assert.deepEqual(seen,['alice:web.bank.personal.view','bob:web.bank.personal.view']);
});
