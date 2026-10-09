/**
 * Texturas procedurais (geradas em <canvas> no navegador, sem arquivos externos).
 *
 * Cada gerador produz um mapa de cor (sRGB) e, opcionalmente, um mapa de normais
 * derivado de um campo de altura. As texturas são tileáveis (repetem sem emendas).
 *
 * As cores procuram reproduzir os materiais da Roma tardo-republicana:
 * tufos amarelo-acinzentados, peperino cinzento, travertino creme, mármore branco
 * (ainda raro), estuque branco sobre tufo, telhas de terracota, basalto das ruas,
 * opus incertum / quasi reticulatum e rebocos pintados.
 */
import * as THREE from 'three';
import { fbm, valueNoise, worley, hashId, mulberry32 } from './noise.js';

const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const mix = (a, b, t) => a + (b - a) * t;

/** Converte '#rrggbb' em [r,g,b] 0–255. */
export function hexToRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

/**
 * Gera uma textura pixel a pixel.
 * @param {number} size  resolução (quadrada)
 * @param {(u:number,v:number)=>{c:number[], h?:number}} fn  função por pixel: cor RGB 0–255 e altura 0–1
 * @param {object} opts  { normal: boolean, normalStrength: number }
 * @returns {{map: THREE.Texture, normalMap?: THREE.Texture}}
 */
export function pixelTexture(size, fn, opts = {}) {
  const canvas = makeCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(size, size);
  const heights = opts.normal ? new Float32Array(size * size) : null;
  for (let y = 0; y < size; y++) {
    const v = y / size;
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const r = fn(u, v);
      const i = (y * size + x) * 4;
      img.data[i] = r.c[0];
      img.data[i + 1] = r.c[1];
      img.data[i + 2] = r.c[2];
      img.data[i + 3] = 255;
      if (heights) heights[y * size + x] = r.h ?? 0.5;
    }
  }
  ctx.putImageData(img, 0, 0);
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  const out = { map };
  if (heights) out.normalMap = normalFromHeights(heights, size, opts.normalStrength ?? 2);
  return out;
}

/** Converte um campo de altura (tileável) em mapa de normais tangente. */
export function normalFromHeights(h, size, strength = 2) {
  const canvas = makeCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const xl = (x - 1 + size) % size;
      const xr = (x + 1) % size;
      const yu = (y - 1 + size) % size;
      const yd = (y + 1) % size;
      const dx = (h[y * size + xr] - h[y * size + xl]) * strength;
      const dy = (h[yd * size + x] - h[yu * size + x]) * strength;
      // y da textura cresce para baixo; a convenção OpenGL do three.js usa +V para cima
      let nx = -dx;
      let ny = dy;
      let nz = 1;
      const len = Math.hypot(nx, ny, nz);
      nx /= len;
      ny /= len;
      nz /= len;
      const i = (y * size + x) * 4;
      img.data[i] = (nx * 0.5 + 0.5) * 255;
      img.data[i + 1] = (ny * 0.5 + 0.5) * 255;
      img.data[i + 2] = (nz * 0.5 + 0.5) * 255;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.NoColorSpace;
  return t;
}

/** Aplica variação de cor a uma base RGB. */
function tint(base, k, varAmt = 1) {
  return [
    clamp01((base[0] / 255) * (1 + (k - 0.5) * 0.35 * varAmt)) * 255,
    clamp01((base[1] / 255) * (1 + (k - 0.5) * 0.35 * varAmt)) * 255,
    clamp01((base[2] / 255) * (1 + (k - 0.5) * 0.35 * varAmt)) * 255,
  ];
}

/* ------------------------------------------------------------------------- */
/*  Alvenaria de blocos (opus quadratum) — tufo, peperino, travertino        */
/* ------------------------------------------------------------------------- */

/**
 * Blocos retangulares em aparelho alternado (juntas desencontradas).
 * A textura representa `rows` fiadas na altura e cada fiada tem `perRow` blocos
 * (com pequenas variações de comprimento).
 */
