/**
 * DuneRealms leadership roster (display only).
 * These labels never grant permissions or identify authenticated accounts.
 * A missing username means the actual account identity is not yet verified.
 */
export const LEADERSHIP=[
 {username:'unimatrix',displayName:'unimatrix',title:'Network Owner',departmentIds:['web','game'],responsibilities:['Network ownership','Final approval'],webAccess:'owner'},
 {username:'rich',displayName:'rich',title:'Network Administrator',departmentIds:['web','game'],responsibilities:['Game operations','Moderation oversight','Full operational website administration'],webAccess:'full_admin'},
 {username:'grmacken',displayName:'grmacken',title:'Network Administrator',departmentIds:['web','game'],responsibilities:['Server development','Server management','Full operational website administration'],webAccess:'full_admin'},
 {username:null,displayName:'Mr Blueray',title:'Network Administrator',departmentIds:['web','game'],responsibilities:['Game operations','Website operations','No development responsibilities'],webAccess:'unassigned'}
] as const;
export type LeadershipEntry={
 username:string|null;displayName:string;title:string;departmentIds:readonly string[];
 responsibilities:readonly string[];webAccess:'owner'|'full_admin'|'unassigned';
};
export function validateLeadership(entries:readonly LeadershipEntry[],validDepartmentIds:ReadonlySet<string>){
 const names=new Set<string>(),labels=new Set<string>();
 for(const entry of entries){
  if((entry.username!==null&&!/^[a-zA-Z0-9_]{3,32}$/.test(entry.username))||
    !entry.displayName.trim()||entry.displayName.length>64||
    labels.has(entry.displayName.toLowerCase())||
    !entry.title.trim()||entry.title.length>80||entry.departmentIds.length===0||
    entry.departmentIds.some(id=>!validDepartmentIds.has(id))||
    new Set(entry.departmentIds).size!==entry.departmentIds.length||
    !['owner','full_admin','unassigned'].includes(entry.webAccess)||
    (entry.username===null&&entry.webAccess!=='unassigned'))throw Error('invalid_leadership');
  labels.add(entry.displayName.toLowerCase());
  if(entry.username!==null){
   if(names.has(entry.username.toLowerCase()))throw Error('duplicate_leadership');
   names.add(entry.username.toLowerCase());
  }
 }
 return entries.map(entry=>({...entry,departmentIds:[...entry.departmentIds],responsibilities:[...entry.responsibilities]}));
}
