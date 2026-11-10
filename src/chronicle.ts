/**
 * Public DuneRealms Chronicle: only publish verified, privacy-safe game events.
 * Never infer activity from demo market listings or unverified submissions.
 */
export type ChronicleKind='election'|'invasion'|'event'|'achievement'|'settlement';
export interface ChronicleEvent {
 id:string;kind:ChronicleKind;title:string;summary:string;occurredAt:number;
 verified:boolean;public:boolean;sourceId:string;
}
export function buildChronicle(events:readonly ChronicleEvent[],now:number,days=7){
 if(!Number.isSafeInteger(now)||!Number.isInteger(days)||days<1||days>31)throw Error('invalid_window');
 const ids=new Set<string>();
 return events.filter(event=>{
  if(!/^[a-zA-Z0-9_-]{3,100}$/.test(event.id)||!event.sourceId.trim()||
   !Number.isSafeInteger(event.occurredAt)||event.occurredAt<0||
   !['election','invasion','event','achievement','settlement'].includes(event.kind)||
   event.title.length>120||!event.title.trim()||event.summary.length>1000)throw Error('invalid_chronicle_event');
  if(ids.has(event.id))throw Error('duplicate_event');
  ids.add(event.id);
  return event.verified&&event.public&&event.occurredAt<=now&&event.occurredAt>=now-days*86400000;
 }).sort((a,b)=>b.occurredAt-a.occurredAt||a.id.localeCompare(b.id))
 .map(({id,kind,title,summary,occurredAt})=>({id,kind,title,summary,occurredAt}));
}
