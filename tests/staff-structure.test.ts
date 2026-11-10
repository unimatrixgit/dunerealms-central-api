import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_DEPARTMENTS} from '../src/organization.js';
import {prepareStaffProfiles} from '../src/staff-structure.js';
const departments=DEFAULT_DEPARTMENTS.map(d=>({...d,teams:[...d.teams]}));
const uuid='12345678-1234-4234-9234-123456789012';
const accounts=[{accountId:'a',websiteRank:'staff',playerUuid:uuid},{accountId:'b',websiteRank:'vip',playerUuid:null}];
const memberships=[
 {accountId:'a',departmentId:'ban_appeals',teamId:'reviewer',title:'Appeals reviewer',lead:false},
 {accountId:'a',departmentId:'events',teamId:'staff',title:'Event helper',lead:false}
];
const mappings=[{websiteRank:'staff',minecraftGroups:['helper','moderator'],version:0}];
test('retains existing website rank and permits cross-department membership',()=>{
 const data=prepareStaffProfiles(accounts,departments,memberships,mappings,new Set(['helper','moderator']));
 assert.equal(data.profiles[0].websiteRank,'staff');
 assert.equal(data.profiles[0].departments.length,2);
 assert.deepEqual(data.profiles[0].minecraftGroups,['helper','moderator']);
 assert.deepEqual(data.profiles[1].minecraftGroups,[]);
 assert.equal(data.chart.find(x=>x.id==='ban_appeals')?.parentId,'web');
});
test('unknown staff accounts cannot be silently assigned to departments',()=>{
 assert.throws(()=>prepareStaffProfiles(accounts,departments,[{...memberships[0],accountId:'missing'}],mappings,new Set(['helper','moderator'])));
});
test('unapproved Minecraft groups cannot be assigned via rank combinations',()=>{
 assert.throws(()=>prepareStaffProfiles(accounts,departments,memberships,mappings,new Set(['helper'])));
});
test('duplicate accounts fail closed',()=>{
 assert.throws(()=>prepareStaffProfiles([accounts[0],accounts[0]],departments,[],[],new Set()));
});
