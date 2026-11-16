// Builds module rows in 3D: a printed panel with its pen drawing, plus the
// hardware that sits in the holes (jack nuts, knobs, LEDs, buttons, screws).

import * as THREE from 'three';
import { PANEL_H, RACKS, layoutRack, type EuroModule, type RackSlot } from '@/lib/euro/modules';
import { drawPanel } from './faceplate';

export const PANEL_T = 2;   // printed panel thickness, mm

type Ring = [radius: number, y: number, fluted?: boolean];

// Solid of revolution. Repeat a ring to get a sharp edge. Fluted rings are
// pulled in `depth` (a fraction of the radius) between the ridges.
function lathe(rings: Ring[], segments: number, flutes = 0, depth = 0): THREE.BufferGeometry {
  const positions: number[] = [];
  const indices: number[] = [];
  for (const [radius, y, fluted] of rings) {
    for (let s = 0; s <= segments; s++) {
      const angle = (s / segments) * Math.PI * 2;
      const r = fluted ? radius * (1 - depth * (0.5 - 0.5 * Math.cos(flutes * angle)) ** 2) : radius;
      positions.push(Math.sin(angle) * r, y, Math.cos(angle) * r);
    }
  }
  const row = segments + 1;
  for (let i = 0; i < rings.length - 1; i++) {
    for (let s = 0; s < segments; s++) {
      const a = i * row + s, b = a + row;
      indices.push(a, a + 1, b, b, a + 1, b + 1);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function knobGeometry(radius: number, height: number, flutes: number) {
  const top = radius * 0.9;
  return lathe([
    [radius * 0.94, 0], [radius * 0.94, 0],
    [radius, 0.5, true], [top, height - 1, true], [top, height - 1, true],
    [top - 0.35, height - 0.25], [top - 0.9, height], [top - 0.9, height], [0, height],
  ], 72, flutes, 0.085);
}

export interface ModuleObject {
  module: EuroModule;
  group: THREE.Group;                 // origin: panel front, upper left corner; x right, z down the panel, y out
  jacks: Map<string, THREE.Vector3>;  // jack centres in the group
  leds: THREE.Mesh[];
  knobs: THREE.Object3D[];
}

export interface RackRow {
  group: THREE.Group;
  slots: RackSlot[];
  modules: ModuleObject[];
}

export interface RackKit {
  setFont(font: string): void;   // redraws the panels that were drawn with the fallback font
  buildRow(index: number): RackRow;
  ledOn: THREE.Material;
  ledOff: THREE.Material;
  dispose(): void;
}

export function createRackKit(renderer: THREE.WebGLRenderer): RackKit {
  const pxPerMm = Math.min(10, Math.floor(renderer.capabilities.maxTextureSize / PANEL_H));
  const anisotropy = renderer.capabilities.getMaxAnisotropy();
  let font = 'sans-serif';
  const panels = new Map<string, { texture: THREE.CanvasTexture; material: THREE.MeshStandardMaterial; module: EuroModule }>();

  const mats = {
    edge: new THREE.MeshStandardMaterial({ color: 0x101010, roughness: 0.8 }),
    steel: new THREE.MeshStandardMaterial({ color: 0xc2c4c8, roughness: 0.32, metalness: 1 }),
    hole: new THREE.MeshBasicMaterial({ color: 0x020202 }),
    knob: new THREE.MeshStandardMaterial({ color: 0x161616, roughness: 0.62 }),
    knobWhite: new THREE.MeshStandardMaterial({ color: 0xe9e6de, roughness: 0.68 }),
    markWhite: new THREE.MeshStandardMaterial({ color: 0xf2f0ea, roughness: 0.6 }),
    markDark: new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.6 }),
    button: new THREE.MeshStandardMaterial({ color: 0xe8e5dd, roughness: 0.55 }),
    screw: new THREE.MeshStandardMaterial({ color: 0x26262a, roughness: 0.42, metalness: 0.85 }),
    ledOn: new THREE.MeshStandardMaterial({ color: 0x500000, emissive: 0xff2412, emissiveIntensity: 1, roughness: 0.3 }),
    ledOff: new THREE.MeshStandardMaterial({ color: 0x6a0d0a, emissive: 0x2a0200, emissiveIntensity: 0.5, roughness: 0.18 }),
  };
  const geo = {
    // PJ301M-12 jack: nut on a threaded bushing
    jack: lathe([
      [3.95, 0], [3.95, 0], [4, 0.25], [4, 1.75], [3.8, 2.05], [3.8, 2.05],
      [3.05, 2.05], [3.05, 2.05], [3.05, 2.75], [3.05, 2.75], [2.75, 2.9], [1.85, 2.9], [1.85, 2.9], [1.85, 0.4],
    ], 40),
    jackHole: new THREE.CircleGeometry(1.86, 24),
    knob: knobGeometry(5, 11.5, 14),
    knobBig: knobGeometry(6.1, 12.5, 18),
    mark: new THREE.BoxGeometry(0.95, 0.3, 3.3),
    markBig: new THREE.BoxGeometry(1.1, 0.3, 4),
    led: lathe([[1.5, 0], [1.5, 0.5], [1.38, 1.1], [1.02, 1.62], [0.54, 1.92], [0, 2]], 20),
    button: lathe([[1.9, 0], [1.9, 0], [1.9, 2.2], [1.9, 2.2], [1.6, 2.5], [0, 2.5]], 28),
    // M3 socket head screw
    screw: lathe([
      [2.75, 0], [2.75, 0], [2.75, 2.6], [2.5, 3], [2.5, 3], [1.45, 3], [1.45, 3], [1.45, 1.1], [1.45, 1.1], [0, 1.1],
    ], 28),
  };

  function panelMaterial(module: EuroModule) {
    let panel = panels.get(module.id);
    if (!panel) {
      const texture = new THREE.CanvasTexture(drawPanel(module, font, pxPerMm));
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = anisotropy;
      panel = { texture, module, material: new THREE.MeshStandardMaterial({ map: texture, roughness: 0.82 }) };
      panels.set(module.id, panel);
    }
    return panel.material;
  }

  function mesh(parent: THREE.Object3D, geometry: THREE.BufferGeometry, material: THREE.Material, x: number, y: number, z: number, shadow = false) {
    const m = new THREE.Mesh(geometry, material);
    m.position.set(x, y, z);
    m.castShadow = shadow;
    parent.add(m);
    return m;
  }

  function buildModule(module: EuroModule): ModuleObject {
    const group = new THREE.Group();
    const object: ModuleObject = { module, group, jacks: new Map(), leds: [], knobs: [] };
    const { width } = module;

    const board = new THREE.Mesh(
      new THREE.BoxGeometry(width, PANEL_T, PANEL_H),
      [mats.edge, mats.edge, panelMaterial(module), mats.edge, mats.edge, mats.edge],
    );
    board.position.set(width / 2, -PANEL_T / 2, PANEL_H / 2);
    board.castShadow = board.receiveShadow = true;
    group.add(board);

    // Knob positions are repeatable per module
    let turn = module.id.length * 1.7;
    for (const hole of module.holes) {
      const { x, y: z } = hole;
      if (hole.kind === 'jack') {
        mesh(group, geo.jack, mats.steel, x, 0, z, true);
        mesh(group, geo.jackHole, mats.hole, x, 0.45, z).rotation.x = -Math.PI / 2;
        object.jacks.set(hole.id!, new THREE.Vector3(x, 0, z));
      } else if (hole.kind === 'pot') {
        const big = module.big.includes(hole.id!);
        const knob = new THREE.Group();
        knob.position.set(x, 0.9, z);
        turn += 2.4;
        knob.rotation.y = Math.sin(turn) * 2.2;
        mesh(knob, big ? geo.knobBig : geo.knob, big ? mats.knobWhite : mats.knob, 0, 0, 0, true);
        mesh(knob, big ? geo.markBig : geo.mark, big ? mats.markDark : mats.markWhite, 0, big ? 12.42 : 11.42, big ? -2.6 : -2.1);
        group.add(knob);
        object.knobs.push(knob);
      } else if (hole.kind === 'led') {
        object.leds.push(mesh(group, geo.led, mats.ledOff, x, -0.5, z));
      } else if (hole.kind === 'button') {
        mesh(group, geo.button, mats.button, x, -0.3, z, true);
      } else if (hole.kind === 'screw') {
        mesh(group, geo.screw, mats.screw, x, 0, z, true).rotation.y = x + z;
      }
    }
    return object;
  }

  return {
    ledOn: mats.ledOn,
    ledOff: mats.ledOff,

    setFont(next) {
      if (next === font) return;
      font = next;
      for (const panel of panels.values()) {
        panel.texture.image = drawPanel(panel.module, font, pxPerMm);
        panel.texture.needsUpdate = true;
      }
    },

    buildRow(index) {
      const slots = layoutRack(RACKS[index % RACKS.length]);
      const group = new THREE.Group();
      const modules = slots.map(slot => {
        const object = buildModule(slot.module);
        object.group.position.x = slot.x;
        group.add(object.group);
        return object;
      });
      return { group, slots, modules };
    },

    dispose() {
      Object.values(geo).forEach(geometry => geometry.dispose());
      Object.values(mats).forEach(material => material.dispose());
      panels.forEach(panel => { panel.texture.dispose(); panel.material.dispose(); });
    },
  };
}

// Frees the panel boards of a row (the other geometry belongs to the kit).
export function disposeRow(row: RackRow) {
  for (const object of row.modules) (object.group.children[0] as THREE.Mesh).geometry.dispose();
}
