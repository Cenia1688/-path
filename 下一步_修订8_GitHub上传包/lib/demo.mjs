import {emptyState,newPath,newOpportunity,answer,capture,id} from './engine.mjs';
export function demoBundle() {
  const state=emptyState(true);
  state.profile.answers={'profile.major':answer('2'),'profile.year':answer('2'),'profile.valueRank':answer(['v3','v2','v5','v1','v4','v6','v7']),'profile.moneyBand':answer('K经济区间-03'),'profile.skills':answer('演示：做过课程文献整理，尚未完成独立访谈。'),'profile.noRelocation':answer('yes')};
  for(let i=1;i<=7;i++) state.profile.answers[`profile.values.v${i}`]=answer(i===3?5:3);
  const p=newPath('演示：课题调研助理'); p.task='整理一份匿名访谈摘要'; p.category='科研助理'; p.cardId='demo-research';
  p.answers={'path.availableHours':answer(6),'path.taskSE':answer(2),'path.processSE':answer(2),'path.copingSE':answer(3),'path.interest':answer(4),'path.entryJudgment':answer('uncertain'),'path.entryReason':answer('演示：不清楚从哪里联系项目。'),'path.channels':answer(['Z机会来源-05'])};
  const o=newOpportunity();o.title='演示机会A：每周12小时的调研任务';o.cardId='demo-research';o.requiredHours=12;o.budget=200;o.cost=100;o.currency='CNY';o.requirements=[{id:id(),criterionId:'demo-student',label:'在读本科生',userStatus:'meets',evidence:'演示：在读身份自报',future:''}]; p.opportunities.push(o);
  p.goals.push({id:id(),title:'了解并体验一个小型调研任务',type:'action',commitment:4,deadline:'',precision:'day',state:'planned'});
  state.paths.push(p);
  const old=capture(state,'演示基线');old.at='2026-10-10T09:00:00.000Z';
  state.events.push({id:id(),pathId:p.id,type:'科研任务',title:'演示：完成课程访谈练习',date:'2026-10-15',precision:'day',actionType:'准备',experienceType:'科研经历',occurrence:'yes',task:p.task,participation:'独立执行',performance:'演示：摘要完成，证据与评价仍有混淆。',feedback:'演示反馈：请将受访者描述与自己的解释分开。',feedbackSource:'演示指导者',interpretation:'演示：可以通过修改改善摘要，不推广为整个职业结论。',change:'任务信心由2变3，兴趣维持4。',basis:'演示前后记录；不代表因果识别。',response:'yes',interview:'not_applicable',offer:'not_applicable',entered:'not_applicable'});
  p.answers['path.taskSE']=answer(3);
  const recent=capture(state,'演示任务后');recent.at='2026-10-16T09:00:00.000Z';
  const knowledge={sources:[{id:'DEMO-S1',title:'虚构的演示要求，不是真实招募',status:'demo',checkedAt:'2026-10-10',facts:[{id:'DEMO-F1',text:'演示项目要求每周12小时。'}]}],cards:[
    {id:'demo-research',title:p.title,status:'demo',majors:['哲学','社会学','思想政治教育'],context:'虚构的校内研究任务情境',tasks:['整理匿名材料','按标准提交摘要'],outputs:['一份可讨论的摘要'],sourceId:'DEMO-S1',requirements:[{id:'demo-student',label:'在读本科生'}],conditions:{requiredHours:12,hoursPeriod:'week',cost:100,costPeriod:'total',currency:'CNY'},channels:['演示的校内项目公告'],support:'演示：具体修改反馈',region:'虚构',applicableAt:'演示',checkedAt:'2026-10-10',differences:'不同团队任务和监督方式可能不同，本卡仅演示。',lowCostTask:'演示：完成一份匿名摘要，并记录修改反馈。'},
    {id:'demo-content',title:'演示：公共议题内容整理',status:'demo',majors:['哲学','社会学','思想政治教育'],context:'虚构的内容工作情境',tasks:['检索公开材料','核对来源','整理说明'],outputs:['一份有出处的短文'],sourceId:'DEMO-S1',requirements:[],conditions:{},channels:[],support:'待核实',region:'虚构',applicableAt:'演示',checkedAt:'2026-10-10',differences:'只是另一种任务情境，不是职业适合推荐。',lowCostTask:'演示：选一个公开议题，整理三条有出处的信息并请人指出不清楚的地方。'}
  ]};
  return {state,knowledge};
}
