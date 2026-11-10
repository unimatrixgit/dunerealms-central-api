import test from 'node:test';
import assert from 'node:assert/strict';
import {validateGroupMapping,planGroupAssignments,reconcileManagedGroups} from '../src/website-rank-groups.js';
const allowed=new Set(['vip','builder','moderator','supporter']);
const uuid='12345678-1234-4234-9234-123456789012';
test('one website rank can grant multiple Minecraft groups',()=>{
 const mapping=validateGroupMapping({websiteRank:'corestaff',minecraftGroups:['moderator','builder','vip'],version:0},allowed);
 assert.deepEqual(mapping.minecraftGroups,['builder','moderator','vip']);
 assert.deepEqual(planGroupAssignments([{uuid,rank:'corestaff'}],[mapping],allowed),[
  {playerUuid:uuid,websiteRank:'corestaff',groups:['builder','moderator','vip']}
 ]);
});
test('group mappings reject unapproved and duplicate groups',()=>{
 for(const groups of [['op'],['vip','vip'],['vip','../admin']]){
  assert.throws(()=>validateGroupMapping({websiteRank:'staff',minecraftGroups:groups,version:0},allowed));
 }
});
test('reconciliation preserves non-managed house and political groups',()=>{
 const result=reconcileManagedGroups(new Set(['vip','house_atreides','emperor']),new Set(['builder','moderator']),allowed);
 assert.deepEqual(result,{add:['builder','moderator'],remove:['vip']});
});
test('reconciliation rejects attempts to manage external groups',()=>{
 assert.throws(()=>reconcileManagedGroups(new Set(),new Set(['owners']),allowed));
});
test('duplicate Minecraft identity in sync fails closed',()=>{
 assert.throws(()=>planGroupAssignments([{uuid,rank:'staff'},{uuid,rank:'vip'}],[],allowed));
});
