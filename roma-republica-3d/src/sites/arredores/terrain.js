/**
 * Relevo do sítio "arredores": nivelamentos (pads) e cotas de referência.
 *
 * As cotas ANTIGAS do Forum Boarium, do Velabro, do Forum Holitorium, do Campo de Marte e do
 * Tibre NÃO FORAM ENCONTRADAS (docs/pesquisa/10 §2, "Lacunas" 3). A nota 10 propõe rebaixar os
 * vales planos para y ≈ 0…+5; o motor fixa o nível da água do Tibre em y = −6,5 (hipótese em
 * data/topography.js). Adotamos, como RECONSTRUÇÃO HIPOTÉTICA (declarada nos painéis):
 *   - cais e Forum Boarium a y ≈ −3,2 (≈ 3 m acima da água: área baixa e sujeita a cheias,
 *     coerente com as enchentes de Lív. 35.9.2, 35.21.5, 38.28.4);
 *   - Forum Holitorium a y = +2,5; área sacra de S. Omobono a +4; Porta Carmental a +3,8;
 *   - Campo de Marte central a y = +7 (o DEM moderno sobe até ~15 sobre as ruínas do teatro; a
 *     planície antiga era baixa e inundável — Lív. 38.28.4: o Tibre inundou o Campo 12 vezes em 189 a.C.).
 * Os pads de margem também corrigem "poças secas" (terreno abaixo do nível da água fora da malha
 * do rio) herdadas do DEM moderno ao longo da margem leste.
 */
import { bankLine, bankStrip } from './util.js';

/** Cotas de referência (y, m) usadas pelos módulos do sítio. */
export const Y = {
  boarium: -3.2,
  bank: -3.6,
  holitorium: 2.5,
  omobono: 4.0,
  carmentalis: 3.8,
  campus: 7.0,
  water: -6.5,
};

/** Distância (m) do eixo suavizado do Tibre até a face dos cais (linha do muro de margem). */
export const QUAY_D = 61;

/** Lista de pads (na ordem de aplicação). Função pura — também usada nos testes. */
export function padSpecs() {
  const clipW = (x, z) => [Math.max(x, -628), z];
  const fbBank = bankLine(QUAY_D, -1, 318, 492);
  return [
    // Campo de Marte central (polígono 2 menos uma margem de transição de 12 m)
    { points: [[-1088, -438], [-652, -438], [-652, -162], [-1088, -162]], height: Y.campus, blend: 12 },
    // margem esquerda (leste) do Tibre ao longo do canal da Ilha (só eleva; não estreita o canal)
    { points: bankStrip(66, 125, -1, 112, 292), height: Y.bank, blend: 3, mode: 'max' },
    // margem esquerda a jusante da Ilha até o fim da área (só eleva)
    { points: bankStrip(QUAY_D, 125, -1, 284, 556), height: Y.bank, blend: 3, mode: 'max' },
    // margem direita (oeste) a jusante da Ilha, dentro da área (só eleva)
    { points: bankStrip(QUAY_D, 150, 1, 286, 418, clipW), height: Y.bank, blend: 3, mode: 'max' },
    { points: bankStrip(67, 150, 1, 226, 292, clipW), height: Y.bank, blend: 3, mode: 'max' },
    // Forum Boarium e porto fluvial
    { points: [...fbBank, [-298, 492], [-298, 318]], height: Y.boarium, blend: 6 },
    // Forum Holitorium
    { rect: { x: -405, z: 138, w: 92, d: 84 }, height: Y.holitorium, blend: 10 },
    // área sacra de S. Omobono (Fortuna e Mater Matuta), eixo longo a 130°
    { rect: { x: -298, z: 226, w: 64, d: 46, rotY: -40 * (Math.PI / 180) }, height: Y.omobono, blend: 6 },
    // Porta Carmental
    { circle: { x: -345, z: 182, r: 15 }, height: Y.carmentalis, blend: 8 },
    // cabeceiras da Ponte Fabrícia (margem e ilha)
    { circle: { x: -553, z: 150, r: 9 }, height: -3.4, blend: 6 },
    { circle: { x: -594, z: 201, r: 8 }, height: -3.2, blend: 6 },
  ];
}
