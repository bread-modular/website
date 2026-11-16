// The 3D printed case, built from the real STL print files. Each part is put
// where the CAD assemblies have it (lib/euro/case-assembly.json, written by
// scripts/export-euro-case-assembly.py).

import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { toCreasedNormals } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import assemblyData from '@/lib/euro/case-assembly.json';
import {
  RAIL_SOCKETS, STL_BASE, getCaseLayout, normalizeCaseConfig,
  type CaseConfig, type CaseTag, type LayoutId, type PartId,
} from '@/lib/euro/case';
import { PANEL_H } from '@/lib/euro/modules';
import { PANEL_T } from './rack';

type Pose = number[];   // 3 x 4 matrix, row by row, in the CAD frame (X across, Y front to back, Z up)

interface Assembly {
  case: { 'bottom-plate': Pose; rail: Pose[] };
  layouts: Record<LayoutId, { cases: { name: string; m: Pose }[]; parts: { part: PartId; m: Pose }[] }>;
  brace: Pose;
  cable: { 'cable-holder-cover': Pose; 'cable-holder-comb-60': Pose[] };
}

const ASSEMBLY = assemblyData as unknown as Assembly;

const INNER_W = 218.7;    // between the side panels
const CASE_TOP = 65;      // rail side of the module panels, above the desk
const ROW_X = 5.33;       // first module's left edge: the 1 HP lip plus half the play
const COVER_FRONT: Pose = [1, 0, 0, -2.7, 0, 0, -1, 2.2, 0, 1, 0, 3.3];
const COVER_BACK: Pose = [1, 0, 0, -2.7, 0, 0, -1, 128.3, 0, 1, 0, 3.3];
const COMB_SHIFT = 54;    // from the left position to the middle of the cover

// Hardware positions in a case, from the case generator of the hardware repo
const RAIL_Y = [3, 125.5];          // module hole lines = rail centre lines
const RAIL_MID_Z = 56.65;
const SOCKET_X0 = 7.75;             // first module socket in a rail
const SOCKET_PITCH = 10.16;         // 2 HP
const BOLT_Y = [25, 103.5];         // bottom plate screws, and the stand plate sockets
const STAND_Z = [25, 45];

const geometries = new Map<PartId, Promise<THREE.BufferGeometry>>();

function loadPart(id: PartId): Promise<THREE.BufferGeometry> {
  let geometry = geometries.get(id);
  if (!geometry) {
    geometry = new STLLoader().loadAsync(`${STL_BASE}/${id}.stl`).then(loaded => {
      // Round the holes and fillets; the big meshes stay faceted to keep this quick
      const triangles = loaded.getAttribute('position').count / 3;
      return triangles < 20000 ? toCreasedNormals(loaded, 0.6) : loaded;
    });
    geometry.catch(() => geometries.delete(id));
    geometries.set(id, geometry);
  }
  return geometry;
}

function toMatrix(m: Pose) {
  return new THREE.Matrix4().set(m[0], m[1], m[2], m[3], m[4], m[5], m[6], m[7], m[8], m[9], m[10], m[11], 0, 0, 0, 1);
}

export interface CaseSlot {
  mount: THREE.Group;   // add a module row here: x across, z down the panels, y out of them
  index: number;
}

// Something that can be moved on its own: a whole case, or a part the cases
// share. The key is the same for the same thing in the same place in another layout.
export interface CasePiece {
  key: string;
  lift: THREE.Group;    // position.z lifts it straight up
}

// A printed part. The matrices are in the CAD frame of the model.
export interface CasePart {
  id: PartId;
  mesh: THREE.Mesh;
  parent: THREE.Matrix4;   // what the mesh hangs on
  home: THREE.Matrix4;     // its place in the built case
}

// The spacers or screws of one kind in a case
export interface CaseHardware {
  mesh: THREE.InstancedMesh;
  parent: THREE.Matrix4;
  homes: THREE.Matrix4[];          // place of each one in the built case
  owners: (CasePart | null)[];     // the printed part each one sits in: it moves with that part
}

export interface CaseModel {
  config: CaseConfig;
  root: THREE.Group;    // centred, standing on y = 0
  cad: THREE.Group;     // the CAD frame: X across, Y front to back, Z up
  slots: CaseSlot[];
  pieces: CasePiece[];
  meshes: THREE.Mesh[]; // every mesh, with userData.tag
  parts: CasePart[];
  hardware: CaseHardware[];
  bounds: THREE.Box3;
}

