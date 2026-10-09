/**
 * Templo da Concórdia (fase de L. Opímio, 121 a.C.), Basílica Opímia e Senaculum.
 *
 * Base documental (docs/pesquisa/01-forum-oeste.md §2):
 *   - templo de Opímio existente; o Senado reuniu-se nele em dez./63 a.C. (Sall. Cat. 46.5; 49.4);
 *   - dimensões, ordem e nº de colunas: NÃO ENCONTRADO; "planta semelhante à tiberiana" (Platner),
 *     cella larga (Agrippa, fonte única) → cella transversal mais estreita no sentido N-S que a
 *     tiberiana, para dar lugar à Basílica Opímia (hipótese da nota);
 *   - pódio de concreto (o mais antigo conhecido em Roma, Platner) com muro de tufo vermelho em
 *     opus quadratum (UCLA RomeLab, fase não especificada); altura preservada ~4 m;
 *   - superestrutura (fonte única, Agrippa): colunas de peperino (estucadas, hipótese), capitéis de
 *     travertino — ordem não atestada → jônica [HIP];
 *   - inscrição sob a qual foi gravado o verso satírico (Plut. C. Gracch. 17.6) — texto NÃO ENCONTRADO;
 *   - NÃO modelar a coleção de arte grega (templo tiberiano).
 * Basílica Opímia: sem restos; "perto do templo, ao norte" (Platner); dimensões da reconstrução
 * do DFR (41 × 25 × c. 16 m), com base em basílicas de Alba Fucens, Cosa e Pompeia.
 * Senaculum: "supra Graecostasim, ubi aedis Concordiae et basilica Opimia" (Varrão LL 5.156).
 */
import { column, entablature } from '../../arch/columns.js';
import { gableRoof, shedRoof } from '../../arch/roofs.js';
import { statue } from '../../arch/temple.js';
import { prop } from '../../arch/props.js';
import { CONCORD, OPIMIA, SENACULUM } from './plan.js';
import { pushFF, figure, victory, stairsRot } from './util.js';
import { transverseTemple } from './templeT.js';

const TUFA_RED = '#e7b9a0'; // tinta para o "tufo vermelho" do pódio (UCLA RomeLab)

