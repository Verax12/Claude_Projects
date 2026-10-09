/**
 * Macellum — arquitetura: muro de recinto, anel de tabernae, pórtico toscano, telhados,
 * portões e tholos central.
 *
 * TUDO AQUI É RECONSTRUÇÃO HIPOTÉTICA (nota 08 §1, "Planta e elementos arquitetônicos"):
 *   "Pátio retangular com lojas abobadadas ou de viga em três ou quatro lados, um pórtico de
 *    pilares/colunas diante delas e um tholos no centro (rotunda de colunas com cobertura
 *    cônica de telhas). Uma entrada pelo lado do Fórum ou da basílica e outra pelo Argileto."
 * Materiais (nota 08 §1 e Lacuna 7): tufo, estuque branco/ocre, telhas de terracota, madeira;
 * SEM mármore (as lojas vizinhas da Basílica Emília eram de opus quadratum de tufo — nota 02 §8).
 * Paredes de divisa com 1,5 pé (≈ 0,44 m) — limite legal (Vitr. 2.8.17; Plín. 35.173, nota 11 §5).
 * Tholos: "rotunda pequena de colunas toscanas/dóricas em tufo estucado, com telhado cônico de
 * telhas" (nota 08, Lacuna 2) — diâmetro, ordem e fonte/tanque NÃO ENCONTRADOS.
 *
 * O Builder `b` deve estar no quadro do EDIFÍCIO (ver frame.js) ao chamar buildStructure.
 */
import { column, arch } from '../../arch/columns.js';
import * as G from '../../render/geom.js';
import * as THREE from 'three';
import { M, COURT, WINGS, shopsOf, ringRoof } from './frame.js';

/** Portões: posição (x' da ala) e largura da passagem. */
export const GATES = { S: { at: 0, w: M.GATE_S }, W: { at: 0, w: M.GATE_W } };

/** Altura do muro externo (topo dentro da espessura do telhado). */
const H_OUT = 7.15;
/** Topo do muro frontal das lojas (logo abaixo das telhas na face do pórtico). */
const H_FRONT = M.RIDGE - (M.FRONT - M.RIDGE_D) * M.ROOF_PITCH - 0.02;

/** Lojas de cada ala (calculadas uma vez; usadas também por market.js). */
export function layoutShops() {
  const out = {};
  for (const w of WINGS) out[w.id] = shopsOf(w, GATES[w.id] || null);
  return out;
}

/** Cores de reboco (variação de lote para lote: lojas vendidas a particulares — Lív. 40.51.5). */
const PLASTER = ['#e9dcc0', '#e3d2b2', '#efe4cc', '#dccaa6', '#e6d6bb', '#d8c4a0'];

/**
 * Constrói toda a arquitetura.
 * @param {import('../../core/Builder.js').Builder} b  builder no quadro do edifício (estrutura)
 * @param {import('../../core/Builder.js').Builder} bd builder de detalhes (mesmo quadro; maxDistance)
 * @param {object} shops  resultado de layoutShops()
 * @param {object} closed  { S: Set(índices), ... } lojas fechadas (tábuas)
 * @param {function} rng
 */
export function buildStructure(b, bd, shops, closed, rng) {
  for (const wing of WINGS) {
    b.push(wing.pos[0], 0, wing.pos[1], wing.rot);
    bd.push(wing.pos[0], 0, wing.pos[1], wing.rot);
    buildWing(b, bd, wing, shops[wing.id], closed[wing.id] || new Set(), rng);
    bd.pop();
    b.pop();
  }
  courtyard(b, bd);
  roofs(b);
  tholos(b, bd);
}

