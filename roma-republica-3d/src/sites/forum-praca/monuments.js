/**
 * forum-praca — monumentos da praça.
 *
 *  - Lacus Curtius (nota 03 §12): "pequena bacia dentro de uma área pavimentada" (Pleiades), com
 *    figueira, videira e oliveira (Plín. NH 15.78); altar RETIRADO em 46 a.C. → sem altar.
 *    Envoltória atual ~11 × 11 m (PL-bbox); forma republicana NÃO ENCONTRADA → mureta de 8,6 m
 *    e bacia rasa (hipótese da nota). Jan.–fev.: figueira e videira sem folhas (botânica).
 *  - Puteal Libonis e tribunal do pretor (nota 03 §13): forma de altar com guirlandas de louro,
 *    duas liras e tenazes (moedas, Smith 1890); ~1 m de altura (hipótese da nota); tribunal ao
 *    lado (Smith 1890). Posição: "entre os templos de Vesta e Castor" → borda SE da praça (hipótese).
 *    Agiotas e litigantes (Cic. Sest. 18; Hor. Sat. 2.6.35).
 *  - Estátua equestre togada de Q. Márcio Trêmulo "diante do templo de Castor", de pé em 43 a.C.
 *    (Lívio 9.43.22; Plín. 34.23; Cic. Phil. 6.13). Medidas: NÃO ENCONTRADO (volume indicativo).
 *  - Relógios de sol sobre coluna junto à Rostra (Plín. NH 7.214): o de Catânia (263 a.C.) e o de
 *    Q. Márcio Filipo ao lado; presença em 44 a.C. NÃO CONFIRMADA (nota 02) → hipótese.
 *
 * Todas as coordenadas em (u, v) do referencial do Fórum (builder com pushForumFrame aberto).
 */
import * as THREE from 'three';
import * as G from '../../render/geom.js';
import { column } from '../../arch/columns.js';
import { propGeometry } from '../../arch/props.js';
import { PAVE_Y, fRot, hash2, upQuad, sideQuad, cylinderBetween, ellipsoid } from './common.js';

/** Posições (u, v) dos monumentos — usadas também por life.js. */
export const POS = {
  lacus: { u: -15, v: -6.6 },
  olive: { u: -8.4, v: -3.4 },
  puteal: { u: 78, v: -22 },
  tribunal: { u: 69.5, v: -16.5 },
  bankers: [{ u: 83, v: -18.6 }, { u: 82.6, v: -25.4 }],
  tremulus: { u: 52, v: -23.2 },
  sundials: [{ u: -17.6, v: 25.6 }, { u: -17.6, v: 28.4 }],
};

const M = (x, y, z) => new THREE.Matrix4().makeTranslation(x, y, z);

