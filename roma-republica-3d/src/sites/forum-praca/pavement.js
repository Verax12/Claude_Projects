/**
 * forum-praca — pavimento da praça do Fórum.
 *
 * Base (notas 01, 02, 03 §14, 11 §3/§8):
 *  - praça pavimentada em lajes de TRAVERTINO (o pavimento "silano" do eixo central, Van Deman
 *    1922; travertino diante da Cúria atribuído a Fausto Sula). O material da metade sul/leste
 *    não foi encontrado — a nota 03 recomenda usar o mesmo travertino claro (hipótese).
 *  - y = 0 = pavimento do Fórum (convenção do projeto).
 *  - canal: Plauto (Curc. 476, c. 190 a.C.) cita um *canalis* "no meio" do Fórum; o estado em
 *    44 a.C. não foi encontrado, e a nota 03 (lacuna 13) recomenda um canal COBERTO, para não
 *    inventar um canal aberto → fiada de tampas de peperino com grelhas de ferro (hipótese).
 *
 * Variação visual (não histórica, apenas realismo): lajes em células de 4 m com tons
 * diferentes, remendos de lajes de tufo mais antigas, desgaste nas linhas de passagem.
 */
import * as G from '../../render/geom.js';
import { PIAZZA, PAVE_Y, hash2, valueNoise, distToPolyline, upQuad, sideQuad } from './common.js';

/** Linhas de maior tráfego (u, v): Via Sacra pelo lado sul, rota ao Argileto, travessias. */
export const WEAR_LINES = [
  [[85, 0], [64, -6], [46, -14], [28, -19], [10, -21], [-20, -22]],
  [[85, 0], [62, 16], [40, 27], [14, 33], [-16, 37]],
  [[36, -28], [36, -17], [46, -14]],
  [[-20, 8], [10, 4], [40, -2], [64, -6]],
];

/** Faixa do canal coberto (v entre estes limites). */
export const CANAL = { v0: 4, v1: 5 };

/**
 * Constrói o pavimento (num builder já posicionado no quadro do Fórum).
 * @param {import('../../core/Builder.js').Builder} b
 */