/* ======================================================================= */
/*  Ala (no quadro da ala: x' ao longo, d para dentro)                      */
/* ======================================================================= */
function buildWing(b, bd, wing, shops, closed, rng) {
  const gate = GATES[wing.id] || null;
  const isNS = wing.id === 'S' || wing.id === 'N';
  const ext = isNS ? wing.half : wing.half - M.WALL; // N/S cobrem as quinas
  const span = wing.span;
  const wallColor = PLASTER[(wing.id.charCodeAt(0) * 7) % PLASTER.length];

  // ---------------- muro externo (opus quadratum de tufo) ----------------
  const openings = [];
  for (const s of shops) openings.push({ at: s.cx + ext, w: 0.62, h: 0.78, y: 1.5 + 4.25 }); // janelinhas do mezanino
  if (gate) {
    const g = gateDims(wing.id);
    openings.push({ at: gate.at + ext, w: g.open, h: g.top - (M.FLOOR - 0.12), y: 1.5 + M.FLOOR - 0.12 });
  }
  b.wall(-ext, ext, M.WALL / 2, H_OUT + 1.5, M.WALL, { y: -1.5, mat: 'tufa', openings });
  // grades de madeira nas janelinhas (vistas de fora)
  for (const s of shops) {
    for (let k = -1; k <= 1; k++) b.box(0.04, 0.78, 0.04, s.cx + k * 0.16, 4.25, M.WALL * 0.5, { mat: 'woodDark', collide: false });
    b.box(0.8, 0.07, 0.16, s.cx, 4.18, -0.05, { mat: 'travertine', collide: false }); // peitoril
  }

  // embasamento saliente e cornija sob o beiral (interrompidos nos portões).
  // N/S passam por fora das quinas; L/O vão até a face interna dos de N/S (sem faces coplanares).
  const extS = isNS ? wing.half + 0.08 : wing.half;
  const segs = gate ? [[-extS, gate.at - gateDims(wing.id).open / 2 - 0.05], [gate.at + gateDims(wing.id).open / 2 + 0.05, extS]] : [[-extS, extS]];
  for (const [a, c] of segs) b.box(c - a, 0.55, 0.08, (a + c) / 2, -0.3, -0.04, { mat: 'tufaGrey', collide: false });
  const extC = isNS ? wing.half + 0.22 : wing.half;
  const extC2 = isNS ? wing.half + 0.14 : wing.half;
  b.box(2 * extC, 0.18, 0.22, 0, 6.72, -0.11, { mat: 'stucco', collide: false });
  b.box(2 * extC2, 0.12, 0.14, 0, 6.6, -0.07, { mat: 'stucco', collide: false });

  // ---------------- pisos (com colisão) ----------------
  const bandSegs = gate ? [[-span, gate.at - gate.w / 2], [gate.at + gate.w / 2, span]] : [[-span, span]];
  for (const [a, c] of bandSegs) b.box(c - a, 0.8, M.FRONT - M.WALL, (a + c) / 2, M.FLOOR - 0.8, (M.WALL + M.FRONT) / 2, { mat: 'dirt' });
  const pSpan = isNS ? M.OX - M.FRONT : COURT.hz;
  b.box(2 * pSpan, 0.8, M.STYLO - M.FRONT, 0, M.FLOOR - 0.8, (M.FRONT + M.STYLO) / 2, { mat: 'slabs' });
  // estilóbata de travertino (borda do degrau para o pátio)
  const sSpan = isNS ? COURT.hx + 0.9 : COURT.hz - 0.02;
  b.box(2 * sSpan, M.FLOOR + 0.312, 0.92, 0, -0.3, M.STYLO - 0.44, { mat: 'travertine', collide: false });
  // rampa invisível sobre o degrau (o jogador sobe sem tropeçar)
  b.colliderRamp(2 * sSpan, 0, M.STYLO + 0.6, 0, M.STYLO + 0.02, M.FLOOR + 0.012);

  // ---------------- quinas (depósitos fechados entre duas alas) ----------------
  if (isNS) {
    for (const sx of [-1, 1]) {
      const x0 = span;
      const x1 = wing.half - M.WALL;
      b.box(x1 - x0, 7.0, M.FRONT - M.WALL, sx * (x0 + x1) / 2, M.FLOOR, (M.WALL + M.FRONT) / 2, { mat: 'plaster', color: wallColor });
    }
  }

  // ---------------- divisórias entre lojas ----------------
  const parts = [];
  for (let i = 1; i < shops.length; i++) {
    if (Math.abs(shops[i].x0 - shops[i - 1].x1) < 0.01) parts.push(shops[i].x0);
  }
  if (gate) parts.push(gate.at - gate.w / 2 - M.FRONT_T / 2, gate.at + gate.w / 2 + M.FRONT_T / 2);
  for (const x of parts) b.box(M.FRONT_T, 7.0, M.SHOP_IN - M.WALL, x, M.FLOOR, (M.WALL + M.SHOP_IN) / 2, { mat: 'plaster', color: wallColor });

  // ---------------- muro frontal com portas e janelas altas ----------------
  const fx = isNS ? span + M.FRONT_T : span;
  const fOpen = [];
  shops.forEach((s) => {
    const dw = doorW(s, gate);
    fOpen.push({ at: s.cx + fx, w: dw, h: M.DOOR_H, y: 0 });
    fOpen.push({ at: s.cx + fx, w: 0.9, h: 0.5, y: 6.1 });
  });
  if (gate) fOpen.push({ at: gate.at + fx, w: gate.w, h: 4.6, y: 0 });
  b.wall(-fx, fx, (M.SHOP_IN + M.FRONT) / 2, H_FRONT - M.FLOOR, M.FRONT_T, { y: M.FLOOR, mat: 'plaster', color: wallColor, openings: fOpen });
  // faixa inferior mais escura (rodapé gasto/sujo) na face do pórtico, só nos trechos cheios
  const doors = fOpen.filter((o) => o.y === 0).map((o) => [o.at - fx - o.w / 2, o.at - fx + o.w / 2]).sort((p, q) => p[0] - q[0]);
  let cur = -fx;
  for (const [a, c] of [...doors, [fx, fx]]) {
    if (a - cur > 0.05) b.box(a - cur, 0.9, 0.02, (a + cur) / 2, M.FLOOR, M.FRONT + 0.01, { mat: 'plaster', color: shade(wallColor, 0.78), collide: false, faces: { nz: false } });
    cur = c;
  }
  // cornija no topo do muro frontal (sob o beiral do telhado das lojas)
  const fc = isNS ? fx : fx - 0.2;
  b.box(2 * fc, 0.16, 0.18, 0, H_FRONT - 0.35, M.FRONT + 0.09, { mat: 'stucco', collide: false });

  // ---------------- interior de cada loja ----------------
  shops.forEach((s, i) => {
    const w = s.w - M.FRONT_T;
    const dw = doorW(s, gate);
    const isClosed = closed.has(i);
    const tint = PLASTER[Math.floor(rng() * PLASTER.length)];
    // reboco simples na parede do fundo (face interna do muro de tufo)
    b.box(w, M.MEZZ - M.FLOOR, 0.03, s.cx, M.FLOOR, M.WALL + 0.015, { mat: 'plaster', color: shade(tint, 0.86), collide: false, faces: { nz: false } });
    // mezanino (pergula) de tábuas sobre vigotas
    b.box(w, 0.14, M.SHOP_IN - M.WALL, s.cx, M.MEZZ, (M.WALL + M.SHOP_IN) / 2, { mat: 'woodDark', collide: false });
    for (const k of [-0.28, 0.28]) b.box(0.12, 0.16, M.SHOP_IN - M.WALL, s.cx + k * w, M.MEZZ - 0.16, (M.WALL + M.SHOP_IN) / 2, { mat: 'woodDark', collide: false });
    // escada de mão para o mezanino (em algumas lojas)
    if (rng() < 0.55) ladder(bd, s.cx - w / 2 + 0.45, M.FLOOR, 1.1, M.MEZZ - M.FLOOR);
    // verga de madeira e soleira de travertino
    b.box(dw + 0.5, 0.26, 0.07, s.cx, M.FLOOR + M.DOOR_H, M.FRONT + 0.035, { mat: 'woodDark', collide: false });
    b.box(dw, 0.035, M.FRONT_T + 0.04, s.cx, M.FLOOR, (M.SHOP_IN + M.FRONT) / 2, { mat: 'travertine', collide: false });
    // peitoril da janela alta
    b.box(1.05, 0.06, 0.12, s.cx, 6.24, M.FRONT + 0.05, { mat: 'travertine', collide: false });
    if (isClosed) {
      // loja fechada: tábuas corridas encaixadas na soleira (lojas de propriedade privada)
      bd.box(dw, M.DOOR_H, 0.08, s.cx, M.FLOOR, M.SHOP_IN + 0.18, { mat: 'wood' });
      for (let k = 1; k < 5; k++) bd.box(0.03, M.DOOR_H, 0.03, s.cx - dw / 2 + (k * dw) / 5, M.FLOOR, M.SHOP_IN + 0.24, { mat: 'woodDark', collide: false });
      bd.box(dw, 0.1, 0.05, s.cx, M.FLOOR + 1.4, M.SHOP_IN + 0.25, { mat: 'woodDark', collide: false });
    } else {
      // balcão de alvenaria (meia largura) com tampo de travertino
      const cw = Math.min(1.7, w * 0.45);
      const cx = s.cx + (i % 2 ? 1 : -1) * (w / 2 - cw / 2 - 0.15);
      b.box(cw, 0.88, 0.6, cx, M.FLOOR, M.SHOP_IN - 0.45, { mat: 'plaster', color: shade(tint, 0.8) });
      b.box(cw + 0.08, 0.06, 0.68, cx, M.FLOOR + 0.88, M.SHOP_IN - 0.45, { mat: 'travertine', collide: false });
      s.counter = { x: cx, w: cw, d: M.SHOP_IN - 0.45, top: M.FLOOR + 0.94 };
    }
    s.inner = w;
    s.door = dw;
  });
}

