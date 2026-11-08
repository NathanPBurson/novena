// Pio's Lost Sheep static page generator. Usage: node build_pages.js [--from YYYY-MM-DD] [--days 7]
// Builds /day/YYYY-MM-DD/index.html for today (America/New_York) through +7 days, the home page (/index.html)
// and /day/index.html. Idempotent: pages are fully rewritten each run; older day pages are kept.
const fs=require("fs"),path=require("path"),L=require("./js/logic.js");
const R=__dirname,J=f=>JSON.parse(fs.readFileSync(path.join(R,f)));
const site=J("data/site.json"),C=J("data/content.json"),SC=J("data/scenes.json").scenes,ART=J("data/art_meta.json"),CR=J("data/art_credits.json"),NT=J("data/novena_traditional.json");
const a=process.argv.slice(2),arg=(k,d)=>{const i=a.indexOf(k);return i>=0?a[i+1]:d};
const from=arg("--from",L.todayNY()),ahead=+arg("--days",7);
const GV=(()=>{try{return require("child_process").execSync("git rev-parse --short HEAD",{cwd:R}).toString().trim()}catch(e){return "dev"}})(); // commit short hash for cache busting
const VA_=require("crypto").createHash("sha1").update(["css/lu.css","css/style.css","js/logic.js","js/app.js","js/compline.js"].map(f=>fs.readFileSync(path.join(R,f))).join("")).digest("hex").slice(0,10),VA=GV; // asset cache-bust = commit hash
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
const CMP=require("./js/compline.js"),CD=J("data/compline.json");
const complineBox=d=>`<div class="lu-prayer" id="night-prayer"><h4>Night Prayer (Compline)</h4><details class="cmp" open><summary>Full text &middot; public-domain Douay/CPDV</summary>${CMP.html(CD,"cmp-box")}</details><p><a class="lu-btn blue" data-compline="${d}" href="https://universalis.com/USA/${d.replace(/-/g,"")}/compline.htm" rel="noopener">Official modern text for this day on Universalis &rarr;</a></p><p class="lu-muted">The modern Liturgy of the Hours text is provided by <a href="https://universalis.com/" rel="noopener">Universalis</a>; this site only links to it.</p></div>`;
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
const TR=fs.existsSync(path.join(R,"data/trivia.json"))?J("data/trivia.json"):{chapters:{}};
function trivia(key,name,ch){const t=TR.chapters[key];if(!t||!t.items||!t.items.length)return "";
 return `<section class="lu-panel" id="trivia"><div class="lu-tabhead">Trivia &middot; ${esc(name)} ${ch}</div><ul class="lu-list">${t.items.map(x=>"<li>"+esc(x)+"</li>").join("")}</ul></section>`}
