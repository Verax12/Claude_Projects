/**
 * Templo de Júpiter Ótimo Máximo (Aedes Iovis Optimi Maximi Capitolini) — fase de Q. Lutácio
 * Cátulo (dedicado em 69 a.C.), sobre as fundações do templo arcaico.
 *
 * Base documental (docs/pesquisa/05-capitolio.md §2):
 *   - fachada para o sul; três fileiras de colunas na frente e uma de cada lado; fundos sem
 *     colunas (inferência); três celas paralelas (Júpiter no meio) sob um só frontão e um só
 *     telhado (Dion. 4.61.3–4);
 *   - pódio c. 53 × 62 m (DAR/Britannica, ⚠ não confirmado); altura do pódio ~4 m (propostas
 *     de 3,6 a 4,85 m);
 *   - fachada hexastila (Platner ⚠); intercolúnios de 12,43 m (central) e 8,88 m (laterais) —
 *     hipótese de Mura Sommella para a fase arcaica (⚠);
 *   - colunas de mármore trazidas por Sula do Olympieion (Plín. 36.45), coríntias e brancas
 *     segundo Platner (⚠); altura = 1/3 da largura (regra toscana de Vitr. 4.7.2 → 17,7 m) —
 *     HIPÓTESE; diâmetro de 2,0 m — HIPÓTESE;
 *   - templo areostilo: vigas contínuas de madeira, aspecto baixo, largo e "pesado no alto";
 *     frontão com estátuas de terracota ou bronze dourado (Vitr. 3.3.5); beirais largos sobre
 *     mútulos (Vitr. 4.7.5, regra genérica);
 *   - telhas de bronze douradas por Cátulo (Plín. 33.57) — material próprio 'telhaDourada';
 *   - pequeno orifício no teto sobre a pedra de Termino (Ov. Fast. 2.667–672), no pronau de
 *     Minerva (Dion. 3.69.5 — um altar no pronau de Atena, outro na cela junto à estátua);
 *   - Minerva à direita (Lív. 7.3.5; ambíguo — aqui: à direita do deus, isto é, a oeste).
 */
import * as THREE from 'three';
import { column } from '../../arch/columns.js';
import {
  Y_AREA,
  TEMPLE,
  TEMPLE_W,
  TEMPLE_L,
  TEMPLE_PODIUM,
  G,
  statueFig,
  figureParts,
  chariotParts,
  boulder,
  customMaterial,
  swapMaterial,
} from './common.js';

/* Dimensões locais (origem no centro do pódio, y = 0 no piso da Area; fachada → +Z = sul). */
export const J = {
  W: TEMPLE_W,
  L: TEMPLE_L,
  HP: TEMPLE_PODIUM,
  HC: 17.7,
  D: 2.0,
  ENT: 3.4,
  XS: [-23.975, -15.095, -6.215, 6.215, 15.095, 23.975],
  ROWS: [28.5, 19.62, 10.74],
  SIDE: [1.86, -7.02, -15.9, -24.78],
  FRONT_WALL: 1.86, // eixo da parede frontal das celas
  REAR_WALL: -28, // eixo da parede de fundo
  WT: 1.8, // espessura das paredes das celas (hipótese)
  STAIR_W: 30.19,
  STAIR_D: 8,
  PITCH: 0.22,
  TERMINUS: [-10.655, 6.0], // pedra de Termino (pronau de Minerva)
};
J.TOP = J.HP + J.HC; // topo das colunas / teto
J.YE = J.TOP + J.ENT; // base do telhado
J.HW = J.XS[5] + J.D * 0.55; // meia-largura do frontão
J.RIDGE = J.YE + J.HW * J.PITCH;

/** Converte coordenadas locais do templo para o mundo. */
export function templeToWorld(lx, ly, lz) {
  return { x: TEMPLE.x + lx, y: Y_AREA + ly, z: TEMPLE.z + lz };
}

/**
 * Constrói o templo. Devolve informações úteis (ex.: cotas) para NPCs e painéis.
 * @param {object} B builders { ext, roof, int, rock }
 */