/** Largura da porta de uma loja (pilares de ~0,25 m de cada lado). */
function doorW(s, gate) {
  let w = s.w - M.FRONT_T - 0.5;
  if (gate && (Math.abs(s.x1 - (gate.at - gate.w / 2)) < 0.01 || Math.abs(s.x0 - (gate.at + gate.w / 2)) < 0.01)) w -= M.FRONT_T;
  return Math.max(1.6, Math.min(3.4, w));
}

/** Dimensões do portal em arco de cada portão. */
function gateDims(id) {
  if (id === 'S') return { span: 4.0, spring: M.FLOOR + 2.8, thick: 0.5, open: 5.0, top: M.FLOOR + 2.8 + 2.0 + 0.5 };
  return { span: 3.6, spring: M.FLOOR + 2.6, thick: 0.45, open: 4.5, top: M.FLOOR + 2.6 + 1.8 + 0.45 };
}

/** Escada de mão de madeira encostada (para o mezanino). */
function ladder(b, x, y, d, h) {
  const z0 = M.SHOP_IN - 0.6;
  const lean = 0.6;
  for (const s of [-0.22, 0.22]) {
    const len = Math.hypot(h, lean);
    const g = G.box(0.05, len, 0.06);
    const m = new THREE.Matrix4().makeTranslation(x + s, y, z0).multiply(new THREE.Matrix4().makeRotationX(-Math.atan2(lean, h)));
    b.add(g, { mat: 'wood', matrix: m });
  }
  const n = Math.floor(h / 0.3);
  for (let k = 1; k < n; k++) {
    const t = k / n;
    b.box(0.46, 0.035, 0.035, x, y + t * h, z0 - t * lean, { mat: 'wood', collide: false });
  }
}

