/**
 * Public passport cards are opt-in and never expose bank, inventory,
 * hidden locations, account email, UUID or staff permissions.
 */
export interface PassportPublicSource {
 displayName:string;house:string|null;achievements:readonly string[];
 publicProfile:boolean;publicHouse:boolean;publicAchievements:boolean;
}
export function publicPassport(source:PassportPublicSource){
 if(!source.publicProfile)return null;
 if(!/^[a-zA-Z0-9_]{3,32}$/.test(source.displayName))throw Error('invalid_player_name');
 if(source.house!==null&&!/^[a-z][a-z0-9_]{1,39}$/.test(source.house))throw Error('invalid_house');
 const achievements=source.publicAchievements?[...new Set(source.achievements)].filter(a=>/^[a-z][a-z0-9_]{1,63}$/.test(a)).slice(0,30):[];
 return {displayName:source.displayName,house:source.publicHouse?source.house:null,achievements};
}
