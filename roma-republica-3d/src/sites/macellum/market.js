/**
 * Macellum — bancas, mercadorias, utensílios e conteúdo das lojas.
 *
 * Setorização (HIPÓTESE, nota 08 §2–3): "setor do peixe dentro do macellum, no lado mais
 * próximo da basílica" (lado SSO = +Z local); Forum Cuppedinis (iguarias) e Forum Coquinum
 * (cozinheiros de aluguel) como setores do macellum, não como edifícios distintos.
 * Bancas (mensae): "tampo de pedra ou madeira sobre cavaletes, na frente de cada taberna";
 * peixe em "bancas com tampo de pedra e drenagem" (nota 08 §2, §10 — hipóteses).
 * Toldos: "toldos individuais de linho cru sobre as bancas, sem documentação" (nota 08 §10).
 *
 * Coordenadas: quadro do EDIFÍCIO (ver frame.js). Objetos repetidos (> 30) vão em lotes
 * instanciados (coordenadas do mundo, convertidas pelos quadros Frame); o resto é fundido no
 * builder de detalhes `bd` (maxDistance).
 */
import * as THREE from 'three';
import { propGeometry, prop, stall } from '../../arch/props.js';
import { M, FB, Y0, WINGS } from './frame.js';
import * as GD from './goods.js';

/** Cores (sRGB) dos produtos — tons naturais, escolha estética (não dado de fonte). */
export const C = {
  fish: ['#c9cfd2', '#b8c0c4', '#d6d2c4', '#a9b3b8', '#c4b8a8'],
  tuna: '#5d6a78',
  oyster: '#8f8a80',
  cherry: '#7a1222',
  fig: '#5a3448',
  figDry: '#8a6a44',
  appleR: '#a8402a',
  appleY: '#c49a3a',
  pear: '#b0a84a',
  quince: '#d2b23e',
  pomegranate: '#8e2a20',
  plum: '#4a2a52',
  mushroom: '#c6b294',
  helvella: '#7c6248',
  herbs: '#5a7a3a',
  mallow: '#4f7036',
  beet: '#6a1e2e',
  chickpea: '#d2bc88',
  spelt: '#bfa060',
  rose: '#b8394e',
  meat: ['#9a3a30', '#a8483a', '#8a3028', '#b0584a'],
  bread: ['#b07a40', '#a06a34', '#c08a4c'],
  cheese: ['#e2cf98', '#d8c088', '#c9b07a'],
  hen: ['#8a5a32', '#e8e0d0', '#6a3a22', '#b07840'],
  goose: ['#eeeae2', '#d8d4cc', '#9a9890'],
  thrush: ['#7a6a5a', '#6a5a4a'],
  linen: ['#ece4d0', '#e2d8c0', '#f0eadc', '#d8cdb2'],
};

/**
 * Cria os lotes instanciados do sítio (chave global prefixada com "macellum:").
 * Mercadorias pequenas não projetam sombra (orçamento) e somem além de ~95 m.
 */
export function makeBatches(ctx) {
  const small = { maxDistance: 95, castShadow: false, chunkSize: 160 };
  const mid = { maxDistance: 110, castShadow: true, chunkSize: 160 };
  const W = ctx.world;
  // ânfora Dressel 1 (pé pontudo) inclinada ~17°: o topo pende para −X local da instância.
  // yaw −π/2 encosta o topo na parede do fundo de uma loja (−d no quadro da ala).
  const amphoraLean = propGeometry('amphora').clone().applyMatrix4(new THREE.Matrix4().makeRotationZ(0.3)).translate(0.17, 0, 0);
  return {
    fish: W.instances('macellum:fish', GD.fishGeometry(), 'flat', small),
    basket: W.instances('macellum:basket', GD.basketGeometry(), 'flat', small),
    heap: W.instances('macellum:heap', GD.heapGeometry(), 'flat', small),
    loaf: W.instances('macellum:loaf', GD.loafGeometry(), 'flat', small),
    bird: W.instances('macellum:bird', GD.birdGeometry(), 'flat', small),
    meat: W.instances('macellum:meat', GD.haunchGeometry(), 'flat', small),
    jar: W.instances('macellum:jar', propGeometry('jar'), 'terracotta', small),
    flask: W.instances('macellum:flask', GD.flaskGeometry(), 'terracotta', small),
    amphoraLean: W.instances('macellum:amphoraLean', amphoraLean, 'terracotta', mid),
  };
}

/**
 * Coloca uma instância a partir de um quadro local (Frame) — y relativo ao pátio.
 */
function put(batch, F, lx, y, lz, yaw = 0, scale = 1, color = null) {
  const p = F.toWorld(lx, lz);
  batch.add(p.x, Y0 + y, p.z, F.rot + yaw, scale, color);
}

