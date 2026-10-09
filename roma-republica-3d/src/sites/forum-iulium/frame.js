/**
 * Fórum de César — quadro local, cotas e constantes de implantação.
 *
 * QUADRO LOCAL DO SÍTIO (usado por todos os módulos desta pasta):
 *   origem = ponto Pleiades do Templo de Vênus Genetrix (−12,9; −182,9) [nota 00/04];
 *   +Z local = eixo longo do fórum, para SSE (rumo 158°, derivado na nota 04 §2 [D]);
 *   +X local = perpendicular, para ENE (rumo 68°).
 *   Assim "t" (distância ao longo do eixo, usada no LAYOUT) = z local e o lado ENE é x > 0.
 *
 * Todas as dimensões abaixo que NÃO têm fonte na nota 04 são HIPÓTESES de modelagem e estão
 * declaradas nos painéis de informação (campo uncertain).
 */
import { facingRotY, place } from '../../core/geo.js';

/** Rumo do eixo longo (templo → SSE). Nota 04 §2: ≈ 158° ± 8° [D]. */
export const AXIS_BEARING = 158;
/** Rotação Y do quadro local (fachada do templo para +Z local = rumo 158°). */
export const ROT = facingRotY(AXIS_BEARING);
/** Origem: ponto Pleiades do templo (ruínas trajânicas; acurácia ~20 m). */
export const ORIGIN = place('Temple of Venus Genetrix');

const C = Math.cos(ROT);
const S = Math.sin(ROT);

/** Local (x, z) → mundo {x, z}. */
export function W(lx, lz) {
  return { x: ORIGIN.x + lx * C + lz * S, z: ORIGIN.z - lx * S + lz * C };
}
/** Local → [x, z] do mundo (para caminhos de NPC sem cota). */
export function Wa(lx, lz) {
  const p = W(lx, lz);
  return [p.x, p.z];
}
/** Local → [x, y, z] do mundo (caminhos de NPC com cota explícita). */
export function Wy(lx, y, lz) {
  const p = W(lx, lz);
  return [p.x, y, p.z];
}
/** Polígono local [[x,z],...] → polígono do mundo. */
export function Wpoly(pts) {
  return pts.map(([x, z]) => Wa(x, z));
}

/** Rumo de bússola de uma direção local (graus): 0 = +Z local (SSE, 158°). */
export function bearingLocal(deg) {
  return (((AXIS_BEARING + deg) % 360) + 360) % 360;
}
/** Yaw de NPC (rad) para olhar na direção do rumo de bússola b. */
export function yawFor(bearingDeg) {
  return Math.PI - (bearingDeg * Math.PI) / 180;
}

/**
 * Cotas (y do mundo). HIPÓTESE: a cota do pavimento do Fórum de César não foi encontrada
 * (nota 04, Lacunas); adotamos um nível próximo ao do Comício/Fórum (y ≈ 0), um pouco acima.
 */
export const Y = {
  pad: 0.3, // terreno nivelado dentro do recinto
  pave: 0.45, // topo do pavimento da praça
  portico: 0.63, // piso dos pórticos e das tabernae (um degrau acima da praça)
  podium: 5.45, // topo do pódio do templo (pódio de 5 m — hipótese, nota 04 §3)
};

/** Planta do recinto (x local; ± simétrico em torno do eixo do templo). */
export const P = {
  colX: 23.5, // eixo das colunatas dos pórticos laterais
  stylo: 22.8, // borda do estilóbato (degrau praça → pórtico)
  backX: 30, // face do muro de fundo do pórtico = frente das tabernae
  backT: 0.6,
  tabX: 34, // fundo das tabernae = face interna do muro externo
  wswOuter: 37, // muro de arrimo OSO (encosta do Capitólio): de −34 a −37
  eneOuter: 35.5, // muro ENE: de 34 a 35,5
  backZ: -19, // face interna do muro NNO (atrás do templo)
  backZ2: -22, // face externa do muro NNO
  finEnd: 86, // fim dos pórticos/tabernae concluídos
  hoard1: 86.5, // tapume interno (praça → canteiro)
  endZ: 104, // tapume externo (limite SSE do recinto, LAYOUT t = 105)
  colZ0: -16.5, // primeira coluna dos pórticos
  colStep: 3.6, // intercolúnio (entre eixos) dos pórticos — hipótese
  colN: 29, // colunas concluídas por lado (z = −16,5 … 84,3)
  colH: 7.0, // altura total das colunas dos pórticos — hipótese
  colD: 0.78,
  entH: 1.3,
  roofPitch: 0.25,
  nTab: 23, // tabernae por lado (z = −19 … 86)
};
P.tabW = (P.finEnd - P.backZ) / P.nTab;
P.entY = Y.portico + 0.005 + P.colH; // base do entablamento dos pórticos
P.roofY = P.entY + P.entH; // beiral baixo do telhado (sobre a colunata)

/** Templo (quadro local com origem no ponto do templo). Ver nota 04 §3 e temple.js. */
export const TPL = {
  D: 1.3, // diâmetro das colunas — NÃO ENCONTRADO; parâmetro (nota 04: D ≤ ~1,6 m pelo envelope [D])
  N: 8, // octastilo (nota 04 §3)
  podW: 26,
  podZ0: -17,
  podZ1: 17,
};
TPL.IC = 2.5 * TPL.D; // picnostilo: vão livre = 1,5 D → entre eixos = 2,5 D (Vitr. 3.3.2)
TPL.Hc = 10 * TPL.D; // altura da coluna = 10 D (regra genérica de Vitr. 3.3.10)
TPL.ZF = 7.0; // fila frontal de colunas
TPL.entH = 2.9;
TPL.xs = Array.from({ length: TPL.N }, (_, i) => (i - (TPL.N - 1) / 2) * TPL.IC);
TPL.halfSpan = TPL.xs[TPL.N - 1]; // 11,375
TPL.rearZ = TPL.ZF - 7 * TPL.IC; // −15,75: 8ª "coluna" lateral, embutida no muro de fundo (sine postico)
TPL.cellaX = 8.4; // face externa das paredes da cella
TPL.cellaT = 1.2;
TPL.cellaFront = 1.1; // face frontal da parede da cella (pronaos com 2 intercolúnios)
TPL.rearWall0 = -16.4;
TPL.rearWall1 = -15.4;
TPL.eY = Y.podium + TPL.Hc; // base do entablamento
TPL.stairW = 2.6;
TPL.stairTop = 9.4; // as escadas laterais sobem de z = 17 (chão) até z = 9,4 (topo do pódio)
