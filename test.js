const fs=require("fs"),path=require("path"),cp=require("child_process"),L=require("./js/logic.js"),site=require("./data/site.json"),C=require("./data/content.json"),books=C.books;
let ok=true;const t=(c,msg)=>{ok=ok&&!!c;console.log(c?"PASS":"FAIL",msg)};
// 1. date / chapter rules (unchanged)
const cases=[["2026-10-21",41,"Genesis",46,"glorious"],["2026-10-23",43,"Genesis",48,"sorrowful"],["2026-10-25",45,"Genesis",50,"glorious"],["2026-10-26",46,"Exodus",1,"joyful"],["2026-10-29",49,"Exodus",4,"luminous"],["2026-11-03",54,"Exodus",9,"sorrowful"],["2026-09-11",1,"Genesis",46,"sorrowful"]];
for(const [d,day,b,ch,m] of cases){const r=L.compute(d,site,books);t(r.day===day&&r.reading.name===b&&r.reading.chapter===ch&&r.mystery===m,`${d} day ${r.day} ${r.phase} ${r.reading.name} ${r.reading.chapter} ${r.mystery} surrender ${r.surrenderDay}`);}
t(L.compute("2026-11-04",site,books).status==="done"&&L.compute("2026-11-04",site,books).reading.name==="Exodus","after Nov 3: novena done, chapters continue (Exodus 10)");
// 2. generator: re-run twice from a fixed date, output must be identical (idempotent)
const from=process.env.FROM||L.todayNY(),run=()=>cp.execFileSync("node",["build_pages.js","--from",from],{cwd:__dirname});
run();const snap=()=>{const o={};for(let i=0;i<=7;i++){const d=L.addDays(from,i);o[d]=fs.readFileSync(path.join(__dirname,"day",d,"index.html"),"utf8")}return o};
const s1=snap();run();const s2=snap();t(JSON.stringify(s1)===JSON.stringify(s2),"generator is re-runnable (identical output)");
const scenes=require("./data/scenes.json").scenes,art=require("./data/art_meta.json"),cred=require("./data/art_credits.json");
for(const [d,h] of Object.entries(s1)){const r=L.compute(d,site,books),T=r;
  const v=require("./bible/cpdv/"+r.reading.book+".json").chapters[r.reading.chapter-1];
  t(h.includes(`<sup>${v.length}</sup>`)&&h.includes("bible.usccb.org/bible/"),`${d} has all ${v.length} verses of ${r.reading.name} ${r.reading.chapter} + NABRE link`);
  t(h.includes("Mysteries")&&(T.status!=="active"||(h.includes("Day "+T.day)&&h.includes("Surrender Novena")&&h.includes("Day "+T.surrenderDay+" of 9")&&h.includes(esc(site.intention)))),`${d} has mysteries, novena day, intention and Surrender day`);
  const sc=scenes.filter(s=>s.ref===r.reading.book+":"+r.reading.chapter);
  t(sc.length>0||T.status==="done",`${d} has ${sc.length} scene collage(s)`);
  for(const s of sc){t(fs.existsSync(path.join(__dirname,s.image||`images/scenes/${s.ref.replace(":","-")}-${s.after}.jpg`))&&s.art.every(a=>art[a]&&/public domain|cc0|no restrictions/i.test(art[a].license)&&fs.existsSync(path.join(__dirname,art[a].local))&&h.includes(esc(art[a].source))&&cred[a]),`  ${s.scene}: PD art local, credited with source`);}
}
function esc(s){return String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]))}
// 3. home page links
const home=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
for(const s of ["Join our Pio's Lost Sheep Discord Server: https://discord.gg/HqXPUEd5JQ","Tithe Your Shekels: https://ko-fi.com/pioslostsheep","https://www.youtube.com/channel/UCSadxDY_Q3o_ELwXacDTP6A/live",'href="novena/"','id="today-link"'])t(home.includes(s),"home has "+s);
t(fs.existsSync(path.join(__dirname,"novena/index.html")),"novena section at /novena/");
// 4. no trademark branding, fonts licensed, no AI images
const pub=["index.html","novena/index.html","css/lu.css","css/style.css",...Object.keys(s1).map(d=>`day/${d}/index.html`)].map(f=>fs.readFileSync(path.join(__dirname,f),"utf8")).join("\n");
t(!/\bLEGO\b|Ninjago|Nexus Force/i.test(pub),"no LEGO names/trademarks in pages or CSS");
for(const f of ["Nunito-Variable.ttf","VarelaRound-Regular.ttf","LilitaOne-Regular.ttf"])t(fs.existsSync("fonts/"+f)&&fs.existsSync("fonts/"+f.split(/[-.]/)[0]+"-OFL.txt"),"font "+f+" + OFL license");
t(site.intention==="the favor I place in your hands","intention unchanged");
console.log("NY today:",L.todayNY());process.exit(ok?0:1);
