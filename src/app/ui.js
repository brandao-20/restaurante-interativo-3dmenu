import { makeEntity, makeText } from './utils.js';

const COLORS = {
  panel: '#101826',
  stroke: '#2A3A55',
  text: '#EAF2FF',
  muted: '#A8B6CC',
  accent: '#4DA3FF',
  danger: '#FF5A73',
  ok: '#41D17E',
  warn: '#F0C24E',
  btn: '#13233A'
};

function setPlane(el, { w, h, color, opacity = 0.92, depthWrite = true, depthTest = true }) {
  el.setAttribute('geometry', { primitive: 'plane', width: w, height: h });
  el.setAttribute('material', {
    color,
    shader: 'flat',
    transparent: opacity < 1,
    opacity,
    depthWrite,
    depthTest
  });
}

function makePanel({ id, title, w, h, position }) {
  const panel = makeEntity('a-entity', { id, position });

  const bg = makeEntity('a-plane', { id: `${id}_bg` });
  // BG atrás + não escreve depth (não tapa botões)
  setPlane(bg, { w, h, color: COLORS.panel, opacity: 0.92, depthWrite: false });
  bg.setAttribute('position', '0 0 -0.004');
  panel.appendChild(bg);

  const border = makeEntity('a-plane', { id: `${id}_border` });
  // Border atrás + não escreve depth
  setPlane(border, { w: w + 0.012, h: h + 0.012, color: COLORS.stroke, opacity: 0.28, depthWrite: false });
  border.setAttribute('position', '0 0 -0.006');
  panel.appendChild(border);

  // Título pequeno (menos "gigante")
  const titleText = makeText(title, {
    position: `${-(w / 2) + 0.028} ${(h / 2) - 0.045} 0.01`,
    color: COLORS.text,
    width: 0.62,
    wrapCount: 18,
    align: 'left'
  });
  panel.appendChild(titleText);

  // Âncora TOP (conteúdo começa abaixo do título)
  const top = makeEntity('a-entity', {
    id: `${id}_top`,
    position: `0 ${(h / 2) - 0.11} 0.01`
  });

  // Âncora BOTTOM (ações/total)
  const bottom = makeEntity('a-entity', {
    id: `${id}_bottom`,
    position: `0 ${-(h / 2) + 0.09} 0.01`
  });

  panel.appendChild(top);
  panel.appendChild(bottom);

  return { panel, top, bottom, bg, border, titleText, w, h };
}

/**
 * Ajusta a altura de um painel (fundo, border, título e âncoras TOP/BOTTOM).
 */
export function setPanelHeight(panelObj, newH) {
  if (!panelObj || !panelObj.panel) return;

  const h = Math.max(0.12, Number(newH) || panelObj.h || 0.24);
  panelObj.h = h;

  // Fundo e borda
  setPlane(panelObj.bg, { w: panelObj.w, h, color: COLORS.panel, opacity: 0.92, depthWrite: false });
  panelObj.bg.setAttribute('position', '0 0 -0.004');

  setPlane(panelObj.border, { w: panelObj.w + 0.012, h: h + 0.012, color: COLORS.stroke, opacity: 0.28, depthWrite: false });
  panelObj.border.setAttribute('position', '0 0 -0.006');

  // Título reposicionado
  panelObj.titleText.setAttribute(
    'position',
    `${-(panelObj.w / 2) + 0.028} ${(h / 2) - 0.045} 0.01`
  );

  // Âncoras TOP/BOTTOM reposicionadas
  panelObj.top.setAttribute('position', `0 ${(h / 2) - 0.11} 0.01`);
  panelObj.bottom.setAttribute('position', `0 ${-(h / 2) + 0.09} 0.01`);
}

/**
 * Reposiciona os painéis em colunas (esquerda e direita) para nunca sobreporem,
 * mesmo quando as alturas mudam.
 */
export function relayoutMenuPanels(ui) {
  if (!ui?.panels || !ui?.layout) return;

  const { xL, xM, xR, gap, yOptions } = ui.layout;

  const pCat = ui.panels.panelCategories;
  const pItems = ui.panels.panelItems;
  const pDet = ui.panels.panelDetails;
  const pCart = ui.panels.panelCart;
  const pOpt = ui.panels.panelOptions;

  // Left column: Categories (top) + Items (bottom)
  const hCat = pCat.h;
  const hItems = pItems.h;
  const yCat = (hItems / 2) + (gap / 2);
  const yItems = -((hCat / 2) + (gap / 2));

  pCat.panel.setAttribute('position', `${xL} ${yCat.toFixed(3)} 0`);
  pItems.panel.setAttribute('position', `${xL} ${yItems.toFixed(3)} 0`);

  // Right column: Details (top) + Cart (bottom)
  const hDet = pDet.h;
  const hCart = pCart.h;
  const yDet = (hCart / 2) + (gap / 2);
  const yCart = -((hDet / 2) + (gap / 2));

  pDet.panel.setAttribute('position', `${xR} ${yDet.toFixed(3)} 0`);
  pCart.panel.setAttribute('position', `${xR} ${yCart.toFixed(3)} 0`);

  // Middle: Options (single panel)
  pOpt.panel.setAttribute('position', `${xM} ${(yOptions ?? 0.02).toFixed(3)} 0`);
}

