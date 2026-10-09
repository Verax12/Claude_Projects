/**
 * Subura — gerador de INSULAE (prédios de aluguel) da República tardia.
 *
 * Base documental (docs/pesquisa/07 §3–4; 11 §5–7):
 *   - térreo com tabernae alugadas, abertas para a rua, com verga de madeira; mezanino (pergula)
 *     "elevado sobre as tabernae" [HIPÓTESE apoiada em Smith, s.v. Pergula];
 *   - escada independente direto da rua para os cenacula (Lívio 39.14.2: "a escada que dava para a
 *     rua");
 *   - andares superiores em reboco claro e sujo; parte deles em opus craticium (taipa sobre trama
 *     de montantes e travessas — Vitrúvio 2.8.20, que "arde como tocha");
 *   - janelas pequenas, SEM vidro, com postigos de madeira de duas folhas (bifores; Smith, Domus);
 *   - sacadas de madeira (maeniana) e andares que se projetam sobre a rua (Festo/Smith, Maenianum);
 *   - térreo em opus incertum de tufo (rebocado ou aparente) ou blocos de tufo — nada de tijolo
 *     aparente (anacronismo "estilo Óstia", nota 07, Anacronismos 1);
 *   - telhado de telhas (tegulae + imbrices); paredes de ~1,5 pé (≈ 0,44 m, Vitr. 2.8.17);
 *   - 3–5 pavimentos (≈ 10–17 m) e cores das fachadas: HIPÓTESES declaradas no painel (nota 07,
 *     lacunas 1 e 13: reboco claro e sujo, barra inferior vermelha/ocre).
 *
 * Quadro local do lote: fachada em z = 0 voltada para +Z (rua), fundo em z = −d, x ∈ [−w/2, w/2],
 * y = 0 no piso do térreo (nível da rua diante do lote).
 */
import * as THREE from 'three';
import * as G from '../../render/geom.js';
import { gableRoof, hipRoof, shedRoof } from '../../arch/roofs.js';
import { rng } from './plan.js';

/** Tons de reboco (claro, sujo, tons de terra) — HIPÓTESE (nota 07, lacuna 13; nota 11 §9). */
export const PLASTER_TINTS = ['#e9e0cd', '#e2d4b8', '#dac6a4', '#e6d8c0', '#d8c8ac', '#cfbb95', '#e3cfb0', '#d4b892', '#cbb08a', '#ddd2bf', '#c9b79a'];
/** Barra inferior do térreo: vermelho-terra (rubrica/sinopis) e ocre (nota 11 §6) — HIPÓTESE. */
export const BAND_TINTS = ['#9e5638', '#a8623f', '#b8864c', '#8a5236', '#a4744a'];
const DARK = '#15100c';
const DARK2 = '#1d1712';

/* ------------------------------------------------------------------------- */
/*  Utilidades                                                               */
/* ------------------------------------------------------------------------- */

/**
 * Quadrilátero numa face do volume do lote.
 * face: 'front' (normal +Z em z = c), 'back' (−Z em z = c), 'right' (+X em x = c), 'left' (−X em x = c).
 * (u0,u1) = intervalo ao longo da face (x para front/back, z para left/right), (y0,y1) altura.
 */
export function faceQuad(b, face, c, u0, u1, y0, y1, o) {
  if (face === 'front') b.quad([u0, y0, c], [u1, y0, c], [u1, y1, c], [u0, y1, c], o);
  else if (face === 'back') b.quad([u1, y0, c], [u0, y0, c], [u0, y1, c], [u1, y1, c], o);
  else if (face === 'right') b.quad([c, y0, u1], [c, y0, u0], [c, y1, u0], [c, y1, u1], o);
  else b.quad([c, y0, u0], [c, y0, u1], [c, y1, u1], [c, y1, u0], o);
}

const pick = (arr, r) => arr[Math.floor(r() * arr.length) % arr.length];

