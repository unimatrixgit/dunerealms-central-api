/**
 * Website rank -> Minecraft group combinations.
 * A website rank is an authorization role, not a Minecraft group.
 * Only an authenticated, authorized server process may consume the mapping.
 * No LuckPerms mutation is performed by this pure module.
 */
export interface WebsiteRankGroupMapping {
 websiteRank:string;
 minecraftGroups:string[];
 version:number;
}
const key=/^[a-z][a-z0-9_]{2,39}$/;
export function validateGroupMapping(input:unknown,allowedGroups:ReadonlySet<string>):WebsiteRankGroupMapping {
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('invalid_mapping');
 const m=input as Record<string,unknown>;
 if(typeof m.websiteRank!=='string'||!key.test(m.websiteRank))throw Error('invalid_website_rank');
 if(!Array.isArray(m.minecraftGroups)||m.minecraftGroups.length>32||m.minecraftGroups.some(g=>typeof g!=='string'||!key.test(g)||!allowedGroups.has(g)))throw Error('invalid_minecraft_groups');
 if(new Set(m.minecraftGroups).size!==m.minecraftGroups.length)throw Error('duplicate_group');
 if(!Number.isSafeInteger(m.version)||Number(m.version)<0)throw Error('invalid_version');
 return {websiteRank:m.websiteRank,minecraftGroups:[...m.minecraftGroups].sort(),version:Number(m.version)};
}
export interface GroupAssignment {
 playerUuid:string;
 websiteRank:string;
 groups:string[];
}
export function planGroupAssignments(
 members:readonly {uuid:string;rank:string}[],
 mappings:readonly WebsiteRankGroupMapping[],
 allowedGroups:ReadonlySet<string>
):GroupAssignment[]{
 const map=new Map<string,string[]>();
 for(const entry of mappings){
  const m=validateGroupMapping(entry,allowedGroups);
  if(map.has(m.websiteRank))throw Error('duplicate_rank_mapping');
  map.set(m.websiteRank,m.minecraftGroups);
 }
 const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
 const seen=new Set<string>();
 return members.map(member=>{
  if(!uuid.test(member.uuid)||!key.test(member.rank))throw Error('invalid_member');
  const id=member.uuid.toLowerCase();
  if(seen.has(id))throw Error('duplicate_member');
  seen.add(id);
  return {playerUuid:id,websiteRank:member.rank,groups:[...(map.get(member.rank)||[])]};
 });
}
/**
 * Calculate only groups owned by the website rank synchronizer.
 * Never remove manually assigned or house/political groups.
 */
export function reconcileManagedGroups(
 current:ReadonlySet<string>,desired:ReadonlySet<string>,managed:ReadonlySet<string>
):{add:string[];remove:string[]}{
 for(const g of desired)if(!managed.has(g))throw Error('unmanaged_group');
 return {
  add:[...desired].filter(g=>!current.has(g)).sort(),
  remove:[...current].filter(g=>managed.has(g)&&!desired.has(g)).sort()
 };
}
