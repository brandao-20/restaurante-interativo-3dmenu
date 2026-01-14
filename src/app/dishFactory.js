import { makeEntity, makeText, setVisible, popIn, eur, clamp } from './utils.js';

function colorForSauce(name) {
  switch (name) {
    case 'Ketchup': return '#C9262E';
    case 'Maionese': return '#E9E1C8';
    case 'BBQ': return '#4B2518';
    case 'Picante': return '#D34A2A';
    default: return '#C9262E';
  }
}

function colorForDoneness(name) {
  switch (name) {
    case 'Mal': return '#8A1F1F';
    case 'Médio-Mal': return '#A53A2A';
    case 'Médio': return '#8B4C2E';
    case 'Bem': return '#6D3B2A';
    default: return '#8B4C2E';
  }
}

function steamVisibleForDoneness(name) {
  return name === 'Médio' || name === 'Bem';
}

function colorForPokeBase(name) {
  switch (name) {
    case 'Arroz': return '#EFE9DA';
    case 'Quinoa': return '#D6C5A6';
    case 'Mixed Greens': return '#2E7D49';
    default: return '#EFE9DA';
  }
}

function colorForPokeSauce(name) {
  switch (name) {
    case 'Soja': return '#2B1B12';
    case 'Teriyaki': return '#4A261A';
    case 'Picante': return '#B13B2A';
    case 'Sem': return '#000000';
    default: return '#2B1B12';
  }
}

function colorForScoopFlavor(name) {
  switch (name) {
    case 'Baunilha': return '#F2E7C9';
    case 'Chocolate': return '#4B2E21';
    case 'Morango': return '#E86B7A';
    case 'Pistáchio': return '#93C572';
    default: return '#F2E7C9';
  }
}

function sauceColorForSteak(name) {
  switch (name) {
    case 'Pimenta': return '#2A1B16';
    case 'Cogumelos': return '#8B6B4A';
    case 'Mostarda': return '#D4B12A';
    case 'Sem': return '#000000';
    default: return '#000000';
  }
}

function toppingColor(name) {
  switch (name) {
    case 'Oreo': return '#1B1B1B';
    case 'Amêndoa': return '#D8C7A7';
    case 'Granola': return '#B07A42';
    default: return '#000000';
  }
}

function drizzleColor(name) {
  switch (name) {
    case 'Chocolate': return '#3A2318';
    case 'Morango': return '#C93A52';
    case 'Caramelo': return '#B8742A';
    case 'Sem': return '#000000';
    default: return '#3A2318';
  }
}

function safeGet(root, selector) {
  const el = root.querySelector(selector);
  if (!el) console.warn('Elemento não encontrado:', selector);
  return el;
}

function removeAllChildren(el) {
  if (!el) return;
  while (el.firstChild) el.removeChild(el.firstChild);
}

function ensureBurgerChild(el, selector, makeChild) {
  if (!el) return null;
  let c = el.querySelector(selector);
  if (!c) {
    c = makeChild();
    el.appendChild(c);
  }
  return c;
}

function transformPokeToSushi(root, variant = 'combo') {
  // Esconde a taça (mantém o id/estrutura mas não tapa o conteúdo)
  const bowl = safeGet(root, '#poke_bowl');
  if (bowl) bowl.setAttribute('visible', false);

  // Tabuleiro
  if (!root.querySelector('#poke_sushi_tray')) {
    const tray = makeEntity('a-box', {
      id: 'poke_sushi_tray',
      width: 0.50,
      height: 0.02,
      depth: 0.32,
      position: '0 0.03 0',
      color: '#1E1E1E',
      material: 'roughness: 1; metalness: 0.15;'
    });
    root.appendChild(tray);
  }

  // Trocar baseLayer (id mantém-se) para um "cama" retangular (mais sushi)
  const oldBase = safeGet(root, '#poke_base_layer');
  if (oldBase && oldBase.tagName.toLowerCase() !== 'a-box') {
    const newBase = makeEntity('a-box', {
      id: 'poke_base_layer',
      width: 0.40,
      height: 0.03,
      depth: 0.22,
      position: '0 0.05 0',
      color: colorForPokeBase('Arroz'),
      material: 'roughness: 1'
    });
    oldBase.parentNode.replaceChild(newBase, oldBase);
  } else if (oldBase) {
    oldBase.setAttribute('width', 0.40);
    oldBase.setAttribute('height', 0.03);
    oldBase.setAttribute('depth', 0.22);
    oldBase.setAttribute('position', '0 0.05 0');
  }

  // Desliga o pepino circular (era específico de poke)
  const pepino = safeGet(root, '#poke_pepino');
  if (pepino) pepino.setAttribute('visible', false);

  const mkNigiri = (fishColor, x, z, rotY = 0) => {
    const piece = makeEntity('a-entity', { position: `${x} 0 ${z}`, rotation: `0 ${rotY} 0` });
    piece.appendChild(makeEntity('a-box', {
      width: 0.06, height: 0.018, depth: 0.034,
      color: '#F2E7C9',
      position: '0 0.009 0',
      material: 'roughness: 1'
    }));
    piece.appendChild(makeEntity('a-box', {
      width: 0.065, height: 0.012, depth: 0.040,
      color: fishColor,
      position: '0 0.024 0',
      material: 'roughness: 1'
    }));
    return piece;
  };

  const mkMaki = (fillColor, x, z) => {
    const roll = makeEntity('a-entity', { position: `${x} 0 ${z}` });
    roll.appendChild(makeEntity('a-cylinder', {
      radius: 0.017, height: 0.018,
      color: '#1B1B1B',
      position: '0 0.009 0',
      material: 'roughness: 1'
    }));
    roll.appendChild(makeEntity('a-cylinder', {
      radius: 0.013, height: 0.019,
      color: '#F2E7C9',
      position: '0 0.009 0',
      material: 'roughness: 1'
    }));
    roll.appendChild(makeEntity('a-cylinder', {
      radius: 0.007, height: 0.020,
      color: fillColor,
      position: '0 0.009 0',
      material: 'roughness: 1'
    }));
    return roll;
  };

  // Recriar proteínas como peças de sushi (mantendo ids usados pelo applyOptions)
  const proteinIds = ['#poke_protein_salmon', '#poke_protein_tuna', '#poke_protein_chicken', '#poke_protein_tofu'];
  for (const pid of proteinIds) {
    const g = safeGet(root, pid);
    if (!g) continue;
    removeAllChildren(g);
    g.setAttribute('position', '0 0.055 0');
  }

  const salmon = safeGet(root, '#poke_protein_salmon');
  if (salmon) {
    // Nigiri + maki (mais "combo")
    salmon.appendChild(mkNigiri('#E5745B', -0.12, -0.06, 10));
    salmon.appendChild(mkNigiri('#E5745B', -0.04, -0.06, -6));
    salmon.appendChild(mkNigiri('#E5745B', 0.04, -0.06, 8));
    salmon.appendChild(mkNigiri('#E5745B', 0.12, -0.06, -12));
    if (variant === 'combo') {
      salmon.appendChild(mkMaki('#6EBB5A', -0.09, 0.05));
      salmon.appendChild(mkMaki('#F0B436', -0.03, 0.05));
      salmon.appendChild(mkMaki('#E5745B', 0.03, 0.05));
      salmon.appendChild(mkMaki('#3FAF5A', 0.09, 0.05));
    }
  }

  const tuna = safeGet(root, '#poke_protein_tuna');
  if (tuna) {
    tuna.appendChild(mkNigiri('#B94A58', -0.12, -0.06, 10));
    tuna.appendChild(mkNigiri('#B94A58', -0.04, -0.06, -6));
    tuna.appendChild(mkNigiri('#B94A58', 0.04, -0.06, 8));
    tuna.appendChild(mkNigiri('#B94A58', 0.12, -0.06, -12));
    if (variant === 'combo') {
      tuna.appendChild(mkMaki('#B94A58', -0.09, 0.05));
      tuna.appendChild(mkMaki('#6EBB5A', -0.03, 0.05));
      tuna.appendChild(mkMaki('#F0B436', 0.03, 0.05));
      tuna.appendChild(mkMaki('#3FAF5A', 0.09, 0.05));
    }
  }

  const chicken = safeGet(root, '#poke_protein_chicken');
  if (chicken) {
    chicken.appendChild(mkNigiri('#D9B38C', -0.12, -0.06, 10));
    chicken.appendChild(mkNigiri('#D9B38C', -0.04, -0.06, -6));
    chicken.appendChild(mkNigiri('#D9B38C', 0.04, -0.06, 8));
    chicken.appendChild(mkNigiri('#D9B38C', 0.12, -0.06, -12));
  }

  const tofu = safeGet(root, '#poke_protein_tofu');
  if (tofu) {
    // Veggie/inari vibe: peças mais claras
    tofu.appendChild(mkNigiri('#EDE7D5', -0.12, -0.06, 10));
    tofu.appendChild(mkNigiri('#EDE7D5', -0.04, -0.06, -6));
    tofu.appendChild(mkNigiri('#EDE7D5', 0.04, -0.06, 8));
    tofu.appendChild(mkNigiri('#EDE7D5', 0.12, -0.06, -12));
    if (variant === 'veggie') {
      tofu.appendChild(mkMaki('#6EBB5A', -0.09, 0.05));
      tofu.appendChild(mkMaki('#F0B436', -0.03, 0.05));
      tofu.appendChild(mkMaki('#2E8B57', 0.03, 0.05));
      tofu.appendChild(mkMaki('#3FAF5A', 0.09, 0.05));
    }
  }

  // Condimentos (diferencia poke_2 vs poke_3 visualmente)
  const condId = variant === 'combo' ? 'poke_sushi_condiments_combo' : 'poke_sushi_condiments_veggie';
  if (!root.querySelector(`#${condId}`)) {
    const cond = makeEntity('a-entity', { id: condId, position: '0.22 0.04 0.08' });
    // gengibre
    cond.appendChild(makeEntity('a-box', { width: 0.06, height: 0.012, depth: 0.04, color: '#E7A6B8', position: '0 0.006 0', material: 'roughness: 1; transparent: true; opacity: 0.95' }));
    // wasabi
    cond.appendChild(makeEntity('a-box', { width: 0.03, height: 0.012, depth: 0.03, color: '#2E7D49', position: '-0.06 0.006 0.02', material: 'roughness: 1; transparent: true; opacity: 0.95' }));
    root.appendChild(cond);
  }

  // Reposicionar toppings/drizzle para "cima" do tabuleiro
  const toShift = ['#poke_topping_avocado', '#poke_topping_edamame', '#poke_topping_mango', '#poke_topping_scallion', '#poke_topping_seeds'];
  for (const sel of toShift) {
    const t = safeGet(root, sel);
    if (t) t.setAttribute('position', '0 0.058 0');
  }

  const drizzle = safeGet(root, '#poke_sauce_drizzle');
  if (drizzle) {
    drizzle.setAttribute('position', '0 0.062 0');
    drizzle.querySelectorAll('a-cylinder').forEach((el) => el.setAttribute('height', 0.14));
  }
}