/* ========================================================================= */
/*  Lacus Curtius                                                            */
/* ========================================================================= */
export function buildLacusCurtius(b, bd) {
  const { u, v } = POS.lacus;
  const y0 = PAVE_Y;
  b.push(u, y0, -v, 0);
  bd.push(u, y0, -v, 0);
  const S = 8.6; // lado externo da mureta
  const t = 0.42;
  const h = 0.92;
  const half = S / 2;
  // piso interno de lajes de tufo (mais antigas que o travertino da praça)
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      const x0 = -half + t + (i * (S - 2 * t)) / 4;
      const x1 = -half + t + ((i + 1) * (S - 2 * t)) / 4;
      const z0 = -half + t + (j * (S - 2 * t)) / 4;
      const z1 = -half + t + ((j + 1) * (S - 2 * t)) / 4;
      const c = 0.82 + hash2(i, j, 61) * 0.14;
      b.add(upQuad([x0, 0.03, z0], [x1, 0.03, z0], [x1, 0.03, z1], [x0, 0.03, z1]), { mat: 'slabsTufa', color: [c, c * 0.97, c * 0.92] });
    }
  }
  // mureta: embasamento moldurado, corpo de tufo, coroamento de travertino; entrada a leste (+u)
  const sides = [
    { x0: -half, x1: half, z: -half + t / 2, rot: 0 }, // norte (+v)
    { x0: -half, x1: half, z: half - t / 2, rot: 0 }, // sul
  ];
  for (const sd of sides) {
    b.box(S + 0.16, 0.18, t + 0.16, 0, 0, sd.z, { mat: 'travertine', collide: false });
    b.box(S, h - 0.12, t, 0, 0.18, sd.z, { mat: 'tufa' });
    b.box(S + 0.08, 0.12, t + 0.12, 0, h, sd.z, { mat: 'travertine', collide: false });
  }
  // lado oeste (fechado) e leste (com abertura de 1,4 m)
  for (const [x, open] of [[-half + t / 2, false], [half - t / 2, true]]) {
    const L = S - 2 * t;
    const segs = open ? [[-L / 2, -0.7], [0.7, L / 2]] : [[-L / 2, L / 2]];
    for (const [a, c] of segs) {
      const len = c - a;
      const zc = (a + c) / 2;
      b.box(t + 0.16, 0.18, len, x, 0, zc, { mat: 'travertine', collide: false });
      b.box(t, h - 0.12, len, x, 0.18, zc, { mat: 'tufa' });
      b.box(t + 0.12, 0.12, len, x, h, zc, { mat: 'travertine', collide: false });
    }
  }
  // bacia rasa (pouca água parada — "bacia" do fim da República; Ovídio já a vê seca)
  const bx = -0.7;
  const bz = 0.5;
  const BW = 3.4;
  const BD = 2.6;
  const rt = 0.3;
  for (const s of [-1, 1]) {
    b.box(BW, 0.55, rt, bx, 0.03, bz + s * (BD / 2 - rt / 2), { mat: 'travertine', color: [0.9, 0.88, 0.84] });
    b.box(rt, 0.55, BD - 2 * rt, bx + s * (BW / 2 - rt / 2), 0.03, bz, { mat: 'travertine', color: [0.9, 0.88, 0.84] });
  }
  b.box(BW - 2 * rt, 0.06, BD - 2 * rt, bx, 0.03, bz, { mat: 'tufaGrey', collide: false, color: [0.55, 0.55, 0.5] });
  b.add(upQuad([bx - BW / 2 + rt, 0.27, bz - BD / 2 + rt], [bx + BW / 2 - rt, 0.27, bz - BD / 2 + rt], [bx + BW / 2 - rt, 0.27, bz + BD / 2 - rt], [bx - BW / 2 + rt, 0.27, bz + BD / 2 - rt]), { mat: 'water' });
  // marca das lajes novas onde estava o altar retirado em 46 a.C. (hipótese)
  bd.box(1.3, 0.012, 0.95, 2.2, 0.03, -1.9, { mat: 'travertine', collide: false, color: [1.08, 1.06, 1.0] });
  // canteiro da figueira (canto NO interno) com borda de pedra
  const fx = -2.65;
  const fz = -2.65;
  b.box(1.6, 0.05, 1.6, fx, 0.03, fz, { mat: 'dirt', collide: false });
  for (const s of [-1, 1]) {
    b.box(1.8, 0.14, 0.1, fx, 0.03, fz + s * 0.85, { mat: 'tufa', collide: false });
    b.box(0.1, 0.14, 1.6, fx + s * 0.85, 0.03, fz, { mat: 'tufa', collide: false });
  }
  bareFig(b, fx, 0.06, fz);
  b.pop();
  bd.pop();

  // ---- fora do recinto: oliveira (sempre-verde; via ctx.vegetation em life.js) num canteiro ----
  const o = POS.olive;
  b.push(o.u, y0, -o.v, 0);
  b.box(1.9, 0.05, 1.9, 0, 0, 0, { mat: 'dirt', collide: false });
  for (const s of [-1, 1]) {
    b.box(2.1, 0.22, 0.12, 0, 0, s * 1.0, { mat: 'tufa', collide: false });
    b.box(0.12, 0.22, 1.9, s * 1.0, 0, 0, { mat: 'tufa', collide: false });
  }
  b.pop();

  // ---- videira em armação de madeira (pérgula) ao sul do recinto; sem folhas no inverno ----
  b.push(u + 0.2, y0, -(v - half - 2.3), 0);
  pergolaVine(b);
  b.pop();
}

