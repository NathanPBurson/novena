/* Remember-this-device: stores the password-derived AES-GCM CryptoKey (non-extractable) in IndexedDB. The raw key bytes can never be read back out. */
(function(root){var DB="pv-device",ST="k",ID="main";
function db(){return new Promise(function(ok,no){var r=indexedDB.open(DB,1);r.onupgradeneeded=function(){r.result.createObjectStore(ST)};r.onsuccess=function(){ok(r.result)};r.onerror=function(){no(r.error)}})}
function tx(mode,fn){return db().then(function(d){return new Promise(function(ok,no){var t=d.transaction(ST,mode),s=t.objectStore(ST),q=fn(s);t.oncomplete=function(){d.close();ok(q&&q.result)};t.onerror=t.onabort=function(){d.close();no(t.error)}})})}
function put(key,meta){if(!key||key.extractable)return Promise.reject(new Error("refusing to store an extractable key"));return tx("readwrite",function(s){return s.put({key:key,meta:{iter:meta.iter,salt:meta.salt}},ID)})}
function get(){return tx("readonly",function(s){return s.get(ID)}).catch(function(){return null})}
function forget(){return tx("readwrite",function(s){return s.delete(ID)}).catch(function(){})}
root.PVDevKey={put:put,get:get,forget:forget}})(self);
