/**
 * Subura — elementos especiais: lacus (bacia pública), capela compital, canteiro de demolição
 * (Fórum de César), insula em reconstrução depois de incêndio (andaimes e polispasto), prédio
 * escorado, varais, cães e mulas, interiores das tabernae visitáveis.
 *
 * Cada função recebe builders e trabalha no quadro local atual (b.push/pop feitos aqui).
 * Fontes e hipóteses estão comentadas junto de cada peça e repetidas nos painéis (texts.js).
 */
import * as THREE from 'three';
import * as G from '../../render/geom.js';
import { prop } from '../../arch/props.js';
import { column } from '../../arch/columns.js';
import { gableRoof } from '../../arch/roofs.js';
import { faceQuad } from './insula.js';
import { rng } from './plan.js';

const M4 = (x, y, z, ry = 0, rx = 0, rz = 0, s = 1) => {
  const m = new THREE.Matrix4().compose(
    new THREE.Vector3(x, y, z),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')),
    new THREE.Vector3(s, s, s),
  );
  return m;
};

/** Viga/poste entre dois pontos locais (caixa quadrada de lado t). */
export function beam(b, a, c, t, o = {}) {
  const dx = c[0] - a[0];
  const dy = c[1] - a[1];
  const dz = c[2] - a[2];
  const len = Math.hypot(dx, dy, dz);
  const g = G.box(t, len, t);
  const dir = new THREE.Vector3(dx, dy, dz).normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  const m = new THREE.Matrix4().compose(new THREE.Vector3(a[0], a[1], a[2]), q, new THREE.Vector3(1, 1, 1));
  b.add(g, { mat: o.mat || 'wood', color: o.color, matrix: m, collide: o.collide ?? false });
}

/** Monte de entulho/areia (cone irregular). */
function mound(b, x, y, z, r, h, o = {}) {
  const prof = [[r, -0.3], [r * 0.92, h * 0.18], [r * 0.7, h * 0.55], [r * 0.38, h * 0.88], [0.0, h]];
  b.lathe(prof, x, y, z, { mat: o.mat || 'opusIncertum', segments: o.segments ?? 9, color: o.color, rotY: o.rotY || 0 });
}

/* ------------------------------------------------------------------------- */
/*  Lacus — bacia pública de água                                            */
/* ------------------------------------------------------------------------- */
/**
 * Bacia retangular de lajes de pedra com bica num pilar (nota 07, lacuna 14: "1 bacia de pedra num
 * largo, rotulada hipotética"; Lívio 39.44.5: lacus revestidos de pedra em 184 a.C. — nota 10 §4).
 * Dimensões e forma: HIPÓTESE. Origem da água: um dos 4 aquedutos republicanos (nota 07 §6).
 */
export function lacus(b, x, y, z, rotY) {
  b.push(x, y, z, rotY);
  const L = 3.4;
  const W = 1.7;
  const h = 0.78;
  const t = 0.2;
  // fundo e paredes de lajes de peperino
  b.box(L, 0.25, W, 0, -0.2, 0, { mat: 'peperino' });
  b.box(L, h, t, 0, 0, W / 2 - t / 2, { mat: 'peperino' });
  b.box(L, h, t, 0, 0, -W / 2 + t / 2, { mat: 'peperino' });
  b.box(t, h, W - 2 * t, L / 2 - t / 2, 0, 0, { mat: 'peperino' });
  b.box(t, h, W - 2 * t, -L / 2 + t / 2, 0, 0, { mat: 'peperino' });
  // borda gasta (lajes de coroamento)
  b.box(L + 0.08, 0.07, t + 0.08, 0, h, W / 2 - t / 2, { mat: 'travertine', collide: false });
  b.box(L + 0.08, 0.07, t + 0.08, 0, h, -W / 2 + t / 2, { mat: 'travertine', collide: false });
  b.box(t + 0.08, 0.07, W - 2 * t, L / 2 - t / 2, h, 0, { mat: 'travertine', collide: false });
  b.box(t + 0.08, 0.07, W - 2 * t, -L / 2 + t / 2, h, 0, { mat: 'travertine', collide: false });
  // espelho d'água
  b.box(L - 2 * t, 0.02, W - 2 * t, 0, h - 0.18, 0, { mat: 'water', collide: false });
  // pilar com a bica de bronze e o jorro
  b.box(0.55, 1.45, 0.5, -L / 2 - 0.27, 0, 0, { mat: 'peperino' });
  b.box(0.62, 0.1, 0.57, -L / 2 - 0.27, 1.45, 0, { mat: 'travertine', collide: false });
  b.cylinder(0.035, 0.03, 0.32, -L / 2 + 0.0, 1.05, 0, { mat: 'bronze', segments: 8, rotY: 0 });
  b.add(G.cylinder(0.035, 0.03, 0.3, 8), { mat: 'bronze', matrix: M4(-L / 2 + 0.02, 1.08, 0, 0, 0, -Math.PI / 2) });
  b.add(G.cylinder(0.025, 0.04, 0.48, 6), { mat: 'water', matrix: M4(-L / 2 + 0.36, h - 0.18, 0, 0, 0, 0.35) });
  // ladrão e canaleta para a rua
  b.box(0.7, 0.05, 0.25, L / 2 + 0.35, 0.0, 0, { mat: 'peperino', collide: false, color: '#5d5a52' });
  b.pop();
}

