// Pio's Lost Sheep static page generator. Usage: node build_pages.js [--from YYYY-MM-DD] [--days 7]
// Builds /day/YYYY-MM-DD/index.html for today (America/New_York) through +7 days, the home page (/index.html)
// and /day/index.html. Idempotent: pages are fully rewritten each run; older day pages are kept.
const fs=require("fs"),path=require("path"),L=require("./js/logic.js");
const R=__dirname,J=f=>JSON.parse(fs.readFileSync(path.join(R,f)));
const site=J("data/site.json"),C=J("data/content.json"),SC=J("data/scenes.json").scenes,ART=J("data/art_meta.json"),CR=J("data/art_credits.json");
const a=process.argv.slice(2),arg=(k,d)=>{const i=a.indexOf(k);return i>=0?a[i+1]:d};
const from=arg("--from",L.todayNY()),ahead=+arg("--days",7);
const byId={};C.books.forEach(b=>byId[b.id]=b);
const MN={joyful:"Joyful",sorrowful:"Sorrowful",glorious:"Glorious",luminous:"Luminous"};
const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const fmt=d=>{const[y,m,dd]=d.split("-");return["January","February","March","April","May","June","July","August","September","October","November","December"][m-1]+" "+(+dd)+", "+y};
const wk=d=>["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][new Date(d+"T12:00:00Z").getUTCDay()];
const intention=()=>(site.intention||"").trim()||"the favor I place in your hands"; // used verbatim
const pr=(t,x)=>`<div class="lu-prayer"><h4>${esc(t)}</h4><p>${esc(x)}</p></div>`;
function credit(t){const m=ART[t],c=CR[t]||{};return `<li><b>${esc(c.title||m.title)}</b> &mdash; ${esc(c.artist||m.artist)}${c.date?" ("+esc(c.date)+")":""} &middot; ${esc(m.license)} &middot; <a href="${esc(m.source)}" rel="noopener">source</a></li>`}
function collage(sc,root){return `<figure class="lu-collage"><div class="lu-frame"><img src="${root}${sc.image||("images/scenes/"+sc.ref.replace(":","-")+"-"+sc.after+".jpg")}" alt="${esc(sc.scene)} — collage of public-domain paintings" loading="lazy"></div><figcaption><span class="lu-chip">Scene</span> ${esc(sc.scene)}<ul>${sc.art.map(credit).join("")}</ul></figcaption></figure>`}
function shell(title,root,body,extra=""){return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title><link rel="icon" href="${root}favicon.svg"><link rel="stylesheet" href="${root}css/lu.css">${extra}</head>
<body class="lu"><div class="lu-hud-top"><a class="lu-brand" href="${root}"><span class="lu-gem"></span>Pio's Lost Sheep</a>
<nav class="lu-nav"><a href="${root}">Home</a><a href="${root}novena/">Novena</a><a href="${root}day/">Daily Pages</a><a href="https://www.youtube.com/channel/UCSadxDY_Q3o_ELwXacDTP6A/live" rel="noopener">Live</a></nav></div>
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
  h+=`<section class="lu-panel"><div class="lu-tabhead">Scripture &middot; ${esc(r.name)} ${r.chapter} (CPDV)</div><p><a class="lu-btn blue" href="${nl.url}" rel="noopener">Read ${esc(r.name)} ${r.chapter} in the NABRE &rarr;</a></p>${nl.note?`<p class="lu-muted">${esc(nl.note)}</p>`:""}<p class="lu-verses">${vh}</p>${rf?`<div class="lu-note"><b>Reflection</b><p>${esc(rf.reflection)}</p><ol>${rf.questions.map(q=>"<li>"+esc(q)+"</li>").join("")}</ol></div>`:""}</section>`;
  h+=`<section class="lu-panel" id="pray"><div class="lu-tabhead m-${T.mystery}">The ${MN[T.mystery]} Mysteries</div>`+m.decades.map((d,i)=>{const rd=C.mysteryReadings[T.mystery][i];return `<details class="lu-quest"><summary>${esc(d.title)}</summary><p class="lu-muted">Fruit: ${esc(d.fruit)} &middot; ${esc(rd.reading)}</p><p>${esc(d.address)}</p><p>${esc(d.meditation)}</p></details>`}).join("")+`</section>`;
  if(active){h+=`<section class="lu-panel"><div class="lu-tabhead">Rosary Novena &middot; Day ${T.day} &middot; ${pet?"Petition":"Thanksgiving"}</div>`+
    pr(pet?"The Petition Prayer":"The Thanksgiving Prayer",[m.crown,pet?P.petitionQueen:P.thanksQueen,pet?P.petitionEnd:P.thanksEnd].join("\n\n"))+
    pr(pet?"Prayer in Petition":"Prayer in Thanksgiving",(pet?P.petitionClose:P.thanksClose).replace("(specify request here)",intention()))+
    `<p><a class="lu-btn gold" href="../../novena/#pray">Full Rosary novena prayers &raquo;</a></p></section>`;
    h+=`<section class="lu-panel"><div class="lu-tabhead">Surrender Novena (Don Dolindo Ruotolo) &middot; Day ${T.surrenderDay} of 9</div>`+pr("Day "+T.surrenderDay,C.surrender[T.surrenderDay-1])+pr("Ten times",C.surrenderRefrain)+pr("To Our Lady",C.surrenderMarian)+`</section>`;}
  else h+=`<section class="lu-panel"><div class="lu-tabhead">Surrender Novena</div><p>${T.status==="done"?"The 54 day novena is finished. Deo gratias! You may begin the Surrender Novena again at any time:":""}</p>`+pr("Day 1",C.surrender[0])+pr("Ten times",C.surrenderRefrain)+`</section>`;
  return shell(`${fmt(date)} · ${r.name} ${r.chapter} · Pio's Lost Sheep`,root,h);
}
const dates=[];for(let i=0;i<=ahead;i++)dates.push(L.addDays(from,i));
for(const d of dates){const dir=path.join(R,"day",d);fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,"index.html"),dayPage(d));}
const all=fs.readdirSync(path.join(R,"day")).filter(x=>/^\d{4}-\d\d-\d\d$/.test(x)).sort();
const today=L.todayNY(),T0=L.compute(today,site,C.books);
fs.writeFileSync(path.join(R,"day","index.html"),shell("Daily Pages · Pio's Lost Sheep","../",`<section class="lu-panel"><div class="lu-tabhead">Daily Pages</div><ul class="lu-list">${all.map(d=>{const t=L.compute(d,site,C.books);return `<li><a href="${d}/">${esc(fmt(d))}</a> &middot; ${esc(t.reading.name)} ${t.reading.chapter} &middot; ${t.status==="active"?"Novena day "+t.day:t.status==="done"?"after the novena":"before the novena"}</li>`}).join("")}</ul></section>`));
// Home page. JS redirects "today" to the live NY date; static fallback is the build date.
fs.writeFileSync(path.join(R,"index.html"),shell("Pio's Lost Sheep","",`<section class="lu-panel lu-hero"><div class="lu-hero-art"></div><div class="lu-hero-text"><div class="lu-kicker">Welcome, Lost Sheep</div><h1>Pio's Lost Sheep</h1><p>Pray, read Scripture one chapter a day, and gather with us live.</p>
<p><a class="lu-btn gold" id="today-link" href="day/${today}/">Today's page &middot; ${esc(fmt(today))}</a> <a class="lu-btn" href="novena/">54 Day Rosary Novena</a></p></div></section>
<section class="lu-panel"><div class="lu-tabhead">Today</div><p>${T0.status==="active"?`Novena day ${T0.day} of 54 (${T0.phase})`:"Daily Scripture"} &middot; <b>${esc(T0.reading.name)} ${T0.reading.chapter}</b> &middot; ${MN[T0.mystery]} Mysteries</p></section>
<section class="lu-panel"><div class="lu-tabhead">Join Us</div><ul class="lu-links">
<li><a class="lu-btn red" href="https://www.youtube.com/channel/UCSadxDY_Q3o_ELwXacDTP6A/live" rel="noopener">&#9658; Watch live on YouTube</a> <span class="lu-muted">https://www.youtube.com/channel/UCSadxDY_Q3o_ELwXacDTP6A/live</span></li>
<li><a class="lu-btn blue" href="https://discord.gg/HqXPUEd5JQ" rel="noopener">Join our Pio's Lost Sheep Discord Server: https://discord.gg/HqXPUEd5JQ</a></li>
<li><a class="lu-btn gold" href="https://ko-fi.com/pioslostsheep" rel="noopener">Tithe Your Shekels: https://ko-fi.com/pioslostsheep</a></li></ul></section>
<section class="lu-panel"><div class="lu-tabhead">Sections</div><ul class="lu-list"><li><a href="novena/">The 54 Day Rosary Novena</a> &mdash; prayers, mysteries, the 54-day calendar and the whole Bible</li><li><a href="day/">Daily pages</a> &mdash; one page per date with the chapter, art and prayers</li></ul></section>
<script src="js/logic.js"></script><script>(function(){var d=NovenaLogic.todayNY(),a=document.getElementById("today-link");a.href="day/"+d+"/";})()</script>`));
console.log("built",dates[0],"to",dates[dates.length-1],"("+dates.length+" pages)");
