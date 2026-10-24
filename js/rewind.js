/* /rewind/ playlist player for OBS Browser Source (Chromium/CEF).
   Reads ../data/rewind_playlist.json at runtime: {"apiKey":"<optional Google API key>","blocks":[...]}
   Block forms (in play order): "DRIVE_ID" | {"driveId":"..."} | {"url":"https://direct.mp4"} | {"youtubeId":"11chars"}
     optional per block: "durationSec" (hard cap / watchdog), "title".
   Drive: browsers are refused by drive.usercontent.google.com for cross-site <video> (HTTP 403 -> ORB), so Drive
   blocks only play via the Drive API (needs "apiKey", files shared "Anyone with the link").
   Every block plays MUTED, advances on end, loops after the last. Blocks that fail are skipped; if every block
   fails (or the list is empty) the page falls back to the YouTube ID in data/rewind.json. */
(function(){
var STALL_MS=25000,FALLBACK_YT=window.REWIND_YT_ID,qs=new URLSearchParams(location.search);
var manifestUrl=qs.get("manifest")||"../data/rewind_playlist.json";if(qs.get("stall"))STALL_MS=+qs.get("stall");
var stage=document.getElementById("rw-stage"),blocks=[],i=0,fails=0,timer=null,cap=null,apiKey="",ytReady=null,gen=0;
function log(m){(window.REWIND_LOG=window.REWIND_LOG||[]).push(m);document.body.setAttribute("data-rw",m)}
function norm(x){if(typeof x==="string")x={driveId:x};if(!x||typeof x!=="object")return null;var b={dur:+(x.durationSec||0)||0,title:x.title||""};
  if(x.youtubeId&&/^[A-Za-z0-9_-]{11}$/.test(x.youtubeId)){b.yt=x.youtubeId;return b}
  if(x.url){b.url=x.url;return b}
  var id=x.driveId||x.id||x.fileId;if(!id||!/^[A-Za-z0-9_-]{10,}$/.test(id))return null;
  b.url=apiKey?"https://www.googleapis.com/drive/v3/files/"+encodeURIComponent(id)+"?alt=media&key="+encodeURIComponent(apiKey)
             :"https://drive.usercontent.google.com/download?id="+encodeURIComponent(id)+"&export=download&confirm=t";return b}
function clear(){gen++;clearTimeout(timer);clearTimeout(cap);timer=cap=null;stage.innerHTML=""}
function youtube(){clear();log("youtube");if(!FALLBACK_YT)return;var f=document.createElement("iframe");
  f.src="https://www.youtube.com/embed/"+FALLBACK_YT+"?autoplay=1&mute=1&loop=1&playlist="+FALLBACK_YT+"&controls=0";
  f.allow="autoplay; encrypted-media";f.id="rw-video";stage.appendChild(f)}
function next(){i=(i+1)%blocks.length;if(i===0)log("loop");play()}
function failed(why){log("fail:"+i+":"+why);if(++fails>=blocks.length){youtube();return}next()}
function started(g,b){if(g!==gen)return;fails=0;clearTimeout(timer);log("playing:"+i);if(b.dur>0)cap=setTimeout(function(){if(g===gen){log("cap:"+i);next()}},b.dur*1000+3000)}
function loadYT(){return ytReady||(ytReady=new Promise(function(res){window.onYouTubeIframeAPIReady=function(){res(window.YT)};var s=document.createElement("script");s.src="https://www.youtube.com/iframe_api";document.head.appendChild(s)}))}
function play(){clear();var b=blocks[i],g=gen;log("play:"+i);
  timer=setTimeout(function(){if(g===gen)failed("stall")},STALL_MS);
  if(b.yt){var d=document.createElement("div");d.id="rw-yt";stage.appendChild(d);
    loadYT().then(function(YT){if(g!==gen)return;new YT.Player("rw-yt",{width:"100%",height:"100%",videoId:b.yt,playerVars:{autoplay:1,mute:1,controls:0,playsinline:1},
      events:{onReady:function(e){e.target.mute();e.target.playVideo()},onStateChange:function(e){if(e.data===1)started(g,b);if(e.data===0&&g===gen){log("ended:"+i);next()}},onError:function(){if(g===gen)failed("yt-error")}}})});return}
  var v=document.createElement("video");v.id="rw-player";v.muted=true;v.defaultMuted=true;v.autoplay=true;v.playsInline=true;v.preload="auto";v.setAttribute("muted","");
  v.src=b.url;stage.appendChild(v);var s=false;
  v.addEventListener("playing",function(){if(!s){s=true;started(g,b)}});
  v.addEventListener("ended",function(){if(g===gen){log("ended:"+i);next()}});
  v.addEventListener("error",function(){if(g===gen)failed("error")});
  var p=v.play();if(p&&p.catch)p.catch(function(){})}
fetch(manifestUrl,{cache:"no-store"}).then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(j){
  apiKey=(j&&j.apiKey)||"";blocks=(Array.isArray(j)?j:(j.blocks||j.items||[])).map(norm).filter(Boolean);
  if(!blocks.length)return youtube();log("blocks:"+blocks.length);play()}).catch(youtube);
})();