export function buildJupiter(ctx, B) {
  const { ext, roof, int: inn, rock } = B;
  ext.push(TEMPLE.x, Y_AREA, TEMPLE.z, 0);
  roof.push(TEMPLE.x, Y_AREA, TEMPLE.z, 0);
  inn.push(TEMPLE.x, Y_AREA, TEMPLE.z, 0);
  rock.push(TEMPLE.x, Y_AREA, TEMPLE.z, 0);

  podium(ext);
  columns(ext);
  cellaWalls(ext, inn);
  entablature(ext);
  ceilings(ext, inn);
  templeRoof(roof);
  pediment(ext);
  interior(inn, rock);

  ext.pop();
  roof.pop();
  inn.pop();
  rock.pop();

  // antefixas de terracota ao longo dos beirais laterais (instâncias)
  const antef = G.merge([
    G.normalizeGeometry(G.box(0.42, 0.42, 0.06)),
    G.normalizeGeometry(G.cylinder(0.21, 0.21, 0.06, 10).rotateX(Math.PI / 2).translate(0, 0.42, 0.03)),
  ]);
  const inst = ctx.world.instances('capitolio:antefixa', antef, 'terracottaPainted', { maxDistance: 220, castShadow: false });
  const eaveX = J.HW + 3.4;
  const eaveY = J.YE - 3.4 * J.PITCH;
  for (let z = -29; z <= 30.2; z += 1.3) {
    for (const s of [-1, 1]) {
      const w = templeToWorld(s * eaveX, eaveY - 0.05, z);
      inst.add(w.x, w.y, w.z, s * Math.PI / 2, 1, (Math.round(z / 1.3) % 2) ? '#d08a55' : '#e2b07a');
    }
  }
  return J;
}

/* ------------------------------------------------------------------------- */

function podium(b) {
  const { W, L, HP, STAIR_W, STAIR_D } = J;
  // pódio de cappellaccio (as fundações escavadas são de blocos de cappellaccio — ⚠)
  b.box(W, HP + 3.2, L, 0, -3.2, 0, { mat: 'tufaGrey' });
  b.box(W + 0.7, 0.55, L + 0.7, 0, 0, 0, { mat: 'tufaGrey', collide: false }); // moldura de base
  b.box(W + 0.5, 0.3, L + 0.5, 0, 0.55, 0, { mat: 'tufaGrey', collide: false, color: '#d8d2c4' });
  b.box(W + 0.5, 0.45, L + 0.5, 0, HP - 0.45, 0, { mat: 'tufaGrey', collide: false }); // coroamento
  b.box(W + 0.3, 0.2, L + 0.3, 0, HP - 0.65, 0, { mat: 'tufaGrey', collide: false, color: '#d8d2c4' });
  // piso do pódio (pronau e alas)
  b.floor(W - 0.3, L - 0.3, 0, HP + 0.02, 0, { mat: 'travertine' });
  // escadaria frontal (degraus — Dião 43.21.2; nº de degraus NÃO ENCONTRADO: 20 × 0,20 m)
  b.stairs(STAIR_W, STAIR_D, HP, 0, 0, L / 2 + STAIR_D, { mat: 'tufaGrey', steps: 20 });
  for (const s of [-1, 1]) {
    b.box(1.4, HP + 0.5, STAIR_D, s * (STAIR_W / 2 + 0.7), 0, L / 2 + STAIR_D / 2, { mat: 'tufaGrey' });
    b.box(1.6, 0.3, STAIR_D + 0.2, s * (STAIR_W / 2 + 0.7), HP + 0.5, L / 2 + STAIR_D / 2, { mat: 'tufaGrey', collide: false, color: '#d8d2c4' });
  }
}

function columns(b) {
  const { XS, ROWS, SIDE, HP, HC, D } = J;
  const o = { order: 'corinthian', height: HC, diameter: D, mat: 'marble' };
  // três fileiras de seis colunas no pronau (Dion. 4.61.4)
  for (const z of ROWS) for (const x of XS) column(b, x, HP, z, o);
  // uma fileira de cada lado (a 1ª coluna lateral é a do canto da frente)
  for (const z of SIDE) for (const x of [XS[0], XS[5]]) column(b, x, HP, z, o);
}

