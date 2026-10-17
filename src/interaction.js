import * as THREE from 'three';
import { soundEffects } from './audio.js';

export class InteractionManager {
  constructor(sceneManager, components, guides, callbacks = {}) {
    this.sceneManager = sceneManager;
    this.camera = sceneManager.camera;
    this.controls = sceneManager.controls;
    this.components = components;
    this.guides = guides;
    this.callbacks = callbacks;

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    this.hoveredObject = null;
    this.draggedObject = null;
    this.dragPlane = new THREE.Plane();
    this.planeIntersectPoint = new THREE.Vector3();
    this.dragOffset = new THREE.Vector3();

    this.snapThreshold = 0.05; // 5 cm snap zone
    this.isInSnapZone = false;

    this.activeAnimations = [];
    this.currentMode = 'explore'; // 'explore', 'disassembled', 'play'

    this.snapFeedbackEl = document.getElementById('snap-feedback');

    // Clean Selection/Hover Box Helper (never mutates materials or turns parts blue)
    this.setupHoverHelper();

    this.onPointerMoveBound = this.onPointerMove.bind(this);
    this.onPointerUpBound = this.onPointerUp.bind(this);

    this.initEventListeners();
  }

  setupHoverHelper() {
    const dummy = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.01, 0.01));
    this.hoverBox = new THREE.BoxHelper(dummy, 0x00f0ff);
    this.hoverBox.visible = false;
    this.hoverBox.material.depthTest = false;
    this.hoverBox.material.transparent = true;
    this.hoverBox.material.opacity = 0.85;
    this.sceneManager.scene.add(this.hoverBox);
  }

  initEventListeners() {
    const dom = this.sceneManager.renderer.domElement;
    dom.addEventListener('pointerdown', this.onPointerDown.bind(this));
    window.addEventListener('pointermove', this.onPointerMoveBound);
    window.addEventListener('pointerup', this.onPointerUpBound);
  }

  setMode(mode) {
    this.currentMode = mode;
    this.clearHover();
    if (this.draggedObject) {
      this.onPointerUp();
    }
  }

  onPointerMove(e) {
    this.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    this.pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;

    if (this.draggedObject) {
      this.handleDrag();
    } else {
      this.handleHover();
    }
  }

  handleHover() {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const interactiveMeshes = [];

    // Collect candidate meshes
    Object.values(this.components).forEach((obj) => {
      if (obj.isMesh) interactiveMeshes.push(obj);
      obj.traverse((child) => {
        if (child.isMesh) interactiveMeshes.push(child);
      });
    });

    const intersects = this.raycaster.intersectObjects(interactiveMeshes, false);

    if (intersects.length > 0) {
      let topObj = intersects[0].object;
      while (topObj.parent && !topObj.userData.id && topObj.parent !== this.sceneManager.scene) {
        topObj = topObj.parent;
      }

      if (topObj && topObj.userData.id) {
        if (this.hoveredObject !== topObj) {
          this.hoveredObject = topObj;
          document.body.style.cursor = 'pointer';

          // For CPU and RAM, attach clean selection bracket
          if (topObj.userData.id !== 'motherboard') {
            this.hoverBox.setFromObject(topObj);
            this.hoverBox.visible = true;
            this.hoverBox.material.color.setHex(0x00f0ff);
          } else {
            this.hoverBox.visible = false;
          }

          soundEffects.playHover();
        }
        return;
      }
    }

    if (this.hoveredObject) {
      this.clearHover();
      document.body.style.cursor = 'default';
    }
  }

  clearHover() {
    this.hoveredObject = null;
    if (this.hoverBox) {
      this.hoverBox.visible = false;
    }
  }

  onPointerDown(e) {
    if (e.button !== 0) return; // Left click only

    this.raycaster.setFromCamera(this.pointer, this.camera);
    const interactiveMeshes = [];
    Object.values(this.components).forEach((obj) => {
      if (obj.isMesh) interactiveMeshes.push(obj);
      obj.traverse((child) => {
        if (child.isMesh) interactiveMeshes.push(child);
      });
    });

    const intersects = this.raycaster.intersectObjects(interactiveMeshes, false);
    if (intersects.length === 0) return;

    let target = intersects[0].object;
    while (target.parent && !target.userData.id && target.parent !== this.sceneManager.scene) {
      target = target.parent;
    }

    if (!target || !target.userData.id) return;
    const id = target.userData.id;

    // Immediately present info card, but NEVER move/zoom camera on click!
    if (this.callbacks.onSelectComponent) {
      this.callbacks.onSelectComponent(id, false);
    }

    // In Play Mode: Start dragging immediately if component is uninstalled
    if (this.currentMode === 'play') {
      if (id !== 'motherboard' && !target.userData.isInstalled) {
        this.startDrag(target);
      }
    }
  }

  startDrag(object) {
    this.draggedObject = object;
    this.controls.enabled = false;
    this.clearHover();
    soundEffects.playPickup();

    // Cancel any running animations or camera tweens so camera stays rock-solid
    this.activeAnimations = this.activeAnimations.filter((a) => a.object !== object);
    this.sceneManager.cameraTween = null;

    // Plane at fixed clearance elevation above the motherboard
    const dragHeight = 0.64;
    this.dragPlane.set(new THREE.Vector3(0, 1, 0), -dragHeight);

    // Lift object immediately to drag height
    this.draggedObject.position.y = dragHeight;

    // Calculate exact pointer offset on the drag plane
    this.raycaster.setFromCamera(this.pointer, this.camera);
    if (this.raycaster.ray.intersectPlane(this.dragPlane, this.planeIntersectPoint)) {
      this.dragOffset.subVectors(this.draggedObject.position, this.planeIntersectPoint);
    } else {
      this.dragOffset.set(0, 0, 0);
    }

    // Show guide hologram for this component
    const guide = this.guides[object.userData.id];
    if (guide) {
      guide.visible = true;
      guide.material.opacity = 0.7;
      guide.material.color.setHex(0x00f0ff);
    }
  }

  handleDrag() {
    if (!this.draggedObject) return;

    this.raycaster.setFromCamera(this.pointer, this.camera);

    if (this.raycaster.ray.intersectPlane(this.dragPlane, this.planeIntersectPoint)) {
      const newPos = this.planeIntersectPoint.clone().add(this.dragOffset);
      this.draggedObject.position.x = newPos.x;
      this.draggedObject.position.z = newPos.z;
      this.draggedObject.position.y = 0.64;

      // Check distance to target assembled position
      const targetPos = this.draggedObject.userData.assembledPos;
      const horizontalDist = new THREE.Vector2(newPos.x - targetPos.x, newPos.z - targetPos.z).length();

      const guide = this.guides[this.draggedObject.userData.id];

      if (horizontalDist < this.snapThreshold) {
        if (!this.isInSnapZone) {
          this.isInSnapZone = true;
          if (this.snapFeedbackEl) this.snapFeedbackEl.classList.remove('hidden');
          soundEffects.playHover();
        }
        if (guide) {
          guide.material.color.setHex(0x00ff88);
          guide.material.opacity = 0.95;
        }
      } else {
        if (this.isInSnapZone) {
          this.isInSnapZone = false;
          if (this.snapFeedbackEl) this.snapFeedbackEl.classList.add('hidden');
        }
        if (guide) {
          guide.material.color.setHex(0x00f0ff);
          guide.material.opacity = 0.6;
        }
      }
    }
  }

  onPointerUp() {
    if (!this.draggedObject) return;

    this.controls.enabled = true;
    const obj = this.draggedObject;
    this.draggedObject = null;

    if (this.snapFeedbackEl) this.snapFeedbackEl.classList.add('hidden');

    const guide = this.guides[obj.userData.id];
    if (guide) {
      guide.visible = false;
    }

    // Check if within snap threshold
    const targetPos = obj.userData.assembledPos;
    const horizontalDist = new THREE.Vector2(obj.position.x - targetPos.x, obj.position.z - targetPos.z).length();

    if (horizontalDist < this.snapThreshold) {
      // Snap to target!
      this.animateTo(obj, obj.userData.assembledPos, obj.userData.assembledQuat, 220, () => {
        obj.userData.isInstalled = true;
        soundEffects.playSnap();
        if (this.callbacks.onComponentInstalled) {
          this.callbacks.onComponentInstalled(obj.userData.id);
        }
      });
    } else {
      // Return to tray smoothly
      soundEffects.playCancel();
      this.animateTo(obj, obj.userData.disassembledPos, obj.userData.assembledQuat, 350);
    }

    this.isInSnapZone = false;
  }

  // Smooth position/rotation interpolation with object de-duplication
  animateTo(object, targetPos, targetQuat, duration = 400, onDone = null) {
    this.activeAnimations = this.activeAnimations.filter((a) => a.object !== object);

    const startPos = object.position.clone();
    const startQuat = object.quaternion.clone();
    const startTime = performance.now();

    const anim = {
      object: object,
      update: (now) => {
        const progress = Math.min((now - startTime) / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);

        object.position.lerpVectors(startPos, targetPos, ease);
        object.quaternion.slerpQuaternions(startQuat, targetQuat, progress);

        if (progress >= 1) {
          object.position.copy(targetPos);
          object.quaternion.copy(targetQuat);
          this.activeAnimations = this.activeAnimations.filter((a) => a !== anim);
          if (onDone) onDone();
        }
      }
    };

    this.activeAnimations.push(anim);
  }

  update() {
    const now = performance.now();
    for (let i = this.activeAnimations.length - 1; i >= 0; i--) {
      this.activeAnimations[i].update(now);
    }
  }
}
