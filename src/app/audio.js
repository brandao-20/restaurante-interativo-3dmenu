export class AudioManager {
  constructor(sceneEl) {
    this.sceneEl = sceneEl;
    this.clickEl = document.querySelector('#sfxClick');
    this.successEl = document.querySelector('#sfxSuccess');
  }

  click() {
    try { this.clickEl?.components?.sound?.playSound(); } catch (e) {}
  }

  success() {
    try { this.successEl?.components?.sound?.playSound(); } catch (e) {}
  }
}
