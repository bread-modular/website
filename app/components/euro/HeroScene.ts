// Home page animation: the case configurator, playing by itself. It starts
// with one case that gets its modules and a patch, then grows through the
// given layouts. The visitor can rotate the case, pause, or pick a layout.

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { DEFAULT_CASE_CONFIG, type LayoutId } from '@/lib/euro/case';
import { CABLE_COLORS, PATCHES } from '@/lib/euro/modules';
import { createCableKit, type Cable } from './three/cables';
import { createCaseKit, type CaseModel, type CasePart } from './three/case';
import { createRackKit, disposeRow, type RackRow } from './three/rack';
import { createStage, loadPenFont } from './three/stage';

const DROP_FROM = 70;      // mm the modules start above the case
const DROP_GAP = 0.12;     // seconds between modules
const DROP_TIME = 0.75;
const PIECE_FROM = 220;    // mm new cases and panels start above their place
const PIECE_GAP = 0.14;
const PIECE_TIME = 0.9;
const BRACE_FROM = 90;     // mm a top brace starts above the modules it lands on
const BRACE_GAP = 0.3;
const SHIFT_TIME = 1.3;    // the cases that are already there slide to their new place
const CABLE_GAP = 0.55;    // seconds between cables
const CABLE_TIME = 1.25;
const LIFT = 30;           // how far a plug is held above its jack
const HOLD = [2.2, 5.5, 6.5, 8];   // seconds a layout stays once it is complete (first one: once patched)
const FADE_TIME = 0.45;    // out and in again, when it starts over
// Camera height per layout, as the angle from straight above: lower for the layouts on the stand
const POLAR: Partial<Record<LayoutId, number>> = { single: 0.47, double: 0.52, 'double-tier': 0.9, studio: 0.95 };

export interface HeroScene {
  paused: boolean;   // starts paused for visitors who asked for reduced motion
  setPaused(paused: boolean): void;
  goTo(stage: number): void;
  dispose(): void;
}

export interface HeroOptions {
  layouts: LayoutId[];
  onStage(stage: number): void;
  isCancelled(): boolean;
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const easeOut = (t: number) => 1 - (1 - t) ** 3;
const easeInOut = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);

