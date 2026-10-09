/**
 * Colina Capitolina — constantes de implantação e utilidades geométricas do sítio.
 *
 * TODAS as posições estão no sistema do mundo (x = leste, z = sul, m; y = 0 no Fórum).
 * Origem dos números (docs/pesquisa/05-capitolio.md, salvo indicação):
 *   - cotas dos cumes: Capitolium 44,5 m e Arx 45,5 m s.n.m., sela 36,5 m (data/topography.js,
 *     a partir de Platner via notas 01/10) → y = 31,5 / 32,5 / 23,5;
 *   - Templo de Júpiter: centro HIPOTÉTICO entre a hipótese da nota 05 §2 (−235; +38) e o ponto
 *     do Pleiades (−276; +31); fachada para o sul (Dion. 4.61.4); pódio 53 × 62 m (DAR/Britannica);
 *   - Area Capitolina: ~35 m a leste do templo, ≤ 30 m a oeste, 40–45 m na frente (Platner via 01);
 *   - borda da Rocha Tarpeia: traçado OSM (−250; 119) → (−202; 99) (Pleiades 928849659, nota 10 §2);
 *   - Juno Moneta: (−150,5; −161,1) (Pleiades 76518529).
 */
import * as THREE from 'three';
import * as G from '../../render/geom.js';
import * as T from '../../render/textures.js';
import { fbm, valueNoise, worley, mulberry32 } from '../../render/noise.js';
import { materials } from '../../render/materials.js';
import { forumUV } from '../../data/layout.js';

/* ------------------------------------------------------------------------- */
/*  Cotas e posições                                                         */
/* ------------------------------------------------------------------------- */

/** Piso da Area Capitolina (cume sul nivelado artificialmente — Dion. 3.69.1). */
export const Y_AREA = 31.5;
/** Piso do recinto da Arx (cume norte). */
export const Y_ARX = 32.5;
/** Fundo da sela (Asylum) — o solo atual está ~8 m acima do antigo (nota 05 §1). */
export const Y_ASYLUM = 22.5;

/** Centro do pódio do Templo de Júpiter (fachada para o sul). */
export const TEMPLE = { x: -250, z: 36 };
export const TEMPLE_W = 53; // largura (E–O) do pódio
export const TEMPLE_L = 62; // comprimento (N–S) do pódio
export const TEMPLE_PODIUM = 4.0; // altura hipotética (propostas de 3,6 a 4,85 m)

/**
 * Plataforma da Area Capitolina (polígono do topo, sentido horário no mapa).
 * Arestas: 0 norte (muro), 1 leste (muro), 2–4 sul (penhasco natural), 5 oeste (muro).
 */
export const AREA_POLY = [
  [-306, -8],
  [-188, -8],
  [-188, 93],
  [-202, 100],
  [-250, 119],
  [-306, 112],
];
/** Arestas da plataforma que são paredões de rocha (penhasco), não muros. */
export const AREA_CLIFF_EDGES = [2, 3, 4];

/** Recinto da Arx (topo nivelado com Juno Moneta). */
export const ARX_POLY = [
  [-184, -200],
  [-128, -207],
  [-110, -172],
  [-113, -148],
  [-128, -132],
  [-168, -127],
  [-188, -150],
];
/** Templo de Juno Moneta: centro (Pleiades) e rumo hipotético da fachada (SE). */
export const MONETA = { x: -150.5, z: -161.1, bearing: 135 };

/** Recinto do Asylum (sela "entre os dois bosques"). */
export const ASYLUM = { x: -212, z: -55, w: 28, d: 20 };

/**
 * Faixa deixada LIVRE (sem pads nem edifícios) atrás do Tabularium, onde a nota 01 §4
 * propõe o Templo de Véiove (construído pelo sítio forum-oeste).
 */
export const VEIOVIS_FREE = { x0: -186, x1: -128, z0: -62, z1: 0 };

/** Início da escadaria de Moneta na borda da área (lado do Carcer / forum-oeste). */
export const GRADUS_START = { x: -97.8, z: -90.6 };
/** Chegada da escadaria de Moneta no recinto da Arx (portão SE). */
export const GRADUS_END = { x: -120.5, z: -140 };

/** Vicus Iugarius no sopé sul (traçado hipotético dentro da área do sítio). */
export const VICUS_IUGARIUS = [
  [-163.5, 128],
  [-190, 140],
  [-230, 150],
  [-262, 158],
  [-290, 168.5],
];
/** Continuação do Vicus Iugarius no sítio 'arredores' (nó de NPC dele, rumo à Porta Carmental). */
export const VICUS_IUGARIUS_JOIN_W = [-288, 189];

/**
 * Junção com o trecho inferior do Clivus Capitolinus construído pelo sítio forum-oeste
 * (src/sites/forumWest/plan.js, ponto K6: u = −160, v = −56,5, y = 15,5 — "altura da galeria
 * do Tabularium"). Calculado aqui pelo referencial do Fórum para não depender do outro sítio.
 */
export const CLIVUS_JOIN = { ...forumUV(-160, -56.5), y: 15.5 };

/**
 * Patamar diante do portão leste da Area (chegada do clivo; Arco de Cipião). Plataforma
 * construída (piso com colisão + muros de arrimo), no nível da Area. Forma HIPOTÉTICA.
 */
export const FORECOURT_POLY = [
  [-185.8, 67],
  [-166, 67],
  [-166, 96],
  [-185.8, 96],
];

/** Escada do caminho Asylum → Arx (chega ao muro sul do recinto da Arx). HIPOTÉTICA. */
export const ARX_STAIR = { x: -150, z0: -117, z1: -127.6 };

