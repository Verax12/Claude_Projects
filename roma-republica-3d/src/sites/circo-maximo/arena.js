/**
 * Circo Máximo — arena, passagem, carceres, metas, contadores de voltas, estátuas sobre colunas,
 * arco de Stertínio e pequenos santuários (Conso, Múrcia).
 *
 * Fontes (docs/pesquisa/10 §1): carceres desde 329 a.C. (Lív. 8.20.2), refeitas em 174 a.C. com
 * ova e metas (Lív. 41.27.6); partidas abobadadas abertas por uma única corda (Dion. 3.68.3–4);
 * metas retiradas em 46 a.C. para a batalha (Suet. Iul. 39.3); estátuas sobre colunas (Lív. 40.2.2);
 * arco de Stertínio com estátuas douradas (Lív. 33.27.4); Ara Consi no sopé do Palatino (Tác. Ann. 12.24).
 * SEM obelisco (augustano) e SEM golfinhos (Agripa, 33 a.C.).
 * Formas, medidas e posições não encontradas nas fontes = HIPÓTESE (declarada nos painéis).
 */
import * as THREE from 'three';
import * as G from '../../render/geom.js';
import { column, arch } from '../../arch/columns.js';
import { statue } from '../../arch/temple.js';
import { prop } from '../../arch/props.js';
import { R, H, Y0, FLOOR, XC, CURVE, CARCERES, STANDS_X0, RUN_X0, META_X, curveAngle } from './plan.js';
import { slab, zOf, K, sub } from './cavea.js';

const y = (rel) => Y0 + rel;
const SAND = [0.93, 0.86, 0.7];

/** Contorno da arena (retângulo + meia-lua com as mesmas cordas da cávea), em X/Z do circo. */
export function arenaOutline(r = R.arena, x0 = STANDS_X0) {
  const pts = [[x0, -r]];
  for (let k = 0; k <= CURVE.n; k++) {
    const a = curveAngle(k, 0);
    pts.push([XC + r * Math.cos(a), r * Math.sin(a)]);
  }
  pts.push([x0, r]);
  return pts;
}

/** Piso de areia da arena e da passagem junto às carceres. */
export function buildArenaFloor(b) {
  // arena (sobre o terreno rebaixado do fosso); só a face superior (as laterais ficam sob o revestimento)
  const top = FLOOR - (Y0 + H.channel - 0.1);
  b.prism(arenaOutline(), top, Y0 + H.channel - 0.1, { mat: 'dirt', color: SAND, sides: false, bottom: false });
  // passagem entre as carceres e as arquibancadas (entrada lateral da arena — HIPÓTESE)
  b.box(STANDS_X0 - CARCERES.front, FLOOR - y(H.found), 2 * R.portico, (CARCERES.front + STANDS_X0) / 2, y(H.found), 0, { mat: 'dirt', color: SAND, faces: { bottom: false } });
  // praça e calçadas de basalto do lado das carceres (área até a borda do sítio)
  b.box(14.5, 0.04, 2 * R.street1, CARCERES.back - 7.25, Y0, 0, { mat: 'basalt', collide: false, faces: { bottom: false } });
  for (const s of [-1, 1]) {
    b.box(RUN_X0 - CARCERES.back, 0.04, R.street1 - R.portico, (CARCERES.back + RUN_X0) / 2, Y0, s * (R.portico + R.street1) / 2, { mat: 'basalt', collide: false, faces: { bottom: false } });
    b.box(CARCERES.front - CARCERES.back, 0.04, R.portico - CARCERES.halfWidth, (CARCERES.front + CARCERES.back) / 2, Y0, s * (R.portico + CARCERES.halfWidth) / 2, { mat: 'basalt', collide: false, faces: { bottom: false } });
  }
}

/**
 * Carceres: 12 boxes abobadados (6 de cada lado) e um portão central para a procissão.
 * Quadro local: +Z = para a arena (+X do circo), x = −Z do circo; frente em z = 0, fundo em z = −8.
 */
