const modes=new Set(["remote","hybrid","onsite"]);
export function validateProfile(p){
 if(!p||typeof p!=="object"||Array.isArray(p))throw Error("Profile must be an object");
 for(const name of ["skills","targetTitles","workModes"]){
  if(!Array.isArray(p[name])||p[name].length>100||!p[name].every(x=>typeof x==="string"&&x.length>0&&x.length<=100))throw Error("Invalid "+name);
 }
 if(!p.workModes.every(x=>modes.has(x)))throw Error("Invalid work mode");
 if(!Number.isFinite(p.preferredSalary)||p.preferredSalary<0||p.preferredSalary>10000000)throw Error("Invalid preferred salary");
 if(p.requiredLocations!==undefined&&(!Array.isArray(p.requiredLocations)||!p.requiredLocations.every(x=>typeof x==="string"&&x.length<150)))throw Error("Invalid locations");
 if(typeof p.allowUnknownSalary!=="boolean")throw Error("Invalid unknown salary preference");
 if(!p.weights||typeof p.weights!=="object"||Array.isArray(p.weights)||Object.keys(p.weights).sort().join(",")!=="direction,salary,skills,workMode")throw Error("Invalid scoring weights");
 if(!Object.values(p.weights).every(w=>typeof w==="number"&&Number.isFinite(w)&&w>=0&&w<=100)||Object.values(p.weights).every(w=>w===0))throw Error("Invalid scoring weights");
 return p;
}
