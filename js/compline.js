/* Renders data/compline.json (public-domain Night Prayer) to HTML. Browser (window.NovenaCompline) and Node. cls = prayer box class. */
(function(root){
  function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
  function html(D,cls){
    return '<p class="cmp-note">'+esc(D.note)+'</p>'+D.sections.map(function(s){
      return '<div class="'+cls+' cmp-sec"><h4>'+esc(s.h)+'</h4><p>'+esc(s.t)+'</p>'+(s.src?'<p class="cmp-src">'+esc(s.src)+'</p>':'')+'</div>'}).join("");
  }
  var api={html:html};
  if(typeof module!=="undefined")module.exports=api;else root.NovenaCompline=api;
})(this);
