const state={page:"dashboard",jobs:[],profile:null,selected:null,filter:"all",search:""};
const $=s=>document.querySelector(s);
const el=(tag,attrs={},children=[])=>{const e=document.createElement(tag);for(const [k,v] of Object.entries(attrs)){if(k==="text")e.textContent=v;else if(k==="class")e.className=v;else e.setAttribute(k,v);}for(const child of children)e.append(child);return e;};
const api=async(path,method="GET",data)=>{const r=await fetch("/api"+path,{method,headers:{"content-type":"application/json"},body:data===undefined?undefined:JSON.stringify(data)});const json=await r.json();if(!r.ok)throw Error(json.error||"Request failed");return json};
const notice=message=>{$("#notice").textContent=message;};
const section=()=>{const c=$("#content");c.replaceChildren();return c};
const money=value=>value==null?"Unknown":"$"+Number(value).toLocaleString();
const button=(text,action,cls="")=>{const b=el("button",{text,class:cls});b.addEventListener("click",action);return b;};
async function load(){[state.jobs,state.profile]=await Promise.all([api("/jobs"),api("/profile")]);render();}
function setPage(p){state.page=p;document.querySelectorAll("nav button").forEach(b=>b.classList.toggle("active",b.dataset.page===p));render();}
document.querySelectorAll("nav button").forEach(b=>b.addEventListener("click",()=>setPage(b.dataset.page)));
function card(title){const c=el("section",{class:"card"});if(title)c.append(el("h3",{text:title}));return c;}
function render(){
 const titles={dashboard:["Dashboard","Local opportunity overview."],opportunities:["Opportunities","Review, rank, save, and import jobs."],applications:["Applications","Track the progression of saved opportunities."],settings:["Settings","Candidate profile and ranking preferences."]};
 $("#page-title").textContent=titles[state.page][0];$("#page-description").textContent=titles[state.page][1];
 const c=section();
 if(state.page==="dashboard")dashboard(c);
 if(state.page==="opportunities")opportunities(c);
 if(state.page==="applications")applications(c);
 if(state.page==="settings")settings(c);
}
function dashboard(c){
 const stats=el("div",{class:"stats"});
 for(const [label,n] of [["Opportunities",state.jobs.length],["Strong matches",state.jobs.filter(j=>j.ranking.score>=8&&j.eligibility.eligible).length],["In progress",state.jobs.filter(j=>["applied","interviewing","offer"].includes(j.status)).length]]){
 const k=card();k.append(el("div",{class:"big",text:String(n)}),el("div",{class:"muted",text:label}));stats.append(k);
 }c.append(stats,el("p",{class:"muted",text:"Scores are heuristic estimates, not verified hiring probabilities."}));
 const top=card("Highest-ranked opportunities");for(const j of [...state.jobs].sort((a,b)=>(b.ranking.score??-1)-(a.ranking.score??-1)).slice(0,5)){top.append(jobButton(j));}c.append(top);
 const actions=card("Offline evaluation lab");actions.append(el("p",{text:"Use fictional job fixtures, evaluate them with deterministic rules, and preview the email digest without sending."}),button("Load fictional fixtures",async()=>{try{await api("/fixtures","POST");notice("Fictional fixtures added.");await load()}catch(e){notice(e.message)}},"primary")," ",button("Preview digest",async()=>{try{const d=await api("/digest-preview");const preview=card(d.subject);const frame=el("iframe",{title:"Local email digest preview",sandbox:"",style:"width:100%;height:380px;border:1px solid #dbe1e9;border-radius:8px"});frame.srcdoc=d.html;preview.append(frame);c.append(preview)}catch(e){notice(e.message)}},"secondary"));c.append(actions);
}
function jobButton(j){const b=el("button",{class:"job"+(state.selected===j.id?" selected":"")});b.append(el("div",{class:"jobtop"},[el("strong",{text:j.title}),el("span",{class:"score",text:j.ranking.score==null?"—":j.ranking.score+"/10"})]),el("span",{class:"muted",text:j.company+" · "+j.workMode+" · "+(j.salaryMin==null?"Salary unknown":money(j.salaryMin))+" · "+j.status}));b.onclick=()=>{state.selected=j.id;setPage("opportunities")};return b}
function opportunities(c){
 const toolbar=el("div",{class:"toolbar"}),search=el("input",{placeholder:"Search job or company","aria-label":"Search jobs",value:state.search});search.oninput=()=>{state.search=search.value;render()};const filter=el("select",{"aria-label":"Status filter"});for(const value of ["all","new","saved","applied","interviewing","offer","rejected","dismissed"]){const option=el("option",{value,text:value});option.selected=value===state.filter;filter.append(option)}filter.onchange=()=>{state.filter=filter.value;render()};toolbar.append(search,filter,button("Add opportunity",()=>showImport(c),"primary"));c.append(toolbar);
 const matches=state.jobs.filter(j=>(state.filter==="all"||j.status===state.filter)&&[j.title,j.company].join(" ").toLowerCase().includes(state.search.toLowerCase())).sort((a,b)=>(b.ranking.score??-1)-(a.ranking.score??-1));
 const layout=el("div",{class:"grid2"}),list=card("Jobs ("+matches.length+")");
 if(!matches.length)list.append(el("p",{class:"empty",text:"No opportunities yet. Add one or seed sample jobs from Dashboard."}));
 for(const j of matches)list.append(jobButton(j));
 const j=state.jobs.find(x=>x.id===state.selected)||matches[0],detail=card("Details");
 if(j){detail.append(el("h3",{text:j.title}),el("p",{class:"muted",text:j.company+" · "+j.location+" · "+j.workMode}),el("p",{text:"Salary: "+money(j.salaryMin)+" – "+money(j.salaryMax)+" ("+j.salaryPeriod+")"}),el("p",{text:"Match score: "+j.ranking.score+"/10 · "+(j.eligibility.eligible?"Eligible":"Excluded: "+j.eligibility.reasons.join(", "))}),el("p",{class:"detail",text:j.description||"No description"}));
 const a=el("a",{href:j.url,target:"_blank",rel:"noopener noreferrer",text:"Open original listing"});detail.append(a);
 const s=el("select",{"aria-label":"Application status"});for(const v of ["new","saved","applied","interviewing","offer","rejected","dismissed"]){const o=el("option",{value:v,text:v});o.selected=j.status===v;s.append(o)}
 const analysis=card("Structured evaluation (offline rules, not LLM)");
 if(j.evaluation){analysis.append(el("p",{text:"Recommendation: "+j.evaluation.recommendation+" · "+j.evaluation.fitScore+"/10"}));for(const label of ["evidence","gaps","uncertainties"]){analysis.append(el("strong",{text:label[0].toUpperCase()+label.slice(1)}),el("p",{text:j.evaluation[label].join("; ")||"None recorded"}));}analysis.append(el("p",{text:j.evaluation.suggestedAction}));}
 else analysis.append(el("p",{class:"muted",text:"No evaluation saved. Run the offline evaluation to inspect structured reasoning."}));
 analysis.append(button("Evaluate offline",async()=>{try{await api("/jobs/"+j.id+"/evaluate","POST");notice("Offline rules evaluation saved (no LLM call).");await load()}catch(e){notice(e.message)}},"secondary"));detail.append(analysis);
 const n=el("textarea",{placeholder:"Notes"});n.value=j.notes;detail.append(el("p",{text:"Application status"}),s,el("p",{text:"Notes"}),n,button("Save updates",async()=>{try{await api("/jobs/"+j.id,"PATCH",{status:s.value,notes:n.value});notice("Saved.");await load()}catch(e){notice(e.message)}},"primary"));
 }else detail.append(el("p",{class:"empty",text:"Select an opportunity."}));
 layout.append(list,detail);c.append(layout);
}
function showImport(c){const form=card("Add a listing (manual entry)"),fields={};for(const [name,label,kind] of [["title","Job title","text"],["company","Company","text"],["url","Listing URL","url"],["description","Description","textarea"],["location","Location","text"],["salaryMin","Minimum annual salary","number"]]){const wrap=el("label",{text:label}),inp=kind==="textarea"?el("textarea"):el("input",{type:kind});fields[name]=inp;wrap.append(inp);form.append(wrap)}
 const mode=el("select");for(const v of ["unknown","remote","hybrid","onsite"])mode.append(el("option",{value:v,text:v}));form.append(el("label",{text:"Work mode"},[mode]));
 form.append(button("Save listing",async()=>{try{const payload=Object.fromEntries(Object.entries(fields).map(([k,v])=>[k,v.value]));payload.workMode=mode.value;payload.salaryPeriod="year";await api("/jobs","POST",payload);notice("Opportunity imported.");await load()}catch(e){notice(e.message)}},"primary"));c.prepend(form);
}
function applications(c){const rows=state.jobs.filter(j=>["saved","applied","interviewing","offer","rejected"].includes(j.status));const box=card("Application tracker");if(!rows.length)box.append(el("p",{class:"empty",text:"Save a job to start tracking it."}));else{const table=el("table"),head=el("tr");for(const v of ["Role","Company","Status","Score"])head.append(el("th",{text:v}));table.append(head);for(const j of rows){const tr=el("tr");for(const v of [j.title,j.company,j.status,String(j.ranking.score??"—")])tr.append(el("td",{text:v}));table.append(tr)}box.append(table)}c.append(box);}
function settings(c){const p=state.profile,form=card("Candidate preferences");const fields={};for(const [key,label] of [["skills","Skills (comma-separated)"],["targetTitles","Target role phrases (comma-separated)"],["preferredSalary","Preferred annual salary"]]){const input=el("input",{type:key==="preferredSalary"?"number":"text"});input.value=Array.isArray(p[key])?p[key].join(", "):p[key];fields[key]=input;form.append(el("label",{text:label},[input]));}
 const modes=el("select");for(const m of ["all","remote","remote-hybrid"]){const o=el("option",{value:m,text:m==="all"?"Any arrangement":m==="remote"?"Remote only":"Remote or hybrid"});modes.append(o)}modes.value=p.workModes.length===1&&p.workModes[0]==="remote"?"remote":p.workModes.length===2?"remote-hybrid":"all";form.append(el("label",{text:"Work arrangement"},[modes]));
 form.append(button("Save preferences",async()=>{const updated={...p,skills:fields.skills.value.split(",").map(x=>x.trim()).filter(Boolean),targetTitles:fields.targetTitles.value.split(",").map(x=>x.trim()).filter(Boolean),preferredSalary:Number(fields.preferredSalary.value),workModes:modes.value==="all"?["remote","hybrid","onsite"]:modes.value==="remote"?["remote"]:["remote","hybrid"]};try{await api("/profile","PUT",updated);notice("Preferences saved; rankings recalculated.");await load()}catch(e){notice(e.message)}},"primary"));c.append(form);
 const info=card("Prototype boundaries");info.append(el("p",{text:"All data stays in a local SQLite file. The email digest and optional AI evaluator are architectural extensions, not active integrations."}));c.append(info);
}
load().catch(e=>notice("Unable to load local server: "+e.message));
