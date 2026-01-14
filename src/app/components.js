import { clamp, deepClone, eur, makeEntity, makeText, dispatchToast } from './utils.js';
import { UI_COLORS, setButtonLabel } from './ui.js';

AFRAME.registerComponent('ui-hoverable', {
  schema: {
    mode: { default: 'button' },
    baseColor: { default: '#13233A' },
    hoverColor: { default: '#1A3152' },
    downColor: { default: '#2B4A77' }
  },
  init() {
    // ✅ CLICKFIX: se o botão for a-plane, o "bg" é o próprio el
    this.bg = (this.el.tagName && this.el.tagName.toLowerCase() === 'a-plane')
      ? this.el
      : this.el.querySelector('a-plane');

    this.applyBase();

    this.el.addEventListener('mouseenter', () => {
      this.bg?.setAttribute('material', {
        color: this.data.hoverColor,
        transparent: true,
        opacity: 0.95,
        shader: 'flat'
      });
      this.el.emit('ui-hover', {}, true);
    });

    this.el.addEventListener('mouseleave', () => {
      this.applyBase();
      this.el.emit('ui-unhover', {}, true);
    });

    this.el.addEventListener('mousedown', () => {
      this.bg?.setAttribute('material', {
        color: this.data.downColor,
        transparent: true,
        opacity: 0.95,
        shader: 'flat'
      });
    });

    this.el.addEventListener('mouseup', () => {
      this.bg?.setAttribute('material', {
        color: this.data.hoverColor,
        transparent: true,
        opacity: 0.95,
        shader: 'flat'
      });
    });
  },
  update() {
    this.applyBase();
  },
  applyBase() {
    this.bg?.setAttribute('material', {
      color: this.data.baseColor,
      transparent: true,
      opacity: 0.95,
      shader: 'flat'
    });
  }
});

AFRAME.registerComponent('ui-action', {
  schema: {
    action: { default: '' },
    payload: { default: '{}' },
    tooltip: { default: '' }
  },
  init() {
    this.el.classList.add('interactive');
    this.el.addEventListener('click', () => {
      let payloadObj = {};
      try { payloadObj = JSON.parse(this.data.payload || '{}'); } catch (e) {}
      this.el.emit('ui-action', { action: this.data.action, payload: payloadObj }, true);
    });
  }
});

AFRAME.registerComponent('ui-tooltip', {
  schema: { text: { default: '' } },
  init() {
    const t = (this.data.text || '').trim();
    if (!t) return;

    const tip = document.createElement('a-entity');
    tip.setAttribute('visible', false);
    tip.setAttribute('position', '0.0 -0.06 0.03');

    const bg = document.createElement('a-plane');
    bg.setAttribute('geometry', { primitive: 'plane', width: 0.38, height: 0.06 });
    bg.setAttribute('material', { color: '#000000', transparent: true, opacity: 0.55, shader: 'flat' });
    bg.setAttribute('position', '0 0 0');

    const txt = document.createElement('a-text');
    txt.setAttribute('value', t);
    txt.setAttribute('color', '#FFFFFF');
    txt.setAttribute('align', 'center');
    txt.setAttribute('baseline', 'center');
    txt.setAttribute('wrapCount', 34);
    txt.setAttribute('width', 1.2);
    txt.setAttribute('position', '0 0 0.01');

    tip.appendChild(bg);
    tip.appendChild(txt);
    this.el.appendChild(tip);

    this.tip = tip;

    this.el.addEventListener('ui-hover', () => this.tip.setAttribute('visible', true));
    this.el.addEventListener('ui-unhover', () => this.tip.setAttribute('visible', false));
  }
});

AFRAME.registerComponent('ui-toggle', {
  schema: {
    key: { default: '' },
    label: { default: '' },
    value: { default: 'false' }
  }
});

AFRAME.registerComponent('ui-toggle-nested', {
  schema: {
    key: { default: '' },
    nested: { default: '' },
    value: { default: 'false' }
  }
});

AFRAME.registerComponent('ui-select', {
  schema: {
    key: { default: '' },
    label: { default: '' },
    value: { default: '' },
    options: { default: '[]' }
  }
});

AFRAME.registerComponent('ui-slider', {
  schema: {
    key: { default: '' },
    label: { default: '' },
    value: { default: '' },
    steps: { default: '[]' }
  }
});

