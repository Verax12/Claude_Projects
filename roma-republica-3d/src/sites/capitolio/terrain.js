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
  CLIVUS_JOIN,
  FORECOURT_POLY,
  ARX_STAIR,
  offsetPoly,
  resample,
  polylineLength,
} from './common.js';

/** Estado compartilhado entre shapeTerrain e build (preenchido aqui). */
export const state = {
  arxStair: null,
  gradus: null,
  centum: null,
  lots: [],
};

/*
 * Traçado do clivo (parte alta), a partir da junção com o forum-oeste: sobe para OSO até o canto
 * NE das substruções da Area, vira em ângulo reto para o sul ao longo do muro leste e chega ao
 * patamar do portão SE — o percurso de Platner (nota 01 §6: "alcançava as substruções da Area
 * pelo lado NE, virava em ângulo reto ... antes de entrar pelo lado SE"). Largura NÃO ENCONTRADA
 * (6 m = decisão de design da nota 01); inclinação "forte" (≈ 15 %).
 */
export const CLIVUS = {
  pts: [[CLIVUS_JOIN.x, CLIVUS_JOIN.z], [-178, -1], [-178, 66]],
  y0: CLIVUS_JOIN.y,
  roadHalf: 3,
  porticoZ: [3, 46], // pórtico à direita de quem sobe (Tác. Hist. 3.71) — extensão HIPOTÉTICA
  porticoX0: -185.8, // face externa do muro leste da Area (fundo do pórtico)
  archZ: 73, // Arco de Cipião sobre o patamar (Lív. 37.3.7) — posição HIPOTÉTICA
};
export const CLIVUS_LEN = polylineLength(CLIVUS.pts);
/** Distância ao longo do clivo no início da 2ª perna (canto NE). */
export const CLIVUS_L1 = Math.hypot(CLIVUS.pts[1][0] - CLIVUS.pts[0][0], CLIVUS.pts[1][1] - CLIVUS.pts[0][1]);

/** Cota da pista do clivo na distância s (m) a partir da junção. */
export function clivusHeight(s) {
  const k = Math.max(0, Math.min(1, s / CLIVUS_LEN));
  return CLIVUS.y0 + (Y_AREA - CLIVUS.y0) * k;
}

/** Distância ao longo do clivo de um ponto da 2ª perna (x = −178) com coordenada z. */
export function clivusSOnLeg2(z) {
  return CLIVUS_L1 + (z - CLIVUS.pts[1][1]);
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
  { x: -246, z: 143.5, w: 14, d: 9, side: 1, floors: 3 },
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

  /* ---- Clivus Capitolinus (parte alta): corredor nivelado na cota da pista ---- */
  // pads finos a cada 1 m em ordem crescente; a cota usa s − 2,8 m para compensar a margem de
  // ~3 m que cada pad impõe aos vértices vizinhos (grade de 4 m) — a pista fica a ±0,1 m da rampa.
  for (const p of resample(CLIVUS.pts, 1)) {
    const leg2 = p.s > CLIVUS_L1 + 0.5;
    const h = clivusHeight(Math.max(0, p.s - 2.8)) - 0.04;
    if (leg2) ctx.terrain.addPad({ rect: { x: -180, z: p.z, w: 12, d: 0.5 }, height: h, blend: 1.5, urban: 0.9 });
    else ctx.terrain.addPad({ rect: { x: p.x, z: p.z, w: 0.5, d: 8, rotY: Math.atan2(-p.dz, p.dx) }, height: h, blend: 1.5, urban: 0.9 });
  }
  ctx.reserve({ points: [[CLIVUS.pts[0][0], CLIVUS.pts[0][1] - 6], [-172, -9], [-172, 66], [-186, 66], [-186, -9], [CLIVUS.pts[0][0], CLIVUS.pts[0][1] + 6]] });

  /* ---- patamar do portão SE (plataforma construída) ---- */
  ctx.terrain.addPad({ points: FORECOURT_POLY, height: Y_AREA - 0.35, mode: 'min', blend: 3 });
  ctx.reserve({ points: offsetPoly(FORECOURT_POLY, 3) });

  /* ---- pé da escada Asylum → Arx: pequeno nivelamento ---- */
  const af = { x: ARX_STAIR.x, z: ARX_STAIR.z0 + 2 };
  const ay = t.heightAt(af.x, af.z);
  ctx.terrain.addPad({ rect: { x: af.x, z: af.z, w: 7, d: 4 }, height: ay, blend: 4 });
  state.arxStair = { y0: ay };

  /* ---- escadaria de Moneta (gradus Monetae) ---- */
  const g0 = GRADUS_START;
  const g1 = GRADUS_END;
  const gy0 = t.heightAt(g0.x, g0.z);
  const glen = Math.hypot(g1.x - g0.x, g1.z - g0.z);
  state.gradus = { y0: gy0, y1: Y_ARX, len: glen };
  for (const p of resample([[g0.x, g0.z], [g1.x, g1.z]], 3)) {
    if (p.s < 5) continue; // não cava o pé da escada (borda com o forum-oeste)
    const k = p.s / glen;
    ctx.terrain.addPad({ circle: { x: p.x, z: p.z, r: 4.2 }, height: gy0 + (Y_ARX - gy0) * k - 1.6, mode: 'min', blend: 2 });
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
