/**
 * Fórum de César — mobiliário e objetos: portas das tabernae (fechadas ou abertas), mesas de
 * escribas e arquivos (uso administrativo — HIPÓTESE coerente com Ápio 2.102: a praça "não era de
 * mercadorias"), bancos sob os pórticos e objetos do cotidiano.
 */
import { prop } from '../../arch/props.js';
import * as G from '../../render/geom.js';
import { Y, P, ORIGIN, ROT } from './frame.js';
import { mat4 } from './helpers.js';

/** Tipo de cada taberna (determinístico). Exportado para os NPCs sentados. */
export function tabernaPlan(ctx) {
  const rng = ctx.rng(4646);
  const plan = [];
  for (const s of [-1, 1]) {
    for (let i = 0; i < P.nTab; i++) {
      const r = rng();
      const kind = r < 0.42 ? 'closed' : r < 0.8 ? 'office' : 'archive';
      plan.push({ s, i, kind, z: P.backZ + P.tabW * (i + 0.5) });
    }
  }
  return plan;
}

export function buildDetails(ctx, plan) {
  const f = ctx.builder('forum-iulium:tabernae'); // elementos que devem ser vistos de longe
  const d = ctx.builder('forum-iulium:detalhes', { maxDistance: 70 });
  for (const x of [f, d]) x.push(ORIGIN.x, 0, ORIGIN.z, ROT);
  const y = Y.portico;
  const xFront = P.backX + P.backT / 2;
  const xIn = P.backX + P.backT; // face interna da frente das tabernae
  const rng = ctx.rng(4747);

  for (const t of plan) {
    const { s, z, kind } = t;
    if (kind === 'closed') {
      // fechamento de tábuas verticais (fecha a abertura de 2,7 × 3,5 m)
      f.box(0.1, 3.45, 2.7, s * (xFront - 0.18), y, z, { mat: 'wood', collide: true, color: rng() < 0.5 ? '#d9cbb4' : '#f0e6d4' });
      for (let k = 0; k < 3; k++) f.box(0.06, 0.12, 2.6, s * (xFront - 0.25), y + 0.6 + k * 1.2, z, { mat: 'woodDark', collide: false });
      f.box(0.04, 0.18, 0.18, s * (xFront - 0.28), y + 1.6, z + 0.4, { mat: 'iron', collide: false }); // ferrolho
    } else {
      // folhas de madeira dobradas para dentro, junto às ombreiras
      for (const e of [-1, 1]) f.box(0.7, 3.4, 0.08, s * (xIn + 0.38), y, z + e * 1.38, { mat: 'wood', collide: false });
      if (kind === 'office') {
        // mesa de escriba, banquinho, arca, estojos de rolos (capsae) e tabuinhas
        const tx = s * (xIn + 1.6);
        prop(d, 'table', tx, y, z, Math.PI / 2, 0.9);
        prop(d, 'stool', tx - s * 0.75, y, z + 0.1, 0, 1);
        prop(d, 'chest', s * (P.tabX - 0.45), y, z - 1.2, Math.PI / 2, 0.9);
        for (let k = 0; k < 3; k++) prop(d, 'basket', s * (P.tabX - 0.45), y, z + 0.4 + k * 0.5, 0, 0.75, { mat: 'woodDark' });
        d.box(0.25, 0.03, 0.18, tx + 0.15, y + 0.71, z - 0.2, { mat: 'woodLight', collide: false });
        d.box(0.25, 0.03, 0.18, tx - 0.1, y + 0.71, z + 0.25, { mat: 'woodLight', collide: false });
        // rolo aberto sobre a mesa
        const roll = G.cylinder(0.035, 0.035, 0.32, 6, { caps: true, bottomCap: true });
        roll.rotateX(Math.PI / 2);
        d.add(roll, { mat: 'cloth', color: '#e8dcc0', matrix: mat4(tx, y + 0.71, z + 0.05) });
        f.colliderBox(0.9, 0.8, 1.4, tx, y, z);
      } else {
        // arquivo: prateleiras de madeira com estojos de rolos
        const sx = s * (P.tabX - 0.35);
        f.box(0.6, 2.6, 3.2, sx, y, z, { mat: 'woodDark' });
        for (let r = 0; r < 3; r++) {
          for (let k = 0; k < 4; k++) {
            prop(d, 'jar', sx - s * 0.32, y + 0.15 + r * 0.8, z - 1.1 + k * 0.72, k, 0.55, { mat: 'woodLight' });
          }
        }
        prop(d, 'chest', s * (xIn + 0.8), y, z + 1.2, 0, 0.9);
      }
    }
  }

  // bancos de madeira sob os pórticos, junto ao muro, entre as portas
  for (const s of [-1, 1]) {
    for (let i = 1; i < P.nTab; i += 2) {
      const z = P.backZ + P.tabW * i;
      prop(d, 'bench', s * (P.backX - 0.4), y, z, Math.PI / 2, 1);
      f.colliderBox(0.4, 0.45, 1.8, s * (P.backX - 0.4), y, z);
    }
  }

  for (const x of [f, d]) x.pop();
  f.finish();
  d.finish();
}
