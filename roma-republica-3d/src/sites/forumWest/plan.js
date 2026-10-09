/**
 * Plano do sítio "forum-oeste" (extremidade oeste do Fórum Romano, início de 44 a.C.).
 *
 * TODAS as posições deste módulo usam o referencial do Fórum (docs/LAYOUT.md §2,
 * src/data/layout.js → FORUM_FRAME):
 *   u = ao longo do eixo da praça, positivo para ESE (rumo 119°);
 *   v = perpendicular, positivo para NNE (rumo 29°).
 * As áreas do sítio, nesse referencial, são (calculado a partir de SITE_AREAS):
 *   P1  u −160…−70, v −62…0   (Saturno, Clivus, metade sul do Tabularium, Véiove, Vicus Iugarius)
 *   P2  u −70…−20,  v −28…0   (Rostra de César e praça a leste dela)
 *   P3  u −160…−75, v 0…62    (Concórdia, Basílica Opímia, Carcer, metade norte do Tabularium)
 *
 * Fontes das escolhas (ver docs/pesquisa/01-forum-oeste.md, 05-capitolio.md, 11-materiais-pessoas.md):
 *   - âncoras: src/data/places.js (Saturno −67,5/−4,2 → u −92,7 v −23,7; Concórdia → u −112,8 v 16,3;
 *     Tabularium → u −147 v −24; Tullianum → u −96 v 51; Rostra augustana → u −63 v 1);
 *   - números marcados [HIP] são decisões de modelagem (o dado NÃO foi encontrado nas notas) e
 *     aparecem como "Reconstrução hipotética" nos painéis de informação.
 *
 * Este módulo não importa three.js (pode ser usado por scripts de conferência em Node).
 */
import { FORUM_FRAME, forumUV } from '../../data/layout.js';

export const DEG = Math.PI / 180;

/** Converte (u, v) → {x, z} do mundo. */
export const W = (u, v) => forumUV(u, v);

/** Converte (u, v) → [x, z] (formato de polígono de pad). */
export const WP = (u, v) => {
  const p = forumUV(u, v);
  return [p.x, p.z];
};

/** Converte {x, z} do mundo → (u, v). */
export function toUV(x, z) {
  const F = FORUM_FRAME;
  const dx = x - F.origin[0];
  const dz = z - F.origin[1];
  return { u: dx * F.u[0] + dz * F.u[1], v: dx * F.v[0] + dz * F.v[1] };
}

/** Polígono retangular alinhado ao Fórum (u0..u1, v0..v1) em coordenadas do mundo. */
export function rectUV(u0, u1, v0, v1) {
  return [WP(u0, v0), WP(u1, v0), WP(u1, v1), WP(u0, v1)];
}

/** Rumo de bússola (graus) do eixo +u (ESE) e +v (NNE). */
export const BEARING_U = 119;
export const BEARING_V = 29;

/**
 * Rotação, DENTRO do quadro do Fórum, de um edifício cuja fachada aponta para o rumo `b`.
 * (No quadro do Fórum: X local = v, Z local = u.)
 */
export const rotFF = (bearingDeg) => (BEARING_U - bearingDeg) * DEG;

/* ------------------------------------------------------------------------- */
/*  Cotas                                                                     */
/* ------------------------------------------------------------------------- */
export const FORUM_Y = 0; // pavimento da praça (y = 0 por convenção do projeto)

/* ------------------------------------------------------------------------- */
/*  Templo de Saturno (fase anterior a Planco)                               */
/* ------------------------------------------------------------------------- */
/**
 * Fachada para rumo 80° (ENE): a nota 01 §1 dá "NE aproximado" (confiança baixa–média) e,
 * pelas coordenadas, a Rostra fica a 79° do templo. Centro deslocado ~6 m para trás do ponto
 * de referência (que marca o pódio de Planco, 40 m de comprimento): o templo republicano,
 * menor, cabe "dentro da área do pódio de Planco" (hipótese da nota). Pódio 19 × 24 m
 * (proporção toscana 5/6 de Vitrúvio 4.7.1, dentro do envelope de 22,5 × 40 m) [HIP].
 */
