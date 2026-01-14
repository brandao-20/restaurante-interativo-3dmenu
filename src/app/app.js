import { DishFactory } from './dishFactory.js';
import { AudioManager } from './audio.js';
import {
  buildStaticMenuLayout,
  makeButton,
  makeToggle,
  makeSelect,
  makeSlider,
  makeToggleGroup,
  setButtonLabel,
  setPanelHeight,
  relayoutMenuPanels,
  UI_COLORS
} from './ui.js';
import { deepClone, eur, makeText, dispatchToast } from './utils.js';

function nowTs() { return new Date().toISOString(); }

export class App {
  constructor(sceneEl) {
    this.sceneEl = sceneEl;
    this.menuRoot = document.querySelector('#menuRoot');

    this.audio = new AudioManager(sceneEl);
    this.dishes = DishFactory.getAll();
    this.dishesById = new Map(this.dishes.map(d => [d.id, d]));

    this.state = {
      selectedDishId: null,
      currentOptions: null,
      cart: [],
      presets: {}, // dishId -> options
      category: 'Burgers',
      viewMode: 'pedestal' // pedestal (= em cima da mesa) | real
    };

    // usado para auto-ajustar painel Opções
    this._optionsUsedDown = 0;
  }

  init() {
    // Attach systems/components on root entities
    this.menuRoot.setAttribute('vr-cursor-fallback', '');
    this.sceneEl.setAttribute('toast-system', '');

    // Build static UI structure (painéis separados)
    this.ui = buildStaticMenuLayout(this.menuRoot);

    // Build preview container that we move between mounts (mesa / real scale)
    this.dishContainer = document.createElement('a-entity');
    this.dishContainer.setAttribute('id', 'dishContainer');
    this.dishContainer.setAttribute('class', 'interactive'); // allow clicks for drag start
    this.dishContainer.setAttribute(
      'dish-orbit-controls',
      'autoRotate: true; autoSpeed: 18; minScale: 0.35; maxScale: 1.6'
    );

    // Obter mount da mesa para o prato
    this.tableDishMount = document.querySelector('#tableDishMount');
    if (!this.tableDishMount) console.warn('tableDishMount não encontrado');

    // Anexar inicialmente o prato à mesa
    (this.tableDishMount || this.ui.previewMount)?.appendChild(this.dishContainer);

    // Invisible hit volume (permite drag/rotate com cursor/ray)
    const hit = document.createElement('a-sphere');
    hit.setAttribute('id', 'dishHit');
    hit.setAttribute('radius', '0.30');
    hit.setAttribute('position', '0 0.18 0');
    hit.setAttribute('material', 'color: #FFFFFF; transparent: true; opacity: 0.0');
    hit.classList.add('interactive');
    this.dishContainer.appendChild(hit);

    // Cart actions (confirmar)
    const btnConfirm = makeButton({
      label: 'Confirmar pedido',
      width: 0.74,
      height: 0.055,
      action: 'confirmOrder',
      payload: {},
      tooltip: 'Gera recibo com total.'
    });
    btnConfirm.setAttribute('position', '0 0 0');
    this.ui.cartActions.appendChild(btnConfirm);

    // Global handler for UI actions
    this.menuRoot.addEventListener('ui-action', (e) => this.onUIAction(e));
    this.enableTooltips(this.menuRoot);

    // Build categories + initial
    this.buildCategories();
    this.buildItems();

    // Select default dish (first in category)
    const first = this.dishes.find(d => d.category === this.state.category) || this.dishes[0];
    this.selectDish(first.id);

    this.enableTooltips(this.menuRoot);
    dispatchToast(this.sceneEl, 'Menu 3D pronto — escolhe um prato!');
  }

  enableTooltips(root) {
    root.querySelectorAll('[ui-action]').forEach(el => {
      const data = el.getAttribute('ui-action');
      const tip = data?.tooltip || '';
      if (tip && !el.hasAttribute('ui-tooltip')) {
        el.setAttribute('ui-tooltip', { text: tip });
      }
    });
  }

