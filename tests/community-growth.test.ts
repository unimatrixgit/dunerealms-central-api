import test from 'node:test';
import assert from 'node:assert/strict';
import {buildChronicle} from '../src/chronicle.js';
import {publicPassport} from '../src/public-passport.js';
import {validateCreatorApplication} from '../src/creator-program.js';
const now=Date.UTC(2026,10,10);
test('Chronicle only publishes verified public recent events',()=>{
 const events=[
  {id:'event_1',kind:'election' as const,title:'Election',summary:'Result',occurredAt:now-1000,verified:true,public:true,sourceId:'game:1'},
  {id:'event_2',kind:'invasion' as const,title:'Secret',summary:'Private',occurredAt:now-2000,verified:true,public:false,sourceId:'game:2'},
  {id:'event_3',kind:'event' as const,title:'Unverified',summary:'Rumour',occurredAt:now-3000,verified:false,public:true,sourceId:'web:3'}
 ];
 assert.deepEqual(buildChronicle(events,now).map(x=>x.id),['event_1']);
 assert.throws(()=>buildChronicle([events[0],events[0]],now));
});
test('public passports are opt-in and omit hidden details',()=>{
 assert.equal(publicPassport({displayName:'player_1',house:'atreides',achievements:['explorer'],publicProfile:false,publicHouse:true,publicAchievements:true}),null);
 assert.deepEqual(publicPassport({displayName:'player_1',house:'atreides',achievements:['explorer'],publicProfile:true,publicHouse:false,publicAchievements:false}),
 {displayName:'player_1',house:null,achievements:[]});
});
test('creator application needs consent and a secure channel link',()=>{
 const application={accountId:'user_1',channelUrl:'https://www.youtube.com/@example',platform:'youtube' as const,message:'I make Minecraft videos about faction servers.',consentToContact:true};
 assert.equal(validateCreatorApplication(application).status,'pending_review');
 assert.throws(()=>validateCreatorApplication({...application,consentToContact:false}));
 assert.throws(()=>validateCreatorApplication({...application,channelUrl:'http://localhost/internal'}));
});
