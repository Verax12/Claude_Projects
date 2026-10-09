/**
 * Edifícios genéricos: pórticos, basílicas, insulae (prédios de apartamentos),
 * casas simples, tabernae (lojas), muros e escadarias urbanas.
 *
 * Todos operam no quadro local atual do Builder (fachada principal → +Z local).
 */
import { column, entablature, arch } from './columns.js';
import { gableRoof, shedRoof, hipRoof } from './roofs.js';
import { mulberry32 } from '../render/noise.js';

/**
 * Pórtico: fileira de colunas com cobertura de uma água encostada a um muro de fundo.
 * Corre ao longo de X local (de x0 a x1); a frente das colunas fica em z = 0 e o muro em z = -depth.
 * @param {object} o { depth, columns (nº), order, columnHeight, columnDiameter, colMat, wallMat,
 *   backWall (true), roofMat, floorMat, y }
 */
export function portico(b, x0, x1, o = {}) {
  const depth = o.depth ?? 6;
  const y = o.y ?? 0;
  const Hc = o.columnHeight ?? 6;
  const D = o.columnDiameter ?? Hc / 8;
  const L = x1 - x0;
  const n = o.columns ?? Math.max(2, Math.round(L / (D * 4.5)) + 1);
  for (let i = 0; i < n; i++) {
    const x = x0 + (L * i) / (n - 1);
    column(b, x, y, 0, { order: o.order || 'tuscan', height: Hc, diameter: D, mat: o.colMat || 'stucco', fluted: o.fluted });
  }
  const entH = Hc * 0.18;
  entablature(b, x0 - D * 0.6, x1 + D * 0.6, 0, D * 1.05, y + Hc, { mat: o.entMat || o.colMat || 'stucco', colH: Hc, height: entH, dentils: false });
  if (o.backWall !== false) b.box(L + D * 1.2, Hc + entH + 0.6, 0.7, (x0 + x1) / 2, y, -depth, { mat: o.wallMat || 'tufa' });
  // cobertura: água única do muro (mais alto) para as colunas
  b.push((x0 + x1) / 2, 0, -depth / 2, -Math.PI / 2);
  shedRoof(b, depth, L + D * 1.2, 0, y + Hc + entH, 0, { pitch: 0.18, overhang: 0.5, mat: o.roofMat || 'roofTile' });
  b.pop();
  if (o.floorMat) b.floor(L + D, depth, (x0 + x1) / 2, y + 0.04, -depth / 2, { mat: o.floorMat, collide: false });
  return { n, height: Hc + entH };
}

/**
 * Basílica (salão coberto com nave central e naves laterais, eventualmente com galeria).
 * Planta retangular w (X, fachada longa voltada para +Z) × d (Z).
 * @param {object} o {
 *   naveWidth, aisles (1|2), y, height (altura das colunas do térreo), order, colMat, wallMat,
 *   gallery (true = segundo pavimento de colunas sobre as naves laterais), clerestory (true),
 *   facade: 'open' (arcada/colunata aberta) | 'tabernae' (fileira de lojas na fachada +Z) | 'wall',
 *   bays (nº de vãos ao longo de X), floorMat, roofMat, piers (true = pilares em vez de colunas na fachada),
 *   steps (degraus na fachada: altura total)
 * }
 */
