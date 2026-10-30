/* Liturgy of the Hours page logic (/hours/). Pure helpers are exported for node test.js; browser init runs only with a DOM.
   Text: five stacked Universalis iframes (their documented webmaster method, https://universalis.com/n-iframe.htm). No Universalis text is stored on this site. */
(function(root,factory){if(typeof module==="object"&&module.exports)module.exports=factory();else root.NovenaHours=factory()})(typeof self!=="undefined"?self:this,function(){
var HOURS=[
 {k:"readings",label:"Office of Readings"},
 {k:"lauds",label:"Morning Prayer (Lauds)"},
 {k:"sext",label:"Midday Prayer"},
 {k:"vespers",label:"Evening Prayer (Vespers)"},
 {k:"compline",label:"Night Prayer (Compline)"}];
function pad(n){return(n<10?"0":"")+n}
function todayNY(now){var p=new Intl.DateTimeFormat("en-CA",{timeZone:"America/New_York",hourCycle:"h23",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit"}).formatToParts(now||new Date()),o={};p.forEach(function(x){o[x.type]=x.value});return new Date(Date.UTC(+o.year,+o.month-1,+o.day,+o.hour-6)).toISOString().slice(0,10)}
function addDays(d,n){var x=new Date(d+"T12:00:00Z");x.setUTCDate(x.getUTCDate()+n);return x.getUTCFullYear()+"-"+pad(x.getUTCMonth()+1)+"-"+pad(x.getUTCDate())}
function ymd(d){return d.replace(/-/g,"")}
function universalisUrl(d,k){return"https://universalis.com/usa/"+ymd(d)+"/"+k+".htm"}
function longDate(d){return new Date(d+"T12:00:00").toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"})}
function init(doc,win){
 var $=function(id){return doc.getElementById(id)},qs=new URLSearchParams(win.location.search),today=todayNY(),st={date:/^\d{4}-\d\d-\d\d$/.test(qs.get("d")||"")?qs.get("d"):today};
 function render(){
  $("hrs-date").textContent=longDate(st.date)+(st.date===today?" (today)":"");
  HOURS.forEach(function(h){var u=universalisUrl(st.date,h.k),f=$("hrs-frame-"+h.k);if(f.getAttribute("src")!==u)f.setAttribute("src",u);$("hrs-open-"+h.k).href=u});
  doc.querySelectorAll("a[data-hour]").forEach(function(a){a.href=universalisUrl(st.date,a.getAttribute("data-hour"))})}
 function go(d){st.date=d;render()}
 $("hrs-prev").addEventListener("click",function(){go(addDays(st.date,-1))});$("hrs-next").addEventListener("click",function(){go(addDays(st.date,1))});$("hrs-today").addEventListener("click",function(){go(todayNY())});
 render()}
if(typeof document!=="undefined"&&document.getElementById&&document.getElementById("hrs-app"))init(document,window);
return{HOURS:HOURS,todayNY:todayNY,addDays:addDays,universalisUrl:universalisUrl,longDate:longDate}});
