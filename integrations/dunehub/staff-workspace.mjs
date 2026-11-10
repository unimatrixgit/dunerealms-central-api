/**
 * DuneHub staff workspace enhancement.
 * Uses existing /api/admin/accounts and /api/ranks endpoints.
 * Department roster is a visual blueprint until the membership API is deployed.
 * No invented account assignments or extra permissions.
 */
const LEADERS=[{name:'unimatrix',title:'Network Owner',scope:'Network'}, {name:'grmacken',title:'Web Administrator & Server Developer',scope:'Web and infrastructure'}, {name:'rich',title:'Game Administrator',scope:'Game'}];
const DEPARTMENTS=[
 {id:'web',title:'Web',teams:[['community','Community & Support'],['ban_appeals','Ban Appeals'],['shop','Shop & Payments']]},
 {id:'game',title:'Game',teams:[['moderation','Moderation'],['events','Events'],['helpers','Player Help']]}
];
const el=(tag,text,className)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(className)n.className=className;return n;};
const fetchJson=async(path,body)=>{
 const response=await fetch(path,{cache:'no-store',credentials:'same-origin',...(body===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})});
 const data=await response.json();
 if(!response.ok)throw Error(data.message||'Request failed');
 return data;
};
export function mountStaffWorkspace({dashboard=document.getElementById('dashboard')}={}){
 if(!dashboard||document.getElementById('staff-workspace'))return;
 const section=el('section');section.id='staff-workspace';section.hidden=true;
 section.append(el('p','STAFF WORKSPACE','eyebrow'),el('h2','People & departments'));
 const intro=el('p','Website ranks control access. Minecraft groups are managed separately. Departments show how the team is organized; they do not grant permissions.','muted');section.append(intro);
 const leadership=el('div',undefined,'staff-org');
 for(const person of LEADERS){const card=el('article',undefined,'staff-org-department');card.append(el('strong',person.name),el('p',person.title),el('p',person.scope,'muted'));leadership.append(card);}
 section.append(el('h3','Leadership'),leadership);
 const org=el('div',undefined,'staff-org');
 for(const department of DEPARTMENTS){
  const card=el('article',undefined,'staff-org-department');
  card.append(el('h3',department.title));
  const teams=el('ul');
  for(const [,title] of department.teams)teams.append(el('li',title));
  card.append(teams);org.append(card);
 }
 section.append(org);
 const hint=el('p','Department assignments are not yet connected to the account database. No members are shown until the roster API is available.','muted');
 section.append(hint);
 const controls=el('div',undefined,'staff-account-controls');
 const heading=el('h3','Account management'),search=el('input'),filter=el('select'),refresh=el('button','Refresh');
 search.type='search';search.placeholder='Search username, rank or Minecraft name';search.setAttribute('aria-label','Search accounts');
 for(const [value,title] of [['','All website ranks'],['user','User'],['vip','VIP'],['staff','Staff'],['corestaff','Corestaff'],['owners','Owners']]){
  const option=el('option',title);option.value=value;filter.append(option);
 }
 filter.setAttribute('aria-label','Filter by website rank');
 controls.append(heading,search,filter,refresh);
 const status=el('p');status.role='status';status.setAttribute('aria-live','polite');
 const list=el('div',undefined,'staff-account-list');controls.append(status,list);section.append(controls);dashboard.append(section);
 const nav=dashboard.querySelector('nav');
 const tab=el('a','People & departments');tab.href='#staff-workspace';tab.hidden=true;nav?.append(tab);
 let accounts=[],permissions=[],actorRank='',ranks=[];
 const render=()=>{
  list.replaceChildren();
  const query=search.value.trim().toLowerCase();
  const visible=accounts.filter(a=>(!filter.value||a.role===filter.value)&&
   (!query||[a.username,a.role,a.minecraft_name].some(s=>String(s||'').toLowerCase().includes(query))));
  status.textContent=visible.length+' of '+accounts.length+' accounts';
  if(!visible.length)list.append(el('p','No matching accounts.','muted'));
  for(const account of visible){
   const card=el('article',undefined,'staff-account-card');
   const title=el('div',undefined,'staff-account-title');
   title.append(el('strong',account.username||'Unknown'),el('span',account.role||'Unranked','staff-rank'));
   card.append(title,el('p',account.minecraft_name?'Minecraft: '+account.minecraft_name:'No linked Minecraft account','muted'));
   const actions=el('div',undefined,'staff-account-actions');
   if(permissions.includes('cp.accounts.assign')&&account.role!=='owners'){
    const select=el('select');select.setAttribute('aria-label','Website rank for '+account.username);
    for(const rank of ranks.filter(r=>r.kind==='access'&&r.key!=='owners'&&(actorRank==='owners'||r.editable))){
     const option=el('option',rank.label);option.value=rank.key;option.selected=account.role===rank.key;select.append(option);
    }
    const save=el('button','Save website rank');
    save.disabled=!select.options.length;
    save.onclick=async()=>{
     if(!confirm('Change the website rank for '+account.username+'? Existing sessions will be revoked.'))return;
     save.disabled=true;try{
      await fetchJson('/api/ranks/assign',{userId:account.id,rank:select.value});
      await load();status.textContent='Website rank updated.';
     }catch(e){status.textContent=e.message;}finally{save.disabled=false;}
    };
    actions.append(select,save);
   }
   if(permissions.includes('cp.accounts.revoke')){
    const revoke=el('button','Sign out sessions');
    revoke.onclick=async()=>{
     if(!confirm('Revoke all sessions for '+account.username+'?'))return;
     revoke.disabled=true;try{
      await fetchJson('/api/admin/revoke-sessions',{userId:account.id});
      status.textContent='Sessions revoked for '+account.username+'.';
     }catch(e){status.textContent=e.message;}finally{revoke.disabled=false;}
    };actions.append(revoke);
   }
   card.append(actions);list.append(card);
  }
 };
 const load=async()=>{
  status.textContent='Loading accounts…';
  try{
   const response=await fetchJson('/api/admin/accounts');
   accounts=Array.isArray(response.accounts)?response.accounts:[];
   if(permissions.includes('cp.accounts.assign')){
    try{const r=await fetchJson('/api/ranks');ranks=r.ranks||[];actorRank=r.actor?.rank||'';}catch{ranks=[];}
   }
   render();
  }catch(e){list.replaceChildren();status.textContent=e.message;}
 };
 search.addEventListener('input',render);filter.addEventListener('change',render);refresh.onclick=load;
 window.addEventListener('dune:session',event=>{
  const p=event.detail?.permissions||[];permissions=Array.isArray(p)?p:[];
  const allowed=permissions.includes('cp.accounts.view');
  section.hidden=!allowed;tab.hidden=!allowed;
  if(allowed)void load();else{accounts=[];list.replaceChildren();}
 });
 // The session event may have fired before this module finished loading.
 void fetchJson('/api/auth/session').then(data=>{
  if(data.authenticated)window.dispatchEvent(new CustomEvent('dune:session',{detail:data.user}));
 }).catch(()=>{});
}
if(typeof document!=='undefined')mountStaffWorkspace();
