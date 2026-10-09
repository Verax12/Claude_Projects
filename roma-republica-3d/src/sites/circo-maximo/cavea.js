/**
 * Circo Máximo — cávea (arquibancadas), lojas e pórtico externo, fosso (euripus) e rua.
 *
 * Base (docs/pesquisa/10 §1, Dionísio 3.68.2–4, estado c. 8 a.C. usado como APROXIMAÇÃO de 46 a.C.):
 *   - "stoas de três andares": embaixo assentos de pedra que sobem pouco a pouco, em cima assentos
 *     de madeira (Dion. 3.68.2–3);
 *   - dois lados longos e uma meia-lua contínuos; o lado das carceres fica a céu aberto (3.68.3);
 *   - fora, outra stoa de um andar com lojas e moradias por cima; junto a cada loja, entradas e
 *     escadas para os espectadores (3.68.4);
 *   - euripus de 10 pés de largura e profundidade em volta da arena (3.68.2; Suet. Iul. 39.2;
 *     Plín. NH 8.21), nos 2 lados longos e na curva, não do lado das carceres.
 * Número de fileiras, medidas, ritmo de lojas e vomitórios: NÃO ENCONTRADO → hipótese de modelagem
 * (ver plan.js e o painel "Arquibancadas").
 *
 * Construção num quadro local por trecho, em que −Z local aponta para FORA do circo:
 *   - lados retos: quadro do lado (Palatino: identidade; Aventino: girado 180°);
 *   - meia-lua: um quadro por segmento, com origem no centro da curva.
 * Cada peça é um prisma trapezoidal (cordas exatas na curva), base em y, sem face inferior.
 */
import { arch } from '../../arch/columns.js';
import { propGeometry } from '../../arch/props.js';
import * as G from '../../render/geom.js';
import {
  R, H, Y0, FLOOR, STONE_ROWS as SR, WOOD_ROWS as WR, XC, CURVE, RUN_X0, BLOCKS, MODS, MOD_W, VOM_MOD,
  STANDS_X0, curveAngle, outwardRot,
} from './plan.js';

const y = (rel) => Y0 + rel;
const K = (x) => () => x; // aresta em x fixo (independente do raio)

/* ------------------------------------------------------------------------- */
/*  Formas e peças                                                            */
/* ------------------------------------------------------------------------- */

/** z (local) da corda do trecho no raio r (h = meio-ângulo do segmento; 0 nos lados retos). */
const zOf = (sh, r) => -r * Math.cos(sh.h);

/** Polígono trapezoidal [x,z] da peça entre os raios r0 e r1. */
function poly(sh, r0, r1) {
  const z0 = zOf(sh, r0);
  const z1 = zOf(sh, r1);
  return [[sh.e0(r0), z0], [sh.e1(r0), z0], [sh.e1(r1), z1], [sh.e0(r1), z1]];
}

/** Peça sólida (prisma) entre r0–r1 e cotas ya–yb. */
function slab(b, sh, r0, r1, ya, yb, mat, o = {}) {
  if (yb - ya < 0.004) return;
  const p = poly(sh, r0, r1);
  if (p[1][0] - p[0][0] < 0.02 || p[2][0] - p[3][0] < 0.02) return;
  b.prism(p, yb - ya, ya, { mat, bottom: false, top: o.top, color: o.color, collide: o.collide ?? true });
}

const sub = (sh, e0, e1) => ({ ...sh, e0, e1 });

/** Remove da forma os intervalos [[xa, xb], ...] (em x local); devolve as partes restantes. */
function cutMany(sh, cuts) {
  const cs = cuts.slice().sort((a, c) => a[0] - c[0]);
  const out = [];
  let e0 = sh.e0;
  for (const [xa, xb] of cs) {
    out.push(sub(sh, e0, K(xa)));
    e0 = K(xb);
  }
  out.push(sub(sh, e0, sh.e1));
  return out;
}