export function buildConcord(B) {
  const C = CONCORD;
  const { ext, int, det } = B;
  const cw = C.cella.v1 - C.cella.v0;
  const cd = C.cella.u1 - C.cella.u0;
  const pw = C.pronaos.v1 - C.pronaos.v0;
  const pd = C.pronaos.u1 - C.pronaos.u0;
  const cx = (C.cella.v0 + C.cella.v1) / 2;
  const opt = {
    cw, cd, pw, pd,
    podiumH: C.podiumH,
    podiumMat: 'tufa',
    podiumColor: TUFA_RED,
    stairsMat: 'travertine',
    stairs: { width: C.stairs.width, depth: C.stairs.depth },
    order: 'ionic',
    colH: C.colH,
    colD: C.colD,
    columnsFront: 6,
    columnsSide: 3,
    colMat: 'stucco',
    wallMat: 'stucco',
    entMat: 'stucco',
    pedimentMat: 'stucco',
    floorMat: 'travertine',
    cellaFloorMat: 'slabs',
    wallT: 1.0,
    doorW: 3.6,
    doorH: 6.2,
    entH: 2.0,
    pitch: 0.22,
  };
  pushFF(ext);
  // quadro local: fachada para +u; origem na frente da cella
  ext.push(cx, C.base, C.cella.u1, 0);
  const r = transverseTemple(ext, opt);
  // faixa de inscrição no friso da fachada (texto original NÃO ENCONTRADO: painel liso)
  ext.box(pw * 0.62, 0.62, 0.05, 0, r.entY + 0.82, r.frontZ + 0.62, { mat: 'flat', color: '#d9cdb4', collide: false });
  // figuras de terracota no frontão (genéricas — tema NÃO ENCONTRADO) e acrotérios
  const pz = r.frontZ + 0.35;
  const rise = (r.pronaosRidge - r.roofY) * 0.92;
  for (const [x, pose] of [[0, 0], [-3.2, 2], [3.2, 1], [-6.0, 2], [6.0, 1]]) {
    const avail = rise * (1 - Math.abs(x) / (r.pedimentW / 2)) - 0.25;
    figure(ext, x, r.roofY + 0.05, pz, 0, Math.min(1.2, avail / 1.6), 'terracottaPainted', pose);
  }
  victory(ext, 0, r.pronaosRidge - 0.05, r.frontZ + 0.55, 0, 1.15);
  for (const s of [-1, 1]) ext.box(0.8, 1.1, 0.5, s * (r.pedimentW / 2 - 0.4), r.roofY, r.frontZ + 0.5, { mat: 'terracottaPainted', collide: false });
  // portas de bronze (abertas)
  for (const s of [-1, 1]) ext.box(0.14, 6.0, 1.75, s * 1.85, r.podiumTop, -0.9 - 0.85, { mat: 'bronze', collide: true });
  ext.pop();
  ext.pop();

  // ---------------- interior: sala onde o Senado se reunia ----------------
  const top = C.base + r.podiumTop;
  const iw = cw - 2 * opt.wallT;
  const idp = cd - 2 * opt.wallT;
  pushFF(int);
  int.push(cx, C.base, C.cella.u1, 0);
  const fy = r.podiumTop;
  const zc = -cd / 2;
  // paredes internas: estuque com pintura de 1º estilo (placas de mármore fingidas) [HIP]
  for (const s of [-1, 1]) int.box(0.03, C.colH - 0.3, idp, s * (iw / 2 - 0.02), fy + 0.05, zc, { mat: 'paintFirstStyle', collide: false });
  int.box(iw, C.colH - 0.3, 0.03, 0, fy + 0.05, -cd + opt.wallT + 0.02, { mat: 'paintFirstStyle', collide: false });
  for (const s of [-1, 1]) int.box(iw / 2 - 1.8, C.colH - 0.3, 0.03, s * (iw / 4 + 0.9), fy + 0.05, -opt.wallT - 0.02, { mat: 'paintFirstStyle', collide: false });
  // piso de mármore? NÃO: piso de opus signinum com rombos (scutulatum era luxo do Capitólio) [HIP]
  int.floor(iw, idp, 0, fy + 0.07, zc, { mat: 'signinum', collide: false });
  // teto de caixotões
  for (let k = -3; k <= 3; k++) int.box(0.3, 0.35, idp, k * (iw / 7), fy + C.colH - 0.6, zc, { mat: 'woodDark', collide: false });
  for (let k = -2; k <= 2; k++) int.box(iw, 0.35, 0.3, 0, fy + C.colH - 0.6, zc + k * (idp / 5), { mat: 'woodDark', collide: false });
  // tribunal do magistrado que preside, ao fundo
  int.box(7, 0.55, 3.2, 0, fy, -cd + opt.wallT + 3.4, { mat: 'travertine' });
  stairsRot(int, 3, 1.2, 0.55, 0, fy, -cd + opt.wallT + 6.2, 0, { mat: 'travertine', steps: 3 });
  int.pop();
  int.pop();

  // ---------------- mobiliário (detalhe) ----------------
  pushFF(det);
  det.push(cx, C.base, C.cella.u1, 0);
  // estátua de culto da Concórdia (tipo NÃO ENCONTRADO: figura feminina de pé, marcador)
  statue(det, 0, fy, -cd + opt.wallT + 1.2, { scale: 1.7, mat: 'bronze', baseMat: 'marble', pedestalHeight: 1.0 });
  // cadeiras curuis dos cônsules no tribunal
  for (const s of [-1, 1]) curule(det, s * 1.2, fy + 0.55, -cd + opt.wallT + 3.6);
  // bancos dos senadores (subsellia): 3 fileiras em degraus de cada lado do corredor central
  for (const s of [-1, 1]) {
    for (let row = 0; row < 3; row++) {
      const x = s * (iw / 2 - 1.0 - row * 1.3);
      const y = fy + 0.07 + (2 - row) * 0.0;
      // degrau de madeira sob cada fileira (as de trás mais altas)
      det.box(1.1, (2 - row) * 0.35 + 0.02, idp - 4.5, x, fy + 0.07, zc + 0.6, { mat: 'wood', collide: true });
      for (let k = 0; k < 7; k++) {
        const z = -cd + opt.wallT + 3.2 + k * ((idp - 5.5) / 6);
        prop(det, 'bench', x, y + (2 - row) * 0.35, z, Math.PI / 2, 1, {});
      }
    }
  }
  for (const [x, z] of [[-3.5, -3], [3.5, -3], [-3.5, -cd + 4], [3.5, -cd + 4]]) prop(det, 'lampStand', x, fy + 0.07, z, 0);
  det.pop();
  det.pop();

  return { podiumTop: top, entY: C.base + r.entY, stairsFrontU: C.cella.u1 + r.stairsFrontZ, cx };
}

