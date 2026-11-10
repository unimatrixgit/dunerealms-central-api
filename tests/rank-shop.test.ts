import test from 'node:test';
import assert from 'node:assert/strict';
import {fulfilVerifiedRankOrder,validateRankOrder,type RankDeliveryStore} from '../src/rank-shop.js';
const uuid='12345678-1234-4234-9234-123456789012';
const ranks=new Set(['supporter','vip']);
const order={orderId:'order-1',paymentReference:'pay-1',accountId:'account-1',playerUuid:uuid,rankId:'supporter',paymentState:'verified',currency:'EUR',amountMinor:500};
function fixture(){
 const delivered=new Map<string,string>();
 const claims=new Set<string>();
 let grants=0;
 const store:RankDeliveryStore={
  async claim(o){
   const prev=delivered.get(o.orderId);
   if(prev)return prev===o.paymentReference?'already_delivered':'conflict';
   if(claims.has(o.orderId))return 'pending';
   claims.add(o.orderId);return 'claimed';
  },
  async complete(id){claims.delete(id);delivered.set(id,order.paymentReference);},
  async release(id){claims.delete(id);}
 };
 const grant=async()=>{grants++;return 'acknowledged' as const;};
 return {store,grant,get grants(){return grants;}};
}
test('rank shop delivers once for a verified payment and linked account',async()=>{
 const f=fixture();
 const call=()=>fulfilVerifiedRankOrder(order,ranks,f.store,async()=>true,async()=>true,f.grant);
 assert.equal((await call()).status,'delivered');
 assert.equal((await call()).status,'already_delivered');
 assert.equal(f.grants,1);
});
test('shop rejects unverified payment, invalid rank and invalid identity',async()=>{
 for(const patch of [{paymentState:'pending'},{rankId:'admin'},{playerUuid:'not-uuid'},{amountMinor:-1}]){
  assert.throws(()=>validateRankOrder({...order,...patch},ranks));
 }
});
test('shop never grants a rank if provider does not verify payment',async()=>{
 const f=fixture();
 await assert.rejects(fulfilVerifiedRankOrder(order,ranks,f.store,async()=>false,async()=>true,f.grant),/payment_not_verified/);
 assert.equal(f.grants,0);
});
test('shop never grants a rank to a different linked Minecraft account',async()=>{
 const f=fixture();
 await assert.rejects(fulfilVerifiedRankOrder(order,ranks,f.store,async()=>true,async()=>false,f.grant),/account_link_mismatch/);
 assert.equal(f.grants,0);
});
test('pending game acknowledgement does not mark order delivered',async()=>{
 const f=fixture();
 const result=await fulfilVerifiedRankOrder(order,ranks,f.store,async()=>true,async()=>true,async()=> 'pending');
 assert.equal(result.status,'pending');
 assert.equal(f.grants,0);
});