export const SATURN = {
  u: -98,
  v: -27,
  bearing: 80,
  width: 19,
  length: 24,
  base: 2.0, // cota da base do pódio (terraço de nivelamento — DFR: "embasamento em terraços")
  podiumH: 5.5, // [HIP] "mais baixo que os 9 m de Planco"
  stairsDepth: 5,
  stairsWidth: 12,
};
// eixos do templo no referencial (u, v): f = frente, n = flanco norte
export const SAT_F = { u: Math.cos(rotFF(SATURN.bearing)), v: Math.sin(rotFF(SATURN.bearing)) };
export const SAT_N = { u: -SAT_F.v, v: SAT_F.u };
/** Ponto do templo em coordenadas (t ao longo da frente, s para o flanco norte) → (u, v). */
export const satPt = (t, s) => ({ u: SATURN.u + t * SAT_F.u + s * SAT_N.u, v: SATURN.v + t * SAT_F.v + s * SAT_N.v });

/* ------------------------------------------------------------------------- */
/*  Templo da Concórdia (L. Opímio, 121 a.C.) — cella transversal              */
/* ------------------------------------------------------------------------- */
/**
 * Fachada para ESE (+u), voltada para o Comício (Plut. Cam. 42.4 — inferência da nota).
 * "Planta semelhante à tiberiana" (Platner) mas mais estreita no sentido N-S para dar lugar
 * à Basílica Opímia (hipótese da nota 01 §2). Fundo encostado no Tabularium.
 */
export const CONCORD = {
  base: 0.0,
  podiumH: 4.5, // UCLA RomeLab: altura preservada do pódio ~4 m (fase não especificada)
  cella: { u0: -133, u1: -112, v0: 0, v1: 27 }, // 27 × 21 m [HIP]
  pronaos: { u0: -112, u1: -99, v0: 3.5, v1: 23.5 }, // 20 × 13 m [HIP]
  stairs: { depth: 5.5, width: 14 },
  colH: 9.5,
  colD: 1.05,
};

/* ------------------------------------------------------------------------- */
/*  Basílica Opímia (dimensões da reconstrução do DFR: 41 × 25 × c. 16 m)       */
/* ------------------------------------------------------------------------- */
export const OPIMIA = { u0: -137, u1: -96, v0: 30, v1: 55, floor: 0.6 };

/* ------------------------------------------------------------------------- */
/*  Carcer / Tullianum                                                        */
/* ------------------------------------------------------------------------- */
export const CARCER = {
  u0: -95,
  u1: -85,
  v0: 44,
  v1: 55,
  h: 6.2,
  // Tullianum: câmara circular ~7 m de diâmetro (⚠), 12 pés (3,55 m) de profundidade (Sall. Cat. 55.3)
  tull: { u: -89.6, v: 49.5, r: 3.5, floor: -3.85 },
};

/* ------------------------------------------------------------------------- */
/*  Tabularium (Q. Lutácio Cátulo, 78–65 a.C.)                               */
/* ------------------------------------------------------------------------- */
/**
 * Fachada de 73,6 m (⚠) voltada para ESE, paralela à Rostra (Cambridge). Muro da
 * substrução com 3,43 m de espessura (Platner). Galeria a ~15 m sobre o Fórum (Wikipedia),
 * 67 m de comprimento, 11 arcos (Platner/Musei Capitolini; outra versão: 10) de 7,50 × 3,6 m (⚠).
 */
export const TAB = {
  uFront: -133,
  uBack: -160,
  v0: -48,
  v1: 25.6,
  wallT: 3.43,
  galleryFloor: 15,
  galV0: -44.7,
  galV1: 22.3,
  arches: 11,
  archH: 7.5,
  archW: 3.6,
  galleryDepth: 5.6,
  topY: 24.5, // topo do entablamento da galeria ≈ nível da sela capitolina antiga
  upperH: 8, // [HIP] altura do pavimento superior coríntio (NÃO ENCONTRADO)
  upperDepth: 8.6,
  door: { v: -45.6, y: 7.3, w: 2.4, h: 3.6 }, // "um arco no extremo esquerdo" (Platner)
};

/* ------------------------------------------------------------------------- */
/*  Templo de Véiove (fase silana) — no recuo SO do Tabularium                   */
/* ------------------------------------------------------------------------- */
export const VEIOVIS = {
  // recuo quadrangular do Tabularium (Musei Capitolini)
  recess: { u0: -160, u1: -142, v0: -48, v1: -31 },
  u: -151,
  bearing: 209, // fachada voltada para a rua que sobe do Clivus (direção NÃO ENCONTRADA) [HIP]
  base: 14.2,
  podiumH: 3.0, // [HIP] "pódio alto", altura NÃO ENCONTRADA
  cellaW: 15, // cella transversal 15 × 8,90 m (Musei Capitolini, ⚠)
  cellaD: 8.9,
};