/** Figueira sem folhas (inverno): tronco curto, galhos cinzentos ramificados. */
function bareFig(b, x, y, z) {
  const bark = [0.62, 0.6, 0.56];
  const add = (p0, p1, r0, r1) => b.add(cylinderBetween(p0, p1, r0, r1, 6), { mat: 'woodDark', color: bark });
  const trunkTop = [x + 0.1, y + 1.3, z - 0.05];
  add([x, y - 0.05, z], trunkTop, 0.16, 0.12);
  let seed = 3;
  const grow = (p, dir, len, r, depth) => {
    const q = [p[0] + dir[0] * len, p[1] + dir[1] * len, p[2] + dir[2] * len];
    add(p, q, r, r * 0.7);
    if (depth === 0) return;
    const n = depth > 1 ? 3 : 2;
    for (let k = 0; k < n; k++) {
      seed++;
      const a = hash2(seed, depth, 7) * Math.PI * 2;
      const tilt = 0.35 + hash2(seed, depth, 9) * 0.45;
      const d = [dir[0] * 0.55 + Math.cos(a) * tilt, dir[1] * 0.75 + 0.25, dir[2] * 0.55 + Math.sin(a) * tilt];
      const l = Math.hypot(...d);
      grow(q, d.map((c) => c / l), len * (0.62 + hash2(seed, 1, 3) * 0.15), r * 0.62, depth - 1);
    }
  };
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * Math.PI * 2 + 0.4;
    const d = [Math.cos(a) * 0.65, 0.75, Math.sin(a) * 0.65];
    const l = Math.hypot(...d);
    grow(trunkTop, d.map((c) => c / l), 1.0, 0.09, 2);
  }
}

/** Pérgula de madeira com uma videira sem folhas (cepa retorcida e varas). */
function pergolaVine(b) {
  const L = 8;
  const Wd = 3;
  const H = 2.6;
  const posts = [[-L / 2, -Wd / 2], [0, -Wd / 2], [L / 2, -Wd / 2], [-L / 2, Wd / 2], [0, Wd / 2], [L / 2, Wd / 2]];
  for (const [x, z] of posts) {
    b.box(0.14, 0.12, 0.14, x, 0, z, { mat: 'tufa', collide: false }); // sapata
    b.box(0.12, H, 0.12, x, 0.1, z, { mat: 'woodDark', collide: 'box' });
  }
  for (const z of [-Wd / 2, Wd / 2]) b.box(L + 0.4, 0.14, 0.12, 0, H, z, { mat: 'woodDark', collide: false });
  for (let x = -L / 2; x <= L / 2 + 0.01; x += 0.8) b.box(0.07, 0.07, Wd + 0.4, x, H + 0.14, 0, { mat: 'wood', collide: false });
  // cepa da videira junto ao poste central sul, varas sobre a armação
  const bark = [0.55, 0.47, 0.4];
  const vine = (p0, p1, r) => b.add(cylinderBetween(p0, p1, r, r * 0.8, 5), { mat: 'woodDark', color: bark });
  vine([0.25, 0, Wd / 2 - 0.1], [0.1, 1.2, Wd / 2 - 0.05], 0.07);
  vine([0.1, 1.2, Wd / 2 - 0.05], [0.3, 2.3, Wd / 2 - 0.1], 0.06);
  vine([0.3, 2.3, Wd / 2 - 0.1], [0.1, H + 0.22, Wd / 2 - 0.2], 0.05);
  const top = H + 0.24;
  let s = 1;
  for (const [x1, z1] of [[-3.6, 1.0], [-2.4, -1.2], [-1.2, 0.2], [1.4, -0.9], [2.8, 0.9], [3.7, -1.1], [-3.0, -0.3], [2.1, 0.1]]) {
    s++;
    const mid = [x1 * 0.5 + 0.05, top + 0.05, (z1 + Wd / 2 - 0.2) * 0.5];
    vine([0.1, top - 0.02, Wd / 2 - 0.2], mid, 0.035);
    vine(mid, [x1, top + 0.02 + hash2(s, 2, 3) * 0.05, z1], 0.025);
  }
}

