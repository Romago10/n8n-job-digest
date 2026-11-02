import { scoreJob } from "./engine.js";
import { evaluationPayload, validateEvaluation } from "./evaluation-contract.js";

// Deterministic offline stand-in for a future LLM. Not an AI inference result.
export function evaluateOffline(job, profile) {
 const data=evaluationPayload(job,profile);
 const ranked=scoreJob(job,profile);
 const text=(data.job.title+" "+data.job.description).toLowerCase();
 const matched=(profile.skills||[]).filter(s=>text.includes(String(s).toLowerCase()));
 const gaps=[];
 if(!matched.length) gaps.push("No explicitly matching skills detected in the posting");
 if(!job.description) gaps.push("Job description unavailable");
 const uncertainties=[];
 if(job.salaryMin==null) uncertainties.push("Salary is undisclosed or not normalized");
 if(job.workMode==="unknown") uncertainties.push("Work arrangement is unknown");
 const fitScore=Math.max(0,Math.min(10,Math.round(ranked.score??0)));
 const result={
  recommendation: fitScore>=8?"apply":fitScore>=5?"review":"skip",
  fitScore,
  evidence: matched.length?["Explicit skill matches: "+matched.join(", ")]:[],
  gaps,uncertainties,
  suggestedAction: fitScore>=8?"Review listing and prepare application":fitScore>=5?"Review requirements manually":"Deprioritize pending additional evidence"
 };
 return validateEvaluation(result);
}
