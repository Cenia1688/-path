export const SKILL_GROUPS=[
 {id:'language',label:'语言与沟通',options:['英语（读写）','英语（听说交流）','其他外语','中文写作 / 口头表达']},
 {id:'tools',label:'信息技术与工具',options:['办公软件（Word / Excel / PPT）','统计 / 数据分析（SPSS / Stata / Excel 数据）','编程 / 数据处理（Python / R 等）','设计 / 多媒体（剪辑 / 排版 / 制图等）']},
 {id:'certificates',label:'专业证书 / 执照',options:['语言类证书（四六级 / 雅思 / 托福等）','教师 / 教育类证书','财会 / 法律 / 医疗等执业资格','软件 / 职业认证']},
 {id:'experience',label:'研究 / 实践经历',options:['科研 / 论文写作经历','实习 / 工作实践','学生工作 / 社团','志愿服务 / 社会实践','竞赛 / 项目获奖']}
];
const allowed=new Map(SKILL_GROUPS.map(g=>[g.id,g.options]));
export function skillForm(profile){
 if(!profile.skillsForm){const a=profile.answers['profile.skills'];profile.skillsForm={version:1,selected:{},other:{general:a?.status==='answered'?String(a.value):''},otherEnabled:{general:a?.status==='answered'&&!!a.value}};}
 return profile.skillsForm;
}
export function serializeSkills(profile){
 const f=skillForm(profile),parts=[];
 for(const g of SKILL_GROUPS){const items=(f.selected[g.id]||[]).filter(v=>g.options.includes(v));if(f.otherEnabled[g.id]&&f.other[g.id]?.trim())items.push('其他：'+f.other[g.id].trim());if(items.length)parts.push(g.label+'：'+items.join('、'));}
 if(f.otherEnabled.general&&f.other.general?.trim())parts.push('其他：'+f.other.general.trim());
 const text=parts.join('；');profile.answers['profile.skills']=text?{status:'answered',value:text}:{status:'unanswered',value:null};return text;
}
export function selectSkill(profile,group,option,checked){if(!allowed.get(group)?.includes(option))return;const f=skillForm(profile),list=f.selected[group]||[];f.selected[group]=checked?[...new Set([...list,option])]:list.filter(v=>v!==option);serializeSkills(profile);}
export function enableSkillOther(profile,group,enabled){if(group!=='general'&&!allowed.has(group))return;skillForm(profile).otherEnabled[group]=enabled;serializeSkills(profile);}
export function editSkillOther(profile,group,text){if(group!=='general'&&!allowed.has(group))return;const f=skillForm(profile);f.other[group]=text;if(group==='general')f.otherEnabled.general=!!text.trim();serializeSkills(profile);}
