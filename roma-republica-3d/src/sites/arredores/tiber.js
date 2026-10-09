/**
 * Tibre: pontes (Emília, Fabrícia, Sublícia), cais do porto do Forum Boarium, foz da Cloaca
 * Máxima e barcos.
 *
 * Base documental (docs/pesquisa/10 §6; 09 §3):
 *   - Pons Aemilius: pilares contratados por M. Fúlvio em 179 a.C., arcos postos depois pelos
 *     censores P. Cipião Africano e L. Múmio (Lív. 40.51.4); de PEDRA. Nº de arcos, vãos e
 *     largura: NÃO ENCONTRADO → 6 arcos segmentais (hipótese).
 *   - Pons Fabricius: ponte de pedra para a Ilha, construída em 62 a.C. (Dião 37.45.3). Nº de
 *     arcos: NÃO ENCONTRADO → dois arcos com abertura de alívio no pilar central (hipótese).
 *   - Pons Sublicius: de MADEIRA, sem pregos de ferro, por razão religiosa (Plín. NH 36.100);
 *     a jusante da Ilha, perto do Forum Boarium; posição exata NÃO ENCONTRADA.
 *   - Pons Cestius: existência em 44 a.C. NÃO ENCONTRADA → não modelado (fica fora da área).
 *   - Escadas do Tibre ao emporium em 174 a.C. (Lív. 41.27.8) e barcos subindo o rio
 *     (Dion. 9.68.2): justificam cais com escadas e barcos no porto (forma: hipótese).
 *   - Cloaca Máxima: deságua no Tibre; foz no ponto OSM (−394,7; 408,1); forma do arco da foz
 *     NÃO ENCONTRADA (nota 09 §3) → arco simples rotulado como hipótese.
 */
import * as THREE from 'three';
import * as G from '../../render/geom.js';
import { nearestTiber, bankLine, beam, boatInto, mat } from './util.js';
import { Y, QUAY_D } from './terrain.js';

const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Quadrilátero com a face voltada para a normal n (reordena os vértices se preciso). */
function oquad(b, A, B, C, D, n, o) {
  const ab = new THREE.Vector3(B[0] - A[0], B[1] - A[1], B[2] - A[2]);
  const ac = new THREE.Vector3(C[0] - A[0], C[1] - A[1], C[2] - A[2]);
  const c = ab.cross(ac);
  if (c.x * n[0] + c.y * n[1] + c.z * n[2] >= 0) b.quad(A, B, C, D, o);
  else b.quad(D, C, B, A, o);
}

/** Caixa inclinada (eixo longo ao longo de Z local) entre (z0,y0) e (z1,y1), centrada em x. */
function slopedBox(b, x, z0, y0, z1, y1, w, h, o) {
  const len = Math.hypot(z1 - z0, y1 - y0);
  const g = G.box(w, h, len + 0.02);
  const m = new THREE.Matrix4().makeRotationX(-Math.atan2(y1 - y0, z1 - z0));
  m.setPosition(x, (y0 + y1) / 2, (z0 + z1) / 2);
  b.add(g, { ...o, matrix: m });
}

/**
 * Ponte de pedra em arcos segmentais entre A e B (pontos [x, z] do mundo).
 * Quadro local: origem em A, +Z de A para B.
 * @param {object} o { W (largura), yA, yB, yTop, flat:[s0,s1] (trecho no topo), arches:[{s, span, rise}],
 *   ySpring, piers (largura), mats:{ body, arch, deck, coping } }
 */
