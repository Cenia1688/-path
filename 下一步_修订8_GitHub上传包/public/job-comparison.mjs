const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function resolveOpportunityObject(path,scope){
  if(scope==='opp')return path.opportunities[0];
  const [kind,oid,rid]=scope.split(':');
  if(kind==='opp')return path.opportunities.find(o=>o.id===oid);
  if(kind==='req'&&rid)return path.opportunities.find(o=>o.id===oid)?.requirements.find(r=>r.id===rid);
  if(kind==='req')return path.opportunities[0]?.requirements[Number(oid)];
}
export function renderJobComparison(path,report){
  const rows=(report.comparisons||[]).filter(c=>c.pathId===path.id);
  if(rows.length<2)return '';
  const status=s=>({conflict:'当前有冲突',reported_match:'填写数值可支持',unknown:'待确认',not_applicable:'不适用'}[s]||'待确认');
  return `<section class="job-comparison"><h2>这几个机会，区别在哪里？</h2><p class="hint">按你填写的条件逐项对照。没有总分；缺少的信息仍需查清。</p><div class="comparison-scroll"><table class="overview-table"><caption>同一路径下的具体机会</caption><thead><tr><th scope="col">机会</th><th scope="col">时间</th><th scope="col">预算</th><th scope="col">当前未满足的资格</th><th scope="col">资料</th></tr></thead><tbody>${rows.map(c=>`<tr><th scope="row">${esc(c.title)}</th><td>${esc(status(c.time.status))}</td><td>${esc(status(c.budget.status))}</td><td>${esc(c.checks.filter(x=>x.status==='conflict').map(x=>x.label).join('、')||(c.checks.some(x=>x.status==='unknown')?'仍有资格待确认':c.checks.length?'未报告不满足项；个人证明仍待核验':'尚未列出逐项要求'))}</td><td>${esc(c.verifiedRequirementSource?'要求有审核来源；个人证明仍待核验':c.sourceText?'已填原文或链接，尚未核验':'尚无原文')}</td></tr>`).join('')}</tbody></table></div></section>`;
}
export function renderJobEvidence(ai,path){
  const evidence=(ai?.jobEvidence||[]).filter(e=>e.pathId===path.id&&path.opportunities.some(o=>o.id===e.opportunityId));
  if(!evidence.length)return '';
  return `<section><h2>对照你提供的岗位信息</h2><p class="hint">摘录与你粘贴的文字核对过，原材料和AI解释尚未外部核实。</p>${evidence.map(e=>`<article><h3>${esc(path.opportunities.find(o=>o.id===e.opportunityId).title)}</h3><blockquote>${esc(e.quote)}</blockquote><p>${esc(e.interpretation)}</p><p>还需确认：${esc(e.question)}</p></article>`).join('')}</section>`;
}
