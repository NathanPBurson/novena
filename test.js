const L=require("./js/logic.js"),site=require("./data/site.json"),books=require("./data/content.json").books;
const cases=[["2026-10-21",41,"Genesis",46,"glorious"],["2026-10-23",43,"Genesis",48,"sorrowful"],["2026-10-25",45,"Genesis",50,"glorious"],["2026-10-26",46,"Exodus",1,"joyful"],["2026-10-29",49,"Exodus",4,"luminous"],["2026-11-03",54,"Exodus",9,"sorrowful"],["2026-09-11",1,"Genesis",46,"sorrowful"]];
let ok=true;for(const [d,day,b,ch,m] of cases){const r=L.compute(d,site,books);const pass=r.day===day&&r.reading.name===b&&r.reading.chapter===ch&&r.mystery===m;ok&=pass;console.log(pass?"PASS":"FAIL",d,"day",r.day,r.phase,r.reading.name,r.reading.chapter,r.mystery,"surrender",r.surrenderDay);}
console.log("NY today:",L.todayNY());process.exit(ok?0:1);