export function ashlarTexture(size, { base, rows = 4, perRow = 2, joint = 0.012, seed = 1, pores = 0.0, streaks = 0.0, jointColor = null }) {
  const b = hexToRgb(base);
  const jc = jointColor ? hexToRgb(jointColor) : b.map((x) => x * 0.6);
  const rnd = mulberry32(seed);
  // pré-calcula as posições das juntas verticais de cada fiada (tileáveis)
  const rowSplits = [];
  for (let r = 0; r < rows; r++) {
    const off = (r % 2) * (0.5 / perRow) + (rnd() - 0.5) * 0.08 / perRow;
    const splits = [];
    for (let k = 0; k < perRow; k++) splits.push((((k + 0.5) / perRow + off + (rnd() - 0.5) * 0.25 / perRow) % 1 + 1) % 1);
    splits.sort((a, c) => a - c);
    rowSplits.push(splits);
  }
  return pixelTexture(
    size,
    (u, v) => {
      const rf = v * rows;
      const row = Math.floor(rf);
      const fv = rf - row;
      const splits = rowSplits[row];
      // bloco atual e distância à junta vertical mais próxima
      let blk = 0;
      let du = 1;
      for (let k = 0; k < splits.length; k++) {
        let d = Math.abs(u - splits[k]);
        d = Math.min(d, 1 - d);
        if (d < du) du = d;
        if (u >= splits[k]) blk = k + 1;
      }
      const blockId = row * 31 + (blk % splits.length);
      const dv = Math.min(fv, 1 - fv) / rows;
      const dist = Math.min(du * 1.0, dv);
      const jw = joint;
      const n = fbm(u, v, 8, 5, seed + 3);
      const blockTone = hashId(blockId, seed);
      let c = tint(b, mix(n, blockTone, 0.45));
      if (streaks > 0) {
        const s = valueNoise(u * 0.5, v, 64, seed + 9);
        c = c.map((x) => x * (1 - streaks * (s - 0.5) * 0.6));
      }
      if (pores > 0) {
        const p = valueNoise(u, v, 160, seed + 11);
        if (p > 1 - pores) c = c.map((x) => x * 0.55);
      }
      let h = 0.75 + (n - 0.5) * 0.15;
      if (dist < jw) {
        c = jc.map((x, i) => mix(x, c[i], dist / jw * 0.5));
        h = 0.3 + (dist / jw) * 0.3;
      } else if (dist < jw * 2.2) {
        h -= (1 - (dist - jw) / (jw * 1.2)) * 0.25; // chanfro suave na aresta
      }
      return { c, h };
    },
    { normal: true, normalStrength: 3 },
  );
}

/* ------------------------------------------------------------------------- */
/*  Superfícies lisas com ruído: mármore, estuque, reboco                    */
/* ------------------------------------------------------------------------- */

export function marbleTexture(size, { base = '#ece8df', vein = '#9a978f', seed = 3, veinAmt = 0.5 }) {
  const b = hexToRgb(base);
  const vc = hexToRgb(vein);
  return pixelTexture(size, (u, v) => {
    const n = fbm(u, v, 3, 6, seed);
    const w = Math.abs(Math.sin((u * 2 + v * 1 + n * 3.2) * Math.PI * 2));
    const veinK = Math.pow(1 - w, 14) * veinAmt;
    const fine = fbm(u, v, 32, 2, seed + 5);
    const c = b.map((x, i) => mix(x * (0.96 + fine * 0.06), vc[i], veinK));
    return { c };
  });
}

export function plasterTexture(size, { base = '#e2dccd', seed = 5, dirt = 0.35, roughness = 1 }) {
  const b = hexToRgb(base);
  return pixelTexture(
    size,
    (u, v) => {
      const n = fbm(u, v, 4, 5, seed);
      const fine = valueNoise(u, v, 128, seed + 1);
      const stain = Math.pow(fbm(u, v, 2, 4, seed + 7), 2.2) * dirt;
      const k = 1 - stain * 0.5 + (n - 0.5) * 0.12 + (fine - 0.5) * 0.05 * roughness;
      return { c: b.map((x) => clamp01((x / 255) * k) * 255), h: 0.5 + (n - 0.5) * 0.3 + (fine - 0.5) * 0.15 * roughness };
    },
    { normal: true, normalStrength: 1.2 },
  );
}

/* ------------------------------------------------------------------------- */
/*  Telhado de telhas (tegulae planas + imbrices semicirculares)            */
/* ------------------------------------------------------------------------- */