/** Cesto com monte de produto (duas instâncias). */
function basketOf(B, F, lx, y, lz, color, s = 1, rng = Math.random) {
  put(B.basket, F, lx, y, lz, rng() * 6.28, s);
  put(B.heap, F, lx, y + 0.12 * s, lz, rng() * 6.28, s, jitter(color, rng));
}

/** Pequena variação de cor. */
function jitter(hex, rng, k = 0.08) {
  const c = new THREE.Color(hex);
  const f = 1 + (rng() - 0.5) * 2 * k;
  c.r = Math.min(1, c.r * f);
  c.g = Math.min(1, c.g * f);
  c.b = Math.min(1, c.b * f);
  return c;
}

const pick = (arr, rng) => arr[Math.floor(rng() * arr.length) % arr.length];

/* ======================================================================= */
/*  Pátio                                                                   */
/* ======================================================================= */

/** Posições das bancas no pátio (quadro do edifício). Usadas também por life.js. */
export const STALLS = {
  // mesas de pedra do peixe (lado SSO, +Z), voltadas para o tholos (−Z)
  fish: [-18, -12.5, -7, 7, 12.5, 18].map((x) => ({ x, z: 11.0, rot: Math.PI })),
  // bancas de madeira de frutas e verduras (lado NNE, −Z), voltadas para o tholos (+Z)
  green: [-18, -12.5, -7, 7, 12.5, 18].map((x) => ({ x, z: -11.0, rot: 0 })),
  bread: { x: -14, z: -5.2, rot: 0 },
  cheese: { x: -14, z: 5.2, rot: Math.PI },
  oil: { x: -19.6, z: -5.2, rot: 0 },
  flowers: { x: -19.6, z: 5.2, rot: Math.PI },
  cages: { x: 20, z: -5.2, rot: 0 },
  peacock: { x: 20.2, z: 5.6 },
  henPen: { x0: 11, x1: 17, z0: -7.2, z1: -3.4 },
  goosePen: { x0: 11, x1: 17, z0: 3.4, z1: 7.2 },
  cooks: { x: 0, z: -(M.OZ - 6.4) }, // junto ao muro frontal do pórtico norte
};

/**
 * Monta o pátio: mesas do peixe com canaleta, bancas, cercados de aves, cozinheiros.
 * @param {object} ctx  @param bd builder de detalhes no quadro do edifício  @param B lotes
 */
export function buildCourtyardMarket(ctx, bd, B, rng) {
  fishTables(bd, B, rng);
  greenStalls(bd, B, rng);
  westStalls(bd, B, rng);
  birds(bd, B, rng);
  cooks(bd, B, rng);
}

/** Toldo de linho cru sobre quatro varas (quadro local: frente em +Z). */
function awning(bd, w, d, hFront, hBack, color) {
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) bd.box(0.06, sz > 0 ? hFront : hBack, 0.06, (sx * w) / 2, 0, (sz * d) / 2, { mat: 'woodDark', collide: false });
  for (const sz of [-1, 1]) bd.box(w + 0.1, 0.06, 0.06, 0, (sz > 0 ? hFront : hBack) - 0.06, (sz * d) / 2, { mat: 'woodDark', collide: false });
  const P = [
    [-w / 2 - 0.12, hFront - 0.02, d / 2 + 0.25],
    [w / 2 + 0.12, hFront - 0.02, d / 2 + 0.25],
    [w / 2 + 0.12, hBack + 0.02, -d / 2 - 0.12],
    [-w / 2 - 0.12, hBack + 0.02, -d / 2 - 0.12],
  ];
  bd.quad(P[0], P[1], P[2], P[3], { mat: 'cloth', color });
  bd.quad(P[1], P[0], P[3], P[2], { mat: 'cloth', color: shadeHex(color, 0.82) });
  // franja caída na frente
  bd.quad([-w / 2 - 0.12, hFront - 0.3, d / 2 + 0.25], [w / 2 + 0.12, hFront - 0.3, d / 2 + 0.25], [w / 2 + 0.12, hFront - 0.02, d / 2 + 0.25], [-w / 2 - 0.12, hFront - 0.02, d / 2 + 0.25], { mat: 'cloth', color });
  bd.quad([w / 2 + 0.12, hFront - 0.3, d / 2 + 0.25], [-w / 2 - 0.12, hFront - 0.3, d / 2 + 0.25], [-w / 2 - 0.12, hFront - 0.02, d / 2 + 0.25], [w / 2 + 0.12, hFront - 0.02, d / 2 + 0.25], { mat: 'cloth', color: shadeHex(color, 0.8) });
}

function shadeHex(hex, k) {
  const c = new THREE.Color(hex).multiplyScalar(k);
  return '#' + c.getHexString();
}

