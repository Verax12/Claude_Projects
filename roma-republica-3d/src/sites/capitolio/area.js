/**
 * Area Capitolina: plataforma nivelada do cume sul, muros de arrimo (substruções de cantaria),
 * paredão da Rocha Tarpeia, portões, escadarias e os monumentos atestados para 50–44 a.C.
 *
 * Fontes (docs/pesquisa/05-capitolio.md §3–4, §7–9):
 *   - Area "cheia de estátuas e oferendas"; carro de César "de frente para Júpiter" e estátua de
 *     César sobre a imagem da oikoumene (Dião 43.14.6; 43.21.2); estátuas dos 7 reis + L. Bruto,
 *     com a de César ao lado (Dião 43.45.3–4); Júpiter sobre coluna voltado para o leste (Cic.
 *     Cat. 3.20); colossos de Carvílio, de Apolo (30 côvados ≈ 13,3 m), de Hércules (Lisipo) e as
 *     duas cabeças de P. Lêntulo (Plín. 34.39–44); troféus de Mário (Plut. Caes. 6); Arco de
 *     Cipião (Lív. 37.3.7 — ver clivus.js); gansos sagrados (Cic. Rosc. Am. 56);
 *   - Fides "vizinha de Júpiter" (Cic. Off. 3.104); Mens e Vênus Ericina "separados por um só
 *     canal" (Lív. 23.31.9); Júpiter Ferétrio pequeníssimo (< 15 pés) e sem telhado (Nepos Att.
 *     20.3; Dion. 2.34.4); Casa Romuli de palha (Vitr. 2.1.5);
 *   - substruções de cantaria (Lív. 6.4.12; Plín. 36.104); altos muros de arrimo (Dion. 3.69.1).
 * Posições, dimensões e formas dos monumentos: NÃO ENCONTRADAS → hipóteses declaradas nos painéis.
 */
import * as THREE from 'three';
import { podiumTemple } from '../../arch/temple.js';
import { column } from '../../arch/columns.js';
import {
  Y_AREA,
  TEMPLE,
  AREA_POLY,
  AREA_CLIFF_EDGES,
  G,
  outwardNormal,
  slopedWall,
  rockFace,
  statueFig,
  figureParts,
  chariotParts,
  gooseGeom,
  flight,
  boulder,
  lerp,
} from './common.js';

/** Aberturas nos parapeitos: [aresta, coordenada inicial, final] (x para arestas E–O, z para N–S). */
const PARAPET_GAPS = [
  [0, -235.5, -228.5], // escada norte (para o Asylum)
  [1, 82.5, 89.5], // portão leste (chegada do clivo)
  [4, -258.5, -253.5], // topo da Centum Gradus
  [3, -233, -216], // borda aberta da Rocha Tarpeia (lugar das execuções)
];