/**
 * U = ao longo do beiral (horizontal), V = ao longo da água do telhado.
 * A textura cobre `cols` fileiras de imbrices e `rows` fiadas de telhas.
 */
export function roofTileTexture(size, { cols = 4, rows = 4, seed = 7, base = '#b5643c' }) {
  const b = hexToRgb(base);
  return pixelTexture(
    size,
    (u, v) => {
      const cu = u * cols;
      const col = Math.floor(cu);
      const fu = cu - col; // 0..1 dentro da largura de uma tegula
      const rv = v * rows;
      const row = Math.floor(rv);
      const fv = rv - row;
      const id = row * 13 + col;
      const tone = hashId(id, seed);
      const n = fbm(u, v, 8, 4, seed);
      // imbrex centrado em fu = 0 (junta entre duas tegulae)
      const dImb = Math.min(fu, 1 - fu);
      const imbW = 0.2;
      let h;
      let k;
      if (dImb < imbW) {
        const t = dImb / imbW;
        h = 0.55 + Math.sqrt(1 - t * t) * 0.45 - fv * 0.05;
        k = 0.92 + (1 - t) * 0.12;
      } else {
        // tegula plana com leve degrau na sobreposição das fiadas
        h = 0.35 - fv * 0.12;
        k = 0.85 + fv * 0.1;
        if (fv > 0.94) k *= 0.6; // sombra da fiada superior
      }
      const warm = tone - 0.5;
      const c = [
        clamp01((b[0] / 255) * (k + warm * 0.25 + (n - 0.5) * 0.15)) * 255,
        clamp01((b[1] / 255) * (k + warm * 0.18 + (n - 0.5) * 0.15)) * 255,
        clamp01((b[2] / 255) * (k + warm * 0.1 + (n - 0.5) * 0.15)) * 255,
      ];
      return { c, h };
    },
    { normal: true, normalStrength: 4 },
  );
}

/* ------------------------------------------------------------------------- */
/*  Pavimentos                                                               */
/* ------------------------------------------------------------------------- */

/** Pavimento poligonal de basalto (silex) das ruas romanas. */
export function basaltPavingTexture(size, { cells = 6, seed = 11 }) {
  return pixelTexture(
    size,
    (u, v) => {
      const w = worley(u, v, cells, seed);
      const edge = w.f2 - w.f1;
      const tone = hashId(w.id, seed);
      const n = fbm(u, v, 16, 3, seed + 2);
      const g = 62 + tone * 22 + (n - 0.5) * 18;
      let c = [g, g * 0.98, g * 0.95];
      let h = 0.7 + (n - 0.5) * 0.1 - w.f1 * 0.12;
      if (edge < 0.06) {
        const t = edge / 0.06;
        c = c.map((x) => mix(48, x, t)).map((x, i) => (i === 0 ? x + 6 * (1 - t) : x));
        h = 0.25 + t * 0.4;
      }
      return { c, h };
    },
    { normal: true, normalStrength: 3 },
  );
}

/** Lajes retangulares (travertino / tufo) para praças e pódios. */
export function slabPavingTexture(size, { base = '#cfc5ab', rows = 3, perRow = 2, seed = 13 }) {
  return ashlarTexture(size, { base, rows, perRow, joint: 0.006, seed, pores: 0.02, streaks: 0.4 });
}

/** Opus incertum: pedras irregulares em argamassa (muros de concreto revestidos). */
export function opusIncertumTexture(size, { cells = 10, seed = 17, stone = '#a8977a', mortar = '#c4b99f' }) {
  const s = hexToRgb(stone);
  const m = hexToRgb(mortar);
  return pixelTexture(
    size,
    (u, v) => {
      const w = worley(u, v, cells, seed);
      const edge = w.f2 - w.f1;
      const tone = hashId(w.id, seed);
      const n = fbm(u, v, 16, 3, seed);
      if (edge < 0.12) {
        const c = m.map((x) => x * (0.9 + n * 0.15));
        return { c, h: 0.3 + n * 0.05 };
      }
      const c = tint(s, tone * 0.7 + n * 0.3, 1.4);
      return { c, h: 0.7 + (n - 0.5) * 0.2 - w.f1 * 0.15 };
    },
    { normal: true, normalStrength: 2.5 },
  );
}

