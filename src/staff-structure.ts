/**
 * Safe organizational access plan for DuneHub.
 * Existing access ranks remain the sole source of website authorization.
 * Departments are labels/memberships; game groups are a separate explicit mapping.
 */
import {organizationChart,type Department,type DepartmentMembership} from './organization.js';
import {planGroupAssignments,type WebsiteRankGroupMapping} from './website-rank-groups.js';
export const EXISTING_ACCESS_RANKS=['user','vip','staff','corestaff','owners'] as const;
export interface AccountProfile {
 accountId:string;websiteRank:string;playerUuid:string|null;
}
export interface StaffProfile {
 accountId:string;websiteRank:string;departments:{departmentId:string;teamId:string;title:string;lead:boolean}[];
 minecraftGroups:string[];
}
export function prepareStaffProfiles(
 accounts:readonly AccountProfile[],
 departments:readonly Department[],
 memberships:readonly DepartmentMembership[],
 mappings:readonly WebsiteRankGroupMapping[],
 allowedGroups:ReadonlySet<string>
):{chart:ReturnType<typeof organizationChart>;profiles:StaffProfile[]}{
 const chart=organizationChart(departments,memberships);
 const accountsById=new Map<string,AccountProfile>();
 const members: {uuid:string;rank:string}[]=[];
 for(const account of accounts){
  if(!account.accountId||accountsById.has(account.accountId))throw Error('duplicate_or_invalid_account');
  if(!/^[a-z][a-z0-9_]{2,39}$/.test(account.websiteRank))throw Error('invalid_website_rank');
  accountsById.set(account.accountId,account);
  if(account.playerUuid!==null)members.push({uuid:account.playerUuid,rank:account.websiteRank});
 }
 for(const m of memberships)if(!accountsById.has(m.accountId))throw Error('unknown_department_member');
 const game=planGroupAssignments(members,mappings,allowedGroups);
 const byUuid=new Map(game.map(g=>[g.playerUuid,g.groups]));
 return {chart,profiles:accounts.map(account=>({
  accountId:account.accountId,
  websiteRank:account.websiteRank,
  departments:memberships.filter(m=>m.accountId===account.accountId).map(m=>({
   departmentId:m.departmentId,teamId:m.teamId,title:m.title,lead:m.lead
  })),
  minecraftGroups:account.playerUuid?byUuid.get(account.playerUuid.toLowerCase())||[]:[]
 }))};
}