/* ========================================================================= */
/*  Puteal Libonis, tribunal do pretor e mesas de agiotas                     */
/* ========================================================================= */
export function buildPuteal(b, bd) {
  const { u, v } = POS.puteal;
  const y0 = PAVE_Y;
  b.push(u, y0, -v, fRot(29));
  // degrau circular
  b.add(G.cylinder(1.18, 1.18, 0.14, 28), { mat: 'travertine', collide: true, colliderGeom: G.cylinder(1.18, 1.18, 0.14, 10), color: [0.9, 0.88, 0.84] });
  // corpo em forma de altar redondo (bocal oco)
  const prof = [[0.8, 0.14], [0.82, 0.2], [0.74, 0.27], [0.67, 0.31], [0.67, 0.97], [0.73, 1.0], [0.8, 1.07], [0.8, 1.16], [0.56, 1.16], [0.56, 0.6]];
  b.lathe(prof, 0, 0, 0, { mat: 'travertine', segments: 28, collide: false });
  b.add(G.disc(0.56, 16, 0.6, true), { mat: 'flat', color: '#1f1a15' });
  b.collider(G.cylinder(0.82, 0.82, 1.16, 10));
  // guirlandas de louro (4 festões entre rosetas) — relevo
  const R = 0.69;
  for (let k = 0; k < 4; k++) {
    const a0 = (k / 4) * Math.PI * 2 + Math.PI / 4;
    const a1 = a0 + Math.PI / 2;
    // roseta / laço
    b.add(ellipsoid(Math.sin(a0) * R, 0.9, Math.cos(a0) * R, 0.06, 0.06, 0.06, 8, 6), { mat: 'travertine' });
    for (let i = 1; i < 9; i++) {
      const t = i / 9;
      const a = a0 + (a1 - a0) * t;
      const yy = 0.9 - Math.sin(t * Math.PI) * 0.2;
      b.add(ellipsoid(Math.sin(a) * (R + 0.01), yy, Math.cos(a) * (R + 0.01), 0.055, 0.045, 0.05, 6, 4), { mat: 'travertine', color: [0.95, 0.94, 0.9] });
    }
  }
  // duas liras (frente e fundos) e tenazes (laterais), abaixo das guirlandas
  for (const a of [0, Math.PI]) {
    b.push(Math.sin(a) * (R + 0.015), 0.38, Math.cos(a) * (R + 0.015), a);
    b.box(0.2, 0.06, 0.03, 0, 0, 0, { mat: 'travertine', collide: false }); // caixa
    for (const s of [-1, 1]) b.add(cylinderBetween([s * 0.07, 0.05, 0.01], [s * 0.1, 0.3, 0.01], 0.014, 0.012, 5), { mat: 'travertine' });
    b.box(0.24, 0.025, 0.03, 0, 0.29, 0, { mat: 'travertine', collide: false }); // travessa
    for (let i = -1; i <= 1; i++) b.box(0.008, 0.24, 0.02, i * 0.035, 0.05, 0.012, { mat: 'travertine', collide: false }); // cordas
    b.pop();
  }
  for (const a of [Math.PI / 2, -Math.PI / 2]) {
    b.push(Math.sin(a) * (R + 0.015), 0.4, Math.cos(a) * (R + 0.015), a);
    b.add(cylinderBetween([-0.09, 0, 0.01], [0.09, 0.26, 0.01], 0.012, 0.012, 4), { mat: 'travertine' });
    b.add(cylinderBetween([0.09, 0, 0.01], [-0.09, 0.26, 0.01], 0.012, 0.012, 4), { mat: 'travertine' });
    b.pop();
  }
  b.pop();

  // ---------------- tribunal do pretor (frente para NNE, para a praça) ----------------
  const tb = POS.tribunal;
  const TW = 4.4;
  const TD = 3.2;
  const TH = 1.05;
  b.push(tb.u, y0, -tb.v, fRot(29));
  bd.push(tb.u, y0, -tb.v, fRot(29));
  b.box(TW + 0.2, 0.16, TD + 0.2, 0, 0, 0, { mat: 'travertine', collide: false }); // base moldurada
  b.box(TW, TH - 0.12, TD, 0, 0.0, 0, { mat: 'tufa' });
  b.box(TW + 0.14, 0.1, TD + 0.14, 0, TH - 0.12, 0, { mat: 'travertine', collide: false }); // cornija
  b.box(TW - 0.1, 0.05, TD - 0.1, 0, TH - 0.02, 0, { mat: 'wood', collide: false }); // tablado
  b.colliderBox(TW, TH + 0.03, TD, 0, 0, 0);
  // escada de madeira nos fundos (sobe em direção ao tablado)
  b.push(1.1, 0, -TD / 2, Math.PI);
  b.stairs(1.1, 1.5, TH + 0.03, 0, 0, 1.5, { mat: 'wood', steps: 5 });
  b.pop();
  // cadeira curul (pés em X, assento de couro)
  curuleChair(bd, 0, TH + 0.03, -0.35);
  bd.add(G.box(2.2, 0.06, 0.4).translate(0, 0.42, 0), { mat: 'wood', matrix: M(0, TH + 0.03, -1.15) }); // banco dos assessores
  for (const s of [-1, 1]) bd.box(0.08, 0.42, 0.35, s * 1.0, TH + 0.03, -1.15, { mat: 'wood', collide: false });
  // diante do tribunal: mesa do escriba com tabuinhas e rolos, bancos das partes
  bd.add(propGeom('table'), { mat: 'wood', matrix: M(-1.2, 0, TD / 2 + 1.0), collide: 'box' });
  for (let i = 0; i < 4; i++) bd.box(0.24, 0.02, 0.16, -1.6 + i * 0.27, 0.8, TD / 2 + 1.0 + (i % 2) * 0.12, { mat: 'woodLight', collide: false }); // tabuinhas enceradas
  for (let i = 0; i < 2; i++) bd.add(G.cylinder(0.035, 0.035, 0.3, 8).rotateZ(Math.PI / 2).translate(0.15, 0.035, 0), { mat: 'cloth', color: '#e8dcb8', matrix: M(-0.8 + i * 0.1 - 0.3, 0.8, TD / 2 + 0.85 + i * 0.1) });
  bd.add(propGeom('chest'), { mat: 'woodDark', matrix: M(-2.4, 0, TD / 2 + 0.7), collide: 'box' }); // scrinium
  bd.add(propGeom('bench'), { mat: 'wood', matrix: M(-1.2, 0, TD / 2 + 1.75), collide: 'box' });
  bd.add(propGeom('bench'), { mat: 'wood', matrix: rotM(1.1, 0, TD / 2 + 3.2, 0), collide: 'box' });
  bd.add(propGeom('bench'), { mat: 'wood', matrix: rotM(-1.4, 0, TD / 2 + 3.4, 0.15), collide: 'box' });
  b.pop();
  bd.pop();

  // ---------------- mesas de agiotas junto ao Puteal ----------------
  for (const [k, p] of POS.bankers.entries()) {
    bd.push(p.u, y0, -p.v, fRot(k === 0 ? 299 : 340));
    bd.add(G.box(1.3, 0.06, 0.7).translate(0, 0.76, 0), { mat: 'wood' });
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) bd.box(0.06, 0.76, 0.06, sx * 0.58, 0, sz * 0.28, { mat: 'woodDark', collide: false });
    bd.colliderBox(1.3, 0.82, 0.7, 0, 0, 0);
    // pilhas de moedas, balança e cofre (arca com ferragens)
    for (let i = 0; i < 6; i++) {
      const hgt = 0.02 + hash2(k, i, 3) * 0.05;
      bd.add(G.cylinder(0.022, 0.022, hgt, 8), { mat: i % 3 === 0 ? 'gold' : 'bronze', matrix: M(-0.4 + i * 0.09, 0.82, -0.1 + (i % 2) * 0.12) });
    }
    bd.add(G.cylinder(0.012, 0.012, 0.32, 5), { mat: 'bronze', matrix: M(0.35, 0.82, 0.05) });
    bd.box(0.36, 0.012, 0.012, 0.35, 1.12, 0.05, { mat: 'bronze', collide: false });
    for (const s of [-1, 1]) bd.add(G.cylinder(0.06, 0.05, 0.015, 10), { mat: 'bronze', matrix: M(0.35 + s * 0.17, 0.98, 0.05) });
    bd.add(propGeom('chest'), { mat: 'woodDark', matrix: M(0, 0, -1.3), collide: 'box' });
    bd.box(1.16, 0.05, 0.03, 0, 0.3, -1.01, { mat: 'iron', collide: false });
    bd.add(propGeom('stool'), { mat: 'wood', matrix: M(0, 0, -0.62) });
    bd.pop();
  }
}