/** Janelas ao longo de um comprimento: centros espaçados ~2,6 m. */
function windowCenters(len, spacing, r) {
  const n = Math.max(1, Math.round(len / spacing));
  const out = [];
  for (let i = 0; i < n; i++) out.push(-len / 2 + ((i + 0.5) * len) / n + (r() - 0.5) * 0.3);
  return out;
}

/* ------------------------------------------------------------------------- */
/*  Insula de frente de rua                                                  */
/* ------------------------------------------------------------------------- */

/**
 * Constrói uma insula de frente de rua.
 * @param {object} B  { main, det } builders (det pode ser null no nível 1)
 * @param {object} lot  lote do plano (w, d, floors, seed, expLeft/expRight/expBack, zone)
 * @param {object} o  { level: 1|2, streetY: (lx)=>altura local da rua relativa ao piso,
 *   shopOverride: { bay, trade } (taberna visitável), damaged, special }
 * @returns {object} descrição (bays, alturas) para quem quiser acrescentar detalhes
 */
export function buildInsula(B, lot, o = {}) {
  const r = rng(lot.seed);
  const level = o.level ?? 2;
  const m = B.main;
  const det = level >= 2 ? B.det : null;
  const w = lot.w;
  const d = lot.d;
  const nF = o.floors ?? lot.floors;
  const fh0 = 3.7 + r() * 0.5;
  const fh = 2.9 + r() * 0.3;
  const H = fh0 + (nF - 1) * fh;
  const yb = -2.6; // fundação (abaixo do nível da rua)
  const tint = o.tint || pick(PLASTER_TINTS, r);
  const groundKind = r() < 0.4 ? 'incertum' : r() < 0.7 ? 'band' : 'tufa';
  const groundMat = groundKind === 'incertum' ? 'opusIncertum' : groundKind === 'tufa' ? 'tufa' : 'plaster';
  const band = pick(BAND_TINTS, r);
  const groundColor = groundKind === 'band' ? band : groundKind === 'tufa' ? '#d8cdb5' : null;
  const rec = level >= 2 ? 0.45 : 0; // profundidade do vão das lojas (sombra real)
  const noBottom = { bottom: false };

  // --- saliência dos andares superiores (andar que se projeta sobre a rua) ---
  let jd = 0;
  let jFrom = nF; // primeiro andar projetado
  if (nF >= 3 && o.allowJetty !== false) {
    const jr = r();
    if (jr < 0.22) {
      jd = 0.7 + r() * 0.35;
      jFrom = nF - 1; // só o último
    } else if (jr < 0.32) {
      jd = 0.6 + r() * 0.3;
      jFrom = 1; // todos os superiores
    }
  }
  const craticium = r() < (o.craticium ?? 0.32);
  const roofType = o.roof || (w < 6.5 ? 'shed' : r() < 0.55 ? 'eaves' : r() < 0.6 ? 'gable' : 'hip');

  // --- vãos do térreo ---
  const bays = [];
  const doorW = 1.9;
  let nS = w >= 5.6 ? Math.max(1, Math.floor((w - doorW) / 3.3)) : 0;
  const shopsW = w - doorW;
  const doorIdx = nS > 0 ? Math.floor(r() * (nS + 1)) : 0;
  let x = -w / 2;
  for (let i = 0; i <= nS; i++) {
    if (i === doorIdx) {
      bays.push({ type: 'door', x0: x, x1: x + (nS ? doorW : w) });
      x += nS ? doorW : w;
    }
    if (i < nS) {
      const bw = shopsW / nS;
      bays.push({ type: 'shop', x0: x, x1: x + bw });
      x += bw;
    }
  }
  if (o.shopOverride) {
    const sb = bays.filter((q) => q.type === 'shop');
    if (sb.length) {
      const tgt = sb[Math.min(sb.length - 1, o.shopOverride.bay ?? 0)];
      tgt.enterable = true;
      tgt.trade = o.shopOverride.trade;
    }
  }
  // aberturas
  const openings = [];
  for (const q of bays) {
    const bw = q.x1 - q.x0;
    const cx = (q.x0 + q.x1) / 2;
    const sy = Math.max(0, o.streetY ? o.streetY(cx) : 0); // soleira acompanha a rua em declive
    if (q.type === 'door') {
      q.ow = Math.min(1.1, bw - 0.6);
      q.oh = 2.25;
    } else {
      q.ow = Math.min(3.3, Math.max(1.8, bw - 0.85));
      q.oh = Math.min(fh0 - 0.85, 2.95);
    }
    if (q.enterable) q.sy = 0;
    else q.sy = Math.min(sy, 0.9);
    q.cx = cx;
    openings.push({ at: cx + w / 2, w: q.ow, h: q.oh, y: q.sy - yb });
  }

  // =================== TÉRREO ===================
  // Bloco de fundo (atrás do vão), por vão — o vão visitável vira uma sala real.
  const backD = (q) => (q.enterable ? Math.min(d - 1.0, 6.6) : rec);
  for (const q of bays) {
    if (q.enterable) {
      const dr = backD(q);
      m.box(q.x1 - q.x0, fh0 - yb, d - dr, (q.x0 + q.x1) / 2, yb, -(dr + d) / 2, { mat: groundMat, color: groundColor, faces: noBottom });
      q.roomDepth = dr;
      // paredes laterais da loja quando ela está na borda do lote
      if (Math.abs(q.x0 + w / 2) < 0.01) m.box(0.3, fh0 - yb, dr - rec, q.x0 + 0.15, yb, -(dr + rec) / 2, { mat: groundMat, color: groundColor, faces: noBottom });
      if (Math.abs(q.x1 - w / 2) < 0.01) m.box(0.3, fh0 - yb, dr - rec, q.x1 - 0.15, yb, -(dr + rec) / 2, { mat: groundMat, color: groundColor, faces: noBottom });
    } else {
      m.box(q.x1 - q.x0, fh0 - yb, d - rec, (q.x0 + q.x1) / 2, yb, -(d + rec) / 2, { mat: groundMat, color: groundColor, faces: noBottom });
    }
  }
  // Paramento da fachada com os vãos (aberturas atravessáveis); no nível 1 os vãos são só pintados.
  if (rec > 0) {
    m.wall(-w / 2, w / 2, -rec / 2, fh0 - yb, rec, { y: yb, mat: groundMat, color: groundColor, openings, faces: noBottom });
  }
  // fundo escuro dos vãos, vergas, soleiras e janelinhas do mezanino
  for (const q of bays) {
    const zf = rec > 0 ? -rec + 0.012 : 0.012;
    if (!q.enterable) faceQuad(m, 'front', zf, q.cx - q.ow / 2, q.cx + q.ow / 2, q.sy, q.sy + q.oh, { mat: 'plaster', color: q.type === 'door' ? DARK2 : DARK });
    // verga de madeira (projeta-se um pouco para fora)
    m.box(q.ow + 0.4, 0.22, rec + 0.08, q.cx, q.sy + q.oh - 0.02, -rec / 2 + 0.02, { mat: 'woodDark', collide: false });
    if (level >= 2) {
      // soleira de tufo; desce até abaixo do nível da rua (vira degrau quando a rua está mais baixa)
      m.box(q.ow + 0.12, 0.85, rec + 0.18, q.cx, q.sy - 0.83, -rec / 2 + 0.07, { mat: 'tufa', collide: false, color: '#cfc4ab' });
    }
    if (q.type === 'shop' && fh0 - (q.sy + q.oh) > 0.75) {
      const yy = q.sy + q.oh + 0.28;
      faceQuad(m, 'front', 0.012, q.cx - 0.38, q.cx + 0.38, yy, Math.min(fh0 - 0.25, yy + 0.42), { mat: 'plaster', color: DARK });
    }
  }
  // cinta de madeira entre o térreo e o 1º andar
  m.box(w + 0.1, 0.24, 0.16, 0, fh0 - 0.12, 0.06, { mat: 'woodDark', collide: false });

  // =================== ANDARES SUPERIORES ===================
  const yJ = fh0 + (jFrom - 1) * fh; // cota onde começa a saliência
  if (jd > 0) {
    if (jFrom > 1) m.box(w, yJ - fh0, d, 0, fh0, -d / 2, { mat: 'plaster', color: tint });
    m.box(w, H - yJ, d + jd, 0, yJ, -(d - jd) / 2, { mat: 'plaster', color: tint });
    // forro de tábuas sob a saliência e pontas das vigas (consolos)
    m.box(w, 0.06, jd, 0, yJ - 0.06, jd / 2, { mat: 'woodDark', collide: false });
    const nj = Math.max(2, Math.round(w / 0.75));
    for (let i = 0; i <= nj; i++) m.box(0.15, 0.18, jd + 0.35, -w / 2 + 0.1 + ((w - 0.2) * i) / nj, yJ - 0.24, jd / 2 - 0.15, { mat: 'woodDark', collide: false });
  } else {
    m.box(w, H - fh0, d, 0, fh0, -d / 2, { mat: 'plaster', color: tint });
  }

  // --- sacada (maenianum) ---
  let balcony = null;
  if (nF >= 3 && r() < (o.balcony ?? (level >= 2 ? 0.38 : 0.2))) {
    const k = 1 + Math.floor(r() * Math.min(2, nF - 2)); // 1º ou 2º andar superior
    const bw = Math.min(w - 1.2, 3 + r() * 5);
    if (bw > 2.4) {
      const zf = k >= jFrom ? jd : 0;
      balcony = { k, bw, cx: (r() - 0.5) * (w - bw - 0.6), y: fh0 + (k - 1) * fh, z: zf, dep: 0.95 + r() * 0.25 };
      const { cx, y, z, dep } = balcony;
      m.box(bw, 0.12, dep, cx, y - 0.12, z + dep / 2, { mat: 'wood', collide: false });
      const n = Math.max(2, Math.round(bw / 1.1));
      for (let i = 0; i <= n; i++) m.box(0.13, 0.16, dep + 0.3, cx - bw / 2 + 0.1 + ((bw - 0.2) * i) / n, y - 0.28, z + dep / 2 - 0.15, { mat: 'woodDark', collide: false });
      if (det) {
        // guarda-corpo: montantes e duas travessas
        const np = Math.max(2, Math.round(bw / 0.9));
        for (let i = 0; i <= np; i++) det.box(0.07, 0.95, 0.07, cx - bw / 2 + 0.04 + ((bw - 0.08) * i) / np, y, z + dep - 0.04, { mat: 'woodDark', collide: false, faces: noBottom });
        det.box(bw, 0.07, 0.09, cx, y + 0.95, z + dep - 0.04, { mat: 'woodDark', collide: false });
        det.box(bw, 0.05, 0.05, cx, y + 0.45, z + dep - 0.04, { mat: 'wood', collide: false });
        for (const s of [-1, 1]) det.box(0.06, 0.06, dep, cx + s * (bw / 2 - 0.03), y + 0.95, z + dep / 2, { mat: 'woodDark', collide: false });
        // roupa estendida no guarda-corpo (às vezes)
        if (r() < 0.45) {
          const cw = 0.8 + r() * 1.2;
          const ccx = cx + (r() - 0.5) * (bw - cw);
          det.box(cw, 0.75, 0.03, ccx, y + 0.3, z + dep + 0.03, { mat: 'cloth', color: pick(['#e6dcc6', '#c9b28a', '#9b4a35', '#6b7a8c', '#d8cdb8', '#8a6a46'], r), collide: false });
        }
      }
    }
  }

  // --- janelas das fachadas ---
  const winSize = (k) => (k === 1 ? [0.8, 1.1] : k === 2 ? [0.74, 1.0] : [0.68, 0.85]);
  const frontZ = (k) => (k >= jFrom ? jd : 0);
  const shutterCols = ['#5a3d26', '#6b4a2e', '#4a3120', '#7a5a3a', '#5e4630'];
  for (let k = 1; k < nF; k++) {
    const yF = fh0 + (k - 1) * fh;
    const [ww, wh] = winSize(k);
    const zf = frontZ(k) + 0.012;
    const xs = windowCenters(w - 0.6, 2.6, r);
    const isBal = balcony && balcony.k === k;
    for (const wx of xs) {
      if (r() < 0.1) continue;
      const onBal = isBal && Math.abs(wx - balcony.cx) < balcony.bw / 2 - 0.4;
      const zz = onBal ? balcony.z + 0.012 : zf;
      const y0 = onBal ? yF + 0.02 : yF + 0.9;
      const hh = onBal ? 1.95 : wh;
      const wW = onBal ? 0.86 : ww;
      faceQuad(m, 'front', zz, wx - wW / 2, wx + wW / 2, y0, y0 + hh, { mat: 'plaster', color: DARK });
      if (det) {
        // peitoril e verga
        if (!onBal) det.box(wW + 0.16, 0.07, 0.12, wx, y0 - 0.07, zz + 0.05, { mat: 'tufa', collide: false, color: '#cdbf9f', faces: { bottom: false, nz: false } });
        det.box(wW + 0.2, 0.1, 0.06, wx, y0 + hh, zz + 0.025, { mat: 'woodDark', collide: false, faces: { nz: false } });
        // postigos de madeira (bifores): abertos contra a parede, fechados ou entreabertos
        const st = r();
        const col = pick(shutterCols, r);
        if (st < 0.42) {
          for (const s of [-1, 1]) faceQuad(det, 'front', zz + 0.03, wx + s * (wW / 2) + (s > 0 ? 0.03 : -wW / 2 - 0.03), wx + s * (wW / 2) + (s > 0 ? wW / 2 + 0.03 : -0.03), y0, y0 + hh, { mat: 'wood', color: col });
        } else if (st < 0.72) {
          faceQuad(det, 'front', zz + 0.025, wx - wW / 2, wx - 0.01, y0, y0 + hh, { mat: 'wood', color: col });
          faceQuad(det, 'front', zz + 0.025, wx + 0.01, wx + wW / 2, y0, y0 + hh, { mat: 'wood', color: col });
        } else if (st < 0.86) {
          faceQuad(det, 'front', zz + 0.025, wx - wW / 2, wx - 0.01, y0, y0 + hh, { mat: 'wood', color: col });
          faceQuad(det, 'front', zz + 0.03, wx + wW / 2 + 0.03, wx + wW + 0.03, y0, y0 + hh, { mat: 'wood', color: col });
        }
      }
    }
    // janelas nas empenas e no fundo expostos
    const sideZ0 = -d + 0.8;
    const sideZ1 = frontZ(k) - 0.8;
    for (const [face, exp, c] of [['right', lot.expRight, w / 2 + 0.012], ['left', lot.expLeft, -w / 2 - 0.012]]) {
      if (!exp) continue;
      const len = sideZ1 - sideZ0;
      if (len < 2) continue;
      for (const wz of windowCenters(len, 3.2, r)) {
        if (r() < 0.45) continue;
        const zc = (sideZ0 + sideZ1) / 2 + wz;
        faceQuad(m, face, c, zc - ww / 2, zc + ww / 2, yF + 0.9, yF + 0.9 + wh, { mat: 'plaster', color: DARK });
      }
    }
    if (lot.expBack) {
      for (const bx of windowCenters(w - 0.8, 3.0, r)) {
        if (r() < 0.4) continue;
        faceQuad(m, 'back', -d - 0.012, bx - ww / 2, bx + ww / 2, yF + 0.9, yF + 0.9 + wh, { mat: 'plaster', color: DARK });
      }
    }
  }

  // --- opus craticium: trama de montantes e travessas no(s) andar(es) de cima ---
  if (craticium && nF >= 3) {
    const kc = jd > 0 ? jFrom : nF - 1;
    const yc0 = fh0 + (kc - 1) * fh;
    const zf = frontZ(kc) + 0.02;
    const xs = windowCenters(w - 0.6, 2.6, rng(lot.seed + 7));
    const posts = [-w / 2 + 0.06, w / 2 - 0.06];
    for (let i = 0; i < xs.length - 1; i++) posts.push((xs[i] + xs[i + 1]) / 2);
    for (const px of posts) m.box(0.13, H - yc0, 0.05, px, yc0, zf, { mat: 'woodDark', collide: false, faces: { nz: false, bottom: false } });
    for (let k = kc; k < nF; k++) {
      const yy = fh0 + (k - 1) * fh;
      m.box(w, 0.13, 0.05, 0, yy, zf, { mat: 'woodDark', collide: false, faces: { nz: false } });
      m.box(w, 0.1, 0.05, 0, yy + 0.8, zf, { mat: 'woodDark', collide: false, faces: { nz: false } });
      m.box(w, 0.1, 0.05, 0, yy + fh - 0.75, zf, { mat: 'woodDark', collide: false, faces: { nz: false } });
    }
  }

  // =================== TELHADO ===================
  const zB = -d;
  const zF = jd > 0 && jFrom <= nF - 1 ? jd : 0;
  const depth = zF - zB;
  const zc = (zF + zB) / 2;
  const pitch = 0.22 + r() * 0.08;
  if (roofType === 'eaves') {
    m.push(0, 0, zc, Math.PI / 2);
    gableRoof(m, depth, w, 0, H, 0, { pitch, overhang: 0.55, overhangEnds: 0.12, mat: 'roofTile', gableMat: null });
    m.pop();
    const rise = (depth / 2) * pitch;
    m.tri([w / 2, H, zF], [w / 2, H, zB], [w / 2, H + rise, zc], { mat: 'plaster', color: tint });
    m.tri([-w / 2, H, zB], [-w / 2, H, zF], [-w / 2, H + rise, zc], { mat: 'plaster', color: tint });
  } else if (roofType === 'gable') {
    gableRoof(m, w, depth, 0, H, zc, { pitch, overhang: 0.45, overhangEnds: 0.4, mat: 'roofTile', gableMat: null });
    const rise = (w / 2) * pitch;
    m.tri([-w / 2, H, zF], [w / 2, H, zF], [0, H + rise, zF], { mat: 'plaster', color: tint });
    m.tri([w / 2, H, zB], [-w / 2, H, zB], [0, H + rise, zB], { mat: 'plaster', color: tint });
    // pequena janela de sótão no frontão
    if (w > 7 && level >= 2) faceQuad(m, 'front', zF + 0.012, -0.3, 0.3, H + 0.25, H + 0.75, { mat: 'plaster', color: DARK });
  } else if (roofType === 'hip') {
    hipRoof(m, w, depth, 0, H, zc, { pitch: pitch + 0.04, overhang: 0.5 });
  } else {
    // uma água, caindo para a rua (alta no fundo)
    m.push(0, 0, zc, -Math.PI / 2);
    shedRoof(m, depth, w, 0, H, 0, { pitch: 0.16, overhang: 0.5 });
    m.pop();
    const rise = depth * 0.16;
    m.tri([w / 2, H, zF], [w / 2, H, zB], [w / 2, H + rise, zB], { mat: 'plaster', color: tint });
    m.tri([-w / 2, H, zB], [-w / 2, H, zF], [-w / 2, H + rise, zB], { mat: 'plaster', color: tint });
    m.quad([w / 2, H, zB], [-w / 2, H, zB], [-w / 2, H + rise, zB], [w / 2, H + rise, zB], { mat: 'plaster', color: tint });
  }

  // =================== DETALHES DO TÉRREO (lojas) ===================
  if (det) {
    for (const q of bays) {
      const zf = 0;
      if (q.type === 'door') {
        // folha da porta da escada: entreaberta ou fechada
        if (r() < 0.6) det.box(q.ow * 0.95, q.oh - 0.05, 0.06, q.cx, q.sy, -rec + 0.1, { mat: 'woodDark', collide: true, faces: noBottom });
        else det.box(0.06, q.oh - 0.05, q.ow * 0.9, q.cx - q.ow / 2 + 0.05, q.sy, -rec + 0.5, { mat: 'woodDark', collide: false, faces: noBottom });
        continue;
      }
      if (q.enterable) continue;
      const st = r();
      if (st < 0.28) {
        // loja fechada com tábuas verticais (encaixadas num trilho da soleira — HIPÓTESE, nota 07 §4)
        const nb = Math.max(4, Math.round(q.ow / 0.3));
        for (let i = 0; i < nb; i++) det.box(q.ow / nb - 0.015, q.oh - 0.04, 0.05, q.cx - q.ow / 2 + (q.ow / nb) * (i + 0.5), q.sy, -rec + 0.1, { mat: i % 3 === 0 ? 'woodDark' : 'wood', collide: false, faces: noBottom });
      } else if (st < 0.42) {
        // meio fechada: tábuas empilhadas encostadas ao lado
        const half = q.ow * 0.5;
        const nb = Math.max(3, Math.round(half / 0.3));
        for (let i = 0; i < nb; i++) det.box(half / nb - 0.015, q.oh - 0.04, 0.05, q.cx - q.ow / 2 + (half / nb) * (i + 0.5), q.sy, -rec + 0.1, { mat: 'wood', collide: false, faces: noBottom });
      } else {
        // aberta: balcão de alvenaria rebocado num dos lados (HIPÓTESE com paralelos pompeianos, nota 07 §4)
        if (r() < 0.6) {
          const cw = Math.min(q.ow * 0.5, 1.6);
          const side = r() < 0.5 ? -1 : 1;
          det.box(cw, 0.95, 0.55, q.cx + side * (q.ow / 2 - cw / 2 - 0.05), q.sy, -rec + 0.3, { mat: 'plaster', color: pick(['#e3d7c0', '#c58f62', '#d9c9a8'], r), collide: true, faces: noBottom });
          det.box(cw + 0.06, 0.06, 0.62, q.cx + side * (q.ow / 2 - cw / 2 - 0.05), q.sy + 0.95, -rec + 0.3, { mat: 'tufa', collide: false, color: '#d8cfba' });
        }
      }
    }
  }

  return { bays, H, fh0, fh, nF, jd, jFrom, tint, groundMat, groundColor, rec, balcony, roofType };
}

