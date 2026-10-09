/**
 * Canteiro de obras da extremidade SSE do Fórum de César (início de 44 a.C.).
 *
 * Base: o fórum foi dedicado INACABADO (Plín. 35.156; Res Gestae via [M-MDT]); em 44 a.C. a velha
 * cúria já fora demolida (Dião 44.5.1) e a extremidade SSE, rumo ao Comício e ao Argileto, é
 * canteiro (LAYOUT). Quais partes estavam inacabadas e como era o canteiro: NÃO ENCONTRADO
 * (nota 04 §1, Lacuna 9). Tudo aqui é cena HIPOTÉTICA: tapumes, últimos vãos dos pórticos em
 * construção, blocos de tufo "curando" (Vitr. 2.7.5: extrair 2 anos antes), tambores de coluna,
 * grua de roda de tração com polispasto (modelo genérico; o equipamento do canteiro não está
 * documentado nas notas), andaimes, poço de cal, areia, barracão e carro de carga.
 */
import * as THREE from 'three';
import * as G from '../../render/geom.js';
import { prop } from '../../arch/props.js';
import { Y, P, ORIGIN, ROT, W } from './frame.js';
import { hoarding } from './precinct.js';
import { beam, mat4, plank } from './helpers.js';

export function buildWorksite(ctx) {
  const b = ctx.builder('forum-iulium:canteiro');
  const d = ctx.builder('forum-iulium:canteiro-detalhe', { maxDistance: 90, castShadow: true });
  for (const x of [b, d]) x.push(ORIGIN.x, 0, ORIGIN.z, ROT);
  const g0 = Y.pad; // chão do canteiro (terreno nivelado)
  const z0 = P.hoard1;
  const z1 = P.endZ;

  // ---------------- tapumes ----------------
  hoarding(b, -P.tabX, P.tabX, z0, 2.8, [{ at: 0, w: 4.0 }]);
  hoarding(b, -P.wswOuter, P.eneOuter, z1, 3.0, [{ at: 0, w: 5.0 }, { at: 27, w: 3.2 }], { color: '#d8cfc0' });
  // corredor cercado no eixo (passagem segura do público pelo canteiro)
  for (const s of [-1, 1]) {
    b.push(s * 2.8, 0, (z0 + z1) / 2, Math.PI / 2);
    hoarding(b, -(z1 - z0) / 2 + 0.2, (z1 - z0) / 2 - 0.2, 0, 1.6, []);
    b.pop();
  }
  // tábuas no chão do corredor
  b.box(5.2, 0.12, z1 - z0, 0, g0 - 0.02, (z0 + z1) / 2, { mat: 'woodLight', collide: true });

  // ---------------- últimos vãos dos pórticos (em construção) ----------------
  const cz = (k) => P.colZ0 + k * P.colStep;
  const colY = Y.portico;
  for (const s of [-1, 1]) {
    // estilóbato de travertino assentado, sem pavimento
    b.box(1.6, colY + 0.6, z1 - z0 - 0.5, s * (P.stylo + 0.8), -0.6, (z0 + z1) / 2 - 0.25, { mat: 'travertine' });
    // colunas em diferentes estágios: fuste completo sem capitel, tambores, só a base
    const stages = s < 0 ? [6.0, 4.0, 2.0, 0.5, 0] : [6.0, 3.0, 1.0, 0, 0];
    for (let i = 0; i < 5; i++) {
      const z = cz(P.colN + i);
      if (z > z1 - 1) break;
      const h = stages[i];
      if (h <= 0) continue;
      b.box(P.colD * 1.34, 0.26, P.colD * 1.34, s * P.colX, colY, z, { mat: 'travertine', collide: false });
      const drums = Math.max(1, Math.round(h / 1.0));
      for (let k = 0; k < drums; k++) {
        b.cylinder(P.colD / 2, P.colD / 2 * 0.99, h / drums - 0.02, s * P.colX, colY + 0.26 + (k * h) / drums, z, { mat: 'travertine', segments: 12, collide: k === 0 });
      }
      if (h > 0) b.colliderBox(P.colD, h, P.colD, s * P.colX, colY, z);
    }
    // paredes das tabernae subindo (alturas irregulares) e muro de fundo inacabado
    for (let i = 0; i < 4; i++) {
      const z = P.finEnd + 0.3 + i * P.tabW;
      if (z > z1 - 0.5) break;
      const h = Math.max(0.8, 3.6 - i * 0.9 + (s > 0 ? 0.4 : 0));
      b.box(P.tabX - P.backX - P.backT, h, 0.45, s * (P.backX + P.backT + (P.tabX - P.backX - P.backT) / 2), colY - 0.6, z, { mat: 'opusIncertum' });
      b.box(P.backT, Math.max(0.6, h - 0.8), P.tabW, s * (P.backX + P.backT / 2), colY - 0.6, z + P.tabW / 2, { mat: 'opusIncertum' });
    }
  }

  // ---------------- andaimes ----------------
  for (const s of [-1, 1]) {
    for (let i = 0; i < 2; i++) scaffoldTower(b, s * P.colX, cz(P.colN + i), 2.2, 7.2, g0);
    // andaime ao longo do topo do muro ENE/OSO inacabado
    scaffoldRun(b, s * (P.backX - 0.9), P.finEnd + 0.8, z1 - 1.5, 4.5, g0);
  }

  // ---------------- grua de roda de tração (lado OSO) ----------------
  crane(b, -16.5, 93.5, g0);

  // ---------------- blocos de tufo empilhados (instanciados) ----------------
  // blocos de 2 × 2 × 4 pés (≈ 0,59 × 0,59 × 1,18 m), medida dos blocos do Tabularium (nota 11 §1)
  const blockG = G.box(1.18, 0.59, 0.59);
  const blocks = ctx.world.instances('forum-iulium:blocos-tufo', blockG, 'tufa', { collide: 'box', maxDistance: 300 });
  const rng = ctx.rng(4404);
  const stack = (lx, lz, nx, nz, layers, rot = 0) => {
    for (let l = 0; l < layers; l++) {
      for (let i = 0; i < nx - l; i++) {
        for (let k = 0; k < nz; k++) {
          const px = lx + (i - (nx - l - 1) / 2) * 1.22;
          const pz = lz + (k - (nz - 1) / 2) * 0.63;
          const c = Math.cos(rot);
          const sn = Math.sin(rot);
          const p = W(lx + (px - lx) * c + (pz - lz) * sn, lz - (px - lx) * sn + (pz - lz) * c);
          const shade = 0.88 + rng() * 0.2;
          blocks.add(p.x, g0 + l * 0.6, p.z, ROT + rot, 1, [shade, shade * 0.97, shade * 0.9]);
        }
      }
    }
  };
  stack(-9, 97, 5, 3, 3);
  stack(-21, 100.5, 4, 2, 2, 0.15);
  stack(10, 99, 4, 3, 2, -0.1);
  stack(20, 92.5, 3, 2, 3);

  // ---------------- tambores de coluna deitados e capitel à espera ----------------
  for (let i = 0; i < 5; i++) {
    const g = G.cylinder(P.colD / 2, P.colD / 2, 1.0, 12, { caps: true, bottomCap: true });
    g.rotateZ(Math.PI / 2);
    b.add(g, { mat: 'travertine', matrix: mat4(14 + (i % 3) * 1.3, g0 + P.colD / 2, 95 + Math.floor(i / 3) * 1.4, 0.2 * i), collide: 'box' });
  }
  b.box(1.1, 0.9, 1.1, -12.5, g0, 99.5, { mat: 'travertine' }); // capitel desbastado (bloco)
  b.box(1.0, 0.5, 1.0, -12.5, g0 + 0.9, 99.5, { mat: 'travertine', collide: false });

  // ---------------- poço de cal, areia, água ----------------
  {
    const x = 22;
    const z = 99.5;
    b.box(3.0, 0.5, 2.0, x, g0 - 0.3, z, { mat: 'woodDark' });
    b.box(2.7, 0.06, 1.7, x, g0 + 0.15, z, { mat: 'flat', color: '#e9e6dc', collide: false });
    const sand = G.lathe([[0, 0], [1.8, 0], [1.2, 0.5], [0.4, 0.95], [0, 1.0]], 10);
    b.add(sand, { mat: 'flat', color: '#c2a878', matrix: mat4(16.5, g0, 102) });
    const sand2 = G.lathe([[0, 0], [1.3, 0], [0.7, 0.45], [0, 0.6]], 9);
    b.add(sand2, { mat: 'flat', color: '#9a9488', matrix: mat4(-6, g0, 102.2) }); // pozolana/cascalho
    for (let i = 0; i < 4; i++) prop(d, 'amphora', 24.5 + (i % 2) * 0.5, g0, 97.2 + i * 0.35, i, 1.0);
    prop(d, 'basin', 19.5, g0, 97.5, 0, 0.8, { mat: 'wood' });
  }

  // ---------------- barracão de ferramentas ----------------
  {
    const x = 28.5;
    const z = 92;
    b.box(4.4, 2.6, 0.1, x, g0, z - 1.6, { mat: 'wood' });
    for (const s of [-1, 1]) b.box(0.1, 2.6, 3.2, x + s * 2.15, g0, z, { mat: 'wood' });
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) b.box(0.15, 2.8, 0.15, x + sx * 2.15, g0, z + sz * 1.55, { mat: 'woodDark', collide: false });
    b.push(x, 0, z, Math.PI / 2);
    b.quad([1.9, g0 + 2.6, 2.5], [1.9, g0 + 2.6, -2.5], [-1.9, g0 + 3.1, -2.5], [-1.9, g0 + 3.1, 2.5], { mat: 'roofTile' });
    b.pop();
    prop(d, 'chest', x, g0, z - 1.1, 0, 1);
    prop(d, 'basket', x - 1.2, g0, z + 0.4, 0, 1);
    prop(d, 'sack', x + 1.3, g0, z + 0.6, 0, 1);
  }

  // ---------------- bancadas de canteiro (blocos sobre cavaletes) e ferramentas ----------------
  for (const [x, z, r] of [[9, 92, 0.1], [14, 91.2, -0.2], [-7, 92, 0]]) {
    d.push(x, g0, z, r);
    for (const s of [-1, 1]) {
      d.box(0.1, 0.7, 0.8, s * 0.6, 0, 0, { mat: 'woodDark', collide: false });
    }
    d.box(1.6, 0.08, 0.9, 0, 0.7, 0, { mat: 'wood', collide: false });
    d.box(1.18, 0.59, 0.59, 0, 0.78, 0, { mat: s2(x) ? 'travertine' : 'tufa', collide: false });
    d.box(0.25, 0.05, 0.05, 0.75, 0.8, 0.3, { mat: 'iron', collide: false }); // cinzel
    d.box(0.08, 0.08, 0.3, 0.75, 0.78, -0.3, { mat: 'woodDark', collide: false }); // macete
    d.pop();
    b.colliderBox(1.7, 1.4, 1.0, x, g0, z, r);
  }

  // ---------------- carro de carga (plaustrum) junto ao portão ----------------
  {
    const x = 9.5;
    const z = 102;
    b.push(x, g0, z, Math.PI / 2 + 0.1);
    b.box(1.4, 0.12, 3.0, 0, 0.75, 0, { mat: 'wood' });
    for (const s of [-1, 1]) b.box(0.08, 0.4, 3.0, s * 0.66, 0.87, 0, { mat: 'woodDark', collide: false });
    const wheel = G.cylinder(0.55, 0.55, 0.14, 14, { caps: true, bottomCap: true });
    wheel.rotateZ(Math.PI / 2);
    for (const s of [-1, 1]) b.add(wheel, { mat: 'woodDark', matrix: mat4(s * 0.8, 0.0, 0.3) });
    b.box(1.75, 0.1, 0.1, 0, 0.5, 0.3, { mat: 'woodDark', collide: false }); // eixo
    beam(b, [0, 0.75, 1.5], [0, 0.55, 3.4], 0.06, { mat: 'woodDark' }); // timão
    b.box(1.18, 0.59, 0.59, 0, 0.87, -0.3, { mat: 'tufa', collide: false });
    b.pop();
    b.colliderBox(1.6, 1.5, 3.2, x, g0, z, Math.PI / 2 + 0.1);
  }

  for (const x of [b, d]) x.pop();
  b.finish();
  d.finish();
}

