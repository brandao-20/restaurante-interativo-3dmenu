export function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

export function eur(value) {
  const v = Math.round((Number(value) + Number.EPSILON) * 100) / 100;
  return v.toFixed(2).replace('.', ',') + '€';
}

export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export function setVisible(el, visible, animate = true) {
  if (!el) return;

  // A-Frame default visible is true when attribute absent.
  const attr = el.getAttribute('visible');
  const wasVisible = (attr === null) ? true : !!attr;
  const want = !!visible;

  // Clear pending hide
  if (el.__hideTimer) {
    clearTimeout(el.__hideTimer);
    el.__hideTimer = null;
  }

  if (want) {
    el.setAttribute('visible', true);
    if (animate && !wasVisible) popIn(el);
    return;
  }

  if (!animate || !wasVisible) {
    el.setAttribute('visible', false);
    return;
  }

  // Animate out then hide (simple, cheap)
  el.setAttribute('animation__out', {
    property: 'scale',
    from: '1 1 1',
    to: '0.85 0.85 0.85',
    dur: 160,
    easing: 'easeInQuad'
  });

  el.__hideTimer = setTimeout(() => {
    try {
      el.setAttribute('visible', false);
      el.setAttribute('scale', '1 1 1');
      el.removeAttribute('animation__out');
    } catch (e) {}
  }, 150);
}

export function setMaterialOpacity(el, opacity) {
  const mat = el.getAttribute('material') || {};
  el.setAttribute('material', { ...mat, transparent: true, opacity });
}

export function popIn(el, baseScale = null) {
  const s = baseScale || el.object3D.scale.clone();
  el.setAttribute('visible', true);
  el.object3D.scale.set(s.x * 0.8, s.y * 0.8, s.z * 0.8);
  el.setAttribute('animation__pop', {
    property: 'scale',
    to: `${s.x} ${s.y} ${s.z}`,
    dur: 200,
    easing: 'easeOutQuad'
  });
}

export function makeEntity(tag = 'a-entity', attrs = {}, children = []) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined) continue;
    if (typeof v === 'object') el.setAttribute(k, v);
    else el.setAttribute(k, String(v));
  }
  for (const c of children) el.appendChild(c);
  return el;
}

export function makeText(value, attrs = {}) {
  return makeEntity('a-text', {
    value,
    color: '#EAF2FF',
    align: 'left',
    baseline: 'top',
    wrapCount: 24,
    ...attrs
  });
}

export function dispatchToast(sceneEl, message) {
  sceneEl.emit('toast', { message }, false);
}
