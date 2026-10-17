import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class SceneManager {
  constructor(container) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0d14);

    // Camera setup
    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.01,
      100
    );
    this.defaultCameraPos = new THREE.Vector3(-0.03, 1.22, 0.52);
    this.defaultTarget = new THREE.Vector3(-0.03, 0.54, 0.38);
    this.camera.position.copy(this.defaultCameraPos);

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // Controls setup
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.target.copy(this.defaultTarget);
    this.controls.maxPolarAngle = Math.PI / 2 + 0.05; // Don't flip below workbench
    this.controls.minDistance = 0.15;
    this.controls.maxDistance = 2.5;

    // Lighting setup
    this.setupLighting();

    // Workstation grid / ground
    this.setupGround();

    // Camera animation state
    this.cameraTween = null;

    // Window resize
    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  setupLighting() {
    // Soft ambient illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    this.scene.add(ambientLight);

    // Key light (soft white directional)
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
    keyLight.position.set(1.5, 3.5, 2.0);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 10;
    keyLight.shadow.bias = -0.0001;
    const d = 0.8;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    this.scene.add(keyLight);

    // Fill light (cool bluish)
    const fillLight = new THREE.DirectionalLight(0x88ccff, 1.0);
    fillLight.position.set(-2, 2, -1);
    this.scene.add(fillLight);

    // Rim/Accent light (warm accent)
    const rimLight = new THREE.DirectionalLight(0xffeedd, 0.8);
    rimLight.position.set(0, 1.5, -2);
    this.scene.add(rimLight);
  }

  setupGround() {
    // Dark workstation table surface
    const tableGeo = new THREE.PlaneGeometry(3, 3);
    const tableMat = new THREE.MeshStandardMaterial({
      color: 0x111622,
      roughness: 0.85,
      metalness: 0.2
    });
    const tableMesh = new THREE.Mesh(tableGeo, tableMat);
    tableMesh.rotation.x = -Math.PI / 2;
    tableMesh.position.y = 0.535; // Aligned right under the motherboard
    tableMesh.receiveShadow = true;
    this.scene.add(tableMesh);

    // Minimal subtle grid overlay
    const grid = new THREE.GridHelper(2.5, 40, 0x334155, 0x1e293b);
    grid.position.y = 0.536;
    grid.material.opacity = 0.2;
    grid.material.transparent = true;
    this.scene.add(grid);
  }

  resetCamera() {
    this.animateCameraTo(this.defaultCameraPos, this.defaultTarget, 1000);
  }

  focusOn(targetPos, distance = 0.3, duration = 1000) {
    const offset = new THREE.Vector3(0, 0.32, 0.08).normalize().multiplyScalar(distance);
    const newCameraPos = targetPos.clone().add(offset);
    this.animateCameraTo(newCameraPos, targetPos, duration);
  }

  animateCameraTo(targetCamPos, targetControlsTarget, duration = 1000) {
    const startCamPos = this.camera.position.clone();
    const startTarget = this.controls.target.clone();
    const startTime = performance.now();

    this.cameraTween = {
      update: (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Smooth ease-in-out cubic
        const ease = progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        this.camera.position.lerpVectors(startCamPos, targetCamPos, ease);
        this.controls.target.lerpVectors(startTarget, targetControlsTarget, ease);

        if (progress >= 1) {
          this.cameraTween = null;
        }
      }
    };
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  update() {
    if (this.cameraTween) {
      this.cameraTween.update(performance.now());
    }
    this.controls.update();
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
