// Tests for the private area (encrypted, synced, installable). Run by test.js.
const fs=require("fs"),path=require("path"),R=__dirname,dirs=fs.readdirSync(R).filter(d=>/^p-[0-9a-f]{24}$/.test(d));
let ok=true;const t=(c,m)=>{ok=ok&&!!c;console.log(c?"PASS":"FAIL",m)};
t(dirs.length===1,"exactly one private directory with an unguessable name (p-<96-bit hex>)");
const D=dirs[0],P=f=>path.join(R,D,f),rd=f=>fs.readFileSync(P(f),"utf8"),C=require(P("crypto.js")),S=require(P("state.js")),{Sync}=require(P("sync.js"));
const html=rd("index.html"),cfg=JSON.parse(rd("config.json")),man=JSON.parse(rd("manifest.json")),sw=rd("sw.js");
t(/<meta name="robots" content="noindex,nofollow,noarchive/.test(html)&&/Content-Security-Policy[^>]*script-src 'self'[^>]*connect-src 'self' https:\/\/api\.github\.com/.test(html)&&!/<script(?![^>]*\ssrc=)[^>]*>/.test(html),"private page: noindex meta, strict CSP (no inline script, connect only to self + api.github.com)");
{const walk=(d,o=[])=>{for(const x of fs.readdirSync(d,{withFileTypes:true})){const f=path.join(d,x.name);if(x.isDirectory()){if(!/^(\.git|node_modules|_source_snapshot|bible|fonts|images)$/.test(x.name)&&x.name!==D)walk(f,o)}else if(/\.(html|js|css|json|txt|xml)$/.test(x.name))o.push(f)}return o};
 const ok1=s=>{const all=s.split(D).length-1,tile=s.split('<a class="lu-tile c-teal" href="'+D+'/" rel="nofollow" id="tile-myspace">').length-1,nav=(s.match(new RegExp('<a class="nav-myspace" href="[^"]*'+D+'/" rel="nofollow">','g'))||[]).length;return all===tile+nav&&tile<=1&&nav<=1};const hit=walk(R).filter(f=>{const s=fs.readFileSync(f,"utf8");if(!s.includes(D))return false;return !ok1(s)});t(hit.length===0,"only the nofollow Account tile and nav button link to the private path"+(hit.length?" ("+hit.map(f=>path.relative(R,f)).join(", ")+")":""));
 const rb=fs.readFileSync(path.join(R,"robots.txt"),"utf8");t(/Disallow: \/novena\/p-\s/.test(rb+"\n")&&!rb.includes(D),"robots.txt excludes the p- prefix without revealing the full path");}
const blob=JSON.parse(rd("data.enc.json")),raw=rd("data.enc.json");
t(blob.v===1&&blob.kdf==="PBKDF2-SHA256"&&blob.iter>=600000&&blob.salt&&blob.iv&&blob.ct&&!/Eleni|Checklists|Portfolio|Quick links|items/.test(raw),"data.enc.json is only ciphertext (AES-GCM, PBKDF2-SHA256 >= 600000 iterations), no readable template text");
const pwf="/workspace/novena_private_pw.txt";
(async()=>{
 if(fs.existsSync(pwf)){const pw=fs.readFileSync(pwf,"utf8").trim();t((fs.statSync(pwf).mode&0o777)===0o600&&pw.length>=24,"password file exists, mode 600, 24+ chars");
  const o=await C.openState(pw,blob);t(S.valid(o.state)&&JSON.stringify(o.state.sections.filter(s=>s.id!=="gdocs"))===JSON.stringify(S.defaults().sections)&&(o.state.sections.find(s=>s.id==="gdocs")||{docs:[]}).docs.length===3,"real password decrypts the sealed file to the empty template plus the 3 Docs links");
  t(await C.openState(pw+"x",blob).then(()=>false,()=>true),"a wrong password is rejected")}
 const TP="test-passphrase-1234567890",s0=S.defaults(),r=await C.sealState(TP,s0,{iter:1000,salt:C.b64e(new Uint8Array(16))});
 const o=await C.openState(TP,r.blob);t(JSON.stringify(o.state)===JSON.stringify(s0),"seal/open round trip");
 const b2=await C.encryptState(r.key,{iter:1000,salt:r.blob.salt},s0);t(b2.iv!==r.blob.iv&&b2.ct!==r.blob.ct,"fresh IV on every save");
 const bad=Object.assign({},r.blob,{ct:r.blob.ct.slice(0,-6)+(r.blob.ct.slice(-6)==="AAAAAA"?"BBBBBB":"AAAAAA")});t(await C.openState(TP,bad).then(()=>false,()=>true),"tampered ciphertext is rejected (GCM tag)");
 const tok=await C.encryptToken(r.key,"github_pat_FAKE");t(!JSON.stringify(tok).includes("FAKE")&&await C.decryptToken(r.key,tok)==="github_pat_FAKE","token is stored encrypted and decrypts back");
 // defaults: placeholders only
 const secs=Object.fromEntries(s0.sections.map(x=>[x.id,x]));
 t(["Checklists","Nathan's to-dos","Joan's to-dos","Forms","Portfolio drafts","Quick links"].every((n,i)=>s0.sections[i].title===n)&&secs.checklists.docs.some(d=>d.title==="Eleni paperwork"&&d.items.length===0)&&s0.sections.every(s=>s.docs.every(d=>(d.items||[]).length===0&&!(d.body))),"template: Checklists (with empty 'Eleni paperwork'), Nathan + Joan to-dos, Forms, Portfolio drafts, Quick links; all empty");
 t(S.safeUrl("javascript:alert(1)")===""&&S.safeUrl("data:text/html,x")===""&&S.safeUrl("example.com/a")==="https://example.com/a"&&S.safeUrl("http://x.org")==="http://x.org","links: only http(s) URLs are accepted");
 // merge
 const A=S.defaults(),B=S.defaults(),dA=A.sections[0].docs[0],dB=B.sections[0].docs[0];
 dA.items.push({id:"a1",t:"from phone",u:10});dB.items.push({id:"b1",t:"from laptop",u:11},{id:"a1",t:"from phone",done:true,u:20});
 const M=S.merge(A,B).sections[0].docs[0].items;t(M.length===2&&M.find(i=>i.id==="a1").done===true&&!!M.find(i=>i.id==="b1"),"merge: items from two devices are kept; newer edit wins");
 const dd=S.defaults();dd.sections[0].docs[0].items.push({id:"a1",t:"x",del:true,u:30});const A2=S.defaults();A2.sections[0].docs[0].items.push({id:"a1",t:"x",u:10});
 t(S.merge(A2,dd).sections[0].docs[0].items[0].del===true&&S.merge(dd,A2).sections[0].docs[0].items[0].del===true,"merge: a delete (tombstone) beats an older edit, in either order");
 // sync against a fake GitHub Contents API (sha, 409, ciphertext only, branch from config)
 const store={sha:null,content:null,puts:[],gets:0,auth:[]};let n=0,conflictOnce=false;
 const fakeFetch=async(url,o={})=>{const u=new URL(url);store.auth.push([u.host,(o.headers||{}).Authorization]);const brOk=(u.searchParams.get("ref")||JSON.parse(o.body||"{}").branch)===cfg.branch;
  if(!brOk)return{ok:false,status:404,json:async()=>({})};
  if(!o.method||o.method==="GET"){store.gets++;if(!store.sha)return{ok:false,status:404,status:404};return{ok:true,status:200,json:async()=>({sha:store.sha,content:store.content})}}
  const b=JSON.parse(o.body);store.puts.push(b);if(conflictOnce){conflictOnce=false;return{ok:false,status:409,json:async()=>({})}}
  if(store.sha&&b.sha!==store.sha)return{ok:false,status:409,json:async()=>({})};if(!store.sha&&b.sha)return{ok:false,status:422,json:async()=>({})};
  store.sha="sha"+(++n);store.content=b.content;return{ok:true,status:200,json:async()=>({content:{sha:store.sha}})}};
 const meta={iter:1000,salt:r.blob.salt},mk=()=>new Sync({fetch:fakeFetch,cfg,token:"github_pat_FAKE",key:r.key,meta});
 const d1=mk(),d2=mk();t(cfg.branch==="main"&&cfg.owner==="NathanPBurson"&&cfg.repo==="novena-data"&&cfg.path==="data.enc.json","sync config: private repo novena-data, main, data.enc.json");
 t((await d1.pull()).state===null,"pull of a missing file is empty, not an error");
 const s1=S.defaults();s1.sections[0].docs[0].items.push({id:"p1",t:"paper one",u:5});await d1.push(s1);t(store.sha==="sha1","first push creates the file");
 await d2.pull();const s2=S.defaults();s2.sections[0].docs[0].items.push({id:"p2",t:"paper two",u:6});await d2.push(S.merge(s2,(await d2.pull()).state));
 const s1b=S.merge(s1,S.defaults());s1b.sections[0].docs[0].items.push({id:"p3",t:"paper three",u:7});const res=await d1.push(s1b);
 const ids=res.state.sections[0].docs[0].items.map(i=>i.id).sort().join();t(ids==="p1,p2,p3","409 stale sha: refetch, merge and retry keeps both devices' edits");
 const fin=(await mk().pull()).state;t(fin.sections[0].docs[0].items.length===3,"final remote state has all three items after the conflict");
 conflictOnce=true;await mk().push(fin);t(true,"a bare 409 with an unchanged remote also resolves");
 t(store.puts.every(p=>{const txt=Buffer.from(p.content,"base64").toString();return!/paper|Eleni|Checklists/.test(txt)&&!p.content.includes("FAKE")&&JSON.parse(txt).ct&&p.branch===cfg.branch}),"every commit body is ciphertext only, on the configured branch, with no token or plaintext");
 t(store.auth.every(a=>a[0]==="api.github.com"&&a[1]==="Bearer github_pat_FAKE"),"token is sent only to api.github.com");
 // PWA
 t(man.display==="standalone"&&man.scope==="./"&&man.start_url==="./"&&man.name&&man.icons.length>=2&&man.icons.every(i=>fs.existsSync(P(i.src)))&&/rel="manifest" href="manifest\.json"/.test(html),"PWA manifest: scoped to the private path, standalone, icons from the channel avatar");
 const sig=(f)=>require("crypto").createHash("sha1").update(fs.readFileSync(f)).digest("hex");
 t(/data\\\.enc\\\.json\$/.test(sw)&&/u\.origin!==self\.location\.origin/.test(sw)&&!/api\.github/.test(sw)&&!/localStorage|PVCrypto|subtle/.test(sw)&&/FILES=\[/.test(sw),"service worker: app shell only; skips data.enc.json and cross-origin (GitHub API); no crypto or storage access");
 t(fs.existsSync(P("sw.js"))&&/serviceWorker/.test(rd("app.js"))&&/sw\.js/.test(rd("app.js")),"app registers its service worker");
 t(/localStorage/.test(rd("app.js"))&&/encryptToken/.test(rd("app.js"))&&!/LS\.setItem\(K_TOK,tok/.test(rd("app.js")),"token goes into localStorage only after encryption under the password-derived key");
 {const H=["b312e3e68f19f726","3474938a7c4a9916","e3a5a4f286b03fb7"],hh=x=>require("crypto").createHash("sha256").update(x).digest("hex").slice(0,16);const walk=(d,o=[])=>{for(const x of fs.readdirSync(d,{withFileTypes:true})){const f=path.join(d,x.name);if(x.isDirectory()){if(!/^(\.git|node_modules|_source_snapshot|bible|fonts|images)$/.test(x.name))walk(f,o)}else if(true)o.push(f)}return o};
 t(!walk(R).some(f=>{const s=fs.readFileSync(f,"latin1");return (s.match(/[A-Za-z0-9_-]{44}/g)||[]).some(i=>H.includes(hh(i)))}),"Google Doc IDs never appear in plaintext in the repo");
 t(/frame-src https:\/\/docs\.google\.com/.test(html)&&/kind==="gdocs"/.test(rd("app.js"))&&/rm=minimal/.test(rd("app.js"))&&/Open in Docs/.test(rd("app.js")),"Docs section: CSP frame-src docs.google.com, iframe + Open in Docs link")}

{const a=rd("app.js"),dk=rd("devkey.js"),h=html;
 t(/id="pv-remember" checked/.test(h)&&/Remember this device/.test(h)&&/<script src="devkey\.js">/.test(h),"Remember this device checkbox, on by default");
 t(/key\.extractable/.test(dk)&&/indexedDB\.open/.test(dk)&&/refusing to store an extractable key/.test(dk),"device key stored in IndexedDB, extractable keys refused");
 t(/if\(\$\("pv-remember"\)\.checked\)PVDevKey\.put\(key,meta\)/.test(a),"key remembered only after a successful unlock with the box ticked");
 t(/function autoUnlock\(\)[\s\S]*C\.decryptState\(rec\.key,blob\)[\s\S]*\.catch\(function\(\)\{key=null;state=null;msg\("Enter your password\."\)/.test(a)&&/autoUnlock\(\);/.test(a),"next visit auto-decrypts with the stored key, falls back to the password screen on failure");
 const fd=(a.match(/function forgetDevice\(\)\{[^\n]*/)||[""])[0];t(/PVDevKey\.forget\(\)/.test(fd)&&/K_TOK/.test(fd)&&/K_BLOB/.test(fd)&&/K_PEND/.test(fd)&&/\$\("pv-lock"\)\.addEventListener\("click",forgetDevice\)/.test(a)&&/Lock \/ forget this device/.test(h),"Lock / forget wipes the IndexedDB key, token and cached data");
 const lk=(a.match(/function lock\(\)\{[^\n]*/)||[""])[0];t(lk&&!/idleT=setTimeout\(lock,/.test(a)&&/no idle auto-lock/.test(a),"no idle auto-lock; stays unlocked until Lock or forget");
 t(/<title>Account<\/title>/.test(h)&&/id="app-back"/.test(h)&&/aria-label="Home"/.test(h)&&/js\/appbar\.js/.test(h)&&/viewport-fit=cover/.test(h),"private screens: Account title + sticky Back/Home bar")}
{const k=await C.deriveKey("x".repeat(20),C.b64e(new Uint8Array(16)),1000);t(k.extractable===false&&k.algorithm.name==="AES-GCM","derived key is a non-extractable AES-GCM CryptoKey")}
process.exit(ok?0:1)})();