/* ------------------------------------------------------------------------- */
/*  Compitum — capela dos Lares Compitales                                   */
/* ------------------------------------------------------------------------- */
/**
 * Pequena capela (kalias) de alvenaria junto à esquina, com altar baixo (Dion. Hal. 4.14.3–4;
 * nota 07 §5). Pintura de dois Lares: iconografia conhecida sobretudo de Pompeia (HIPÓTESE).
 * SEM Genius Augusti (augustano, posterior). Restos da festa (Compitalia, "poucos dias depois das
 * Saturnais"): bolos de mel (pelanoi), guirlandas e lucernas — ambientação de janeiro.
 */
export function compitumShrine(b, d, x, y, z, rotY) {
  b.push(x, y, z, rotY);
  const pc = '#e2d5bb';
  // pódio rebocado
  b.box(1.9, 1.05, 1.15, 0, 0, 0, { mat: 'plaster', color: pc });
  b.box(2.02, 0.1, 1.27, 0, 1.05, 0, { mat: 'tufa', color: '#d6cbb2', collide: false });
  // edícula: fundo, laterais, nicho pintado
  const y0 = 1.15;
  b.box(1.9, 1.55, 0.22, 0, y0, -0.46, { mat: 'plaster', color: pc });
  for (const s of [-1, 1]) b.box(0.22, 1.55, 0.7, s * 0.84, y0, -0.12, { mat: 'plaster', color: pc });
  faceQuad(b, 'front', -0.345, -0.72, 0.72, y0 + 0.05, y0 + 1.45, { mat: 'paintRed' });
  // dois Lares estilizados (túnica curta, braço erguido) — pintura simplificada
  for (const s of [-1, 1]) {
    const cx = s * 0.32;
    b.quad([cx - 0.11, y0 + 0.35, -0.34], [cx + 0.11, y0 + 0.35, -0.34], [cx + 0.07, y0 + 0.82, -0.34], [cx - 0.07, y0 + 0.82, -0.34], { mat: 'paintYellow' });
    b.quad([cx - 0.05, y0 + 0.83, -0.34], [cx + 0.05, y0 + 0.83, -0.34], [cx + 0.05, y0 + 0.95, -0.34], [cx - 0.05, y0 + 0.95, -0.34], { mat: 'plaster', color: '#c9a07a' });
    b.quad([cx - 0.05, y0 + 0.12, -0.34], [cx - 0.01, y0 + 0.12, -0.34], [cx - 0.01, y0 + 0.36, -0.34], [cx - 0.05, y0 + 0.36, -0.34], { mat: 'plaster', color: '#c9a07a' });
    b.quad([cx + 0.01, y0 + 0.12, -0.34], [cx + 0.05, y0 + 0.12, -0.34], [cx + 0.05, y0 + 0.36, -0.34], [cx + 0.01, y0 + 0.36, -0.34], { mat: 'plaster', color: '#c9a07a' });
    // braço erguido com o corno (rhyton) para fora
    const ax = cx + s * 0.1;
    b.quad([ax, y0 + 0.75, -0.339], [ax + s * 0.2, y0 + 0.98, -0.339], [ax + s * 0.2 + (s > 0 ? -0.04 : 0.04), y0 + 1.02, -0.339], [ax - s * 0.03, y0 + 0.79, -0.339], { mat: 'paintYellow' });
  }
  // serpente(s) e altar pintados na base do nicho (motivo comum nos larários — HIPÓTESE)
  b.quad([-0.5, y0 + 0.08, -0.339], [0.5, y0 + 0.08, -0.339], [0.5, y0 + 0.12, -0.339], [-0.5, y0 + 0.12, -0.339], { mat: 'plaster', color: '#3c5a2a' });
  // colunetas e frontão
  for (const s of [-1, 1]) column(b, s * 0.78, y0, 0.28, { order: 'tuscan', height: 1.4, diameter: 0.14, mat: 'stucco', collide: false });
  b.box(1.95, 0.18, 0.95, 0, y0 + 1.4, -0.12, { mat: 'stucco', collide: false });
  b.push(0, 0, -0.12, 0);
  gableRoof(b, 2.1, 1.05, 0, y0 + 1.58, 0, { pitch: 0.42, overhang: 0.08, overhangEnds: 0.12, mat: 'roofTile', gableMat: 'stucco' });
  b.pop();
  // altar baixo diante da capela
  prop(b, 'altar', 0, 0, 1.25, 0, 0.75, { mat: 'tufa', collide: true });
  // oferendas (no builder de detalhe)
  if (d) {
    d.push(0, 0, 1.25, 0);
    const top = 1.05 * 0.75 + 0.15;
    for (let i = 0; i < 4; i++) d.cylinder(0.07, 0.065, 0.035, -0.22 + i * 0.13, top, (i % 2) * 0.1 - 0.05, { mat: 'woodLight', color: '#b07a3a', segments: 8 });
    d.lathe([[0.0, 0], [0.06, 0.01], [0.07, 0.04], [0.03, 0.06], [0.0, 0.06]], 0.24, top, 0.05, { mat: 'terracotta', segments: 8 });
    d.sphere(0.025, 0.3, top + 0.06, 0.05, { mat: 'flame' });
    d.pop();
    // lucernas acesas na soleira do nicho e guirlanda verde em arco na frente
    for (const s of [-1, 1]) {
      d.lathe([[0.0, 0], [0.06, 0.01], [0.07, 0.04], [0.03, 0.06], [0.0, 0.06]], s * 0.5, y0 + 0.02, -0.2, { mat: 'terracotta', segments: 8 });
      d.sphere(0.022, s * 0.5 + 0.06, y0 + 0.08, -0.2, { mat: 'flame' });
    }
    for (let i = 0; i <= 10; i++) {
      const u = i / 10;
      const gx = -0.8 + 1.6 * u;
      const gy = y0 + 1.36 - Math.sin(u * Math.PI) * 0.32;
      d.sphere(0.07, gx, gy, 0.36, { mat: 'foliage', color: i % 3 === 0 ? '#8a3a2a' : '#4a6a2e', wSeg: 6, hSeg: 4 });
    }
  }
  b.pop();
}