/** Escurece uma cor hex. */
export function shade(hex, k) {
  const c = new THREE.Color(hex);
  c.multiplyScalar(k);
  return '#' + c.getHexString();
}

/* ======================================================================= */
/*  Pátio, colunatas e portões                                              */
/* ======================================================================= */
function courtyard(b, bd) {
  // pavimento do pátio: lajes de tufo (hipótese — revestimento NÃO ENCONTRADO)
  b.floor(2 * COURT.hx, 2 * COURT.hz, 0, 0.04, 0, { mat: 'slabsTufa', collide: false, thickness: 0.1 });

  // colunas toscanas de tufo estucado + entablamento (arquitrave de madeira estucada)
  const cx = M.OX - M.COL_D;
  const cz = M.OZ - M.COL_D;
  const colOpts = { order: 'tuscan', height: M.COL_H, diameter: M.COL_DIAM, mat: 'stucco' };
  for (const wing of WINGS) {
    const isNS = wing.id === 'S' || wing.id === 'N';
    const half = isNS ? cx : cz;
    const n = isNS ? 15 : 11; // nº ÍMPAR de intervalos: o eixo dos portões fica livre
    b.push(wing.pos[0], 0, wing.pos[1], wing.rot);
    for (let i = 0; i <= n; i++) {
      if (!isNS && (i === 0 || i === n)) continue; // colunas de canto já postas pelas alas N/S
      column(b, -half + (2 * half * i) / n, M.FLOOR, M.COL_D, colOpts);
    }
    const y = M.FLOOR + M.COL_H;
    const L1 = isNS ? half + 0.35 : half - 0.25; // arquitrave
    const L2 = isNS ? half + 0.45 : half - 0.35; // cornija
    b.box(2 * L1, 0.3, 0.5, 0, y, M.COL_D, { mat: 'stucco', collide: false });
    b.box(2 * L1 - 0.02, 0.18, 0.44, 0, y + 0.3, M.COL_D, { mat: 'stucco', color: '#e8dcc4', collide: false });
    b.box(2 * L2, 0.14, 0.7, 0, y + 0.48, M.COL_D, { mat: 'stucco', collide: false });
    b.pop();
  }

  gate(b, bd, 'S');
  gate(b, bd, 'W');
}

