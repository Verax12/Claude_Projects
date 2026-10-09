/**
 * Topografia simplificada de Roma central (colinas, vales e Tibre).
 *
 * Sistema local do jogo: x = leste, z = sul (m); y = 0 no nível do pavimento do Fórum
 * na República tardia. As alturas abaixo são RELATIVAS a esse nível.
 *
 * MÉTODO E LIMITAÇÕES (ver docs/FONTES.md):
 *   - Os contornos das colinas são polígonos simplificados traçados a partir das
 *     âncoras de src/data/places.js (Pleiades/OSM): p.ex. Templo de Saturno e Tabularium
 *     no sopé leste do Capitólio, Juno Moneta na Arx, Rocha Tarpeia na encosta sul,
 *     Casa dei Grifi / Casa de Lívia no Palatino etc. São aproximações, não levantamentos.
 *   - As alturas dos cumes vêm de docs/pesquisa/10-circo-topografia.md (valores e
 *     fontes lá registrados). Onde a pesquisa não encontrou valor, o campo `note` diz isso.
 *   - O relevo moderno difere do antigo (aterros, cortes imperiais e medievais).
 */

/** Limites do terreno modelado (m). */
export const TERRAIN_BOUNDS = { minX: -1280, maxX: 1280, minZ: -1280, maxZ: 1280 };

/** Resolução da grade de alturas (m). */
export const TERRAIN_CELL = 4;

/**
 * Colinas: polígono do planalto (contorno superior aproximado), altura do planalto,
 * largura da encosta (m) e picos adicionais opcionais.
 * Os valores de `h` são provisórios até a conclusão da pesquisa topográfica e serão
 * revistos com base em docs/pesquisa/10-circo-topografia.md.
 */
export const HILLS = [
  {
    id: 'capitolio',
    name: 'Capitolinus Mons',
    h: 30,
    slope: 22,
    poly: [[-335, 125], [-232, 142], [-172, 66], [-128, -18], [-112, -118], [-132, -205], [-200, -236], [-262, -172], [-300, -62], [-345, 40]],
    peaks: [
      { x: -276, z: 31, r: 70, h: 4 }, // Capitolium (cume sul) — Templo de Júpiter
      { x: -160, z: -165, r: 55, h: 6 }, // Arx (cume norte) — Juno Moneta
    ],
    valleys: [{ x: -205, z: -70, r: 55, h: -6 }], // Asylum (sela entre os cumes)
  },
  {
    id: 'palatino',
    name: 'Palatinus Mons',
    h: 28,
    slope: 34,
    poly: [[-35, 300], [35, 240], [150, 218], [242, 252], [300, 330], [300, 452], [232, 545], [100, 565], [0, 505], [-42, 402]],
    peaks: [],
    valleys: [],
  },
  {
    id: 'velia',
    name: 'Velia',
    h: 14,
    slope: 45,
    poly: [[255, 175], [330, 120], [470, 110], [560, 140], [520, 230], [400, 255], [300, 245]],
    peaks: [],
    valleys: [],
  },
  {
    id: 'oppio',
    name: 'Oppius Mons',
    h: 34,
    slope: 50,
    poly: [[560, -60], [625, -220], [800, -300], [1100, -250], [1270, -100], [1270, 150], [1000, 250], [750, 205], [600, 120]],
    peaks: [],
    valleys: [],
  },
  {
    id: 'cispio',
    name: 'Cispius Mons',
    h: 38,
    slope: 50,
    poly: [[650, -385], [750, -525], [950, -605], [1160, -565], [1210, -420], [1000, -360], [800, -340]],
    peaks: [],
    valleys: [],
  },
  {
    id: 'viminal',
    name: 'Viminalis Collis',
    h: 40,
    slope: 55,
    poly: [[450, -655], [560, -765], [800, -905], [1100, -1005], [1160, -905], [900, -765], [650, -645]],
    peaks: [],
    valleys: [],
  },
  {
    id: 'quirinal',
    name: 'Quirinalis Collis',
    h: 42,
    slope: 55,
    poly: [[-455, -700], [-300, -650], [-60, -600], [150, -700], [400, -905], [300, -1055], [0, -1005], [-300, -905], [-505, -820]],
    peaks: [],
    valleys: [],
  },
  {
    id: 'aventino',
    name: 'Aventinus Mons',
    h: 30,
    slope: 40,
    poly: [[-505, 855], [-250, 790], [0, 830], [150, 905], [185, 1105], [0, 1255], [-300, 1255], [-505, 1105]],
    peaks: [],
    valleys: [],
  },
  {
    id: 'celio',
    name: 'Caelius Mons',
    h: 30,
    slope: 45,
    poly: [[505, 505], [700, 455], [1100, 505], [1300, 705], [1205, 905], [900, 955], [650, 855], [525, 705]],
    peaks: [],
    valleys: [],
  },
];

/**
 * Nível de base dos vales (m relativos ao Fórum), interpolado por distância inversa
 * entre pontos de controle. Provisório — será revisto com a pesquisa.
 */
export const BASE_POINTS = [
  { x: 0, z: 0, h: 0 }, // Fórum
  { x: 300, z: -300, h: 6 }, // Subura média
  { x: 550, z: -480, h: 12 }, // Subura alta (subida para o Esquilino)
  { x: 60, z: 720, h: -2 }, // vale do Circo Máximo
  { x: -300, z: 400, h: -3 }, // Velabro / Forum Boarium
  { x: -500, z: -350, h: -2 }, // Campo de Marte (sul)
  { x: 400, z: 450, h: 2 }, // vale do Coliseu (futuro) entre Velia, Célio e Ópio
  { x: 1000, z: 1100, h: 4 },
  { x: -900, z: -900, h: -2 },
];

/**
 * Tibre: linha central (m) e largura aproximada. Pontos ancorados em pontes e na Ilha
 * Tiberina (Pleiades): Ponte Sisto (-1181, 18), Pons Fabricius (-560, 158),
 * Ilha Tiberina (-650, 197), Pons Cestius (-638, 273), Pons Aemilius (-466, 352),
 * Emporium (-856, 1130). Trechos entre âncoras são interpolados.
 */
export const TIBER = {
  width: 95,
  waterLevel: -7,
  bed: -10,
  path: [[-1650, -1150], [-1420, -520], [-1260, -160], [-1181, 18], [-900, 110], [-650, 197], [-520, 300], [-466, 352], [-520, 640], [-700, 950], [-856, 1130], [-1000, 1320]],
};