const s2 = (x) => Math.round(x) % 2 === 0;

/** Torre de andaime de madeira em volta de uma coluna (4 varas, travessas e pranchas). */
function scaffoldTower(b, x, z, w, h, g0) {
  const hw = w / 2;
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) beam(b, [x + sx * hw, g0, z + sz * hw], [x + sx * hw, g0 + h, z + sz * hw], 0.06, { mat: 'woodLight' });
  for (let yy = 2.0; yy < h; yy += 2.2) {
    for (const s of [-1, 1]) {
      b.box(w + 0.3, 0.08, 0.1, x, g0 + yy, z + s * hw, { mat: 'woodLight', collide: false });
      b.box(0.1, 0.08, w + 0.3, x + s * hw, g0 + yy, z, { mat: 'woodLight', collide: false });
    }
    // pranchas (de um lado só, deixando a coluna livre)
    for (let k = 0; k < 3; k++) b.box(0.28, 0.05, w + 0.2, x - hw + 0.2 + k * 0.32, g0 + yy + 0.08, z, { mat: 'wood', collide: false });
  }
  // diagonais
  beam(b, [x - hw, g0 + 0.2, z + hw], [x + hw, g0 + h * 0.6, z + hw], 0.04, { mat: 'woodLight' });
  beam(b, [x + hw, g0 + 0.2, z - hw], [x - hw, g0 + h * 0.6, z - hw], 0.04, { mat: 'woodLight' });
  // escada de mão
  plank(b, [x - hw - 0.5, g0, z + 0.3], [x - hw - 0.1, g0 + 2.1, z + 0.3], 0.06, 0.06, { mat: 'woodDark' });
  plank(b, [x - hw - 0.5, g0, z - 0.2], [x - hw - 0.1, g0 + 2.1, z - 0.2], 0.06, 0.06, { mat: 'woodDark' });
}