/** Quadrilátero com a face visível para cima (corrige a ordem se preciso). */
function quadUp(b, A, B, C, D, mat) {
  const ny = (B[2] - A[2]) * (C[0] - A[0]) - (B[0] - A[0]) * (C[2] - A[2]);
  if (ny >= 0) b.quad(A, B, C, D, { mat });
  else b.quad(D, C, B, A, { mat });
}
function quadDown(b, A, B, C, D, mat) {
  const ny = (B[2] - A[2]) * (C[0] - A[0]) - (B[0] - A[0]) * (C[2] - A[2]);
  if (ny <= 0) b.quad(A, B, C, D, { mat });
  else b.quad(D, C, B, A, { mat });
}

/** Cores (tinta de vértice) com pequena variação — sujeira, reparos, madeira de lotes diferentes. */
function tint(rng, base, amp = 0.06) {
  const v = 1 - rng() * amp;
  const c = typeof base === 'number' ? [base, base, base] : base;
  return [c[0] * v, c[1] * v, c[2] * v];
}

/* ------------------------------------------------------------------------- */
/*  Camadas do corte                                                          */
/* ------------------------------------------------------------------------- */

/** Pódio + subestrutura, parapeito, fileiras de pedra (com corredores-escada) e praecinctio. */
function stoneTier(b, sh, aisles, rng) {
  const t = tint(rng, [1, 0.98, 0.95], 0.08);
  slab(b, sh, R.euripus, R.praec0, y(H.found), y(H.podium), 'tufa', { color: t });
  slab(b, sh, R.euripus, R.parapet, y(H.podium), y(H.podium + 1.0), 'travertine', { color: tint(rng, 1, 0.05) });
  slab(b, sh, R.praec0, R.back, y(H.found), y(H.praec), 'tufa', { color: t });
  const parts = cutMany(sh, aisles.map((a) => [a - 0.7, a + 0.7]));
  for (const p of parts) {
    for (let i = 0; i < SR.n; i++) {
      const c = i % 2 ? [0.95, 0.92, 0.86] : [1, 0.97, 0.92];
      slab(b, p, R.seat0 + SR.d * i, R.seat0 + SR.d * (i + 1), y(H.podium), y(H.podium + SR.h * (i + 1)), 'tufa', { color: tint(rng, c, 0.05) });
    }
  }
  const depth = (R.praec0 - R.seat0) * Math.cos(sh.h);
  for (const a of aisles) b.stairs(1.4, depth, SR.n * SR.h, a, y(H.podium), zOf(sh, R.seat0), { mat: 'travertine', faces: { bottom: false } });
}

/** Forro das lojas, volume das moradias e fileiras de madeira (com corredores-escada). */
function woodTier(b, sh, aisles, rng) {
  slab(b, sh, R.back, R.out, y(H.shop), y(H.shopCeil), 'woodDark');
  slab(b, sh, R.back, R.out, y(H.shopCeil), y(H.praec), 'opusIncertum');
  const parts = cutMany(sh, aisles.map((a) => [a - 0.7, a + 0.7]));
  for (const p of parts) {
    const lot = tint(rng, [1, 0.96, 0.9], 0.18); // madeira de lotes diferentes
    for (let j = 0; j < WR.n; j++) {
      slab(b, p, R.back + WR.d * j, R.back + WR.d * (j + 1), y(H.praec), y(H.praec + WR.h * (j + 1)), 'wood', { color: tint(rng, lot, 0.08) });
    }
  }
  const depth = (R.out - R.back) * Math.cos(sh.h);
  for (const a of aisles) b.stairs(1.4, depth, WR.n * WR.h, a, y(H.praec), zOf(sh, R.back), { mat: 'wood', color: [1.15, 1.1, 1.02], faces: { bottom: false } });
}

/** Parede externa acima do térreo + cornija. */
function upperFacade(b, sh, rng) {
  slab(b, sh, R.out, R.facade, y(H.shop), y(H.parapetTop), 'plaster', { color: tint(rng, [0.93, 0.86, 0.74], 0.1) });
  slab(b, sh, R.facade, R.facade + 0.28, y(H.parapetTop - 0.32), y(H.parapetTop), 'travertine', { collide: false });
  slab(b, sh, R.facade, R.facade + 0.12, y(H.shop), y(H.shop + 0.18), 'travertine', { collide: false }); // faixa sobre o térreo
}

