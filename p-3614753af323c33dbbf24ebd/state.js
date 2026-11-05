/* Private area data model + merge. The whole state is ONE JSON document that is encrypted as a unit (see crypto.js). Every doc and item has an id and an
   update time u (ms); deletions are tombstones (del:true) so two devices can merge edits made offline. */
(function(root,factory){if(typeof module==="object"&&module.exports)module.exports=factory();else root.PVState=factory()})(typeof self!=="undefined"?self:this,function(){
function id(){var a=new Uint8Array(6);(globalThis.crypto).getRandomValues(a);return Array.prototype.map.call(a,function(x){return("0"+x.toString(16)).slice(-2)}).join("")}
// Empty template: placeholder sections only. No personal, faith or relationship content; the owner fills it in.
function defaults(){return{v:1,sections:[
 {id:"checklists",title:"Checklists",kind:"check",u:0,docs:[{id:"eleni-paperwork",title:"Eleni paperwork",u:0,items:[]},{id:"checklist-1",title:"Checklist (placeholder)",u:0,items:[]}]},
 {id:"todo-nathan",title:"Nathan's to-dos",kind:"check",u:0,docs:[{id:"todo-nathan-1",title:"To-do (placeholder)",u:0,items:[]}]},
 {id:"todo-joan",title:"Joan's to-dos",kind:"check",u:0,docs:[{id:"todo-joan-1",title:"To-do (placeholder)",u:0,items:[]}]},
 {id:"forms",title:"Forms",kind:"check",u:0,docs:[{id:"forms-todo",title:"Forms to fill out (placeholder)",u:0,items:[]}]},
 {id:"portfolio",title:"Portfolio drafts",kind:"draft",u:0,docs:[{id:"draft-1",title:"Draft 1 (placeholder)",body:"",u:0,bu:0}]},
 {id:"links",title:"Quick links",kind:"links",u:0,docs:[{id:"links-main",title:"My links",u:0,items:[]}]}]}}
function safeUrl(s){s=String(s||"").trim();if(/^[a-z][a-z0-9+.-]*:/i.test(s)){return/^https?:\/\//i.test(s)?s:""}return s?"https://"+s:""}
function pick(a,b){return(b.u||0)>(a.u||0)?b:a}
function mergeList(A,B,fn){var by={},order=[];(B||[]).concat(A||[]).forEach(function(x){if(!by[x.id]){by[x.id]=x;order.push(x.id)}else by[x.id]=fn(by[x.id],x)});return order.map(function(i){return by[i]})}
function mergeItem(a,b){return pick(a,b)}
function mergeDoc(a,b){var w=pick(a,b),o=w===a?b:a,r=Object.assign({},w);
 if("body" in a||"body" in b){var bw=(b.bu||0)>(a.bu||0)?b:a;r.body=bw.body;r.bu=bw.bu||0}
 if(a.items||b.items)r.items=mergeList(a.items,b.items,mergeItem);
 if(o.del&&!w.del&&(o.u||0)>(w.u||0))r.del=true;return r}
function merge(local,remote){if(!remote)return local;if(!local)return remote;
 var secs=mergeList(local.sections,remote.sections,function(a,b){var w=pick(a,b);return Object.assign({},w,{docs:mergeList(a.docs,b.docs,mergeDoc)})});
 return{v:1,sections:secs}}
function prune(s,now,ttl){ttl=ttl||30*864e5;var keep=function(x){return!(x.del&&now-(x.u||0)>ttl)};
 s.sections.forEach(function(sec){sec.docs=sec.docs.filter(keep);sec.docs.forEach(function(d){if(d.items)d.items=d.items.filter(keep)})});return s}
function valid(s){return!!s&&s.v===1&&Array.isArray(s.sections)&&s.sections.every(function(x){return x.id&&Array.isArray(x.docs)})}
return{id:id,defaults:defaults,merge:merge,prune:prune,valid:valid,safeUrl:safeUrl}});
