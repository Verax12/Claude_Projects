/**
 * Templos paramétricos: templo de pódio (tipo itálico / helenístico-romano) e templo redondo (tholos).
 *
 * O quadro local tem origem no centro da planta do pódio, ao nível do chão; a fachada
 * aponta para +Z. Posicione com b.push(x, y, z, facingRotY(rumo)).
 *
 * Os parâmetros (dimensões, nº de colunas, ordem, materiais) DEVEM vir das fontes
 * registradas em docs/pesquisa. Os valores padrão abaixo são apenas genéricos.
 */
import { column, entablature } from './columns.js';
import { gableRoof } from './roofs.js';
import * as G from '../render/geom.js';
import * as THREE from 'three';

/**
 * Templo de pódio.
 * @param {import('../core/Builder.js').Builder} b
 * @param {object} o {
 *   width, length: dimensões do pódio (m) — X (frente) e Z (profundidade);
 *   podiumHeight; podiumMat; moldings (true);
 *   stairs: { width, depth, inset:false, type:'front'|'none'|'lateral' } (frontais, projetando-se além do pódio se !inset);
 *   order; columnsFront; columnsDeep (fileiras do pronaos incluindo a frontal); porchFull (todas as colunas em todas as fileiras);
 *   layout: 'prostyle' | 'peripteral' | 'sine-postico';
 *   columnsSide (nº de colunas em cada lado para períptero, incluindo os cantos);
 *   columnHeight; columnDiameter; colMat; fluted;
 *   entMat; entHeight; wallMat; wallInnerMat; floorMat; roofMat; ceilingMat;
 *   cellaWidth; cellae (1 ou 3); doorWidth; doorHeight; pitch (0.22 ≈ Vitrúvio 3.5.12);
 *   statue (true/false); acroteria (true/false); colorFrieze (cor de vértice opcional p/ o friso)
 * }
 * @returns {object} cotas e coordenadas úteis (podiumTop, frontZ, cella…)
 */
