/**
 * Colina Capitolina — modelagem do terreno (chamada em shapeTerrain, ANTES de gerar o relevo).
 *
 * Estratégia: as duas plataformas (Area Capitolina e recinto da Arx) são CONSTRUÍDAS (piso
 * com colisão e muros de arrimo verticais), e o terreno sob elas é apenas rebaixado (pads
 * 'min') para não atravessar o piso. Assim os muros ficam verticais e nítidos, como as
 * substruções de cantaria descritas por Lívio 6.4.12 e Dion. 3.69.1.
 *
 * O perfil do Clivus Capitolinus (parte alta) é calculado aqui, a partir da altura do terreno
 * no ponto de junção com o trecho do forum-oeste (lida depois dos pads dele), e guardado em
 * `state` para a construção.
 */
import {
  Y_AREA,
  Y_ARX,
  Y_ASYLUM,
  AREA_POLY,
  ARX_POLY,
  ASYLUM,
  GRADUS_START,
  GRADUS_END,
  VICUS_IUGARIUS,
  offsetPoly,
  resample,
} from './common.js';

/** Estado compartilhado entre shapeTerrain e build (preenchido aqui). */
export const state = {
  clivus: null,
  gradus: null,
  centum: null,
  lots: [],
};

/* Traçado do clivo (parte alta): leste → oeste até o muro da Area, depois para o sul. */
export const CLIVUS = {
  c0: [-147, -1],
  c1: [-178, -1],
  c2: [-178, 86],
  gateX: -188,
  roadHalf: 3, // largura da pista: 6 m (NÃO ENCONTRADO; decisão de design da nota 01)
  porticoDepth: 5, // pórtico à direita de quem sobe (Tác. Hist. 3.71)
  porticoZ: [4, 44],
  archZ: 66, // Arco de Cipião (Lív. 37.3.7)
};

/** Altura da pista do clivo na distância s (m) a partir de c0. */
export function clivusHeight(s) {
  const c = state.clivus;
  if (!c) return Y_AREA;
  if (s >= c.sTop) return Y_AREA;
  return c.h0 + (Y_AREA - c.h0) * Math.max(0, s) / c.sTop;
}

/** Distância ao longo do clivo de um ponto da perna 2 (x = −178) com coordenada z. */
export function clivusSOnLeg2(z) {
  return state.clivus.L1 + (z - CLIVUS.c1[1]);
}

/** Lotes das casas ao longo do Vicus Iugarius (retângulos com rotação; altura definida no pad). */
const LOTS = [
  // lado norte (entre a rua e o sopé da rocha)
  { x: -183, z: 125.5, w: 14, d: 10, side: 1, floors: 3 },
  { x: -201, z: 131.5, w: 15, d: 10, side: 1, floors: 4 },
  { x: -221, z: 137, w: 15, d: 10, side: 1, floors: 3 },
  // lado sul
  { x: -205, z: 155, w: 16, d: 10, side: -1, floors: 4 },
  { x: -226, z: 160, w: 15, d: 9, side: -1, floors: 3 },
  { x: -263, z: 165.5, w: 14, d: 7, side: -1, floors: 3 },
  { x: -285, z: 166.5, w: 14, d: 6, side: -1, floors: 2 },
];

