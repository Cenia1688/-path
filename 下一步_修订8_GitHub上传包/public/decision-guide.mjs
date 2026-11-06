const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function renderDecisionGuide(report){
 const needs=report.ai?.informationNeeds||[], alternatives=report.ai?.alternatives||[];
 const legacy=report.ai?.questions||report.questions?.map(q=>q.text)||[];
 return `<section class="decision-guide"><h2>还缺什么信息？按这个顺序查</h2>${needs.length?`<ol class="priority-list">${needs.map(n=>`<li><h3>${esc(n.question)}</h3><p>为什么先查：${esc(n.why)}</p><p>去哪里查、问谁：${esc(n.whereToCheck)}</p><p>查到这里就够了：${esc(n.doneWhen)}</p><p>接下来怎么选：${esc(n.ifThen)}</p></li>`).join('')}</ol>`:legacy.length?`<p class="hint">这份记录尚未生成完整查找步骤。以下保留原有追问。</p><ul>${legacy.map(q=>`<li>${esc(q)}</li>`).join('')}</ul>`:'<p>暂未列出额外问题；具体机会仍需以当期要求核对。</p>'}${alternatives.length?`<h2>还可以从这些方向找</h2><p class="hint">以下是值得核实的方向，目前没有确认具体项目或岗位条件。</p>${alternatives.map(a=>`<article><h3>${esc(a.title)}</h3><p>${esc(a.reason)}</p><p>先做这一步：${esc(a.firstCheck)}</p><ul>${a.unknowns.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></article>`).join('')}`:''}</section>`;
}
export function renderOrderedActions(actions){
 return `<section><h2>接下来做什么？按顺序来</h2><ol class="priority-list">${actions.map(a=>`<li><article><h3>${esc(a.title)}</h3>${a.whyFirst?`<p>先做它的原因：${esc(a.whyFirst)}</p>`:''}${a.dependsOn?.length?`<p class="hint">完成第 ${a.dependsOn.map(esc).join('、')} 步后再做。</p>`:''}<ol>${(a.steps||[]).map(s=>`<li>${esc(s)}</li>`).join('')}</ol><p>完成后留下：${esc(a.deliverable)}</p>${a.timeMinutes!=null?`<p class="hint">预计 ${esc(a.timeMinutes)} 分钟，可按实际调整。</p>`:''}${a.reviewQuestions?.length?`<p>做完后看看：</p><ul>${a.reviewQuestions.map(q=>`<li>${esc(q)}</li>`).join('')}</ul>`:''}</article></li>`).join('')}</ol></section>`;
}
