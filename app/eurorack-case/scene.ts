// 3D preview of the case for the configurator, built from the real STL print
// files in their assembled position (see app/components/euro/three/case.ts).

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CASE_COLORS, caseConfigToQuery, normalizeCaseConfig, type CaseArrange, type CaseConfig, type CaseTag } from '@/lib/euro/case';
import { createCaseKit, type CaseModel } from '@/app/components/euro/three/case';
import { createRackKit, disposeRow, type RackRow } from '@/app/components/euro/three/rack';
import { createStage, loadPenFont } from '@/app/components/euro/three/stage';
import { createStepStage, type StepScreen } from '@/app/components/euro/three/steps';

// What to show of the case: everything (`show: null`), or the state at one
// step of the assembly guide with that step's parts highlighted.
export interface CaseView {
  modules: boolean;
  show: CaseTag[] | null;
  focus: CaseTag[];
  arrange: CaseArrange;
}

export interface CaseScene {
  update(config: CaseConfig, view: CaseView): void;
  dispose(): void;
}

const HOME = new THREE.Vector3(260, 330, 560);   // where the camera starts
const HOME_AZIMUTH = Math.atan2(HOME.x, HOME.z);
const HOME_POLAR = HOME.angleTo(new THREE.Vector3(0, 1, 0));
const FLAT_POLAR = 0.62;                         // parts that lie flat are looked at from above
const FLAT_AZIMUTH = 0.3;
const FIT_TIME = 1.2;                            // seconds the camera takes to a new view
const STEP_BAR = 76;                             // px at the bottom of the preview that the step bar covers