/** Janelas (painéis escuros) e venezianas das moradias sobre as lojas. */
function windows(b, sh, xm, rng) {
  const zf = zOf(sh, R.facade);
  const dark = '#2a221b';
  for (const [wy, ww, wh] of [[6.0, 0.9, 1.0], [8.6, 0.7, 0.7]]) {
    if (rng() < 0.12) continue;
    const x = xm + (rng() - 0.5) * 1.2;
    b.box(ww, wh, 0.04, x, y(wy), zf - 0.02, { mat: 'flat', color: dark, collide: false });
    b.box(ww + 0.2, 0.08, 0.1, x, y(wy - 0.08), zf - 0.05, { mat: 'travertine', collide: false }); // peitoril
    if (rng() < 0.55) b.box(ww * 0.5, wh, 0.05, x - ww * 0.78, y(wy), zf - 0.04, { mat: 'wood', color: tint(rng, 1, 0.2), collide: false });
  }
}

/** Térreo de uma loja (pilares, verga, divisória) — devolve o tipo sorteado. */
function shopFront(b, sh, xm, rng) {
  const ow = 3.0;
  slab(b, sub(sh, sh.e0, K(xm - ow / 2)), R.out, R.facade, y(-0.5), y(H.shop), 'opusIncertum');
  slab(b, sub(sh, K(xm + ow / 2), sh.e1), R.out, R.facade, y(-0.5), y(H.shop), 'opusIncertum');
  slab(b, sub(sh, K(xm - ow / 2), K(xm + ow / 2)), R.out, R.facade, y(3.0), y(H.shop), 'woodDark');
  // divisória entre lojas (na aresta e0 do módulo)
  slab(b, sub(sh, sh.e0, (r) => sh.e0(r) + 0.45), R.back, R.out, y(-0.2), y(H.shop), 'opusIncertum');
  const closed = rng() < 0.22;
  if (closed) {
    // loja fechada com tábuas (taboas de fechar — persianas de madeira)
    slab(b, sub(sh, K(xm - ow / 2), K(xm + ow / 2)), R.out + 0.12, R.out + 0.3, y(-0.1), y(3.0), 'woodDark', { color: tint(rng, 1, 0.25) });
  }
  return closed;
}

/* ------------------------------------------------------------------------- */
/*  Classe principal                                                          */
/* ------------------------------------------------------------------------- */

export class CaveaBuilder {
  /**
   * @param {object} ctx  contexto do sítio
   * @param {object} bs   { main, det } builders já no quadro do circo
   */
  constructor(ctx, bs) {
    this.ctx = ctx;
    this.b = bs.main;
    this.det = bs.det;
    this.rng = ctx.rng(4601);
    this.stats = { shops: 0, vomitoria: 0 };
    // pórtico externo: coluna toscana simples (instanciada — centenas de cópias)
    const colGeo = G.merge([
      G.normalizeGeometry(G.box(0.62, 0.22, 0.62)),
      G.normalizeGeometry(G.lathe([[0.27, 0.22], [0.25, 0.32], [0.24, 1.4], [0.215, 3.55], [0.235, 3.62], [0.3, 3.75], [0.0, 3.75]], 10)),
      G.normalizeGeometry(G.box(0.66, 0.25, 0.66).translate(0, 3.75, 0)),
    ]);
    this.cols = ctx.world.instances('circo:portico-col', colGeo, 'stucco', { collide: 'box', maxDistance: 700 });
    // mercadorias (instanciadas, só de perto)
    const inst = (k, geo, mat) => ctx.world.instances(`circo:${k}`, geo, mat, { maxDistance: 90, castShadow: false });
    this.goods = {
      amphora: inst('amphora', propGeometry('amphora'), 'terracotta'),
      dolium: inst('dolium', propGeometry('dolium'), 'terracotta'),
      jar: inst('jar', propGeometry('jar'), 'terracotta'),
      sack: inst('sack', propGeometry('sack'), 'cloth'),
      basket: inst('basket', propGeometry('basket'), 'woodLight'),
      crate: inst('crate', propGeometry('crate'), 'wood'),
    };
    this.merchants = [];
  }

