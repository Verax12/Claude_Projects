/**
 * Macellum — constantes de implantação, quadros de referência e utilidades geométricas.
 *
 * IMPLANTAÇÃO (docs/LAYOUT.md, área `macellum`): lote alinhado ao Fórum, u 65…135 × v 100…160
 * (referencial FORUM_FRAME), atrás (NNE) da Basílica Emília e a leste do Argileto.
 * Nota 08 §1: localização "atrás da Basílica Paulli" (⚠ não confirmada), eixo ≈ 119°/299°,
 * dimensões, planta e orientação NÃO ENCONTRADAS → toda a planta abaixo é RECONSTRUÇÃO HIPOTÉTICA
 * (pátio com tholos central cercado de lojas — frase de Platner, ⚠ não confirmada).
 *
 * QUADRO LOCAL DO EDIFÍCIO (todas as medidas do sítio):
 *   origem no centro do lote (u = 100, v = 130), y = 0 no piso do pátio (cota Y0 do mundo);
 *   +X local = ESE (eixo u do Fórum), +Z local = SSO (rumo à Basílica Emília / Fórum),
 *   −Z local = NNE, −X local = ONO (rumo ao Argileto).
 *   Ou seja: rotY = FORUM_FRAME.rectRotY = facingRotY(209) (fachada principal para SSO).
 *
 * ALAS: cada ala (S, N, L, O) tem um quadro próprio com x' ao longo da ala e d (= z')
 * medido da face EXTERNA do muro para DENTRO (rumo ao pátio).
 */
import { FORUM_FRAME, forumUV } from '../../data/layout.js';

/** Centro do lote e rotação do quadro do edifício. */
export const CENTER = forumUV(100, 130);
export const ROT = FORUM_FRAME.rectRotY;
/** Cota do pátio (y do mundo). O vale entre o Fórum (y = 0) e a encosta da Vélia. */
export const Y0 = 0.3;
/** Dimensões do lote (área do LAYOUT): 70 m ao longo de u × 60 m ao longo de v. */
export const LOT = { w: 70, d: 60 };

/* ------------------------------------------------------------------ */
/*  Medidas do edifício (hipotéticas — ver painel de informação)        */
/* ------------------------------------------------------------------ */
export const M = {
  OX: 33, // meia-largura externa (ao longo de u) → 66 m
  OZ: 27, // meia-profundidade externa (ao longo de v) → 54 m
  WALL: 0.6, // muro externo (opus quadratum de tufo)
  SHOP_IN: 5.2, // face interna do muro frontal das lojas (a partir da face externa)
  FRONT_T: 0.45, // espessura do muro frontal / divisórias (≈ 1,5 pé — Vitr. 2.8.17)
  FRONT: 5.65, // face do muro frontal voltada para o pórtico
  COL_D: 9.4, // eixo das colunas do pórtico
  STYLO: 9.8, // borda do estilóbata (degrau para o pátio)
  FLOOR: 0.2, // piso do pórtico e das lojas (um degrau acima do pátio)
  COL_H: 4.4, // altura das colunas toscanas (base + fuste + capitel)
  COL_DIAM: 0.55,
  ENT_H: 0.6, // entablamento (arquitrave + friso + cornija)
  PORT_HI: 6.2, // cota do telhado do pórtico junto ao muro frontal
  PORT_PITCH: 0.22,
  RIDGE: 8.0, // cumeeira do telhado das lojas
  RIDGE_D: 2.9, // posição da cumeeira (meio da faixa das lojas)
  ROOF_PITCH: 0.27,
  SHOP_W: 4.2, // largura típica de uma taberna (eixo a eixo)
  MEZZ: 3.2, // base do mezanino de madeira (pergula)
  DOOR_H: 3.2,
  GATE_S: 5.0, // largura da passagem do portão sul
  GATE_W: 4.5, // largura da passagem do portão oeste
};

/** Pátio: borda do estilóbata. */
export const COURT = { hx: M.OX - M.STYLO, hz: M.OZ - M.STYLO };

/* ------------------------------------------------------------------ */
/*  Quadros de referência (2D, no plano XZ)                             */
/* ------------------------------------------------------------------ */

/** Quadro 2D: origem (ox, oz) no mundo e rotação rot (mesma convenção do Builder/three.js). */
export class Frame {
  constructor(ox, oz, rot) {
    this.ox = ox;
    this.oz = oz;
    this.rot = rot;
    this.c = Math.cos(rot);
    this.s = Math.sin(rot);
  }

  /** Ponto local → mundo. */
  toWorld(lx, lz) {
    return { x: this.ox + lx * this.c + lz * this.s, z: this.oz - lx * this.s + lz * this.c };
  }

  /** Ponto local → [x, z] do mundo (para caminhos de NPC). */
  xz(lx, lz) {
    const p = this.toWorld(lx, lz);
    return [+p.x.toFixed(2), +p.z.toFixed(2)];
  }

  /** Quadro filho (posição e rotação relativas a este). */
  child(lx, lz, r) {
    const p = this.toWorld(lx, lz);
    return new Frame(p.x, p.z, this.rot + r);
  }

  /** Yaw do mundo para uma direção local (dx, dz). */
  yawOf(dx, dz) {
    return this.rot + Math.atan2(dx, dz);
  }

  /** Rumo de bússola (graus) de uma direção local (dx, dz). */
  bearingOf(dx, dz) {
    const wx = dx * this.c + dz * this.s;
    const wz = -dx * this.s + dz * this.c;
    let b = (Math.atan2(wx, -wz) * 180) / Math.PI;
    if (b < 0) b += 360;
    return b;
  }
}

/** Quadro do edifício. */
export const FB = new Frame(CENTER.x, CENTER.z, ROT);