export function buildCarceres(b, det, ctx) {
  const D = CARCERES.front - CARCERES.back; // 8
  const HW = CARCERES.halfWidth;
  const gateW = 7.0;
  const bayW = 5.0;
  const nSide = CARCERES.n / 2;
  const pierW = (HW - gateW / 2 - nSide * bayW) / (nSide + 1);
  const spring = 3.0;
  const thick = 0.6;
  const zc = -D / 2;
  const tufaC = [0.97, 0.95, 0.9];
  b.push(CARCERES.front, 0, 0, Math.PI / 2);
  det.push(CARCERES.front, 0, 0, Math.PI / 2);
  // portão central
  arch(b, 0, y(spring), zc, gateW, D, { mat: 'travertine', thickness: thick, segments: 12 });
  const gateTop = y(spring + gateW / 2 + thick);
  const ropeCollide = [];
  for (const s of [-1, 1]) {
    let x = gateW / 2;
    for (let i = 0; i <= nSide; i++) {
      const xa = x;
      const xb = x + pierW;
      const xl = s < 0 ? -xb : xa;
      const xr = s < 0 ? -xa : xb;
      const lo = Math.min(xl, xr);
      const hi = Math.max(xl, xr);
      // pilar: inteiro até a nascença; acima, só a parte entre os anéis dos arcos vizinhos
      b.box(hi - lo, spring + 0.5, D, (lo + hi) / 2, y(-0.5), zc, { mat: 'tufa', color: tufaC });
      const innerArch = true; // sempre há arco do lado de dentro (portão ou boxe anterior)
      // (inner = lado do portão central; outer = lado do próximo boxe, ausente no último pilar)
      const outerArch = i < nSide;
      const ua = lo + (s < 0 ? (outerArch ? thick : 0) : innerArch ? thick : 0);
      const ub = hi - (s < 0 ? (innerArch ? thick : 0) : outerArch ? thick : 0);
      b.box(ub - ua, gateTop - y(spring), D, (ua + ub) / 2, y(spring), zc, { mat: 'tufa', color: tufaC });
      // herma (pilarete com cabeça) diante do pilar, segurando a corda de largada (Platner, via nota 10)
      {
        const hx = (lo + hi) / 2;
        det.box(0.32, 1.1, 0.32, hx, FLOOR, 0.6, { mat: 'marble', collide: false });
        det.sphere(0.16, hx, FLOOR + 1.12, 0.6, { mat: 'marble' });
        det.box(0.4, 0.12, 0.38, hx, FLOOR + 0.9, 0.6, { mat: 'marble', collide: false });
      }
      x = xb;
      if (i === nSide) break;
      // boxe (vão abobadado)
      const bx0 = x;
      const bx1 = x + bayW;
      const cx = s < 0 ? -(bx0 + bx1) / 2 : (bx0 + bx1) / 2;
      arch(b, cx, y(spring), zc, bayW, D, { mat: 'travertine', thickness: thick, segments: 10 });
      // enchimento acima do arco do boxe até a cota do portão central
      b.box(bayW + 2 * thick, gateTop - y(spring + bayW / 2 + thick), D, cx, y(spring + bayW / 2 + thick), zc, { mat: 'tufa', color: tufaC });
      // porta de madeira no fundo (por onde entram os cavalos — HIPÓTESE)
      b.box(bayW, spring, 0.18, cx, y(-0.1), -D + 0.2, { mat: 'woodDark' });
      // corda de largada entre as hermas (uma corda única abria todas as partidas — Dion. 3.68.4)
      det.box(bayW + pierW, 0.05, 0.05, cx, FLOOR + 1.0, 0.6, { mat: 'cloth', color: '#9c8a64', collide: false });
      ropeCollide.push(cx);
      // palha no chão do boxe
      det.box(bayW - 0.4, 0.05, D - 1, cx, FLOOR, zc, { mat: 'cloth', color: '#c8b06a', collide: false });
      x = bx1;
    }
  }
  // corda: barreira de colisão (só se passa pelo portão central)
  for (const cx of ropeCollide) b.colliderBox(bayW, 1.3, 0.3, cx, FLOOR, 0.6);
  // ático, terraço e parapeito
  b.box(2 * HW, 1.3, D, 0, gateTop, zc, { mat: 'stucco', color: [0.95, 0.92, 0.86] });
  b.box(2 * HW + 0.4, 0.3, D + 0.4, 0, gateTop + 1.3, zc, { mat: 'travertine', collide: false });
  b.box(2 * HW, 1.0, 0.4, 0, gateTop + 1.6, -0.2, { mat: 'stucco', color: [0.95, 0.92, 0.86] });
  // faixa pintada sob a cornija (HIPÓTESE decorativa: estuque com friso vermelho)
  b.box(2 * HW + 0.02, 0.35, 0.02, 0, gateTop + 0.5, 0.01, { mat: 'paintRed', collide: false });
  det.pop();
  b.pop();
}

