/**
 * Forum Holitorium (mercado de verduras e templos de Jano, Spes e Juno), canteiro de demolição
 * de César para o futuro teatro (44 a.C.), Porta Carmental com trecho da Muralha Serviana e
 * área sacra de Fortuna e Mater Matuta (S. Omobono) com os arcos de Estertínio.
 *
 * Base documental: docs/pesquisa/08 §6 (Tácito Ann. 2.49; Lívio 21.62.4, 34.53.3, 40.34.4;
 * Plínio 7.121; Dião 43.49.2–3; Varrão LL 5.146; Horácio Ep. 1.18.36), 10 §3 e §5 (Lívio 1.44.4,
 * 2.49.8, 6.32.1, 24.47.15, 25.7.6, 33.27.4; Dion. 4.13.5), 11 §7 (Vitr. 3.3.5, 4.7).
 */
import { podiumTemple, statue } from '../../arch/temple.js';
import { arch } from '../../arch/columns.js';
import { stall, prop } from '../../arch/props.js';
import { facingRotY } from '../../core/geo.js';
import * as G from '../../render/geom.js';
import { lightInsula, ruinWall, rubbleHeap, blockStack, treadwheelCrane, scaffold, beam, mat } from './util.js';
import { Y } from './terrain.js';

const DEG = Math.PI / 180;
const yawOf = (bearing) => Math.atan2(Math.sin(bearing * DEG), -Math.cos(bearing * DEG));
/** Deslocamento por rumo. */
const off = (p, br, d) => ({ x: p.x + Math.sin(br * DEG) * d, z: p.z - Math.cos(br * DEG) * d });

export const GATE = { x: -345, z: 182, bearingIn: 130 };

