/**
 * Tabularium (Q. Lutácio Cátulo, 78–65 a.C.) e Templo de Véiove (fase silana).
 *
 * Base documental (docs/pesquisa/01-forum-oeste.md §3–4; 05-capitolio.md §5):
 *   - identificação DEBATIDA (arquivo; Atrium Libertatis — Purcell; Juno Moneta — Tucci;
 *     templo triplo silano — Coarelli). Substrução e galeria em arcada não estão em disputa;
 *   - fachada de 73,6 m (⚠); muro da substrução com 3,43 m (Platner); 6 janelas estreitas em 6
 *     recessos e um arco no extremo esquerdo; escada íngreme do nível do Fórum para cima;
 *   - galeria: 67 m, ~15 m acima do Fórum; 11 arcos (Platner/Musei Capitolini; outra versão: 10)
 *     de 7,50 × 3,54–3,60 m (⚠), emoldurados por meias-colunas dóricas, friso dórico de travertino
 *     com tríglifos; abóbada de pavilhão;
 *   - materiais: muros externos de sperone/peperino (divergência terminológica), bases, capitéis,
 *     impostas e friso de travertino; muros internos de tufo do Aniene; núcleo de concreto;
 *   - pavimento superior coríntio (arcada segundo Platner; colunata segundo Wikipedia), altura
 *     NÃO ENCONTRADA → arcada coríntia de 8 m [HIP];
 *   - recuo quadrangular no canto O/SO para o Templo de Véiove (anterior).
 * Véiove: cella transversal 15 × 8,90 m (⚠), pronaos tetrastilo centrado, escadaria; pódio de
 * concreto revestido de travertino; paredes da cella de tufo de Grotta Oscura; teto de madeira;
 * estátua de culto de CIPRESTE (Plín. NH 16.216) com flechas; figura de cabra junto à estátua
 * (Gélio 5.12.12 — descreve o séc. II d.C.; extrapolação). Altura do pódio e orientação: NÃO ENCONTRADO.
 */
import { column, entablature, arch } from '../../arch/columns.js';
import { hipRoof } from '../../arch/roofs.js';
import * as G from '../../render/geom.js';
import * as THREE from 'three';
import { TAB, VEIOVIS, rotFF } from './plan.js';
import { pushFF, stairsRot, figure } from './util.js';
import { transverseTemple } from './templeT.js';

/** Caixa no quadro do Fórum dada por intervalos de v, u e y. */
function boxVU(b, v0, v1, u0, u1, y0, y1, o = {}) {
  b.box(v1 - v0, y1 - y0, u1 - u0, (v0 + v1) / 2, y0, (u0 + u1) / 2, o);
}