/** Portão em arco no muro externo + passagem coberta até o pórtico. */
function gate(b, bd, id) {
  const wing = WINGS.find((w) => w.id === id);
  const g = GATES[id];
  const d = gateDims(id);
  b.push(wing.pos[0], 0, wing.pos[1], wing.rot);
  bd.push(wing.pos[0], 0, wing.pos[1], wing.rot);
  const x = g.at;
  const hw = g.w / 2;
  // piso da passagem (lajes) e soleira de travertino no vão do muro
  b.box(g.w, 0.8, M.FRONT - M.WALL - 0.03, x, M.FLOOR - 0.8 + 0.003, (M.WALL + 0.03 + M.FRONT) / 2, { mat: 'slabs' });
  b.box(d.open, 0.13, M.WALL + 0.06, x, M.FLOOR - 0.12, M.WALL / 2, { mat: 'travertine' });
  // degrau externo + rampa invisível
  b.box(d.open + 0.6, 0.1, 0.5, x, 0, -0.28, { mat: 'travertine', collide: false });
  b.colliderRamp(d.open + 0.6, x, -0.95, 0, -0.03, M.FLOOR + 0.01);
  // arco de aduelas de tufo (ligeiramente saliente do muro) e ombreiras
  arch(b, x, d.spring, M.WALL / 2, d.span, M.WALL + 0.06, { mat: 'tufa', thickness: d.thick, segments: 11 });
  for (const s of [-1, 1]) b.box(d.thick, d.spring - (M.FLOOR + 0.01), M.WALL + 0.06, x + s * (d.span / 2 + d.thick / 2), M.FLOOR + 0.01, M.WALL / 2, { mat: 'tufa' });
  // impostas
  for (const s of [-1, 1]) b.box(d.thick + 0.16, 0.16, M.WALL + 0.16, x + s * (d.span / 2 + d.thick / 2), d.spring - 0.16, M.WALL / 2, { mat: 'travertine', collide: false });
  // forro de tábuas da passagem
  b.box(g.w + 0.9, 0.16, M.SHOP_IN - M.WALL, x, 5.6, (M.WALL + M.SHOP_IN) / 2, { mat: 'woodDark', collide: false });
  // verga do vão para o pórtico
  b.box(g.w + 0.6, 0.32, 0.08, x, M.FLOOR + 4.6, M.FRONT + 0.04, { mat: 'woodDark', collide: false });
  // folhas de porta de madeira, abertas, encostadas às paredes da passagem
  for (const s of [-1, 1]) {
    const lw = d.span / 2;
    bd.box(0.08, d.spring - M.FLOOR - 0.05, lw, x + s * (hw - 0.06), M.FLOOR, M.WALL + 0.05 + lw / 2, { mat: 'wood', collide: false });
    for (let k = 0; k < 3; k++) bd.box(0.03, 0.12, lw - 0.1, x + s * (hw - 0.11), M.FLOOR + 0.5 + k * 1.0, M.WALL + 0.05 + lw / 2, { mat: 'iron', collide: false });
  }
  if (id === 'S') {
    // portão principal: pilastras de tufo, capitéis e painel para inscrição (sem texto legível)
    for (const s of [-1, 1]) {
      b.box(0.62, 6.25, 0.2, x + s * 3.2, 0, -0.1, { mat: 'tufa', collide: false });
      b.box(0.82, 0.22, 0.32, x + s * 3.2, 6.25, -0.12, { mat: 'travertine', collide: false });
      b.box(0.8, 0.3, 0.3, x + s * 3.2, 0, -0.15, { mat: 'travertine', collide: false });
    }
    b.box(3.4, 0.82, 0.1, x, 5.66, -0.05, { mat: 'travertine', collide: false });
    for (let r = 0; r < 2; r++) {
      const n = r === 0 ? 8 : 6;
      for (let k = 0; k < n; k++) bd.box(0.18, 0.2, 0.012, x - ((n - 1) * 0.34) / 2 + k * 0.34, 6.13 - r * 0.32, -0.105, { mat: 'flat', color: '#4a3a2c', collide: false });
    }
  }
  bd.pop();
  b.pop();
}

