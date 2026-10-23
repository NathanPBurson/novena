import requests,json,sys
H={'User-Agent':'NovenaBot/1.0 (nburson)'}
files=json.load(open('files.json'))
out={}
for k,t in files.items():
  r=requests.get('https://commons.wikimedia.org/w/api.php',params=dict(action='query',titles=t,prop='imageinfo',iiprop='url|size|extmetadata',iiurlwidth=1280,format='json'),headers=H).json()
  p=list(r['query']['pages'].values())[0]; ii=p['imageinfo'][0]; m=ii['extmetadata']
  u=ii.get('thumburl') or ii['url']
  open(k+'.jpg','wb').write(requests.get(u,headers=H).content)
  out[k]=dict(title=t,page=ii['descriptionurl'],size=(ii['width'],ii['height']),lic=m.get('LicenseShortName',{}).get('value'),artist=m.get('Artist',{}).get('value','')[:120],date=m.get('DateTimeOriginal',{}).get('value','')[:60])
  print(k,out[k])
json.dump(out,open('meta.json','w'),indent=1)
