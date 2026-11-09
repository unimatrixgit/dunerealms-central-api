export interface BankLedgerEntry {
 id:string; action:string; amountDunemarks:string; balanceDunemarks:string; createdAt:number;
 reference?:string; memo?:string; fromAccount?:string; toAccount?:string;
}
export interface BankBalanceSnapshot {
 current:string; savings:string; currency:'Dunemarks';
 ledger:BankLedgerEntry[]; currentLedger:BankLedgerEntry[];
}
export interface BankAgent {readOwnBalance(playerUuid:string):Promise<BankBalanceSnapshot>;}
export interface BankAgentOptions {baseUrl:string;token:string;fetcher?:typeof fetch;}
const decimal=/^(?:0|[1-9][0-9]{0,17})(?:\.[0-9]{1,2})?$/;
const signed=/^-?(?:0|[1-9][0-9]{0,17})(?:\.[0-9]{1,2})?$/;
const uuid=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/;
export class BankUnavailable extends Error {constructor(){super('Bank temporarily unavailable');}}
function readLedger(value:unknown):BankLedgerEntry[]{
 if(!Array.isArray(value)||value.length>50)throw new BankUnavailable();
 return value.map((entry:unknown)=>{
  if(!entry||typeof entry!=='object'||Array.isArray(entry))throw new BankUnavailable();
  const row=entry as Record<string,unknown>;
  if(typeof row.id!=='string'||!row.id||row.id.length>100||
     typeof row.action!=='string'||row.action.length>80||
     typeof row.amountDunemarks!=='string'||!signed.test(row.amountDunemarks)||
     typeof row.balanceDunemarks!=='string'||!decimal.test(row.balanceDunemarks)||
     !Number.isSafeInteger(row.createdAt)||Number(row.createdAt)<0)throw new BankUnavailable();
  const result:BankLedgerEntry={id:row.id,action:row.action,amountDunemarks:row.amountDunemarks,
   balanceDunemarks:row.balanceDunemarks,createdAt:Number(row.createdAt)};
  for(const key of ['reference','memo','fromAccount','toAccount'] as const){
   const value=row[key];
   if(value!==undefined){
    if(typeof value!=='string'||value.length>(key==='memo'?140:160))throw new BankUnavailable();
    result[key]=value;
   }
  }
  return result;
 });
}
/** Private loopback adapter; matches Python player_bank.read_player response.
 * Caller must resolve the authenticated account's verified UUID server-side.
 * No public endpoint or bank mutation is mounted here.
 */
export function createBankAgent(options:BankAgentOptions):BankAgent {
 const {baseUrl,token,fetcher=fetch}=options;
 const parsed=new URL(baseUrl);
 if(parsed.protocol!=='http:'||parsed.hostname!=='127.0.0.1'||parsed.username||parsed.password||
    parsed.search||parsed.hash||parsed.pathname!=='/'||token.length<32)
  throw Error('Bank agent requires a loopback URL and private token');
 return {async readOwnBalance(playerUuid:string):Promise<BankBalanceSnapshot>{
  if(!uuid.test(playerUuid))throw new BankUnavailable();
  const target=new URL('/bank/player',parsed);target.searchParams.set('uuid',playerUuid);
  try{
   const response=await fetcher(target.href,{headers:{Authorization:'Bearer '+token},redirect:'error',signal:AbortSignal.timeout(5000)});
   if(!response.ok||!response.body)throw new BankUnavailable();
   const reader=response.body.getReader(),chunks:Uint8Array[]=[];let length=0;
   try{while(true){const {done,value}=await reader.read();if(done)break;
    length+=value.byteLength;if(length>65536)throw new BankUnavailable();chunks.push(value);
   }}finally{await reader.cancel().catch(()=>{});}
   const raw:unknown=JSON.parse(Buffer.concat(chunks).toString('utf8'));
   if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new BankUnavailable();
   const data=raw as Record<string,unknown>;
   if(data.playerUuid!==playerUuid||data.currency!=='dunemarks'||
      typeof data.walletDunemarks!=='string'||!signed.test(data.walletDunemarks)||
      typeof data.balanceDunemarks!=='string'||!decimal.test(data.balanceDunemarks))throw new BankUnavailable();
   return {current:data.walletDunemarks,savings:data.balanceDunemarks,currency:'Dunemarks',
    ledger:readLedger(data.ledger),currentLedger:readLedger(data.currentLedger)};
  }catch{throw new BankUnavailable();}
 }};
}
