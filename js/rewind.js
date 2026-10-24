/* /rewind/ playlist player for OBS Browser Source (Chromium/CEF) and normal browsers.
   Manifest (runtime): ../data/rewind_playlist.json {"blocks":[ {"youtubeId":"..."} | {"url":"direct.mp4"} | "DRIVE_ID" ...]}
   Modes: OBS (?obs=1, or OBS user agent / window.obsstudio): no controls, no overlays, YouTube chrome cropped off.
          Normal: YouTube's native controls (controls=1: progress bar + fullscreen), window-sized (no crop).
   Every block is muted, advances on end, loops after the last; broken blocks are skipped.
   Empty/missing manifest -> loops the fallback YouTube ID (data/rewind.json). Picture always COVERS the window (no bars). */
(function(){
var qs=new URLSearchParams(location.search),FALLBACK_YT=window.REWIND_YT_ID;
var OBS=qs.get("obs")==="1"||/\bOBS\//.test(navigator.userAgent)||!!window.obsstudio;
document.documentElement.classList.add(OBS?"rw-obs":"rw-normal");window.REWIND_MODE=OBS?"obs":"normal";
var ROT=+(qs.get("rotate")||window.REWIND_ROTATE||600),KEY="rewind.state.v1",ST={i:0,t:0,off:{}};
try{if(qs.get("reset")==="1")localStorage.removeItem(KEY);ST=JSON.parse(localStorage.getItem(KEY))||ST;ST.off=ST.off||{}}catch(e){}
var STALL_MS=+(qs.get("stall")||25000),manifestUrl=qs.get("manifest")||"../data/rewind_playlist.json";
var stage=document.getElementById("rw-stage"),blocks=[],i=0,fails=0,timer=null,gen=0,ytReady=null,cur=null;
function log(m){(window.REWIND_LOG=window.REWIND_LOG||[]).push(m);document.body.setAttribute("data-rw",m)}
function norm(x){if(typeof x==="string")x=/^[A-Za-z0-9_-]{11}$/.test(x)?{youtubeId:x}:{driveId:x};if(!x||typeof x!=="object")return null;
  var S=Math.max(0,+x.start||0),E=+x.end||0;
  if(x.youtubeId&&/^[A-Za-z0-9_-]{11}$/.test(x.youtubeId))return{yt:x.youtubeId,s:S,e:E,k:x.youtubeId+"@"+S};
  if(x.url)return{url:x.url,s:S,e:E,k:x.url+"@"+S};var id=x.driveId||x.id||x.fileId;
  return id&&/^[A-Za-z0-9_-]{10,}$/.test(id)?{s:S,e:E,k:id+"@"+S,url:"https://drive.usercontent.google.com/download?id="+encodeURIComponent(id)+"&export=download&confirm=t"}:null}
/* cover-fit a 16:9 box over the viewport; OBS mode oversizes further so YouTube's title bar / logo fall off-screen */
function fit(){var W=innerWidth,H=innerHeight,w=Math.max(W,H*16/9),h=w*9/16;if(h<H){h=H;w=h*16/9}
  if(OBS){var k=1.18;w*=k;h*=k}else{w=W;h=H}/* normal: exact window so YouTube's own controls stay on-screen */document.documentElement.style.setProperty("--rw-w",Math.ceil(w)+"px");document.documentElement.style.setProperty("--rw-h",Math.ceil(h)+"px")}
addEventListener("resize",fit);fit();
function clear(){gen++;clearTimeout(timer);timer=null;cur=null;stage.innerHTML=""}
function legacyIframe(){clear();log("youtube-legacy");var f=document.createElement("iframe");f.className="rw-media";
  f.src="https://www.youtube.com/embed/"+FALLBACK_YT+"?autoplay=1&mute=1&loop=1&playlist="+FALLBACK_YT+"&controls=0&rel=0&modestbranding=1&iv_load_policy=3&playsinline=1&disablekb=1&fs=0";
  f.allow="autoplay; encrypted-media";f.id="rw-video";stage.appendChild(f)}
function leave(ended){var b=blocks[i];if(!b||!b.k)return;var t=cur?cur.t():0,d=cur?cur.d():0,E=b.e||d||0;
  ST.off[b.k]=(ended||(E&&t>=E-30))?b.s:Math.max(b.s,t);/* next pass starts where this one stopped; wrap to start near the end */save()}
function save(){try{var b=blocks[i];if(cur&&b&&!b.fb){ST.i=i;ST.t=cur.t();ST.k=b.k}ST.ts=Date.now();localStorage.setItem(KEY,JSON.stringify(ST))}catch(e){}}
setInterval(save,5000);
function next(ended){if(!blocks.length)return;leave(ended);i=(i+1)%blocks.length;if(i===0)log("loop");play()}
function failed(why){log("fail:"+i+":"+why);if(blocks[i]&&blocks[i].fb){legacyIframe();return}if(++fails>=blocks.length){blocks=[{yt:FALLBACK_YT,s:0,e:0,k:FALLBACK_YT+"@0",fb:1}];i=0;fails=0;log("fallback");play();return}next()}
function nocc(p){if(!OBS||!p)return;try{p.unloadModule('captions')}catch(_){}try{p.unloadModule('cc')}catch(_){}try{p.setOption('captions','track',{})}catch(_){}try{p.setOption('cc','track',{})}catch(_){}}
function started(g){if(g!==gen||started.g===g)return;started.g=g;fails=0;clearTimeout(timer);log("playing:"+i)}
function loadYT(){return ytReady||(ytReady=new Promise(function(res,rej){if(window.YT&&YT.Player)return res(YT);window.onYouTubeIframeAPIReady=function(){res(window.YT)};
  var s=document.createElement("script");s.src="https://www.youtube.com/iframe_api";s.onerror=rej;document.head.appendChild(s);setTimeout(rej,15000)}))}
function startAt(b){var t=(ST.resume&&ST.k===b.k)?ST.t:(ST.off[b.k]!=null?ST.off[b.k]:b.s);ST.resume=false;if(b.e&&t>=b.e-30)t=b.s;return Math.max(0,Math.floor(t))}
function rotate(g,b,t0){var w=setInterval(function(){if(g!==gen){clearInterval(w);return}if(cur&&cur.t()-t0>=ROT){clearInterval(w);log("rotate:"+i);next(false)}else if(cur&&b.e&&cur.t()>=b.e){clearInterval(w);log("end-bound:"+i);next(true)}},1000)}
function play(){clear();var b=blocks[i],g=gen,t0=startAt(b);log("play:"+i+"@"+t0);rotate(g,b,t0);timer=setTimeout(function(){if(g===gen)failed("stall")},STALL_MS);
  if(b.yt){var d=document.createElement("div");d.id="rw-yt";stage.appendChild(d);
    loadYT().then(function(YT){if(g!==gen)return;var p=new YT.Player("rw-yt",{width:"100%",height:"100%",videoId:b.yt,
      playerVars:OBS?{start:t0,autoplay:1,mute:1,controls:0,rel:0,modestbranding:1,iv_load_policy:3,playsinline:1,disablekb:1,fs:0,cc_load_policy:0,cc_lang_pref:'zz',hl:'en',origin:location.origin}
        :{start:t0,autoplay:1,mute:1,controls:1,rel:0,modestbranding:1,iv_load_policy:3,playsinline:1,fs:1,origin:location.origin},
      events:{onReady:function(e){if(g!==gen)return;e.target.mute();nocc(e.target);e.target.playVideo();var f=e.target.getIframe();f.className="rw-media";f.id="rw-video";
          cur={t:function(){return e.target.getCurrentTime()},d:function(){return e.target.getDuration()},seek:function(s){e.target.seekTo(s,true)}}},
        onStateChange:function(e){if(g!==gen)return;log("st:"+i+":"+e.data);if(e.data===1){nocc(e.target);setTimeout(function(){nocc(e.target)},1500);started(g)}if(e.data===2&&OBS)e.target.playVideo();/* never sit on the pause overlay */
          if(e.data===0){log("ended:"+i);next(true)}},
        onError:function(e){if(g===gen)failed("yt-error-"+e.data)}}});window.REWIND_PLAYER=p})["catch"](function(){if(g===gen)legacyIframe()});return}
  var v=document.createElement("video");v.id="rw-player";v.controls=!OBS;v.className="rw-media";v.muted=true;v.defaultMuted=true;v.autoplay=true;v.playsInline=true;v.preload="auto";v.setAttribute("muted","");
  v.src=b.url+(t0?"#t="+t0:"");stage.appendChild(v);var s=false;cur={t:function(){return v.currentTime},d:function(){return v.duration},seek:function(x){v.currentTime=x}};
  v.addEventListener("playing",function(){if(!s){s=true;started(g)}});
  v.addEventListener("ended",function(){if(g===gen){log("ended:"+i);next(true)}});
  v.addEventListener("error",function(){if(g===gen)failed("error")});
  var pr=v.play();if(pr&&pr.catch)pr.catch(function(){})}
/* normal mode: YouTube's own controls (progress bar, fullscreen) handle everything; OBS mode: shield blocks hover overlays */
if(!OBS){var sh=document.getElementById("rw-shield");if(sh)sh.remove();document.documentElement.classList.add("rw-native")}
fetch(manifestUrl,{cache:"no-store"}).then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(j){
  blocks=(Array.isArray(j)?j:(j.blocks||j.items||[])).map(norm).filter(Boolean);if(!blocks.length)throw 0;log("blocks:"+blocks.length);
  var r=blocks.findIndex(function(b){return b.k===ST.k});if(r>=0&&ST.k){i=r;ST.resume=true;log("resume:"+i+"@"+Math.floor(ST.t))}play()})
 ["catch"](function(){blocks=[{yt:FALLBACK_YT,s:0,e:0,k:FALLBACK_YT+"@0",fb:1}];log("fallback");play()});
})();
