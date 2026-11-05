/* Private area crypto: AES-256-GCM with a key derived from the password by PBKDF2-SHA-256 (WebCrypto; browser and Node). Only ciphertext is ever stored or committed. */
(function(root,factory){if(typeof module==="object"&&module.exports)module.exports=factory(globalThis.crypto);else root.PVCrypto=factory(root.crypto)})(typeof self!=="undefined"?self:this,function(webcrypto){
var S=webcrypto.subtle,ITER=600000,AAD_STATE="novena-private-v1",AAD_TOKEN="novena-token-v1",enc=new TextEncoder(),dec=new TextDecoder();
function b64e(u){var s="";for(var i=0;i<u.length;i+=8192)s+=String.fromCharCode.apply(null,u.subarray(i,i+8192));return btoa(s)}
function b64d(s){var b=atob(String(s).replace(/\s/g,"")),u=new Uint8Array(b.length);for(var i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u}
function rnd(n){return webcrypto.getRandomValues(new Uint8Array(n))}
function deriveKey(pw,saltB64,iter){return S.importKey("raw",enc.encode(pw),"PBKDF2",false,["deriveKey"]).then(function(k){
  return S.deriveKey({name:"PBKDF2",salt:b64d(saltB64),iterations:iter,hash:"SHA-256"},k,{name:"AES-GCM",length:256},false,["encrypt","decrypt"])})}
function encryptWith(key,obj,aad){var iv=rnd(12);return S.encrypt({name:"AES-GCM",iv:iv,additionalData:enc.encode(aad)},key,enc.encode(JSON.stringify(obj))).then(function(ct){return{iv:b64e(iv),ct:b64e(new Uint8Array(ct))}})}
function decryptWith(key,p,aad){return S.decrypt({name:"AES-GCM",iv:b64d(p.iv),additionalData:enc.encode(aad)},key,b64d(p.ct)).then(function(pt){return JSON.parse(dec.decode(pt))})}
// state blob: {v,kdf,iter,salt,iv,ct}. A new blob uses a fresh random salt; later saves keep the salt (key stays valid) and use a fresh IV every time.
function newMeta(iter){return{iter:iter||ITER,salt:b64e(rnd(16))}}
function sealState(pw,state,meta){meta=meta||newMeta();return deriveKey(pw,meta.salt,meta.iter).then(function(key){return encryptState(key,meta,state).then(function(blob){return{blob:blob,key:key}})})}
function encryptState(key,meta,state){return encryptWith(key,state,AAD_STATE).then(function(p){return{v:1,kdf:"PBKDF2-SHA256",iter:meta.iter,salt:meta.salt,iv:p.iv,ct:p.ct}})}
function openState(pw,blob){return deriveKey(pw,blob.salt,blob.iter).then(function(key){return decryptWith(key,blob,AAD_STATE).then(function(state){return{state:state,key:key,meta:{iter:blob.iter,salt:blob.salt}}})})}
function decryptState(key,blob){return decryptWith(key,blob,AAD_STATE)}
function encryptToken(key,token){return encryptWith(key,{t:token},AAD_TOKEN)}
function decryptToken(key,p){return decryptWith(key,p,AAD_TOKEN).then(function(o){return o.t})}
return{ITER:ITER,b64e:b64e,b64d:b64d,deriveKey:deriveKey,newMeta:newMeta,sealState:sealState,openState:openState,encryptState:encryptState,decryptState:decryptState,encryptToken:encryptToken,decryptToken:decryptToken}});