function cellaWalls(b, inn) {
  const { HP, HC, XS, FRONT_WALL, REAR_WALL, WT } = J;
  const xi = XS[2]; // 6,215 (paredes entre as celas)
  const xo = XS[1]; // 15,095 (paredes externas do bloco das celas)
  const zf = FRONT_WALL;
  const zr = REAR_WALL + 1.0; // face interna da parede de fundo (−27)
  const wall = { y: HP, mat: 'stucco' };
  const WH = HC + 1.5; // até o teto do pronau (acima da arquitrave)
  // parede frontal com as três portas (larguras/alturas HIPOTÉTICAS)
  const x0 = -xo - WT / 2;
  b.wall(x0, xo + WT / 2, zf, WH, WT, {
    ...wall,
    openings: [
      { at: -10.655 - x0, w: 4.2, h: 9 },
      { at: 0 - x0, w: 6.2, h: 11.5 },
      { at: 10.655 - x0, w: 4.2, h: 9 },
    ],
  });
  // parede de fundo contínua (fecha também as alas — templo sine postico, inferência)
  b.box(J.W - 1.2, WH, 2.0, 0, HP, REAR_WALL, { mat: 'stucco' });
  // paredes longitudinais
  const len = zf - WT / 2 - zr;
  const zc = zr + len / 2;
  for (const s of [-1, 1]) {
    b.box(WT, WH, len + WT, s * xo, HP, zc + WT / 2, { mat: 'stucco' });
    b.box(WT, WH, len, s * xi, HP, zc, { mat: 'stucco' });
  }
  // faixa de soco escurecida (sujeira/umidade) na base externa das paredes
  b.box(xo * 2 + WT + 0.04, 1.2, 0.04, 0, HP, zf + WT / 2 + 0.01, { mat: 'stucco', collide: false, color: '#b7ab96' });

  // --- portas: folhas de madeira abertas para dentro e soleiras de bronze ---
  for (const [x, w, h] of [[-10.655, 4.2, 9], [0, 6.2, 11.5], [10.655, 4.2, 9]]) {
    inn.box(w, 0.06, WT + 0.1, x, HP, zf, { mat: 'bronze', collide: false });
    for (const s of [-1, 1]) {
      inn.box(0.22, h, w / 2, x + s * (w / 2 + 0.14), HP + 0.02, zf - WT / 2 - w / 4, { mat: 'woodDark' });
      // tachas/faixas de bronze nas folhas
      for (const yy of [h * 0.2, h * 0.5, h * 0.8]) inn.box(0.26, 0.18, w / 2, x + s * (w / 2 + 0.14), HP + yy, zf - WT / 2 - w / 4, { mat: 'bronze', collide: false });
    }
  }
}

function entablature(b) {
  const { XS, ROWS, TOP, ENT, D, REAR_WALL } = J;
  const xEdge = XS[5] + D * 0.55;
  const zFront = ROWS[0];
  const depth = D * 1.1;
  const ah = ENT * 0.38;
  const fh = ENT * 0.34;
  const ch = ENT - ah - fh;
  // arquitrave = vigas de madeira revestidas de placas de terracota (Vitr. 3.3.5; revestimento HIPOTÉTICO)
  const band = (x0, x1, z0, z1) => {
    const w = x1 - x0;
    const d = z1 - z0;
    const cx = (x0 + x1) / 2;
    const cz = (z0 + z1) / 2;
    b.box(w, ah, d, cx, TOP, cz, { mat: 'terracottaPainted', collide: false, color: '#c98a5a' });
    b.box(w, fh, d, cx, TOP + ah, cz, { mat: 'terracottaPainted', collide: false, color: '#e7c9a0' });
    b.box(w + 0.05, 0.16, d + 0.05, cx, TOP + ah + fh * 0.45, cz, { mat: 'terracottaPainted', collide: false, color: '#7a2c1c' });
    b.box(w + ch * 1.2, ch, d + ch * 1.2, cx, TOP + ah + fh, cz, { mat: 'terracottaPainted', collide: false, color: '#b5693c' });
  };
  // frente, laterais e fundo
  band(-xEdge, xEdge, zFront - depth / 2, zFront + depth / 2);
  for (const s of [-1, 1]) {
    const x0 = s * XS[5] - depth / 2;
    band(x0, x0 + depth, REAR_WALL - 1.0, zFront - depth / 2);
  }
  band(-xEdge, xEdge, REAR_WALL - 1.0, REAR_WALL + 1.0);
  // mútulos: cabeças de vigas sob os beirais laterais (projeção HIPOTÉTICA; Vitr. 4.7.5)
  for (let z = REAR_WALL; z <= zFront; z += 2.25) {
    for (const s of [-1, 1]) b.box(3.4, 0.42, 0.42, s * (xEdge + 1.6), TOP + ENT - 0.62, z, { mat: 'woodDark', collide: false });
  }
  // vigas internas sobre as fileiras do pronau (sustentam o teto)
  for (const z of ROWS.slice(1)) b.box(xEdge * 2, ah, depth * 0.9, 0, TOP, z, { mat: 'woodDark', collide: false });
}