function partTag(id: PartId): CaseTag {
  if (id.startsWith('joiner')) return 'stand';
  if (id.includes('middle')) return 'middle';
  if (id.includes('side')) return 'side';
  if (id === 'cable-holder-cover') return 'cable-cover';
  if (id === 'cable-holder-comb-60') return 'cable-comb';
  if (id === 'top-brace-6hp') return 'brace';
  if (id === 'rail') return 'rail';
  if (id === 'bottom-plate') return 'bottom';
  return 'cover';
}

// Bounding box from the vertices (a sample of them on the big meshes). The
// boxes of the print files are no use here: many parts are printed turned.
function measure(root: THREE.Object3D): THREE.Box3 {
  const box = new THREE.Box3();
  const point = new THREE.Vector3();
  root.traverse(object => {
    const mesh = object as THREE.Mesh;
    if (!mesh.isMesh) return;
    const position = mesh.geometry.getAttribute('position');
    const step = Math.max(1, Math.floor(position.count / 4000));
    for (let i = 0; i < position.count; i += step) {
      box.expandByPoint(point.fromBufferAttribute(position, i).applyMatrix4(mesh.matrixWorld));
    }
  });
  return box;
}

// The printed part a point of the built case is in: the one with the nearest vertex
function nearestPart(point: THREE.Vector3, parts: CasePart[]): CasePart | null {
  let nearest: CasePart | null = null;
  let best = Infinity;
  const local = new THREE.Vector3();
  const vertex = new THREE.Vector3();
  const inverse = new THREE.Matrix4();
  for (const part of parts) {
    local.copy(point).applyMatrix4(inverse.copy(part.home).invert());
    const position = part.mesh.geometry.getAttribute('position');
    const step = 3 * Math.max(1, Math.floor(position.count / 9000));   // one vertex of a triangle
    for (let i = 0; i < position.count; i += step) {
      const distance = vertex.fromBufferAttribute(position, i).distanceToSquared(local);
      if (distance < best) {
        best = distance;
        nearest = part;
      }
    }
  }
  return nearest;
}

export interface CaseKit {
  body: THREE.MeshStandardMaterial;    // the printed parts: set its colour
  accent: THREE.MeshStandardMaterial;  // highlighted printed parts
  brass: THREE.MeshStandardMaterial;   // spacers
  steel: THREE.MeshStandardMaterial;   // screws
  build(config: CaseConfig): Promise<CaseModel>;
  // Shows only the tagged parts in `show` (null: everything) and highlights the ones in `focus`.
  applyView(model: CaseModel, show: CaseTag[] | null, focus: CaseTag[]): void;
  dispose(): void;
}

function partsFor(config: CaseConfig): PartId[] {
  const layout = ASSEMBLY.layouts[config.layout];
  const ids = new Set<PartId>(['bottom-plate', 'rail', `cover-${config.front}`, `cover-${config.back}`]);
  layout.parts.forEach(p => ids.add(p.part));
  if (getCaseLayout(config.layout).braces) ids.add('top-brace-6hp');
  if (config.cable) ids.add('cable-holder-cover').add('cable-holder-comb-60');
  return [...ids];
}