/**
 * Dish interface:
 * - buildEntity(): HTMLElement
 * - applyOptions(rootEl, options): void
 * - computePrice(options): number
 * - stringifyOptions(options): string
 * - defaultOptions: object
 * - uiSchema: array
 */
export class DishFactory {
  static getAll() {
    return [
      DishBurger,
      DishBurger2,
      DishBurger3,
      DishPizza,
      DishPizza2,
      DishPizza3,
      DishSteak,
      DishSteak2,
      DishSteak3,
      DishPoke,
      DishPoke2,
      DishPoke3
    ].map(D => new D());
  }
}

/* ----------------------- (1) BURGER ----------------------- */

class DishBurger {
  constructor() {
    this.id = 'burger';
    this.name = 'Hambúrguer Artesanal Custom';
    this.category = 'Burgers';
    this.basePrice = 12.90;

    this.defaultOptions = {
      pattyCount: 1,
      toppings: {
        'Queijo extra': true,
        Bacon: false,
        Cebola: true,
        Tomate: true,
        Alface: true,
        Picles: true
      },
      sauce: 'Ketchup',
      size: 'Normal'
    };

    this.uiSchema = [
      { type: 'select', key: 'pattyCount', label: 'Nº de carnes', options: [1, 2, 3], tooltip: 'Empilha carnes (+2,20€ cada extra).' },
      { type: 'toggleGroup', key: 'toppings', label: 'Toppings', options: ['Queijo extra', 'Bacon', 'Cebola', 'Tomate', 'Alface', 'Picles'], tooltip: 'Liga/desliga toppings (bacon tem custo).' },
      { type: 'select', key: 'sauce', label: 'Molhos', options: ['Ketchup', 'Maionese', 'BBQ', 'Picante'], tooltip: 'Muda a cor do molho.' },
      { type: 'slider', key: 'size', label: 'Tamanho', steps: ['Normal', 'Grande'], tooltip: 'Grande = +1,50€ e mais escala.' }
    ];
  }

  buildEntity() {
    const root = makeEntity('a-entity', { id: 'dish_burger' });

    const burgerGroup = makeEntity('a-entity', { id: 'burger_group', position: '0 0.08 0' });
    root.appendChild(burgerGroup);

    const bunBottom = makeEntity('a-cylinder', {
      id: 'burger_bun_bottom',
      radius: 0.18,
      height: 0.06,
      color: '#D19A5B',
      position: '0 0.03 0',
      material: 'roughness: 1; metalness: 0.0;'
    });
    burgerGroup.appendChild(bunBottom);

    // Patties (até 3) - visibilidade controlada
    for (let i = 1; i <= 3; i++) {
      const patty = makeEntity('a-cylinder', {
        id: `burger_patty_${i}`,
        radius: 0.165,
        height: 0.045,
        color: '#5A3A2A',
        position: `0 ${0.065 + (i - 1) * 0.06} 0`,
        material: 'roughness: 1; metalness: 0.05;'
      });
      burgerGroup.appendChild(patty);
      if (i > 1) patty.setAttribute('visible', false);
    }

    const cheese = makeEntity('a-box', {
      id: 'burger_cheese',
      width: 0.33,
      height: 0.01,
      depth: 0.33,
      color: '#F1C94A',
      position: '0 0.125 0',
      material: 'roughness: 1;'
    });
    burgerGroup.appendChild(cheese);

    const lettuce = makeEntity('a-cylinder', {
      id: 'burger_lettuce',
      radius: 0.175,
      height: 0.01,
      color: '#2E8B57',
      position: '0 0.14 0',
      material: 'roughness: 1;'
    });
    burgerGroup.appendChild(lettuce);

    const tomato = makeEntity('a-cylinder', {
      id: 'burger_tomato',
      radius: 0.17,
      height: 0.012,
      color: '#C63B2F',
      position: '0 0.155 0',
      material: 'roughness: 1;'
    });
    burgerGroup.appendChild(tomato);

    const onion = makeEntity('a-entity', { id: 'burger_onion', position: '0 0.168 0' });
    for (let i = 0; i < 3; i++) {
      const rr = 0.10 + i * 0.012;
      const ring = makeEntity('a-entity', {
        geometry: `primitive: torus; radius: ${rr}; radiusTubular: 0.004; segmentsRadial: 12; segmentsTubular: 24`,
        material: 'color: #D9C7D6; roughness: 1; transparent: true; opacity: 0.9',
        rotation: `90 0 ${i * 18}`,
        position: `0 ${i * 0.006} 0`
      });
      onion.appendChild(ring);
    }
    burgerGroup.appendChild(onion);

    const pickles = makeEntity('a-entity', { id: 'burger_pickles', position: '0 0.175 0' });
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const r = 0.10;
      const p = makeEntity('a-cylinder', {
        radius: 0.018,
        height: 0.006,
        color: '#3FAF5A',
        rotation: '90 0 0',
        position: `${Math.cos(a) * r} ${0.003} ${Math.sin(a) * r}`,
        material: 'roughness: 1;'
      });
      pickles.appendChild(p);
    }
    burgerGroup.appendChild(pickles);

    const bacon = makeEntity('a-entity', { id: 'burger_bacon', position: '0 0.185 0', visible: false });
    for (let i = 0; i < 2; i++) {
      const strip = makeEntity('a-box', {
        width: 0.28,
        height: 0.01,
        depth: 0.06,
        color: '#8A2D2D',
        position: `0 ${i * 0.012} ${(i === 0 ? -0.04 : 0.04)}`,
        rotation: `0 ${i === 0 ? 10 : -12} 0`,
        material: 'roughness: 1;'
      });
      bacon.appendChild(strip);
    }
    burgerGroup.appendChild(bacon);

    const sauce = makeEntity('a-cylinder', {
      id: 'burger_sauce',
      radius: 0.17,
      height: 0.004,
      color: '#C9262E',
      position: '0 0.192 0',
      material: 'roughness: 1; transparent: true; opacity: 0.85'
    });
    burgerGroup.appendChild(sauce);

    const bunTop = makeEntity('a-sphere', {
      id: 'burger_bun_top',
      radius: 0.19,
      thetaLength: 90,
      phiStart: 0,
      phiLength: 360,
      color: '#D19A5B',
      position: '0 0.255 0',
      material: 'roughness: 1;'
    });
    burgerGroup.appendChild(bunTop);

    // Side fries (não escala com tamanho do burger)
    const fries = makeEntity('a-entity', { id: 'burger_fries', position: '0.28 0.05 0.02' });
    const tray = makeEntity('a-box', { width: 0.16, height: 0.02, depth: 0.12, color: '#B13B2A', position: '0 0.01 0', material: 'roughness: 1' });
    fries.appendChild(tray);
    for (let i = 0; i < 10; i++) {
      const stick = makeEntity('a-box', {
        width: 0.012, height: 0.075 + (i % 3) * 0.01, depth: 0.012,
        color: '#F1C94A',
        position: `${-0.06 + (i % 5) * 0.03} ${0.04} ${-0.04 + Math.floor(i / 5) * 0.04}`,
        rotation: `0 ${-8 + (i * 3)} 0`,
        material: 'roughness: 1;'
      });
      fries.appendChild(stick);
    }
    root.appendChild(fries);