/** Opus (quasi) reticulatum: rede diagonal de pequenos blocos de tufo. */
export function reticulatumTexture(size, { n = 8, seed = 19, stone = '#b09c75', mortar = '#cbbfa5', irregular = 0.15 }) {
  const s = hexToRgb(stone);
  const m = hexToRgb(mortar);
  return pixelTexture(
    size,
    (u, v) => {
      // gira 45°: coordenadas diagonais
      const a = (u + v) * n;
      const b = (u - v) * n;
      const jitter = (valueNoise(u, v, 32, seed) - 0.5) * irregular;
      const fa = a - Math.floor(a);
      const fb = b - Math.floor(b);
      const id = Math.floor(a) * 97 + Math.floor(b);
      const d = Math.min(fa, 1 - fa, fb, 1 - fb) + jitter * 0.1;
      const nn = fbm(u, v, 16, 3, seed + 1);
      if (d < 0.08) return { c: m.map((x) => x * (0.92 + nn * 0.1)), h: 0.3 };
      return { c: tint(s, hashId(id, seed) * 0.7 + nn * 0.3, 1.2), h: 0.75 - (0.5 - d) * 0.1 };
    },
    { normal: true, normalStrength: 2.5 },
  );
}

/** Chão de terra batida. */
export function dirtTexture(size, { base = '#8d7b5d', seed = 23 }) {
  const b = hexToRgb(base);
  return pixelTexture(
    size,
    (u, v) => {
      const n = fbm(u, v, 6, 5, seed);
      const pebbles = valueNoise(u, v, 96, seed + 3);
      let c = tint(b, n, 1.2);
      let h = n * 0.6;
      if (pebbles > 0.82) {
        c = c.map((x) => x * 1.15);
        h += 0.25;
      }
      return { c, h };
    },
    { normal: true, normalStrength: 1.5 },
  );
}

/** Textura de detalhe neutra (cinza) usada sobre as cores de vértice do terreno. */
export function terrainDetailTexture(size, { seed = 29 }) {
  return pixelTexture(
    size,
    (u, v) => {
      const n = fbm(u, v, 8, 5, seed);
      const blades = valueNoise(u, v, 128, seed + 1);
      const g = 222 + (n - 0.5) * 30 + (blades - 0.5) * 18;
      return { c: [g, g, g], h: n * 0.7 + blades * 0.3 };
    },
    { normal: true, normalStrength: 1.5 },
  );
}

/** Tábuas de madeira (V = ao longo das fibras). */
export function woodTexture(size, { base = '#6e4b2e', planks = 4, seed = 31 }) {
  const b = hexToRgb(base);
  return pixelTexture(
    size,
    (u, v) => {
      const pu = u * planks;
      const p = Math.floor(pu);
      const fu = pu - p;
      const tone = hashId(p, seed);
      const grain = Math.sin((v * 40 + valueNoise(u, v, 8, seed + p) * 6 + fu * 3) * Math.PI) * 0.5 + 0.5;
      let c = tint(b, tone * 0.6 + grain * 0.4, 1.3);
      let h = 0.6 + grain * 0.1;
      if (fu < 0.03 || fu > 0.97) {
        c = c.map((x) => x * 0.45);
        h = 0.2;
      }
      return { c, h };
    },
    { normal: true, normalStrength: 2 },
  );
}

/** Tecido de lã/linho com trama sutil. */
export function clothTexture(size, { base = '#e9e3d3', stripe = null, seed = 37 }) {
  const b = hexToRgb(base);
  const s = stripe ? hexToRgb(stripe) : null;
  return pixelTexture(size, (u, v) => {
    const weave = (Math.sin(u * size * 0.8) * Math.sin(v * size * 0.8)) * 0.5 + 0.5;
    const n = fbm(u, v, 6, 3, seed);
    let c = b.map((x) => x * (0.9 + weave * 0.06 + n * 0.06));
    if (s && (u % 0.25) < 0.04) c = s.map((x) => x * (0.9 + n * 0.1));
    return { c };
  });
}

