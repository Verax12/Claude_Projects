/**
 * forum-praca — leito da Via Sacra entre a praça do Fórum e o alto da Vélia.
 *
 * Base (nota 03 §11): rua EXISTENTE, do alto da Vélia (summa Sacra Via) ao Fórum, passando pelo
 * Arco de Fábio, pela Régia e pela Domus Publica. Traçado exato, largura e pavimento republicanos:
 * NÃO ENCONTRADOS. Hipótese de modelagem da própria nota: lajes poligonais de basalto (silex), por
 * analogia com o Clivus Capitolinus (Lívio 41.27.7), 5–7 m de largura, subindo suavemente do Arco
 * de Fábio para a Vélia (Cic. De Or. 2.267; Smith 1890).
 *
 * Aqui: leito de 6,5 m com abaulamento para escoamento, meios-fios de travertino e calçadas
 * elevadas de lajes de tufo (detalhes genéricos, também hipotéticos). O leito acompanha o relevo
 * (terreno natural a leste da praça; o pad do vale termina em u = 125).
 */
import * as G from '../../render/geom.js';
import { VIA, STREET_LIFT, WALK_LIFT, PAVE_Y, heightUV, hash2, upQuad, sideQuad } from './common.js';

/** Abaulamento do leito (m) em função de v. */
function crown(v) {
  const t = v / VIA.street;
  return 0.06 * (1 - t * t);
}

/**
 * Constrói o leito, meios-fios e calçadas no builder do pavimento (quadro do Fórum).
 * @returns {{ us: number[], streetY: (u:number, v:number) => number, walkY: (u:number, s:number) => number }}
 */
export function buildViaSacraStreet(ctx, b) {
  const terrain = ctx.terrain;
  const us = [];
  for (let u = VIA.u0; u < VIA.u1 - 0.01; u += 2) us.push(u);
  us.push(VIA.u1);
  const hT = (u, v) => heightUV(terrain, u, v);
  const streetY = (u, v) => hT(u, v) + STREET_LIFT + crown(v);
  const walkY = (u, s) => hT(u, s * (VIA.curb + VIA.walk) * 0.5) + WALK_LIFT;

  // comprimento acumulado ao longo do eixo (para a textura do basalto não "reiniciar")
  const acc = [0];
  for (let i = 1; i < us.length; i++) acc.push(acc[i - 1] + Math.hypot(us[i] - us[i - 1], hT(us[i], 0) - hT(us[i - 1], 0)));

  // ---------------- leito de basalto (abaulado) ----------------
  const vs = [-VIA.street, -1.6, 0, 1.6, VIA.street];
  for (let i = 0; i < us.length - 1; i++) {
    const ua = us[i];
    const ub = us[i + 1];
    for (let k = 0; k < vs.length - 1; k++) {
      const va = vs[k];
      const vb = vs[k + 1];
      const t = 0.88 + hash2(i, k, 31) * 0.16;
      const g = upQuad([ua, streetY(ua, va), -va], [ub, streetY(ub, va), -va], [ub, streetY(ub, vb), -vb], [ua, streetY(ua, vb), -vb], { u0: acc[i], v0: va + 20 });
      b.add(g, { mat: 'basalt', color: [t, t, t * 0.97], collide: true });
    }
  }

  // ---------------- meios-fios e calçadas (dos dois lados) ----------------
  for (const s of [-1, 1]) {
    const vIn = s * VIA.street;
    const vCurb = s * VIA.curb;
    const vOut = s * VIA.walk;
    for (let i = 0; i < us.length - 1; i++) {
      const ua = us[i];
      const ub = us[i + 1];
      const ya = walkY(ua, s);
      const yb = walkY(ub, s);
      const sa = streetY(ua, vIn);
      const sb = streetY(ub, vIn);
      const tc = 0.86 + hash2(i, s + 5, 41) * 0.18;
      // topo do meio-fio (blocos de travertino de ~2 m)
      b.add(upQuad([ua + 0.02, ya + 0.01, -vIn], [ub - 0.02, yb + 0.01, -vIn], [ub - 0.02, yb + 0.01, -vCurb], [ua + 0.02, ya + 0.01, -vCurb]), { mat: 'travertine', color: [tc, tc * 0.98, tc * 0.94] });
      // face do meio-fio voltada para a rua
      b.add(sideQuad([ua + 0.02, sa - 0.03, -vIn], [ub - 0.02, sb - 0.03, -vIn], [ub - 0.02, yb + 0.01, -vIn], [ua + 0.02, ya + 0.01, -vIn], [0, s]), { mat: 'travertine', color: [tc * 0.92, tc * 0.9, tc * 0.86] });
      // calçada de lajes de tufo
      const tw = 0.9 + hash2(i, s + 9, 43) * 0.12;
      b.add(upQuad([ua, ya, -vCurb], [ub, yb, -vCurb], [ub, yb, -vOut], [ua, ya, -vOut], { u0: ua, v0: Math.abs(vCurb) }), { mat: 'slabsTufa', color: [tw, tw * 0.98, tw * 0.95], collide: true });
      // face externa da calçada (visível onde não há loja)
      b.add(sideQuad([ua, hT(ua, vOut) - 0.25, -vOut], [ub, hT(ub, vOut) - 0.25, -vOut], [ub, yb, -vOut], [ua, ya, -vOut], [0, -s]), { mat: 'slabsTufa', color: [0.8, 0.78, 0.74] });
      // rampa de colisão invisível no meio-fio (o jogador sobe sem tropeçar)
      b.collider(G.quad([ua, sa, -vIn], [ub, sb, -vIn], [ub, yb, -(vIn + s * 0.55)], [ua, ya, -(vIn + s * 0.55)]));
    }
    // cabeceiras das calçadas (início junto à praça e fim no alto da Vélia)
    for (const [u, dir] of [[VIA.u0, -1], [VIA.u1, 1]]) {
      const y = walkY(u, s);
      b.add(sideQuad([u, hT(u, vIn) - 0.1, -vIn], [u, hT(u, vOut) - 0.1, -vOut], [u, y, -vOut], [u, y, -vIn], [dir, 0]), { mat: 'travertine', color: [0.85, 0.83, 0.8] });
    }
    // rampa de colisão na cabeceira junto à praça
    const y0 = walkY(VIA.u0, s);
    b.collider(G.quad([VIA.u0 - 0.6, PAVE_Y, -vIn], [VIA.u0 - 0.6, PAVE_Y, -vOut], [VIA.u0 + 0.1, y0, -vOut], [VIA.u0 + 0.1, y0, -vIn]));
  }

  return { us, streetY, walkY, hT };
}
