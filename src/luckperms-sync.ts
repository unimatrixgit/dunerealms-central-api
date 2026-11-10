/**
 * LuckPerms synchronization boundary.
 *
 * DuneHub department roles never imply LuckPerms grants. Only explicit,
 * owner-approved website-rank mappings may produce game group changes.
 * The caller must authenticate the Minecraft service, load actual current
 * groups and managed-group allowlist, then apply commands through LuckPerms API.
 * No console command strings are accepted or generated here.
 */
import {planGroupAssignments,reconcileManagedGroups,type WebsiteRankGroupMapping} from './website-rank-groups.js';

export interface LuckPermsSnapshot{
 uuid:string;
 groups:readonly string[];
}
export interface LuckPermsOperation{
 uuid:string;
 add:readonly string[];
 remove:readonly string[];
}
const groupKey=/^[a-z][a-z0-9_]{2,39}$/;
export function planLuckPermsSync(
 members:readonly {uuid:string;rank:string}[],
 mappings:readonly WebsiteRankGroupMapping[],
 snapshots:readonly LuckPermsSnapshot[],
 allowed:ReadonlySet<string>,
 managed:ReadonlySet<string>
):LuckPermsOperation[]{
 for(const group of managed)if(!allowed.has(group)||!groupKey.test(group))throw Error('invalid_managed_group');
 const desired=planGroupAssignments(members,mappings,allowed);
 const currentByUuid=new Map<string,ReadonlySet<string>>();
 for(const snapshot of snapshots){
  const uuid=snapshot.uuid.toLowerCase();
  if(currentByUuid.has(uuid)||!Array.isArray(snapshot.groups)||snapshot.groups.some(g=>typeof g!=='string'||!groupKey.test(g)))throw Error('invalid_luckperms_snapshot');
  currentByUuid.set(uuid,new Set(snapshot.groups));
 }
 return desired.map(entry=>{
  const current=currentByUuid.get(entry.playerUuid);
  if(!current)throw Error('missing_luckperms_snapshot');
  const changes=reconcileManagedGroups(current,new Set(entry.groups),managed);
  return {uuid:entry.playerUuid,add:changes.add,remove:changes.remove};
 });
}
