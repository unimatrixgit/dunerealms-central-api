/**
 * One staff access decision across website ranks, department roles and
 * explicitly managed LuckPerms groups. Recognition (seals/awards) is never
 * a permission source. The existing game reward ledger stays independent.
 */
import {departmentPermissions,type RoleAssignment} from './department-roles.js';
import {planLuckPermsSync,type LuckPermsSnapshot} from './luckperms-sync.js';
import type {WebsiteRankGroupMapping} from './website-rank-groups.js';

export interface StaffAccessInput {
 accountId:string;
 websiteRank:string;
 websitePermissions:readonly string[];
 departmentAssignments:readonly RoleAssignment[];
 recognition:readonly {kind:'seal'|'award';key:string}[];
}
export function resolveUnifiedStaffAccess(input:StaffAccessInput){
 if(!input.accountId.trim()||!input.websiteRank.trim())throw Error('invalid_staff_identity');
 // Website authorization is provided by the existing authenticated DuneHub
 // rank resolver; department scopes never become global website permissions.
 const website=[...new Set(input.websitePermissions)].sort();
 const department=departmentPermissions(input.accountId,input.departmentAssignments);
 for(const recognition of input.recognition){
  if(!['seal','award'].includes(recognition.kind)||!/^[a-z][a-z0-9_]{1,63}$/.test(recognition.key))throw Error('invalid_recognition');
 }
 return {
  accountId:input.accountId,websiteRank:input.websiteRank,
  websitePermissions:website,departmentPermissions:department,
  recognition:input.recognition.map(x=>({...x})),
  // A badge/award cannot add website or Minecraft rights.
  effectiveWebPermissions:website
 };
}
export function planUnifiedLuckPermsSync(
 members:readonly {uuid:string;rank:string}[],
 mappings:readonly WebsiteRankGroupMapping[],
 snapshots:readonly LuckPermsSnapshot[],
 allowedGroups:ReadonlySet<string>,
 managedGroups:ReadonlySet<string>
){
 return planLuckPermsSync(members,mappings,snapshots,allowedGroups,managedGroups);
}