/* ---------------- peixe ---------------- */
function fishTables(bd, B, rng) {
  STALLS.fish.forEach((st, i) => {
    const F = FB.child(st.x, st.z, st.rot);
    bd.push(st.x, 0, st.z, st.rot);
    // mesa de pedra (mensa) inclinada levemente para escorrer, sobre dois pés de alvenaria
    bd.box(2.6, 0.1, 0.95, 0, 0.8, 0, { mat: 'travertine', collide: false });
    bd.box(2.7, 0.05, 0.08, 0, 0.9, 0.47, { mat: 'travertine', collide: false }); // borda
    for (const s of [-1, 1]) bd.box(0.32, 0.8, 0.75, s * 0.95, 0, 0, { mat: 'travertine', color: '#b5aa90', collide: false });
    bd.colliderBox(2.6, 0.9, 0.95, 0, 0, 0);
    awning(bd, 2.9, 2.0, 2.25, 2.55, pick(C.linen, rng));
    // statera pendurada na travessa da frente do toldo (algumas mesas)
    if (i % 2 === 0) bd.add(GD.stateraGeometry(), { mat: 'bronze', matrix: new THREE.Matrix4().makeTranslation(0.6, 2.19 - 0.77, 1.0) });
    bd.pop();
    // peixes sobre a mesa
    const big = i === 1 || i === 4;
    if (big) {
      put(B.fish, F, -0.3, 0.9, 0.05, 0.05, 3.2, C.tuna); // atum (cetus) inteiro
      for (let k = 0; k < 4; k++) put(B.fish, F, 0.75 + (k % 2) * 0.32, 0.9, -0.25 + Math.floor(k / 2) * 0.35, 1.57 + (rng() - 0.5) * 0.4, 1.2, pick(C.fish, rng));
    } else if (i === 2) {
      // moreias (muraenae) — iguaria de luxo
      bd.push(st.x, 0, st.z, st.rot);
      for (let k = 0; k < 3; k++) {
        bd.add(GD.eelGeometry(), { mat: 'flat', matrix: new THREE.Matrix4().makeTranslation(-0.6 + k * 0.55, 0.9, -0.15 + (k % 2) * 0.25).multiply(new THREE.Matrix4().makeRotationY(0.4 + k)) });
      }
      bd.pop();
      basketOf(B, F, 0.95, 0.9, 0.15, C.oyster, 0.8, rng); // ostras
    } else {
      for (let r = 0; r < 2; r++) {
        for (let k = 0; k < 5; k++) put(B.fish, F, -1.0 + k * 0.48 + (rng() - 0.5) * 0.08, 0.9, -0.2 + r * 0.38, (rng() - 0.5) * 0.5 + (r ? Math.PI : 0), 0.9 + rng() * 0.35, pick(C.fish, rng));
      }
    }
    // cestos de peixe (surpiculi) no chão, ao lado e atrás
    basketOf(B, F, 1.65, 0, 0.1, pick(C.fish, rng), 1, rng);
    basketOf(B, F, -1.7, 0, -0.3, i === 2 ? C.oyster : pick(C.fish, rng), 0.9, rng);
  });

  // canaleta de drenagem (travertino) atrás das mesas, até ralos nas pontas
  bd.push(0, 0, 13.4, 0);
  for (const s of [-1, 1]) {
    const x0 = s * 2.6;
    const x1 = s * 21.0;
    const cx = (x0 + x1) / 2;
    const L = Math.abs(x1 - x0);
    for (const e of [-1, 1]) bd.box(L, 0.07, 0.12, cx, 0.0, e * 0.17, { mat: 'travertine', collide: false });
    bd.box(L, 0.02, 0.22, cx, 0.02, 0, { mat: 'water', collide: false });
    bd.box(0.5, 0.03, 0.5, s * 21.3, 0.03, 0, { mat: 'iron', collide: false }); // ralo
  }
  bd.pop();
  // cochos de água (tanques de pedra) nas pontas da fila do peixe
  for (const s of [-1, 1]) {
    bd.push(s * 21.6, 0, 10.6, Math.PI / 2);
    bd.add(propGeometry('basin'), { mat: 'travertine' });
    bd.box(2.0, 0.04, 1.0, 0, 0.52, 0, { mat: 'water', collide: false });
    bd.colliderBox(2.4, 0.7, 1.4, 0, 0, 0);
    bd.pop();
  }
}

/* ---------------- frutas e verduras ---------------- */
const GREEN_GOODS = [
  ['cherry', 'cherry', 'fig', 'figDry', 'fig'], // fruteiro: cerejas (novidade de Lúculo) e figos
  ['appleR', 'appleY', 'pear', 'quince', 'pomegranate'],
  ['plum', 'fig', 'appleR', 'cherry', 'pear'],
  ['herbs', 'mallow', 'beet', 'herbs', 'mallow'], // verdureiro: couves, alho-poró, ervas, malva, beterraba
  ['mushroom', 'helvella', 'mushroom', 'herbs', 'helvella'], // cogumelos e helvellae (Cíc. Fam. 7.26.2)
  ['chickpea', 'spelt', 'chickpea', 'spelt', 'chickpea'], // grão-de-bico e espelta
];