export function buildHolitorium(ctx, rnd) {
  const T = ctx.terrain;
  const b = ctx.builder('arredores-holitorio');
  const h = ctx.builder('arredores-holitorio-casas', { chunkSize: 90 });
  const d = ctx.builder('arredores-holitorio-detalhes', { maxDistance: 120 });
  const tint = ['#e2d6bf', '#d9c7a6', '#e6d9c4', '#cdb894', '#dccbb0', '#c9b08a'];
  const ins = (x, z, w, dd, front, floors, faces = ['pz']) => lightInsula(h, w, dd, x, T.heightAt(x, z), z, facingRotY(front), rnd, { floors, color: tint[Math.floor(rnd() * tint.length)], faces });

  // ================================================================ Forum Holitorium
  // três templos lado a lado, voltados para a praça (leste). Identificação de cada um, plantas,
  // ordens e dimensões: NÃO ENCONTRADO (hipótese declarada no painel)
  const yH = Y.holitorium;
  b.push(-404, 0, 150, 0);
  b.floor(46, 72, 0, yH + 0.04, 0, { mat: 'slabsTufa' });
  b.pop();
  const temples = [
    { z: 131, w: 13, l: 24, order: 'ionic', nF: 6, deep: 2, H: 8.0, D: 0.78, layout: 'prostyle', podium: 2.8 },
    { z: 157, w: 16, l: 30, order: 'doric', nF: 6, H: 8.6, D: 1.0, layout: 'sine-postico', side: 7, podium: 3.2 },
    { z: 183, w: 13, l: 24, order: 'ionic', nF: 4, deep: 2, H: 7.6, D: 0.8, layout: 'prostyle', podium: 2.6 },
  ];
  for (const t of temples) {
    const x = -428;
    b.push(x, yH, t.z, facingRotY(90));
    podiumTemple(b, {
      width: t.w, length: t.l, podiumHeight: t.podium, podiumMat: 'tufa', order: t.order, columnsFront: t.nF,
      columnsDeep: t.deep, layout: t.layout, columnsSide: t.side, columnHeight: t.H, columnDiameter: t.D,
      colMat: 'stucco', wallMat: 'stucco', entMat: 'stucco', pedimentMat: 'terracottaPainted', acroteria: true,
      stairs: { width: t.w * 0.7, depth: t.podium * 1.5 }, statueMat: 'terracottaPainted',
    });
    b.pop();
  }
  // bancas de verdureiros (holitores; Horácio Ep. 1.18.36) — produtos da terra, isentos da lei suntuária
  const veg = [[{ name: 'basket', count: 4 }], [{ name: 'basket', count: 2 }, { name: 'sack', count: 2, scale: 0.6, row: 1 }], [{ name: 'jar', count: 3 }, { name: 'basket', count: 2, row: 1 }]];
  const stalls = [];
  let k = 0;
  for (let i = 0; i < 4; i++) {
    for (const zz of [128, 146, 164]) {
      const x = -402 + i * 8;
      const z = zz + (i % 2) * 4;
      stall(d, x, yH, z, facingRotY(i % 2 ? 0 : 180), { goods: veg[k++ % veg.length], awningColor: ['#cdbf98', '#b8a57e', '#d8cbb0'][k % 3] });
      stalls.push({ x, z, br: i % 2 ? 0 : 180 });
    }
  }
  // verduras (repolhos/couves) nos cestos — esferas verdes instanciadas
  const greens = ctx.world.instances('arredores:greens', G.sphere(0.11, 6, 4), 'foliage', { maxDistance: 80 });
  for (const s of stalls) for (let i = 0; i < 6; i++) greens.add(s.x - 0.9 + (i % 3) * 0.9 + (rnd() - 0.5) * 0.2, yH + 1.05, s.z + (Math.floor(i / 3) - 0.5) * 0.18, 0, 0.9 + rnd() * 0.4, ['#6f8a3c', '#88a04a', '#5f7a34'][i % 3]);
  // casas e lojas ao redor da praça
  ins(-382, 106, 24, 12, 180, 3, ['pz']);
  ins(-372, 196, 16, 12, 0, 3, ['pz']);

  // ================================================================ canteiro de César (futuro teatro)
  // Dião 43.49.2–3: demoliu casas e templos, queimou as estátuas de madeira; lançou as fundações.
  {
    // casas sendo demolidas (paredes de alturas irregulares, entulho)
    const houses = [[-418, 92, 18, 12], [-440, 84, 14, 16], [-472, 96, 16, 12], [-500, 78, 14, 12], [-404, 70, 12, 10]];
    for (const [cx, cz, w, dd] of houses) {
      const gy = T.heightAt(cx, cz);
      h.push(cx, gy, cz, (rnd() - 0.5) * 0.2);
      ruinWall(h, -w / 2, w / 2, -dd / 2, 5.5, 0.5, rnd, { mat: rnd() < 0.5 ? 'opusIncertum' : 'tufa' });
      ruinWall(h, -w / 2, w / 2, dd / 2, 4.5, 0.5, rnd, { mat: 'opusIncertum' });
      h.push(-w / 2, 0, 0, Math.PI / 2);
      ruinWall(h, -dd / 2, dd / 2, 0, 5, 0.5, rnd, { mat: 'opusIncertum' });
      h.pop();
      h.push(w / 2, 0, 0, Math.PI / 2);
      ruinWall(h, -dd / 2, dd / 2, 0, 3.5, 0.5, rnd, { mat: 'opusIncertum' });
      h.pop();
      // vigas caídas
      beam(h, [-w / 3, 0.2, -dd / 4], [w / 4, 1.4, dd / 5], 0.25, { mat: 'woodDark' });
      h.pop();
      rubbleHeap(d, cx + (rnd() - 0.5) * w * 0.5, gy, cz + (rnd() - 0.5) * dd * 0.5, 3.2, rnd);
    }
    // templo em demolição (talvez o de Pietas — Plínio 7.121 o põe "onde agora está o Teatro de Marcelo")
    {
      const cx = -458;
      const cz = 76;
      const gy = T.heightAt(cx, cz);
      b.push(cx, gy, cz, facingRotY(90));
      b.box(12, 3.2, 20, 0, -1.5, 0, { mat: 'tufa' });
      b.stairs(7, 4, 1.7, 0, 0, 14, { mat: 'tufa' });
      b.floor(11.6, 19.6, 0, 1.72, 0, { mat: 'slabs' });
      for (const [x, z, hh] of [[-4.6, 8.5, 6.5], [-1.5, 8.5, 2.2], [4.6, 8.5, 6.5], [-4.6, 5.0, 4.0]]) b.cylinder(0.42, 0.37, hh, x, 1.7, z, { mat: 'stucco', segments: 10, collide: true });
      ruinWall(b, -5, 5, -9.5, 6.5, 0.7, rnd, { mat: 'tufa', y: 1.7 });
      b.push(-5, 0, -2, Math.PI / 2);
      ruinWall(b, -7.5, 7.5, 0, 5.5, 0.7, rnd, { mat: 'tufa', y: 1.7 });
      b.pop();
      // tambores de coluna e telhas empilhadas no chão
      for (let i = 0; i < 4; i++) b.cylinder(0.42, 0.42, 0.9, 7.5 + (i % 2) * 1.1, 0, -4 + i * 1.6, { mat: 'stucco', segments: 10, rotY: 0, collide: true });
      for (let i = 0; i < 3; i++) b.box(1.4, 0.9, 0.9, -8.5, i * 0.0, -6 + i * 1.3, { mat: 'roofTile', collide: true });
      scaffold(b, -5.5, 5.5, -11.2, 7, { y: 1.7, depth: 1.2 });
      b.pop();
    }
    // traçado das fundações: arco do futuro auditório marcado por estacas e vala (hipótese)
    const C = { x: -462, z: 46 };
    const R = 58;
    for (let a = 120; a <= 235; a += 5) {
      const p = off(C, a, R);
      if (p.z < 61) continue;
      const gy = T.heightAt(p.x, p.z);
      d.box(0.12, 1.4, 0.12, p.x, gy, p.z, { mat: 'woodLight', collide: false });
      // vala escura (faixa rebaixada) e terra removida ao lado
      d.push(p.x, gy + 0.02, p.z, facingRotY(a));
      d.box(5.2, 0.03, 2.4, 0, 0, 0, { mat: 'flat', color: '#4b3d2e', collide: false, faces: { bottom: false } });
      d.pop();
      if (a % 15 === 0) {
        const q = off(C, a, R + 4);
        rubbleHeap(d, q.x, gy, q.z, 1.6, rnd, { color: '#a08868' });
      }
    }
    // blocos de tufo empilhados "curando" (Vitr. 2.7.5) e guindaste
    blockStack(b, -432, T.heightAt(-432, 104), 104, 0.2, 5, 2, 3);
    blockStack(b, -486, T.heightAt(-486, 106), 106, -0.3, 4, 2, 4);
    blockStack(b, -506, T.heightAt(-506, 96), 96, 0.6, 3, 3, 2);
    treadwheelCrane(b, -446, T.heightAt(-446, 112), 112, facingRotY(320), 13);
    // tapume de tábuas entre o canteiro e o Forum Holitorium
    for (let x = -505; x <= -396; x += 3.2) {
      const gy = T.heightAt(x, 113);
      h.box(3.1, 2.4, 0.12, x, gy, 113, { mat: 'wood', color: '#9a8466' });
      h.box(0.16, 2.6, 0.16, x - 1.55, gy, 113.1, { mat: 'woodDark', collide: false });
    }
    // carroça de obra (permitida de dia para obras públicas: Tab. Heracl. — não verificada, nota 11)
    {
      const cx = -478;
      const cz = 104;
      const gy = T.heightAt(cx, cz);
      d.push(cx, gy, cz, 0.6);
      d.box(1.6, 0.5, 3.2, 0, 0.75, 0, { mat: 'wood', collide: false });
      for (const s of [-1, 1]) d.cylinder(0.62, 0.62, 0.12, s * 0.9, 0.62, 0.1, { mat: 'woodDark', segments: 12, rotY: 0, collide: false });
      beam(d, [0, 0.9, 1.6], [0, 0.7, 4.2], 0.12);
      d.box(1.4, 0.4, 2.6, 0, 1.25, 0, { mat: 'tufa', collide: false });
      d.pop();
      d.colliderBox(1.8, 1.7, 3.4, cx, gy, cz);
    }
  }

  // ================================================================ Porta Carmental e muralha
  {
    const g = GATE;
    const gy = T.heightAt(g.x, g.z);
    b.push(g.x, gy, g.z, facingRotY(g.bearingIn));
    const Wg = 16;
    const Dg = 8;
    const Hg = 11;
    const span = 4.2;
    const imp = 4.6; // nascença dos arcos
    // bloco da porta com dois vãos (Lív. 2.49.8: "dextro Iano") e arcos de aduelas nas faces
    const xs = [-(1.3 + span / 2), 1.3 + span / 2];
    b.wall(-Wg / 2, Wg / 2, 0, Hg + 1.5, Dg, { y: -1.5, mat: 'tufa', openings: xs.map((x) => ({ at: Wg / 2 + x, w: span, h: imp + 1.5 + span / 2 })) });
    for (const xc of xs) for (const zz of [Dg / 2 - 0.3, -Dg / 2 + 0.3]) arch(b, xc, imp, zz, span, 0.64, { mat: 'peperino', thickness: 0.7 });
    b.box(Wg + 0.4, 0.4, Dg + 0.4, 0, Hg, 0, { mat: 'peperino', collide: false });
    // ameias simples
    for (let i = 0; i < 7; i++) b.box(1.1, 1.0, 0.6, -Wg / 2 + 1 + i * 2.33, Hg + 0.4, Dg / 2 - 0.3, { mat: 'tufa', collide: false });
    b.pop();
    // trechos de muralha (blocos de tufo, ~9 m: altura NÃO atestada) para NE e SO, em segmentos que seguem o terreno
    const dirNE = 40;
    for (const [s0, s1] of [[8, 40], [-48, -8]]) {
      for (let s = s0; s < s1 - 0.1; s += 6) {
        const sm = s + 3;
        const p = off(g, dirNE, sm);
        const gyy = T.heightAt(p.x, p.z);
        b.push(p.x, gyy, p.z, facingRotY(g.bearingIn));
        b.box(6.05, 9 + 2, 3.4, 0, -2, 0, { mat: 'tufa', color: rnd() < 0.3 ? '#cfc2a2' : null });
        b.box(6.2, 0.35, 3.6, 0, 9, 0, { mat: 'peperino', collide: false });
        b.pop();
      }
    }
    // casas encostadas à muralha por dentro e por fora (Lív. 1.44.4; Dion. 4.13.5)
    for (const [sm, side, w, dd, fl] of [[20, 1, 10, 8, 3], [31, -1, 9, 8, 2], [-20, 1, 11, 8, 3], [-33, -1, 10, 9, 3], [-42, 1, 9, 8, 2]]) {
      const p0 = off(g, dirNE, sm);
      const p = off(p0, g.bearingIn + (side > 0 ? 0 : 180), 1.7 + dd / 2);
      lightInsula(h, w, dd, p.x, T.heightAt(p.x, p.z), p.z, facingRotY(g.bearingIn + (side > 0 ? 0 : 180)), rnd, { floors: fl, color: tint[Math.floor(rnd() * tint.length)], faces: ['pz'] });
    }
  }

  // ================================================================ área sacra de Fortuna e Mater Matuta
  {
    const c = { x: -298, z: 226 };
    const gy = Y.omobono;
    b.push(c.x, gy, c.z, facingRotY(40));
    b.floor(60, 42, 0, 0.04, 0, { mat: 'slabsTufa' });
    // muro baixo do recinto com entrada do lado da rua (frente, NE)
    b.wall(-30, 30, 21, 1.4, 0.5, { mat: 'tufa', openings: [{ at: 20, w: 6, h: 3 }, { at: 40, w: 6, h: 3 }] });
    b.wall(-30, 30, -21, 1.4, 0.5, { mat: 'tufa' });
    for (const sx of [-1, 1]) {
      b.push(sx * 30, 0, 0, Math.PI / 2);
      b.wall(-21, 21, 0, 1.4, 0.5, { mat: 'tufa' });
      b.pop();
    }
    // templos gêmeos toscanos (Vitr. 4.7: largura = 5/6 do comprimento; coluna = 1/3 da largura, diâmetro = 1/7)
    for (const sx of [-1, 1]) {
      b.push(sx * 9.5, 0, -3, 0);
      const W = 12;
      const Hc = W / 3;
      podiumTemple(b, {
        width: W, length: W * 1.2, podiumHeight: 1.8, podiumMat: 'tufa', order: 'tuscan', columnsFront: 4, columnsDeep: 2,
        layout: 'prostyle', columnHeight: Hc, columnDiameter: Hc / 7, colMat: 'stucco', wallMat: 'stucco',
        entMat: 'terracottaPainted', pedimentMat: 'terracottaPainted', acroteria: true, acroteriaMat: 'terracottaPainted',
        stairs: { width: 6.5, depth: 2.6 }, pitch: 0.3, statueMat: 'terracottaPainted', entHeight: Hc * 0.35,
      });
      b.pop();
      // arco (fornix) de Estertínio diante de cada templo, com estátuas douradas (Lív. 33.27.4)
      b.push(sx * 9.5, 0, 14.5, 0);
      for (const px of [-2.6, 2.6]) b.box(1.6, 4.6, 1.8, px, 0, 0, { mat: 'peperino' });
      arch(b, 0, 4.6, 0, 3.6, 1.8, { mat: 'peperino', thickness: 0.6 });
      b.box(7, 1.4, 1.8, 0, 4.6 + 2.4, 0, { mat: 'peperino', collide: false });
      for (const px of [-1.8, 0, 1.8]) statue(b, px, 8.4, 0, { scale: 0.85, mat: 'gold', pedestalHeight: 0.4, baseMat: 'peperino', seated: false });
      b.pop();
    }
    // altar diante de cada templo
    for (const sx of [-1, 1]) prop(b, 'altar', sx * 9.5, 0, 8.5, 0, 1.3);
    b.pop();
  }

  b.finish();
  h.finish();
  d.finish();

  // ================================================================ NPCs, sons, áreas e painéis
  const g = GATE;
  ctx.npcs.addPath([[-372, 340], [-362, 300], [-356, 255], [-350, 212], [g.x, g.z], [-364, 166], [-386, 152]], { density: 5, width: 4 });
  ctx.npcs.addPath([[g.x, g.z], [-320, 187], [-288, 189]], { density: 5, width: 4, name: 'Vicus Iugarius' });
  ctx.npcs.addPath([[-386, 152], [-404, 126], [-378, 120], [-374, 172], [-404, 176], [-386, 152]], { density: 8, width: 5, mix: { citizen: 3, woman: 4, slave: 3, merchant: 2, child: 1 } });
  ctx.npcs.addPath([[-404, 126], [-430, 120.5], [-470, 121], [-520, 136], [-556, 151]], { density: 3, width: 4 });
  // margem do rio entre o porto e o Forum Holitorium
  ctx.npcs.addPath([[-406, 346], [-421, 322], [-432, 290], [-438, 250], [-445, 215], [-452, 185], [-462, 150], [-470, 121]], { density: 3, width: 3 });
  // área sacra
  ctx.npcs.addPath([[-320, 187], [-302, 205], [-298, 222], [-284, 214], [-302, 205]], { density: 3, width: 3, mix: { citizen: 3, woman: 4, slave: 1, child: 1 } });
  for (const s of stalls) {
    const back = off(s, s.br + 180, 1.0);
    ctx.npcs.addStatic({ x: back.x, z: back.z, yaw: yawOf(s.br), type: s.br === 0 ? 'woman' : 'merchant', pose: 'work' });
  }
  for (const [x, z, br] of [[-430, 100, 30], [-488, 102, 300], [-470, 88, 90], [-449, 108, 200], [-503, 93, 120]]) ctx.npcs.addStatic({ x, z, yaw: yawOf(br), type: 'slave', pose: 'work' });
  ctx.npcs.addStatic({ x: -444, z: 118, yaw: yawOf(0), type: 'citizen', pose: 'gesture' });
  ctx.npcs.addStatic({ x: -305.5, z: 214, yaw: yawOf(220), type: 'woman', pose: 'stand' });

  ctx.audio.addZone({ x: -392, z: 150, radius: 40, type: 'market', gain: 0.7 });
  ctx.audio.addZone({ x: -455, z: 92, radius: 50, type: 'workshop', gain: 0.9 });
  ctx.audio.addZone({ x: -298, z: 226, radius: 26, type: 'quiet', gain: 0.6 });

  ctx.addArea({ name: 'Forum Holitorium', latin: 'Forum Holitorium', rect: { x: -410, z: 150, w: 100, d: 70 }, priority: 2 });
  ctx.addArea({ name: 'Canteiro do teatro de César', latin: 'Theatrum Caesaris (in opere)', rect: { x: -455, z: 88, w: 130, d: 54 }, priority: 3 });
  ctx.addArea({ name: 'Porta Carmental', latin: 'Porta Carmentalis', circle: { x: g.x, z: g.z, r: 14 }, priority: 4 });
  ctx.addArea({ name: 'Área sacra de Fortuna e Mater Matuta', latin: 'Aedes Fortunae et Matris Matutae', rect: { x: -298, z: 226, w: 62, d: 44, rotY: -40 * DEG }, priority: 3 });

  ctx.addInfo({
    x: -396, z: 140, radius: 16, title: 'Forum Holitorium', latin: 'Forum Holitorium', date: 'templos dos séc. III–II a.C.',
    text: 'O "mercado de verduras". Varrão diz que ele "era o antigo Macellum, onde havia abundância de verduras" (LL 5.146). Plínio chama a horta de "o mercado da plebe" (NH 19.52) e Horácio fala do pangaré do verdureiro (Epístolas 1.18.36).\n\nAqui ficavam os templos de Jano, construído por C. Duílio, o primeiro a vencer no mar (Tácito, Anais 2.49); de Spes, "que fica no forum olitorium" (Lívio 21.62.4); e de Juno, dedicado em 194 a.C. (Lívio 34.53.3).',
    uncertain: 'Reconstrução hipotética: qual templo é qual, plantas, ordens, dimensões e materiais NÃO FORAM ENCONTRADOS; o uso efetivo da praça como mercado em 50–44 a.C. também não foi encontrado diretamente.',
    sources: ['Pleiades 72845305 (Forum Holitorium)', 'Varrão, LL 5.146', 'Tácito, Anais 2.49', 'Lívio 21.62.4; 34.53.3', 'Plínio, NH 19.52', 'Horácio, Epístolas 1.18.36', 'docs/pesquisa/08 §6'],
  });
  ctx.addInfo({
    x: -450, z: 98, radius: 22, title: 'Demolições para o teatro de César', latin: 'Theatrum a Caesare inchoatum', date: '44 a.C.',
    text: 'César quis construir um teatro "como o de Pompeu", lançou as fundações mas não o terminou; Augusto o acabaria com o nome de Marcelo. César foi criticado por ter demolido as casas e os templos que havia no lugar, queimando as estátuas, quase todas de madeira, e apropriando-se dos tesouros encontrados (Dião 43.49.2–3). Suetônio diz que ele planejava "um teatro de enorme tamanho encostado ao monte Tarpeio" (Divus Iulius 44.1).\n\nO templo de Pietas, dedicado por M\'. Acílio Glabrião com a primeira estátua dourada da Itália (Lívio 40.34.4–6), ficava "onde agora está o Teatro de Marcelo" (Plínio, NH 7.121).',
    uncertain: 'Reconstrução hipotética: extensão do canteiro, estado da obra em jan.–fev. de 44 a.C., o arco das fundações e se o templo de Pietas já estava sendo demolido são hipóteses. O Teatro de Marcelo (dedicado em 13 ou 11 a.C.) NÃO existe neste momento.',
    sources: ['Dião Cássio 43.49.2–3', 'Suetônio, Divus Iulius 44.1', 'Plínio, NH 7.121', 'Lívio 40.34.4–6', 'docs/pesquisa/08 §6; 10 (anacronismos)'],
  });
  ctx.addInfo({
    x: g.x, z: g.z, radius: 13, title: 'Porta Carmental', latin: 'Porta Carmentalis', date: 'muralha de 378 a.C.',
    text: 'Porta da Muralha Serviana ao pé do Capitólio, junto ao Vicus Iugarius (Lívio 24.47.15). Tinha mais de um vão: os Fábios saíram "pelo arco da direita" (dextro Iano), caminho que passou a ser de mau agouro (Lívio 2.49.8). Do lado de dentro ficavam os templos de Fortuna e Mater Matuta (Lívio 25.7.6).\n\nA muralha de "pedra quadrada" foi contratada em 378 a.C. (Lívio 6.32.1). Em 44 a.C. estava engolida pela cidade: as casas "agora geralmente se encostam" a ela (Lívio 1.44.4) e ela é difícil de achar, embora conserve traços em muitos lugares (Dionísio 4.13.5).',
    uncertain: 'Reconstrução hipotética: posição exata (derivada: x ≈ −330 a −360, z ≈ 170–200), altura (~9–11 m), espessura, forma dos arcos e ameias NÃO FORAM ENCONTRADAS — decisões de modelagem. O tufo amarelo (Grotta Oscura) vem de fonte secundária única.',
    sources: ['Lívio 1.44.4; 2.49.8; 6.32.1; 24.47.15; 25.7.6', 'Dionísio de Halicarnasso 4.13.5', 'docs/pesquisa/10 §3; 11 §1'],
  });
  ctx.addInfo({
    x: -298, z: 222, radius: 16, title: 'Templos de Fortuna e Mater Matuta', latin: 'Aedes Fortunae et Matris Matutae', date: 'reconstruídos em 212 a.C.',
    text: 'Templos "dentro da Porta Carmental", arrasados pelo incêndio de 213 a.C. e reconstruídos no ano seguinte (Lívio 24.47.15; 25.7.6). Diante deles, L. Estertínio ergueu em 196 a.C. dois arcos (fornices) com estátuas douradas (Lívio 33.27.4).\n\nOs templos seguem a tradição "toscana": vigas de madeira, frontões com estátuas de terracota (Vitrúvio 3.3.5); Plínio diz que os frontões de terracota ainda eram frequentes na cidade (NH 35.158).',
    uncertain: 'Reconstrução hipotética: a identificação com a área sacra de S. Omobono (Pleiades) não foi verificada; plantas, dimensões e orientação NÃO FORAM ENCONTRADAS — templos gêmeos com as proporções da regra vitruviana do templo toscano (Vitr. 4.7, nota 11).',
    sources: ['Lívio 24.47.15; 25.7.6; 33.27.4', 'Vitrúvio 3.3.5; 4.7', 'Plínio, NH 35.158', 'Pleiades 103123065 (S. Omobono)', 'docs/pesquisa/10 §5; 11 §7'],
  });
}