  onUIAction(e) {
    const action = e.detail?.action || '';
    const payload = e.detail?.payload || {};

    if (action) this.audio.click();

    switch (action) {
      case 'setCategory':
        this.state.category = payload.category;
        this.buildItems();
        this.autoLayoutPanels();
        break;

      case 'selectDish':
        this.selectDish(payload.dishId);
        break;

      case 'toggle':
        this.toggleOption(payload.key);
        break;

      case 'toggleNested':
        this.toggleNested(payload.key, payload.nested);
        break;

      case 'cycle':
        this.cycleOption(payload.key);
        break;

      case 'step':
        this.stepOption(payload.key, payload.dir);
        break;

      case 'resetDish':
        this.resetCurrentDish();
        break;

      case 'addToCart':
        this.addToCart();
        break;

      case 'savePreset':
        this.savePreset();
        break;

      case 'removeCartItem':
        this.removeCartItem(payload.index);
        break;

      case 'confirmOrder':
        this.confirmOrder();
        break;

      case 'viewReal':
        this.setViewMode('real');
        break;

      case 'viewPedestal':
        this.setViewMode('pedestal');
        break;

      default:
        break;
    }

    this.enableTooltips(this.menuRoot);
  }

  /**
   * Calcula alturas ideais e ajusta:
   * - Altura dos painéis conforme conteúdo
   * - Posições das colunas para nunca sobrepor painéis
   */
  autoLayoutPanels() {
    if (!this.ui?.panels) return;

    // ==== CATEGORIAS ====
    const catsCount = Array.from(new Set(this.dishes.map(d => d.category))).length;
    const catMinH = 0.24;
    const catStep = 0.056;
    const catBtnH = 0.046;
    const catPad = 0.06;
    const catRequiredDown = catsCount > 0 ? ((catsCount - 1) * catStep + (catBtnH / 2) + 0.02) : 0;
    const catH = Math.max(catMinH, catRequiredDown + 0.11 + catPad);
    setPanelHeight(this.ui.panels.panelCategories, catH);

    // ==== PRATOS ====
    const itemsCount = this.dishes.filter(d => d.category === this.state.category).length;
    const itemsMinH = 0.44;
    const itemsStep = 0.068;
    const itemsBtnH = 0.055;
    const itemsPad = 0.06;
    const itemsRequiredDown = itemsCount > 0 ? ((itemsCount - 1) * itemsStep + (itemsBtnH / 2) + 0.02) : 0;
    const itemsH = Math.max(itemsMinH, itemsRequiredDown + 0.11 + itemsPad);
    setPanelHeight(this.ui.panels.panelItems, itemsH);

    // ==== OPÇÕES ====
    const optMinH = 0.74;
    const optPad = 0.06;
    const optReserved = 0.20; // topAnchor (0.11) + bottomAnchor (0.09)
    const optUsedDown = Math.max(0, Number(this._optionsUsedDown) || 0);
    const optH = Math.max(optMinH, optUsedDown + optReserved + optPad);
    setPanelHeight(this.ui.panels.panelOptions, optH);

    // ==== CARRINHO ====
    // O render mostra no máximo 3 itens (maxShow = 3)
    const showCount = Math.min(3, this.state.cart.length);
    const cartMinH = 0.44;
    const cartPad = 0.06;
    const cartReserved = 0.20; // top + bottom
    const perItem = 0.085;     // bloco aproximado por item (linha+descrição+botão)
    const cartRequiredDown = showCount > 0 ? ((showCount - 1) * perItem + 0.10) : 0;
    const cartH = Math.max(cartMinH, cartRequiredDown + cartReserved + cartPad);
    setPanelHeight(this.ui.panels.panelCart, cartH);

    // Reposiciona colunas (esq e dir) para nunca sobrepor
    relayoutMenuPanels(this.ui);
  }

  // === CATEGORIAS: topo -> baixo ===
  buildCategories() {
    const cats = Array.from(new Set(this.dishes.map(d => d.category)));
    this.ui.categories.innerHTML = '';

    const y0 = 0;
    const step = 0.056;

    cats.forEach((c, i) => {
      const btn = makeButton({
        label: c,
        width: 0.74,
        height: 0.046,
        action: 'setCategory',
        payload: { category: c },
        tooltip: 'Filtra os itens por categoria.'
      });
      btn.setAttribute('position', `0 ${y0 - i * step} 0`);
      this.ui.categories.appendChild(btn);
    });

    this.autoLayoutPanels();
  }