function greenStalls(bd, B, rng) {
  STALLS.green.forEach((st, i) => {
    const F = FB.child(st.x, st.z, st.rot);
    bd.push(st.x, 0, st.z, st.rot);
    stall(bd, 0, 0, 0, 0, { w: 2.6, d: 1.0, awningMat: 'cloth', awningColor: pick(C.linen, rng) });
    bd.pop();
    const goods = GREEN_GOODS[i];
    if (i === 3) {
      // couves e maços de alho-poró sobre a banca
      bd.push(st.x, 0, st.z, st.rot);
      for (let k = 0; k < 6; k++) bd.add(GD.cabbageGeometry(), { mat: 'flat', color: k % 2 ? '#6f9a48' : '#86a85a', matrix: new THREE.Matrix4().makeTranslation(-1.0 + (k % 3) * 0.24, 0.9, -0.15 + Math.floor(k / 3) * 0.24) });
      for (let k = 0; k < 3; k++) bd.add(GD.leekGeometry(), { mat: 'flat', matrix: new THREE.Matrix4().makeTranslation(0.0 + k * 0.05, 0.9 + k * 0.03, 0.1 - k * 0.1).multiply(new THREE.Matrix4().makeRotationY(0.2 * k)) });
      bd.pop();
      for (let k = 0; k < 3; k++) basketOf(B, F, 0.55 + k * 0.42, 0.9, 0.0, C[goods[k + 1]], 0.75, rng);
    } else {
      for (let k = 0; k < 5; k++) basketOf(B, F, -1.0 + k * 0.5, 0.9, (k % 2) * 0.12 - 0.06, C[goods[k]], 0.8, rng);
    }
    // mais cestos e sacos no chão diante da banca
    if (i === 5) {
      bd.push(st.x, 0, st.z, st.rot);
      for (let k = 0; k < 3; k++) {
        bd.add(GD.grainSackGeometry(), { mat: 'cloth', color: '#cdb68e', matrix: new THREE.Matrix4().makeTranslation(-0.9 + k * 0.9, 0, 1.0) });
      }
      bd.pop();
      for (let k = 0; k < 3; k++) put(B.heap, F, -0.9 + k * 0.9, 0.42, 1.0, rng() * 6, 0.8, jitter(C[k % 2 ? 'spelt' : 'chickpea'], rng));
    } else {
      basketOf(B, F, -0.8, 0, 1.0, C[goods[0]], 1, rng);
      basketOf(B, F, 0.75, 0, 1.05, C[goods[2]], 1, rng);
    }
  });
}

