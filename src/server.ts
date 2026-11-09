import {createServer} from 'node:http';
import {Readable} from 'node:stream';
import {loadConfig} from './config.js';
import {createApp} from './app.js';

const config=loadConfig();
const app=createApp(config);
const server=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url??'/', 'http://localhost');
  const request=new Request(url,{method:req.method,headers:req.headers as HeadersInit});
  const response=await app(request);
  res.writeHead(response.status,Object.fromEntries(response.headers.entries()));
  if(response.body)Readable.fromWeb(response.body as import('node:stream/web').ReadableStream).pipe(res);
  else res.end();
 }catch{res.writeHead(500,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end('{"error":{"code":"internal_error"}}');}
});
server.listen(config.port,config.host,()=>console.info(JSON.stringify({event:'api-start',host:config.host,port:config.port,enabled:config.enabled})));
