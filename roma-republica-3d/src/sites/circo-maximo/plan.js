/**
 * Circo Máximo — planta e cotas (fonte única dos números deste sítio).
 *
 * TODOS os valores vêm de docs/pesquisa/10-circo-topografia.md (§1, "Proposta de modelagem")
 * e de docs/pesquisa/11-materiais-pessoas.md. Onde a nota diz NÃO ENCONTRADO, o número é
 * marcado aqui como HIPÓTESE e declarado no painel de informação correspondente.
 *
 * QUADRO DO CIRCO (coordenadas locais X, Z deste sítio):
 *   origem = ponto Pleiades do Circus Maximus (58,9; 731,4) — nota 10 §1 ("centro ± 30 m");
 *   +X = ao longo do eixo para ESE (rumo 126°, extremidade curva); −X = ONO (carceres, Forum Boarium);
 *   +Z = rumo 216° (SSO, lado do Aventino); −Z = rumo 36° (NNE, lado do Palatino).
 *   Em three.js: rotY = facingRotY(216) (a "fachada" local +Z aponta para o Aventino).
 *
 * CORTE TRANSVERSAL (distância r ao eixo da arena nos lados retos; ao centro da curva na meia-lua):
 *   r 0–40       arena (largura de trabalho 80 m: "~540 × 80 m", nota 10 — baixa confiança, HIPÓTESE)
 *   r 40–42,96   euripus (fosso de César, 10 pés de largura e de profundidade — Dion. 3.68.2)
 *   r 42,96–45   pódio com parapeito (HIPÓTESE de forma)
 *   r 45–50,76   arquibancada de pedra, 8 fileiras (nº e medidas das fileiras: NÃO ENCONTRADO → HIPÓTESE)
 *   r 50,76–52   corredor (praecinctio) — HIPÓTESE
 *   r 52–59      arquibancada de madeira, 10 fileiras; por baixo, lojas e moradias (Dion. 3.68.3–4)
 *   r 59–59,6    parede externa
 *   r 59,6–63,2  pórtico externo de um andar (Dion. 3.68.4)
 *   r 63,6–70    rua (largura NÃO ENCONTRADA → HIPÓTESE)
 *   largura externa total da cávea ≈ 118 m (4 plethra, Dion. 3.68.2, conversão de 0,296 m/pé).
 */
import { place, facingRotY, PES } from '../../core/geo.js';

const DEG = Math.PI / 180;

/** Ponto Pleiades usado como centro (nota 10 §1). */
export const CENTER = place('Circus Maximus');
/** Rumo do eixo ONO→ESE derivado do DEM (nota 10 §1, "⚠ não confirmado"). */
export const AXIS_BEARING = 126;
/** Rotação do quadro do circo (local +X → rumo 126°, local +Z → rumo 216°). */
export const ROT = facingRotY(AXIS_BEARING + 90);

/** Cota do piso da arena e do entorno — NÃO ENCONTRADA (nota 10 §2); HIPÓTESE de trabalho. */
export const Y0 = 2.0;

/** Dimensões externas segundo Dionísio 3.68.2: 3,5 estádios × 4 plethra (621 × 118 m). */
export const LENGTH = 621;
export const WIDTH = 118;
export const HALF_L = LENGTH / 2; // 310,5

/** Euripus: 10 pés de largura e de profundidade (Dion. 3.68.2). */
export const EURIPUS = 10 * PES; // 2,96 m

/** Raios do corte transversal (m). */
export const R = {
  arena: 40,
  curb: 39.4, // face interna do revestimento do fosso (lado da arena)
  euripus: 40 + EURIPUS, // 42,96
  parapet: 43.4,
  seat0: 45.0,
  praec0: 45.0 + 8 * 0.72, // 50,76
  back: 52.0,
  out: WIDTH / 2, // 59
  facade: WIDTH / 2 + 0.6, // 59,6
  colonnade: 62.8,
  portico: 63.2,
  street0: 63.6,
  street1: 70,
};

