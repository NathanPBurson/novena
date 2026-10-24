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

// 5. order + 54 Day Novena prayers on every day page
const NT=require("./data/novena_traditional.json");
for(const d of fs.readdirSync(path.join(__dirname,"day")).filter(x=>/^\d{4}-\d\d-\d\d$/.test(x))){
  const h=fs.readFileSync(path.join(__dirname,"day",d,"index.html"),"utf8"),T=L.compute(d,site,books),i=k=>h.indexOf(k);
  t(i('id="pray"')>0&&i('id="surrender"')>i('id="pray"')&&i('id="scripture"')>i('id="surrender"')&&i('class="lu-verses"')>i('id="scripture"'),`${d} order: Rosary prayers -> Surrender -> Scripture`);
  if(T.status!=="active")continue;const pet=T.phase==="petition",ph=T.phase;
  const off=esc((pet?NT.petitionOffering:NT.thanksOffering).split("{bouquet}")[0]),other=esc((pet?NT.thanksOffering:NT.petitionOffering).split("{bouquet}")[0]);
  const o=i('class="novena-offering" data-phase="'+ph+'"'),cr=i("The Apostles\u2019 Creed"),d1=i('data-step="decade"');
  t(o>i('id="pray"')&&o<cr&&h.includes(off)&&h.includes(esc(NT.bouquet[T.mystery]))&&!h.includes(other.slice(0,120).replace(/humbly|gratefully/,"X")),`${d} day ${T.day}: traditional ${ph} opening offering before the Creed`);
  t((h.match(new RegExp('class="novena-decade" data-phase="'+ph+'"',"g"))||[]).length===5&&i('class="novena-decade"')>d1,`${d}: ${ph} binding prayer after each of the 5 decades`);
  t(i('class="novena-closing" data-phase="'+ph+'"')>i('data-step="closing"')&&h.includes(esc(pet?"Show thyself my Mother!":"thou hast truly shown thyself my Mother!")),`${d}: ${ph} closing prayer in place`);
  t(!h.includes('data-phase="'+(pet?"thanksgiving":"petition")+'"'),`${d}: no prayers from the wrong phase`);
}
const pd=L.compute("2026-09-20",site,books);t(pd.phase==="petition"&&L.compute("2026-10-07",site,books).day===27&&L.compute("2026-10-08",site,books).phase==="thanksgiving","day 27 = Oct 7 petition, day 28 = Oct 8 thanksgiving");
// 6. /rewind/ OBS playlist page
{const RW=require("./data/rewind.json"),id=RW.videoId,h=fs.readFileSync(path.join(__dirname,"rewind/index.html"),"utf8"),js=fs.readFileSync(path.join(__dirname,"js/rewind.js"),"utf8");
 t(/^[A-Za-z0-9_-]{11}$/.test(id)&&h.includes(`window.REWIND_YT_ID=${JSON.stringify(id)}`),"rewind fallback YouTube ID from data/rewind.json");
 t(js.includes('"https://www.youtube.com/embed/"+FALLBACK_YT+"?autoplay=1&mute=1&loop=1&playlist="+FALLBACK_YT+"&controls=0"'),"rewind fallback embed URL format");
 t(h.includes('src="../js/rewind.js"')&&js.includes('"../data/rewind_playlist.json"'),"rewind reads data/rewind_playlist.json at runtime");
 t(/v\.muted=true/.test(js)&&/"ended"/.test(js)&&/%blocks\.length/.test(js)&&/mute:1/.test(js),"player: muted, advances on ended, loops");
 t(h.includes(">Audio is LIVE &middot; Gameplay is a REWIND<")||h.includes(">Audio is LIVE · Gameplay is a REWIND<"),"rewind banner exact text");
 t(/overflow:hidden/.test(h)&&/background:#000/.test(h)&&/100vw/.test(h)&&/100vh/.test(h),"rewind full-window, black, no scrollbars");
 t(/noindex/.test(h),"rewind noindex");
 const pages=["index.html","novena/index.html","day/index.html",...fs.readdirSync(path.join(__dirname,"day")).filter(x=>/^\d{4}/.test(x)).map(d=>"day/"+d+"/index.html")];
 t(pages.every(f=>!/rewind/i.test(fs.readFileSync(path.join(__dirname,f),"utf8"))),"rewind not linked from nav/pages");
 t(!fs.existsSync(path.join(__dirname,"sitemap.xml"))||!/rewind/.test(fs.readFileSync(path.join(__dirname,"sitemap.xml"),"utf8")),"rewind not in sitemap");
 // build copies the manifest (and picks up changes); missing manifest -> empty list -> YouTube fallback
 const os=require("os"),tm=path.join(os.tmpdir(),"rw_test_manifest.json"),plf=path.join(__dirname,"data/rewind_playlist.json"),keep=fs.readFileSync(plf,"utf8");
 const bld=env=>cp.execFileSync("node",["build_pages.js","--from",from],{cwd:__dirname,env:Object.assign({},process.env,env)});
 fs.writeFileSync(tm,JSON.stringify({blocks:["1AbCdEfGhIjKlMnOp",{driveId:"1QrStUvWxYz012345",title:"B"},{youtubeId:"BBEOOdY_k5A"}]}));bld({REWIND_MANIFEST:tm});
 let pl=JSON.parse(fs.readFileSync(plf,"utf8"));t(pl.blocks.length===3&&pl.blocks[1].driveId==="1QrStUvWxYz012345","build copies manifest into data/rewind_playlist.json");
 fs.writeFileSync(tm,JSON.stringify(["1AbCdEfGhIjKlMnOp"]));bld({REWIND_MANIFEST:tm});pl=JSON.parse(fs.readFileSync(plf,"utf8"));t(pl.blocks.length===1,"build picks up a changed manifest (array form)");
 fs.unlinkSync(tm);bld({REWIND_MANIFEST:tm});pl=JSON.parse(fs.readFileSync(plf,"utf8"));t(Array.isArray(pl.blocks)&&pl.blocks.length===0&&/if\(!blocks\.length\)return youtube\(\)/.test(js),"missing manifest -> empty playlist -> YouTube fallback");
 fs.writeFileSync(plf,keep);bld({});}
console.log("NY today:",L.todayNY());process.exit(ok?0:1);

