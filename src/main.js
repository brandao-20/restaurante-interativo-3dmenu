import 'aframe';
import './app/components.js';
import { App } from './app/app.js';

window.addEventListener('DOMContentLoaded', () => {
  const scene = document.querySelector('a-scene');
  scene.addEventListener('loaded', () => {
    const app = new App(scene);
    app.init();
    // Expor para debug (não é necessário, mas ajuda se precisares)
    window.__app = app;
  });
});