/** Plataforma, muros, parapeitos, portão, escadas e paredão de rocha. */
export function buildPlatform(ctx, b, rock) {
  const t = ctx.terrain;
  // piso (lajes — material do pavimento NÃO ENCONTRADO; travertino é hipótese)
  b.prism(AREA_POLY, 0.3, Y_AREA - 0.3, { mat: 'slabs', sides: false });

  const n = AREA_POLY.length;
  for (let i = 0; i < n; i++) {
    const a = AREA_POLY[i];
    const c = AREA_POLY[(i + 1) % n];
    const [nx, nz] = outwardNormal(AREA_POLY, i);
    const L = Math.hypot(c[0] - a[0], c[1] - a[1]);
    const cliff = AREA_CLIFF_EDGES.includes(i);
    if (!cliff) {
      // muro de arrimo em opus quadratum de tufo (2,2 m), em trechos de ~12 m com tons variados (reparos)
      const T = 2.2;
      const nSeg = Math.max(1, Math.round(L / 12));
      for (let k = 0; k < nSeg; k++) {
        const t0 = k / nSeg;
        const t1 = (k + 1) / nSeg;
        // prolonga um pouco nas pontas para fechar os cantos
        const e0 = k === 0 ? -T / L : 0;
        const e1 = k === nSeg - 1 ? T / L : 0;
        const pa = [lerp(a[0], c[0], t0 + e0) + nx * T / 2, lerp(a[1], c[1], t0 + e0) + nz * T / 2];
        const pb = [lerp(a[0], c[0], t1 + e1) + nx * T / 2, lerp(a[1], c[1], t1 + e1) + nz * T / 2];
        let base = Infinity;
        for (let s = 0; s <= 4; s++) {
          const q = lerp(t0, t1, s / 4);
          base = Math.min(base, t.heightAt(lerp(a[0], c[0], q) + nx * 5, lerp(a[1], c[1], q) + nz * 5));
        }
        const tone = ['#e8dcc0', '#d9caa6', '#efe3c9', '#d2c39f'][(i * 7 + k) % 4];
        slopedWall(b, pa[0], pa[1], pb[0], pb[1], Y_AREA - 0.02, Y_AREA - 0.02, base - 2, base - 2, T, { mat: 'tufa', color: tone });
        // cornija de coroamento saliente
        slopedWall(b, pa[0] + nx * 0.2, pa[1] + nz * 0.2, pb[0] + nx * 0.2, pb[1] + nz * 0.2, Y_AREA - 0.4, Y_AREA - 0.4, Y_AREA - 0.75, Y_AREA - 0.75, T + 0.4, { mat: 'tufa', color: '#cdbf9f', collide: false });
      }
    }
    // parapeito (altura e forma NÃO ENCONTRADAS): na borda externa do muro ou sobre a rocha
    const off = cliff ? -0.3 : 1.95;
    const gaps = PARAPET_GAPS.filter((g) => g[0] === i).map((g) => {
      const horiz = Math.abs(c[0] - a[0]) > Math.abs(c[1] - a[1]);
      const ta = horiz ? (g[1] - a[0]) / (c[0] - a[0]) : (g[1] - a[1]) / (c[1] - a[1]);
      const tb = horiz ? (g[2] - a[0]) / (c[0] - a[0]) : (g[2] - a[1]) / (c[1] - a[1]);
      return [Math.min(ta, tb), Math.max(ta, tb)];
    });
    const spans = [];
    let cur = 0;
    for (const [ga, gb] of gaps.sort((p, q) => p[0] - q[0])) {
      if (ga > cur) spans.push([cur, ga]);
      cur = Math.max(cur, gb);
    }
    if (cur < 1) spans.push([cur, 1]);
    for (const [s0, s1] of spans) {
      const pa = [lerp(a[0], c[0], s0) + nx * off, lerp(a[1], c[1], s0) + nz * off];
      const pb = [lerp(a[0], c[0], s1) + nx * off, lerp(a[1], c[1], s1) + nz * off];
      slopedWall(b, pa[0], pa[1], pb[0], pb[1], Y_AREA + 1.05, Y_AREA + 1.05, Y_AREA - 0.3, Y_AREA - 0.3, 0.55, { mat: 'tufa', color: '#e3d6b8' });
      slopedWall(b, pa[0], pa[1], pb[0], pb[1], Y_AREA + 1.17, Y_AREA + 1.17, Y_AREA + 1.03, Y_AREA + 1.03, 0.7, { mat: 'travertine', collide: false });
    }
  }

  // paredão de rocha natural (Rocha Tarpeia) nas arestas sul
  const cliffPts = [AREA_POLY[2], AREA_POLY[3], AREA_POLY[4], AREA_POLY[5]];
  rockFace(rock, t, cliffPts, { yTop: Y_AREA - 0.02, bulge: 2.3, seed: 31, hint: [0, 1], rows: 10 });

  // --- portão leste (as "primeiras portas da cidadela", Tác. Hist. 3.71 — forma HIPOTÉTICA) ---
  const gx = AREA_POLY[1][0];
  for (const z of [81.6, 90.4]) {
    b.box(2.4, 6.2, 1.8, gx + 1.1, Y_AREA - 0.05, z, { mat: 'tufa', color: '#e2d5b5' });
    b.box(2.7, 0.45, 2.1, gx + 1.1, Y_AREA + 6.15, z, { mat: 'travertine', collide: false });
  }
  b.box(2.6, 1.0, 10.6, gx + 1.1, Y_AREA + 5.2, 86, { mat: 'tufa', collide: false, color: '#d8caa8' });
  b.box(2.9, 0.4, 11.0, gx + 1.1, Y_AREA + 6.2, 86, { mat: 'travertine', collide: false });
  // folhas de madeira abertas para dentro, encostadas aos pilares
  for (const s of [-1, 1]) {
    b.box(3.4, 4.9, 0.18, gx - 1.7, Y_AREA, 86 + s * 3.35, { mat: 'woodDark' });
    for (const yy of [0.6, 2.4, 4.2]) b.box(3.42, 0.14, 0.22, gx - 1.7, Y_AREA + yy, 86 + s * 3.35, { mat: 'iron', collide: false });
  }

  // --- escada norte: da Area para a sela do Asylum (traçado HIPOTÉTICO) ---
  const sz0 = AREA_POLY[0][1] - 2.2; // face externa do muro norte
  const depth = 22;
  const yb = t.heightAt(-232, sz0 - depth - 1.5);
  b.push(-232, 0, sz0 - depth, Math.PI);
  flight(b, 6, depth, yb, Y_AREA, 0, 0, { baseY: yb - 0.8, mat: 'tufa', color: '#ddd0b2' });
  b.pop();
  for (const s of [-1, 1]) {
    slopedWall(b, -232 + s * 3.35, sz0 - depth, -232 + s * 3.35, sz0, yb + 0.9, Y_AREA + 1.0, yb - 1.5, Y_AREA - 2, 0.7, { mat: 'tufa', color: '#e3d6b8' });
  }
  b.box(7.4, 0.6, 2.5, -232, yb - 0.6, sz0 - depth - 1.2, { mat: 'tufa' }); // patamar inferior
  return { northStairBottom: [-232, sz0 - depth - 1.5, yb] };
}

