/* Home hero slideshow: ~4s per slide, pauses on hover/focus, static when prefers-reduced-motion. */
(function(){var r=document.getElementById("lu-slides");if(!r)return;var s=r.querySelectorAll(".lu-slide"),i=0,t=null,paused=false,rm=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
function go(n){s[i].classList.remove("on");s[i].setAttribute("aria-hidden","true");i=(n+s.length)%s.length;s[i].classList.add("on");s[i].setAttribute("aria-hidden","false");var im=s[(i+1)%s.length].querySelector("img");if(im)im.loading="eager"}
function start(){if(rm||t)return;t=setInterval(function(){if(!paused&&!document.hidden)go(i+1)},4000)}
r.addEventListener("mouseenter",function(){paused=true});r.addEventListener("mouseleave",function(){paused=false});r.addEventListener("focusin",function(){paused=true});r.addEventListener("focusout",function(){paused=false});
r.querySelector(".lu-sl-prev").addEventListener("click",function(){go(i-1)});r.querySelector(".lu-sl-next").addEventListener("click",function(){go(i+1)});start()})();