/* ---------------- pão, queijo, azeite, flores (oeste do tholos) ---------------- */
function westStalls(bd, B, rng) {
  // pão (pistores: padarias comerciais desde c. 171–168 a.C. — Plín. 18.107)
  let st = STALLS.bread;
  let F = FB.child(st.x, st.z, st.rot);
  bd.push(st.x, 0, st.z, st.rot);
  stall(bd, 0, 0, 0, 0, { w: 2.6, d: 1.0, awningMat: 'cloth', awningColor: pick(C.linen, rng) });
  bd.pop();
  for (let k = 0; k < 14; k++) put(B.loaf, F, -1.05 + (k % 7) * 0.33, 0.9 + Math.floor(k / 7) * 0.0, -0.18 + Math.floor(k / 7) * 0.34, rng() * 6, 1, pick(C.bread, rng));
  basketOf(B, F, -0.6, 0, 1.0, C.bread[0], 1, rng);
  basketOf(B, F, 0.6, 0, 1.0, C.bread[2], 1, rng);

  // queijos (entre eles o defumado de cabra feito em Roma — Plín. 11.240–241, texto imperial)
  st = STALLS.cheese;
  F = FB.child(st.x, st.z, st.rot);
  bd.push(st.x, 0, st.z, st.rot);
  stall(bd, 0, 0, 0, 0, { w: 2.6, d: 1.0, awningMat: 'cloth', awningColor: pick(C.linen, rng) });
  for (let k = 0; k < 9; k++) {
    const stack = k % 3;
    bd.add(GD.cheeseGeometry(), { mat: 'flat', color: pick(C.cheese, rng), matrix: new THREE.Matrix4().makeTranslation(-0.9 + Math.floor(k / 3) * 0.6, 0.9 + stack * 0.11, -0.05) });
  }
  bd.add(GD.cheeseGeometry(), { mat: 'flat', color: '#8a6a3a', matrix: new THREE.Matrix4().makeTranslation(0.95, 0.9, 0.1) }); // defumado
  bd.pop();

  // azeite (olearii): ânforas e jarros
  st = STALLS.oil;
  F = FB.child(st.x, st.z, st.rot);
  bd.push(st.x, 0, st.z, st.rot);
  bd.box(1.8, 0.06, 0.8, 0, 0.78, 0, { mat: 'wood', collide: false });
  for (const s of [-1, 1]) bd.box(0.06, 0.78, 0.7, s * 0.8, 0, 0, { mat: 'woodDark', collide: false });
  bd.colliderBox(1.8, 0.84, 0.8, 0, 0, 0);
  bd.pop();
  for (let k = 0; k < 5; k++) put(B.jar, F, -0.7 + k * 0.35, 0.84, 0, rng() * 6, 1.1);
  for (let k = 0; k < 4; k++) put(B.amphoraLean, F, -0.9 + k * 0.6, 0, -0.75, Math.PI / 2 + (rng() - 0.5) * 0.3, 1);
  bd.push(st.x, 0, st.z, st.rot);
  bd.add(GD.libraGeometry(), { mat: 'bronze', matrix: new THREE.Matrix4().makeTranslation(0.65, 0.84, 0.15) });
  bd.pop();

  // flores: rosas (de Preneste e da Campânia — Plín. 21.16)
  st = STALLS.flowers;
  F = FB.child(st.x, st.z, st.rot);
  bd.push(st.x, 0, st.z, st.rot);
  bd.box(1.6, 0.06, 0.7, 0, 0.7, 0, { mat: 'woodLight', collide: false });
  for (const s of [-1, 1]) bd.box(0.06, 0.7, 0.6, s * 0.7, 0, 0, { mat: 'woodDark', collide: false });
  bd.colliderBox(1.6, 0.76, 0.7, 0, 0, 0);
  bd.pop();
  for (let k = 0; k < 3; k++) basketOf(B, F, -0.5 + k * 0.5, 0.76, 0, C.rose, 0.75, rng);
  basketOf(B, F, -0.6, 0, 0.75, C.rose, 1, rng);
  basketOf(B, F, 0.5, 0, 0.8, C.herbs, 1, rng);
}

/* ---------------- aves (fartores, aucupes) ---------------- */
function birds(bd, B, rng) {
  const pen = (p, kind) => {
    const h = 0.62;
    const w = p.x1 - p.x0;
    const d = p.z1 - p.z0;
    const cx = (p.x0 + p.x1) / 2;
    const cz = (p.z0 + p.z1) / 2;
    // cercas de vime (taipa leve) — com colisão
    bd.box(w, h, 0.07, cx, 0, p.z0, { mat: 'woodLight', color: '#b59a70' });
    bd.box(w, h, 0.07, cx, 0, p.z1, { mat: 'woodLight', color: '#b59a70' });
    bd.box(0.07, h, d, p.x0, 0, cz, { mat: 'woodLight', color: '#b59a70' });
    bd.box(0.07, h, d, p.x1, 0, cz, { mat: 'woodLight', color: '#b59a70' });
    for (let k = 0; k <= Math.round(w / 1.0); k++) for (const z of [p.z0, p.z1]) bd.box(0.06, h + 0.12, 0.06, p.x0 + (k * w) / Math.round(w / 1.0), 0, z, { mat: 'woodDark', collide: false });
    // palha no chão
    bd.box(w - 0.1, 0.02, d - 0.1, cx, 0.04, cz, { mat: 'woodLight', color: '#c8b27a', collide: false });
    const n = kind === 'hen' ? 11 : 7;
    for (let k = 0; k < n; k++) {
      const x = p.x0 + 0.4 + rng() * (w - 0.8);
      const z = p.z0 + 0.4 + rng() * (d - 0.8);
      const s = kind === 'hen' ? GD.BIRD_SCALES.hen : GD.BIRD_SCALES.goose;
      put(B.bird, FB, x, 0.06, z, rng() * 6.28, s * (0.9 + rng() * 0.2), pick(kind === 'hen' ? C.hen : C.goose, rng));
    }
    // cocho de água
    bd.box(0.9, 0.16, 0.3, p.x1 - 0.7, 0.04, cz, { mat: 'woodDark', collide: false });
  };
  pen(STALLS.henPen, 'hen');
  pen(STALLS.goosePen, 'goose');

  // banca de gaiolas com tordos engordados (Cornélio Nepos via Plín. 10.60)
  const st = STALLS.cages;
  const F = FB.child(st.x, st.z, st.rot);
  bd.push(st.x, 0, st.z, st.rot);
  bd.box(2.2, 0.06, 0.9, 0, 0.72, 0, { mat: 'wood', collide: false });
  for (const s of [-1, 1]) bd.box(0.07, 0.72, 0.8, s * 1.0, 0, 0, { mat: 'woodDark', collide: false });
  bd.colliderBox(2.2, 0.78, 0.9, 0, 0, 0);
  const cagePos = [[-0.65, 0.78], [0.0, 0.78], [0.65, 0.78], [-0.33, 1.23], [0.33, 1.23]];
  for (const [x, y] of cagePos) bd.add(GD.cageGeometry(), { mat: 'woodLight', matrix: new THREE.Matrix4().makeTranslation(x, y, 0) });
  awning(bd, 2.5, 1.8, 2.2, 2.5, pick(C.linen, rng));
  prop(bd, 'stool', 0.3, 0, -0.85);
  bd.pop();
  for (const [x, y] of cagePos) for (let k = 0; k < 3; k++) put(B.bird, F, x - 0.18 + k * 0.18, y + 0.04, (rng() - 0.5) * 0.15, rng() * 6.28, 1, pick(C.thrush, rng));

  // pavão (luxo: o primeiro a servi-lo foi Hortênsio — Plín. 10.45) preso a uma estaca
  const pk = STALLS.peacock;
  bd.push(pk.x, 0, pk.z, -2.4);
  bd.add(GD.peacockGeometry(), { mat: 'flat' });
  bd.box(0.08, 0.7, 0.08, -0.9, 0, 0.4, { mat: 'woodDark', collide: false });
  bd.colliderBox(1.4, 0.9, 0.5, -0.3, 0, 0);
  bd.pop();
}