/** Cadeira curul: dois pares de pés curvos cruzados (marfim) e assento de couro. */
function curuleChair(bd, x, y, z) {
  const ivory = '#e9dfc8';
  bd.push(x, y, z, 0);
  for (const sx of [-0.27, 0.27]) {
    for (const s of [-1, 1]) {
      // cada perna em dois segmentos (curva em S simplificada)
      bd.add(cylinderBetween([sx, 0, s * 0.22], [sx, 0.24, s * 0.02], 0.025, 0.022, 6), { mat: 'flat', color: ivory });
      bd.add(cylinderBetween([sx, 0.24, s * 0.02], [sx, 0.46, -s * 0.2], 0.022, 0.025, 6), { mat: 'flat', color: ivory });
    }
  }
  bd.box(0.62, 0.05, 0.46, 0, 0.46, 0, { mat: 'cloth', color: '#6e3b2a', collide: false });
  bd.box(0.6, 0.03, 0.03, 0, 0.44, 0.21, { mat: 'flat', color: ivory, collide: false });
  bd.box(0.6, 0.03, 0.03, 0, 0.44, -0.21, { mat: 'flat', color: ivory, collide: false });
  bd.pop();
}

/* ========================================================================= */
/*  Estátua equestre togada de Q. Márcio Trêmulo                              */
/* ========================================================================= */
export function buildTremulus(b) {
  const { u, v } = POS.tremulus;
  const y0 = PAVE_Y;
  b.push(u, y0, -v, fRot(29)); // cavalo voltado para a praça (NNE)
  const PW = 1.75;
  const PL = 3.3;
  // pedestal: base e cornija de travertino, dado de tufo estucado, painel com inscrição pintada
  b.box(PW + 0.4, 0.22, PL + 0.4, 0, 0, 0, { mat: 'travertine' });
  b.box(PW + 0.2, 0.16, PL + 0.2, 0, 0.22, 0, { mat: 'travertine', collide: false });
  b.box(PW, 1.45, PL, 0, 0.38, 0, { mat: 'stucco' });
  b.box(PW + 0.22, 0.14, PL + 0.22, 0, 1.83, 0, { mat: 'travertine', collide: false });
  b.box(PW + 0.3, 0.12, PL + 0.3, 0, 1.97, 0, { mat: 'travertine', collide: false });
  const top = 2.09;
  // inscrição nas faces longas
  for (const s of [-1, 1]) {
    b.box(0.03, 0.62, 1.9, s * (PW / 2 + 0.01), 0.82, 0, { mat: 'flat', color: '#e4d9c2', collide: false });
    for (let r = 0; r < 3; r++) {
      const ln = 1.6 - r * 0.35;
      b.box(0.035, 0.08, ln, s * (PW / 2 + 0.015), 1.25 - r * 0.17, 0, { mat: 'paintRed', collide: false });
    }
  }
  b.pop();
  // figura de bronze (cavalo a passo com uma pata dianteira erguida e cavaleiro de toga)
  b.push(u, y0 + top, -v, fRot(29));
  equestrian(b);
  b.pop();
}

