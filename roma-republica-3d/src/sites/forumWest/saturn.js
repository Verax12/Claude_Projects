/**
 * Templo de Saturno (Aedes Saturni) na fase ANTERIOR a Munácio Planco, com o Aerarium.
 *
 * Base documental (docs/pesquisa/01-forum-oeste.md §1):
 *   - templo dedicado em 497 a.C. (Lívio 2.21.2); o pódio de travertino de Planco é posterior a 44 a.C.;
 *   - dimensões, ordem e nº de colunas do templo republicano: NÃO ENCONTRADO → templo de tipo
 *     toscano/itálico (Seindal: "provavelmente de estilo etrusco"), modelado segundo as regras de
 *     Vitrúvio 4.7 (nota 11 §7: largura = 5/6 do comprimento; coluna = 1/3 da largura;
 *     diâmetro = 1/7 da altura), dentro do envelope do pódio de Planco;
 *   - pódio de cappellaccio (tese de Oxford; Touring Club) → material 'tufaGrey';
 *   - Tritões com trompas no frontão (Macróbio Sat. 1.8.4, via Platner/ficha LTU);
 *   - estátua de culto cheia de óleo, pés atados com faixas de lã (Plín. NH 15.32; Macróbio 1.8.5);
 *   - Aerarium: tesouro (dinheiro), leis gravadas em bronze (Suet. Iul. 28.3), estandartes militares
 *     (Lívio 3.69.8; 7.23.3), balança oficial (keytoumbria, confiança média); arrombado por César
 *     em 49 a.C. (Plut. Caes. 35). Escritórios "talvez atrás, na Area Saturni" (Platner).
 *   - NÃO modelar: as 8 colunas de granito (séc. IV d.C.), as salas sob a escada (Planco).
 */
import { podiumTemple, statue } from '../../arch/temple.js';
import { prop } from '../../arch/props.js';
import * as THREE from 'three';
import * as G from '../../render/geom.js';
import { SATURN, rotFF } from './plan.js';
import { pushFF, triton, beam } from './util.js';

