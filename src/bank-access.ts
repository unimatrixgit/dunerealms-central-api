import type {BankAgent,BankBalanceSnapshot} from './bank-agent.js';

export interface VerifiedIdentity {
 accountId:string;
 playerUuid:string;
 verified:true;
}
export interface IdentityResolver {
 resolveVerifiedIdentity(accountId:string):Promise<VerifiedIdentity|null>;
}
export class BankAccessDenied extends Error {
 constructor(){super('Bank access denied');}
}
/** Ownership is resolved server-side; callers cannot supply a player UUID. */
export function createOwnBankReader(identity:IdentityResolver,bank:BankAgent){
 return async function readOwnBank(accountId:string):Promise<BankBalanceSnapshot|null>{
  if(typeof accountId!=='string'||accountId.length===0)throw new BankAccessDenied();
  const linked=await identity.resolveVerifiedIdentity(accountId);
  if(!linked)return null;
  if(linked.verified!==true||linked.accountId!==accountId||
     !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(linked.playerUuid))throw new BankAccessDenied();
  return bank.readOwnBalance(linked.playerUuid);
 };
}
