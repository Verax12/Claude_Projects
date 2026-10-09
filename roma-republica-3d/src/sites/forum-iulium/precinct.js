/**
 * Recinto do Fórum de César: praça pavimentada, pórticos laterais, tabernae, muros do
 * recinto (o lado OSO é muro de arrimo contra a encosta do Capitólio), aterros de terra
 * atrás dos muros e tapumes da extremidade SSE em obras.
 *
 * Base documental (nota 04 §2): recinto (τέμενος) em volta do templo destinado a praça
 * "não de mercadorias" (Ápio 2.102); retângulo com o templo encostado ao muro de um lado
 * curto [M-IMP]; pórticos em volta do pátio e tabernae cesarianas [M-POP]; envelope de
 * 160 × 75 m [P-FI]. Profundidade e ordem dos pórticos, nº de colunas e de tabernae,
 * pavimento e materiais: NÃO ENCONTRADOS — tudo aqui é reconstrução hipotética declarada.
 */
import { entablature } from '../../arch/columns.js';
import { shedRoof } from '../../arch/roofs.js';
import * as G from '../../render/geom.js';
import { Y, P, ORIGIN, ROT, W } from './frame.js';
import { quadFacing, rampX, wallZ, liteCorinthianGeoms } from './helpers.js';

/** Altura do terreno FINAL fora do recinto (depois de todos os pads). */
function outerH(ctx, lx, lz) {
  const p = W(lx, lz);
  return ctx.terrain.heightAt(p.x, p.z);
}
/** Altura natural (DEM antes dos pads). */
function natH(ctx, lx, lz) {
  const p = W(lx, lz);
  return ctx.terrain.naturalHeight ? ctx.terrain.naturalHeight(p.x, p.z) : ctx.terrain.heightAt(p.x, p.z);
}

/** Amostras de a até b (inclusive) com passo aproximado `st`. */
function steps(a, b, st) {
  const n = Math.max(1, Math.round((b - a) / st));
  return Array.from({ length: n + 1 }, (_, i) => a + ((b - a) * i) / n);
}

/** Perfis dos aterros (berma) atrás dos muros de arrimo: [{ s, hIn, hOut }]. */
export function bermProfiles(ctx) {
  const wsw = [];
  for (const z of steps(P.backZ2, P.endZ, 4)) {
    const hOut = Math.max(Y.pad, outerH(ctx, -(P.wswOuter + 9.2), z));
    const hIn = Math.max(Y.pad, Math.min(hOut, natH(ctx, -P.wswOuter, z)));
    wsw.push({ s: z, hIn, hOut });
  }
  const nno = [];
  for (const x of steps(-(P.wswOuter + 8.7), 40, 4)) {
    const hOut = Math.max(Y.pad, outerH(ctx, x, P.backZ2 - 9.2));
    const hIn = Math.max(Y.pad, Math.min(hOut, natH(ctx, x, P.backZ2)));
    nno.push({ s: x, hIn, hOut });
  }
  return { wsw, nno };
}

