// Pio's Lost Sheep static page generator. Usage: node build_pages.js [--from YYYY-MM-DD] [--days 7]
// Builds /day/YYYY-MM-DD/index.html for today (America/New_York) through +7 days, the home page (/index.html)
// and /day/index.html. Idempotent: pages are fully rewritten each run; older day pages are kept.
const fs=require("fs"),path=require("path"),L=require("./js/logic.js");
const R=__dirname,J=f=>JSON.parse(fs.readFileSync(path.join(R,f)));
const site=J("data/site.json"),C=J("data/content.json"),SC=J("data/scenes.json").scenes,ART=J("data/art_meta.json"),CR=J("data/art_credits.json"),NT=J("data/novena_traditional.json");
const a=process.argv.slice(2),arg=(k,d)=>{const i=a.indexOf(k);return i>=0?a[i+1]:d};
const from=arg("--from",L.todayNY()),ahead=+arg("--days",7);
const VA=require("crypto").createHash("sha1").update(["css/lu.css","css/style.css","js/logic.js","js/app.js"].map(f=>fs.readFileSync(path.join(R,f))).join("")).digest("hex").slice(0,10); // asset cache-bust hash
const byId={};C.books.forEach(b=>byId[b.id]=b);
const MN={joyful:"Joyful",sorrowful:"Sorrowful",glorious:"Glorious",luminous:"Luminous"};
const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const fmt=d=>{const[y,m,dd]=d.split("-");return["January","February","March","April","May","June","July","August","September","October","November","December"][m-1]+" "+(+dd)+", "+y};
const wk=d=>["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][new Date(d+"T12:00:00Z").getUTCDay()];
const intention=()=>(site.intention||"").trim()||"the favor I place in your hands"; // used verbatim
const INT=fs.existsSync(path.join(R,"data/intentions.json"))?J("data/intentions.json"):null,SA=fs.existsSync(path.join(R,"data/saints.json"))?J("data/saints.json"):null;
const intentionsBox=()=>INT?`<div class="lu-prayer" id="intentions"><h4>${esc(INT.title)}</h4><p>${esc(INT.opening)}</p><ul>${INT.items.map(x=>"<li>"+esc(x)+"</li>").join("")}</ul><p>${esc(INT.closing)}</p></div>`:"";
const closingPrayers=d=>{if(!SA)return "";const s=SA.days[d];return `<div class="closing-prayers" id="closing-prayers"><h3 class="lu-step" data-step="closing-prayers">Closing Prayers</h3>`+pr("St. Michael the Archangel",SA.michael)+pr("St. Padre Pio",SA.pio)+pr("St. Joan of Arc",SA.joan)+(s?`<div class="lu-prayer" data-saint="${esc(s.saint)}"><h4>${esc(s.saint)}</h4><p class="lu-muted saint-why">${esc(s.why)}</p><p>${esc(s.prayer)}</p></div>`:"")+purityBox()+`</div>`};
const PURITY="Guardian of virgins, and holy father Joseph, to whose faithful custody Christ Jesus, Innocence itself, and Mary, Virgin of virgins, were committed; I pray and beseech thee, by these dear pledges, Jesus and Mary, that, being preserved from all uncleanness, I may with spotless mind, pure heart, and chaste body, ever serve Jesus and Mary most chastely all the days of my life. Amen.";
const purityBox=()=>`<div class="lu-prayer" id="purity-prayer"><h4>Prayer for Purity (to St. Joseph)</h4><p>${esc(PURITY)}</p><p class="lu-muted purity-source">Source: Traditional; Raccolta (&ldquo;Virginum custos&rdquo;)</p></div>`;
const complineBox=d=>`<div class="lu-prayer" id="night-prayer"><h4>Night Prayer (Compline)</h4><p><a class="lu-btn blue" data-compline="${d}" href="https://universalis.com/USA/${d.replace(/-/g,"")}/compline.htm" rel="noopener">Pray Night Prayer for this day on Universalis &rarr;</a></p><p class="lu-muted">Texts of the Hours are provided by <a href="https://universalis.com/" rel="noopener">Universalis</a>; this site only links to them.</p></div>`;
const pr=(t,x)=>`<div class="lu-prayer"><h4>${esc(t)}</h4><p>${esc(x)}</p></div>`;
function credit(t){const m=ART[t],c=CR[t]||{};return `<li><b>${esc(c.title||m.title)}</b> &mdash; ${esc(c.artist||m.artist)}${c.date?" ("+esc(c.date)+")":""} &middot; ${esc(m.license)} &middot; <a href="${esc(m.source)}" rel="noopener">source</a></li>`}
function imgv(f){const p=path.join(R,f);return f+(fs.existsSync(p)?"?v="+require("crypto").createHash("sha1").update(fs.readFileSync(p)).digest("hex").slice(0,10):"")}
const BY=fs.existsSync(path.join(R,"data/biay.json"))?J("data/biay.json"):{chapters:{}};
// Bible in a Year: Where we are / Reflection / Notes / For prayer / sources, all retold in our own words (Nathan, Oct 24)
function biay(key){const b=BY.chapters[key];if(!b)return "";const a=(u,t)=>`<a href="${esc(u)}" rel="noopener">${esc(t)}</a>`;
 return `<section class="lu-panel" id="biay"><div class="lu-tabhead">Bible in a Year &middot; Day ${b.day}</div>`+
 `<div class="lu-note" data-part="where"><b>Where we are</b><p>Day ${b.day} &middot; <i>${esc(b.title)}</i><br>Readings: ${esc(b.readings)}<br>Timeline period: ${esc(b.period)}</p></div>`+
 `<div class="lu-note" data-part="reflection"><b>Reflection</b><p>${esc(b.reflection)}</p></div>`+
 `<div class="lu-note" data-part="notes"><b>Notes</b><ul><li><b>Catechism ${b.ccc.n}.</b> ${esc(b.ccc.text)}</li><li><b>${esc(b.father.who)}</b>, <i>${esc(b.father.work)}</i>: ${esc(b.father.text)}</li>${b.haydock.map(h=>`<li><b>Haydock on ${esc(h.ref)}.</b> ${esc(h.text)}</li>`).join("")}</ul></div>`+
 `<div class="lu-note" data-part="prayer"><b>For prayer</b><p>${esc(b.question)}</p></div>`+
 `<p class="lu-muted" data-part="sources">${esc(BY.credit)} Links: ${a(b.episode,"Episode")} &middot; ${a(BY.plan,"Reading plan")} &middot; ${a("https://www.vatican.va/archive/ENG0015/_INDEX.HTM","Catechism")} &middot; ${a(b.father.url,b.father.who)} &middot; ${b.haydock.map(h=>a(h.url,"Haydock "+h.ref)).join(" &middot; ")}</p></section>`}
function collage(sc,root){return `<figure class="lu-collage"><div class="lu-frame"><img src="${root}${imgv(sc.image||("images/scenes/"+sc.ref.replace(":","-")+"-"+sc.after+".jpg"))}" alt="${esc(sc.scene)} — collage of public-domain paintings" loading="lazy"></div><figcaption><span class="lu-chip">Scene</span> ${esc(sc.scene)}<ul>${sc.art.map(credit).join("")}</ul></figcaption></figure>`}
function shell(title,root,body,extra=""){return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title><link rel="icon" href="${root}favicon.svg"><link rel="stylesheet" href="${root}css/lu.css?v=${VA}">${extra}</head>
<body class="lu"><div class="lu-hud-top"><a class="lu-brand" href="${root}"><span class="lu-gem"></span>Pio's Lost Sheep</a>
<nav class="lu-nav"><a href="${root}">Home</a><a href="${root}novena/">Novena</a><a href="${root}day/">Daily Pages</a><a href="${root}hours/">Liturgy of the Hours</a><a href="https://www.youtube.com/channel/UCSadxDY_Q3o_ELwXacDTP6A/live" rel="noopener">Live</a></nav></div>
<main class="lu-wrap">${body}</main>
<footer class="lu-foot">Scripture: Catholic Public Domain Version &middot; NABRE links to USCCB.org &middot; Art: public-domain paintings via Wikimedia Commons &middot; Fonts: Nunito, Varela Round, Lilita One (SIL OFL, <a href="${root}fonts/">licenses</a>)<br>Fan-made devotional site; not affiliated with any game or toy company. Ad Jesum per Mariam.</footer></body></html>
`}
function dayPage(date){
  const T=L.compute(date,site,C.books),r=T.reading,b=byId[r.book],P=C.prayers,root="../../";
  const verses=J("bible/cpdv/"+r.book+".json").chapters[r.chapter-1]||[];
  const scenes=SC.filter(s=>s.ref===r.book+":"+r.chapter).sort((x,y)=>x.after-y.after);
  let vh="",si=0;verses.forEach((v,i)=>{vh+=`<span id="v${i+1}"><sup>${i+1}</sup>${esc(v)} </span>`;while(si<scenes.length&&scenes[si].after===i+1)vh+="</p>"+collage(scenes[si++],root)+"<p class=\"lu-verses\">"});
  const nl=L.nabreLink(b,r.chapter),active=T.status==="active",pet=T.phase==="petition",m=P.mysteries[T.mystery],rf=C.chapterReflections[r.book+":"+r.chapter];
  const prev=L.addDays(date,-1),next=L.addDays(date,1);
  let h=`<section class="lu-panel lu-title"><div class="lu-tabhead">${esc(wk(date))} &middot; ${esc(fmt(date))}</div>
<div class="lu-stats">${active?`<div class="lu-stat"><b>Day ${T.day}</b><span>of 54</span><i class="lu-bar"><em style="width:${(T.day/54*100).toFixed(1)}%"></em></i></div><div class="lu-stat"><b>${pet?"Petition":"Thanksgiving"}</b><span>${pet?"Prayer in petition":"Prayer in thanksgiving"}</span></div>`:`<div class="lu-stat"><b>${T.status==="done"?"Novena complete":"Before the novena"}</b><span>${T.status==="done"?"The 54 days ended "+fmt(T.endDate)+". Daily Scripture continues.":"Day 1 is "+fmt(T.startDate)}</span></div>`}
<div class="lu-stat"><b class="m-${T.mystery}">${MN[T.mystery]}</b><span>Mysteries</span></div><div class="lu-stat"><b>${esc(r.name)} ${r.chapter}</b><span>Today's chapter</span></div></div>
${active?`<p class="lu-intent"><span class="lu-chip">Intention</span> <i>${esc(intention())}</i></p>`:""}
<p class="lu-pager"><a class="lu-btn" href="../${prev}/">&laquo; ${esc(fmt(prev))}</a> <a class="lu-btn gold" href="#pray">Pray</a> <a class="lu-btn" href="../${next}/">${esc(fmt(next))} &raquo;</a></p></section>`;
  // ---- 1. PRAYERS FIRST: the full Rosary with the 54 Day Novena prayers in their traditional places ----
  const fill=x=>x.replace("{request}",intention()).replace("{bouquet}",NT.bouquet[T.mystery]);
  const hm10=pr("Hail Mary (ten times)",P.hailMary),tail=pr("Glory Be",P.glory)+pr("Fatima Prayer",P.fatima);
  h+=`<section class="lu-panel" id="pray"><div class="lu-tabhead">Prayers &middot; The Rosary${active?` Novena &middot; Day ${T.day} &middot; ${pet?"Petition":"Thanksgiving"}`:""}</div>
<p class="lu-muted">${active?(pet?"Days 1&ndash;27: prayed in petition.":"Days 28&ndash;54: prayed in thanksgiving.")+` <span class="m-${T.mystery}">${MN[T.mystery]} Mysteries</span>.`:`<span class="m-${T.mystery}">${MN[T.mystery]} Mysteries</span>.`}</p>
<h3 class="lu-step" data-step="opening">Opening</h3>`+pr("The Sign of the Cross",P.sign)+
   (active?`<div class="novena-offering" data-phase="${T.phase}">`+pr(pet?"Novena Opening Offering (in Petition)":"Novena Opening Offering (in Thanksgiving)",fill(pet?NT.petitionOffering:NT.thanksOffering))+`</div>`:"")+(date>="2026-10-24"?intentionsBox():"")+
   pr("The Apostles\u2019 Creed",P.creed)+pr("Our Father",P.ourFather)+pr("Hail Mary (three times, for faith, hope and charity)",P.hailMary)+tail;
  m.decades.forEach((d,i)=>{const rd=C.mysteryReadings[T.mystery][i];
    h+=`<h3 class="lu-step" data-step="decade">Decade ${i+1} &middot; ${esc(d.title)}</h3><p class="lu-muted">Fruit: ${esc(d.fruit)} &middot; ${esc(rd.reading)}</p><p>${esc(d.meditation)}</p>`+pr("Our Father",P.ourFather)+hm10+tail+
    (active?`<div class="novena-decade" data-phase="${T.phase}">`+pr(pet?"Binding the bouquet (in Petition)":"Binding the bouquet (in Thanksgiving)",fill(pet?NT.petitionDecade:NT.thanksDecade))+`</div>`:"");});
  h+=`<h3 class="lu-step" data-step="closing">Closing</h3>`+pr("Spiritual Communion",NT.spiritualCommunion)+
   (active?`<div class="novena-closing" data-phase="${T.phase}">`+pr(pet?"Closing Prayer in Petition":"Closing Prayer in Thanksgiving",fill(pet?NT.petitionClosing:NT.thanksClosing))+`</div>`:"")+
   pr("Hail, Holy Queen",P.hailHolyQueen)+pr("Versicle",P.versicle)+pr("Let us pray",P.collect)+(date>="2026-10-24"&&SA?closingPrayers(date):purityBox())+pr("The Sign of the Cross",P.sign)+complineBox(date);
  h+=`<p><a class="lu-btn gold" href="../../novena/#pray">Novena section &raquo;</a></p></section>`;
  if(active)h+=`<section class="lu-panel" id="surrender"><div class="lu-tabhead">Surrender Novena (Don Dolindo Ruotolo) &middot; Day ${T.surrenderDay} of 9</div>`+pr("Day "+T.surrenderDay,C.surrender[T.surrenderDay-1])+pr("Ten times",C.surrenderRefrain)+pr("To Our Lady",C.surrenderMarian)+`</section>`;
  else h+=`<section class="lu-panel" id="surrender"><div class="lu-tabhead">Surrender Novena</div><p>${T.status==="done"?"The 54 day novena is finished. Deo gratias! You may begin the Surrender Novena again at any time:":""}</p>`+pr("Day 1",C.surrender[0])+pr("Ten times",C.surrenderRefrain)+`</section>`;
  // ---- 2. SCRIPTURE SECOND ----
  h+=`<section class="lu-panel" id="scripture"><div class="lu-tabhead">Scripture &middot; ${esc(r.name)} ${r.chapter} (CPDV)</div><p><a class="lu-btn blue" href="${nl.url}" rel="noopener">Read ${esc(r.name)} ${r.chapter} in the NABRE &rarr;</a></p>${nl.note?`<p class="lu-muted">${esc(nl.note)}</p>`:""}<p class="lu-verses">${vh}</p>${rf&&!BY.chapters[r.book+":"+r.chapter]?`<div class="lu-note"><b>Reflection</b><p>${esc(rf.reflection)}</p><ol>${rf.questions.map(q=>"<li>"+esc(q)+"</li>").join("")}</ol></div>`:""}</section>`+biay(r.book+":"+r.chapter);
  return shell(`${fmt(date)} · ${r.name} ${r.chapter} · Pio's Lost Sheep`,root,h);
}
const dates=[];for(let i=0;i<=ahead;i++)dates.push(L.addDays(from,i));
// also rebuild every day page that already exists so older pages follow the current template
const existing=fs.existsSync(path.join(R,"day"))?fs.readdirSync(path.join(R,"day")).filter(x=>/^\d{4}-\d\d-\d\d$/.test(x)):[];
const toBuild=[...new Set([...existing,...dates])].sort();
for(const d of toBuild){const dir=path.join(R,"day",d);fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,"index.html"),dayPage(d));}
const all=fs.readdirSync(path.join(R,"day")).filter(x=>/^\d{4}-\d\d-\d\d$/.test(x)).sort();
const today=L.todayNY(),T0=L.compute(today,site,C.books);
fs.writeFileSync(path.join(R,"day","index.html"),shell("Daily Pages · Pio's Lost Sheep","../",`<section class="lu-panel"><div class="lu-tabhead">Daily Pages</div><ul class="lu-list">${all.map(d=>{const t=L.compute(d,site,C.books);return `<li><a href="${d}/">${esc(fmt(d))}</a> &middot; ${esc(t.reading.name)} ${t.reading.chapter} &middot; ${t.status==="active"?"Novena day "+t.day:t.status==="done"?"after the novena":"before the novena"}</li>`}).join("")}</ul></section>`));
// Home page. JS redirects "today" to the live NY date; static fallback is the build date.
// Liturgy of the Hours (Nathan approved, Oct 24): links only to Universalis USA; no Universalis text copied.
{const HRS=[["lauds","Morning Prayer (Lauds)"],["readings","Office of Readings"],["sext","Midday Prayer"],["vespers","Evening Prayer (Vespers)"],["compline","Night Prayer (Compline)"]];
fs.mkdirSync(path.join(R,"hours"),{recursive:true});
fs.writeFileSync(path.join(R,"hours","index.html"),shell("Liturgy of the Hours · Pio's Lost Sheep","../",`<section class="lu-panel"><div class="lu-tabhead">Liturgy of the Hours &middot; <span id="hrs-date">today</span></div>
<p>Pray the Church's daily prayer with us. Each button opens today's hour (USA calendar, New York date) on Universalis.</p>
<ul class="lu-list" id="hrs-list">${HRS.map(([k,n])=>`<li><a class="lu-btn blue" data-hour="${k}" href="https://universalis.com/USA/${k}.htm" rel="noopener">${esc(n)} &rarr;</a></li>`).join("")}</ul>
<noscript><p><a class="lu-btn gold" href="https://universalis.com/USA/" rel="noopener">Open today's hours on Universalis (USA) &rarr;</a></p></noscript>
<p class="lu-muted">Daytime prayer also at <a data-hour="terce" href="https://universalis.com/USA/terce.htm" rel="noopener">Terce</a> &middot; <a data-hour="none" href="https://universalis.com/USA/none.htm" rel="noopener">None</a>.</p>
<p class="lu-muted">Texts of the Hours are provided by <a href="https://universalis.com/" rel="noopener">Universalis</a>; this site only links to them.</p></section>
<script>(function(){var p=new Intl.DateTimeFormat("en-CA",{timeZone:"America/New_York",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date()),o={};p.forEach(function(x){o[x.type]=x.value});var ymd=o.year+o.month+o.day;
document.getElementById("hrs-date").textContent=new Date(o.year+"-"+o.month+"-"+o.day+"T12:00:00").toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"});
document.querySelectorAll("a[data-hour]").forEach(function(a){a.href="https://universalis.com/USA/"+ymd+"/"+a.getAttribute("data-hour")+".htm"})})();</script>`));}
fs.writeFileSync(path.join(R,"index.html"),shell("Pio's Lost Sheep","",`<section class="lu-panel lu-hero"><div class="lu-hero-art"></div><div class="lu-hero-text"><div class="lu-kicker">Welcome, Lost Sheep</div><h1>Pio's Lost Sheep</h1><p>Pray, read Scripture one chapter a day, and gather with us live.</p>
<p><a class="lu-btn gold" id="today-link" href="day/${today}/">Today's page &middot; ${esc(fmt(today))}</a> <a class="lu-btn" href="novena/">54 Day Rosary Novena</a></p></div></section>
<section class="lu-panel"><div class="lu-tabhead">Today</div><p>${T0.status==="active"?`Novena day ${T0.day} of 54 (${T0.phase})`:"Daily Scripture"} &middot; <b>${esc(T0.reading.name)} ${T0.reading.chapter}</b> &middot; ${MN[T0.mystery]} Mysteries</p></section>
<section class="lu-panel"><div class="lu-tabhead">Join Us</div><ul class="lu-links">
<li><a class="lu-btn red" href="https://www.youtube.com/channel/UCSadxDY_Q3o_ELwXacDTP6A/live" rel="noopener">&#9658; Watch live on YouTube</a> <span class="lu-muted">https://www.youtube.com/channel/UCSadxDY_Q3o_ELwXacDTP6A/live</span></li>
<li><a class="lu-btn blue" href="https://discord.gg/HqXPUEd5JQ" rel="noopener">Join our Pio's Lost Sheep Discord Server: https://discord.gg/HqXPUEd5JQ</a></li>
<li><a class="lu-btn gold" href="https://ko-fi.com/pioslostsheep" rel="noopener">Tithe Your Shekels: https://ko-fi.com/pioslostsheep</a></li>
<li><a class="lu-btn blue" href="hours/">Liturgy of the Hours (daily links)</a></li>
<li><a class="lu-btn" href="https://nathanpburson.github.io/novena/rewind/?obs=1">Rewind (OBS): https://nathanpburson.github.io/novena/rewind/?obs=1</a></li></ul></section>
<section class="lu-panel"><div class="lu-tabhead">Sections</div><ul class="lu-list"><li><a href="novena/">The 54 Day Rosary Novena</a> &mdash; prayers, mysteries, the 54-day calendar and the whole Bible</li><li><a href="day/">Daily pages</a> &mdash; one page per date with the chapter, art and prayers</li></ul></section>
<script src="js/logic.js?v=${VA}"></script><script>(function(){var d=NovenaLogic.todayNY(),a=document.getElementById("today-link");a.href="day/"+d+"/";})()</script>`));
{const nf=path.join(R,"novena/index.html");fs.writeFileSync(nf,fs.readFileSync(nf,"utf8").replace(/(\.\.\/(?:css|js)\/[\w.-]+\.(?:css|js))(\?v=[0-9a-f]+)?"/g,"$1?v="+VA+'"'));}
console.log("built",dates[0],"to",dates[dates.length-1],"+ rebuilt",toBuild.length,"pages total");
// /rewind/ — OBS Browser Source playlist player. Playlist: /workspace/ops/rewind/playlist.json (or $REWIND_MANIFEST)
// is copied to data/rewind_playlist.json on every build. Fallback YouTube ID: data/rewind.json videoId. Not linked anywhere.
{const RW=J("data/rewind.json"),id=String(RW.videoId).trim();if(!/^[A-Za-z0-9_-]{11}$/.test(id))throw Error("data/rewind.json videoId invalid");
const man=process.env.REWIND_MANIFEST||"/workspace/ops/rewind/playlist.json";let pl={blocks:[]};
try{if(fs.existsSync(man)){const j=JSON.parse(fs.readFileSync(man,"utf8"));const b=(Array.isArray(j)?j:(j.blocks||j.items||[])).filter(x=>typeof x==="string"||(x&&(x.driveId||x.id||x.fileId||x.url||x.youtubeId)));pl={source:"ops/rewind/playlist.json",updated_et:j.updated_et||"",blocks:b};if(j.apiKey)pl.apiKey=j.apiKey}}catch(e){console.warn("rewind manifest unreadable, using YouTube fallback:",e.message)}
fs.writeFileSync(path.join(R,"data","rewind_playlist.json"),JSON.stringify(pl,null,1)+"\n");
fs.mkdirSync(path.join(R,"rewind"),{recursive:true});
const V=require("crypto").createHash("sha1").update(fs.readFileSync(path.join(R,"js/rewind.js"))).update(JSON.stringify(RW)).digest("hex").slice(0,10); // cache-busting build hash
fs.writeFileSync(path.join(R,"rewind","index.html"),`<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate"><meta http-equiv="Pragma" content="no-cache"><meta http-equiv="Expires" content="0"><meta name="rewind-build" content="${V}">
<title>Rewind</title><style>
@font-face{font-family:"Lilita One";src:url(../fonts/LilitaOne-Regular.ttf?v=${V}) format("truetype")}
html,body{margin:0;padding:0;border:0;width:100%;height:100%;overflow:hidden;background:#000}
.rw-native #rw-stage .rw-media{pointer-events:auto}
#rw-stage{position:fixed;inset:0;width:100%;height:100%;margin:0;padding:0;background:#000;overflow:hidden;max-width:none;max-height:none}
/* media covers the window at 16:9 (JS sets --rw-w/--rw-h; OBS mode oversizes to crop YouTube chrome) */
#rw-stage .rw-media,#rw-stage iframe,#rw-stage video{position:absolute;left:50%;top:50%;width:var(--rw-w,100vw);height:var(--rw-h,100vh);transform:translate(-50%,-50%);border:0;margin:0;background:#000;object-fit:cover;pointer-events:none}
#rw-shield{position:fixed;inset:0;z-index:1;background:transparent}
.rw-banner{position:fixed;left:16px;bottom:16px;z-index:2;padding:6px 14px;border-radius:14px;font:20px "Lilita One","Varela Round",sans-serif;color:#eaf4ff;
 background:linear-gradient(180deg,rgba(40,92,146,.92),rgba(17,44,76,.94));border:3px solid #6fb7e8;box-shadow:inset 0 2px 0 rgba(255,255,255,.25),0 4px 0 #071426;text-shadow:0 2px 0 #0b1a2e;pointer-events:none}
</style></head><body>
<div id="rw-stage"></div>
<div id="rw-shield"></div>
<div class="rw-banner" id="rw-banner">${esc(RW.banner)}</div>
<script>window.REWIND_YT_ID=${JSON.stringify(id)};window.REWIND_ROTATE=${JSON.stringify(+RW.rotateSec||600)};</script><script src="../js/rewind.js?v=${V}"></script>
</body></html>
`);console.log("rewind playlist blocks:",pl.blocks.length);}
