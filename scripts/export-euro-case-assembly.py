"""Exports where every printed case part sits in the assembled case layouts.

Reads the FreeCAD assemblies of the Eurorack hardware repo and matches each
object to its print file in public/case/stl, so the website can show the real
STL files in their assembled position. Writes lib/euro/case-assembly.json.

  EURO_REPO=<path to the Eurorack hardware repo> freecadcmd scripts/export-euro-case-assembly.py

Matrices are 3 x 4, row by row, from the print file to the case frame (mm,
X across, Y front to back, Z up).
"""
import json
import math
import os
import struct
import sys
from pathlib import Path

import FreeCAD as App
import numpy as np

SITE = Path(os.environ.get('SITE') or Path(__file__).resolve().parent.parent)
CAD = Path(os.environ['EURO_REPO']) / 'mechanical/case/cad'
STL = SITE / 'public/case/stl'

# object name in the assemblies -> print file
PARTS = [
    ('bottom_plate', 'bottom-plate'), ('rail_front', 'rail'), ('rail_back', 'rail'),
    ('side_panel_left', 'side-panel-left'), ('side_panel_right', 'side-panel-right'),
    ('middle_frame', 'middle-frame'), ('fused_left', 'fused-side-left'),
    ('fused_middle', 'fused-middle'), ('fused_right', 'fused-side-right'),
    ('joiner_left', 'joiner-left'), ('joiner_right', 'joiner-right'), ('top_brace', 'top-brace-6hp'),
    ('cable_holder_panel', 'cable-holder-cover'), ('holder_left', 'cable-holder-comb-60'),
    ('holder_right', 'cable-holder-comb-60'),
]


def stl_points(name):
    data = (STL / f'{name}.stl').read_bytes()
    count = struct.unpack_from('<I', data, 80)[0]
    tris = np.frombuffer(data, dtype=np.dtype([('n', '<f4', 3), ('v', '<f4', (3, 3)), ('a', '<u2')]), count=count, offset=84)
    return np.unique(tris['v'].reshape(-1, 3).astype(np.float64).round(4), axis=0)


def rot(axis, deg):
    c, s = math.cos(math.radians(deg)), math.sin(math.radians(deg))
    return np.array({'x': [[1, 0, 0], [0, c, -s], [0, s, c]],
                     'y': [[c, 0, s], [0, 1, 0], [-s, 0, c]],
                     'z': [[c, -s, 0], [s, c, 0], [0, 0, 1]]}[axis])


def candidates():
    """Rotations that undo the print poses: turned flat on the bed, about Z to fit it
    diagonally, and the 60 degree tilt of an upper row."""
    for tilt in (0, 60):
        for side in (0, 90, -90):
            for turn in range(0, 360, 1) if side else (0,):
                yield rot('x', tilt) @ rot('y', side) @ rot('z', -turn)
    for half in range(0, 720):          # covers and combs: turned about X only
        yield rot('x', half / 2)


def nearest(points, cloud):
    out = np.empty(len(points))
    for i in range(0, len(points), 256):
        d = points[i:i + 256, None, :] - cloud[None, :, :]
        out[i:i + 256] = np.sqrt((d * d).sum(axis=2)).min(axis=1)
    return out


def match(shape, cloud, label):
    box = shape.optimalBoundingBox(False, False)
    lo = np.array([box.XMin, box.YMin, box.ZMin])
    size = np.array([box.XLength, box.YLength, box.ZLength])
    corners = np.array([[v.X, v.Y, v.Z] for v in shape.Vertexes])
    best = None
    for r in candidates():
        turned = cloud @ r.T
        if np.abs(turned.max(axis=0) - turned.min(axis=0) - size).max() > 0.4:
            continue
        t = lo - turned.min(axis=0)
        err = nearest(corners, turned + t).max()
        if best is None or err < best[0]:
            best = (err, r, t)
        if err < 0.05:
            break
    assert best and best[0] < 0.2, f'{label}: no pose found ({best and best[0]})'
    return np.hstack([best[1], best[2][:, None]])


