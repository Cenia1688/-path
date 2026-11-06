export const VERSION = '1.0.0';
export const ANSWER_STATES = ['answered','unknown','unanswered','not_applicable','declined'];
export const id = () => globalThis.crypto.randomUUID();
export const now = () => new Date().toISOString();
export const answer = value => ({ status: 'answered', value });
export const value = (answers, key) => answers?.[key]?.status === 'answered' ? answers[key].value : null;
export const nonempty = v => v !== null && v !== undefined && v !== '';
export function emptyState(demo=false) {
  return {version:VERSION,demo,profile:{id:id(),answers:{}},paths:[],events:[],snapshots:[],reports:[],customCards:[],savedActions:[]};
}
export function newPath(title='新的探索路径') {
  return {id:id(),title,category:'',status:'exploring',task:'',answers:{},goals:[],opportunities:[],knowledge:[]};
}
export function newOpportunity() {
  return {id:id(),title:'待了解的具体机会',cardId:'',sourceId:'',requirements:[],requiredHours:null,hoursPeriod:'week',availableHours:null,availableHoursPeriod:'week',cost:null,costPeriod:'total',budget:null,budgetPeriod:'total',currency:'CNY',budgetCurrency:'CNY',income:null,incomePeriod:'month',location:'',relocation:'unknown',sourceText:''};
}
export function dateValid(text, precision='day') {
  if (!text) return true;
  if (precision==='year') return /^\d{4}$/.test(text) && +text>1900 && +text<2200;
  if (precision==='month') return /^\d{4}-(0[1-9]|1[0-2])$/.test(text);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return false;
  const d = new Date(text+'T00:00:00Z');
  return !Number.isNaN(+d) && d.toISOString().slice(0,10)===text;
}
export function validateState(state, fields=[]) {
  const errors=[];
  if (!state || state.version!==VERSION || typeof state.demo!=='boolean') return ['文件版本或模式不正确'];
  if (!state.profile?.id || !state.profile.answers || typeof state.profile.answers!=='object') errors.push('缺少个人资料');
  for (const name of ['paths','events','snapshots','reports','customCards','savedActions']) if (!Array.isArray(state[name])) errors.push(`${name}应为列表`);
  if (errors.length) return errors;
  if (state.paths.length>40 || state.events.length>1000 || state.snapshots.length>300 || state.reports.length>100) errors.push('记录过多，请拆分归档');
  const pathIds = new Set();
  const opportunityIds=new Set(),requirementIds=new Set();
  for (const p of state.paths) {
    if(!p||typeof p!=='object'){errors.push('路径必须是对象');continue;}
    if (!p.id || pathIds.has(p.id)) errors.push('路径ID缺失或重复'); pathIds.add(p.id);
    if (typeof p.title!=='string' || !p.answers || !Array.isArray(p.opportunities)||!Array.isArray(p.goals)||!Array.isArray(p.knowledge)) errors.push('路径结构不完整');
    if(p.opportunities?.length>10)errors.push('每条路径最多保留10个机会');
    for(const o of p.opportunities||[]) {
      if(!o.id || !Array.isArray(o.requirements)) errors.push('机会结构不完整');
      if(opportunityIds.has(o.id))errors.push('机会ID重复');opportunityIds.add(o.id);
      if(o.sourceText!=null&&(typeof o.sourceText!=='string'||o.sourceText.length>12000))errors.push('机会原文最多12000字');
      for(const r of o.requirements||[]){if(!r.id||requirementIds.has(r.id))errors.push('资格要求ID重复或缺失');requirementIds.add(r.id);}
      for(const k of ['requiredHours','availableHours','cost','budget','income']) if(nonempty(o[k]) && (typeof o[k]!=='number'||!Number.isFinite(o[k])||o[k]<0)) errors.push(`机会${k}须为非负数`);
      if(o.requiredHours>168 && o.hoursPeriod==='week') errors.push('每周要求不能超过168小时');
      if(o.availableHours>168 && o.availableHoursPeriod==='week') errors.push('每周可用不能超过168小时');
      if(o.deadline && !dateValid(o.deadline)) errors.push('机会截止日期无效');
    }
    for(const g of p.goals||[]) if(g.deadline && !dateValid(g.deadline,g.precision)) errors.push('目标日期与精度不符');
  }
  const eventIds=new Set();
  for(const e of state.events) {
    if(!e||typeof e!=='object'){errors.push('事件必须是对象');continue;}
    if(!e.id||eventIds.has(e.id)) errors.push('事件ID重复或缺失'); eventIds.add(e.id);
    if(!pathIds.has(e.pathId)) errors.push('事件对应路径不存在');
    if(!dateValid(e.date,e.precision)) errors.push('事件日期与精度不符');
  }
  for(const s of state.snapshots){if(!s?.id||typeof s.at!=='string'||!s.profile?.answers||!Array.isArray(s.paths)||s.paths.some(p=>!p?.id||!p.answers))errors.push('历史快照结构不完整');}
  if(errors.length)return [...new Set(errors)];
  const fMap=new Map(fields.map(f=>[f.id,f]));
  for(const a of [state.profile.answers,...state.paths.map(p=>p.answers)]) {
    for(const [key,entry] of Object.entries(a||{})) {
      const f=fMap.get(key);
      if(!ANSWER_STATES.includes(entry?.status)) {errors.push(`${key}回答状态无效`);continue;}
      if(entry.status!=='answered') continue;
      const v=entry.value;
      if(!nonempty(v)) { errors.push(`${key}已回答但没有值`); continue; }
      if(!f) continue;
      if(f.kind==='number' && (typeof v!=='number'||!Number.isFinite(v)||(f.min!=null&&v<f.min)||(f.max!=null&&v>f.max))) errors.push(`${f.label}数值无效`);
      if(f.kind==='rank' && (!Array.isArray(v)||v.length!==7||new Set(v).size!==7||v.some(x=>!f.options.some(o=>o.value===x)))) errors.push('价值排序必须是7项完整且无重复的排列');
      if(f.kind==='multi' && (!Array.isArray(v)||new Set(v).size!==v.length||v.some(x=>!f.options.some(o=>o.value===x)))) errors.push(`${f.label}多选值无效`);
      if(f.kind==='select' && !f.options.some(o=>o.value===v)) errors.push(`${f.label}选项无效`);
    }
  }
  return [...new Set(errors)];
}
export function capture(state, label='本次测量') {
  const snapshot={id:id(),at:now(),label,profile:structuredClone(state.profile),paths:structuredClone(state.paths),eventIds:state.events.map(e=>e.id),demo:state.demo};
  state.snapshots.push(snapshot); return snapshot;
}
function trustedSources(knowledge, demo) {
  return new Map((knowledge.sources||[]).filter(s=>demo?s.status==='demo':s.status==='reviewed'&&s.url&&s.checkedAt).map(s=>[s.id,s]));
}
export function analyze(state, knowledge={cards:[],sources:[]}, fields=[]) {
  const sources=trustedSources(knowledge,state.demo);
  const allowedCards=(knowledge.cards||[]).filter(c=>state.demo?c.status==='demo':c.status==='reviewed');
  const findings=[], comparisons=[], gaps=[], actions=[], questions=[];
  const find=(path,opp,rule,status,text,refs=[],sourceIds=[])=>{
    const f={id:`${rule}:${path.id}:${opp?.id||'path'}:${findings.length}`,pathId:path.id,opportunityId:opp?.id||null,rule,status,text,fieldRefs:refs,sourceIds,verification:sourceIds.length?'source-backed':'self-reported'};
    findings.push(f); if(status==='unknown'||status==='conflict') gaps.push(f); return f;
  };
  for(const p of state.paths) {
    if(!p.task&&(nonempty(value(p.answers,'path.taskSE'))||nonempty(value(p.answers,'path.interest'))))find(p,null,'task-context','unknown','任务信心或兴趣尚未指向具体任务，请先写清楚评价的对象；不解释为整个职业的能力或兴趣。',['path.taskSE','path.interest']);
    if(!p.opportunities.length) find(p,null,'source-gap','unknown','尚未添加具体机会。先找一份具体招募或招生材料，再核对要求。',['path.channels']);
    for(const original of p.opportunities) {
      const card=allowedCards.find(c=>c.id===original.cardId);
      const source=card&&sources.get(card.sourceId);
      const trusted=!!source;
      // The client cannot confer external verification on its own cards or fields.
      const o=trusted?{...original,...card.conditions,requirements:original.requirements}:original;
      const sourceIds=source?[source.id]:[];
      if(!trusted) find(p,o,'source-gap','unknown','该机会尚无团队审核的外部资料；以下对照基于自填信息，不能视为客观已核实。',[],[]);
      const checks=[];
      for(const r of o.requirements||[]) {
        const backed=trusted && (card.requirements||[]).some(x=>x.id===r.criterionId&&x.label===r.label);
        const s=r.userStatus==='not_meets'?'conflict':r.userStatus==='meets'?'reported_match':r.userStatus==='not_applicable'?'not_applicable':'unknown';
        checks.push({label:r.label||'未命名条件',status:s,evidence:r.evidence||'',verification:backed?'requirement-source-backed / personal-evidence-unreviewed':'unverified',future:r.future||''});
        if(s!=='not_applicable') find(p,o,'eligibility',s,`${r.label||'该条件'}：${s==='reported_match'?'本人自报当前满足，个人证明尚未由外部核验':s==='conflict'?'本人自报当前未满足'+(r.future?'；后续补足计划不改变当前状态':''):'尚待核实'}`,[],backed?sourceIds:[]);
      }
      if(!checks.length) find(p,o,'eligibility','unknown','尚未列出逐项资格要求。',[],sourceIds);
      function compare(rule, available, required, same, unit, refs=[]) {
        if(!nonempty(available)||!nonempty(required)||!same) return find(p,o,rule,'unknown',`暂不能比较${rule==='time'?'时间':'预算'}：请补准确数值，并确认单位及时间范围一致。`,refs,sourceIds);
        const conflict=available<required;
        const result=find(p,o,rule,conflict?'conflict':'reported_match',`${rule==='time'?'时间':'预算'}：可用${available}${unit}，要求${required}${unit}${conflict?`，相差${+(required-available).toFixed(2)}${unit}`:'；本项未发现数值冲突'}。${trusted?'要求来自资料卡，个人情况为自报。':'双方数值均未外部核实。'}`,refs,sourceIds);
        result.measurement={available,required,unit,source:trusted?'要求来自团队资料卡；个人条件为自报':'双方数值来自填写，未经外部核验'};
        return result;
      }
      const available=nonempty(o.availableHours)?o.availableHours:value(p.answers,'path.availableHours');
      const availablePeriod=nonempty(o.availableHours)?o.availableHoursPeriod:'week';
      const time=compare('time',available,o.requiredHours,availablePeriod===o.hoursPeriod,o.hoursPeriod==='week'?'小时/周':o.hoursPeriod==='month'?'小时/月':'小时/总计',['path.availableHours']);
      const budget=compare('budget',o.budget,o.cost,o.budgetPeriod===o.costPeriod&&o.budgetCurrency===o.currency,`${o.currency||'CNY'}/${o.costPeriod==='month'?'月':o.costPeriod==='week'?'周':'项目总计'}`);
      if(value(state.profile.answers,'profile.noRelocation')==='yes' && o.relocation==='yes') find(p,o,'bottom-line','conflict','机会要求迁移，与本人当前确认的“不接受异地迁移”底线冲突。请本人决定是否重新讨论。',['profile.noRelocation'],sourceIds);
      const min=value(state.profile.answers,'profile.minIncome');
      if(nonempty(min)&&nonempty(o.income)&&o.incomePeriod==='month'&&o.currency==='CNY'&&o.income<min) find(p,o,'bottom-line','conflict',`自填月收入${o.income}元低于本人确认的月收入底线${min}元。`,['profile.minIncome'],sourceIds);
      comparisons.push({pathId:p.id,pathTitle:p.title,opportunityId:o.id,title:o.title,sourceIds,demo:state.demo,checks,time,budget,task:card?.tasks||[],outputs:card?.outputs||[],location:o.location||'待补充',sourceText:o.sourceText||'',verifiedRequirementSource:trusted});
    }
    const theseEvents=state.events.filter(e=>e.pathId===p.id);
    for(const goal of p.goals) {
      if(goal.deadline && goal.precision==='day' && goal.deadline<now().slice(0,10) && goal.state!=='done') find(p,null,'goal-action','unknown',`目标「${goal.title}」已到原定日期，尚未记录完成情况。`,[]);
    }
    if(p.goals.length&&!theseEvents.length) questions.push({pathId:p.id,text:'已经记录目标，但还没有行动记录：是尚未开始、已经行动未记录，还是遇到了其他限制？'});
    if(!p.knowledge.length) questions.push({pathId:p.id,text:'你对这条路最没有把握的一个事实是什么？可以先记录，再寻找出处。'});
    if(!theseEvents.length) actions.push({id:`explore:${p.id}`,pathId:p.id,title:'用一个具体任务了解这条路',purpose:'补充对日常任务的认识',steps:['找一份具体岗位或项目说明，圈出实际任务。','选择一项小任务，和有经验的人确认完成标准。','记录做过什么、遇到什么困难、收到什么具体反馈。'],timeMinutes:null,deliverable:'一份任务记录和待核实问题',reviewQuestions:['兴趣、信心或路径认识有没有变化？','这次经历能说明什么，不能说明什么？'],sourceIds:[],kind:'exploration-hypothesis'});
  }
  for(const p of state.paths){
    const issues=findings.filter(f=>f.pathId===p.id);
    const timeIssue=issues.find(f=>f.rule==='time'&&f.status==='conflict');
    const sourceIssue=issues.find(f=>f.rule==='source-gap');
    if(timeIssue)actions.unshift({id:`time:${p.id}`,pathId:p.id,title:'先确认时间要求能否调整',purpose:timeIssue.text,steps:['回到该机会的原始要求，确认每周时数、到场安排及是否可协商。','列出自己能提供的准确时间，再向负责者询问可否调整任务或参与形式。','若无法调整，保留当前时间冲突，比较其他具体机会。'],timeMinutes:20,deliverable:'一份确认过的时间安排或仍待答复的问题',reviewQuestions:['要求和可用时间的范围是否一致？','调整已得到确认，还是仍是自己的设想？'],sourceIds:timeIssue.sourceIds,kind:'exploration-hypothesis'});
    else if(sourceIssue)actions.unshift({id:`source:${p.id}`,pathId:p.id,title:'找一份具体机会的原始材料',purpose:'把自填印象和可核对要求分开',steps:['找到该机会当期的官方公告或项目说明。','记录任务、资格、申请方式、日期和来源链接。','将仍不清楚的内容列成询问清单。'],timeMinutes:30,deliverable:'一张附来源的机会资料卡',reviewQuestions:['哪些是原文要求，哪些只是我的理解？','这份材料适用于哪个地区和批次？'],sourceIds:[],kind:'exploration-hypothesis'});
    else if(!actions.some(a=>a.pathId===p.id))actions.push({id:`review:${p.id}`,pathId:p.id,title:'选一条具体反馈做复盘',purpose:'区分任务表现、解释和对整条路径的判断',steps:['找出最近一次任务和具体评价标准。','分别写下实际反馈、自己的解释及其他可能解释。','决定下一轮要核实或体验的一个问题。'],timeMinutes:20,deliverable:'一份反馈复盘与待验证的问题',reviewQuestions:['哪些认识改变或保持不变？','是否把一次经历推广得过远？'],sourceIds:[],kind:'exploration-hypothesis'});
  }
  const selected=new Set(state.paths.flatMap(p=>[p.cardId,...p.opportunities.map(o=>o.cardId)]).filter(Boolean));
  const expansions=allowedCards.filter(c=>!selected.has(c.id)&&!state.paths.some(p=>p.title===c.title)).slice(0,2).map(c=>({cardId:c.id,title:c.title,reason:'这是资料库中另一个可比较的具体任务情境；供你选择是否进一步了解，不代表适合度判断。',nextStep:c.lowCostTask||'先阅读来源，核对任务、要求和适用时间。',sourceIds:c.sourceId?[c.sourceId]:[],demo:c.status==='demo'}));
  const valueNames={v1:'安全稳定',v2:'自主独立',v3:'成长发展',v4:'家庭责任',v5:'社会贡献',v6:'物质报酬',v7:'兴趣性格匹配'};
  const rank=value(state.profile.answers,'profile.valueRank');
  const priorities=Array.isArray(rank)?rank.slice(0,3).map(k=>valueNames[k]):[];
  return {id:id(),at:now(),dataMode:state.demo?'demo':'personal',mode:'mock',summary:`当前记录了${state.paths.length}条路径、${state.events.length}次事件。${priorities.length?'你当前确认优先考虑'+priorities.join('、')+'。':''}以下结合你填写的条件提供对照与探索建议，不估计职业适合度或录取概率。`,priorities,findings,comparisons,informationGaps:gaps,explorations:expansions,actions,questions,sourceIds:[...new Set(findings.flatMap(f=>f.sourceIds))],sources:[...sources.values()],networkSearch:false,ai:null};
}
export function knowledgeCheck(claim, knowledge) {
  const source=(knowledge.sources||[]).find(s=>s.id===claim.sourceId&&s.status==='reviewed'&&s.url&&s.checkedAt);
  const fact=source?.facts?.find(f=>f.id===claim.factId);
  if(!source||!fact) return {status:'unverified',text:'尚无审核过的标准答案；保留本人认识与待核实状态。'};
  const normalized=x=>String(x||'').trim().replace(/\s+/g,' ');
  if(!claim.answer) return {status:'unknown',text:'本人尚未回答；外部资料可供进一步了解。',sourceId:source.id,fact};
  if(!fact.acceptedAnswers) return {status:'reference_only',text:'已有参考材料，开放回答需人工核对，未自动判对错。',sourceId:source.id,fact};
  return {status:fact.acceptedAnswers.some(a=>normalized(a)===normalized(claim.answer))?'correct':'needs_review',text:'仅对照本题预设答案；不推广为整条路径的知识评分。',sourceId:source.id,fact};
}
export function exportRows(state, fields=[]) {
  const names=new Map(fields.map(f=>[f.id,f])); const rows=[];
  function add(answers,pathId='',eventId='',at=now(),snapshotId='current') {for(const [key,a] of Object.entries(answers||{})){const f=names.get(key); rows.push({studentId:state.profile.id,pathId,eventId,snapshotId,at,fieldId:key,theoryCode:f?.code||'',label:f?.label||key,status:a.status,value:a.status==='answered'?a.value:null,dataMode:state.demo?'demo':'personal'});}}
  add(state.profile.answers);state.paths.forEach(p=>add(p.answers,p.id));
  function addEntity(obj,prefix,pathId,eventId='',at=now(),code=''){for(const [k,v]of Object.entries(obj))if(k!=='id'&&k!=='pathId')rows.push({studentId:state.profile.id,pathId,eventId,snapshotId:'current',at,fieldId:`${prefix}.${k}`,theoryCode:code,label:`${prefix}.${k}`,status:nonempty(v)?'answered':'unanswered',value:v,dataMode:state.demo?'demo':'personal'});}
  for(const p of state.paths){
    addEntity({title:p.title,status:p.status,task:p.task},'path',p.id);
    p.goals.forEach(g=>addEntity(g,'goal',p.id,g.id,g.deadline||now(),'G'));
    p.opportunities.forEach(o=>{addEntity(o,'opportunity',p.id,o.id,now(),'H°/C/Z');o.requirements.forEach(r=>addEntity(r,'requirement',p.id,r.id,now(),'H°'));});
    p.knowledge.forEach(k=>addEntity(k,'knowledge',p.id,k.id,now(),'P'));
  }
  for(const s of state.snapshots){add(s.profile.answers,'','',s.at,s.id); s.paths.forEach(p=>add(p.answers,p.id,'',s.at,s.id));}
  for(const e of state.events) for(const [k,v] of Object.entries(e)) if(k!=='id'&&k!=='pathId') {const status=['occurrence','response','interview','offer','entered','contract'].includes(k)&&['unknown','unanswered','not_applicable','declined'].includes(v)?v:nonempty(v)?'answered':'unanswered';rows.push({studentId:state.profile.id,pathId:e.pathId,eventId:e.id,snapshotId:'event',at:e.date,fieldId:`event.${k}`,theoryCode:({performance:'R',feedback:'DiagnosticEvidence',actionType:'A',experienceType:'E',response:'Y',interview:'Y',offer:'Y',entered:'Y',contract:'Y'})[k]||'',label:k,status,value:status==='answered'?v:null,dataMode:state.demo?'demo':'personal'});}
  const sharedLabels={title:'名称',status:'状态',task:'具体任务',type:'类型',date:'发生时间',precision:'日期精度',deadline:'完成期限',commitment:'承诺程度',state:'进展状态',id:'唯一编号',count:'次数',hours:'投入小时数',response:'获得回应',interview:'获得面试',offer:'获得录取',entered:'实际进入',contract:'合同签订',performance:'任务表现R',feedback:'具体反馈',feedbackSource:'反馈来源',interpretation:'个人解释',change:'认识变化或维持',basis:'判断依据',actionType:'行动类型',experienceType:'经历类型',occurrence:'是否发生',participation:'参与程度',durationBand:'时长区间',question:'待核实问题',answer:'本人认识或回答',sourceId:'来源ID',factId:'标准事实ID',sourceText:'来源内容',check:'系统核验记录',requiredHours:'要求投入小时数',availableHours:'可用小时数',hoursPeriod:'要求时间范围',availableHoursPeriod:'可用时间范围',cost:'要求费用',budget:'个人预算',costPeriod:'费用范围',budgetPeriod:'预算范围',currency:'费用币种',budgetCurrency:'预算币种',income:'明确收入',incomePeriod:'收入时间范围',location:'地点',relocation:'是否要求迁移',requirements:'逐项资格要求',label:'条件名称',userStatus:'本人自报满足状态',evidence:'个人证明',future:'后续补足计划',criterionId:'标准条件ID',cardId:'关联资料卡ID'};
  for(const row of rows)if(row.label===row.fieldId||row.fieldId.startsWith('event.')){const key=row.fieldId.split('.').at(-1);row.label=sharedLabels[key]||row.label;}
  return rows;
}
