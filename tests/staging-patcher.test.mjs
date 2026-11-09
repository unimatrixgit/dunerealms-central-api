import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
const script=resolve('scripts/prepare-dunehub-staging.mjs');
async function fixture(server){
 const dir=await mkdtemp(join(tmpdir(),'dune-staging-'));
 await mkdir(join(dir,'control-panel'));
 await writeFile(join(dir,'control-panel/server.mjs'),server);
 return dir;
}
const valid=`import {createServer} from 'node:http';
export function createPanel(db,settings){
 const banking=createBanking(db,settings);
 return request=>{
  const path=new URL(request.url).pathname;
  if(path==='/api/bank/personal'||path==='/api/bank/staff'||path==='/api/bank/faction')return banking(request);
 };
}`;
test('staging patcher inserts disabled v1 route without touching original backup',async()=>{
 const dir=await fixture(valid);
 try{
  execFileSync(process.execPath,[script,dir],{stdio:'pipe'});
  const patched=await readFile(join(dir,'control-panel/server.mjs'),'utf8');
  const backup=await readFile(join(dir,'control-panel/server.mjs.before-bank-v1'),'utf8');
  assert.equal(backup,valid);
  assert.match(patched,/DUNE_API_V1_BANK_STAGING/);
  assert.match(patched,/createV1PersonalBank/);
  assert.match(patched,/v1PersonalBank\(request\)/);
  assert.throws(()=>execFileSync(process.execPath,[script,dir],{stdio:'pipe'}));
 }finally{await rm(dir,{recursive:true,force:true});}
});
test('unknown router refuses patch and preserves file',async()=>{
 const dir=await fixture("export const server='other';");
 try{
  assert.throws(()=>execFileSync(process.execPath,[script,dir],{stdio:'pipe'}));
  assert.equal(await readFile(join(dir,'control-panel/server.mjs'),'utf8'),"export const server='other';");
 }finally{await rm(dir,{recursive:true,force:true});}
});