export function basilica(b, w, d, o = {}) {
  const y = o.y ?? 0;
  const H1 = o.height ?? 9;
  const D = o.columnDiameter ?? H1 / 9;
  const aisles = o.aisles ?? 1;
  const naveW = o.naveWidth ?? d * 0.45;
  const aisleW = (d - naveW) / (2 * aisles);
  const bays = o.bays ?? Math.max(4, Math.round(w / 5));
  const colMat = o.colMat || 'stucco';
  const wallMat = o.wallMat || 'tufa';
  const order = o.order || 'tuscan';
  const stepH = o.steps ?? 0;
  const yf = y + stepH;
  if (stepH > 0) {
    b.box(w + 2, stepH, d + 2, 0, y - 1, 0, { mat: o.stepMat || 'travertine', collide: true });
    b.stairs(w * 0.9, stepH * 3, stepH, 0, y, d / 2 + 1 + stepH * 3, { mat: o.stepMat || 'travertine' });
  }
  b.floor(w, d, 0, yf + 0.03, 0, { mat: o.floorMat || 'slabs', collide: false });
  const colOpts = { order, height: H1, diameter: D, mat: colMat, fluted: o.fluted };
  // fileiras internas de colunas (paralelas a X)
  const rowsZ = [];
  for (let a = 1; a <= aisles; a++) {
    rowsZ.push(d / 2 - aisleW * a);
    rowsZ.push(-d / 2 + aisleW * a);
  }
  const xs = [];
  for (let i = 0; i <= bays; i++) xs.push(-w / 2 + aisleW + ((w - 2 * aisleW) * i) / bays);
  for (const zr of rowsZ) for (const x of xs) column(b, x, yf, zr, colOpts);
  // fachada
  const facade = o.facade || 'open';
  const outerH = o.gallery ? H1 * 1.85 : H1 * 1.15;
  if (facade === 'open') {
    // arcada / colunata aberta na fachada +Z e nas laterais
    const nb = bays + 2;
    for (let i = 0; i <= nb; i++) {
      const x = -w / 2 + (w * i) / nb;
      if (o.piers) b.box(D * 1.4, H1, D * 1.4, x, yf, d / 2 - D * 0.7, { mat: wallMat });
      else column(b, x, yf, d / 2 - D * 0.7, colOpts);
    }
    entablature(b, -w / 2 - D, w / 2 + D, d / 2 - D * 0.7, D * 1.3, yf + H1, { mat: o.entMat || colMat, colH: H1, height: H1 * 0.16, dentils: false });
    b.box(w, outerH, 0.8, 0, yf, -d / 2 + 0.4, { mat: wallMat }); // fundo fechado
  } else if (facade === 'tabernae') {
    // muro de fundo das lojas e lojas abertas para a frente
    const n = o.tabernae ?? bays;
    const tw = w / n;
    const td = o.tabernaDepth ?? 5;
    for (let i = 0; i < n; i++) {
      const cx = -w / 2 + tw * (i + 0.5);
      taberna(b, cx, yf, d / 2 + td / 2, tw, td, 4, { wallMat, rnd: i });
    }
    // muro entre as lojas e o salão, com passagens para o interior
    b.wall(-w / 2, w / 2, d / 2 - 0.4, outerH, 0.8, { y: yf, mat: wallMat, openings: [{ at: w * 0.25, w: 3, h: 4.5 }, { at: w * 0.75, w: 3, h: 4.5 }] });
    b.box(w, outerH, 0.8, 0, yf, -d / 2 + 0.4, { mat: wallMat });
  } else {
    b.wall(-w / 2, w / 2, d / 2 - 0.4, outerH, 0.8, { y: yf, mat: wallMat, openings: [{ at: w / 2, w: 4, h: 5 }] });
    b.box(w, outerH, 0.8, 0, yf, -d / 2 + 0.4, { mat: wallMat });
  }
  // laterais (paredes nas extremidades ±X com uma abertura central)
  for (const s of [-1, 1]) {
    b.push(s * (w / 2 - 0.4), 0, 0, Math.PI / 2);
    b.wall(-d / 2, d / 2, 0, outerH, 0.8, { y: yf, mat: wallMat, openings: [{ at: d / 2, w: Math.min(6, naveW * 0.5), h: H1 * 0.8 }] });
    b.pop();
  }
  // galeria superior
  let topY = yf + H1 + H1 * 0.16;
  if (o.gallery) {
    // piso da galeria sobre as naves laterais
    for (const s of [-1, 1]) b.box(w, 0.4, aisleW * aisles, 0, topY, s * (d / 2 - (aisleW * aisles) / 2), { mat: 'woodDark', collide: false });
    const H2 = H1 * 0.75;
    for (const zr of rowsZ.slice(0, 2)) for (const x of xs) column(b, x, topY, zr, { ...colOpts, height: H2, diameter: D * 0.8, order: order === 'tuscan' ? 'ionic' : order });
    topY += H2;
  }
  // clerestório e telhados
  const naveTop = topY + (o.clerestory !== false ? H1 * 0.35 : 0);
  if (o.clerestory !== false) {
    for (const s of [-1, 1]) {
      const z = s * (naveW / 2);
      b.wall(-w / 2 + aisleW, w / 2 - aisleW, z, naveTop - topY, 0.5, {
        y: topY,
        mat: wallMat,
        openings: xs.slice(0, -1).map((x, i) => ({ at: (xs[i] + xs[i + 1]) / 2 - xs[0], w: 1.4, h: (naveTop - topY) * 0.55, y: (naveTop - topY) * 0.2 })),
      });
    }
  }
  // nave: duas águas com cumeeira ao longo de X (gira o telhado 90°)
  b.push(0, 0, 0, Math.PI / 2);
  gableRoof(b, naveW + 1, w - aisleW * 2 + 1, 0, naveTop, 0, { pitch: 0.25, overhang: 0.4, mat: o.roofMat || 'roofTile', gableMat: wallMat });
  b.pop();
  // naves laterais: uma água
  for (const s of [-1, 1]) {
    const zc = s * (naveW / 2 + (aisleW * aisles) / 2);
    b.push(0, 0, zc, s > 0 ? -Math.PI / 2 : Math.PI / 2);
    shedRoof(b, aisleW * aisles + 0.6, w + 0.6, 0, Math.max(yf + outerH, topY - 0.2), 0, { pitch: 0.15, overhang: 0.4, mat: o.roofMat || 'roofTile' });
    b.pop();
  }
  return { floorY: yf, topY: naveTop };
}