export function podiumTemple(b, o) {
  const W = o.width;
  const L = o.length;
  const Hp = o.podiumHeight ?? 3;
  const D = o.columnDiameter ?? W / 12;
  const Hc = o.columnHeight ?? D * 8;
  const order = o.order || 'tuscan';
  const podMat = o.podiumMat || 'tufa';
  const colMat = o.colMat || 'stucco';
  const entMat = o.entMat || 'stucco';
  const wallMat = o.wallMat || 'stucco';
  const wallIn = o.wallInnerMat || wallMat;
  const floorMat = o.floorMat || 'slabs';
  const nF = o.columnsFront ?? 6;
  const layout = o.layout || 'prostyle';
  const st = o.stairs || { width: W * 0.7, depth: Hp * 1.4 };
  const stairsType = st.type || 'front';
  const margin = D * 0.75;
  const top = Hp;

  // ---------------- pódio ----------------
  let podFrontZ = L / 2;
  if (stairsType === 'front' && st.inset) podFrontZ = L / 2 - st.depth;
  const podLen = podFrontZ + L / 2;
  const podCz = (podFrontZ - L / 2) / 2;
  // fundação enterrada (evita frestas em terreno inclinado)
  b.box(W, Hp + 3, podLen, 0, -3, podCz, { mat: podMat });
  if (o.moldings !== false) {
    b.box(W + 0.5, Math.min(0.6, Hp * 0.15), podLen + 0.5, 0, 0, podCz, { mat: podMat, collide: false }); // moldura de base
    b.box(W + 0.36, 0.35, podLen + 0.36, 0, top - 0.35, podCz, { mat: podMat, collide: false }); // coroamento
  }
  // piso do pódio
  b.floor(W - 0.2, podLen - 0.2, 0, top + 0.02, podCz, { mat: floorMat, collide: false });

  // ---------------- escadas ----------------
  if (stairsType === 'front') {
    if (st.inset) {
      // escada recortada no pódio, entre muretas laterais
      b.stairs(st.width, st.depth, Hp, 0, 0, L / 2, { mat: podMat });
      const sideW = (W - st.width) / 2;
      if (sideW > 0.05) {
        for (const s of [-1, 1]) b.box(sideW, Hp, st.depth, s * (st.width / 2 + sideW / 2), 0, L / 2 - st.depth / 2, { mat: podMat });
      }
    } else {
      b.stairs(st.width, st.depth, Hp, 0, 0, L / 2 + st.depth, { mat: podMat });
      if (o.stairWings !== false) {
        for (const s of [-1, 1]) {
          b.box(0.6, Hp, st.depth, s * (st.width / 2 + 0.3), 0, L / 2 + st.depth / 2, { mat: podMat });
        }
      }
    }
  }

  // ---------------- colunas ----------------
  const frontRowZ = podFrontZ - margin - D * 0.2;
  const span = W - 2 * margin;
  const xs = [];
  for (let i = 0; i < nF; i++) xs.push(-span / 2 + (span * i) / Math.max(1, nF - 1));
  const inter = nF > 1 ? span / (nF - 1) : span;
  const colOpts = { order, height: Hc, diameter: D, mat: colMat, fluted: o.fluted };
  let cellaFrontZ;
  let rearZ = -L / 2 + margin + D * 0.2;
  if (layout === 'prostyle') {
    const deep = o.columnsDeep ?? 2;
    for (let r = 0; r < deep; r++) {
      const zr = frontRowZ - r * inter;
      for (let i = 0; i < nF; i++) {
        const edge = i === 0 || i === nF - 1;
        if (r === 0 || edge || o.porchFull) column(b, xs[i], top, zr, colOpts);
      }
    }
    cellaFrontZ = frontRowZ - (deep - 1) * inter - inter * 0.6;
  } else {
    const nS = o.columnsSide ?? Math.max(3, Math.round((frontRowZ - rearZ) / inter) + 1);
    const step = (frontRowZ - rearZ) / (nS - 1);
    for (let i = 0; i < nF; i++) column(b, xs[i], top, frontRowZ, colOpts);
    for (let k = 1; k < nS; k++) {
      const zr = frontRowZ - k * step;
      column(b, xs[0], top, zr, colOpts);
      column(b, xs[nF - 1], top, zr, colOpts);
    }
    if (layout === 'peripteral') for (let i = 1; i < nF - 1; i++) column(b, xs[i], top, rearZ, colOpts);
    cellaFrontZ = frontRowZ - inter * (o.pronaosRows ?? 1.6);
  }

  // ---------------- cella ----------------
  const wallT = o.wallThickness ?? Math.max(0.6, D * 0.9);
  const cellaW = o.cellaWidth ?? (layout === 'prostyle' ? span + D : span - 2 * inter + D);
  const cx0 = -cellaW / 2;
  const cx1 = cellaW / 2;
  const cz0 = layout === 'sine-postico' || layout === 'prostyle' ? -L / 2 + 0.3 : rearZ + inter * 0.8;
  const cz1 = cellaFrontZ;
  const wallH = Hc;
  const doorW = o.doorWidth ?? Math.min(4, cellaW * 0.3);
  const doorH = o.doorHeight ?? Math.min(wallH * 0.75, doorW * 2.2);
  const cellae = o.cellae ?? 1;
  const doorOpenings = [];
  if (cellae === 3) {
    const cw = cellaW / 3;
    for (let k = 0; k < 3; k++) doorOpenings.push({ at: cw * (k + 0.5), w: Math.min(doorW, cw * 0.5), h: doorH });
  } else doorOpenings.push({ at: cellaW / 2, w: doorW, h: doorH });
  // parede frontal (com portas), traseira e laterais
  b.wall(cx0, cx1, cz1 - wallT / 2, wallH, wallT, { y: top, mat: wallMat, openings: doorOpenings });
  b.wall(cx0, cx1, cz0 + wallT / 2, wallH, wallT, { y: top, mat: wallMat });
  b.box(wallT, wallH, cz1 - cz0, cx0 + wallT / 2, top, (cz0 + cz1) / 2, { mat: wallMat });
  b.box(wallT, wallH, cz1 - cz0, cx1 - wallT / 2, top, (cz0 + cz1) / 2, { mat: wallMat });
  if (cellae === 3) {
    for (const k of [1, 2]) {
      const x = cx0 + (cellaW / 3) * k;
      b.box(wallT * 0.8, wallH, cz1 - cz0 - wallT, x, top, (cz0 + cz1) / 2, { mat: wallMat });
    }
  }
  // revestimento interno (pintura/estuque) – faces internas finas
  if (wallIn !== wallMat) {
    const inset = wallT + 0.01;
    b.box(cellaW - 2 * inset, wallH * 0.98, 0.02, 0, top, cz0 + inset, { mat: wallIn, collide: false, faces: { nz: false, top: false, bottom: false, px: false, nx: false } });
  }
  // teto plano de madeira sobre a cella
  b.box(cellaW, 0.25, cz1 - cz0, 0, top + wallH, (cz0 + cz1) / 2, { mat: o.ceilingMat || 'woodDark', collide: false });

  // estátua de culto (marcador simplificado)
  if (o.statue !== false) {
    const sz = cz0 + wallT + 2.2;
    const cols = cellae === 3 ? [-cellaW / 3, 0, cellaW / 3] : [0];
    for (const sx of cols) statue(b, sx, top, sz, { scale: Math.min(2.2, wallH / 5), mat: o.statueMat || 'terracottaPainted', seated: o.statueSeated ?? true });
  }

  // ---------------- entablamento ----------------
  const entY = top + Hc;
  const entH = o.entHeight ?? Hc * 0.22;
  const outerW = span + D * 1.2;
  const depthAll = frontRowZ - (layout === 'prostyle' ? cz0 : rearZ) + D * 1.2;
  const midZ = (frontRowZ + (layout === 'prostyle' ? cz0 : rearZ)) / 2;
  b.push(0, 0, 0);
  // frente
  entablature(b, -outerW / 2, outerW / 2, frontRowZ, D * 1.1, entY, { mat: entMat, colH: Hc, height: entH, order, triglyphs: order === 'doric' });
  // laterais (giradas 90°)
  for (const s of [-1, 1]) {
    b.push(s * (span / 2), 0, midZ, Math.PI / 2);
    entablature(b, -depthAll / 2, depthAll / 2, 0, D * 1.1, entY, { mat: entMat, colH: Hc, height: entH, order, dentils: false });
    b.pop();
  }
  b.pop();
  const roofY = entY + entH;

  // ---------------- telhado e frontão ----------------
  const roofL = depthAll + 0.2;
  const res = gableRoof(b, outerW + 0.6, roofL, 0, roofY, midZ, {
    pitch: o.pitch ?? 0.22,
    overhang: 0.5,
    overhangEnds: 0.3,
    mat: o.roofMat || 'roofTile',
    gableMat: o.pedimentMat || entMat,
    cornice: true,
    corniceMat: entMat,
  });
  // acrotérios (figuras no ápice e nos cantos do frontão)
  if (o.acroteria) {
    const am = o.acroteriaMat || 'terracottaPainted';
    statue(b, 0, res.ridgeY - 0.1, midZ + roofL / 2, { scale: 0.9, mat: am });
    for (const s of [-1, 1]) b.box(0.6, 0.9, 0.4, s * (outerW / 2), roofY, midZ + roofL / 2, { mat: am, collide: false });
  }

  return {
    podiumTop: top,
    frontRowZ,
    podiumFrontZ: podFrontZ,
    stairsFrontZ: stairsType === 'front' && !st.inset ? L / 2 + st.depth : L / 2,
    cella: { x0: cx0, x1: cx1, z0: cz0, z1: cz1 },
    entablatureY: entY,
    roofY,
    ridgeY: res.ridgeY,
    columnXs: xs,
    intercolumn: inter,
  };
}

