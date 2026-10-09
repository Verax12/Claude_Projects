/**
 * Configuração global e parâmetros de URL.
 *
 * Parâmetros de URL úteis (desenvolvimento / testes automatizados):
 *   ?quality=low|medium|high     preset de qualidade gráfica
 *   ?sites=forum,subura          constrói apenas os sítios listados (ids de src/sites)
 *   ?tp=templo-saturno           teleporta para um local ao iniciar
 *   ?cam=x,y,z,yaw,pitch         posiciona a câmera (graus) ao iniciar (modo voo)
 *   ?npcs=0                      desliga NPCs
 *   ?ui=0                        esconde a interface (capturas de tela)
 *   ?time=9.5                    hora do dia (6–18) para a posição do sol
 *   ?debug=1                     mostra estatísticas de renderização
 *   ?ao=1|0                      força oclusão de ambiente (GTAO) ligada/desligada
 */

const params = new URLSearchParams(typeof location !== 'undefined' ? location.search : '');

/** Presets de qualidade. Os valores foram escolhidos para manter ~60 fps em GPUs médias. */
export const QUALITY_PRESETS = {
  low: {
    pixelRatio: 1,
    antialias: false,
    shadowMapSize: 1024,
    shadowRadius: 70,
    textureSize: 256,
    npcCount: 90,
    npcDrawDistance: 90,
    viewDistance: 1400,
    detailDistance: 120,
    ao: false,
  },
  medium: {
    pixelRatio: Math.min(typeof devicePixelRatio !== 'undefined' ? devicePixelRatio : 1, 1.5),
    antialias: true,
    shadowMapSize: 2048,
    shadowRadius: 90,
    textureSize: 512,
    npcCount: 180,
    npcDrawDistance: 130,
    viewDistance: 2200,
    detailDistance: 200,
    ao: false,
  },
  high: {
    pixelRatio: Math.min(typeof devicePixelRatio !== 'undefined' ? devicePixelRatio : 1, 2),
    antialias: true,
    shadowMapSize: 4096,
    shadowRadius: 110,
    textureSize: 1024,
    npcCount: 300,
    npcDrawDistance: 170,
    viewDistance: 3000,
    detailDistance: 300,
    ao: true,
  },
};

function readQuality() {
  const q = params.get('quality');
  if (q && QUALITY_PRESETS[q]) return q;
  try {
    const saved = localStorage.getItem('roma.quality');
    if (saved && QUALITY_PRESETS[saved]) return saved;
  } catch (e) {
    /* localStorage indisponível (modo privado) — usa o padrão */
  }
  return 'medium';
}

const qualityName = readQuality();

export const config = {
  qualityName,
  quality: QUALITY_PRESETS[qualityName],
  /** Sítios a construir (null = todos). */
  onlySites: params.get('sites') ? params.get('sites').split(',').map((s) => s.trim()) : null,
  teleportOnStart: params.get('tp'),
  camOnStart: params.get('cam') ? params.get('cam').split(',').map(Number) : null,
  npcs: params.get('npcs') !== '0',
  showUI: params.get('ui') !== '0',
  timeOfDay: params.get('time') ? Number(params.get('time')) : 9.5,
  debug: params.get('debug') === '1',
  /** Oclusão de ambiente em pós-processamento (padrão: só na qualidade alta). */
  ao: params.get('ao') != null ? params.get('ao') === '1' : null,
  /** Altura dos olhos do jogador acima do chão (m). */
  eyeHeight: 1.62,
  /** Velocidades do jogador (m/s): passo de caminhada e corrida. */
  walkSpeed: 2.3,
  runSpeed: 5.5,
};

export function saveQuality(name) {
  try {
    localStorage.setItem('roma.quality', name);
  } catch (e) {
    /* ignora */
  }
}