export function shapeTerrain(ctx) {
  const t = ctx.terrain;

  /* ---- plataformas construídas: rebaixa o terreno sob o piso ---- */
  ctx.terrain.addPad({ points: AREA_POLY, height: Y_AREA - 0.35, mode: 'min', blend: 3 });
  ctx.terrain.addPad({ points: ARX_POLY, height: Y_ARX - 0.35, mode: 'min', blend: 3 });
  ctx.reserve({ points: offsetPoly(AREA_POLY, 3) });
  ctx.reserve({ points: offsetPoly(ARX_POLY, 3) });

  /* ---- pé da Rocha Tarpeia: rebaixa o sopé para formar o paredão (altura NÃO ENCONTRADA) ---- */
  const foot = [
    [-312, 117],
    [-250, 124],
    [-203, 105],
    [-190, 98],
    [-180, 118],
    [-203, 121],
    [-250, 138],
    [-314, 131],
  ];
  ctx.terrain.addPad({ points: foot, height: 13, mode: 'min', blend: 10 });

  /* ---- sela do Asylum: nivelada (o solo moderno está ~8 m acima do antigo — nota 05 §1) ---- */
  const A = ASYLUM;
  ctx.terrain.addPad({ rect: { x: A.x, z: A.z, w: A.w + 4, d: A.d + 4 }, height: Y_ASYLUM, blend: 10, urban: 0.6 });
  ctx.reserve({ rect: { x: A.x, z: A.z, w: A.w + 4, d: A.d + 4 } });

  /* ---- Clivus Capitolinus (parte alta) ---- */
  const C = CLIVUS;
  const h0 = t.heightAt(C.c0[0], C.c0[1]);
  const L1 = Math.abs(C.c1[0] - C.c0[0]);
  const L2 = C.c2[1] - C.c1[1];
  state.clivus = { h0, L1, L2, sTop: L1 + L2 - 4 };
  // pista + pórtico: corredor rebaixado ('min') abaixo da cota da pista
  for (let s = 0; s <= L1; s += 3) {
    const x = C.c0[0] - s;
    ctx.terrain.addPad({ rect: { x, z: C.c0[1], w: 3.4, d: 2 * C.roadHalf + 3 }, height: clivusHeight(s) - 0.3, mode: 'min', blend: 3 });
  }
  for (let s = 0; s <= L2 + 4; s += 3) {
    const z = C.c1[1] + s;
    ctx.terrain.addPad({ rect: { x: C.c1[0] - 2.25, z, w: 2 * C.roadHalf + C.porticoDepth + 2.5, d: 3.4 }, height: clivusHeight(L1 + s) - 0.3, mode: 'min', blend: 3 });
  }
  ctx.reserve({ rect: { x: (C.c0[0] + C.c1[0]) / 2, z: C.c0[1], w: L1 + 8, d: 12 } });
  ctx.reserve({ rect: { x: C.c1[0] - 2, z: (C.c1[1] + C.c2[1]) / 2, w: 16, d: L2 + 10 } });

  /* ---- escadaria de Moneta (gradus Monetae) ---- */
  const g0 = GRADUS_START;
  const g1 = GRADUS_END;
  const gy0 = t.heightAt(g0.x, g0.z);
  const glen = Math.hypot(g1.x - g0.x, g1.z - g0.z);
  state.gradus = { y0: gy0, y1: Y_ARX, len: glen };
  for (const p of resample([[g0.x, g0.z], [g1.x, g1.z]], 3)) {
    const k = p.s / glen;
    ctx.terrain.addPad({ circle: { x: p.x, z: p.z, r: 4.2 }, height: gy0 + (Y_ARX - gy0) * k - 0.35, mode: 'min', blend: 2 });
  }
  ctx.reserve({ points: [[g0.x - 4, g0.z], [g0.x + 4, g0.z], [g1.x + 4, g1.z], [g1.x - 4, g1.z]] });

  /* ---- Centum Gradus: pé da escada no sopé rebaixado ---- */
  state.centum = { yFoot: 13 };

  /* ---- lotes das casas do Vicus Iugarius ---- */
  const S = resample(VICUS_IUGARIUS, 1);
  state.lots = [];
  for (const L of LOTS) {
    // orientação: fachada voltada para a rua (direção perpendicular ao trecho mais próximo)
    let best = S[0];
    let bd = Infinity;
    for (const s of S) {
      const d = Math.hypot(s.x - L.x, s.z - L.z);
      if (d < bd) {
        bd = d;
        best = s;
      }
    }
    const rotY = Math.atan2(best.dz, best.dx) * -1; // eixo X local ao longo da rua
    const pts = [
      [-L.w / 2, -L.d / 2],
      [L.w / 2, -L.d / 2],
      [L.w / 2, L.d / 2],
      [-L.w / 2, L.d / 2],
      [0, 0],
    ];
    let h = 0;
    for (const [lx, lz] of pts) {
      const c = Math.cos(rotY);
      const s = Math.sin(rotY);
      h += t.heightAt(L.x + lx * c + lz * s, L.z - lx * s + lz * c);
    }
    h /= pts.length;
    ctx.terrain.addPad({ rect: { x: L.x, z: L.z, w: L.w + 1, d: L.d + 1, rotY }, height: h, blend: 4 });
    ctx.reserve({ rect: { x: L.x, z: L.z, w: L.w + 1, d: L.d + 1, rotY } });
    state.lots.push({ ...L, rotY, y: h });
  }
}
