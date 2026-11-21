// Plain nightly helper (no model, no network). Usage: node tools/nightly_fill.js [--low] [--dry]
// Prints "FROM DAYS" for missing day pages through the next Tuesday refill, and at least MIN_AHEAD days past today
// (or just tomorrow with --low). Stops before a chapter that lacks the trivia shape: 3–4 background details and
// 2–3 discussion questions (tools/trivia_format.js), so a page is never planned without it.
// Gives any missing chapter a reused collage by cloning an existing scene (same painting, same credits, image already in the repo).
const fs=require("fs"),path=require("path"),R=path.join(__dirname,".."),L=require(R+"/js/logic.js"),J=f=>JSON.parse(fs.readFileSync(path.join(R,f)));
const triviaReady=require("./trivia_format.js").ready;
const MIN_AHEAD=21;
const low=process.argv.includes("--low"),dry=process.argv.includes("--dry"),site=J("data/site.json"),C=J("data/content.json"),SCf=path.join(R,"data/scenes.json"),SCJ=J("data/scenes.json");
const TR=J("data/trivia.json").chapters;
const today=L.todayNY(),dow=new Date(today+"T12:00:00Z").getUTCDay(),toTue=((2-dow+7)%7)||7,last=L.addDays(today,low?1:Math.max(toTue,MIN_AHEAD));
const missing=[];
for(let d=today;d<=last;d=L.addDays(d,1)){
 if(fs.existsSync(path.join(R,"day",d,"index.html")))continue;
 const r=L.compute(d,site,C.books).reading;
 if(!triviaReady(TR[r.book+":"+r.chapter]))break;
 missing.push(d);
}
if(!missing.length){process.exit(0)}
const pool=SCJ.scenes.filter(s=>!s.reused&&fs.existsSync(path.join(R,s.image||("images/scenes/"+s.ref.replace(":","-")+"-"+s.after+".jpg"))));let k=SCJ.scenes.filter(s=>s.reused).length,added=0;
for(const d of missing){const r=L.compute(d,site,C.books).reading,ref=r.book+":"+r.chapter;if(SCJ.scenes.some(s=>s.ref===ref)||!pool.length)continue;
 const src=pool[k++%pool.length];SCJ.scenes.push(Object.assign({},src,{ref,after:1,reused:true,image:src.image||("images/scenes/"+src.ref.replace(":","-")+"-"+src.after+".jpg")}));added++}
if(added&&!dry)fs.writeFileSync(SCf,JSON.stringify(SCJ,null,1)+"\n");
const days=Math.round((Date.parse(last)-Date.parse(missing[0]))/864e5)+1;console.log(missing[0]+" "+days+(dry?" (dry: "+missing.length+" missing, "+added+" collages reused)":""));