export function buildStaticMenuLayout(menuRoot) {
  const root = makeEntity('a-entity', { id: 'uiRoot' });

  // Reduz tudo um bocado (painéis + textos + botões)
  root.setAttribute('scale', '0.1 0.1 0.1');

  /**
   * Layout:
   * ESQUERDA: Categorias (topo) + Pratos (baixo)
   * MEIO: Opções
   * DIREITA: Detalhes (topo) + Carrinho (baixo)
   */

  // Colunas (x)
  const xL = -0.95;
  const xM = 0.00;
  const xR = 0.95;

  // Tamanhos base
  const wSide = 0.78;
  const hTop = 0.24;
  const hBot = 0.44;

  // Espaço vertical entre painéis
  const gap = 0.06;

  // posições iniciais (serão recalculadas por relayoutMenuPanels)
  const yTopInit = (hBot / 2) + (gap / 2);
  const yBotInit = -((hTop / 2) + (gap / 2));

  // --- ESQUERDA: Categorias + Pratos ---
  const panelCategories = makePanel({
    id: 'panelCategories',
    title: 'Categorias',
    w: wSide,
    h: hTop,
    position: `${xL} ${yTopInit} 0`
  });

  const panelItems = makePanel({
    id: 'panelItems',
    title: 'Pratos',
    w: wSide,
    h: hBot,
    position: `${xL} ${yBotInit} 0`
  });

  // --- MEIO: Opções ---
  const panelOptions = makePanel({
    id: 'panelOptions',
    title: 'Opções',
    w: 0.86,
    h: 0.74,
    position: `${xM} 0.02 0`
  });

  // --- DIREITA: Detalhes + Carrinho ---
  const panelDetails = makePanel({
    id: 'panelDetails',
    title: 'Detalhes',
    w: wSide,
    h: hTop,
    position: `${xR} ${yTopInit} 0`
  });

  const panelCart = makePanel({
    id: 'panelCart',
    title: 'Carrinho',
    w: wSide,
    h: hBot,
    position: `${xR} ${yBotInit} 0`
  });

  // --- Categorias (dentro da caixa) ---
  const categories = makeEntity('a-entity', { id: 'uiCategories' });
  panelCategories.top.appendChild(categories);

  // --- Pratos (dentro da caixa) ---
  const items = makeEntity('a-entity', { id: 'uiItems' });
  panelItems.top.appendChild(items);

  // --- Opções + ações ---
  const options = makeEntity('a-entity', { id: 'uiOptions' });
  panelOptions.top.appendChild(options);

  const actions = makeEntity('a-entity', { id: 'uiDishActions' });
  panelOptions.bottom.appendChild(actions);

  // --- Detalhes ---
  const dishName = makeText('—', {
    id: 'txtDishName',
    position: `${-(panelDetails.w / 2) + 0.03} 0 0.01`,
    width: 0.70,
    wrapCount: 26,
    color: COLORS.text,
    align: 'left'
  });

  const dishPrice = makeText('—', {
    id: 'txtDishPrice',
    position: `${-(panelDetails.w / 2) + 0.03} -0.05 0.01`,
    width: 0.70,
    wrapCount: 26,
    color: COLORS.accent,
    align: 'left'
  });

  panelDetails.top.appendChild(dishName);
  panelDetails.top.appendChild(dishPrice);

  const previewButtons = makeEntity('a-entity', { id: 'previewButtons' });
  panelDetails.bottom.appendChild(previewButtons);

  // --- Carrinho ---
  const cartList = makeEntity('a-entity', { id: 'cartList' });
  panelCart.top.appendChild(cartList);

  const cartTotal = makeText('Total: 0,00€', {
    id: 'cartTotal',
    position: `${-(panelCart.w / 2) + 0.03} 0 0.01`,
    color: COLORS.accent,
    wrapCount: 26,
    width: 0.75,
    align: 'left'
  });

  const cartActions = makeEntity('a-entity', { id: 'cartActions' });
  cartActions.setAttribute('position', '0 -0.06 0');
  panelCart.bottom.appendChild(cartTotal);
  panelCart.bottom.appendChild(cartActions);

  // Preview mount vazio (compat)
  const previewMount = makeEntity('a-entity', { id: 'previewMount' });

  // assemble
  root.appendChild(panelCategories.panel);
  root.appendChild(panelItems.panel);
  root.appendChild(panelOptions.panel);
  root.appendChild(panelDetails.panel);
  root.appendChild(panelCart.panel);

  menuRoot.appendChild(root);

  const ui = {
    categories,
    items,
    options,
    actions,
    previewMount,
    previewButtons,
    txtDishName: dishName,
    txtDishPrice: dishPrice,
    cartList,
    cartTotal,
    cartActions,
    panels: {
      panelCategories,
      panelItems,
      panelOptions,
      panelDetails,
      panelCart
    },
    layout: {
      xL,
      xM,
      xR,
      gap,
      yOptions: 0.02
    }
  };

  // Garante layout inicial consistente
  relayoutMenuPanels(ui);

  return ui;
}

