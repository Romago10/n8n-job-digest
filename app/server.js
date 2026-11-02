import http from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { jobs as fixtureJobs } from "../prototype/fixtures.js";
import { evaluateOffline } from "../prototype/offline-evaluator.js";
import { digestPreview } from "../prototype/digest.js";
import { profile as defaults } from "../prototype/config.js";
import { normalizeJob, scoreJob, eligibility, canonicalKey } from "../prototype/engine.js";

const root = path.dirname(fileURLToPath(import.meta.url));
const db = new DatabaseSync(process.env.DB_PATH || path.join(root,"career.db"));
db.exec("PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY CHECK (id=1), profile TEXT NOT NULL); CREATE TABLE IF NOT EXISTS jobs (id INTEGER PRIMARY KEY AUTOINCREMENT, fingerprint TEXT UNIQUE NOT NULL, payload TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'new', notes TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP); CREATE TABLE IF NOT EXISTS evaluations (job_id INTEGER PRIMARY KEY REFERENCES jobs(id), result TEXT NOT NULL, evaluated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);");
if (!db.prepare("SELECT id FROM settings WHERE id=1").get()) db.prepare("INSERT INTO settings (id,profile) VALUES (1,?)").run(JSON.stringify(defaults));
const getProfile=()=>JSON.parse(db.prepare("SELECT profile FROM settings WHERE id=1").get().profile);
const allJobs=()=>db.prepare("SELECT * FROM jobs ORDER BY created_at DESC,id DESC").all().map(row=>{
  const job=JSON.parse(row.payload), p=getProfile();
  const evaluation=db.prepare("SELECT result FROM evaluations WHERE job_id=?").get(row.id);
  return {...job,id:row.id,status:row.status,notes:row.notes,createdAt:row.created_at,ranking:scoreJob(job,p),eligibility:eligibility(job,p),evaluation:evaluation?JSON.parse(evaluation.result):null};
});
const send=(res,status,data)=>{res.writeHead(status,{"content-type":"application/json; charset=utf-8","cache-control":"no-store"});res.end(JSON.stringify(data));};
async function body(req) {
  let value="";
  for await (const chunk of req) {value+=chunk;if(value.length>1_000_000)throw new Error("Request too large");}
  try {return JSON.parse(value||"{}");}catch {throw new Error("Invalid JSON");}
}
const statuses=new Set(["new","saved","applied","interviewing","offer","rejected","dismissed"]);
function seed(){
  const examples=[
    {title:"Data Engineer I",company:"Example Analytics",description:"SQL Python ETL and API pipelines",workMode:"remote",salaryMin:85000,salaryMax:105000,salaryPeriod:"year",url:"https://example.org/jobs/de"},
    {title:"Automation Analyst",company:"Example Systems",description:"Power BI n8n automation SQL workflow APIs",workMode:"hybrid",salaryMin:78000,salaryMax:92000,salaryPeriod:"year",url:"https://example.org/jobs/auto"},
    {title:"Business Intelligence Analyst",company:"Example Insights",description:"Excel SQL reporting Power BI data analytics",workMode:"remote",salaryMin:75000,salaryMax:90000,salaryPeriod:"year",url:"https://example.org/jobs/bi"}
  ];
  const insert=db.prepare("INSERT OR IGNORE INTO jobs (fingerprint,payload) VALUES (?,?)");
  for(const raw of examples){const job=normalizeJob(raw,"sample");insert.run(canonicalKey(job),JSON.stringify(job));}
}
export function createServer(){
return http.createServer(async(req,res)=>{
  const url=new URL(req.url,"http://localhost");
  try{
    if(url.pathname==="/api/jobs"&&req.method==="GET")return send(res,200,allJobs());
    if(url.pathname==="/api/digest-preview"&&req.method==="GET")return send(res,200,digestPreview(allJobs()));
    if(url.pathname==="/api/fixtures"&&req.method==="POST"){
      const insert=db.prepare("INSERT OR IGNORE INTO jobs (fingerprint,payload) VALUES (?,?)");
      for(const raw of fixtureJobs){const job=normalizeJob(raw,"fictional-fixture");insert.run(canonicalKey(job),JSON.stringify(job));}
      return send(res,200,{ok:true,count:fixtureJobs.length});
    }
    const evalMatch=url.pathname.match(new RegExp("^/api/jobs/([0-9]+)/evaluate$"));
    if(evalMatch&&req.method==="POST"){
      const id=Number(evalMatch[1]);const job=allJobs().find(j=>j.id===id);
      if(!job)return send(res,404,{error:"Job not found"});
      const result=evaluateOffline(job,getProfile());
      db.prepare("INSERT INTO evaluations (job_id,result) VALUES (?,?) ON CONFLICT(job_id) DO UPDATE SET result=excluded.result,evaluated_at=CURRENT_TIMESTAMP").run(id,JSON.stringify(result));
      return send(res,200,{mode:"offline-rules-not-llm",result});
    }
    if(url.pathname==="/api/profile"&&req.method==="GET")return send(res,200,getProfile());
    if(url.pathname==="/api/profile"&&req.method==="PUT"){
      const p=await body(req);
      if(!Array.isArray(p.skills)||!Array.isArray(p.targetTitles)||!Array.isArray(p.workModes)||!Number.isFinite(p.preferredSalary)||p.preferredSalary<0||!p.weights||typeof p.weights!=="object")return send(res,400,{error:"Invalid profile"});
      db.prepare("UPDATE settings SET profile=? WHERE id=1").run(JSON.stringify({...defaults,...p}));db.exec("DELETE FROM evaluations");return send(res,200,getProfile());
    }
    if(url.pathname==="/api/jobs"&&req.method==="POST"){
      const raw=await body(req),job=normalizeJob(raw,"manual");
      if(!job.title||!job.company||!job.url)return send(res,400,{error:"Title, company, and valid HTTP(S) URL required"});
      const result=db.prepare("INSERT OR IGNORE INTO jobs (fingerprint,payload) VALUES (?,?)").run(canonicalKey(job),JSON.stringify(job));
      return send(res,result.changes?201:200,{created:!!result.changes,job});
    }
    if(url.pathname==="/api/seed"&&req.method==="POST"){seed();return send(res,200,{ok:true});}
    const match=url.pathname.match(/^\/api\/jobs\/(\d+)$/);
    if(match&&req.method==="PATCH"){
      const input=await body(req),id=Number(match[1]);
      if(!statuses.has(input.status)||typeof input.notes!=="string"||input.notes.length>5000)return send(res,400,{error:"Invalid status or notes"});
      const result=db.prepare("UPDATE jobs SET status=?, notes=? WHERE id=?").run(input.status,input.notes,id);
      return send(res,result.changes?200:404,{ok:!!result.changes});
    }
    if(req.method!=="GET")return send(res,404,{error:"Not found"});
    const pages={"/":"/index.html","/index.html":"/index.html","/app.js":"/app.js","/style.css":"/style.css"};
    const file=pages[url.pathname];if(!file)return send(res,404,{error:"Not found"});
    const content=await readFile(path.join(root,"public",file));
    res.writeHead(200,{"content-type":file.endsWith(".js")?"text/javascript":file.endsWith(".css")?"text/css":"text/html","x-content-type-options":"nosniff","content-security-policy":"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self'; object-src 'none'; base-uri 'none'"});res.end(content);
  }catch(err){send(res,400,{error:err.message});}
});
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const port=Number(process.env.PORT||3000);
  createServer().listen(port,"127.0.0.1",()=>console.log("Development app: http://127.0.0.1:"+port));
}