    return root;
  }

  applyOptions(root, options) {
    const group = safeGet(root, '#burger_group');
    const bacon = safeGet(root, '#burger_bacon');
    const cheese = safeGet(root, '#burger_cheese');
    const onion = safeGet(root, '#burger_onion');
    const sauce = safeGet(root, '#burger_sauce');

    // Patties
    const pattyCount = clamp(Number(options.pattyCount || 1), 1, 3);
    for (let i = 1; i <= 3; i++) {
      const p = safeGet(root, `#burger_patty_${i}`);
      setVisible(p, i <= pattyCount);
}

    // Ajustar alturas por nº de carnes (offset 0.06 por patty)
    const topPattyY = 0.065 + (pattyCount - 1) * 0.06;
    cheese.setAttribute('position', `0 ${topPattyY + 0.06} 0`);
    const lettuce = safeGet(root, '#burger_lettuce');
    const tomato = safeGet(root, '#burger_tomato');
    lettuce.setAttribute('position', `0 ${topPattyY + 0.075} 0`);
    tomato.setAttribute('position', `0 ${topPattyY + 0.090} 0`);
    onion.setAttribute('position', `0 ${topPattyY + 0.103} 0`);
    const pickles = safeGet(root, '#burger_pickles');
    pickles.setAttribute('position', `0 ${topPattyY + 0.110} 0`);
    bacon.setAttribute('position', `0 ${topPattyY + 0.120} 0`);
    sauce.setAttribute('position', `0 ${topPattyY + 0.127} 0`);
    const bunTop = safeGet(root, '#burger_bun_top');
    bunTop.setAttribute('position', `0 ${topPattyY + 0.19} 0`);

    // Toggles
    const toppings = options.toppings || {};
    setVisible(cheese, toppings['Queijo extra'] !== false);
    setVisible(bacon, !!toppings.Bacon);
    setVisible(onion, toppings.Cebola !== false);
    setVisible(lettuce, toppings.Alface !== false);
    setVisible(tomato, toppings.Tomate !== false);
    setVisible(pickles, toppings.Picles !== false);
// Sauce dropdown -> cor/opacity
    const sc = colorForSauce(options.sauce || 'Ketchup');
    sauce.setAttribute('color', sc);

    // Size slider -> escala no conjunto do burger (exceto batatas)
    const size = options.size || 'Normal';
    const scale = size === 'Grande' ? 1.15 : 1.0;
    group.object3D.scale.set(scale, scale, scale);
  }

  computePrice(options) {
    let price = this.basePrice;

    const pattyCount = clamp(Number(options.pattyCount || 1), 1, 3);
    price += (pattyCount - 1) * 2.20;

    const toppings = options.toppings || {};

    if (toppings['Queijo extra'] === false) price -= 0.50;
    if (toppings.Bacon) price += 1.20;
    if (options.size === 'Grande') price += 1.50;

    return Math.max(0, price);
  }

  stringifyOptions(options) {
    const parts = [];
    const pattyCount = clamp(Number(options.pattyCount || 1), 1, 3);
    if (pattyCount === 2) parts.push('Duplo');
    else if (pattyCount === 3) parts.push('Triplo');

    const toppings = options.toppings || {};

    if (toppings['Queijo extra'] === false) parts.push('sem queijo');
    else parts.push('+queijo');

    if (toppings.Cebola === false) parts.push('sem cebola');
    if (toppings.Tomate === false) parts.push('sem tomate');
    if (toppings.Alface === false) parts.push('sem alface');
    if (toppings.Picles === false) parts.push('sem picles');

    if (toppings.Bacon) parts.push('+bacon');
const sauce = options.sauce || 'Ketchup';
    parts.push(`molho ${sauce.toLowerCase()}`);

    if (options.size === 'Grande') parts.push('tamanho grande');

    return parts.join(', ');
  }
}



class DishBurger2 extends DishBurger {
  constructor() {
    super();
    this.id = 'burger_2';
    this.name = 'Hambúrguer de Frango Crocante';
    this.basePrice = 12.60;

    this.defaultOptions = {
      pattyCount: 1,
      toppings: {
        'Queijo extra': false,
        Bacon: false,
        Cebola: true,
        Tomate: false,
        Alface: true,
        Picles: true
      },
      sauce: 'Maionese',
      size: 'Normal'
    };
  }

  buildEntity() {
    const root = super.buildEntity();

    // Visual: frango crocante (cores + "crumbs" nos patties)
    const bunBottom = safeGet(root, '#burger_bun_bottom');
    const bunTop = safeGet(root, '#burger_bun_top');
    bunBottom.setAttribute('color', '#E2A865');
    bunTop.setAttribute('color', '#E2A865');

    for (let i = 1; i <= 3; i++) {
      const patty = safeGet(root, `#burger_patty_${i}`);
      patty.setAttribute('color', '#C98F5A');
      patty.setAttribute('material', 'roughness: 1; metalness: 0.0;');

      // Textura crocante (só adiciona 1x)
      ensureBurgerChild(patty, '[data-crispy="1"]', () => {
        const crumbs = makeEntity('a-entity', { 'data-crispy': '1' });
        for (let j = 0; j < 18; j++) {
          const a = (j / 18) * Math.PI * 2;
          const r = 0.145 + (j % 2) * 0.01;
          crumbs.appendChild(makeEntity('a-sphere', {
            radius: 0.007,
            color: '#D4A26E',
            position: `${Math.cos(a) * r} 0.022 ${Math.sin(a) * r}`,
            material: 'roughness: 1;'
          }));
        }
        return crumbs;
      });
    }

    // Queijo mais "american" para diferenciar
    safeGet(root, '#burger_cheese').setAttribute('color', '#F1B54A');

    return root;
  }
}

class DishBurger3 extends DishBurger {
  constructor() {
    super();
    this.id = 'burger_3';
    this.name = 'Hambúrguer Trufado com Brie';
    this.basePrice = 15.20;

    this.defaultOptions = {
      pattyCount: 2,
      toppings: {
        'Queijo extra': true,
        Bacon: false,
        Cebola: false,
        Tomate: true,
        Alface: false,
        Picles: false
      },
      sauce: 'Maionese',
      size: 'Grande'
    };
  }

  buildEntity() {
    const root = super.buildEntity();

    // Visual: brie + trufa (queijo mais claro e drizzle escuro)
    const cheese = safeGet(root, '#burger_cheese');
    cheese.setAttribute('color', '#F7F2D9');
    cheese.setAttribute('height', 0.012);

    // Mini wedge de brie (sempre presente)
    const group = safeGet(root, '#burger_group');
    if (!group.querySelector('#burger_brie_wedge')) {
      group.appendChild(makeEntity('a-box', {
        id: 'burger_brie_wedge',
        width: 0.11,
        height: 0.018,
        depth: 0.09,
        color: '#F7F2D9',
        position: '0.07 0.14 0.06',
        rotation: '0 25 8',
        material: 'roughness: 1;'
      }));
    }

    // Drizzle de trufa (escuro) por cima do molho
    if (!group.querySelector('#burger_truffle_drizzle')) {
      const drizzle = makeEntity('a-entity', { id: 'burger_truffle_drizzle', position: '0 0.202 0' });
      for (let i = 0; i < 5; i++) {
        drizzle.appendChild(makeEntity('a-cylinder', {
          radius: 0.003,
          height: 0.22,
          color: '#2A1B16',
          position: `${-0.09 + i * 0.045} 0.01 ${-0.04 + (i % 2) * 0.08}`,
          rotation: '90 0 0',
          material: 'roughness: 1; transparent: true; opacity: 0.85'
        }));
      }
      group.appendChild(drizzle);
    }

    // Marcas de grelha nos patties (filhos -> respeitam visibilidade)
    for (let i = 1; i <= 3; i++) {
      const patty = safeGet(root, `#burger_patty_${i}`);
      ensureBurgerChild(patty, '[data-grill="1"]', () => {
        const marks = makeEntity('a-entity', { 'data-grill': '1' });
        for (let k = 0; k < 4; k++) {
          marks.appendChild(makeEntity('a-box', {
            width: 0.31,
            height: 0.003,
            depth: 0.012,
            color: '#3B241C',
            position: `0 0.024 ${-0.06 + k * 0.04}`,
            rotation: '0 18 0',
            material: 'roughness: 1; transparent: true; opacity: 0.85'
          }));
        }
        return marks;
      });
    }

    return root;
  }
}

class DishPizza {
  constructor() {
    this.id = 'pizza';
    this.name = 'Pizza Margherita / Pepperoni Builder';
    this.category = 'Pizzas';

    this.defaultOptions = {
      size: 'Média 30cm',
      toppings: {
        Pepperoni: false,
        Cogumelos: false,
        Azeitonas: false,
        'Queijo extra': false
      },
      mushroomsQty: 'Normal',
      stuffedCrust: false
    };

    this.uiSchema = [
      { type: 'select', key: 'size', label: 'Tamanho', options: ['Pequena 25cm', 'Média 30cm', 'Grande 35cm'], tooltip: 'Muda escala e preço base.' },
      { type: 'toggleGroup', key: 'toppings', label: 'Toppings', options: ['Pepperoni', 'Cogumelos', 'Azeitonas', 'Queijo extra'], tooltip: 'Liga/desliga toppings (preço por topping).' },
      { type: 'slider', key: 'mushroomsQty', label: 'Qtd. cogumelos', steps: ['Pouco', 'Normal', 'Extra'], tooltip: 'Mais cogumelos = mais densidade e preço.' },
      { type: 'toggle', key: 'stuffedCrust', label: 'Borda recheada', tooltip: 'Borda recheada (+2,00€).' }
    ];
  }

