import test from 'node:test';
import assert from 'node:assert/strict';
import {planLuckPermsSync} from '../src/luckperms-sync.js';
const uuid='12345678-1234-4234-9234-123456789012';
const members=[{uuid,rank:'staff'}];
const mapping=[{websiteRank:'staff',minecraftGroups:['helper','moderator'],version:0}];
const allowed=new Set(['helper','moderator','vip']);
test('only managed groups change; House, emperor and custom developer stay',()=>{
 const result=planLuckPermsSync(members,mapping,[{uuid,groups:['vip','house_atreides','emperor','developer']}],allowed,allowed);
 assert.deepEqual(result,[{uuid,add:['helper','moderator'],remove:['vip']}]);
});
test('department-only roles cannot implicitly grant game groups',()=>{
 const result=planLuckPermsSync(members,[],[{uuid,groups:['house_atreides']}],allowed,allowed);
 assert.deepEqual(result,[{uuid,add:[],remove:[]}]);
});
test('no game snapshot and unauthorized managed groups fail closed',()=>{
 assert.throws(()=>planLuckPermsSync(members,mapping,[],allowed,allowed));
 assert.throws(()=>planLuckPermsSync(members,mapping,[{uuid,groups:[]}],allowed,new Set(['owner'])));
});
test('unmanaged groups cannot be assigned by website mapping',()=>{
 assert.throws(()=>planLuckPermsSync(members,[{websiteRank:'staff',minecraftGroups:['owner'],version:0}],[{uuid,groups:[]}],allowed,allowed));
});
