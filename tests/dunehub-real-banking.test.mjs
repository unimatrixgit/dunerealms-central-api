import test from 'node:test';
import assert from 'node:assert/strict';
import {createV1PersonalBank} from '../integrations/dunehub/api-v1-personal-bank.mjs';

// Run against the exact copied live DuneHub banking.mjs, without starting DuneHub.
// DUNEHUB_STAGING_DIR must point to an isolated snapshot with its imports present.
const dir=process.env.DUNEHUB_STAGING_DIR;
const uuid='12345678-1234-4234-9234-123456789012';
const base='https://cp.dunerealms.com/api/v1/me/bank';
const bank={playerUuid:uuid,currency:'dunemarks',balanceDunemarks:'250.00',
 walletDunemarks:'50.00',ledger:[],currentLedger:[]};
async function fixture(overrides={}){
 const {createBanking}=await import('file://'+dir+'/control-panel/banking.mjs');
 const state={auth:0,rights:0,links:0,fetches:0,accounts:0};
 const deps={
  async authenticate(){state.auth++;return {id:'alice',username:'Alice'};},
  async access(){state.rights++;return {nodes:['web.bank.personal.view']};},
  async linked(){state.links++;return uuid;},
  async fetcher(url){state.fetches++;assert.equal(url,'http://127.0.0.1:15433/bank/player?uuid='+uuid);return Response.json(bank);},
  async accountNumber(_db,type){state.accounts++;return type==='current'?'ID-CURRENT':'ID-SAVINGS';},
  ...overrides
 };
 const db={prepare(){throw Error('Production database must never be accessed');}};
 const original=createBanking(db,{SERVER_CONTROL_TOKEN:'x'.repeat(64)},deps);
 return {state,handle:createV1PersonalBank(original,{enabled:true})};
}
if(!dir){
 test('real DuneHub banking integration requires DUNEHUB_STAGING_DIR', {skip:true},()=>{});
}else{
 test('actual DuneHub banking returns own savings/current balances and numbers',async()=>{
  const f=await fixture();
  const response=await f.handle(new Request(base));
  assert.equal(response.status,200);
  const body=await response.json();
  assert.equal(body.data.bank.balanceDunemarks,'250.00');
  assert.equal(body.data.bank.walletDunemarks,'50.00');
  assert.equal(body.data.bank.accountNumber,'ID-SAVINGS');
  assert.equal(body.data.bank.currentAccountNumber,'ID-CURRENT');
  assert.equal(f.state.auth,2);assert.equal(f.state.rights,2);assert.equal(f.state.links,2);
  assert.equal(f.state.fetches,1);
 });
 test('actual DuneHub banking rejects missing login before bank I/O',async()=>{
  const f=await fixture({async authenticate(){return null;}});
  const response=await f.handle(new Request(base));
  assert.equal(response.status,401);assert.equal(f.state.fetches,0);
 });
 test('actual DuneHub banking denies missing bank permission',async()=>{
  const f=await fixture({async access(){return {nodes:[]};}});
  const response=await f.handle(new Request(base));
  assert.equal(response.status,403);assert.equal(f.state.fetches,0);
 });
 test('actual DuneHub banking denies revoked session after bank I/O',async()=>{
  let calls=0;const f=await fixture({async authenticate(){return ++calls===1?{id:'alice',username:'Alice'}:null;}});
  const response=await f.handle(new Request(base));
  assert.equal(response.status,401);assert.equal(f.state.fetches,1);
 });
 test('actual DuneHub banking denies changed Minecraft link after bank I/O',async()=>{
  let calls=0;const f=await fixture({async linked(){return ++calls===1?uuid:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';}});
  const response=await f.handle(new Request(base));
  assert.equal(response.status,409);assert.equal(f.state.fetches,1);
 });
 test('actual DuneHub banking handles Python agent failure',async()=>{
  const f=await fixture({async fetcher(){throw Error('private database failure');}});
  const response=await f.handle(new Request(base));
  assert.equal(response.status,503);
  assert.ok(!JSON.stringify(await response.json()).includes('private'));
 });
}
