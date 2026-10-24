# Real headless-Chromium test of /rewind/: serves the site + short clips locally, loads the page via CDP,
# and asserts play -> ended -> advance -> loop. Usage: python3 tools/rewind_browser_test.py [seconds]
import json,os,subprocess,sys,time,urllib.request,websocket,http.server,threading,functools,tempfile,shutil
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));T=int(sys.argv[1]) if len(sys.argv)>1 else 16
tmp=tempfile.mkdtemp();os.makedirs(tmp+"/clips")
for c in ["red","green","blue"]:
  subprocess.run(["ffmpeg","-loglevel","error","-y","-f","lavfi","-i",f"color=c={c}:s=320x180:d=2:r=25","-c:v","libx264","-pix_fmt","yuv420p","-movflags","+faststart",f"{tmp}/clips/{c}.mp4"],check=True)
os.symlink(tmp+"/clips",R+"/_testclips") if not os.path.exists(R+"/_testclips") else None
man={"blocks":[{"url":"/_testclips/red.mp4","title":"A"},{"url":"/_testclips/green.mp4","title":"B"},{"driveId":"1O31iX_3hhMs5sbG_BagNjQVdRDr2jCTy","title":"real public Drive file (expected to be refused by Drive)"},{"url":"/_testclips/blue.mp4","title":"C"}]}
json.dump(man,open(R+"/_testclips_manifest.json","w"))
srv=http.server.ThreadingHTTPServer(("127.0.0.1",8799),functools.partial(http.server.SimpleHTTPRequestHandler,directory=R));srv.RequestHandlerClass.log_message=lambda *a:None
threading.Thread(target=srv.serve_forever,daemon=True).start()
ch=subprocess.Popen(["google-chrome","--headless=new","--no-sandbox","--disable-gpu","--remote-debugging-port=9333","--user-data-dir="+tmp+"/prof","about:blank"],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
try:
  for _ in range(50):
    try:tabs=json.load(urllib.request.urlopen("http://127.0.0.1:9333/json"));break
    except Exception:time.sleep(.2)
  ws=websocket.create_connection([t for t in tabs if t["type"]=="page"][0]["webSocketDebuggerUrl"]);n=[0]
  def cdp(m,**p):
    n[0]+=1;ws.send(json.dumps({"id":n[0],"method":m,"params":p}))
    while True:
      r=json.loads(ws.recv())
      if r.get("id")==n[0]:return r
  cdp("Page.navigate",url="http://127.0.0.1:8799/rewind/?manifest=/_testclips_manifest.json&stall=4000");time.sleep(T)
  log=json.loads(cdp("Runtime.evaluate",expression="JSON.stringify({log:window.REWIND_LOG||[],muted:[...document.querySelectorAll('video')].every(v=>v.muted),banner:document.getElementById('rw-banner').textContent,ov:getComputedStyle(document.body).overflow})",returnByValue=True)["result"]["result"]["value"])
  print(json.dumps(log))
  L=log["log"];ok=all(x in L for x in ["playing:0","ended:0","playing:1","ended:1","fail:2:error","playing:3","ended:3","loop"]) and L.count("playing:0")>=2 and log["muted"]
  # empty manifest -> YouTube fallback
  cdp("Page.navigate",url="http://127.0.0.1:8799/rewind/?manifest=/data/does-not-exist.json");time.sleep(3)
  yt=cdp("Runtime.evaluate",expression="(document.querySelector('#rw-video')||{}).src||''",returnByValue=True)["result"]["result"]["value"];print("fallback:",yt)
  ok=ok and "youtube.com/embed/" in yt
  print("BROWSER TEST","PASS" if ok else "FAIL");sys.exit(0 if ok else 1)
finally:
  ch.kill();srv.shutdown();os.remove(R+"/_testclips");os.remove(R+"/_testclips_manifest.json");shutil.rmtree(tmp,ignore_errors=True)