/* ---------------- cozinheiros de aluguel (Forum Coquinum) ---------------- */
function cooks(bd, B, rng) {
  const p = STALLS.cooks;
  bd.push(p.x, M.FLOOR, p.z, 0);
  prop(bd, 'brazier', -0.9, 0, 0.1);
  bd.add(GD.potGeometry(), { mat: 'bronze', matrix: new THREE.Matrix4().makeTranslation(-0.9, 0.7, 0.1) });
  bd.add(GD.potGeometry(), { mat: 'bronze', matrix: new THREE.Matrix4().makeTranslation(0.2, 0, 0.35).multiply(new THREE.Matrix4().makeScale(0.8, 0.8, 0.8)) });
  bd.add(GD.potGeometry(), { mat: 'bronze', matrix: new THREE.Matrix4().makeTranslation(0.55, 0, 0.4).multiply(new THREE.Matrix4().makeScale(0.65, 0.65, 0.65)) });
  prop(bd, 'table', 1.5, 0, -0.1, 0, 0.85);
  prop(bd, 'basket', 1.3, 0.63, -0.1, 0, 0.8);
  bd.box(0.32, 0.03, 0.05, 1.75, 0.66, -0.05, { mat: 'iron', collide: false }); // facas
  bd.box(0.28, 0.03, 0.05, 1.8, 0.66, -0.2, { mat: 'iron', collide: false });
  bd.colliderBox(1.25, 0.65, 0.7, 1.5, 0, -0.1);
  bd.colliderBox(0.75, 0.75, 0.75, -0.9, 0, 0.1);
  prop(bd, 'stool', -1.8, 0, -0.2);
  prop(bd, 'bench', 3.3, 0, -0.35, 0);
  bd.pop();
  void B;
  void rng;
}

/* ======================================================================= */
/*  Conteúdo das lojas (tabernae)                                            */
/* ======================================================================= */

/** Função de cada ala (HIPÓTESE de setorização). */
export const WING_TRADE = { S: 'fish', E: 'meat', N: 'delicacies', W: 'bakery' };

/**
 * Preenche as lojas abertas de cada ala.
 * @param bd builder de detalhes (no quadro do edifício)
 */
