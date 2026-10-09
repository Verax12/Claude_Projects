/**
 * Sítio: Colina Capitolina (Mons Capitolinus) no início de 44 a.C.
 *
 * Conteúdo (docs/LAYOUT.md, seção "capitolio"; pesquisa: docs/pesquisa/05, 01, 10, 11):
 *   - Templo de Júpiter Ótimo Máximo na fase de Cátulo (telhas de bronze douradas) e a Area
 *     Capitolina com os monumentos atestados (carro e estátua de César, reis e Bruto, colossos,
 *     Júpiter sobre coluna, troféus de Mário, gansos sagrados);
 *   - templos menores (Fides, Mens e Vênus Ericina, Júpiter Ferétrio arruinado), Casa Romuli;
 *   - Rocha Tarpeia (paredão) e Centum Gradus; substruções e muros;
 *   - trecho superior do Clivus Capitolinus com pórtico à direita de quem sobe e Arco de Cipião;
 *   - sela do Asylum entre os dois bosques; Arx com Juno Moneta, a casa da moeda (officina
 *     Monetae), o auguraculum e a Concórdia da Arx; escadaria de Moneta;
 *   - Vicus Iugarius no sopé sul.
 *
 * Organização: módulos auxiliares em src/sites/capitolio/ (common, terrain, jupiter, area,
 * clivus, arx, slopes, life). Tudo o que não tem fonte está marcado como hipótese nos painéis.
 */
import { shapeTerrain } from './capitolio/terrain.js';
import { buildJupiter, gildRoof } from './capitolio/jupiter.js';
import { buildPlatform, buildMonuments } from './capitolio/area.js';
import { buildClivus } from './capitolio/clivus.js';
import { buildArx } from './capitolio/arx.js';
import { buildSlopes } from './capitolio/slopes.js';
import { addLife } from './capitolio/life.js';
import { customMaterial, swapMaterial } from './capitolio/common.js';

export default {
  id: 'capitolio',
  name: 'Colina Capitolina',

  /** Ajustes de terreno (pads) e reservas de área — chamado antes de gerar o terreno. */
  shapeTerrain(ctx) {
    shapeTerrain(ctx);
  },

  /** Construção dos edifícios, NPCs, sons, locais de teleporte e pontos de informação. */
  build(ctx) {
    const q = ctx.quality;
    // builders (≤ 12 materiais cada; detalhes pequenos com distância máxima)
    const area = ctx.builder('capitolio-area');
    const mon = ctx.builder('capitolio-monumentos');
    const det = ctx.builder('capitolio-detalhes', { maxDistance: 110 });
    const rock = ctx.builder('capitolio-rocha');
    const thatch = ctx.builder('capitolio-palha');
    const jExt = ctx.builder('capitolio-jupiter');
    const jRoof = ctx.builder('capitolio-jupiter-telhado');
    const jInt = ctx.builder('capitolio-jupiter-interior', { interior: true });
    const clivus = ctx.builder('capitolio-clivo');
    const arx = ctx.builder('capitolio-arx');
    const arxInt = ctx.builder('capitolio-moneta-oficina', { interior: true });
    const slopes = ctx.builder('capitolio-encostas');

    const P = buildPlatform(ctx, area, rock);
    buildJupiter(ctx, { ext: jExt, roof: jRoof, int: jInt, rock });
    const M = buildMonuments(ctx, mon, det, thatch, rock);
    const C = buildClivus(ctx, clivus, det, rock);
    const A = buildArx(ctx, arx, arxInt, det, rock);
    const S = buildSlopes(ctx, slopes, det, rock);

    for (const b of [area, mon, det, clivus, arx, arxInt, slopes, jExt, jInt]) b.finish();
    rock.finish();
    swapMaterial(rock.group, 'dirt', customMaterial('rocha', q));
    thatch.finish();
    swapMaterial(thatch.group, 'cloth', customMaterial('palha', q));
    jRoof.finish();
    gildRoof(jRoof.group, q);

    addLife(ctx, { P, M, C, A, S });
    // DEPURAÇÃO TEMPORÁRIA: procura NaN nas malhas
    for (const b of [area, mon, det, clivus, arx, arxInt, slopes, jExt, jInt, rock, thatch, jRoof]) {
      for (const m of b.group.children) {
        const a = m.geometry.attributes.position.array;
        for (let i = 0; i < a.length; i++) if (!Number.isFinite(a[i])) { console.error('NaN em', m.name, i); break; }
      }
    }
  },
};
