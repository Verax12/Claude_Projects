/**
 * Forum Boarium e Velabro: Templo de Portuno, templo redondo de Hércules Vencedor, Ara Máxima,
 * estátuas, porto fluvial (mercado de peixe junto ao Portúnio), casario e comércio.
 *
 * Base documental: docs/pesquisa/10 §4–5 (Pleiades, Lívio, Ovídio, Tácito), 08 §2, §4–5
 * (Varrão, Plauto, Horácio), 11 §4, §18 (Plínio 34.10, 34.33, 35.19). Cada escolha sem fonte
 * está declarada nos painéis (campo `uncertain`).
 */
import { podiumTemple, tholos, statue } from '../../arch/temple.js';
import { column } from '../../arch/columns.js';
import { stall, prop, propGeometry } from '../../arch/props.js';
import { facingRotY } from '../../core/geo.js';
import * as G from '../../render/geom.js';
import { lightInsula, oxInto, treadwheelCrane, beam, mat } from './util.js';
import { Y } from './terrain.js';

const DEG = Math.PI / 180;
/** Yaw de NPC (0 = olhando para +Z/sul) a partir de um rumo de bússola. */
const yawOf = (bearing) => Math.atan2(Math.sin(bearing * DEG), -Math.cos(bearing * DEG));