/** Metas (três cones sobre base semicircular), contadores de voltas e estátuas sobre colunas. */
export function buildSpina(b, det) {
  for (let m = 0; m < 2; m++) {
    const X = META_X[m];
    const out = m === 0 ? -1 : 1; // lado curvo voltado para a virada
    // base semicircular de pedra
    const pts = [];
    const r = 3.4;
    for (let i = 0; i <= 12; i++) {
      const a = -Math.PI / 2 + (i / 12) * Math.PI;
      pts.push([X + out * r * Math.cos(a), r * Math.sin(a)]);
    }
    b.prism(pts, 1.3, FLOOR - 0.05, { mat: 'tufa', bottom: false, color: [0.95, 0.93, 0.88] });
    b.prism(pts.map(([px, pz]) => [X + (px - X) * 1.04, pz * 1.04]), 0.18, FLOOR + 1.25, { mat: 'travertine', bottom: false, collide: false });
    // três cones leves (madeira pintada — desmontáveis, cf. Suet. Iul. 39.3)
    for (const a of [-0.9, 0, 0.9]) {
      const cx = X + out * 1.9 * Math.cos(a);
      const cz = 1.9 * Math.sin(a);
      b.cylinder(0.62, 0.14, 5.4, cx, FLOOR + 1.43, cz, { mat: 'wood', color: [1.25, 1.0, 0.55], segments: 12 });
      b.sphere(0.2, cx, FLOOR + 6.8, cz, { mat: 'bronze' });
      b.cylinder(0.7, 0.66, 0.2, cx, FLOOR + 1.43, cz, { mat: 'bronze', segments: 12 });
    }
  }
  // contador de voltas: sete "ovos" sobre uma trave (ova — Lív. 41.27.6; forma desconhecida)
  {
    const X = META_X[0] + 40;
    b.box(4.2, 0.8, 1.4, X, FLOOR - 0.05, 0, { mat: 'travertine', color: [0.96, 0.94, 0.9] });
    for (const s of [-1, 1]) b.box(0.22, 3.4, 0.22, X + s * 1.85, FLOOR + 0.75, 0, { mat: 'woodDark', collide: false });
    b.box(4.0, 0.16, 0.26, X, FLOOR + 4.1, 0, { mat: 'woodDark', collide: false });
    b.box(3.9, 0.12, 0.3, X, FLOOR + 2.55, 0, { mat: 'woodDark', collide: false });
    for (let i = 0; i < 7; i++) {
      const g = G.sphere(0.2, 10, 8).scale(1, 1.45, 1);
      b.add(g, { mat: 'stucco', color: [1, 0.98, 0.92], matrix: new THREE.Matrix4().makeTranslation(X - 1.5 + i * 0.5, FLOOR + 2.67 + 0.29, 0) });
    }
    b.colliderBox(4.2, 4.3, 1.4, X, FLOOR, 0);
  }
  // estátuas de bronze sobre colunas (cf. Lív. 40.2.2 — posição desconhecida)
  for (const X of [-50, 40, 130]) {
    b.box(1.5, 0.7, 1.5, X, FLOOR - 0.05, 0, { mat: 'travertine' });
    column(b, X, FLOOR + 0.65, 0, { order: 'tuscan', height: 6.0, diameter: 0.72, mat: 'travertine' });
    statue(b, X, FLOOR + 6.65, 0, { scale: 1.15, mat: 'bronze', pedestal: false, rotY: Math.PI / 2 });
  }
  // altar portátil e pequena edícula junto à meta primeira (os jogos eram rituais — HIPÓTESE de cena)
  prop(det, 'altar', META_X[0] + 8, FLOOR, 0, Math.PI / 2, 1);
}