/**
 * Templo redondo (tholos), ex.: Templo de Vesta.
 * @param {object} o { radius (pódio), podiumHeight, columns, columnHeight, columnDiameter, order,
 *   cellaRadius, podiumMat, colMat, wallMat, roofMat, stairs: { width, depth }, roofType: 'cone',
 *   smokeHole (abertura no topo), doorWidth, doorHeight, bearingDoor (graus no quadro local; 0 = +Z) }
 */
export function tholos(b, o) {
  const R = o.radius;
  const Hp = o.podiumHeight ?? 2;
  const n = o.columns ?? 16;
  const D = o.columnDiameter ?? 0.6;
  const Hc = o.columnHeight ?? D * 9;
  const podMat = o.podiumMat || 'tufa';
  const colMat = o.colMat || 'stucco';
  const wallMat = o.wallMat || 'stucco';
  const order = o.order || 'corinthian';
  const rc = R - D * 0.8; // raio do círculo das colunas
  const rCella = o.cellaRadius ?? rc - D * 1.6;
  // pódio cilíndrico
  const pod = G.cylinder(R, R, Hp + 2, 32);
  b.add(pod, { mat: podMat, collide: true, colliderGeom: G.cylinder(R, R, Hp + 2, 16), matrix: new THREE.Matrix4().makeTranslation(0, -2, 0) });
  b.add(G.cylinder(R + 0.25, R + 0.25, 0.35, 32), { mat: podMat, matrix: new THREE.Matrix4().makeTranslation(0, Hp - 0.35, 0) });
  b.add(G.disc(R - 0.1, 32, Hp + 0.02, true), { mat: o.floorMat || 'slabs' });
  // escada frontal (+Z)
  if (o.stairs !== false) {
    const sw = o.stairs?.width ?? R * 0.7;
    const sd = o.stairs?.depth ?? Hp * 1.5;
    b.stairs(sw, sd, Hp, 0, 0, R + sd - 0.3, { mat: podMat });
  }
  // colunas em círculo
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + Math.PI / n;
    column(b, Math.sin(a) * rc, Hp, Math.cos(a) * rc, { order, height: Hc, diameter: D, mat: colMat, fluted: o.fluted });
  }
  // cella circular com porta voltada para +Z
  const seg = 24;
  const doorW = o.doorWidth ?? 1.6;
  const doorAng = doorW / rCella;
  for (let i = 0; i < seg; i++) {
    const a0 = (i / seg) * Math.PI * 2;
    const a1 = ((i + 1) / seg) * Math.PI * 2;
    const am = (a0 + a1) / 2;
    const dAng = Math.abs(((am + Math.PI) % (Math.PI * 2)) - Math.PI);
    const isDoor = dAng < doorAng / 2 + 0.01;
    const chord = 2 * rCella * Math.sin((a1 - a0) / 2) + 0.05;
    const x = Math.sin(am) * rCella;
    const z = Math.cos(am) * rCella;
    if (isDoor) {
      const dh = o.doorHeight ?? Hc * 0.7;
      b.box(chord, Hc - dh, 0.6, x, Hp + dh, z, { mat: wallMat, rotY: am });
    } else b.box(chord, Hc, 0.6, x, Hp, z, { mat: wallMat, rotY: am });
  }
  // entablamento anelar (aproximado por anel cilíndrico) e teto
  const entH = Hc * 0.18;
  const ring = G.lathe([[rc - D * 0.6, 0], [rc + D * 0.6, 0], [rc + D * 0.6, entH], [rc + D * 0.9, entH * 1.1], [rc + D * 0.9, entH * 1.3], [rc - D * 0.6, entH * 1.3], [rc - D * 0.6, 0]], 32, { vByHeight: true });
  b.add(ring, { mat: o.entMat || colMat, matrix: new THREE.Matrix4().makeTranslation(0, Hp + Hc, 0) });
  // telhado cônico (telhas) com abertura para a fumaça no topo
  const roofBase = Hp + Hc + entH * 1.3;
  const rr = rc + D * 1.3;
  const hole = o.smokeHole ?? 0.5;
  const roofH = o.roofHeight ?? rr * 0.55;
  b.add(G.lathe([[rr, 0], [hole, roofH]], 32, { vByHeight: false }), { mat: o.roofMat || 'roofTile', matrix: new THREE.Matrix4().makeTranslation(0, roofBase, 0) });
  b.add(G.lathe([[hole, roofH - 0.1], [rr, -0.1]], 24, {}), { mat: 'woodDark', matrix: new THREE.Matrix4().makeTranslation(0, roofBase, 0) });
  return { podiumTop: Hp, roofTop: roofBase + roofH, cellaRadius: rCella };
}

