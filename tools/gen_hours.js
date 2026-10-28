#!/usr/bin/env node
// Generates the on-site Traditional Office (Divinum Officium, Divino Afflatu rubrics, Douay-Rheims psalms)
// as static JSON, one file per date: hours/trad/YYYY-MM-DD.json.
// Divinum Officium code is MIT and its liturgical texts are public domain (see hours page credit + data/hours_sources.json).
// Needs the Divinum Officium checkout (git clone https://github.com/DivinumOfficium/divinum-officium) and perl + CGI.pm.
// Usage: node tools/gen_hours.js [--from YYYY-MM-DD] [--days 14] [--do /workspace/do_src] [--rubrics "Divino Afflatu - 1954"]
// Existing dated files outside the range are kept. If the generator is unavailable it exits 0 and changes nothing.
const fs=require("fs"),path=require("path"),cp=require("child_process"),L=require("../js/logic.js");
const R=path.join(__dirname,".."),a=process.argv.slice(2),arg=(k,d)=>{const i=a.indexOf(k);return i>=0?a[i+1]:d};
const DO=arg("--do",process.env.DO_SRC||"/workspace/do_src"),RUB=arg("--rubrics","Divino Afflatu - 1954"),from=arg("--from",L.todayNY()),days=+arg("--days",14);
const GEN=path.join(DO,"standalone/tools/epubgen2/EofficiumXhtml.pl");
if(!fs.existsSync(GEN)){console.warn("gen_hours: Divinum Officium checkout not found at "+DO+"; keeping existing hours data");process.exit(0)}
const env=Object.assign({},process.env,{PERL5LIB:[process.env.PERL5LIB,"/workspace/perl5/lib"].filter(Boolean).join(":")});
const HOURS=[["Matutinum","matins"],["Laudes","lauds"],["Prima","prime"],["Tertia","terce"],["Sexta","sext"],["Nona","none"],["Vespera","vespers"],["Completorium","compline"]];
const ent=s=>s.replace(/&ensp;|&nbsp;/g," ").replace(/\s+\n/g,"\n");
function clean(h){return h.replace(/<\/?(TR|TD)[^>]*>/gi,"").replace(/<span class="a">([^<]*)<\/span>/g,"$1").replace(/<span class="(ri|rd|w|nigra|s|m|c)">/g,'<span class="dv-$1">').replace(/<p>\s*<\/p>/g,"").replace(/(<br\/>\s*){3,}/g,"<br/><br/>").replace(/<a [^>]*>([\s\S]*?)<\/a>/gi,"$1").trim()}
function dateObj(d){return d.slice(5,7)+"-"+d.slice(8,10)+"-"+d.slice(0,4)}
function one(d,perlHour){return cp.execFileSync("perl",[GEN,`date1=${dateObj(d)}&command=pray${perlHour}&version=${encodeURIComponent(RUB)}&testmode=regular&lang1=English&lang2=English&votive=&linkmissa=&nofancychars=1`],{cwd:path.dirname(GEN),env,encoding:"utf8",maxBuffer:64e6})}
function parse(html){
 const head=html.slice(0,html.search(/<span class="c">/)),title=(head.match(/<p class="cen"><span class="[^"]*">([\s\S]*?)<br\/><\/span>/)||[])[1]||"";
 const sub=(head.match(/<span class="s[^"]*">(?:<br\/>)?([\s\S]*?)<\/span>/)||[])[1]||"";
 const body=html.slice(html.search(/<H2 /i)),h2=(body.match(/<H2[^>]*>([\s\S]*?)<\/H2>/i)||[])[1]||"";
 const rest=body.replace(/<H2[\s\S]*?<\/H2>/i,"").replace(/<p class="cen">[\s\S]*$/,"");
 return{title:title.replace(/<[^>]+>/g,"").trim(),sub:sub.replace(/<[^>]+>/g,"").trim(),h2:h2.trim(),html:clean(rest)};}
const sha=(()=>{try{return cp.execSync("git rev-parse HEAD",{cwd:DO,encoding:"utf8"}).trim()}catch(e){return "unknown"}})();
fs.mkdirSync(path.join(R,"hours","trad"),{recursive:true});
const add=(d,n)=>{const x=new Date(d+"T12:00:00Z");x.setUTCDate(x.getUTCDate()+n);return x.toISOString().slice(0,10)};
let n=0;
for(let i=0;i<days;i++){const d=add(from,i),out={date:d,rubrics:RUB,source:"Divinum Officium (MIT code; public-domain texts) "+sha.slice(0,10),title:"",sub:"",hours:{}};
 for(const[ph,k]of HOURS){const p=parse(one(d,ph));if(ph==="Laudes"){out.title=p.title;out.sub=p.sub}out.hours[k]={title:p.title,sub:p.sub,html:p.html};if(!p.html||p.html.length<200)throw Error("empty hour "+d+" "+ph)}
 const f=path.join(R,"hours","trad",d+".json"),txt=JSON.stringify(out)+"\n";
 if(!fs.existsSync(f)||fs.readFileSync(f,"utf8")!==txt){fs.writeFileSync(f,txt);n++}}
console.log("gen_hours: wrote/updated",n,"of",days,"days from",from,"("+RUB+", DO "+sha.slice(0,10)+")");
