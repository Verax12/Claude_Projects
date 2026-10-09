/**
 * forum-praca — frentes de lojas (tabernae) e casas ao longo do trecho alto da Via Sacra.
 *
 * ATENÇÃO (honestidade histórica): a ocupação exata da Via Sacra em 44 a.C. NÃO foi encontrada
 * nas notas de pesquisa. Estas fileiras são tecido urbano GENÉRICO e plausível (lojas de um
 * cômodo abertas para a rua, com sobrado/pergula de madeira, pavimento superior de moradia,
 * sacadas de madeira — "maeniana" —, telhados de telha), declarado como hipotético no painel
 * da Via Sacra. Técnicas e materiais seguem a nota 11 (§5–7): concreto com paramento de
 * opus incertum, reboco tingido em tons de terra (cor das fachadas: NÃO ENCONTRADO → hipótese),
 * telhas de terracota, madeira. Mercadorias apenas de tipos atestados no período (ânforas,
 * jarros, cestos, sacos, pães, tecidos — nota 08/11).
 *
 * Só se constrói onde o corredor não confina com outros sítios (Régia/Domus Publica/Vesta
 * pertencem ao forum-sudeste): lado norte u 141–318, lado sul u 183–304, com becos a cada
 * 4–7 lojas (passagens para o casario de fundo do sítio "cidade").
 */
import * as THREE from 'three';
import * as G from '../../render/geom.js';
import { propGeometry } from '../../arch/props.js';
import { VIA, ROT, forumUV, heightUV, hash2, upQuad, sideQuad, orientedTri, yawFromBearing } from './common.js';

const D = VIA.shopBack - VIA.walk; // profundidade das lojas (3,5 m)
const T = 0.3; // espessura das paredes
const H1 = 3.4; // pé-direito do térreo (loja + sobrado)
const H2 = 2.7; // pavimentos superiores
const DARK = '#2b231c';

/** Tons de reboco (hipótese: terra, ocre, creme, vermelho-terra desbotado). */
const PLASTER = ['#d8c6a3', '#cdb38b', '#e0d3b9', '#c8a580', '#bf9a74', '#d4bf98', '#c9b79a', '#b98f6c'];

/** Planeja as fileiras de módulos (largura, tipo, andares) de forma determinística. */
export function planShopRows(terrain) {
  const rows = [
    { s: 1, u0: 141, u1: 318, seed: 1 },
    { s: -1, u0: 183, u1: 304, seed: 2 },
  ];
  const mods = [];
  for (const row of rows) {
    let u = row.u0;
    let k = 0;
    let left = 4 + Math.floor(hash2(row.seed, 0, 3) * 4);
    while (true) {
      const w = 3.7 + hash2(row.seed, k, 5) * 1.1;
      if (u + w > row.u1) break;
      const r = hash2(row.seed, k, 7);
      const type = r < 0.62 ? 'shop' : r < 0.82 ? 'door' : r < 0.92 ? 'closed' : 'workshop';
      const uc = u + w / 2;
      const vf = row.s * VIA.walk;
      // piso no nível mais alto da calçada diante do módulo (degrau de soleira do lado baixo)
      const ys = [uc - w / 2, uc, uc + w / 2].map((uu) => heightUV(terrain, uu, row.s * (VIA.curb + VIA.walk) * 0.5) + 0.2);
      mods.push({
        s: row.s,
        uc,
        w,
        vf,
        rot: row.s > 0 ? 0 : Math.PI,
        yF: Math.max(...ys) + 0.04,
        walkC: ys[1],
        type,
        floors: hash2(row.seed, k, 11) < 0.28 ? 3 : 2,
        color: PLASTER[Math.floor(hash2(row.seed, k, 13) * PLASTER.length)],
        balcony: hash2(row.seed, k, 17) < 0.32,
        counter: type === 'shop' && hash2(row.seed, k, 19) < 0.55,
        sign: hash2(row.seed, k, 23) < 0.22,
        goods: Math.floor(hash2(row.seed, k, 29) * 5),
        id: row.seed * 1000 + k,
      });
      u += w;
      k++;
      if (--left === 0) {
        u += 4.5; // beco (angiportus) entre quarteirões
        left = 4 + Math.floor(hash2(row.seed, k, 3) * 4);
      }
    }
  }
  return mods;
}