  // === PRATOS: topo -> baixo ===
  buildItems() {
    this.ui.items.innerHTML = '';
    const items = this.dishes.filter(d => d.category === this.state.category);

    const y0 = 0;
    const step = 0.068;

    items.forEach((d, i) => {
      const btn = makeButton({
        label: d.name,
        width: 0.74,
        height: 0.055,
        action: 'selectDish',
        payload: { dishId: d.id },
        tooltip: 'Abrir opções.'
      });

      btn.querySelector('a-text')?.setAttribute('wrapCount', 24);
      btn.querySelector('a-text')?.setAttribute('width', 0.62);

      btn.setAttribute('position', `0 ${y0 - i * step} 0`);
      this.ui.items.appendChild(btn);
    });

    this.autoLayoutPanels();
  }

  clearOptionsUI() {
    this.ui.options.innerHTML = '';
    this.ui.actions.innerHTML = '';
  }

  // === OPÇÕES: topo -> baixo, ações no fundo ===
  buildOptionsUI(dish) {
    this.clearOptionsUI();

    const schema = dish.uiSchema || [];
    let y = 0;
    const spacing = 0.062;

    const opts = this.state.currentOptions;

    for (const ctl of schema) {
      let node = null;

      if (ctl.type === 'toggle') {
        node = makeToggle({ label: ctl.label, key: ctl.key, value: !!opts[ctl.key], tooltip: ctl.tooltip || '' });
        node.setAttribute('position', `0 ${y} 0`);
        y -= spacing;
      }

      if (ctl.type === 'select') {
        node = makeSelect({ label: ctl.label, key: ctl.key, value: opts[ctl.key], options: ctl.options, tooltip: ctl.tooltip || '' });
        node.setAttribute('position', `0 ${y} 0`);
        y -= spacing;
      }

      if (ctl.type === 'slider') {
        node = makeSlider({ label: ctl.label, key: ctl.key, value: opts[ctl.key], steps: ctl.steps, tooltip: ctl.tooltip || '' });
        node.setAttribute('position', `0 ${y} 0`);
        y -= spacing;
      }

      if (ctl.type === 'toggleGroup') {
        node = makeToggleGroup({
          label: ctl.label,
          key: ctl.key,
          valuesObj: opts[ctl.key],
          options: ctl.options,
          tooltip: ctl.tooltip || ''
        });

        node.setAttribute('position', `0 ${y} 0`);

        // Altura dinâmica (igual à tua lógica) para espaçar controlos seguintes
        const cols = 2;
        const rows = Math.ceil((ctl.options || []).length / cols);

        const labelY = 0.03;
        const startY = -0.08;
        const rowStep = 0.078;
        const btnH = 0.056;

        const bottom = startY - (rows - 1) * rowStep - (btnH / 2);
        const groupHeight = (labelY - bottom) + 0.02;

        y -= (groupHeight + 0.02);
      }

      if (node) this.ui.options.appendChild(node);
    }

    // guarda “quanto foi usado” para auto-ajustar painel Opções
    this._optionsUsedDown = Math.max(0, (-y) + 0.06);

    // ações (compactas)
    const btnReset = makeButton({
      label: 'Reset',
      width: 0.22,
      height: 0.050,
      action: 'resetDish',
      payload: {},
      tooltip: 'Volta ao default.'
    });
    btnReset.setAttribute('position', '-0.25 0.04 0');

    const btnPreset = makeButton({
      label: 'Preset',
      width: 0.22,
      height: 0.050,
      action: 'savePreset',
      payload: {},
      tooltip: 'Guarda as opções em memória.'
    });
    btnPreset.setAttribute('position', '0.02 0.04 0');

    const btnAdd = makeButton({
      label: 'Adicionar',
      width: 0.74,
      height: 0.058,
      action: 'addToCart',
      payload: {},
      tooltip: 'Adiciona a versão custom ao carrinho.'
    });
    btnAdd.setAttribute('position', '0 -0.03 0');

    this.ui.actions.appendChild(btnReset);
    this.ui.actions.appendChild(btnPreset);
    this.ui.actions.appendChild(btnAdd);

    this.autoLayoutPanels();
  }