/* ======================================================================= */
/*  Telhados em anel                                                         */
/* ======================================================================= */
function roofs(b) {
  const R = M.RIDGE;
  const P = M.ROOF_PITCH;
  const rect = (d, y) => ({ hx: M.OX - d, hz: M.OZ - d, y });
  // lojas: duas águas (uma para o pátio, outra para a rua), cumeeira no meio da faixa
  const ridge = rect(M.RIDGE_D, R);
  const dIn = M.FRONT + 0.35;
  ringRoof(b, ridge, rect(dIn, R - (dIn - M.RIDGE_D) * P), { fasciaA: false });
  const dOut = -0.45;
  ringRoof(b, ridge, rect(dOut, R - (M.RIDGE_D - dOut) * P), { fasciaA: false });
  // cumeeira (fiada de ímbrices) ao longo do retângulo da cumeeira
  const rx = M.OX - M.RIDGE_D;
  const rz = M.OZ - M.RIDGE_D;
  b.box(2 * rx + 0.25, 0.12, 0.26, 0, R - 0.05, rz, { mat: 'roofTile', collide: false });
  b.box(2 * rx + 0.25, 0.12, 0.26, 0, R - 0.05, -rz, { mat: 'roofTile', collide: false });
  b.box(0.26, 0.118, 2 * rz - 0.25, rx, R - 0.05, 0, { mat: 'roofTile', collide: false });
  b.box(0.26, 0.118, 2 * rz - 0.25, -rx, R - 0.05, 0, { mat: 'roofTile', collide: false });
  // pórtico: uma água encostada ao muro frontal, caindo para o pátio
  const dHi = M.FRONT - 0.05;
  const dLo = M.COL_D + 0.55;
  const PP = M.PORT_PITCH;
  ringRoof(b, rect(dLo, M.PORT_HI - (dLo - M.FRONT) * PP), rect(dHi, M.PORT_HI + 0.05 * PP), { fasciaB: false });
}

/* ======================================================================= */
/*  Tholos central (hipótese)                                               */
/* ======================================================================= */
/** Raio externo do estilóbata do tholos (para os demais módulos evitarem a área). */
export const THOLOS_R = 6.1;

