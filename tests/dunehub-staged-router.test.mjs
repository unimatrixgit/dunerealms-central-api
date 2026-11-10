import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';

const dir=process.env.DUNEHUB_STAGING_DIR;
const route='/api/v1/me/bank';
test('staged DuneHub router registers bank-v1 behind disabled-by-default flag', {skip:!dir},async()=>{
 const server=await readFile(join(dir,'control-panel/server.mjs'),'utf8');
 assert.match(server,/import\s*\{createV1PersonalBank\}\s*from\s*['"]\.\/api-v1-personal-bank\.mjs['"]/);
 assert.match(server,/const\s+v1PersonalBank\s*=\s*createV1PersonalBank\(banking,\s*\{enabled:process\.env\.DUNE_API_V1_BANK_STAGING==='true'\}\)/);
 assert.match(server,/if\(path===['"]\/api\/v1\/me\/bank['"]\)return v1PersonalBank\(request\)/);
 const {createV1PersonalBank}=await import(pathToFileURL(join(dir,'control-panel/api-v1-personal-bank.mjs')).href);
 let called=0;
 const handler=async request=>{called++;assert.equal(new URL(request.url).pathname,'/api/bank/personal');return Response.json({linked:false});};
 const disabled=createV1PersonalBank(handler);
 const r0=await disabled(new Request('https://cp.dunerealms.com'+route));
 assert.equal(r0.status,404);assert.equal(called,0);
 const enabled=createV1PersonalBank(handler,{enabled:true});
 const r1=await enabled(new Request('https://cp.dunerealms.com'+route));
 assert.equal(r1.status,200);assert.deepEqual(await r1.json(),{data:{linked:false}});assert.equal(called,1);
 const r2=await enabled(new Request('https://cp.dunerealms.com'+route,{method:'POST'}));
 assert.equal(r2.status,405);assert.equal(called,1);
});
