/**
 * Telhados: duas águas (com frontões), quatro águas, uma água e telhado compluviado
 * (inclinado para dentro, sobre o átrio de uma domus).
 *
 * Convenção: o telhado cobre um retângulo w (X local) × l (Z local) centrado em (x, z),
 * com o beiral na cota y. A cumeeira do telhado de duas águas corre ao longo de Z
 * (frontões nas extremidades ±Z — a fachada do edifício fica em +Z).
 */

/**
 * Telhado de duas águas.
 * @param {object} o { pitch (altura/meio-vão, padrão 0.28), overhang (beirais laterais),
 *   overhangEnds (avanço nas extremidades), mat ('roofTile'), soffitMat ('woodDark'),
 *   gableMat (material dos tímpanos; null = sem tímpanos), cornice (cornija inclinada do frontão),
 *   corniceMat, thickness }
 * @returns {{ ridgeY: number, rise: number }}
 */
export function gableRoof(b, w, l, x, y, z, o = {}) {
  const pitch = o.pitch ?? 0.28;
  const ov = o.overhang ?? 0.6;
  const ovE = o.overhangEnds ?? 0.4;
  const mat = o.mat || 'roofTile';
  const soffit = o.soffitMat === undefined ? 'woodDark' : o.soffitMat;
  const t = o.thickness ?? 0.18;
  const hw = w / 2;
  const rise = hw * pitch;
  const W = hw + ov; // meia-largura com beiral
  const yE = y - ov * pitch; // cota do beiral externo (continua a inclinação)
  const ridge = y + rise;
  const z0 = z - l / 2 - ovE;
  const z1 = z + l / 2 + ovE;
  b.push(x, 0, 0);
  // águas (vista de fora: anti-horário)
  b.quad([W, yE, z1], [W, yE, z0], [0, ridge, z0], [0, ridge, z1], { mat }); // água leste (+X)
  b.quad([-W, yE, z0], [-W, yE, z1], [0, ridge, z1], [0, ridge, z0], { mat }); // água oeste (−X)
  if (soffit) {
    b.quad([0, ridge - t, z1], [0, ridge - t, z0], [W, yE - t, z0], [W, yE - t, z1], { mat: soffit });
    b.quad([0, ridge - t, z0], [0, ridge - t, z1], [-W, yE - t, z1], [-W, yE - t, z0], { mat: soffit });
    // bordas (espessura das telhas)
    b.quad([W, yE - t, z1], [W, yE - t, z0], [W, yE, z0], [W, yE, z1], { mat: soffit });
    b.quad([-W, yE - t, z0], [-W, yE - t, z1], [-W, yE, z1], [-W, yE, z0], { mat: soffit });
    for (const zz of [z0, z1]) {
      const s = zz === z1 ? 1 : -1;
      const A = [-W, yE - t, zz];
      const B = [W, yE - t, zz];
      const C = [W, yE, zz];
      const D = [0, ridge, zz];
      const E = [-W, yE, zz];
      const F = [0, ridge - t, zz];
      if (s > 0) {
        b.quad(B, C, D, F, { mat: soffit });
        b.quad(F, D, E, A, { mat: soffit });
      } else {
        b.quad(C, B, F, D, { mat: soffit });
        b.quad(D, F, A, E, { mat: soffit });
      }
    }
  }
  // cumeeira (fiada de imbrices)
  b.box(0.28, 0.14, l + ovE * 2, 0, ridge - 0.04, z, { mat, collide: false });
  // tímpanos (paredes triangulares sob o telhado, no plano das fachadas)
  if (o.gableMat) {
    for (const s of [1, -1]) {
      const zz = z + (s * l) / 2;
      if (s > 0) b.tri([-hw, y, zz], [hw, y, zz], [0, ridge, zz], { mat: o.gableMat });
      else b.tri([hw, y, zz], [-hw, y, zz], [0, ridge, zz], { mat: o.gableMat });
    }
  }
  // cornija inclinada do frontão (temples)
  if (o.cornice) {
    const cm = o.corniceMat || o.gableMat || 'stucco';
    const len = Math.hypot(hw, rise);
    const ang = Math.atan2(rise, hw);
    for (const s of [1, -1]) {
      for (const side of [1, -1]) {
        const zz = z + (s * l) / 2 + s * 0.15;
        const geo = cornerBox(len + 0.3, 0.35, 0.5);
        b.push(side * hw * 0.5, (y + ridge) / 2 - 0.1, zz, 0);
        // metade direita desce do centro para +X (ângulo −ang); metade esquerda, +ang
        b.add(geo, { mat: cm, matrix: rotZ(-side * ang) });
        b.pop();
      }
    }
  }
  b.pop();
  return { ridgeY: ridge, rise };
}

