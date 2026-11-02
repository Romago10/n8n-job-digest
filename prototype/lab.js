import {normalizeJob,scoreJob,eligibility} from "./engine.js";
import {evaluateOffline} from "./offline-evaluator.js";
import {jobs} from "./fixtures.js";
// Human labels are provisional test expectations, not real hiring outcomes.
export const labels=[{index:0,decision:"apply"},{index:1,decision:"apply"},{index:2,decision:"review"},{index:3,decision:"skip"},{index:4,decision:"review"}];
export function runLab(profile, customLabels=labels) {
 const results=customLabels.map(({index,decision})=>{
  const job=normalizeJob(jobs[index],"fixture");
  const ranking=scoreJob(job,profile);
  const eligibilityResult=eligibility(job,profile);
  const baseline=!eligibilityResult.eligible?"skip":ranking.score>=8?"apply":ranking.score>=5?"review":"skip";
  const offline=evaluateOffline(job,profile).recommendation;
  return {title:job.title,expected:decision,baseline,offline,score:ranking.score,completeness:ranking.completeness,baselineCorrect:baseline===decision,offlineCorrect:offline===decision};
 });
 const accuracy=key=>results.length?Math.round(100*results.filter(r=>r[key]).length/results.length):null;
 return {method:"fictional labeled fixtures",results,baselineAgreement:accuracy("baselineCorrect"),offlineAgreement:accuracy("offlineCorrect"),note:"Agreement with provisional labels, not measured prediction or hiring quality."};
}
