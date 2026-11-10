/**
 * Department roles are independent of website rank and Minecraft groups.
 * Explicit assignments are scoped to a single department and team.
 * This module prepares authorization decisions; persistence and actor authentication
 * must be enforced by the server integration.
 */
import {DEFAULT_DEPARTMENTS} from './organization.js';

export const DEPARTMENT_ROLE_PERMISSIONS={
 'shop.manager':['shop.view','shop.manage','shop.orders.view','shop.orders.fulfill'],
 'shop.staff':['shop.view','shop.orders.view'],
 'exchange.manager':['exchange.view','exchange.manage','exchange.disputes.resolve'],
 'exchange.staff':['exchange.view','exchange.disputes.view'],
 'tickets.manager':['tickets.view','tickets.assign','tickets.reply','tickets.close'],
 'tickets.agent':['tickets.view','tickets.reply'],
 'ban_appeals.lead':['appeals.view','appeals.assign','appeals.review','appeals.decide'],
 'ban_appeals.reviewer':['appeals.view','appeals.review'],
 'moderation.lead':['game.moderate','game.moderation.manage'],
 'moderation.moderator':['game.moderate'],
 'moderation.anti_cheat':['game.anticheat.review'],
 'events.coordinator':['events.view','events.manage'],
 'events.staff':['events.view','events.assist'],
 'helpers.lead':['players.help','players.help.manage'],
 'helpers.helper':['players.help'],
 'community.discord':['community.discord'],
 'community.media':['community.media'],
 'web.lead':['organization.view'],
 'game.lead':['organization.view']
} as const satisfies Record<string,readonly string[]>;

export type DepartmentRoleKey=keyof typeof DEPARTMENT_ROLE_PERMISSIONS;
export type RoleAssignment={accountId:string;role:DepartmentRoleKey};
export type RoleChange={accountId:string;role:DepartmentRoleKey;enabled:boolean};
const known=new Set<string>(DEFAULT_DEPARTMENTS.flatMap(d=>d.teams.map(t=>d.id+'.'+t)));
for(const role of Object.keys(DEPARTMENT_ROLE_PERMISSIONS)){
 if(!known.has(role))throw Error('department_role_not_in_organization');
}
export function validateRoleAssignments(assignments:readonly RoleAssignment[]):RoleAssignment[]{
 const seen=new Set<string>();
 return assignments.map(a=>{
  if(!a.accountId.trim()||!Object.hasOwn(DEPARTMENT_ROLE_PERMISSIONS,a.role))throw Error('invalid_department_assignment');
  const id=a.accountId+'\0'+a.role;
  if(seen.has(id))throw Error('duplicate_department_assignment');
  seen.add(id);
  return {...a};
 });
}
export function departmentPermissions(accountId:string,assignments:readonly RoleAssignment[]):string[]{
 const roles=validateRoleAssignments(assignments).filter(a=>a.accountId===accountId);
 return [...new Set(roles.flatMap(a=>DEPARTMENT_ROLE_PERMISSIONS[a.role]))].sort();
}
/** Only a separately authenticated and authorized owner/staff manager may call this
 * after checking department-specific delegation limits and audit requirements.
 * Never let the target user authorize their own assignment.
 */
export function planDepartmentRoleChange(
 assignments:readonly RoleAssignment[],change:RoleChange,
 authorizedRoles:ReadonlySet<DepartmentRoleKey>,
 actorAccountId:string
):RoleAssignment[]{
 if(!actorAccountId.trim()||!change.accountId.trim()||actorAccountId===change.accountId)throw Error('self_assignment_forbidden');
 if(!authorizedRoles.has(change.role)||!Object.hasOwn(DEPARTMENT_ROLE_PERMISSIONS,change.role))throw Error('role_change_forbidden');
 const current=validateRoleAssignments(assignments);
 const exists=current.some(a=>a.accountId===change.accountId&&a.role===change.role);
 if(change.enabled)return exists?current:[...current,{accountId:change.accountId,role:change.role}];
 return current.filter(a=>a.accountId!==change.accountId||a.role!==change.role);
}