/**
 * Alas: posição da face externa (no quadro do edifício) e rotação para que d (= +Z da ala)
 * aponte para dentro. `span` = meia-extensão da faixa de lojas ao longo de x'.
 */
export const WINGS = [
  { id: 'S', pos: [0, M.OZ], rot: Math.PI, half: M.OX, span: M.OX - M.FRONT, court: COURT.hx },
  { id: 'N', pos: [0, -M.OZ], rot: 0, half: M.OX, span: M.OX - M.FRONT, court: COURT.hx },
  { id: 'E', pos: [M.OX, 0], rot: -Math.PI / 2, half: M.OZ, span: M.OZ - M.FRONT, court: COURT.hz },
  { id: 'W', pos: [-M.OX, 0], rot: Math.PI / 2, half: M.OZ, span: M.OZ - M.FRONT, court: COURT.hz },
];
for (const w of WINGS) w.frame = FB.child(w.pos[0], w.pos[1], w.rot);

/** Ponto do quadro da ala (x', d) → quadro do edifício (bx, bz). */
export function wingToB(wing, xp, d) {
  const c = Math.cos(wing.rot);
  const s = Math.sin(wing.rot);
  return { x: wing.pos[0] + xp * c + d * s, z: wing.pos[1] - xp * s + d * c };
}

/**
 * Divide a faixa de lojas de uma ala em tabernae, deixando livre a passagem do portão
 * (gate = { at, w } em x'). Devolve [{ x0, x1, cx, w }].
 */
export function shopsOf(wing, gate = null) {
  const spans = [];
  const a = -wing.span;
  const b = wing.span;
  if (gate) {
    spans.push([a, gate.at - gate.w / 2]);
    spans.push([gate.at + gate.w / 2, b]);
  } else spans.push([a, b]);
  const out = [];
  for (const [s0, s1] of spans) {
    const L = s1 - s0;
    const n = Math.max(1, Math.round(L / M.SHOP_W));
    const w = L / n;
    for (let i = 0; i < n; i++) out.push({ x0: s0 + i * w, x1: s0 + (i + 1) * w, cx: s0 + (i + 0.5) * w, w });
  }
  return out;
}

/* ------------------------------------------------------------------ */
/*  Telhado em anel (pátio): 4 trapézios com meia-esquadria nas quinas  */
/* ------------------------------------------------------------------ */

/**
 * Telhado em anel entre dois retângulos concêntricos (quadro do edifício):
 *   a = { hx, hz, y } e b = { hx, hz, y } (bordas interna e externa, em qualquer ordem).
 * Gera as águas (normal para cima), o forro de madeira (normal para baixo) e as testeiras
 * nas bordas. Como os afastamentos são iguais em X e Z, as quinas se encontram nas diagonais.
 * @param {object} o { mat, soffitMat, t (espessura), fasciaA, fasciaB }
 */
export function ringRoof(b, A, B, o = {}) {
  const mat = o.mat || 'roofTile';
  const sm = o.soffitMat === undefined ? 'woodDark' : o.soffitMat;
  const t = o.t ?? 0.15;
  const sides = [
    (r) => [[-r.hx, r.hz], [r.hx, r.hz]], // +Z
    (r) => [[r.hx, -r.hz], [-r.hx, -r.hz]], // −Z
    (r) => [[r.hx, r.hz], [r.hx, -r.hz]], // +X
    (r) => [[-r.hx, -r.hz], [-r.hx, r.hz]], // −X
  ];
  for (const f of sides) {
    const [a0, a1] = f(A);
    const [b0, b1] = f(B);
    const P = [
      [a0[0], A.y, a0[1]],
      [a1[0], A.y, a1[1]],
      [b1[0], B.y, b1[1]],
      [b0[0], B.y, b0[1]],
    ];
    quadFacing(b, P, +1, { mat });
    if (sm) {
      const Q = P.map((p) => [p[0], p[1] - t, p[2]]);
      quadFacing(b, Q, -1, { mat: sm });
      // testeiras (espessura) nas duas bordas
      // a borda do retângulo menor (interna) fica voltada para o centro; a outra, para fora
      const sA = A.hx < B.hx ? -1 : 1;
      if (o.fasciaA !== false) quadFacingOut(b, [P[0], P[1], Q[1], Q[0]], { mat: sm }, sA);
      if (o.fasciaB !== false) quadFacingOut(b, [P[3], P[2], Q[2], Q[3]], { mat: sm }, -sA);
    }
  }
}

/** Quad com a normal voltada para cima (dir = +1) ou para baixo (dir = −1). */
export function quadFacing(b, P, dir, o) {
  const [a, c, d, e] = P;
  const ux = c[0] - a[0], uy = c[1] - a[1], uz = c[2] - a[2];
  const vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
  const ny = uz * vx - ux * vz;
  if (ny * dir >= 0) b.quad(a, c, d, e, o);
  else b.quad(a, e, d, c, o);
}

/** Quad vertical com a normal voltada para longe do centro (0,0) do quadro (sign = −1: para o centro). */
export function quadFacingOut(b, P, o, sign = 1) {
  const [a, c, d, e] = P;
  const ux = c[0] - a[0], uy = c[1] - a[1], uz = c[2] - a[2];
  const vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
  const nx = uy * vz - uz * vy;
  const nz = ux * vy - uy * vx;
  const mx = (a[0] + c[0] + d[0] + e[0]) / 4;
  const mz = (a[2] + c[2] + d[2] + e[2]) / 4;
  if ((nx * mx + nz * mz) * sign >= 0) b.quad(a, c, d, e, o);
  else b.quad(a, e, d, c, o);
}
