import {value} from './engine.mjs';
import {selectResearchLeads,assertUserFacingLanguage} from './presentation.mjs';
const cleanText=s=>String(s||'').replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,'[邮箱已隐藏]').replace(/\b1[3-9]\d{9}\b/g,'[手机号已隐藏]').replace(/\b\d{17}[\dXx]\b/g,'[身份证号已隐藏]');
const clean=x=>JSON.parse(cleanText(JSON.stringify(x)));
export function buildContext(state,report,knowledge,theory,fields,researchBank) {
  const allowedProfile=new Set(['profile.major','profile.year','profile.valueRank','profile.minIncome','profile.noRelocation','profile.bottomLines','profile.moneyBand','profile.desiredSelf','profile.skills','profile.supportDetails','profile.bottomDetails','profile.education']);
  const profile=Object.fromEntries(Object.entries(state.profile.answers).filter(([k])=>allowedProfile.has(k)));
  const rankField=fields.find(f=>f.id==='profile.valueRank');
  if(rankField&&value(state.profile.answers,'profile.valueRank'))profile.valuePriority=value(state.profile.answers,'profile.valueRank').map((v,i)=>({rank:i+1,label:rankField.options.find(o=>o.value===v)?.label||v}));
  const definitions=fields.filter(f=>(f.scope==='path'&&f.id!=='path.identityDomains')||allowedProfile.has(f.id)).map(f=>({id:f.id,label:f.label,options:f.options,unit:f.unit}));
  return clean({theory,definitions,personal:{answers:profile},paths:state.paths.map(p=>({id:p.id,title:p.title,task:p.task,status:p.status,answers:Object.fromEntries(Object.entries(p.answers).filter(([k])=>k!=='path.identityDomains')),goals:p.goals,opportunities:p.opportunities,knowledge:p.knowledge})),events:state.events.slice(-12),history:state.snapshots.slice(-3).map(s=>({id:s.id,at:s.at,paths:s.paths.map(p=>({id:p.id,task:p.task,answers:Object.fromEntries(Object.entries(p.answers).filter(([k])=>k!=='path.identityDomains'))}))})),ruleResults:{findings:report.findings,questions:report.questions},cards:knowledge.cards.filter(c=>(state.demo?c.status==='demo':c.status==='reviewed')&&report.sources.some(s=>s.id===c.sourceId)),sources:report.sources,researchLeads:selectResearchLeads(state.profile,state.paths,researchBank,3)});
}
function safeStrings(x,limit=1000) {return typeof x==='string'&&x.length<=limit&&!/https?:\/\/|适合度|成功率|录取概率|人格总分|匹配分|\d+(?:\.\d+)?\s*%/.test(x);}
function requireList(v,name,max=8) {if(!Array.isArray(v)||v.length>max) throw Error(`${name}格式不符合约定`);}
export function validateModelOutput(data,context) {
  assertUserFacingLanguage(data);
  if(!data||!safeStrings(data.summary,500)) throw Error('模型摘要无效或包含未经允许的评分/概率');
  const fieldIds=new Set(context.definitions.map(f=>f.id));
  const ruleIds=new Set(context.ruleResults.findings.map(f=>f.id));
  const sources=new Map(context.sources.map(s=>[s.id,s])); const cards=new Set(context.cards.map(c=>c.id));
  const refs=(list,set,label)=>{requireList(list,label,20);if(list.some(v=>typeof v!=='string'||!set.has(v)))throw Error(`模型使用未知${label}`);};
  for(const name of ['observations','explorations','actions','questions','factRefs'])requireList(data[name],name,name==='observations'?6:name==='questions'?5:name==='actions'?4:name==='explorations'?2:12);
  for(const o of data.observations){if(!safeStrings(o.text))throw Error('解释文字无效');refs(o.fieldRefs,fieldIds,'字段');refs(o.ruleRefs,ruleIds,'规则');if(!o.fieldRefs.length&&!o.ruleRefs.length)throw Error('解释缺少输入或规则依据');}
  for(const e of data.explorations)if(!cards.has(e.cardId)||!safeStrings(e.reason)||!safeStrings(e.nextStep))throw Error('探索选项没有有效资料卡');
  for(const a of data.actions){if(!safeStrings(a.title)||!safeStrings(a.deliverable))throw Error('行动格式无效');requireList(a.steps,'步骤',6);requireList(a.reviewQuestions,'复盘问题',5);if([...a.steps,...a.reviewQuestions].some(s=>!safeStrings(s)))throw Error('行动文字无效');if(a.timeMinutes!==null&&(!Number.isFinite(a.timeMinutes)||a.timeMinutes<0||a.timeMinutes>10080))throw Error('行动时间无效');refs(a.fieldRefs,fieldIds,'字段');refs(a.sourceIds,new Set(sources.keys()),'来源');}
  const needs=data.informationNeeds??[], alternatives=data.alternatives??[];
  requireList(needs,'信息清单',5);requireList(alternatives,'待探索方向',2);
  const ordered=(xs,label)=>{if(xs.some((x,i)=>x.priority!==i+1))throw Error(label+'优先顺序无效');};
  ordered(needs,'信息清单');
  for(const n of needs){if(['question','why','whereToCheck','doneWhen','ifThen'].some(k=>!safeStrings(n[k])||!n[k].trim()))throw Error('信息清单不完整');refs(n.fieldRefs,fieldIds,'字段');refs(n.ruleRefs,ruleIds,'规则');if(!n.fieldRefs.length&&!n.ruleRefs.length)throw Error('信息清单缺少依据');}
  for(const a of alternatives){if(a.status!=='hypothesis'||['title','reason','firstCheck'].some(k=>!safeStrings(a[k])||!a[k].trim()))throw Error('待探索方向格式无效');requireList(a.unknowns,'方向待核实项',5);if(!a.unknowns.length||a.unknowns.some(x=>!safeStrings(x)))throw Error('待探索方向缺少核实项');refs(a.fieldRefs,fieldIds,'字段');if(!a.fieldRefs.length)throw Error('待探索方向缺少本人需求依据');}
  if(data.actions.some(a=>a.priority!==undefined)){ordered(data.actions,'行动');for(const a of data.actions){if(!safeStrings(a.whyFirst)||!a.whyFirst.trim())throw Error('行动缺少优先理由');requireList(a.dependsOn,'前序行动',4);if(a.dependsOn.some(p=>!Number.isInteger(p)||p<1||p>=a.priority)||new Set(a.dependsOn).size!==a.dependsOn.length)throw Error('行动依赖无效');}}
  if(data.questions.some(q=>!safeStrings(q)))throw Error('追问文字无效');
  const jobEvidence=data.jobEvidence??[];requireList(jobEvidence,'岗位原文对照',6);
  const normalized=s=>String(s||'').replace(/\s+/g,' ').trim();
  for(const e of jobEvidence){
    const p=context.paths?.find(p=>p.id===e.pathId),o=p?.opportunities.find(o=>o.id===e.opportunityId);
    if(!o||!safeStrings(e.quote,300)||e.quote.trim().length<2||!normalized(o.sourceText).includes(normalized(e.quote)))throw Error('岗位引用不在本次提供的原文中');
    if(['interpretation','question'].some(k=>!safeStrings(e[k])||!e[k].trim()))throw Error('岗位对照缺少解释或待查问题');
    refs(e.fieldRefs,fieldIds,'字段');if(!e.fieldRefs.length)throw Error('岗位对照缺少本人输入依据');
  }
  for(const f of data.factRefs)if(!sources.get(f.sourceId)?.facts?.some(x=>x.id===f.factId))throw Error('模型引用了未知事实');
  return {jobEvidence,informationNeeds:needs,alternatives,summary:data.summary,observations:data.observations,explorations:data.explorations,actions:data.actions,questions:data.questions,facts:data.factRefs.map(f=>({sourceId:f.sourceId,...sources.get(f.sourceId).facts.find(x=>x.id===f.factId)})),verification:'引用和结构已检查；自由文本仍为待核查的AI建议，不自动构成外部事实核验。'};
}