export function buildPrecinct(ctx) {
  const b = ctx.builder('forum-iulium:recinto');
  b.push(ORIGIN.x, 0, ORIGIN.z, ROT);
  const berm = bermProfiles(ctx);

  // ---------------- pavimento da praça e pisos dos pórticos ----------------
  const zA = P.backZ;
  const zB = P.hoard1;
  const zMid = (zA + zB) / 2;
  const zLen = zB - zA;
  b.box(P.stylo * 2, Y.pave + 0.6, zLen, 0, -0.6, zMid, { mat: 'slabs' });
  for (const s of [-1, 1]) {
    // estilóbato de travertino sob as colunas e piso de lajes do pórtico até o fundo das tabernae
    b.box(1.6, Y.portico + 0.6 + 0.005, zLen, s * (P.stylo + 0.8), -0.6, zMid, { mat: 'travertine' });
    b.box(P.tabX - P.stylo - 1.6, Y.portico + 0.6, zLen, s * ((P.stylo + 1.6 + P.tabX) / 2), -0.6, zMid, { mat: 'slabs' });
    // rampa invisível no degrau praça → pórtico (0,18 m)
    if (s > 0) rampX(b, P.stylo - 0.9, Y.pave, P.stylo + 0.02, Y.portico + 0.005, zA, zB);
    else rampX(b, -P.stylo + 0.9, Y.pave, -P.stylo - 0.02, Y.portico + 0.005, zA, zB);
  }
  // degrau na saída da praça para o canteiro (fim do pavimento)
  b.box(P.stylo * 2, 0.08, 0.6, 0, Y.pave - 0.08, zB + 0.3, { mat: 'travertine', collide: false });

  // ---------------- colunatas dos pórticos (instanciadas) ----------------
  const cg = liteCorinthianGeoms(P.colD, P.colH);
  const bodyB = ctx.world.instances('forum-iulium:col-corpo', cg.body, 'stucco', { castShadow: true });
  const shaftB = ctx.world.instances('forum-iulium:col-fuste', cg.shaft, 'stuccoFluted', { castShadow: true });
  const colY = Y.portico + 0.005;
  for (const s of [-1, 1]) {
    for (let k = 0; k < P.colN; k++) {
      const p = W(s * P.colX, P.colZ0 + k * P.colStep);
      bodyB.add(p.x, colY, p.z, ROT);
      shaftB.add(p.x, colY, p.z, ROT);
      ctx.world.addCollider(G.cylinder(P.colD * 0.52, P.colD * 0.52, P.colH, 8).translate(p.x, colY, p.z));
    }
  }

  // ---------------- entablamento dos pórticos ----------------
  const eZ0 = P.backZ;
  const eZ1 = P.colZ0 + (P.colN - 1) * P.colStep + 0.6;
  const eL = eZ1 - eZ0;
  for (const s of [-1, 1]) {
    b.push(s * P.colX, 0, (eZ0 + eZ1) / 2, s > 0 ? Math.PI / 2 : -Math.PI / 2);
    entablature(b, -eL / 2, eL / 2, 0, P.colD * 1.15, P.entY, { mat: 'stucco', colH: P.colH, height: P.entH, dentils: false });
    b.pop();
  }

  // ---------------- muros de fundo dos pórticos (frente das tabernae) ----------------
  const tw = P.tabW;
  const backH = P.roofY + (P.backX - P.colX) * P.roofPitch - Y.portico - 0.06;
  const doors = [];
  for (let i = 0; i < P.nTab; i++) doors.push({ at: tw * (i + 0.5), w: 2.7, h: 3.5 });
  for (const s of [-1, 1]) {
    b.push(0, Y.portico, 0);
    wallZ(b, s * (P.backX + P.backT / 2), P.backZ, P.finEnd, backH, P.backT, { mat: 'stucco', openings: doors });
    b.pop();
    // soleiras de travertino e vergas de madeira das portas
    for (let i = 0; i < P.nTab; i++) {
      const z = P.backZ + tw * (i + 0.5);
      b.box(0.8, 0.05, 2.8, s * (P.backX + P.backT / 2), Y.portico, z, { mat: 'travertine', collide: false });
      b.box(0.75, 0.3, 3.3, s * (P.backX + P.backT / 2), Y.portico + 3.5, z, { mat: 'woodDark', collide: false });
    }
    // faixa de rodapé (embasamento) ao longo do muro, lado do pórtico
    b.box(0.08, 0.9, P.finEnd - P.backZ, s * (P.backX - 0.04), Y.portico, (P.backZ + P.finEnd) / 2, { mat: 'travertine', collide: false });
  }

  // ---------------- tabernae: paredes divisórias, tetos, pisos ----------------
  const tabDepth = P.tabX - P.backX - P.backT;
  const tabCx = P.backX + P.backT + tabDepth / 2;
  for (const s of [-1, 1]) {
    for (let i = 0; i <= P.nTab; i++) {
      const z = P.backZ + tw * i;
      b.box(tabDepth, 4.6, 0.45, s * tabCx, Y.portico, z, { mat: 'opusIncertum' });
    }
    b.box(tabDepth, 0.22, P.finEnd - P.backZ, s * tabCx, Y.portico + 4.6, (P.backZ + P.finEnd) / 2, { mat: 'woodDark', collide: false });
    b.floor(tabDepth, P.finEnd - P.backZ, s * tabCx, Y.portico + 0.015, (P.backZ + P.finEnd) / 2, { mat: 'signinum', collide: false });
  }

  // ---------------- forros dos pórticos (madeira com vigas) ----------------
  const ceilY = P.entY + P.entH * 0.62;
  const cx0 = P.colX + P.colD * 0.55;
  const cw = P.backX - cx0;
  for (const s of [-1, 1]) {
    b.box(cw, 0.12, eL, s * (cx0 + cw / 2), ceilY, (eZ0 + eZ1) / 2, { mat: 'woodDark', collide: false });
    for (let k = 0; k < P.colN; k++) {
      b.box(cw, 0.28, 0.24, s * (cx0 + cw / 2), ceilY - 0.28, P.colZ0 + k * P.colStep, { mat: 'woodDark', collide: false });
    }
  }

  // ---------------- telhados dos pórticos (uma água, do muro externo à colunata) ----------------
  const roofW = P.tabX - P.colX;
  b.push(-(P.colX + roofW / 2), 0, (eZ0 + eZ1) / 2, 0);
  shedRoof(b, roofW, eL, 0, P.roofY, 0, { pitch: P.roofPitch, overhang: 0.5, mat: 'roofTile' });
  b.pop();
  b.push(P.colX + roofW / 2, 0, (eZ0 + eZ1) / 2, Math.PI);
  shedRoof(b, roofW, eL, 0, P.roofY, 0, { pitch: P.roofPitch, overhang: 0.5, mat: 'roofTile' });
  b.pop();
  const roofHigh = P.roofY + roofW * P.roofPitch;

  // ---------------- muros externos ----------------
  const baseY = -0.6;
  const minTop = roofHigh + 0.6;
  // ENE (lado do Argileto/Subura): muro de tufo em opus quadratum, com cornija
  {
    const x = (P.tabX + P.eneOuter) / 2;
    const t = P.eneOuter - P.tabX;
    const z0 = P.backZ;
    const z1 = P.finEnd + 0.3;
    b.box(t, minTop - baseY, z1 - z0, x, baseY, (z0 + z1) / 2, { mat: 'tufa' });
    b.box(t + 0.5, 0.45, z1 - z0, x + 0.1, minTop - 0.45, (z0 + z1) / 2, { mat: 'travertine', collide: false });
    b.box(t + 0.3, 0.6, z1 - z0, x + 0.05, Y.pad - 0.1, (z0 + z1) / 2, { mat: 'travertine', collide: false });
    // trecho inacabado no canteiro (fiadas incompletas, alturas irregulares)
    for (let z = P.finEnd + 0.3; z < P.endZ - 0.5; z += 3.0) {
      const h = Math.max(1.2, 6.5 - (z - P.finEnd) * 0.35 + ((z * 7.3) % 1.5));
      b.box(t, h - baseY, 3.0, x, baseY, z + 1.5, { mat: 'tufa' });
    }
  }
  // OSO (encosta do Capitólio): muro de arrimo de 3 m, altura variável conforme o aterro
  {
    const x = -(P.tabX + P.wswOuter) / 2;
    const t = P.wswOuter - P.tabX;
    const prof = berm.wsw;
    for (let i = 0; i < prof.length - 1; i++) {
      const z0 = Math.max(prof[i].s, P.backZ);
      const z1 = prof[i + 1].s;
      if (z1 <= z0) continue;
      const done = z0 < P.finEnd;
      const hb = Math.max(prof[i].hIn, prof[i + 1].hIn);
      const top = done ? Math.max(minTop, hb + 1.0) : Math.max(hb + 1.0, Math.max(1.5, 6 - (z0 - P.finEnd) * 0.3));
      b.box(t, top - baseY, z1 - z0 + 0.02, x, baseY, (z0 + z1) / 2, { mat: 'tufa' });
      b.box(t + 0.3, 0.35, z1 - z0 + 0.02, x, top - 0.35, (z0 + z1) / 2, { mat: 'travertine', collide: false });
    }
  }
  // NNO (atrás do templo): muro de arrimo de 3 m
  {
    const z = (P.backZ + P.backZ2) / 2;
    const t = P.backZ - P.backZ2;
    const prof = berm.nno;
    for (let i = 0; i < prof.length - 1; i++) {
      const x0 = Math.max(prof[i].s, -P.wswOuter);
      const x1 = Math.min(prof[i + 1].s, P.eneOuter);
      if (x1 <= x0) continue;
      const hb = Math.max(prof[i].hIn, prof[i + 1].hIn);
      const top = Math.max(minTop, hb + 1.0);
      b.box(x1 - x0 + 0.02, top - baseY, t, (x0 + x1) / 2, baseY, z, { mat: 'tufa' });
      b.box(x1 - x0 + 0.02, 0.35, t + 0.3, (x0 + x1) / 2, top - 0.35, z, { mat: 'travertine', collide: false });
    }
    // revestimento de estuque na face interna (visível dos pórticos e atrás do templo)
    b.box(P.backX * 2, P.roofY - Y.portico, 0.05, 0, Y.portico, P.backZ + 0.025, { mat: 'stucco', collide: false });
  }

  // ---------------- aterros (bermas) atrás dos muros de arrimo ----------------
  buildBerm(b, berm.wsw, 'wsw');
  buildBerm(b, berm.nno, 'nno');

  b.pop();
  b.finish();
  return berm;
}

