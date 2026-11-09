#!/usr/bin/env node
/**
 * Prepares a bank-v1 DuneHub integration in an isolated snapshot only.
 * Never writes to the live DuneHub release, never starts PM2 or the panel.
 */
import {readFile,writeFile,copyFile,mkdir,realpath} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
const source=resolve(fileURLToPath(new URL('../integrations/dunehub/api-v1-personal-bank.mjs',import.meta.url)));
const stage=resolve(process.argv[2]||'/opt/dunerealms-staging-tests');
const live='/home/dunerealms/apps/dunerealms/releases/';
if(stage.startsWith(live)||stage==='/home/dunerealms/apps/dunerealms/current'||stage==='/opt/dunerealms-central-api'){
 throw Error('Refusing to modify live or API source directories');
}
const panel=join(stage,'control-panel');
const server=join(panel,'server.mjs');
const text=await readFile(server,'utf8');
if(!text.includes("if(path==='/api/bank/personal'"))throw Error('Unknown DuneHub router shape; no changes made');
if(text.includes("createV1PersonalBank")||text.includes("'/api/v1/me/bank'"))throw Error('Integration already present; no changes made');
const importMarker="import {createServer} from 'node:http';";
if(!text.includes(importMarker))throw Error('Unexpected import section; no changes made');
const marker="if(path==='/api/bank/personal'||path==='/api/bank/staff'||path==='/api/bank/faction')return banking(request);";
if(!text.includes(marker))throw Error('Unknown bank route marker; no changes made');
const create=/\bconst\s+banking\s*=\s*createBanking\([^;]+\);/;
if(!create.test(text))throw Error('Could not locate existing banking handler initialization; no changes made');
const enabled="process.env.DUNE_API_V1_BANK_STAGING==='true'";
let updated=text.replace(importMarker,importMarker+"\nimport {createV1PersonalBank} from './api-v1-personal-bank.mjs';");
updated=updated.replace(create,match=>match+"\n const v1PersonalBank=createV1PersonalBank(banking,{enabled:"+enabled+"});");
updated=updated.replace(marker,marker+"\n  if(path==='/api/v1/me/bank')return v1PersonalBank(request);");
if(updated===text||!updated.includes("const v1PersonalBank="))throw Error('Patch failed; no changes made');
await mkdir(panel,{recursive:true});
await copyFile(source,join(panel,'api-v1-personal-bank.mjs'));
await writeFile(server+'.before-bank-v1',text,{flag:'wx'});
await writeFile(server,updated);
console.log('Staging-only patch prepared at '+stage);
console.log('Feature flag: DUNE_API_V1_BANK_STAGING=true (disabled by default)');
console.log('No server started and no production files modified');
