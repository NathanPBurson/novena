/* /rewind/ playlist player for OBS Browser Source (Chromium/CEF) and normal browsers.
   Manifest (runtime): ../data/rewind_playlist.json {"blocks":[ {"youtubeId":"..."} | {"url":"direct.mp4"} | "DRIVE_ID" ...]}
   Modes: OBS (?obs=1, or OBS user agent / window.obsstudio): no controls, no overlays, YouTube chrome cropped off.
          Normal: our own progress bar + fullscreen button appear on mouse move, hide after 2s idle.
   Every block is muted, advances on end, loops after the last; broken blocks are skipped.
   Empty/missing manifest -> loops the fallback YouTube ID (data/rewind.json). Picture always COVERS the window (no bars). */
(function(){
var qs=new URLSearchParams(location.search),FALLBACK_YT=window.REWIND_YT_ID;
var OBS=qs.get("obs")==="1"||/\bOBS\//.test(navigator.userAgent)||!!window.obsstudio;
document.documentElement.classList.add(OBS?"rw-obs":"rw-normal");window.REWIND_MODE=OBS?"obs":"normal";
var STALL_MS=+(qs.get("stall")||25000),manifestUrl=qs.get("manifest")||"../data/rewind_playlist.json";
var stage=document.getElementById("rw-stage"),blocks=[],i=0,fails=0,timer=null,gen=0,ytReady=null,cur=null;
function log(m){(window.REWIND_LOG=window.REWIND_LOG||[]).push(m);document.body.setAttribute("data-rw",m)}
function norm(x){if(typeof x==="string")x=/^[A-Za-z0-9_-]{11}$/.test(x)?{youtubeId:x}:{driveId:x};if(!x||typeof x!=="object")return null;
  if(x.youtubeId&&/^[A-Za-z0-9_-]{11}$/.test(x.youtubeId))return{yt:x.youtubeId};
  if(x.url)return{url:x.url};var id=x.driveId||x.id||x.fileId;
  return id&&/^[A-Za-z0-9_-]{10,}$/.test(id)?{url:"https://drive.usercontent.google.com/download?id="+encodeURIComponent(id)+"&export=download&confirm=t"}:null}
/* cover-fit a 16:9 box over the viewport; OBS mode oversizes further so YouTube's title bar / logo fall off-screen */
function fit(){var W=innerWidth,H=innerHeight,w=Math.max(W,H*16/9),h=w*9/16;if(h<H){h=H;w=h*16/9}
  if(OBS){var k=1.18;w*=k;h*=k}document.documentElement.style.setProperty("--rw-w",Math.ceil(w)+"px");document.documentElement.style.setProperty("--rw-h",Math.ceil(h)+"px")}
addEventListener("resize",fit);fit();
function clear(){gen++;clearTimeout(timer);timer=null;cur=null;stage.innerHTML=""}
function legacyIframe(){clear();log("youtube-legacy");var f=document.createElement("iframe");f.className="rw-media";
  f.src="https://www.youtube.com/embed/"+FALLBACK_YT+"?autoplay=1&mute=1&loop=1&playlist="+FALLBACK_YT+"&controls=0&rel=0&modestbranding=1&iv_load_policy=3&playsinline=1&disablekb=1&fs=0";
  f.allow="autoplay; encrypted-media";f.id="rw-video";stage.appendChild(f)}
function next(){if(!blocks.length)return;i=(i+1)%blocks.length;if(i===0)log("loop");play()}
function failed(why){log("fail:"+i+":"+why);if(++fails>=blocks.length){blocks=[{yt:FALLBACK_YT}];i=0;fails=0;log("fallback");play();return}next()}
function started(g){if(g!==gen||started.g===g)return;started.g=g;fails=0;clearTimeout(timer);log("playing:"+i)}
function loadYT(){return ytReady||(ytReady=new Promise(function(res,rej){if(window.YT&&YT.Player)return res(YT);window.onYouTubeIframeAPIReady=function(){res(window.YT)};
  var s=document.createElement("script");s.src="https://www.youtube.com/iframe_api";s.onerror=rej;document.head.appendChild(s);setTimeout(rej,15000)}))}
function play(){clear();var b=blocks[i],g=gen;log("play:"+i);timer=setTimeout(function(){if(g===gen)failed("stall")},STALL_MS);
  if(b.yt){var d=document.createElement("div");d.id="rw-yt";stage.appendChild(d);
    loadYT().then(function(YT){if(g!==gen)return;var p=new YT.Player("rw-yt",{width:"100%",height:"100%",videoId:b.yt,
      playerVars:{autoplay:1,mute:1,controls:0,rel:0,modestbranding:1,iv_load_policy:3,playsinline:1,disablekb:1,fs:0,cc_load_policy:0,origin:location.origin},
      events:{onReady:function(e){if(g!==gen)return;e.target.mute();e.target.playVideo();var f=e.target.getIframe();f.className="rw-media";f.id="rw-video";
          cur={t:function(){return e.target.getCurrentTime()},d:function(){return e.target.getDuration()},seek:function(s){e.target.seekTo(s,true)}}},
        onStateChange:function(e){if(g!==gen)return;log("st:"+i+":"+e.data);if(e.data===1)started(g);if(e.data===2)e.target.playVideo();/* never sit on the pause overlay */
          if(e.data===0){log("ended:"+i);next()}},
        onError:function(e){if(g===gen)failed("yt-error-"+e.data)}}});window.REWIND_PLAYER=p})["catch"](function(){if(g===gen)legacyIframe()});return}
  var v=document.createElement("video");v.id="rw-player";v.className="rw-media";v.muted=true;v.defaultMuted=true;v.autoplay=true;v.playsInline=true;v.preload="auto";v.setAttribute("muted","");
  v.src=b.url;stage.appendChild(v);var s=false;cur={t:function(){return v.currentTime},d:function(){return v.duration},seek:function(x){v.currentTime=x}};
  v.addEventListener("playing",function(){if(!s){s=true;started(g)}});
  v.addEventListener("ended",function(){if(g===gen){log("ended:"+i);next()}});
  v.addEventListener("error",function(){if(g===gen)failed("error")});
  var pr=v.play();if(pr&&pr.catch)pr.catch(function(){})}
/* normal-mode controls: progress bar (click to seek) + fullscreen; show on mouse move, hide after 2s idle */
var ui=document.getElementById("rw-ui"),bar=document.getElementById("rw-bar"),fill=document.getElementById("rw-fill"),hideT=null;
function show(){if(OBS)return;ui.classList.add("show");clearTimeout(hideT);hideT=setTimeout(function(){ui.classList.remove("show")},2000)}
function fsToggle(){var d=document.documentElement;if(document.fullscreenElement){document.exitFullscreen();return}var r=d.requestFullscreen||d.webkitRequestFullscreen;if(r)try{var p=r.call(d);if(p&&p.catch)p.catch(function(){})}catch(e){}}
if(!OBS){document.addEventListener("mousemove",show);document.getElementById("rw-fs").addEventListener("click",function(e){e.stopPropagation();fsToggle()});
  var sh=document.getElementById("rw-shield");sh.addEventListener("click",function(){fsToggle()});sh.addEventListener("dblclick",function(){if(!document.fullscreenElement)fsToggle()});
  bar.addEventListener("click",function(e){e.stopPropagation();if(cur&&cur.d()>0){var r=bar.getBoundingClientRect();cur.seek((e.clientX-r.left)/r.width*cur.d())}});
  setInterval(function(){if(cur){var d=cur.d(),t=cur.t();fill.style.width=(d>0?Math.min(100,t/d*100):0)+"%"}},250)}
else ui.remove();
fetch(manifestUrl,{cache:"no-store"}).then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(j){
  blocks=(Array.isArray(j)?j:(j.blocks||j.items||[])).map(norm).filter(Boolean);if(!blocks.length)throw 0;log("blocks:"+blocks.length);play()})
 ["catch"](function(){blocks=[{yt:FALLBACK_YT}];log("fallback");play()});
})();
