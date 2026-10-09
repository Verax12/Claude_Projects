/**
 * forum-praca — utilidades compartilhadas pelos módulos do sítio.
 *
 * Todo o sítio é modelado no REFERENCIAL DO FÓRUM (FORUM_FRAME, src/data/layout.js):
 *   u = ao longo do eixo da praça, para ESE (rumo 119°);
 *   v = perpendicular, para NNE (rumo 29°).
 * Dentro de um Builder, `pushForumFrame(b)` abre um quadro local em que
 *   x local = u,   z local = −v,   y = cota do mundo.
 * Para posicionar NPCs, vegetação e instâncias (coordenadas do mundo) use `forumUV(u, v)`.
 */
import * as G from '../../render/geom.js';
import { FORUM_FRAME, forumUV, SITE_AREAS } from '../../data/layout.js';
import { facingRotY } from '../../core/geo.js';

export { FORUM_FRAME, forumUV };

/** Rotação Y do referencial do Fórum (eixo u → rumo 119°). */
export const ROT = FORUM_FRAME.rectRotY;

/** Retângulo da praça (área do LAYOUT): u −20…85, v −28…38. */
export const PIAZZA = { u0: -20, u1: 85, v0: -28, v1: 38 };

/**
 * Corredor da Via Sacra (área do LAYOUT): u 85…330, v ±9.
 * Divisão transversal adotada (hipótese de modelagem, nota 03 §11: 5–7 m de largura):
 *   leito de basalto |v| ≤ 3,25 · meio-fio 3,25–3,55 · calçada 3,55–5,5 · lojas 5,5–9.
 */
export const VIA = { u0: 85, u1: 330, half: 9, street: 3.25, curb: 3.55, walk: 5.5, shopBack: 9.0 };

/** Cota do topo do pavimento da praça (o terreno nivelado fica em y = 0). */
export const PAVE_Y = 0.06;
/** Elevação do leito da rua sobre o terreno e da calçada sobre o terreno. */
export const STREET_LIFT = 0.05;
export const WALK_LIFT = 0.2;

/** Polígonos das áreas do sítio (praça e corredor da Via Sacra). */
export const AREA_PIAZZA = SITE_AREAS['forum-praca'][0];
export const AREA_VIA = SITE_AREAS['forum-praca'][1];

/** Abre o quadro do Fórum no builder (x = u, z = −v). Feche com b.pop(). */
export function pushForumFrame(b) {
  b.push(FORUM_FRAME.origin[0], 0, FORUM_FRAME.origin[1], ROT);
}

/** Altura do terreno num ponto (u, v). */
export function heightUV(terrain, u, v) {
  const p = forumUV(u, v);
  return terrain.heightAt(p.x, p.z);
}

/**
 * Rotação local (dentro do quadro do Fórum) para que a FACHADA (+Z local) aponte para o
 * rumo de bússola dado. Ex.: fRot(209) = 0 (fachada para SSO, −v); fRot(29) = π (para NNE).
 */
export function fRot(bearingDeg) {
  return facingRotY(bearingDeg) - ROT;
}

/** yaw de NPC (direção em que olha) a partir de um rumo de bússola. */
export function yawFromBearing(bearingDeg) {
  return Math.PI - (bearingDeg * Math.PI) / 180;
}

/** Rumo de bússola (graus) de uma direção expressa em (du, dv) do referencial do Fórum. */
export function bearingUV(du, dv) {
  const x = du * FORUM_FRAME.u[0] + dv * FORUM_FRAME.v[0];
  const z = du * FORUM_FRAME.u[1] + dv * FORUM_FRAME.v[1];
  let b = (Math.atan2(x, -z) * 180) / Math.PI;
  if (b < 0) b += 360;
  return b;
}

/** Converte um ponto (u, v) em nó de caminho de NPC [x, z] (ou [x, y, z]). */
export function nodeUV(u, v, y = null) {
  const p = forumUV(u, v);
  return y == null ? [p.x, p.z] : [p.x, y, p.z];
}

/* ------------------------------------------------------------------------- */
/*  Ruído determinístico (variação de cor das lajes, escolha de módulos)      */
/* ------------------------------------------------------------------------- */