AFRAME.registerComponent('toast-system', {
  init() {
    this.container = document.createElement('a-entity');
    this.container.setAttribute('position', '0 0.55 -0.8');
    this.container.setAttribute('rotation', '0 0 0');
    this.el.appendChild(this.container);

    this.el.addEventListener('toast', (e) => {
      const msg = e.detail?.message || '';
      if (!msg) return;
      this.show(msg);
    });
  },
  show(msg) {
    while (this.container.firstChild) this.container.removeChild(this.container.firstChild);

    const bg = document.createElement('a-plane');
    bg.setAttribute('geometry', { primitive: 'plane', width: 0.9, height: 0.10 });
    bg.setAttribute('material', { color: '#000000', transparent: true, opacity: 0.55, shader: 'flat' });

    const txt = document.createElement('a-text');
    txt.setAttribute('value', msg);
    txt.setAttribute('color', '#FFFFFF');
    txt.setAttribute('align', 'center');
    txt.setAttribute('baseline', 'center');
    txt.setAttribute('wrapCount', 44);
    txt.setAttribute('width', 2.2);
    txt.setAttribute('position', '0 0 0.01');

    const wrap = document.createElement('a-entity');
    wrap.appendChild(bg);
    wrap.appendChild(txt);
    this.container.appendChild(wrap);

    wrap.setAttribute('animation__in', {
      property: 'scale',
      from: '0.9 0.9 0.9',
      to: '1 1 1',
      dur: 140,
      easing: 'easeOutQuad'
    });

    wrap.setAttribute('animation__out', {
      property: 'material.opacity',
      from: 0.55,
      to: 0.0,
      dur: 500,
      easing: 'easeInQuad',
      delay: 1200
    });

    setTimeout(() => {
      try {
        while (this.container.firstChild) this.container.removeChild(this.container.firstChild);
      } catch (e) {}
    }, 1800);
  }
});

AFRAME.registerComponent('vr-cursor-fallback', {
  init() {
    this.scene = this.el.sceneEl;
    this.cursorGaze = document.querySelector('#cursorGaze');
    this.handL = document.querySelector('#handL');
    this.handR = document.querySelector('#handR');

    const update = () => {
      const inVR = this.scene.is('vr-mode');

      // Controllers can take a moment to be detected; check real controller objects.
      const hasController = (hand) => {
        if (!hand) return false;
        const tc =
          hand.components['tracked-controls'] ||
          hand.components['tracked-controls-webxr'] ||
          hand.components['tracked-controls-webvr'];
        return !!(tc && tc.controller);
      };

      const hasControllers = hasController(this.handL) || hasController(this.handR);

      if (this.cursorGaze) this.cursorGaze.setAttribute('visible', inVR && !hasControllers);
    };

    this.scene.addEventListener('enter-vr', () => setTimeout(update, 400));
    this.scene.addEventListener('exit-vr', update);
    setInterval(update, 1200);
  }
});

AFRAME.registerComponent('dish-orbit-controls', {
  schema: {
    autoRotate: { default: true },
    autoSpeed: { default: 18 }, // deg/sec
    minScale: { default: 0.35 },
    maxScale: { default: 1.6 }
  },
  init() {
    this.isDragging = false;
    this.lastX = 0;
    this.yaw = 0;
    this.pitch = 0;
    this.scale = 0.58;

    this.el.object3D.rotation.set(0, 0, 0);
    this.el.object3D.scale.set(this.scale, this.scale, this.scale);

    // Pointer controls (desktop + mobile)
    const onDown = (e) => {
      this.isDragging = true;
      this.lastX = (e.touches ? e.touches[0].clientX : e.clientX) || 0;
      this.lastY = (e.touches ? e.touches[0].clientY : e.clientY) || 0;
    };

    const onMove = (e) => {
      if (!this.isDragging) return;

      const x = (e.touches ? e.touches[0].clientX : e.clientX) || 0;
      const y = (e.touches ? e.touches[0].clientY : e.clientY) || 0;
      const dx = x - this.lastX;
      const dy = y - this.lastY;

      this.lastX = x;
      this.lastY = y;

      this.yaw += dx * 0.35;
      this.pitch = clamp(this.pitch + dy * 0.15, -25, 25);
      this.applyRotation();
    };

    const onUp = () => { this.isDragging = false; };

    this.el.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mouseup', onUp, { passive: true });

    this.el.addEventListener('touchstart', onDown, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onUp, { passive: true });

    // Wheel zoom (desktop)
    window.addEventListener('wheel', (e) => {
      if (!this.el.isConnected) return;
      if (!this.el.closest('#menuRoot') && !this.el.closest('#realScaleMount')) return;

      const delta = Math.sign(e.deltaY);
      this.scale = clamp(this.scale + (-delta) * 0.04, this.data.minScale, this.data.maxScale);
      this.el.object3D.scale.set(this.scale, this.scale, this.scale);
    }, { passive: true });

    // VR thumbstick rotate (opcional)
    const handR = document.querySelector('#handR');
    if (handR) {
      handR.addEventListener('thumbstickmoved', (e) => {
        const x = e.detail?.x || 0;
        this.yaw += x * 2.2;
        this.applyRotation();
      });
    }
  },
  tick(t, dt) {
    if (!this.data.autoRotate || this.isDragging) return;
    const dts = (dt || 16) / 1000;
    this.yaw += this.data.autoSpeed * dts;
    this.applyRotation();
  },
  applyRotation() {
    this.el.object3D.rotation.set(
      THREE.MathUtils.degToRad(this.pitch),
      THREE.MathUtils.degToRad(this.yaw),
      0
    );
  },
  setScale(s) {
    this.scale = s;
    this.el.object3D.scale.set(s, s, s);
  }
});
