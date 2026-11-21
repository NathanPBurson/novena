// Original day-page trivia, first shipped in 1c0b2fb (2026-11-08, "Mark Nov 7 as today").
// Placement: last section on the day page, after Scripture and after Bible in a Year.
// Heading: "Trivia · {book} {chapter}".
// Body: exactly three fact lines from that chapter's CPDV text, in ul.lu-list.
// Not a question/answer pair and not a click-to-reveal. Keyed by book:chapter.
function facts(entry){
  const items=entry&&entry.items;
  if(!Array.isArray(items)||items.length!==3)return null;
  if(!items.every(x=>typeof x==="string"&&x.trim()))return null;
  return items;
}
function html(entry,name,ch,esc){
  const items=facts(entry);
  if(!items)return "";
  return `<section class="lu-panel" id="trivia"><div class="lu-tabhead">Trivia &middot; ${esc(name)} ${ch}</div><ul class="lu-list">${items.map(x=>"<li>"+esc(x)+"</li>").join("")}</ul></section>`;
}
module.exports={facts,html};
