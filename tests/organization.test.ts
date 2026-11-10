import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_DEPARTMENTS,organizationChart,validateOrganization} from '../src/organization.js';
const departments=DEFAULT_DEPARTMENTS.map(d=>({...d,teams:[...d.teams]}));
test('small Web and Game structure keeps Ban Appeals independent',()=>{
 const chart=organizationChart(departments,[]);
 assert.equal(chart.length,8);
 assert.deepEqual(chart.filter(d=>d.parentId===null).map(d=>d.id),['web','game']);
 assert.equal(chart.find(d=>d.id==='ban_appeals')?.parentId,'web');
 assert.ok(chart.find(d=>d.id==='ban_appeals')?.teams.some(t=>t.id==='reviewers'));
 assert.ok(!chart.find(d=>d.id==='moderation')?.teams.some(t=>t.id==='reviewers'));
 assert.equal(chart.some(d=>d.id.includes('development')),false);
});
test('one person can help on Web and Game without extra rank changes',()=>{
 const chart=organizationChart(departments,[
  {accountId:'alice',departmentId:'community',teamId:'discord',title:'Community member',lead:false},
  {accountId:'alice',departmentId:'events',teamId:'events',title:'Event host',lead:false}
 ]);
 assert.equal(chart.filter(d=>d.teams.some(t=>t.members.some(m=>m.accountId==='alice'))).length,2);
});
test('invalid teams, duplicate memberships and cycles fail closed',()=>{
 assert.throws(()=>organizationChart(departments,[{accountId:'alice',departmentId:'shop',teamId:'admin',title:'Manager',lead:true}]));
 const m={accountId:'alice',departmentId:'shop',teamId:'payments',title:'Payments',lead:true};
 assert.throws(()=>organizationChart(departments,[m,m]));
 assert.throws(()=>validateOrganization([{id:'a1',label:'A',parentId:'b1',teams:[]},{id:'b1',label:'B',parentId:'a1',teams:[]}]));
});