/** Teto em caixotões (madeira com rosetas douradas — HIPÓTESE; Plín. 33.57 refere-se ao templo anterior). */
function coffered(b, x0, x1, z0, z1, y, hole = null) {
  const w = x1 - x0;
  const d = z1 - z0;
  // painel de fundo (face para baixo), com abertura opcional
  const panel = (ax0, ax1, az0, az1) => {
    if (ax1 - ax0 < 0.05 || az1 - az0 < 0.05) return;
    b.box(ax1 - ax0, 0.12, az1 - az0, (ax0 + ax1) / 2, y + 0.3, (az0 + az1) / 2, { mat: 'woodDark', collide: false, faces: { top: false } });
  };
  if (hole) {
    const [hx, hz, hs] = hole;
    panel(x0, x1, z0, hz - hs);
    panel(x0, x1, hz + hs, z1);
    panel(x0, hx - hs, hz - hs, hz + hs);
    panel(hx + hs, x1, hz - hs, hz + hs);
  } else panel(x0, x1, z0, z1);
  const step = 2.6;
  const nx = Math.max(1, Math.round(w / step));
  const nz = Math.max(1, Math.round(d / step));
  for (let i = 0; i <= nx; i++) b.box(0.32, 0.3, d, x0 + (w * i) / nx, y, (z0 + z1) / 2, { mat: 'woodDark', collide: false, color: '#8a6040' });
  for (let k = 0; k <= nz; k++) b.box(w, 0.3, 0.32, (x0 + x1) / 2, y, z0 + (d * k) / nz, { mat: 'woodDark', collide: false, color: '#8a6040' });
  for (let i = 0; i < nx; i++) {
    for (let k = 0; k < nz; k++) {
      const cx = x0 + (w * (i + 0.5)) / nx;
      const cz = z0 + (d * (k + 0.5)) / nz;
      if (hole && Math.abs(cx - hole[0]) < hole[2] + 0.4 && Math.abs(cz - hole[1]) < hole[2] + 0.4) continue;
      b.box(0.34, 0.08, 0.34, cx, y + 0.22, cz, { mat: 'gold', collide: false });
    }
  }
}

function ceilings(ext, inn) {
  const { XS, ROWS, TOP, D, FRONT_WALL, REAR_WALL, WT, TERMINUS } = J;
  const xEdge = XS[5] - D * 0.55;
  const yc = TOP + J.ENT * 0.38 - 0.3; // teto do pronau logo acima das arquitraves internas
  // pronau (com o orifício sobre Termino)
  coffered(ext, -xEdge, xEdge, FRONT_WALL + WT / 2, ROWS[0] - D * 0.55, yc, [TERMINUS[0], TERMINUS[1], 0.65]);
  // alas laterais
  for (const s of [-1, 1]) {
    const a = s * (XS[1] + WT / 2);
    const c = s * xEdge;
    coffered(ext, Math.min(a, c), Math.max(a, c), REAR_WALL + 1.0, FRONT_WALL + WT / 2, yc);
  }
  // celas (interior)
  const cells = [
    [-XS[1] + WT / 2, -XS[2] - WT / 2],
    [-XS[2] + WT / 2, XS[2] - WT / 2],
    [XS[2] + WT / 2, XS[1] - WT / 2],
  ];
  for (const [x0, x1] of cells) coffered(inn, x0, x1, REAR_WALL + 1.0, FRONT_WALL - WT / 2, TOP - 0.3);
  // poço de luz entre o teto e o telhado sobre Termino
  const [hx, hz] = TERMINUS;
  const yRoof = J.YE + (J.HW - Math.abs(hx)) * J.PITCH;
  const h = yRoof - yc + 0.4;
  const s = 0.65;
  ext.box(2 * s + 0.2, h, 0.1, hx, yc, hz - s - 0.05, { mat: 'stucco', collide: false });
  ext.box(2 * s + 0.2, h, 0.1, hx, yc, hz + s + 0.05, { mat: 'stucco', collide: false });
  ext.box(0.1, h, 2 * s, hx - s - 0.05, yc, hz, { mat: 'stucco', collide: false });
  ext.box(0.1, h, 2 * s, hx + s + 0.05, yc, hz, { mat: 'stucco', collide: false });
}

