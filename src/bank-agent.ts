import {createHash,timingSafeEqual} from 'node:crypto';

export interface BankBalanceSnapshot {
 current:string;
 savings:string;
 currency:'Dunemarks';
}
export interface BankAgent {
 readOwnBalance(playerUuid:string):Promise<BankBalanceSnapshot>;
}
export interface BankAgentOptions {
 baseUrl:string;
 token:string;
 fetcher?:typeof fetch;
}
const decimal=/^(?:0|[1-9][0-9]{0,17})(?:\.[0-9]{1,2})?$/;
const uuid=/^[0-9a-f]{8}-(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
export class BankUnavailable extends Error {
 constructor(){super('Bank temporarily unavailable');}
}
/**
 * This adapter is NOT mounted as a public endpoint. Its response mapping must be
 * confirmed against the deployed Python agent before enabling any route.
 */
export function createBankAgent(options:BankAgentOptions):BankAgent {
 const {baseUrl,token,fetcher=fetch}=options;
 const parsed=new URL(baseUrl);
 if(parsed.protocol!=='http:'||parsed.hostname!=='127.0.0.1'||parsed.username||parsed.password||parsed.search||parsed.hash||parsed.pathname!=='/'||
    token.length<32)throw Error('Bank agent requires a loopback URL and a private token');
 return {
  async readOwnBalance(playerUuid:string):Promise<BankBalanceSnapshot>{
   if(!uuid.test(playerUuid))throw new BankUnavailable();
   const target=new URL('/bank/player',parsed);
   target.searchParams.set('uuid',playerUuid);
   try{
    const response=await fetcher(target.href,{headers:{Authorization:'Bearer '+token},redirect:'error',signal:AbortSignal.timeout(5000)});
    if(!response.ok||!response.body)throw new BankUnavailable();
    const reader=response.body.getReader();let size=0;const chunks:Uint8Array[]=[];
    try{
     while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>65536)throw new BankUnavailable();chunks.push(value);}
    }finally{await reader.cancel().catch(()=>{});}
    const raw=JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
    if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new BankUnavailable();
    const data=raw as Record<string,unknown>;
    // This conservative mapping is provisional until native response fields are confirmed.
    if(typeof data.currentDunemarks!=='string'||typeof data.savingsDunemarks!=='string'||
       !decimal.test(data.currentDunemarks)||!decimal.test(data.savingsDunemarks))throw new BankUnavailable();
    return {current:data.currentDunemarks,savings:data.savingsDunemarks,currency:'Dunemarks'};
   }catch{throw new BankUnavailable();}
  }
 };
}
