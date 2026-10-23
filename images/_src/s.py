import requests,sys,json
H={'User-Agent':'NovenaBot/1.0 (nburson)'}
for q in sys.argv[1:]:
  r=requests.get('https://commons.wikimedia.org/w/api.php',params=dict(action='query',list='search',srsearch=q,srnamespace=6,format='json',srlimit=4),headers=H).json()
  print(q,'=>',[x['title'] for x in r['query']['search']])