/** Hash 0–1 de inteiros. */
export function hash2(i, j, seed = 0) {
  let h = (i * 374761393 + j * 668265263 + seed * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/** Ruído de valor suave (0–1) com período característico `scale` (m). */
export function valueNoise(x, y, scale, seed = 0) {
  const fx = x / scale;
  const fy = y / scale;
  const i = Math.floor(fx);
  const j = Math.floor(fy);
  const tx = fx - i;
  const ty = fy - j;
  const sx = tx * tx * (3 - 2 * tx);
  const sy = ty * ty * (3 - 2 * ty);
  const a = hash2(i, j, seed);
  const b = hash2(i + 1, j, seed);
  const c = hash2(i, j + 1, seed);
  const d = hash2(i + 1, j + 1, seed);
  return (a * (1 - sx) + b * sx) * (1 - sy) + (c * (1 - sx) + d * sx) * sy;
}

/** Distância de um ponto a uma polilinha [[x, y], ...]. */
export function distToPolyline(x, y, line) {
  let best = Infinity;
  for (let k = 0; k < line.length - 1; k++) {
    const [ax, ay] = line[k];
    const [bx, by] = line[k + 1];
    const dx = bx - ax;
    const dy = by - ay;
    const l2 = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / l2));
    best = Math.min(best, Math.hypot(ax + t * dx - x, ay + t * dy - y));
  }
  return best;
}

/* ------------------------------------------------------------------------- */
/*  Geometria auxiliar                                                        */
/* ------------------------------------------------------------------------- */

/**
 * Quadrilátero com a face voltada para CIMA (inverte a ordem se necessário).
 * `u0`/`v0` deslocam as UVs (em metros) para dar continuidade à textura entre peças.
 */
export function upQuad(a, b, c, d, o = {}) {
  const n = normalOf(a, b, c);
  const pts = n[1] >= 0 ? [a, b, c, d] : [d, c, b, a];
  return G.quad(...pts, o);
}

/** Quadrilátero cuja face aponta para a direção horizontal `out` = [nx, nz]. */
export function sideQuad(a, b, c, d, out, o = {}) {
  const n = normalOf(a, b, c);
  const pts = n[0] * out[0] + n[2] * out[1] >= 0 ? [a, b, c, d] : [d, c, b, a];
  return G.quad(...pts, o);
}

/** Triângulo com a face voltada para `out` = [nx, ny, nz]. */
export function orientedTri(a, b, c, out) {
  const n = normalOf(a, b, c);
  return n[0] * out[0] + n[1] * out[1] + n[2] * out[2] >= 0 ? G.triangle(a, b, c) : G.triangle(a, c, b);
}

function normalOf(a, b, c) {
  const ux = b[0] - a[0];
  const uy = b[1] - a[1];
  const uz = b[2] - a[2];
  const vx = c[0] - a[0];
  const vy = c[1] - a[1];
  const vz = c[2] - a[2];
  return [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx];
}

/** Cilindro (tronco de cone) entre dois pontos 3D — galhos, pernas, varas. */
export function cylinderBetween(p0, p1, r0, r1, seg = 6) {
  const dx = p1[0] - p0[0];
  const dy = p1[1] - p0[1];
  const dz = p1[2] - p0[2];
  const len = Math.hypot(dx, dy, dz) || 0.001;
  const g = G.cylinder(r0, r1, len, seg, { caps: false });
  // orienta o eixo Y do cilindro na direção p0→p1
  const yaw = Math.atan2(dx, dz);
  const pitch = Math.acos(Math.max(-1, Math.min(1, dy / len)));
  g.rotateX(pitch);
  g.rotateY(yaw);
  g.translate(p0[0], p0[1], p0[2]);
  return g;
}

/** Esfera achatada/alongada centrada em (x, y, z) com semieixos (rx, ry, rz). */
export function ellipsoid(x, y, z, rx, ry, rz, wSeg = 10, hSeg = 7) {
  const g = G.sphere(1, wSeg, hSeg);
  g.translate(0, -1, 0);
  g.scale(rx, ry, rz);
  g.translate(x, y, z);
  return g;
}
