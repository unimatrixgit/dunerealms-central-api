/**
 * Creator applications: moderation-ready intake validation only.
 * Does not award ranks, grant payments, or automatically publish links.
 */
export interface CreatorApplication {
 accountId:string;channelUrl:string;platform:'youtube'|'twitch'|'tiktok'|'other';
 message:string;consentToContact:boolean;
}
export function validateCreatorApplication(input:CreatorApplication){
 if(!input.accountId.trim()||input.accountId.length>100||
   !['youtube','twitch','tiktok','other'].includes(input.platform)||
   input.message.trim().length<20||input.message.length>1500||
   input.consentToContact!==true)throw Error('invalid_creator_application');
 let url:URL;
 try{url=new URL(input.channelUrl);}catch{throw Error('invalid_channel_url');}
 if(url.protocol!=='https:'||url.username||url.password||url.port||!url.hostname.includes('.')||
  /^(localhost|127\\.|10\\.|192\\.168\\.|169\\.254\\.)/i.test(url.hostname))throw Error('invalid_channel_url');
 return {accountId:input.accountId,channelUrl:url.toString(),platform:input.platform,
  message:input.message.trim(),status:'pending_review' as const};
}
