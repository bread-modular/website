// Shows a case model the way a step of the assembly guide needs it: the printed
// parts on print beds, parts on the table with their spacers in, the hardware to
// order, or the case as far as it is built. Parts move from one to the next.

import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { getCaseOrder, type CaseArrange, type CaseTag, type PartId } from '@/lib/euro/case';
import type { CaseKit, CaseModel, CasePart } from './case';

const BED = 256;          // print bed, mm
const BED_EDGE = 3;       // kept free along its edges
const BED_GAP = 30;       // between two beds
const PART_GAP = 5;       // between two parts on a bed
const TABLE_GAP = 16;     // between two parts on the table
const MOVE_TIME = 0.9;    // seconds a part takes to its new place
const MOVE_LIFT = 40;     // mm it rises on the way
const LOWER_FROM = 70;    // mm above its place a part that is lowered in starts

// Hardware to order: one of each item, with how many to get
const KIT_CELL = { width: 46, depth: 32 };
const KIT_LABEL = 12;     // mm of a cell kept free for its label
const LABEL_PX = 12;

// Parts of a kind lie together, in the order they are used
const PART_ORDER = ['side-panel', 'middle-frame', 'fused', 'rail', 'bottom-plate', 'cover', 'cable-holder-cover', 'joiner', 'top-brace', 'cable-holder-comb'];
const rank = (id: PartId) => PART_ORDER.findIndex(prefix => id.startsWith(prefix));

export interface StepView {
  show: CaseTag[] | null;   // null: everything
  focus: CaseTag[];
  arrange: CaseArrange;
}

// What the layouts need to know of the screen they are made for
export interface StepScreen {
  font: string;
  width: number;    // px
  aspect: number;   // width to height of the room the view gets
  pixel: number;    // the size of a pixel, one unit away from the camera
}

export interface StepStage {
  // Returns the space the view takes once everything is in place, around the model's root
  apply(model: CaseModel, view: StepView, screen: StepScreen): THREE.Box3;
  resize(model: CaseModel, screen: StepScreen): void;
  animate(model: CaseModel, dt: number): void;
  release(model: CaseModel): void;
}

interface Pose {
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
}

// A printed part on its way. Poses are in the CAD frame.
interface Mover {
  part: CasePart;
  local: THREE.Matrix4;           // the mesh's own matrix in the built case
  parentInverse: THREE.Matrix4;
  home: Pose;
  from: Pose;
  to: Pose;
  built: boolean;                 // on its way to its place in the case
  lowered: boolean;               // comes straight down onto the case
  now: THREE.Matrix4;
}

// Spacers that sit in a part and move with it
interface Follower {
  mesh: THREE.InstancedMesh;
  parentInverse: THREE.Matrix4;
  items: { index: number; mover: Mover; inPart: THREE.Matrix4 }[];
}

interface Label {
  sprite: THREE.Sprite;
  width: number;    // px
  height: number;
  dispose(): void;
}

// What a step lays out on the floor
interface Extra {
  group: THREE.Group;
  bounds: THREE.Box3;
  spots?: Map<CasePart, THREE.Vector3>;
  labels: Label[];
  dispose(): void;
}

interface State {
  movers: Mover[];
  followers: Follower[];
  progress: number;   // 1: everything is in place
  applied: boolean;
  extras: Partial<Record<CaseArrange, Extra>>;
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);
const newPose = (): Pose => ({ position: new THREE.Vector3(), quaternion: new THREE.Quaternion() });

interface Placed {
  bin: number;
  x: number;
  y: number;
}

// Shelf packing: fills a bin row by row, in the given order
function pack(sizes: { w: number; h: number }[], width: number, height: number, gap: number): Placed[] {
  const bins: { y: number; h: number; x: number }[][] = [];
  return sizes.map(({ w, h }) => {
    for (let b = 0; ; b++) {
      const shelves = (bins[b] ??= []);
      const last = shelves[shelves.length - 1];
      for (const shelf of shelves) {
        const fitsHeight = h <= shelf.h || (shelf === last && shelf.y + h <= height);   // the last row can still get taller
        if (shelf.x + w <= width && fitsHeight) {
          const placed = { bin: b, x: shelf.x, y: shelf.y };
          shelf.x += w + gap;
          shelf.h = Math.max(shelf.h, h);
          return placed;
        }
      }
      const y = last ? last.y + last.h + gap : 0;
      if (!last || y + h <= height) {
        shelves.push({ y, h, x: w + gap });
        return { bin: b, x: 0, y };
      }
    }
  });
}

// Of several ways to lay things out on the floor, the one that gets largest on a
// screen that looks at it from a little above
function largest<T extends { width: number; depth: number }>(screen: StepScreen, options: T[]): T {
  const size = (option: T) => Math.min(screen.aspect / option.width, 1 / (option.depth * 0.85));
  return options.reduce((best, option) => (size(option) > size(best) ? option : best));
}