/**
 * Taberna (loja) aberta para +Z: cômodo de w × d com abertura larga na frente, mezanino
 * de madeira (pergula) opcional, balcão e prateleiras.
 */
export function taberna(b, x, y, z, w, d, h, o = {}) {
  const wallMat = o.wallMat || 'opusIncertum';
  b.push(x, y, z);
  b.box(w, h, 0.4, 0, 0, -d / 2 + 0.2, { mat: wallMat }); // fundo
  for (const s of [-1, 1]) b.box(0.4, h, d, s * (w / 2 - 0.2), 0, 0, { mat: wallMat });
  // verga sobre a abertura
  b.box(w, 0.6, 0.45, 0, h - 0.6, d / 2 - 0.22, { mat: o.lintelMat || 'woodDark', collide: false });
  b.box(w, 0.25, d, 0, h, 0, { mat: 'woodDark', collide: false }); // teto/mezanino
  b.floor(w - 0.8, d - 0.4, 0, 0.04, 0, { mat: o.floorMat || 'dirt', collide: false });
  if (o.counter !== false) {
    // balcão de alvenaria na frente (meia largura) — típico das lojas romanas
    b.box(w * 0.45, 0.95, 0.6, -w * 0.2, 0, d / 2 - 0.9, { mat: o.counterMat || 'opusIncertum' });
  }
  b.pop();
}

/**
 * Insula (prédio de vários pavimentos) visto de fora: térreo com tabernae, pavimentos
 * superiores com janelas pequenas e sacadas de madeira (maeniana) opcionais.
 * Bloco sólido para colisão (não é possível entrar — a insula visitável é modelada à parte).
 * @param {object} o { floors, floorH, color (tinta do reboco), shops (true), balconies (prob. 0–1),
 *   roof: 'gable'|'hip'|'shed', seed, wallMat ('plaster'), groundMat ('opusIncertum') }
 */
