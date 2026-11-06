import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {emptyState,newPath,newOpportunity,answer,analyze} from '../lib/engine.mjs';
import {renderOverview} from '../public/result-overview.mjs';
const fields=JSON.parse(await fs.readFile(new URL('../public/config/fields.json',import.meta.url),'utf8'));
test('填写概览保留排名顺序，不以空答代替中立，不虚构图表',()=>{const s=emptyState(),p=newPath();s.paths.push(p);s.profile.answers['profile.valueRank']=answer(['v5','v4','v1','v7','v2','v3','v6']);p.answers['path.interest']=answer(3);p.answers['path.taskSE']={status:'unknown',value:null};const h=renderOverview(s.profile,p,fields,analyze(s,undefined,fields));assert.ok(h.indexOf('社会贡献')<h.indexOf('家庭责任'));assert.match(h,/一般（3\/5）/);assert.match(h,/暂不清楚/);assert.doesNotMatch(h,/<canvas|<svg|成功率|<script/);});
test('填写概览使用现有规则对照时间和预算，零费用有效，内容安全转义',()=>{const s=emptyState(),p=newPath('<img src=x>');s.paths.push(p);const o=newOpportunity();o.title='<script>test</script>';o.requiredHours=16;o.cost=0;o.budget=300;p.opportunities.push(o);p.task='<b>测试</b>';p.answers['path.availableHours']=answer(6);const h=renderOverview(s.profile,p,fields,analyze(s,undefined,fields));assert.match(h,/相差10小时\/周/);assert.match(h,/可用300CNY\/项目总计，要求0/);assert.match(h,/&lt;script&gt;/);assert.doesNotMatch(h,/<script>|<img |<b>/);});
test('缺少机会资料不画虚构对照，修改输入后本地重新计算',()=>{const s=emptyState(),p=newPath();s.paths.push(p);let h=renderOverview(s.profile,p,fields,analyze(s,undefined,fields));assert.match(h,/暂时无法对照/);const o=newOpportunity();o.requiredHours=16;o.cost=10;o.budget=20;p.opportunities.push(o);p.answers['path.availableHours']=answer(20);h=renderOverview(s.profile,p,fields,analyze(s,undefined,fields));assert.match(h,/可用20小时\/周/);assert.doesNotMatch(h,/相差/);});