  /** Converte ponto local do builder (quadro atual) para o mundo. */
  w(x, yy, z) {
    return this.b.toWorld(x, yy, z);
  }

  /** Rumo NPC (atan2(dx,dz) no mundo) de uma direção local (dx, dz). */
  yaw(x, z, dx, dz) {
    const p0 = this.w(x, 0, z);
    const p1 = this.w(x + dx, 0, z + dz);
    return Math.atan2(p1.x - p0.x, p1.z - p0.z);
  }

  push(x, yy, z, r) {
    this.b.push(x, yy, z, r);
    this.det.push(x, yy, z, r);
  }

  pop() {
    this.b.pop();
    this.det.pop();
  }

  /** Coluna do pórtico na aresta e(r) da forma. */
  column(sh, e) {
    const p = this.w(e(R.colonnade), y(0), zOf(sh, R.colonnade));
    this.cols.add(p.x, p.y, p.z, 0, 1);
  }

  /** Coluna do pórtico em x local (lados retos). */
  columnAt(x) {
    const p = this.w(x, y(0), -R.colonnade);
    this.cols.add(p.x, p.y, p.z, 0, 1);
  }

  /** Pórtico externo (viga, telhado de uma água, piso) sobre a forma. */
  portico(sh) {
    const b = this.b;
    slab(b, sh, R.colonnade - 0.36, R.colonnade + 0.36, y(H.colH), y(H.colH + 0.45), 'woodDark', { collide: false });
    const rA = R.facade;
    const rB = R.portico + 0.45;
    const yA = y(5.15);
    const yB = y(H.colH + 0.38);
    const P = (r, e, yy) => [e(r), yy, zOf(sh, r)];
    quadUp(b, P(rA, sh.e0, yA), P(rA, sh.e1, yA), P(rB, sh.e1, yB), P(rB, sh.e0, yB), 'roofTile');
    quadDown(b, P(rA, sh.e0, yA - 0.12), P(rA, sh.e1, yA - 0.12), P(rB, sh.e1, yB - 0.12), P(rB, sh.e0, yB - 0.12), 'woodDark');
    slab(b, sh, R.facade, R.portico, Y0, y(0.06), 'slabsTufa', { collide: false });
  }

  /** Rua de basalto (silex) em volta do circo (Lív. 41.27.5: ruas da cidade pavimentadas de silex desde 174 a.C.). */
  street(sh) {
    slab(this.b, sh, R.portico, R.street1, Y0, y(0.04), 'basalt', { collide: false });
  }

  /** Revestimento do fosso do lado da arena e espelho d'água. */
  euripus(sh, waterFrom = null) {
    const b = this.b;
    slab(b, sh, R.curb, R.arena, y(H.found), y(0.12), 'tufa', { color: [0.92, 0.9, 0.85] });
    let wsh = sh;
    if (waterFrom != null) wsh = sub(sh, K(waterFrom.x0), K(waterFrom.x1));
    const P = (r, e) => [e(r), y(H.water), zOf(wsh, r)];
    quadUp(b, P(R.arena, wsh.e0), P(R.arena, wsh.e1), P(R.euripus, wsh.e1), P(R.euripus, wsh.e0), 'water');
  }

