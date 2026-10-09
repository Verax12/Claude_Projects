/**
 * Sítio: Fórum Romano — praça e Via Sacra (id "forum-praca").
 *
 * Momento: início de 44 a.C. (docs/LAYOUT.md §1). Responsabilidades (LAYOUT §3):
 *   - pad geral do vale do Fórum em y = 0 (u −100…125, v −85…85, blend 25 m) — em shapeTerrain;
 *   - pavimento da praça (lajes de travertino) e canal coberto (hipótese);
 *   - traçado e pavimento da Via Sacra da praça até o alto da Vélia (hipótese: basalto),
 *     com calçadas e, no trecho alto, frentes de lojas genéricas;
 *   - Lacus Curtius, Puteal Libonis + tribunal do pretor, estátua equestre de Q. Márcio Trêmulo,
 *     relógios de sol junto à (antiga) Rostra; uma liteira fechada estacionada (nota 11 §17);
 *   - caminhos de NPC densos, zonas de som, áreas, painéis e o local inicial "via-sacra".
 *
 * Fontes: docs/pesquisa/01, 02, 03 (§11–14) e 11. Módulos auxiliares em ./forum-praca/.
 * Não constrói os edifícios das bordas (são dos sítios forum-oeste, forum-norte e forum-sudeste).
 */
import { propGeometry } from '../arch/props.js';
import { FORUM_FRAME, forumUV, ROT, AREA_PIAZZA, AREA_VIA, pushForumFrame } from './forum-praca/common.js';
import { buildPiazzaPavement } from './forum-praca/pavement.js';
import { buildViaSacraStreet } from './forum-praca/viaSacra.js';
import { planShopRows, buildShops } from './forum-praca/shops.js';
import { buildLacusCurtius, buildPuteal, buildTremulus, buildSundials, buildLectica } from './forum-praca/monuments.js';
import { addLife } from './forum-praca/life.js';

export default {
  id: 'forum-praca',
  name: 'Fórum Romano — praça e Via Sacra',

  /** Pad geral do vale do Fórum (y = 0) e reservas das áreas do sítio. */
  shapeTerrain(ctx) {
    // retângulo alinhado ao Fórum: u −100…125 (w = 225), v −85…85 (d = 170)
    const c = forumUV((-100 + 125) / 2, 0);
    ctx.terrain.addPad({ rect: { x: c.x, z: c.z, w: 225, d: 170, rotY: FORUM_FRAME.rectRotY }, height: 0, blend: 25 });
    // corredor da Via Sacra fora do pad: chão de terra batida (sem alterar o relevo)
    ctx.terrain.markUrban({ points: AREA_VIA, urban: 1 });
    ctx.reserve({ points: AREA_PIAZZA });
    ctx.reserve({ points: AREA_VIA });
  },

  build(ctx) {
    // ---------------- builders (poucos materiais em cada um) ----------------
    // pavimentos: só recebem sombra (não projetam)
    const bPave = ctx.builder('forum-praca:pavimento', { castShadow: false });
    const bMon = ctx.builder('forum-praca:monumentos');
    const bShop = ctx.builder('forum-praca:lojas');
    const bDet = ctx.builder('forum-praca:detalhes', { maxDistance: 85 });
    for (const b of [bPave, bMon, bShop, bDet]) pushForumFrame(b);

    // lotes instanciados para mercadorias repetidas (ânforas, jarros, cestos, sacos)
    const inst = {
      amphora: ctx.world.instances('forum-praca:amphora', propGeometry('amphora'), 'terracotta', { maxDistance: 80 }),
      jar: ctx.world.instances('forum-praca:jar', propGeometry('jar'), 'terracotta', { maxDistance: 60, castShadow: false }),
      basket: ctx.world.instances('forum-praca:basket', propGeometry('basket'), 'woodLight', { maxDistance: 60, castShadow: false }),
      sack: ctx.world.instances('forum-praca:sack', propGeometry('sack'), 'cloth', { maxDistance: 60 }),
    };

    // ---------------- praça ----------------
    buildPiazzaPavement(bPave);
    buildLacusCurtius(bMon, bDet);
    buildPuteal(bMon, bDet);
    buildTremulus(bMon);
    buildSundials(bMon);
    buildLectica(bDet);

    // ---------------- Via Sacra ----------------
    buildViaSacraStreet(ctx, bPave);
    const mods = planShopRows(ctx.terrain);
    const shopStatics = buildShops(ctx, bShop, bDet, inst, mods);

    for (const b of [bPave, bMon, bShop, bDet]) {
      b.pop();
      b.finish();
    }

    // ---------------- NPCs, som, áreas, painéis, teleporte ----------------
    addLife(ctx, shopStatics);
    if (ctx.config.debug) console.log(`[forum-praca] ${mods.length} módulos de lojas; rot ${ROT.toFixed(4)}`);
  },
};