  selectDish(dishId) {
    const dish = this.dishesById.get(dishId);
    if (!dish) return;

    this.state.selectedDishId = dishId;
    this.state.currentOptions = deepClone(dish.defaultOptions);

    this.buildOptionsUI(dish);

    // Replace preview entity
    while (this.dishContainer.firstChild) this.dishContainer.removeChild(this.dishContainer.firstChild);

    const root = dish.buildEntity();
    root.setAttribute('id', `preview_${dish.id}`);
    this.dishContainer.appendChild(root);
    this.currentDishRoot = root;

    // Apply options
    dish.applyOptions(root, this.state.currentOptions);

    this.updatePriceLabel();
    this.refreshControlLabels();

    // default pedestal
    this.setViewMode('pedestal');

    dispatchToast(this.sceneEl, `Selecionado: ${dish.name}`);
  }

  updatePriceLabel() {
    const dish = this.dishesById.get(this.state.selectedDishId);
    if (!dish) return;

    const price = dish.computePrice(this.state.currentOptions);
    this.ui.txtDishName.setAttribute('value', dish.name);
    this.ui.txtDishPrice.setAttribute('value', `Preço: ${eur(price)}`);
  }

  // --- Option mutations ---
  toggleOption(key) {
    const dish = this.dishesById.get(this.state.selectedDishId);
    if (!dish) return;

    if (key === 'side') {
      const curr = this.state.currentOptions.side || 'Batata Assada';
      this.state.currentOptions.side = (curr === 'Batata Assada') ? 'Legumes Grelhados' : 'Batata Assada';
    } else {
      this.state.currentOptions[key] = !this.state.currentOptions[key];
    }

    this.refreshControlLabels();
    dish.applyOptions(this.currentDishRoot, this.state.currentOptions);
    this.updatePriceLabel();
  }

  toggleNested(key, nested) {
    const dish = this.dishesById.get(this.state.selectedDishId);
    if (!dish) return;

    const obj = this.state.currentOptions[key] || {};
    obj[nested] = !obj[nested];
    this.state.currentOptions[key] = obj;

    this.refreshControlLabels();
    dish.applyOptions(this.currentDishRoot, this.state.currentOptions);
    this.updatePriceLabel();
  }

  cycleOption(key) {
    const dish = this.dishesById.get(this.state.selectedDishId);
    if (!dish) return;

    const btn = this.menuRoot.querySelector(`#ctl_${key} [ui-select]`);
    if (!btn) return;

    const data = btn.getAttribute('ui-select');
    let opts = [];
    try { opts = JSON.parse(data.options || '[]'); } catch (e) {}

    const curr = this.state.currentOptions[key];
    const idx = Math.max(0, opts.findIndex(o => String(o) === String(curr)));
    const next = opts[(idx + 1) % opts.length];
    this.state.currentOptions[key] = next;

    this.refreshControlLabels();
    dish.applyOptions(this.currentDishRoot, this.state.currentOptions);
    this.updatePriceLabel();
  }

  stepOption(key, dir) {
    const dish = this.dishesById.get(this.state.selectedDishId);
    if (!dish) return;

    const mid = this.menuRoot.querySelector(`#ctl_${key} [ui-slider]`);
    if (!mid) return;

    const data = mid.getAttribute('ui-slider');
    let steps = [];
    try { steps = JSON.parse(data.steps || '[]'); } catch (e) {}

    const curr = this.state.currentOptions[key];
    const idx = Math.max(0, steps.findIndex(s => String(s) === String(curr)));
    const nextIdx = (idx + (dir > 0 ? 1 : -1) + steps.length) % steps.length;
    const next = steps[nextIdx];
    this.state.currentOptions[key] = next;

    this.refreshControlLabels();
    dish.applyOptions(this.currentDishRoot, this.state.currentOptions);
    this.updatePriceLabel();
  }

