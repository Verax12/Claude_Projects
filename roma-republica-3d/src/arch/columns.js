/**
 * Colunas e entablamentos paramétricos (ordens toscana, dórica, jônica e coríntia).
 *
 * As proporções seguem, de modo simplificado, as regras gerais de Vitrúvio (De arch. 3–4):
 * base ≈ ½ diâmetro (D), capitel toscano/dórico ≈ ½ D, jônico ≈ ⅓ D (+ volutas),
 * coríntio ≈ 1 D; fuste com êntase e afinamento de ~1/6 no topo. A ALTURA e o DIÂMETRO
 * reais de cada edifício devem vir das fontes (docs/pesquisa) e são passados pelo chamador.
 *
 * Caneluras: representadas por normal map (material "<base>Fluted"), não por geometria,
 * para manter a contagem de triângulos baixa (há centenas de colunas na cidade).
 */
import * as G from '../render/geom.js';
import * as THREE from 'three';

/**
 * Coluna completa com base em (x, y, z) do quadro atual do builder.
 * @param {import('../core/Builder.js').Builder} b
 * @param {object} o {
 *   order: 'tuscan'|'doric'|'ionic'|'corinthian',
 *   height: altura total (base+fuste+capitel), diameter: diâmetro inferior do fuste,
 *   mat: material (padrão 'stucco'), fluted (padrão: true exceto toscana), base (padrão: true exceto dórica grega),
 *   collide (padrão true), rotY, segments
 * }
 * @returns {{ top: number }} cota do topo do capitel (relativa a y)
 */
export function column(b, x, y, z, o = {}) {
  const order = o.order || 'tuscan';
  const D = o.diameter || 0.8;
  const H = o.height || D * 7;
  const R = D / 2;
  const mat = o.mat || 'stucco';
  const fluted = o.fluted ?? (order !== 'tuscan');
  const hasBase = o.base ?? (order !== 'doric');
  const seg = o.segments ?? (fluted ? 24 : 16);
  const flutes = order === 'doric' ? 20 : 24;
  const capH = order === 'corinthian' ? D * 1.05 : order === 'ionic' ? D * 0.36 : D * 0.5;
  const baseH = hasBase ? D * 0.5 : 0;
  const shaftH = H - capH - baseH;
  const rTop = R * 0.84;

  b.push(x, y, z, o.rotY || 0);
  // --- base ---
  if (hasBase) {
    if (order === 'tuscan') {
      b.box(D * 1.25, baseH * 0.5, D * 1.25, 0, 0, 0, { mat, collide: false }); // plinto
      b.lathe([[R * 1.12, baseH * 0.5], [R * 1.18, baseH * 0.72], [R * 1.05, baseH], [R, baseH]], 0, 0, 0, { mat, segments: 16 });
    } else {
      // base ática: plinto + toro inferior + escócia + toro superior
      const p = baseH * 0.32;
      b.box(D * 1.36, p, D * 1.36, 0, 0, 0, { mat, collide: false });
      b.lathe([
        [R * 1.28, p], [R * 1.34, p + baseH * 0.12], [R * 1.26, p + baseH * 0.24], // toro inferior
        [R * 1.08, p + baseH * 0.3], [R * 1.04, p + baseH * 0.44], [R * 1.14, p + baseH * 0.5], // escócia
        [R * 1.16, p + baseH * 0.58], [R * 1.08, baseH * 0.98], [R, baseH], // toro superior
      ], 0, 0, 0, { mat, segments: 16 });
    }
  }
  // --- fuste com êntase ---
  const prof = [];
  const steps = 6;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // êntase: leve dilatação até ~1/3 da altura, depois afina até rTop
    const ent = Math.sin(Math.min(1, t / 0.35) * Math.PI * 0.5) * 0.012;
    const r = t < 0.33 ? R * (1 + ent) : R * (1 + 0.012) + (rTop - R * 1.012) * ((t - 0.33) / 0.67) ** 1.2;
    prof.push([r, baseH + t * shaftH]);
  }
  b.lathe(prof, 0, 0, 0, { mat: fluted ? mat + 'Fluted' : mat, segments: seg, flutes: fluted ? flutes : 0, vByHeight: true });
  // --- capitel ---
  const y0 = baseH + shaftH;
  capital(b, order, y0, D, rTop, capH, mat);
  b.pop();

  // colisão: prisma octogonal do tamanho do fuste
  if (o.collide !== false) {
    const cg = G.cylinder(R * 1.02, R * 1.02, H, 8);
    b.collider(cg, new THREE.Matrix4().makeTranslation(x, y, z));
  }
  return { top: y + H };
}

