import test from 'node:test';
import assert from 'node:assert/strict';
import {createSessionBankHandler} from '../src/session-bank.js';

const origin='https://cp.dunerealms.com';
const uuid='12345678-1234-4234-9234-123456789012';
function fixture(overrides:Record<string,unknown>={}){
 let bankReads=0;
 const deps={
  origin,enabled:true,
  async authenticate(request:Request){return request.headers.get('cookie')==='session=valid'?{accountId:'alice'}:null;},
  async canReadPersonalBank(){return true;},
  identity:{async resolveVerifiedIdentity(accountId:string){return {accountId,playerUuid:uuid,verified:true as const};}},
  bank:{async readOwnBalance(playerUuid:string){bankReads++;assert.equal(playerUuid,uuid);return {current:'12.00',savings:'34.00',currency:'Dunemarks' as const,ledger:[],currentLedger:[]};}},
  ...overrides
 };
 const handle=createSessionBankHandler(deps);
 const req=(path='/api/v1/me/bank',headers:Record<string,string>={Cookie:'session=valid'},method='GET')=>
  handle(new Request(origin+path,{headers,method}));
 return {req,handle,getReads:()=>bankReads};
}
test('disabled bank route is not available',async()=>{
 const f=fixture({enabled:false});
 assert.equal((await f.req())?.status,404);
 assert.equal(f.getReads(),0);
});
test('unauthenticated, cross-origin and service-token attempts fail closed',async()=>{
 const f=fixture();
 assert.equal((await f.req('/api/v1/me/bank',{}))?.status,401);
 assert.equal((await f.req('/api/v1/me/bank',{Cookie:'session=valid',Origin:'https://evil.test'}))?.status,403);
 assert.equal((await f.req('/api/v1/me/bank',{Cookie:'session=valid',Authorization:'Bearer fake'}))?.status,403);
 assert.equal(f.getReads(),0);
});
test('query identity overrides and writes are rejected',async()=>{
 const f=fixture();
 assert.equal((await f.req('/api/v1/me/bank?uuid='+uuid))?.status,400);
 assert.equal((await f.req('/api/v1/me/bank',undefined,'POST'))?.status,405);
 assert.equal(f.getReads(),0);
});
test('permission denied and unlinked identity never access bank',async()=>{
 const denied=fixture({async canReadPersonalBank(){return false;}});
 assert.equal((await denied.req())?.status,403);
 assert.equal(denied.getReads(),0);
 const unlinked=fixture({identity:{async resolveVerifiedIdentity(){return null;}}});
 const response=await unlinked.req();
 assert.equal(response?.status,200);
 assert.deepEqual((await response?.json()).data,{linked:false});
 assert.equal(unlinked.getReads(),0);
});
test('verified account receives only its own bank projection',async()=>{
 const f=fixture();
 const response=await f.req();
 assert.equal(response?.status,200);
 const body=await response?.json();
 assert.equal(body.data.bank.current,'12.00');
 assert.equal(body.data.bank.savings,'34.00');
 assert.equal(response?.headers.get('cache-control'),'private, no-store');
 assert.equal(f.getReads(),1);
});
test('identity mismatch and bank outage are sanitized',async()=>{
 const wrong=fixture({identity:{async resolveVerifiedIdentity(){return {accountId:'bob',playerUuid:uuid,verified:true};}}});
 assert.equal((await wrong.req())?.status,503);
 assert.equal(wrong.getReads(),0);
 const down=fixture({bank:{async readOwnBalance(){throw Error('database password secret');}}});
 const response=await down.req();
 assert.equal(response?.status,503);
 assert.ok(!JSON.stringify(await response?.json()).includes('secret'));
});

test('session revoked during bank read never returns balances',async()=>{
 let authCalls=0;
 const f=fixture({async authenticate(){return ++authCalls===1?{accountId:'alice'}:null;}});
 const response=await f.req();
 assert.equal(response?.status,401);
 assert.equal(f.getReads(),1);
});
test('permission revoked during bank read never returns balances',async()=>{
 let checks=0;
 const f=fixture({async canReadPersonalBank(){return ++checks===1;}});
 const response=await f.req();
 assert.equal(response?.status,403);
 assert.equal(f.getReads(),1);
});
test('Minecraft link changed during bank read never returns balances',async()=>{
 let links=0;
 const f=fixture({identity:{async resolveVerifiedIdentity(accountId:string){
  links++;return {accountId,playerUuid:links===1?uuid:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',verified:true as const};
 }}});
 const response=await f.req();
 assert.equal(response?.status,409);
 assert.equal(f.getReads(),1);
});
test('no linked account is not allowed to gain a link during read',async()=>{
 let links=0;
 const f=fixture({identity:{async resolveVerifiedIdentity(accountId:string){
  links++;return links===1?null:{accountId,playerUuid:uuid,verified:true as const};
 }}});
 const response=await f.req();
 assert.equal(response?.status,409);
 assert.equal(f.getReads(),0);
});
