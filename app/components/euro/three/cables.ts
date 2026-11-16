// Patch cables: a coloured cable with a moulded plug on each end.

import * as THREE from 'three';

const PLUG_TOP = 23;   // where the cable leaves the plug, above the panel

export interface Cable {
  group: THREE.Group;
  // Puts the plug ends at `a` and `b` (panel surface points). `liftA` / `liftB`
  // raise a plug out of its jack, `fade` is the opacity.
  set(a: THREE.Vector3, b: THREE.Vector3, liftA: number, liftB: number, fade: number): void;
  dispose(): void;
}

export interface CableKit {
  create(color: string, seed: number): Cable;
  dispose(): void;
}

export function createCableKit(): CableKit {
  // Plug body from the jack nut up to the strain relief
  const profile = [[1.7, 2.9], [3.1, 3.2], [3.2, 4.2], [3.2, 13], [2.6, 17], [2, 18], [1.9, 22], [1.5, PLUG_TOP]]
    .map(([r, y]) => new THREE.Vector2(r, y));
  const plugGeometry = new THREE.LatheGeometry(profile, 20);
  const tipGeometry = new THREE.CylinderGeometry(1.7, 1.7, 2.4, 16).translate(0, 2.2, 0);
  const tipMaterial = new THREE.MeshStandardMaterial({ color: 0xd6d7da, roughness: 0.3, metalness: 1 });

  function create(color: string, seed: number): Cable {
    const material = new THREE.MeshStandardMaterial({ color, roughness: 0.5 });
    const group = new THREE.Group();
    const plugs = [0, 1].map(() => {
      const plug = new THREE.Group();
      const body = new THREE.Mesh(plugGeometry, material);
      body.castShadow = true;
      plug.add(body, new THREE.Mesh(tipGeometry, tipMaterial));
      group.add(plug);
      return plug;
    });
    const tube = new THREE.Mesh(new THREE.BufferGeometry(), material);
    tube.castShadow = true;
    group.add(tube);

    // Five points: out of each plug, over, and a slack middle that hangs to one side
    const points = [0, 1, 2, 3, 4].map(() => new THREE.Vector3());
    const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal');
    const along = new THREE.Vector3();
    // Each cable hangs a little differently, so they do not lie on top of each other
    const noise = (n: number) => (Math.sin(seed * n) * 43758.5453) % 1;
    const bow = noise(12.9898), slack = noise(78.233), lean = noise(37.719);
    let last = '';

    return {
      group,
      set(a, b, liftA, liftB, fade) {
        const key = `${a.x},${a.z},${b.x},${b.z},${liftA},${liftB}`;
        plugs[0].position.set(a.x, a.y + liftA, a.z);
        plugs[1].position.set(b.x, b.y + liftB, b.z);
        material.opacity = fade;
        material.transparent = fade < 1;
        group.visible = fade > 0;
        if (key === last || !group.visible) return;
        last = key;

        const span = Math.hypot(b.x - a.x, b.z - a.z);
        along.set(b.x - a.x, 0, b.z - a.z).divideScalar(span || 1);
        const lead = Math.min(6, span * 0.12);
        const topA = a.y + liftA + PLUG_TOP, topB = b.y + liftB + PLUG_TOP;
        points[0].set(a.x, topA - 0.5, a.z);
        points[1].set(a.x + along.x * lead, topA + 9 + span * 0.03, a.z + along.z * lead);
        points[3].set(b.x - along.x * lead, topB + 9 + span * 0.03, b.z - along.z * lead);
        points[4].set(b.x, topB - 0.5, b.z);
        // Long cables sag in the middle, short ones stand up in an arch
        const sag = Math.max(-4, 16 - span * (0.1 + slack * 0.03));
        const drift = bow * Math.min(26, span * 0.2);
        const shift = lean * Math.min(6, span * 0.08);
        points[2].set(
          (a.x + b.x) / 2 - along.z * drift + along.x * shift,
          Math.max(a.y, b.y) + (liftA + liftB) / 2 + PLUG_TOP + sag,
          (a.z + b.z) / 2 + along.x * drift + along.z * shift,
        );
        tube.geometry.dispose();
        tube.geometry = new THREE.TubeGeometry(curve, 56, 1.5, 8);
      },
      dispose() {
        tube.geometry.dispose();
        material.dispose();
      },
    };
  }

  return {
    create,
    dispose() {
      plugGeometry.dispose();
      tipGeometry.dispose();
      tipMaterial.dispose();
    },
  };
}