/* ------------------------------------------------------------------------- */
/*  Monumentos e templos menores                                             */
/* ------------------------------------------------------------------------- */

export function buildMonuments(ctx, b, det, thatch, rock) {
  const Y = Y_AREA;

  // --- grande altar diante do templo (todo templo tinha altar; forma e posição HIPOTÉTICAS) ---
  const ax = TEMPLE.x;
  const az = 85;
  b.box(8.2, 0.35, 4.6, ax, Y, az, { mat: 'travertine' });
  b.box(7.0, 1.25, 3.4, ax, Y + 0.35, az, { mat: 'travertine' });
  b.box(7.6, 0.28, 4.0, ax, Y + 1.6, az, { mat: 'travertine', collide: false });
  // pulvini (rolos laterais) do altar
  for (const s of [-1, 1]) b.add(G.cylinder(0.32, 0.32, 3.6, 10).rotateX(Math.PI / 2).translate(0, 0.32, -1.8), { mat: 'travertine', matrix: new THREE.Matrix4().makeTranslation(ax + s * 3.5, Y + 1.85, az) });
  // brasas e chama do sacrifício
  b.box(2.4, 0.18, 1.4, ax, Y + 1.88, az, { mat: 'flat', color: '#3a2d25', collide: false });
  for (const [fx, fz, fh] of [[-0.5, 0, 0.9], [0.3, 0.2, 0.7], [0.6, -0.3, 0.55], [-0.1, -0.2, 0.75]]) b.cylinder(0.22, 0.0, fh, ax + fx, Y + 2.02, az + fz, { mat: 'flame', segments: 6 });

  // --- carro de César "de frente para Júpiter" (decreto de 46 a.C.) ---
  const cx = TEMPLE.x;
  const cz = 101;
  b.box(3.4, 2.4, 6.4, cx, Y, cz, { mat: 'marble' });
  b.box(3.8, 0.3, 6.8, cx, Y, cz, { mat: 'marble', collide: false });
  b.box(3.7, 0.25, 6.7, cx, Y + 2.25, cz, { mat: 'marble', collide: false });
  b.add(chariotParts(4), { mat: 'bronze', matrix: new THREE.Matrix4().compose(new THREE.Vector3(cx, Y + 2.5, cz + 1.2), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI), new THREE.Vector3(1.25, 1.25, 1.25)) });
  {
    const m = new THREE.Matrix4().compose(new THREE.Vector3(cx, Y + 2.5 + 0.62 * 1.25, cz + 1.2), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI), new THREE.Vector3(1.25, 1.25, 1.25));
    for (const { g, m: mat } of figureParts({ mat: 'bronze', armUp: true })) b.add(g, { mat, matrix: m });
  }
  // estátua de bronze de César sobre a imagem da oikoumene (globo)
  statueFig(b, -234, Y, 100, { rotY: Math.PI, scale: 1.25, mat: 'bronze', globe: true, armUp: true, pedestal: { w: 2.2, h: 1.6, d: 2.2, mat: 'marble' } });

  // --- os sete reis + L. Bruto, e César ao lado (45 a.C.) — fileira HIPOTÉTICA voltada para o portão ---
  // A lista dos "sete" não é dada nas fontes conferidas; Plínio cita Rômulo e Tácio (sem túnica),
  // Numa e Sérvio (com anel). Aqui, HIPÓTESE: Rômulo, Tácio, Numa, Túlio, Anco, Tarquínio Prisco,
  // Sérvio — sem Tarquínio, o Soberbo, expulso por Bruto.
  const kings = [
    { pose: 'nude', spear: true }, // Rômulo (sem túnica)
    { pose: 'nude', spear: true }, // Tito Tácio (sem túnica)
    { scepter: true }, // Numa (com anel)
    {}, // Túlio Hostílio
    {}, // Anco Márcio
    { scepter: true }, // Tarquínio Prisco
    { scepter: true }, // Sérvio Túlio (com anel)
    { armUp: true }, // L. Júnio Bruto ("utinam viveres!" escrito na base, 44 a.C.)
    { armUp: true }, // C. Júlio César (45 a.C.)
  ];
  kings.forEach((k, i) => {
    const x = -220 + i * 2.9;
    statueFig(b, x, Y, 76, { ...k, rotY: 0, scale: 1.12, mat: 'bronze', pedestal: { w: 1.3, h: 1.5, d: 1.3, mat: 'peperino' } });
  });

  // --- Júpiter sobre coluna voltado para o oriente (63 a.C.); coluna HIPOTÉTICA ---
  const jx = -194;
  const jz = 6;
  b.box(3.0, 1.6, 3.0, jx, Y, jz, { mat: 'marble' });
  column(b, jx, Y + 1.6, jz, { order: 'tuscan', height: 9.0, diameter: 1.1, mat: 'stucco' });
  statueFig(b, jx, Y + 10.6, jz, { rotY: (75 * Math.PI) / 180 + 0, scale: 1.6, mat: 'bronze', scepter: true, armUp: true, pedestal: { w: 1.3, h: 0.4, d: 1.3, mat: 'marble' } });

  // --- colossos (alturas: Apolo 30 côvados; os demais NÃO ENCONTRADAS) ---
  // Apolo de Apolônia trazido por M. Lúculo (≈ 13,3 m)
  statueFig(b, -290, Y, 104, { rotY: Math.PI / 2, scale: 13.3 / 1.75, mat: 'bronze', lyre: true, pose: 'nude', pedestal: { w: 4.2, h: 2.4, d: 4.2, mat: 'peperino' } });
  // Júpiter de Sp. Carvílio (293 a.C.), "visto do Monte Albano" — altura HIPOTÉTICA ~10 m; voltado para SE
  statueFig(b, -213, Y, 95, { rotY: Math.PI / 4, scale: 5.8, mat: 'bronze', scepter: true, armUp: true, pedestal: { w: 4.0, h: 2.2, d: 4.0, mat: 'peperino' } });
  statueFig(b, -208.2, Y, 99.4, { rotY: Math.PI / 4, scale: 1.05, mat: 'bronze', pedestal: { w: 1.0, h: 0.9, d: 1.0, mat: 'peperino' } }); // estátua do próprio Carvílio, a seus pés
  // Hércules de Lisipo (de Tarento, 209 a.C.) — sentado: forma HIPOTÉTICA
  statueFig(b, -294, Y, 30, { rotY: Math.PI / 2, scale: 4.2, pose: 'seated', mat: 'bronze', scepter: false, club: true, throneMat: 'peperino', pedestal: { w: 5.0, h: 1.8, d: 5.0, mat: 'peperino' } });
  // duas cabeças colossais dedicadas por P. Lêntulo
  for (const [hz, s] of [[47, 1.0], [59, 0.92]]) {
    b.box(2.2, 3.4, 2.2, -297, Y, hz, { mat: 'peperino' });
    b.box(2.5, 0.3, 2.5, -297, Y + 3.4, hz, { mat: 'marble', collide: false });
    b.cylinder(0.55 * s, 0.6 * s, 0.9 * s, -297, Y + 3.7, hz, { mat: 'bronze' });
    b.add(G.sphere(1.0 * s, 14, 10).scale(0.9, 1.15, 1.0), { mat: 'bronze', matrix: new THREE.Matrix4().makeTranslation(-297, Y + 4.2, hz) });
  }

  // --- troféus de Mário com Vitórias douradas (repostos por César em 65 a.C.) ---
  for (const tx of [-284, -272]) {
    b.box(1.8, 1.2, 1.8, tx, Y, -3.2, { mat: 'marble' });
    b.cylinder(0.12, 0.1, 3.2, tx, Y + 1.2, -3.2, { mat: 'woodDark' });
    b.box(1.9, 0.12, 0.12, tx, Y + 3.3, -3.2, { mat: 'woodDark', collide: false });
    b.add(G.lathe([[0.32, 0], [0.38, 0.35], [0.36, 0.7], [0.2, 0.85]], 10).scale(1, 1, 0.75), { mat: 'gold', matrix: new THREE.Matrix4().makeTranslation(tx, Y + 2.6, -3.2) });
    b.sphere(0.22, tx, Y + 3.5, -3.2, { mat: 'gold' });
    b.add(G.cylinder(0.42, 0.42, 0.06, 14).rotateX(Math.PI / 2), { mat: 'gold', matrix: new THREE.Matrix4().makeTranslation(tx - 0.75, Y + 2.7, -3.0) });
    statueFig(b, tx + 1.2, Y + 1.2, -2.6, { scale: 0.7, mat: 'gold', armUp: true, pedestal: false });
  }

  // --- Templo de Fides (Atílio Calatino; refeito por M. Emílio Escauro) — dimensões HIPOTÉTICAS ---
  b.push(-205, Y, 30, 0);
  podiumTemple(b, { width: 11, length: 17, podiumHeight: 2.4, order: 'tuscan', columnsFront: 4, columnsDeep: 2, columnHeight: 6.6, columnDiameter: 0.85, podiumMat: 'tufa', colMat: 'stucco', wallMat: 'stucco', entMat: 'stucco', roofMat: 'roofTile', acroteria: true, stairs: { width: 7, depth: 3.4 }, statueMat: 'marble', statueSeated: false });
  b.pop();

  // --- Mens e Vênus Ericina (215 a.C.), "separados por um só canal" — gêmeos HIPOTÉTICOS voltados para leste ---
  for (const tz of [77.5, 92.5]) {
    b.push(-293, Y, tz, Math.PI / 2);
    podiumTemple(b, { width: 7.5, length: 11, podiumHeight: 1.9, order: 'tuscan', columnsFront: 4, columnsDeep: 1, columnHeight: 5.0, columnDiameter: 0.62, podiumMat: 'tufa', colMat: 'stucco', wallMat: 'stucco', entMat: 'stucco', roofMat: 'roofTile', acroteria: true, stairs: { width: 5, depth: 2.6 }, statueMat: 'terracottaPainted', statueSeated: false });
    b.pop();
  }
  // o canal entre os dois templos (calha de água corrente)
  for (const s of [-1, 1]) b.box(15, 0.32, 0.25, -292, Y, 85 + s * 0.55, { mat: 'travertine' });
  b.box(15, 0.2, 0.85, -292, Y, 85, { mat: 'water', collide: false });

  // --- Júpiter Ferétrio: templo minúsculo, sem telhado e desabando (Nepos Att. 20.3) ---
  const fx = -210;
  const fz = 3;
  b.box(5.6, 0.9, 4.6, fx, Y, fz, { mat: 'tufaGrey' });
  const walls = [
    // [x, z, w, d, h]
    [-2.0, 0, 0.45, 3.3, 2.6],
    [2.0, -0.4, 0.45, 2.5, 3.1],
    [0, -1.6, 4.3, 0.45, 2.2],
    [-1.4, 1.6, 1.4, 0.45, 1.6],
    [1.5, 1.6, 1.2, 0.45, 2.4],
  ];
  for (const [x, z, w, d, h] of walls) b.box(w, h, d, fx + x, Y + 0.9, fz + z, { mat: 'tufaGrey', color: '#b9b2a2' });
  for (const [x, z, s] of [[0.9, 2.7, 0.5], [-2.9, -1.2, 0.4], [3.1, 1.4, 0.35], [0.2, 0.2, 0.3]]) b.box(s * 2, s, s * 1.4, fx + x, Y + (Math.abs(x) < 1 ? 0.9 : 0), fz + z, { mat: 'tufaGrey', rotY: x, color: '#a8a090' });
  b.box(0.35, 0.35, 3.0, fx + 1.0, Y + 0.9, fz + 0.6, { mat: 'woodDark', rotY: 0.5, collide: false }); // viga caída
  for (const [x, z] of [[-0.6, 0.6], [0.8, -0.5], [-1.2, -0.9], [2.6, 2.0], [-2.6, 2.2]]) ctx.vegetation.add('grass', fx + x, fz + z, { y: Y + (Math.abs(x) < 2 && Math.abs(z) < 2 ? 0.9 : 0), scale: 1.1 });

  // --- Casa Romuli no Capitólio: cabana de palha (forma e posição HIPOTÉTICAS) ---
  const hx = -296.5;
  const hz = 2;
  thatch.box(5.6, 0.25, 4.6, hx, Y, hz, { mat: 'plaster', color: '#8d7a5c' });
  const wallG = G.lathe([[2.5, 0], [2.5, 1.7]], 18).scale(1, 1, 0.82);
  thatch.push(hx, Y + 0.25, hz, 0);
  thatch.add(wallG, { mat: 'plaster', color: '#a78e66', collide: 'box' });
  thatch.add(G.lathe([[2.95, 0], [1.6, 1.6], [0.25, 3.1], [0, 3.25]], 18).scale(1, 1, 0.82), { mat: 'cloth', matrix: new THREE.Matrix4().makeTranslation(0, 1.55, 0) });
  thatch.box(1.0, 1.55, 0.25, 0, 0, 2.06, { mat: 'flat', color: '#1d1712', collide: false }); // porta
  thatch.pop();
  // cerca baixa de proteção
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 9) {
    if (Math.abs(a - Math.PI / 2) < 0.2) continue;
    det.cylinder(0.05, 0.05, 1.0, hx + Math.cos(a) * 4.2, Y, hz + Math.sin(a) * 3.6, { mat: 'wood' });
  }

  // --- favisae: tampa de pedra das câmaras subterrâneas (Gélio 2.10.3) ---
  b.box(2.4, 0.35, 2.4, -268, Y, 92, { mat: 'travertine' });
  b.box(1.5, 0.08, 1.5, -268, Y + 0.35, 92, { mat: 'bronze', collide: false });

  // --- estátuas votivas e honoríficas de bronze ao longo das bordas ---
  const votive = [
    // [x, z, rotY]
    [-282, 110.5, Math.PI], [-276, 111.2, Math.PI], [-270, 112, Math.PI], [-264, 112.7, Math.PI],
    [-192.5, 48, -Math.PI / 2], [-192.5, 55, -Math.PI / 2], [-192.5, 62, -Math.PI / 2], [-192.5, 69, -Math.PI / 2],
    [-216, -4, 0], [-224, -4, 0], [-264, -4, 0],
    [-302, 70, Math.PI / 2], [-302, 18, Math.PI / 2],
  ];
  votive.forEach(([x, z, r], i) => {
    const gold = i % 4 === 1;
    statueFig(b, x, Y, z, { rotY: r, scale: 1.05 + (i % 3) * 0.08, mat: gold ? 'gold' : 'bronze', armUp: i % 2 === 0, scepter: i % 3 === 2, pose: i % 5 === 3 ? 'nude' : 'stand', pedestal: { w: 1.1, h: 1.3 + (i % 2) * 0.3, d: 1.1, mat: i % 2 ? 'marble' : 'peperino' } });
  });

  // --- curral dos gansos sagrados (gansos alimentados à custa pública — Cic. Rosc. Am. 56) ---
  const px0 = -258;
  const px1 = -242;
  const pz0 = -7;
  const pz1 = 1.5;
  for (let x = px0; x <= px1; x += 2) {
    for (const z of [pz0, pz1]) det.cylinder(0.05, 0.05, 1.0, x, Y, z, { mat: 'wood' });
  }
  for (let z = pz0; z <= pz1; z += 2.1) for (const x of [px0, px1]) det.cylinder(0.05, 0.05, 1.0, x, Y, z, { mat: 'wood' });
  for (const yy of [0.45, 0.9]) {
    det.box(px1 - px0, 0.06, 0.05, (px0 + px1) / 2, Y + yy, pz0, { mat: 'wood' });
    det.box(px1 - px0 - 3, 0.06, 0.05, (px0 + px1) / 2 + 1.5, Y + yy, pz1, { mat: 'wood' });
    det.box(0.05, 0.06, pz1 - pz0, px0, Y + yy, (pz0 + pz1) / 2, { mat: 'wood' });
    det.box(0.05, 0.06, pz1 - pz0, px1, Y + yy, (pz0 + pz1) / 2, { mat: 'wood' });
  }
  b.box(3.4, 1.8, 2.2, px0 + 2.2, Y, pz0 + 1.4, { mat: 'wood' }); // abrigo
  b.box(3.8, 0.12, 2.6, px0 + 2.2, Y + 1.8, pz0 + 1.4, { mat: 'roofTile', collide: false });
  det.box(2.2, 0.3, 0.6, px1 - 3, Y, pz0 + 1.2, { mat: 'travertine' }); // bebedouro
  det.box(2.0, 0.05, 0.4, px1 - 3, Y + 0.27, pz0 + 1.2, { mat: 'water' });
  const geese = ctx.world.instances('capitolio:ganso', gooseGeom(), 'flat', { maxDistance: 90, castShadow: true });
  const rng = ctx.rng(4242);
  for (let i = 0; i < 14; i++) geese.add(lerp(px0 + 1, px1 - 1, rng()), Y, lerp(pz0 + 0.8, pz1 - 0.8, rng()), rng() * 6.28, 0.95 + rng() * 0.15, i % 5 === 0 ? '#ddd8cc' : null);
  for (let i = 0; i < 5; i++) geese.add(-238 + rng() * 6, Y, -3 + rng() * 4, rng() * 6.28, 1);

  return { altar: [ax, az], chariot: [cx, cz] };
}