/** Capitel no topo do fuste (coordenadas locais da coluna). */
function capital(b, order, y0, D, rTop, capH, mat) {
  const R = D / 2;
  if (order === 'tuscan' || order === 'doric') {
    // anel (astrágalo), equino e ábaco quadrado
    b.lathe([[rTop * 1.04, y0], [rTop * 1.06, y0 + capH * 0.08], [rTop, y0 + capH * 0.16], [rTop, y0 + capH * 0.3]], 0, 0, 0, { mat, segments: 16 });
    b.lathe([[rTop, y0 + capH * 0.3], [R * 1.15, y0 + capH * 0.55], [R * 1.3, y0 + capH * 0.62]], 0, 0, 0, { mat, segments: 16 });
    b.box(D * 1.3, capH * 0.38, D * 1.3, 0, y0 + capH * 0.62, 0, { mat, collide: false });
  } else if (order === 'ionic') {
    b.lathe([[rTop, y0], [rTop * 1.12, y0 + capH * 0.35], [R * 1.1, y0 + capH * 0.55]], 0, 0, 0, { mat, segments: 16 });
    // almofadas (pulvini) com volutas nas faces frontal e posterior
    for (const s of [-1, 1]) {
      const vr = D * 0.2;
      const pul = G.cylinder(vr, vr, D * 1.0, 12, { caps: true, bottomCap: true });
      pul.rotateX(Math.PI / 2);
      pul.translate(s * R * 1.12, y0 + capH * 0.42, -D * 0.5); // rotateX leva y∈[0,D] para z∈[0,D]; centraliza
      b.add(pul, { mat });
    }
    b.box(D * 1.05, D * 0.12, D * 1.05, 0, y0 + capH * 0.62, 0, { mat, collide: false }); // canal das volutas
    b.box(D * 1.12, capH * 0.25, D * 1.12, 0, y0 + capH * 0.75, 0, { mat, collide: false }); // ábaco
  } else {
    // coríntio: cálato + duas coroas de folhas de acanto + volutas nos cantos + ábaco
    b.lathe([[rTop, y0], [rTop * 1.02, y0 + capH * 0.5], [R * 1.12, y0 + capH * 0.88]], 0, 0, 0, { mat, segments: 16 });
    for (let ring = 0; ring < 2; ring++) {
      const n = 8;
      const rr = rTop * (1.05 + ring * 0.08);
      const hy = y0 + capH * (0.08 + ring * 0.28);
      for (let i = 0; i < n; i++) {
        const a = ((i + ring * 0.5) / n) * Math.PI * 2;
        const leaf = G.sphere(D * 0.11, 6, 4);
        leaf.scale(1.1, 2.3, 0.7);
        leaf.rotateX(-0.35);
        leaf.rotateY(a);
        leaf.translate(Math.sin(a) * rr, hy, Math.cos(a) * rr);
        b.add(leaf, { mat });
      }
    }
    for (let i = 0; i < 4; i++) {
      const a = Math.PI / 4 + (i / 4) * Math.PI * 2;
      const vol = G.sphere(D * 0.1, 6, 4);
      vol.translate(Math.sin(a) * R * 1.2, y0 + capH * 0.72, Math.cos(a) * R * 1.2);
      b.add(vol, { mat });
    }
    b.box(D * 1.42, capH * 0.12, D * 1.42, 0, y0 + capH * 0.88, 0, { mat, collide: false });
  }
}

/**
 * Entablamento reto (arquitrave + friso + cornija) ao longo do eixo X local,
 * de x0 a x1, com profundidade d, começando na cota y. Devolve a cota do topo.
 * @param {object} o { order, mat, height (padrão ≈ ¼ da altura da coluna informada via colH), colH, triglyphs }
 */
export function entablature(b, x0, x1, z, d, y, o = {}) {
  const mat = o.mat || 'stucco';
  const colH = o.colH || 8;
  const H = o.height || colH * 0.24;
  const L = x1 - x0;
  const cx = (x0 + x1) / 2;
  const ah = H * 0.38;
  const fh = H * 0.34;
  const ch = H - ah - fh;
  b.box(L, ah, d, cx, y, z, { mat, collide: false }); // arquitrave
  b.box(L, fh, d * 0.96, cx, y + ah, z, { mat, collide: false }); // friso
  if (o.order === 'doric' && o.triglyphs) {
    // tríglifos: blocos salientes a intervalos regulares (alinhados às colunas e entre elas)
    const n = Math.max(2, Math.round(L / (o.triglyphSpacing || 1.4)));
    for (let i = 0; i <= n; i++) {
      const tx = x0 + (i / n) * L;
      b.box(Math.min(0.5, fh * 0.65), fh * 0.95, 0.06, tx, y + ah, z + d * 0.48 + 0.03, { mat, collide: false });
    }
  }
  // cornija saliente com dentículos
  b.box(L + ch * 1.6, ch * 0.55, d + ch * 1.6, cx, y + ah + fh + ch * 0.45, z, { mat, collide: false });
  b.box(L + ch * 0.8, ch * 0.45, d + ch * 0.8, cx, y + ah + fh, z, { mat, collide: false });
  if (o.dentils !== false && L < 120) {
    const n = Math.floor(L / 0.32);
    for (let i = 0; i < n; i++) {
      b.box(0.14, ch * 0.3, 0.12, x0 + (i + 0.5) * (L / n), y + ah + fh + ch * 0.14, z + (d + ch * 0.8) / 2 + 0.03, { mat, collide: false });
    }
  }
  return y + H;
}

