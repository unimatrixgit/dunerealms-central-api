import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_DEPARTMENTS,organizationChart,validateOrganization} from '../src/organization.js';
const departments=DEFAULT_DEPARTMENTS.map(d=>({...d,teams:[...d.teams]}));
test('organigram contains six departments and their teams',()=>{
 const chart=organizationChart(departments,[]);
 assert.equal(chart.length,6);
 assert.ok(chart.find(d=>d.id==='development')?.teams.some(t=>t.id==='api'));
});
test('one staff account can join multiple departments without changing ranks',()=>{
 const chart=organizationChart(departments,[
  {accountId:'alice',departmentId:'development',teamId:'api',title:'API developer',lead:true},
  {accountId:'alice',departmentId:'community',teamId:'events',title:'Event organizer',lead:false}
 ]);
 assert.equal(chart.filter(d=>d.teams.some(t=>t.members.some(m=>m.accountId==='alice'))).length,2);
});
test('invalid teams, duplicate memberships and department cycles are rejected',()=>{
 assert.throws(()=>organizationChart(departments,[{accountId:'alice',departmentId:'finance',teamId:'admin',title:'Manager',lead:true}]));
 const m={accountId:'alice',departmentId:'finance',teamId:'audit',title:'Auditor',lead:true};
 assert.throws(()=>organizationChart(departments,[m,m]));
 assert.throws(()=>validateOrganization([{id:'a1',label:'A',parentId:'b1',teams:[]},{id:'b1',label:'B',parentId:'a1',teams:[]}]));
});
