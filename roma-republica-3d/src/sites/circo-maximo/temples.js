/**
 * Templos da encosta do Aventino voltados para o Circo: Ceres (com Líber e Líbera) e Mercúrio.
 *
 * Fontes (docs/pesquisa/10 §1 e 11 §7):
 *   - Ceres, Líber e Líbera, na encosta do Aventino, dedicado em 494/3 a.C. (Pleiades 581361483);
 *     decorado por Damófilo e Górgaso com terracotas e pinturas (Plín. NH 35.154).
 *   - Vitrúvio 3.3.5: templos AREOSTILOS "junto ao Circo Máximo" (Ceres, Hércules Pompeiano):
 *     colunas muito espaçadas, epistílio de VIGAS DE MADEIRA, aspecto baixo e largo, frontões com
 *     estátuas de terracota ou de bronze dourado "à maneira toscana".
 *   - Templo toscano canônico (Vitr. 4.7): largura = 5/6 do comprimento; 3 celas; altura da coluna
 *     = 1/3 da largura; diâmetro = 1/7 da altura.
 *   - Mercúrio: "templa tibi posuere patres spectantia Circum" (Ov. Fast. 5.669); Pleiades 107133090.
 * Posições, dimensões e alturas de pódio: NÃO ENCONTRADAS → HIPÓTESE (declarada nos painéis).
 */
import { podiumTemple, statue } from '../../arch/temple.js';
import { prop } from '../../arch/props.js';
import { Y0 } from './plan.js';

/** Cota (hipotética) dos terraços dos templos na encosta. */
export const TERRACE_Y = 6.0;

/**
 * Parâmetros dos dois templos no quadro do circo (fachada voltada para −Z, isto é, para o circo).
 * X/Z = centro da planta do pódio.
 */
export const TEMPLES = {
  ceres: {
    X: -215,
    Z: 106,
    width: 20, // HIPÓTESE (Vitr. 4.7 só dá proporções)
    length: 24, // 5/6
    podium: 2.5,
    colH: 20 / 3, // 1/3 da largura
    colD: 20 / 3 / 7, // 1/7 da altura
    cellae: 3, // Ceres, Líber, Líbera
    stairs: { width: 13, depth: 4 },
  },
  mercurius: {
    X: 85,
    Z: 100,
    width: 12,
    length: 14.4,
    podium: 2.0,
    colH: 4.0,
    colD: 4.0 / 7,
    cellae: 1,
    stairs: { width: 8, depth: 3 },
  },
};

/** Retângulo do terraço (quadro do circo) de um templo. */
export function terraceRect(t) {
  return { X0: t.X - t.width / 2 - 7, X1: t.X + t.width / 2 + 7, Z0: 90, Z1: t.Z + t.length / 2 + 8 };
}

