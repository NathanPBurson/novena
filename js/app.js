(function(){
var R=window.SITE_ROOT||"",L=window.NovenaLogic, S, C, T, bookById={};
var MN={joyful:"Joyful",sorrowful:"Sorrowful",glorious:"Glorious",luminous:"Luminous"};
var ICON={joyful:"\u2605",sorrowful:"\u271D",glorious:"\u2600",luminous:"\u2726"};
function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function fmt(d){var a=d.split("-");return["January","February","March","April","May","June","July","August","September","October","November","December"][a[1]-1]+" "+(+a[2])+", "+a[0]}
function getJSON(u){return fetch(u,{cache:"no-cache"}).then(function(r){if(!r.ok)throw Error(u);return r.json()})}
function pr(t,x){return '<div class="prayer"><h4>'+esc(t)+'</h4><p>'+esc(x)+'</p></div>'}
function testDate(){var m=location.search.match(/[?&]date=(\d{4}-\d\d-\d\d)/);return m?m[1]:L.todayNY()}
function imgCheck(el,src,cls,fallback){var i=new Image();i.onload=function(){el.style.backgroundImage="url("+src+")";if(el.id!=="header")el.innerHTML=""};i.onerror=function(){el.classList.add(cls);if(fallback)fallback()};i.src=src}
function chapLink(r){return '#read/'+r.book+'/'+r.chapter}
function intention(){return (S.intention||"").trim()||"the favor I place in your hands"}
function myst(){return C.prayers.mysteries[T.mystery]}

function side(){
  var m=T.mystery;
  document.getElementById("side-myst").innerHTML='<div class="myst-img m-'+m+'" id="mimg">'+ICON[m]+'</div><b class="m-'+m+'">The '+MN[m]+' Mysteries</b><ol style="padding-left:18px;margin:4px 0;font-size:12px">'+
    myst().decades.map(function(d){return '<li>'+esc(d.title.replace(/^The \w+ \w+ Mystery - /,""))+'</li>'}).join("")+'</ol><a class="gbtn gold" href="#pray">Pray today &raquo;</a>';
  imgCheck(document.getElementById("mimg"),R+"images/"+m+".jpg","fb-"+m);
  var r=T.reading;document.getElementById("side-read").innerHTML=r?'<p style="margin:0 0 6px"><a href="'+chapLink(r)+'"><b>'+esc(r.name)+' '+r.chapter+'</b></a></p><a class="gbtn" href="'+chapLink(r)+'">Read in CPDV</a> <a href="'+L.nabreLink(bookById[r.book],r.chapter).url+'" target="_blank" rel="noopener">NABRE &rarr;</a>':'';
}

function hud(){var r=T.reading,bk=r&&bookById[r.book],pct=function(a,b){return Math.max(0,Math.min(100,a/b*100)).toFixed(1)+"%"};
  var phDay=T.phase==="petition"?T.prayerDay:T.prayerDay-27;
  return '<div class="hud"><div class="hud-stats">'+
   '<div class="hud-row"><span class="hud-lbl">Novena</span><div class="bar b-red"><i style="width:'+pct(T.prayerDay,54)+'"></i></div><span class="hud-num n-red">'+T.prayerDay+'/54</span></div>'+
   '<div class="hud-row"><span class="hud-lbl">'+(T.phase==="petition"?"Petition":"Thanks")+'</span><div class="bar b-gray"><i style="width:'+pct(phDay,27)+'"></i></div><span class="hud-num n-gray">'+phDay+'/27</span></div>'+
   (bk?'<div class="hud-row"><span class="hud-lbl">'+esc(bk.abbr)+'</span><div class="bar b-blue"><i style="width:'+pct(r.chapter,bk.chapters)+'"></i></div><span class="hud-num n-blue">'+r.chapter+'/'+bk.chapters+'</span></div>':'')+
   '<div class="hud-row"><span class="hud-lbl">Surrender</span><div class="bar b-gold"><i style="width:'+pct(T.surrenderDay,9)+'"></i></div><span class="hud-num n-gold">'+T.surrenderDay+'/9</span></div>'+
   '</div><div class="hud-map" id="hmap" style="background-image:url(images/'+T.mystery+'.jpg)"><b>'+MN[T.mystery].toUpperCase()+'</b></div></div>'+
   (r?'<div class="mission"><span class="ex">!</span><div style="flex:1"><b style="color:#ffc04d">TODAY\'S MISSION</b><br>Read <a href="'+chapLink(r)+'">'+esc(r.name)+' '+r.chapter+'</a> and pray the '+MN[T.mystery]+' Mysteries</div><a class="arr" href="#pray">&#9654;</a></div>':'');}
function vToday(){
  var r=T.reading,ph=T.phase==="petition"?"Prayer in Petition":"Prayer in Thanksgiving",h=hud()+'<div class="box"><h2>Today &middot; '+fmt(T.date)+'</h2>';
  if(T.status==="waiting")h+='<p>The novena begins '+fmt(T.startDate)+'.</p>';
  else if(T.status==="done")h+='<p class="big">These fifty-four days are finished. Deo gratias!</p>';
  h+='<div class="stat"><div><b>'+(T.status==="active"?"Day "+T.day:"&mdash;")+'</b><span>of 54</span></div><div><b>'+(T.phase==="petition"?"Petition":"Thanksgiving")+'</b><span>'+ph+'</span></div><div><b class="m-'+T.mystery+'">'+MN[T.mystery]+'</b><span>Mysteries</span></div></div>';
  h+='<p><b>Intention:</b> <i>'+esc(intention())+'</i></p>';
  if(r){var rf=C.chapterReflections[r.book+":"+r.chapter],nl=L.nabreLink(bookById[r.book],r.chapter);
    h+='<p><b>Today\'s chapter:</b> <a href="'+chapLink(r)+'">'+esc(r.name)+' '+r.chapter+'</a> (CPDV) &middot; <a href="'+nl.url+'" target="_blank" rel="noopener">read in the NABRE</a></p>';
    if(rf)h+='<div class="note"><p style="margin:0;font:14px/1.7 Georgia,serif">'+esc(rf.reflection)+'</p><ol class="muted">'+rf.questions.map(function(q){return'<li>'+esc(q)+'</li>'}).join("")+'</ol></div>';}
  var notes=(S.notes||[]).concat(S.dailyNotes&&S.dailyNotes[T.date]?[].concat(S.dailyNotes[T.date]):[]);
  if(notes.length)h+='<div class="sec">Notes</div>'+notes.map(function(n){return'<div class="note">'+esc(n)+'</div>'}).join("");
  h+='<p class="muted">Day 1 was '+fmt(T.startDate)+'; day 54 is '+fmt(T.endDate)+'. Days 1&ndash;27 are in petition, days 28&ndash;54 in thanksgiving. Surrender novena: day '+T.surrenderDay+' of 9.</p>';
  h+='<p><a class="gbtn red" href="#pray">Begin today\'s Rosary novena &raquo;</a></p></div>';
  // mystery meditations w/ reflections
  var refl=C.mysteryReflections[T.mystery]||[];
  h+='<div class="box"><h2 class="m-'+T.mystery+'">The '+MN[T.mystery]+' Mysteries</h2>'+myst().decades.map(function(d,i){var rd=C.mysteryReadings[T.mystery][i],rr=refl[i];
    return '<details><summary>'+esc(d.title)+'</summary><p class="muted">Fruit: '+esc(d.fruit)+' &middot; <a href="#read/'+rd.book+'/'+rd.chapter+'">'+esc(rd.reading)+'</a></p>'+(rr?'<p>'+esc(rr.reflection)+'</p><ol class="muted">'+rr.questions.map(function(q){return'<li>'+esc(q)+'</li>'}).join("")+'</ol>':'')+'</details>'}).join("")+'</div>';
  return h;
}

function vPray(){
  var P=C.prayers,pet=T.phase==="petition",m=myst(),h='<div class="box"><h2>The Rosary Novena &middot; Day '+T.prayerDay+'</h2><p class="muted">'+(pet?"Prayer in petition":"Prayer in thanksgiving")+' &middot; <span class="m-'+T.mystery+'">'+MN[T.mystery]+' Mysteries</span> &middot; Intention: <i>'+esc(intention())+'</i></p>';
  h+='<div class="sec">Opening</div>'+pr("The Sign of the Cross",P.sign)+pr("Hail Mary",P.hailMary)+
    pr(pet?"The Petition Prayer":"The Thanksgiving Prayer",[P.mysteries[T.mystery].crown,pet?P.petitionQueen:P.thanksQueen,pet?P.petitionEnd:P.thanksEnd].join("\n\n"))+
    pr("The Apostles\u2019 Creed",P.creed)+pr("Our Father",P.ourFather)+pr("Hail Mary (three times)",P.hailMary)+pr("Glory Be",P.glory)+pr("Fatima Prayer",P.fatima);
  m.decades.forEach(function(d,i){var rd=C.mysteryReadings[T.mystery][i];
    h+='<div class="sec">Decade '+(i+1)+'</div>'+pr(d.title,d.address+"\n\n"+d.meditation+"\n\nI humbly pray \u2014")+'<p class="muted"><a href="#read/'+rd.book+'/'+rd.chapter+'">'+esc(rd.reading)+'</a></p>'+
    pr("Our Father",P.ourFather)+pr("Hail Mary (ten times)",P.hailMary)+pr("Glory Be",P.glory)+pr("Fatima Prayer",P.fatima)+
    pr("Bind the decade","I bind these "+P.roses[T.mystery]+" with a petition for the grace of "+d.fruit+", and humbly lay this bouquet at your feet.")});
  var hr=+new Intl.DateTimeFormat("en-US",{timeZone:"America/New_York",hour:"numeric",hour12:false}).format(new Date());
  h+='<div class="sec">Closing</div>'+pr("Spiritual Communion",P.spiritual)+
    pr(pet?"Prayer in Petition":"Prayer in Thanksgiving",(pet?P.petitionClose:P.thanksClose).replace("(specify request here)",intention()))+
    pr("Hail Mary",P.hailMary)+pr("Hail, Holy Queen",P.hailHolyQueen)+pr("Versicle",P.versicle)+pr("Let us pray",P.collect)+pr("May the divine assistance",P.assistance)+
    pr("For the faithful departed",P.souls)+pr("Blessing",P.blessing.replace("(day/night)",(hr>=17||hr<5)?"night":"day"))+pr(P.michaelTitle,P.michael)+pr(P.memorareTitle,P.memorare);
  h+='<details><summary>'+esc(P.litany[0])+'</summary><p style="white-space:pre-line;font-family:Georgia">'+esc(P.litany.slice(1).join("\n"))+'</p></details>';
  h+='<div class="sec">Closing &middot; The Surrender Novena (Don Dolindo Ruotolo) &middot; Day '+T.surrenderDay+' of 9</div>'+
    pr("Day "+T.surrenderDay,C.surrender[T.surrenderDay-1])+pr("Ten times",C.surrenderRefrain)+pr("To Our Lady",C.surrenderMarian)+'<p class="muted">Servant of God Don Dolindo Ruotolo.</p>'+
    '<details><summary>All nine days of the Surrender Novena</summary>'+C.surrender.map(function(t,i){return pr("Day "+(i+1),t)}).join("")+'</details>'+
    pr("The Sign of the Cross",P.sign)+pr("At the crucifix",P.kiss.replace(/^\*/,""))+'</div>';
  return h;
}

function vReadIndex(){
  var h='<div class="box"><h2>Read the Bible</h2><p class="muted">All 73 books of the Catholic canon in the Catholic Public Domain Version, with links to the NABRE.</p>';
  if(T.reading)h+='<p>Today: <a class="gbtn" href="'+chapLink(T.reading)+'">'+esc(T.reading.name)+' '+T.reading.chapter+'</a></p>';
  var g=null;["ot","nt"].forEach(function(t){h+='<div class="sec">'+(t==="ot"?"Old Testament (46)":"New Testament (27)")+'</div>';var grp=null,html="";
    C.books.filter(function(b){return b.testament===t}).forEach(function(b){if(b.group!==grp){if(grp)html+='</ul>';grp=b.group;html+='<div class="grp">'+esc(grp)+'</div><ul class="booklist">'}html+='<li><a href="#read/'+b.id+'">'+esc(b.name)+'</a> <span class="muted">'+b.chapters+'</span></li>'});
    h+=html+'</ul>'});
  return h+'</div>';
}
function vBook(b){return '<div class="box"><p class="muted">'+esc(b.group)+'</p><h2>'+esc(b.name)+'</h2>'+(b.also?'<p class="muted">Also called '+esc(b.also)+'</p>':'')+'<div class="chgrid">'+
  Array.from({length:b.chapters},function(_,i){return'<a href="#read/'+b.id+'/'+(i+1)+'">'+(i+1)+'</a>'}).join("")+'</div><p><a href="https://bible.usccb.org/bible/'+b.usccb+'/0" target="_blank" rel="noopener">NABRE introduction &rarr;</a> &middot; <a href="#read">All books</a></p></div>'}
function vChapter(b,ch,main){
  var nl=L.nabreLink(b,ch),idx=C.books.indexOf(b),prev=ch>1?[b,ch-1]:idx>0?[C.books[idx-1],C.books[idx-1].chapters]:null,next=ch<b.chapters?[b,ch+1]:idx<72?[C.books[idx+1],1]:null;
  var nav='<div class="nav">'+(prev?'<a href="#read/'+prev[0].id+'/'+prev[1]+'">&laquo; '+esc(prev[0].name)+' '+prev[1]+'</a>':'<span></span>')+(next?'<a href="#read/'+next[0].id+'/'+next[1]+'">'+esc(next[0].name)+' '+next[1]+' &raquo;</a>':'')+'</div>';
  main.innerHTML='<div class="box"><p class="muted"><a href="#read">All books</a> &rsaquo; <a href="#read/'+b.id+'">'+esc(b.name)+'</a></p><h2>'+esc(b.name)+' '+ch+'</h2><p><a href="'+nl.url+'" target="_blank" rel="noopener">Read '+esc(b.name)+' '+ch+' in the NABRE &rarr;</a></p>'+(nl.note?'<p class="muted">'+esc(nl.note)+'</p>':'')+nav+'<div class="verses" id="vv">Loading&hellip;</div>'+nav+'</div>';
  getJSON(R+"bible/cpdv/"+b.id+".json").then(function(j){var vs=j.chapters[ch-1]||[];var rf=C.chapterReflections[b.id+":"+ch];
    document.getElementById("vv").innerHTML=vs.map(function(v,i){return'<span id="v'+(i+1)+'"><sup>'+(i+1)+'</sup>'+esc(v)+' </span>'}).join("")+(rf?'<div class="note"><b>Reflection</b><p>'+esc(rf.reflection)+'</p><ol class="muted">'+rf.questions.map(function(q){return'<li>'+esc(q)+'</li>'}).join("")+'</ol></div>':'');
  }).catch(function(){document.getElementById("vv").innerHTML='This chapter could not be opened. <a href="'+nl.url+'">Read it in the NABRE</a>.'});
}
function vDays(){
  var h='<div class="box"><h2>The 54 Days</h2><p class="muted">Day '+S.novena.anchorDay+' is '+fmt(S.novena.anchorDate)+'. Day 1 is '+fmt(T.startDate)+'. Day 54 is '+fmt(T.endDate)+'. Days 1&ndash;27 are in petition; days 28&ndash;54 in thanksgiving.</p>';
  [["Prayer in petition",1,27],["Prayer in thanksgiving",28,54]].forEach(function(s){h+='<div class="sec">'+s[0]+'</div><div class="daygrid">';
    for(var d=s[1];d<=s[2];d++){var dt=L.addDays(T.startDate,d-1);h+='<div class="'+(d===T.day?"now":d<T.day?"past":"")+'" title="'+fmt(dt)+'">'+d+'<br><span style="font-size:9px">'+dt.slice(5).replace("-","/")+'</span></div>'}h+='</div>'});
  return h+'<p class="muted">If a day was truly missed, the old custom is to begin again.</p></div>';
}
function vFeasts(){
  var y=+T.date.slice(0,4),rows=C.feasts.map(function(f){var e=y+"-"+String(f.month).padStart(2,"0")+"-"+String(f.day).padStart(2,"0");if(e<T.date)e=(y+1)+e.slice(4);var s=L.addDays(e,-53);return{f:f,s:s,e:e,on:T.date>=s&&T.date<=e}}).sort(function(a,b){return a.e<b.e?-1:1});
  return '<div class="box"><h2>Marian Feasts</h2><p class="muted">Begin a 54 day novena 53 days before a feast so the last day falls on it.</p><table style="width:100%;border-collapse:collapse">'+rows.map(function(r){return'<tr style="border-bottom:1px dotted #d8c9a3'+(r.on?';background:#fff8d8':'')+'"><td style="padding:4px"><b>'+esc(r.f.name)+'</b></td><td>'+fmt(r.e)+'</td><td class="muted">start '+fmt(r.s)+(r.on?' &middot; day '+(L.diffDays(r.s,T.date)+1):'')+'</td></tr>'}).join("")+'</table></div>';
}
function route(){
  var h=(location.hash||"#today").slice(1).split("/"),tab=h[0]||"today",main=document.getElementById("main");
  [].forEach.call(document.querySelectorAll("#tabs a"),function(a){a.classList.toggle("on",a.getAttribute("data-tab")===tab)});
  if(tab==="read"){var b=bookById[h[1]];if(b&&h[2]&&+h[2]>=1&&+h[2]<=b.chapters)vChapter(b,+h[2],main);else main.innerHTML=b?vBook(b):vReadIndex()}
  else main.innerHTML=({pray:vPray,days:vDays,feasts:vFeasts}[tab]||vToday)();
  window.scrollTo(0,0);
}
Promise.all([getJSON(R+"data/site.json"),getJSON(R+"data/content.json")]).then(function(a){
  S=a[0];C=a[1];C.books.forEach(function(b){bookById[b.id]=b});T=L.compute(testDate(),S,C.books);
  var ln=S.links||{};if(ln.live)document.getElementById("l-live").href=ln.live;
  document.getElementById("upd").textContent="Updated "+(S.updated||"");
  imgCheck(document.getElementById("header"),R+"images/header.jpg","noimg");
  side();route();window.addEventListener("hashchange",route);
}).catch(function(e){document.getElementById("main").innerHTML='<div class="box">Could not load the novena data. Please refresh.</div>'});
})();