function stoneBridge(b, A, B, o) {
  const dx = B[0] - A[0];
  const dz = B[1] - A[1];
  const L = Math.hypot(dx, dz);
  const W = o.W;
  const hw = W / 2;
  const M = { body: 'tufa', arch: 'peperino', deck: 'basalt', coping: 'travertine', ...(o.mats || {}) };
  const [f0, f1] = o.flat;
  const yDeck = (s) => {
    if (s <= f0) return o.yA + (o.yTop - o.yA) * smooth(0, f0, s);
    if (s >= f1) return o.yB + (o.yTop - o.yB) * smooth(L, f1, s);
    return o.yTop;
  };
  const tDeck = 0.9;
  b.push(A[0], 0, A[1], Math.atan2(dx, dz));
  // ---- tabuleiro (pavimento + parapeitos) em segmentos de ~3 m ----
  const n = Math.max(4, Math.ceil(L / 3));
  const pw = 0.45; // parapeito
  const ph = 1.0;
  for (let i = 0; i < n; i++) {
    const s0 = (L * i) / n;
    const s1 = (L * (i + 1)) / n;
    const y0 = yDeck(s0);
    const y1 = yDeck(s1);
    b.quad([-hw, y0, s0], [hw, y0, s0], [hw, y1, s1], [-hw, y1, s1], { mat: M.deck });
    b.colliderRamp(W - 2 * pw, 0, s0, y0, s1, y1);
    for (const sx of [-1, 1]) {
      slopedBox(b, sx * (hw - pw / 2), s0, y0, s1, y1, pw, ph, { mat: M.body, collide: true });
      slopedBox(b, sx * (hw - pw / 2), s0, y0 + ph, s1, y1 + ph, pw + 0.12, 0.14, { mat: M.coping, collide: false });
      // faces laterais do tabuleiro (cornija) até a espessura do tabuleiro
      oquad(b, [sx * hw, y0 - tDeck, s0], [sx * hw, y1 - tDeck, s1], [sx * hw, y1, s1], [sx * hw, y0, s0], [sx, 0, 0], { mat: M.body });
    }
  }
  // ---- arcos (intradorso + tímpanos até o tabuleiro) ----
  const ySp = o.ySpring;
  for (const a of o.arches) {
    const half = a.span / 2;
    // flecha limitada para o extradorso ficar sob o tabuleiro
    const thick0 = Math.max(0.8, a.span * 0.08);
    a.rise = Math.max(1.5, Math.min(a.rise ?? a.span * 0.4, yDeck(a.s) - tDeck - thick0 - 0.3 - o.ySpring));
    const R = (half * half + a.rise * a.rise) / (2 * a.rise);
    const yc = ySp + a.rise - R;
    const al = Math.asin(Math.min(1, half / R));
    const seg = 10;
    const thick = Math.max(0.8, a.span * 0.08);
    const pts = [];
    for (let k = 0; k <= seg; k++) {
      const ph2 = -al + (2 * al * k) / seg;
      pts.push([a.s + R * Math.sin(ph2), yc + R * Math.cos(ph2), ph2]);
    }
    for (let k = 0; k < seg; k++) {
      const [z0, y0, p0] = pts[k];
      const [z1, y1, p1] = pts[k + 1];
      const pm = (p0 + p1) / 2;
      // intradorso (normal para o centro do círculo)
      oquad(b, [-hw, y0, z0], [hw, y0, z0], [hw, y1, z1], [-hw, y1, z1], [0, -Math.cos(pm), -Math.sin(pm)], { mat: M.arch });
      for (const sx of [-1, 1]) {
        const t0 = yDeck(z0) - tDeck;
        const t1 = yDeck(z1) - tDeck;
        // aduelas (faixa do arco) e tímpano acima delas
        const r2 = R + thick;
        const za = a.s + r2 * Math.sin(p0);
        const ya = yc + r2 * Math.cos(p0);
        const zb = a.s + r2 * Math.sin(p1);
        const yb = yc + r2 * Math.cos(p1);
        oquad(b, [sx * (hw + 0.02), y0, z0], [sx * (hw + 0.02), y1, z1], [sx * (hw + 0.02), yb, zb], [sx * (hw + 0.02), ya, za], [sx, 0, 0], { mat: M.arch });
        oquad(b, [sx * hw, ya, za], [sx * hw, yb, zb], [sx * hw, Math.max(yb, t1), z1], [sx * hw, Math.max(ya, t0), z0], [sx, 0, 0], { mat: M.body });
      }
    }
    // pés dos arcos até o leito
    a._z0 = a.s - half;
    a._z1 = a.s + half;
  }
  // ---- pilares (entre arcos) e encontros (nas pontas) ----
  const sorted = [...o.arches].sort((p, q) => p.s - q.s);
  const solids = [];
  solids.push([0, sorted[0]._z0]);
  for (let i = 0; i < sorted.length - 1; i++) solids.push([sorted[i]._z1, sorted[i + 1]._z0]);
  solids.push([sorted[sorted.length - 1]._z1, L]);
  solids.forEach(([z0, z1], i) => {
    if (z1 - z0 < 0.05) return;
    const ends = i === 0 || i === solids.length - 1;
    const top = Math.min(yDeck(z0), yDeck(z1)) - tDeck + 0.02;
    const bottom = -11;
    b.box(W, top - bottom, z1 - z0, 0, bottom, (z0 + z1) / 2, { mat: M.body, collide: !ends });
    if (!ends) {
      // quebra-mar (talha-mar) a montante e a jusante
      const up = o.upstream ?? -1;
      for (const side of [up, -up]) {
        const pts = [[side * hw, z0], [side * (hw + (z1 - z0) * 0.7), (z0 + z1) / 2], [side * hw, z1]];
        b.prism(pts, Y.water + 1.6 - bottom, bottom, { mat: M.body, collide: true });
      }
      // abertura de alívio (pequeno arco) no pilar, se pedido
      if (o.reliefArch && z1 - z0 > 3) {
        const zc = (z0 + z1) / 2;
        const yr = Math.max(ySp + 2, top - 3.2);
        b.box(W + 0.06, 1.6, 1.6, 0, yr, zc, { mat: 'flat', color: '#2b2620', collide: false });
      }
    }
  });
  b.pop();
  return { L, yDeck };
}

