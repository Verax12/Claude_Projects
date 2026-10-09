/**
 * Templo de cella TRANSVERSAL (mais larga que profunda) com pronaos mais estreito à frente —
 * planta em "T", como a do Templo da Concórdia (Platner: planta de Opímio "semelhante à
 * tiberiana", de cella larga) e a do Templo de Véiove (cella transversal de 15 × 8,90 m e
 * pronaos tetrastilo centrado na fachada, Musei Capitolini).
 *
 * Quadro local: fachada para +Z, origem no centro da frente da cella (z = 0 é o plano entre a
 * cella e o pronaos), y = 0 na base do pódio.
 *   cella:   x ∈ [−cw/2, cw/2], z ∈ [−cd, 0]
 *   pronaos: x ∈ [−pw/2, pw/2], z ∈ [0, pd]
 *   escada:  z ∈ [pd, pd + stairs.depth]
 */
import { column, entablature } from '../../arch/columns.js';
import { gableRoof } from '../../arch/roofs.js';

export function transverseTemple(b, o) {
  const { cw, cd, pw, pd } = o;
  const Hp = o.podiumH;
  const Hc = o.colH;
  const D = o.colD;
  const podMat = o.podiumMat || 'tufa';
  const wallMat = o.wallMat || 'stucco';
  const entMat = o.entMat || 'stucco';
  const colMat = o.colMat || 'stucco';
  const top = Hp;
  const podColor = o.podiumColor;

  // ---------------- pódio (fundação enterrada 3 m) ----------------
  b.box(cw, Hp + 3, cd, 0, -3, -cd / 2, { mat: podMat, color: podColor });
  b.box(pw, Hp + 3, pd, 0, -3, pd / 2, { mat: podMat, color: podColor });
  // molduras de base e de coroamento
  const mold = (w, d, z) => {
    b.box(w + 0.5, 0.55, d + 0.5, 0, 0, z, { mat: podMat, collide: false, color: podColor });
    b.box(w + 0.36, 0.35, d + 0.36, 0, top - 0.35, z, { mat: podMat, collide: false, color: podColor });
  };
  mold(cw, cd, -cd / 2);
  mold(pw, pd, pd / 2);
  b.floor(pw - 0.3, pd - 0.2, 0, top + 0.03, pd / 2, { mat: o.floorMat || 'slabs' });

  // ---------------- escada frontal ----------------
  const sw = o.stairs.width;
  const sd = o.stairs.depth;
  b.stairs(sw, sd, Hp, 0, 0, pd + sd, { mat: o.stairsMat || podMat, color: podColor });
  for (const s of [-1, 1]) b.box(0.7, Hp, sd, s * (sw / 2 + 0.35), 0, pd + sd / 2, { mat: podMat, color: podColor });

  // ---------------- colunas do pronaos ----------------
  const margin = D * 0.85;
  const nF = o.columnsFront;
  const frontZ = pd - margin;
  const span = o.colSpan ?? pw - 2 * margin;
  const xs = [];
  for (let i = 0; i < nF; i++) xs.push(-span / 2 + (span * i) / (nF - 1));
  const inter = span / (nF - 1);
  const colOpts = { order: o.order, height: Hc, diameter: D, mat: colMat, fluted: o.fluted };
  for (const x of xs) column(b, x, top, frontZ, colOpts);
  const nSide = o.columnsSide ?? 0;
  const sideStep = o.sideStep ?? inter;
  for (let k = 1; k <= nSide; k++) {
    const z = frontZ - k * sideStep;
    if (z < 0.6) break;
    column(b, xs[0], top, z, colOpts);
    column(b, xs[nF - 1], top, z, colOpts);
  }

  // ---------------- cella ----------------
  const wt = o.wallT ?? 0.9;
  const wallH = Hc;
  const doorW = o.doorW ?? 3.2;
  const doorH = o.doorH ?? Math.min(wallH * 0.7, 6);
  b.wall(-cw / 2, cw / 2, -wt / 2, wallH, wt, { y: top, mat: wallMat, openings: [{ at: cw / 2, w: doorW, h: doorH }] });
  b.box(cw, wallH, wt, 0, top, -cd + wt / 2, { mat: wallMat });
  for (const s of [-1, 1]) b.box(wt, wallH, cd - 2 * wt, s * (cw / 2 - wt / 2), top, -cd / 2, { mat: wallMat });
  // antas: prolongamento das paredes laterais do pronaos (pilastras) se pedido
  if (o.antae) for (const s of [-1, 1]) b.box(D * 0.9, wallH, 1.2, s * (span / 2), top, 0.6, { mat: wallMat });
  // pilastras nos cantos da cella
  for (const s of [-1, 1]) for (const z of [-cd + 0.35, -0.35]) b.box(0.9, wallH, 0.9, s * (cw / 2 - 0.25), top, z, { mat: wallMat, collide: false });
  // piso da cella (visual; o pódio é sólido)
  b.floor(cw - 2 * wt, cd - 2 * wt, 0, top + 0.03, -cd / 2, { mat: o.cellaFloorMat || 'slabs' });

  // ---------------- entablamento ----------------
  const entY = top + Hc;
  const entH = o.entH ?? Hc * 0.2;
  const eo = { mat: entMat, colH: Hc, height: entH, order: o.order, dentils: o.dentils ?? true };
  // pronaos: frente e lados
  entablature(b, xs[0] - D * 0.6, xs[nF - 1] + D * 0.6, frontZ, D * 1.1, entY, eo);
  for (const s of [-1, 1]) {
    b.push(s * (span / 2), 0, frontZ / 2, Math.PI / 2);
    entablature(b, -frontZ / 2 - 0.2, frontZ / 2 + D * 0.6, 0, D * 1.1, entY, { ...eo, dentils: false });
    b.pop();
  }
  // cella: cornija contínua ao redor
  entablature(b, -cw / 2, cw / 2, -wt / 2, wt + 0.3, entY, { ...eo, dentils: false });
  entablature(b, -cw / 2, cw / 2, -cd + wt / 2, wt + 0.3, entY, { ...eo, dentils: false });
  for (const s of [-1, 1]) {
    b.push(s * (cw / 2 - wt / 2), 0, -cd / 2, Math.PI / 2);
    entablature(b, -cd / 2, cd / 2, 0, wt + 0.3, entY, { ...eo, dentils: false });
    b.pop();
  }
  // forro de madeira sobre o pronaos e a cella
  b.box(span + D, 0.2, frontZ, 0, entY - 0.05, frontZ / 2, { mat: 'woodDark', collide: false });
  b.box(cw - 2 * wt, 0.25, cd - 2 * wt, 0, entY - 0.05, -cd / 2, { mat: 'woodDark', collide: false });

  const roofY = entY + entH;
  const pitch = o.pitch ?? 0.22;
  // ---------------- telhados em T ----------------
  // pronaos: cumeeira ao longo de Z, frontão na frente
  const pW = span + D * 1.2;
  const prL = frontZ + cd * 0.5;
  const pr = gableRoof(b, pW + 0.4, prL, 0, roofY, frontZ - prL / 2 + 0.15, {
    pitch, overhang: 0.5, overhangEnds: 0.3, mat: o.roofMat || 'roofTile', gableMat: o.pedimentMat || entMat, cornice: true, corniceMat: entMat,
  });
  // cella: cumeeira ao longo de X (frontões laterais)
  b.push(0, 0, -cd / 2, Math.PI / 2);
  const cr = gableRoof(b, cd + 0.3, cw + 0.3, 0, roofY, 0, {
    pitch, overhang: 0.55, overhangEnds: 0.35, mat: o.roofMat || 'roofTile', gableMat: o.pedimentMat || entMat, cornice: true, corniceMat: entMat,
  });
  b.pop();

  return {
    podiumTop: top,
    frontZ,
    entY,
    roofY,
    pronaosRidge: pr.ridgeY,
    cellaRidge: cr.ridgeY,
    pedimentZ: frontZ + 0.3 + 0.15,
    pedimentW: pW + 0.4,
    columnXs: xs,
    wallT: wt,
    stairsFrontZ: pd + sd,
  };
}
