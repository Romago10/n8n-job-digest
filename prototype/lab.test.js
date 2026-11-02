import test from "node:test";
import assert from "node:assert/strict";
import {profile} from "./config.js";
import {runLab} from "./lab.js";
import {validateProfile} from "./validation.js";
import {normalizeJob,scoreJob,canonicalKey} from "./engine.js";
test("valid profile accepted; invalid weights rejected",()=>{
 assert.deepEqual(validateProfile({...profile}),profile);
 assert.throws(()=>validateProfile({...profile,weights:{skills:-1,direction:20,salary:20,workMode:20}}));
});
test("completeness measures known fields separately",()=>{
 const scored=scoreJob(normalizeJob({title:"Analyst",company:"Test",description:"SQL",url:"https://example.org"}),profile);
 assert.ok(scored.completeness<1);
 assert.ok(scored.score>=0);
});
test("normalized job identity falls back to company title location",()=>{
 const a=normalizeJob({title:"Data Engineer",company:"EXAMPLE",location:"Remote",url:"https://a.example/job"});
 const b=normalizeJob({title:"data engineer",company:"example",location:"remote",url:"https://b.example/job"});
 assert.equal(canonicalKey(a),canonicalKey(b));
});
test("benchmark has fixed labels and reproducible agreement",()=>{
 const a=runLab(profile),b=runLab(profile);
 assert.deepEqual(a,b);
 assert.equal(a.results.length,5);
});