/* ------------------------------------------------------------------------- */
/*  Casario de fundo (variantes instanciadas)                                */
/* ------------------------------------------------------------------------- */

/**
 * Geometrias de uma variante de fundo: corpo (reboco com janelas escuras e barra do térreo
 * embutidas como cor de vértice) e telhado. Base em y = 0, fundação até y = −6.
 * @returns {{ body: THREE.BufferGeometry, roof: THREE.BufferGeometry }}
 */
export function bgVariantGeometry(V, seed = 1) {
  const r = rng(seed);
  const fh0 = 3.8;
  const fh = 3.0;
  const H = fh0 + (V.floors - 1) * fh;
  const parts = [];
  const add = (g, color, m) => {
    if (m) g.applyMatrix4(m);
    parts.push(G.normalizeGeometry(g, color));
  };
  const T = (x, y, z) => new THREE.Matrix4().makeTranslation(x, y, z);
  // corpo
  add(G.box(V.w, H + 6, V.d, { faces: { bottom: false } }), '#ffffff', T(0, -6, 0));
  // barra do térreo (ligeiramente à frente das faces)
  const bandCol = '#b98a6a';
  add(G.box(V.w + 0.04, fh0 + 6, V.d + 0.04, { faces: { bottom: false, top: false } }), bandCol, T(0, -6, 0));
  // janelas escuras em todas as faces (quads levemente à frente)
  const win = (face, c, u, y, ww, wh) => {
    let g;
    if (face === 'pz') g = G.quad([u - ww / 2, y, c], [u + ww / 2, y, c], [u + ww / 2, y + wh, c], [u - ww / 2, y + wh, c]);
    else if (face === 'nz') g = G.quad([u + ww / 2, y, c], [u - ww / 2, y, c], [u - ww / 2, y + wh, c], [u + ww / 2, y + wh, c]);
    else if (face === 'px') g = G.quad([c, y, u + ww / 2], [c, y, u - ww / 2], [c, y + wh, u - ww / 2], [c, y + wh, u + ww / 2]);
    else g = G.quad([c, y, u - ww / 2], [c, y, u + ww / 2], [c, y + wh, u + ww / 2], [c, y + wh, u - ww / 2]);
    add(g, DARK);
  };
  for (let k = 1; k < V.floors; k++) {
    const y = fh0 + (k - 1) * fh + 0.9;
    const wh = k === 1 ? 1.05 : 0.85;
    for (const [face, len, c] of [['pz', V.w, V.d / 2 + 0.03], ['nz', V.w, -V.d / 2 - 0.03], ['px', V.d, V.w / 2 + 0.03], ['nx', V.d, -V.w / 2 - 0.03]]) {
      const n = Math.max(1, Math.round(len / 2.8));
      for (let i = 0; i < n; i++) {
        if (r() < 0.3) continue;
        win(face, c, -len / 2 + ((i + 0.5) * len) / n, y, 0.72, wh);
      }
    }
  }
  // vãos de loja no térreo (frente)
  const ns = Math.max(1, Math.floor(V.w / 3.6));
  for (let i = 0; i < ns; i++) win('pz', V.d / 2 + 0.05, -V.w / 2 + ((i + 0.5) * V.w) / ns, 0, Math.min(2.6, V.w / ns - 0.9), 2.6);
  // telhado
  const roofParts = [];
  const pitch = 0.26;
  const W = V.w / 2 + 0.45;
  const L = V.d / 2 + 0.45;
  const yE = H - 0.45 * pitch;
  const rq = (a, b2, c, d2) => roofParts.push(G.normalizeGeometry(G.quad(a, b2, c, d2)));
  const rt = (a, b2, c) => roofParts.push(G.normalizeGeometry(G.triangle(a, b2, c)));
  if (V.roof === 'hip') {
    const rise = (Math.min(V.w, V.d) / 2) * pitch;
    const ridge = H + rise;
    const rz = Math.max(0, L - W);
    const rx = Math.max(0, W - L);
    rq([-W, yE, L], [W, yE, L], [rx, ridge, rz], [-rx, ridge, rz]);
    rq([W, yE, -L], [-W, yE, -L], [-rx, ridge, -rz], [rx, ridge, -rz]);
    rq([W, yE, L], [W, yE, -L], [rx, ridge, -rz], [rx, ridge, rz]);
    rq([-W, yE, -L], [-W, yE, L], [-rx, ridge, rz], [-rx, ridge, -rz]);
  } else {
    // duas águas com cumeeira ao longo de Z
    const rise = (V.w / 2) * pitch;
    const ridge = H + rise;
    rq([W, yE, L], [W, yE, -L], [0, ridge, -L], [0, ridge, L]);
    rq([-W, yE, -L], [-W, yE, L], [0, ridge, L], [0, ridge, -L]);
    // tímpanos (cor do reboco) — vão no corpo
    const hw = V.w / 2;
    const tb = [];
    tb.push(G.normalizeGeometry(G.triangle([-hw, H, V.d / 2], [hw, H, V.d / 2], [0, ridge - 0.05, V.d / 2])));
    tb.push(G.normalizeGeometry(G.triangle([hw, H, -V.d / 2], [-hw, H, -V.d / 2], [0, ridge - 0.05, -V.d / 2])));
    parts.push(...tb);
  }
  const roof = G.merge(roofParts);
  return { body: G.merge(parts), roof, H };
}