/** Centum Gradus (Tác. Hist. 3.71): dois lances ao longo do paredão sul, do sopé à Area. HIPOTÉTICO. */
export const CENTUM = { edge: 4, offset: 4.0, t0: 13.4, t1: 29.9, t2: 32.1, t3: 48.6, width: 2.4, steps: 100 };

/* ------------------------------------------------------------------------- */
/*  Utilidades matemáticas                                                   */
/* ------------------------------------------------------------------------- */

export const DEG = Math.PI / 180;
export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);

/** Normal (unitária) de uma aresta A→B que aponta para o lado de `hint` (vetor). */
export function edgeNormal(a, b, hint) {
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  const l = Math.hypot(dx, dz) || 1;
  let nx = dz / l;
  let nz = -dx / l;
  if (nx * hint[0] + nz * hint[1] < 0) {
    nx = -nx;
    nz = -nz;
  }
  return [nx, nz];
}

/** Normal externa de uma aresta de polígono (aponta para fora do polígono). */
export function outwardNormal(poly, i) {
  const a = poly[i];
  const b = poly[(i + 1) % poly.length];
  const cx = poly.reduce((s, p) => s + p[0], 0) / poly.length;
  const cz = poly.reduce((s, p) => s + p[1], 0) / poly.length;
  const mx = (a[0] + b[0]) / 2;
  const mz = (a[1] + b[1]) / 2;
  return edgeNormal(a, b, [mx - cx, mz - cz]);
}

/** Polígono deslocado (cada aresta afastada `d` m para fora; d < 0 encolhe). Simples, p/ convexos. */
export function offsetPoly(poly, d) {
  const n = poly.length;
  const lines = [];
  for (let i = 0; i < n; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % n];
    const [nx, nz] = outwardNormal(poly, i);
    lines.push({ p: [a[0] + nx * d, a[1] + nz * d], q: [b[0] + nx * d, b[1] + nz * d] });
  }
  const out = [];
  for (let i = 0; i < n; i++) {
    const L1 = lines[(i - 1 + n) % n];
    const L2 = lines[i];
    out.push(intersect(L1.p, L1.q, L2.p, L2.q) || L2.p);
  }
  return out;
}

function intersect(p1, p2, p3, p4) {
  const d = (p1[0] - p2[0]) * (p3[1] - p4[1]) - (p1[1] - p2[1]) * (p3[0] - p4[0]);
  if (Math.abs(d) < 1e-9) return null;
  const t = ((p1[0] - p3[0]) * (p3[1] - p4[1]) - (p1[1] - p3[1]) * (p3[0] - p4[0])) / d;
  return [p1[0] + t * (p2[0] - p1[0]), p1[1] + t * (p2[1] - p1[1])];
}

/** Ponto dentro de polígono. */
export function inPoly(x, z, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i];
    const [xj, zj] = poly[j];
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}

/** Comprimento acumulado de uma polilinha [[x,z],...]. */
export function polylineLength(pts) {
  let L = 0;
  for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return L;
}

/** Reamostra uma polilinha a cada `step` m. Devolve [{x, z, s, dx, dz}] (dx,dz = tangente). */
export function resample(pts, step) {
  const out = [];
  let acc = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, z0] = pts[i];
    const [x1, z1] = pts[i + 1];
    const L = Math.hypot(x1 - x0, z1 - z0);
    const n = Math.max(1, Math.ceil(L / step));
    for (let k = 0; k < n; k++) {
      const t = k / n;
      out.push({ x: x0 + (x1 - x0) * t, z: z0 + (z1 - z0) * t, s: acc + L * t, dx: (x1 - x0) / L, dz: (z1 - z0) / L });
    }
    acc += L;
  }
  const a = pts[pts.length - 2];
  const b = pts[pts.length - 1];
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  out.push({ x: b[0], z: b[1], s: acc, dx: (b[0] - a[0]) / L, dz: (b[1] - a[1]) / L });
  return out;
}

/** Rumo de bússola (graus) de (x0,z0) para (x1,z1). */
export function bearingOf(x0, z0, x1, z1) {
  let d = Math.atan2(x1 - x0, -(z1 - z0)) / DEG;
  if (d < 0) d += 360;
  return d;
}

/** "yaw" de NPC parado (0 = olhando para +Z/sul) a partir de um rumo de bússola. */
export function yawFromBearing(bearing) {
  return Math.PI - bearing * DEG;
}

/* ------------------------------------------------------------------------- */
/*  Geometrias auxiliares                                                    */
/* ------------------------------------------------------------------------- */

/**
 * Sólido "parede inclinada" entre dois pontos A e B do plano (no quadro atual do builder):
 * espessura t centrada na linha AB, topo de yTopA → yTopB e base de yBotA → yBotB.
 * Útil para muros que acompanham rampas, parapeitos de escadas e vigas inclinadas.
 */
export function slopedWall(b, xa, za, xb, zb, yTopA, yTopB, yBotA, yBotB, t, o = {}) {
  const dx = xb - xa;
  const dz = zb - za;
  const L = Math.hypot(dx, dz) || 1;
  const nx = (-dz / L) * (t / 2);
  const nz = (dx / L) * (t / 2);
  // 8 vértices: lado esquerdo (+n) e direito (−n)
  const A1 = [xa + nx, yBotA, za + nz];
  const A2 = [xa + nx, yTopA, za + nz];
  const B1 = [xb + nx, yBotB, zb + nz];
  const B2 = [xb + nx, yTopB, zb + nz];
  const C1 = [xa - nx, yBotA, za - nz];
  const C2 = [xa - nx, yTopA, za - nz];
  const D1 = [xb - nx, yBotB, zb - nz];
  const D2 = [xb - nx, yTopB, zb - nz];
  const parts = [];
  const q = (a, bb, c, d) => {
    const g = G.quad(a, bb, c, d);
    parts.push(g);
  };
  // lados longos (anti-horário visto de fora)
  q(B1, A1, A2, B2); // lado +n
  q(C1, D1, D2, C2); // lado −n
  q(A2, C2, D2, B2); // topo — verificado pela normal abaixo
  if (o.ends !== false) {
    q(A1, C1, C2, A2); // extremidade A
    q(D1, B1, B2, D2); // extremidade B
  }
  if (o.bottom) q(A1, B1, D1, C1);
  const geom = G.merge(parts.map((g) => fixOutward(g, [(xa + xb) / 2, (yTopA + yBotA + yTopB + yBotB) / 4, (za + zb) / 2])));
  b.add(geom, { mat: o.mat || 'tufa', color: o.color, collide: o.collide ?? true });
  return geom;
}