/** Telhado de duas águas único (Dion. 4.61.4) com beirais largos e abertura sobre Termino. */
function templeRoof(b) {
  const { HW, YE, PITCH, RIDGE, ROWS, REAR_WALL, TERMINUS } = J;
  const ov = 3.4; // beiral lateral (HIPÓTESE; Vitr. 4.7.5 dá ¼ da altura da coluna para os mútulos)
  const W = HW + ov;
  const yE = YE - ov * PITCH;
  const zF = ROWS[0] + 2.1;
  const zB = REAR_WALL - 1.6;
  const yAt = (x) => YE + (HW - Math.abs(x)) * PITCH;
  const tile = 'roofTile'; // trocado depois por 'telhaDourada'
  const slope = (xa, xb, za, zb) => {
    // retângulo do plano inclinado entre xa..xb (mesmo sinal) e za..zb; normal para cima/fora
    const A = [xa, yAt(xa), zb];
    const Bp = [xb, yAt(xb), zb];
    const C = [xb, yAt(xb), za];
    const D = [xa, yAt(xa), za];
    const g = G.quad(A, Bp, C, D);
    const n = g.attributes.normal;
    if (n.getY(0) < 0) b.quad(D, C, Bp, A, { mat: tile });
    else b.add(g, { mat: tile });
    // forro (face inferior)
    const t = 0.3;
    const A2 = [xa, yAt(xa) - t, zb];
    const B2 = [xb, yAt(xb) - t, zb];
    const C2 = [xb, yAt(xb) - t, za];
    const D2 = [xa, yAt(xa) - t, za];
    const g2 = G.quad(A2, B2, C2, D2);
    if (g2.attributes.normal.getY(0) > 0) b.quad(D2, C2, B2, A2, { mat: 'woodDark' });
    else b.add(g2, { mat: 'woodDark' });
  };
  // água leste (inteira)
  slope(W, 0, zB, zF);
  // água oeste com o orifício (hx, hz)
  const [hx, hz] = TERMINUS;
  const hs = 0.65;
  slope(-W, 0, zB, hz - hs);
  slope(-W, 0, hz + hs, zF);
  slope(-W, hx - hs, hz - hs, hz + hs);
  slope(hx + hs, 0, hz - hs, hz + hs);
  // bordas dos beirais (espessura das telhas)
  for (const s of [-1, 1]) b.box(0.25, 0.32, zF - zB, s * W, yE - 0.3, (zF + zB) / 2, { mat: 'woodDark', collide: false });
  // cumeeira (imbrices)
  b.box(0.5, 0.3, zF - zB, 0, RIDGE - 0.1, (zF + zB) / 2, { mat: tile, collide: false });
  // tímpanos: frente (terracota, recebe as estátuas) e fundo (estuque)
  const zt = ROWS[0] + 0.9;
  b.tri([-HW, YE, zt], [HW, YE, zt], [0, RIDGE, zt], { mat: 'terracottaPainted', color: '#9c4a2c' });
  const zr = REAR_WALL - 1.0;
  b.tri([HW, YE, zr], [-HW, YE, zr], [0, RIDGE, zr], { mat: 'stucco' });
  // cornijas inclinadas (sima) na frente e no fundo
  const len = Math.hypot(HW, RIDGE - YE);
  const ang = Math.atan2(RIDGE - YE, HW);
  for (const [z, sgn] of [[zF - 0.6, 1], [zB + 0.3, -1]]) {
    for (const side of [1, -1]) {
      const g = G.box(len + 1.2, 0.75, 1.2);
      g.translate(0, -0.6, 0);
      const m = new THREE.Matrix4().makeRotationZ(-side * ang);
      m.setPosition(side * HW * 0.5, (YE + RIDGE) / 2, z + sgn * 0.0);
      b.add(g, { mat: 'terracottaPainted', matrix: m, color: '#b5693c' });
    }
  }
}

