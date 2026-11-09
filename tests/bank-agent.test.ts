import test from 'node:test';
import assert from 'node:assert/strict';
import {createBankAgent,BankUnavailable} from '../src/bank-agent.js';

const token='t'.repeat(48),uuid='12345678-1234-4234-9234-123456789012';
const config={baseUrl:'http://127.0.0.1:15433/',token};
test('bank agent accepts loopback only',()=>{
 assert.throws(()=>createBankAgent({...config,baseUrl:'https://evil.example/'}));
 assert.throws(()=>createBankAgent({...config,baseUrl:'http://localhost:15433/'}));
 assert.throws(()=>createBankAgent({...config,token:'short'}));
});
test('private read forwards only verified UUID and private token',async()=>{
 let called=false;
 const bank=createBankAgent({...config,fetcher:async(url,options)=>{
  called=true;
  assert.equal(url,'http://127.0.0.1:15433/bank/player?uuid='+uuid);
  assert.equal(new Headers(options?.headers).get('Authorization'),'Bearer '+token);
  return Response.json({currentDunemarks:'123.45',savingsDunemarks:'9007199254740993.12',privateKey:'secret'});
 }});
 const result=await bank.readOwnBalance(uuid);
 assert.equal(called,true);
 assert.deepEqual(result,{current:'123.45',savings:'9007199254740993.12',currency:'Dunemarks'});
 assert.ok(!JSON.stringify(result).includes('secret'));
});
test('invalid identities, malformed responses and outages fail closed',async()=>{
 const bank=createBankAgent({...config,fetcher:async()=>Response.json({currentDunemarks:5,savingsDunemarks:'2.00'})});
 await assert.rejects(bank.readOwnBalance('other'),BankUnavailable);
 await assert.rejects(bank.readOwnBalance(uuid),BankUnavailable);
 const down=createBankAgent({...config,fetcher:async()=>new Response('down',{status:503})});
 await assert.rejects(down.readOwnBalance(uuid),BankUnavailable);
});
