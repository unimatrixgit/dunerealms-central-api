#!/usr/bin/env node
/**
 * Safely stage an immutable DuneHub release from an already validated snapshot.
 * No production switch, process restart, database access, or network calls.
 */
import {realpath,readlink,lstat,cp,mkdir,writeFile,readFile,rename,rm} from 'node:fs/promises';
import {resolve,join,basename,dirname,relative,sep} from 'node:path';
const [sourceArg,destArg]=process.argv.slice(2);
if(!sourceArg||!destArg)throw Error('Usage: node scripts/prepare-dunehub-release.mjs <staging-source> <new-release-dir>');
const source=await realpath(resolve(sourceArg));
const dest=resolve(destArg);
const releases='/home/dunerealms/apps/dunerealms/releases';
if(!dest.startsWith(releases+sep))throw Error('Destination must be a new directory under DuneHub releases');
if(dirname(dest)!==releases)throw Error('Destination must be directly inside releases');
if(source===dest||dest.startsWith(source+sep))throw Error('Source and destination must be separate');
if(source.startsWith(releases+sep)||source==='/home/dunerealms/apps/dunerealms/current')throw Error('Source must be a staging snapshot');
if(!/^\d{8}-[a-z0-9-]+$/.test(basename(dest)))throw Error('Release directory must be YYYYMMDD-name');
try{await lstat(dest);throw Error('Destination already exists; refusing to overwrite');}catch(e){if(e.code!=='ENOENT')throw e;}
const server=await readFile(join(source,'control-panel/server.mjs'),'utf8');
if(!server.includes("if(path==='/api/v1/me/bank')return v1PersonalBank(request);")||!server.includes("DUNE_API_V1_BANK_STAGING==='true'"))throw Error('Staging bank route missing');
const adapter=await readFile(join(source,'control-panel/api-v1-personal-bank.mjs'),'utf8');
if(!adapter.includes('createV1PersonalBank'))throw Error('Missing bank adapter');
const temp=dest+'.preparing-'+process.pid;
try{
 await mkdir(temp,{recursive:false});
 await cp(source,temp,{recursive:true,filter:path=>!/(^|\/)\.env($|\.)/.test(path)&&!/(^|\/)node_modules(\/|$)/.test(path)});
 await writeFile(join(temp,'BANK_V1_RELEASE_INFO.json'),JSON.stringify({source,featureFlag:'DUNE_API_V1_BANK_STAGING',enabledByDefault:false,productionActivated:false},null,2)+'\n');
 await rename(temp,dest);
 console.log('Release prepared: '+dest);
 console.log('No PM2 restart or current symlink change performed.');
}catch(e){await rm(temp,{recursive:true,force:true});throw e;}