export function insula(b, w, d, x, y, z, o = {}) {
  const floors = o.floors ?? 4;
  const fh = o.floorH ?? 3.0;
  const H = floors * fh;
  const rnd = mulberry32(o.seed ?? 1);
  const color = o.color ?? '#e8dfcf';
  const groundMat = o.groundMat || 'opusIncertum';
  const wallMat = o.wallMat || 'plaster';
  b.push(x, y, z, o.rotY || 0);
  // fundação + térreo
  b.box(w, fh + 1.5, d, 0, -1.5, 0, { mat: groundMat });
  // pavimentos superiores (reboco tingido)
  b.box(w, H - fh, d, 0, fh, 0, { mat: wallMat, color });
  // faixa/cornija entre o térreo e o primeiro andar
  b.box(w + 0.15, 0.25, d + 0.15, 0, fh - 0.05, 0, { mat: 'woodDark', collide: false });
  // fachadas: aberturas falsas (painéis escuros recuados) para lojas e janelas
  const dark = '#2a221b';
  const faces = [
    { len: w, nz: d / 2, rot: 0 },
    { len: w, nz: d / 2, rot: Math.PI },
    { len: d, nz: w / 2, rot: Math.PI / 2 },
    { len: d, nz: w / 2, rot: -Math.PI / 2 },
  ];
  for (const f of faces) {
    b.push(0, 0, 0, f.rot);
    // térreo: portas de lojas (arcos/vergas de madeira com fundo escuro)
    if (o.shops !== false) {
      const nShops = Math.max(1, Math.floor(f.len / 4.2));
      const sw = f.len / nShops;
      for (let i = 0; i < nShops; i++) {
        const cx = -f.len / 2 + sw * (i + 0.5);
        if (rnd() < 0.85) {
          b.box(sw * 0.62, fh * 0.75, 0.05, cx, 0.05, f.nz + 0.01, { mat: 'flat', color: dark, collide: false });
          b.box(sw * 0.7, 0.22, 0.12, cx, fh * 0.78, f.nz + 0.04, { mat: 'woodDark', collide: false });
          // persianas de madeira parcialmente abertas
          if (rnd() < 0.3) b.box(sw * 0.3, fh * 0.7, 0.06, cx - sw * 0.16, 0.05, f.nz + 0.06, { mat: 'wood', collide: false });
        }
      }
    }
    // janelas dos pavimentos superiores
    for (let fl = 1; fl < floors; fl++) {
      const nWin = Math.max(1, Math.floor(f.len / 3));
      const ww = f.len / nWin;
      const winH = fl === 1 ? 1.2 : 0.9;
      for (let i = 0; i < nWin; i++) {
        if (rnd() < 0.25) continue;
        const cx = -f.len / 2 + ww * (i + 0.5);
        const wy = fl * fh + 1.0;
        b.box(0.8, winH, 0.04, cx, wy, f.nz + 0.01, { mat: 'flat', color: dark, collide: false });
        if (rnd() < 0.5) b.box(0.42, winH, 0.05, cx - 0.62, wy, f.nz + 0.03, { mat: 'wood', collide: false }); // folha da janela aberta
      }
      // sacada de madeira (maenianum)
      if (rnd() < (o.balconies ?? 0.35)) {
        const bw = Math.min(f.len * 0.6, 6 + rnd() * 6);
        const bx = (rnd() - 0.5) * (f.len - bw);
        b.box(bw, 0.18, 1.1, bx, fl * fh, f.nz + 0.55, { mat: 'wood', collide: false });
        b.box(bw, 0.9, 0.06, bx, fl * fh + 0.18, f.nz + 1.07, { mat: 'woodDark', collide: false });
        for (let k = 0; k <= Math.floor(bw / 1.5); k++) b.box(0.12, 0.12, 1.0, bx - bw / 2 + k * 1.5, fl * fh - 0.25, f.nz + 0.5, { mat: 'woodDark', collide: false });
      }
    }
    b.pop();
  }
  // telhado
  const roof = o.roof || (rnd() < 0.6 ? 'gable' : 'hip');
  if (roof === 'gable') gableRoof(b, w, d, 0, H, 0, { pitch: 0.22, overhang: 0.45, overhangEnds: 0.3, mat: 'roofTile', gableMat: wallMat });
  else if (roof === 'hip') hipRoof(b, w, d, 0, H, 0, { pitch: 0.25, overhang: 0.45 });
  else shedRoof(b, w, d, 0, H, 0, { pitch: 0.12 });
  b.pop();
  return { height: H };
}

/**
 * Casa simples / domus vista de fora (muros quase cegos, poucas janelas altas, telhado de telhas
 * com compluvium escuro). Para áreas de preenchimento (ex.: encostas do Palatino).
 */
export function houseBlock(b, w, d, x, y, z, o = {}) {
  const h = o.height ?? 6;
  b.push(x, y, z, o.rotY || 0);
  b.box(w, h + 2, d, 0, -2, 0, { mat: o.wallMat || 'plaster', color: o.color ?? '#e6dccb' });
  b.box(w + 0.12, 0.9, d + 0.12, 0, -0.4, 0, { mat: 'opusIncertum', collide: false }); // embasamento
  // porta principal
  b.box(1.8, 3, 0.05, 0, 0, d / 2 + 0.01, { mat: 'woodDark', collide: false });
  hipRoof(b, w, d, 0, h, 0, { pitch: 0.3, overhang: 0.5 });
  // abertura do compluvium (marca escura no topo)
  if (w > 10 && d > 10) b.box(Math.min(4, w * 0.25), 0.05, Math.min(4, d * 0.25), 0, h + Math.min(w, d) * 0.15 * 0.5, 0, { mat: 'flat', color: '#3a3028', collide: false });
  b.pop();
}

/** Muro reto entre dois pontos (com coroamento) — ex.: muro de recinto, Muralha Serviana. */
export function wallLine(b, xa, za, xb, zb, h, t, o = {}) {
  b.wallAB(xa, za, xb, zb, h, t, { y: o.y ?? 0, mat: o.mat || 'tufa', openings: o.openings });
  if (o.coping !== false) {
    const len = Math.hypot(xb - xa, zb - za);
    const ang = Math.atan2(-(zb - za), xb - xa);
    b.push((xa + xb) / 2, 0, (za + zb) / 2, ang);
    b.box(len, 0.3, t + 0.2, 0, (o.y ?? 0) + h, 0, { mat: o.copingMat || o.mat || 'tufa', collide: false });
    b.pop();
  }
}

export { arch };