/** Cavalo e cavaleiro togado (volume indicativo) com a frente para +Z local. */
function equestrian(b) {
  const mat = 'bronze';
  const add = (g) => b.add(g, { mat });
  const cyl = (p0, p1, r0, r1) => add(cylinderBetween(p0, p1, r0, r1, 8));
  // corpo
  add(ellipsoid(0, 1.28, -0.05, 0.36, 0.42, 0.95, 14, 10));
  add(ellipsoid(0, 1.36, 0.62, 0.33, 0.4, 0.42, 12, 8)); // peito
  add(ellipsoid(0, 1.32, -0.75, 0.34, 0.38, 0.4, 12, 8)); // garupa
  // pescoço e cabeça
  cyl([0, 1.45, 0.75], [0, 2.05, 1.12], 0.22, 0.14);
  add(ellipsoid(0, 2.02, 1.32, 0.12, 0.15, 0.32, 10, 7));
  add(ellipsoid(0, 1.96, 1.6, 0.09, 0.1, 0.12, 8, 6)); // focinho
  for (const s of [-1, 1]) cyl([s * 0.06, 2.15, 1.18], [s * 0.08, 2.32, 1.12], 0.03, 0.01); // orelhas
  b.box(0.06, 0.1, 0.62, 0, 1.92, 0.93, { mat, collide: false, rotY: 0 }); // crina (aprox.)
  // pernas (traseiras e dianteira esquerda no chão; dianteira direita erguida)
  for (const s of [-1, 1]) cyl([s * 0.2, 1.05, -0.72], [s * 0.21, 0.0, -0.8], 0.11, 0.06);
  cyl([-0.2, 1.05, 0.6], [-0.2, 0.0, 0.66], 0.1, 0.06);
  cyl([0.2, 1.05, 0.6], [0.22, 0.55, 0.82], 0.1, 0.07);
  cyl([0.22, 0.55, 0.82], [0.22, 0.32, 0.62], 0.07, 0.055);
  for (const [x, z] of [[-0.21, -0.8], [0.21, -0.8], [-0.2, 0.66]]) add(G.cylinder(0.075, 0.07, 0.08, 8).translate(x, 0, z)); // cascos
  // cauda
  cyl([0, 1.42, -1.08], [0, 0.85, -1.28], 0.07, 0.04);
  // cavaleiro: pernas abertas sobre o lombo, toga drapeada, braço direito estendido
  for (const s of [-1, 1]) {
    cyl([s * 0.22, 1.72, 0.05], [s * 0.36, 1.3, 0.25], 0.08, 0.065);
    cyl([s * 0.36, 1.3, 0.25], [s * 0.34, 0.92, 0.12], 0.065, 0.05);
  }
  add(G.lathe([[0.3, 0], [0.27, 0.22], [0.2, 0.55], [0.22, 0.68], [0.12, 0.78]], 12, { vByHeight: true }).translate(0, 1.66, 0.0));
  add(ellipsoid(0.08, 2.3, 0.0, 0.2, 0.14, 0.17, 10, 6)); // dobra da toga no ombro esquerdo (+X)
  cyl([0, 2.42, 0], [0, 2.52, 0.01], 0.05, 0.05); // pescoço
  add(ellipsoid(0, 2.6, 0.02, 0.1, 0.12, 0.11, 10, 8)); // cabeça
  // (figura voltada para +Z: a direita anatômica fica em −X)
  cyl([0.22, 2.32, 0.02], [0.28, 1.95, 0.22], 0.05, 0.045); // braço esquerdo (rédeas)
  cyl([-0.22, 2.32, 0.02], [-0.42, 2.38, 0.42], 0.05, 0.045); // braço direito erguido (saudação)
  cyl([-0.42, 2.38, 0.42], [-0.5, 2.55, 0.62], 0.045, 0.04);
}