/** Arco de Stertínio (196 a.C., Lív. 33.27.4) no ápice da meia-lua — posição HIPOTÉTICA. */
export function buildStertiniusArch(cv, sh) {
  const b = cv.b;
  const rC = 61.1; // meio do pórtico
  const zcen = zOf(sh, rC);
  const dep = 2.4;
  const open = 3.4;
  const pierW = 0.85;
  const spring = 3.6;
  const thick = 0.5;
  const top = spring + open / 2 + thick;
  const stuccoC = [0.97, 0.94, 0.88];
  for (const s of [-1, 1]) b.box(pierW, spring + 0.5, dep, s * (open / 2 + pierW / 2), y(-0.5), zcen, { mat: 'stucco', color: stuccoC });
  for (const s of [-1, 1]) b.box(pierW - thick, top - spring, dep, s * (open / 2 + thick + (pierW - thick) / 2), y(spring), zcen, { mat: 'stucco', color: stuccoC });
  arch(b, 0, y(spring), zcen, open, dep, { mat: 'travertine', thickness: thick, segments: 10 });
  const W = open + 2 * pierW;
  b.box(W + 0.3, 0.3, dep + 0.3, 0, y(top), zcen, { mat: 'travertine', collide: false });
  b.box(W, 1.3, dep, 0, y(top + 0.3), zcen, { mat: 'stucco', color: stuccoC });
  b.box(W + 0.3, 0.25, dep + 0.3, 0, y(top + 1.6), zcen, { mat: 'travertine', collide: false });
  // placa da inscrição (sem texto inventado)
  for (const zz of [zcen - dep / 2 - 0.02, zcen + dep / 2 + 0.02]) b.box(2.6, 0.75, 0.03, 0, y(top + 0.55), zz, { mat: 'travertine', color: [1.05, 1.03, 0.98], collide: false });
  // estátuas douradas (signa aurata)
  for (const [sx, sc] of [[-1.5, 0.9], [0, 1.05], [1.5, 0.9]]) statue(b, sx, y(top + 1.85), zcen, { scale: sc, mat: 'gold', baseMat: 'travertine', pedestalHeight: 0.5, rotY: Math.PI });
  // o piso do pórtico continua sob o arco
  slab(b, sh, R.facade, R.portico, Y0, y(0.06), 'slabsTufa', { collide: false });
}

/**
 * Altar de Conso e edícula de Múrcia junto ao sopé do Palatino, perto das carceres
 * (sugestão da nota 10, "Lacunas" 2 — forma e posição NÃO ENCONTRADAS).
 * No quadro do circo; lado do Palatino (Z < 0), voltados para a rua (+Z).
 */
export function buildShrines(b) {
  // Ara Consi: recinto baixo com o altar
  {
    const X = -252;
    const Z = -72.6;
    for (const [w, d, x, z] of [[4.4, 0.4, X, Z - 1.6], [0.4, 3.4, X - 2.0, Z], [0.4, 3.4, X + 2.0, Z], [1.4, 0.4, X - 1.5, Z + 1.6], [1.4, 0.4, X + 1.5, Z + 1.6]]) b.box(w, 0.85, d, x, Y0, z, { mat: 'tufa', color: [0.9, 0.88, 0.82] });
    b.box(4.6, 0.12, 3.6, X, Y0, Z, { mat: 'slabsTufa', collide: false });
    prop(b, 'altar', X, Y0 + 0.12, Z - 0.2, 0, 1.15);
  }
  // sacellum Murciae: pequena edícula de duas colunas
  {
    const X = -226;
    const Z = -72.4;
    b.push(X, Y0, Z, 0);
    b.box(3.0, 0.9, 2.6, 0, 0, 0, { mat: 'tufa', color: [0.92, 0.9, 0.84] });
    b.stairs(1.6, 1.0, 0.9, 0, 0, 2.3, { mat: 'tufa', steps: 4 });
    b.box(3.0, 2.6, 0.3, 0, 0.9, -1.15, { mat: 'stucco' });
    for (const s of [-1, 1]) b.box(0.3, 2.6, 2.2, s * 1.35, 0.9, -0.15, { mat: 'stucco' });
    for (const s of [-1, 1]) column(b, s * 1.05, 0.9, 1.0, { order: 'tuscan', height: 2.4, diameter: 0.28, mat: 'stucco' });
    b.box(3.2, 0.35, 2.8, 0, 3.4, 0, { mat: 'woodDark', collide: false });
    b.push(0, 0, 0, 0);
    // telhadinho de duas águas (frontão voltado para a rua)
    const ridge = 4.35;
    b.quad([1.7, 3.75, 1.5], [1.7, 3.75, -1.5], [0, ridge, -1.5], [0, ridge, 1.5], { mat: 'roofTile' });
    b.quad([-1.7, 3.75, -1.5], [-1.7, 3.75, 1.5], [0, ridge, 1.5], [0, ridge, -1.5], { mat: 'roofTile' });
    b.tri([-1.6, 3.75, 1.45], [1.6, 3.75, 1.45], [0, ridge - 0.05, 1.45], { mat: 'terracottaPainted' });
    b.pop();
    statue(b, 0, 0.9, -0.5, { scale: 0.75, mat: 'terracottaPainted', baseMat: 'stucco', pedestalHeight: 0.6 });
    b.pop();
  }
}

export { K, sub };
