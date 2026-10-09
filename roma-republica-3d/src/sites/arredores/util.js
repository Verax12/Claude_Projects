/**
 * Utilidades do sítio "arredores" (Velabro, Forum Boarium/Holitorium, Tibre, Campo de Marte).
 *
 * Contém:
 *   - geometria do Tibre: a mesma linha suavizada que o motor usa para a superfície da água
 *     (Terrain.buildRiver: Chaikin ×3 e reamostragem a cada ~20 m), com pontos mais próximos e
 *     linhas deslocadas para as margens;
 *   - captura de geometria de um Builder temporário (para instanciar objetos repetidos);
 *   - componentes genéricos do sítio: arco em leque (cávea), muro arruinado, guindaste de roda,
 *     andaime, barco fluvial, boi, monte de entulho, telhado de duas águas simples etc.
 *
 * Nenhum número histórico mora aqui: as dimensões dos edifícios são passadas pelos módulos que
 * citam as notas de pesquisa (docs/pesquisa/08, 09, 10, 11).
 */
import * as THREE from 'three';
import * as G from '../../render/geom.js';
import { TIBER } from '../../data/topography.js';

export const DEG = Math.PI / 180;

/* -------------------------------------------------------------------------- */
/*  Tibre                                                                      */
/* -------------------------------------------------------------------------- */

let _tiber = null;

/**
 * Linha central do Tibre suavizada exatamente como em Terrain.buildRiver.
 * @returns {Array<{x:number,z:number,tx:number,tz:number,nx:number,nz:number}>}
 *   (t = tangente no sentido da corrente; n = normal (−tz, tx), que aponta para a MARGEM DIREITA
 *    — oeste/Trastevere — onde o rio corre para o sul)
 */
export function tiberLine() {
  if (_tiber) return _tiber;
  let sm = TIBER.path.map((p) => p.slice());
  for (let it = 0; it < 3; it++) {
    const out = [sm[0]];
    for (let i = 0; i < sm.length - 1; i++) {
      const [ax, az] = sm[i];
      const [bx, bz] = sm[i + 1];
      out.push([ax * 0.75 + bx * 0.25, az * 0.75 + bz * 0.25], [ax * 0.25 + bx * 0.75, az * 0.25 + bz * 0.75]);
    }
    out.push(sm[sm.length - 1]);
    sm = out;
  }
  const pts = [];
  for (let i = 0; i < sm.length - 1; i++) {
    const [x0, z0] = sm[i];
    const [x1, z1] = sm[i + 1];
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 20));
    for (let k = 0; k < n; k++) pts.push([x0 + ((x1 - x0) * k) / n, z0 + ((z1 - z0) * k) / n]);
  }
  pts.push(sm[sm.length - 1]);
  _tiber = pts.map((p, i) => {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const tx = (b[0] - a[0]) / l;
    const tz = (b[1] - a[1]) / l;
    return { x: p[0], z: p[1], tx, tz, nx: -tz, nz: tx };
  });
  return _tiber;
}

/** Ponto da linha do Tibre mais próximo de (x, z): { x, z, d, tx, tz, nx, nz, s } (s = índice fracionário). */
export function nearestTiber(x, z) {
  const L = tiberLine();
  let best = null;
  for (let i = 0; i < L.length - 1; i++) {
    const a = L[i];
    const b = L[i + 1];
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const l2 = dx * dx + dz * dz || 1;
    let t = ((x - a.x) * dx + (z - a.z) * dz) / l2;
    t = Math.max(0, Math.min(1, t));
    const px = a.x + t * dx;
    const pz = a.z + t * dz;
    const d = Math.hypot(px - x, pz - z);
    if (!best || d < best.d) {
      const l = Math.sqrt(l2);
      best = { x: px, z: pz, d, tx: dx / l, tz: dz / l, nx: -dz / l, nz: dx / l, s: i + t };
    }
  }
  return best;
}

/**
 * Linha paralela ao Tibre, a `d` metros do eixo, na margem `side` (+1 = direita/oeste, −1 = esquerda/leste),
 * apenas para os pontos cujo z está em [zMin, zMax]. Devolve [[x, z], ...] no sentido da corrente.
 */