/**
 * Berma de terra: faixa entre o muro de arrimo e o terreno natural, cobrindo a transição
 * abrupta do terreno nivelado (grade de 4 m). Topo inclinado: hIn junto ao muro, hOut fora.
 */
function buildBerm(b, prof, side) {
  const pts = (q, inner) => {
    if (side === 'wsw') return [inner ? -P.wswOuter : -(P.wswOuter + 8.7), inner ? q.hIn : q.hOut, q.s];
    return [q.s, inner ? q.hIn : q.hOut, inner ? P.backZ2 : P.backZ2 - 8.7];
  };
  const outDir = side === 'wsw' ? [-1, 0, 0] : [0, 0, -1];
  for (let i = 0; i < prof.length - 1; i++) {
    const a = prof[i];
    const c = prof[i + 1];
    if (Math.max(a.hOut, c.hOut) < Y.pad + 0.4) continue;
    const i0 = pts(a, true);
    const i1 = pts(c, true);
    const o0 = pts(a, false);
    const o1 = pts(c, false);
    quadFacing(b, i0, i1, o1, o0, [0, 1, 0], { mat: 'dirt', collide: true });
    // face externa (desce até abaixo do terreno)
    const lo = Y.pad - 0.6;
    const o0b = [o0[0], lo, o0[2]];
    const o1b = [o1[0], lo, o1[2]];
    quadFacing(b, o0, o1, o1b, o0b, outDir, { mat: 'dirt' });
  }
}

