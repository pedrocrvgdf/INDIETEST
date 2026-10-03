"""Remove o feixe embutido na pose 'especial' (o jogo desenha o raio em código, até a borda da tela).

Uso: python3 tools/trim_beam.py assets/sprites/pedro apex_x apex_y   (apex em unidades lógicas = olhos)
Recorta o PNG, atualiza meta.json e regrava meta.js.
"""
import sys, json, os, subprocess, numpy as np
from PIL import Image
pasta, ax, ay = sys.argv[1], float(sys.argv[2]), float(sys.argv[3])
meta = json.load(open(os.path.join(pasta, "meta.json"))); m = meta["especial"]
img = Image.open(os.path.join(pasta, "especial.png")).convert("RGBA"); a = np.array(img).astype(int)
k = img.height / m["h"]  # px por unidade lógica
px, py = ax * k, ay * k
r, g, b, al = [a[:, :, i] for i in range(4)]
sat = np.maximum(np.maximum(r, g), b) - np.minimum(np.minimum(r, g), b)
beamcor = ((sat > 110) & (np.maximum(np.maximum(r, g), b) > 140)) | ((r > 215) & (g > 205) & (b > 90))
ys, xs = np.mgrid[0:a.shape[0], 0:a.shape[1]]
banda = (xs > px) & (np.abs(ys - py) < 13 * k / 1.6 + 0.6 * (xs - px))
remover = (banda & beamcor & (xs <= px + 40 * k / 1.6)) | (banda & (xs > px + 40 * k / 1.6)) | (xs > px + 115 * k / 1.6)
a[:, :, 3] = np.where(remover, 0, a[:, :, 3])
out = Image.fromarray(a.astype(np.uint8)); bbox = out.getbbox(); out = out.crop(bbox)
x0, y0 = bbox[0], bbox[1]
out.save(os.path.join(pasta, "especial.png"))
nw, nh = round(out.width / k), round(out.height / k)
m.update(w=nw, h=nh, footX=round(m["footX"] - x0 / k), footY=nh, bodyTop=0, bodyH=nh)
json.dump(meta, open(os.path.join(pasta, "meta.json"), "w"), indent=1)
print("especial recortado:", out.size, "->", nw, "x", nh, "lógico, footX", m["footX"])
subprocess.run([sys.executable, os.path.join(os.path.dirname(__file__), "build_meta.py")])
