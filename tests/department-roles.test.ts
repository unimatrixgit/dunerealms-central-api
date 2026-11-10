import test from 'node:test';
import assert from 'node:assert/strict';
import {departmentPermissions,planDepartmentRoleChange,validateRoleAssignments,type DepartmentRoleKey} from '../src/department-roles.js';
const actor='owner',account='alice';
const allowed=new Set<DepartmentRoleKey>(['shop.manager','exchange.staff','tickets.agent']);
test('staff can have Shop and Tickets without Exchange',()=>{
 const assignments=[
  {accountId:account,role:'shop.manager' as const},
  {accountId:account,role:'tickets.agent' as const}
 ];
 const perms=departmentPermissions(account,assignments);
 assert.ok(perms.includes('shop.manage'));
 assert.ok(perms.includes('tickets.reply'));
 assert.ok(!perms.some(p=>p.startsWith('exchange.')));
});
test('role assignments are idempotent and separately revocable',()=>{
 const first=planDepartmentRoleChange([],{accountId:account,role:'shop.manager',enabled:true},allowed,actor);
 const second=planDepartmentRoleChange(first,{accountId:account,role:'tickets.agent',enabled:true},allowed,actor);
 assert.deepEqual(planDepartmentRoleChange(second,{accountId:account,role:'shop.manager',enabled:true},allowed,actor),second);
 const after=planDepartmentRoleChange(second,{accountId:account,role:'shop.manager',enabled:false},allowed,actor);
 assert.deepEqual(after,[{accountId:account,role:'tickets.agent'}]);
});
test('self assignment, unauthorized roles and duplicates are rejected',()=>{
 assert.throws(()=>planDepartmentRoleChange([],{accountId:actor,role:'shop.manager',enabled:true},allowed,actor));
 assert.throws(()=>planDepartmentRoleChange([],{accountId:account,role:'ban_appeals.lead',enabled:true},allowed,actor));
 assert.throws(()=>validateRoleAssignments([{accountId:account,role:'shop.manager'},{accountId:account,role:'shop.manager'}]));
});