export function buildShopContents(ctx, bd, B, shops, closed, rng) {
  for (const wing of WINGS) {
    const list = shops[wing.id];
    const trade = WING_TRADE[wing.id];
    bd.push(wing.pos[0], 0, wing.pos[1], wing.rot);
    list.forEach((s, i) => {
      if (closed[wing.id]?.has(i)) return;
      const F = wing.frame;
      const y = M.FLOOR;
      const innerW = s.inner ?? s.w - M.FRONT_T;
      const cnt = s.counter;
      if (trade === 'fish') {
        if (cnt) for (let k = 0; k < 5; k++) put(B.fish, F, cnt.x - cnt.w / 2 + 0.2 + k * ((cnt.w - 0.4) / 4), cnt.top, cnt.d + (k % 2 ? 0.1 : -0.12), 1.57 + (rng() - 0.5) * 0.6, 0.85 + rng() * 0.3, pick(C.fish, rng));
        // salgas: ânforas (garum, salsamentum) e peixe seco pendurado
        for (let k = 0; k < 2; k++) put(B.amphoraLean, F, s.cx - innerW / 2 + 0.45 + k * 0.5, y, 0.85, -Math.PI / 2, 1);
        rail(bd, s.cx, innerW, 2.0, 2.5);
        for (let k = 0; k < 2; k++) bd.add(GD.driedFishGeometry(), { mat: 'flat', matrix: new THREE.Matrix4().makeTranslation(s.cx - 0.5 + k * 1.0, 2.5 - 0.36, 2.0) });
        basketOf(B, F, s.cx + (cnt && cnt.x > s.cx ? -0.8 : 0.8), y, 3.9, pick(C.fish, rng), 1, rng);
        if (i % 3 === 0) bd.add(GD.stateraGeometry(), { mat: 'bronze', matrix: new THREE.Matrix4().makeTranslation(s.cx + 0.4, M.FLOOR + M.DOOR_H - 0.95, M.SHOP_IN - 0.15) });
      } else if (trade === 'meat') {
        // trilho com ganchos: pernis e meias carcaças; cepo com cutelo; statera
        rail(bd, s.cx, innerW, 4.1, 2.55);
        const n = 4;
        for (let k = 0; k < n; k++) {
          const x = s.cx - innerW / 2 + 0.55 + (k * (innerW - 1.1)) / (n - 1);
          if (k === 1) bd.add(GD.carcassGeometry(), { mat: 'flat', color: pick(C.meat, rng), matrix: new THREE.Matrix4().makeTranslation(x, 2.55 - 1.32, 4.1) });
          else put(B.meat, F, x, 2.55 - 0.82, 4.1, rng() * 6.28, 1 + rng() * 0.25, pick(C.meat, rng));
        }
        bd.add(GD.blockGeometry(), { mat: 'flat', matrix: new THREE.Matrix4().makeTranslation(s.cx + (cnt && cnt.x > s.cx ? -0.6 : 0.6), y, 2.6) });
        if (cnt) for (let k = 0; k < 2; k++) put(B.meat, F, cnt.x - 0.3 + k * 0.55, cnt.top + 0.08, cnt.d, 1.57, [1, 0.45, 1], pick(C.meat, rng));
        bd.add(GD.stateraGeometry(), { mat: 'bronze', matrix: new THREE.Matrix4().makeTranslation(s.cx - 0.2, M.FLOOR + M.DOOR_H - 0.9, M.SHOP_IN - 0.15) });
      } else if (trade === 'delicacies') {
        const kind = i % 4; // 0 vinho, 1 garum/azeite, 2 queijos/mel, 3 perfumes e especiarias
        // prateleiras nas paredes laterais
        shelves(bd, s.cx, innerW);
        if (kind === 0 || kind === 1) {
          // ânforas encostadas na parede do fundo (Falerno; cadi de Quios — Plín. 14.97)
          for (let k = 0; k < 6; k++) put(B.amphoraLean, F, s.cx - innerW / 2 + 0.4 + k * ((innerW - 0.8) / 5), y, 0.85, -Math.PI / 2 + (rng() - 0.5) * 0.2, 0.95 + rng() * 0.1);
          for (let k = 0; k < 2; k++) bd.add(GD.cadusGeometry(), { mat: 'terracotta', color: '#c98a5e', matrix: new THREE.Matrix4().makeTranslation(s.cx - 0.5 + k * 0.6, y, 2.4) });
          prop(bd, 'dolium', s.cx + innerW / 2 - 0.75, y, 1.6, 0, 0.9);
        } else if (kind === 2) {
          for (let k = 0; k < 6; k++) bd.add(GD.cheeseGeometry(), { mat: 'flat', color: pick(C.cheese, rng), matrix: new THREE.Matrix4().makeTranslation(s.cx - 0.6 + (k % 3) * 0.4, y, 1.2 + Math.floor(k / 3) * 0.5) });
          prop(bd, 'dolium', s.cx + innerW / 2 - 0.75, y, 1.4, 0, 0.8);
        } else {
          if (cnt) bd.add(GD.libraGeometry(), { mat: 'bronze', matrix: new THREE.Matrix4().makeTranslation(cnt.x, cnt.top, cnt.d) });
          prop(bd, 'chest', s.cx, y, 1.2);
        }
        // jarros nas prateleiras (mel, garum, conservas) e frascos de perfume (unguentarii)
        for (const side of [-1, 1]) {
          for (let k = 0; k < 4; k++) {
            const sx = s.cx + side * (innerW / 2 - 0.22);
            const dz = 1.3 + k * 0.75;
            if (kind === 3) for (let m = 0; m < 2; m++) put(B.flask, F, sx, 1.3 + m * 0.6 + 0.04, dz + (m - 0.5) * 0.2, rng() * 6, 1);
            else put(B.jar, F, sx, 1.3 + (k % 2) * 0.6 + 0.04, dz, rng() * 6, 0.85);
          }
        }
        if (cnt && kind !== 3) for (let k = 0; k < 3; k++) put(B.jar, F, cnt.x - 0.4 + k * 0.4, cnt.top, cnt.d, rng() * 6, 0.8);
      } else if (trade === 'bakery') {
        // pão no balcão e em cestos; salsichas penduradas (fartores) em algumas
        if (cnt) for (let k = 0; k < 6; k++) put(B.loaf, F, cnt.x - cnt.w / 2 + 0.2 + (k % 3) * ((cnt.w - 0.4) / 2), cnt.top, cnt.d - 0.12 + Math.floor(k / 3) * 0.24, rng() * 6, 0.95, pick(C.bread, rng));
        basketOf(B, F, s.cx - 0.6, y, 2.4, C.bread[1], 1, rng);
        basketOf(B, F, s.cx + 0.5, y, 1.6, C.bread[0], 1, rng);
        prop(bd, 'table', s.cx, y, 1.3, 0, 0.9);
        for (let k = 0; k < 4; k++) put(B.loaf, F, s.cx - 0.45 + k * 0.3, y + 0.67, 1.3, rng() * 6, 1, pick(C.bread, rng));
        if (i % 2 === 1) {
          rail(bd, s.cx, innerW, 4.2, 2.5);
          for (let k = 0; k < 3; k++) bd.add(GD.sausageGeometry(), { mat: 'flat', matrix: new THREE.Matrix4().makeTranslation(s.cx - 0.7 + k * 0.7, 2.5 - 0.64, 4.2) });
        }
      }
    });
    bd.pop();
  }
}

