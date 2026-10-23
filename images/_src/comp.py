from PIL import Image, ImageOps
import numpy as np
from skimage import color
O='/workspace/novena_site/images/'
G=(22,15,10)
def L(n): return Image.open(n+'.jpg').convert('RGB')
def fit(im,w,h,cx=.5,cy=.5,box=None):
    if box: W,H=im.size; im=im.crop((int(box[0]*W),int(box[1]*H),int(box[2]*W),int(box[3]*H)))
    return ImageOps.fit(im,(w,h),Image.LANCZOS,centering=(cx,cy))
def match(ims,s=.45):
    labs=[color.rgb2lab(np.asarray(i)/255.) for i in ims]
    mu=np.mean([l.reshape(-1,3).mean(0) for l in labs],0); sd=np.mean([l.reshape(-1,3).std(0) for l in labs],0)
    out=[]
    for l in labs:
        m=l.reshape(-1,3).mean(0); d=l.reshape(-1,3).std(0)
        t=(l-m)/d*sd+mu; r=l*(1-s)+t*s
        out.append(Image.fromarray((np.clip(color.lab2rgb(r),0,1)*255).astype('uint8')))
    return out
def build(size,panels,name,g=6):
    C=Image.new('RGB',size,G)
    ims=match([p[0] for p in panels])
    for im,(_,xy) in zip(ims,panels): C.paste(im,xy)
    C.save(O+name,quality=93); print(name,C.size)
g=6
# header: Caravaggio | Murillo | Coronation
w=(1920-2*g)//3
build((1920,600),[(fit(L('carav'),w,600,box=(0.02,0.14,0.62,0.48)),(0,0)),
  (fit(L('murillo'),1920-2*w-2*g,600,box=(0,0.05,1,0.6)),(w+g,0)),
  (fit(L('coron'),w,600,box=(0,0.05,1,0.6)),(1920-w,0))],'header.jpg')
S=1200; h2=(S-g)//2
build((S,S),[(fit(L('angelico'),S,h2,box=(0.3,0.05,1,0.85)),(0,0)),(fit(L('honthorst'),S,S-h2-g,cy=.55),(0,h2+g))],'joyful.jpg')
build((S,S),[(fit(L('g1'),h2,S,cx=.5),(0,0)),(fit(L('cross'),S-h2-g,S,box=(0,0,1,.85)),(h2+g,0))],'sorrowful.jpg')
build((S,S),[(fit(L('resur'),h2,S,cy=.3),(0,0)),(fit(L('coron'),S-h2-g,S,box=(0,0,1,.9)),(h2+g,0))],'glorious.jpg')
lw=480
build((S,S),[(fit(L('transf'),lw,S,box=(0,0,1,.5)),(0,0)),(fit(L('baptism'),S-lw-g,h2,box=(0,0,1,.8),cy=.3),(lw+g,0)),(fit(L('cana'),S-lw-g,S-h2-g,box=(0.3,0.42,0.72,0.92)),(lw+g,h2+g))],'luminous.jpg')
