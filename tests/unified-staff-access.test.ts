import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveUnifiedStaffAccess,planUnifiedLuckPermsSync} from '../src/unified-staff-access.js';
const uuid='12345678-1234-4234-9234-123456789012';
test('seals and awards never grant privileges; department roles remain scoped',()=>{
 const result=resolveUnifiedStaffAccess({
  accountId:'alice',websiteRank:'staff',websitePermissions:['cp.accounts.view'],
  departmentAssignments:[{accountId:'alice',role:'tickets.agent'},{accountId:'alice',role:'exchange.staff'}],
  recognition:[{kind:'seal',key:'imperial_seal'},{kind:'award',key:'community_helper'}]
 });
 assert.deepEqual(result.effectiveWebPermissions,['cp.accounts.view']);
 assert.ok(result.departmentPermissions.includes('tickets.reply'));
 assert.ok(result.departmentPermissions.includes('exchange.view'));
 assert.ok(!result.departmentPermissions.includes('shop.manage'));
});
test('LuckPerms changes are explicit and never touch house, office or award groups',()=>{
 const result=planUnifiedLuckPermsSync([{uuid,rank:'staff'}],
  [{websiteRank:'staff',minecraftGroups:['helper'],version:0}],
  [{uuid,groups:['vip','house_atreides','office_emperor','award_veteran']}],
  new Set(['vip','helper']),new Set(['vip','helper']));
 assert.deepEqual(result,[{uuid,add:['helper'],remove:['vip']}]);
});