/**
 * Botão compacto (texto menor)
 */
export function makeButton({ label, width = 0.34, height = 0.050, action = '', payload = {}, tooltip = '' }) {
  const root = makeEntity('a-plane', {
    class: 'interactive',
    'ui-action': { action, payload: JSON.stringify(payload), tooltip }
  });

  setPlane(root, { w: width, h: height, color: COLORS.btn, opacity: 0.95, depthWrite: true });

  const stroke = makeEntity('a-plane', {});
  setPlane(stroke, { w: width + 0.005, h: height + 0.005, color: COLORS.stroke, opacity: 0.35, depthWrite: true });
  stroke.setAttribute('position', '0 0 -0.002');
  root.appendChild(stroke);

  const txt = makeText(label, {
    align: 'center',
    baseline: 'center',
    position: '0 0 0.01',
    wrapCount: 22,
    width: 0.62,
    color: COLORS.text
  });

  root.appendChild(txt);
  root.setAttribute('ui-hoverable', { mode: 'button' });

  return root;
}

export function makeToggle({ label, key, value, tooltip = '' }) {
  const root = makeEntity('a-entity', { id: `ctl_${key}` });

  const btn = makeButton({
    label: `${label}: ${value ? 'ON' : 'OFF'}`,
    width: 0.78,
    height: 0.050,
    action: 'toggle',
    payload: { key },
    tooltip
  });

  btn.setAttribute('ui-toggle', { key, value: value ? 'true' : 'false', label });
  root.appendChild(btn);

  return root;
}

export function makeSelect({ label, key, value, options, tooltip = '' }) {
  const root = makeEntity('a-entity', { id: `ctl_${key}` });

  const btn = makeButton({
    label: `${label}: ${String(value)}`,
    width: 0.78,
    height: 0.050,
    action: 'cycle',
    payload: { key },
    tooltip
  });

  btn.setAttribute('ui-select', { key, label, value: String(value), options: JSON.stringify(options) });
  root.appendChild(btn);

  return root;
}

export function makeSlider({ label, key, value, steps, tooltip = '' }) {
  const root = makeEntity('a-entity', { id: `ctl_${key}` });

  const left = makeButton({
    label: '◀',
    width: 0.12,
    height: 0.050,
    action: 'step',
    payload: { key, dir: -1 },
    tooltip
  });
  left.setAttribute('position', '-0.33 0 0');

  const mid = makeButton({
    label: `${label}: ${String(value)}`,
    width: 0.48,
    height: 0.050,
    action: 'noop',
    payload: {},
    tooltip
  });
  mid.setAttribute('position', '0 0 0');
  mid.setAttribute('ui-slider', { key, label, value: String(value), steps: JSON.stringify(steps) });

  const right = makeButton({
    label: '▶',
    width: 0.12,
    height: 0.050,
    action: 'step',
    payload: { key, dir: 1 },
    tooltip
  });
  right.setAttribute('position', '0.33 0 0');

  root.appendChild(left);
  root.appendChild(mid);
  root.appendChild(right);

  return root;
}

export function makeToggleGroup({ label, key, valuesObj, options, tooltip = '' }) {
  const root = makeEntity('a-entity', { id: `ctl_${key}` });

  // Label um bocadinho mais acima para não colidir com a 1ª linha
  const labelY = 0.03;
  root.appendChild(
    makeText(label, {
      position: `-0.36 ${labelY} 0.01`,
      width: 0.62,
      wrapCount: 26,
      color: COLORS.muted,
      align: 'left'
    })
  );

  const cols = 2;
  const w = 0.37;

  const h = 0.056;
  const rowStep = 0.078;
  const startY = -0.08;

  options.forEach((opt, i) => {
    const on = !!valuesObj[opt];

    const btn = makeButton({
      label: `${on ? '✓' : '✕'} ${opt}`,
      width: w,
      height: h,
      action: 'toggleNested',
      payload: { key, nested: opt },
      tooltip
    });

    btn.setAttribute('ui-toggle-nested', { key, nested: opt, value: on ? 'true' : 'false' });

    const col = i % cols;
    const row = Math.floor(i / cols);

    const x = -0.19 + col * 0.39;
    const y = startY - row * rowStep;

    btn.setAttribute('position', `${x.toFixed(3)} ${y.toFixed(3)} 0`);
    root.appendChild(btn);
  });

  return root;
}

export function setButtonLabel(btnEntity, label) {
  const txt = btnEntity.querySelector('a-text');
  if (txt) txt.setAttribute('value', label);
}

export const UI_COLORS = COLORS;