/** Fileiras (HIPÓTESE: medidas usuais de assentos de teatro; nota 10: "NÃO ENCONTRADO"). */
export const STONE_ROWS = { n: 8, h: 0.42, d: 0.72 };
export const WOOD_ROWS = { n: 10, h: 0.5, d: 0.7 };

/** Cotas relativas a Y0. */
export const H = {
  found: -3.5, // base das fundações (abaixo do fundo do fosso)
  channel: -3.2, // fundo do euripus (≈ 10 pés abaixo da arena, terreno rebaixado)
  water: -0.9, // espelho d'água
  podium: 2.2, // passeio do pódio
  praec: 2.2 + 8 * 0.42, // 5,56
  shop: 3.6, // pé-direito das lojas
  shopCeil: 3.9,
  top: 2.2 + 8 * 0.42 + 10 * 0.5, // 10,56
  parapetTop: 2.2 + 8 * 0.42 + 10 * 0.5 + 1.1, // 11,66
  colH: 4.0, // colunas do pórtico externo (HIPÓTESE)
};

/** Centro da meia-lua (extremidade ESE): o raio externo da curva é a meia largura. */
export const XC = HALF_L - R.out; // 251,5

/** Carceres (extremidade ONO, "a céu aberto" — Dion. 3.68.3). */
export const CARCERES = {
  front: -HALF_L + 8, // −302,5 (face voltada para a arena)
  back: -HALF_L, // −310,5
  halfWidth: 45,
  n: 12, // "12" — Platner via resumo de busca, ⚠ não confirmado (nota 10)
};
/** Passagem entre as carceres e o início das arquibancadas (HIPÓTESE de acesso). */
export const STANDS_X0 = CARCERES.front + 6; // −296,5

/** Lados retos: unidades de 7 lojas (5 m) + 1 vomitório (4 m) — HIPÓTESE de ritmo. */
export const UNIT = { shops: 7, shopW: 5, vomW: 4, count: 14 };
export const UNIT_LEN = UNIT.shops * UNIT.shopW + UNIT.vomW; // 39
export const RUN_X0 = STANDS_X0 + 1; // −295,5 (depois do muro de testa)
export const RUN_X1 = RUN_X0 + UNIT.count * UNIT_LEN; // 250,5

/** Meia-lua: 35 segmentos (o do meio fica no ápice, eixo do circo). */
export const CURVE = { n: 35, vomitoria: [5, 11, 17, 23, 29], stoneAisles: [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32], woodAisles: [2, 8, 14, 20, 26, 32] };

/** Metas (posições HIPOTÉTICAS: a forma da barreira em 46 a.C. é desconhecida). */
export const META_X = [-150, 226];

/** Converte (X, Z) do quadro do circo em {x, z} do mundo. */
export function toWorld(X, Z) {
  const c = Math.cos(ROT);
  const s = Math.sin(ROT);
  return { x: CENTER.x + X * c + Z * s, z: CENTER.z - X * s + Z * c };
}

/** Ângulo (rad) do segmento k da meia-lua: −90° (Palatino) … +90° (Aventino), medido a partir de +X. */
export function curveAngle(k, frac = 0.5) {
  return (-90 + (180 / CURVE.n) * (k + frac)) * DEG;
}

/** Rotação Y de um quadro cujo −Z local aponta para fora na direção φ (no quadro do circo). */
export function outwardRot(phi) {
  return Math.atan2(-Math.cos(phi), -Math.sin(phi));
}

/** Rumo de bússola (graus) da direção local (dx, dz) do quadro do circo. */
export function worldBearing(dX, dZ) {
  const a = toWorld(0, 0);
  const b = toWorld(dX, dZ);
  let d = (Math.atan2(b.x - a.x, -(b.z - a.z)) * 180) / Math.PI;
  if (d < 0) d += 360;
  return d;
}

export { PES, DEG };
