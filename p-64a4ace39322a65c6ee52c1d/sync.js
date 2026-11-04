/* Sync engine: one encrypted blob in the GitHub repo, read/written through the Contents API with a fine-grained token (contents read+write, this repo only).
   fetch is injected so Node tests can simulate the API, including 409 sha conflicts. Only ciphertext is ever sent. */
(function(root,factory){if(typeof module==="object"&&module.exports)module.exports=factory(require("./crypto.js"),require("./state.js"));else root.PVSync=factory(root.PVCrypto,root.PVState)})(typeof self!=="undefined"?self:this,function(C,S){
function api(cfg,suffix){return"https://api.github.com/repos/"+cfg.owner+"/"+cfg.repo+"/contents/"+cfg.path+(suffix||"")}
function Sync(o){this.f=o.fetch;this.cfg=o.cfg;this.token=o.token;this.key=o.key;this.meta=o.meta;this.sha=null}
Sync.prototype.h=function(){return{Authorization:"Bearer "+this.token,Accept:"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28"}};
// Returns {state|null, sha|null}. 404 = no file yet.
Sync.prototype.pull=function(){var me=this;return me.f(api(me.cfg,"?ref="+encodeURIComponent(me.cfg.branch)+"&_="+Date.now()),{headers:me.h(),cache:"no-store"}).then(function(r){
 if(r.status===404){me.sha=null;return{state:null,sha:null}}
 if(r.status===401||r.status===403){var e=new Error("token");e.code="auth";throw e}
 if(!r.ok)throw new Error("pull "+r.status);
 return r.json().then(function(j){var blob=JSON.parse(new TextDecoder().decode(C.b64d(j.content)));me.sha=j.sha;
  if(blob.salt!==me.meta.salt){var e=new Error("salt");e.code="salt";throw e}
  return C.decryptState(me.key,blob).then(function(st){if(!S.valid(st))throw new Error("bad state");return{state:st,sha:j.sha,blob:blob}})})})};
// Save state; on 409/422 (stale sha) refetch, merge, retry. Resolves {state (merged), blob}.
Sync.prototype.push=function(state,tries){var me=this;tries=tries==null?4:tries;
 return C.encryptState(me.key,me.meta,state).then(function(blob){
  var body={message:"data: update (encrypted)",content:C.b64e(new TextEncoder().encode(JSON.stringify(blob)+"\n")),branch:me.cfg.branch};if(me.sha)body.sha=me.sha;
  return me.f(api(me.cfg),{method:"PUT",headers:Object.assign({"Content-Type":"application/json"},me.h()),body:JSON.stringify(body)}).then(function(r){
   if(r.ok)return r.json().then(function(j){me.sha=j.content.sha;return{state:state,blob:blob}});
   if((r.status===409||r.status===422)&&tries>0)return me.pull().then(function(p){return me.push(S.merge(state,p.state),tries-1)});
   if(r.status===401||r.status===403){var e=new Error("token");e.code="auth";throw e}
   throw new Error("push "+r.status)})})};
return{Sync:Sync}});