/** Fileira de colunas igualmente espaçadas ao longo de X local (de x0 a x1, inclusive). */
export function colonnade(b, n, x0, x1, z, y, o = {}) {
  const tops = [];
  for (let i = 0; i < n; i++) {
    const x = n === 1 ? (x0 + x1) / 2 : x0 + ((x1 - x0) * i) / (n - 1);
    tops.push(column(b, x, y, z, o).top);
  }
  return tops[0] ?? y;
}

/** Pilar retangular (ex.: arcadas do Tabularium) com meia-coluna adossada opcional. */
export function pier(b, x, y, z, w, d, h, o = {}) {
  const mat = o.mat || 'tufa';
  b.box(w, h, d, x, y, z, { mat, collide: true, rotY: o.rotY });
  if (o.engaged) {
    const D = o.engaged.diameter || w * 0.6;
    // meia-coluna na face +Z (aproximada por coluna inteira parcialmente embutida)
    column(b, x, y, z + d / 2, { order: o.engaged.order || 'tuscan', height: h, diameter: D, mat: o.engaged.mat || mat, collide: false });
  }
}

/**
 * Arco semicircular (aduelas) entre dois pilares, no plano XY local, centrado em x,
 * vão `span`, nascença na cota y, espessura (profundidade) d.
 */
export function arch(b, x, y, z, span, d, o = {}) {
  const mat = o.mat || 'tufa';
  const r = span / 2;
  const thick = o.thickness || Math.max(0.45, span * 0.12);
  const seg = o.segments || 10;
  for (let i = 0; i < seg; i++) {
    const a0 = Math.PI - (i / seg) * Math.PI;
    const a1 = Math.PI - ((i + 1) / seg) * Math.PI;
    const p = (a, rr) => [x + Math.cos(a) * rr, y + Math.sin(a) * rr];
    const [ix0, iy0] = p(a0, r);
    const [ix1, iy1] = p(a1, r);
    const [ox0, oy0] = p(a0, r + thick);
    const [ox1, oy1] = p(a1, r + thick);
    const zf = z + d / 2;
    const zb = z - d / 2;
    // face frontal e posterior
    b.quad([ix0, iy0, zf], [ix1, iy1, zf], [ox1, oy1, zf], [ox0, oy0, zf], { mat });
    b.quad([ix1, iy1, zb], [ix0, iy0, zb], [ox0, oy0, zb], [ox1, oy1, zb], { mat });
    // intradorso (face inferior do arco)
    b.quad([ix0, iy0, zb], [ix1, iy1, zb], [ix1, iy1, zf], [ix0, iy0, zf], { mat });
  }
  // tímpanos laterais até o topo do arco (preenchimento retangular acima)
  const top = y + r + thick;
  const fill = (xa, xb) => {
    // preenche entre o extradorso e a linha superior com quads por segmento
    for (let i = 0; i < seg; i++) {
      const a0 = Math.PI - (i / seg) * Math.PI;
      const a1 = Math.PI - ((i + 1) / seg) * Math.PI;
      const x0 = x + Math.cos(a0) * (r + thick);
      const x1 = x + Math.cos(a1) * (r + thick);
      if (x1 < xa || x0 > xb) continue;
      const y0 = y + Math.sin(a0) * (r + thick);
      const y1 = y + Math.sin(a1) * (r + thick);
      b.quad([x0, y0, z + d / 2], [x1, y1, z + d / 2], [x1, top, z + d / 2], [x0, top, z + d / 2], { mat });
      b.quad([x1, y1, z - d / 2], [x0, y0, z - d / 2], [x0, top, z - d / 2], [x1, top, z - d / 2], { mat });
    }
  };
  fill(x - r - thick, x + r + thick);
  return top;
}