  refreshControlLabels() {
    const dish = this.dishesById.get(this.state.selectedDishId);
    if (!dish) return;

    const opts = this.state.currentOptions;

    // Toggle labels
    this.menuRoot.querySelectorAll('[ui-toggle]').forEach(el => {
      const d = el.getAttribute('ui-toggle');
      const key = d.key;
      const label = d.label;
      const val = (key === 'side') ? (opts.side || 'Batata Assada') : (opts[key] ? 'ON' : 'OFF');
      setButtonLabel(el, `${label}: ${val}`);

      if (key !== 'side') {
        el.setAttribute('ui-hoverable', { baseColor: opts[key] ? UI_COLORS.ok : UI_COLORS.btn });
      }
    });

    // Nested toggles
    this.menuRoot.querySelectorAll('[ui-toggle-nested]').forEach(el => {
      const d = el.getAttribute('ui-toggle-nested');
      const on = !!(opts[d.key]?.[d.nested]);
      setButtonLabel(el, `${on ? '✓' : '✕'} ${d.nested}`);
      el.setAttribute('ui-hoverable', { baseColor: on ? UI_COLORS.ok : UI_COLORS.btn });
    });

    // Select labels
    this.menuRoot.querySelectorAll('[ui-select]').forEach(el => {
      const d = el.getAttribute('ui-select');
      const val = opts[d.key];
      setButtonLabel(el, `${d.label}: ${String(val)}`);
    });

    // Slider labels
    this.menuRoot.querySelectorAll('[ui-slider]').forEach(el => {
      const d = el.getAttribute('ui-slider');
      const val = opts[d.key];
      setButtonLabel(el, `${d.label}: ${String(val)}`);
    });

    // Special: Pizza — esconder slider de quantidade quando cogumelos OFF
    if (String(this.state.selectedDishId || '').startsWith('pizza')) {
      const on = !!(opts.toppings?.Cogumelos);
      const ctl = this.menuRoot.querySelector('#ctl_mushroomsQty');
      if (ctl) ctl.setAttribute('visible', on);
    }

    // Special: Sundae — esconder/mostrar sabores
    if (this.state.selectedDishId === 'sundae') {
      const scoops = Number(opts.scoops || 1);
      const ctl2 = this.menuRoot.querySelector('#ctl_flavor2');
      const ctl3 = this.menuRoot.querySelector('#ctl_flavor3');
      if (ctl2) ctl2.setAttribute('visible', scoops >= 2);
      if (ctl3) ctl3.setAttribute('visible', scoops >= 3);
    }
  }

  resetCurrentDish() {
    const dish = this.dishesById.get(this.state.selectedDishId);
    if (!dish) return;

    this.state.currentOptions = deepClone(dish.defaultOptions);
    dish.applyOptions(this.currentDishRoot, this.state.currentOptions);
    this.buildOptionsUI(dish);
    this.updatePriceLabel();
    dispatchToast(this.sceneEl, 'Reset aplicado.');
  }

  savePreset() {
    const id = this.state.selectedDishId;
    if (!id) return;
    this.state.presets[id] = deepClone(this.state.currentOptions);
    dispatchToast(this.sceneEl, 'Preset guardado (memória).');
  }

  addToCart() {
    const dish = this.dishesById.get(this.state.selectedDishId);
    if (!dish) return;

    const options = deepClone(this.state.currentOptions);
    const price = dish.computePrice(options);
    const desc = dish.stringifyOptions(options);

    this.state.cart.push({
      id_prato: dish.id,
      nome: dish.name,
      opcoes: options,
      preco_final: Math.round(price * 100) / 100,
      descricao: desc,
      timestamp: nowTs()
    });

    this.audio.success();
    dispatchToast(this.sceneEl, 'Adicionado ao carrinho ✔');
    this.renderCart();
  }

  removeCartItem(index) {
    const i = Number(index);
    if (!Number.isFinite(i)) return;
    this.state.cart.splice(i, 1);
    this.renderCart();
  }

  renderCart() {
    const list = this.ui.cartList;
    list.innerHTML = '';

    const maxShow = 3;
    const items = this.state.cart.slice(-maxShow);
    const startIndex = this.state.cart.length - items.length;

    items.forEach((it, idx) => {
      const y = 0 - idx * 0.075;

      const line = makeText(`${it.nome.split('–')[0].trim()}: ${eur(it.preco_final)}`, {
        position: `-0.33 ${y} 0.01`,
        color: UI_COLORS.text,
        wrapCount: 26,
        width: 0.70,
        align: 'left'
      });

      const small = makeText(it.descricao, {
        position: `-0.33 ${(y - 0.035).toFixed(3)} 0.01`,
        color: UI_COLORS.muted,
        wrapCount: 30,
        width: 0.70,
        align: 'left'
      });

      const removeBtn = makeButton({
        label: 'Remover',
        width: 0.20,
        height: 0.042,
        action: 'removeCartItem',
        payload: { index: startIndex + idx },
        tooltip: 'Remove este item.'
      });
      removeBtn.setAttribute('position', `0.26 ${(y - 0.01).toFixed(3)} 0.01`);

      list.appendChild(line);
      list.appendChild(small);
      list.appendChild(removeBtn);
    });

    const total = this.state.cart.reduce((s, it) => s + (Number(it.preco_final) || 0), 0);
    this.ui.cartTotal.setAttribute('value', `Total: ${eur(total)}`);

    this.enableTooltips(this.menuRoot);

    // Ajusta altura do painel carrinho e reposiciona coluna direita
    this.autoLayoutPanels();
  }

