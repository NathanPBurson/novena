import requests,sys
H={'User-Agent':'NovenaBot/1.0 (nburson)'}
for q in sys.argv[1:]:
  r=requests.get('https://commons.wikimedia.org/w/api.php',params=dict(action='query',generator='search',gsrsearch=q+' filetype:bitmap',gsrnamespace=6,gsrlimit=6,prop='imageinfo',iiprop='extmetadata|size',format='json'),headers=H).json()
  print('##',q)
  for p in (r.get('query',{}).get('pages',{}) or {}).values():
    ii=p['imageinfo'][0];m=ii['extmetadata']
    print(' ',p['title'],ii['width'],m.get('LicenseShortName',{}).get('value'))