/* ------------------------------------------------------------------------- */
/*  Rostra de César (44 a.C.)                                                */
/* ------------------------------------------------------------------------- */
/**
 * Plataforma de ~3,5 m de altura (núcleo de concreto, Platner ⚠) com frente curva voltada
 * para o Fórum (leste). Corda [HIP] 15,5 m (a nota dá 13–20 m), recuada ~10 m em relação à
 * frente augustana. Encostada nos arcos que sustentam o Clivus (Platner): a plataforma de
 * substrução do Clivus fica logo atrás, ~2 m acima da praça, e a escada traseira tem 7 degraus
 * (Coarelli via DAR, número não confirmado).
 */
export const ROSTRA = { uBack: -75, uRect: -70.5, uApex: -64.5, v0: -15.5, v1: 0, h: 3.5 };

/* ------------------------------------------------------------------------- */
/*  Clivus Capitolinus (trecho inferior) e substrução                         */
/* ------------------------------------------------------------------------- */
/**
 * Percurso (nota 01 §6): começa no alto do Fórum junto ao local do futuro Arco de Tibério,
 * contorna o Templo de Saturno (frente, flanco norte), vira para o sul diante do local do futuro
 * Pórtico dos Dei Consentes e sobe a encosta. Largura (NÃO ENCONTRADA): 6 m [HIP].
 * Pontos: [u, v, y].  K0–K3 estão sobre a plataforma de substrução construída (não sobre o terreno).
 */
export const CLIVUS_W = 6;
export const K = {
  K0: [-77.5, -52, 0.0], // pé da rampa, boca do Vicus Iugarius
  K1: [-77.5, -32, 2.0], // topo da rampa
  K2: [-81.5, -16, 2.0],
  K3: [-91, -3.5, 2.0],
  K3b: [satPt(12, 14).u, satPt(12, 14).v, 2.5],
  K4: [-120.6, -25.5, 5.0],
  K5: [-121, -56, 10.0],
  K6: [-160, -58, 15.5], // passagem para o sítio "capitolio" (altura da galeria do Tabularium)
};
/** Trecho do Clivus sobre o terreno (com pads e calçamento de basalto). */
export const CLIVUS_TERRAIN = [K.K3, K.K3b, K.K4, K.K5, K.K6];

/** Plataforma (substrução) do Clivus entre a frente de Saturno e a Rostra, topo em y = 2. */
export const PLATFORM_Y = 2.0;
export const PLATFORM = (() => {
  const FN = satPt(SATURN.length / 2, SATURN.width / 2);
  const FS = satPt(SATURN.length / 2, -SATURN.width / 2);
  return [
    [-81, -32],
    [-75, -32],
    [-75, -0.5],
    [-93, -0.5],
    [FN.u, FN.v],
    [FS.u, FS.v],
  ];
})();

/* ------------------------------------------------------------------------- */
/*  Outros                                                                    */
/* ------------------------------------------------------------------------- */
/** Lacus Servilius: "no início do Vicus Iugarius, junto à Basílica Júlia" (Festo). Forma NÃO ENCONTRADA. */
export const LACUS = { u: -72.6, v: -58.5 };
/** Senaculum: "supra Graecostasim, ubi aedis Concordiae et basilica Opimia" (Varrão LL 5.156). Forma NÃO ENCONTRADA. */
export const SENACULUM = { u0: -92, u1: -78, v0: 6, v1: 24, h: 0.6 };
/** Altar de Saturno: "diante do templo, do outro lado da rua" — posição exata NÃO ENCONTRADA. */
export const ARA_SATURNI = { u: -73.2, v: -24.5 };

/** Interpolação linear de uma polilinha [u, v, y] por distância. */
export function polyline(points) {
  const segs = [];
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    segs.push({ a, b, len, s0: total });
    total += len;
  }
  return {
    length: total,
    segs,
    at(s) {
      const sc = Math.max(0, Math.min(total, s));
      for (const g of segs) {
        if (sc <= g.s0 + g.len + 1e-6) {
          const t = g.len ? (sc - g.s0) / g.len : 0;
          return {
            u: g.a[0] + (g.b[0] - g.a[0]) * t,
            v: g.a[1] + (g.b[1] - g.a[1]) * t,
            y: g.a[2] + (g.b[2] - g.a[2]) * t,
            du: (g.b[0] - g.a[0]) / (g.len || 1),
            dv: (g.b[1] - g.a[1]) / (g.len || 1),
          };
        }
      }
      const g = segs[segs.length - 1];
      return { u: g.b[0], v: g.b[1], y: g.b[2], du: (g.b[0] - g.a[0]) / g.len, dv: (g.b[1] - g.a[1]) / g.len };
    },
  };
}