export function createCaseKit(): CaseKit {
  const body = new THREE.MeshStandardMaterial({ color: 0x1b1b1d, roughness: 0.7, metalness: 0.02 });
  const accent = new THREE.MeshStandardMaterial({ color: 0xff7a1a, roughness: 0.6, emissive: 0xff7a1a, emissiveIntensity: 0.12 });
  const board = new THREE.MeshStandardMaterial({ color: 0x0b2216, roughness: 0.6 });
  const header = new THREE.MeshStandardMaterial({ color: 0x0c0c0c, roughness: 0.5 });
  const brass = new THREE.MeshStandardMaterial({ color: 0xc9a24a, roughness: 0.35, metalness: 0.9 });
  const steel = new THREE.MeshStandardMaterial({ color: 0x2a2a2e, roughness: 0.42, metalness: 0.85 });
  // Highlighted hardware shows through the printed parts: most of it sits inside them
  const xray = new THREE.MeshStandardMaterial({ color: 0xff6a00, emissive: 0xff6a00, emissiveIntensity: 0.45, roughness: 0.5, depthTest: false, transparent: true });
  const boardGeometry = new THREE.BoxGeometry(205, 32, 1.6);
  const headerGeometry = new THREE.BoxGeometry(19, 9.5, 8.5);
  // M3 x 10 hex spacer and a socket screw head, both along Y
  const spacerGeometry = new THREE.CylinderGeometry(3.18, 3.18, 10, 6);
  const screwGeometry = new THREE.CylinderGeometry(2.75, 2.75, 3, 20);
  const alongX = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2);
  const alongZ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2);
  const one = new THREE.Vector3(1, 1, 1);

  async function build(input: CaseConfig): Promise<CaseModel> {
    const config = normalizeCaseConfig(input);
    const ids = partsFor(config);
    const loaded = await Promise.all(ids.map(loadPart));
    const geometry = (id: PartId) => loaded[ids.indexOf(id)];
    const layout = ASSEMBLY.layouts[config.layout];
    const { tilted, braces } = getCaseLayout(config.layout);
    const hasRearRow = layout.cases.some(entry => entry.name.includes('upper_rear'));

    // Everything below is in the CAD frame; this group turns it upright for three.js
    const cad = new THREE.Group();
    cad.rotation.x = -Math.PI / 2;
    const meshes: THREE.Mesh[] = [];
    const pieces: CasePiece[] = [];
    const parts: CasePart[] = [];
    const fittings: CaseHardware[] = [];

    const keep = <T extends THREE.Mesh>(mesh: T, tag: CaseTag, hardware = false): T => {
      mesh.userData = { tag, base: mesh.material, hardware };
      meshes.push(mesh);
      return mesh;
    };
    const piece = (key: string) => {
      const lift = new THREE.Group();
      cad.add(lift);
      pieces.push({ key, lift });
      return lift;
    };
    // A piece's group stays where it is here, so a frame's own matrix is its place in the CAD frame
    const place = (parent: THREE.Object3D, id: PartId, pose: THREE.Matrix4) => {
      const mesh = keep(new THREE.Mesh(geometry(id), body), partTag(id));
      mesh.matrixAutoUpdate = false;
      mesh.matrix.copy(pose);
      mesh.castShadow = mesh.receiveShadow = true;
      parent.add(mesh);
      const part: CasePart = { id, mesh, parent: parent.matrix.clone(), home: parent.matrix.clone().multiply(pose) };
      parts.push(part);
      return part;
    };
    const block = (parent: THREE.Object3D, shape: THREE.BufferGeometry, material: THREE.Material, x: number, y: number, z: number) => {
      const mesh = keep(new THREE.Mesh(shape, material), 'bus');
      mesh.position.set(x, y, z);
      parent.add(mesh);
    };
    // Spacers or screw heads of one kind in a case, as one mesh. `owner` names the part a spacer is glued into.
    type Owner = (local: THREE.Vector3, point: THREE.Vector3) => CasePart | null;   // in its case, and in the CAD frame
    const hardware = (parent: THREE.Object3D, tag: CaseTag, axis: THREE.Quaternion, points: [number, number, number][], owner?: Owner) => {
      if (!points.length) return;
      const screw = tag.startsWith('screw');
      const mesh = keep(new THREE.InstancedMesh(screw ? screwGeometry : spacerGeometry, screw ? steel : brass, points.length), tag, true);
      mesh.frustumCulled = false;   // they move with their parts
      const fitting: CaseHardware = { mesh, parent: parent.matrix.clone(), homes: [], owners: [] };
      const pose = new THREE.Matrix4();
      points.forEach(([x, y, z], i) => {
        mesh.setMatrixAt(i, pose.compose(new THREE.Vector3(x, y, z), axis, one));
        const home = parent.matrix.clone().multiply(pose);
        fitting.homes.push(home);
        fitting.owners.push(owner ? owner(new THREE.Vector3(x, y, z), new THREE.Vector3().setFromMatrixPosition(home)) : null);
      });
      parent.add(mesh);
      fittings.push(fitting);
    };

    const panels = layout.parts.map(part => place(piece(`${part.part}:${part.m.join()}`), part.part, toMatrix(part.m)))
      .filter(part => part.mesh.userData.tag === 'side' || part.mesh.userData.tag === 'middle');
    const inPanel: Owner = (_, point) => nearestPart(point, panels);

    const slots: CaseSlot[] = [];
    layout.cases.forEach((entry, index) => {
      const frame = new THREE.Group();
      frame.matrixAutoUpdate = false;
      frame.matrix.copy(toMatrix(entry.m));
      piece(`case:${entry.m.join()}`).add(frame);

      place(frame, 'bottom-plate', toMatrix(ASSEMBLY.case['bottom-plate']));
      const rails = ASSEMBLY.case.rail.map(rail => place(frame, 'rail', toMatrix(rail)));
      const inRail: Owner = local => rails[local.y < PANEL_H / 2 ? 0 : 1];

      // The cable holder goes on the back of the top row
      const upper = entry.name.startsWith('upper');
      const holder = config.cable && upper && (!hasRearRow || entry.name.includes('rear'));
      // The two rows of a fused set have no covers between them
      const openBack = entry.name.includes('front');
      if (!entry.name.includes('rear')) place(frame, `cover-${config.front}` as PartId, toMatrix(COVER_FRONT));
      if (holder) {
        place(frame, 'cable-holder-cover', toMatrix(ASSEMBLY.cable['cable-holder-cover']));
        const comb = toMatrix(ASSEMBLY.cable['cable-holder-comb-60'][0]);
        place(frame, 'cable-holder-comb-60', new THREE.Matrix4().makeTranslation(COMB_SHIFT, 0, 0).multiply(comb));
      } else if (!openBack) {
        place(frame, `cover-${config.back}` as PartId, toMatrix(COVER_BACK));
      }
      if (braces && entry.name.endsWith('left')) place(frame, 'top-brace-6hp', toMatrix(ASSEMBLY.brace));

      // Spacers and screws. A case in a wider row has an outer side panel on one side only.
      const sides = [
        ...(entry.name.endsWith('right') ? [] : [-1]),
        ...(entry.name.endsWith('left') ? [] : [1]),
      ];
      const out = (side: number, d: number) => (side < 0 ? -d : INNER_W + d);   // d mm outside the inner face
      const each = <T,>(a: T[], b: number[]) => a.flatMap(x => b.map(y => [x, y] as [T, number]));
      const sockets = Array.from({ length: RAIL_SOCKETS }, (_, k) => SOCKET_X0 + k * SOCKET_PITCH);
      hardware(frame, 'spacer-top', alongZ, each(sockets, RAIL_Y).map(([x, y]) => [x, y, CASE_TOP - 1.6 - 5.2]), inRail);
      hardware(frame, 'spacer-end', alongX, each(sides, RAIL_Y).map(([side, y]) => [out(side, 2.8), y, RAIL_MID_Z]), inRail);
      hardware(frame, 'screw-rail', alongX, each(sides, RAIL_Y).map(([side, y]) => [out(side, 13.5), y, RAIL_MID_Z]));
      hardware(frame, 'spacer-bottom', alongZ, each([-1, 1], BOLT_Y).map(([side, y]) => [out(side, 6), y, 10.1]), inPanel);
      hardware(frame, 'screw-bottom', alongZ, each([-1, 1], BOLT_Y).map(([side, y]) => [out(side, 6), y, 1.6]));
      if (tilted && !entry.name.includes('rear')) {
        const holes = sides.flatMap(side => each(BOLT_Y, STAND_Z).map(([y, z]) => [side, y, z]));
        hardware(frame, 'spacer-stand', alongX, holes.map(([side, y, z]) => [out(side, 5.2), y, z]), inPanel);
        hardware(frame, 'screw-stand', alongX, holes.map(([side, y, z]) => [out(side, 15.5), y, z]));
      }

      // Bus board with its power headers
      block(frame, boardGeometry, board, INNER_W / 2, PANEL_H / 2, 6.6);
      for (let i = 0; i < 8; i++) block(frame, headerGeometry, header, INNER_W / 2 + (i - 3.5) * 24.6, PANEL_H / 2, 11.6);

      const mount = new THREE.Group();
      mount.rotation.x = Math.PI / 2;
      mount.position.set(ROW_X, PANEL_H, CASE_TOP - 1.6 + PANEL_T);
      frame.add(mount);
      slots.push({ mount, index });
    });

    // Centre it. The CAD assemblies already stand on Z = 0.
    const root = new THREE.Group();
    root.add(cad);
    root.updateMatrixWorld(true);
    const centre = measure(root).getCenter(new THREE.Vector3());
    cad.position.set(-centre.x, 0, -centre.z);
    root.updateMatrixWorld(true);
    return { config, root, cad, slots, pieces, meshes, parts, hardware: fittings, bounds: measure(root) };
  }

  return {
    body,
    accent,
    brass,
    steel,
    build,
    applyView(model, show, focus) {
      for (const mesh of model.meshes) {
        const { tag, base, hardware } = mesh.userData as { tag: CaseTag; base: THREE.Material; hardware: boolean };
        const focused = focus.includes(tag);
        mesh.visible = !show || show.includes(tag);
        mesh.material = focused ? (hardware ? xray : accent) : base;
        mesh.renderOrder = focused && hardware ? 5 : 0;
      }
    },
    dispose() {
      // The STL geometry stays cached for the next visit; this frees its GPU buffers
      geometries.forEach(geometry => geometry.then(g => g.dispose()).catch(() => {}));
      [body, accent, board, header, brass, steel, xray].forEach(material => material.dispose());
      [boardGeometry, headerGeometry, spacerGeometry, screwGeometry].forEach(shape => shape.dispose());
    },
  };
}