/** Constrói o templo. B = { ext, int, det } (builders). Devolve dados úteis (cota do piso etc.). */
export function buildSaturn(B) {
  const S = SATURN;
  const Hc = S.width / 3; // Vitrúvio 4.7.2: altura da coluna = 1/3 da largura do templo
  const D = Hc / 7; // Vitrúvio 4.7.2: diâmetro = 1/7 da altura
  const { ext, int, det } = B;

  pushFF(ext);
  ext.push(S.v, S.base, S.u, rotFF(S.bearing));
  const r = podiumTemple(ext, {
    width: S.width,
    length: S.length,
    podiumHeight: S.podiumH,
    podiumMat: 'tufaGrey',
    stairs: { width: S.stairsWidth, depth: S.stairsDepth },
    order: 'tuscan',
    columnsFront: 4,
    columnsDeep: 2,
    porchFull: true,
    columnHeight: Hc,
    columnDiameter: D,
    colMat: 'stucco',
    entMat: 'terracottaPainted',
    entHeight: 1.5,
    wallMat: 'stucco',
    floorMat: 'slabsTufa',
    pedimentMat: 'terracottaPainted',
    roofMat: 'roofTile',
    pitch: 0.24,
    doorWidth: 3.4,
    doorHeight: 4.6,
    statue: false,
    acroteria: false,
  });
  // embasamento em terraço (DFR) — degraus de nivelamento ao redor do pódio
  ext.box(S.width + 2.2, 0.5, S.length + 2.2, 0, -0.45, 0, { mat: 'tufaGrey', collide: true });

  // ---- Tritões com trompas no frontão (cantos e ápice) ----
  const roofFrontZ = r.frontRowZ + 0.9;
  const halfW = S.width / 2 - 0.3;
  triton(ext, -halfW + 0.6, r.roofY + 0.15, roofFrontZ, Math.PI, 1.3);
  triton(ext, halfW - 0.6, r.roofY + 0.15, roofFrontZ, 0, 1.3);
  // antefixas de terracota ao longo dos beirais
  const eaveY = r.roofY - 0.62;
  for (let z = -S.length / 2 + 0.4; z < r.frontRowZ + 0.8; z += 0.75) {
    for (const s of [-1, 1]) ext.box(0.22, 0.32, 0.06, s * (S.width / 2 + 0.05), eaveY, z, { mat: 'terracottaPainted', collide: false, rotY: Math.PI / 2 });
  }
  // portas de madeira com placas de bronze (abertas para dentro) — a "porta do tesouro"
  const dz = r.cella.z1 - 0.6;
  for (const s of [-1, 1]) {
    ext.box(0.12, 4.5, 1.7, s * 1.65, r.podiumTop, dz - 0.85, { mat: 'woodDark', collide: true });
  }
  ext.pop();
  ext.pop();

  // ---------------- interior (Aerarium) ----------------
  pushFF(int);
  int.push(S.v, S.base, S.u, rotFF(S.bearing));
  const top = r.podiumTop;
  const { x0, x1, z0, z1 } = r.cella;
  const wt = Math.max(0.6, D * 0.9);
  const iw = x1 - x0 - 2 * wt;
  const id = z1 - z0 - 2 * wt;
  const czc = (z0 + z1) / 2;
  // piso de opus signinum e reboco interno
  int.floor(iw, id, 0, top + 0.06, czc, { mat: 'signinum', collide: false });
  for (const s of [-1, 1]) int.box(0.03, Hc - 0.2, id, s * (iw / 2 - 0.01), top + 0.05, czc, { mat: 'paintFirstStyle', collide: false });
  int.box(iw, Hc - 0.2, 0.03, 0, top + 0.05, z0 + wt + 0.02, { mat: 'paintFirstStyle', collide: false });
  // teto de caixotões (madeira)
  int.box(iw, 0.12, id, 0, top + Hc - 0.45, czc, { mat: 'woodDark', collide: false });
  for (let k = -2; k <= 2; k++) int.box(0.25, 0.3, id, k * (iw / 5), top + Hc - 0.75, czc, { mat: 'woodDark', collide: false });
  int.pop();
  int.pop();

  // ---------------- objetos do Aerarium (detalhe, culling por distância) ----------------
  pushFF(det);
  det.push(S.v, S.base, S.u, rotFF(S.bearing));
  const fy = top + 0.06;
  // estátua de culto ao fundo, com as faixas de lã nos pés
  statue(det, 0, fy, z0 + wt + 1.6, { scale: 1.45, mat: 'terracottaPainted', baseMat: 'tufaGrey', pedestalHeight: 1.0, seated: true });
  for (const s of [-1, 1]) det.box(0.16, 0.08, 0.2, s * 0.13, fy + 1.45, z0 + wt + 1.6 + 0.62, { mat: 'cloth', collide: false });
  // arcas do tesouro (madeira com ferragens) ao longo das paredes
  for (let i = 0; i < 5; i++) {
    for (const s of [-1, 1]) {
      const zz = z0 + wt + 4 + i * 1.6;
      if (zz > z1 - wt - 2.5) continue;
      prop(det, 'chest', s * (iw / 2 - 0.5), fy, zz, Math.PI / 2, 1, { mat: 'woodDark', collide: true });
      det.box(1.16, 0.05, 0.05, s * (iw / 2 - 0.5), fy + 0.3, zz, { mat: 'iron', collide: false, rotY: Math.PI / 2 });
    }
  }
  // tábuas de bronze com leis, penduradas na parede do fundo (Suet. Iul. 28.3)
  for (let i = 0; i < 6; i++) {
    const tx = -iw / 2 + 1.2 + i * ((iw - 2.4) / 5);
    if (Math.abs(tx) < 1.4) continue;
    det.box(0.9, 1.2, 0.05, tx, fy + 1.6 + (i % 2) * 0.15, z0 + wt + 0.08, { mat: 'bronze', collide: false });
  }
  // estandartes militares (signa) num suporte (Lívio 3.69.8; 7.23.3)
  const sx = iw / 2 - 1.4;
  const sz = z1 - wt - 1.6;
  det.box(1.8, 0.12, 0.3, sx - 0.4, fy + 0.6, sz, { mat: 'woodDark', collide: false });
  for (let k = 0; k < 4; k++) {
    const px = sx - 1.1 + k * 0.45;
    det.add(G.cylinder(0.03, 0.03, 3.1, 6), { mat: 'woodDark', matrix: m4(px, fy, sz - 0.05) });
    for (let d = 0; d < 3; d++) det.add(G.cylinder(0.13, 0.13, 0.04, 12).rotateX(Math.PI / 2), { mat: 'bronze', matrix: m4(px, fy + 1.9 + d * 0.33, sz + 0.02) });
    det.add(G.cylinder(0.0, 0.07, 0.25, 6), { mat: 'bronze', matrix: m4(px, fy + 3.1, sz - 0.05) });
  }
  // balança oficial de pesar metais (trave com dois pratos)
  const bx = -iw / 2 + 1.6;
  const bz = z1 - wt - 1.8;
  det.box(0.12, 1.8, 0.12, bx, fy, bz, { mat: 'woodDark', collide: true });
  beam(det, [bx - 0.9, fy + 1.75, bz], [bx + 0.9, fy + 1.75, bz], 0.06, 0.06, { mat: 'bronze' });
  for (const s of [-1, 1]) {
    det.add(G.cylinder(0.008, 0.008, 0.7, 4), { mat: 'bronze', matrix: m4(bx + s * 0.85, fy + 1.05, bz) });
    det.add(G.cylinder(0.25, 0.2, 0.06, 12), { mat: 'bronze', matrix: m4(bx + s * 0.85, fy + 1.0, bz) });
  }
  // mesa do escriba do questor, com tabuinhas e sacos de moedas
  prop(det, 'table', -1.6, fy, z1 - wt - 3.2, 0.1, 1, { collide: true });
  prop(det, 'stool', -1.6, fy, z1 - wt - 2.5, 0);
  for (let k = 0; k < 3; k++) prop(det, 'sack', -2.1 + k * 0.45, fy + 0.8, z1 - wt - 3.25, k, 0.45, { color: '#c8b48a' });
  prop(det, 'lampStand', 1.3, fy, z0 + wt + 3.2, 0);
  prop(det, 'lampStand', -1.3, fy, z0 + wt + 3.2, 0);
  det.pop();
  det.pop();

  return { podiumTop: top, floorY: S.base + top, roofY: r.roofY, ridgeY: r.ridgeY, cella: r.cella, stairsFrontZ: r.stairsFrontZ };
}

/** Matriz de translação (posiciona geometrias avulsas). */
function m4(x, y, z) {
  return new THREE.Matrix4().makeTranslation(x, y, z);
}
