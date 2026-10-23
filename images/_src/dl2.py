import requests,time,json
H={'User-Agent':'NovenaSiteImages/1.0 (contact: nburson; python-requests)'}
m=json.load(open('meta.json'))
for k,t in {"angelico":"File:La Anunciación (Fra Angelico-Prado).jpg","baptism":"File:Andrea del Verrocchio, Leonardo da Vinci - Baptism of Christ - Uffizi.jpg","coron":"File:Diego Velázquez - Coronation of the Virgin - Prado.jpg","cross":"File:Cristo crucificado.jpg","geth":"File:Carl Bloch, Kristus i Gethsemane, , KKS602, Statens Museum for Kunst.jpg","honthorst":"File:Gerard van Honthorst - Adoration of the Shepherds (1622).jpg","murillo":"File:Virgen del Rosario (Murillo).jpg"}.items():
  r=requests.get('https://commons.wikimedia.org/w/api.php',params=dict(action='query',titles=t,prop='imageinfo',iiprop='url',format='json'),headers=H).json()
  u=list(r['query']['pages'].values())[0]['imageinfo'][0]['url']
  c=requests.get(u,headers=H); print(k,c.status_code,len(c.content)); open(k+'.jpg','wb').write(c.content); time.sleep(3)