function loadEpisodes(){const p=path.join(R,"data/episodes.json");if(!fs.existsSync(p))return [];return (J("data/episodes.json").episodes||[]).filter(e=>e&&e.id&&e.title).slice().sort((a,b)=>(b.number||0)-(a.number||0));}
function tsSec(t){const p=String(t||"0").split(":").map(n=>+n||0);return p.length>=3?p[0]*3600+p[1]*60+p[2]:p.length===2?p[0]*60+p[1]:p[0];}
function episodeHtml(ep,root,opts){opts=opts||{};const id=String(ep.id).trim(),watch="https://www.youtube.com/watch?v="+id;
 const ch=(ep.chapters||[]).map(c=>`<li><a href="${watch}&amp;t=${tsSec(c.t)}s" rel="noopener"><time datetime="PT${tsSec(c.t)}S">${esc(c.t)}</time> ${esc(c.title)}</a></li>`).join("");
 let slots=Array.isArray(ep.shorts)?ep.shorts.slice():[];while(slots.length<5)slots.push({n:slots.length+1});
 const shorts=slots.map((s,i)=>{const n=s.n||i+1,sid=String(s.id||"").trim();
  if(!/^[A-Za-z0-9_-]{11}$/.test(sid))return `<li class="ep-short empty" data-short="${n}"><span class="ep-short-slot" aria-hidden="true"></span><b>Short ${n}</b><span class="lu-muted">Empty — add later</span></li>`;
  return `<li class="ep-short" data-short="${n}"><div class="ep-player ep-short-player"><iframe src="https://www.youtube.com/embed/${sid}" title="${esc(s.title||"Short "+n)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div><b>${esc(s.title||"Short "+n)}</b></li>`;}).join("");
 const thumb=ep.thumb?`<figure class="ep-thumb"><img src="${root}${imgv(ep.thumb)}" alt="${esc(ep.title)}" width="1280" height="720"></figure>`:"";
 const more=opts.permalink?"":`<a class="lu-btn" href="${root}episodes/${ep.number}/">Episode page</a>`;
 const shortsBlock=`<h3 class="lu-step" id="shorts">Shorts</h3><p class="lu-muted">Five Shorts from this episode will go in these slots.</p><ol class="ep-shorts" data-slots="5">${shorts}</ol>`;
 const summary=`<div class="lu-note" data-part="summary"><b>Summary</b><p>${esc(ep.summary||"")}</p></div>
<p class="ep-tags"><span class="lu-chip">Games</span> ${esc((ep.games||[]).join(", "))}</p>
<p class="ep-tags"><span class="lu-chip">Topics</span> ${esc((ep.topics||[]).join(", "))}</p>
<h3 class="lu-step">Chapters</h3><ol class="ep-chapters">${ch}</ol>`;
 const funnel=`<p class="ep-funnel"><a class="lu-btn blue" href="${esc(site.links.discord)}" rel="noopener">Join our Pio's Lost Sheep Discord Server: ${esc(site.links.discord)}</a>
<a class="lu-btn gold" href="${esc(site.links.kofi)}" rel="noopener">Tithe Your Shekels: ${esc(site.links.kofi)}</a>
<a class="lu-btn red" href="${watch}" rel="noopener">Watch on YouTube</a>
${more}</p>`;
 return `<section class="lu-panel" id="${opts.anchor?"episode":"ep-"+ep.number}" data-episode="${esc(ep.number)}"><div class="lu-tabhead">Episode ${esc(ep.number)}</div>
<p class="lu-kicker">${esc(wk(ep.date))} &middot; ${esc(fmt(ep.date))}</p>
<h2>${esc(ep.title)}</h2>
<div class="ep-player"><iframe src="https://www.youtube.com/embed/${id}" title="${esc(ep.title)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>
${thumb}
${opts.front?shortsBlock+"\n"+(opts.afterShorts||"")+summary:summary+"\n"+shortsBlock}
${funnel}</section>`}
function collage(sc,root){return `<figure class="lu-collage"><div class="lu-frame"><img src="${root}${imgv(sc.image||("images/scenes/"+sc.ref.replace(":","-")+"-"+sc.after+".jpg"))}" alt="${esc(sc.scene)} — collage of public-domain paintings" loading="lazy"></div><figcaption><span class="lu-chip">Scene</span> ${esc(sc.scene)}<ul>${sc.art.map(credit).join("")}</ul></figcaption></figure>`}
function slidesHtml(){const S=J("data/slides.json");return `<div class="lu-hero-art lu-slides" id="lu-slides" aria-roledescription="carousel" aria-label="Recent videos">`+S.map((s,k)=>`<a class="lu-slide${k?"":" on"}" href="https://www.youtube.com/watch?v=${s.id}" rel="noopener" aria-hidden="${k?"true":"false"}"><img src="images/thumbs/${s.id}.webp?v=${GV}" alt="${esc(s.title)}" width="640" height="360"${k?' loading="lazy" decoding="async"':' fetchpriority="high"'}></a>`).join("")+`<button type="button" class="lu-sl-prev" aria-label="Previous">&#8249;</button><button type="button" class="lu-sl-next" aria-label="Next">&#8250;</button></div><script src="js/slides.js?v=${GV}"></script>`}
function shell(title,root,body,extra=""){return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><link rel="manifest" href="${root}manifest.webmanifest"><meta name="theme-color" content="#0a1030"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"><meta name="apple-mobile-web-app-title" content="Lost Sheep">
<title>${esc(title)}</title><link rel="icon" type="image/png" sizes="32x32" href="${root}favicon-32.png"><link rel="apple-touch-icon" sizes="180x180" href="${root}apple-touch-icon.png"><link rel="stylesheet" href="${root}css/lu.css?v=${VA}">${extra}</head>
<body class="lu"><div class="lu-hud-top app-bar">${root?`<a class="app-btn" id="app-back" href="${root}" aria-label="Back">&#8249; Back</a><a class="app-btn" href="${root}" aria-label="Home">&#8962; Home</a>`:""}<a class="lu-brand" href="${root}"><img class="lu-avatar" src="${root}images/channel_avatar_96.png" alt="" width="32" height="32" style="width:32px;height:32px;border-radius:50%;object-fit:cover;vertical-align:middle;margin-right:8px">Pio's Lost Sheep</a>
<span class="lu-clock" id="lu-clock" aria-hidden="true"></span><nav class="lu-nav"><a href="${root}">Home</a><a href="${root}novena/">Novena</a><a href="${root}day/">Daily Pages</a><a href="${root}readings/">Mass Readings</a><a href="${root}hours/">Liturgy of the Hours</a><a href="${root}episodes/">Episodes</a><a href="https://www.youtube.com/channel/UCSadxDY_Q3o_ELwXacDTP6A/live" rel="noopener">Live</a><a class="nav-myspace" href="${root}p-3614753af323c33dbbf24ebd/" rel="nofollow">&#128274; Account</a></nav></div><script>(function(){var c=document.getElementById("lu-clock");function t(){c.textContent=new Date().toLocaleString("en-US",{timeZone:"America/New_York",weekday:"short",month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})}t();setInterval(t,30000)})()</script>
${root?`<script src="${root}js/appbar.js?v=${GV}"></script>`:""}<main class="lu-wrap">${body}</main>
<footer class="lu-foot">Scripture: Catholic Public Domain Version &middot; NABRE links to USCCB.org &middot; Art: public-domain paintings via Wikimedia Commons &middot; Fonts: Nunito, Varela Round, Lilita One (SIL OFL, <a href="${root}fonts/">licenses</a>)<br>Fan-made devotional site; not affiliated with any game or toy company. Ad Jesum per Mariam.</footer></body></html>
`}
function dayPage(date){
  const T=L.compute(date,site,C.books),r=T.reading,b=byId[r.book],P=C.prayers,root="../../";
  const verses=J("bible/cpdv/"+r.book+".json").chapters[r.chapter-1]||[];
  const scenes=SC.filter(s=>s.ref===r.book+":"+r.chapter).sort((x,y)=>x.after-y.after);
  let vh="",si=0;verses.forEach((v,i)=>{vh+=`<span id="v${i+1}"><sup>${i+1}</sup>${esc(v)} </span>`;while(si<scenes.length&&scenes[si].after===i+1)vh+="</p>"+collage(scenes[si++],root)+"<p class=\"lu-verses\">"});
  const nl=L.nabreLink(b,r.chapter),active=T.status==="active",pet=T.phase==="petition",m=P.mysteries[T.mystery],rf=C.chapterReflections[r.book+":"+r.chapter];
  const prev=L.addDays(date,-1),next=L.addDays(date,1);
  const onToday=date===L.todayNY();
  let h=`<section class="lu-panel lu-title" data-date="${date}"><div class="lu-tabhead">${esc(wk(date))} &middot; ${esc(fmt(date))} <span class="lu-chip" id="today-flag"${onToday?"":" hidden"}>Today</span></div>
<div class="lu-stats">${active?`<div class="lu-stat"><b>Day ${T.day}</b><span>of 54</span><i class="lu-bar"><em style="width:${(T.day/54*100).toFixed(1)}%"></em></i></div><div class="lu-stat"><b>${pet?"Petition":"Thanksgiving"}</b><span>${pet?"Prayer in petition":"Prayer in thanksgiving"}</span></div>`:`<div class="lu-stat"><b>${T.status==="done"?"Novena complete":"Before the novena"}</b><span>${T.status==="done"?"The 54 days ended "+fmt(T.endDate)+". Daily Scripture continues.":"Day 1 is "+fmt(T.startDate)}</span></div>`}
<div class="lu-stat"><b class="m-${T.mystery}">${MN[T.mystery]}</b><span>Mysteries</span></div><div class="lu-stat"><b>${esc(r.name)} ${r.chapter}</b><span>Today's chapter</span></div></div>
${active?`<p class="lu-intent"><span class="lu-chip">Intention</span> <i>${esc(intention())}</i></p>`:""}
<p class="lu-pager"><a class="lu-btn" href="../${prev}/">&laquo; ${esc(fmt(prev))}</a> <a class="lu-btn gold" href="#pray">Pray</a> <a class="lu-btn" href="../${next}/">${esc(fmt(next))} &raquo;</a></p></section>`+loadEpisodes().filter(e=>e.date===date).map(e=>episodeHtml(e,root,{anchor:true})).join("");
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
  h+=`<section class="lu-panel" id="scripture"><div class="lu-tabhead">Scripture &middot; ${esc(r.name)} ${r.chapter} (CPDV)</div><p><a class="lu-btn blue" href="${nl.url}" rel="noopener">Read ${esc(r.name)} ${r.chapter} in the NABRE &rarr;</a></p>${nl.note?`<p class="lu-muted">${esc(nl.note)}</p>`:""}<p class="lu-verses">${vh}</p>${rf&&!BY.chapters[r.book+":"+r.chapter]?`<div class="lu-note"><b>Reflection</b><p>${esc(rf.reflection)}</p><ol>${rf.questions.map(q=>"<li>"+esc(q)+"</li>").join("")}</ol></div>`:""}</section>`+biay(r.book+":"+r.chapter)+trivia(r.book+":"+r.chapter,r.name,r.chapter);
  h+=`<script src="${root}js/logic.js?v=${GV}"></script><script>(function(){var p=document.querySelector("main [data-date]"),f=document.getElementById("today-flag");if(!p||!f||!window.NovenaLogic)return;if(p.getAttribute("data-date")===NovenaLogic.todayNY())f.removeAttribute("hidden");else f.setAttribute("hidden","");})();</script>`;
  return shell(`${fmt(date)} · ${r.name} ${r.chapter} · Pio's Lost Sheep`,root,h);
}
const dates=[];for(let i=0;i<=ahead;i++)dates.push(L.addDays(from,i));
// also rebuild every day page that already exists so older pages follow the current template
const existing=fs.existsSync(path.join(R,"day"))?fs.readdirSync(path.join(R,"day")).filter(x=>/^\d{4}-\d\d-\d\d$/.test(x)):[];
const toBuild=[...new Set([...existing,...dates])].sort();
for(const d of toBuild){const dir=path.join(R,"day",d);fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,"index.html"),dayPage(d));}
const all=fs.readdirSync(path.join(R,"day")).filter(x=>/^\d{4}-\d\d-\d\d$/.test(x)).sort();
const today=L.todayNY(),T0=L.compute(today,site,C.books);
fs.writeFileSync(path.join(R,"day","index.html"),shell("Daily Pages · Pio's Lost Sheep","../",`<section class="lu-panel"><div class="lu-tabhead">Daily Pages</div><ul class="lu-list">${all.map(d=>{const t=L.compute(d,site,C.books),on=d===today;return `<li data-date="${d}"${on?' class="is-today"':""}><a href="${d}/"${on?' aria-current="date"':""}>${esc(fmt(d))}</a> &middot; ${esc(t.reading.name)} ${t.reading.chapter} &middot; ${t.status==="active"?"Novena day "+t.day:t.status==="done"?"after the novena":"before the novena"}${on?' <span class="lu-chip today-mark">Today</span>':""}</li>`}).join("")}</ul></section><script src="../js/logic.js?v=${GV}"></script><script>(function(){if(!window.NovenaLogic)return;var d=NovenaLogic.todayNY();document.querySelectorAll("li[data-date]").forEach(function(li){var on=li.getAttribute("data-date")===d;li.classList.toggle("is-today",on);var a=li.querySelector("a");if(a){if(on)a.setAttribute("aria-current","date");else a.removeAttribute("aria-current")}var m=li.querySelector(".today-mark");if(on&&!m){li.appendChild(document.createTextNode(" "));m=document.createElement("span");m.className="lu-chip today-mark";m.textContent="Today";li.appendChild(m)}if(!on&&m)m.remove()})})();</script>`));
// Home page. JS redirects "today" to the live NY date; static fallback is the build date.
// Liturgy of the Hours: five stacked Universalis iframes (their documented embed method, https://universalis.com/n-iframe.htm). No Universalis text is stored here.
{const H=require("./js/hours.js"),HV=GV;
const sec=h=>`<section class="hrs-hour" id="hour-${h.k}"><h2>${esc(h.label)}</h2><iframe class="hrs-frame" id="hrs-frame-${h.k}" title="${esc(h.label)} from Universalis" loading="lazy" referrerpolicy="no-referrer" width="100%"></iframe><p class="lu-muted"><a id="hrs-open-${h.k}" data-hour="${h.k}" href="https://universalis.com/usa/${h.k}.htm" rel="noopener">Open ${esc(h.label)} on Universalis &rarr;</a></p></section>`;
fs.mkdirSync(path.join(R,"hours"),{recursive:true});
fs.writeFileSync(path.join(R,"hours","index.html"),shell("Liturgy of the Hours · Pio's Lost Sheep","../",`<section class="lu-panel" id="hrs-app"><div class="lu-tabhead">Liturgy of the Hours &middot; <span id="hrs-date">today</span></div>
<p>Pray the Church's daily prayer right here: scroll down through the Office of Readings, Morning Prayer, Midday Prayer, Evening Prayer and Night Prayer. It follows the date (New York time) and changes every day.</p>
<div class="hrs-row" id="hrs-datenav"><button type="button" class="lu-btn sm" id="hrs-prev">&larr; Previous day</button><button type="button" class="lu-btn sm" id="hrs-today">Today</button><button type="button" class="lu-btn sm" id="hrs-next">Next day &rarr;</button></div>
${H.HOURS.map(sec).join("\n")}
<p class="lu-muted">The Liturgy of the Hours (USA calendar) is shown here by <a href="https://universalis.com/" rel="noopener">Universalis</a> using the <a href="https://universalis.com/n-iframe.htm" rel="noopener">iframe method it provides for websites</a>. The text is theirs, &copy; Universalis Publishing Ltd; psalms and canticles are Universalis's own translation, readings from the Jerusalem Bible by permission.</p>
<noscript><p><a class="lu-btn gold" href="https://universalis.com/USA/" rel="noopener">Open today's hours on Universalis (USA) &rarr;</a></p></noscript>
<p class="lu-muted">Texts of the Hours are provided by <a href="https://universalis.com/" rel="noopener">Universalis</a>.</p></section>
<script src="../js/hours.js?v=${HV}"></script>`,`<link rel="stylesheet" href="../css/hours.css?v=${HV}">`));}
// Mass readings: one Universalis iframe (documented embed), date computed in the browser (NY, 6 AM rollover). No text stored here.
{const RV=GV;
fs.mkdirSync(path.join(R,"readings"),{recursive:true});
fs.writeFileSync(path.join(R,"readings","index.html"),shell("Mass Readings · Pio's Lost Sheep","../",`<section class="lu-panel" id="rd-app"><div class="lu-tabhead">Today's Mass Readings &middot; <span id="rd-date">today</span></div>
<p>The readings of the day, updated automatically (New York time; the day changes at 6 AM). Nothing here needs a daily rebuild.</p>
<div class="hrs-row"><button type="button" class="lu-btn sm" id="rd-prev">&larr; Previous day</button><button type="button" class="lu-btn sm" id="rd-today">Today</button><button type="button" class="lu-btn sm" id="rd-next">Next day &rarr;</button> <a class="lu-btn sm" id="rd-open" href="https://universalis.com/USA/" rel="noopener">Open on Universalis &nearr;</a></div>
<iframe class="hrs-frame" id="rd-frame" title="Mass readings from Universalis" loading="lazy" referrerpolicy="no-referrer" width="100%"></iframe>
<noscript><p><a class="lu-btn gold" href="https://universalis.com/USA/mass.htm" rel="noopener">Open today's Mass readings on Universalis (USA) &rarr;</a></p></noscript>
<p class="lu-muted">Readings at Mass are provided by <a href="https://universalis.com/" rel="noopener">Universalis</a> using their <a href="https://universalis.com/n-iframe.htm" rel="noopener">iframe method</a>. &copy; Universalis Publishing Ltd; Scripture: Jerusalem Bible, Grail Psalms. This site links and frames only; it does not copy the text. For this site's own public-domain Douay/CPDV text, see today's chapter on the Novena page.</p></section>
<script src="../js/logic.js?v=${VA}"></script><script src="../js/readings.js?v=${RV}"></script>`,`<link rel="stylesheet" href="../css/hours.css?v=${RV}">`));}
// 404.html: a /day/YYYY-MM-DD/ page that was never prebuilt opens the live (computed) Novena page for that date instead. Not indexed.
fs.writeFileSync(path.join(R,"404.html"),`<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>Page not found</title></head><body style="font-family:Georgia,serif;max-width:560px;margin:40px auto;padding:0 16px"><h1>Page not found</h1><p><a id="h" href="/novena/">Go to the Novena home page</a></p><script>(function(){var m=location.pathname.match(/^(.*\\/)day\\/(\\d{4}-\\d\\d-\\d\\d)\\/?$/);if(m)location.replace(m[1]+"novena/?date="+m[2]+"#today")})()</script></body></html>
`);
function streamPanel(){const s=L.streamForToday(site.streams||[]);if(!s)return `<section class="lu-panel" id="stream-panel"><div class="lu-tabhead">Next Stream</div><p id="stream-text">Watch live on YouTube.</p><p class="lu-muted" id="stream-count"></p></section>`;
 const link=s.url?`<p><a class="lu-btn red" id="stream-link" href="${esc(s.url)}" rel="noopener">${esc(s.title||s.display||"Watch the stream")}</a></p>`:"";
 return `<section class="lu-panel" id="stream-panel"><div class="lu-tabhead">Tonight's Stream</div><p id="stream-text">${esc(s.display||"")}</p>${link}<p class="lu-muted" id="stream-count"></p></section>`}
