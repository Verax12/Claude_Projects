/**
 * Subura — PLANO URBANO (traçado de ruas, praças, lotes e alturas de projeto).
 *
 * Módulo puro (sem three.js) para poder ser testado em Node: gera, de forma determinística,
 *   - as ruas (polilinhas com largura, pavimento e perfil de alturas),
 *   - as praças (largo da "entrada" da Subura com o lacus; encruzilhada do compitum),
 *   - o canteiro de demolição ligado ao Fórum de César (nota 07 §1),
 *   - os lotes de frente de rua (insulae contíguas, "paredes-meias contínuas", nota 07 §1)
 *     e os blocos de miolo de quarteirão (casario de fundo, instanciado).
 *
 * Fontes do traçado (todas em docs/pesquisa):
 *   - O Argileto sai do Fórum (35,9; −32,6) e atravessa a Subura rumo ENE (nota 07 §1–2; nota 10 §4).
 *   - O eixo do bairro corre para ENE pelo vale, com um ramo que sobe a NNE e outro a E (nota 07 §1,
 *     "Implicação para o jogo [HIPÓTESE]").
 *   - Traçado irregular, "mais ocupado do que dividido" (Lívio 5.55, nota 07 §1); ruas estreitas e
 *     tortuosas (Cícero, Leg. agr. 2.96; Tácito, Ann. 15.38 — nota 10 §4).
 *   - Larguras: NÃO ENCONTRADAS. Hipótese da nota 07 (lacuna 3): Argileto/rua principal 4–6 m,
 *     vielas 2,4–3 m; mínimo legal das XII Tábuas: 8 pés (≈ 2,37 m) em reta.
 *   - Lotes vizinhos de outros sítios que ficam DENTRO da área: casa-plebe (320…346, −262…−238) e
 *     foricae (244…270, −188…−168) — deixados livres e cercados por ruas (LAYOUT §3).
 *
 * Convenções do mundo: x = leste, z = sul (m).
 */
import { SITE_AREAS } from '../../data/layout.js';

/* ------------------------------------------------------------------------- */
/*  Utilidades geométricas (sem dependências)                                */
/* ------------------------------------------------------------------------- */

/** PRNG mulberry32 determinístico. */
export function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Distância assinada ponto–polígono (positivo = dentro). */
export function sdPoly(x, z, poly) {
  let inside = false;
  let minD = Infinity;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i];
    const [xj, zj] = poly[j];
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
    const dx = xj - xi;
    const dz = zj - zi;
    const l2 = dx * dx + dz * dz || 1;
    let t = ((x - xi) * dx + (z - zi) * dz) / l2;
    t = Math.max(0, Math.min(1, t));
    const d = Math.hypot(xi + t * dx - x, zi + t * dz - z);
    if (d < minD) minD = d;
  }
  return inside ? minD : -minD;
}

/** Distância de um ponto a um segmento. */
export function distSeg(x, z, ax, az, bx, bz) {
  const dx = bx - ax;
  const dz = bz - az;
  const l2 = dx * dx + dz * dz || 1;
  let t = ((x - ax) * dx + (z - az) * dz) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(ax + t * dx - x, az + t * dz - z);
}