/* ------------------------------------------------------------------------- */
/*  Sinais pintados (inscrições sugeridas)                                   */
/* ------------------------------------------------------------------------- */
/** Tabuleta caiada com "letras" pintadas de vermelho (inscrição sugerida, ilegível). */
export function paintedSign(b, x, y, z, w, h, seed) {
  const r = rng(seed);
  b.box(w, h, 0.03, x, y, z, { mat: 'plaster', color: '#efe8d8', collide: false });
  const rows = h > 0.5 ? 2 : 1;
  for (let k = 0; k < rows; k++) {
    let cx = x - w / 2 + 0.08;
    const yy = y + h * (rows === 2 ? (k === 0 ? 0.58 : 0.18) : 0.3);
    const hh = h * (rows === 2 ? 0.26 : 0.42);
    while (cx < x + w / 2 - 0.12) {
      const lw = 0.025 + r() * 0.03;
      const gap = 0.03 + r() * 0.05;
      const tall = r() < 0.8;
      faceQuad(b, 'front', z + 0.017, cx, cx + lw, yy, yy + (tall ? hh : hh * 0.4), { mat: 'paintRed' });
      if (r() < 0.35) faceQuad(b, 'front', z + 0.018, cx - 0.02, cx + lw + 0.04, yy + hh - 0.02, yy + hh + 0.005, { mat: 'paintRed' });
      cx += lw + gap + (r() < 0.2 ? 0.08 : 0);
    }
  }
}

/* ------------------------------------------------------------------------- */
/*  Andaimes e polispasto                                                    */
/* ------------------------------------------------------------------------- */
/**
 * Andaime de madeira encostado à fachada (x de x0 a x1, fachada em z = 0, para +Z), até a altura h.
 */
export function scaffold(b, x0, x1, h, o = {}) {
  const r = rng(o.seed ?? 3);
  const n = Math.max(2, Math.round((x1 - x0) / 1.9));
  const zs = [0.35, 1.45];
  for (let i = 0; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n;
    for (const zz of zs) beam(b, [x, -0.3, zz], [x + (r() - 0.5) * 0.06, h + 0.8, zz + (r() - 0.5) * 0.06], 0.11, { mat: 'wood', color: '#8a6a48' });
  }
  for (let y = 1.9; y < h + 0.5; y += 1.9) {
    for (const zz of zs) b.box(x1 - x0 + 0.3, 0.09, 0.09, (x0 + x1) / 2, y, zz, { mat: 'wood', collide: false, color: '#7a5a3a' });
    // tábuas de trabalho
    for (let k = 0; k < 4; k++) b.box(x1 - x0 + 0.2, 0.05, 0.24, (x0 + x1) / 2, y + 0.09, 0.45 + k * 0.27, { mat: 'woodLight', collide: false });
    // travessas para a parede (putlogs)
    for (let i = 0; i <= n; i += 1) b.box(0.08, 0.08, 1.7, x0 + ((x1 - x0) * i) / n, y - 0.08, 0.7, { mat: 'wood', collide: false, color: '#6a4a30' });
  }
  // contraventamento em X
  for (let i = 0; i < n; i += 2) {
    const xa = x0 + ((x1 - x0) * i) / n;
    const xb = x0 + ((x1 - x0) * (i + 1)) / n;
    beam(b, [xa, 0.2, 1.55], [xb, Math.min(h, 3.8), 1.55], 0.07, { mat: 'wood', color: '#7a5a3a' });
  }
  // escada de mão
  const lx = x0 + 0.6;
  beam(b, [lx - 0.22, 0, 2.2], [lx - 0.22, 1.95, 1.55], 0.06, { mat: 'wood' });
  beam(b, [lx + 0.22, 0, 2.2], [lx + 0.22, 1.95, 1.55], 0.06, { mat: 'wood' });
  for (let k = 1; k < 7; k++) {
    const u = k / 7;
    b.box(0.44, 0.04, 0.04, lx, u * 1.95, 2.2 - u * 0.65, { mat: 'wood', collide: false });
  }
  // colisão: o andaime é um obstáculo junto à fachada
  b.colliderBox(x1 - x0 + 0.3, h, 1.4, (x0 + x1) / 2, 0, 0.9);
}

/**
 * Polispasto de duas pernas (cabrilha) com sarilho: "gruas (rodas de tração/polispasto)" para
 * obras — tipo descrito por Vitrúvio 10.2 (não está nas notas de pesquisa: forma HIPOTÉTICA).
 * Pés em z = zf (frente), inclinado sobre a fachada (−Z), com carga pendurada.
 */
