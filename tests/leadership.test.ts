import test from 'node:test';
import assert from 'node:assert/strict';
import {LEADERSHIP,validateLeadership} from '../src/leadership.js';
import {DEFAULT_DEPARTMENTS} from '../src/organization.js';
const departments=new Set(DEFAULT_DEPARTMENTS.map(d=>d.id));
test('owner and both administrators are assigned to correct branches',()=>{
 const entries=validateLeadership(LEADERSHIP,departments);
 assert.deepEqual(entries.find(x=>x.username==='unimatrix')?.departmentIds,['web','game']);
 assert.deepEqual(entries.find(x=>x.username==='rich')?.departmentIds,['game']);
 assert.deepEqual(entries.find(x=>x.username==='grmacken')?.departmentIds,['web']);
 assert.ok(entries.find(x=>x.username==='grmacken')?.responsibilities.includes('Server management'));
});
test('duplicate names and unknown departments are rejected',()=>{
 assert.throws(()=>validateLeadership([...LEADERSHIP,LEADERSHIP[0]],departments));
 assert.throws(()=>validateLeadership([{username:'someone',title:'Admin',departmentIds:['unknown'],responsibilities:[]}],departments));
});