/** Garante que a normal de cada triângulo aponte para longe do centro `c` (sólidos convexos). */
function fixOutward(g, c) {
  const p = g.attributes.position.array;
  const nrm = g.attributes.normal.array;
  const uv = g.attributes.uv.array;
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const cc = new THREE.Vector3();
  const n = new THREE.Vector3();
  const m = new THREE.Vector3();
  for (let i = 0; i < p.length; i += 9) {
    a.set(p[i], p[i + 1], p[i + 2]);
    b.set(p[i + 3], p[i + 4], p[i + 5]);
    cc.set(p[i + 6], p[i + 7], p[i + 8]);
    n.subVectors(b, a).cross(new THREE.Vector3().subVectors(cc, a));
    m.copy(a).add(b).add(cc).multiplyScalar(1 / 3).sub(new THREE.Vector3(c[0], c[1], c[2]));
    if (n.dot(m) < 0) {
      for (let k = 0; k < 3; k++) {
        const tmp = p[i + 3 + k];
        p[i + 3 + k] = p[i + 6 + k];
        p[i + 6 + k] = tmp;
      }
      const j = (i / 9) * 6;
      for (let k = 0; k < 2; k++) {
        const tmp = uv[j + 2 + k];
        uv[j + 2 + k] = uv[j + 4 + k];
        uv[j + 4 + k] = tmp;
      }
      n.negate();
    }
    n.normalize();
    for (let k = 0; k < 3; k++) {
      nrm[i + k * 3] = n.x;
      nrm[i + k * 3 + 1] = n.y;
      nrm[i + k * 3 + 2] = n.z;
    }
  }
  return g;
}

/**
 * Faixa de pavimento que acompanha o terreno (ruas, caminhos). Não colide (o terreno já é o chão).
 * @param {object} o { width, step, lift, mat, heightFn(x,z) (padrão: terreno), color }
 */