/** Constrói um templo (no quadro do circo, builder já posicionado nele). */
function temple(b, det, t, rng) {
  b.push(t.X, TERRACE_Y, t.Z, Math.PI);
  const res = podiumTemple(b, {
    width: t.width,
    length: t.length,
    podiumHeight: t.podium,
    podiumMat: 'tufa',
    order: 'tuscan',
    fluted: false,
    columnsFront: 4,
    columnsDeep: 2,
    layout: 'prostyle',
    columnHeight: t.colH,
    columnDiameter: t.colD,
    colMat: 'stucco',
    entMat: 'wood', // epistílio de vigas de madeira (Vitr. 3.3.5)
    pedimentMat: 'terracottaPainted',
    wallMat: 'stucco',
    floorMat: 'slabsTufa',
    roofMat: 'roofTile',
    ceilingMat: 'woodDark',
    cellae: t.cellae,
    pitch: 0.3,
    statue: true,
    statueMat: 'terracottaPainted',
    acroteria: true,
    acroteriaMat: 'terracottaPainted',
    stairs: t.stairs,
    doorWidth: t.cellae === 3 ? 2.0 : 1.8,
  });
  // estátuas de terracota pintada no frontão (Vitr. 3.3.5; Plín. NH 35.157–158)
  const zPed = res.frontRowZ + t.colD * 0.6 + 0.1 - 0.35;
  const hw = (res.columnXs[res.columnXs.length - 1] - res.columnXs[0] + t.colD * 1.2 + 0.6) / 2;
  const rise = hw * 0.3;
  const sc = Math.min(1.3, (rise * 0.8) / 1.7);
  statue(b, 0, res.roofY, zPed, { scale: sc, mat: 'terracottaPainted', pedestal: false, seated: true });
  for (const s of [-1, 1]) statue(b, s * hw * 0.42, res.roofY, zPed, { scale: sc * 0.62, mat: 'terracottaPainted', pedestal: false });
  // antefixas de terracota ao longo dos beirais laterais
  const zFront = res.frontRowZ + t.colD * 0.6 + 0.1 + 0.3;
  const zBack = -t.length / 2 + 0.3 - 0.3;
  const yE = res.roofY - 0.5 * 0.3;
  for (const s of [-1, 1]) {
    for (let z = zBack; z <= zFront; z += 0.75) det.box(0.22, 0.3, 0.06, s * (hw + 0.5), yE - 0.05, z, { mat: 'terracottaPainted', collide: false, rotY: Math.PI / 2 });
  }
  // altar diante da escada
  const zAltar = t.length / 2 + t.stairs.depth + 2.2;
  prop(b, 'altar', 0, 0, zAltar, 0, 1.2, { collide: true });
  b.pop();
  return { res, zAltarCircus: t.Z - zAltar };
}

/**
 * Terraços, escadarias de acesso a partir da rua do circo e os dois templos.
 * @returns {object} dados úteis (pontos de NPC, cotas)
 */
export function buildTemples(b, det, ctx) {
  const rng = ctx.rng(4602);
  const out = {};
  for (const [key, t] of Object.entries(TEMPLES)) {
    const tr = terraceRect(t);
    // pavimento da área sacra (começa depois do patamar da escadaria, que vai até Z = 91)
    b.box(tr.X1 - tr.X0, 0.05, tr.Z1 - 91, (tr.X0 + tr.X1) / 2, TERRACE_Y - 0.02, (91 + tr.Z1) / 2, { mat: 'slabsTufa', collide: false, faces: { bottom: false } });
    // muros de arrimo (fundo e laterais) contra a encosta — HIPÓTESE construtiva
    const wallC = [0.88, 0.85, 0.78];
    b.box(tr.X1 - tr.X0 + 1.2, 4.0, 0.6, (tr.X0 + tr.X1) / 2, TERRACE_Y - 0.5, tr.Z1 + 0.3, { mat: 'tufa', color: wallC });
    for (const xs of [tr.X0 - 0.3, tr.X1 + 0.3]) b.box(0.6, 4.0, tr.Z1 - tr.Z0 - 4, xs, TERRACE_Y - 0.5, (tr.Z0 + 4 + tr.Z1) / 2, { mat: 'tufa', color: wallC });
    // escadaria da rua (Z = 71, cota Y0) ao terraço (Z = 87, cota TERRACE_Y) e patamar
    const sw = 9;
    b.push(t.X, 0, 71, Math.PI);
    b.stairs(sw, 16, TERRACE_Y - Y0, 0, Y0, 0, { mat: 'tufa', faces: { bottom: false } });
    b.pop();
    b.box(sw, TERRACE_Y + 0.03 - (Y0 - 0.5), 4, t.X, Y0 - 0.5, 89, { mat: 'tufa', faces: { bottom: false } });
    // muretas laterais da escadaria (em degraus)
    for (const s of [-1, 1]) {
      for (let k = 0; k < 4; k++) {
        const z0 = 71 + k * 4;
        const top = Y0 + ((k + 1) * (TERRACE_Y - Y0)) / 4 + 0.9;
        b.box(0.5, top - (Y0 - 0.5), 4, t.X + s * (sw / 2 + 0.25), Y0 - 0.5, z0 + 2, { mat: 'tufa', color: [0.9, 0.88, 0.82] });
      }
    }
    const r = temple(b, det, t, rng);
    out[key] = { ...r, t, tr };
  }
  return out;
}
