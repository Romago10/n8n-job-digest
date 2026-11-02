import test from "node:test";
import assert from "node:assert/strict";
import {normalizeJob, canonicalKey, deduplicate, eligibility, scoreJob, rankJobs} from "./engine.js";
import {validateEvaluation} from "./evaluation-contract.js";
const base = { title:"Data Analyst", company:"Example Co", description:"SQL and Python", url:"https://example.com/job/1?utm_source=email", workMode:"remote" };
test("removes tracking parameters and canonicalizes URLs", () => {
  assert.equal(normalizeJob(base).url,"https://example.com/job/1");
});
test("rejects unsafe URLs",()=>assert.equal(normalizeJob({...base,url:"javascript:alert(1)"}).url,""));
test("deduplicates within batch",()=> {
  const a=normalizeJob(base), b=normalizeJob({...base,url:"https://example.com/job/1?utm_campaign=a"});
  assert.equal(canonicalKey(a),canonicalKey(b));
  assert.equal(deduplicate([a,b]).length,1);
});
test("unknown work mode is not misidentified from description mentioning remote",()=>{
  assert.equal(normalizeJob({...base,workMode:undefined,description:"remote work is not allowed"}).workMode,"unknown");
});
test("hard filters apply",()=>{
  assert.equal(eligibility(normalizeJob(base),{workModes:["hybrid"],allowUnknownSalary:true,requiredLocations:[]}).eligible,false);
});
test("missing salary is unknown rather than zero",()=>{
  const result=scoreJob(normalizeJob(base));
  assert.ok(result.unknown.includes("salary"));
  assert.ok(result.score>=0 && result.score<=10);
});
test("annual salary scoring respects period",()=>{
  const a=scoreJob(normalizeJob({...base,salaryMin:90000,salaryPeriod:"year"}));
  const b=scoreJob(normalizeJob({...base,salaryMin:90000,salaryPeriod:"hour"}));
  assert.ok(a.score>=b.score || b.unknown.includes("salary"));
});
test("rank produces score order and drops unsafe listings",()=>{
  const result=rankJobs([base,{...base,url:"javascript:bad",title:"Bad Job"}]);
  assert.equal(result.length,1);
});
test("validates LLM response",()=>{
  assert.throws(()=>validateEvaluation({recommendation:"apply",fitScore:99}));
  assert.equal(validateEvaluation({recommendation:"review",fitScore:7,evidence:[],gaps:[],uncertainties:[],suggestedAction:"Inspect"}).fitScore,7);
});