/** Constrói o Forum Boarium. `tib` = dados do módulo do Tibre (cais, pontes). */
export function buildBoarium(ctx, rnd, tib) {
  const T = ctx.terrain;
  const y0 = Y.boarium;
  const b = ctx.builder('arredores-boario');

  // ---------------------------------------------------------------- pavimento da praça (tufo)
  // eixo da praça moderna 163°/343° (contorno OSM 140 × 63 m, nota 10 §5); pavimento: hipótese
  b.push(-338, 0, 404, facingRotY(343));
  b.floor(50, 120, 0, y0 + 0.04, 0, { mat: 'slabsTufa' });
  b.pop();

  // ---------------------------------------------------------------- Templo de Portuno
  // tetrastilo (Pleiades); planta OSM 23,3 × 11,6 m incluindo a escada; eixo 163°/343°
  {
    const c = { x: -341.0, z: 356.6 }; // centroide OSM recuado 2,15 m (meia escada)
    b.push(c.x, T.heightAt(c.x, c.z), c.z, facingRotY(343));
    const D = 0.86;
    const Hc = 8.2;
    const r = podiumTemple(b, {
      width: 11.6, length: 19.0, podiumHeight: 2.4, podiumMat: 'tufa',
      order: 'ionic', columnsFront: 4, columnsDeep: 2, layout: 'prostyle',
      columnHeight: Hc, columnDiameter: D, colMat: 'stucco', wallMat: 'stucco', entMat: 'stucco',
      cellaWidth: 10.4, stairs: { width: 8.6, depth: 4.3 }, doorWidth: 2.6, doorHeight: 5.6,
      statue: true, statueSeated: false, statueMat: 'bronze', acroteria: true, acroteriaMat: 'terracottaPainted',
    });
    // semicolunas adossadas às paredes da cella (pseudoperíptero: hipótese)
    const cz0 = r.cella.z0 + 0.6;
    const cz1 = r.cella.z1 - 0.4;
    const nS = 5;
    for (let i = 0; i < nS; i++) {
      const z = cz0 + ((cz1 - cz0) * i) / (nS - 1);
      for (const sx of [-1, 1]) column(b, sx * 5.2, r.podiumTop, z, { order: 'ionic', height: Hc, diameter: D, mat: 'stucco', segments: 12, fluted: false, collide: false });
    }
    for (const x of [-1.75, 1.75]) column(b, x, r.podiumTop, r.cella.z0 - 0.05, { order: 'ionic', height: Hc, diameter: D, mat: 'stucco', segments: 12, fluted: false, collide: false });
    b.pop();
  }

  // ---------------------------------------------------------------- Templo redondo de Hércules
  // diâmetro OSM ≈ 18,4–19,2 m (pode incluir degraus); colunas, altura e mármore: hipótese
  {
    const c = { x: -349.6, z: 418.5 };
    const gy = T.heightAt(c.x, c.z);
    b.push(c.x, gy, c.z, facingRotY(90));
    // crepidoma de três degraus
    const steps = [[9.5, 0], [9.0, 0.36], [8.5, 0.72]];
    for (const [r, yy] of steps) b.cylinder(r, r, 0.36 + (yy === 0 ? 1.5 : 0), 0, yy - (yy === 0 ? 1.5 : 0), 0, { mat: 'marble', segments: 32, collide: true });
    b.colliderRamp(3.2, 0, 11.6, 0, 8.4, 1.08);
    b.push(0, 1.08, 0);
    tholos(b, {
      radius: 8.2, podiumHeight: 0.02, columns: 20, columnHeight: 10.6, columnDiameter: 0.9, order: 'corinthian',
      cellaRadius: 5.3, podiumMat: 'marble', colMat: 'marble', wallMat: 'marble', entMat: 'marble', roofMat: 'roofTile',
      stairs: false, doorWidth: 2.4, doorHeight: 6.2, smokeHole: 0.3,
    });
    statue(b, 0, 0.02, -2.2, { scale: 1.6, mat: 'bronze', baseMat: 'marble', rotY: 0 });
    b.pop();
    b.pop();
  }

  // ---------------------------------------------------------------- Ara Máxima e estátuas
  {
    const c = { x: -306.8, z: 448.4 }; // ponto Pleiades (aproximado, "rough")
    const gy = T.heightAt(c.x, c.z);
    b.push(c.x, gy, c.z, facingRotY(343));
    // recinto baixo (saepta) com entrada ao norte
    b.wall(-10, 10, -7, 1.3, 0.5, { mat: 'tufa' });
    b.wall(-10, 10, 7, 1.3, 0.5, { mat: 'tufa', openings: [{ at: 10, w: 4, h: 3 }] });
    b.push(-10, 0, 0, Math.PI / 2);
    b.wall(-7, 7, 0, 1.3, 0.5, { mat: 'tufa' });
    b.pop();
    b.push(10, 0, 0, Math.PI / 2);
    b.wall(-7, 7, 0, 1.3, 0.5, { mat: 'tufa' });
    b.pop();
    b.floor(19.5, 13.5, 0, 0.05, 0, { mat: 'slabsTufa' });
    // plataforma da ara com degraus e grande altar de pedra
    b.box(9, 1.0, 5.4, 0, -0.5, -0.5, { mat: 'peperino' });
    b.stairs(5, 2.2, 0.5, 0, 0, 4.4, { mat: 'peperino', steps: 3 });
    b.box(5.5, 1.3, 2.6, 0, 0.5, -1.0, { mat: 'peperino' });
    b.box(6.0, 0.35, 3.0, 0, 1.8, -1.0, { mat: 'travertine', collide: false });
    b.cylinder(0.45, 0.45, 2.6, 2.6, 2.15, -1.0, { mat: 'travertine', segments: 10, rotY: 0 });
    b.cylinder(0.45, 0.45, 0.01, -2.6, 2.15, -1.0, { mat: 'travertine', segments: 10 });
    // marcas escuras de fogo e oferendas sobre o altar
    b.box(2.2, 0.04, 1.2, 0, 2.15, -1.0, { mat: 'flat', color: '#2c241d', collide: false });
    // Hércules "triunfal" (Plín. 34.33) — marcador genérico
    statue(b, -7.0, 0, 2.5, { scale: 1.35, mat: 'bronze', baseMat: 'peperino', rotY: Math.PI });
    b.pop();
    // touro de bronze (Plín. 34.10; existência em 44 a.C.: NÃO ENCONTRADO)
    const bx = -331;
    const bz = 392;
    b.push(bx, T.heightAt(bx, bz), bz, facingRotY(343 - 90));
    b.box(3.0, 1.3, 1.5, 0, 0, 0, { mat: 'peperino' });
    b.box(3.2, 0.2, 1.7, 0, 1.3, 0, { mat: 'travertine', collide: false });
    b.push(0, 1.5, 0, Math.PI / 2, 1.45);
    oxInto(b, { mat: 'bronze', color: '#ffffff' });
    b.pop();
    b.pop();
  }

  // ---------------------------------------------------------------- casario
  const h = ctx.builder('arredores-boario-casas', { chunkSize: 90 });
  const tint = ['#e2d6bf', '#d9c7a6', '#e6d9c4', '#cdb894', '#dccbb0', '#c9b08a', '#e3cfae'];
  const ins = (x, z, w, d, bearingFront, floors, faces = ['pz']) =>
    lightInsula(h, w, d, x, T.heightAt(x, z), z, facingRotY(bearingFront), rnd, { floors, color: tint[Math.floor(rnd() * tint.length)], faces, balcony: floors >= 4 });
  // fileira voltada para o rio: "edifícios voltados para o Tibre e lojas de mercadorias caras" (Lív. 35.40.8)
  ins(-389, 370, 18, 16, 270, 3, ['pz', 'px', 'nx']);
  ins(-389, 392, 22, 16, 270, 3, ['pz']);
  ins(-389, 418, 24, 16, 270, 2, ['pz']);
  ins(-391, 472, 26, 16, 270, 3, ['pz', 'nx']);
  // lado leste da praça (entre a praça e o Velabro): insulae de 3–5 andares (Lív. 21.62.3)
  ins(-284, 361, 30, 22, 270, 4, ['pz', 'nx']);
  ins(-284, 395, 22, 20, 270, 5, ['pz', 'px']);
  ins(-276, 448, 30, 22, 270, 4, ['pz', 'nx']);
  ins(-272, 480, 20, 20, 250, 3, ['pz']);
  // tabernas do Velabro (lado oeste da rua), voltadas para a rua (padeiros, açougueiros, azeite)
  ins(-253, 380, 26, 15, 65, 3, ['pz', 'px']);
  ins(-268, 407, 16, 14, 65, 3, ['pz']);
  // ao sul da praça, em direção ao Circo
  ins(-356, 506, 30, 18, 343, 4, ['pz', 'px']);
  ins(-322, 507, 26, 18, 343, 3, ['pz']);
  ins(-292, 498, 18, 14, 343, 3, ['pz']);
  // a norte, entre Portuno e a área sacra (casas e lojas)
  ins(-322, 322, 28, 20, 200, 4, ['pz', 'px']);
  ins(-300, 296, 24, 20, 250, 3, ['pz']);
  ins(-328, 270, 22, 18, 270, 3, ['pz']);
  ins(-390, 300, 22, 16, 250, 3, ['pz']);
  ins(-395, 255, 26, 18, 250, 3, ['pz', 'nx']);
  // armazém comprido junto ao rio (horreum: tipo e posição hipotéticos)
  ins(-468, 245, 40, 12, 90, 2, ['pz', 'nz']);
  h.finish();

  // ---------------------------------------------------------------- detalhes (mercado, porto)
  const d = ctx.builder('arredores-boario-detalhes', { maxDistance: 130 });
  const goods = [
    [{ name: 'basket', count: 3 }, { name: 'sack', count: 1, scale: 0.6, row: 1 }],
    [{ name: 'amphora', count: 3, scale: 0.55 }],
    [{ name: 'bread', count: 3 }],
    [{ name: 'jar', count: 4 }, { name: 'basket', count: 1, row: 1 }],
  ];
  // bancas na praça
  let k = 0;
  for (const [x, z, br] of [[-322, 402, 73], [-322, 410, 73], [-321, 418, 73], [-358, 446, 163], [-350, 449, 163], [-342, 452, 163], [-316, 428, 253], [-345, 392, 343]]) {
    stall(d, x, T.heightAt(x, z), z, facingRotY(br), { goods: goods[k++ % goods.length], awningColor: k % 2 ? '#c9b48a' : '#b9a27c' });
  }
  // mercado de peixe no cais, junto ao Portúnio (Varrão LL 5.146: hipótese de posição)
  const fish = [];
  for (const [x, z] of [[-409, 362], [-409, 368], [-410, 374], [-410, 386]]) {
    stall(d, x, y0, z, facingRotY(90), { goods: [{ name: 'basket', count: 3 }], awningColor: '#d4c8a8' });
    fish.push([x, z]);
  }
  for (const [x, z] of fish) {
    for (let i = 0; i < 3; i++) {
      // peixes (fusos prateados) dentro dos cestos
      const g = G.sphere(0.06, 6, 4);
      g.scale(1, 0.6, 3.2);
      for (let f = 0; f < 3; f++) {
        const m = mat(x - 0.7 + i * 0.7 + (f - 1) * 0.07, y0 + 1.0, z + (f - 1) * 0.05, 0.3 * f);
        d.add(g.clone(), { mat: 'flat', color: '#9aa3a3', matrix: m });
      }
    }
  }
  // mercadorias no cais (ânforas deitadas e em pé, caixas, sacos, dolia), instanciadas
  const amph = ctx.world.instances('arredores:amphora', propGeometry('amphora'), 'terracotta', { maxDistance: 140 });
  const crate = ctx.world.instances('arredores:crate', propGeometry('crate'), 'wood', { maxDistance: 140, collide: 'box' });
  const sack = ctx.world.instances('arredores:sack', propGeometry('sack'), 'cloth', { maxDistance: 120 });
  for (const [cx, cz, n] of [[-413, 398, 14], [-412, 430, 18], [-414, 462, 12], [-405, 340, 8]]) {
    for (let i = 0; i < n; i++) {
      const row = Math.floor(i / 6);
      amph.add(cx + (i % 6) * 0.38 - 1, y0, cz + row * 0.42, rnd() * 6, 0.9 + rnd() * 0.2);
    }
    for (let i = 0; i < 4; i++) crate.add(cx + 2.2 + (i % 2) * 0.7, y0 + Math.floor(i / 2) * 0.45, cz - 1.2, 0.1, 1);
    for (let i = 0; i < 3; i++) sack.add(cx - 2 + i * 0.6, y0, cz - 1.6, rnd(), 1);
  }
  for (const [x, z] of [[-404, 404], [-403, 406], [-404, 436]]) prop(d, 'dolium', x, y0, z, rnd() * 6, 1);
  // guindaste de roda no cais para descarregar barcos (Vitr. 10.2 — tipo; posição: hipótese)
  treadwheelCrane(d, -413, y0, 418, facingRotY(270), 9);
  // curral com bois (mercado de gado em 44 a.C.: NÃO ENCONTRADO — ambientação)
  {
    const cx = -333;
    const cz = 472;
    const gy = T.heightAt(cx, cz);
    d.push(cx, gy, cz, facingRotY(343));
    const W = 18;
    const Dd = 9;
    for (let i = 0; i <= 12; i++) {
      const t = i / 12;
      for (const [px, pz] of [[-W / 2 + W * t, -Dd / 2], [-W / 2 + W * t, Dd / 2]]) d.box(0.14, 1.3, 0.14, px, 0, pz, { mat: 'woodDark', collide: false });
    }
    for (let i = 0; i <= 6; i++) for (const sx of [-1, 1]) d.box(0.14, 1.3, 0.14, sx * W / 2, 0, -Dd / 2 + (Dd * i) / 6, { mat: 'woodDark', collide: false });
    for (const yy of [0.5, 1.1]) {
      d.box(W, 0.1, 0.08, 0, yy, -Dd / 2, { mat: 'wood', collide: false });
      d.box(W - 4, 0.1, 0.08, 2, yy, Dd / 2, { mat: 'wood', collide: false });
      for (const sx of [-1, 1]) d.box(0.08, 0.1, Dd, sx * W / 2, yy, 0, { mat: 'wood', collide: false });
    }
    d.colliderBox(W, 1.3, 0.2, 0, 0, -Dd / 2);
    d.colliderBox(W - 4, 1.3, 0.2, 2, 0, Dd / 2);
    d.colliderBox(0.2, 1.3, Dd, -W / 2, 0, 0);
    d.colliderBox(0.2, 1.3, Dd, W / 2, 0, 0);
    const oxen = [[-5, -1.5, 0.4, '#8a7258'], [-1.5, 1.8, 2.6, '#6e5a46'], [2.5, -1.2, -0.7, '#a08b6c'], [5.5, 1.5, 1.9, '#5a4a3c'], [-6.5, 2.2, 3.4, '#9a8468']];
    for (const [ox, oz, r, c] of oxen) {
      d.push(ox, 0, oz, r);
      oxInto(d, { color: c });
      d.pop();
    }
    // cocho e feno
    d.box(3, 0.5, 0.7, 6, 0, -3.4, { mat: 'wood', collide: false });
    d.add(G.sphere(0.9, 8, 5).scale(1.4, 0.5, 1).translate(-7, 0, -3), { mat: 'flat', color: '#b59a5a' });
    d.pop();
  }
  // gente sentada e coisas do cotidiano junto às lojas
  for (const [x, z] of [[-379, 380], [-379, 400], [-296, 370], [-296, 452], [-262, 380]]) prop(d, 'bench', x, T.heightAt(x, z), z, Math.PI / 2);
  d.finish();
  b.finish();

  // ---------------------------------------------------------------- NPCs, sons, áreas, painéis
  const fbPath = [[-260, 420], [-300, 421], [-326, 414], [-352, 398], [-368, 372], [-380, 352], [-398, 346]];
  ctx.npcs.addPath(fbPath, { density: 7, width: 5 });
  ctx.npcs.addPath([[-200, 300], [-232, 360], [-260, 420]], { density: 6, width: 4, name: 'Velabro' });
  ctx.npcs.addPath([[-340, 384], [-312, 392], [-310, 436], [-328, 462], [-356, 456], [-365, 438], [-358, 400]], { loop: true, density: 9, width: 6, mix: { citizen: 4, woman: 3, slave: 3, merchant: 2, child: 1 } });
  ctx.npcs.addPath([[-326, 414], [-338, 444], [-356, 456], [-372, 450], [-398, 449]], { density: 5, width: 4 });
  // ao longo do cais
  const q = tib.quay;
  const along = [];
  for (let i = 0; i < q.length; i += 2) {
    const [x, z] = q[i];
    along.push([x + 4.5, z]);
  }
  ctx.npcs.addPath(along, { density: 5, width: 3, mix: { slave: 5, citizen: 2, merchant: 2, woman: 1 } });
  // estáticos: vendedores, peixeiros, carregadores, sacerdote na Ara Máxima
  for (const [x, z] of fish) ctx.npcs.addStatic({ x: x - 0.95, z, yaw: Math.PI / 2, type: 'merchant', pose: 'work' });
  ctx.npcs.addStatic({ x: -322 - 0.95, z: 402 + 0.3, yaw: yawOf(73), type: 'merchant', pose: 'gesture' });
  ctx.npcs.addStatic({ x: -343, z: 452 + 1, yaw: Math.PI, type: 'woman', pose: 'work' });
  ctx.npcs.addStatic({ x: -306, z: 452, yaw: Math.PI, type: 'citizen', pose: 'gesture' });
  ctx.npcs.addStatic({ x: -408, z: 418, yaw: -Math.PI / 2, type: 'slave', pose: 'work' });
  ctx.npcs.addStatic({ x: -411, z: 431, yaw: Math.PI / 2, type: 'slave', pose: 'work' });
  ctx.npcs.addStatic({ x: -379.5, z: 380, yaw: Math.PI / 2, type: 'citizen', pose: 'sit' });
  ctx.npcs.addStatic({ x: -296.5, z: 452, yaw: -Math.PI / 2, type: 'woman', pose: 'sit' });
  ctx.npcs.addStatic({ x: -330, z: 466, yaw: 0, type: 'slave', pose: 'work' });

  ctx.audio.addZone({ x: -335, z: 420, radius: 55, type: 'market', gain: 0.9 });
  ctx.audio.addZone({ x: -333, z: 472, radius: 22, type: 'animals', gain: 0.8 });
  ctx.audio.addZone({ x: -412, z: 400, radius: 45, type: 'water', gain: 0.6 });
  ctx.audio.addZone({ x: -250, z: 385, radius: 35, type: 'crowd', gain: 0.6 });

  ctx.addArea({ name: 'Forum Boarium', latin: 'Forum Boarium', points: [[-420, 316], [-298, 316], [-298, 492], [-430, 492]], priority: 2 });
  ctx.addArea({ name: 'Velabro', latin: 'Velabrum', points: [[-275, 340], [-215, 340], [-205, 420], [-275, 432]], priority: 2 });

  ctx.addInfo({
    x: -333, z: 405, radius: 18, title: 'Forum Boarium', latin: 'Forum Boarium', date: 'praça republicana (início de 44 a.C.)',
    text: 'O "mercado de gado", área-chave de comércio e de rito na margem leste do Tibre, entre o Capitólio, o Palatino e o Aventino. Ovídio o descreve como a praça "junto às pontes e ao grande Circo", que "tem o nome do touro ali posto" (Fastos 6.477–478).\n\nJá em 218 a.C. havia aqui prédios de vários andares: um boi subiu sozinho até o terceiro andar e se atirou lá de cima (Lívio 21.62.3). Em 192 a.C. um incêndio queimou os edifícios voltados para o Tibre e "todas as lojas com mercadorias de grande valor" (Lívio 35.40.8).\n\nNo pedestal, o touro de bronze trazido de Egina (Plínio, NH 34.10), que Tácito ainda via no séc. I d.C. (Anais 12.24).',
    uncertain: 'Reconstrução hipotética: se ainda havia mercado de gado ativo em 44 a.C. e se o touro de bronze já estava na praça NÃO FOI ENCONTRADO (o curral e os bois são ambientação). Pavimento de tufo, casario e cota da praça (≈ 3 m acima do rio) são estimativas: a cota antiga não foi encontrada.',
    sources: ['Pleiades 207271756 (Forum Boarium)', 'Ovídio, Fastos 6.477–478', 'Lívio 21.62.3; 35.40.8', 'Plínio, NH 34.10', 'Tácito, Anais 12.24', 'docs/pesquisa/10 §5; 08 §5; 11 §18'],
  });
  ctx.addInfo({
    x: -341, z: 344, radius: 13, title: 'Templo de Portuno', latin: 'Aedes Portuni', date: 'fim do séc. II ou início do séc. I a.C.',
    text: 'Templo tetrastilo (quatro colunas na fachada) dedicado a Portuno, deus dos portos, junto ao porto fluvial do Forum Boarium. O Pleiades o data do fim do séc. II ou do início do séc. I a.C.: em 44 a.C. estava de pé.\n\nA planta segue o contorno do monumento conservado (retângulo de ≈ 23,3 × 11,6 m, que pode incluir a escada). Varrão situa "ao longo do Tibre, junto ao Portúnio" o mercado de peixe (Forum Piscarium) — aqui, as bancas de peixe do cais.',
    uncertain: 'Reconstrução hipotética: ordem jônica, semicolunas adossadas à cella, pódio de 2,4 m, colunas de 8,2 m, tufo estucado e fachada voltada para 343° NÃO constam das notas (NÃO ENCONTRADO). Documentados: 4 colunas na fachada, planta e datação.',
    sources: ['Pleiades 494660670 (Temple of Portunus)', 'Varrão, De lingua Latina 5.146 (via nota 08)', 'docs/pesquisa/10 §5', 'docs/pesquisa/08 §2'],
  });
  ctx.addInfo({
    x: -337, z: 419, radius: 13, title: 'Templo redondo de Hércules Vencedor', latin: 'Aedes rotunda Herculis', date: 'fim do séc. II a.C.',
    text: 'Templo circular construído no fim do séc. II a.C., "talvez por L. Múmio Acaico" (Pleiades). Lívio já menciona um "templo redondo de Hércules" no Forum Boarium em 296 a.C., junto ao santuário de Pudicícia Patrícia (Lívio 10.23.3); a relação entre os dois não é conhecida.\n\nPlínio registra uma pintura do poeta Pacúvio no templo de Hércules do Forum Boarium (NH 35.19).',
    uncertain: 'Reconstrução hipotética: o diâmetro (~19 m) vem do contorno moderno; as 20 colunas coríntias, a altura (10,6 m), a porta a leste e o MÁRMORE não foram confirmados nas notas (mármore = "tradição, a verificar", nota 11).',
    sources: ['Pleiades 825969667 (Temple of Hercules Victor)', 'Lívio 10.23.3', 'Plínio, NH 35.19', 'docs/pesquisa/10 §5; 11 §4 e Lacunas 5'],
  });
  ctx.addInfo({
    x: -306.8, z: 448.4, radius: 12, title: 'Ara Máxima de Hércules', latin: 'Ara Maxima', date: 'culto arcaico',
    text: 'Antiquíssimo centro de culto de Hércules no Forum Boarium (Pleiades). Segundo Tácito, o sulco do pomério de Rômulo começava no Forum Boarium, "onde vemos o touro de bronze", de modo a abraçar a grande ara de Hércules (Anais 12.24).\n\nJunto dela, a estátua de Hércules "triunfal", consagrada pela tradição a Evandro, que nos dias de triunfo era vestida com o traje triunfal (Plínio, NH 34.33).',
    uncertain: 'Reconstrução hipotética: forma, dimensões e posição exata da ara NÃO FORAM ENCONTRADAS (o ponto do Pleiades é aproximado); o recinto e a estátua são marcadores genéricos.',
    sources: ['Pleiades 207271757 (Ara Maxima)', 'Tácito, Anais 12.24', 'Plínio, NH 34.33', 'docs/pesquisa/10 §5; 11 §18'],
  });
  ctx.addInfo({
    x: -405, z: 372, radius: 14, title: 'Porto fluvial do Forum Boarium', latin: 'Ripa Tiberis', date: '44 a.C.',
    text: 'O Tibre, com cerca de 4 plethra de largura (≈ 118 m), era navegável por grandes navios, de corrente veloz e com redemoinhos (Dionísio 9.68.2). Barcos subiam até o Forum Boarium e o emporium; em 174 a.C. os censores pavimentaram o emporium, com escadas descendo ao rio (Lívio 41.27.8).\n\nVarrão situa "ao longo do Tibre, junto ao Portúnio" um mercado de peixe. As enchentes eram frequentes nas partes planas (Lívio 35.9.2; 38.28.4).',
    uncertain: 'Reconstrução hipotética: forma dos cais, das escadas, do guindaste e dos barcos, e o nível antigo da água e das margens NÃO FORAM ENCONTRADOS.',
    sources: ['Dionísio de Halicarnasso 9.68.2', 'Lívio 41.27.8; 35.9.2; 38.28.4', 'Varrão, LL 5.146 (via nota 08)', 'docs/pesquisa/10 §6; 08 §2'],
  });
  ctx.addInfo({
    x: tib.cloaca.x + 6, z: tib.cloaca.z, radius: 10, title: 'Foz da Cloaca Máxima', latin: 'Cloaca Maxima', date: 'tradição: época dos reis',
    text: 'O grande esgoto drenava o vale do Fórum e desaguava no Tibre (Pleiades). A tradição o atribui aos Tarquínios (Lívio 1.38.6; 1.56.2); era largo o bastante, conta-se, para passar uma carroça de feno carregada (Plínio, NH 36.108; Estrabão 5.3.8).\n\nNas cheias, o Tibre refluía para dentro dos esgotos (Plínio, NH 36.105).',
    uncertain: 'Reconstrução hipotética: forma e medidas do arco da foz e data da cobertura NÃO FORAM ENCONTRADAS; a foz foi deslocada ~24 m do ponto OSM (−394,7; 408,1) para coincidir com o cais do jogo.',
    sources: ['Pleiades 867802692 (Cloaca Maxima)', 'Lívio 1.38.6; 1.56.2', 'Plínio, NH 36.105–108', 'Estrabão 5.3.8', 'docs/pesquisa/09 §3'],
  });
  ctx.addInfo({
    x: -255, z: 395, radius: 16, title: 'Velabro', latin: 'Velabrum', date: '44 a.C.',
    text: 'Vale que liga o Fórum Romano ao Forum Boarium (Pleiades). Plauto põe no Velabro "o padeiro, o açougueiro, o arúspice" (Curculio 483) e fala dos vendedores de azeite que ali combinam preços (Captivi 489); Horácio cita "o Velabro com todo o mercado" entre os fornecedores de um herdeiro pródigo (Sátiras 2.3.229).\n\nPor aqui passava a procissão dos jogos a caminho do Circo (Ovídio, Fastos 6.405); no triunfo gálico de 46 a.C., o eixo do carro de César quebrou no Velabro (Suetônio, Divus Iulius 37.2).',
    uncertain: 'Largura das ruas e tipologia das lojas NÃO ENCONTRADAS (casario hipotético). Plauto escreve c. 200 a.C.: usado só como cor local.',
    sources: ['Pleiades 432833118 (Velabrum)', 'Plauto, Curculio 483; Captivi 489', 'Horácio, Sátiras 2.3.229', 'Ovídio, Fastos 6.405', 'Suetônio, Divus Iulius 37.2', 'docs/pesquisa/10 §4–5; 08 §4; 11 §16'],
  });
}
