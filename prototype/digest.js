const escapeHtml = value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
export function digestPreview(jobs,{limit=10}={}) {
 const selected=jobs.filter(j=>j.status!=="dismissed"&&j.eligibility?.eligible!==false)
   .sort((a,b)=>(b.evaluation?.fitScore??b.ranking?.score??-1)-(a.evaluation?.fitScore??a.ranking?.score??-1))
   .slice(0,Math.min(50,Math.max(0,limit)));
 const rows=selected.map(j=>{
 const score=j.evaluation?.fitScore??j.ranking?.score??"—";
 const summary=j.evaluation?.evidence?.join("; ") || "Heuristic match only; no LLM inference";
 const safeUrl=/^https?:\/\//i.test(j.url||"")?j.url:"";
 return "<tr><td>"+escapeHtml(score)+"/10</td><td>"+(safeUrl?"<a href=\""+escapeHtml(safeUrl)+"\">"+escapeHtml(j.title)+"</a>":escapeHtml(j.title))+"</td><td>"+escapeHtml(j.company)+"</td><td>"+escapeHtml(j.workMode)+"</td><td>"+escapeHtml(summary)+"</td></tr>";
 }).join("");
 const subject="Career Intelligence preview — "+selected.length+" opportunities";
 const html="<!doctype html><html><head><meta charset=\"utf-8\"></head><body><h2>"+escapeHtml(subject)+"</h2><p>Local preview only. Not sent. Scores are not hiring probabilities.</p><table border=\"1\" cellpadding=\"8\" cellspacing=\"0\"><thead><tr><th>Score</th><th>Role</th><th>Company</th><th>Mode</th><th>Evidence</th></tr></thead><tbody>"+rows+"</tbody></table></body></html>";
 return {subject,html,count:selected.length};
}
