# Downloads every painting in data/scenes.json from Wikimedia Commons, refusing anything not PD/CC0. Writes data/art_meta.json.
import time,requests,json,os,re,hashlib,html
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));H={'User-Agent':'PiosLostSheepSiteBuilder/1.0 (https://github.com/NathanPBurson; static site art fetch) python-requests/2'}
S=json.load(open(R+'/data/scenes.json'));M={}
mp=R+'/data/art_meta.json'
if os.path.exists(mp):M=json.load(open(mp))
os.makedirs(R+'/images/scenes/src',exist_ok=True)
def clean(s):return html.unescape(re.sub('<[^>]+>','',s or '')).strip()
for sc in S['scenes']:
  for t in sc['art']:
    if t in M and os.path.exists(R+'/'+M[t]['local']):continue
    for k in range(2):  # Commons sometimes answers 503/HTML under load
      try:
        rr=requests.get('https://commons.wikimedia.org/w/api.php',params=dict(action='query',titles=t,prop='imageinfo',iiprop='url|size|extmetadata',iiurlwidth=1280,format='json'),headers=H,timeout=60)
        r=rr.json();break
      except (ValueError,requests.RequestException):time.sleep(15*(k+1))
    else:r=None
    if r is None:
      # Commons API down: read the public file page instead (same licence check)
      pg=None
      for k in range(6):
        try:gg=requests.get('https://commons.wikimedia.org/wiki/'+t.replace(' ','_'),headers=H,timeout=60)
        except requests.RequestException:time.sleep(10*(k+1));continue
        if gg.ok:pg=gg.text;break
        time.sleep(10*(k+1))
      if pg is None:raise SystemExit('file page failed '+t)
      lics=[html.unescape(x) for x in re.findall(r'licensetpl&#95;short[^>]*>([^<]*)<',pg)]
      lic=next((x for x in lics if re.search(r'public domain|cc0|no restrictions|pd',x,re.I)),'')
      if not lic or any(re.search(r'cc[- ]by|gfdl|share ?alike',x,re.I) for x in lics):raise SystemExit('NOT PD: '+t+' '+str(lics))
      u=re.search(r'class="fullImageLink" id="file"><a href="([^"]+)"',pg).group(1).replace('&amp;','&')
      loc='images/scenes/src/'+hashlib.md5(t.encode()).hexdigest()[:10]+'.jpg'
      for k in range(6):
        try:g=requests.get(u,headers=H,timeout=120)
        except requests.RequestException:time.sleep(20*(k+1));continue
        if g.ok and g.headers.get('content-type','').startswith('image') and len(g.content)>20000:break
        time.sleep(20*(k+1))
      else:raise SystemExit('download failed '+t)
      open(R+'/'+loc,'wb').write(g.content);time.sleep(2)
      M[t]=dict(local=loc,source='https://commons.wikimedia.org/wiki/'+t.replace(' ','_'),license=lic,artist='',title=t[5:-4],date='')
      json.dump(M,open(mp,'w'),indent=1,ensure_ascii=False);print(lic,'|',t[:70],flush=True);continue
    p=list(r['query']['pages'].values())[0];ii=p['imageinfo'][0];m=ii['extmetadata']
    lic=m.get('LicenseShortName',{}).get('value','')
    if not re.search(r'public domain|cc0|no restrictions|pd',lic,re.I):raise SystemExit('NOT PD: '+t+' '+lic)
    loc='images/scenes/src/'+hashlib.md5(t.encode()).hexdigest()[:10]+'.jpg'
    for k in range(6):
      g=requests.get(ii['url'] if ii['width']<=1600 else ii['thumburl'],headers=H,timeout=60)
      if g.ok and g.headers.get('content-type','').startswith('image') and len(g.content)>20000:break
      print('retry',g.status_code,flush=True)
      time.sleep(20*(k+1))
    else:raise SystemExit('download failed '+t)
    open(R+'/'+loc,'wb').write(g.content);time.sleep(2);json.dump(M,open(mp,'w'),indent=1,ensure_ascii=False)
    M[t]=dict(local=loc,source=ii['descriptionurl'],license=lic,artist=clean(m.get('Artist',{}).get('value'))[:100],title=clean(m.get('ObjectName',{}).get('value') or m.get('ImageDescription',{}).get('value'))[:140],date=clean(m.get('DateTimeOriginal',{}).get('value'))[:40])
    print(flush=True,*[lic]) if 0 else print(lic,'|',M[t]['artist'],'|',M[t]['title'][:60])
json.dump(M,open(mp,'w'),indent=1,ensure_ascii=False)
