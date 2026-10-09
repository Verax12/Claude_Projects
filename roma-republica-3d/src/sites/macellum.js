/**
 * Sítio: Macellum e comércio (início de 44 a.C.).
 *
 * O mercado de víveres finos atrás (NNE) da Basílica Emília/Paulli, a leste do Argileto
 * (docs/LAYOUT.md, área `macellum`; pesquisa: docs/pesquisa/08-macellum-mercado.md, 02 §8 e §11,
 * 11 §5–9). César, ditador, mantinha guardas ao redor do macellum para fazer cumprir a sua lei
 * suntuária (Suet. Iul. 43.2) — o mercado está em plena atividade.
 *
 * Organização do código (pasta src/sites/macellum/):
 *   frame.js      implantação, quadros de referência, medidas e telhado em anel
 *   structure.js  muro de recinto, 45 tabernae, pórtico toscano, telhados, portões, tholos
 *   market.js     bancas, mercadorias (instanciadas), conteúdo das lojas, exterior
 *   goods.js      geometrias dos produtos e utensílios (peixes, carnes, statera, gaiolas, mula…)
 *   life.js       tipos de NPC do mercado, caminhos, guardas, sons, áreas, painéis, teleporte
 *
 * Planta, dimensões, setores e materiais são RECONSTRUÇÃO HIPOTÉTICA declarada nos painéis
 * (a nota 08 não encontrou nenhuma medida do macellum republicano).
 */
import { FB, ROT, Y0, LOT, M } from './macellum/frame.js';
import { quadFacing } from './macellum/frame.js';
import { buildStructure, layoutShops } from './macellum/structure.js';
import { makeBatches, buildCourtyardMarket, buildShopContents, buildExterior } from './macellum/market.js';
import { registerNPCTypes, addLife, addPlaces, STREET } from './macellum/life.js';

/** Retângulo no quadro do edifício → { rect } do mundo (para pads, reservas e áreas). */
function rectW(x0, x1, z0, z1) {
  const c = FB.toWorld((x0 + x1) / 2, (z0 + z1) / 2);
  return { rect: { x: c.x, z: c.z, w: Math.abs(x1 - x0), d: Math.abs(z1 - z0), rotY: ROT } };
}

/** Lojas fechadas (tábuas corridas) — variedade; a do centro da ala norte fica atrás dos cozinheiros. */
const CLOSED = { S: [3, 8], N: [2, 6, 10], E: [7], W: [6] };

export default {
  id: 'macellum',
  name: 'Macellum e mercado',

  /** Nivela o lote (pátio em y = Y0) e reserva o lote e a rua de acesso desde o Argileto. */
  shapeTerrain(ctx) {
    const lot = rectW(-LOT.w / 2, LOT.w / 2, -LOT.d / 2, LOT.d / 2);
    ctx.terrain.addPad({ ...lot, height: Y0, blend: 8 });
    ctx.reserve(lot);
    const street = rectW(STREET.reserveEnd, -LOT.w / 2, -STREET.half - 0.6, STREET.half + 0.6);
    ctx.reserve(street);
    ctx.terrain.markUrban({ ...street, urban: 1 });
  },

  build(ctx) {
    registerNPCTypes();
    const rng = ctx.rng(4417);
    const shops = layoutShops();
    const closed = {};
    for (const [k, v] of Object.entries(CLOSED)) closed[k] = new Set(v);

    // estrutura (≤ 11 materiais) e detalhes (somem além de 110 m)
    const b = ctx.builder('macellum');
    const bd = ctx.builder('macellum-detalhes', { maxDistance: 110 });
    b.push(FB.ox, Y0, FB.oz, ROT);
    bd.push(FB.ox, Y0, FB.oz, ROT);

    buildStructure(b, bd, shops, closed, rng);
    pavements(ctx, b);

    const B = makeBatches(ctx);
    buildCourtyardMarket(ctx, bd, B, rng);
    buildShopContents(ctx, bd, B, shops, closed, rng);
    buildExterior(ctx, bd, B, rng);

    bd.pop();
    b.pop();
    b.finish();
    bd.finish();

    addLife(ctx, shops, closed);
    addPlaces(ctx);
  },
};

/**
 * Calçadas de basalto: faixa diante da fachada sul, pequeno adro do portão oeste e a rua de
 * acesso até o Argileto, acompanhando o relevo (fora do lote o terreno não é nivelado por nós).
 * O calçamento das ruas (silex) é hipótese de coerência — largura e revestimento NÃO ENCONTRADOS.
 */
function pavements(ctx, b) {
  // adros dentro do lote (terreno nivelado em Y0)
  b.floor(2 * M.OX + 0.6, LOT.d / 2 - M.OZ - 0.25, 0, 0.05, (M.OZ + LOT.d / 2 - 0.25) / 2, { mat: 'basalt', collide: false, thickness: 0.2 });
  b.floor(LOT.w / 2 - M.OX - 0.1, 12, -(M.OX + LOT.w / 2 - 0.1) / 2, 0.05, 0, { mat: 'basalt', collide: false, thickness: 0.2 });

  // rua de acesso: faixas de 2 m que seguem o terreno (heightAt), com meio-fio de tufo
  const y = (x, z) => {
    const p = FB.toWorld(x, z);
    return ctx.terrain.heightAt(p.x, p.z) - Y0 + 0.05;
  };
  const x0 = -LOT.w / 2 + 0.1;
  const x1 = STREET.paveEnd;
  const n = Math.ceil((x0 - x1) / 2);
  const zs = [-STREET.half, 0, STREET.half];
  for (let i = 0; i < n; i++) {
    const xa = x0 - ((x0 - x1) * i) / n;
    const xb = x0 - ((x0 - x1) * (i + 1)) / n;
    for (let k = 0; k < zs.length - 1; k++) {
      const za = zs[k];
      const zb = zs[k + 1];
      quadFacing(b, [[xa, y(xa, za), za], [xb, y(xb, za), za], [xb, y(xb, zb), zb], [xa, y(xa, zb), zb]], +1, { mat: 'basalt' });
    }
    for (const s of [-1, 1]) {
      const zc = s * (STREET.half + 0.15);
      const xm = (xa + xb) / 2;
      b.box(Math.abs(xa - xb) - 0.04, 0.42, 0.3, xm, Math.min(y(xa, zc), y(xb, zc)) - 0.28, zc, { mat: 'tufa', collide: false });
    }
  }
}