/** Estátuas douradas no frontão e acrotérios (Vitr. 3.3.5: "terracota ou bronze dourado"). */
function pediment(b) {
  const { YE, RIDGE, ROWS, HW } = J;
  const z = ROWS[0] + 1.45;
  const figs = [
    [0, 'seated', 2.25],
    [-4.8, 'stand', 2.3],
    [4.8, 'stand', 2.3],
    [-9.6, 'stand', 1.8],
    [9.6, 'stand', 1.8],
    [-14.2, 'stand', 1.25],
    [14.2, 'stand', 1.25],
    [-18.6, 'seated', 0.8],
    [18.6, 'seated', 0.8],
  ];
  for (const [x, pose, s] of figs) {
    statueFig(b, x, YE + 0.05, z, { pose, scale: s, mat: 'gold', pedestal: false, armUp: Math.abs(x) === 4.8, scepter: pose === 'seated' && x === 0 });
  }
  // acrotério central: quadriga dourada (HIPÓTESE — antecedentes só no templo arcaico, Lív. 10.23.12)
  const qz = ROWS[0] - 3.2;
  b.box(2.6, 0.6, 7.5, 0, RIDGE - 0.35, qz + 1.6, { mat: 'terracottaPainted', collide: false, color: '#b5693c' });
  const q = chariotParts(4);
  const m = new THREE.Matrix4().compose(new THREE.Vector3(0, RIDGE + 0.2, qz), new THREE.Quaternion(), new THREE.Vector3(1.9, 1.9, 1.9));
  b.add(q, { mat: 'gold', matrix: m });
  const mq = new THREE.Matrix4().compose(new THREE.Vector3(0, RIDGE + 0.2 + 1.9 * 0.55, qz), new THREE.Quaternion(), new THREE.Vector3(1.9, 1.9, 1.9));
  for (const { g, m: mat } of figureParts({ mat: 'gold', armUp: true })) b.add(g, { mat, matrix: mq });
  // acrotérios dos cantos (figuras douradas — HIPÓTESE)
  for (const s of [-1, 1]) statueFig(b, s * (HW - 0.4), YE + 0.4, ROWS[0] + 1.1, { scale: 1.35, mat: 'gold', pedestal: { w: 1.4, h: 0.6, d: 1.4, mat: 'terracottaPainted' }, armUp: true });
}

