"""Gera quadros de animação por recorte de membros (estilo cut-out) a partir das poses estáticas.

Uso: python3 tools/rig_frames.py <id>
Lê assets/sprites/<id>/{parado,soco,chute}.png + meta.json e grava assets/sprites/<id>/anim/*.png
e anim.json (lista de quadros por animação). Os quadros usam um canvas fixo com o pé âncora
em (ANC_X, ANC_Y), então todos compartilham a mesma âncora.
"""
import sys, os, json, math, numpy as np
from PIL import Image, ImageDraw

CANVAS = (820, 660); ANC = (330, 640)
# Definições em pixels da imagem salva (600px de altura na pose parado).
RIGS = {
  'ludmilla': {
    'parado': { 'pivot_hip': (178, 300), 'torso_y': 285,
      'torso_extra': [(84, 240), (154, 240), (154, 356), (84, 356)],  # garrafa vai com o tronco
      'perna_frente': [(176, 258), (320, 258), (320, 600), (176, 600)], 'piv_frente': (218, 296),
      'perna_tras': [(0, 258), (178, 258), (178, 600), (0, 600)], 'piv_tras': (140, 296) },
    'soco': { 'braco': [(298, 92), (433, 92), (433, 180), (298, 180)], 'piv_braco': (304, 138) },
    'chute': { 'perna': [(184, 180), (400, 50), (454, 80), (454, 150), (300, 300), (222, 350), (176, 300)], 'piv_perna': (202, 242), 'efeito': None },
  },
  'pedro': {
    'parado': { 'pivot_hip': (195, 318), 'torso_y': 300, 'torso_extra': None,
      'perna_frente': [(193, 272), (332, 272), (332, 600), (193, 600)], 'piv_frente': (240, 310),
      'perna_tras': [(0, 272), (195, 272), (195, 600), (0, 600)], 'piv_tras': (150, 310) },
    'soco': { 'braco': [(288, 86), (417, 86), (417, 178), (288, 178)], 'piv_braco': (294, 134) },
    'chute': { 'perna': [(180, 185), (330, 5), (390, 35), (386, 110), (292, 300), (228, 350), (176, 300)], 'piv_perna': (206, 248),
               'efeito': [(300, 0), (404, 0), (404, 440), (330, 440), (330, 120)] },  # poeira do chute: só no quadro ativo
  },
}

def mask_poly(size, poly):
    m = Image.new('L', size, 0); ImageDraw.Draw(m).polygon(poly, fill=255); return m

def part(img, poly):
    """Camada com só os pixels dentro do polígono (mesmo tamanho da imagem)."""
    if poly is None: return None
    m = mask_poly(img.size, poly); out = Image.new('RGBA', img.size, (0, 0, 0, 0)); out.paste(img, (0, 0), m); return out

def rest(img, polys):
    out = img.copy(); px = out.load()
    for poly in polys:
        if poly is None: continue
        m = mask_poly(img.size, poly); mp = m.load()
        for y in range(img.height):
            for x in range(img.width):
                if mp[x, y]: px[x, y] = (0, 0, 0, 0)
    return out

def rot(layer, ang, piv):
    """Gira a camada em torno do pivô. ang > 0 = sentido horário na tela."""
    return layer.rotate(-ang, resample=Image.BICUBIC, center=piv)

def scale_x_about(layer, s, piv, ang=0):
    """Estica/encolhe ao longo de um eixo que passa pelo pivô (ang em graus, 0 = horizontal)."""
    if ang: layer = rot(layer, -ang, piv)
    px, py = piv
    out = layer.transform(layer.size, Image.AFFINE, (1 / s, 0, px - px / s, 0, 1, 0), resample=Image.BICUBIC)
    if ang: out = rot(out, ang, piv)
    return out

def place(canvas, layer, foot):
    """Cola a camada no canvas alinhando o pé âncora da imagem com ANC."""
    dx, dy = ANC[0] - foot[0], ANC[1] - foot[1]
    canvas.alpha_composite(layer, (dx, dy)) if dx >= 0 and dy >= 0 else canvas.alpha_composite(layer.crop((-min(dx, 0), -min(dy, 0), layer.width, layer.height)), (max(dx, 0), max(dy, 0)))

