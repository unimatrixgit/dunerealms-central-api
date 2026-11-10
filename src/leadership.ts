/**
 * Named DuneRealms leadership assignments for the staff organization view.
 * These are display assignments only. Never infer authentication identity,
 * account IDs, website permissions or LuckPerms groups from a display name.
 */
export const LEADERSHIP=[
 {username:'unimatrix',title:'Network Owner',departmentIds:['web','game'],responsibilities:['Network ownership','Final approval']},
 {username:'rich',title:'Network Operations Administrator',departmentIds:['game','web'],responsibilities:['Game operations','Moderation oversight','Website operations']},
 {username:'grmacken',title:'Technical Administrator',departmentIds:['web'],responsibilities:['Website administration','Server development','Server management']}
] as const;
export type LeadershipEntry={
 username:string;title:string;departmentIds:readonly string[];responsibilities:readonly string[];
};
export function validateLeadership(entries:readonly LeadershipEntry[],validDepartmentIds:ReadonlySet<string>){
 const names=new Set<string>();
 for(const entry of entries){
  if(!/^[a-zA-Z0-9_]{3,32}$/.test(entry.username)||names.has(entry.username.toLowerCase())||
    !entry.title.trim()||entry.title.length>80||entry.departmentIds.length===0||
    entry.departmentIds.some(id=>!validDepartmentIds.has(id))||
    new Set(entry.departmentIds).size!==entry.departmentIds.length)throw Error('invalid_leadership');
  names.add(entry.username.toLowerCase());
 }
 return entries.map(entry=>({...entry,departmentIds:[...entry.departmentIds],responsibilities:[...entry.responsibilities]}));
}