/** Telhado de uma água: alto em −X (y + rise), baixo em +X (y). */
export function shedRoof(b, w, l, x, y, z, o = {}) {
  const pitch = o.pitch ?? 0.25;
  const ov = o.overhang ?? 0.4;
  const mat = o.mat || 'roofTile';
  const rise = w * pitch;
  const z0 = z - l / 2 - ov;
  const z1 = z + l / 2 + ov;
  const xa = x - w / 2;
  const xb = x + w / 2 + ov;
  const yb = y - ov * pitch;
  b.quad([xb, yb, z1], [xb, yb, z0], [xa, y + rise, z0], [xa, y + rise, z1], { mat });
  if (o.soffitMat !== null) b.quad([xa, y + rise - 0.12, z1], [xa, y + rise - 0.12, z0], [xb, yb - 0.12, z0], [xb, yb - 0.12, z1], { mat: o.soffitMat || 'woodDark' });
  return { highY: y + rise };
}

/** Telhado de quatro águas sobre w × l. */
export function hipRoof(b, w, l, x, y, z, o = {}) {
  const pitch = o.pitch ?? 0.28;
  const ov = o.overhang ?? 0.5;
  const mat = o.mat || 'roofTile';
  const W = w / 2 + ov;
  const L = l / 2 + ov;
  const rise = (Math.min(w, l) / 2) * pitch;
  const yE = y - ov * pitch;
  const ridge = y + rise;
  const r = Math.max(0, L - W); // meia-cumeeira (se l > w)
  const rx = Math.max(0, W - L);
  b.push(x, 0, z);
  const P = (px, py, pz) => [px, py, pz];
  // frente (+Z) e fundo
  b.quad(P(-W, yE, L), P(W, yE, L), P(rx, ridge, r), P(-rx, ridge, r), { mat });
  b.quad(P(W, yE, -L), P(-W, yE, -L), P(-rx, ridge, -r), P(rx, ridge, -r), { mat });
  // lados
  b.quad(P(W, yE, L), P(W, yE, -L), P(rx, ridge, -r), P(rx, ridge, r), { mat });
  b.quad(P(-W, yE, -L), P(-W, yE, L), P(-rx, ridge, r), P(-rx, ridge, -r), { mat });
  if (o.soffitMat !== null) b.quad(P(-W, yE - 0.1, -L), P(W, yE - 0.1, -L), P(W, yE - 0.1, L), P(-W, yE - 0.1, L), { mat: o.soffitMat || 'woodDark' });
  b.pop();
  return { ridgeY: ridge };
}

/**
 * Telhado compluviado (átrio toscano): as quatro águas descem para a abertura central
 * (compluvium) de hw × hl. As bordas externas ficam na cota y + rise, a borda interna em y.
 */
export function compluviateRoof(b, w, l, hw, hl, x, y, z, o = {}) {
  const mat = o.mat || 'roofTile';
  const ov = o.overhang ?? 0.3;
  const W = w / 2 + ov;
  const L = l / 2 + ov;
  const iw = hw / 2;
  const il = hl / 2;
  const rise = o.rise ?? Math.min(W - iw, L - il) * (o.pitch ?? 0.3);
  const yo = y + rise;
  b.push(x, 0, z);
  // superfícies superiores (normais para cima, inclinadas para dentro)
  b.quad([-W, yo, L], [W, yo, L], [iw, y, il], [-iw, y, il], { mat });
  b.quad([W, yo, -L], [-W, yo, -L], [-iw, y, -il], [iw, y, -il], { mat });
  b.quad([W, yo, L], [W, yo, -L], [iw, y, -il], [iw, y, il], { mat });
  b.quad([-W, yo, -L], [-W, yo, L], [-iw, y, il], [-iw, y, -il], { mat });
  // forro de madeira visto de dentro do átrio
  const sm = o.soffitMat || 'woodDark';
  const t = 0.15;
  b.quad([-iw, y - t, il], [iw, y - t, il], [W, yo - t, L], [-W, yo - t, L], { mat: sm });
  b.quad([iw, y - t, -il], [-iw, y - t, -il], [-W, yo - t, -L], [W, yo - t, -L], { mat: sm });
  b.quad([iw, y - t, il], [iw, y - t, -il], [W, yo - t, -L], [W, yo - t, L], { mat: sm });
  b.quad([-iw, y - t, -il], [-iw, y - t, il], [-W, yo - t, L], [-W, yo - t, -L], { mat: sm });
  // bordas da abertura (espessura)
  b.quad([-iw, y - t, il], [-iw, y, il], [iw, y, il], [iw, y - t, il], { mat: sm });
  b.quad([iw, y - t, -il], [iw, y, -il], [-iw, y, -il], [-iw, y - t, -il], { mat: sm });
  b.quad([iw, y - t, il], [iw, y, il], [iw, y, -il], [iw, y - t, -il], { mat: sm });
  b.quad([-iw, y - t, -il], [-iw, y, -il], [-iw, y, il], [-iw, y - t, il], { mat: sm });
  b.pop();
  return { outerY: yo };
}

/* utilidades internas */
import * as THREE from 'three';
import * as G from '../render/geom.js';

function cornerBox(len, h, d) {
  const g = G.box(len, h, d);
  g.translate(0, -h / 2, 0);
  return g;
}

function rotZ(a) {
  return new THREE.Matrix4().makeRotationZ(a);
}
