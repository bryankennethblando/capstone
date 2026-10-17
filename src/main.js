import { SceneManager } from './scene.js';
import { ModelLoader } from './modelLoader.js';
import { InteractionManager } from './interaction.js';
import { GameManager } from './gameManager.js';

window.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('canvas-container');
  const loadingScreen = document.getElementById('loading-screen');
  const progressBar = document.getElementById('progress-bar');
  const progressText = document.getElementById('progress-text');

  // Initialize Three.js Scene
  const sceneManager = new SceneManager(container);

  let interactionManager = null;
  let gameManager = null;

  // Track progress
  const onProgress = (percent) => {
    progressBar.style.width = `${percent}%`;
    progressText.textContent = `${percent}%`;
  };

  // When model is completely loaded
  const onComplete = (components, guides) => {
    // Fade out loading screen smoothly
    loadingScreen.classList.add('hidden');

    // Setup interaction manager
    interactionManager = new InteractionManager(sceneManager, components, guides, {
      onSelectComponent: (id) => {
        if (gameManager) {
          gameManager.showComponentInfo(id, false);
        }
      },
      onComponentInstalled: (id) => {
        if (gameManager) {
          gameManager.onComponentInstalled(id);
        }
      }
    });

    // Setup game manager
    gameManager = new GameManager(sceneManager, interactionManager, components);
  };

  // Start model loading
  const modelLoader = new ModelLoader(sceneManager.scene, onProgress, onComplete);
  modelLoader.load('/model/cap.glb');

  // Main Render Loop (60 FPS)
  function animate() {
    requestAnimationFrame(animate);

    sceneManager.update();
    if (interactionManager) {
      interactionManager.update();
    }
    sceneManager.render();
  }

  animate();
});
