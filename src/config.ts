export interface Config {
 host:string;port:number;enabled:boolean;serviceToken:string;worldStatusUrl:string|null;
}
export function loadConfig(env:NodeJS.ProcessEnv=process.env):Config {
 const port=Number(env.PORT??18080);
 if(!Number.isInteger(port)||port<1||port>65535)throw Error('Invalid PORT');
 const host=env.HOST??'127.0.0.1';
 if(!['127.0.0.1','::1','localhost'].includes(host))throw Error('Public binding is disabled; use a private reverse proxy');
 const enabled=env.API_ENABLED==='true';
 const serviceToken=env.API_SERVICE_TOKEN??'';
 if(enabled&&serviceToken.length<32)throw Error('API_SERVICE_TOKEN must be at least 32 characters');
 const worldStatusUrl=env.WORLD_STATUS_URL||null;
 if(worldStatusUrl){
  const url=new URL(worldStatusUrl);
  if(url.protocol!=='https:'||url.username||url.password||url.hash)throw Error('WORLD_STATUS_URL must be HTTPS with no embedded credentials');
 }
 return {host,port,enabled,serviceToken,worldStatusUrl};
}