/** Ponte de madeira sobre estacas (Sublícia): sem ferro — só encaixes e cavilhas (Plín. 36.100). */
function woodBridge(b, A, B, o) {
  const dx = B[0] - A[0];
  const dz = B[1] - A[1];
  const L = Math.hypot(dx, dz);
  const W = o.W;
  const hw = W / 2;
  const yDeck = (s) => {
    const t = s / L;
    const base = o.yA + (o.yB - o.yA) * t;
    return base + Math.sin(Math.PI * t) * o.hump;
  };
  b.push(A[0], 0, A[1], Math.atan2(dx, dz));
  const n = Math.max(6, Math.ceil(L / 3));
  for (let i = 0; i < n; i++) {
    const s0 = (L * i) / n;
    const s1 = (L * (i + 1)) / n;
    const y0 = yDeck(s0);
    const y1 = yDeck(s1);
    slopedBox(b, 0, s0, y0 - 0.18, s1, y1 - 0.18, W, 0.18, { mat: 'wood', collide: false });
    b.colliderRamp(W - 0.5, 0, s0, y0, s1, y1);
    for (const sx of [-1, 1]) {
      slopedBox(b, sx * (hw - 0.1), s0, y0 + 0.95, s1, y1 + 0.95, 0.14, 0.14, { mat: 'woodDark', collide: false });
      slopedBox(b, sx * (hw - 0.1), s0, y0, s1, y1, 0.12, 1.0, { mat: 'woodDark', collide: true, color: '#6b5a48' });
      // vigas longitudinais (longarinas) sob o tabuleiro
      slopedBox(b, sx * (hw - 0.6), s0, y0 - 0.65, s1, y1 - 0.65, 0.35, 0.45, { mat: 'woodDark', collide: false });
    }
    for (const sx of [-1, 1]) b.box(0.14, 1.1, 0.14, sx * (hw - 0.1), y0, s0, { mat: 'woodDark', collide: false });
  }
  // cavaletes de estacas
  const bentStep = o.bentStep ?? 7.5;
  for (let s = bentStep; s < L - 2; s += bentStep) {
    const yt = yDeck(s) - 0.65;
    const xs = [-hw + 0.5, -hw * 0.35, hw * 0.35, hw - 0.5];
    for (const x of xs) b.cylinder(0.2, 0.17, yt + 11, x, -11, s, { mat: 'woodDark', segments: 7, collide: true });
    b.box(W + 0.6, 0.4, 0.45, 0, yt - 0.4, s, { mat: 'woodDark', collide: false });
    // contraventamento em X (acima da água)
    beam(b, [xs[0], Y.water + 0.3, s], [xs[3], yt - 0.4, s], 0.14, { mat: 'wood' });
    beam(b, [xs[3], Y.water + 0.3, s], [xs[0], yt - 0.4, s], 0.14, { mat: 'wood' });
    // quebra-gelo/defensa a montante
    beam(b, [(o.upstream ?? -1) * (hw + 2.2), -9, s], [(o.upstream ?? -1) * (hw - 0.4), yt - 0.6, s], 0.25, { mat: 'woodDark' });
  }
  b.pop();
  return { L, yDeck };
}

