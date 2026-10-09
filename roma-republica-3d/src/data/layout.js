/**
 * Plano de implantação (fonte única de verdade para as ÁREAS de cada sítio).
 * Gerado a partir de docs/LAYOUT.md — NÃO edite nos sítios; peça mudanças ao coordenador.
 *
 * Coordenadas do mundo: x = leste, z = sul (m).
 *
 * FORUM_FRAME: referencial alinhado ao eixo da praça do Fórum (rumo 119°/299°).
 *   u = ao longo do eixo (para ESE), v = perpendicular (para NNE).
 *   mundo = origin + u·U + v·V.  Retângulos alinhados ao Fórum usam rotY = rectRotY
 *   em Terrain.addPad({ rect: { x, z, w (ao longo de u), d (ao longo de v), rotY } }).
 */
export const FORUM_FRAME = {"origin": [25, 20], "u": [0.875, 0.485], "v": [0.485, -0.875], "rectRotY": -0.5061, "facingNE": 2.6354, "facingSW": -0.5061};

/** Converte (u, v) do referencial do Fórum para {x, z} do mundo. */
export function forumUV(u, v) {
  const F = FORUM_FRAME;
  return { x: F.origin[0] + u * F.u[0] + v * F.v[0], z: F.origin[1] + u * F.u[1] + v * F.v[1] };
}

/**
 * Áreas de cada sítio: lista de polígonos [[x, z], ...]. Cada sítio constrói DENTRO das suas áreas
 * (exceto ruas/caminhos compartilhados descritos no LAYOUT.md). O sítio 'cidade' não constrói em
 * nenhuma delas.
 */
export const SITE_AREAS = {
  'forum-praca': [[[-6.1, 34.8], [85.8, 85.7], [117.8, 28.0], [25.9, -22.9]], [[95.0, 69.1], [309.4, 187.9], [318.1, 172.2], [103.7, 53.4]]],
  'forum-oeste': [[[-145.1, -3.3], [-66.3, 40.3], [-36.2, -13.9], [-115.0, -57.6]], [[-49.8, 10.6], [-6.1, 34.8], [7.5, 10.3], [-36.2, -13.9]], [[-115.0, -57.6], [-40.6, -16.4], [-10.6, -70.6], [-84.9, -111.8]]],
  'forum-norte': [[[-40.6, -16.4], [7.5, 10.3], [36.6, -42.2], [-11.5, -68.9]], [[-10.7, -70.6], [63.5, -100.5], [186.3, 17.9], [165.9, 54.6], [25.9, -22.9], [36.6, -42.2]]],
  'forum-sudeste': [[[-92.0, 86.7], [43.6, 161.8], [85.8, 85.7], [-49.8, 10.6]], [[55.7, 140.0], [138.8, 186.1], [178.1, 115.2], [95.0, 69.1]], [[103.7, 53.4], [147.5, 77.6], [158.6, 57.5], [114.9, 33.2]]],
  'forum-iulium': [[[-59.4, -191.1], [-10.7, -70.6], [63.5, -100.5], [14.8, -221.1]]],
  'capitolio': [[[-380, -300], [-150, -300], [-75, -150], [-84.9, -111.8], [-115.0, -57.6], [-145.1, -3.3], [-150, 40], [-170, 170], [-300, 170], [-380, 60]]],
  'palatino': [[[-80, 250], [40, 185], [140, 200], [170, 222], [240, 222], [250, 175], [300, 185], [330, 300], [320, 560], [150, 640], [-60, 540], [-110, 420]]],
  'domus-crasso': [[[175, 160], [235, 160], [235, 215], [175, 215]]],
  'macellum': [[[130.4, -36.0], [191.6, -2.0], [220.7, -54.5], [159.5, -88.5]]],
  'subura': [[[63.5, -100.5], [130.4, -36.0], [159.5, -88.5], [180, -95], [330, -110], [520, -210], [700, -360], [780, -560], [620, -640], [430, -500], [260, -360], [120, -300], [60, -230], [70, -120]]],
  'casa-plebe': [[[320, -262], [346, -262], [346, -238], [320, -238]]],
  'foricae': [[[244, -188], [270, -188], [270, -168], [244, -168]]],
  'circo-maximo': [[[-248.1, 601.0], [277.7, 983.1], [365.9, 861.8], [-159.9, 479.7]]],
  'arredores': [[[-600, 60], [-380, 60], [-300, 170], [-260, 240], [-200, 480], [-420, 560], [-640, 420]], [[-1100, -450], [-640, -450], [-640, -150], [-1100, -150]]],
};

/** Todos os polígonos de todas as áreas (para exclusão no preenchimento urbano). */
export const ALL_AREA_POLYGONS = Object.values(SITE_AREAS).flat();
