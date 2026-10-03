"""Junta os meta.json de assets/sprites/*/ em assets/sprites/meta.js."""
import json, os, glob
out = {}
for p in sorted(glob.glob(os.path.join(os.path.dirname(__file__), "..", "assets", "sprites", "*", "meta.json"))):
    out[os.path.basename(os.path.dirname(p))] = json.load(open(p))
dest = os.path.join(os.path.dirname(__file__), "..", "assets", "sprites", "meta.js")
with open(dest, "w") as f:
    f.write("// Gerado por tools/build_meta.py. Largura/altura e âncora dos pés de cada pose.\nwindow.SPRITE_META = " + json.dumps(out, indent=1) + ";\n")
print("ok:", ", ".join(out))
