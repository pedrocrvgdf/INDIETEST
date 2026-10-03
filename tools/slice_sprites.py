"""Fatia as folhas de sprite (5 poses por personagem) em PNGs individuais.

Uso: python3 tools/slice_sprites.py <folha.png> <nome_personagem> <destino>
Gera: parado, soco, chute, defesa, especial (+ retrato e, se houver, projetil)
e um sprites_meta.js com largura/altura/âncora dos pés de cada pose.
"""
import sys, json, os, numpy as np
from PIL import Image
from scipy import ndimage

TARGET_H = 360   # altura padrão do personagem na pose "parado" (px lógicos)
POSES = ["parado", "soco", "chute", "defesa", "especial"]

def components(alpha):
    lab, n = ndimage.label(alpha)
    objs = ndimage.find_objects(lab)
    out = []
    for i, sl in enumerate(objs):
        area = int((lab[sl] == i + 1).sum())
        out.append(dict(id=i + 1, x0=sl[1].start, x1=sl[1].stop, y0=sl[0].start, y1=sl[0].stop, area=area))
    return lab, out

def main(sheet, name, dest):
    im = Image.open(sheet).convert("RGBA")
    arr = np.array(im)
    alpha = arr[:, :, 3] > 10
    lab, comps = components(alpha)
    big = sorted([c for c in comps if c["area"] > 5000], key=lambda c: c["area"], reverse=True)
    # rótulos ("PARADO" etc.) são caixas largas e baixas -> descartar
    sprites = [c for c in big if (c["y1"] - c["y0"]) > 2.2 * (c["x1"] - c["x0"]) * 0.0 and (c["y1"] - c["y0"]) > 120]
    sprites = [c for c in sprites if (c["y1"] - c["y0"]) / max(1, (c["x1"] - c["x0"])) > 0.55]
    # ordenar em linhas (pelo centro y) e depois por x
    sprites.sort(key=lambda c: (c["y0"] + c["y1"]) / 2)
    rows = []
    for c in sprites:
        cy = (c["y0"] + c["y1"]) / 2
        for r in rows:
            if abs(r["cy"] - cy) < 0.4 * (c["y1"] - c["y0"]):
                r["items"].append(c); break
        else:
            rows.append(dict(cy=cy, items=[c]))
    ordered = []
    for r in sorted(rows, key=lambda r: r["cy"]):
        ordered += sorted(r["items"], key=lambda c: c["x0"])
    assert len(ordered) >= 5, f"esperava 5 poses, achei {len(ordered)}: {ordered}"
    ordered = ordered[:5]

    os.makedirs(dest, exist_ok=True)
    scale = TARGET_H / (ordered[0]["y1"] - ordered[0]["y0"])
    meta = {}
    for pose, c in zip(POSES, ordered):
        # junta efeitos soltos (faíscas, poeira, balão) que estejam perto desta pose
        pad = 0.35 * (c["y1"] - c["y0"])
        ids = [c["id"]]
        cw, chh = c["x1"] - c["x0"], c["y1"] - c["y0"]
        for o in comps:
            if o["id"] == c["id"] or o["area"] < 40 or o in ordered: continue
            ow, oh = o["x1"] - o["x0"], o["y1"] - o["y0"]
            if ow > 2.5 * oh and oh < 0.15 * chh and o["area"] > 0.5 * ow * oh:
                continue  # rótulo (caixa larga, baixa e cheia)
            ocx = (o["x0"] + o["x1"]) / 2
            if not (c["x0"] - 0.15 * cw <= ocx <= c["x1"] + 0.15 * cw): continue
            if o["y0"] >= c["y0"] - pad and o["y1"] <= c["y1"] + 0.05 * chh:
                ids.append(o["id"])
        mask = np.isin(lab, ids)
        ys, xs = np.where(mask)
        x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
        crop = arr[y0:y1, x0:x1].copy()
        crop[:, :, 3] = np.where(mask[y0:y1, x0:x1], crop[:, :, 3], 0)
        img = Image.fromarray(crop)
        nw, nh = max(1, round(img.width * scale)), max(1, round(img.height * scale))
        img = img.resize((nw, nh), Image.LANCZOS if scale < 1 else Image.NEAREST)
        # âncora: centro dos pés = média x das linhas opacas dos 6% inferiores da pose principal
        body = (lab == c["id"])[y0:y1, x0:x1]
        bh = body.shape[0]
        foot_rows = body[int(bh * 0.94):]
        fy, fx = np.where(foot_rows)
        foot_x = float(fx.mean()) if len(fx) else body.shape[1] / 2
        # topo da pose principal (para efeitos acima da cabeça não deslocarem o corpo)
        body_ys = np.where(body.any(axis=1))[0]
        img.save(os.path.join(dest, f"{pose}.png"))
        meta[pose] = dict(w=nw, h=nh, footX=round(foot_x * scale), footY=nh,
                          bodyTop=round(body_ys.min() * scale), bodyH=round((body_ys.max() - body_ys.min()) * scale))
        print(f"{name}/{pose}: {nw}x{nh} footX={meta[pose]['footX']}")

    # retrato: cabeça da pose parado (28% superiores)
    p = Image.open(os.path.join(dest, "parado.png"))
    head = p.crop((0, 0, p.width, int(p.height * 0.3)))
    bbox = head.getbbox()
    if bbox: head = head.crop(bbox)
    head.save(os.path.join(dest, "retrato.png"))

    # projétil opcional: objeto rosa/magenta na pose parado (garrafa)
    pa = np.array(p)
    pink = (pa[:, :, 0] > 190) & (pa[:, :, 1] < 110) & (pa[:, :, 2] > 90) & (pa[:, :, 3] > 10)
    if pink.sum() > 300:
        l2, n2 = ndimage.label(pink)
        sizes = ndimage.sum(pink, l2, range(1, n2 + 1))
        bid = int(np.argmax(sizes)) + 1
        sl = ndimage.find_objects(l2)[bid - 1]
        y0, y1 = max(0, sl[0].start - 10), min(pa.shape[0], sl[0].stop + 4)
        x0, x1 = max(0, sl[1].start - 4), min(pa.shape[1], sl[1].stop + 4)
        crop = pa[y0:y1, x0:x1].copy()
        r, g, b, a = [crop[:, :, i].astype(int) for i in range(4)]
        keep = ((r > 190) & (g < 110) & (b > 90)) | ((abs(r - g) < 25) & (abs(g - b) < 25) & (r > 120))  # rosa ou cinza (tampa)
        crop[:, :, 3] = np.where(keep, crop[:, :, 3], 0)
        Image.fromarray(crop).save(os.path.join(dest, "projetil.png"))
        meta["projetil"] = dict(w=int(x1 - x0), h=int(y1 - y0))
        print(f"{name}/projetil: {x1-x0}x{y1-y0}")

    with open(os.path.join(dest, "meta.json"), "w") as f:
        json.dump(meta, f, indent=1)
    return meta

if __name__ == "__main__":
    main(*sys.argv[1:4])
