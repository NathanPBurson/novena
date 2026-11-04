/* /readings/ : today's Mass readings from Universalis (their documented iframe, https://universalis.com/n-iframe.htm). No text is stored here.
   Date = New York with the 6 AM rollover (js/logic.js), computed in the browser, so no daily build is needed. */
(function(root,factory){if(typeof module==="object"&&module.exports)module.exports=factory(require("./logic.js"));else root.NovenaReadings=factory(root.NovenaLogic)})(typeof self!=="undefined"?self:this,function(L){
function massUrl(d){return"https://universalis.com/usa/"+d.replace(/-/g,"")+"/mass.htm"}
function longDate(d){return new Date(d+"T12:00:00").toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"})}
function init(doc,win){var $=function(i){return doc.getElementById(i)},qs=new URLSearchParams(win.location.search),today=L.todayNY(),st={d:/^\d{4}-\d\d-\d\d$/.test(qs.get("d")||"")?qs.get("d"):today};
 function render(){var u=massUrl(st.d);$("rd-date").textContent=longDate(st.d)+(st.d===today?" (today)":"");if($("rd-frame").getAttribute("src")!==u)$("rd-frame").setAttribute("src",u);$("rd-open").href=u}
 $("rd-prev").addEventListener("click",function(){st.d=L.addDays(st.d,-1);render()});$("rd-next").addEventListener("click",function(){st.d=L.addDays(st.d,1);render()});$("rd-today").addEventListener("click",function(){st.d=L.todayNY();render()});render()}
if(typeof document!=="undefined"&&document.getElementById&&document.getElementById("rd-app"))init(document,window);
return{massUrl:massUrl,longDate:longDate}});