export function drapedStrip(b, terrain, pts, o = {}) {
  const w = o.width ?? 4;
  const step = o.step ?? 2;
  const lift = o.lift ?? 0.07;
  const hf = o.heightFn || ((x, z) => terrain.heightAt(x, z));
  const S = resample(pts, step);
  const cols = 4; // 4 colunas de vértices na largura
  const pos = [];
  const uv = [];
  const rows = [];
  for (const s of S) {
    const nx = -s.dz;
    const nz = s.dx;
    const row = [];
    for (let c = 0; c < cols; c++) {
      const off = (c / (cols - 1) - 0.5) * w;
      const x = s.x + nx * off;
      const z = s.z + nz * off;
      row.push([x, hf(x, z) + lift, z, off, s.s]);
    }
    rows.push(row);
  }
  for (let r = 0; r < rows.length - 1; r++) {
    for (let c = 0; c < cols - 1; c++) {
      const A = rows[r][c];
      const B = rows[r][c + 1];
      const C = rows[r + 1][c + 1];
      const D = rows[r + 1][c];
      // dois triângulos (normal para cima garantida abaixo)
      for (const P of [A, C, B, A, D, C]) {
        pos.push(P[0], P[1], P[2]);
        uv.push(P[3], P[4]);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  upFacing(g);
  b.add(g, { mat: o.mat || 'dirt', color: o.color, collide: false });
}

/** Ajusta o sentido dos triângulos para a face visível apontar para cima e calcula normais. */
function upFacing(g) {
  const p = g.attributes.position.array;
  const uv = g.attributes.uv.array;
  for (let i = 0; i < p.length; i += 9) {
    const ax = p[i + 3] - p[i];
    const az = p[i + 5] - p[i + 2];
    const bx = p[i + 6] - p[i];
    const bz = p[i + 8] - p[i + 2];
    const ny = az * bx - ax * bz; // componente y de (B−A)×(C−A)
    if (ny < 0) {
      for (let k = 0; k < 3; k++) {
        const t = p[i + 3 + k];
        p[i + 3 + k] = p[i + 6 + k];
        p[i + 6 + k] = t;
      }
      const j = (i / 9) * 6;
      for (let k = 0; k < 2; k++) {
        const t = uv[j + 2 + k];
        uv[j + 2 + k] = uv[j + 4 + k];
        uv[j + 4 + k] = t;
      }
    }
  }
  g.computeVertexNormals();
}

/**
 * Paredão de rocha natural (tufo) ao longo de uma polilinha, do topo `yTop` até abaixo do
 * terreno, com relevo irregular voltado para o lado `hint` (vetor de direção para fora).
 * @param {object} o { yTop, bulge (m), step, seed, hint:[x,z], baseOffset }
 */
export function rockFace(b, terrain, pts, o = {}) {
  const yTop = o.yTop;
  const bulge = o.bulge ?? 2.2;
  const step = o.step ?? 2.2;
  const seed = o.seed ?? 7;
  const rows = o.rows ?? 9;
  const S = resample(pts, step);
  const grid = [];
  const hint = o.hint || [0, 1];
  for (const s of S) {
    let nx = -s.dz;
    let nz = s.dx;
    if (nx * hint[0] + nz * hint[1] < 0) {
      nx = -nx;
      nz = -nz;
    }
    const base = terrain.heightAt(s.x + nx * 5, s.z + nz * 5) - 2.5;
    const col = [];
    for (let r = 0; r <= rows; r++) {
      const v = r / rows; // 0 = topo
      const y = lerp(yTop, base, v);
      // relevo: estratos horizontais + blocos + ruído
      const n1 = fbm(((s.s * 0.013) % 1 + 1) % 1, (((y * 0.04) % 1) + 1) % 1, 4, 3, seed);
      const n2 = valueNoise(((s.s * 0.05) % 1 + 1) % 1, (((y * 0.11) % 1) + 1) % 1, 8, seed + 5);
      const strata = Math.sin(y * 1.7 + n1 * 3) * 0.25;
      let out = (n1 * 0.75 + n2 * 0.35 + strata) * bulge * Math.pow(v, 0.55);
      if (r === 0) out = 0.0;
      else out += 0.15;
      col.push([s.x + nx * out, y, s.z + nz * out, s.s, y]);
    }
    grid.push(col);
  }
  const pos = [];
  const uv = [];
  const col = [];
  const rng = mulberry32(seed);
  for (let i = 0; i < grid.length - 1; i++) {
    for (let r = 0; r < rows; r++) {
      const A = grid[i][r];
      const B = grid[i + 1][r];
      const C = grid[i + 1][r + 1];
      const D = grid[i][r + 1];
      for (const P of [A, D, C, A, C, B]) {
        pos.push(P[0], P[1], P[2]);
        uv.push(P[3] / 1.0, P[4] / 1.0);
      }
      const tone = 0.86 + rng() * 0.2;
      for (let k = 0; k < 6; k++) col.push(tone, tone * 0.98, tone * 0.93);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  // orienta para fora (lado `hint`)
  const nrm = g.attributes.normal.array;
  let dot = 0;
  for (let i = 0; i < nrm.length; i += 3) dot += nrm[i] * hint[0] + nrm[i + 2] * hint[1];
  if (dot < 0) {
    const p = g.attributes.position.array;
    for (let i = 0; i < p.length; i += 9) {
      for (let k = 0; k < 3; k++) {
        const t = p[i + 3 + k];
        p[i + 3 + k] = p[i + 6 + k];
        p[i + 6 + k] = t;
      }
    }
    g.computeVertexNormals();
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  b.add(g, { mat: 'dirt', collide: o.collide ?? true });
  return g;
}

/** Bloco de rocha irregular (afloramento) com base em y. */
export function boulder(b, x, y, z, r, seed = 1, o = {}) {
  const g = new THREE.IcosahedronGeometry(r, 1).toNonIndexed();
  const p = g.attributes.position;
  const rng = mulberry32(seed);
  const disp = new Map();
  for (let i = 0; i < p.count; i++) {
    const key = `${p.getX(i).toFixed(3)},${p.getY(i).toFixed(3)},${p.getZ(i).toFixed(3)}`;
    if (!disp.has(key)) disp.set(key, 0.7 + rng() * 0.55);
    const k = disp.get(key);
    p.setXYZ(i, p.getX(i) * k * (o.sx ?? 1.3), Math.max(-r * 0.3, p.getY(i) * k * (o.sy ?? 0.75)), p.getZ(i) * k);
  }
  g.computeVertexNormals();
  const uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    uv[i * 2] = p.getX(i) + p.getZ(i);
    uv[i * 2 + 1] = p.getY(i);
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  const m = new THREE.Matrix4().makeRotationY(rng() * 6.28);
  m.setPosition(x, y, z);
  b.add(g, { mat: 'dirt', matrix: m, collide: o.collide ?? 'box' });
}

/* ------------------------------------------------------------------------- */
/*  Escadas                                                                  */
/* ------------------------------------------------------------------------- */

/**
 * Lance de escada (quadro local atual): sobe de y0 a y1 ao longo de −Z a partir de z0,
 * com degraus maciços desde `baseY` (apoiados no chão). Colisão: rampa + caixa cheia sob ela.
 */
export function flight(b, w, depth, y0, y1, x, z0, o = {}) {
  const n = o.steps ?? Math.max(1, Math.round(Math.abs(y1 - y0) / 0.19));
  const baseY = o.baseY ?? y0;
  const sh = (y1 - y0) / n;
  const sd = depth / n;
  for (let i = 0; i < n; i++) {
    const top = y0 + sh * (i + 1);
    b.box(w, top - baseY, sd + 0.02, x, baseY, z0 - sd * (i + 0.5), { mat: o.mat || 'tufa', collide: false, color: o.color });
  }
  b.colliderRamp(w, x, z0 + 0.05, y0, z0 - depth, y1);
  if (y0 - baseY > 0.3) b.colliderBox(w, y0 - baseY, depth, x, baseY, z0 - depth / 2);
}

/* ------------------------------------------------------------------------- */
/*  Figuras (estátuas) — marcadores volumétricos mais detalhados               */
/* ------------------------------------------------------------------------- */

/**
 * Figura humana estilizada para estátuas (quadro local: frente → +Z, base em y=0, ~1,8 m).
 * @param {object} o { pose: 'stand'|'seated'|'nude', mat, faceMat, scale, helmet, spear,
 *   shield, scepter, club, lyre, armUp (braço direito erguido), globe (pés sobre globo) }
 * Devolve a lista de {geom, mat} para o chamador adicionar.
 */
export function figureParts(o = {}) {
  const mat = o.mat || 'bronze';
  const face = o.faceMat || mat;
  const out = [];
  const add = (g, m = mat) => out.push({ g, m });
  const seated = o.pose === 'seated';
  const nude = o.pose === 'nude';
  if (seated) {
    // trono com espaldar
    add(G.box(0.95, 0.5, 0.8).translate(0, 0, -0.05), o.throneMat || mat);
    add(G.box(0.95, 1.05, 0.12).translate(0, 0.5, -0.43), o.throneMat || mat);
    add(G.box(0.1, 0.35, 0.7).translate(-0.45, 0.5, -0.05), o.throneMat || mat);
    add(G.box(0.1, 0.35, 0.7).translate(0.45, 0.5, -0.05), o.throneMat || mat);
    // coxas e pernas cobertas pelo manto
    add(G.box(0.52, 0.24, 0.6).translate(0, 0.48, 0.18));
    add(G.lathe([[0.2, 0], [0.22, 0.25], [0.18, 0.5]], 10, { vByHeight: true }).scale(1.25, 1, 0.8).translate(0, 0, 0.43));
    // tronco
    add(G.lathe([[0.2, 0], [0.22, 0.2], [0.23, 0.42], [0.18, 0.55], [0.07, 0.62]], 12, { vByHeight: true }).scale(1.18, 1, 0.82).translate(0, 0.66, -0.08));
    // manto sobre o ombro esquerdo
    add(G.box(0.2, 0.62, 0.42).translate(-0.17, 0.66, -0.04).rotateZ(0.12));
    // cabeça
    add(G.cylinder(0.055, 0.055, 0.1, 8).translate(0, 1.26, -0.06), face);
    add(G.sphere(0.12, 10, 8).scale(0.95, 1.08, 1).translate(0, 1.33, -0.05), face);
    // braços: direito erguido (cetro), esquerdo apoiado
    add(G.cylinder(0.055, 0.05, 0.52, 7).rotateZ(Math.PI).rotateX(-0.25).translate(0.31, 1.18, -0.05));
    add(G.cylinder(0.055, 0.05, 0.5, 7).rotateZ(Math.PI).rotateX(-1.1).translate(-0.31, 1.18, -0.08));
    if (o.scepter !== false) add(G.cylinder(0.03, 0.03, 1.9, 6).translate(0.36, 0.05, 0.1), o.attrMat || mat);
    if (o.thunderbolt) add(G.cylinder(0.04, 0.04, 0.42, 6).rotateZ(Math.PI / 2).translate(0.21, 0.82, 0.38), o.attrMat || mat);
  } else {
    // pernas / veste
    if (nude) {
      for (const s of [-1, 1]) add(G.cylinder(0.075, 0.1, 0.92, 8).translate(s * 0.11, 0, s * 0.03));
      add(G.lathe([[0.17, 0.85], [0.2, 1.0], [0.21, 1.2], [0.24, 1.36], [0.18, 1.47], [0.06, 1.52]], 12, { vByHeight: true }).scale(1.15, 1, 0.75));
      add(G.box(0.18, 0.95, 0.12).translate(-0.24, 0.55, -0.02), mat); // pele/manto pendente
    } else {
      add(G.lathe([[0.27, 0], [0.26, 0.08], [0.22, 0.5], [0.2, 0.92], [0.2, 1.05], [0.22, 1.2], [0.24, 1.36], [0.18, 1.47], [0.06, 1.52]], 12, { vByHeight: true }).scale(1.12, 1, 0.8));
      // dobra diagonal do manto (sinus da toga / palla)
      add(G.box(0.5, 0.16, 0.36).rotateZ(-0.6).translate(0.02, 1.08, 0.06));
      add(G.box(0.2, 0.9, 0.14).translate(-0.22, 0.45, 0.1));
    }
    add(G.cylinder(0.055, 0.055, 0.1, 8).translate(0, 1.5, 0), face);
    add(G.sphere(0.12, 10, 8).scale(0.95, 1.08, 1).translate(0, 1.57, 0), face);
    // braço esquerdo junto ao corpo
    add(G.cylinder(0.055, 0.05, 0.62, 7).rotateZ(Math.PI).translate(-0.29, 1.44, 0.02));
    // braço direito: erguido ou à frente
    if (o.armUp) add(G.cylinder(0.055, 0.05, 0.6, 7).rotateX(0.35).translate(0.29, 1.42, 0.02));
    else add(G.cylinder(0.055, 0.05, 0.58, 7).rotateZ(Math.PI).rotateX(-0.7).translate(0.29, 1.44, 0.04));
    if (o.spear || o.scepter) add(G.cylinder(0.025, 0.025, 2.3, 6).translate(0.33, 0.02, 0.38), o.attrMat || mat);
    if (o.club) add(G.cylinder(0.04, 0.09, 0.95, 7).rotateZ(Math.PI).rotateX(-0.2).translate(0.33, 1.05, 0.22), o.attrMat || mat);
    if (o.lyre) add(G.box(0.34, 0.42, 0.06).translate(-0.33, 0.95, 0.18), o.attrMat || mat);
  }
  if (o.helmet) {
    const hy = seated ? 1.33 : 1.57;
    add(G.sphere(0.135, 10, 6).scale(1, 0.85, 1.05).translate(0, hy + 0.06, seated ? -0.05 : 0), o.attrMat || mat);
    add(G.box(0.05, 0.16, 0.34).translate(0, hy + 0.27, seated ? -0.05 : 0), o.attrMat || mat);
  }
  if (o.shield) add(G.cylinder(0.36, 0.36, 0.05, 14).rotateZ(Math.PI / 2).translate(-0.36, 0.42, 0.12), o.attrMat || mat);
  return out;
}

/**
 * Estátua sobre pedestal (quadro do builder): figura + base. rotY gira a frente (+Z local).
 * @param {object} o figureParts + { scale, pedestal: {w,h,d,mat}|false, rotY }
 */
export function statueFig(b, x, y, z, o = {}) {
  const s = o.scale ?? 1;
  b.push(x, y, z, o.rotY || 0);
  let top = 0;
  if (o.pedestal !== false) {
    const p = o.pedestal || {};
    const w = p.w ?? 0.9 * Math.max(1, s * 0.8);
    const h = p.h ?? 1.3;
    const d = p.d ?? w;
    b.box(w, h, d, 0, 0, 0, { mat: p.mat || 'marble', collide: true, color: p.color });
    b.box(w + 0.16, 0.14, d + 0.16, 0, 0, 0, { mat: p.mat || 'marble', collide: false, color: p.color });
    b.box(w + 0.12, 0.12, d + 0.12, 0, h - 0.12, 0, { mat: p.mat || 'marble', collide: false, color: p.color });
    top = h;
  }
  if (o.globe) {
    b.sphere(0.55 * s, 0, top, 0, { mat: o.globeMat || 'bronze', wSeg: 16, hSeg: 10 });
    top += 1.0 * s;
  }
  const m = new THREE.Matrix4().compose(new THREE.Vector3(0, top, 0), new THREE.Quaternion(), new THREE.Vector3(s, s, s));
  for (const { g, m: mat } of figureParts(o)) b.add(g, { mat, matrix: m, collide: false });
  b.pop();
  return top + 1.75 * s;
}

/** Geometria de um cavalo (quadro: frente → +Z, base em y=0, ~1,6 m na cernelha). */
export function horseGeom(o = {}) {
  const parts = [];
  const raise = o.rearing ? 0.35 : 0;
  parts.push(G.sphere(0.5, 12, 8).scale(0.8, 0.85, 1.55).translate(0, 0.95, 0)); // corpo
  parts.push(G.cylinder(0.2, 0.15, 0.85, 8).rotateX(0.75 + raise).translate(0, 1.38, 0.55)); // pescoço
  parts.push(G.cylinder(0.13, 0.08, 0.55, 8).rotateX(1.9).translate(0, 1.95 + raise * 0.6, 1.0)); // cabeça
  parts.push(G.box(0.06, 0.28, 0.5).translate(0, 1.55, 0.62).rotateX(0.0)); // crina
  for (const [sx, sz] of [[-0.2, 0.55], [0.2, 0.55], [-0.2, -0.55], [0.2, -0.55]]) {
    const front = sz > 0;
    const lift = front && o.rearing ? 0.3 : 0;
    parts.push(G.cylinder(0.07, 0.055, 0.95, 6).translate(sx, 0 + lift, sz));
  }
  parts.push(G.cylinder(0.05, 0.09, 0.75, 6).rotateX(-2.6).translate(0, 1.15, -0.75)); // cauda
  return G.merge(parts.map((g) => G.normalizeGeometry(g)));
}

/** Quadriga/biga: carro com rodas e n cavalos lado a lado (frente → +Z). */
export function chariotParts(nHorses = 4) {
  const out = [];
  const hg = horseGeom();
  const span = 0.75;
  for (let i = 0; i < nHorses; i++) {
    const x = (i - (nHorses - 1) / 2) * span;
    out.push(hg.clone().translate(x, 0, 1.6));
  }
  // carro (caixa aberta atrás), rodas e timão
  out.push(G.normalizeGeometry(G.box(1.25, 0.85, 0.12).translate(0, 0.55, 0.45)));
  for (const s of [-1, 1]) out.push(G.normalizeGeometry(G.box(0.1, 0.75, 0.85).translate(s * 0.6, 0.55, 0.05)));
  out.push(G.normalizeGeometry(G.box(1.25, 0.08, 0.95).translate(0, 0.5, 0.05)));
  for (const s of [-1, 1]) out.push(G.normalizeGeometry(G.cylinder(0.55, 0.55, 0.08, 16).rotateZ(Math.PI / 2).translate(s * 0.72, 0.55, -0.05)));
  out.push(G.normalizeGeometry(G.box(0.08, 0.08, 1.4).translate(0, 0.62, 1.1)));
  return G.merge(out);
}

/** Ganso (para instâncias): corpo branco, bico e patas alaranjados (cores de vértice). */
export function gooseGeom() {
  const body = G.normalizeGeometry(G.sphere(0.17, 10, 7).scale(0.85, 0.75, 1.45).translate(0, 0.14, 0), '#f1eee6');
  const neck = G.normalizeGeometry(G.cylinder(0.035, 0.03, 0.28, 6).rotateX(0.35).translate(0, 0.3, 0.17), '#f1eee6');
  const head = G.normalizeGeometry(G.sphere(0.05, 8, 6).translate(0, 0.53, 0.25), '#f1eee6');
  const beak = G.normalizeGeometry(G.cylinder(0.022, 0.008, 0.08, 5).rotateX(Math.PI / 2).translate(0, 0.585, 0.29), '#e08a2c');
  const legs = [-1, 1].map((s) => G.normalizeGeometry(G.cylinder(0.012, 0.012, 0.12, 4).translate(s * 0.05, 0.0, 0.0), '#e08a2c'));
  return G.merge([body, neck, head, beak, ...legs]);
}

/* ------------------------------------------------------------------------- */
/*  Materiais próprios do sítio (criados sob demanda e trocados após finish()) */
/* ------------------------------------------------------------------------- */

const _custom = new Map();

/**
 * Materiais que não existem na biblioteca geral. São atribuídos às malhas depois de
 * Builder.finish() (o builder funde por chave da biblioteca; aqui só se troca o material).
 *   - 'telhaDourada': telhas de bronze douradas por Cátulo (Plín. NH 33.57);
 *   - 'rocha': tufo natural da Rocha Tarpeia e dos afloramentos;
 *   - 'palha': cobertura de palha da Casa Romuli (Vitr. 2.1.5).
 */
export function customMaterial(key, quality) {
  if (_custom.has(key)) return _custom.get(key);
  const S = Math.min(512, quality?.textureSize ?? 256);
  let mat;
  if (key === 'telhaDourada') {
    const t = T.roofTileTexture(S, { cols: 4, rows: 4, seed: 515, base: '#d9b65c' });
    t.map.repeat.set(0.5, 0.5);
    t.normalMap.repeat.set(0.5, 0.5);
    mat = new THREE.MeshStandardMaterial({ map: t.map, normalMap: t.normalMap, color: 0xffffff, metalness: 0.78, roughness: 0.36, vertexColors: true });
    mat.normalScale = new THREE.Vector2(0.9, 0.9);
  } else if (key === 'rocha') {
    const t = T.pixelTexture(
      S,
      (u, v) => {
        const n = fbm(u, v, 4, 5, 911);
        const wo = worley(u, v, 6, 913);
        const edge = wo.f2 - wo.f1; // ~0 nas fissuras entre os "blocos" naturais
        const band = 0.5 + 0.5 * Math.sin((v + n * 0.18) * Math.PI * 2 * 5);
        const crack = edge < 0.06 ? 0.55 : 1;
        const k = (0.8 + n * 0.35 + band * 0.08) * crack;
        const c = [170 * k, 152 * k, 110 * k];
        return { c, h: n * 0.6 + band * 0.15 + (crack < 1 ? -0.3 : 0) + Math.min(0.3, edge) };
      },
      { normal: true, normalStrength: 3 },
    );
    t.map.repeat.set(1 / 7, 1 / 7);
    t.normalMap.repeat.set(1 / 7, 1 / 7);
    mat = new THREE.MeshStandardMaterial({ map: t.map, normalMap: t.normalMap, roughness: 0.95, metalness: 0, vertexColors: true });
  } else if (key === 'palha') {
    const t = T.pixelTexture(
      S,
      (u, v) => {
        const n = valueNoise(u, v * 0.1, 64, 931) * 0.6 + fbm(u, v, 8, 3, 933) * 0.4;
        const k = 0.75 + n * 0.45;
        return { c: [168 * k, 142 * k, 88 * k], h: n };
      },
      { normal: true, normalStrength: 2.5 },
    );
    t.map.repeat.set(1 / 2, 1 / 2);
    t.normalMap.repeat.set(1 / 2, 1 / 2);
    mat = new THREE.MeshStandardMaterial({ map: t.map, normalMap: t.normalMap, roughness: 1, metalness: 0, vertexColors: true });
  } else throw new Error(`material próprio desconhecido: ${key}`);
  mat.name = `capitolio:${key}`;
  _custom.set(key, mat);
  return mat;
}

/** Troca o material das malhas de um builder já finalizado (chave da biblioteca → material próprio). */
export function swapMaterial(group, libKey, mat) {
  for (const m of group.children) {
    const key = m.name.split(':').slice(1).join(':').split('|')[0];
    if (key === libKey || key === libKey + '@interior') m.material = mat;
  }
}

/* ------------------------------------------------------------------------- */
/*  Muros de arrimo e parapeitos ao longo de caminhos e plataformas           */
/* ------------------------------------------------------------------------- */

/**
 * Muro lateral de uma rua/escada em rampa: segue a polilinha `pts` deslocado `off` m para a
 * direita (off > 0) ou esquerda (off < 0) do sentido de percurso. Em cada trecho compara a cota
 * do caminho (yFn(s)) com o terreno do lado de fora: se o terreno é mais alto, vira muro de
 * arrimo (contém o corte); se é mais baixo, vira substrução com parapeito. Opus quadratum de
 * tufo (Lív. 6.4.12 — substruções de cantaria; tipo de tufo NÃO ENCONTRADO).
 * @param {object} o { from (s inicial), to (s final), step, thick, parapet, probe, mat, color, cap }
 */
export function sideWall(b, terrain, pts, yFn, off, o = {}) {
  const S = resample(pts, o.step ?? 3);
  const thick = o.thick ?? 1.2;
  const par = o.parapet ?? 1.0;
  const probe = o.probe ?? 5;
  const from = o.from ?? -Infinity;
  const to = o.to ?? Infinity;
  const sg = Math.sign(off) || 1;
  const P = S.filter((p) => p.s >= from - 1e-6 && p.s <= to + 1e-6);
  if (P.length < 2) return;
  const at = (p) => {
    const nx = -p.dz;
    const nz = p.dx;
    const x = p.x + nx * off;
    const z = p.z + nz * off;
    const y = yFn(p.s);
    const tOut = terrain.heightAt(p.x + nx * (off + sg * probe), p.z + nz * (off + sg * probe));
    const top = Math.max(y + par, tOut + 0.15);
    const base = Math.min(y, tOut) - 1.6;
    return { x, z, top, base };
  };
  let A = at(P[0]);
  for (let i = 1; i < P.length; i++) {
    const B = at(P[i]);
    const tone = o.color || ['#e3d6b8', '#d9caa6', '#e8dcc0'][i % 3];
    slopedWall(b, A.x, A.z, B.x, B.z, A.top, B.top, A.base, B.base, thick, { mat: o.mat || 'tufa', color: tone });
    if (o.cap !== false) slopedWall(b, A.x, A.z, B.x, B.z, A.top + 0.12, B.top + 0.12, A.top, B.top, thick + 0.18, { mat: 'travertine', collide: false });
    A = B;
  }
}

/**
 * Muros de arrimo verticais em volta de uma plataforma construída (polígono no nível y), com
 * parapeito na borda e aberturas. `gaps`: [[aresta, t0, t1]] em fração da aresta (0–1).
 * @param {object} o { thick, parapet (altura; 0 = sem), skip: [arestas sem muro], toneSeed }
 */
export function platformWalls(b, terrain, poly, y, gaps = [], o = {}) {
  const n = poly.length;
  const T = o.thick ?? 2.0;
  const par = o.parapet ?? 1.05;
  for (let i = 0; i < n; i++) {
    if (o.skip && o.skip.includes(i)) continue;
    const a = poly[i];
    const c = poly[(i + 1) % n];
    const [nx, nz] = outwardNormal(poly, i);
    const L = Math.hypot(c[0] - a[0], c[1] - a[1]);
    const nSeg = Math.max(1, Math.round(L / 10));
    for (let k = 0; k < nSeg; k++) {
      const t0 = k / nSeg;
      const t1 = (k + 1) / nSeg;
      const e0 = k === 0 ? -T / L : 0;
      const e1 = k === nSeg - 1 ? T / L : 0;
      const pa = [lerp(a[0], c[0], t0 + e0) + (nx * T) / 2, lerp(a[1], c[1], t0 + e0) + (nz * T) / 2];
      const pb = [lerp(a[0], c[0], t1 + e1) + (nx * T) / 2, lerp(a[1], c[1], t1 + e1) + (nz * T) / 2];
      let base = Infinity;
      for (let s = 0; s <= 4; s++) {
        const q = lerp(t0, t1, s / 4);
        base = Math.min(base, terrain.heightAt(lerp(a[0], c[0], q) + nx * 5, lerp(a[1], c[1], q) + nz * 5));
      }
      if (base > y - 0.4) base = y - 0.4;
      const tone = ['#e8dcc0', '#d9caa6', '#efe3c9', '#d2c39f'][(i * 7 + k + (o.toneSeed || 0)) % 4];
      slopedWall(b, pa[0], pa[1], pb[0], pb[1], y - 0.02, y - 0.02, base - 2, base - 2, T, { mat: 'tufa', color: tone });
      slopedWall(b, pa[0] + nx * 0.2, pa[1] + nz * 0.2, pb[0] + nx * 0.2, pb[1] + nz * 0.2, y - 0.4, y - 0.4, y - 0.72, y - 0.72, T + 0.4, { mat: 'tufa', color: '#cdbf9f', collide: false });
    }
    if (!par) continue;
    const eg = gaps.filter((g) => g[0] === i).map((g) => [g[1], g[2]]).sort((p, q) => p[0] - q[0]);
    const spans = [];
    let cur = 0;
    for (const [ga, gb] of eg) {
      if (ga > cur) spans.push([cur, ga]);
      cur = Math.max(cur, gb);
    }
    if (cur < 1) spans.push([cur, 1]);
    const off = T - 0.3;
    for (const [s0, s1] of spans) {
      const pa = [lerp(a[0], c[0], s0) + nx * off, lerp(a[1], c[1], s0) + nz * off];
      const pb = [lerp(a[0], c[0], s1) + nx * off, lerp(a[1], c[1], s1) + nz * off];
      slopedWall(b, pa[0], pa[1], pb[0], pb[1], y + par, y + par, y - 0.3, y - 0.3, 0.55, { mat: 'tufa', color: '#e3d6b8' });
      slopedWall(b, pa[0], pa[1], pb[0], pb[1], y + par + 0.12, y + par + 0.12, y + par - 0.02, y + par - 0.02, 0.7, { mat: 'travertine', collide: false });
    }
  }
}

/**
 * Escadaria longa em lances com patamares, de A até B (planta), subindo de y0 a y1.
 * Lances de `perFlight` degraus (espelho `rise`, piso `tread`); o comprimento que sobra vira
 * patamares iguais. Colisão por rampa em cada lance e caixa nos patamares.
 * Devolve a função de cota y(s) (s = distância a partir de A) — útil para muros e NPCs.
 */
export function stairway(b, A, B, y0, y1, w, o = {}) {
  const L = Math.hypot(B[0] - A[0], B[1] - A[1]);
  const H = y1 - y0;
  const rise = o.rise ?? 0.17;
  const nSteps = Math.max(1, Math.round(Math.abs(H) / rise));
  const sh = H / nSteps;
  let tread = o.tread ?? 0.36;
  const per = o.perFlight ?? 12;
  const nFl = Math.ceil(nSteps / per);
  let land = nFl > 1 ? (L - nSteps * tread) / (nFl - 1) : 0;
  if (land < 0.9) {
    tread = (L - Math.max(0, nFl - 1) * 1.2) / nSteps;
    land = nFl > 1 ? 1.2 : 0;
  }
  const rotY = Math.atan2(-(B[0] - A[0]), -(B[1] - A[1])); // −Z local → direção A→B
  b.push(A[0], 0, A[1], rotY);
  const segs = []; // [s0, s1, ya, yb]
  let s = 0;
  let y = y0;
  let k = 0;
  for (let f = 0; f < nFl; f++) {
    const n = Math.min(per, nSteps - k);
    const yEnd = y + n * sh;
    const base = Math.min(y, o.baseFn ? o.baseFn(s) : y) - 1.2;
    flight(b, w, n * tread, y, yEnd, 0, -s, { steps: n, baseY: base, mat: o.mat || 'tufa', color: o.color });
    segs.push([s, s + n * tread, y, yEnd]);
    s += n * tread;
    y = yEnd;
    k += n;
    if (f < nFl - 1) {
      const lb = Math.min(y, o.baseFn ? o.baseFn(s) : y) - 1.2;
      b.box(w, y - lb, land + 0.04, 0, lb, -s - land / 2, { mat: o.mat || 'tufa', color: o.color });
      segs.push([s, s + land, y, y]);
      s += land;
    }
  }
  b.pop();
  return (q) => {
    for (const [s0, s1, ya, yb] of segs) if (q <= s1 + 1e-6) return ya + (yb - ya) * Math.max(0, Math.min(1, (q - s0) / Math.max(1e-6, s1 - s0)));
    return y1;
  };
}

export { G, materials };