export function shearLegs(b, x, y, zf, h, o = {}) {
  b.push(x, y, zf, 0);
  const lean = o.lean ?? 1.6;
  const top = [0, h, -lean];
  beam(b, [-1.3, 0, 0], top, 0.18, { mat: 'wood', color: '#7d5c3c', collide: 'box' });
  beam(b, [1.3, 0, 0], top, 0.18, { mat: 'wood', color: '#7d5c3c', collide: 'box' });
  b.box(0.8, 0.12, 0.12, 0, h - 0.4, -lean + 0.1, { mat: 'woodDark', collide: false });
  // estais (cordas) para trás
  beam(b, top, [0, 0, 6.5], 0.035, { mat: 'cloth', color: '#a89070' });
  // moitão e carga (bloco de tufo)
  const hookY = h * 0.45;
  beam(b, [0, h - 0.3, -lean], [0, hookY + 0.5, -lean], 0.03, { mat: 'cloth', color: '#a89070' });
  beam(b, [0.08, h - 0.3, -lean], [0.08, hookY + 0.5, -lean], 0.03, { mat: 'cloth', color: '#a89070' });
  b.box(0.22, 0.32, 0.18, 0, hookY + 0.5, -lean, { mat: 'woodDark', collide: false });
  for (const s of [-1, 1]) beam(b, [0, hookY + 0.5, -lean], [s * 0.35, hookY + 0.1, -lean], 0.025, { mat: 'cloth', color: '#a89070' });
  b.box(0.9, 0.55, 0.6, 0, hookY - 0.45, -lean, { mat: 'tufa', collide: false });
  // sarilho (cilindro horizontal com alavancas) junto aos pés
  b.box(0.12, 0.9, 0.12, -0.7, 0, 1.0, { mat: 'wood' });
  b.box(0.12, 0.9, 0.12, 0.7, 0, 1.0, { mat: 'wood' });
  b.add(G.cylinder(0.16, 0.16, 1.3, 10), { mat: 'wood', color: '#8a6a48', matrix: M4(-0.65, 0.75, 1.0, 0, 0, -Math.PI / 2) });
  for (const a of [0, Math.PI / 2]) b.add(G.box(0.05, 1.3, 0.05), { mat: 'woodDark', matrix: M4(0.3, 0.75, 1.0, 0, a, 0).multiply(new THREE.Matrix4().makeTranslation(0, -0.65, 0)) });
  beam(b, [0, 0.75, 1.0], top, 0.03, { mat: 'cloth', color: '#a89070' });
  b.pop();
}

/* ------------------------------------------------------------------------- */
/*  Escoras                                                                  */
/* ------------------------------------------------------------------------- */
/** Escoras diagonais contra a fachada (x0..x1) até a altura h, com rachadura desenhada. */
export function shoring(b, x0, x1, h, yCrack, o = {}) {
  const r = rng(o.seed ?? 9);
  // frechal encostado à parede
  b.box(x1 - x0, 0.22, 0.2, (x0 + x1) / 2, h - 0.1, 0.11, { mat: 'woodDark', collide: false });
  const n = Math.max(2, Math.round((x1 - x0) / 2.2));
  for (let i = 0; i <= n; i++) {
    const x = x0 + 0.3 + ((x1 - x0 - 0.6) * i) / n;
    beam(b, [x, 0, 1.55], [x, h, 0.22], 0.2, { mat: 'wood', color: '#7a5a3c', collide: 'box' });
    b.box(0.5, 0.18, 0.5, x, -0.05, 1.6, { mat: 'tufa', collide: false });
  }
  // rachadura em ziguezague
  let cx = (x0 + x1) / 2 + (r() - 0.5);
  let cy = yCrack;
  for (let k = 0; k < 9; k++) {
    const nx = cx + (r() - 0.5) * 0.6;
    const ny = cy + 0.45 + r() * 0.3;
    b.quad([cx - 0.03, cy, 0.015], [cx + 0.03, cy, 0.015], [nx + 0.03, ny, 0.015], [nx - 0.03, ny, 0.015], { mat: 'plaster', color: '#2a221b' });
    cx = nx;
    cy = ny;
  }
}

/* ------------------------------------------------------------------------- */
/*  Animais (cães da Subura, mulas)                                          */
/* ------------------------------------------------------------------------- */
/** Cão deitado ou de pé ("latrent Suburanae canes", Horácio, Epod. 5.58 — nota 07 §1). */
export function dog(b, x, y, z, rotY, o = {}) {
  const col = o.color || '#6b4a2e';
  const lying = o.lying ?? true;
  b.push(x, y, z, rotY);
  const by = lying ? 0.16 : 0.42;
  b.add(G.sphere(0.2, 8, 6).scale(1, 0.85, 2.0), { mat: 'flat', color: col, matrix: M4(0, by, 0) });
  b.add(G.sphere(0.12, 8, 6).scale(1, 0.95, 1.25), { mat: 'flat', color: col, matrix: M4(0, by + (lying ? 0.06 : 0.22), 0.48) });
  b.add(G.box(0.08, 0.06, 0.14), { mat: 'flat', color: '#2a1f17', matrix: M4(0, by + (lying ? 0.02 : 0.18), 0.6) });
  for (const s of [-1, 1]) b.add(G.box(0.05, 0.09, 0.03), { mat: 'flat', color: col, matrix: M4(s * 0.07, by + (lying ? 0.15 : 0.31), 0.44, 0, 0, s * 0.3) });
  if (lying) {
    for (const s of [-1, 1]) b.add(G.box(0.07, 0.06, 0.32), { mat: 'flat', color: col, matrix: M4(s * 0.09, 0.02, 0.36) });
    b.add(G.box(0.05, 0.05, 0.38), { mat: 'flat', color: col, matrix: M4(0.12, 0.05, -0.5, 0.6) });
  } else {
    for (const [sx, sz] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) b.add(G.box(0.06, 0.42, 0.06), { mat: 'flat', color: col, matrix: M4(sx * 0.09, 0, sz * 0.27) });
    b.add(G.box(0.04, 0.04, 0.32), { mat: 'flat', color: col, matrix: M4(0, by + 0.12, -0.5, 0, -0.7) });
  }
  b.pop();
}