/** Constrói o Tibre do sítio. Devolve dados úteis (cabeceiras das pontes, linha do cais). */
export function buildTiber(ctx, rnd) {
  const T = ctx.terrain;
  const b = ctx.builder('arredores-tibre', { chunkSize: 160 });
  const res = { bridges: {} };

  // ------------------------------------------------------------------ Pons Aemilius
  {
    const q = nearestTiber(-466.3, 352.1);
    const px = q.tz; // perpendicular (para leste) = (tz, −tx)
    const pz = -q.tx;
    const A = [q.x + px * 75, q.z + pz * 75]; // cabeceira leste (Forum Boarium)
    const Bp = [q.x - px * 75, q.z - pz * 75]; // cabeceira oeste
    const L = 150;
    const arches = [];
    const spans = [16, 18, 18, 18, 18, 16];
    const pier = 4;
    const total = spans.reduce((s, v) => s + v, 0) + pier * (spans.length - 1);
    let s = (L - total) / 2;
    for (let i = 0; i < spans.length; i++) {
      arches.push({ s: s + spans[i] / 2, span: spans[i], rise: spans[i] * 0.36 });
      s += spans[i] + pier;
    }
    const yA = T.heightAt(A[0], A[1]);
    const yB = T.heightAt(Bp[0], Bp[1]);
    stoneBridge(b, A, Bp, { W: 8.2, yA, yB, yTop: 2.0, flat: [50, L - 50], arches, ySpring: Y.water - 0.6, upstream: -1 });
    res.bridges.aemilius = { A, B: Bp, yA, yB, mid: [q.x, q.z], yTop: 2.0 };
  }

  // ------------------------------------------------------------------ Pons Fabricius
  {
    // perpendicular ao eixo pelo ponto Pleiades (−560,5; 158,1): da Ilha (d = 32) à margem (d = 96)
    const q = nearestTiber(-560.5, 158.1);
    const px = q.tz;
    const pz = -q.tx;
    const Ai = [q.x + px * 32, q.z + pz * 32];
    const Bb = [q.x + px * 96, q.z + pz * 96];
    const L = 64;
    const yA = T.heightAt(Ai[0], Ai[1]);
    const yB = T.heightAt(Bb[0], Bb[1]);
    stoneBridge(b, Ai, Bb, {
      W: 6.4, yA, yB, yTop: 0.5, flat: [28, 36],
      arches: [{ s: 23.5, span: 15, rise: 4.6 }, { s: 41.5, span: 15, rise: 4.6 }],
      ySpring: Y.water - 0.4, upstream: 1, reliefArch: true,
      mats: { body: 'tufa', arch: 'peperino', deck: 'basalt', coping: 'travertine' },
    });
    res.bridges.fabricius = { A: Ai, B: Bb, yA, yB };
  }

  // ------------------------------------------------------------------ Pons Sublicius (madeira)
  {
    const q = nearestTiber(-484, 440);
    const px = q.tz;
    const pz = -q.tx;
    const A = [q.x + px * 66, q.z + pz * 66];
    const Bw = [q.x - px * 68, q.z - pz * 68];
    const yA = T.heightAt(A[0], A[1]);
    const yB = T.heightAt(Bw[0], Bw[1]);
    woodBridge(b, A, Bw, { W: 5.2, yA: yA + 0.05, yB: yB + 0.05, hump: 1.4, upstream: -1 });
    res.bridges.sublicius = { A, B: Bw, yA, yB };
  }

  // ------------------------------------------------------------------ cais do porto (margem leste)
  const quay = bankLine(QUAY_D, -1, 316, 490);
  res.quay = quay;
  const top = Y.boarium;
  for (let i = 0; i < quay.length - 1; i++) {
    const [xa, za] = quay[i];
    const [xb, zb] = quay[i + 1];
    // recua meia espessura para dentro da margem (normal leste)
    const nx = -(zb - za);
    const nz = xb - xa;
    const nl = Math.hypot(nx, nz) || 1;
    // normal apontando para terra (leste): a que tem componente x positiva
    const sx = nx / nl > 0 ? nx / nl : -nx / nl;
    const sz = nx / nl > 0 ? nz / nl : -nz / nl;
    const off = 0.7;
    b.wallAB(xa + sx * off, za + sz * off, xb + sx * off, zb + sz * off, top - 0.04 + 9.5, 1.4, { y: -9.5, mat: 'tufa' });
    const len = Math.hypot(xb - xa, zb - za);
    const ang = Math.atan2(-(zb - za), xb - xa);
    b.push((xa + xb) / 2 + sx * 0.6, 0, (za + zb) / 2 + sz * 0.6, ang);
    b.box(len + 0.05, 0.3, 1.5, 0, top - 0.26, 0, { mat: 'travertine', collide: false });
    b.pop();
  }
  // escadas descendo à água, encostadas ao muro do cais, e argolas de amarração (marcos)
  const stairSpots = [];
  for (const zz of [380, 452]) {
    let best = 0;
    for (let i = 0; i < quay.length; i++) if (Math.abs(quay[i][1] - zz) < Math.abs(quay[best][1] - zz)) best = i;
    const p = quay[best];
    const p2 = quay[Math.min(quay.length - 1, best + 1)];
    const tx = p2[0] - p[0];
    const tz = p2[1] - p[1];
    const tl = Math.hypot(tx, tz) || 1;
    // quadro: +X ao longo do cais (rio abaixo), +Z para o rio (oeste)
    const rot = Math.atan2(tz / tl, tx / tl) * -1;
    b.push(p[0], 0, p[1], rot);
    const yLand = Y.water + 0.25;
    b.box(7.4, yLand + 9.5, 2.6, -2.7, -9.5, 1.3, { mat: 'tufa', collide: false }); // maciço da escada
    b.push(0, 0, 1.25, Math.PI / 2);
    b.stairs(2.4, 7.2, top - yLand, 0, yLand, 0.9, { mat: 'travertine' });
    b.pop();
    b.box(3.4, 0.35, 2.6, 2.6, yLand - 0.35, 1.3, { mat: 'travertine' }); // patamar junto à água
    b.colliderBox(3.4, 0.35, 2.6, 2.6, yLand - 0.35, 1.3);
    b.pop();
    stairSpots.push({ x: p[0], z: p[1], rot, yLand });
  }
  res.stairs = stairSpots;
  // marcos de amarração ao longo do cais
  for (let i = 1; i < quay.length - 1; i += 2) {
    const [x, z] = quay[i];
    b.cylinder(0.22, 0.18, 0.7, x + 1.2, top, z, { mat: 'peperino', segments: 8, collide: true });
  }

  // ------------------------------------------------------------------ foz da Cloaca Máxima
  {
    // no cais, no ponto mais próximo da foz OSM (−394,7; 408,1) — deslocada ~24 m para o rio
    let best = 0;
    for (let i = 0; i < quay.length; i++) if (Math.hypot(quay[i][0] + 394.7, quay[i][1] - 408.1) < Math.hypot(quay[best][0] + 394.7, quay[best][1] - 408.1)) best = i;
    const p = quay[best];
    const p2 = quay[best + 1];
    const rot = -Math.atan2(p2[1] - p[1], p2[0] - p[0]);
    b.push(p[0], 0, p[1], rot);
    // arco de aduelas de peperino saliente do muro e boca escura
    const span = 3.6;
    const ys = Y.water + 0.2;
    b.box(span + 0.2, 2.2, 0.3, 0, ys, -0.05, { mat: 'flat', color: '#1d1a16', collide: false });
    b.push(0, 0, 0.35);
    for (let k = 0; k < 9; k++) {
      const a0 = Math.PI - (k / 9) * Math.PI;
      const a1 = Math.PI - ((k + 1) / 9) * Math.PI;
      const am = (a0 + a1) / 2;
      const r = span / 2 + 0.35;
      b.box(0.62, 0.7, 0.75, Math.cos(am) * r, ys + 1.6 + Math.sin(am) * r - 0.35, 0, { mat: 'peperino', rotY: 0, collide: false });
    }
    b.pop();
    // fio d'água escuro saindo da boca
    b.quad([-1.6, Y.water + 0.25, 0.2], [1.6, Y.water + 0.25, 0.2], [1.9, Y.water + 0.05, 4.5], [-1.9, Y.water + 0.05, 4.5], { mat: 'water', color: '#5b5a44' });
    b.pop();
    res.cloaca = { x: p[0], z: p[1] };
  }

  // ------------------------------------------------------------------ barcos
  const boats = [];
  const addBoat = (x, z, heading, L, W, opts = {}) => {
    b.push(x, Y.water - 0.25, z, heading);
    boatInto(b, L, W, opts);
    b.pop();
    boats.push({ x, z });
  };
  // atracados no cais (paralelos ao muro, a ~2,5 m da face)
  const hd = (i) => Math.atan2(quay[i + 1][0] - quay[i][0], quay[i + 1][1] - quay[i][1]);
  const moor = [3, 6, 9, 12, 14];
  moor.forEach((i, k) => {
    if (i >= quay.length - 1) return;
    const [x, z] = quay[i];
    const q = nearestTiber(x, z);
    addBoat(x + q.nx * 3.2, z + q.nz * 3.2, hd(i), k % 2 ? 9 : 12, k % 2 ? 2.8 : 3.6, { cargo: k % 2 ? 4 : 6, mast: k === 1, color: k % 3 ? '#7a6048' : '#5d4a3a' });
  });
  // no meio do rio (subindo, à vela, e barcos menores)
  for (const [zz, off, L, W, mast] of [[300, -10, 14, 4, true], [420, 18, 7, 2, false], [500, -22, 10, 3, true], [262, 6, 6, 1.8, false]]) {
    const q = nearestTiber(-480, zz);
    addBoat(q.x + q.nx * off, q.z + q.nz * off, Math.atan2(q.tx, q.tz) + (off > 0 ? Math.PI : 0), L, W, { mast, cargo: mast ? 3 : 0, color: '#6a5442' });
  }
  res.boats = boats;
  b.finish();
  return res;
}
