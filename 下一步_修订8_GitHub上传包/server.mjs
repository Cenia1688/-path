import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadPresentation,composePresentationPrompt} from './lib/presentation.mjs';
const root=path.dirname(fileURLToPath(import.meta.url));
const readJson=async p=>JSON.parse(await fs.readFile(path.join(root,p),'utf8'));
export async function loadConfig(){
  const [fields,constructs,manifest,options,knowledge,theory,outputSchema,examples,systemPrompt]=await Promise.all([
    readJson('public/config/fields.json'),readJson('public/config/constructs.json'),readJson('public/config/manifest.json'),readJson('public/config/source-options.json'),readJson('config/knowledge.json'),readJson('config/theory.json'),readJson('config/output-schema.json'),readJson('config/examples.json'),fs.readFile(path.join(root,'config/system-prompt.md'),'utf8')]);
  const [presentation,researchLeads]=await Promise.all([loadPresentation(root),readJson('config/research-leads.json')]);
  return {fields,constructs,manifest,options,knowledge,theory,outputSchema,examples,systemPrompt:composePresentationPrompt(systemPrompt,presentation),presentation,researchLeads};
}
const MIME={'.png':'image/png','.webp':'image/webp','.html':'text/html; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml'};
export function createApp(){
  function json(res,status,obj){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(obj));}
  return http.createServer(async(req,res)=>{
    res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','same-origin');res.setHeader('X-Frame-Options','DENY');res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'");
    try{
      const url=new URL(req.url,'http://local');
      if(req.method==='GET'&&url.pathname==='/healthz')return json(res,200,{ok:true});
      if(url.pathname.startsWith('/api/'))return json(res,404,{error:'本版本没有在线分析接口'});
      if(req.method!=='GET'&&req.method!=='HEAD')return json(res,405,{error:'不支持此操作'});
      let filename;
      if(url.pathname==='/shared/engine.mjs')filename=path.join(root,'lib/engine.mjs');
      else{
        const pathname=decodeURIComponent(url.pathname);
        filename=path.resolve(root,'public','.'+(pathname==='/'?'/index.html':pathname));
        if(!filename.startsWith(path.join(root,'public')+path.sep))return json(res,404,{error:'文件不存在'});
      }
      let content;try{content=await fs.readFile(filename);}catch{return json(res,404,{error:'文件不存在'});}
      res.writeHead(200,{'Content-Type':MIME[path.extname(filename)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(req.method==='HEAD'?undefined:content);
    }catch(error){if(!res.headersSent)json(res,500,{error:'本次请求未完成，原有资料仍保存在浏览器。'});else res.end();}
  });
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const server=createApp();
  const port=Number(process.env.PORT||3000),host=process.env.HOST||'127.0.0.1';
  server.listen(port,host,()=>console.log(`下一步 http://localhost:${port} · 本地静态版 · 个人问卷不在服务端保存`));
  const stop=()=>server.close(()=>process.exit(0));process.on('SIGTERM',stop);process.on('SIGINT',stop);
}