  confirmOrder() {
    const total = this.state.cart.reduce((s, it) => s + (Number(it.preco_final) || 0), 0);
    if (this.state.cart.length === 0) {
      dispatchToast(this.sceneEl, 'Carrinho vazio.');
      return;
    }
    this.showReceipt(total);
  }

  showReceipt(total) {
    const rig = document.querySelector('#rig');
    const existing = document.querySelector('#receiptPanel');
    if (existing) existing.parentNode.removeChild(existing);

    const panel = document.createElement('a-entity');
    panel.setAttribute('id', 'receiptPanel');
    panel.setAttribute('position', '0.25 -0.1 -0.25');
    panel.setAttribute('rotation', '-20 -35 0');

    // ✅ ÚNICA ALTERAÇÃO: reduzir o recibo para ~metade
    panel.setAttribute('scale', '0.2 0.2 0.2');

    const bg = document.createElement('a-plane');
    bg.setAttribute('geometry', { primitive: 'plane', width: 0.95, height: 0.78 });
    bg.setAttribute('material', { color: '#0B1422', transparent: true, opacity: 0.92, shader: 'flat' });
    panel.appendChild(bg);

    const title = makeText('Recibo', {
      position: '-0.44 0.35 0.01',
      color: UI_COLORS.text,
      wrapCount: 22,
      width: 1.2
    });
    panel.appendChild(title);

    const lines = this.state.cart.map((it, i) => `${i + 1}. ${it.nome.split('–')[0].trim()} — ${eur(it.preco_final)}`);
    const body = makeText(lines.join('\n'), {
      position: '-0.44 0.27 0.01',
      color: UI_COLORS.muted,
      wrapCount: 40,
      width: 1.2,
      align: 'left'
    });
    panel.appendChild(body);

    const totalTxt = makeText(`Total: ${eur(total)}`, {
      position: '-0.44 -0.25 0.01',
      color: UI_COLORS.accent,
      wrapCount: 22,
      width: 1.2
    });
    panel.appendChild(totalTxt);

    const btnClose = makeButton({
      label: 'Fechar',
      width: 0.20,
      height: 0.06,
      action: 'closeReceipt',
      payload: {},
      tooltip: 'Fecha o recibo.'
    });
    btnClose.setAttribute('position', '0.30 -0.31 0.01');
    panel.appendChild(btnClose);

    btnClose.addEventListener('ui-action', () => {
      try { panel.parentNode.removeChild(panel); } catch (e) {}
    });

    rig.appendChild(panel);
    this.enableTooltips(panel);

    dispatchToast(this.sceneEl, 'Recibo gerado ✔');
  }

  setViewMode(mode) {
    const realMount = document.querySelector('#realScaleMount');
    if (!this.dishContainer || !this.currentDishRoot) return;

    const orbit = this.dishContainer.components['dish-orbit-controls'];

    if (mode === 'real') {
      this.state.viewMode = 'real';

      if (realMount && this.dishContainer.parentNode !== realMount) {
        realMount.appendChild(this.dishContainer);
      }

      orbit?.setScale?.(1.0);
      if (orbit) orbit.data.autoRotate = false;

      this.dishContainer.object3D.rotation.set(0, 0, 0);
      dispatchToast(this.sceneEl, 'Modo tamanho real.');
    } else {
      this.state.viewMode = 'pedestal';

      const tableMount = this.tableDishMount || this.ui.previewMount;
      if (tableMount && this.dishContainer.parentNode !== tableMount) {
        tableMount.appendChild(this.dishContainer);
      }

      orbit?.setScale?.(0.58);
      if (orbit) orbit.data.autoRotate = true;

      this.dishContainer.object3D.rotation.set(0, 0, 0);
    }
  }
}
