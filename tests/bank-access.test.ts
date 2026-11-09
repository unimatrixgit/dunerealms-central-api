import test from 'node:test';
import assert from 'node:assert/strict';
import {createOwnBankReader,BankAccessDenied} from '../src/bank-access.js';

const uuid='12345678-1234-4234-9234-123456789012';
test('bank access resolves verified UUID from server-side identity service',async()=>{
 const seen:string[]=[];
 const reader=createOwnBankReader({async resolveVerifiedIdentity(accountId){assert.equal(accountId,'alice');return {accountId,playerUuid:uuid,verified:true};}},
  {async readOwnBalance(playerUuid){seen.push(playerUuid);return {current:'10.00',savings:'20.00',currency:'Dunemarks' as const,ledger:[],currentLedger:[]};}});
 assert.equal((await reader('alice'))?.current,'10.00');
 assert.deepEqual(seen,[uuid]);
});
test('unlinked account returns null and never reads bank',async()=>{
 const reader=createOwnBankReader({async resolveVerifiedIdentity(){return null;}},{async readOwnBalance(){throw Error('must not read');}});
 assert.equal(await reader('alice'),null);
});
test('identity mismatch fails closed before calling bank',async()=>{
 const reader=createOwnBankReader({async resolveVerifiedIdentity(){return {accountId:'bob',playerUuid:uuid,verified:true};}},
 {async readOwnBalance(){throw Error('must not read');}});
 await assert.rejects(reader('alice'),BankAccessDenied);
});
