/**
 * DuneRealms staff organization chart.
 * Departments and assignments are independent of website authorization ranks,
 * Minecraft LuckPerms groups, and in-game political offices.
 */
export const DEFAULT_DEPARTMENTS=[
 {id:'web',label:'Web Department',parentId:null,teams:['head_web']},
 {id:'web_development',label:'Web Development & IT',parentId:'web',teams:['website','api','infrastructure']},
 {id:'community',label:'Community & Support',parentId:'web',teams:['support','discord','community']},
 {id:'ban_appeals',label:'Ban Appeals',parentId:'web',teams:['appeals_lead','senior_review','review','trainees']},
 {id:'marketing',label:'Marketing & Media',parentId:'web',teams:['social_media','creators','promotion']},
 {id:'finance',label:'Finance & Shop',parentId:'web',teams:['rank_shop','payments','audit']},
 {id:'game',label:'Game Department',parentId:null,teams:['head_game']},
 {id:'game_admin',label:'Game Administration',parentId:'game',teams:['administration','moderation','anti_cheat']},
 {id:'game_development',label:'Game Development',parentId:'game',teams:['plugins','worldgen','server_systems']},
 {id:'game_design',label:'Game Design',parentId:'game',teams:['factions','economy','quests','balancing']},
 {id:'game_events',label:'In-game Events',parentId:'game',teams:['events','tournaments']},
 {id:'player_assistance',label:'Player Assistance',parentId:'game',teams:['helpers','player_support']}
] as const;
export type Department={id:string;label:string;parentId:string|null;teams:string[]};
export type DepartmentMembership={accountId:string;departmentId:string;teamId:string;title:string;lead:boolean};
const key=/^[a-z][a-z0-9_]{1,39}$/;
export function validateOrganization(departments:readonly Department[]):void{
 const ids=new Set<string>();
 for(const d of departments){
  if(!key.test(d.id)||!d.label.trim()||ids.has(d.id)||new Set(d.teams).size!==d.teams.length||
   d.teams.some(t=>!key.test(t)))throw Error('invalid_department');
  ids.add(d.id);
 }
 for(const d of departments){
  if(d.parentId!==null&&!ids.has(d.parentId))throw Error('unknown_parent');
  const seen=new Set<string>([d.id]);let p=d.parentId;
  while(p!==null){
   if(seen.has(p))throw Error('department_cycle');
   seen.add(p);
   p=departments.find(x=>x.id===p)?.parentId??null;
  }
 }
}
export function organizationChart(departments:readonly Department[],memberships:readonly DepartmentMembership[]){
 validateOrganization(departments);
 const unique=new Set<string>();
 const entries=memberships.map(m=>{
  const department=departments.find(d=>d.id===m.departmentId);
  if(!department||!department.teams.includes(m.teamId)||!m.accountId.trim()||
   !m.title.trim()||m.title.length>80||typeof m.lead!=='boolean')throw Error('invalid_membership');
  const id=m.accountId+'\0'+m.departmentId+'\0'+m.teamId;
  if(unique.has(id))throw Error('duplicate_membership');
  unique.add(id);
  return {...m};
 });
 return departments.map(d=>({
  id:d.id,label:d.label,parentId:d.parentId,
  teams:d.teams.map(t=>({
   id:t,
   members:entries.filter(m=>m.departmentId===d.id&&m.teamId===t)
    .sort((a,b)=>Number(b.lead)-Number(a.lead)||a.title.localeCompare(b.title)||a.accountId.localeCompare(b.accountId))
  }))
 }));
}