/** Sela curul (banquinho de pernas cruzadas em X, marfim/bronze). */
function curule(b, x, y, z) {
  b.box(0.62, 0.06, 0.45, x, y + 0.52, z, { mat: 'marble', collide: false });
  for (const s of [-1, 1]) {
    b.box(0.05, 0.7, 0.05, x + s * 0.22, y, z, { mat: 'bronze', collide: false, rotY: 0 });
  }
  b.box(0.5, 0.05, 0.05, x, y + 0.26, z, { mat: 'bronze', collide: false });
}


/* ------------------------------------------------------------------------- */
/*  Basílica Opímia                                                           */
/* ------------------------------------------------------------------------- */
export function buildOpimia(B) {
  const O = OPIMIA;
  const { ext, int, det } = B;
  const L = O.u1 - O.u0; // 41 (ao longo de u)
  const Wd = O.v1 - O.v0; // 25 (ao longo de v)
  const cv = (O.v0 + O.v1) / 2;
  const cu = (O.u0 + O.u1) / 2;
  const fy = O.floor;
  const H1 = 8.2; // colunas internas [HIP]
  const D = 0.9;
  const wallH = 7.0;
  const naveW = 11;
  const clerTop = 13.6;
  pushFF(ext);
  // quadro local: X = v, Z = u (fachada principal para +u, o lado curto voltado para o Comício)
  ext.push(cv, 0, cu, 0);
  // plataforma (cobre também a depressão do terreno junto ao Tullianum)
  ext.box(Wd + 1.2, fy + 4.6, L + 1.2, 0, -4.6, 0, { mat: 'tufa' });
  ext.floor(Wd - 1.2, L - 1.2, 0, fy + 0.04, 0, { mat: 'slabs' });
  // degraus de acesso: frente (leste) e lado sul (voltado para a Concórdia)
  stairsRot(ext, 9, 1.8, fy, -4.5, 0, L / 2 + 0.6 + 1.8, 0, { mat: 'travertine', steps: 3 });
  stairsRot(ext, 7, 1.8, fy, -Wd / 2 - 0.6 - 1.8, 0, 6, -Math.PI / 2, { mat: 'travertine', steps: 3 });
  // paredes externas (tufo estucado) com portas
  const t = 0.9;
  ext.wall(-Wd / 2, Wd / 2, L / 2 - t / 2, wallH, t, { y: fy, mat: 'stucco', openings: [{ at: Wd / 2 - 3.5, w: 3.6, h: 5.4 }, { at: Wd / 2 - 9.5, w: 2.6, h: 4.5 }] });
  // paredes altas das extremidades da nave (sob os frontões)
  for (const z of [L / 2 - t / 2, -L / 2 + t / 2]) ext.box(naveW + 0.6, clerTop - (fy + wallH), t, 0, fy + wallH, z, { mat: 'stucco' });
  ext.wall(-Wd / 2, Wd / 2, -L / 2 + t / 2, wallH, t, { y: fy, mat: 'stucco' });
  // lado sul (v0 → x = −Wd/2): parede ao longo de Z
  ext.push(-Wd / 2 + t / 2, 0, 0, Math.PI / 2);
  ext.wall(-L / 2, L / 2, 0, wallH, t, { y: fy, mat: 'stucco', openings: [{ at: L / 2 - 6, w: 3.2, h: 5 }, { at: L / 2 + 8, w: 3.2, h: 5 }, ...[-14, -3, 12].map((a) => ({ at: L / 2 + a, w: 1.4, h: 1.6, y: 4.6 }))] });
  ext.pop();
  ext.push(Wd / 2 - t / 2, 0, 0, Math.PI / 2);
  ext.wall(-L / 2, L / 2, 0, wallH, t, { y: fy, mat: 'stucco', openings: [-14, -3, 8, 15].map((a) => ({ at: L / 2 + a, w: 1.4, h: 1.6, y: 4.6 })) });
  ext.pop();
  // colunatas internas (2 fileiras ao longo de u), clerestório e telhados
  const nC = 8;
  const zs = [];
  for (let i = 0; i < nC; i++) zs.push(-L / 2 + 5 + (i * (L - 10)) / (nC - 1));
  for (const s of [-1, 1]) {
    for (const z of zs) column(ext, s * naveW / 2, fy, z, { order: 'tuscan', height: H1, diameter: D, mat: 'stucco' });
    ext.push(s * naveW / 2, 0, 0, Math.PI / 2);
    entablature(ext, -L / 2 + 4.5, L / 2 - 4.5, 0, D * 1.1, fy + H1, { mat: 'stucco', colH: H1, height: 1.0, dentils: false });
    // clerestório com janelas
    ext.wall(-L / 2 + 4.5, L / 2 - 4.5, 0, clerTop - (fy + H1 + 1.0), 0.6, { y: fy + H1 + 1.0, mat: 'stucco', openings: zs.slice(0, -1).map((z, i) => ({ at: (zs[i] + zs[i + 1]) / 2 + L / 2 - 4.5, w: 1.5, h: 1.6, y: 1.0 })) });
    ext.pop();
  }
  // nave: duas águas (cumeeira ao longo de u), frontão a leste
  gableRoof(ext, naveW + 1.2, L - 8.4, 0, clerTop, 0, { pitch: 0.24, overhang: 0.5, mat: 'roofTile', gableMat: 'stucco' });
  // naves laterais: uma água, das paredes do clerestório até as paredes externas
  for (const s of [-1, 1]) {
    const aw = (Wd - naveW) / 2;
    ext.push(s * (naveW / 2 + aw / 2), 0, 0, s > 0 ? 0 : Math.PI);
    shedRoof(ext, aw + 0.4, L + 0.4, 0, fy + wallH + 0.1, 0, { pitch: (fy + H1 + 1.0 - (fy + wallH)) / aw + 0.02, overhang: 0.45 });
    ext.pop();
  }
  // muro de arrimo atrás (oeste) — a basílica fica "nas encostas do Capitólio"
  ext.box(Wd + 6, 16, 2.2, 0, -2, -L / 2 - 1.7, { mat: 'tufa', color: '#d8ccb0' });
  ext.box(2.2, 13, L * 0.55, Wd / 2 + 1.7, -2, -L / 4 - 1, { mat: 'tufa', color: '#d8ccb0' });
  ext.pop();
  ext.pop();

  // interior: tribunal no fundo e reboco
  pushFF(int);
  int.push(cv, 0, cu, 0);
  int.box(8, 1.1, 4, 0, fy, -L / 2 + t + 2, { mat: 'travertine' });
  stairsRot(int, 3, 1.2, 1.1, 0, fy, -L / 2 + t + 5.2, 0, { mat: 'travertine', steps: 5 });
  int.pop();
  int.pop();

  pushFF(det);
  det.push(cv, 0, cu, 0);
  curule(det, 0, fy + 1.1, -L / 2 + t + 1.6);
  for (let k = 0; k < 4; k++) prop(det, 'bench', -2.6 + (k % 2) * 5.2, fy, -L / 2 + 9 + Math.floor(k / 2) * 2.2, 0);
  prop(det, 'table', 3.2, fy + 1.1, -L / 2 + t + 2, 0);
  for (let k = 0; k < 3; k++) prop(det, 'chest', -Wd / 2 + 1.6, fy, -8 + k * 1.4, Math.PI / 2);
  det.pop();
  det.pop();
  return { floorY: fy };
}

