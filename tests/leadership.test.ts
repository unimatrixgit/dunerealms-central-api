import test from 'node:test';
import assert from 'node:assert/strict';
import {LEADERSHIP,validateLeadership} from '../src/leadership.js';
import {DEFAULT_DEPARTMENTS} from '../src/organization.js';
const departments=new Set(DEFAULT_DEPARTMENTS.map(d=>d.id));
test('four core staff members with equal operational web access for rich and grmacken',()=>{
 const leaders=validateLeadership(LEADERSHIP,departments);
 assert.equal(leaders.length,4);
 assert.equal(leaders.find(x=>x.username==='unimatrix')?.title,'Network Owner');
 assert.deepEqual([...new Set(leaders.filter(x=>x.displayName!=='unimatrix').map(x=>x.title))],['Network Administrator']);
 assert.equal(leaders.find(x=>x.username==='unimatrix')?.webAccess,'owner');
 for(const name of ['rich','grmacken']){
  const leader=leaders.find(x=>x.username===name);
  assert.equal(leader?.webAccess,'full_admin');
  assert.deepEqual([...leader!.departmentIds].sort(),['game','web']);
 }
 const blueray=leaders.find(x=>x.displayName==='Mr Blueray');
 assert.equal(blueray?.username,null);
 assert.equal(blueray?.webAccess,'unassigned');
});
test('unknown departments, duplicate names and unverified admin identity fail closed',()=>{
 assert.throws(()=>validateLeadership([...LEADERSHIP,LEADERSHIP[0]],departments));
 assert.throws(()=>validateLeadership([{username:'other',displayName:'Other',title:'Admin',departmentIds:['unknown'],responsibilities:[],webAccess:'full_admin'}],departments));
 assert.throws(()=>validateLeadership([{username:null,displayName:'Unverified',title:'Admin',departmentIds:['web'],responsibilities:[],webAccess:'full_admin'}],departments));
});
