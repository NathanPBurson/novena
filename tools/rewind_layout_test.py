# Headless-Chromium test of /rewind/ (local server): cover-fit 16:9 at several sizes, normal-mode controls
# (show on mouse move, hide after ~2s idle), OBS mode (?obs=1) clean, YouTube blocks auto-advance.
# Usage: python3 tools/rewind_layout_test.py [--shots]   (writes shots/rewind-normal-controls.png, shots/rewind-obs.png)
import json,os,subprocess,sys,time,urllib.request,websocket,http.server,threading,functools,tempfile,shutil,base64
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));tmp=tempfile.mkdtemp()
subprocess.run(["ffmpeg","-loglevel","error","-y","-f","lavfi","-i","testsrc2=s=1280x720:d=30:r=25","-c:v","libx264","-pix_fmt","yuv420p","-movflags","+faststart",tmp+"/c.mp4"],check=True)
os.symlink(tmp,R+"/_lt");json.dump({"blocks":[{"url":"/_lt/c.mp4"}]},open(R+"/_lt_v.json","w"))
json.dump({"blocks":[{"youtubeId":"rFM5Uq6tx6E"},{"youtubeId":"zzzzzzzzzzz"},{"youtubeId":"xr_zKF7JX68"}]},open(R+"/_lt_yt.json","w"))
H=http.server.SimpleHTTPRequestHandler;H.log_message=lambda *a:None
srv=http.server.ThreadingHTTPServer(("127.0.0.1",8797),functools.partial(H,directory=R));threading.Thread(target=srv.serve_forever,daemon=True).start()
ch=subprocess.Popen(["google-chrome","--headless=new","--no-sandbox","--disable-gpu","--hide-scrollbars","--remote-debugging-port=9337","--user-data-dir="+tmp+"/p","about:blank"],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
ok=True
def chk(c,m):
  global ok;ok=ok and bool(c);print("PASS" if c else "FAIL",m,flush=True)
try:
  for _ in range(50):
    try:tabs=json.load(urllib.request.urlopen("http://127.0.0.1:9337/json"));break
    except Exception:time.sleep(.2)
  ws=websocket.create_connection([t for t in tabs if t["type"]=="page"][0]["webSocketDebuggerUrl"]);n=[0]
  def cdp(m,**p):
    n[0]+=1;ws.send(json.dumps({"id":n[0],"method":m,"params":p}))
    while True:
      r=json.loads(ws.recv())
      if r.get("id")==n[0]:return r.get("result",{})
  ev=lambda e:cdp("Runtime.evaluate",expression=e,returnByValue=True)["result"].get("value")
  shot=lambda f:open(os.path.join(R,f),"wb").write(base64.b64decode(cdp("Page.captureScreenshot",format="png")["data"]))
  size=lambda w,h:cdp("Emulation.setDeviceMetricsOverride",width=w,height=h,deviceScaleFactor=1,mobile=False)
  go=lambda q,s=3:(cdp("Page.navigate",url="http://127.0.0.1:8797/rewind/"+q),time.sleep(s))
  M="JSON.stringify((()=>{var el=document.querySelector('#rw-stage .rw-media'),r=el?el.getBoundingClientRect():{};return{tag:el&&el.tagName,l:r.left,t:r.top,r:r.right,b:r.bottom,w:r.width,h:r.height,sw:document.documentElement.scrollWidth,sh:document.documentElement.scrollHeight,mode:window.REWIND_MODE,ui:!!document.getElementById('rw-ui')}})())"
  for q,kind,mode in [("?manifest=/_lt_v.json","VIDEO","normal"),("?manifest=/_lt_yt.json","IFRAME","normal"),("?obs=1&manifest=/_lt_yt.json","IFRAME","obs")]:
    for w,h in [(1920,1080),(1280,720),(1001,563),(777,1333),(1440,1080)]:
      size(w,h);go(q,5 if kind=="IFRAME" else 2.5);m=json.loads(ev(M))
      cover=m["tag"]==kind and m["l"]<=0.5 and m["t"]<=0.5 and m["r"]>=w-0.5 and m["b"]>=h-0.5 and abs(m["w"]/m["h"]-16/9)<0.01 and m["sw"]==w and m["sh"]==h and m["mode"]==mode
      chk(cover,f"{mode} {kind} covers {w}x{h} at 16:9 -> {m['w']:.0f}x{m['h']:.0f} ({m['l']:.0f},{m['t']:.0f}) no scroll")
  size(1920,1080)
  # normal mode controls
  go("?manifest=/_lt_yt.json",6);vis=lambda:ev("getComputedStyle(document.getElementById('rw-ui')).visibility")
  chk(vis()=="hidden","normal: controls hidden with no mouse")
  cdp("Input.dispatchMouseEvent",type="mouseMoved",x=600,y=500);time.sleep(.6)
  chk(vis()=="visible" and ev("parseFloat(document.getElementById('rw-fill').style.width)>0"),"normal: progress bar + fullscreen appear on mouse move (progress >0)")
  if "--shots" in sys.argv:shot("shots/rewind-normal-controls.png");print("shot shots/rewind-normal-controls.png")
  time.sleep(2.2);chk(vis()=="hidden","normal: controls hide after ~2s idle")
  cdp("Input.dispatchMouseEvent",type="mousePressed",x=900,y=400,button="left",clickCount=1);cdp("Input.dispatchMouseEvent",type="mouseReleased",x=900,y=400,button="left",clickCount=1);time.sleep(1)
  chk(ev("!!document.fullscreenElement"),"normal: click enters fullscreen");ev("document.exitFullscreen()");time.sleep(.5)
  # OBS mode: clean + auto-advance through broken id
  go("?obs=1&manifest=/_lt_yt.json",8);cdp("Input.dispatchMouseEvent",type="mouseMoved",x=600,y=500);time.sleep(.5)
  chk(ev("!document.getElementById('rw-ui')&&!document.querySelector('#rw-stage iframe').src.includes('controls=1')&&getComputedStyle(document.getElementById('rw-shield')).position==='fixed'"),"obs: no controls/UI even on mouse move, shield blocks YouTube hover overlays")
  if "--shots" in sys.argv:shot("shots/rewind-obs.png");print("shot shots/rewind-obs.png")
  t0=time.time()
  while time.time()-t0<60 and "loop" not in json.loads(ev("JSON.stringify(window.REWIND_LOG)")):time.sleep(1)
  L=json.loads(ev("JSON.stringify(window.REWIND_LOG)"));print(L)
  chk(all(x in L for x in ["playing:0","ended:0","playing:2","ended:2","loop"]) and any(x.startswith("fail:1:") for x in L),"obs: clip 1 ends -> broken skipped -> clip 2 ends -> loop")
finally:
  ch.kill();srv.shutdown();[os.remove(R+"/"+f) for f in ["_lt","_lt_v.json","_lt_yt.json"]];shutil.rmtree(tmp,ignore_errors=True)
print("LAYOUT TEST","PASS" if ok else "FAIL");sys.exit(0 if ok else 1)