/** Polilinha com parametrização por comprimento de arco. */
export class Polyline {
  constructor(pts) {
    this.pts = pts;
    this.acc = [0];
    for (let i = 1; i < pts.length; i++) this.acc.push(this.acc[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    this.length = this.acc[this.acc.length - 1];
  }

  _seg(t) {
    t = Math.max(0, Math.min(this.length, t));
    let i = 1;
    while (i < this.acc.length - 1 && this.acc[i] < t) i++;
    return { i, u: (t - this.acc[i - 1]) / (this.acc[i] - this.acc[i - 1] || 1) };
  }

  /** Ponto [x, z] no comprimento t. */
  at(t) {
    const { i, u } = this._seg(t);
    const a = this.pts[i - 1];
    const b = this.pts[i];
    return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
  }

  /** Tangente unitária [tx, tz] no comprimento t (suavizada perto dos vértices). */
  tangent(t) {
    const a = this.at(Math.max(0, t - 1.5));
    const b = this.at(Math.min(this.length, t + 1.5));
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return [(b[0] - a[0]) / l, (b[1] - a[1]) / l];
  }

  /** Distância mínima de (x,z) à polilinha e o comprimento t do ponto mais próximo. */
  project(x, z) {
    let best = Infinity;
    let bt = 0;
    for (let i = 1; i < this.pts.length; i++) {
      const [ax, az] = this.pts[i - 1];
      const [bx, bz] = this.pts[i];
      const dx = bx - ax;
      const dz = bz - az;
      const l2 = dx * dx + dz * dz || 1;
      let u = ((x - ax) * dx + (z - az) * dz) / l2;
      u = Math.max(0, Math.min(1, u));
      const d = Math.hypot(ax + u * dx - x, az + u * dz - z);
      if (d < best) {
        best = d;
        bt = this.acc[i - 1] + u * Math.sqrt(l2);
      }
    }
    return { d: best, t: bt };
  }
}

/* ------------------------------------------------------------------------- */
/*  Traçado                                                                  */
/* ------------------------------------------------------------------------- */

/** Polígono da área do sítio (docs/LAYOUT.md / src/data/layout.js). */
export const AREA = SITE_AREAS.subura[0];

/** Lotes de outros sítios dentro da área (deixar livres e cercar de ruas). */
export const FOREIGN_LOTS = {
  'casa-plebe': [[320, -262], [346, -262], [346, -238], [320, -238]],
  foricae: [[244, -188], [270, -188], [270, -168], [244, -168]],
};

/** Junções comuns do LAYOUT §4. */
export const JUNCTIONS = { forumArgiletum: [40, -40], argiletumSubura: [140, -105] };

/**
 * Ruas. cls: 'main' (pavimentada de silex — hipótese da nota 07 §2), 'street' (vicus, terra batida),
 * 'alley' (viela/angiportum, terra batida). zone: 'core' (detalhe alto) | 'ne' (detalhe médio).
 * density: NPCs por 100 m (LAYOUT §5).
 */
export const STREETS = [
  // Argileto: do limite da área (atrás da Basílica Emília) até a entrada da Subura (junção 140, −105).
  { id: 'A', name: 'Argileto', latin: 'Argiletum', cls: 'main', w: 5.5, density: 11, pts: [[89.8, -72.4], [115, -89], [140, -105]] },
  // Rua principal do vale (continuação do Argileto, rumo ao Clivus Suburanus / Porta Esquilina).
  {
    id: 'B', name: 'Subura — rua principal do vale', latin: 'Subura maior (via)', cls: 'main', w: 5, density: 10,
    pts: [[140, -105], [175, -114], [210, -124], [245, -134], [280, -142], [312, -149], [345, -156], [380, -166], [415, -180], [448, -198], [478, -220], [505, -246], [535, -272], [570, -298], [610, -322], [650, -344], [692, -366]],
  },
  // Acesso ao macellum (lote vizinho a SE): corre ao longo da face NO do lote do macellum.
  { id: 'M', name: 'Rua do macellum', latin: 'Vicus ad macellum', cls: 'main', w: 4, density: 5, pts: [[131, -42.5], [144, -66], [155.4, -86.6]] },
  // Vici e vielas do núcleo
  { id: 'C1', name: 'Vicus da latrina', cls: 'street', w: 3.2, density: 5, pts: [[228, -131.5], [234, -150], [239, -166], [241, -192], [247, -216], [258, -242], [272, -268], [288, -292], [298, -318]] },
  { id: 'C2', cls: 'alley', w: 2.6, density: 3, pts: [[239, -166], [257, -165.2], [276, -164], [295, -162], [314, -170]] },
  { id: 'C3', name: 'Vicus da insula', cls: 'street', w: 3.2, density: 5, pts: [[312, -149], [314, -170], [316, -195], [317, -207], [317, -218], [316.4, -234.6], [316.4, -264.8], [319, -288], [326, -315]] },
  { id: 'C4', cls: 'alley', w: 2.6, density: 2, pts: [[276, -164], [274.6, -178], [274.6, -193.4]] },
  { id: 'C5', cls: 'alley', w: 2.6, density: 2, pts: [[241, -192], [258, -193.4], [274.6, -193.4], [296, -200], [317, -207]] },
  { id: 'C6', cls: 'alley', w: 2.6, density: 3, pts: [[316.4, -234.6], [333, -234.4], [349.8, -234.6], [366, -231], [384, -226]] },
  { id: 'C7', cls: 'alley', w: 2.6, density: 2, pts: [[349.8, -234.6], [349.8, -250], [349.8, -264.8]] },
  { id: 'C8', cls: 'alley', w: 2.6, density: 2, pts: [[316.4, -264.8], [333, -265], [349.8, -264.8]] },
  { id: 'C9', cls: 'street', w: 3.2, density: 4, pts: [[380, -166], [383, -190], [384, -226], [381, -260], [373, -295], [365, -330], [360, -362]] },
  { id: 'C10', cls: 'alley', w: 2.6, density: 2, pts: [[319, -288], [345, -292], [373, -295]] },
  { id: 'C16', cls: 'street', w: 3.2, density: 4, pts: [[175, -114], [168, -140], [160, -170], [150, -200], [140, -230], [128, -262], [118, -286]] },
  { id: 'C17', cls: 'alley', w: 2.6, density: 3, pts: [[160, -170], [190, -175], [215, -172], [239, -166]] },
  { id: 'C18', cls: 'alley', w: 2.6, density: 2, pts: [[115, -89], [110, -110], [104, -134], [100, -160]] },
  { id: 'C20', cls: 'alley', w: 2.6, density: 2, pts: [[128, -262], [160, -268], [200, -272], [235, -262], [258, -242]] },
  // Zona NE (encostas do Viminal/Císpio) — detalhe médio
  { id: 'C11', cls: 'street', w: 3.2, density: 3, pts: [[478, -220], [470, -255], [462, -290], [455, -330], [445, -370], [440, -410], [445, -450], [460, -490], [490, -530], [530, -560], [575, -590], [612, -614]] },
  { id: 'C12', cls: 'street', w: 3.2, density: 3, pts: [[570, -298], [575, -340], [590, -380], [610, -420], [640, -460], [670, -500], [700, -540], [728, -566]] },
  { id: 'C14', cls: 'alley', w: 2.8, density: 2, pts: [[445, -450], [490, -445], [540, -440], [590, -425], [610, -420]] },
  { id: 'C19', cls: 'alley', w: 2.8, density: 2, pts: [[455, -330], [500, -336], [540, -339], [575, -340]] },
];

/**
 * Praças (alargamentos). 'fauces': entrada da Subura, junção Argileto ↔ Subura (LAYOUT §4), com o
 * lacus (bacia pública — nota 07, lacuna 14: "1 bacia de pedra num largo, rotulada hipotética").
 * 'compitum': encruzilhada com a capela dos Lares Compitales (nota 07 §5).
 */
export const SQUARES = [
  { id: 'fauces', paved: true, pts: [[127, -101], [139, -93.5], [151, -89], [157.2, -91], [166, -97.5], [164, -110], [150, -116.5], [133, -113.5]] },
  { id: 'compitum', paved: true, pts: [[300, -141.5], [318, -142.5], [326, -149], [323, -160], [308, -161.5], [299, -154]] },
];

/** Canteiro de demolição (casario comprado para o Fórum de César — nota 07 §1; Cíc. Att. 4.17.7). */
export const DEMOLITION = [[71, -102], [90.5, -77.5], [111.5, -91.5], [107.2, -110], [101.5, -133], [73.5, -137]];

/** Zona (core/ne) pela posição. */
export function zoneOf(x) {
  return x < 430 ? 'core' : 'ne';
}

const CLS = {
  main: { wMin: 8, wMax: 14, dMin: 11, dMax: 16, floors: [4, 5] },
  street: { wMin: 7, wMax: 12, dMin: 9, dMax: 14, floors: [3, 5] },
  alley: { wMin: 6, wMax: 11, dMin: 7, dMax: 12, floors: [3, 4] },
};

/* ------------------------------------------------------------------------- */
/*  Grade de ocupação                                                         */
/* ------------------------------------------------------------------------- */
const FREE = 0;
const LOT = 1;
const STREET = 2;
const RESERVED = 3;
const OUT = 4;

class Grid {
  constructor(x0, z0, x1, z1, cell = 1) {
    this.x0 = x0;
    this.z0 = z0;
    this.cell = cell;
    this.nx = Math.ceil((x1 - x0) / cell);
    this.nz = Math.ceil((z1 - z0) / cell);
    this.v = new Uint8Array(this.nx * this.nz);
  }

  idx(i, j) {
    return j * this.nx + i;
  }

  /** Valor na célula do ponto (fora da grade = OUT). */
  get(x, z) {
    const i = Math.floor((x - this.x0) / this.cell);
    const j = Math.floor((z - this.z0) / this.cell);
    if (i < 0 || j < 0 || i >= this.nx || j >= this.nz) return OUT;
    return this.v[this.idx(i, j)];
  }

  /** Percorre as células cujo centro satisfaz fn(x,z) dentro da caixa. */
  forBox(minX, minZ, maxX, maxZ, fn) {
    const i0 = Math.max(0, Math.floor((minX - this.x0) / this.cell));
    const i1 = Math.min(this.nx - 1, Math.ceil((maxX - this.x0) / this.cell));
    const j0 = Math.max(0, Math.floor((minZ - this.z0) / this.cell));
    const j1 = Math.min(this.nz - 1, Math.ceil((maxZ - this.z0) / this.cell));
    for (let j = j0; j <= j1; j++) {
      const z = this.z0 + (j + 0.5) * this.cell;
      for (let i = i0; i <= i1; i++) {
        const x = this.x0 + (i + 0.5) * this.cell;
        if (fn(x, z, this.idx(i, j)) === false) return false;
      }
    }
    return true;
  }
}

/* ------------------------------------------------------------------------- */
/*  Lotes                                                                    */
/* ------------------------------------------------------------------------- */

/**
 * Quadro de um lote: frente (fx0,fz0) no alinhamento da rua, f = direção para a rua,
 * X = eixo ao longo da fachada (local +X), largura w, profundidade d (para dentro).
 */
function lotFrame(front, f, w, d) {
  const X = [f[1], -f[0]]; // local +X do Builder com rotY = atan2(fx, fz)
  return { cx: front[0], cz: front[1], f, X, w, d, rotY: Math.atan2(f[0], f[1]) };
}

function lotCells(grid, L, shrink, fn) {
  const { cx, cz, f, X, w, d } = L;
  const corners = [
    [cx - X[0] * w / 2, cz - X[1] * w / 2],
    [cx + X[0] * w / 2, cz + X[1] * w / 2],
    [cx + X[0] * w / 2 - f[0] * d, cz + X[1] * w / 2 - f[1] * d],
    [cx - X[0] * w / 2 - f[0] * d, cz - X[1] * w / 2 - f[1] * d],
  ];
  const xs = corners.map((c) => c[0]);
  const zs = corners.map((c) => c[1]);
  return grid.forBox(Math.min(...xs), Math.min(...zs), Math.max(...xs), Math.max(...zs), (x, z, k) => {
    const dx = x - cx;
    const dz = z - cz;
    const lx = dx * X[0] + dz * X[1];
    const lz = -(dx * f[0] + dz * f[1]);
    if (Math.abs(lx) <= w / 2 - shrink && lz >= shrink && lz <= d - shrink) return fn(k);
    return true;
  });
}

function lotFree(grid, L) {
  return lotCells(grid, L, 0.35, (k) => grid.v[k] === FREE);
}

function lotMark(grid, L, val = LOT) {
  lotCells(grid, L, 0.0, (k) => {
    if (grid.v[k] === FREE) grid.v[k] = val;
    return true;
  });
}

/** O lado do lote está exposto (rua ou vazio a 0,8 m da face)? */
function sideExposed(grid, L, which) {
  const { cx, cz, f, X, w, d } = L;
  const pts = [];
  for (const u of [0.25, 0.5, 0.75]) {
    if (which === 'left') pts.push([cx - X[0] * (w / 2 + 0.8) - f[0] * d * u, cz - X[1] * (w / 2 + 0.8) - f[1] * d * u]);
    if (which === 'right') pts.push([cx + X[0] * (w / 2 + 0.8) - f[0] * d * u, cz + X[1] * (w / 2 + 0.8) - f[1] * d * u]);
    if (which === 'back') pts.push([cx + X[0] * w * (u - 0.5) - f[0] * (d + 0.8), cz + X[1] * w * (u - 0.5) - f[1] * (d + 0.8)]);
  }
  return pts.some(([x, z]) => {
    const v = grid.get(x, z);
    return v === FREE || v === STREET;
  });
}

/* ------------------------------------------------------------------------- */
/*  Plano completo                                                           */
/* ------------------------------------------------------------------------- */

/**
 * Gera o plano completo.
 * @param {(x:number,z:number)=>number} heightFn  altura do terreno (antes dos pads deste sítio)
 */
export function makePlan(heightFn) {
  const R = rng(4417);
  // --- alturas de projeto: terreno suavizado (média 5×5 em ±10 m), nunca abaixo do Fórum ---
  const smoothH = (x, z) => {
    let s = 0;
    for (let a = -2; a <= 2; a++) for (let c = -2; c <= 2; c++) s += heightFn(x + a * 5, z + c * 5);
    // o vale "afunda" no DEM corrigido perto do Fórum (−1…−3 m): a Subura escoa PARA o Fórum
    // (Cloaca), então o piso de projeto não fica abaixo de +0,2 m (hipótese de modelagem).
    return Math.max(0.2, s / 25);
  };

  // --- ruas: polilinhas, perfis de altura (estações a cada 4 m, média móvel de ±8 m) ---
  const streets = STREETS.map((s) => {
    const pl = new Polyline(s.pts);
    const n = Math.max(2, Math.ceil(pl.length / 4) + 1);
    const raw = [];
    for (let i = 0; i < n; i++) {
      const t = (pl.length * i) / (n - 1);
      const [x, z] = pl.at(t);
      raw.push(smoothH(x, z));
    }
    const prof = raw.map((_, i) => {
      let sum = 0;
      let cnt = 0;
      for (let k = -2; k <= 2; k++) {
        const j = i + k;
        if (j >= 0 && j < n) {
          sum += raw[j];
          cnt++;
        }
      }
      return sum / cnt;
    });
    const heightAtT = (t) => {
      const f = (Math.max(0, Math.min(pl.length, t)) / pl.length) * (n - 1);
      const i = Math.min(n - 2, Math.floor(f));
      return prof[i] + (prof[i + 1] - prof[i]) * (f - i);
    };
    return { ...s, pl, prof, heightAtT, zone: zoneOf(s.pts[0][0]) };
  });
  const byId = Object.fromEntries(streets.map((s) => [s.id, s]));

  // --- grade de ocupação ---
  const grid = new Grid(50, -660, 800, -20, 1);
  grid.forBox(50, -660, 800, -20, (x, z, k) => {
    if (sdPoly(x, z, AREA) < 0.6) grid.v[k] = OUT;
    return true;
  });
  const markPoly = (poly, val, margin = 0) => {
    const xs = poly.map((p) => p[0]);
    const zs = poly.map((p) => p[1]);
    grid.forBox(Math.min(...xs) - margin, Math.min(...zs) - margin, Math.max(...xs) + margin, Math.max(...zs) + margin, (x, z, k) => {
      if (grid.v[k] !== OUT && sdPoly(x, z, poly) > -margin) grid.v[k] = val;
      return true;
    });
  };
  for (const poly of Object.values(FOREIGN_LOTS)) markPoly(poly, RESERVED, 1.2);
  markPoly(DEMOLITION, RESERVED, 0);
  for (const s of streets) {
    const half = s.w / 2 + 0.15;
    for (let i = 1; i < s.pts.length; i++) {
      const [ax, az] = s.pts[i - 1];
      const [bx, bz] = s.pts[i];
      grid.forBox(Math.min(ax, bx) - half, Math.min(az, bz) - half, Math.max(ax, bx) + half, Math.max(az, bz) + half, (x, z, k) => {
        if (grid.v[k] !== OUT && distSeg(x, z, ax, az, bx, bz) <= half) grid.v[k] = STREET;
        return true;
      });
    }
  }
  for (const q of SQUARES) markPoly(q.pts, STREET, 0.2);

  // --- lotes de frente de rua ---
  const lots = [];
  const order = ['A', 'B', 'M', 'C3', 'C1', 'C16', 'C9', 'C11', 'C12', 'C2', 'C5', 'C6', 'C7', 'C8', 'C4', 'C10', 'C17', 'C18', 'C20', 'C14', 'C19'];
  for (const id of order) {
    const s = byId[id];
    const P = CLS[s.cls];
    for (const side of [1, -1]) {
      let t = 0.4;
      while (t < s.pl.length - 4) {
        let placed = null;
        const wTry = P.wMin + R() * (P.wMax - P.wMin);
        const dTry = P.dMin + R() * (P.dMax - P.dMin);
        const widths = [wTry, wTry * 0.72, Math.max(5, wTry * 0.5)];
        const depths = [dTry, dTry * 0.75, Math.min(dTry, 7.5), 5.5];
        outer: for (const w of widths) {
          if (t + w > s.pl.length + 0.5) continue;
          const p0 = s.pl.at(t);
          const p1 = s.pl.at(Math.min(s.pl.length, t + w));
          const cl = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
          if (cl < 4.5) continue;
          const tx = (p1[0] - p0[0]) / cl;
          const tz = (p1[1] - p0[1]) / cl;
          // normal para fora da rua (lado 1 = esquerda da direção de percurso)
          const nx = side * tz;
          const nz = side * -tx;
          const mid = [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2];
          const front = [mid[0] + nx * (s.w / 2), mid[1] + nz * (s.w / 2)];
          for (const d of depths) {
            const L = lotFrame(front, [-nx, -nz], cl, d);
            if (lotFree(grid, L)) {
              placed = { L, t, w: cl };
              break outer;
            }
          }
        }
        if (placed) {
          const L = placed.L;
          lotMark(grid, L);
          const tm = placed.t + placed.w / 2;
          lots.push({
            ...L,
            id: lots.length,
            street: s.id,
            cls: s.cls,
            side,
            t: tm,
            y: s.heightAtT(tm),
            slope: Math.abs(s.heightAtT(placed.t + placed.w) - s.heightAtT(placed.t)) / placed.w,
            zone: zoneOf(L.cx),
            floors: P.floors[0] + Math.floor(R() * (P.floors[1] - P.floors[0] + 1)),
            seed: Math.floor(R() * 1e9),
            kind: 'insula',
          });
          t += placed.w;
        } else t += 1.5;
      }
    }
  }

  // --- miolo dos quarteirões: blocos de fundo (variantes instanciadas) ---
  const VARIANTS = BG_VARIANTS;
  const fills = [];
  const nearestDir = (x, z) => {
    let best = null;
    for (const s of streets) {
      const p = s.pl.project(x, z);
      if (!best || p.d < best.d) best = { d: p.d, s, t: p.t };
    }
    return best;
  };
  // candidatos numa grade fina, processados da rua para dentro: cada bloco começa logo atrás do
  // que já existe (empacotamento denso, "paredes-meias contínuas"); sobram poços de luz.
  const cands = [];
  for (let z = -655; z < -25; z += 3) {
    for (let x = 55; x < 795; x += 3) {
      if (grid.get(x, z) !== FREE) continue;
      const nd = nearestDir(x, z);
      if (nd) cands.push({ x, z, nd });
    }
  }
  cands.sort((a, b) => a.nd.d - b.nd.d);
  const tryOrder = [[0, 2, 1], [3, 4]];
  for (const pass of [0, 1]) {
    for (const c of cands) {
      if (grid.get(c.x, c.z) !== FREE) continue;
      const sp = c.nd.s.pl.at(c.nd.t);
      let fx = sp[0] - c.x;
      let fz = sp[1] - c.z;
      const fl = Math.hypot(fx, fz) || 1;
      fx /= fl;
      fz /= fl;
      const front = [c.x + fx * 0.4, c.z + fz * 0.4];
      let done = false;
      for (const vi of tryOrder[pass]) {
        const V = VARIANTS[vi];
        const sc = 0.92 + R() * 0.12;
        for (const swap of [false, true]) {
          const w = (swap ? V.d : V.w) * sc;
          const d = (swap ? V.w : V.d) * sc;
          const L = lotFrame(front, [fx, fz], w, d);
          if (!lotFree(grid, L)) continue;
          lotMark(grid, L);
          const cx = front[0] - fx * d / 2;
          const cz = front[1] - fz * d / 2;
          fills.push({ ...L, variant: vi, swap, scale: sc, x: cx, z: cz, seed: Math.floor(R() * 1e9), zone: zoneOf(cx) });
          done = true;
          break;
        }
        if (done) break;
      }
    }
  }

  // --- exposição das faces laterais/fundo (para janelas nas empenas expostas) ---
  for (const L of lots) {
    L.expLeft = sideExposed(grid, L, 'left');
    L.expRight = sideExposed(grid, L, 'right');
    L.expBack = sideExposed(grid, L, 'back');
  }

  // --- praças: altura de projeto ---
  const squares = SQUARES.map((q) => {
    const cx = q.pts.reduce((a, p) => a + p[0], 0) / q.pts.length;
    const cz = q.pts.reduce((a, p) => a + p[1], 0) / q.pts.length;
    return { ...q, cx, cz, y: smoothH(cx, cz) };
  });

  return { streets, byId, lots, fills, squares, grid, smoothH, demolition: { pts: DEMOLITION } };
}

/**
 * Variantes do casario de fundo (miolo de quarteirão e longe): dimensões em m.
 * Alturas dentro da hipótese da nota 07 (3–5 pavimentos, ≈ 10–17 m).
 */
export const BG_VARIANTS = [
  { w: 11, d: 11, floors: 4, roof: 'hip' },
  { w: 13, d: 9, floors: 3, roof: 'gable' },
  { w: 9, d: 12, floors: 5, roof: 'gable' },
  { w: 7, d: 7, floors: 3, roof: 'hip' },
  { w: 6, d: 8, floors: 4, roof: 'gable' },
];
