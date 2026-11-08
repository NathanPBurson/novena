const fs=require("fs"),path=require("path"),cp=require("child_process"),L=require("./js/logic.js"),site=require("./data/site.json"),C=require("./data/content.json"),books=C.books;
let ok=true;const t=(c,msg)=>{ok=ok&&!!c;console.log(c?"PASS":"FAIL",msg)};
// 1. date / chapter rules (unchanged)
const cases=[["2026-10-21",41,"Genesis",46,"glorious"],["2026-10-23",43,"Genesis",48,"sorrowful"],["2026-10-25",45,"Genesis",50,"glorious"],["2026-10-26",46,"Exodus",1,"joyful"],["2026-10-29",49,"Exodus",4,"luminous"],["2026-11-03",54,"Exodus",9,"sorrowful"],["2026-09-11",1,"Genesis",46,"sorrowful"]];
for(const [d,day,b,ch,m] of cases){const r=L.compute(d,site,books);t(r.day===day&&r.reading.name===b&&r.reading.chapter===ch&&r.mystery===m,`${d} day ${r.day} ${r.phase} ${r.reading.name} ${r.reading.chapter} ${r.mystery} surrender ${r.surrenderDay}`);}
{const c=d=>L.compute(d,site,books);
 t(c("2026-11-04").day===1&&c("2026-11-04").phase==="petition"&&c("2026-11-04").status==="active"&&c("2026-11-04").reading.name==="Exodus"&&c("2026-11-04").reading.chapter===10,"restart: Nov 4 2026 = Day 1 (petition); Scripture continues at Exodus 10");
 t(c("2026-12-27").day===54&&c("2026-12-27").phase==="thanksgiving"&&c("2026-12-28").day===1&&c("2026-12-28").phase==="petition"&&c("2026-12-28").cycle===2,"loop: Day 54 (Dec 27) is followed by Day 1 (Dec 28), petition again");
 t(c("2026-12-01").day===28&&c("2026-12-01").phase==="thanksgiving"&&c("2026-11-30").day===27&&c("2026-11-30").phase==="petition","days 1-27 petition, 28-54 thanksgiving after the restart");
 t(c("2026-11-03").day===54&&c("2026-10-22").day===42&&c("2026-09-11").day===1,"history unchanged: Sep 11 = Day 1, Oct 22 = Day 42, Nov 3 = Day 54 (same numbers modulo 54)");
 let okd=true;for(let i=0;i<400;i++){const d=L.addDays("2026-11-04",i),r=c(d);if(r.day!==i%54+1||r.surrenderDay!==(r.day-1)%9+1||r.status!=="active")okd=false}t(okd,"400 days after restart: day = days since anchor mod 54, never done/waiting");
 const tot=books.reduce((a,b)=>a+b.chapters,0),last=L.addDays("2026-10-21",tot-46+0);
 const w=c(L.addDays("2026-10-21",tot-45));t(tot===1334&&c(L.addDays("2026-10-21",tot-46)).reading.book==="rev"&&c(L.addDays("2026-10-21",tot-46)).reading.chapter===22&&w.reading.book==="gen"&&w.reading.chapter===1,"Scripture loops: Revelation 22 is followed by Genesis 1 (1334 chapters)");
 t(L.todayNY(new Date("2026-11-04T10:59:00Z"))==="2026-11-03"&&c(L.todayNY(new Date("2026-11-04T10:59:00Z"))).day===54&&c(L.todayNY(new Date("2026-11-04T11:00:00Z"))).day===1,"Day 1 begins at 6 AM ET on Nov 4 (11:00Z EST): 5:59 AM is still Day 54");}
