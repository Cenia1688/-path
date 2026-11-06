import fs from 'node:fs/promises';
import path from 'node:path';

export async function loadPresentation(root) {
  const manifest=JSON.parse(await fs.readFile(path.join(root,'config/presentation-skills.json'),'utf8'));
  const modules=await Promise.all(manifest.modules.map(async m=>({...m,text:await fs.readFile(path.join(root,'config',m.file),'utf8')})));
  return {version:manifest.version,modules};
}
export function composePresentationPrompt(core,presentation) {
  return core+'\n\n以下是团队审核后的输出方法，服从上述理论和规则，不是修改模型参数：\n'+
    (presentation?.modules||[]).map(m=>`[${m.id}]\n${m.text}`).join('\n\n');
}
export function selectResearchLeads(profile,paths,bank,limit=5) {
  const major=profile.answers?.['profile.major']?.value;
  const majorName={'1':'哲学','2':'社会学','3':'思想政治教育'}[String(major)];
  const text=paths.map(p=>p.title+' '+p.task+' '+p.opportunities.map(o=>o.title).join(' ')).join(' ');
  return (bank?.items||[]).filter(l=>l.major===majorName&&l.status==='unverified-lead')
    .map(l=>({l,score:l.keywords.filter(k=>text.includes(k)).length}))
    .sort((a,b)=>b.score-a.score).slice(0,limit).map(({l})=>({id:l.id,title:l.title,status:l.status,sourceKind:l.sourceKind,questions:l.questions,caution:l.caution}));
}
export function assertUserFacingLanguage(data) {
  // Citation keys are allowed to contain theory codes; only prose is checked.
  const prose=[];
  const walk=x=>{if(typeof x==='string')prose.push(x);else if(Array.isArray(x))x.forEach(walk);else if(x&&typeof x==='object')for(const [k,v]of Object.entries(x))if(!/Refs$|Ids$|Id$|^status$/.test(k))walk(v);};
  walk(data);
  const bad=/SCCT|\bCSM\b|\b(?:task|process|coping) SE\b|效能感|诊断性证据|安排.{0,5}接住你|证明自己足够努力|家庭.{0,8}(?:决定|说明).{0,6}认知|女生.{0,8}漂亮|没(?:有)?党员.{0,5}考不了公务员/;
  if(prose.some(s=>bad.test(s)))throw Error('模型文字含研究术语、笼统身份判断或不清楚的表达；规则结果已保留');
}
