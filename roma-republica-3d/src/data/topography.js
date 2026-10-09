/**
 * Topografia de Roma central.
 *
 * Sistema local do jogo: x = leste, z = sul (m); y = 0 no nível do pavimento do Fórum
 * na República tardia (≈ 13 m s.n.m., docs/pesquisa/10 §2).
 *
 * RELEVO DE BASE — arquivo binário terrain-base.bin (Int16, centímetros, 325 × 325, passo 8 m,
 * de −1296 a +1296 m nos dois eixos), gerado por scripts/build-terrain.py:
 *   1. modelo digital de elevação Tilezen/Mapzen "Terrarium" (SRTM ~30 m / EU-DEM; domínio
 *      público / Copernicus), reamostrado e suavizado (gaussiana de 24 m) — forma MODERNA das colinas;
 *   2. correção para o nível ANTIGO: subtrai-se um aterro estimado (9 m nos vales → 3 m nos cumes,
 *      HIPÓTESE baseada na nota 10, que mostra o DEM 6–10 m acima do solo antigo no Fórum),
 *      ajustado por interpolação para reproduzir as cotas documentadas: Fórum 13 m, Comício 12,6 m,
 *      Capitolium 44,5 m, Arx 45,5 m e sela capitolina 36,5 m s.n.m. (Platner via notas 01/10).
 *   Limitações: o relevo antigo real é desconhecido na maior parte da área (NÃO ENCONTRADO);
 *   prédios modernos ainda deixam pequenas ondulações; os sítios nivelam suas áreas com pads.
 */

/** Limites do terreno modelado (m). */
export const TERRAIN_BOUNDS = { minX: -1280, maxX: 1280, minZ: -1280, maxZ: 1280 };

/** Resolução da grade de alturas do jogo (m). */
export const TERRAIN_CELL = 4;

/** Metadados do arquivo de relevo de base. */
export const BASE_GRID = { half: 1296, step: 8, n: 325 };

/**
 * Colinas (apenas referência de nomes/posições para áreas e textos — o relevo vem do DEM).
 * Posições: âncoras do Pleiades (docs/pesquisa/10 §2).
 */
export const HILL_NAMES = [
  { id: 'capitolio', name: 'Monte Capitolino', latin: 'Mons Capitolinus', x: -200, z: -60, r: 160 },
  { id: 'palatino', name: 'Monte Palatino', latin: 'Mons Palatinus', x: 150, z: 390, r: 190 },
  { id: 'velia', name: 'Vélia', latin: 'Velia', x: 330, z: 190, r: 90 },
  { id: 'oppio', name: 'Ópio (Esquilino)', latin: 'Oppius', x: 800, z: -60, r: 250 },
  { id: 'cispio', name: 'Císpio (Esquilino)', latin: 'Cispius', x: 900, z: -480, r: 200 },
  { id: 'viminal', name: 'Viminal', latin: 'Collis Viminalis', x: 720, z: -760, r: 180 },
  { id: 'quirinal', name: 'Quirinal', latin: 'Collis Quirinalis', x: 100, z: -800, r: 260 },
  { id: 'aventino', name: 'Aventino', latin: 'Mons Aventinus', x: -300, z: 950, r: 230 },
  { id: 'celio', name: 'Célio', latin: 'Mons Caelius', x: 750, z: 650, r: 230 },
];

/**
 * Tibre: linha central (m), largura aproximada e nível da água.
 * Pontos ancorados em pontes e na Ilha Tiberina (Pleiades): Ponte Sisto (−1181, 18),
 * Pons Fabricius (−560, 158), Ilha Tiberina (−650, 197), Pons Cestius (−638, 273),
 * Pons Aemilius (−466, 352), Emporium (−856, 1130); trechos intermediários interpolados.
 * Nível da água: ≈ 6,5 m s.n.m. (cumes do Capitólio a 38–39 m "acima do Tibre", nota 01,
 * com o cume a ~44,5 m) → y ≈ −6,5 (derivado; hipótese).
 */
export const TIBER = {
  width: 95,
  waterLevel: -6.5,
  bed: -10,
  /**
   * Ilha Tiberina (docs/pesquisa/10 §6, derivado do contorno OSM moderno): centroide (−659, 213),
   * eixo longo a 113°/293°, área ≈ 27 800 m². Modelada como elipse de mesma área e proporção
   * aproximada (≈ 360 × 95 m) — o contorno moderno é muralhado; a forma antiga não foi encontrada.
   */
  island: { x: -659, z: 213, angle: 0.4, length: 360, width: 95, height: -3 },
  path: [[-1650, -1150], [-1420, -520], [-1260, -160], [-1181, 18], [-900, 110], [-650, 197], [-520, 300], [-466, 352], [-520, 640], [-700, 950], [-856, 1130], [-1000, 1320]],
};