  buildEntity() {
    const root = makeEntity('a-entity', { id: 'dish_pizza', position: '0 0.08 0' });

    const base = makeEntity('a-cylinder', {
      id: 'pizza_base',
      radius: 0.22,
      height: 0.03,
      color: '#D1A36A',
      position: '0 0.015 0',
      material: 'roughness: 1'
    });
    root.appendChild(base);

    const sauce = makeEntity('a-cylinder', {
      id: 'pizza_sauce',
      radius: 0.205,
      height: 0.006,
      color: '#C9262E',
      position: '0 0.028 0',
      material: 'roughness: 1; transparent: true; opacity: 0.9'
    });
    root.appendChild(sauce);

    const cheese = makeEntity('a-cylinder', {
      id: 'pizza_cheese',
      radius: 0.20,
      height: 0.006,
      color: '#F1E7C7',
      position: '0 0.034 0',
      material: 'roughness: 1'
    });
    root.appendChild(cheese);

    const basil = makeEntity('a-entity', { id: 'pizza_basil', position: '0 0.04 0' });
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const leaf = makeEntity('a-plane', {
        width: 0.06,
        height: 0.03,
        color: '#2E8B57',
        rotation: '-90 0 0',
        position: `${Math.cos(a) * 0.09} 0 ${Math.sin(a) * 0.09}`,
        material: 'roughness: 1; transparent: true; opacity: 0.95'
      });
      basil.appendChild(leaf);
    }
    root.appendChild(basil);

    const pepperoni = makeEntity('a-entity', { id: 'pizza_pepperoni_group', position: '0 0.042 0', visible: false });
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const r = 0.12 + (i % 2) * 0.03;
      const slice = makeEntity('a-cylinder', {
        radius: 0.028,
        height: 0.004,
        color: '#8A2D2D',
        position: `${Math.cos(a) * r} 0 ${Math.sin(a) * r}`,
        material: 'roughness: 1'
      });
      pepperoni.appendChild(slice);
    }
    root.appendChild(pepperoni);

    const mushRoot = makeEntity('a-entity', { id: 'pizza_mushrooms_root', position: '0 0.043 0', visible: false });
    const lvl1 = makeEntity('a-entity', { id: 'pizza_mushrooms_lvl1' });
    const lvl2 = makeEntity('a-entity', { id: 'pizza_mushrooms_lvl2' });
    const lvl3 = makeEntity('a-entity', { id: 'pizza_mushrooms_lvl3' });

    const mkMush = (a, r) => makeEntity('a-cylinder', {
      radius: 0.016, height: 0.003, color: '#B8A08A',
      position: `${Math.cos(a) * r} 0 ${Math.sin(a) * r}`,
      material: 'roughness: 1; transparent: true; opacity: 0.95'
    });

    for (let i = 0; i < 6; i++) lvl1.appendChild(mkMush((i / 6) * Math.PI * 2, 0.09));
    for (let i = 0; i < 9; i++) lvl2.appendChild(mkMush((i / 9) * Math.PI * 2, 0.13));
    for (let i = 0; i < 12; i++) lvl3.appendChild(mkMush((i / 12) * Math.PI * 2, 0.16));

    mushRoot.appendChild(lvl1);
    mushRoot.appendChild(lvl2);
    mushRoot.appendChild(lvl3);
    root.appendChild(mushRoot);

    // Azeitonas (off por defeito) - incluídas no modelo, mas não expostas na UI (enunciado exige, mas opções listadas não incluem toggle)
    const olives = makeEntity('a-entity', { id: 'pizza_olives_group', position: '0 0.044 0', visible: false });
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + 0.2;
      const r = 0.11 + (i % 2) * 0.03;
      olives.appendChild(makeEntity('a-entity', {
        geometry: 'primitive: torus; radius: 0.016; radiusTubular: 0.004; segmentsRadial: 12; segmentsTubular: 24',
        material: 'color: #1B1B1B; roughness: 1',
        rotation: '90 0 0',
        position: `${Math.cos(a) * r} 0 ${Math.sin(a) * r}`
      }));
    }
    root.appendChild(olives);

    const stuffed = makeEntity('a-entity', {
      id: 'pizza_stuffed_crust',
      geometry: 'primitive: torus; radius: 0.235; radiusTubular: 0.018; segmentsRadial: 18; segmentsTubular: 36',
      material: 'color: #D1A36A; roughness: 1',
      rotation: '90 0 0',
      position: '0 0.02 0',
      visible: false
    });
    root.appendChild(stuffed);

    return root;
  }

  applyOptions(root, options) {
    const size = options.size || 'Média 30cm';
    const scale = size.startsWith('Pequena') ? 0.9 : (size.startsWith('Grande') ? 1.1 : 1.0);
    root.object3D.scale.set(scale, scale, scale);

    const toppings = options.toppings || {};
    const pepOn = !!toppings.Pepperoni;
    const mushOn = !!toppings.Cogumelos;
    const olivesOn = !!toppings.Azeitonas;
    const extraCheese = !!toppings['Queijo extra'];

    const pep = safeGet(root, '#pizza_pepperoni_group');
    setVisible(pep, pepOn);

    const mushRoot = safeGet(root, '#pizza_mushrooms_root');
    setVisible(mushRoot, mushOn);

    const qty = options.mushroomsQty || 'Normal';
    const lvl1 = safeGet(root, '#pizza_mushrooms_lvl1');
    const lvl2 = safeGet(root, '#pizza_mushrooms_lvl2');
    const lvl3 = safeGet(root, '#pizza_mushrooms_lvl3');
    setVisible(lvl1, true);
    setVisible(lvl2, qty !== 'Pouco');
    setVisible(lvl3, qty === 'Extra');

    const cheese = safeGet(root, '#pizza_cheese');
    cheese.setAttribute('height', extraCheese ? 0.009 : 0.006);

    const stuffed = safeGet(root, '#pizza_stuffed_crust');
    setVisible(stuffed, !!options.stuffedCrust);

    const olives = safeGet(root, '#pizza_olives_group');
    setVisible(olives, olivesOn);
  }

  computePrice(options) {
    const size = options.size || 'Média 30cm';
    let price = size.startsWith('Pequena') ? 9.90 : (size.startsWith('Grande') ? 13.90 : 11.90);

    const toppings = options.toppings || {};
    if (toppings.Pepperoni) price += 1.80;
    if (toppings.Azeitonas) price += 0.90;
    if (toppings['Queijo extra']) price += 1.00;

    // Cogumelos: preço varia com quantidade
    if (toppings.Cogumelos) {
      const qty = options.mushroomsQty || 'Normal';
      if (qty === 'Pouco') price += 0.80;
      else if (qty === 'Extra') price += 1.70;
      else price += 1.20;
    }

    if (options.stuffedCrust) price += 2.00;

    return price;
  }

  stringifyOptions(options) {
    const parts = [];
    const size = options.size || 'Média 30cm';
    parts.push(size.toLowerCase());

    const toppings = options.toppings || {};
    if (toppings.Pepperoni) parts.push('+pepperoni');
    if (toppings.Azeitonas) parts.push('+azeitonas');
    if (toppings['Queijo extra']) parts.push('+queijo extra');

    if (toppings.Cogumelos) {
      const qty = options.mushroomsQty || 'Normal';
      parts.push(qty === 'Extra' ? '+cogumelos extra' : (qty === 'Pouco' ? '+cogumelos pouco' : '+cogumelos'));
    }

    if (options.stuffedCrust) parts.push('borda recheada');

    return parts.join(', ');
  }
}



class DishPizza2 extends DishPizza {
  constructor() {
    super();
    this.id = 'pizza_2';
    this.name = 'Pizza Quatro Queijos';
    this.defaultOptions = {
      size: 'Média 30cm',
      toppings: {
        Pepperoni: false,
        Cogumelos: false,
        Azeitonas: false,
        'Queijo extra': true
      },
      mushroomsQty: 'Pouco',
      stuffedCrust: false
    };
  }

  buildEntity() {
    const root = super.buildEntity();

    // Visual: quatro queijos -> sem manjericão + "blobs" de queijos distintos
    setVisible(safeGet(root, '#pizza_basil'), false);
    safeGet(root, '#pizza_sauce').setAttribute('color', '#B84A3A');
    safeGet(root, '#pizza_cheese').setAttribute('color', '#F2E6C9');

    if (!root.querySelector('#pizza_four_cheese_group')) {
      const g = makeEntity('a-entity', { id: 'pizza_four_cheese_group', position: '0 0.041 0' });
      const blobs = [
        { c: '#F2E6C9', x: -0.08, z: -0.05 }, // mozzarella
        { c: '#EFCB62', x: 0.09, z: -0.03 },  // cheddar
        { c: '#C9D8E6', x: -0.02, z: 0.09 },  // gorgonzola
        { c: '#F3E6B8', x: 0.07, z: 0.08 }    // parmesan
      ];
      blobs.forEach((b, i) => {
        g.appendChild(makeEntity('a-cylinder', {
          radius: 0.028 + (i % 2) * 0.004,
          height: 0.006,
          color: b.c,
          position: `${b.x} 0 ${b.z}`,
          material: 'roughness: 1; transparent: true; opacity: 0.95'
        }));
      });
      // queijo ralado (pontinhos)
      for (let i = 0; i < 14; i++) {
        g.appendChild(makeEntity('a-sphere', {
          radius: 0.004,
          color: '#F3E6B8',
          position: `${(Math.random() - 0.5) * 0.30} 0.004 ${(Math.random() - 0.5) * 0.30}`,
          material: 'roughness: 1;'
        }));
      }
      root.appendChild(g);
    }

    return root;
  }