/**
 * Estátua simplificada (figura de pé ou sentada sobre base). Marcador volumétrico — não
 * pretende reproduzir uma obra específica.
 */
export function statue(b, x, y, z, o = {}) {
  const s = o.scale ?? 1;
  const mat = o.mat || 'bronze';
  const baseMat = o.baseMat || 'marble';
  b.push(x, y, z, o.rotY || 0, s);
  if (o.pedestal !== false) b.box(1.0, o.pedestalHeight ?? 1.2, 1.0, 0, 0, 0, { mat: baseMat, collide: true });
  const by = o.pedestal !== false ? (o.pedestalHeight ?? 1.2) : 0;
  if (o.seated) {
    b.box(0.8, 0.55, 0.7, 0, by, -0.05, { mat, collide: false }); // trono
    b.add(G.lathe([[0.27, 0], [0.3, 0.3], [0.22, 0.75], [0.12, 0.85]], 10, { vByHeight: true }), { mat, matrix: new THREE.Matrix4().makeTranslation(0, by + 0.5, -0.1) });
    b.box(0.42, 0.18, 0.5, 0, by + 0.45, 0.25, { mat, collide: false }); // coxas
    b.box(0.36, 0.5, 0.18, 0, by, 0.48, { mat, collide: false }); // pernas
    b.sphere(0.13, 0, by + 1.33, -0.08, { mat });
    b.add(G.cylinder(0.035, 0.035, 1.5, 6), { mat, matrix: new THREE.Matrix4().makeTranslation(0.35, by + 0.4, 0.05) }); // cetro
  } else {
    b.add(G.lathe([[0.3, 0], [0.26, 0.6], [0.2, 1.1], [0.22, 1.4], [0.12, 1.5]], 10, { vByHeight: true }), { mat, matrix: new THREE.Matrix4().makeTranslation(0, by, 0) });
    b.sphere(0.13, 0, by + 1.5, 0, { mat });
    b.add(G.cylinder(0.05, 0.045, 0.6, 6).rotateX(-1.1), { mat, matrix: new THREE.Matrix4().makeTranslation(0.24, by + 1.32, 0) }); // braço erguido
  }
  b.pop();
}