/** Caneluras de coluna: U = 1 canelura por repetição; V = altura. Só normal + leve sombreamento. */
export function fluteTexture(size, { base = '#ffffff' }) {
  const b = hexToRgb(base);
  return pixelTexture(
    size,
    (u) => {
      // perfil côncavo da canelura com filete estreito entre elas
      const t = u;
      let h;
      if (t < 0.08 || t > 0.92) h = 1;
      else {
        const x = (t - 0.5) / 0.42;
        h = 1 - Math.sqrt(Math.max(0, 1 - x * x)) * 0.9;
      }
      const k = 0.88 + h * 0.12;
      return { c: b.map((x) => x * k), h };
    },
    { normal: true, normalStrength: 6 },
  );
}

/* ------------------------------------------------------------------------- */
/*  Pisos decorados e pinturas murais (UV "fit": 0–1 sobre a superfície)     */
/* ------------------------------------------------------------------------- */

/**
 * Opus signinum (cocciopesto) com tesselas brancas em reticulado de losangos,
 * piso muito comum nas casas da República tardia.
 */
export function signinumTexture(size, { base = '#a5604e', seed = 41, cells = 8 }) {
  const b = hexToRgb(base);
  return pixelTexture(size, (u, v) => {
    const n = fbm(u, v, 8, 4, seed);
    let c = tint(b, n, 1.0);
    const a = (u + v) * cells;
    const d = (u - v) * cells;
    const fa = a - Math.round(a);
    const fd = d - Math.round(d);
    // tesselas brancas espaçadas ao longo das linhas do reticulado
    const along = ((u * cells * 4) % 1) - 0.5;
    if ((Math.abs(fa) < 0.035 || Math.abs(fd) < 0.035) && Math.abs(along) < 0.3) c = [228, 222, 208];
    return { c };
  });
}

/** Mosaico de tesselas preto e branco com faixa de meandro (borda) — para pisos nobres. */
export function mosaicTexture(size, { seed = 43, border = true }) {
  return pixelTexture(size, (u, v) => {
    const tess = 96; // tesselas por lado
    const tu = Math.floor(u * tess);
    const tv = Math.floor(v * tess);
    const fu = u * tess - tu;
    const fv = v * tess - tv;
    const grout = fu < 0.12 || fv < 0.12;
    const tone = hashId(tu * 131 + tv, seed);
    let white = true;
    if (border) {
      const bu = Math.min(tu, tess - 1 - tu);
      const bv = Math.min(tv, tess - 1 - tv);
      const bd = Math.min(bu, bv);
      if (bd < 2) white = false; // filete preto externo
      else if (bd >= 4 && bd < 12) {
        // meandro simplificado (gregas) na faixa
        const s = (bu < bv ? tv : tu) % 8;
        const r = bd - 4;
        white = !((r === 0 || r === 7) || (s === 0 && r < 6) || (s === 4 && r > 1) || (r === 3 && s > 0 && s < 4));
      } else if (bd >= 12 && bd < 13) white = false;
    }
    let g = white ? 222 + tone * 20 : 30 + tone * 20;
    if (grout) g = white ? 180 : 70;
    return { c: [g, g * 0.97, g * 0.92] };
  });
}

/**
 * Pintura de parede do "I estilo" pompeiano (estilo de incrustação, c. séc. II–início do I a.C.):
 * imita em estuque pintado um revestimento de blocos de mármore coloridos — rodapé,
 * ortostatos altos, fiadas de blocos e cornija. UV 0–1 = um painel de parede.
 */
