import {renderConditionChart} from './condition-charts.mjs';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const read=(a,k)=>a?.[k]?.status==='answered'?a[k].value:null;
const status=a=>({unknown:'暂不清楚',unanswered:'未填写',not_applicable:'不适用',declined:'未作答'}[a?.status]||'未填写');
const table=(label,headers,rows)=>`<table class="overview-table"><caption>${esc(label)}</caption><thead><tr>${headers.map(h=>`<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map((c,i)=>i===0?`<th scope="row">${esc(c)}</th>`:`<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
export function renderOverview(profile,path,fields,report){
 const map=new Map(fields.map(f=>[f.id,f]));
 const rank=read(profile.answers,'profile.valueRank');
 const values=Array.isArray(rank)&&rank.length===7?table('你目前的价值排序',['顺序','看重的方面'],rank.map((v,i)=>[i+1,map.get('profile.valueRank')?.options.find(o=>o.value===v)?.label||v])):'<p>价值排序尚未填完整。</p>';
 const names=[['path.interest','对这个任务的兴趣'],['path.taskSE','完成这个任务的把握'],['path.processSE','搜集信息、联系和申请的把握'],['path.copingSE','遇到困难后调整和继续的把握'],['path.commitment','投入这条路的意愿']];
 const ratings=table('对当前任务和路径的看法',['问题','你的回答'],names.map(([k,label])=>{const a=path.answers[k],v=read(path.answers,k),option=map.get(k)?.options.find(o=>o.value===v);return [label,option?option.label.replace(/^\d+\s*[·=]?\s*/,'')+`（${v}/5）`:status(a)];}));
 const comparisons=(report.comparisons||[]).filter(c=>c.pathId===path.id);
 const conditions=comparisons.length?comparisons.map(c=>{
  const rows=[['时间',c.time.text],['预算',c.budget.text],...c.checks.map(x=>[x.label,`${{reported_match:'本人填写：已满足',conflict:'本人填写：未满足',unknown:'待确认',not_applicable:'不适用'}[x.status]||'待确认'}；${x.verification==='unverified'?'尚未外部核验':'要求有来源，个人证明仍待核验'}`])];
  const others=(report.findings||[]).filter(f=>f.pathId===path.id&&f.opportunityId===c.opportunityId&&f.rule==='bottom-line');
  for(const f of others)rows.push(['个人不能接受的条件',f.text]);
  return `<h4>${esc(c.title)}</h4><div class="condition-charts">${renderConditionChart('时间',c.time)}${renderConditionChart('预算',c.budget)}</div>`+table(c.title,['对照项','当前记录与对照'],rows);
 }).join(''):'<p>还没有填写具体项目或岗位，暂时无法对照时间、预算和资格。</p>';
 return `<section class="answer-overview" aria-label="你的填写概览"><h2>你的填写概览</h2><p class="hint">以下来自当前填写，不是AI评分。排序只表示先后；五档回答不相加，也不换算成职业结论。</p>${values}<p><strong>当前任务：</strong>${esc(path.task||'尚未填写')}</p>${ratings}<h3>具体机会的条件对照</h3>${conditions}<p class="hint">资料来源见各项说明。修改填写后，这里的对照会更新；下方已保存的建议不会自动重写。</p></section>`;
}