/** Tapumes de madeira (tábuas verticais sobre postes) ao longo de X local, com portões. */
export function hoarding(b, x0, x1, z, h, gates = [], o = {}) {
  const segs = [];
  let cur = x0;
  for (const g of [...gates].sort((p, q) => p.at - q.at)) {
    segs.push([cur, g.at - g.w / 2]);
    cur = g.at + g.w / 2;
  }
  segs.push([cur, x1]);
  for (const [a, c] of segs) {
    if (c - a < 0.1) continue;
    b.box(c - a, h, 0.08, (a + c) / 2, Y.pad - 0.2, z, { mat: o.mat || 'wood', color: o.color });
    // postes e travessas
    const n = Math.max(1, Math.round((c - a) / 2.5));
    for (let k = 0; k <= n; k++) b.box(0.16, h + 0.25, 0.16, a + ((c - a) * k) / n, Y.pad - 0.2, z - 0.12, { mat: 'woodDark', collide: false });
    for (const yy of [0.6, h - 0.5]) b.box(c - a, 0.12, 0.08, (a + c) / 2, Y.pad - 0.2 + yy, z - 0.1, { mat: 'woodDark', collide: false });
  }
  // portões: batentes e folhas abertas
  for (const g of gates) {
    for (const s of [-1, 1]) {
      const hx = g.at + s * (g.w / 2);
      b.box(0.24, h + 0.6, 0.24, hx, Y.pad - 0.2, z, { mat: 'woodDark', collide: true });
      if (g.leaves !== false) {
        b.push(hx, Y.pad - 0.1, z, s > 0 ? -1.2 : 1.2);
        b.box(g.w / 2 - 0.1, h - 0.3, 0.07, -s * (g.w / 4), 0, 0, { mat: 'wood', collide: false });
        b.pop();
      }
    }
    b.box(g.w + 0.5, 0.25, 0.3, g.at, Y.pad - 0.2 + h + 0.35, z, { mat: 'woodDark', collide: false });
  }
}
