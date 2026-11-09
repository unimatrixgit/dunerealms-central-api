import test from 'node:test';
import assert from 'node:assert/strict';
import {createV1PersonalBank} from '../integrations/dunehub/api-v1-personal-bank.mjs';

const base='https://cp.dunerealms.com/api/v1/me/bank';
const req=(path=base,headers={},method='GET')=>new Request(path,{headers,method});
test('DuneHub route is disabled by default',async()=>{
 const handler=createV1PersonalBank(async()=>{throw Error('must not run');});
 assert.equal((await handler(req())).status,404);
});
test('DuneHub route delegates to existing secure personal-bank handler',async()=>{
 let calls=0;
 const handler=createV1PersonalBank(async(request)=>{
  calls++;
  assert.equal(new URL(request.url).pathname,'/api/bank/personal');
  assert.equal(request.headers.get('cookie'),'__Host-dune_session=test');
  return Response.json({linked:true,bank:{balanceDunemarks:'20.00',walletDunemarks:'5.00',accountNumber:'ID-123',ledger:[]}});
 },{enabled:true});
 const response=await handler(req(base,{Cookie:'__Host-dune_session=test'}));
 assert.equal(response.status,200);
 assert.equal((await response.json()).data.bank.accountNumber,'ID-123');
 assert.equal(response.headers.get('cache-control'),'private, no-store');
 assert.equal(calls,1);
});
test('DuneHub route rejects methods, query overrides and cross-origin',async()=>{
 let calls=0;
 const handler=createV1PersonalBank(async()=>{calls++;return Response.json({linked:false});},{enabled:true});
 assert.equal((await handler(req(base+'?uuid=abc'))).status,400);
 assert.equal((await handler(req(base,{},'POST'))).status,405);
 assert.equal((await handler(req(base,{Origin:'https://evil.example'}))).status,403);
 assert.equal((await handler(req(base,{Authorization:'Bearer x'}))).status,403);
 assert.equal(calls,0);
});
test('DuneHub route preserves native authentication and permission denials',async()=>{
 for(const status of [401,403,409,503]){
  const handler=createV1PersonalBank(async()=>Response.json({message:'sensitive'},{status}),{enabled:true});
  const response=await handler(req());
  assert.equal(response.status,status);
  assert.ok(!JSON.stringify(await response.json()).includes('sensitive'));
 }
});
