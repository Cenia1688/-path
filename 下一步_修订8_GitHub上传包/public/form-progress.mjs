const requiredAnswers=['profile.major','profile.year','profile.valueRank','path.interest','path.taskSE','path.processSE','path.copingSE','path.commitment'];
export function formProgress(profile,path){
  if(!path)return 0;
  const done=requiredAnswers.filter(key=>{
    const a=(key.startsWith('profile.')?profile:path)?.answers?.[key];
    return a?.status==='answered' && (Array.isArray(a.value)?a.value.length===7:a.value!==null && a.value!==undefined && String(a.value).trim()!=='');
  }).length;
  return (done+Number(!!path.title?.trim()&&path.title!=='新的探索路径')+Number(!!path.task?.trim()))*10;
}
export const crossedMilestones=(before,after)=>[30,60,100].filter(n=>before<n&&after>=n);