/** Converte um ponto local do módulo (mx, my, mz) em coordenadas do mundo. */
export function modToWorld(m, mx, my, mz) {
  const p = forumUV(m.uc + m.s * mx, m.vf - m.s * mz);
  return { x: p.x, y: m.yF + my, z: p.z };
}

/**
 * Constrói as lojas.
 * @param {object} ctx  contexto do sítio
 * @param {Builder} b   builder dos edifícios (quadro do Fórum aberto)
 * @param {Builder} bd  builder de detalhes (quadro do Fórum aberto; maxDistance curto)
 * @param {object} inst lotes instanciados { amphora, jar, basket, sack }
 * @returns {Array} statics (vendedores) a registrar
 */
export function buildShops(ctx, b, bd, inst, mods) {
  const statics = [];
  for (const m of mods) {
    b.push(m.uc, m.yF, -m.vf, m.rot);
    bd.push(m.uc, m.yF, -m.vf, m.rot);
    buildModule(b, bd, m);
    b.pop();
    bd.pop();
    furnish(ctx, bd, inst, m, statics);
  }
  return statics;
}

function buildModule(b, bd, m) {
  const w = m.w;
  const H = H1 + (m.floors - 1) * H2;
  const col = m.color;
  const inner = w - 2 * T;
  const ground = 'opusIncertum';

  // embasamento/piso (topo em y = 0) e acabamento de cocciopesto
  b.box(w, 1.8, D, 0, -1.8, -D / 2, { mat: ground });
  b.box(inner, 0.03, D - T - 0.35, 0, 0, -(D - T - 0.35) / 2 - 0.35, { mat: 'signinum', collide: false });
  // soleira de travertino
  b.box(inner, 0.05, 0.35, 0, 0, -0.175, { mat: 'travertine', collide: false, color: [0.92, 0.9, 0.85] });
  // rampa de colisão invisível da calçada para a soleira (o jogador entra sem pular)
  const dy = m.walkC - m.yF;
  b.collider(G.quad([-inner / 2, dy, 0.75], [inner / 2, dy, 0.75], [inner / 2, 0, -0.05], [-inner / 2, 0, -0.05]));

  // paredes laterais (térreo em opus incertum aparente, andares rebocados)
  for (const sx of [-1, 1]) {
    const x = sx * (w / 2 - T / 2);
    b.box(T, H1, D, x, 0, -D / 2, { mat: ground });
    b.box(T, H - H1, D, x, H1, -D / 2, { mat: 'plaster', color: col });
  }
  // parede dos fundos (dá para o beco de trás)
  b.box(inner, H, T, 0, 0, -D + T / 2, { mat: 'plaster', color: shade(col, 0.92) });

  // ---------------- fachada do térreo ----------------
  if (m.type === 'door') {
    // casa: parede com porta estreita e janelinha alta
    const doorAt = inner / 2 + (hash2(m.id, 1, 3) - 0.5) * (inner - 1.6) * 0.6;
    b.wall(-inner / 2, inner / 2, -T / 2, H1, T, { mat: 'plaster', color: col, openings: [{ at: doorAt, w: 1.1, h: 2.35 }] });
    b.box(1.2, 0.18, T + 0.04, -inner / 2 + doorAt, 2.35, -T / 2, { mat: 'travertine', collide: false }); // verga
    b.box(0.5, 0.4, 0.04, -inner / 2 + (doorAt > inner / 2 ? 0.6 : inner - 0.6), 1.9, 0.01, { mat: 'flat', color: DARK, collide: false });
    // vestíbulo escuro + folha da porta entreaberta
    b.box(1.05, 2.3, 0.05, -inner / 2 + doorAt, 0, -T - 0.6, { mat: 'flat', color: DARK, collide: false });
    b.box(0.55, 2.3, 0.07, -inner / 2 + doorAt - 0.3, 0, -T * 0.6, { mat: 'woodDark', collide: false });
    b.colliderBox(inner, 2.4, 0.2, 0, 0, -T - 0.7); // o vestíbulo não é visitável
  } else {
    // loja: vão largo com verga de madeira
    const lintelY = 2.85;
    b.box(inner + 0.1, 0.32, 0.4, 0, lintelY, -0.2, { mat: 'woodDark', collide: false });
    b.box(inner, H1 - lintelY - 0.32, T, 0, lintelY + 0.32, -T / 2, { mat: 'plaster', color: col });
    // trilho de madeira no chão (encaixe das tábuas que fecham a loja à noite)
    b.box(inner, 0.04, 0.12, 0, 0.0, -0.32, { mat: 'woodDark', collide: false });
    if (m.type === 'closed') {
      // loja fechada: tábuas verticais encaixadas
      for (let x = -inner / 2 + 0.15; x < inner / 2 - 0.05; x += 0.3) {
        const t = 0.85 + hash2(m.id, Math.round(x * 10), 7) * 0.2;
        b.box(0.29, lintelY - 0.02, 0.06, x + 0.15, 0.02, -0.28, { mat: 'wood', color: [t, t, t], collide: false });
      }
      b.colliderBox(inner, lintelY, 0.2, 0, 0, -0.28);
    } else {
      // tábuas empilhadas de lado (loja aberta durante o dia)
      const side = hash2(m.id, 2, 5) < 0.5 ? -1 : 1;
      for (let k = 0; k < 6; k++) bd.box(0.28, lintelY - 0.1, 0.05, side * (inner / 2 - 0.2), 0.03, -0.55 - k * 0.06, { mat: 'wood', collide: false, color: [0.9 - k * 0.03, 0.88 - k * 0.03, 0.85 - k * 0.03] });
      if (m.type === 'workshop') b.box(inner * 0.6, 0.9, 0.25, -inner * 0.2, 0, -0.45, { mat: ground }); // meia-parede de oficina
    }
  }

  // ---------------- pavimentos superiores ----------------
  b.box(inner, H - H1, T, 0, H1, -T / 2, { mat: 'plaster', color: col });
  b.box(w + 0.1, 0.16, 0.12, 0, H1 - 0.05, 0.06, { mat: 'woodDark', collide: false }); // faixa de cornija
  for (let f = 1; f < m.floors; f++) {
    const yb = H1 + (f - 1) * H2;
    const nWin = inner > 3.6 ? 2 : 1;
    for (let i = 0; i < nWin; i++) {
      if (hash2(m.id, f * 10 + i, 31) < 0.15) continue;
      const x = nWin === 1 ? 0 : (i === 0 ? -1 : 1) * inner * 0.24;
      const wh = f === 1 ? 1.0 : 0.85;
      b.box(0.72, wh, 0.03, x, yb + 0.95, 0.005, { mat: 'flat', color: DARK, collide: false });
      b.box(0.86, 0.07, 0.12, x, yb + 0.9, 0.04, { mat: 'travertine', collide: false }); // peitoril
      const sh = hash2(m.id, f * 10 + i, 37);
      if (sh < 0.45) b.box(0.38, wh, 0.05, x - 0.58, yb + 0.95, 0.06, { mat: 'wood', collide: false }); // persiana aberta
      else if (sh < 0.65) b.box(0.72, wh * 0.95, 0.05, x, yb + 0.97, 0.04, { mat: 'wood', collide: false, color: [0.85, 0.82, 0.78] }); // persiana fechada
    }
  }
  // sacada de madeira (maenianum) sobre a calçada
  if (m.balcony) {
    const by = H1 + 0.05;
    b.box(w - 0.4, 0.12, 1.0, 0, by, 0.5, { mat: 'wood', collide: false });
    b.box(w - 0.4, 0.06, 0.05, 0, by + 0.9, 0.98, { mat: 'woodDark', collide: false });
    for (let x = -w / 2 + 0.25; x <= w / 2 - 0.2; x += 0.45) b.box(0.05, 0.9, 0.05, x, by + 0.1, 0.98, { mat: 'woodDark', collide: false });
    for (let x = -w / 2 + 0.4; x <= w / 2 - 0.3; x += 1.1) b.box(0.1, 0.14, 1.05, x, by - 0.14, 0.5, { mat: 'woodDark', collide: false });
    // roupa estendida
    if (hash2(m.id, 3, 41) < 0.5) bd.box(0.7, 0.55, 0.02, (hash2(m.id, 4, 43) - 0.5) * (w - 1.5), by + 0.4, 1.02, { mat: 'cloth', collide: false, color: hash2(m.id, 5, 47) < 0.5 ? '#c9b08a' : '#8e5a3e' });
  }

  // ---------------- telhado de uma água (alto nos fundos, beiral sobre a calçada) ----------------
  const slope = 0.15; // ~8,5°
  const zF = 0.8;
  const zB = -D - 0.22;
  const roofY = (z) => H + -z * slope; // passa por H na fachada (z = 0)
  const yFr = roofY(zF);
  const yB = roofY(zB);
  const hw = w / 2 - 0.01;
  const tt = 0.9 + hash2(m.id, 6, 3) * 0.15;
  b.add(upQuad([-hw, yFr, zF], [hw, yFr, zF], [hw, yB, zB], [-hw, yB, zB]), { mat: 'roofTile', color: [tt, tt, tt] });
  soffit(b, hw, yFr - 0.1, zF, yB - 0.1, zB);
  b.box(w, 0.14, 0.05, 0, yFr - 0.17, zF, { mat: 'woodDark', collide: false }); // testeira do beiral
  // empenas laterais (triângulos acima das paredes) e pano dos fundos acima de H
  const yTop = roofY(-D) - 0.03;
  for (const sx of [-1, 1]) {
    const x = sx * (w / 2);
    b.add(orientedTri([x, H, 0.0], [x, H, -D], [x, yTop, -D], [sx, 0, 0]), { mat: 'plaster', color: shade(col, 0.95) });
  }
  b.add(sideQuad([-w / 2, H, -D], [w / 2, H, -D], [w / 2, yTop, -D], [-w / 2, yTop, -D], [0, -1]), { mat: 'plaster', color: shade(col, 0.9) });

  // ---------------- interior: sobrado de madeira (pergula) ----------------
  if (m.type !== 'door') {
    b.box(inner, 0.12, D - T - 0.9, 0, 2.5, -(D - T - 0.9) / 2 - 0.9, { mat: 'woodDark', collide: false });
    for (let x = -inner / 2 + 0.3; x < inner / 2; x += 0.9) b.box(0.12, 0.16, D - T, x, 2.34, -(D - T) / 2, { mat: 'woodDark', collide: false });
  }

  // letreiro pintado (dipinto) acima da verga
  if (m.sign && m.type !== 'door') {
    b.box(Math.min(2.4, inner - 0.4), 0.42, 0.02, 0, 3.0, 0.01, { mat: 'flat', color: '#e6d8bb', collide: false });
    for (let k = 0; k < 5; k++) b.box(0.22 + hash2(m.id, k, 51) * 0.18, 0.11, 0.025, -0.85 + k * 0.42, 3.15, 0.022, { mat: 'paintRed', collide: false });
  }
}