// `onBusy` is told when print files are loading for a new case, and when they are in
export function createCaseScene(container: HTMLElement, onBusy: (busy: boolean) => void = () => {}): CaseScene {
  const stage = createStage(container, 560);
  const { renderer, scene, camera } = stage;
  camera.position.copy(HOME);
  const caseKit = createCaseKit();
  const rackKit = createRackKit(renderer);
  const steps = createStepStage(caseKit);
  const labelFont = getComputedStyle(container).fontFamily;
  const halfFov = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
  const screen = (): StepScreen => {
    const width = container.clientWidth || 1, height = container.clientHeight || 1;
    return { font: labelFont, width, aspect: width / Math.max(1, height - STEP_BAR), pixel: 2 * halfFov / height };
  };

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.7;
  controls.minPolarAngle = 0.15;
  controls.maxPolarAngle = 1.52;
  controls.minDistance = 120;
  controls.maxDistance = 3200;
  controls.addEventListener('start', () => {
    controls.autoRotate = false;
    fitTime = 0;
    goalAzimuth = null;
    goalPolar = null;
    turned = false;
  });

  let built: CaseModel | null = null;
  let builtKey = '';
  const bounds = new THREE.Box3();
  let rows: RackRow[] = [];
  let request = 0;
  let disposed = false;
  let fitted = false;
  let flat = false;
  let fitTime = 0;
  const goalTarget = new THREE.Vector3(0, 40, 0);
  let goalDistance = 700;
  let goalAzimuth: number | null = null;
  let goalPolar: number | null = null;
  let turned = false;
  const spherical = new THREE.Spherical();

  function fit() {
    if (!built) return;
    fitTime = FIT_TIME;
    if (flat) {
      fitFlat();
      return;
    }
    const sphere = bounds.getBoundingSphere(new THREE.Sphere());
    const vertical = THREE.MathUtils.degToRad(camera.fov) / 2;
    const horizontal = Math.atan(Math.tan(vertical) * camera.aspect);
    goalTarget.copy(sphere.center);
    goalDistance = (sphere.radius / Math.sin(Math.min(vertical, horizontal))) * 1.04;
  }

  // Parts on the floor: seen from a fixed place above them, as large as the room over the step bar allows
  function fitFlat() {
    const height = container.clientHeight || 1;
    const back = new THREE.Vector3().setFromSphericalCoords(1, FLAT_POLAR, FLAT_AZIMUTH);   // from the parts to the camera
    const right = new THREE.Vector3().crossVectors(THREE.Object3D.DEFAULT_UP, back).normalize();
    const up = new THREE.Vector3().crossVectors(back, right);
    const vertical = halfFov * Math.max(0.3, (height - STEP_BAR) / height);
    const horizontal = halfFov * camera.aspect;
    const centre = bounds.getCenter(new THREE.Vector3());
    const corner = new THREE.Vector3();
    goalDistance = 0;
    for (let i = 0; i < 8; i++) {
      corner.set(i & 1 ? bounds.max.x : bounds.min.x, i & 2 ? bounds.max.y : bounds.min.y, i & 4 ? bounds.max.z : bounds.min.z).sub(centre);
      const depth = corner.dot(back);
      goalDistance = Math.max(goalDistance, depth + Math.abs(corner.dot(right)) / horizontal, depth + Math.abs(corner.dot(up)) / vertical);
    }
    goalDistance *= 1.1;
    // Looking at a point nearer to the camera lifts the parts clear of the step bar
    const lift = (STEP_BAR / 2) * (2 * goalDistance * halfFov / height) / Math.cos(FLAT_POLAR);
    goalTarget.copy(centre).addScaledVector(back.setY(0).normalize(), lift);
    goalAzimuth = FLAT_AZIMUTH;
    goalPolar = FLAT_POLAR;
    controls.autoRotate = false;
  }

  function clearModel() {
    rows.forEach(disposeRow);
    rows = [];
    if (built) {
      steps.release(built);
      scene.remove(built.root);
    }
    built = null;
  }

  function applyView(view: CaseView) {
    if (!built) return;
    const model = built;
    const space = steps.apply(model, view, screen());
    if (view.modules && !rows.length) {
      rows = model.slots.map(slot => {
        const row = rackKit.buildRow(slot.index);
        slot.mount.add(row.group);
        return row;
      });
    }
    rows.forEach(row => { row.group.visible = view.modules; });
    // The top brace lies on the module panels: it goes when they are switched off
    if (!view.show && !view.modules) model.parts.forEach(part => { if (part.id === 'top-brace-6hp') part.mesh.visible = false; });

    // Parts that lie flat are looked at from above; the built case from where the camera was
    const wasFlat = flat;
    flat = view.arrange !== 'built';
    const next = space.clone();
    if (!flat) next.max.y += 14;   // knobs
    if (!next.equals(bounds)) {
      bounds.copy(next);
      fit();
      if (!fitted) {
        // Nothing to move away from: start on the model
        fitted = true;
        controls.target.copy(goalTarget);
        camera.position.sub(controls.target).setLength(goalDistance).add(controls.target);
        fitTime = 0;
      }
    }
    if (flat) {
      turned = true;   // the built case is looked at from the front again
    } else {
      if (wasFlat) goalPolar = HOME_POLAR;
      turnTo(model, view.focus);
    }
  }

  // Turns the camera to the side of the case where the highlighted parts are,
  // if they are off to one side (the cable comb is on the back)
  function turnTo(model: CaseModel, focus: CaseTag[]) {
    const back = turned;   // it was turned for the step before: return to the front
    turned = false;
    goalAzimuth = null;
    if (back) {
      goalAzimuth = HOME_AZIMUTH;
      fitTime = FIT_TIME;
    }
    // Printed parts may still be on their way: measure them where they end up
    const part = new THREE.Box3();
    const box = new THREE.Box3();
    const home = new THREE.Matrix4();
    const focused = (mesh: THREE.Mesh) => mesh.visible && focus.includes(mesh.userData.tag);
    model.root.updateMatrixWorld(true);
    for (const printed of model.parts) {
      if (!focused(printed.mesh)) continue;
      if (!printed.mesh.geometry.boundingBox) printed.mesh.geometry.computeBoundingBox();
      part.union(box.copy(printed.mesh.geometry.boundingBox!).applyMatrix4(home.multiplyMatrices(model.cad.matrixWorld, printed.home)));
    }
    for (const hardware of model.hardware) {
      if (focused(hardware.mesh)) part.expandByObject(hardware.mesh);
    }
    if (part.isEmpty()) return;
    const off = part.getCenter(new THREE.Vector3()).sub(bounds.getCenter(new THREE.Vector3()));
    const size = bounds.getSize(new THREE.Vector3());
    if (Math.hypot(off.x, off.z) < 0.2 * Math.hypot(size.x, size.z) / 2) return;
    goalAzimuth = Math.atan2(off.x, off.z) + 0.45;
    turned = true;
    controls.autoRotate = false;
    fitTime = FIT_TIME;
  }

  // The print files load on first use, so a build can finish after a newer one was asked for
  async function update(input: CaseConfig, view: CaseView) {
    const config = normalizeCaseConfig(input);
    const key = caseConfigToQuery({ ...config, color: 'black' });   // the colour needs no rebuild
    const id = ++request;
    const rebuild = key !== builtKey || !built;
    onBusy(rebuild);   // a change that needs no rebuild also ends the wait for an older one
    if (rebuild) {
      let next: CaseModel;
      try {
        next = await caseKit.build(config);
      } finally {
        if (!disposed && id === request) onBusy(false);
      }
      if (disposed || id !== request) return;
      clearModel();
      built = next;
      builtKey = key;
      scene.add(next.root);
    }

    // A little darker than the swatch: the studio light is bright
    caseKit.body.color.set(CASE_COLORS.find(c => c.id === config.color)?.hex ?? CASE_COLORS[0].hex).multiplyScalar(0.8);
    // The highlight must stand out from the filament colour
    caseKit.accent.color.set(config.color === 'orange' ? 0x2f6fde : 0xff7a1a);
    caseKit.accent.emissive.copy(caseKit.accent.color);
    applyView(view);
  }

  function resize() {
    const width = container.clientWidth, height = container.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    if (built) steps.resize(built, screen());
    fit();
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  let visible = true;
  const intersectionObserver = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; });
  intersectionObserver.observe(container);

  let frame = 0;
  let last = performance.now();
  const offset = new THREE.Vector3();
  function tick() {
    frame = requestAnimationFrame(tick);
    const now = performance.now();
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (!visible || document.hidden) return;
    if (built) steps.animate(built, dt);
    if (fitTime > 0) {
      fitTime -= dt;
      const ease = 1 - Math.exp(-9 * dt);   // the same at any frame rate
      controls.target.lerp(goalTarget, ease);
      offset.copy(camera.position).sub(controls.target);
      offset.setLength(THREE.MathUtils.lerp(offset.length(), goalDistance, ease));
      if (goalAzimuth !== null || goalPolar !== null) {
        spherical.setFromVector3(offset);
        if (goalAzimuth !== null) {
          const turn = THREE.MathUtils.euclideanModulo(goalAzimuth - spherical.theta + Math.PI, Math.PI * 2) - Math.PI;
          spherical.theta += turn * ease;
        }
        if (goalPolar !== null) spherical.phi += (goalPolar - spherical.phi) * ease;
        offset.setFromSpherical(spherical);
      }
      camera.position.copy(controls.target).add(offset);
    }
    controls.update();
    renderer.render(scene, camera);
  }
  resize();
  tick();

  loadPenFont(container).then(font => {
    if (!disposed) rackKit.setFont(font);
  });

  return {
    update(config, view) {
      update(config, view).catch(() => {});
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      controls.dispose();
      clearModel();
      rackKit.dispose();
      caseKit.dispose();
      stage.dispose();
    },
  };
}
