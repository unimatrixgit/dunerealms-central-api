#!/usr/bin/env node
// Read-only audit: compare candidate against the active DuneHub release.
// Never reads file contents of .env or credentials, never starts a service.
import {readdir,readFile,lstat,realpath} from 'node:fs/promises';
import {join,relative,resolve,sep} from 'node:path';
import {createHash} from 'node:crypto';

const live=await realpath(process.argv[2]||'/home/dunerealms/apps/dunerealms/current');
const candidate=resolve(process.argv[3]||'/home/dunerealms/apps/dunerealms/releases/20261110-bank-api-v1');
if(live===candidate)throw Error('Live and candidate paths must differ');
const skip=path=>path.split(sep).some(x=>x==='node_modules'||x==='.git'||x==='.env'||x.startsWith('.env.'));
async function files(root){
 const result=new Map();
 async function walk(dir){
  for(const ent of await readdir(dir,{withFileTypes:true})){
   const abs=join(dir,ent.name),name=relative(root,abs);
   if(skip(name))continue;
   if(ent.isDirectory())await walk(abs);
   else if(ent.isFile())result.set(name,abs);
   else if(ent.isSymbolicLink())result.set(name,{symlink:true});
  }
 }
 await walk(root);return result;
}
const [a,b]=await Promise.all([files(live),files(candidate)]);
const hash=async p=>typeof p==='string'?createHash('sha256').update(await readFile(p)).digest('hex'):'symlink';
const missing=[],added=[],changed=[];
for(const [name,path] of a){
 if(!b.has(name))missing.push(name);
 else if(await hash(path)!==await hash(b.get(name)))changed.push(name);
}
for(const name of b.keys())if(!a.has(name))added.push(name);
for(const arr of [missing,added,changed])arr.sort();
const expected=new Set([
 'control-panel/server.mjs',
 'control-panel/api-v1-personal-bank.mjs',
 'control-panel/server.mjs.before-bank-v1',
 'BANK_V1_RELEASE_INFO.json'
]);
const unexpected=changed.filter(x=>!expected.has(x));
console.log(JSON.stringify({live,candidate,missing,added,changed,unexpectedChanges:unexpected,readyForFurtherReview:missing.length===0&&unexpected.length===0},null,2));
if(missing.length||unexpected.length)process.exitCode=1;