def flat(m):
    return [round(float(v), 4) + 0.0 for v in m.reshape(-1)]


def compose(a, b):
    return np.hstack([a[:, :3] @ b[:, :3], (a[:, :3] @ b[:, 3] + a[:, 3])[:, None]])


def inverse(m):
    r = m[:, :3].T
    return np.hstack([r, (-r @ m[:, 3])[:, None]])


clouds = {name: stl_points(name) for name in sorted({part for _, part in PARTS})}


def read(doc_name):
    doc = App.openDocument(str(CAD / f'{doc_name}.FCStd'))
    found = {}
    for obj in doc.Objects:
        if not hasattr(obj, 'Shape') or obj.Shape.isNull():
            continue
        part = next((p for suffix, p in PARTS if obj.Name.endswith(suffix)), None)
        if part:
            found[obj.Name] = (part, match(obj.Shape, clouds[part], f'{doc_name}/{obj.Name}'))
            print(f'{doc_name}/{obj.Name} -> {part}.stl', file=sys.stderr)
    App.closeDocument(doc.Name)
    return found


single = read('assembly')
plate = single['bottom_plate'][1]


def layout(doc_name):
    """Case frames (from the bottom plates) and the parts the cases share."""
    found = read(doc_name)
    cases, parts = [], []
    for name, (part, m) in found.items():
        if part == 'bottom-plate':
            cases.append({'name': name[:-len('bottom_plate')].rstrip('_'), 'm': flat(compose(m, inverse(plate)))})
        elif part != 'rail':
            parts.append({'part': part, 'm': flat(m)})
    return found, {'cases': cases, 'parts': parts}


out = {'case': {'bottom-plate': flat(plate), 'rail': [flat(single['rail_front'][1]), flat(single['rail_back'][1])]}, 'layouts': {}}
out['layouts']['single'] = layout('assembly')[1]
out['layouts']['double'] = layout('double-case-assembly')[1]
out['layouts']['angled'] = layout('angle-joiner-assembly')[1]
out['layouts']['quad'] = layout('quad-case-assembly')[1]
out['layouts']['studio'] = layout('quad-case-on-stand')[1]


def double_tier():
    """Two double rows on the stand plates. There is no CAD assembly of it: the lower row is the
    double case, the upper row the same one moved like the upper case of the single-width stand,
    and the plates are the ones of the double-width stand."""
    def m(entry):
        return np.array(entry['m']).reshape(3, 4)
    double, studio = out['layouts']['double'], out['layouts']['studio']
    up = m(out['layouts']['angled']['cases'][1])
    cases = [{'name': f'{row}_{c["name"]}', 'm': flat(compose(lift, m(c)))}
             for row, lift in (('lower', np.eye(4)[:3]), ('upper', up)) for c in double['cases']]
    parts = [dict(p) for p in double['parts']]
    parts += [{'part': p['part'], 'm': flat(compose(up, m(p)))} for p in double['parts']]
    parts += [dict(p) for p in studio['parts'] if p['part'].startswith('joiner')]
    return {'cases': cases, 'parts': parts}


out['layouts']['double-tier'] = double_tier()
out['brace'] = flat(read('middle-braced-assembly')['top_brace'][1])
holder = read('cable-holder-assembly')
out['cable'] = {'cable-holder-cover': flat(holder['cable_holder_panel'][1]),
                'cable-holder-comb-60': [flat(holder['holder_left'][1]), flat(holder['holder_right'][1])]}

text = json.dumps(out).replace('{"name"', '\n{"name"').replace('{"part"', '\n{"part"').replace('"layouts"', '\n"layouts"')
(SITE / 'lib/euro/case-assembly.json').write_text(text + '\n')
print('wrote lib/euro/case-assembly.json', file=sys.stderr)