  computePrice(options) {
    return super.computePrice(options) + 0.60;
  }
}

class DishPizza3 extends DishPizza {
  constructor() {
    super();
    this.id = 'pizza_3';
    this.name = 'Pizza Vegetariana Mediterrânica';
    this.defaultOptions = {
      size: 'Média 30cm',
      toppings: {
        Pepperoni: false,
        Cogumelos: true,
        Azeitonas: true,
        'Queijo extra': false
      },
      mushroomsQty: 'Extra',
      stuffedCrust: false
    };
  }

  buildEntity() {
    const root = super.buildEntity();

    // Visual: mediterrânica -> toppings vegetais visíveis (além dos toggles existentes)
    setVisible(safeGet(root, '#pizza_basil'), false);
    safeGet(root, '#pizza_sauce').setAttribute('color', '#C3382E');

    if (!root.querySelector('#pizza_veggie_group')) {
      const g = makeEntity('a-entity', { id: 'pizza_veggie_group', position: '0 0.043 0' });

      // tiras de pimento
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const r = 0.11 + (i % 2) * 0.03;
        g.appendChild(makeEntity('a-box', {
          width: 0.055,
          height: 0.004,
          depth: 0.012,
          color: i % 3 === 0 ? '#2E8B57' : (i % 3 === 1 ? '#D34A2A' : '#D4B12A'),
          position: `${Math.cos(a) * r} 0 ${Math.sin(a) * r}`,
          rotation: `0 ${(i * 35) % 360} 0`,
          material: 'roughness: 1;'
        }));
      }

      // anéis de cebola roxa
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 + 0.25;
        const r = 0.08 + (i % 2) * 0.05;
        g.appendChild(makeEntity('a-entity', {
          geometry: 'primitive: torus; radius: 0.018; radiusTubular: 0.004; segmentsRadial: 12; segmentsTubular: 24',
          material: 'color: #D9C7D6; roughness: 1; transparent: true; opacity: 0.9',
          rotation: '90 0 0',
          position: `${Math.cos(a) * r} 0 ${Math.sin(a) * r}`
        }));
      }

      // tomates cherry
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + 0.1;
        const r = 0.10 + (i % 2) * 0.04;
        g.appendChild(makeEntity('a-sphere', {
          radius: 0.014,
          color: '#C63B2F',
          position: `${Math.cos(a) * r} 0.004 ${Math.sin(a) * r}`,
          material: 'roughness: 1;'
        }));
      }

      root.appendChild(g);
    }

    return root;
  }

  computePrice(options) {
    return super.computePrice(options) + 0.90;
  }
}

class DishSteak {
  constructor() {
    this.id = 'steak';
    this.name = 'Bife na Tábua – Ponto e Molho';
    this.category = 'Pratos';

    this.basePrice = 18.90;

    this.defaultOptions = {
      doneness: 'Médio',
      toppings: {
        'Sal grosso': true,
        Alecrim: true,
        Cogumelos: false,
        'Molho BBQ': false
      },
      sauce: 'Sem',
      side: 'Batata Assada',
      dose: 'Normal'
    };

    this.uiSchema = [
      { type: 'select', key: 'doneness', label: 'Ponto', options: ['Mal', 'Médio-Mal', 'Médio', 'Bem'], tooltip: 'Muda cor e vapor.' },
      { type: 'toggleGroup', key: 'toppings', label: 'Toppings', options: ['Sal grosso', 'Alecrim', 'Cogumelos', 'Molho BBQ'], tooltip: 'Liga/desliga toppings (sal/alecrim com efeito visual).' },
      { type: 'select', key: 'sauce', label: 'Molho', options: ['Sem', 'Pimenta', 'Cogumelos', 'Mostarda'], tooltip: 'Molho altera cor e preço.' },
      { type: 'select', key: 'side', label: 'Acompanhamento', options: ['Batata Assada', 'Legumes Grelhados'], tooltip: 'Alterna o side no prato.' },
      { type: 'slider', key: 'dose', label: 'Dose', steps: ['Normal', 'Dupla'], tooltip: 'Dupla = +7,50€ e mais escala.' }
    ];
  }

  buildEntity() {
    const root = makeEntity('a-entity', { id: 'dish_steak', position: '0 0.07 0' });

    const board = makeEntity('a-box', {
      id: 'steak_board',
      width: 0.52,
      height: 0.03,
      depth: 0.30,
      position: '0 0.015 0',
      material: 'src: #texWood; roughness: 1'
    });
    root.appendChild(board);

    const steak1 = makeEntity('a-box', {
      id: 'steak_piece_1',
      width: 0.24,
      height: 0.03,
      depth: 0.14,
      position: '-0.08 0.045 0',
      color: colorForDoneness('Médio'),
      material: 'roughness: 1;'
    });
    root.appendChild(steak1);

    const steak2 = makeEntity('a-box', {
      id: 'steak_piece_2',
      width: 0.24,
      height: 0.03,
      depth: 0.14,
      position: '0.10 0.045 0',
      color: colorForDoneness('Médio'),
      material: 'roughness: 1;',
      visible: false
    });
    root.appendChild(steak2);

    const salt = makeEntity('a-entity', { id: 'steak_salt', position: '-0.1 0.06 0.03' });
    for (let i = 0; i < 10; i++) {
      salt.appendChild(makeEntity('a-sphere', {
        radius: 0.006,
        color: '#EDEDED',
        position: `${(Math.random() - 0.5) * 0.12} ${(Math.random()) * 0.01} ${(Math.random() - 0.5) * 0.06}`,
        material: 'roughness: 1'
      }));
    }
    root.appendChild(salt);

    const rosemary = makeEntity('a-entity', { id: 'steak_rosemary', position: '-0.18 0.06 -0.05' });
    rosemary.appendChild(makeEntity('a-cylinder', { radius: 0.004, height: 0.08, color: '#2E5D3A', position: '0 0.04 0', material: 'roughness: 1' }));
    for (let i = 0; i < 7; i++) {
      rosemary.appendChild(makeEntity('a-plane', {
        width: 0.02, height: 0.008,
        color: '#2E8B57',
        rotation: '-90 0 0',
        position: `${(i % 2 ? 0.01 : -0.01)} ${0.02 + i * 0.008} 0`,
        material: 'roughness: 1; transparent: true; opacity: 0.95'
      }));
    }
    root.appendChild(rosemary);

    // Cogumelos (topping) — cria visual para o toggle existente
    const mushrooms = makeEntity('a-entity', { id: 'steak_topping_mushrooms', position: '0 0.055 -0.02', visible: false });
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const r = 0.12 + (i % 2) * 0.02;
      mushrooms.appendChild(makeEntity('a-cylinder', {
        radius: 0.014,
        height: 0.004,
        color: '#B8A08A',
        position: `${Math.cos(a) * r} 0 ${Math.sin(a) * r}`,
        material: 'roughness: 1; transparent: true; opacity: 0.95'
      }));
    }
    root.appendChild(mushrooms);

    // Glaze BBQ (topping) — linhas finas no topo
    const bbq = makeEntity('a-entity', { id: 'steak_topping_bbq', position: '-0.02 0.06 0.02', visible: false });
    for (let i = 0; i < 5; i++) {
      bbq.appendChild(makeEntity('a-cylinder', {
        radius: 0.003,
        height: 0.18,
        color: '#3A2318',
        position: `${-0.08 + i * 0.04} 0.004 ${-0.05 + (i % 2) * 0.10}`,
        rotation: '90 0 0',
        material: 'roughness: 1; transparent: true; opacity: 0.75'
      }));
    }
    root.appendChild(bbq);

    // Peppercorns (mostra só quando molho = Pimenta)
    const peppercorns = makeEntity('a-entity', { id: 'steak_peppercorns', position: '0.15 0.045 0.06', visible: false });
    for (let i = 0; i < 10; i++) {
      peppercorns.appendChild(makeEntity('a-sphere', {
        radius: 0.006,
        color: '#2A1B16',
        position: `${(Math.random() - 0.5) * 0.10} ${0.01 + Math.random() * 0.01} ${(Math.random() - 0.5) * 0.08}`,
        material: 'roughness: 1;'
      }));
    }
    root.appendChild(peppercorns);

    const sauceRoot = makeEntity('a-entity', { id: 'steak_sauce_root', position: '0.16 0.04 0.06', visible: false });
    const sauceBlob = makeEntity('a-cylinder', {
      id: 'steak_sauce_blob',
      radius: 0.05,
      height: 0.008,
      color: sauceColorForSteak('Sem'),
      material: 'roughness: 1; transparent: true; opacity: 0.9'
    });
    sauceRoot.appendChild(sauceBlob);
    root.appendChild(sauceRoot);