/** Interior: estátuas de culto (HIPOTÉTICAS), mesa com oferendas, lucernas, altar de Juventas, Termino. */
function interior(inn, rock) {
  const { HP, XS, REAR_WALL, FRONT_WALL, WT, TERMINUS, HC } = J;
  const zr = REAR_WALL + 1.0;
  const zf = FRONT_WALL - WT / 2;
  const cells = [
    [-XS[1] + WT / 2, -XS[2] - WT / 2],
    [-XS[2] + WT / 2, XS[2] - WT / 2],
    [XS[2] + WT / 2, XS[1] - WT / 2],
  ];
  for (const [x0, x1] of cells) {
    const w = x1 - x0;
    const cx = (x0 + x1) / 2;
    const d = zf - zr;
    const cz = (zr + zf) / 2;
    // piso de opus signinum (HIPÓTESE: o piso "scutulatum/scalpturatum" de Plín. 36.185 é do templo anterior)
    inn.floor(w, d, cx, HP + 0.05, cz, { mat: 'signinum' });
    // revestimento interno de estuque branco polido (Vitr. 7.3.7) e soco escuro (HIPÓTESE)
    const lining = (lw, ld, lx, lz) => inn.box(lw, HC - 0.4, ld, lx, HP, lz, { mat: 'stucco', collide: false });
    lining(w, 0.03, cx, zr + 0.02);
    lining(0.03, d, x0 + 0.02, cz);
    lining(0.03, d, x1 - 0.02, cz);
    inn.box(w - 0.06, 1.5, 0.04, cx, HP, zr + 0.05, { mat: 'paintRed', collide: false });
    inn.box(0.04, 1.5, d - 0.06, x0 + 0.05, HP, cz, { mat: 'paintRed', collide: false });
    inn.box(0.04, 1.5, d - 0.06, x1 - 0.05, HP, cz, { mat: 'paintRed', collide: false });
    inn.box(w - 0.06, 0.12, 0.06, cx, HP + 1.5, zr + 0.06, { mat: 'stucco', collide: false, color: '#c9b98f' });
  }
  // Júpiter sentado (estátua de culto de 50–44 a.C.: material e autor NÃO ENCONTRADOS);
  // rosto pintado de mínio nos dias de festa (Plín. 33.111–112)
  statueFig(inn, 0, HP + 0.05, zr + 5.6, {
    pose: 'seated',
    scale: 4.2,
    mat: 'gold',
    faceMat: 'paintRed',
    throneMat: 'marble',
    thunderbolt: true,
    pedestal: { w: 5.2, h: 1.7, d: 5.0, mat: 'marble' },
  });
  // Juno (leste) e Minerva (oeste) — formas HIPOTÉTICAS
  statueFig(inn, 10.655, HP + 0.05, zr + 4.5, { scale: 2.6, mat: 'gold', scepter: true, pedestal: { w: 2.6, h: 1.4, d: 2.6, mat: 'marble' } });
  statueFig(inn, -10.655, HP + 0.05, zr + 4.5, { scale: 2.6, mat: 'gold', helmet: true, spear: true, shield: true, pedestal: { w: 2.6, h: 1.4, d: 2.6, mat: 'marble' } });
  // altar de Juventas junto à estátua de Minerva (Dion. 3.69.5)
  inn.box(1.3, 1.1, 0.9, -8.0, HP + 0.05, zr + 9.5, { mat: 'marble' });
  inn.box(1.5, 0.18, 1.1, -8.0, HP + 1.15, zr + 9.5, { mat: 'marble', collide: false });
  // mesa de oferendas diante de Júpiter: o diadema recusado por César nas Lupercais (fev. 44 a.C.,
  // Suet. Iul. 79.2) e vasos de murra dedicados por Pompeu (Plín. 37.18)
  const tz = zr + 11;
  inn.box(3.2, 0.12, 1.3, 0, HP + 1.0, tz, { mat: 'marble', collide: false });
  for (const sx of [-1.4, 1.4]) inn.box(0.25, 1.0, 1.1, sx, HP + 0.05, tz, { mat: 'marble' });
  const torus = new THREE.TorusGeometry(0.16, 0.035, 6, 16).rotateX(Math.PI / 2).toNonIndexed();
  inn.add(torus, { mat: 'gold', matrix: new THREE.Matrix4().makeTranslation(0, HP + 1.17, tz) });
  for (const [vx, c] of [[-1.0, '#b58bb5'], [-0.55, '#d9c3a2'], [0.6, '#a4728f'], [1.05, '#cfae92']]) {
    const vase = G.lathe([[0, 0], [0.09, 0.01], [0.14, 0.12], [0.1, 0.24], [0.07, 0.3], [0.09, 0.34], [0, 0.34]], 12);
    inn.add(vase, { mat: 'marbleGrey', color: c, matrix: new THREE.Matrix4().makeTranslation(vx, HP + 1.12, tz) });
  }
  // candelabros de bronze com chama
  for (const [lx, lz] of [[-3.6, zr + 9], [3.6, zr + 9], [-3.6, zr + 15], [3.6, zr + 15]]) {
    inn.cylinder(0.3, 0.12, 0.25, lx, HP + 0.05, lz, { mat: 'bronze' });
    inn.cylinder(0.05, 0.05, 2.1, lx, HP + 0.3, lz, { mat: 'bronze' });
    inn.cylinder(0.28, 0.2, 0.12, lx, HP + 2.4, lz, { mat: 'bronze' });
    inn.cylinder(0.12, 0.0, 0.35, lx, HP + 2.52, lz, { mat: 'flame' });
  }
  // Termino: pedra de fronteira sob o orifício do teto (Ov. Fast. 2.667–672)
  const [tx, tz2] = TERMINUS;
  inn.box(1.6, 0.3, 1.6, tx, HP + 0.02, tz2, { mat: 'travertine' });
  boulder(rock, tx, HP + 0.3, tz2, 0.55, 77, { sx: 1.0, sy: 1.25 });
}

/** Troca as telhas do telhado pelo bronze dourado (após finish()). */
export function gildRoof(roofGroup, quality) {
  swapMaterial(roofGroup, 'roofTile', customMaterial('telhaDourada', quality));
}
