// Shared three.js setup for the Eurorack pages: renderer, studio lighting with
// soft reflections, and a floor that only shows the shadow.

import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export interface Stage {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  sun: THREE.DirectionalLight;
  dispose(): void;
}

export function createStage(container: HTMLElement, shadowSize: number): Stage {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, 0.04).texture;
  scene.environment = environment;
  scene.environmentIntensity = 0.6;
  room.dispose();
  pmrem.dispose();

  const camera = new THREE.PerspectiveCamera(30, 1, 20, 8000);

  scene.add(new THREE.HemisphereLight(0xffffff, 0xd8d8d8, 0.5));
  const sun = new THREE.DirectionalLight(0xffffff, 2);
  sun.position.set(-300, 640, 220);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = sun.shadow.camera.bottom = -shadowSize;
  sun.shadow.camera.right = sun.shadow.camera.top = shadowSize;
  sun.shadow.camera.near = 50;
  sun.shadow.camera.far = 2000;
  sun.shadow.bias = -0.0005;
  sun.shadow.normalBias = 0.5;
  sun.shadow.radius = 5;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xffffff, 0.6);
  fill.position.set(420, 300, -260);
  scene.add(fill);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(8000, 8000), new THREE.ShadowMaterial({ opacity: 0.22 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  return {
    renderer, scene, camera, sun,
    dispose() {
      environment.dispose();
      ground.geometry.dispose();
      (ground.material as THREE.Material).dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}

// The pen font is declared by the page. Only its first family is asked for:
// the local fallbacks may not exist.
export async function loadPenFont(element: HTMLElement): Promise<string> {
  const family = getComputedStyle(element).getPropertyValue('--font-hand').split(',')[0].trim();
  if (!family || !document.fonts) return 'sans-serif';
  try {
    await document.fonts.load(`20px ${family}`, 'ACID');
  } catch {
    return 'sans-serif';
  }
  return `${family}, sans-serif`;
}
