import * as THREE from 'three';
import { soundEffects } from './audio.js';
import { EDUCATIONAL_DATA } from './educationalData.js';

export class GameManager {
  constructor(sceneManager, interactionManager, components) {
    this.sceneManager = sceneManager;
    this.interactionManager = interactionManager;
    this.components = components;

    this.mode = 'explore'; // 'explore', 'disassembled', 'play'
    this.installedState = {
      cpu: true,
      ram_slot1: true,
      ram_slot2: true
    };
    this.currentComponentId = 'motherboard';

    // UI Elements
    this.modeBadge = document.getElementById('current-mode-badge');
    this.bannerStep = document.getElementById('banner-step');
    this.bannerText = document.getElementById('banner-text');
    this.bannerIcon = document.getElementById('banner-icon');

    this.btnExplore = document.getElementById('btn-mode-explore');
    this.btnDisassemble = document.getElementById('btn-action-disassemble');
    this.btnPlay = document.getElementById('btn-action-play');

    this.dotCpu = document.getElementById('dot-cpu');
    this.dotRam1 = document.getElementById('dot-ram1');
    this.dotRam2 = document.getElementById('dot-ram2');

    this.infoDrawer = document.getElementById('info-drawer');
    this.postModal = document.getElementById('post-modal');

    this.bindUI();
    this.updateProgressUI();

    // Present initial motherboard educational card on load without moving camera
    this.showComponentInfo('motherboard', false);
  }