/* ========================================================================= */
/*  Relógios de sol sobre colunas                                             */
/* ========================================================================= */
export function buildSundials(b) {
  for (const [k, p] of POS.sundials.entries()) {
    b.push(p.u, PAVE_Y, -p.v, fRot(180)); // mostrador voltado para o sul
    b.box(0.95, 0.32, 0.95, 0, 0, 0, { mat: 'travertine' });
    b.box(0.8, 0.12, 0.8, 0, 0.32, 0, { mat: 'travertine', collide: false });
    const colH = k === 0 ? 3.1 : 2.9;
    column(b, 0, 0.44, 0, { order: 'tuscan', height: colH, diameter: 0.42, mat: 'stucco' });
    const y = 0.44 + colH;
    // bloco do relógio (hemiciclo): face côncava voltada para +Z, gnômon de bronze
    b.box(0.72, 0.1, 0.62, 0, y, 0, { mat: 'travertine', collide: false });
    const yb = y + 0.1;
    b.box(0.72, 0.5, 0.18, 0, yb, -0.22, { mat: 'travertine', collide: false }); // costas
    for (const s of [-1, 1]) b.box(0.1, 0.5, 0.62, s * 0.31, yb, 0, { mat: 'travertine', collide: false }); // laterais
    // superfície côncava (quarto de cilindro) com linhas horárias que acompanham a curva
    const n = 8;
    const R = 0.42;
    const arc = (a, r) => [-0.13 + Math.sin(a) * r, yb + 0.5 - Math.cos(a) * r * 0.95];
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 0.5;
      const a1 = ((i + 1) / n) * Math.PI * 0.5;
      const [z0, y0] = arc(a0, R);
      const [z1, y1] = arc(a1, R);
      b.add(upQuad([-0.26, y0, z0], [0.26, y0, z0], [0.26, y1, z1], [-0.26, y1, z1]), { mat: 'travertine', color: [0.85, 0.84, 0.8] });
      const [lz0, ly0] = arc(a0, R - 0.004);
      const [lz1, ly1] = arc(a1, R - 0.004);
      for (let h = 0; h < 11; h++) {
        const x = -0.24 + (h / 10) * 0.48;
        b.add(upQuad([x - 0.004, ly0, lz0], [x + 0.004, ly0, lz0], [x + 0.004, ly1, lz1], [x - 0.004, ly1, lz1]), { mat: 'flat', color: '#3a3128' });
      }
    }
    b.add(cylinderBetween([0, yb + 0.48, -0.12], [0, yb + 0.42, 0.18], 0.008, 0.006, 4), { mat: 'bronze' });
    b.pop();
  }
}

/* ------------------------------------------------------------------------- */
function propGeom(name) {
  return propGeometry(name);
}
function rotM(x, y, z, r) {
  return new THREE.Matrix4().makeRotationY(r).setPosition(x, y, z);
}