function partSize(part: CasePart): THREE.Vector3 {
  const geometry = part.mesh.geometry;
  if (!geometry.boundingBox) geometry.computeBoundingBox();
  return geometry.boundingBox!.getSize(new THREE.Vector3());   // the print files start at the origin
}

export function createStepStage(caseKit: CaseKit): StepStage {
  const states = new WeakMap<CaseModel, State>();
  const one = new THREE.Vector3(1, 1, 1);
  const scale = new THREE.Vector3();
  const pose = newPose();
  const matrix = new THREE.Matrix4();
  const normal = new THREE.Vector3();

  function stateOf(model: CaseModel): State {
    let state = states.get(model);
    if (state) return state;
    const movers = model.parts.map((part): Mover => {
      const home = newPose();
      part.home.decompose(home.position, home.quaternion, scale);
      return {
        part,
        local: part.mesh.matrix.clone(),
        parentInverse: part.parent.clone().invert(),
        home,
        from: { position: home.position.clone(), quaternion: home.quaternion.clone() },
        to: { position: home.position.clone(), quaternion: home.quaternion.clone() },
        built: true,
        lowered: false,
        now: part.home.clone(),
      };
    });
    const followers = model.hardware.map((hardware): Follower => ({
      mesh: hardware.mesh,
      parentInverse: hardware.parent.clone().invert(),
      items: hardware.owners.flatMap((owner, index) => {
        const mover = movers.find(m => m.part === owner);
        return mover ? [{ index, mover, inPart: owner!.home.clone().invert().multiply(hardware.homes[index]) }] : [];
      }),
    })).filter(follower => follower.items.length);
    state = { movers, followers, progress: 1, applied: false, extras: {} };
    states.set(model, state);
    return state;
  }

  // Where a part is at this point of its way
  function poseAt(mover: Mover, progress: number, out: Pose) {
    const t = easeInOut(progress);
    out.position.lerpVectors(mover.from.position, mover.to.position, t);
    if (!mover.lowered) out.position.z += Math.sin(t * Math.PI) * MOVE_LIFT * Math.min(1, mover.from.position.distanceTo(mover.to.position) / 80);
    out.quaternion.slerpQuaternions(mover.from.quaternion, mover.to.quaternion, t);
  }

  function write(state: State) {
    const arrived = state.progress >= 1;
    for (const mover of state.movers) {
      const mesh = mover.part.mesh;
      if (arrived && mover.built) {
        mover.now.copy(mover.part.home);
        mesh.matrix.copy(mover.local);
      } else {
        poseAt(mover, state.progress, pose);
        mover.now.compose(pose.position, pose.quaternion, one);
        mesh.matrix.multiplyMatrices(mover.parentInverse, mover.now);
      }
      mesh.matrixWorldNeedsUpdate = true;
    }
    for (const follower of state.followers) {
      for (const item of follower.items) {
        follower.mesh.setMatrixAt(item.index, matrix.multiplyMatrices(follower.parentInverse, item.mover.now).multiply(item.inPart));
      }
      follower.mesh.instanceMatrix.needsUpdate = true;
    }
  }

  // A point on the floor (x to the right, y towards the camera, from the centre) in the CAD frame
  const toCad = (model: CaseModel, x: number, y: number, z: number) =>
    new THREE.Vector3(x - model.cad.position.x, model.cad.position.z - y, z);

  // The shown printed parts lying flat, the way they are printed: on print beds or on the table
  function layFlat(model: CaseModel, state: State, onBeds: boolean, screen: StepScreen): Extra {
    const parts = state.movers.map(m => m.part).filter(part => part.mesh.visible)
      .sort((a, b) => rank(a.id) - rank(b.id));
    const sizes = parts.map(partSize);
    const boxes = sizes.map(size => ({ w: size.x, h: size.y }));
    const group = new THREE.Group();
    let origins: { x: number; y: number }[];
    let width: number, depth: number;
    let dispose = () => {};

    if (onBeds) {
      const usable = BED - BED_EDGE * 2;
      const pitch = BED + BED_GAP;
      const placed = pack(boxes, usable, usable, PART_GAP);
      const count = Math.max(...placed.map(p => p.bin)) + 1;
      const grid = largest(screen, Array.from({ length: count }, (_, i) => {
        const columns = i + 1;
        return { columns, width: columns * pitch - BED_GAP, depth: Math.ceil(count / columns) * pitch - BED_GAP };
      }));
      ({ width, depth } = grid);
      const bed = (i: number) => ({ x: (i % grid.columns) * pitch, y: Math.floor(i / grid.columns) * pitch });
      origins = placed.map(p => ({ x: bed(p.bin).x + BED_EDGE + p.x, y: bed(p.bin).y + BED_EDGE + p.y }));

      const plate = new THREE.PlaneGeometry(BED, BED);
      const edge = new THREE.EdgesGeometry(plate);
      const surface = new THREE.MeshStandardMaterial({ color: 0xe3e2dc, roughness: 0.95 });
      const line = new THREE.LineBasicMaterial({ color: 0xa9a8a0 });
      for (let i = 0; i < count; i++) {
        const centre = toCad(model, bed(i).x + BED / 2 - width / 2, bed(i).y + BED / 2 - depth / 2, 0.2);
        const mesh = new THREE.Mesh(plate, surface);
        mesh.receiveShadow = true;
        mesh.position.copy(centre);
        const outline = new THREE.LineSegments(edge, line);
        outline.position.copy(centre).setZ(0.3);
        group.add(mesh, outline);
      }
      dispose = () => [plate, edge, surface, line].forEach(item => item.dispose());
    } else {
      const widest = Math.max(...boxes.map(box => box.w));
      const table = largest(screen, [1, 1.4, 2, 2.8, 4].map(factor => {
        const placed = pack(boxes, widest * factor, Infinity, TABLE_GAP);
        return {
          placed,
          width: Math.max(...placed.map((p, i) => p.x + boxes[i].w)),
          depth: Math.max(...placed.map((p, i) => p.y + boxes[i].h)),
        };
      }));
      ({ width, depth } = table);
      origins = table.placed;
    }

    // The part's own Y runs away from the camera
    const spots = new Map(parts.map((part, i) => [
      part,
      toCad(model, origins[i].x - width / 2, origins[i].y + boxes[i].h - depth / 2, onBeds ? 0.4 : 0),
    ]));
    const height = Math.max(...sizes.map(size => size.z));
    const bounds = new THREE.Box3(new THREE.Vector3(-width / 2, 0, -depth / 2), new THREE.Vector3(width / 2, height, depth / 2));
    return { group, bounds, spots, labels: [], dispose };
  }

  // One or two lines of text that keep their size on screen, drawn at twice that size
  function label(title: string, detail: string, font: string): Label {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    const fonts = [`600 ${LABEL_PX * 2}px ${font}`, `400 ${(LABEL_PX - 1) * 2}px ${font}`];
    const widths = [title, detail].map((text, i) => {
      context.font = fonts[i];
      return context.measureText(text).width;
    });
    canvas.width = Math.ceil(Math.max(...widths)) + 8;
    canvas.height = LABEL_PX * (detail ? 5.5 : 3);
    context.textBaseline = 'middle';
    context.textAlign = 'center';
    [title, detail].forEach((text, i) => {
      context.font = fonts[i];
      context.fillStyle = i ? '#55575c' : '#0b0b0c';
      context.fillText(text, canvas.width / 2, LABEL_PX * (1.5 + i * 2.6));
    });
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const material = new THREE.SpriteMaterial({ map: texture, depthTest: false, toneMapped: false, sizeAttenuation: false });
    const sprite = new THREE.Sprite(material);
    sprite.renderOrder = 10;
    return { sprite, width: canvas.width / 2, height: canvas.height / 2, dispose: () => { texture.dispose(); material.dispose(); } };
  }

  // The spacers, screws and feet to order: one of each on the table, with how many to get
  function layKit(model: CaseModel, screen: StepScreen): Extra {
    const group = new THREE.Group();
    const rubber = new THREE.MeshStandardMaterial({ color: 0x18181a, roughness: 0.9 });
    const disposables: { dispose(): void }[] = [rubber];

    const hex = new THREE.Shape();
    for (let i = 0; i < 6; i++) {
      const angle = (i + 0.5) / 6 * Math.PI * 2;   // a flat side down, once it lies
      hex[i ? 'lineTo' : 'moveTo'](Math.cos(angle) * 3.18, Math.sin(angle) * 3.18);
    }
    hex.holes.push(new THREE.Path().absarc(0, 0, 1.3, 0, Math.PI * 2, true));
    // Every shape lies on the table around its own middle
    const shapes = {
      spacer: () => new THREE.ExtrudeGeometry(hex, { depth: 10, bevelEnabled: false, curveSegments: 20 }).rotateY(Math.PI / 2).translate(-5, 0, 2.75),
      screw: (length = 6) => mergeGeometries([
        new THREE.CylinderGeometry(2.75, 2.75, 3, 24).translate(0, 1.5, 0),
        new THREE.CylinderGeometry(1.5, 1.5, length, 16).translate(0, -length / 2, 0),
      ]).rotateZ(Math.PI / 2).translate((3 - length) / 2, 0, 2.75),
      foot: () => new THREE.BoxGeometry(12, 12, 3).translate(0, 0, 1.5),
    };

    const lines = getCaseOrder(model.config).filter(line => line.qty && line.kind !== 'glue');
    // A small screen has no room for the second line
    const labels = lines.map(line => label(`${line.qty} × ${line.label}`, screen.width < 520 ? '' : line.detail, screen.font));
    // Rows and columns that show the items largest. The labels keep their size
    // on screen, so a cell is at least as wide as the widest of them.
    const room = Math.max(...labels.map(text => text.width)) + 12;
    const high = screen.width / screen.aspect;
    let columns = 1, cell = KIT_CELL.width, depth = 0, best = 0;
    for (let count = 1; count <= lines.length; count++) {
      if (count > 1 && count * room * 1.25 > screen.width) break;
      const deep = Math.ceil(lines.length / count) * KIT_CELL.depth;
      const fitsHeight = high / (deep * 1.5);   // px per mm, about what the camera gets
      const wide = Math.max(KIT_CELL.width, room / fitsHeight);
      const size = Math.min(fitsHeight, screen.width / (count * wide * 1.25));
      if (size > best) [columns, cell, depth, best] = [count, wide, deep, size];
    }
    const width = columns * cell;

    lines.forEach((line, i) => {
      const x = (i % columns + 0.5) * cell - width / 2;
      const y = Math.floor(i / columns) * KIT_CELL.depth - depth / 2;
      labels[i].sprite.position.copy(toCad(model, x, y + KIT_LABEL / 2, 3));
      const shape = line.kind === 'screw' ? shapes.screw(line.length) : line.kind === 'foot' ? shapes.foot() : shapes.spacer();
      const item = new THREE.Mesh(shape, line.kind === 'spacer' ? caseKit.brass : line.kind === 'screw' ? caseKit.steel : rubber);
      item.castShadow = true;
      item.position.copy(toCad(model, x, y + KIT_LABEL + (KIT_CELL.depth - KIT_LABEL) / 2, 0));
      disposables.push(labels[i], shape);
      group.add(labels[i].sprite, item);
    });

    const bounds = new THREE.Box3(new THREE.Vector3(-width / 2, 0, -depth / 2), new THREE.Vector3(width / 2, 6, depth / 2));
    return { group, bounds, labels, dispose: () => disposables.forEach(item => item.dispose()) };
  }

  function rescale(state: State, screen: StepScreen) {
    for (const extra of Object.values(state.extras)) {
      for (const text of extra.labels) text.sprite.scale.set(text.width * screen.pixel, text.height * screen.pixel, 1);
    }
  }

  return {
    apply(model, view, screen) {
      const state = stateOf(model);
      const seen = new Set(state.movers.filter(mover => mover.part.mesh.visible));
      caseKit.applyView(model, view.arrange === 'hardware' ? [] : view.show, view.focus);

      // What is laid out for a model does not change: its parts and its hardware are fixed
      let extra: Extra | undefined;
      if (view.arrange !== 'built') {
        extra = (state.extras[view.arrange] ??= view.arrange === 'hardware' ? layKit(model, screen) : layFlat(model, state, view.arrange === 'beds', screen));
        if (!extra.group.parent) model.cad.add(extra.group);
      }
      for (const [arrange, other] of Object.entries(state.extras)) other.group.visible = arrange === view.arrange;
      rescale(state, screen);

      // Parts that were on screen move to their new place; the others are simply there
      for (const mover of state.movers) {
        poseAt(mover, state.progress, pose);
        const spot = extra?.spots?.get(mover.part);
        mover.built = !spot;
        if (spot) {
          mover.to.position.copy(spot);
          mover.to.quaternion.identity();
        } else {
          mover.to.position.copy(mover.home.position);
          mover.to.quaternion.copy(mover.home.quaternion);
        }
        const moves = state.applied && seen.has(mover) && mover.part.mesh.visible;
        mover.from.position.copy(moves ? pose.position : mover.to.position);
        mover.from.quaternion.copy(moves ? pose.quaternion : mover.to.quaternion);
        // The top brace is new on the built case: it comes down onto the modules
        mover.lowered = state.applied && !moves && mover.built && mover.part.mesh.visible && mover.part.mesh.userData.tag === 'brace';
        if (mover.lowered) mover.from.position.addScaledVector(normal.setFromMatrixColumn(mover.part.parent, 2), LOWER_FROM);
      }
      state.applied = true;
      state.progress = 0;
      write(state);
      return extra?.bounds ?? model.bounds;
    },
    resize(model, screen) {
      const state = states.get(model);
      if (state) rescale(state, screen);
    },
    animate(model, dt) {
      const state = states.get(model);
      if (!state || state.progress >= 1) return;
      state.progress = Math.min(1, state.progress + dt / MOVE_TIME);
      write(state);
    },
    release(model) {
      const state = states.get(model);
      if (!state) return;
      Object.values(state.extras).forEach(extra => {
        extra.group.removeFromParent();
        extra.dispose();
      });
      states.delete(model);
    },
  };
}