/** Mula com cangalha e cestos (tropas de mulas com carga — nota 11 §17–18). */
export function mule(b, x, y, z, rotY, o = {}) {
  const col = o.color || '#6e5a48';
  b.push(x, y, z, rotY);
  b.add(G.sphere(0.32, 10, 7).scale(1, 0.95, 2.1), { mat: 'flat', color: col, matrix: M4(0, 1.05, 0) });
  for (const [sx, sz] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) b.add(G.cylinder(0.055, 0.045, 0.95, 6), { mat: 'flat', color: col, matrix: M4(sx * 0.15, 0, sz * 0.48) });
  b.add(G.cylinder(0.11, 0.14, 0.62, 8), { mat: 'flat', color: col, matrix: M4(0, 1.15, 0.6, 0, 0.8) });
  b.add(G.sphere(0.15, 8, 6).scale(0.8, 0.9, 1.7), { mat: 'flat', color: col, matrix: M4(0, 1.55, 0.95, 0, 0.5) });
  for (const s of [-1, 1]) b.add(G.box(0.05, 0.28, 0.07), { mat: 'flat', color: col, matrix: M4(s * 0.08, 1.7, 0.78, 0, -0.2, s * 0.25) });
  // cangalha e cestos
  b.box(0.75, 0.12, 0.7, 0, 1.33, 0, { mat: 'woodDark', collide: false });
  for (const s of [-1, 1]) b.add(G.cylinder(0.24, 0.2, 0.5, 10), { mat: 'woodLight', matrix: M4(s * 0.46, 0.85, 0) });
  b.colliderBox(0.9, 1.5, 1.6, 0, 0, 0);
  b.pop();
}

/* ------------------------------------------------------------------------- */
/*  Varais entre fachadas                                                    */
/* ------------------------------------------------------------------------- */
/** Corda com roupas entre dois pontos do mundo (a e c = [x,y,z]). */
export function laundryLine(b, a, c, seed) {
  const r = rng(seed);
  const sag = 0.35;
  const N = 6;
  const P = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    P.push([a[0] + (c[0] - a[0]) * u, a[1] + (c[1] - a[1]) * u - Math.sin(u * Math.PI) * sag, a[2] + (c[2] - a[2]) * u]);
  }
  for (let i = 0; i < N; i++) beam(b, P[i], P[i + 1], 0.02, { mat: 'cloth', color: '#8a7a60' });
  const len = Math.hypot(c[0] - a[0], c[2] - a[2]);
  const ang = Math.atan2(-(c[2] - a[2]), c[0] - a[0]);
  const cols = ['#e8dfcc', '#d6c7a6', '#9e4b34', '#5f6f84', '#c9b48a', '#7c5a3c', '#efe9dc', '#a8763e'];
  let u = 0.12 + r() * 0.1;
  while (u < 0.9) {
    const cw = (0.5 + r() * 0.7) / len;
    const um = Math.min(0.95, u + cw / 2);
    const px = a[0] + (c[0] - a[0]) * um;
    const pz = a[2] + (c[2] - a[2]) * um;
    const py = a[1] + (c[1] - a[1]) * um - Math.sin(um * Math.PI) * sag;
    const ch = 0.45 + r() * 0.5;
    b.push(px, 0, pz, ang);
    b.box(cw * len, ch, 0.02, 0, py - ch, 0, { mat: 'cloth', color: cols[Math.floor(r() * cols.length)], collide: false });
    b.pop();
    u += cw + 0.05 + r() * 0.12;
  }
}

/* ------------------------------------------------------------------------- */
/*  Interiores das tabernae visitáveis                                       */
/* ------------------------------------------------------------------------- */
/**
 * Mobília e mercadoria de uma taberna visitável (quadro local do lote; a sala vai de x0 a x1,
 * de z = −zIn (fundo) a z = −rec (vão), piso em y = 0, teto em fh0).
 * @param {object} bi builder de interior   @param {object} room {x0,x1,depth,rec,fh0,trade,seed}
 * @returns {{ npc: {x,z,yaw}[] }} posições sugeridas de NPC (quadro local)
 */
