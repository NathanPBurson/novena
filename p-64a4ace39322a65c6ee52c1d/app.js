(function(){
var C=PVCrypto,S=PVState,$=function(i){return document.getElementById(i)},LS=localStorage,K_BLOB="pv.blob",K_TOK="pv.token",K_PEND="pv.pending";
var cfg=null,key=null,meta=null,state=null,sync=null,saveT=null,idleT=null,busy=false,online=!!navigator.onLine,status="";
function el(t,a,kids){var e=document.createElement(t);for(var k in a||{}){if(k==="text")e.textContent=a[k];else if(k==="class")e.className=a[k];else if(k.slice(0,2)==="on")e.addEventListener(k.slice(2),a[k]);else e.setAttribute(k,a[k])}(kids||[]).forEach(function(c){e.appendChild(c)});return e}
function msg(t){$("pv-msg").textContent=t||""}
function setStatus(t){status=t;var s=$("pv-status");if(s)s.textContent=t}
function jget(u){return fetch(u,{cache:"no-store"}).then(function(r){if(!r.ok)throw new Error(u+" "+r.status);return r.json()})}
function lsGet(k){try{return JSON.parse(LS.getItem(k)||"null")}catch(e){return null}}
/* ---------- unlock ---------- */
$("pv-form").addEventListener("submit",function(ev){ev.preventDefault();var pw=$("pv-pw").value;if(!pw||busy)return;busy=true;msg("Deriving key\u2026");
 Promise.all([jget("config.json"),jget("data.enc.json").catch(function(){return null})]).then(function(a){cfg=a[0];var remote=a[1],local=lsGet(K_BLOB),blob=local||remote;if(!blob)throw new Error("no data file");
  return C.openState(pw,blob).then(function(o){key=o.key;meta=o.meta;state=o.state;
   var p=local&&local.salt===blob.salt&&LS.getItem(K_PEND)==="1"&&local!==blob?C.decryptState(key,local).then(function(l){state=S.merge(l,state)}).catch(function(){}):Promise.resolve();
   return p})}).then(function(){$("pv-pw").value="";$("pv-gate").hidden=true;$("pv-app").hidden=false;$("pv-lock").hidden=false;$("pv-sync").hidden=false;render();arm();return loadToken().then(function(){if(!sync)setStatus("Sync not set up on this device \u2014 showing local data. Tap Sync to set up sync.");return pullMerge()})})
 .catch(function(e){key=null;state=null;msg(e&&e.name==="OperationError"?"Wrong password.":"Could not unlock: "+(e&&e.message||e))}).then(function(){busy=false})});
function lock(){state=null;key=null;sync=null;clearTimeout(saveT);clearTimeout(idleT);$("pv-app").hidden=true;$("pv-app").textContent="";$("pv-gate").hidden=false;$("pv-lock").hidden=true;$("pv-sync").hidden=true;msg("Locked.")}
$("pv-lock").addEventListener("click",lock);$("pv-sync").addEventListener("click",function(){if(state)syncPanel()});
function arm(){clearTimeout(idleT);idleT=setTimeout(lock,15*60*1000)}["click","keydown","touchstart"].forEach(function(n){document.addEventListener(n,function(){if(state)arm()},{passive:true})});
/* ---------- token (stored in localStorage only as ciphertext under the password-derived key) ---------- */
function loadToken(){var t=lsGet(K_TOK);sync=null;if(!t)return Promise.resolve();return C.decryptToken(key,t).then(function(tok){mk(tok)}).catch(function(){LS.removeItem(K_TOK);setStatus("Token needs to be pasted again.")})}
function mk(tok){sync=new PVSync.Sync({fetch:function(u,o){return fetch(u,o)},cfg:cfg,token:tok,key:key,meta:meta})}
function setToken(tok){return C.encryptToken(key,tok).then(function(p){LS.setItem(K_TOK,JSON.stringify(p));mk(tok);return pullMerge()})}
function forgetToken(){LS.removeItem(K_TOK);sync=null;setStatus("Sync off on this device.")}
/* ---------- sync ---------- */
function persistLocal(blob,pending){LS.setItem(K_BLOB,JSON.stringify(blob));LS.setItem(K_PEND,pending?"1":"0")}
function pullMerge(){if(!sync||!navigator.onLine)return Promise.resolve();setStatus("Syncing\u2026");
 return sync.pull().then(function(p){if(p.state){var m=S.merge(state,p.state);var changed=JSON.stringify(m)!==JSON.stringify(p.state);state=m;render();if(changed)return flush();persistLocal(p.blob,false)}else return flush()}).then(function(){setStatus("Synced "+new Date().toLocaleTimeString())}).catch(syncErr)}
function syncErr(e){setStatus(e&&e.code==="auth"?"Token rejected or expired \u2014 open Sync to paste a new one.":e&&e.code==="salt"?"Remote data was re-sealed with a different password. Unlock again.":"Offline or sync error \u2014 changes are kept on this device and will retry.")}
function flush(){if(!sync)return C.encryptState(key,meta,state).then(function(b){persistLocal(b,true)});
 return sync.push(S.prune(state,Date.now())).then(function(r){state=r.state;persistLocal(r.blob,false);render()})}
function changed(){clearTimeout(saveT);setStatus("Saving\u2026");saveT=setTimeout(function(){C.encryptState(key,meta,state).then(function(b){persistLocal(b,true)}).then(function(){return sync&&navigator.onLine?flush().then(function(){setStatus("Saved "+new Date().toLocaleTimeString())}):setStatus(sync?"Saved on this device (offline)":"Saved on this device only \u2014 open Sync to enable cross-device sync")}).catch(syncErr)},900)}
window.addEventListener("online",function(){if(state)pullMerge()});document.addEventListener("visibilitychange",function(){if(!document.hidden&&state)pullMerge()});setInterval(function(){if(state&&!document.hidden)pullMerge()},60000);
/* ---------- UI ---------- */
var now=function(){return Date.now()};
function live(a){return(a||[]).filter(function(x){return!x.del})}
function render(){var root=$("pv-app");root.textContent="";root.appendChild(el("p",{class:"lu-muted",id:"pv-status",text:status}));
 state.sections.forEach(function(sec){var p=el("section",{class:"lu-panel","data-section":sec.id},[el("div",{class:"lu-tabhead",text:sec.title})]);
  if(sec.kind==="gdocs"){p.appendChild(el("p",{class:"lu-muted",text:"Sign in to Google as nathanpburson to see these. On iPhone, Safari may block the embed, so use Open in Docs."}));
   live(sec.docs).forEach(function(d){if(!/^[A-Za-z0-9_-]{20,80}$/.test(d.gid||""))return;var u="https://docs.google.com/document/d/"+d.gid+"/edit";
    p.appendChild(el("div",{class:"pv-doc pv-gdoc"},[el("h3",{class:"pv-h",text:d.title}),el("iframe",{class:"pv-frame",src:u+"?rm=minimal",title:d.title,loading:"lazy",referrerpolicy:"no-referrer"}),el("p",{},[el("a",{class:"lu-btn sm",href:u,target:"_blank",rel:"noopener noreferrer",text:"Open in Docs"})])]))});
   root.appendChild(p);return}
  live(sec.docs).forEach(function(d){p.appendChild(doc(sec,d))});
  p.appendChild(el("button",{type:"button",class:"lu-btn sm",text:"+ Add "+(sec.kind==="draft"?"draft":sec.kind==="links"?"link group":"list"),onclick:function(){var t=prompt("Name?");if(!t)return;var n={id:S.id(),title:t,u:now()};if(sec.kind==="draft"){n.body="";n.bu=n.u}else n.items=[];sec.docs.push(n);sec.u=now();changed();render()}}));
  root.appendChild(p)})}
function doc(sec,d){var box=el("div",{class:"pv-doc"},[el("h3",{class:"pv-h",text:d.title}),
  el("button",{type:"button",class:"pv-x",title:"Delete this group","aria-label":"Delete "+d.title,text:"\u00d7",onclick:function(){if(confirm("Delete \u201c"+d.title+"\u201d?")){d.del=true;d.u=now();changed();render()}}})]);
 if(sec.kind==="draft"){var ta=el("textarea",{class:"pv-ta",rows:"8",placeholder:"Draft text\u2026"});ta.value=d.body||"";ta.addEventListener("input",function(){d.body=ta.value;d.bu=d.u=now();changed()});box.appendChild(ta);return box}
 var ul=el("ul",{class:"pv-list"});live(d.items).forEach(function(it){var li=el("li");
  if(sec.kind==="links"){var u=S.safeUrl(it.url);li.appendChild(u?el("a",{href:u,target:"_blank",rel:"noopener noreferrer",text:it.t||u}):el("span",{text:it.t}))}
  else{var cb=el("input",{type:"checkbox","aria-label":it.t});cb.checked=!!it.done;cb.addEventListener("change",function(){it.done=cb.checked;it.u=d.u=now();changed();li.classList.toggle("done",cb.checked)});li.appendChild(cb);li.appendChild(el("span",{text:" "+it.t}));if(cb.checked)li.classList.add("done")}
  li.appendChild(el("button",{type:"button",class:"pv-x",title:"Remove","aria-label":"Remove "+it.t,text:"\u00d7",onclick:function(){it.del=true;it.u=d.u=now();changed();render()}}));ul.appendChild(li)});
 if(!live(d.items).length)ul.appendChild(el("li",{class:"lu-muted",text:"Nothing here yet."}));box.appendChild(ul);
 var f=el("form",{class:"pv-add"}),i1=el("input",{class:"pv-in",placeholder:sec.kind==="links"?"Title":"New item",required:"required"}),i2=sec.kind==="links"?el("input",{class:"pv-in",placeholder:"https://\u2026",required:"required"}):null;
 f.appendChild(i1);if(i2)f.appendChild(i2);f.appendChild(el("button",{class:"lu-btn sm",type:"submit",text:"Add"}));
 f.addEventListener("submit",function(ev){ev.preventDefault();var it={id:S.id(),t:i1.value.trim(),u:now()};if(!it.t)return;if(i2){it.url=S.safeUrl(i2.value);if(!it.url)return}d.items.push(it);d.u=it.u;changed();render()});box.appendChild(f);return box}
function syncPanel(){var root=$("pv-app"),old=root.querySelector("[data-section=sync]");if(old){old.remove();return}
 var p=el("section",{class:"lu-panel","data-section":"sync"},[el("div",{class:"lu-tabhead",text:"Sync across devices"}),
  el("p",{text:"Saves go to "+cfg.owner+"/"+cfg.repo+" (branch "+cfg.branch+") as one encrypted file. "+(sync?"Sync is ON for this device.":"Paste the fine-grained GitHub token once on each device.")}),
  el("p",{class:"lu-muted",text:"Setup: GitHub \u2192 Settings \u2192 Developer settings \u2192 Fine-grained tokens \u2192 Generate. Repository access: Only select repositories \u2192 "+cfg.owner+"/"+cfg.repo+". Permissions: Contents = Read and write (nothing else). Paste it here once per device; it is stored encrypted under your password."})]);
 var f=el("form"),t=el("input",{class:"pv-in",type:"password",placeholder:"github_pat_\u2026",autocomplete:"off",required:"required"});f.appendChild(t);f.appendChild(el("button",{class:"lu-btn gold sm",type:"submit",text:sync?"Replace token":"Save token & sync"}));
 f.addEventListener("submit",function(ev){ev.preventDefault();var v=t.value.trim();t.value="";if(!v)return;setToken(v).then(function(){p.remove()})});p.appendChild(f);
 if(sync)p.appendChild(el("button",{class:"lu-btn sm",type:"button",text:"Turn sync off here",onclick:function(){forgetToken();p.remove()}}));
 p.appendChild(el("button",{class:"lu-btn sm",type:"button",text:"Sync now",onclick:function(){pullMerge()}}));root.insertBefore(p,root.children[1])}
if("serviceWorker"in navigator&&location.protocol==="https:"||location.hostname==="localhost")navigator.serviceWorker.register("sw.js").catch(function(){});
})();
