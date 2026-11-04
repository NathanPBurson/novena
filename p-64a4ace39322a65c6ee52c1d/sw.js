/* App-shell cache only. It never sees or stores decrypted data (decryption happens in the page), and it never touches data.enc.json or any cross-origin (sync API) request. Network first, so updates arrive immediately. */
var V="pv-shell-v3",FILES=["./","index.html","app.js","crypto.js","state.js","sync.js","app.css","manifest.json","config.json","icon-192.png","icon-512.png","icon-180.png","../css/lu.css","../css/private.css"].map(function(f){return new URL(f,self.location).href});
self.addEventListener("install",function(e){e.waitUntil(caches.open(V).then(function(c){return Promise.all(FILES.map(function(u){return c.add(u).catch(function(){})}))}).then(function(){return self.skipWaiting()}))});
self.addEventListener("activate",function(e){e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k!==V}).map(function(k){return caches.delete(k)}))}).then(function(){return self.clients.claim()}))});
self.addEventListener("fetch",function(e){var r=e.request,u=new URL(r.url);
 if(r.method!=="GET"||u.origin!==self.location.origin||/data\.enc\.json$/.test(u.pathname))return;
 var key=u.origin+u.pathname;if(FILES.indexOf(key)<0&&FILES.indexOf(key+"index.html")<0&&!(key===new URL("./",self.location).href))return;
 e.respondWith(fetch(r).then(function(res){if(res.ok){var cp=res.clone();caches.open(V).then(function(c){c.put(r,cp)})}return res}).catch(function(){return caches.match(r,{ignoreSearch:true})}))});