    const sidePotato = makeEntity('a-entity', { id: 'steak_side_potato', position: '0.18 0.035 -0.07' });
    for (let i = 0; i < 5; i++) {
      sidePotato.appendChild(makeEntity('a-box', {
        width: 0.04, height: 0.02, depth: 0.04,
        color: '#C98B3A',
        position: `${(i % 2) * 0.05} ${0.01} ${-0.04 + i * 0.02}`,
        material: 'roughness: 1'
      }));
    }
    root.appendChild(sidePotato);

    const sideVeg = makeEntity('a-entity', { id: 'steak_side_veg', position: '0.18 0.035 -0.07', visible: false });
    const vegColors = ['#2E8B57', '#B13B2A', '#D4B12A'];
    for (let i = 0; i < 6; i++) {
      sideVeg.appendChild(makeEntity('a-cylinder', {
        radius: 0.012, height: 0.02,
        color: vegColors[i % vegColors.length],
        position: `${(i % 3) * 0.04} ${0.01} ${-0.03 + Math.floor(i / 3) * 0.05}`,
        material: 'roughness: 1'
      }));
    }
    root.appendChild(sideVeg);

    // Steam particles (simples)
    const steam = makeEntity('a-entity', { id: 'steak_steam', position: '-0.08 0.08 0', visible: false });
    for (let i = 0; i < 5; i++) {
      const puff = makeEntity('a-plane', {
        width: 0.05, height: 0.05,
        color: '#FFFFFF',
        position: `${(Math.random() - 0.5) * 0.12} ${i * 0.03} ${(Math.random() - 0.5) * 0.08}`,
        rotation: `0 ${Math.random() * 360} 0`,
        material: 'shader: flat; transparent: true; opacity: 0.0'
      });
      puff.setAttribute('animation__rise', {
        property: 'position',
        dir: 'alternate',
        dur: 1600 + i * 120,
        loop: true,
        easing: 'easeInOutSine',
        to: `${(Math.random() - 0.5) * 0.12} ${0.12 + i * 0.03} ${(Math.random() - 0.5) * 0.08}`
      });
      puff.setAttribute('animation__fade', {
        property: 'material.opacity',
        dir: 'alternate',
        dur: 900 + i * 90,
        loop: true,
        easing: 'easeInOutSine',
        from: 0.0,
        to: 0.22
      });
      steam.appendChild(puff);
    }
    root.appendChild(steam);

    return root;
  }

  applyOptions(root, options) {
    // Doneness affects steak color and steam
    const doneness = options.doneness || 'Médio';
    const c = colorForDoneness(doneness);
    safeGet(root, '#steak_piece_1').setAttribute('color', c);
    safeGet(root, '#steak_piece_2').setAttribute('color', c);

    const steam = safeGet(root, '#steak_steam');
    setVisible(steam, steamVisibleForDoneness(doneness));

    const toppings = options.toppings || {};
    setVisible(safeGet(root, '#steak_salt'), toppings['Sal grosso'] !== false);
    setVisible(safeGet(root, '#steak_rosemary'), toppings.Alecrim !== false);

    // Toppings adicionais
    setVisible(safeGet(root, '#steak_topping_mushrooms'), !!toppings.Cogumelos);
    setVisible(safeGet(root, '#steak_topping_bbq'), !!toppings['Molho BBQ']);
// Sauce
    const sauce = options.sauce || 'Sem';
    const sauceRoot = safeGet(root, '#steak_sauce_root');
    setVisible(sauceRoot, sauce !== 'Sem');
    const blob = safeGet(root, '#steak_sauce_blob');
    blob.setAttribute('color', sauceColorForSteak(sauce));

    // Peppercorns só quando molho = Pimenta
    setVisible(safeGet(root, '#steak_peppercorns'), sauce === 'Pimenta');
// Side toggle
    const sideVal = options.side || 'Batata Assada';
    const potato = safeGet(root, '#steak_side_potato');
    const veg = safeGet(root, '#steak_side_veg');
    if (sideVal === 'Legumes Grelhados') {
      setVisible(potato, false);
      setVisible(veg, true);
} else {
      setVisible(veg, false);
      setVisible(potato, true);
}

    // Dose
    const dose = options.dose || 'Normal';
    const s2 = safeGet(root, '#steak_piece_2');
    setVisible(s2, dose === 'Dupla');
}

  computePrice(options) {
    let price = this.basePrice;

    const sauce = options.sauce || 'Sem';
    if (sauce === 'Pimenta') price += 1.50;
    else if (sauce === 'Cogumelos') price += 1.80;
    else if (sauce === 'Mostarda') price += 1.20;

    const dose = options.dose || 'Normal';
    if (dose === 'Dupla') price += 7.50;

    const toppings = options.toppings || {};
    if (toppings.Cogumelos) price += 1.00;
    if (toppings['Molho BBQ']) price += 0.80;

    return price;
  }

  stringifyOptions(options) {
    const parts = [];
    parts.push(`ponto ${String(options.doneness || 'Médio').toLowerCase()}`);

    const sauce = options.sauce || 'Sem';
    if (sauce === 'Sem') parts.push('sem molho');
    else parts.push(`molho ${sauce.toLowerCase()}`);

    const side = options.side || 'Batata Assada';
    parts.push(side === 'Legumes Grelhados' ? 'com legumes grelhados' : 'com batata assada');

    const toppings = options.toppings || {};
    if (toppings['Sal grosso'] === false) parts.push('sem sal');
    if (toppings.Alecrim === false) parts.push('sem alecrim');
    if (toppings.Cogumelos) parts.push('+cogumelos');
    if (toppings['Molho BBQ']) parts.push('+bbq');

    if ((options.dose || 'Normal') === 'Dupla') parts.push('dose dupla');

    return parts.join(', ');
  }
}



class DishSteak2 extends DishSteak {
  constructor() {
    super();
    this.id = 'steak_2';
    this.name = 'Bife à Portuguesa (Ervas & Mostarda)';
    this.basePrice = 17.90;

    this.defaultOptions = {
      doneness: 'Médio-Mal',
      toppings: {
        'Sal grosso': true,
        Alecrim: true,
        Cogumelos: true,
        'Molho BBQ': false
      },
      sauce: 'Mostarda',
      side: 'Batata Assada',
      dose: 'Normal'
    };
  }

  buildEntity() {
    const root = super.buildEntity();

    // Visual extra: "alho" e ervas (identidade do bife à portuguesa)
    if (!root.querySelector('#steak_garlic_chips')) {
      const garlic = makeEntity('a-entity', { id: 'steak_garlic_chips', position: '-0.18 0.05 0.07' });
      for (let i = 0; i < 7; i++) {
        garlic.appendChild(makeEntity('a-cylinder', {
          radius: 0.014,
          height: 0.004,
          color: '#E9D7A8',
          position: `${(i % 3) * 0.03} 0 ${-0.02 + Math.floor(i / 3) * 0.03}`,
          rotation: `0 ${(i * 23) % 360} 0`,
          material: 'roughness: 1; transparent: true; opacity: 0.95'
        }));
      }
      root.appendChild(garlic);
    }

    if (!root.querySelector('#steak_parsley')) {
      const parsley = makeEntity('a-entity', { id: 'steak_parsley', position: '-0.02 0.06 -0.08' });
      for (let i = 0; i < 10; i++) {
        parsley.appendChild(makeEntity('a-sphere', {
          radius: 0.006,
          color: '#2E8B57',
          position: `${(Math.random() - 0.5) * 0.14} ${0.002 + Math.random() * 0.01} ${(Math.random() - 0.5) * 0.10}`,
          material: 'roughness: 1;'
        }));
      }
      root.appendChild(parsley);
    }

    return root;
  }
}

class DishSteak3 extends DishSteak {
  constructor() {
    super();
    this.id = 'steak_3';
    this.name = 'Entrecôte ao Molho de Pimenta';
    this.basePrice = 19.40;

    this.defaultOptions = {
      doneness: 'Mal',
      toppings: {
        'Sal grosso': true,
        Alecrim: false,
        Cogumelos: false,
        'Molho BBQ': false
      },
      sauce: 'Pimenta',
      side: 'Legumes Grelhados',
      dose: 'Normal'
    };
  }

  buildEntity() {
    const root = super.buildEntity();

    // Visual extra: marcas de grelha (filhos -> respeitam visibilidade da dose)
    for (const sid of ['#steak_piece_1', '#steak_piece_2']) {
      const steak = safeGet(root, sid);
      ensureBurgerChild(steak, '[data-grillsteak="1"]', () => {
        const marks = makeEntity('a-entity', { 'data-grillsteak': '1' });
        for (let i = 0; i < 6; i++) {
          marks.appendChild(makeEntity('a-box', {
            width: 0.24,
            height: 0.002,
            depth: 0.01,
            color: '#2A1B16',
            position: `0 0.017 ${-0.055 + i * 0.022}`,
            rotation: '0 18 0',
            material: 'roughness: 1; transparent: true; opacity: 0.65'
          }));
        }
        return marks;
      });
    }

    // Pequenos grãos de pimenta em volta do molho (sempre presentes, mas só se tornam visíveis com molho Pimenta via applyOptions)
    const pc = safeGet(root, '#steak_peppercorns');
    if (pc) pc.setAttribute('position', '0.16 0.045 0.065');

    return root;
  }
}

