// Adapted from lieflat-charts, F12 Dumbbell Queue (basics-gallery.html).
// PolyForm Noncommercial 1.0.0; attribution and replacement notes: config/presentation-skills/README.md.
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function renderConditionChart(label,check){
 const m=check?.measurement;
 if(!m||![m.available,m.required].every(v=>typeof v==='number'&&Number.isFinite(v)&&v>=0))return '';
 const max=Math.max(m.available,m.required,1),x=v=>30+v/max*420;
 const text=`${label}：你可用 ${m.available}，机会要求 ${m.required}（${m.unit}）`;
 // Retain paired markers and track; omit decorative beads and animation.
 // Exact values remain in text; each chart uses its own zero-based scale.
 return `<figure class="condition-chart"><figcaption>${esc(text)}</figcaption><svg viewBox="0 0 480 86" role="img" aria-label="${esc(text)}"><title>${esc(text)}</title><line x1="30" y1="32" x2="450" y2="32" stroke="#d8dfda" stroke-width="2"/><line x1="${x(m.available)}" y1="32" x2="${x(m.required)}" y2="32" stroke="#75867e" stroke-width="3"/><circle cx="${x(m.available)}" cy="32" r="8" fill="white" stroke="#245e4e" stroke-width="3"/><circle cx="${x(m.required)}" cy="32" r="4" fill="#245e4e"/><text x="30" y="65" font-size="13" fill="#52645b">0</text><text x="450" y="65" text-anchor="end" font-size="13" fill="#52645b">${esc(max)} ${esc(m.unit)}</text></svg><p class="hint">空心圈：你可用的；实心点：机会要求的。${esc(m.source)}。${check.status==='conflict'?'当前这项条件有冲突。':'这里只对照数值，不代表能够录取或适合这条路。'}</p></figure>`;
}
