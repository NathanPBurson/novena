# Fisk-style collage per scene from local PD paintings (data/scenes.json + data/art_meta.json). Safe to re-run.
import json,os
from PIL import Image,ImageOps,ImageDraw
import numpy as np
from skimage import color
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
S=json.load(open(R+'/data/scenes.json'));M=json.load(open(R+'/data/art_meta.json'))
def match(ims,s=.45):
  if len(ims)<2:return ims
  labs=[color.rgb2lab(np.asarray(i)/255.) for i in ims]
  mu=np.mean([l.reshape(-1,3).mean(0) for l in labs],0);sd=np.mean([l.reshape(-1,3).std(0) for l in labs],0)
  out=[]
  for l in labs:
    m=l.reshape(-1,3).mean(0);d=l.reshape(-1,3).std(0)+1e-6;r=l*(1-s)+((l-m)/d*sd+mu)*s
    out.append(Image.fromarray((np.clip(color.lab2rgb(r),0,1)*255).astype('uint8')))
  return out
def crop(im,t):
  # Tissot gouaches are photographed on their paper mounts: trim the mat
  if 'Tissot Drawing' not in t:return im
  w,h=im.size;return im.crop((int(w*.12),int(h*.1),int(w*.88),int(h*.9)))
W,H,g=1200,560,8;os.makedirs(R+'/images/scenes',exist_ok=True)
for sc in S['scenes']:
  name='images/scenes/%s-%d.jpg'%(sc['ref'].replace(':','-'),sc['after']);sc['image']=name
  ims=[crop(Image.open(R+'/'+M[t]['local']).convert('RGB'),t) for t in sc['art']];n=len(ims)
  # first panel wider (the "hero"), the rest share the remainder
  ws=[W] if n==1 else [int((W-g*(n-1))*(.55 if n>1 else 1))]+[int((W-g*(n-1))*.45/(n-1))]*(n-1)
  ws[-1]+=W-g*(n-1)-sum(ws)
  ims=match([ImageOps.fit(im,(w,H),Image.LANCZOS,centering=(.5,.4)) for im,w in zip(ims,ws)])
  C=Image.new('RGB',(W,H),(22,15,10));x=0
  for im,w in zip(ims,ws):C.paste(im,(x,0));x+=w+g
  C=ImageOps.expand(C,6,(201,162,74));C=ImageOps.expand(C,3,(40,26,12))
  C.save(R+'/'+name,quality=88);print(name)