export function buildTabularium(B) {
  const T = TAB;
  const { tab, det } = B;
  const yb = -2; // base das fundações (abaixo de todo o terreno vizinho)
  const uF = T.uFront;
  const uW = uF - T.wallT; // face interna do muro da fachada (−136,43)
  const uG = uF - 1.6 - T.galleryDepth; // fundo do corredor da galeria (−140,2)
  const uGB = uG - 1.0; // face externa do muro de fundo da galeria (−141,2)
  const uS = -139.6; // fundo da caixa da escada
  const fl = T.galleryFloor;
  const door = T.door;
  const stairTop = -30.5;
  const stairBot = -44;
  const holeV0 = -36;
  pushFF(tab);

  // ---------------- substrução ----------------
  // muro da fachada (peperino) com o arco de entrada no extremo esquerdo (sul)
  tab.wall(T.v0, T.v1, (uF + uW) / 2, fl - 0.4 - yb, T.wallT, {
    y: yb, mat: 'peperino', openings: [{ at: door.v - T.v0, w: door.w, h: door.h, y: door.y - yb }],
  });
  // arco sobre a porta (aduelas de travertino) e soleira
  arch(tab, door.v, door.y + door.h - door.w / 2, uF + 0.05, door.w, 0.3, { mat: 'travertine', thickness: 0.4 });
  boxVU(tab, door.v - door.w / 2 - 0.3, door.v + door.w / 2 + 0.3, uF - 0.1, uF + 0.25, door.y - 0.12, door.y, { mat: 'travertine', collide: false });
  // seis janelas estreitas em seis recessos
  const wins = [-41, -33.5, -26, -18.5, -11, -3.5];
  for (const v of wins) {
    boxVU(tab, v - 1.1, v + 1.1, uF - 0.02, uF + 0.12, 10.2, 10.45, { mat: 'travertine', collide: false }); // peitoril do recesso
    for (const s of [-1, 1]) boxVU(tab, v + s * 1.1 - 0.2, v + s * 1.1 + 0.2, uF - 0.02, uF + 0.18, 10.2, 14.4, { mat: 'peperino', collide: false });
    boxVU(tab, v - 0.42, v + 0.42, uF - 0.02, uF + 0.02, 10.9, 13.9, { mat: 'flat', color: '#1d1a16', collide: false }); // vão escuro
    boxVU(tab, v - 0.6, v + 0.6, uF - 0.02, uF + 0.1, 13.9, 14.15, { mat: 'travertine', collide: false }); // verga
  }
  // bloco maciço sob a galeria
  boxVU(tab, stairTop, T.v1, uGB, uW, yb, fl - 0.4, { mat: 'tufa' });
  // caixa da escada: piso, parede oeste, parede sul
  boxVU(tab, T.v0, stairTop, uS, uW, yb, door.y, { mat: 'tufa' });
  boxVU(tab, T.v0, stairTop, uGB, uS, yb, fl - 0.4, { mat: 'tufa' });
  boxVU(tab, T.v0, T.v0 + 1, uS, uW, door.y, fl - 0.4, { mat: 'tufa' });
  // escada íngreme do nível da rua até a galeria (sobe para NNE, +v)
  stairsRot(tab, uW - uS - 0.2, stairTop - stairBot, fl - door.y, stairBot, door.y, (uW + uS) / 2, -Math.PI / 2, { mat: 'travertine' });

  // ---------------- piso da galeria (com abertura sobre a escada) ----------------
  const fo = { mat: 'slabs' };
  boxVU(tab, T.v0, holeV0, uGB, uF, fl - 0.4, fl, fo);
  boxVU(tab, stairTop, T.v1, uGB, uF, fl - 0.4, fl, fo);
  boxVU(tab, holeV0, stairTop, uGB, uS, fl - 0.4, fl, fo);
  boxVU(tab, holeV0, stairTop, uW, uF, fl - 0.4, fl, fo);
  // guarda-corpos de madeira em volta da abertura
  boxVU(tab, holeV0, stairTop, uW - 0.08, uW, fl, fl + 1.0, { mat: 'woodDark' });
  boxVU(tab, holeV0, stairTop, uS, uS + 0.08, fl, fl + 1.0, { mat: 'woodDark' });
  boxVU(tab, holeV0, holeV0 + 0.08, uS, uW, fl, fl + 1.0, { mat: 'woodDark' });
  // faixa (plinto) de travertino na fachada no nível da galeria
  boxVU(tab, T.v0, T.v1, uF - 0.2, uF + 0.25, fl - 0.55, fl + 0.05, { mat: 'travertine', collide: false });

  // ---------------- galeria em arcada ----------------
  const yTop = T.topY;
  const springY = fl + T.archH - T.archW / 2;
  const bay = (T.galV1 - T.galV0) / T.arches;
  const pierW = bay - T.archW;
  // muro de fundo e paredes das extremidades
  boxVU(tab, T.v0, T.v1, uGB, uG, fl, yTop, { mat: 'tufa' });
  boxVU(tab, T.v0, T.galV0 + pierW / 2, uG, uF, fl, yTop, { mat: 'peperino' });
  boxVU(tab, T.galV1 - pierW / 2, T.v1, uG, uF, fl, yTop, { mat: 'peperino' });
  // laje da abóbada (teto plano) e entablamento
  boxVU(tab, T.v0, T.v1, uGB, uF - 1.6, springY + T.archW / 2 + 0.1, yTop, { mat: 'opusIncertum', collide: true });
  for (let k = 0; k <= T.arches; k++) {
    const v = T.galV0 + k * bay;
    if (k > 0 && k < T.arches) boxVU(tab, v - pierW / 2, v + pierW / 2, uF - 1.6, uF, fl, springY, { mat: 'peperino' });
    // impostas de travertino
    boxVU(tab, v - pierW / 2 - 0.1, v + pierW / 2 + 0.1, uF - 1.65, uF + 0.12, springY - 0.3, springY, { mat: 'travertine', collide: false });
    // meia-coluna dórica adossada (fuste de peperino)
    column(tab, v, fl, uF, { order: 'doric', height: springY + T.archW / 2 + 0.45 - fl, diameter: 0.95, mat: 'peperino', base: true, collide: false, fluted: false });
    // enchimento acima do pilar entre os arcos
    if (k > 0 && k < T.arches) boxVU(tab, v - (bay - T.archW - 0.9) / 2, v + (bay - T.archW - 0.9) / 2, uF - 1.6, uF, springY, springY + T.archW / 2 + 0.45, { mat: 'peperino', collide: false });
  }
  for (let k = 0; k < T.arches; k++) {
    const v = T.galV0 + (k + 0.5) * bay;
    arch(tab, v, springY, uF - 0.8, T.archW, 1.6, { mat: 'peperino', thickness: 0.45 });
    // parapeito baixo entre os pilares (segurança) [HIP]
    boxVU(tab, v - T.archW / 2, v + T.archW / 2, uF - 0.5, uF - 0.1, fl, fl + 0.95, { mat: 'travertine' });
  }
  const entY = springY + T.archW / 2 + 0.45;
  pushInFF(tab, 0, 0, uF - 0.6, 0, () => entablature(tab, T.v0, T.v1, 0, 1.3, entY, { order: 'doric', triglyphs: true, triglyphSpacing: bay / 4, mat: 'travertine', height: yTop - entY, dentils: false }));

  // ---------------- núcleo e recuo de Véiove ----------------
  const R = VEIOVIS.recess;
  boxVU(tab, R.v1, T.v1, T.uBack, uGB, yb, yTop, { mat: 'tufa' });
  // terraço superior (piso no nível da sela capitolina)
  boxVU(tab, R.v1, T.v1, T.uBack, uGB, yTop - 0.02, yTop + 0.05, { mat: 'slabs', collide: false });
  // muro de arrimo a oeste do recuo (substruções do Capitólio, opus quadratum de tufo) [HIP]
  boxVU(tab, -54, R.v1, T.uBack, T.uBack + 1.0, 8, yTop - 0.5, { mat: 'tufa', color: '#d9cfb6' });

  // ---------------- pavimento superior (arcada coríntia) [HIP] ----------------
  const uU = uF - 0.4;
  const uUB = uF - T.upperDepth;
  const y0 = yTop;
  const ySpring = y0 + 0.5 + 3.6;
  const yEnt = ySpring + T.archW / 2 + 0.45;
  const yRoof = yEnt + 1.3;
  boxVU(tab, T.v0, T.v1, uUB, uUB + 1.0, y0, yRoof, { mat: 'peperino' }); // muro de fundo
  boxVU(tab, T.v0, T.v1, uU - 2.2, uU - 1.6, y0, yEnt, { mat: 'tufa', color: '#8f8676' }); // parede interna (fundo das arcadas)
  boxVU(tab, T.v0, T.galV0 + pierW / 2, uUB, uU, y0, yRoof, { mat: 'peperino' });
  boxVU(tab, T.galV1 - pierW / 2, T.v1, uUB, uU, y0, yRoof, { mat: 'peperino' });
  boxVU(tab, T.v0, T.v1, uU - 1.6, uU, y0, y0 + 0.5, { mat: 'travertine' }); // plinto
  for (let k = 1; k < T.arches; k++) {
    const v = T.galV0 + k * bay;
    boxVU(tab, v - pierW / 2, v + pierW / 2, uU - 1.6, uU, y0 + 0.5, ySpring, { mat: 'peperino' });
    boxVU(tab, v - (bay - T.archW - 0.9) / 2, v + (bay - T.archW - 0.9) / 2, uU - 1.6, uU, ySpring, yEnt, { mat: 'peperino', collide: false });
  }
  for (let k = 0; k <= T.arches; k++) {
    const v = T.galV0 + k * bay;
    column(tab, v, y0 + 0.5, uU, { order: 'corinthian', height: yEnt - y0 - 0.5, diameter: 0.7, mat: 'travertine', collide: false });
  }
  for (let k = 0; k < T.arches; k++) arch(tab, T.galV0 + (k + 0.5) * bay, ySpring, uU - 0.8, T.archW, 1.6, { mat: 'peperino', thickness: 0.45 });
  pushInFF(tab, 0, 0, uU - 0.6, 0, () => entablature(tab, T.v0, T.v1, 0, 1.3, yEnt, { order: 'corinthian', mat: 'travertine', height: yRoof - yEnt }));
  boxVU(tab, T.v0, T.v1, uUB, uU - 1.0, yEnt, yRoof, { mat: 'tufa', collide: false }); // laje
  // telhado de quatro águas
  pushInFF(tab, (T.v0 + T.v1) / 2, 0, (uU + uUB) / 2, 0, () => hipRoof(tab, T.v1 - T.v0 + 0.4, uU - uUB + 0.6, 0, yRoof, 0, { pitch: 0.25, overhang: 0.6 }));

  tab.pop();

  // ---------------- detalhes: tábuas de bronze e mesas na galeria (se arquivo) ----------------
  pushFF(det);
  for (let k = 0; k < 4; k++) {
    const v = T.galV0 + (k * 3 + 1.5) * bay;
    det.box(1.4, 0.9, 0.05, v, fl + 1.5, uG + 0.04, { mat: 'bronze', collide: false });
  }
  det.pop();

  return { galleryY: fl, stair: { vBot: stairBot, vTop: stairTop, u: (uW + uS) / 2 }, door };
}

