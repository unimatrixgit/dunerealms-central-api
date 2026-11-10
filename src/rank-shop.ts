/**
 * Rank-only shop fulfilment contract.
 * This module does not process payments, debit Dunemarks or grant Minecraft items.
 * Payment verification and durable storage must be supplied by the existing shop.
 */
export type RankOrder={
 orderId:string;paymentReference:string;accountId:string;playerUuid:string;
 rankId:string;paymentState:'verified';currency:string;amountMinor:number;
};
export type RankDelivery={orderId:string;playerUuid:string;rankId:string;paymentReference:string};
export type DeliveryResult={status:'delivered'|'already_delivered'|'pending';orderId:string};
export interface RankDeliveryStore {
 /** Must atomically claim the order ID and unique payment reference. */
 claim(order:RankOrder):Promise<'claimed'|'already_delivered'|'pending'|'conflict'>;
 /** Must be durable and idempotent; mark delivered only after game acknowledgement. */
 complete(orderId:string):Promise<void>;
 /** Release a claim on a retryable delivery failure. */
 release(orderId:string):Promise<void>;
}
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const token=/^[a-zA-Z0-9][a-zA-Z0-9_.:-]{0,127}$/;
export function validateRankOrder(input:unknown,allowedRanks:ReadonlySet<string>):RankOrder{
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('invalid_order');
 const o=input as Record<string,unknown>;
 if(o.paymentState!=='verified')throw Error('payment_not_verified');
 for(const field of ['orderId','paymentReference','accountId','rankId','currency']){
  if(typeof o[field]!=='string'||!token.test(o[field] as string))throw Error('invalid_'+field);
 }
 if(typeof o.playerUuid!=='string'||!uuid.test(o.playerUuid))throw Error('invalid_player_uuid');
 if(!allowedRanks.has(o.rankId as string))throw Error('rank_not_allowed');
 if(typeof o.amountMinor!=='number'||!Number.isSafeInteger(o.amountMinor)||o.amountMinor<0)throw Error('invalid_amount');
 if(!/^[A-Z]{3}$/.test(o.currency as string))throw Error('invalid_currency');
 return {orderId:o.orderId as string,paymentReference:o.paymentReference as string,accountId:o.accountId as string,
  playerUuid:(o.playerUuid as string).toLowerCase(),rankId:o.rankId as string,paymentState:'verified',
  currency:o.currency as string,amountMinor:o.amountMinor};
}
export async function fulfilVerifiedRankOrder(
 input:unknown,allowedRanks:ReadonlySet<string>,store:RankDeliveryStore,
 verifyPayment:(order:RankOrder)=>Promise<boolean>,
 verifyAccountLink:(accountId:string,playerUuid:string)=>Promise<boolean>,
 grantRank:(delivery:RankDelivery)=>Promise<'acknowledged'|'pending'>
):Promise<DeliveryResult>{
 const order=validateRankOrder(input,allowedRanks);
 // Recheck trusted payment provider state: a client-provided "verified" is never sufficient.
 if(!await verifyPayment(order))throw Error('payment_not_verified');
 if(!await verifyAccountLink(order.accountId,order.playerUuid))throw Error('account_link_mismatch');
 const claim=await store.claim(order);
 if(claim==='conflict')throw Error('order_conflict');
 if(claim==='already_delivered')return {status:'already_delivered',orderId:order.orderId};
 if(claim==='pending')return {status:'pending',orderId:order.orderId};
 try{
  const result=await grantRank({orderId:order.orderId,playerUuid:order.playerUuid,rankId:order.rankId,paymentReference:order.paymentReference});
  if(result==='pending'){await store.release(order.orderId);return {status:'pending',orderId:order.orderId};}
  await store.complete(order.orderId);
  return {status:'delivered',orderId:order.orderId};
 }catch(e){
  // A game-side timeout may occur after a grant. The game adapter MUST deduplicate by orderId.
  await store.release(order.orderId);
  throw e;
 }
}