  /** Loja completa (frente, janelas, balcão, mercadorias, lojista). */
  shop(sh, xm, kindPool) {
    const b = this.b;
    const rng = this.rng;
    const closed = shopFront(b, sh, xm, rng);
    upperFacade(b, sh, rng);
    windows(b, sh, xm, rng);
    this.stats.shops++;
    if (closed) return;
    const det = this.det;
    // balcão de alvenaria na frente (meia largura) — como nas tabernae (arch/buildings.js)
    if (rng() < 0.7) det.box(1.4, 0.95, 0.55, xm - 0.75, Y0, zOf(sh, R.out - 0.8), { mat: 'opusIncertum', collide: true });
    const kind = kindPool[Math.floor(rng() * kindPool.length)];
    const zBack = zOf(sh, R.back + 0.45);
    const put = (name, x, zz, s = 1, yy = Y0) => {
      const p = det.toWorld(x, yy, zz);
      this.goods[name].add(p.x, p.y, p.z, rng() * 6.28, s);
    };
    const span = 2.6;
    if (kind === 'oleum') {
      // azeite e vinho em ânforas encostadas ao fundo (mercadorias inflamáveis — Tác. Ann. 15.38)
      for (let i = 0; i < 6; i++) put('amphora', xm - span / 2 + (span * i) / 5, zBack + (i % 2) * 0.3, 0.95);
      put('dolium', xm + 1.2, zOf(sh, R.back + 1.6), 0.9);
    } else if (kind === 'vestis') {
      // tecidos em fardos sobre prateleira de madeira
      det.box(2.8, 0.06, 0.6, xm, y(1.2), zOf(sh, R.back + 0.35), { mat: 'wood', collide: false });
      det.box(2.8, 0.06, 0.6, xm, y(1.9), zOf(sh, R.back + 0.35), { mat: 'wood', collide: false });
      const cols = ['#c9bfa6', '#8e3b2c', '#d8ccb0', '#6b5a3a', '#4d5a6a', '#e6dcc6'];
      for (let i = 0; i < 5; i++) {
        for (const sy of [1.26, 1.96]) {
          if (rng() < 0.25) continue;
          det.box(0.45, 0.28, 0.5, xm - 1.1 + i * 0.55, y(sy), zOf(sh, R.back + 0.35), { mat: 'cloth', color: cols[Math.floor(rng() * cols.length)], collide: false });
        }
      }
    } else if (kind === 'figlina') {
      for (let i = 0; i < 7; i++) put('jar', xm - 1.2 + i * 0.4, zBack + rng() * 0.3, 1 + rng() * 0.3);
      put('dolium', xm + 1.1, zOf(sh, R.back + 1.3));
      put('amphora', xm - 1.0, zOf(sh, R.back + 1.5), 0.9);
    } else if (kind === 'frumentum') {
      for (let i = 0; i < 5; i++) put('sack', xm - 1.1 + i * 0.55, zBack + (i % 2) * 0.4);
      put('basket', xm + 0.6, zOf(sh, R.out - 0.5), 1.2);
      put('basket', xm + 1.2, zOf(sh, R.out - 0.6), 1.0);
    } else if (kind === 'lignum') {
      // madeira e palha (inflamáveis — Tác. Ann. 15.38)
      for (let i = 0; i < 4; i++) put('crate', xm - 1.0 + i * 0.65, zBack, 1 + rng() * 0.3);
      for (let i = 0; i < 3; i++) det.box(1.0, 0.5, 0.55, xm - 0.6 + i * 0.4, y(0.6 + i * 0.02), zOf(sh, R.back + 1.4), { mat: 'cloth', color: '#c8b06a', collide: false, rotY: (rng() - 0.5) * 0.4 });
      for (let i = 0; i < 5; i++) det.cylinder(0.08, 0.08, 2.2, xm + 1.25, y(0), zOf(sh, R.back + 0.3 + i * 0.18), { mat: 'wood', segments: 6, collide: false, rotY: 0 });
    } else {
      // popina: pão e jarros no balcão
      put('jar', xm - 1.1, zOf(sh, R.out - 0.75), 0.9, y(0.95));
      put('jar', xm - 0.6, zOf(sh, R.out - 0.85), 0.8, y(0.95));
      put('dolium', xm + 1.1, zBack + 0.2, 1.0);
      det.box(0.7, 0.04, 0.45, xm - 0.9, y(0.97), zOf(sh, R.out - 0.6), { mat: 'woodLight', collide: false });
    }
    // lojista (alguns)
    if (rng() < 0.3) {
      const p = this.w(xm + 0.4, Y0, zOf(sh, R.out - 1.5));
      this.merchants.push({ x: p.x, z: p.z, y: Y0, yaw: this.yaw(xm, zOf(sh, R.out - 1.5), 0, -1), type: 'merchant', pose: rng() < 0.5 ? 'work' : 'gesture' });
    }
  }