def main(cid):
    base = os.path.join('assets', 'sprites', cid); rig = RIGS[cid]
    meta = json.load(open(os.path.join(base, 'meta.json'))); k = 600 / meta['parado']['h'] * (meta['parado']['h'] / 360)  # px por unidade lógica = 600/360
    k = 600 / 360
    out_dir = os.path.join(base, 'anim'); os.makedirs(out_dir, exist_ok=True)
    frames = {}
    def save(nome, canvas):
        canvas.save(os.path.join(out_dir, nome + '.png')); frames.setdefault(nome.rsplit('_', 1)[0], []).append(nome)

    # ---------- PARADO: tronco + duas pernas ----------
    P = Image.open(os.path.join(base, 'parado.png')).convert('RGBA'); r = rig['parado']
    foot_p = (round(meta['parado']['footX'] * k), P.height)
    legF = part(P, r['perna_frente']); legB = part(P, r['perna_tras'])
    torso_poly = [(0, 0), (P.width, 0), (P.width, r['torso_y']), (0, r['torso_y'])]
    torso = part(P, torso_poly)
    if r['torso_extra']: torso.alpha_composite(part(P, r['torso_extra']))
    # pernas: remover o que pertence ao tronco (acima da linha) para não duplicar; manter sobreposição de 26px escondida atrás
    legF = rest(legF, [[(0, 0), (P.width, 0), (P.width, r['torso_y'] - 26), (0, r['torso_y'] - 26)]] + ([r['torso_extra']] if r['torso_extra'] else []))
    legB = rest(legB, [[(0, 0), (P.width, 0), (P.width, r['torso_y'] - 26), (0, r['torso_y'] - 26)]] + ([r['torso_extra']] if r['torso_extra'] else []))

    torso_alpha = np.array(torso)[:, :, 3] > 0
    def clip_leg(leg_l):
        a = np.array(leg_l); ys = np.arange(a.shape[0])[:, None]
        fora = (ys < r['torso_y']) & (~torso_alpha)
        a[:, :, 3] = np.where(fora, 0, a[:, :, 3]); return Image.fromarray(a)
    def compor(legF_l, legB_l, torso_l, bob=0, lean=0, hip=None):
        c = Image.new('RGBA', CANVAS, (0, 0, 0, 0))
        place(c, clip_leg(legB_l), foot_p); place(c, clip_leg(legF_l), foot_p)
        t = torso_l
        if lean: t = rot(t, lean, hip or r['pivot_hip'])
        if bob: t = t.transform(t.size, Image.AFFINE, (1, 0, 0, 0, 1, -bob))
        place(c, t, foot_p); return c

    # andar: 8 quadros, pernas alternando ±A graus em torno do quadril, tronco balançando
    A = 17
    for i in range(8):
        ph = i / 8 * 2 * math.pi; a = A * math.sin(ph)
        lf = rot(legF, a, r['piv_frente']); lb = rot(legB, -a, r['piv_tras'])
        bob = 7 * abs(math.sin(ph)); save('andar_%d' % i, compor(lf, lb, torso, bob=round(-bob), lean=2 * math.sin(ph)))
    # parado respirando: 4 quadros sutis
    for i in range(4):
        ph = i / 4 * 2 * math.pi; save('parado_%d' % i, compor(legF, legB, torso, bob=round(3 * math.sin(ph))))
    # pulo: pernas recolhidas
    lf = rot(legF, 28, r['piv_frente']); lb = rot(legB, -28, r['piv_tras'])
    save('pulo_0', compor(lf, lb, torso))
    lf = rot(legF, 10, r['piv_frente']); lb = rot(legB, -10, r['piv_tras']); save('pulo_1', compor(lf, lb, torso))
    # golpe sofrido: tronco para trás
    save('hit_0', compor(rot(legF, -4, r['piv_frente']), rot(legB, -4, r['piv_tras']), torso, lean=-13))
    save('hit_1', compor(legF, legB, torso, lean=-7))
    # vitória: pulinho com braços (tronco) subindo
    save('vitoria_0', compor(legF, legB, torso, bob=-10)); save('vitoria_1', compor(legF, legB, torso, bob=4))

    # ---------- SOCO: corpo + braço esticando ----------
    Sx = Image.open(os.path.join(base, 'soco.png')).convert('RGBA'); rs = rig['soco']
    foot_s = (round(meta['soco']['footX'] * k), Sx.height)
    braco = part(Sx, rs['braco']); corpo = rest(Sx, [rs['braco']])
    for i, s in enumerate([0.42, 0.72, 1.0, 0.8]):
        c = Image.new('RGBA', CANVAS, (0, 0, 0, 0)); place(c, corpo, foot_s); place(c, scale_x_about(braco, s, rs['piv_braco']), foot_s); save('soco_%d' % i, c)

    # ---------- CHUTE: corpo + perna girando ----------
    C = Image.open(os.path.join(base, 'chute.png')).convert('RGBA'); rc = rig['chute']
    foot_c = (round(meta['chute']['footX'] * k), C.height)
    perna = part(C, rc['perna']); efeito = part(C, rc['efeito']) if rc['efeito'] else None
    corpo_c = rest(C, [rc['perna'], rc['efeito']])
    for i, ang in enumerate([62, 30, 0, 22]):
        c = Image.new('RGBA', CANVAS, (0, 0, 0, 0)); place(c, corpo_c, foot_c); place(c, rot(perna, ang, rc['piv_perna']), foot_c)
        if efeito is not None and ang == 0: place(c, efeito, foot_c)
        save('chute_%d' % i, c)

    info = { 'canvas': CANVAS, 'anc': ANC, 'w': round(CANVAS[0] / k), 'h': round(CANVAS[1] / k), 'footX': round(ANC[0] / k), 'footY': round(ANC[1] / k), 'anims': frames }
    json.dump(info, open(os.path.join(out_dir, 'anim.json'), 'w'), indent=1)
    print(cid, {a: len(f) for a, f in frames.items()})

if __name__ == '__main__':
    main(sys.argv[1])