/** Executa fn num quadro local (dentro do quadro do Fórum já ativo). */
function pushInFF(b, x, y, z, rot, fn) {
  b.push(x, y, z, rot);
  try {
    fn();
  } finally {
    b.pop();
  }
}

/* ------------------------------------------------------------------------- */
/*  Templo de Véiove                                                         */
/* ------------------------------------------------------------------------- */
export function buildVeiovis(B) {
  const V = VEIOVIS;
  const { ext, det } = B;
  const cd = V.cellaD;
  const vo = V.recess.v1 - 0.15 - cd; // plano entre a cella e o pronaos
  const opt = {
    cw: V.cellaW,
    cd,
    pw: 10,
    pd: 5,
    podiumH: V.podiumH,
    podiumMat: 'travertine',
    stairs: { width: 7.5, depth: 4.4 },
    order: 'ionic',
    colH: 6.4,
    colD: 0.72,
    columnsFront: 4,
    columnsSide: 1,
    colMat: 'stucco',
    wallMat: 'tufa',
    entMat: 'stucco',
    pedimentMat: 'stucco',
    floorMat: 'travertine',
    wallT: 0.8,
    doorW: 2.4,
    doorH: 4.6,
    entH: 1.3,
    pitch: 0.2,
  };
  pushFF(ext);
  ext.push(vo, V.base, V.u, rotFF(V.bearing));
  const r = transverseTemple(ext, opt);
  ext.pop();
  ext.pop();
  // estátua de culto de cipreste segurando flechas, e a cabra
  pushFF(det);
  det.push(vo, V.base, V.u, rotFF(V.bearing));
  const fy = r.podiumTop + 0.03;
  const zs = -cd + opt.wallT + 1.4;
  det.box(1.2, 0.9, 1.0, 0, fy, zs, { mat: 'travertine', collide: true });
  figure(det, 0, fy + 0.9, zs, 0, 1.25, 'woodDark', 1);
  det.add(G.cylinder(0.012, 0.012, 0.9, 4).rotateZ(-0.4), { mat: 'bronze', matrix: new THREE.Matrix4().makeTranslation(-0.25, fy + 1.9, zs + 0.15) });
  // cabra (corpo, pescoço, cabeça, pernas)
  const gx = 1.3;
  det.box(0.75, 0.38, 0.32, gx, fy + 0.45, zs, { mat: 'woodDark', collide: false });
  det.box(0.14, 0.32, 0.14, gx + 0.38, fy + 0.7, zs, { mat: 'woodDark', collide: false });
  det.box(0.26, 0.15, 0.14, gx + 0.48, fy + 0.95, zs, { mat: 'woodDark', collide: false });
  for (const s of [-1, 1]) det.box(0.03, 0.18, 0.03, gx + 0.45, fy + 1.08, zs + s * 0.04, { mat: 'woodDark', collide: false }); // chifres
  for (const [dx, dz] of [[-0.3, -0.12], [0.3, -0.12], [-0.3, 0.12], [0.3, 0.12]]) det.box(0.06, 0.45, 0.06, gx + dx, fy, zs + dz, { mat: 'woodDark', collide: false });
  det.pop();
  det.pop();
  return { floorY: V.base + r.podiumTop, vo };
}