export async function createHeroScene(container: HTMLElement, options: HeroOptions): Promise<HeroScene | null> {
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const stage = createStage(container, 620);
  const { renderer, scene, camera } = stage;
  const canvas = renderer.domElement;
  const caseKit = createCaseKit();
  const rackKit = createRackKit(renderer);
  const cableKit = createCableKit();
  camera.fov = 26;
  camera.position.set(0, 600, 300);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.enableZoom = false;         // the page scrolls here
  controls.minPolarAngle = 0.12;
  controls.maxPolarAngle = 1.5;
  canvas.style.touchAction = 'pan-y';  // a finger drags the case sideways and still scrolls the page
  let touched = false;
  controls.addEventListener('start', () => { touched = true; });

  // One model per layout, built when its turn is near and then kept
  const configs = options.layouts.map(layout => ({ ...DEFAULT_CASE_CONFIG, layout }));
  const builds: (Promise<CaseModel> | undefined)[] = [];
  const ready: (CaseModel | undefined)[] = [];
  const load = (index: number) => (builds[index] ??= caseKit.build(configs[index]).then(model => (ready[index] = model)));

  let frame = 0;
  let disposed = false;
  let paused = still;
  let visible = true;
  let current = -1;
  let model: CaseModel | null = null;
  const rows: RackRow[] = [];
  let rowStart: number[] = [];                                 // when a row's modules start to drop, on the layout clock
  let drops: { lift: THREE.Object3D; start: number }[] = [];
  let braces: { mesh: THREE.Mesh; rest: THREE.Matrix4; start: number }[] = [];   // top braces: they go on after the modules
  let settled = 0;                                             // when the last thing of this layout has landed
  const shiftFrom = new THREE.Vector3();
  let clock = 0;        // seconds in this layout
  let patchClock = 0;   // seconds since the first layout started
  let life = 0;         // LEDs, knobs and the camera drift
  let fade = 0;         // > 0 while it fades out and in to start over
  let round = 0;

  const cables: Cable[] = [];
  const cableGroup = new THREE.Group();
  scene.add(cableGroup);
  const mountRef = new THREE.Vector3();   // where the first case was when the jacks were measured
  let patches: { a: THREE.Vector3; b: THREE.Vector3 }[][] = [];
  let leds: THREE.Mesh[] = [];
  let knobs: THREE.Object3D[] = [];
  let knobHome: number[] = [];

  const dispose = () => {
    disposed = true;
    cancelAnimationFrame(frame);
    resizeObserver.disconnect();
    intersectionObserver.disconnect();
    controls.dispose();
    cables.forEach(cable => cable.dispose());
    rows.forEach(disposeRow);
    cableKit.dispose();
    rackKit.dispose();
    caseKit.dispose();
    stage.dispose();
  };

  // Camera: far enough to see the whole layout from where it looks now
  const goalTarget = new THREE.Vector3();
  let goalDistance = 700;
  let goalPolar = POLAR.single!;
  let fitFrames = 0;
  const box = new THREE.Box3();
  const spherical = new THREE.Spherical();
  const offset = new THREE.Vector3();
  const corner = new THREE.Vector3();
  const right = new THREE.Vector3();
  const up = new THREE.Vector3();
  const back = new THREE.Vector3();

  function frameModel(instant: boolean) {
    if (!model) return;
    box.copy(model.bounds);
    box.max.y += 34;   // knobs and cables
    box.getCenter(goalTarget);
    goalPolar = POLAR[configs[current].layout] ?? 0.6;

    spherical.setFromVector3(offset.copy(camera.position).sub(controls.target));
    if (!touched) spherical.phi = goalPolar;
    back.setFromSpherical(spherical).normalize();           // from the case to the camera
    right.crossVectors(THREE.Object3D.DEFAULT_UP, back).normalize();
    up.crossVectors(back, right);
    const vertical = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
    const horizontal = vertical * camera.aspect;
    goalDistance = 0;
    for (let i = 0; i < 8; i++) {
      corner.set(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z).sub(goalTarget);
      const depth = corner.dot(back);
      goalDistance = Math.max(goalDistance, depth + Math.abs(corner.dot(right)) / horizontal, depth + Math.abs(corner.dot(up)) / vertical);
    }
    goalDistance *= 1.07;
    fitFrames = 140;
    if (instant) {
      controls.target.copy(goalTarget);
      spherical.radius = goalDistance;
      camera.position.setFromSpherical(spherical).add(goalTarget);
      fitFrames = 0;
    }
  }

  function resize() {
    const width = container.clientWidth, height = container.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    frameModel(false);
  }
  const resizeObserver = new ResizeObserver(resize);
  const intersectionObserver = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; });

  const [, font] = await Promise.all([load(0), loadPenFont(container)]);
  if (options.isCancelled()) {
    dispose();
    return null;
  }
  rackKit.setFont(font);

  const before = new THREE.Vector3();
  const after = new THREE.Vector3();
  const braceRest = new WeakMap<THREE.Mesh, THREE.Matrix4>();
  const bracesOf = (of: CaseModel) => of.parts.filter(part => part.id === 'top-brace-6hp');
  const braceKey = (part: CasePart) => part.home.elements.join();   // the same brace in the same place in another layout

  // Shows a layout. Coming from the one before it, what is already there stays
  // and the new cases and panels drop in. Any other way, it is simply there.
  function enter(index: number, grow: boolean) {
    const next = ready[index]!;
    const previous = model;
    grow = grow && !!previous && index === current + 1;
    const kept = new Set(grow ? previous!.pieces.map(piece => piece.key) : []);
    const keptBraces = new Set(grow ? bracesOf(previous!).map(braceKey) : []);
    if (previous) previous.slots[0].mount.getWorldPosition(before);
    if (previous) scene.remove(previous.root);

    next.root.position.set(0, 0, 0);
    scene.add(next.root);
    next.root.updateMatrixWorld(true);
    next.slots[0].mount.getWorldPosition(after);
    shiftFrom.set(0, 0, 0);
    if (grow) shiftFrom.copy(before).sub(after).setY(0);

    const restart = index === 0;
    clock = 0;
    drops = [];
    settled = 0;
    const landing = new Map<THREE.Object3D, number>();
    for (const piece of next.pieces) {
      piece.lift.position.z = 0;
      piece.lift.visible = true;
      if (!grow || kept.has(piece.key)) continue;
      const start = 0.3 + drops.length * PIECE_GAP;
      drops.push({ lift: piece.lift, start });
      landing.set(piece.lift, start + PIECE_TIME);
      settled = start + PIECE_TIME;
    }

    // Module rows: the ones that are there move over, new ones drop in once their case has landed
    rows.splice(next.slots.length).forEach(row => {
      row.group.removeFromParent();
      disposeRow(row);
    });
    rowStart = next.slots.map((slot, i) => {
      const had = !!rows[i];
      rows[i] ??= rackKit.buildRow(slot.index);
      slot.mount.add(rows[i].group);
      if (restart && !still) return 0.4;
      if (had || !grow) return -Infinity;
      let lift: THREE.Object3D | null = slot.mount;
      while (lift && !landing.has(lift)) lift = lift.parent;
      const start = (lift ? landing.get(lift)! : 0) - 0.25 + i * 0.1;
      settled = Math.max(settled, start + (rows[i].modules.length - 1) * DROP_GAP + DROP_TIME);
      return start;
    });
    // Top braces: the new ones come down once every module is in
    braces = bracesOf(next).map(part => {
      if (!braceRest.has(part.mesh)) braceRest.set(part.mesh, part.mesh.matrix.clone());
      return { mesh: part.mesh, rest: braceRest.get(part.mesh)!, start: !grow || keptBraces.has(braceKey(part)) ? -Infinity : 0 };
    });
    braces.filter(brace => brace.start === 0).forEach((brace, i) => {
      brace.start = settled + 0.25 + i * BRACE_GAP;
    });
    settled = Math.max(settled, ...braces.map(brace => brace.start + PIECE_TIME));
    if (restart) {
      patchClock = still ? 1e6 : 0;
      const patch = patches.length ? patches[round % patches.length].length : 1;
      settled = still ? 0 : 0.4 + (rows[0].modules.length - 1) * DROP_GAP + DROP_TIME + 0.3 + (patch - 1) * CABLE_GAP + CABLE_TIME;
    } else if (!grow) {
      patchClock = 1e6;   // jumped here: the patch is in
    }

    leds = rows.flatMap(row => row.modules.flatMap(m => m.leds));
    knobs = rows[0].modules.flatMap(m => m.knobs);
    current = index;
    model = next;
    frameModel(!previous);
    options.onStage(index);
    load((index + 1) % configs.length).catch(() => {});
  }

  // The first case: measure its jacks, and make the cables for the longest patch
  resize();
  enter(0, false);
  scene.updateMatrixWorld(true);
  model!.slots[0].mount.getWorldPosition(mountRef);
  const jack = (ref: string) => {
    const [moduleId, jackId] = ref.split('.');
    const object = rows[0].modules.find(m => m.module.id === moduleId)!;
    return object.group.localToWorld(object.jacks.get(jackId)!.clone());
  };
  patches = PATCHES.map(patch => patch.map(([from, to]) => ({ a: jack(from), b: jack(to) })));
  for (let i = 0; i < Math.max(...patches.map(p => p.length)); i++) {
    const cable = cableKit.create(CABLE_COLORS[i % CABLE_COLORS.length], i + 1);
    cable.group.visible = false;
    cables.push(cable);
    cableGroup.add(cable.group);
  }
  knobHome = knobs.map(knob => knob.rotation.y);
  enter(0, false);   // again, now that the length of the patch is known

  const hover = new THREE.Vector3();
  const mountNow = new THREE.Vector3();
  let last = performance.now();

  function draw(dt: number) {
    if (!model) return;
    const running = !paused && fade === 0;
    if (running) {
      clock += dt;
      patchClock += dt;
      life += dt;
    }

    // Start over through a short fade; otherwise go on when the next layout is loaded
    if (fade > 0) {
      const from = fade;
      fade += dt;
      if (from < FADE_TIME && fade >= FADE_TIME) {
        round++;
        enter(0, false);
      }
      if (fade >= FADE_TIME * 2) fade = 0;
      canvas.style.transition = 'none';   // this fade is drawn frame by frame
      canvas.style.opacity = fade === 0 ? '' : String(Math.abs(fade - FADE_TIME) / FADE_TIME);
    } else if (running && clock > settled + HOLD[Math.min(current, HOLD.length - 1)]) {
      const next = (current + 1) % configs.length;
      if (next === 0) fade = 1e-3;
      else if (ready[next]) enter(next, true);
    }

    // What was there slides over, new cases and panels come down
    model.root.position.copy(shiftFrom).multiplyScalar(1 - easeInOut(clamp01(clock / SHIFT_TIME)));
    for (const drop of drops) {
      const t = clamp01((clock - drop.start) / PIECE_TIME);
      drop.lift.visible = t > 0;
      drop.lift.position.z = (1 - easeOut(t)) * PIECE_FROM;
    }
    rows.forEach((row, r) => {
      row.modules.forEach((object, i) => {
        const t = clamp01((clock - rowStart[r] - i * DROP_GAP) / DROP_TIME);
        object.group.visible = t > 0;
        object.group.position.y = (1 - easeOut(t)) * DROP_FROM;
      });
    });
    for (const brace of braces) {
      const t = clamp01((clock - brace.start) / PIECE_TIME);
      brace.mesh.visible = t > 0;
      brace.mesh.matrix.copy(brace.rest);
      brace.mesh.matrix.elements[14] += (1 - easeOut(t)) * BRACE_FROM;   // straight up from the panels, also on a tilted case
      brace.mesh.matrixWorldNeedsUpdate = true;
    }

    // The patch of the first case: one cable after the other
    model.root.updateMatrixWorld(true);
    model.slots[0].mount.getWorldPosition(mountNow);
    cableGroup.position.copy(mountNow).sub(mountRef);
    const patch = patches[round % patches.length];
    const patchTime = patchClock - (0.4 + (rows[0].modules.length - 1) * DROP_GAP + DROP_TIME) - 0.3;
    cables.forEach((cable, i) => {
      const ends = patch[i];
      const t = ends ? clamp01((patchTime - i * CABLE_GAP) / CABLE_TIME) : 0;
      if (!ends || t <= 0) {
        cable.group.visible = false;
        return;
      }
      // First plug goes in, the cable is carried over, the second plug goes in
      const first = easeOut(clamp01(t / 0.22));
      const carry = easeInOut(clamp01((t - 0.18) / 0.6));
      const second = easeOut(clamp01((t - 0.78) / 0.22));
      hover.copy(ends.a).lerp(ends.b, 0.12 + carry * 0.88);
      cable.set(ends.a, hover, (1 - first) * LIFT, (1 - second) * LIFT, clamp01(t / 0.1));
    });

    // A little life: activity LEDs and two knobs being turned
    const playing = patchTime >= 0;
    leds.forEach((led, i) => {
      const on = playing && (Math.sin(life * (5 + (i % 4) * 2.3) + i * 1.7) > 0.25 || i % 5 === 0);
      led.material = on ? rackKit.ledOn : rackKit.ledOff;
    });
    knobs.forEach((knob, i) => {
      knob.rotation.y = knobHome[i] + (i % 4 === 0 ? Math.sin(life * 0.9 + i) * 0.7 : 0);
    });

    // Camera: follow the size of the layout, and drift a little until the visitor takes over
    const drift = !touched && running;
    if (fitFrames > 0 || drift) {
      if (fitFrames > 0) controls.target.lerp(goalTarget, 0.06);
      spherical.setFromVector3(offset.copy(camera.position).sub(controls.target));
      if (fitFrames > 0) {
        fitFrames--;
        spherical.radius = THREE.MathUtils.lerp(spherical.radius, goalDistance, 0.06);
        if (!touched) spherical.phi = THREE.MathUtils.lerp(spherical.phi, goalPolar, 0.06);
      }
      if (drift) spherical.theta += Math.cos(life * 0.2) * 0.016 * dt;
      camera.position.setFromSpherical(spherical).add(controls.target);
    }
    controls.update();
    renderer.render(scene, camera);
  }

  function tick() {
    frame = requestAnimationFrame(tick);
    const now = performance.now();
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (visible && !document.hidden) draw(dt);
  }

  resizeObserver.observe(container);
  intersectionObserver.observe(container);
  tick();

  return {
    paused,
    setPaused(value) {
      paused = value;
    },
    goTo(index) {
      if (disposed || index === current && index !== 0) return;
      load(index).then(() => {
        if (disposed) return;
        fade = 0;
        canvas.style.opacity = '';
        enter(index, index === current + 1);
      }).catch(() => {});
    },
    dispose,
  };
}