export function firstStyleTexture(size, { seed = 47, palette = ['#7a1f1a', '#c9a24a', '#2f2a26', '#8a6a9a', '#e6dcc5'] }) {
  const pal = palette.map(hexToRgb);
  const w = size;
  const h = size;
  const canvas = makeCanvas(w, h);
  const g = canvas.getContext('2d');
  const rnd = mulberry32(seed);
  const css = (rgb, k = 1) => `rgb(${rgb[0] * k | 0},${rgb[1] * k | 0},${rgb[2] * k | 0})`;
  // fundo
  g.fillStyle = css(pal[4]);
  g.fillRect(0, 0, w, h);
  // rodapé (dado) escuro
  const dadoH = h * 0.14;
  g.fillStyle = css(pal[2]);
  g.fillRect(0, h - dadoH, w, dadoH);
  // ortostatos
  const orthoH = h * 0.36;
  const nOrtho = 3;
  for (let i = 0; i < nOrtho; i++) {
    const x0 = (i / nOrtho) * w;
    const col = pal[i % 2 === 0 ? 0 : 1];
    g.fillStyle = css(col);
    g.fillRect(x0 + 3, h - dadoH - orthoH, w / nOrtho - 6, orthoH - 3);
    // veios imitando mármore
    g.strokeStyle = css(col, 1.25);
    g.lineWidth = 1.2;
    for (let k = 0; k < 6; k++) {
      g.beginPath();
      let yy = h - dadoH - orthoH + rnd() * orthoH;
      g.moveTo(x0 + 3, yy);
      for (let s = 0; s < 6; s++) {
        yy += (rnd() - 0.5) * 18;
        g.lineTo(x0 + 3 + ((s + 1) / 6) * (w / nOrtho - 6), yy);
      }
      g.stroke();
    }
    // chanfro claro/escuro (relevo de estuque)
    g.fillStyle = 'rgba(255,255,255,0.25)';
    g.fillRect(x0 + 3, h - dadoH - orthoH, w / nOrtho - 6, 3);
    g.fillStyle = 'rgba(0,0,0,0.25)';
    g.fillRect(x0 + 3, h - dadoH - 6, w / nOrtho - 6, 3);
  }
  // fiadas de blocos em aparelho alternado
  const courses = 4;
  const top = h * 0.12;
  const zoneH = h - dadoH - orthoH - top;
  for (let r = 0; r < courses; r++) {
    const y0 = top + (r / courses) * zoneH;
    const per = 4;
    const off = (r % 2) * (w / per / 2);
    for (let k = -1; k < per + 1; k++) {
      const x0 = k * (w / per) + off;
      const col = pal[(r + k + 5) % 4 === 2 ? 3 : (r + k) % 2];
      g.fillStyle = css(col, 0.95 + rnd() * 0.1);
      g.fillRect(x0 + 2, y0 + 2, w / per - 4, zoneH / courses - 4);
      g.fillStyle = 'rgba(255,255,255,0.22)';
      g.fillRect(x0 + 2, y0 + 2, w / per - 4, 2);
      g.fillStyle = 'rgba(0,0,0,0.22)';
      g.fillRect(x0 + 2, y0 + zoneH / courses - 4, w / per - 4, 2);
    }
  }
  // cornija de estuque branco no topo
  g.fillStyle = css(pal[4], 1.05);
  g.fillRect(0, 0, w, top);
  g.fillStyle = 'rgba(0,0,0,0.18)';
  for (let i = 0; i < w; i += 10) g.fillRect(i, top - 8, 5, 6); // dentículos
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.ClampToEdgeWrapping;
  return { map: t };
}

/**
 * Pintura do "II estilo" pompeiano (arquitetônico, c. 80–20 a.C.): pódio pintado,
 * colunas ilusionistas projetando sombras, painéis vermelho-cinábrio e negros,
 * e uma vista em perspectiva na zona superior. UV 0–1 = um painel de parede.
 */