// 2. generator: re-run twice from a fixed date, output must be identical (idempotent)
const from=process.env.FROM||"2026-11-04",run=()=>cp.execFileSync("node",["build_pages.js","--from",from,"--days","1"],{cwd:__dirname}); // prebuilt window: today and tomorrow only (art exists for these); later days are computed in the browser
run();const snap=()=>{const o={};for(let i=0;i<=1;i++){const d=L.addDays(from,i);o[d]=fs.readFileSync(path.join(__dirname,"day",d,"index.html"),"utf8")}return o};
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
// 2b. Nathan, Oct 24: one collage set after every 10 verses (v10, v20, ...) on today..+7, smaller and centered
for(const [d,h] of Object.entries(s1)){const r=L.compute(d,site,books),n=require("./bible/cpdv/"+r.reading.book+".json").chapters[r.reading.chapter-1].length,ref=r.reading.book+":"+r.reading.chapter;
  const want=[];for(let k=10;k<=n;k+=10)want.push(k);
  const okSets=want.every(k=>{const sc=scenes.find(s=>s.ref===ref&&s.after===k),a=h.indexOf(`<span id="v${k}">`),f=h.indexOf('class="lu-collage"',a),b=h.indexOf(`<span id="v${k+1}">`);return sc&&a>0&&f>a&&(b<0||f<b)&&sc.art.every(x=>cred[x])});
  t(okSets&&(h.match(/class="lu-collage"/g)||[]).length===want.length,`${d} ${r.reading.name} ${r.reading.chapter}: ${want.length} collage set(s), one after every 10 verses (${want.map(k=>"v"+k).join(", ")})`);}
{const py=fs.readFileSync(path.join(__dirname,"tools/build_collages.py"),"utf8"),win=Object.keys(s1).map(d=>{const r=L.compute(d,site,books);return r.reading.book+":"+r.reading.chapter});
 const ws=scenes.filter(s=>win.includes(s.ref));t(/C=pop\(C,sc\)/.test(py)&&/def torn/.test(py)&&/def halftone/.test(py)&&/def label/.test(py)&&!/outline=\(255,255,255/.test(py)&&ws.every(s=>s.pop===true&&s.callout&&/\d+:\d+$/.test(s.callout)),`Fisk pop overlays (torn corners, halftone, scripture callout label) built into every set in the window (${ws.length})`);}
{const css=fs.readFileSync(path.join(__dirname,"css/lu.css"),"utf8");t(/\.lu-collage\{width:80%;max-width:640px;margin:18px auto;/.test(css)&&/@media\(max-width:640px\)\{\.lu-collage\{width:100%\}\}/.test(css),"collages 80% wide (max 640px), centered, full width on phones");}
// 2c. Bible in a Year section (Nathan, Oct 24): where/reflection/notes/prayer/sources, retold, on today..+7
{const BY=require("./data/biay.json");for(const [d,h] of Object.entries(s1)){const R0=L.compute(d,site,books).reading,b=BY.chapters[R0.book+":"+R0.chapter],i=k=>h.indexOf(k);
  const pr=b&&b.question,q=(String(pr).match(/\?/g)||[]).length;
  t(b&&i('id="biay"')>i('id="scripture"')&&["where","reflection","notes","prayer","sources"].every((k,j,A)=>i(`data-part="${k}"`)>0&&(j===0||i(`data-part="${k}"`)>i(`data-part="${A[j-1]}"`)))
   &&h.includes("Catechism "+b.ccc.n+".")&&/^\d{1,4}$/.test(String(b.ccc.n))&&b.father.url&&b.haydock.length>=1&&b.haydock.length<=2&&q===1&&h.includes(esc(BY.credit))&&h.includes(b.episode)&&!h.includes("<b>Reflection</b><p>"+esc((C.chapterReflections[L.compute(d,site,books).reading.book+":"+L.compute(d,site,books).reading.chapter]||{}).reflection||"@@")),
   `${d}: Bible in a Year Day ${b&&b.day} (by chapter) section (where, reflection, notes w/ CCC ${b&&b.ccc.n} + Father + Haydock, one prayer question, sources) after scripture`);
  t(b&&new RegExp("\\b"+R0.name+" (\\d+–)?"+"").test(b.readings)&&(()=>{const m=b.readings.match(new RegExp(R0.name+" (\\d+)(?:–(\\d+))?"));return m&&R0.chapter>=+m[1]&&R0.chapter<=+(m[2]||m[1])})()&&!("days" in BY),`${d}: BIAY readings (${b&&b.readings}) include the page's own ${R0.name} ${R0.chapter}`);
  t(b&&[b.reflection,b.ccc.text,b.father.text,...b.haydock.map(x=>x.text)].every(x=>x.split(/\s+/).length<160),`${d}: Bible in a Year text is short retelling, no transcript-length blocks`);}}
// 2d. cameos (Nathan, Oct 24): only where a real stream gag matches a figure; face on that figure, no name tags, never on God/Christ/Eucharist scenes
{const cs=scenes.flatMap(s=>(s.cameos||[]).map(c=>Object.assign({ref:s.ref,after:s.after,scene:s.scene},c))),py=fs.readFileSync(path.join(__dirname,"tools/build_collages.py"),"utf8"),files=fs.readdirSync(path.join(__dirname,"images/cameos"));
 t(scenes.every(s=>!s.cameo)&&cs.every(c=>c.gag&&c.match&&c.h<=.15&&c.cx>0&&c.cx<1&&fs.existsSync(path.join(__dirname,c.file))&&!(c.ref==="exo:3"||c.ref==="exo:6"&&c.after===10||/Christ|Jesus|Eucharist|burning bush|God reassures/i.test(c.scene)))&&!/\['tag'\]/.test(py)&&files.every(f=>cs.some(c=>c.file.endsWith("/"+f)))&&!cp.execSync("git ls-files",{cwd:__dirname}).toString().split("\n").some(f=>/01M5R|cameos\/.*\.jpe?g$/i.test(f)),`${cs.length} gag-matched cameos, no name tags, none on sacred scenes, only used cutouts shipped`);}
// 2e. Prayer of Intentions (approved Oct 24 8:55 PM) + Closing Prayers with a saint of the day, today..+7
{const I=require("./data/intentions.json"),SA=require("./data/saints.json");for(const [d,h] of Object.entries(s1)){const i=k=>h.indexOf(k),s=SA.days[d];
  const ib=i('id="intentions"'),off=i('class="novena-offering"'),cr=i("The Apostles\u2019 Creed"),sc=i('id="scripture"');
  t(ib>i('data-step="opening"')&&(off<0||ib>off)&&ib<cr&&[I.title,I.opening,...I.items,I.closing].every(x=>h.includes(esc(x)))&&I.items.length>=8,`${d}: Prayer of Intentions word for word, after the opening offering, before the Creed`);
  const cp=i('id="closing-prayers"'),hq=i("Hail, Holy Queen");
  t(s&&cp>hq&&cp<sc&&i("St. Michael the Archangel")>cp&&i("St. Padre Pio")>i("St. Michael the Archangel")&&i("St. Joan of Arc")>i("St. Padre Pio")&&i('data-saint="'+esc(s.saint)+'"')>i("St. Joan of Arc")&&h.includes(esc(s.why))&&h.includes(esc(SA.pio))&&h.includes(esc(SA.joan)),`${d}: Closing Prayers (Michael, Padre Pio, Joan of Arc, ${s&&s.saint}) after Hail Holy Queen, before scripture`);}}
function esc(s){return String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]))}
// 3. home page links
const home=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
for(const s of ["Join our Pio's Lost Sheep Discord Server: https://discord.gg/HqXPUEd5JQ","Tithe Your Shekels: https://ko-fi.com/pioslostsheep","https://www.youtube.com/channel/UCSadxDY_Q3o_ELwXacDTP6A/live",'href="novena/"','id="today-link"'])t(home.includes(s),"home has "+s);
t(fs.existsSync(path.join(__dirname,"novena/index.html")),"novena section at /novena/");
// 4. no trademark branding, fonts licensed, no AI images
const pub=["index.html","novena/index.html","css/lu.css","css/style.css",...Object.keys(s1).map(d=>`day/${d}/index.html`)].map(f=>fs.readFileSync(path.join(__dirname,f),"utf8")).join("\n").replace(/<div class="lu-hero-art lu-slides"[\s\S]*?<script src="js\/slides\.js/,"<script src=\"js/slides.js").replace(/<ol class="ep-shorts"[\s\S]*?<\/ol>/g,"");
t(!/\bLEGO\b|Ninjago|Nexus Force|Nintendo|\bWii\b|\b3DS\b|Joy-Con/i.test(pub+fs.readFileSync(path.join(__dirname,"css/private.css"),"utf8")),"no LEGO names/trademarks in pages or CSS");
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
 t(/rel:0,modestbranding:1,iv_load_policy:3,playsinline:1/.test(js)&&/controls:0/.test(js)&&/mute:1/.test(js)&&js.includes('"https://www.youtube.com/embed/"+FALLBACK_YT+"?autoplay=1&mute=1&loop=1&playlist="+FALLBACK_YT+"&controls=0&rel=0&modestbranding=1&iv_load_policy=3&playsinline=1'),"YouTube params: muted, no controls, rel=0, modestbranding, iv_load_policy=3, playsinline");
 t(/OBS\?\{start:t0,autoplay:1,mute:1,controls:0/.test(js)&&/:\{start:t0,autoplay:1,mute:1,controls:1,rel:0,modestbranding:1,iv_load_policy:3,playsinline:1,fs:1/.test(js),"normal mode = YouTube native controls (controls=1, fs=1); OBS = controls=0");
 t(/obs"\)==="1"/.test(js)&&/\\bOBS\\\//.test(js)&&/obsstudio/.test(js)&&/sh\.remove\(\)/.test(js)&&!/id="rw-bar"/.test(h),"OBS detection; normal mode removes shield so YouTube controls are clickable; no custom bar");
 t(/object-fit:cover/.test(h)&&/16\/9/.test(js)&&/k=1\.18/.test(js)&&/else\{w=W;h=H\}/.test(js),"OBS: 16:9 cover + oversize crop; normal: window-sized");
 t(/rewind\.js\?v=[0-9a-f]{7,12}"/.test(h)&&/http-equiv="Cache-Control" content="no-cache/.test(h)&&/css\/lu\.css\?v=[0-9a-f]{7,12}"/.test(fs.readFileSync(path.join(__dirname,"index.html"),"utf8"))&&/\.\.\/js\/app\.js\?v=[0-9a-f]{7,12}"/.test(fs.readFileSync(path.join(__dirname,"novena/index.html"),"utf8")),"cache-busting ?v= on JS/CSS + no-cache meta");
 t(/src="\.\.\/js\/rewind\.js\?v=/.test(h)&&js.includes('"../data/rewind_playlist.json"'),"rewind reads data/rewind_playlist.json at runtime");
 t(/v\.muted=true/.test(js)&&/"ended"/.test(js)&&/%blocks\.length/.test(js)&&/e\.data===0/.test(js),"player: muted, advances on ended, loops");
 t(h.includes(">Audio is LIVE &middot; Gameplay is a REWIND<")||h.includes(">Audio is LIVE · Gameplay is a REWIND<"),"rewind banner exact text");
 t(/overflow:hidden/.test(h)&&/background:#000/.test(h),"rewind full-window, black, no scrollbars");
 t(/noindex/.test(h),"rewind noindex");
 const pages=["index.html","novena/index.html","day/index.html",...fs.readdirSync(path.join(__dirname,"day")).filter(x=>/^\d{4}/.test(x)).map(d=>"day/"+d+"/index.html")];
t(pages.filter(f=>f!=="index.html").every(f=>!/rewind/i.test(fs.readFileSync(path.join(__dirname,f),"utf8"))),"rewind only linked from home page (Nathan, Oct 24)");
t(/href="https:\/\/nathanpburson.github.io\/novena\/rewind\/\?obs=1"/.test(fs.readFileSync(path.join(__dirname,"index.html"),"utf8")),"home links Rewind (OBS)");
 t(!fs.existsSync(path.join(__dirname,"sitemap.xml"))||!/rewind/.test(fs.readFileSync(path.join(__dirname,"sitemap.xml"),"utf8")),"rewind not in sitemap");
 t(/html,body\{margin:0;padding:0;border:0;width:100%;height:100%;overflow:hidden;background:#000\}/.test(h)&&!/max-width:\d/.test(h),"rewind: no margins/scrollbars/size caps");
 t(RW.rotateSec===600&&h.includes("window.REWIND_ROTATE=600")&&/cur\.t\(\)-t0>=ROT/.test(js)&&/start:t0/.test(js),"rotate after rotateSec (600, from data/rewind.json) or on end; start param per pass");
 t(/ST\.off\[b\.k\]=\(ended\|\|\(E&&t>=E-30\)\)\?b\.s:Math\.max\(b\.s,t\)/.test(js),"per-clip offsets advance and wrap before the end");
 t(/setInterval\(save,5000\)/.test(js)&&/localStorage\.setItem\(KEY/.test(js)&&/ST\.resume=true/.test(js),"position saved every 5s in localStorage and resumed on reload");
 // build copies the manifest (and picks up changes); missing manifest -> empty list -> YouTube fallback
 const os=require("os"),tm=path.join(os.tmpdir(),"rw_test_manifest.json"),plf=path.join(__dirname,"data/rewind_playlist.json"),keep=fs.readFileSync(plf,"utf8");
 const bld=env=>cp.execFileSync("node",["build_pages.js","--from",from,"--days","1"],{cwd:__dirname,env:Object.assign({},process.env,env)});
 fs.writeFileSync(tm,JSON.stringify({blocks:["1AbCdEfGhIjKlMnOp",{driveId:"1QrStUvWxYz012345",title:"B"},{youtubeId:"BBEOOdY_k5A"}]}));bld({REWIND_MANIFEST:tm});
 let pl=JSON.parse(fs.readFileSync(plf,"utf8"));t(pl.blocks.length===3&&pl.blocks[1].driveId==="1QrStUvWxYz012345","build copies manifest into data/rewind_playlist.json");
 fs.writeFileSync(tm,JSON.stringify(["1AbCdEfGhIjKlMnOp"]));bld({REWIND_MANIFEST:tm});pl=JSON.parse(fs.readFileSync(plf,"utf8"));t(pl.blocks.length===1,"build picks up a changed manifest (array form)");
 fs.unlinkSync(tm);bld({REWIND_MANIFEST:tm});pl=JSON.parse(fs.readFileSync(plf,"utf8"));t(Array.isArray(pl.blocks)&&pl.blocks.length===0&&/if\(!blocks\.length\)throw 0/.test(js)&&/blocks=\[\{yt:FALLBACK_YT,/.test(js),"missing manifest -> empty playlist -> YouTube fallback");
 fs.writeFileSync(plf,keep);bld({});}
{const _r=require('fs').readFileSync(__dirname+'/js/rewind.js','utf8');const ok=/unloadModule\('captions'\)/.test(_r)&&/setOption\('captions','track',\{\}\)/.test(_r)&&/cc_lang_pref/.test(_r)&&/if\(!OBS/.test(_r);console.log((ok?'PASS':'FAIL')+' rewind: OBS mode disables captions');if(!ok)process.exit(1)}
{const hp=path.join(__dirname,"hours/index.html"),hh=fs.existsSync(hp)?fs.readFileSync(hp,"utf8"):"";
 t(hh.length>0,"hours page exists");
 t(["lauds","readings","sext","vespers","compline"].every(k=>hh.includes(`data-hour="${k}"`))&&hh.includes('src="../js/hours.js')&&/America\/New_York/.test(fs.readFileSync(path.join(__dirname,"js/hours.js"),"utf8")),"hours page has all 5 hours (Lauds, Readings, Midday, Vespers, Compline) and follows the NY date");
 t(/<noscript>[\s\S]*https:\/\/universalis\.com\/USA\/"/.test(hh)&&/provided by <a href="https:\/\/universalis\.com\/"/.test(hh),"hours page has noscript fallback and Universalis credit");
 t(!/discord\.gg/i.test(hh),"hours page has no discord.gg links");
 const ih=fs.readFileSync(path.join(__dirname,"index.html"),"utf8"),dh=Object.values(s1)[0];
 t(ih.includes('href="hours/"')&&dh.includes('href="../../hours/"'),"hours linked from home page and day pages nav");}
{const dd=path.join(__dirname,"day"),ds=fs.readdirSync(dd).filter(x=>/^\d{4}-\d{2}-\d{2}$/.test(x));let pu=true,co=true,dc=true;
 for(const d of ds){const h=fs.readFileSync(path.join(dd,d,"index.html"),"utf8");
  if(!(h.includes("Guardian of virgins, and holy father Joseph")&&h.includes("Source: Traditional; Raccolta")))pu=false;
  const u=`https://universalis.com/USA/${d.replace(/-/g,"")}/compline.htm`,ci=h.indexOf(u),sc=h.lastIndexOf("The Sign of the Cross"),pi=h.indexOf('id="purity-prayer"'),lp=h.lastIndexOf('class="lu-prayer"');
  if(!(ci>sc&&sc>pi&&pi>0&&(()=>{const n=h.indexOf('id="night-prayer"'),e=h.indexOf("</section>",n),q=h.indexOf('class="lu-prayer',n);return q<0||q>e})()&&h.includes('provided by <a href="https://universalis.com/"')))co=false;
  const outside=h.replace(/<section class="lu-panel" id="episode"[\s\S]*?<\/section>/,"");
  if(/discord\.gg/i.test(outside))dc=false;}
 t(ds.length>0&&pu,"purity prayer with source on every day page");
 t(ds.length>0&&co,"Compline link matches each page date and is last in the prayers");
 t(dc,"no discord.gg links on day pages");}
{const pg=[];const walk=d=>{for(const x of fs.readdirSync(d,{withFileTypes:true})){const f=path.join(d,x.name);if(x.isDirectory()&&!/^(\.git|_source_snapshot|node_modules|bible|fonts)$/.test(x.name))walk(f);else if(x.name==="index.html")pg.push(f)}};walk(__dirname);
 let fi=true,av=true;for(const f of pg){if(/[\/\\]p-[0-9a-f]{24}[\/\\]/.test(f))continue;const h=fs.readFileSync(f,"utf8");if(!(/rel="icon"[^>]*favicon-32\.png/.test(h)&&/rel="apple-touch-icon"[^>]*apple-touch-icon\.png/.test(h)))fi=false;if(!/rewind/.test(f)&&!/<img class="lu-avatar" src="[^"]*images\/channel_avatar_96\.png"/.test(h))av=false;}
 t(pg.length>5&&fi,"every page has favicon and apple-touch-icon links");t(av,"every page header has the round channel avatar");
 t(["favicon-32.png","apple-touch-icon.png","images/channel_avatar_96.png","images/channel_avatar.jpg"].every(x=>fs.existsSync(path.join(__dirname,x))),"avatar and icon files exist");}
{// On-site Liturgy of the Hours: five stacked Universalis iframes, one scrolling page
 const H=require("./js/hours.js"),hh=fs.readFileSync(path.join(__dirname,"hours/index.html"),"utf8"),hs=fs.readFileSync(path.join(__dirname,"js/hours.js"),"utf8"),hc=fs.readFileSync(path.join(__dirname,"css/hours.css"),"utf8"),keys=["readings","lauds","sext","vespers","compline"];
 t(H.universalisUrl("2026-10-28","vespers")==="https://universalis.com/usa/20261028/vespers.htm"&&H.universalisUrl("2026-11-01","readings")==="https://universalis.com/usa/20261101/readings.htm","hours.js builds dated Universalis (usa) hour URLs");
 t(H.addDays("2026-10-31",1)==="2026-11-01"&&H.addDays("2026-03-01",-1)==="2026-02-28"&&/^\d{4}-\d\d-\d\d$/.test(H.todayNY())&&/America\/New_York/.test(hs),"hours.js date helpers (month rollover, NY today)");
 t(JSON.stringify(H.HOURS.map(h=>h.k))===JSON.stringify(keys),"hours are in order: Readings, Lauds, Midday, Vespers, Compline");
 const pos=keys.map(k=>hh.indexOf(`id="hour-${k}"`));t(pos.every((p,i)=>p>0&&(i==0||p>pos[i-1])),"hours page stacks the 5 hours top to bottom in order");
 t(keys.every(k=>new RegExp(`id="hour-${k}"><h2>[^<]+</h2><iframe class="hrs-frame" id="hrs-frame-${k}"`).test(hh)),"each hour has its own heading and its own iframe");
 t((hh.match(/<iframe /g)||[]).length===5&&!/<iframe[^>]*src=/.test(hh)&&/universalis\.com\/usa\//.test(hs),"exactly five iframes, all pointed at Universalis by hours.js");
 t(keys.every(k=>{const m=hc.match(new RegExp(`#hrs-frame-${k}\\{height:(\\d+)px`));return m&&+m[1]>=4000}),"each frame is tall (4000px+) so the page scrolls, not the frames");
 t(!/<button[^>]*data-hr=|data-mode|hrs-hours|hrs-modes/.test(hh+hs)&&["hrs-prev","hrs-today","hrs-next","hrs-date"].every(i=>hh.includes(`id="${i}"`)),"no hour tabs or buttons; only previous/today/next and the date remain");
 t(hh.includes("https://universalis.com/n-iframe.htm")&&hh.includes("&copy; Universalis Publishing Ltd")&&hh.includes("Jerusalem Bible")&&/<noscript>[\s\S]*https:\/\/universalis\.com\/USA\/"/.test(hh)&&/provided by <a href="https:\/\/universalis\.com\/"/.test(hh),"credit, copyright, documented-iframe link and noscript fallback present");
 t(!/trad|Divinum|Douay/i.test(hh+hs+hc)&&!fs.existsSync(path.join(__dirname,"hours/trad"))&&!fs.existsSync(path.join(__dirname,"tools/gen_hours.js")),"no traditional-office text or generator remains (modern only)");
 t(!/discord\.gg|discord\.com/i.test(hh+hs),"hours page and script have no Discord links");
 const ih2=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");t(ih2.includes('href="hours/">Liturgy of the Hours (daily text)'),"home page links to the on-site Hours page");}
{// 6 AM rollover + streams
 const D=s=>new Date(s),site=JSON.parse(fs.readFileSync(path.join(__dirname,"data/site.json"),"utf8"));
 t(L.todayNY(D("2026-10-31T09:59:00Z"))==="2026-10-30"&&L.todayNY(D("2026-10-31T10:00:00Z"))==="2026-10-31","today rolls over at 6 AM EDT (10:00Z), not midnight");
 t(L.todayNY(D("2026-11-01T05:30:00Z"))==="2026-10-31"&&L.todayNY(D("2026-11-01T10:59:00Z"))==="2026-10-31"&&L.todayNY(D("2026-10-31T04:00:00Z"))==="2026-10-30"&&L.todayNY(D("2026-11-01T11:00:00Z"))==="2026-11-01","1:30 AM Sun Nov 1 still counts as Saturday; 6 AM EST (11:00Z) rolls over after DST ends");
 t(require("./js/hours.js").todayNY(D("2026-10-31T09:59:00Z"))==="2026-10-30"&&require("./js/hours.js").todayNY(D("2026-10-31T10:00:00Z"))==="2026-10-31","/hours/ today uses the same 6 AM rollover");
 const S=site.streams||[],ton=S[0],live="https://www.youtube.com/channel/UCSadxDY_Q3o_ELwXacDTP6A/live";
 t(S.length===1&&ton&&ton.startUtc==="2026-11-09T02:00:00Z"&&ton.url===live&&ton.display==="Sunday night, Nov 8 · 9:00 PM ET (usual time; no YouTube premiere is scheduled)"&&ton.title==="Watch live on YouTube"&&!/9-eW7sD3Pa0/.test(JSON.stringify(S)),"tonight is the usual Sunday 9:00 PM ET time on the channel live page, with no scheduled premiere id");
 t(D("2026-11-08T02:00:00Z").toLocaleString("en-US",{timeZone:"America/New_York",hour:"numeric",minute:"2-digit",timeZoneName:"short"})==="9:00 PM EST","02:00Z is 9:00 PM EST");
 t(D("2026-11-09T02:00:00Z").toLocaleString("en-US",{timeZone:"America/New_York",hour:"numeric",minute:"2-digit",timeZoneName:"short"})==="9:00 PM EST","Sunday 02:00Z is 9:00 PM EST");
 t(D("2026-11-01T05:30:00Z").toLocaleString("en-US",{timeZone:"America/New_York",hour:"numeric",minute:"2-digit",timeZoneName:"short"})==="1:30 AM EDT","05:30Z is 1:30 AM EDT");
 const fix=[{startUtc:"2026-10-31T03:00:00Z",display:"Friday night, Oct 30 · 11:00 PM ET"},{startUtc:"2026-11-01T05:30:00Z",display:"Saturday night's stream · starts 1:30 AM ET"}];
 t(L.nextStream(fix,D("2026-10-30T20:00:00Z")).startUtc==="2026-10-31T03:00:00Z"&&L.nextStream(fix,D("2026-10-31T08:00:00Z")).startUtc==="2026-11-01T05:30:00Z"&&L.nextStream(fix,D("2026-11-02T00:00:00Z"))===null,"nextStream picks the upcoming stream and drops past ones");
 const sat=[{startUtc:"2026-11-08T02:00:00Z",url:"https://www.youtube.com/watch?v=9-eW7sD3Pa0",display:"Saturday night, Nov 7 · 9:00 PM ET"}];
 t(L.streamForToday(sat,D("2026-11-08T01:00:00Z")).url===sat[0].url&&L.streamForToday(sat,D("2026-11-08T07:00:00Z")).url===sat[0].url&&L.streamForToday(sat,D("2026-11-08T11:00:00Z"))===null,"Sat Nov 7 stream stays up through the site-day and drops at 6 AM");
 t(L.streamForToday(S,D("2026-11-08T16:00:00Z")).url===live&&L.nextStream(S,D("2026-11-09T05:30:00Z")).url===live&&L.streamForToday(S,D("2026-11-09T10:30:00Z")).url===live&&L.streamForToday(S,D("2026-11-09T11:00:00Z"))===null,"Sunday 9 PM stream shows on Sunday's site-day and drops at 6 AM Monday");
 t(/in 1h 30m$/.test(L.countdown("2026-11-01T05:30:00Z",D("2026-11-01T04:00:00Z"))),"countdown targets 05:30Z");
 const hmStream=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
 t(hmStream.includes('id="stream-panel"')&&hmStream.includes(live)&&hmStream.includes("Sunday night, Nov 8 · 9:00 PM ET (usual time; no YouTube premiere is scheduled)")&&!/Saturday night, Nov 7/.test(hmStream)&&!/9-eW7sD3Pa0/.test(hmStream)&&!/Oct 30/.test(hmStream)&&!/2026-10-31T03:00:00Z/.test(hmStream),"home page shows Sunday night's usual stream and not last night's VOD");}
{// Night Prayer (Compline) embedded in every day page: public-domain Douay/CPDV, Universalis kept as the official option
 const CD=require("./data/compline.json"),V=(b,c)=>require("./bible/cpdv/"+b+".json").chapters[c-1],dd=fs.readdirSync(path.join(__dirname,"day")).filter(x=>/^\d{4}-\d\d-\d\d$/.test(x));let good=true;
 for(const d of dd){const h=fs.readFileSync(path.join(__dirname,"day",d,"index.html"),"utf8"),n=h.indexOf('id="night-prayer"'),e=h.indexOf("</section>",n),seg=h.slice(n,e),idx=k=>seg.indexOf(esc(k));
  const need=[V("psa",4)[1],V("psa",90)[3].slice(0,40),V("psa",133)[2],V("1pe",5)[7].slice(0,40),V("luk",2)[28].slice(1,30),"Before the ending of the day","Visit, we beseech thee, O Lord, this dwelling","May the almighty Lord grant us a quiet night"];
  const order=["Opening","Examination of conscience","Hymn","Psalm 4 ","Psalm 90","Psalm 133","Short Reading","Responsory","Canticle of Simeon","Prayer","Blessing","Hail, Holy Queen"].map(k=>seg.indexOf("<h4>"+k));
  if(!(n>0&&need.every(x=>seg.includes(esc(x)))&&order.every((p,i)=>p>0&&(i===0||p>order[i-1]))&&seg.includes("<details")&&seg.includes("compline.htm")&&seg.includes("public-domain")&&h.lastIndexOf("The Sign of the Cross")<n&&!/International Commission|ICEL/.test(seg)))good=false}
 t(dd.length>0&&good,`Night Prayer on all ${dd.length} day pages: Compline order (opening, examination, hymn, Ps 4/90/133, reading, responsory, Nunc dimittis, prayer, blessing, Salve) from CPDV + PD texts, last in the prayers, Universalis kept as official link`);
 const ap=fs.readFileSync(path.join(__dirname,"js/app.js"),"utf8"),nh=fs.readFileSync(path.join(__dirname,"novena/index.html"),"utf8");
 t(/NovenaCompline\.html\(CD,"prayer"\)/.test(ap)&&nh.includes("../js/compline.js")&&CD.sections.length===12&&/copyrighted/.test(CD.note),"Pray tab of the Novena app embeds the same Compline; note says modern text is copyrighted and not used");
 // loop + readings + 404 + restyle
 const hm=fs.readFileSync(path.join(__dirname,"index.html"),"utf8"),rp=fs.readFileSync(path.join(__dirname,"readings/index.html"),"utf8"),rj=require("./js/readings.js"),nf=fs.readFileSync(path.join(__dirname,"404.html"),"utf8");
 t(rj.massUrl("2026-11-04")==="https://universalis.com/usa/20261104/mass.htm"&&/id="rd-frame"/.test(rp)&&!/<iframe[^>]*src=/.test(rp)&&rp.includes("https://universalis.com/n-iframe.htm")&&rp.includes("&copy; Universalis Publishing Ltd")&&/<noscript>[\s\S]*mass\.htm/.test(rp)&&!/discord\.gg/.test(rp)&&hm.includes('href="readings/"'),"/readings/: Universalis Mass readings iframe set by the browser from the NY date (no daily build), credit, noscript, linked from home");
 const ho=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
 const ny=L.todayNY(),nr=L.compute(ny,site,books),pretty=(function(d){var p=d.split("-"),M=["January","February","March","April","May","June","July","August","September","October","November","December"];return M[p[1]-1]+" "+(+p[2])+", "+p[0]})(ny);
 t(/NovenaLogic\.compute\(d,SITE,BK\)/.test(ho)&&ho.includes('id="today-text"')&&!/Novena day 50/.test(ho)&&ho.includes("Novena day "+nr.day+" of 54")&&ho.includes('href="day/'+ny+'/"')&&ho.includes("Today's page &middot; "+pretty)&&ho.includes('a.innerHTML="Today\'s page &middot; "'),"home 'Today' panel is computed in the browser (static fallback is current); no stale day");
 {const a=ho.indexOf('id="latest-episode"'),b=ho.indexOf("https://www.youtube.com/embed/3A509tCcfCw"),c=ho.indexOf("images/episodes/3A509tCcfCw.jpg"),d=ho.indexOf('id="shorts"'),e=ho.indexOf('id="today-link"'),f=ho.indexOf('id="stream-panel"'),g=ho.indexOf('class="ep-chapters"'),s=ho.indexOf('id="lu-slides"');
  t(a>=0&&a<b&&b<c&&c<d&&d<e&&e<f&&f<g&&g<s,"home leads with the episode embed, v3 thumbnail, three Shorts, today's page, then tonight's stream");
  t(["TOEhUTqr72M","OjtYTj55CtE","oJChtC1nzao"].every(id=>ho.indexOf("https://www.youtube.com/embed/"+id)>d&&ho.indexOf("https://www.youtube.com/embed/"+id)<e),"the three newest Shorts sit above today's link");}
 t(ho.includes("Join our Pio's Lost Sheep Discord Server: https://discord.gg/HqXPUEd5JQ")&&ho.includes("Tithe Your Shekels: https://ko-fi.com/pioslostsheep")&&!/\bdonate\b/i.test(ho),"home keeps the Discord and Tithe Your Shekels lines");
 t(/location\.replace\(m\[1\]\+"novena\/\?date="\+m\[2\]\+"#today"\)/.test(nf)&&/noindex/.test(nf),"404.html sends un-built /day/YYYY-MM-DD/ pages to the live Novena page for that date");
 const nvh=fs.readFileSync(path.join(__dirname,"novena/index.html"),"utf8");
 t((ho.match(/class="lu-tile /g)||[]).length===7&&ho.includes('id="channels"')&&ho.includes('href="novena/"')&&(ho.match(/p-[0-9a-f]{24}/g)||[]).length===2&&/<a class="nav-myspace" href="p-[0-9a-f]{24}\/" rel="nofollow">/.test(ho)&&/<a class="lu-tile c-teal" href="p-[0-9a-f]{24}\/" rel="nofollow" id="tile-myspace">/.test(ho),"home has a seven-tile grid; only private link is the nofollow Account tile");
 const css=fs.readFileSync(path.join(__dirname,"css/lu.css"),"utf8");
 t(/\.lu-tile\{/.test(css)&&/\.lu-hud-top\{background:linear-gradient\(#ffffff/.test(css)&&/\.lu-panel:before\{content:""/.test(css)&&/\.lu-clock/.test(css)&&dd.every(d=>fs.readFileSync(path.join(__dirname,"day",d,"index.html"),"utf8").includes('id="lu-clock"')),"restyle: channel tiles, glossy panels, bright top bar with clock on every built page");
 t(fs.existsSync(path.join(__dirname,"images/header.jpg"))&&/header\.jpg/.test(css)&&!fs.readdirSync(path.join(__dirname,"images")).some(f=>/ai[-_]|generated/i.test(f)),"Fisk public-domain art kept, no AI images added");
}

// v4: web-app bar, manifest, cache bust, slideshow
{const GVh=require("child_process").execSync("git rev-parse --short HEAD",{cwd:__dirname}).toString().trim();
 const pages=["index.html","readings/index.html","hours/index.html","novena/index.html",...fs.readdirSync(path.join(__dirname,"day")).filter(d=>/^\d{4}-/.test(d)).slice(0,3).map(d=>"day/"+d+"/index.html")];
 for(const p of pages){const h=fs.readFileSync(path.join(__dirname,p),"utf8"),home=p==="index.html";
  t(/viewport-fit=cover/.test(h)&&/rel="manifest"/.test(h)&&/name="theme-color" content="#0a1030"/.test(h)&&/apple-mobile-web-app-capable/.test(h)&&/apple-mobile-web-app-status-bar-style/.test(h),p+": PWA meta + viewport-fit=cover");
  t(/class="nav-myspace"[^>]*rel="nofollow"/.test(h),p+": Account nav button (nofollow)");
  if(!home)t(/id="app-back"/.test(h)&&/aria-label="Home"/.test(h)&&/app-bar/.test(h)&&/js\/appbar\.js/.test(h),p+": sticky app bar with Back + Home");
  const refs=h.match(/(?:href|src)="[^"]*\.(?:css|js)(?:\?[^"]*)?"/g)||[];t(refs.length>0&&refs.every(r=>r.includes("?v="+GVh)||r.includes("?v=")&&/rewind/.test(p)),p+": every CSS/JS URL carries ?v=<commit>")}
 const m=JSON.parse(fs.readFileSync(path.join(__dirname,"manifest.webmanifest"),"utf8"));t(m.display==="standalone"&&/^#0/.test(m.theme_color),"site manifest: standalone, dark theme-color");
 const c=fs.readFileSync(path.join(__dirname,"css/lu.css"),"utf8");t(/\.app-bar\{position:sticky/.test(c)&&/env\(safe-area-inset-top\)/.test(c)&&/min-height:44px;min-width:44px/.test(c)&&/\[hidden\]\{display:none!important\}/.test(c),"app bar CSS: sticky, safe-area, 44px targets, [hidden] rule");
 const a=fs.readFileSync(path.join(__dirname,"js/appbar.js"),"utf8");t(/history\.back\(\)/.test(a)&&/location\.href/.test(a),"Back uses history.back() with home fallback");
 const ho=fs.readFileSync(path.join(__dirname,"index.html"),"utf8"),sl=JSON.parse(fs.readFileSync(path.join(__dirname,"data/slides.json"),"utf8")),imgs=ho.match(/<a class="lu-slide[^>]*><img [^>]*>/g)||[];
 t(sl.length>=10&&imgs.length===sl.length&&imgs.slice(1).every(x=>/loading="lazy"/.test(x))&&!/loading="lazy"/.test(imgs[0])&&sl.every(s=>{const f=path.join(__dirname,"images/thumbs/"+s.id+".webp");return fs.existsSync(f)&&fs.statSync(f).size<=62*1024&&ho.includes("watch?v="+s.id)}),"hero slideshow: "+sl.length+" linked WebP slides, <=62KB, lazy after first");
 const sj=fs.readFileSync(path.join(__dirname,"js/slides.js"),"utf8");t(/4000/.test(sj)&&/prefers-reduced-motion/.test(sj)&&/mouseenter/.test(sj),"slideshow: 4s, pause on hover, reduced-motion");
 const sw=fs.readFileSync(path.join(__dirname,fs.readdirSync(__dirname).find(d=>/^p-[0-9a-f]{24}$/.test(d))+"/sw.js"),"utf8");t(!/pv-shell-v1"/.test(sw)&&/skipWaiting/.test(sw)&&/clients\.claim/.test(sw)&&/caches\.delete/.test(sw),"service worker cache bumped, skipWaiting/claim/old-cache cleanup")}
{const r=cp.spawnSync("node",["test_private.js"],{cwd:__dirname,encoding:"utf8"});process.stdout.write(r.stdout);t(r.status===0,"private area tests (test_private.js)");if(r.stderr)console.log(r.stderr)}
{// Today mark, trivia through the Tuesday refill, Episode 169 embed
 const ny=L.todayNY(),dow=new Date(ny+"T12:00:00Z").getUTCDay(),toTue=((2-dow+7)%7)||7,last=L.addDays(ny,toTue);
 const di=fs.readFileSync(path.join(__dirname,"day/index.html"),"utf8");
 t(di.includes('data-date="'+ny+'"')&&di.includes('aria-current="date"')&&di.includes("today-mark"),"daily index marks "+ny+" as today");
 const th=fs.readFileSync(path.join(__dirname,"day",ny,"index.html"),"utf8");
 t(/id="today-flag"(?! hidden)/.test(th)&&th.includes('data-date="'+ny+'"'),ny+" page header is marked Today");
 const other=L.addDays(ny,1),oh=fs.readFileSync(path.join(__dirname,"day",other,"index.html"),"utf8");
 t(/id="today-flag" hidden/.test(oh),other+" is not marked today");
 let tr=true;for(let d=ny;d<=last;d=L.addDays(d,1)){const h=fs.readFileSync(path.join(__dirname,"day",d,"index.html"),"utf8"),r=L.compute(d,site,books);
  const items=(require("./data/trivia.json").chapters[r.reading.book+":"+r.reading.chapter]||{}).items||[];
  if(!(h.indexOf('id="trivia"')>h.indexOf('id="scripture"')&&h.lastIndexOf('id="trivia"')>h.lastIndexOf('id="biay"')&&items.length>=2&&items.every(x=>h.includes(esc(x)))))tr=false;}
 t(tr,"trivia section is last content on each day through the Tuesday refill ("+ny+" to "+last+") and matches that day's chapter");
 const ep=require("./data/episodes.json").episodes[0],eh=fs.readFileSync(path.join(__dirname,"episodes/169/index.html"),"utf8"),home=fs.readFileSync(path.join(__dirname,"index.html"),"utf8"),dayh=fs.readFileSync(path.join(__dirname,"day/2026-11-07/index.html"),"utf8"),epi=fs.readFileSync(path.join(__dirname,"episodes/index.html"),"utf8");
 const embed='src="https://www.youtube.com/embed/3A509tCcfCw"';
 const posted=(ep.shorts||[]).filter(s=>/^[A-Za-z0-9_-]{11}$/.test(String(s.id||"")));
 t(ep.id==="3A509tCcfCw"&&[eh,home,dayh,epi].every(h=>h.includes(embed)&&h.includes(esc(ep.title))&&ep.chapters.every(c=>h.includes(esc(c.title)))&&(h.match(/class="ep-short empty"/g)||[]).length===2&&posted.length===3&&posted.every(s=>h.includes('src="https://www.youtube.com/embed/'+s.id+'"')&&h.includes(esc(s.title)))&&h.includes("https://discord.gg/HqXPUEd5JQ")&&h.includes("https://ko-fi.com/pioslostsheep")),"Episode 169 embed, chapters, three published Shorts, two empty slots, and funnel links on the episode page, home, episodes index, and Nov 7");
 t(!/original live|unlisted source/i.test(eh+home+dayh)&&fs.existsSync(path.join(__dirname,"images/episodes/3A509tCcfCw.jpg")),"episode pages stay on the public upload; approved thumbnail is on disk");
}
console.log("NY today:",L.todayNY());process.exit(ok?0:1);


