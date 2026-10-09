/**
 * Ruído procedural determinístico e TILEÁVEL (periódico) para geração de texturas.
 * Todas as funções recebem coordenadas normalizadas u, v ∈ [0, 1) e repetem-se
 * perfeitamente nas bordas, o que permite usar as texturas com RepeatWrapping.
 */

/** Gerador pseudoaleatório mulberry32 (rápido, com semente). */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Hash inteiro → [0,1). */
function hash2(ix, iy, seed) {
  let h = (ix * 374761393 + iy * 668265263 + seed * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/** Ruído de valor periódico: período `p` células por unidade de textura. */
export function valueNoise(u, v, p, seed = 0) {
  const x = u * p;
  const y = v * p;
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const x0 = ((xi % p) + p) % p;
  const y0 = ((yi % p) + p) % p;
  const x1 = (x0 + 1) % p;
  const y1 = (y0 + 1) % p;
  const a = hash2(x0, y0, seed);
  const b = hash2(x1, y0, seed);
  const c = hash2(x0, y1, seed);
  const d = hash2(x1, y1, seed);
  const sx = xf * xf * (3 - 2 * xf);
  const sy = yf * yf * (3 - 2 * yf);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}

/** Ruído fractal (fBm) periódico. Retorna aproximadamente [0,1]. */
export function fbm(u, v, basePeriod = 4, octaves = 4, seed = 0, gain = 0.5) {
  let sum = 0;
  let amp = 1;
  let norm = 0;
  let p = basePeriod;
  for (let o = 0; o < octaves; o++) {
    sum += valueNoise(u, v, p, seed + o * 17) * amp;
    norm += amp;
    amp *= gain;
    p *= 2;
  }
  return sum / norm;
}

/**
 * Ruído celular (Worley) periódico com `n` células por lado.
 * Retorna { f1, f2, id } — distâncias ao ponto mais próximo e ao segundo mais próximo
 * (em unidades de célula) e um identificador estável da célula mais próxima.
 */
export function worley(u, v, n, seed = 0) {
  const x = u * n;
  const y = v * n;
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  let f1 = 1e9;
  let f2 = 1e9;
  let id = 0;
  for (let j = -1; j <= 1; j++) {
    for (let i = -1; i <= 1; i++) {
      const cx = xi + i;
      const cy = yi + j;
      const wx = ((cx % n) + n) % n;
      const wy = ((cy % n) + n) % n;
      const px = cx + hash2(wx, wy, seed);
      const py = cy + hash2(wx, wy, seed + 101);
      const dx = px - x;
      const dy = py - y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < f1) {
        f2 = f1;
        f1 = d;
        id = wx * 7919 + wy * 104729;
      } else if (d < f2) {
        f2 = d;
      }
    }
  }
  return { f1, f2, id };
}

/** Valor aleatório estável associado a um id inteiro. */
export function hashId(id, seed = 0) {
  return hash2(id, id * 31 + 7, seed);
}