/* ------------------------------------------------------------------------- */
/*  Senaculum (local de reunião dos senadores) [HIP]                         */
/* ------------------------------------------------------------------------- */
export function buildSenaculum(B) {
  const S = SENACULUM;
  const { ext, det } = B;
  const w = S.v1 - S.v0;
  const d = S.u1 - S.u0;
  pushFF(ext);
  ext.push((S.v0 + S.v1) / 2, 0, (S.u0 + S.u1) / 2, 0);
  ext.box(w, S.h + 0.6, d, 0, -0.6, 0, { mat: 'travertine' });
  stairsRot(ext, w * 0.6, 1.2, S.h, 0, 0, d / 2 + 1.2, 0, { mat: 'travertine', steps: 3 });
  stairsRot(ext, w * 0.6, 1.2, S.h, -w / 2 - 1.2, 0, 0, -Math.PI / 2, { mat: 'travertine', steps: 3 });
  ext.pop();
  ext.pop();
  pushFF(det);
  det.push((S.v0 + S.v1) / 2, S.h, (S.u0 + S.u1) / 2, 0);
  // bancos de pedra em U
  for (let k = 0; k < 4; k++) det.box(1.8, 0.45, 0.5, -w / 2 + 2 + k * ((w - 4) / 3), 0, -d / 2 + 0.6, { mat: 'travertine' });
  for (const s of [-1, 1]) for (let k = 0; k < 3; k++) det.box(0.5, 0.45, 1.8, s * (w / 2 - 0.6), 0, -d / 2 + 3 + k * 2.6, { mat: 'travertine' });
  det.pop();
  det.pop();
}