export function bankLine(d, side, zMin, zMax) {
  const out = [];
  for (const p of tiberLine()) {
    if (p.z < zMin || p.z > zMax) continue;
    out.push([p.x + p.nx * d * side, p.z + p.nz * d * side]);
  }
  return out;
}

/** Faixa (polígono) entre duas paralelas ao Tibre (d1 < d2), para pads de margem. */
export function bankStrip(d1, d2, side, zMin, zMax, clip = null) {
  const a = bankLine(d1, side, zMin, zMax);
  const b = bankLine(d2, side, zMin, zMax).reverse();
  let poly = [...a, ...b];
  if (clip) poly = poly.map(([x, z]) => clip(x, z));
  return poly;
}

/* -------------------------------------------------------------------------- */
/*  Geometria                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Executa `fn(b)` num Builder temporário (que NUNCA é finalizado) e devolve as geometrias
 * fundidas por material: { mat: BufferGeometry } — para instanciar com ctx.world.instances.
 */
export function captureGeometry(ctx, fn) {
  const b = ctx.builder('__arredores_capture__');
  fn(b);
  const out = {};
  for (const [key, list] of b.parts) {
    const mat = key.split('|')[0];
    out[mat] = out[mat] ? G.merge([out[mat], G.merge(list)]) : G.merge(list);
  }
  b.parts.clear();
  b.colliders = [];
  b.finished = true;
  return out;
}

/**
 * Instancia um objeto composto (várias geometrias por material) num conjunto de posições.
 * @param {object} ctx
 * @param {string} key prefixo único dos lotes
 * @param {object} geoms { mat: geometry } (de captureGeometry)
 * @param {Array<[x,y,z,rotY,scale?,color?]>} list
 * @param {object} o opções do lote (maxDistance, castShadow, collide)
 */
export function instanceAll(ctx, key, geoms, list, o = {}) {
  for (const [mat, g] of Object.entries(geoms)) {
    const batch = ctx.world.instances(`${key}:${mat}`, g, mat, o);
    for (const [x, y, z, r, s, c] of list) batch.add(x, y, z, r || 0, s ?? 1, c || null);
  }
}

/**
 * Superfície de revolução PARCIAL (de a0 a a1, em rad; a = 0 → +Z local, a = π/2 → +X local),
 * a partir de um perfil [[r, y], ...]. Inclui, se pedido, as "tampas" verticais nas extremidades
 * (região sob o perfil até y = yBase), úteis para cunhas de arquibancada.
 */