  bindUI() {
    this.btnExplore.addEventListener('click', () => this.switchMode('explore'));
    this.btnDisassemble.addEventListener('click', () => this.triggerDisassemble());
    this.btnPlay.addEventListener('click', () => this.triggerPlay());

    // Drawer close
    const btnCloseDrawer = document.getElementById('btn-close-drawer');
    if (btnCloseDrawer) {
      btnCloseDrawer.addEventListener('click', () => this.closeDrawer());
    }

    // Drawer focus button (only focuses when user explicitly clicks this button!)
    const btnDrawerFocus = document.getElementById('btn-drawer-focus');
    if (btnDrawerFocus) {
      btnDrawerFocus.addEventListener('click', () => {
        this.focusCurrentComponent();
      });
    }

    // Hardware Info Toggle button
    const btnToggleInfo = document.getElementById('btn-toggle-info');
    if (btnToggleInfo) {
      btnToggleInfo.addEventListener('click', () => {
        this.toggleDrawer();
      });
    }

    // Modal buttons
    const btnModalInspect = document.getElementById('btn-modal-inspect');
    if (btnModalInspect) {
      btnModalInspect.addEventListener('click', () => {
        this.postModal.classList.add('hidden');
        this.switchMode('explore');
      });
    }

    const btnModalDisassemble = document.getElementById('btn-modal-disassemble');
    if (btnModalDisassemble) {
      btnModalDisassemble.addEventListener('click', () => {
        this.postModal.classList.add('hidden');
        this.triggerDisassemble();
      });
    }

    // Sound toggle
    const btnSound = document.getElementById('btn-sound-toggle');
    if (btnSound) {
      btnSound.addEventListener('click', () => {
        const isMuted = soundEffects.toggleMute();
        btnSound.textContent = isMuted ? '🔇' : '🔊';
      });
    }

    // Reset View
    const btnResetView = document.getElementById('btn-reset-view');
    if (btnResetView) {
      btnResetView.addEventListener('click', () => {
        this.sceneManager.resetCamera();
        soundEffects.playHover();
      });
    }

    // Quick select buttons in banner
    const quickButtons = document.querySelectorAll('.quick-info-btn');
    quickButtons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const compId = btn.getAttribute('data-comp');
        if (compId) this.showComponentInfo(compId, false);
      });
    });
  }

  switchMode(newMode) {
    this.mode = newMode;
    this.interactionManager.setMode(newMode);

    // Update buttons
    [this.btnExplore, this.btnDisassemble, this.btnPlay].forEach((btn) => btn.classList.remove('active'));

    if (newMode === 'explore') {
      this.btnExplore.classList.add('active');
      this.modeBadge.className = 'mode-badge explore';
      this.modeBadge.textContent = '1. EXPLORE & LEARN';
      this.bannerIcon.textContent = '🔍';
      this.bannerStep.textContent = 'EXPLORATION MODE';
      this.bannerText.textContent = 'Click any component to inspect specifications, architecture, and handling guides.';
    } else if (newMode === 'disassembled') {
      this.btnDisassemble.classList.add('active');
      this.modeBadge.className = 'mode-badge disassembled';
      this.modeBadge.textContent = '2. DISASSEMBLED';
      this.bannerIcon.textContent = '⚙️';
      this.bannerStep.textContent = 'HARDWARE ISOLATED';
      this.bannerText.textContent = 'CPU and RAM are isolated on the mat. Click "Run Assembly" to begin guided installation.';
      this.showComponentInfo('disassembly_overview', false);
    } else if (newMode === 'play') {
      this.btnPlay.classList.add('active');
      this.modeBadge.className = 'mode-badge play';
      this.modeBadge.textContent = '3. GUIDED ASSEMBLY';
      this.bannerIcon.textContent = '🎮';
      this.updatePlayInstructions();
    }
  }

  triggerDisassemble() {
    soundEffects.playUnlatch();
    // Keep camera in wide workstation overview view
    this.sceneManager.resetCamera();
    this.switchMode('disassembled');

    // Smoothly animate parts out of their sockets to their trays
    const parts = ['cpu', 'ram_slot1', 'ram_slot2'];
    parts.forEach((id, idx) => {
      const obj = this.components[id];
      if (obj) {
        obj.userData.isInstalled = false;
        this.installedState[id] = false;

        // Lift vertically then slide to tray
        const liftPos = obj.position.clone().add(new THREE.Vector3(0, 0.12, 0));
        setTimeout(() => {
          this.interactionManager.animateTo(obj, liftPos, obj.userData.assembledQuat, 220, () => {
            this.interactionManager.animateTo(obj, obj.userData.disassembledPos, obj.userData.assembledQuat, 380);
          });
        }, idx * 100);
      }
    });

    this.updateProgressUI();

    // Immediately present disassembly educational overview without moving camera
    this.showComponentInfo('disassembly_overview', false);
  }

  triggerPlay() {
    // Keep camera in wide workstation overview view
    this.sceneManager.resetCamera();

    // If all parts are already assembled, disassemble them first so user can play
    const allInstalled = Object.values(this.installedState).every(Boolean);
    if (allInstalled) {
      this.triggerDisassemble();
      setTimeout(() => {
        this.switchMode('play');
        this.updatePlayInstructions();
      }, 700);
    } else {
      this.switchMode('play');
      this.updatePlayInstructions();
    }
  }

  onComponentInstalled(id) {
    this.installedState[id] = true;
    this.updateProgressUI();

    // Check if all installed
    const allDone = Object.values(this.installedState).every(Boolean);
    if (allDone) {
      setTimeout(() => {
        soundEffects.playSuccess();
        this.postModal.classList.remove('hidden');
      }, 400);
    } else {
      this.updatePlayInstructions();
    }
  }

  updatePlayInstructions() {
    if (!this.installedState.cpu) {
      this.bannerStep.textContent = 'STEP 1: CPU INSTALLATION';
      this.bannerText.textContent = 'Drag the CPU from the left tray and drop it directly onto the LGA socket.';
      this.showComponentInfo('cpu', false);
    } else if (!this.installedState.ram_slot1) {
      this.bannerStep.textContent = 'STEP 2: RAM CHANNEL A';
      this.bannerText.textContent = 'Drag RAM Stick 1 into the primary DIMM slot on the right.';
      this.showComponentInfo('ram_slot1', false);
    } else if (!this.installedState.ram_slot2) {
      this.bannerStep.textContent = 'STEP 3: RAM CHANNEL B';
      this.bannerText.textContent = 'Drag RAM Stick 2 into the secondary slot to activate Dual-Channel memory.';
      this.showComponentInfo('ram_slot2', false);
    } else {
      this.bannerStep.textContent = 'ASSEMBLY COMPLETE';
      this.bannerText.textContent = 'All hardware modules successfully installed!';
    }
  }

  updateProgressUI() {
    this.dotCpu.className = `dot ${this.installedState.cpu ? 'installed' : ''}`;
    this.dotRam1.className = `dot ${this.installedState.ram_slot1 ? 'installed' : ''}`;
    this.dotRam2.className = `dot ${this.installedState.ram_slot2 ? 'installed' : ''}`;
  }

  showComponentInfo(id, focusCamera = false) {
    const data = EDUCATIONAL_DATA[id];
    if (!data) return;

    this.currentComponentId = id;
    soundEffects.playHover();

    document.getElementById('info-icon').textContent = data.icon;
    document.getElementById('info-title').textContent = data.name;
    document.getElementById('info-category').textContent = data.category;
    document.getElementById('info-subtitle').textContent = data.subtitle;
    document.getElementById('info-description').textContent = data.description;
    document.getElementById('info-warning').textContent = data.safetyWarning;

    // Build specs
    const specsEl = document.getElementById('info-specs');
    specsEl.innerHTML = data.specs
      .map(
        (s) => `
        <div class="spec-row">
          <span class="spec-label">${s.label}</span>
          <span class="spec-value">${s.value}</span>
        </div>
      `
      )
      .join('');

    // Build guide
    const guideEl = document.getElementById('info-guide');
    guideEl.innerHTML = data.installationGuide.map((step) => `<li>${step}</li>`).join('');

    // Open the drawer
    this.infoDrawer.classList.add('open');

    // ONLY focus camera if explicitly asked (default false!)
    if (focusCamera) {
      const obj = this.components[id];
      if (obj) {
        this.sceneManager.focusOn(obj.position, 0.28, 700);
      }
    }
  }

  focusCurrentComponent() {
    if (this.currentComponentId && this.components[this.currentComponentId]) {
      const obj = this.components[this.currentComponentId];
      this.sceneManager.focusOn(obj.position, 0.28, 700);
      soundEffects.playHover();
    }
  }

  toggleDrawer() {
    this.infoDrawer.classList.toggle('open');
    soundEffects.playHover();
  }

  closeDrawer() {
    this.infoDrawer.classList.remove('open');
  }
}