function tholos(b, bd) {
  const steps = [5.9, 5.5, 5.1];
  const sh = 0.18;
  const top = sh * steps.length;
  steps.forEach((r, i) => b.add(G.cylinder(r, r, sh * (i + 1) + 0.4, 40), { mat: 'travertine', matrix: new THREE.Matrix4().makeTranslation(0, -0.4, 0) }));
  // colisão: tronco de cone suave sobre os degraus (sobe-se de qualquer lado) + plataforma
  b.collider(G.cylinder(THOLOS_R + 0.1, steps[2], top, 20));
  b.add(G.disc(steps[2] - 0.02, 40, top + 0.012, true), { mat: 'slabs' });

  // 10 colunas toscanas estucadas
  const n = 10;
  const rc = 4.45;
  const Hc = 4.0;
  const D = 0.5;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + Math.PI / n;
    column(b, Math.sin(a) * rc, top, Math.cos(a) * rc, { order: 'tuscan', height: Hc, diameter: D, mat: 'stucco' });
  }
  // entablamento anelar (arquitrave + friso + cornija)
  const yE = top + Hc;
  const ring = (r0, r1, y0, h, mat, color) => b.add(G.lathe([[r0, 0], [r1, 0], [r1, h], [r0, h], [r0, 0]], 40, { vByHeight: true }), { mat, color, matrix: new THREE.Matrix4().makeTranslation(0, y0, 0) });
  ring(rc - 0.32, rc + 0.32, yE, 0.32, 'stucco');
  ring(rc - 0.3, rc + 0.3, yE + 0.32, 0.2, 'stucco', '#e8dcc4');
  ring(rc - 0.38, rc + 0.55, yE + 0.52, 0.14, 'stucco');
  // telhado cônico de telhas, forro de madeira e remate de terracota
  const rb = yE + 0.66;
  const rr = rc + 0.95;
  const rh = 2.5;
  b.add(G.lathe([[rr, 0], [0.25, rh]], 40, { vByHeight: false }), { mat: 'roofTile', matrix: new THREE.Matrix4().makeTranslation(0, rb, 0) });
  b.add(G.lathe([[0.25, rh - 0.12], [rr, -0.12]], 32, {}), { mat: 'woodDark', matrix: new THREE.Matrix4().makeTranslation(0, rb, 0) });
  b.add(G.lathe([[rr, -0.12], [rr, 0]], 40, {}), { mat: 'woodDark', matrix: new THREE.Matrix4().makeTranslation(0, rb, 0) });
  b.add(G.lathe([[0.0, 0.0], [0.3, 0.0], [0.34, 0.15], [0.2, 0.45], [0.06, 0.62], [0.0, 0.66]], 12), { mat: 'roofTile', color: '#d08a5a', matrix: new THREE.Matrix4().makeTranslation(0, rb + rh - 0.1, 0) });

  // bacia central de água (lavagem do peixe — hipótese, nota 08 §2: "água das fontes")
  const bw = 1.55;
  b.add(G.lathe([[bw, 0], [bw + 0.06, 0.08], [bw, 0.14], [bw, 0.6], [bw - 0.2, 0.6], [bw - 0.2, 0.3]], 32, { vByHeight: true }), {
    mat: 'travertine',
    collide: true,
    colliderGeom: G.cylinder(bw + 0.05, bw + 0.05, 0.6, 12),
    matrix: new THREE.Matrix4().makeTranslation(0, top, 0),
  });
  bd.add(G.disc(bw - 0.2, 32, top + 0.48, true), { mat: 'water' });
  // pilar com bica de bronze no centro
  b.add(G.lathe([[0.22, 0], [0.18, 0.1], [0.14, 0.9], [0.2, 1.0], [0.2, 1.08], [0.0, 1.08]], 16), { mat: 'travertine', matrix: new THREE.Matrix4().makeTranslation(0, top + 0.3, 0) });
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    const m = new THREE.Matrix4().makeTranslation(Math.sin(a) * 0.16, top + 1.2, Math.cos(a) * 0.16).multiply(new THREE.Matrix4().makeRotationY(a)).multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2 - 0.3));
    bd.add(G.cylinder(0.03, 0.025, 0.2, 6), { mat: 'bronze', matrix: m });
    // filete de água caindo na bacia
    const w = new THREE.Matrix4().makeTranslation(Math.sin(a) * 0.42, top + 0.48, Math.cos(a) * 0.42);
    bd.add(G.cylinder(0.022, 0.03, 0.74, 6, { caps: false }), { mat: 'water', matrix: w });
  }
}