/** Andaime corrido ao longo de Z local (para muros em construção). */
function scaffoldRun(b, x, za, zb, h, g0) {
  const n = Math.max(2, Math.round((zb - za) / 2.5));
  for (let i = 0; i <= n; i++) {
    const z = za + ((zb - za) * i) / n;
    for (const s of [-0.6, 0.6]) beam(b, [x + s, g0, z], [x + s, g0 + h, z], 0.05, { mat: 'woodLight' });
  }
  for (let yy = 1.8; yy < h; yy += 2.0) {
    b.box(1.4, 0.06, zb - za, x, g0 + yy, (za + zb) / 2, { mat: 'wood', collide: false });
    for (const s of [-0.6, 0.6]) b.box(0.08, 0.08, zb - za, x + s, g0 + yy - 0.1, (za + zb) / 2, { mat: 'woodLight', collide: false });
  }
}

/**
 * Grua de roda de tração (magna rota) com mastro em A e polispasto, levantando um bloco
 * em direção ao primeiro vão inacabado do pórtico OSO. Modelo genérico (hipótese).
 */
function crane(b, x, z, g0) {
  const dir = new THREE.Vector3(-1, 0, -0.15).normalize(); // mastro inclinado para o pórtico OSO
  const H = 11;
  const lean = 3.6;
  const apex = [x + dir.x * lean, g0 + H, z + dir.z * lean];
  // pés do mastro em A
  const perp = new THREE.Vector3(-dir.z, 0, dir.x);
  const footA = [x + perp.x * 1.6, g0, z + perp.z * 1.6];
  const footB = [x - perp.x * 1.6, g0, z - perp.z * 1.6];
  for (const f of [footA, footB]) plank(b, f, apex, 0.24, 0.24, { mat: 'woodDark' });
  for (const t of [0.3, 0.6]) {
    const pa = footA.map((v, i) => v + (apex[i] - v) * t);
    const pb = footB.map((v, i) => v + (apex[i] - v) * t);
    plank(b, pa, pb, 0.14, 0.14, { mat: 'woodDark' });
  }
  // estais (cordas) para trás
  const back = [x - dir.x * 7, g0, z - dir.z * 7];
  beam(b, apex, back, 0.025, { mat: 'flat', color: '#8a7650' });
  beam(b, apex, [back[0] + perp.x * 3, g0, back[2] + perp.z * 3], 0.025, { mat: 'flat', color: '#8a7650' });
  b.box(0.3, 0.6, 0.3, back[0], g0, back[2], { mat: 'woodDark', collide: false });
  // roda de tração (diâmetro ~4,4 m) atrás do mastro, com eixo sobre dois cavaletes
  const wc = [x - dir.x * 2.4, g0 + 2.35, z - dir.z * 2.4];
  const R = 2.2;
  const wAng = Math.atan2(perp.x, perp.z); // Z local da roda (eixo) ao longo de perp; X local ao longo de dir
  b.push(wc[0], wc[1], wc[2], wAng);
  // aros (anéis de segmentos) em z = ±0.7 e travessas (degraus) ligando os aros
  const seg = 20;
  for (const zz of [-0.7, 0.7]) {
    for (let i = 0; i < seg; i++) {
      const a0 = (i / seg) * Math.PI * 2;
      const a1 = ((i + 1) / seg) * Math.PI * 2;
      plank(b, [0 + Math.cos(a0) * R, Math.sin(a0) * R, zz], [Math.cos(a1) * R, Math.sin(a1) * R, zz], 0.16, 0.12, { mat: 'wood' });
    }
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI;
      plank(b, [Math.cos(a) * R, Math.sin(a) * R, zz], [-Math.cos(a) * R, -Math.sin(a) * R, zz], 0.12, 0.1, { mat: 'woodDark' });
    }
  }
  for (let i = 0; i < seg; i++) {
    const a = ((i + 0.5) / seg) * Math.PI * 2;
    b.box(0.12, 0.05, 1.5, Math.cos(a) * (R - 0.05), Math.sin(a) * (R - 0.05) - 0.025, 0, { mat: 'wood', collide: false, rotY: 0 });
  }
  beam(b, [0, 0, -1.4], [0, 0, 1.4], 0.12, { mat: 'woodDark', segments: 8 }); // eixo (tambor)
  for (const zz of [-1.25, 1.25]) {
    plank(b, [-1.0, -2.35, zz], [0, 0, zz], 0.18, 0.18, { mat: 'woodDark' });
    plank(b, [1.0, -2.35, zz], [0, 0, zz], 0.18, 0.18, { mat: 'woodDark' });
  }
  b.pop();
  b.colliderBox(4.6, 4.6, 2.0, wc[0], g0, wc[2], wAng);
  // corda: do tambor ao topo do mastro e descendo até o bloco suspenso
  const load = [apex[0] + dir.x * 0.4, g0 + 6.2, apex[2] + dir.z * 0.4];
  beam(b, wc, apex, 0.03, { mat: 'flat', color: '#8a7650' });
  beam(b, apex, [load[0], load[1] + 1.4, load[2]], 0.03, { mat: 'flat', color: '#8a7650' });
  b.box(0.35, 0.5, 0.25, load[0], load[1] + 1.4, load[2], { mat: 'woodDark', collide: false }); // moitão (polispasto)
  for (const s of [-1, 1]) beam(b, [load[0], load[1] + 1.4, load[2]], [load[0] + s * 0.45, load[1] + 0.59, load[2]], 0.02, { mat: 'flat', color: '#8a7650' });
  b.box(1.18, 0.59, 0.59, load[0], load[1], load[2], { mat: 'travertine', collide: false, rotY: wAng });
}
