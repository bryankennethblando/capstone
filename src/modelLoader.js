import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class ModelLoader {
  constructor(scene, onProgress, onComplete) {
    this.scene = scene;
    this.onProgress = onProgress;
    this.onComplete = onComplete;
    this.components = {};
    this.guides = {};
  }

  load(modelUrl = '/model/cap.glb') {
    const loadingManager = new THREE.LoadingManager();

    loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
      const percent = Math.round((itemsLoaded / itemsTotal) * 100);
      if (this.onProgress) this.onProgress(percent);
    };

    const loader = new GLTFLoader(loadingManager);

    loader.load(
      modelUrl,
      (gltf) => {
        this.processModel(gltf);
        if (this.onComplete) this.onComplete(this.components, this.guides);
      },
      (xhr) => {
        if (xhr.lengthComputable && this.onProgress) {
          const percent = Math.round((xhr.loaded / xhr.total) * 100);
          this.onProgress(percent);
        }
      },
      (error) => {
        console.error('Error loading 3D model:', error);
      }
    );
  }

  processModel(gltf) {
    const modelScene = gltf.scene;

    // Enable shadows on all relevant meshes and ensure pure emissive black
    modelScene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          child.material.side = THREE.DoubleSide;
          // Ensure pristine original emissive
          if (child.material.emissive) {
            child.material.emissive.setHex(0x000000);
            child.material.emissiveIntensity = 0;
          }
        }
      }
    });

    // Hide modeling helper cubes (nodes 8, 9, 10, 11, 12)
    ['Cube', 'Cube.001', 'Cube.002', 'Cube.003', 'Cube.004'].forEach((name) => {
      const helper = modelScene.getObjectByName(name);
      if (helper) helper.visible = false;
    });

    // Extract core parts
    const cpu = modelScene.getObjectByName('cpu');
    const ram1 = modelScene.getObjectByName('ram_slot1');
    const ram2 = modelScene.getObjectByName('ram_slot2');
    const motherboard = modelScene.getObjectByName('motherboard');

    // Plane surface height for components
    const PLANE_SURFACE_Y = 0.5385;

    // Component configurations with exact flush-to-plane positioning (no floating)
    const partConfigs = [
      {
        id: 'cpu',
        name: 'Central Processing Unit',
        object: cpu,
        disassembledPos: new THREE.Vector3(-0.27, PLANE_SURFACE_Y + 0.00192, 0.35),
        guideColor: 0x00f0ff,
        guideSize: [0.05, 0.008, 0.05]
      },
      {
        id: 'ram_slot1',
        name: 'RAM Stick 1 (Channel A)',
        object: ram1,
        disassembledPos: new THREE.Vector3(0.17, PLANE_SURFACE_Y + 0.02246, 0.35),
        guideColor: 0x00ff88,
        guideSize: [0.012, 0.045, 0.18]
      },
      {
        id: 'ram_slot2',
        name: 'RAM Stick 2 (Channel B)',
        object: ram2,
        disassembledPos: new THREE.Vector3(0.23, PLANE_SURFACE_Y + 0.02060, 0.35),
        guideColor: 0x00ff88,
        guideSize: [0.012, 0.045, 0.18]
      }
    ];

    partConfigs.forEach((cfg) => {
      if (cfg.object) {
        // Cache original assembled transforms
        cfg.object.userData = {
          id: cfg.id,
          name: cfg.name,
          isInteractive: true,
          assembledPos: cfg.object.position.clone(),
          assembledQuat: cfg.object.quaternion.clone(),
          assembledScale: cfg.object.scale.clone(),
          disassembledPos: cfg.disassembledPos.clone(),
          isInstalled: true, // starts in assembled state
          dragYOffset: 0.07 // elevated height when dragging
        };

        this.components[cfg.id] = cfg.object;

        // Create holographic snap guide mesh
        const guideGeo = new THREE.BoxGeometry(...cfg.guideSize);
        const guideMat = new THREE.MeshBasicMaterial({
          color: cfg.guideColor,
          wireframe: true,
          transparent: true,
          opacity: 0,
          depthWrite: false
        });
        const guideMesh = new THREE.Mesh(guideGeo, guideMat);
        guideMesh.position.copy(cfg.object.position);
        guideMesh.visible = false;
        modelScene.add(guideMesh);
        this.guides[cfg.id] = guideMesh;
      }
    });

    // Motherboard info registration
    if (motherboard) {
      motherboard.userData = {
        id: 'motherboard',
        name: 'Motherboard (Asus Z170-P)',
        isInteractive: true,
        isInstalled: true
      };
      this.components['motherboard'] = motherboard;
    }

    // Create unified consistent white workstation mat for all components
    this.createUnifiedMat(PLANE_SURFACE_Y);

    this.scene.add(modelScene);
  }

  createUnifiedMat(surfaceY) {
    // Single unified white workstation plane accommodating Motherboard, CPU, and RAM
    const matWidth = 0.74;
    const matDepth = 0.56;
    const matThickness = 0.003;

    const matGeo = new THREE.BoxGeometry(matWidth, matThickness, matDepth);
    const matMaterial = new THREE.MeshStandardMaterial({
      color: 0xfafbfc,
      roughness: 0.55,
      metalness: 0.05
    });
    const matMesh = new THREE.Mesh(matGeo, matMaterial);
    matMesh.position.set(-0.02, surfaceY - matThickness / 2, 0.40);
    matMesh.receiveShadow = true;
    this.scene.add(matMesh);

    // Consistent staging zones on the same plane (subtle off-white with gentle borders)
    const zoneMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.6,
      metalness: 0.05
    });

    // CPU Staging Zone on the same white plane
    const cpuZoneGeo = new THREE.BoxGeometry(0.12, 0.0005, 0.12);
    const cpuZone = new THREE.Mesh(cpuZoneGeo, zoneMat);
    cpuZone.position.set(-0.27, surfaceY + 0.00025, 0.35);
    cpuZone.receiveShadow = true;
    this.scene.add(cpuZone);

    // RAM Staging Zone on the same white plane
    const ramZoneGeo = new THREE.BoxGeometry(0.16, 0.0005, 0.22);
    const ramZone = new THREE.Mesh(ramZoneGeo, zoneMat);
    ramZone.position.set(0.20, surfaceY + 0.00025, 0.35);
    ramZone.receiveShadow = true;
    this.scene.add(ramZone);
  }
}