  /** Vomitório: escada dos espectadores atravessando o bloco de lojas até o corredor da cávea. */
  vomitorium(sh, xm) {
    const b = this.b;
    const rng = this.rng;
    const depth = (R.facade - R.back) * Math.cos(sh.h);
    b.stairs(3.4, depth, H.praec, xm, Y0, zOf(sh, R.facade), { mat: 'tufa', faces: { bottom: false } });
    // muros laterais (com guarda-corpo de 1 m acima do corredor)
    slab(b, sub(sh, sh.e0, K(xm - 1.7)), R.back, R.out, y(-0.2), y(H.praec + 1.0), 'opusIncertum');
    slab(b, sub(sh, K(xm + 1.7), sh.e1), R.back, R.out, y(-0.2), y(H.praec + 1.0), 'opusIncertum');
    // fachada com arco de entrada
    const wallT = tint(rng, [0.93, 0.86, 0.74], 0.1);
    for (const [e0, e1] of [[sh.e0, K(xm - 2.2)], [K(xm + 2.2), sh.e1]]) {
      slab(b, sub(sh, e0, e1), R.out, R.facade, y(-0.5), y(H.shop), 'opusIncertum');
      slab(b, sub(sh, e0, e1), R.out, R.facade, y(H.shop), y(H.parapetTop), 'plaster', { color: wallT });
    }
    for (const [e0, e1] of [[K(xm - 2.2), K(xm - 1.7)], [K(xm + 1.7), K(xm + 2.2)]]) slab(b, sub(sh, e0, e1), R.out, R.facade, y(-0.5), y(3.0), 'travertine');
    const zMid = zOf(sh, (R.out + R.facade) / 2);
    arch(b, xm, y(3.0), zMid, 3.4, 0.6 * Math.cos(sh.h), { mat: 'travertine', thickness: 0.5, segments: 8 });
    slab(b, sub(sh, K(xm - 2.2), K(xm + 2.2)), R.out, R.facade, y(5.2), y(H.parapetTop), 'plaster', { color: wallT });
    slab(b, sh, R.facade, R.facade + 0.28, y(H.parapetTop - 0.32), y(H.parapetTop), 'travertine', { collide: false });
    // número pintado sobre o arco (as entradas eram identificáveis — HIPÓTESE decorativa)
    b.box(0.9, 0.42, 0.03, xm, y(5.45), zOf(sh, R.facade) - 0.02, { mat: 'flat', color: '#8e2a1e', collide: false });
    this.stats.vomitoria++;
  }

  /** Muro de testa das arquibancadas junto à passagem das carceres. */
  endWall(sh) {
    const b = this.b;
    slab(b, sh, R.euripus, R.facade, y(H.found), y(H.parapetTop), 'opusIncertum', { color: [0.95, 0.92, 0.88] });
    slab(b, sh, R.facade, R.portico, y(-0.2), y(5.2), 'opusIncertum', { color: [0.95, 0.92, 0.88] });
    // muro de testa do fosso + escada de manutenção (permite sair do euripus)
    slab(b, sh, R.curb, R.euripus, y(H.found), y(0.12), 'tufa');
  }

  /* --------------------------------------------------------------------- */
  /*  Lados retos                                                          */
  /* --------------------------------------------------------------------- */

