/**
 * Sítio: Fórum de César (Forum Iulium) e Templo de Vênus Genetrix — estado no início de 44 a.C.
 *
 * Fontes: docs/pesquisa/04-forum-iulium.md (principal), 02-forum-norte.md (Cúria, Argileto),
 * 11-materiais-pessoas.md (materiais, pessoas). Plano: docs/LAYOUT.md (seção forum-iulium).
 *
 * Organização (módulos em src/sites/forum-iulium/):
 *   frame.js     quadro local (origem no ponto Pleiades do templo, +Z = eixo para SSE), cotas, planta
 *   helpers.js   utilidades geométricas (paredes ao longo de Z, rampas, coluna simplificada…)
 *   precinct.js  praça, pórticos, tabernae, muros/arrimo, aterros, tapumes
 *   temple.js    templo (exterior) e cella (interior com oferendas)
 *   statues.js   estátua equestre, César couraçado, fonte Appias, altar, cadeira de ouro
 *   worksite.js  canteiro da extremidade SSE (tapumes, grua, andaimes, blocos)
 *   details.js   mobiliário das tabernae e dos pórticos
 *   life.js      NPCs, som, áreas, painéis de informação e teleportes
 *
 * Tudo o que não tem dado na nota 04 é reconstrução hipotética declarada nos painéis.
 */
import { SITE_AREAS } from '../data/layout.js';
import { Y, P, ROT, W, Wpoly } from './forum-iulium/frame.js';
import { buildPrecinct, bermHeight } from './forum-iulium/precinct.js';
import { buildTemple, buildCella } from './forum-iulium/temple.js';
import { buildStatues } from './forum-iulium/statues.js';
import { buildWorksite } from './forum-iulium/worksite.js';
import { buildDetails, tabernaPlan } from './forum-iulium/details.js';
import { buildLife } from './forum-iulium/life.js';

export default {
  id: 'forum-iulium',
  name: 'Fórum de César e Templo de Vênus Genetrix',

  /** Nivelamento do recinto e reservas de área. */
  shapeTerrain(ctx) {
    // Pad único do recinto, SEM transição (blend 0): o terreno fica exato até ~3 m além do
    // polígono, ou seja, até o limite da área do sítio (x local ±40; z local −25…104).
    // O polígono vai até a face externa dos muros de arrimo (OSO e NNO), de modo que nenhum
    // triângulo do terreno (grade de 4 m) com vértice natural (mais alto) invada o recinto.
    const x0 = -P.wswOuter;
    const x1 = 37;
    const z0 = P.backZ2;
    const z1 = P.endZ - 3;
    const c = W((x0 + x1) / 2, (z0 + z1) / 2);
    ctx.terrain.addPad({ rect: { x: c.x, z: c.z, w: x1 - x0, d: z1 - z0, rotY: ROT }, height: Y.pad, blend: 0 });
    // reservas: área do sítio + aterros que cobrem a transição do terreno fora dos muros de arrimo
    for (const poly of SITE_AREAS['forum-iulium']) ctx.reserve({ points: poly });
    ctx.reserve({ points: Wpoly([[-(P.wswOuter + 9), P.backZ2 - 9], [-P.wswOuter, P.backZ2 - 9], [-P.wswOuter, P.endZ], [-(P.wswOuter + 9), P.endZ]]) });
    ctx.reserve({ points: Wpoly([[-(P.wswOuter + 9), P.backZ2 - 9], [40, P.backZ2 - 9], [40, P.backZ2], [-(P.wswOuter + 9), P.backZ2]]) });
  },

  /** Construção. Cada parte é isolada para que um erro não derrube o sítio inteiro. */
  build(ctx) {
    const run = (name, fn) => {
      try {
        return fn();
      } catch (e) {
        console.error(`[forum-iulium] ${name} falhou`, e);
        return null;
      }
    };
    const berm = run('recinto', () => buildPrecinct(ctx));
    run('templo', () => buildTemple(ctx));
    run('cella', () => buildCella(ctx));
    run('monumentos', () => buildStatues(ctx));
    run('canteiro', () => buildWorksite(ctx));
    const plan = tabernaPlan(ctx);
    run('detalhes', () => buildDetails(ctx, plan));
    run('vida', () => buildLife(ctx, plan));
    if (berm) run('vegetação', () => buildVegetation(ctx, berm));
  },
};

/** Arbustos e algumas árvores sobre os aterros, na encosta do Capitólio (fora do recinto). */
function buildVegetation(ctx, berm) {
  const rng = ctx.rng(4411);
  const kinds = ['shrub', 'shrub', 'grass', 'grass', 'laurel'];
  const put = (type, lx, lz, scale) => {
    const h = bermHeight(berm, lx, lz);
    if (h == null || h < Y.pad + 2) return;
    const p = W(lx, lz);
    ctx.vegetation.add(type, p.x, p.z, { scale, y: h });
  };
  for (let z = P.backZ2; z < 60; z += 3.2) put(kinds[Math.floor(rng() * kinds.length)], -(P.wswOuter + 1.5 + rng() * 6.5), z + rng() * 2, 0.8 + rng() * 0.6);
  for (let x = -40; x < 30; x += 3.5) put(kinds[Math.floor(rng() * kinds.length)], x + rng() * 2, P.backZ2 - 1.5 - rng() * 6, 0.8 + rng() * 0.6);
  for (const [lx, lz, t] of [[-42, -10, 'fig'], [-43, 14, 'olive'], [-41.5, 34, 'cypress'], [-20, -27, 'olive'], [8, -27.5, 'fig']]) put(t, lx, lz, 0.9);
}