export function shopInterior(bi, room) {
  const r = rng(room.seed);
  const { x0, x1, depth, rec, fh0, trade } = room;
  const W = x1 - x0;
  const cx = (x0 + x1) / 2;
  const zb = -depth; // parede do fundo
  const npcs = [];
  // revestimento: reboco pobre (UV por face), piso de terra batida ou signinum, vigas do teto
  const lining = { mat: 'plasterPoor', collide: false };
  bi.box(0.04, fh0, depth - rec, x0 + 0.02, 0, -(depth + rec) / 2, lining);
  bi.box(0.04, fh0, depth - rec, x1 - 0.02, 0, -(depth + rec) / 2, lining);
  bi.box(W, fh0, 0.04, cx, 0, zb + 0.02, lining);
  bi.floor(W, depth - rec, cx, 0.03, -(depth + rec) / 2, { mat: trade === 'caupona' || trade === 'tonstrina' ? 'signinum' : 'dirt', collide: false });
  for (let z = -rec - 0.3; z > zb + 0.2; z -= 0.65) bi.box(W, 0.16, 0.13, cx, fh0 - 0.16, z, { mat: 'woodDark', collide: false });
  // mezanino (pergula) no fundo, com escada de mão
  const lofD = Math.min(2.2, (depth - rec) * 0.38);
  const lofY = 2.35;
  bi.box(W - 0.1, 0.12, lofD, cx, lofY, zb + lofD / 2, { mat: 'wood', collide: false });
  bi.box(W - 0.1, 0.18, 0.12, cx, lofY - 0.18, zb + lofD, { mat: 'woodDark', collide: false });
  const lx = x1 - 0.55;
  const lzA = zb + lofD + 0.75;
  for (const s of [-1, 1]) beam(bi, [lx + s * 0.2, 0, lzA], [lx + s * 0.2, lofY + 0.6, zb + lofD - 0.05], 0.05, { mat: 'wood' });
  for (let k = 1; k < 9; k++) {
    const u = k / 9;
    bi.box(0.4, 0.035, 0.035, lx, u * (lofY + 0.6), lzA - u * (lzA - (zb + lofD - 0.05)), { mat: 'wood', collide: false });
  }
  // coisas guardadas no mezanino
  for (let i = 0; i < 3; i++) prop(bi, i % 2 ? 'sack' : 'basket', x0 + 0.5 + i * 0.7, lofY + 0.12, zb + 0.6, i, 0.9);
  // lucerna pendurada
  bi.box(0.01, 0.6, 0.01, cx, fh0 - 0.6, -rec - 1.4, { mat: 'iron', collide: false });
  bi.lathe([[0.0, 0], [0.07, 0.01], [0.08, 0.05], [0.03, 0.07], [0.0, 0.07]], cx, fh0 - 0.68, -rec - 1.4, { mat: 'terracotta', segments: 8 });
  bi.sphere(0.03, cx + 0.08, fh0 - 0.61, -rec - 1.4, { mat: 'flame' });

  const shelf = (sx, sz, len, ys, rotY = 0) => {
    bi.push(sx, 0, sz, rotY);
    for (const yy of ys) bi.box(len, 0.04, 0.38, 0, yy, 0, { mat: 'wood', collide: false });
    for (const s of [-1, 1]) bi.box(0.05, ys[ys.length - 1] + 0.05, 0.38, s * (len / 2 - 0.03), 0, 0, { mat: 'woodDark', collide: false });
    bi.pop();
  };
  const counter = (len, zc, col) => {
    bi.box(len, 0.95, 0.6, x0 + len / 2 + 0.05, 0, zc, { mat: 'plaster', color: col || '#d9c8a6', collide: true });
    bi.box(len + 0.05, 0.06, 0.66, x0 + len / 2 + 0.05, 0.95, zc, { mat: 'tufa', color: '#d8cfba', collide: false });
  };
  const zMid = -(depth + rec) / 2;

  switch (trade) {
    case 'pistrinum': {
      // padaria (Plínio 18.107: padeiros em Roma desde a guerra contra Perseu): moinhos e forno.
      // Moinho de "ampulheta" de lava (meta + catillus) — forma conhecida de Pompeia: HIPÓTESE.
      for (const [mx, mz] of [[cx - W * 0.22, zMid + 0.4], [cx + W * 0.2, zMid - 0.6]]) {
        bi.cylinder(0.6, 0.62, 0.35, mx, 0, mz, { mat: 'basalt', segments: 14, collide: true });
        bi.lathe([[0.42, 0], [0.38, 0.5], [0.12, 0.95], [0.0, 1.0]], mx, 0.35, mz, { mat: 'basalt', segments: 14 });
        bi.lathe([[0.36, 0], [0.24, 0.42], [0.36, 0.85], [0.3, 0.88], [0.16, 0.45], [0.3, 0.06]], mx, 0.72, mz, { mat: 'basalt', segments: 14 });
        bi.box(1.6, 0.1, 0.1, mx, 1.15, mz, { mat: 'woodDark', collide: false });
      }
      // forno abobadado de tijolo/tufo no fundo
      bi.box(1.9, 0.8, 1.6, x0 + 1.05, 0, zb + 0.85, { mat: 'tufa', color: '#b9a888' });
      bi.add(new THREE.SphereGeometry(0.85, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), { mat: 'tufa', color: '#a8957a', matrix: M4(x0 + 1.05, 0.8, zb + 0.85, 0, 0, 0, 1) });
      faceQuad(bi, 'front', zb + 1.66, x0 + 0.8, x0 + 1.3, 0.8, 1.2, { mat: 'plaster', color: '#140c08' });
      bi.box(0.5, 0.05, 0.05, x0 + 1.05, 1.22, zb + 1.66, { mat: 'iron', collide: false });
      // mesa de sovar e pães
      bi.box(1.5, 0.8, 0.7, x1 - 0.95, 0, -rec - 0.9, { mat: 'wood', collide: true });
      for (let i = 0; i < 3; i++) prop(bi, 'bread', x1 - 1.4 + i * 0.45, 0.8, -rec - 0.9, i * 0.6, 0.9);
      for (let i = 0; i < 3; i++) prop(bi, 'sack', x1 - 0.4, 0, zb + 2.0 + i * 0.55, i, 1.0, { color: '#d9ccaa' });
      npcs.push({ x: x1 - 0.95, z: -rec - 1.5, yaw: 0, pose: 'work' });
      break;
    }
    case 'caupona': {
      // balcão de alvenaria em L com jarras embutidas (paralelo pompeiano: HIPÓTESE, nota 07 §4)
      counter(Math.min(2.4, W * 0.55), -rec - 0.75, '#c88f63');
      bi.box(0.6, 0.95, 1.4, x0 + 0.35, 0, -rec - 1.75, { mat: 'plaster', color: '#c88f63' });
      for (let i = 0; i < 3; i++) bi.cylinder(0.17, 0.17, 0.02, x0 + 0.45 + i * 0.6, 0.97, -rec - 0.75, { mat: 'plaster', color: '#2a1d14', segments: 10 });
      // prateleira com ânforas e jarras; ânforas encostadas no fundo
      shelf(x1 - 0.3, zMid, 2.2, [0.5, 1.2, 1.9], Math.PI / 2);
      for (let i = 0; i < 4; i++) prop(bi, 'jar', x1 - 0.3, 1.24, zMid - 0.8 + i * 0.5, i, 0.9);
      for (let i = 0; i < 5; i++) {
        const g = new THREE.Matrix4().compose(new THREE.Vector3(cx - W / 2 + 0.6 + i * 0.42, 0.05, zb + 0.35), new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.22, 0, 0)), new THREE.Vector3(1, 1, 1));
        bi.add(G.merge([G.normalizeGeometry(G.lathe([[0.0, 0.0], [0.04, 0.03], [0.07, 0.15], [0.15, 0.45], [0.16, 0.62], [0.12, 0.75], [0.06, 0.82], [0.055, 1.05], [0.075, 1.1], [0.0, 1.11]], 10))]), { mat: 'terracotta', matrix: g });
      }
      // mesa e banquinhos
      prop(bi, 'table', cx + 0.3, 0, zMid + 0.2, 0.2, 0.75, { collide: true });
      for (const [sx, sz] of [[-0.6, 0.0], [0.9, 0.5], [0.2, -0.6]]) prop(bi, 'stool', cx + 0.3 + sx, 0, zMid + 0.2 + sz, 0, 1);
      npcs.push({ x: x0 + 1.2, z: -rec - 1.4, yaw: 0, pose: 'work' });
      npcs.push({ x: cx + 0.3 - 0.6, z: zMid + 0.2, yaw: Math.PI / 2, pose: 'sit' });
      break;
    }
    case 'sutor': {
      // sapateiro (a fama do Argileto vem de Marcial, posterior: analogia)
      bi.box(1.6, 0.75, 0.7, cx, 0, zMid, { mat: 'wood', collide: true });
      prop(bi, 'stool', cx, 0, zMid + 0.7, 0, 1);
      for (let i = 0; i < 6; i++) bi.box(0.09, 0.07, 0.24, cx - 0.6 + i * 0.22, 0.75, zMid - 0.1 + (i % 2) * 0.15, { mat: 'woodDark', collide: false });
      shelf(x1 - 0.3, zMid - 0.4, 2.0, [0.4, 0.9, 1.4, 1.9], Math.PI / 2);
      for (let k = 0; k < 4; k++) for (let i = 0; i < 4; i++) bi.box(0.1, 0.08, 0.26, x1 - 0.3, 0.44 + k * 0.5, zMid - 1.1 + i * 0.45, { mat: 'woodDark', color: '#3a2618', collide: false });
      // couros pendurados na parede
      for (let i = 0; i < 3; i++) faceQuad(bi, 'right', x0 + 0.06, zMid - 1.2 + i * 0.9, zMid - 0.5 + i * 0.9, 1.0, 2.0, { mat: 'cloth', color: ['#7a4e2c', '#5e3a20', '#8a5a34'][i] });
      npcs.push({ x: cx, z: zMid + 0.7, yaw: Math.PI, pose: 'sit' });
      break;
    }
    case 'tonstrina': {
      // barbeiro (Horácio, Epist. 1.1.91: o pobre muda de cenacula, camas, banhos e barbeiros)
      prop(bi, 'stool', cx, 0, zMid + 0.4, 0, 1.1);
      prop(bi, 'bench', x0 + 0.35, 0, zMid, Math.PI / 2, 1);
      bi.cylinder(0.25, 0.18, 0.12, x1 - 0.5, 0.9, zMid - 0.8, { mat: 'bronze', segments: 12 });
      bi.box(0.5, 0.9, 0.5, x1 - 0.5, 0, zMid - 0.8, { mat: 'wood', collide: true });
      shelf(x1 - 0.25, zMid + 0.6, 1.2, [1.1, 1.6], Math.PI / 2);
      bi.cylinder(0.12, 0.12, 0.01, x1 - 0.07, 1.5, zMid + 1.3, { mat: 'bronze', segments: 14 });
      npcs.push({ x: cx + 0.55, z: zMid + 0.4, yaw: -Math.PI / 2, pose: 'work' });
      npcs.push({ x: cx, z: zMid + 0.4, yaw: 0, pose: 'sit', type: 'citizen' });
      npcs.push({ x: x0 + 0.4, z: zMid + 0.3, yaw: Math.PI / 2, pose: 'sit', type: 'citizen' });
      break;
    }
    case 'librarius': {
      // livreiro: "ad librariorum curram scrinia" (Catulo 14.17–18) — estantes com rolos.
      for (const s of [-1, 1]) {
        const sx = s < 0 ? x0 + 0.25 : x1 - 0.25;
        bi.push(sx, 0, zMid, Math.PI / 2 * -s);
        bi.box(2.6, 2.0, 0.4, 0, 0, 0, { mat: 'woodDark', collide: true, color: '#3e2a1c' });
        for (let k = 0; k < 4; k++) for (let i = 0; i < 6; i++) {
          faceQuad(bi, 'front', 0.205, -1.2 + i * 0.41, -0.85 + i * 0.41, 0.15 + k * 0.47, 0.5 + k * 0.47, { mat: 'plaster', color: '#1c140e' });
          for (let j = 0; j < 3; j++) bi.add(G.cylinder(0.035, 0.035, 0.32, 6), { mat: 'cloth', color: ['#e9dfc6', '#d8c9a5', '#cdb98f'][(i + j + k) % 3], matrix: M4(-1.12 + i * 0.41 + j * 0.08, 0.2 + k * 0.47 + (j % 2) * 0.06, 0.05, 0, Math.PI / 2) });
        }
        bi.pop();
      }
      prop(bi, 'table', cx, 0, zMid + 0.6, 0, 0.8, { collide: true });
      for (let i = 0; i < 3; i++) bi.add(G.cylinder(0.04, 0.04, 0.34, 6), { mat: 'cloth', color: '#e3d6b6', matrix: M4(cx - 0.3 + i * 0.25, 0.64, zMid + 0.6, 0.4 * i, 0, Math.PI / 2) });
      bi.cylinder(0.2, 0.2, 0.45, cx + 0.8, 0, zb + 0.6, { mat: 'woodLight', segments: 12, collide: true });
      npcs.push({ x: cx, z: zMid + 1.1, yaw: Math.PI, pose: 'stand' });
      break;
    }
    case 'lanarius': {
      // tecidos e lã de cores naturais (Plínio 8.190–191, nota 11 §11)
      counter(Math.min(2.2, W * 0.5), -rec - 0.8, '#d8c8a8');
      shelf(x1 - 0.3, zMid - 0.3, 2.4, [0.5, 1.0, 1.5, 2.0], Math.PI / 2);
      const wool = ['#e6dcc6', '#d8ccb0', '#9c8c70', '#5e4a3c', '#8e3b2c', '#4d5a6a', '#b8a888'];
      for (let k = 0; k < 4; k++) for (let i = 0; i < 4; i++) bi.box(0.32, 0.16, 0.5, x1 - 0.3, 0.54 + k * 0.5, zMid - 1.2 + i * 0.6, { mat: 'cloth', color: wool[(i + k * 2) % wool.length], collide: false });
      for (let i = 0; i < 3; i++) {
        prop(bi, 'basket', cx - 0.4 + i * 0.6, 0, zb + 0.8, 0, 1.2);
        bi.add(G.sphere(0.24, 8, 5).scale(1, 0.55, 1), { mat: 'cloth', color: wool[i], matrix: M4(cx - 0.4 + i * 0.6, 0.24, zb + 0.8) });
      }
      for (let i = 0; i < 2; i++) bi.box(0.65, 0.95, 0.03, x0 + 0.6 + i * 0.8, 1.4, zb + 0.08, { mat: 'cloth', color: wool[4 + i], collide: false });
      npcs.push({ x: x0 + 1.0, z: -rec - 1.4, yaw: 0, pose: 'work' });
      break;
    }
    case 'figulus': {
      // louça de barro ("louça campana", Horácio, Sat. 1.6.118) e lucernas
      shelf(x1 - 0.3, zMid, 2.6, [0.45, 1.0, 1.55], Math.PI / 2);
      shelf(x0 + 0.3, zMid, 2.6, [0.45, 1.0, 1.55], -Math.PI / 2);
      for (const sx of [x1 - 0.3, x0 + 0.3]) for (let k = 0; k < 3; k++) for (let i = 0; i < 5; i++) {
        if (k === 2) bi.cylinder(0.14, 0.1, 0.05, sx, 1.59, zMid - 1.0 + i * 0.5, { mat: 'terracotta', segments: 10, color: '#a85a34' });
        else prop(bi, 'jar', sx, 0.49 + k * 0.55, zMid - 1.0 + i * 0.5, i, 0.7 + (k % 2) * 0.2);
      }
      for (let i = 0; i < 6; i++) prop(bi, i % 3 ? 'jar' : 'amphora', cx - 0.8 + (i % 3) * 0.55, 0, zb + 0.5 + Math.floor(i / 3) * 0.5, i, i % 3 ? 1.1 : 0.8);
      npcs.push({ x: cx, z: -rec - 1.3, yaw: 0, pose: 'stand' });
      break;
    }
    case 'holitor':
    default: {
      // verduras e legumes (Horácio, Sat. 1.6.112–115: alho-poró, grão-de-bico; o preço do farro).
      // Nada de produtos americanos (tomate, batata, milho — nota 08).
      counter(Math.min(2.4, W * 0.6), -rec - 0.7, '#d4c09a');
      const goods = [['#5d7a34', 'leek'], ['#d6c08a', 'chickpea'], ['#4f6a2c', 'cabbage'], ['#c9a24a', 'farro']];
      for (let i = 0; i < 4; i++) {
        const gx = x0 + 0.45 + i * 0.55;
        prop(bi, 'basket', gx, 1.0, -rec - 0.7, 0, 0.9);
        const [col, kind] = goods[i];
        if (kind === 'leek') for (let j = 0; j < 5; j++) bi.add(G.cylinder(0.02, 0.025, 0.4, 5), { mat: 'flat', color: j % 2 ? '#e8e4cf' : col, matrix: M4(gx - 0.1 + j * 0.05, 1.05, -rec - 0.7, 0, Math.PI / 2 - 0.2) });
        else if (kind === 'cabbage') for (let j = 0; j < 3; j++) bi.sphere(0.1, gx - 0.1 + j * 0.1, 1.03, -rec - 0.7, { mat: 'foliage', color: col });
        else bi.add(G.sphere(0.2, 8, 4).scale(1, 0.3, 1), { mat: 'flat', color: col, matrix: M4(gx, 1.1, -rec - 0.7) });
      }
      for (let i = 0; i < 4; i++) prop(bi, 'sack', x1 - 0.45, 0, zb + 0.5 + i * 0.6, i, 1.05, { color: '#cdbb92' });
      npcs.push({ x: x0 + 1.0, z: -rec - 1.3, yaw: 0, pose: 'work' });
      break;
    }
  }
  return { npcs };
}
