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
  w,h=im.size;return im.crop((int(w*.17),int(h*.12),int(w*.83),int(h*.88)))

# Fisk-style pop (Nathan, Oct 24): light overlays that never cover the middle of the painting.
# Torn parchment corners, a halftone band in the bottom margin, and one sticker-label scripture callout
# in the bottom-left corner. All drawn here with PIL; no AI images, no outlines around cutouts.
from PIL import ImageFont,ImageFilter
import random
FONT=R+'/fonts/LilitaOne-Regular.ttf'
def torn(C,corner,rnd):
  w,h=C.size;L=Image.new('L',C.size,0);d=ImageDraw.Draw(L);sw,sh=int(w*.13),int(h*.16)
  pts=[];n=18
  for i in range(n+1):
    t=i/n;x=sw*(1-t);y=sh*t;j=rnd.uniform(-7,7);pts.append((x+j,y+j))
  poly=[(0,0)]+pts
  if corner=='br':poly=[(w-x,h-y) for x,y in poly]
  d.polygon(poly,fill=255);L=L.filter(ImageFilter.GaussianBlur(.8))
  paper=Image.new('RGB',C.size,(236,222,190));tex=Image.effect_noise(C.size,18).convert('RGB')
  paper=Image.blend(paper,tex,.08);sh_=L.filter(ImageFilter.GaussianBlur(5)).point(lambda v:int(v*.45))
  C.paste((10,6,2),(4,4),sh_.crop((0,0,w-4,h-4)) if corner=='tl' else sh_) ;C.paste(paper,(0,0),L);return C
def halftone(C):
  w,h=C.size;band=int(h*.09);O=Image.new('RGBA',C.size,(0,0,0,0));d=ImageDraw.Draw(O)
  for y in range(h-band,h,10):
    r=1+3.2*(y-(h-band))/band
    for x in range((y//10%2)*5,int(w*.55),10):d.ellipse((x-r,y-r,x+r,y+r),fill=(150,105,40,85))
  return Image.alpha_composite(C.convert('RGBA'),O).convert('RGB')
def busy(C,box):
  g=np.asarray(C.convert('L').crop(box).filter(ImageFilter.FIND_EDGES),dtype=float);return g.mean()
def label(C,text):
  w,h=C.size;f=ImageFont.truetype(FONT,30);d=ImageDraw.Draw(C);tw=d.textlength(text,font=f)
  bw,bh=int(tw+36),50;y=h-bh-22
  # put the label in the quieter bottom corner so it stays off the figures
  x=min([22,w-bw-30],key=lambda x:busy(C,(x,y-6,x+bw,y+bh)))
  S=Image.new('RGBA',(bw+8,bh+8),(0,0,0,0));sd=ImageDraw.Draw(S)
  sd.rounded_rectangle((4,8,bw+4,bh+8),14,fill=(7,20,38,230))
  sd.rounded_rectangle((0,0,bw,bh),14,fill=(14,42,75,255),outline=(201,162,74,255),width=3)
  sd.text((18,9),text,font=f,fill=(255,214,102,255))
  S=S.rotate(2,resample=Image.BICUBIC,expand=True);C=C.convert('RGBA');C.alpha_composite(S,(x,y-6));return C.convert('RGB')
def cameo(C,cm):
  # face on a matching minor figure (only where a real stream gag fits); oval feathered cutout, no outline, no name tag
  w,h=C.size;im=Image.open(R+'/'+cm['file']).convert('RGBA');t=int(h*cm['h']);im=im.resize((int(im.width*t/im.height),t),Image.LANCZOS)
  C=C.convert('RGBA');C.alpha_composite(im,(int(w*cm['cx'])-im.width//2,int(h*cm['cy'])-im.height//2));return C.convert('RGB')
def pop(C,sc):
  rnd=random.Random(sc['ref']+str(sc['after']))
  C=torn(C,'tl',rnd);C=torn(C,'br',rnd);C=halftone(C)
  if sc.get('callout'):C=label(C,sc['callout'])
  for cm in sc.get('cameos',[]):C=cameo(C,cm)
  sc['pop']=True;return C
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
  C=pop(C,sc)
  C=ImageOps.expand(C,6,(201,162,74));C=ImageOps.expand(C,3,(40,26,12))
  C.save(R+'/'+name,quality=88);print(name)
json.dump(S,open(R+'/data/scenes.json','w'),indent=1,ensure_ascii=False)