/** Forro inclinado do telhado (visto de baixo). */
function soffit(b, hw, yF, zF, yB, zB) {
  // ordem invertida → normal para baixo
  const g = upQuad([-hw, yF, zF], [hw, yF, zF], [hw, yB, zB], [-hw, yB, zB]);
  // inverte o sentido dos triângulos e as normais
  const p = g.attributes.position.array;
  const n = g.attributes.normal.array;
  for (let i = 0; i < p.length; i += 9) {
    for (let k = 0; k < 3; k++) {
      const t = p[i + 3 + k];
      p[i + 3 + k] = p[i + 6 + k];
      p[i + 6 + k] = t;
    }
  }
  for (let i = 0; i < n.length; i++) n[i] = -n[i];
  b.add(g, { mat: 'woodDark' });
}

function shade(hex, k) {
  const c = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.round(((c >> 16) & 255) * k));
  const g = Math.min(255, Math.round(((c >> 8) & 255) * k));
  const bl = Math.min(255, Math.round((c & 255) * k));
  return `#${((r << 16) | (g << 8) | bl).toString(16).padStart(6, '0')}`;
}

/**
 * Mobília e mercadorias dentro das lojas abertas (builder de detalhes + instâncias) e o
 * vendedor (NPC estático).
 */
function furnish(ctx, bd, inst, m, statics) {
  if (m.type === 'door' || m.type === 'closed') return;
  const inner = m.w - 2 * T;
  const wr = ROT + m.rot;
  bd.push(m.uc, m.yF, -m.vf, m.rot);
  // balcão de alvenaria (comum nas lojas romanas)
  let counterX = null;
  if (m.counter) {
    const len = Math.min(1.9, inner * 0.5);
    counterX = -inner / 2 + len / 2;
    bd.box(len, 0.92, 0.55, counterX, 0, -0.85, { mat: 'opusIncertum', collide: true });
    bd.box(len + 0.06, 0.06, 0.62, counterX, 0.92, -0.85, { mat: 'travertine', collide: false });
  }
  // prateleira nos fundos
  bd.box(inner - 0.2, 0.05, 0.35, 0, 1.35, -D + T + 0.2, { mat: 'wood', collide: false });
  bd.box(inner - 0.2, 0.05, 0.35, 0, 1.95, -D + T + 0.2, { mat: 'wood', collide: false });
  bd.pop();

  const put = (batch, mx, my, mz, rot = 0, sc = 1, color = null) => {
    const p = modToWorld(m, mx, my, mz);
    batch.add(p.x, p.y, p.z, wr + rot, sc, color);
  };
  const g = m.goods;
  if (g === 0 || g === 3) {
    // vinho/azeite: ânforas encostadas na parede dos fundos e jarros na prateleira
    const n = Math.floor(inner / 0.38);
    for (let i = 0; i < n; i++) put(inst.amphora, -inner / 2 + 0.3 + i * 0.38, 0.03, -D + T + 0.28 + (i % 2) * 0.12, i * 0.7, 0.9 + (i % 3) * 0.05);
    for (let i = 0; i < 4; i++) put(inst.jar, -inner / 2 + 0.4 + i * 0.5, 1.4, -D + T + 0.2, i, 0.9);
  } else if (g === 1) {
    // cereais/legumes secos: sacos e cestos
    for (let i = 0; i < 4; i++) put(inst.sack, -inner / 2 + 0.45 + i * 0.6, 0.03, -D + T + 0.4, i * 1.3, 0.9 + (i % 2) * 0.15, i % 2 ? '#c9b48e' : '#b59c74');
    for (let i = 0; i < 3; i++) put(inst.basket, inner / 2 - 0.5 - i * 0.6, 0.03, -1.6, i, 1, '#b8945e');
  } else if (g === 2) {
    // padaria: pães sobre o balcão/tábuas e cestos
    for (let i = 0; i < 3; i++) put(inst.basket, -inner / 2 + 0.5 + i * 0.6, 0.03, -D + T + 0.45, i, 1.1, '#a8844f');
    bd.push(m.uc, m.yF, -m.vf, m.rot);
    bd.add(propGeometry('bread'), { mat: 'woodLight', matrix: localM(counterX ?? 0.4, 0.98, -0.85) });
    bd.add(propGeometry('bread'), { mat: 'woodLight', matrix: localM(0.6, 1.4, -D + T + 0.2) });
    bd.pop();
  } else {
    // tecidos: peças dobradas nas prateleiras e um pano pendurado
    bd.push(m.uc, m.yF, -m.vf, m.rot);
    const cols = ['#8e3b2c', '#d8ccb0', '#4d5a6a', '#9a7a46', '#e6dcc6'];
    for (let i = 0; i < 5; i++) bd.box(0.4, 0.14, 0.3, -inner / 2 + 0.4 + i * 0.5, 1.4, -D + T + 0.2, { mat: 'cloth', color: cols[i], collide: false });
    for (let i = 0; i < 4; i++) bd.box(0.4, 0.12, 0.3, -inner / 2 + 0.6 + i * 0.5, 2.0, -D + T + 0.2, { mat: 'cloth', color: cols[(i + 2) % 5], collide: false });
    bd.box(0.9, 1.4, 0.02, inner / 2 - 0.7, 1.2, -0.5, { mat: 'cloth', color: cols[m.id % 5], collide: false });
    bd.pop();
  }

  // vendedor atrás do balcão (ou na porta) olhando para a rua
  if (hash2(m.id, 8, 3) < 0.45) {
    const p = modToWorld(m, counterX ?? 0, 0.03, counterX != null ? -1.45 : -0.9);
    statics.push({ x: p.x, y: p.y, z: p.z, yaw: yawFromBearing(m.s > 0 ? 209 : 29), type: 'merchant', pose: 'work' });
  }
}

function localM(x, y, z) {
  return new THREE.Matrix4().makeTranslation(x, y, z);
}