  /**
   * Um lado reto inteiro. s = −1 (Palatino, Z < 0) ou +1 (Aventino, Z > 0).
   * No quadro do lado, x local = X (s = −1) ou −X (s = +1); −z local aponta para fora.
   */
  side(s) {
    const lx = (X) => (s < 0 ? X : -X);
    const S = (Xa, Xb) => {
      const a = lx(Xa);
      const c = lx(Xb);
      return { e0: K(Math.min(a, c)), e1: K(Math.max(a, c)), h: 0 };
    };
    this.push(0, 0, 0, s < 0 ? 0 : Math.PI);
    // muro de testa (junto às carceres)
    this.endWall(S(STANDS_X0, RUN_X0));
    // escada de manutenção dentro do fosso, subindo para o lado das carceres
    {
      const zc = -(R.arena + R.euripus) / 2;
      const len = 4.2;
      this.b.push(lx(RUN_X0 + len), 0, zc, s < 0 ? Math.PI / 2 : -Math.PI / 2);
      this.b.stairs(R.euripus - R.arena - 0.04, len, -H.channel + 0.12, 0, y(H.channel), 0, { mat: 'tufa', faces: { bottom: false } });
      this.b.pop();
    }
    for (let blk = 0; blk < BLOCKS; blk++) {
      const X0 = RUN_X0 + blk * MODS * MOD_W;
      const X1 = X0 + MODS * MOD_W;
      const Xm = (i) => X0 + (i + 0.5) * MOD_W;
      const sh = S(X0, X1);
      // arquibancada de pedra: corredores-escada no módulo 0 e no vomitório
      this.stoneTier(sh, [lx(Xm(0)), lx(Xm(VOM_MOD))]);
      // arquibancada de madeira: interrompida pelo vomitório
      this.woodTier(S(X0, Xm(VOM_MOD) - MOD_W / 2), [lx(Xm(0))]);
      this.woodTier(S(Xm(VOM_MOD) + MOD_W / 2, X1), []);
      // módulos (lojas e vomitório)
      for (let i = 0; i < MODS; i++) {
        const msh = S(Xm(i) - MOD_W / 2, Xm(i) + MOD_W / 2);
        if (i === VOM_MOD) this.vomitorium(msh, lx(Xm(i)));
        else this.shop(msh, lx(Xm(i)), ['oleum', 'vestis', 'figlina', 'frumentum', 'popina', 'popina']);
        // coluna no início (em X) de cada módulo; a do fim do último vem da meia-lua
        this.columnAt(lx(Xm(i) - MOD_W / 2));
      }
      this.portico(sh);
      this.street(sh);
      // fosso: o espelho d'água começa depois da escada de manutenção do bloco 0
      const wf = blk === 0 ? S(RUN_X0 + 4.3, X1) : null;
      this.euripus(sh, wf ? { x0: wf.e0(), x1: wf.e1() } : null);
    }
    this.pop();
  }

  stoneTier(sh, aisles) {
    stoneTier(this.b, sh, aisles, this.rng);
  }

  woodTier(sh, aisles) {
    woodTier(this.b, sh, aisles, this.rng);
  }

  /* --------------------------------------------------------------------- */
  /*  Meia-lua (extremidade ESE)                                            */
  /* --------------------------------------------------------------------- */

  curve(onApex) {
    const h = Math.PI / CURVE.n / 2;
    for (let k = 0; k < CURVE.n; k++) {
      const phi = curveAngle(k);
      this.push(XC, 0, 0, outwardRot(phi));
      const sh = { e0: (r) => -r * Math.sin(h), e1: (r) => r * Math.sin(h), h };
      const vom = CURVE.vomitoria.includes(k);
      this.stoneTier(sh, CURVE.stoneAisles.includes(k) ? [0] : []);
      if (vom) this.vomitorium(sh, 0);
      else {
        this.woodTier(sh, CURVE.woodAisles.includes(k) ? [0] : []);
        // lojas da extremidade curva: mercadorias inflamáveis (Tác. Ann. 15.38)
        this.shop(sh, 0, ['oleum', 'lignum', 'vestis', 'oleum', 'lignum']);
      }
      this.column(sh, sh.e0);
      if (k === CURVE.n - 1) this.column(sh, sh.e1);
      if (k === CURVE.apex) onApex?.(this, sh);
      else this.portico(sh);
      this.street(sh);
      this.euripus(sh);
      this.pop();
    }
  }
}

export { slab, zOf, K, sub, quadUp, quadDown };