export function buildPiazzaPavement(b) {
  const { u0, u1, v0, v1 } = PIAZZA;
  const uEdges = [];
  for (let u = u0; u < u1 - 0.01; u += 4) uEdges.push(u);
  uEdges.push(u1);
  // linhas de lajes: múltiplos de 4 m, com a faixa do canal (4–5) separada
  const vEdges = [-28, -24, -20, -16, -12, -8, -4, 0, 4, 5, 9, 13, 17, 21, 25, 29, 33, 37, 38];
  const y = PAVE_Y;

  for (let i = 0; i < uEdges.length - 1; i++) {
    for (let j = 0; j < vEdges.length - 1; j++) {
      const ua = uEdges[i];
      const ub = uEdges[i + 1];
      const va = vEdges[j];
      const vb = vEdges[j + 1];
      if (va === CANAL.v0 && vb === CANAL.v1) continue; // faixa do canal (tampas abaixo)
      const cu = (ua + ub) / 2;
      const cv = (va + vb) / 2;
      // tom de base + variação de baixa frequência
      let t = 0.92 + hash2(i, j, 1) * 0.1 + (valueNoise(cu, cv, 26, 3) - 0.5) * 0.09;
      // desgaste (lajes mais escuras e polidas nas linhas de passagem)
      let dw = Infinity;
      for (const line of WEAR_LINES) dw = Math.min(dw, distToPolyline(cu, cv, line));
      if (dw < 5) t *= 0.9 + 0.1 * (dw / 5);
      // sujeira junto às bordas (pé dos edifícios vizinhos)
      const de = Math.min(cu - u0, u1 - cu, cv - v0, v1 - cv);
      if (de < 3) t *= 0.93 + 0.023 * de;
      // remendos de lajes de tufo (pavimentos mais antigos/reparos) em pequenos grupos
      const tufa = valueNoise(cu, cv, 11, 7) > 0.8 && hash2(i, j, 9) > 0.45;
      // travertino: tom creme-claro (hipótese da nota 11 §9) — compensa o cinza da textura
      const warm = (hash2(i, j, 5) - 0.5) * 0.05;
      const color = tufa ? [t * (1.1 + warm), t * 1.02, t * (0.84 - warm)] : [t * (1.22 + warm), t * 1.1, t * (0.86 - warm)];
      const A = [ua, y, -va];
      const B = [ub, y, -va];
      const C = [ub, y, -vb];
      const D = [ua, y, -vb];
      // orientação da textura: 0°/180° na maior parte; 90° em manchas (fiadas transversais)
      // fiadas desencontradas: deslocamento da textura por linha de lajes (continuidade dentro
      // da linha); manchas com lajes giradas (reparos)
      const rot90 = valueNoise(cu, cv, 36, 11) > 0.72;
      const flip = hash2(i, j, 13) < 0.12;
      const r = (flip ? 2 : 0) + (rot90 ? 1 : 0);
      const pts = [[A, B, C, D], [B, C, D, A], [C, D, A, B], [D, A, B, C]][r];
      const uvo = r === 0 ? { u0: Math.floor(hash2(j, 0, 17) * 4) * 0.67 + ua, v0: -va } : {};
      b.add(upQuad(...pts, uvo), { mat: tufa ? 'slabsTufa' : 'slabs', color });
    }
  }

  // ---- bordas (espessura visível das lajes onde a praça encontra os vizinhos) ----
  const skirt = (pa, pb, out) => {
    b.add(sideQuad([pa[0], -0.25, pa[1]], [pb[0], -0.25, pb[1]], [pb[0], y, pb[1]], [pa[0], y, pa[1]], out), { mat: 'slabs', color: [1.0, 0.92, 0.75] });
  };
  skirt([u0, -v0], [u1, -v0], [0, 1]); // borda sul (lado da Basílica Júlia / Castor)
  skirt([u0, -v1], [u1, -v1], [0, -1]); // borda norte (Basílica de Paulo)
  skirt([u0, -v0], [u0, -v1], [-1, 0]); // borda oeste (Rostra / Comício)
  // borda leste: só fora do leito da Via Sacra (|v| > 9), onde não há continuidade
  skirt([u1, -v0], [u1, 9], [1, 0]);
  skirt([u1, -9], [u1, -v1], [1, 0]);

  // ---- canal coberto: tampas de peperino com grelhas de ferro a cada ~12 m ----
  const L = 1.75;
  let k = 0;
  for (let u = u0; u < u1 - 0.1; u += L, k++) {
    const ue = Math.min(u1, u + L - 0.025);
    const t = 0.9 + hash2(k, 3, 21) * 0.14;
    b.add(upQuad([u, y + 0.004, -(CANAL.v0 + 0.03)], [ue, y + 0.004, -(CANAL.v0 + 0.03)], [ue, y + 0.004, -(CANAL.v1 - 0.03)], [u, y + 0.004, -(CANAL.v1 - 0.03)]), {
      mat: 'peperino',
      color: [t * 1.18, t * 1.15, t * 1.08],
    });
    if (k % 7 === 3) {
      // grelha de escoamento: moldura de ferro + barras
      const cu = (u + ue) / 2;
      const cvz = -(CANAL.v0 + CANAL.v1) / 2;
      b.box(0.62, 0.012, 0.5, cu, y + 0.004, cvz, { mat: 'iron', collide: false });
      for (let s = -2; s <= 2; s++) b.box(0.05, 0.02, 0.46, cu + s * 0.11, y + 0.01, cvz, { mat: 'iron', collide: false, color: [0.5, 0.5, 0.5] });
    }
  }

  // ---- colisão: uma única caixa com o topo na cota do pavimento ----
  b.colliderBox(u1 - u0, 0.5, v1 - v0, (u0 + u1) / 2, y - 0.5, -(v0 + v1) / 2);
}

/** Usado por outros módulos: o pavimento de um retângulo pequeno (ex.: piso interno). */
export function slabRect(b, ua, ub, za, zb, y, mat, color) {
  b.add(upQuad([ua, y, za], [ub, y, za], [ub, y, zb], [ua, y, zb]), { mat, color });
}