/** Trilho de madeira atravessando a loja (de divisória a divisória) a uma profundidade d. */
function rail(bd, cx, w, d, y) {
  bd.box(w, 0.1, 0.1, cx, y, d, { mat: 'woodDark', collide: false });
}

/** Prateleiras de tábuas nas paredes laterais da loja. */
function shelves(bd, cx, w) {
  for (const side of [-1, 1]) {
    const x = cx + side * (w / 2 - 0.2);
    for (const y of [1.3, 1.9]) bd.box(0.38, 0.04, 3.4, x, y, 2.85, { mat: 'wood', collide: false });
    for (const z of [1.2, 4.5]) bd.box(0.04, 1.9, 0.04, x + side * -0.17, M.FLOOR, z, { mat: 'woodDark', collide: false });
  }
}

/* ======================================================================= */
/*  Exterior: edital, mula, ânforas de entrega                               */
/* ======================================================================= */
export function buildExterior(ctx, bd, B, rng) {
  // album (tábua caiada) com o edito dos edis, ao lado do portão sul (por fora)
  const S = WINGS.find((w) => w.id === 'S');
  bd.push(S.pos[0], 0, S.pos[1], S.rot);
  for (const side of [-1]) {
    const x = side * 5.3;
    bd.box(1.9, 1.25, 0.06, x, 1.25, -0.04, { mat: 'woodDark', collide: false });
    bd.box(1.75, 1.1, 0.02, x, 1.325, -0.08, { mat: 'flat', color: '#efebe0', collide: false });
    for (let r = 0; r < 7; r++) {
      const L = r === 0 ? 1.0 : 1.2 + ((r * 37) % 5) * 0.06;
      bd.box(L, r === 0 ? 0.07 : 0.035, 0.005, x - (r === 0 ? 0 : 0.1), 2.25 - r * 0.13, -0.092, { mat: 'flat', color: r === 0 ? '#7a2a1c' : '#2a2420', collide: false });
    }
  }
  bd.pop();

  // mula do verdureiro com cestos (Hor. Ep. 1.18.36), amarrada junto ao portão oeste, na rua
  const Wg = WINGS.find((w) => w.id === 'W');
  const mp = FB.toWorld(-M.OX - 3.4, 2.0);
  const my = ctx.terrain.heightAt(mp.x, mp.z) - Y0;
  bd.push(-M.OX - 3.4, my, 2.0, 0);
  bd.add(GD.muleGeometry(), { mat: 'flat' });
  bd.colliderBox(1.8, 1.4, 1.1, 0, 0, 0);
  bd.pop();
  // ânforas de entrega encostadas no muro externo, dos dois lados do portão oeste (dentro do lote)
  const Fw = Wg.frame;
  for (let k = 0; k < 5; k++) put(B.amphoraLean, Fw, -4.2 - k * 0.55, 0, -0.32, Math.PI / 2, 1);
  for (let k = 0; k < 3; k++) put(B.amphoraLean, Fw, 4.2 + k * 0.55, 0, -0.32, Math.PI / 2 + (rng() - 0.5) * 0.2, 1);
}