const afterShorts=`<section class="lu-panel" id="front-today"><p><a class="lu-btn gold" id="today-link" href="day/${today}/">Today's page &middot; ${esc(fmt(today))}</a></p></section>${streamPanel()}`;
const LEP=loadEpisodes()[0],latestBlock=LEP?'<div id="latest-episode">'+episodeHtml(LEP,"",{anchor:true,front:true,afterShorts})+'</div>':"";
fs.writeFileSync(path.join(R,"index.html"),shell("Pio's Lost Sheep","",`${latestBlock}<section class="lu-panel lu-hero">${slidesHtml()}<div class="lu-hero-text"><div class="lu-kicker">Welcome, Lost Sheep</div><h1>Pio's Lost Sheep</h1><p>Pray, read Scripture one chapter a day, and gather with us live.</p>
<p><a class="lu-btn" href="novena/">54 Day Rosary Novena</a></p></div></section>
<section class="lu-panel" id="channels"><div class="lu-tabhead">Channels</div><div class="lu-channels">
<a class="lu-tile c-rosary" href="novena/"><i><svg viewBox="0 0 40 40" width="34" height="34" aria-hidden="true"><g fill="#fff"><circle cx="20" cy="3.5" r="2.2"/><circle cx="14" cy="5.5" r="2.2"/><circle cx="26" cy="5.5" r="2.2"/><circle cx="20" cy="11" r="2.6"/></g><path d="M18 14h4v6h6v4h-6v13h-4V24h-6v-4h6z" fill="#ffe27a" stroke="#fff" stroke-width="1.2" stroke-linejoin="round"/></svg></i><b>54 Day Novena</b><span>Prayers, mysteries, whole Bible</span></a>
<a class="lu-tile c-gold" href="day/${today}/" id="tile-today"><i>&#9733;</i><b>Today's Page</b><span>Chapter, art and prayers</span></a>
<a class="lu-tile c-blue" href="readings/"><i>&#10022;</i><b>Mass Readings</b><span>Updates itself daily</span></a>
<a class="lu-tile c-sky" href="hours/"><i>&#9728;</i><b>Liturgy of the Hours</b><span>Five prayers, one page</span></a>
<a class="lu-tile c-green" href="day/"><i>&#9776;</i><b>Daily Pages</b><span>One page per date</span></a>
<a class="lu-tile c-violet" href="https://www.youtube.com/channel/UCSadxDY_Q3o_ELwXacDTP6A/live" rel="noopener"><i>&#9654;</i><b>Watch Live</b><span>YouTube stream</span></a>
<a class="lu-tile c-teal" href="p-3614753af323c33dbbf24ebd/" rel="nofollow" id="tile-myspace"><i><svg viewBox="0 0 40 40" width="30" height="30" aria-hidden="true"><path d="M13 18v-5a7 7 0 0 1 14 0v5" fill="none" stroke="#fff" stroke-width="3.5"/><rect x="9" y="18" width="22" height="16" rx="4" fill="#fff"/><circle cx="20" cy="26" r="2.5" fill="#3a8fd0"/></svg></i><b>Account</b><span>Private, password locked</span></a>
</div></section>
<section class="lu-panel" id="today-panel"><div class="lu-tabhead">Today</div><p id="today-text">${T0.status==="active"?`Novena day ${T0.day} of 54 (${T0.phase})`:"Daily Scripture"} &middot; <b>${esc(T0.reading.name)} ${T0.reading.chapter}</b> &middot; ${MN[T0.mystery]} Mysteries</p><p><a class="lu-btn gold" href="day/${today}/">Open ${esc(fmt(today))}</a></p></section>
<section class="lu-panel"><div class="lu-tabhead">Join Us</div><ul class="lu-links">
<li><a class="lu-btn red" href="https://www.youtube.com/channel/UCSadxDY_Q3o_ELwXacDTP6A/live" rel="noopener">&#9658; Watch live on YouTube</a> <span class="lu-muted">https://www.youtube.com/channel/UCSadxDY_Q3o_ELwXacDTP6A/live</span></li>
<li><a class="lu-btn blue" href="https://discord.gg/HqXPUEd5JQ" rel="noopener">Join our Pio's Lost Sheep Discord Server: https://discord.gg/HqXPUEd5JQ</a></li>
<li><a class="lu-btn gold" href="https://ko-fi.com/pioslostsheep" rel="noopener">Tithe Your Shekels: https://ko-fi.com/pioslostsheep</a></li>
<li><a class="lu-btn blue" href="readings/">Today's Mass readings</a></li>
<li><a class="lu-btn blue" href="hours/">Liturgy of the Hours (daily text)</a></li>
<li><a class="lu-btn" href="https://nathanpburson.github.io/novena/rewind/?obs=1">Rewind (OBS): https://nathanpburson.github.io/novena/rewind/?obs=1</a></li></ul></section>

<script src="js/logic.js?v=${VA}"></script><script>(function(){var d=NovenaLogic.todayNY(),a=document.getElementById("today-link");var tl=document.getElementById("tile-today");var mo=["January","February","March","April","May","June","July","August","September","October","November","December"],pp=d.split("-");a.href="day/"+d+"/";a.innerHTML="Today's page &middot; "+mo[+pp[1]-1]+" "+(+pp[2])+", "+pp[0];if(tl)tl.href=a.href;fetch("day/"+d+"/",{method:"HEAD"}).then(function(r){if(!r.ok){a.href="novena/?date="+d+"#today";if(tl)tl.href=a.href}}).catch(function(){});var SITE=${JSON.stringify({novena:site.novena,reading:site.reading,mysteryMode:site.mysteryMode})},BK=${JSON.stringify(C.books.map(b=>({id:b.id,name:b.name,chapters:b.chapters,usccb:b.usccb})))},MY={joyful:"Joyful",sorrowful:"Sorrowful",glorious:"Glorious",luminous:"Luminous"},T=NovenaLogic.compute(d,SITE,BK),tt=document.getElementById("today-text");if(tt&&T.reading)tt.innerHTML="Novena day "+T.day+" of 54 ("+T.phase+") &middot; <b>"+T.reading.name+" "+T.reading.chapter+"</b> &middot; "+MY[T.mystery]+" Mysteries &middot; <a href='novena/?date="+d+"#today'>Open today</a>";var S=${JSON.stringify(site.streams||[])},n=NovenaLogic.streamForToday(S),t=document.getElementById("stream-text"),c=document.getElementById("stream-count"),sl=document.getElementById("stream-link");if(!n){t.textContent="Watch live on YouTube.";if(sl)sl.hidden=true;return}t.textContent=n.display;if(sl&&n.url){sl.href=n.url;sl.hidden=false;if(n.title)sl.textContent=n.title}function k(){c.textContent=Date.parse(n.startUtc)>Date.now()?"Starts "+NovenaLogic.countdown(n.startUtc):"Live now or starting \u2014 watch on YouTube"}k();setInterval(k,30000)})()</script>`));
{const nf=path.join(R,"novena/index.html");fs.writeFileSync(nf,fs.readFileSync(nf,"utf8").replace(/(\.\.\/(?:css|js)\/[\w.-]+\.(?:css|js))(\?v=[0-9a-f]+)?"/g,"$1?v="+VA+'"'));}
console.log("built",dates[0],"to",dates[dates.length-1],"+ rebuilt",toBuild.length,"pages total");
{const eps=loadEpisodes();fs.mkdirSync(path.join(R,"episodes"),{recursive:true});
 const list=`<section class="lu-panel" id="episodes"><div class="lu-tabhead">Episodes</div><ul class="lu-list">${eps.map(e=>`<li><a href="${e.number}/">${esc(e.title)}</a> &middot; ${esc(fmt(e.date))}</li>`).join("")}</ul></section>`;
 fs.writeFileSync(path.join(R,"episodes","index.html"),shell("Episodes · Pio's Lost Sheep","../",list+eps.map((e,i)=>episodeHtml(e,"../",{anchor:i===0})).join("")));
 for(const e of eps){const dir=path.join(R,"episodes",String(e.number));fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,"index.html"),shell(e.title+" · Pio's Lost Sheep","../../",`<p class="lu-pager"><a class="lu-btn" href="../">All episodes</a></p>`+episodeHtml(e,"../../",{anchor:true,permalink:true})));}
 console.log("episodes",eps.length);}
// /rewind/ — OBS Browser Source playlist player. Playlist: /workspace/ops/rewind/playlist.json (or $REWIND_MANIFEST)
// is copied to data/rewind_playlist.json on every build. Fallback YouTube ID: data/rewind.json videoId. Not linked anywhere.
{const RW=J("data/rewind.json"),id=String(RW.videoId).trim();if(!/^[A-Za-z0-9_-]{11}$/.test(id))throw Error("data/rewind.json videoId invalid");
const man=process.env.REWIND_MANIFEST||"/workspace/ops/rewind/playlist.json";let pl={blocks:[]};
try{if(fs.existsSync(man)){const j=JSON.parse(fs.readFileSync(man,"utf8"));const b=(Array.isArray(j)?j:(j.blocks||j.items||[])).filter(x=>typeof x==="string"||(x&&(x.driveId||x.id||x.fileId||x.url||x.youtubeId)));pl={source:"ops/rewind/playlist.json",updated_et:j.updated_et||"",blocks:b};if(j.apiKey)pl.apiKey=j.apiKey}}catch(e){console.warn("rewind manifest unreadable, using YouTube fallback:",e.message)}
fs.writeFileSync(path.join(R,"data","rewind_playlist.json"),JSON.stringify(pl,null,1)+"\n");
fs.mkdirSync(path.join(R,"rewind"),{recursive:true});
const V=GV; // cache-busting build hash
fs.writeFileSync(path.join(R,"rewind","index.html"),`<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate"><meta http-equiv="Pragma" content="no-cache"><meta http-equiv="Expires" content="0"><meta name="rewind-build" content="${V}">
<link rel="icon" type="image/png" sizes="32x32" href="../favicon-32.png"><link rel="apple-touch-icon" sizes="180x180" href="../apple-touch-icon.png"><title>Rewind</title><style>
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
