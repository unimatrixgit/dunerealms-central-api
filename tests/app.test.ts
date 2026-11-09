import test from 'node:test';
import assert from 'node:assert/strict';
import {createApp} from '../src/app.js';
import {loadConfig} from '../src/config.js';

const token='x'.repeat(48);
const config={host:'127.0.0.1',port:18080,enabled:true,serviceToken:token,worldStatusUrl:null};
const request=(path:string,headers:Record<string,string>={},method='GET')=>new Request('http://localhost'+path,{headers,method});
const auth={Authorization:'Bearer '+token};
test('disabled by default and loopback-only',()=>{
 assert.equal(loadConfig({}).enabled,false);
 assert.throws(()=>loadConfig({API_ENABLED:'true'}));
 assert.throws(()=>loadConfig({HOST:'0.0.0.0'}));
});
test('health endpoint is non-sensitive',async()=>{
 const r=await createApp(config)(request('/healthz'));
 assert.equal(r.status,200);
 assert.equal((await r.json()).data.status,'ok');
});
test('bearer required, query and methods rejected',async()=>{
 const app=createApp(config);
 assert.equal((await app(request('/api/v1/status'))).status,401);
 assert.equal((await app(request('/api/v1/status',{Authorization:'Bearer wrong'}))).status,401);
 assert.equal((await app(request('/api/v1/status',auth))).status,200);
 assert.equal((await app(request('/api/v1/status?uuid=other',auth))).status,400);
 assert.equal((await app(request('/api/v1/status',auth,'POST'))).status,405);
 assert.equal((await app(request('/api/v1/bank/transfer',auth))).status,404);
});
test('upstream status is sanitized and fails closed',async()=>{
 const payload={checkedAt:Date.now(),servers:{arrakis:{online:true,players:2,secret:'never-return'},bad:{online:'yes'}}};
 const app=createApp({...config,worldStatusUrl:'https://monitor.test/status'},async()=>Response.json(payload));
 const r=await app(request('/api/v1/servers',auth));
 assert.equal(r.status,200);
 const json=await r.json();
 assert.equal(json.data.servers.arrakis.players,2);
 assert.ok(!JSON.stringify(json).includes('never-return'));
 assert.equal(json.data.servers.bad,undefined);
 const down=createApp({...config,worldStatusUrl:'https://monitor.test/status'},async()=>new Response('error',{status:503}));
 assert.equal((await down(request('/api/v1/servers',auth))).status,503);
});