export function arcLathe(profile, a0, a1, segments, o = {}) {
  const pos = [];
  const nor = [];
  const uv = [];
  const tri = (p, q, r, n) => {
    pos.push(...p, ...q, ...r);
    nor.push(...n, ...n, ...n);
  };
  const P = (r, y, a) => [r * Math.sin(a), y, r * Math.cos(a)];
  const acc = [0];
  for (let i = 1; i < profile.length; i++) acc.push(acc[i - 1] + Math.hypot(profile[i][0] - profile[i - 1][0], profile[i][1] - profile[i - 1][1]));
  for (let i = 0; i < profile.length - 1; i++) {
    const [r0, y0] = profile[i];
    const [r1, y1] = profile[i + 1];
    const dr = r1 - r0;
    const dy = y1 - y0;
    const len = Math.hypot(dr, dy) || 1;
    const nr = dy / len;
    const ny = -dr / len;
    for (let s = 0; s < segments; s++) {
      const aa = a0 + ((a1 - a0) * s) / segments;
      const ab = a0 + ((a1 - a0) * (s + 1)) / segments;
      const am = (aa + ab) / 2;
      const n = [nr * Math.sin(am), ny, nr * Math.cos(am)];
      const p00 = P(r0, y0, aa);
      const p10 = P(r0, y0, ab);
      const p11 = P(r1, y1, ab);
      const p01 = P(r1, y1, aa);
      tri(p00, p10, p11, n);
      tri(p00, p11, p01, n);
      const rm = Math.max(r0, r1, 1);
      uv.push(aa * rm, acc[i], ab * rm, acc[i], ab * rm, acc[i + 1], aa * rm, acc[i], ab * rm, acc[i + 1], aa * rm, acc[i + 1]);
    }
  }
  if (o.caps) {
    const yb = o.yBase ?? 0;
    for (const [a, sgn] of [[a0, -1], [a1, 1]]) {
      // normal da tampa: perpendicular ao plano radial, apontando para fora da cunha
      const n = [Math.cos(a) * sgn, 0, -Math.sin(a) * sgn];
      for (let i = 0; i < profile.length - 1; i++) {
        const [r0, y0] = profile[i];
        const [r1, y1] = profile[i + 1];
        if (Math.abs(r1 - r0) < 1e-4) continue;
        const A = P(r0, yb, a);
        const B = P(r1, yb, a);
        const C = P(r1, y1, a);
        const D = P(r0, y0, a);
        if (sgn > 0) {
          tri(A, B, C, n);
          tri(A, C, D, n);
        } else {
          tri(A, C, B, n);
          tri(A, D, C, n);
        }
        uv.push(r0, yb, r1, yb, r1, y1, r0, yb, r1, y1, r0, y0);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return G.fixWinding(g);
}

/** Matriz de translação+rotação Y. */
export function mat(x, y, z, rotY = 0) {
  const m = new THREE.Matrix4().makeRotationY(rotY);
  m.setPosition(x, y, z);
  return m;
}

/* -------------------------------------------------------------------------- */
/*  Componentes                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Coluna de baixo custo (para colunatas longas e instanciadas): fuste de 10 lados com
 * afinamento, base e capitel simplificados. Base em y = 0.
 */
export function lowColumnInto(b, D, H, o = {}) {
  const m = o.mat || 'stucco';
  const capH = o.order === 'corinthian' ? D * 0.9 : D * 0.45;
  const baseH = o.order === 'doric' ? 0 : D * 0.4;
  if (baseH) b.box(D * 1.3, baseH, D * 1.3, 0, 0, 0, { mat: m, collide: false });
  b.cylinder(D / 2, D * 0.42, H - capH - baseH, 0, baseH, 0, { mat: m, segments: 10, caps: false });
  if (o.order === 'corinthian') {
    b.cylinder(D * 0.42, D * 0.6, capH * 0.85, 0, H - capH, 0, { mat: m, segments: 10, caps: false });
    b.box(D * 1.35, capH * 0.15, D * 1.35, 0, H - capH * 0.15, 0, { mat: m, collide: false });
  } else if (o.order === 'ionic') {
    b.box(D * 1.25, capH * 0.6, D * 0.7, 0, H - capH, 0, { mat: m, collide: false });
    b.box(D * 1.1, capH * 0.4, D * 1.1, 0, H - capH * 0.4, 0, { mat: m, collide: false });
  } else {
    b.cylinder(D * 0.42, D * 0.62, capH * 0.5, 0, H - capH, 0, { mat: m, segments: 10, caps: false });
    b.box(D * 1.25, capH * 0.5, D * 1.25, 0, H - capH * 0.5, 0, { mat: m, collide: false });
  }
}

/** Geometria instanciável de coluna simplificada: { mat: geom }. */
export function lowColumnGeom(ctx, D, H, o = {}) {
  return captureGeometry(ctx, (b) => lowColumnInto(b, D, H, o));
}

/**
 * Muro arruinado (em demolição): trechos de alturas irregulares ao longo de X local, de x0 a x1.
 * Colide (caixas). `rnd` = gerador aleatório determinístico.
 */
export function ruinWall(b, x0, x1, z, hMax, t, rnd, o = {}) {
  const m = o.mat || 'opusIncertum';
  let x = x0;
  while (x < x1 - 0.2) {
    const w = Math.min(x1 - x, 0.8 + rnd() * 1.6);
    const h = hMax * (0.25 + rnd() * 0.75);
    b.box(w, h, t, x + w / 2, o.y ?? 0, z, { mat: m, color: o.color });
    x += w;
  }
}

/** Monte de entulho (pedras, telhas quebradas, terra): calotas achatadas. Sem colisão. */
export function rubbleHeap(b, x, y, z, r, rnd, o = {}) {
  const n = 3 + Math.floor(rnd() * 3);
  for (let i = 0; i < n; i++) {
    const rr = r * (0.45 + rnd() * 0.55);
    const g = G.sphere(rr, 8, 5);
    g.scale(1 + rnd() * 0.3, 0.32 + rnd() * 0.2, 1 + rnd() * 0.3);
    g.translate(x + (rnd() - 0.5) * r, y - rr * 0.12, z + (rnd() - 0.5) * r);
    b.add(g, { mat: o.mat || 'dirt', color: o.color });
  }
  // fragmentos de telha e blocos soltos
  for (let i = 0; i < 4; i++) {
    b.box(0.5 + rnd() * 0.5, 0.3 + rnd() * 0.3, 0.4 + rnd() * 0.4, x + (rnd() - 0.5) * r * 2.2, y, z + (rnd() - 0.5) * r * 2.2, { mat: i % 2 ? 'tufa' : 'roofTile', rotY: rnd() * 3, collide: false });
  }
}

/** Pilha de blocos de tufo em obra (opus quadratum): fiadas desencontradas. Colide (caixa envolvente). */
export function blockStack(b, x, y, z, rotY, nx, nz, layers, o = {}) {
  const bw = o.bw ?? 1.2; // ~4 pés
  const bh = o.bh ?? 0.6; // ~2 pés
  const bd = o.bd ?? 0.6;
  b.push(x, y, z, rotY);
  for (let l = 0; l < layers; l++) {
    const off = (l % 2) * bw * 0.5;
    const cnx = nx - (l % 2);
    for (let i = 0; i < cnx; i++) {
      for (let k = 0; k < nz; k++) {
        b.box(bw - 0.04, bh - 0.02, bd - 0.04, -((nx - 1) * bw) / 2 + i * bw + off, l * bh, -((nz - 1) * bd) / 2 + k * bd, { mat: o.mat || 'tufa', collide: false, color: o.color });
      }
    }
  }
  b.colliderBox(nx * bw, layers * bh, nz * bd, 0, 0, 0);
  b.pop();
}

/** Viga (caixa w × w) entre os pontos locais A e B. Sem colisão por padrão. */
export function beam(b, A, B, w, o = {}) {
  const a = new THREE.Vector3(...A);
  const d = new THREE.Vector3(...B).sub(a);
  const len = d.length();
  if (len < 1e-4) return;
  const g = G.box(w, len, w);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  const m = new THREE.Matrix4().compose(a, q, new THREE.Vector3(1, 1, 1));
  b.add(g, { mat: o.mat || 'woodDark', matrix: m, color: o.color, collide: o.collide ?? false });
}

/**
 * Guindaste de madeira com roda de tração humana (tipo descrito por Vitrúvio 10.2, polispasto):
 * dois mastros inclinados em A, escoras, roda de tração na base e corda. Altura h. Frente → +Z local.
 */
export function treadwheelCrane(b, x, y, z, rotY, h = 12) {
  b.push(x, y, z, rotY);
  const T = [0, h * 0.96, h * 0.28];
  for (const s of [-1, 1]) {
    beam(b, [s * 1.5, 0, 0], [s * 0.25, T[1], T[2]], 0.3);
    beam(b, [s * 1.4, 0, -h * 0.45], [s * 0.3, T[1] - 0.2, T[2] - 0.2], 0.2, { mat: 'wood' });
  }
  beam(b, [-1.5, h * 0.35, h * 0.1], [1.5, h * 0.35, h * 0.1], 0.2);
  beam(b, [-0.6, T[1], T[2]], [0.6, T[1], T[2]], 0.28);
  // roda de tração (anel com raios) entre os pés traseiros
  const wr = 2.1;
  const wz = -h * 0.3;
  const ring = G.lathe([[wr, -0.55], [wr, 0.55], [wr - 0.22, 0.55], [wr - 0.22, -0.55], [wr, -0.55]], 16);
  b.add(ring, { mat: 'wood', matrix: new THREE.Matrix4().makeRotationZ(Math.PI / 2).premultiply(new THREE.Matrix4().makeTranslation(0, wr + 0.25, wz)) });
  for (let k = 0; k < 4; k++) {
    const a = (k * Math.PI) / 4;
    beam(b, [0, wr + 0.25 - Math.cos(a) * (wr - 0.15), wz - Math.sin(a) * (wr - 0.15)], [0, wr + 0.25 + Math.cos(a) * (wr - 0.15), wz + Math.sin(a) * (wr - 0.15)], 0.12);
  }
  for (const s of [-1, 1]) b.box(0.3, wr + 0.3, 0.4, s * 0.85, 0, wz, { mat: 'woodDark', collide: false });
  b.colliderBox(3.6, 3, 4.6, 0, 0, wz);
  // corda do topo até a roda e corda de carga com bloco suspenso
  beam(b, [0, wr + 0.25, wz], T, 0.04, { mat: 'cloth' });
  beam(b, [0, T[1], T[2] + 0.2], [0, h * 0.4, T[2] + 0.2], 0.04, { mat: 'cloth' });
  b.box(1.2, 0.6, 0.6, 0, h * 0.4 - 0.6, T[2] + 0.2, { mat: 'tufa', collide: false });
  b.pop();
}

/** Andaime de madeira ao longo de X local (x0..x1), diante de uma fachada em z, até a altura h. */
export function scaffold(b, x0, x1, z, h, o = {}) {
  const y = o.y ?? 0;
  const step = o.step ?? 2.4;
  const lv = o.levelH ?? 2.2;
  const depth = o.depth ?? 1.3;
  for (let x = x0; x <= x1 + 0.01; x += step) {
    for (const dz of [0, depth]) b.box(0.14, h, 0.14, x, y, z + dz, { mat: 'woodLight', collide: false });
  }
  for (let yy = lv; yy <= h + 0.01; yy += lv) {
    b.box(x1 - x0 + 0.4, 0.12, 0.12, (x0 + x1) / 2, y + yy, z, { mat: 'woodLight', collide: false });
    b.box(x1 - x0 + 0.4, 0.12, 0.12, (x0 + x1) / 2, y + yy, z + depth, { mat: 'woodLight', collide: false });
    b.box(x1 - x0, 0.06, depth, (x0 + x1) / 2, y + yy + 0.12, z + depth / 2, { mat: 'wood', collide: false });
  }
  // diagonais
  for (let x = x0; x < x1 - step + 0.01; x += step * 2) beam(b, [x, y, z - 0.1], [x + step, y + lv, z - 0.1], 0.08, { mat: 'woodLight' });
}

/**
 * Barco fluvial simples (casco de tábuas com proa e popa levantadas). Comprimento L, boca W.
 * Proa → +Z local. Cor do casco por `color`. Se `mast`, mastro e verga.
 */
export function boatInto(b, L, W, o = {}) {
  const H = o.depth ?? W * 0.42;
  const m = o.mat || 'woodDark';
  const hl = L / 2;
  const hw = W / 2;
  const rise = H * 0.6;
  // perfil: estações ao longo do comprimento (z, meia-boca no topo, meia-largura do fundo, altura da borda)
  const st = [
    [-hl, 0.05, 0.02, H + rise],
    [-hl * 0.75, hw * 0.75, hw * 0.35, H + rise * 0.3],
    [-hl * 0.3, hw, hw * 0.6, H],
    [hl * 0.3, hw, hw * 0.6, H],
    [hl * 0.75, hw * 0.75, hw * 0.35, H + rise * 0.3],
    [hl, 0.05, 0.02, H + rise],
  ];
  for (let i = 0; i < st.length - 1; i++) {
    const [z0, w0, f0, h0] = st[i];
    const [z1, w1, f1, h1] = st[i + 1];
    for (const s of [-1, 1]) {
      // costado externo (do fundo à borda)
      const A = [s * f0, 0, z0];
      const B = [s * f1, 0, z1];
      const C = [s * w1, h1, z1];
      const D = [s * w0, h0, z0];
      if (s > 0) {
        b.quad(A, B, C, D, { mat: m, color: o.color });
        b.quad(D, C, B, A, { mat: m, color: o.color });
      } else {
        b.quad(B, A, D, C, { mat: m, color: o.color });
        b.quad(C, D, A, B, { mat: m, color: o.color });
      }
    }
    // fundo
    b.quad([-f0, 0.02, z0], [f0, 0.02, z0], [f1, 0.02, z1], [-f1, 0.02, z1], { mat: 'wood' });
  }
  // bancos / cobertas
  for (const zz of [-hl * 0.35, 0, hl * 0.35]) b.box(W * 0.9, 0.06, 0.3, 0, H * 0.7, zz, { mat: 'wood', collide: false });
  if (o.mast) {
    b.box(0.16, L * 0.55, 0.16, 0, 0, hl * 0.15, { mat: 'woodDark', collide: false });
    b.box(W * 1.4, 0.1, 0.1, 0, L * 0.5, hl * 0.15, { mat: 'woodDark', collide: false });
  }
  if (o.cargo) {
    for (let i = 0; i < o.cargo; i++) {
      const g = G.lathe([[0, 0], [0.04, 0.03], [0.15, 0.45], [0.16, 0.62], [0.06, 0.82], [0.075, 1.1], [0, 1.11]], 8);
      const mm = new THREE.Matrix4().makeRotationZ(1.35).premultiply(new THREE.Matrix4().makeTranslation(-W * 0.25 + (i % 3) * W * 0.25, H * 0.35, -hl * 0.4 + Math.floor(i / 3) * 0.5));
      b.add(g, { mat: 'terracotta', matrix: mm });
    }
  }
}

/** Boi (volume simplificado: tronco, pescoço, cabeça, chifres, pernas). Frente → +Z local. */
export function oxInto(b, o = {}) {
  const c = o.color || '#8a7258';
  const mt = o.mat || 'flat';
  b.add(G.sphere(0.55, 10, 7).scale(0.85, 0.82, 1.65).translate(0, 0.72, 0), { mat: mt, color: c });
  b.add(G.sphere(0.32, 8, 6).scale(0.9, 1.0, 1.3).translate(0, 1.15, 0.85), { mat: mt, color: c });
  b.add(G.sphere(0.24, 8, 6).scale(0.85, 0.9, 1.45).translate(0, 1.1, 1.22), { mat: mt, color: c });
  b.box(0.7, 0.05, 0.05, 0, 1.52, 1.1, { mat: mt, color: '#d9cfb8', collide: false });
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) b.box(0.13, 0.78, 0.13, sx * 0.24, 0, sz * 0.58, { mat: mt, color: c, collide: false });
  b.box(0.04, 0.6, 0.04, 0, 0.55, -0.92, { mat: mt, color: c, collide: false }); // cauda
}

/** Telhado simples de duas águas sobre w × l (cumeeira ao longo de Z), beiral em y. Sem frontão. */
export function simpleGable(b, w, l, x, y, z, pitch = 0.3, o = {}) {
  const hw = w / 2 + (o.ov ?? 0.4);
  const rise = (w / 2) * pitch;
  const yE = y - (o.ov ?? 0.4) * pitch;
  const z0 = z - l / 2 - 0.3;
  const z1 = z + l / 2 + 0.3;
  const m = o.mat || 'roofTile';
  b.quad([x + hw, yE, z1], [x + hw, yE, z0], [x, y + rise, z0], [x, y + rise, z1], { mat: m, color: o.color });
  b.quad([x - hw, yE, z0], [x - hw, yE, z1], [x, y + rise, z1], [x, y + rise, z0], { mat: m, color: o.color });
  // tímpanos
  if (o.gable !== false) {
    const gm = o.gableMat || 'plaster';
    b.tri([x - w / 2, y, z + l / 2], [x + w / 2, y, z + l / 2], [x, y + rise, z + l / 2], { mat: gm, color: o.wallColor });
    b.tri([x + w / 2, y, z - l / 2], [x - w / 2, y, z - l / 2], [x, y + rise, z - l / 2], { mat: gm, color: o.wallColor });
  }
  return y + rise;
}

/**
 * Insula de baixo custo (para o casario de fundo): térreo de alvenaria, pavimentos rebocados,
 * aberturas apenas nas faces indicadas (`faces`: lista de 'pz','nz','px','nx'), telhado de telhas.
 * Quadro local: centro da planta no chão, frente → +Z. Colide (caixa).
 */
export function lightInsula(b, w, d, x, y, z, rotY, rnd, o = {}) {
  const floors = o.floors ?? 3;
  const fh = o.floorH ?? 3.0;
  const H = floors * fh;
  const col = o.color || '#ddd0b8';
  b.push(x, y, z, rotY);
  b.box(w, fh + 2, d, 0, -2, 0, { mat: o.groundMat || 'opusIncertum' });
  b.box(w, H - fh, d, 0, fh, 0, { mat: 'plaster', color: col });
  b.box(w + 0.12, 0.2, d + 0.12, 0, fh - 0.04, 0, { mat: 'woodDark', collide: false });
  const dark = '#2b231c';
  const faces = o.faces || ['pz'];
  for (const f of faces) {
    const rot = { pz: 0, nz: Math.PI, px: Math.PI / 2, nx: -Math.PI / 2 }[f];
    const len = f === 'pz' || f === 'nz' ? w : d;
    const nz = (f === 'pz' || f === 'nz' ? d : w) / 2 + 0.02;
    b.push(0, 0, 0, rot);
    const nShops = Math.max(1, Math.floor(len / 4.2));
    const sw = len / nShops;
    for (let i = 0; i < nShops; i++) {
      const cx = -len / 2 + sw * (i + 0.5);
      if (rnd() < 0.85) {
        b.box(sw * 0.66, fh * 0.76, 0.02, cx, 0, nz, { mat: 'flat', color: dark, collide: false, faces: { nz: false, top: false, bottom: false } });
        b.box(sw * 0.74, 0.2, 0.1, cx, fh * 0.76, nz + 0.03, { mat: 'woodDark', collide: false });
      }
    }
    for (let fl = 1; fl < floors; fl++) {
      const nWin = Math.max(1, Math.floor(len / 3.2));
      const ww = len / nWin;
      for (let i = 0; i < nWin; i++) {
        if (rnd() < 0.3) continue;
        b.box(0.75, fl === 1 ? 1.1 : 0.85, 0.02, -len / 2 + ww * (i + 0.5), fl * fh + 1.0, nz, { mat: 'flat', color: dark, collide: false, faces: { nz: false, top: false, bottom: false } });
      }
      if (o.balcony && fl === 1 && rnd() < 0.5) {
        const bw = Math.min(len * 0.6, 5 + rnd() * 4);
        b.box(bw, 0.16, 1.0, 0, fh, nz + 0.5, { mat: 'wood', collide: false });
        b.box(bw, 0.8, 0.05, 0, fh + 0.16, nz + 0.98, { mat: 'woodDark', collide: false });
      }
    }
    b.pop();
  }
  if (o.roof === 'hip' || (o.roof == null && rnd() < 0.5)) {
    // quatro águas baixas
    const W = w / 2 + 0.4;
    const L = d / 2 + 0.4;
    const rise = Math.min(w, d) * 0.12;
    const r = Math.max(0, L - W);
    const rx = Math.max(0, W - L);
    const yE = H - 0.1;
    const R = H + rise;
    b.quad([-W, yE, L], [W, yE, L], [rx, R, r], [-rx, R, r], { mat: 'roofTile' });
    b.quad([W, yE, -L], [-W, yE, -L], [-rx, R, -r], [rx, R, -r], { mat: 'roofTile' });
    b.quad([W, yE, L], [W, yE, -L], [rx, R, -r], [rx, R, r], { mat: 'roofTile' });
    b.quad([-W, yE, -L], [-W, yE, L], [-rx, R, r], [-rx, R, -r], { mat: 'roofTile' });
  } else {
    simpleGable(b, w, d, 0, H, 0, 0.24, { wallColor: col });
  }
  b.pop();
  return H;
}

/** Ponto-dentro-de-polígono (par–ímpar). */
export function inPoly(x, z, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i];
    const [xj, zj] = poly[j];
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}