export function secondStyleTexture(size, { seed = 53, main = '#8e1d17', alt = '#1f1b18', accent = '#c8a14c' }) {
  const w = size;
  const h = size;
  const canvas = makeCanvas(w, h);
  const g = canvas.getContext('2d');
  const rnd = mulberry32(seed);
  const M = hexToRgb(main);
  const A = hexToRgb(alt);
  const C = hexToRgb(accent);
  const css = (rgb, k = 1, a = 1) => `rgba(${Math.min(255, rgb[0] * k) | 0},${Math.min(255, rgb[1] * k) | 0},${Math.min(255, rgb[2] * k) | 0},${a})`;
  // fundo da zona média: vermelho
  g.fillStyle = css(M);
  g.fillRect(0, 0, w, h);
  // zona superior: céu/arquitetura em perspectiva
  const topH = h * 0.28;
  const grd = g.createLinearGradient(0, 0, 0, topH);
  grd.addColorStop(0, '#9fb3c0');
  grd.addColorStop(1, '#d9d2bf');
  g.fillStyle = grd;
  g.fillRect(0, 0, w, topH);
  // edifício em perspectiva (tholos estilizado) no centro da zona superior
  g.fillStyle = 'rgba(230,220,200,0.9)';
  g.fillRect(w * 0.38, topH * 0.35, w * 0.24, topH * 0.65);
  g.fillStyle = 'rgba(120,90,60,0.8)';
  g.beginPath();
  g.moveTo(w * 0.36, topH * 0.36);
  g.lineTo(w * 0.5, topH * 0.12);
  g.lineTo(w * 0.64, topH * 0.36);
  g.fill();
  for (let i = 0; i < 6; i++) {
    g.fillStyle = 'rgba(190,175,150,1)';
    g.fillRect(w * 0.39 + i * w * 0.042, topH * 0.38, w * 0.012, topH * 0.6);
  }
  // pódio pintado (zona inferior)
  const podH = h * 0.2;
  g.fillStyle = css(A);
  g.fillRect(0, h - podH, w, podH);
  g.fillStyle = css(C, 0.9);
  g.fillRect(0, h - podH, w, 5);
  g.fillStyle = 'rgba(255,255,255,0.12)';
  for (let i = 0; i < 4; i++) g.fillRect(i * (w / 4) + 8, h - podH + 14, w / 4 - 16, podH - 28);
  // painel central negro com moldura dourada
  g.fillStyle = css(A, 1.1);
  g.fillRect(w * 0.3, topH + h * 0.05, w * 0.4, h - podH - topH - h * 0.1);
  g.strokeStyle = css(C);
  g.lineWidth = 3;
  g.strokeRect(w * 0.3 + 6, topH + h * 0.05 + 6, w * 0.4 - 12, h - podH - topH - h * 0.1 - 12);
  // colunas ilusionistas (com sombra projetada à direita)
  const cols = [0.12, 0.88];
  for (const cx of cols) {
    const x = cx * w;
    const cw = w * 0.055;
    g.fillStyle = 'rgba(0,0,0,0.35)';
    g.fillRect(x + cw * 0.6, topH, cw * 0.6, h - podH - topH);
    const cg = g.createLinearGradient(x - cw / 2, 0, x + cw / 2, 0);
    cg.addColorStop(0, '#9c8a6a');
    cg.addColorStop(0.35, '#f2e6c8');
    cg.addColorStop(1, '#8a7656');
    g.fillStyle = cg;
    g.fillRect(x - cw / 2, topH, cw, h - podH - topH);
    // capitel e base
    g.fillStyle = css(C);
    g.fillRect(x - cw * 0.8, topH, cw * 1.6, h * 0.025);
    g.fillRect(x - cw * 0.75, h - podH - h * 0.02, cw * 1.5, h * 0.02);
  }
  // guirlanda entre as colunas
  g.strokeStyle = 'rgba(60,110,50,0.9)';
  g.lineWidth = 6;
  g.beginPath();
  g.moveTo(w * 0.15, topH + h * 0.04);
  g.quadraticCurveTo(w * 0.5, topH + h * 0.16, w * 0.85, topH + h * 0.04);
  g.stroke();
  // entablamento pintado
  g.fillStyle = css(C, 0.8);
  g.fillRect(0, topH - h * 0.02, w, h * 0.03);
  // leve granulação
  const img = g.getImageData(0, 0, w, h);
  for (let i = 0; i < img.data.length; i += 4) {
    const k = 0.94 + rnd() * 0.08;
    img.data[i] *= k;
    img.data[i + 1] *= k;
    img.data[i + 2] *= k;
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.ClampToEdgeWrapping;
  return { map: t };
}

/** Reboco pobre de interior (insula): manchas de fuligem, faixa de rodapé ocre-avermelhada. UV fit. */
export function plebeianWallTexture(size, { seed = 59 }) {
  return pixelTexture(size, (u, v) => {
    const n = fbm(u, v, 4, 5, seed);
    const soot = Math.pow(1 - v, 3) * 0.5 * fbm(u, v, 3, 3, seed + 4); // fuligem no alto (v=0 topo)
    let c = [196, 184, 160].map((x) => x * (0.85 + n * 0.2) * (1 - soot));
    if (v > 0.82) c = [150, 82, 58].map((x) => x * (0.85 + n * 0.2)); // rodapé pintado
    if (v > 0.81 && v < 0.82) c = [90, 50, 35];
    return { c };
  });
}
