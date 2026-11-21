// Day-page trivia (Nathan, Nov 20, 11:32 PM ET): last section on the page.
// Heading: "Trivia · {book} {chapter}".
// Body: a short Background of 3 or 4 extra details (history, custom, geography,
// or Catholic reading: the Fathers' received sense, typology, the Mass or the
// sacraments), then 2 or 3 Discussion Questions for a stream or a small group.
// Scripture quoted inside the background is the CPDV. The old three fact-lines
// shape is not accepted.
function ready(entry){
  if(!entry||entry.items)return null;
  const background=entry.background,questions=entry.questions;
  if(!Array.isArray(background)||background.length<3||background.length>4)return null;
  if(!Array.isArray(questions)||questions.length<2||questions.length>3)return null;
  if(!background.every(x=>typeof x==="string"&&x.trim()))return null;
  if(!questions.every(x=>typeof x==="string"&&x.trim()&&x.includes("?")))return null;
  return {background,questions};
}
function html(entry,name,ch,esc){
  const p=ready(entry);
  if(!p)return "";
  const bg=p.background.map(x=>"<li>"+esc(x)+"</li>").join("");
  const qs=p.questions.map(x=>"<li>"+esc(x)+"</li>").join("");
  return `<section class="lu-panel" id="trivia"><div class="lu-tabhead">Trivia &middot; ${esc(name)} ${ch}</div><div class="lu-note" data-part="background"><b>Background</b><ul>${bg}</ul></div><div class="lu-note" data-part="questions"><b>Discussion Questions</b><ol>${qs}</ol></div></section>`;
}
module.exports={ready,html};
