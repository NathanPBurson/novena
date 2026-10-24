# Headless-Chromium layout test for /rewind/: player fills viewport at several sizes (video + YouTube iframe),
# no scrollbars, fullscreen button hidden by default / shows on mousemove / auto-hides ~3s. Optional screenshot.
# Usage: python3 tools/rewind_layout_test.py [--shot shots/rewind-1080.png]
import json,os,subprocess,sys,time,urllib.request,websocket,http.server,threading,functools,tempfile,shutil,base64
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));tmp=tempfile.mkdtemp()
subprocess.run(["ffmpeg","-loglevel","error","-y","-f","lavfi","-i","testsrc2=s=1280x720:d=30:r=25","-c:v","libx264","-pix_fmt","yuv420p","-movflags","+faststart",tmp+"/c.mp4"],check=True)
os.symlink(tmp,R+"/_lt");json.dump({"blocks":[{"url":"/_lt/c.mp4"}]},open(R+"/_lt_manifest.json","w"));json.dump({"blocks":[{"youtubeId":"BBEOOdY_k5A"}]},open(R+"/_lt_yt.json","w"))
H=http.server.SimpleHTTPRequestHandler;H.log_message=lambda *a:None
srv=http.server.ThreadingHTTPServer(("127.0.0.1",8797),functools.partial(H,directory=R));threading.Thread(target=srv.serve_forever,daemon=True).start()
ch=subprocess.Popen(["google-chrome","--headless=new","--no-sandbox","--disable-gpu","--hide-scrollbars","--remote-debugging-port=9337","--user-data-dir="+tmp+"/p","about:blank"],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
ok=True
def chk(c,m):
  global ok;ok=ok and c;print("PASS" if c else "FAIL",m)
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
  M="JSON.stringify((()=>{var el=document.querySelector('#rw-stage video,#rw-stage iframe'),r=el?el.getBoundingClientRect():{},cs=el?getComputedStyle(el):{};return{tag:el&&el.tagName,x:r.left,y:r.top,w:r.width,h:r.height,iw:innerWidth,ih:innerHeight,fit:cs.objectFit,bd:cs.borderTopWidth,sw:document.documentElement.scrollWidth,sh:document.documentElement.scrollHeight,bm:getComputedStyle(document.body).margin,ov:getComputedStyle(document.documentElement).overflow,banner:!!document.getElementById('rw-banner')}})())"
  for q,kind in [("?manifest=/_lt_manifest.json","VIDEO"),("?manifest=/nope.json","IFRAME"),("?manifest=/_lt_yt.json","IFRAME")]:
    for w,h in [(1920,1080),(1280,720),(1001,563),(777,1333),(333,222)]:
      cdp("Emulation.setDeviceMetricsOverride",width=w,height=h,deviceScaleFactor=1,mobile=False)
      cdp("Page.navigate",url="http://127.0.0.1:8797/rewind/"+q);time.sleep(4 if "yt" in q else 2.5)
      m=json.loads(ev(M))
      chk(m["tag"]==kind and m["x"]==0 and m["y"]==0 and m["w"]==w and m["h"]==h and m["iw"]==w and m["ih"]==h and m["sw"]==w and m["sh"]==h and m["bm"]=="0px" and m["ov"]=="hidden" and m["bd"]=="0px" and m["banner"] and (kind=="IFRAME" or m["fit"]=="contain"),f"{kind} fills {w}x{h} -> {m['w']}x{m['h']} at {m['x']},{m['y']} scroll {m['sw']}x{m['sh']}")
  cdp("Emulation.setDeviceMetricsOverride",width=1920,height=1080,deviceScaleFactor=1,mobile=False)
  cdp("Page.navigate",url="http://127.0.0.1:8797/rewind/?manifest=/_lt_manifest.json");time.sleep(3)
  vis=lambda:ev("getComputedStyle(document.getElementById('rw-fs')).visibility")
  chk(vis()=="hidden","fullscreen button hidden with no mouse (OBS)")
  cdp("Input.dispatchMouseEvent",type="mouseMoved",x=500,y=500);time.sleep(.5)
  chk(vis()=="visible","button appears on mouse movement")
  time.sleep(3.3);chk(vis()=="hidden","button auto-hides after ~3s")
  chk(ev("typeof document.documentElement.requestFullscreen")=="function" and ev("getComputedStyle(document.getElementById('rw-shield')).position")=="fixed","Fullscreen API available; click/dblclick shield present")
  cdp("Input.dispatchMouseEvent",type="mousePressed",x=900,y=500,button="left",clickCount=1);cdp("Input.dispatchMouseEvent",type="mouseReleased",x=900,y=500,button="left",clickCount=1);time.sleep(1)
  chk(ev("!!document.fullscreenElement")==True,"click on page enters fullscreen")
  ev("document.exitFullscreen&&document.exitFullscreen()");time.sleep(1)
  if "--shot" in sys.argv:
    out=os.path.join(R,sys.argv[sys.argv.index("--shot")+1]);time.sleep(3.5)
    open(out,"wb").write(base64.b64decode(cdp("Page.captureScreenshot",format="png")["data"]));print("screenshot",out)
finally:
  ch.kill();srv.shutdown();os.remove(R+"/_lt");os.remove(R+"/_lt_manifest.json");os.remove(R+"/_lt_yt.json");shutil.rmtree(tmp,ignore_errors=True)
print("LAYOUT TEST","PASS" if ok else "FAIL");sys.exit(0 if ok else 1)
