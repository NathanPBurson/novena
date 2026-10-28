/* Liturgy of the Hours page logic (/hours/). Pure helpers are exported for node test.js; browser init runs only with a DOM.
   Modern text: Universalis iframe (their documented webmaster method, https://universalis.com/n-iframe.htm).
   Traditional text: static JSON generated from Divinum Officium (MIT code, public-domain texts): hours/trad/YYYY-MM-DD.json */
(function(root,factory){if(typeof module==="object"&&module.exports)module.exports=factory();else root.NovenaHours=factory()})(typeof self!=="undefined"?self:this,function(){
var HOURS=[ // key = Universalis hour page; trad = Divinum Officium hour key
 {k:"readings",label:"Office of Readings",trad:"matins",tradLabel:"Matins"},
 {k:"lauds",label:"Morning Prayer (Lauds)",trad:"lauds",tradLabel:"Lauds"},
 {k:"sext",label:"Midday Prayer",trad:"sext",tradLabel:"Sext (midday)"},
 {k:"vespers",label:"Evening Prayer (Vespers)",trad:"vespers",tradLabel:"Vespers"},
 {k:"compline",label:"Night Prayer (Compline)",trad:"compline",tradLabel:"Compline"}];
var EXTRA=[{k:"terce",label:"Terce",trad:"terce"},{k:"none",label:"None",trad:"none"}];
var TRAD_ONLY=[{k:"prime",label:"Prime",trad:"prime"}];
function pad(n){return(n<10?"0":"")+n}
function todayNY(now){var p=new Intl.DateTimeFormat("en-CA",{timeZone:"America/New_York",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(now||new Date()),o={};p.forEach(function(x){o[x.type]=x.value});return o.year+"-"+o.month+"-"+o.day}
function addDays(d,n){var x=new Date(d+"T12:00:00Z");x.setUTCDate(x.getUTCDate()+n);return x.getUTCFullYear()+"-"+pad(x.getUTCMonth()+1)+"-"+pad(x.getUTCDate())}
function ymd(d){return d.replace(/-/g,"")}
function universalisUrl(d,k){return"https://universalis.com/usa/"+ymd(d)+"/"+k+".htm"}
function divinumUrl(d,tradKey){var P={matins:"Matutinum",lauds:"Laudes",prime:"Prima",terce:"Tertia",sext:"Sexta",none:"Nona",vespers:"Vespera",compline:"Completorium"};
 return"https://www.divinumofficium.com/cgi-bin/horas/officium.pl?date1="+d.slice(5,7)+"-"+d.slice(8,10)+"-"+d.slice(0,4)+"&command=pray"+P[tradKey]+"&version=Divino%20Afflatu&lang2=English"}
function longDate(d){return new Date(d+"T12:00:00").toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"})}
function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function init(doc,win){
 var $=function(id){return doc.getElementById(id)},base=$("hrs-app").getAttribute("data-base")||"";
 var qs=new URLSearchParams(win.location.search),today=todayNY(),st={date:/^\d{4}-\d\d-\d\d$/.test(qs.get("d")||"")?qs.get("d"):today,hour:qs.get("hour")||"lauds",mode:qs.get("mode")==="trad"?"trad":"modern"},cache={};
 var all=HOURS.concat(EXTRA,TRAD_ONLY);if(!all.some(function(h){return h.k===st.hour}))st.hour="lauds";
 function get(d){if(cache[d])return cache[d];return cache[d]=win.fetch(base+d+".json").then(function(r){if(!r.ok)throw 0;return r.json()}).catch(function(){return null})}
 function render(){
  var h=all.filter(function(x){return x.k===st.hour})[0];
  if(st.mode==="modern"&&h.k==="prime"){st.hour="lauds";h=all[1]}
  $("hrs-date").textContent=longDate(st.date)+(st.date===today?" (today)":"");
  doc.querySelectorAll("[data-hour]").forEach(function(a){var k=a.getAttribute("data-hour");a.href=universalisUrl(st.date,k);a.classList.toggle("on",k===st.hour)});
  doc.querySelectorAll("#hrs-hours button[data-hr]").forEach(function(b){var k=b.getAttribute("data-hr");b.classList.toggle("on",k===st.hour);if(k==="prime")b.hidden=st.mode!=="trad"});
  doc.querySelectorAll("#hrs-modes button").forEach(function(b){b.classList.toggle("on",b.getAttribute("data-mode")===st.mode)});
  $("hrs-modern").hidden=st.mode!=="modern";$("hrs-trad").hidden=st.mode!=="trad";
  var url=universalisUrl(st.date,h.k);
  if(st.mode==="modern"){var f=$("hrs-frame");if(f.getAttribute("src")!==url)f.setAttribute("src",url);$("hrs-open").href=url}
  else{var body=$("hrs-trad-body");body.innerHTML="<p class=\"lu-muted\">Loading&hellip;</p>";var want=st.date+"/"+st.hour;
   get(st.date).then(function(day){if(want!==st.date+"/"+st.hour||st.mode!=="trad")return;
    if(!day||!day.hours[h.trad]){body.innerHTML="<p>The on-site traditional text for this date is not generated yet. You can read it at <a href=\""+divinumUrl(st.date,h.trad)+"\" rel=\"noopener\">Divinum Officium</a>, or switch to the modern text.</p>";return}
    var x=day.hours[h.trad];body.innerHTML="<h3>"+esc(h.label==="Midday Prayer"?"Sext (midday)":h.tradLabel||h.label)+"</h3><p class=\"dv-day\"><b>"+esc(x.title)+"</b>"+(x.sub?"<br><i>"+esc(x.sub)+"</i>":"")+"</p><div class=\"dv-text\">"+x.html+"</div>"})}
  $("hrs-next").disabled=false}
 function go(p){for(var k in p)st[k]=p[k];render()}
 doc.querySelectorAll("#hrs-hours button[data-hr]").forEach(function(b){b.addEventListener("click",function(){go({hour:b.getAttribute("data-hr")})})});
 doc.querySelectorAll("#hrs-modes button").forEach(function(b){b.addEventListener("click",function(){go({mode:b.getAttribute("data-mode")})})});
 $("hrs-prev").addEventListener("click",function(){go({date:addDays(st.date,-1)})});$("hrs-next").addEventListener("click",function(){go({date:addDays(st.date,1)})});$("hrs-today").addEventListener("click",function(){go({date:todayNY()})});
 render()}
if(typeof document!=="undefined"&&document.getElementById&&document.getElementById("hrs-app"))init(document,window);
return{HOURS:HOURS,EXTRA:EXTRA,TRAD_ONLY:TRAD_ONLY,todayNY:todayNY,addDays:addDays,universalisUrl:universalisUrl,divinumUrl:divinumUrl,longDate:longDate}});