class DishPoke {
  constructor() {
    this.id = 'poke';
    this.name = 'Poke Bowl – Monta a tua';
    this.category = 'Saudável';
    this.basePrice = 13.90;

    this.defaultOptions = {
      base: 'Arroz',
      protein: 'Salmão',
      toppings: {
        Abacate: false,
        Edamame: false,
        Manga: false,
        Cebolinho: false,
        Sementes: true
      },
      sauce: 'Soja'
    };

    this.uiSchema = [
      { type: 'select', key: 'base', label: 'Base', options: ['Arroz', 'Quinoa', 'Mixed Greens'], tooltip: 'Troca a camada de base.' },
      { type: 'select', key: 'protein', label: 'Proteína', options: ['Salmão', 'Atum', 'Frango', 'Tofu'], tooltip: 'Troca o topping principal.' },
      { type: 'toggleGroup', key: 'toppings', label: 'Toppings', options: ['Abacate', 'Edamame', 'Manga', 'Cebolinho', 'Sementes'], tooltip: 'Liga/desliga toppings (preço por topping).' },
      { type: 'select', key: 'sauce', label: 'Molho', options: ['Soja', 'Teriyaki', 'Picante', 'Sem'], tooltip: 'Cor do drizzle.' }
    ];
  }

  buildEntity() {
    const root = makeEntity('a-entity', { id: 'dish_poke', position: '0 0.07 0' });

    const bowl = makeEntity('a-sphere', {
      id: 'poke_bowl',
      radius: 0.22,
      thetaStart: 90,
      thetaLength: 90,
      rotation: '0 0 0',
      color: '#2A2F3A',
      position: '0 0.08 0',
      material: 'roughness: 1; metalness: 0.1; transparent: true; opacity: 0.95'
    });
    root.appendChild(bowl);

    const baseLayer = makeEntity('a-cylinder', {
      id: 'poke_base_layer',
      radius: 0.18,
      height: 0.05,
      position: '0 0.06 0',
      color: colorForPokeBase('Arroz'),
      material: 'roughness: 1'
    });
    root.appendChild(baseLayer);

    // Pepino (faz parte do modelo base)
    const pepino = makeEntity('a-entity', { id: 'poke_pepino', position: '0 0.085 0', visible: true });
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + 0.4;
      const r = 0.11;
      pepino.appendChild(makeEntity('a-cylinder', {
        radius: 0.012,
        height: 0.006,
        color: '#6FD28A',
        position: `${Math.cos(a) * r} 0 ${Math.sin(a) * r}`,
        rotation: '90 0 0',
        material: 'roughness: 1; transparent: true; opacity: 0.9'
      }));
    }
    root.appendChild(pepino);

    const mkProteinGroup = (id, color) => {
      const g = makeEntity('a-entity', { id, position: '0 0.095 0', visible: false });
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        const r = 0.09 + (i % 2) * 0.02;
        g.appendChild(makeEntity('a-box', {
          width: 0.03, height: 0.02, depth: 0.03,
          color,
          position: `${Math.cos(a) * r} ${0.01 + (i % 3) * 0.003} ${Math.sin(a) * r}`,
          rotation: `0 ${(i * 33) % 360} 0`,
          material: 'roughness: 1'
        }));
      }
      return g;
    };

    const salmon = mkProteinGroup('poke_protein_salmon', '#E5745B');
    const tuna = mkProteinGroup('poke_protein_tuna', '#B94A58');
    const chicken = mkProteinGroup('poke_protein_chicken', '#D9B38C');
    const tofu = mkProteinGroup('poke_protein_tofu', '#EDE7D5');

    root.appendChild(salmon);
    root.appendChild(tuna);
    root.appendChild(chicken);
    root.appendChild(tofu);

    const mkTopping = (id, color, count, radius) => {
      const g = makeEntity('a-entity', { id, position: '0 0.10 0', visible: false });
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2 + (id.includes('seeds') ? 0.12 : 0);
        const r = radius + (i % 2) * 0.015;
        const y = 0.012 + (i % 3) * 0.003;
        g.appendChild(makeEntity('a-sphere', {
          radius: id.includes('seeds') ? 0.005 : 0.011,
          color,
          position: `${Math.cos(a) * r} ${y} ${Math.sin(a) * r}`,
          material: 'roughness: 1'
        }));
      }
      return g;
    };

    root.appendChild(mkTopping('poke_topping_avocado', '#6EBB5A', 8, 0.10));
    root.appendChild(mkTopping('poke_topping_edamame', '#3FAF5A', 10, 0.11));
    root.appendChild(mkTopping('poke_topping_mango', '#F0B436', 8, 0.12));

    const scallion = makeEntity('a-entity', { id: 'poke_topping_scallion', position: '0 0.105 0', visible: false });
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      scallion.appendChild(makeEntity('a-cylinder', {
        radius: 0.004, height: 0.03,
        color: '#2E8B57',
        position: `${Math.cos(a) * 0.12} 0.015 ${Math.sin(a) * 0.12}`,
        rotation: `${90} 0 ${i * 45}`,
        material: 'roughness: 1'
      }));
    }
    root.appendChild(scallion);

    root.appendChild(mkTopping('poke_topping_seeds', '#EDE7D5', 18, 0.11));

    const drizzle = makeEntity('a-entity', { id: 'poke_sauce_drizzle', position: '0 0.115 0' });
    for (let i = 0; i < 6; i++) {
      drizzle.appendChild(makeEntity('a-cylinder', {
        radius: 0.004, height: 0.20,
        color: colorForPokeSauce('Soja'),
        position: `${-0.08 + i * 0.032} 0.01 ${-0.06 + (i % 2) * 0.12}`,
        rotation: '90 0 0',
        material: 'roughness: 1; transparent: true; opacity: 0.85'
      }));
    }
    root.appendChild(drizzle);

    return root;
  }

  applyOptions(root, options) {
    const base = options.base || 'Arroz';
    safeGet(root, '#poke_base_layer').setAttribute('color', colorForPokeBase(base));

    const protein = options.protein || 'Salmão';
    const map = {
      'Salmão': '#poke_protein_salmon',
      'Atum': '#poke_protein_tuna',
      'Frango': '#poke_protein_chicken',
      'Tofu': '#poke_protein_tofu'
    };
    for (const sel of Object.values(map)) setVisible(safeGet(root, sel), false);
    const pEl = safeGet(root, map[protein] || '#poke_protein_salmon');
    setVisible(pEl, true);
const toppings = options.toppings || {};
    setVisible(safeGet(root, '#poke_topping_avocado'), !!toppings.Abacate);
    setVisible(safeGet(root, '#poke_topping_edamame'), !!toppings.Edamame);
    setVisible(safeGet(root, '#poke_topping_mango'), !!toppings.Manga);
    setVisible(safeGet(root, '#poke_topping_scallion'), !!toppings.Cebolinho);
    setVisible(safeGet(root, '#poke_topping_seeds'), !!toppings.Sementes);







    const sauce = options.sauce || 'Soja';
    const drizzle = safeGet(root, '#poke_sauce_drizzle');
    const c = colorForPokeSauce(sauce);
    const show = sauce !== 'Sem';
    setVisible(drizzle, show);
    drizzle.querySelectorAll('a-cylinder').forEach(el => el.setAttribute('color', c));
}

  computePrice(options) {
    let price = this.basePrice;
    const protein = options.protein || 'Salmão';
    if (protein === 'Atum') price += 1.00;
    if (protein === 'Tofu') price += 0.00;
    if (protein === 'Frango') price += 0.00;

    const toppings = options.toppings || {};
    for (const [k, v] of Object.entries(toppings)) {
      if (!v) continue;
      price += (k === 'Sementes') ? 0.30 : 0.70;
    }
    return price;
  }

  stringifyOptions(options) {
    const parts = [];
    parts.push(`base ${String(options.base || 'Arroz').toLowerCase()}`);
    parts.push(`proteína ${String(options.protein || 'Salmão').toLowerCase()}`);

    const toppings = options.toppings || {};
    const on = Object.entries(toppings).filter(([, v]) => !!v).map(([k]) => k);
    if (on.length) parts.push('+' + on.map(s => s.toLowerCase()).join('+'));

    const sauce = options.sauce || 'Soja';
    parts.push(sauce === 'Sem' ? 'sem molho' : `molho ${sauce.toLowerCase()}`);

    return parts.join(', ');
  }
}



class DishPoke2 extends DishPoke {
  constructor() {
    super();
    this.id = 'poke_2';
    this.name = 'Sushi Combo (Atum Picante)';
    this.basePrice = 14.50;

    this.defaultOptions = {
      base: 'Quinoa',
      protein: 'Atum',
      toppings: {
        Abacate: true,
        Edamame: true,
        Manga: false,
        Cebolinho: true,
        Sementes: true
      },
      sauce: 'Picante'
    };
  }

  buildEntity() {
    const root = super.buildEntity();
    transformPokeToSushi(root, 'combo');
    return root;
  }
}

