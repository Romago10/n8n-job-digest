import test from "node:test";
import assert from "node:assert/strict";
import { profile } from "./config.js";
import {normalizeJob,scoreJob} from "./engine.js";
import {jobs} from "./fixtures.js";
import {evaluateOffline} from "./offline-evaluator.js";
import {digestPreview} from "./digest.js";
test("fixtures are distinct and fictional",()=>assert.equal(new Set(jobs.map(j=>j.url)).size,jobs.length));
test("offline evaluator satisfies strict contract and discloses uncertainty",()=>{
 const j=normalizeJob(jobs.at(-1),"fixture");
 const value=evaluateOffline(j,profile);
 assert.ok(["apply","review","skip"].includes(value.recommendation));
 assert.ok(value.uncertainties.some(s=>s.includes("Salary")));
});
test("digest escapes untrusted markup and ignores dismissed",()=>{
 const j={...normalizeJob(jobs[0]),title:"<script>alert(1)</script>",status:"new",ranking:scoreJob(normalizeJob(jobs[0]),profile),eligibility:{eligible:true}};
 const out=digestPreview([j,{...j,status:"dismissed"}]);
 assert.equal(out.count,1);
 assert.ok(out.html.includes("&lt;script&gt;"));
 assert.ok(!out.html.includes("<script>"));
});
