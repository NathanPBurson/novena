// Daily routine helper: node update_site.js [--intention "..."] [--note "..."] [--day-note YYYY-MM-DD "..."]
// Only edits data/site.json; day/chapter/mysteries are computed in the browser.
const fs=require("fs"),f=__dirname+"/data/site.json",s=JSON.parse(fs.readFileSync(f)),a=process.argv.slice(2);
for(let i=0;i<a.length;i++){if(a[i]=="--intention")s.intention=a[++i];else if(a[i]=="--note")s.notes.push(a[++i]);else if(a[i]=="--day-note"){const d=a[++i];(s.dailyNotes[d]=s.dailyNotes[d]||[]).push(a[++i]);}else if(a[i]=="--clear-notes")s.notes=[];}
s.updated=require("./js/logic.js").todayNY();fs.writeFileSync(f,JSON.stringify(s,null,2)+"\n");console.log("updated",s.updated);