class DishPoke3 extends DishPoke {
  constructor() {
    super();
    this.id = 'poke_3';
    this.name = 'Sushi Veggie (Tofu Teriyaki)';
    this.basePrice = 13.20;

    this.defaultOptions = {
      base: 'Mixed Greens',
      protein: 'Tofu',
      toppings: {
        Abacate: true,
        Edamame: true,
        Manga: false,
        Cebolinho: true,
        Sementes: true
      },
      sauce: 'Teriyaki'
    };
  }

  buildEntity() {
    const root = super.buildEntity();
    transformPokeToSushi(root, 'veggie');
    return root;
  }
}

class DishSundae {
  constructor() {
    this.id = 'sundae';
    this.name = 'Gelado/ Sobremesa – Sundae Interativo';
    this.category = 'Sobremesas';

    this.defaultOptions = {
      scoops: 1,
      flavor1: 'Baunilha',
      flavor2: 'Chocolate',
      flavor3: 'Morango',
      whipped: true,
      topping: 'Sem',
      drizzle: 'Chocolate'
    };

    this.uiSchema = [
      { type: 'select', key: 'scoops', label: 'Nº de bolas', options: [1, 2, 3], tooltip: 'Mais bolas = mais altura e preço.' },
      { type: 'select', key: 'flavor1', label: 'Sabor bola 1', options: ['Baunilha', 'Chocolate', 'Morango', 'Pistáchio'], tooltip: 'Cor/material da bola 1.' },
      { type: 'select', key: 'flavor2', label: 'Sabor bola 2', options: ['Baunilha', 'Chocolate', 'Morango', 'Pistáchio'], tooltip: 'Cor/material da bola 2.' },
      { type: 'select', key: 'flavor3', label: 'Sabor bola 3', options: ['Baunilha', 'Chocolate', 'Morango', 'Pistáchio'], tooltip: 'Cor/material da bola 3.' },
      { type: 'toggle', key: 'whipped', label: 'Chantilly', tooltip: 'Liga/desliga chantilly.' },
      { type: 'select', key: 'topping', label: 'Topping', options: ['Oreo', 'Amêndoa', 'Granola', 'Sem'], tooltip: 'Topping (+0,60€ exceto Sem).' },
      { type: 'select', key: 'drizzle', label: 'Calda', options: ['Chocolate', 'Morango', 'Caramelo', 'Sem'], tooltip: 'Cor do drizzle.' }
    ];
  }

  buildEntity() {
    const root = makeEntity('a-entity', { id: 'dish_sundae', position: '0 0.07 0' });

    const cup = makeEntity('a-cone', {
      id: 'sundae_cup',
      radiusBottom: 0.16,
      radiusTop: 0.10,
      height: 0.22,
      color: '#D9E3F0',
      position: '0 0.11 0',
      material: 'roughness: 0.4; metalness: 0.0; transparent: true; opacity: 0.6'
    });
    root.appendChild(cup);

    const baseCream = makeEntity('a-cylinder', {
      id: 'sundae_base_cream',
      radius: 0.11,
      height: 0.05,
      color: '#F5F1E6',
      position: '0 0.18 0',
      material: 'roughness: 1'
    });
    root.appendChild(baseCream);

    for (let i = 1; i <= 3; i++) {
      const scoop = makeEntity('a-sphere', {
        id: `sundae_scoop_${i}`,
        radius: 0.075,
        color: colorForScoopFlavor(i === 1 ? 'Baunilha' : (i === 2 ? 'Chocolate' : 'Morango')),
        position: `0 ${0.23 + (i - 1) * 0.08} 0`,
        material: 'roughness: 0.9'
      });
      if (i > 1) scoop.setAttribute('visible', false);
      root.appendChild(scoop);
    }

    const whipped = makeEntity('a-entity', {
      id: 'sundae_whipped',
      geometry: 'primitive: torusKnot; radius: 0.05; radiusTubular: 0.012; p: 2; q: 3; segmentsTubular: 72; segmentsRadial: 12',
      material: 'color: #FFFFFF; roughness: 0.9; transparent: true; opacity: 0.95',
      position: '0 0.47 0',
      rotation: '0 0 0'
    });
    root.appendChild(whipped);

    const toppingRoot = makeEntity('a-entity', { id: 'sundae_topping_root', position: '0 0.49 0' });
    const oreo = makeEntity('a-entity', { id: 'sundae_topping_oreo', visible: false });
    const almond = makeEntity('a-entity', { id: 'sundae_topping_almond', visible: false });
    const granola = makeEntity('a-entity', { id: 'sundae_topping_granola', visible: false });

    const sprinkle = (count, color, radius, size) => {
      const g = makeEntity('a-entity', {});
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2 + (Math.random() * 0.2);
        const r = radius + (Math.random() * 0.015);
        g.appendChild(makeEntity('a-box', {
          width: size, height: size, depth: size,
          color,
          position: `${Math.cos(a) * r} ${(Math.random() * 0.02)} ${Math.sin(a) * r}`,
          rotation: `${Math.random() * 360} ${Math.random() * 360} ${Math.random() * 360}`,
          material: 'roughness: 1'
        }));
      }
      return g;
    };

    oreo.appendChild(sprinkle(16, toppingColor('Oreo'), 0.05, 0.012));
    almond.appendChild(sprinkle(12, toppingColor('Amêndoa'), 0.05, 0.012));
    granola.appendChild(sprinkle(18, toppingColor('Granola'), 0.05, 0.012));

    toppingRoot.appendChild(oreo);
    toppingRoot.appendChild(almond);
    toppingRoot.appendChild(granola);
    root.appendChild(toppingRoot);

    const drizzle = makeEntity('a-entity', { id: 'sundae_drizzle', position: '0 0.44 0' });
    for (let i = 0; i < 5; i++) {
      const rr = 0.06 - i * 0.007;
      drizzle.appendChild(makeEntity('a-entity', {
        geometry: `primitive: torus; radius: ${rr}; radiusTubular: 0.004; segmentsRadial: 12; segmentsTubular: 24`,
        material: `color: ${drizzleColor('Chocolate')}; roughness: 1; transparent: true; opacity: 0.85`,
        rotation: '90 0 0',
        position: `0 ${i * 0.01} 0`
      }));
    }
    root.appendChild(drizzle);

    return root;
  }

  applyOptions(root, options) {
    const scoops = clamp(Number(options.scoops || 1), 1, 3);
    for (let i = 1; i <= 3; i++) {
      const s = safeGet(root, `#sundae_scoop_${i}`);
      setVisible(s, i <= scoops);
}

    const f1 = options.flavor1 || 'Baunilha';
    const f2 = options.flavor2 || 'Chocolate';
    const f3 = options.flavor3 || 'Morango';
    safeGet(root, '#sundae_scoop_1').setAttribute('color', colorForScoopFlavor(f1));
    safeGet(root, '#sundae_scoop_2').setAttribute('color', colorForScoopFlavor(f2));
    safeGet(root, '#sundae_scoop_3').setAttribute('color', colorForScoopFlavor(f3));

    const whipped = safeGet(root, '#sundae_whipped');
    setVisible(whipped, !!options.whipped);
const topping = options.topping || 'Sem';
    const oreo = safeGet(root, '#sundae_topping_oreo');
    const almond = safeGet(root, '#sundae_topping_almond');
    const granola = safeGet(root, '#sundae_topping_granola');
    setVisible(oreo, false);
    setVisible(almond, false);
    setVisible(granola, false);
    if (topping === 'Oreo') { setVisible(oreo, true); }
    if (topping === 'Amêndoa') { setVisible(almond, true); }
    if (topping === 'Granola') { setVisible(granola, true); }

    const drizzle = safeGet(root, '#sundae_drizzle');
    const d = options.drizzle || 'Chocolate';
    const show = d !== 'Sem';
    setVisible(drizzle, show);
    drizzle.querySelectorAll('a-entity').forEach(t => t.setAttribute('material', 'color', drizzleColor(d)));
}

  computePrice(options) {
    const scoops = clamp(Number(options.scoops || 1), 1, 3);
    let price = (scoops === 1) ? 3.50 : (scoops === 2 ? 4.50 : 5.40);

    const topping = options.topping || 'Sem';
    if (topping !== 'Sem') price += 0.60;

    return price;
  }

  stringifyOptions(options) {
    const parts = [];
    const scoops = clamp(Number(options.scoops || 1), 1, 3);
    parts.push(`${scoops} bola${scoops > 1 ? 's' : ''}`);

    const flavors = [
      options.flavor1 || 'Baunilha',
      options.flavor2 || 'Chocolate',
      options.flavor3 || 'Morango'
    ].slice(0, scoops);
    parts.push('sabores: ' + flavors.map(s => s.toLowerCase()).join(' / '));

    if (options.whipped === false) parts.push('sem chantilly');
    else parts.push('+chantilly');

    const topping = options.topping || 'Sem';
    if (topping !== 'Sem') parts.push(`+${topping.toLowerCase()}`);

    const drizzle = options.drizzle || 'Chocolate';
    if (drizzle === 'Sem') parts.push('sem calda');
    else parts.push(`calda ${drizzle.toLowerCase()}`);

    return parts.join(', ');
  }
}
