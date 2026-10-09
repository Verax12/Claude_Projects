/**
 * Terreno: grade de alturas + malhas em blocos com LOD.
 *
 * Fluxo:
 *   1. new Terrain() + await loadBase(): relevo de base (DEM corrigido para o nível antigo,
 *      ver data/topography.js) + Tibre, numa grade de 4 m;
 *   2. os sítios chamam addPad() durante shapeTerrain() para nivelar praças/lotes;
 *   3. build() gera as malhas (blocos de 320 m com 3 níveis de detalhe e "saias"
 *      que escondem frestas entre níveis);
 *   4. heightAt(x,z) devolve a altura exata da malha de maior detalhe (mesma triangulação).
 */
import * as THREE from 'three';
import { TIBER, TERRAIN_BOUNDS, TERRAIN_CELL, BASE_GRID } from '../data/topography.js';
import baseUrl from '../data/terrain-base.bin?url';
import { fbm } from '../render/noise.js';
import { terrainDetailTexture } from '../render/textures.js';

const smoothstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Distância assinada de um ponto a um polígono (positivo = dentro). */
export function signedDistancePoly(x, z, poly) {
  let inside = false;
  let minD = Infinity;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i];
    const [xj, zj] = poly[j];
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
    // distância ao segmento
    const dx = xj - xi;
    const dz = zj - zi;
    const l2 = dx * dx + dz * dz || 1;
    let t = ((x - xi) * dx + (z - zi) * dz) / l2;
    t = Math.max(0, Math.min(1, t));
    const px = xi + t * dx - x;
    const pz = zi + t * dz - z;
    const d = Math.sqrt(px * px + pz * pz);
    if (d < minD) minD = d;
  }
  return inside ? minD : -minD;
}

/** Distância de um ponto a uma polilinha. */
function distPolyline(x, z, path) {
  let minD = Infinity;
  for (let i = 0; i < path.length - 1; i++) {
    const [xi, zi] = path[i];
    const [xj, zj] = path[i + 1];
    const dx = xj - xi;
    const dz = zj - zi;
    const l2 = dx * dx + dz * dz || 1;
    let t = ((x - xi) * dx + (z - zi) * dz) / l2;
    t = Math.max(0, Math.min(1, t));
    const d = Math.hypot(xi + t * dx - x, zi + t * dz - z);
    if (d < minD) minD = d;
  }
  return minD;
}

/** Converte uma descrição de pad em polígono [[x,z],...]. */
export function padPolygon(p) {
  if (p.points) return p.points;
  if (p.rect) {
    const { x, z, w, d, rotY = 0 } = p.rect;
    const c = Math.cos(rotY);
    const s = Math.sin(rotY);
    // rotação Y do three.js: x' = x c + z s ; z' = -x s + z c
    return [
      [-w / 2, -d / 2],
      [w / 2, -d / 2],
      [w / 2, d / 2],
      [-w / 2, d / 2],
    ].map(([lx, lz]) => [x + lx * c + lz * s, z - lx * s + lz * c]);
  }
  if (p.circle) {
    const { x, z, r } = p.circle;
    const n = 24;
    return Array.from({ length: n }, (_, i) => [x + Math.cos((i / n) * Math.PI * 2) * r, z + Math.sin((i / n) * Math.PI * 2) * r]);
  }
  throw new Error('Pad sem points/rect/circle');
}

export class Terrain {
  constructor() {
    const b = TERRAIN_BOUNDS;
    this.cell = TERRAIN_CELL;
    this.minX = b.minX;
    this.minZ = b.minZ;
    this.nx = Math.round((b.maxX - b.minX) / this.cell) + 1;
    this.nz = Math.round((b.maxZ - b.minZ) / this.cell) + 1;
    this.h = new Float32Array(this.nx * this.nz);
    /** Máscara "urbana" 0–1 (terra batida em vez de grama). */
    this.urban = new Float32Array(this.nx * this.nz);
    this.padCount = 0;
    this.mesh = null;
  }

  /** Carrega o relevo de base (terrain-base.bin) e calcula a grade. */
  async loadBase() {
    const res = await fetch(baseUrl);
    if (!res.ok) throw new Error(`Falha ao carregar o relevo (${res.status})`);
    const buf = await res.arrayBuffer();
    this.base = new Int16Array(buf);
    this.computeBase();
  }

  /** Relevo de base (m) por interpolação bilinear da grade de 8 m. */
  baseHeight(x, z) {
    const { half, step, n } = BASE_GRID;
    const fi = Math.min(n - 1.001, Math.max(0, (x + half) / step));
    const fj = Math.min(n - 1.001, Math.max(0, (z + half) / step));
    const i = Math.floor(fi);
    const j = Math.floor(fj);
    const u = fi - i;
    const v = fj - j;
    const b = this.base;
    const h00 = b[j * n + i];
    const h10 = b[j * n + i + 1];
    const h01 = b[(j + 1) * n + i];
    const h11 = b[(j + 1) * n + i + 1];
    return ((h00 * (1 - u) + h10 * u) * (1 - v) + (h01 * (1 - u) + h11 * u) * v) / 100;
  }

  idx(i, j) {
    return j * this.nx + i;
  }

  /** Calcula a altura natural (antes dos pads). */
  computeBase() {
    for (let j = 0; j < this.nz; j++) {
      const z = this.minZ + j * this.cell;
      for (let i = 0; i < this.nx; i++) {
        const x = this.minX + i * this.cell;
        this.h[this.idx(i, j)] = this.naturalHeight(x, z);
      }
    }
  }

  /** Altura natural num ponto: relevo de base + ondulação fina + leito do Tibre. */
  naturalHeight(x, z) {
    let h = this.base ? this.baseHeight(x, z) : 0;
    // ondulação leve (escala menor que a resolução do DEM)
    h += (fbm((x + 5000) / 2560, (z + 5000) / 2560, 48, 2, 3) - 0.5) * 0.8;
    // Tibre: leito abaixo do nível da água e margens suaves
    const dr = distPolyline(x, z, TIBER.path);
    const half = TIBER.width / 2;
    if (dr < half + 40) {
      const bank = smoothstep(half + 40, half - 5, dr);
      const target = Math.min(h, TIBER.bed);
      h = h + (target - h) * bank;
    }
    // Ilha Tiberina (elipse alongada no sentido da corrente, ~270 × 67 m)
    const isl = TIBER.island;
    if (isl) {
      const c = Math.cos(isl.angle);
      const sn = Math.sin(isl.angle);
      const lx = ((x - isl.x) * c + (z - isl.z) * sn) / (isl.length / 2);
      const lz = (-(x - isl.x) * sn + (z - isl.z) * c) / (isl.width / 2);
      const e = Math.sqrt(lx * lx + lz * lz);
      if (e < 1.25) h = Math.max(h, TIBER.waterLevel - 2 + smoothstep(1.25, 0.85, e) * (isl.height - TIBER.waterLevel + 2));
    }
    return h;
  }

  /**
   * Nivela uma área. Deve ser chamado ANTES de build().
   * @param {object} p { points | rect:{x,z,w,d,rotY} | circle:{x,z,r}, height, blend=6, urban=1, mode:'set'|'max'|'min' }
   */
  addPad(p) {
    if (this.mesh) throw new Error('addPad() deve ser chamado antes de Terrain.build()');
    const poly = padPolygon(p);
    const blend = p.blend ?? 6;
    const urbanK = p.urban ?? 1;
    const mode = p.mode || 'set';
    let minX = Infinity;
    let maxX = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;
    for (const [x, z] of poly) {
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minZ = Math.min(minZ, z);
      maxZ = Math.max(maxZ, z);
    }
    const i0 = Math.max(0, Math.floor((minX - blend - this.minX) / this.cell));
    const i1 = Math.min(this.nx - 1, Math.ceil((maxX + blend - this.minX) / this.cell));
    const j0 = Math.max(0, Math.floor((minZ - blend - this.minZ) / this.cell));
    const j1 = Math.min(this.nz - 1, Math.ceil((maxZ + blend - this.minZ) / this.cell));
    for (let j = j0; j <= j1; j++) {
      const z = this.minZ + j * this.cell;
      for (let i = i0; i <= i1; i++) {
        const x = this.minX + i * this.cell;
        const sd = signedDistancePoly(x, z, poly);
        // dentro do polígono (e até meia célula fora) a altura é exata
        const w = blend > 0 ? smoothstep(-blend, -this.cell * 0.75, sd) : sd >= -this.cell * 0.75 ? 1 : 0;
        if (w <= 0) continue;
        const k = this.idx(i, j);
        const cur = this.h[k];
        let target = p.height;
        if (mode === 'max') target = Math.max(cur, p.height);
        else if (mode === 'min') target = Math.min(cur, p.height);
        this.h[k] = cur + (target - cur) * w;
        this.urban[k] = Math.max(this.urban[k], urbanK * w);
      }
    }
    this.padCount++;
  }

  /** Marca uma área como urbana (terra batida) sem alterar a altura. */
  markUrban(p) {
    const poly = padPolygon(p);
    const xs = poly.map((q) => q[0]);
    const zs = poly.map((q) => q[1]);
    const i0 = Math.max(0, Math.floor((Math.min(...xs) - 8 - this.minX) / this.cell));
    const i1 = Math.min(this.nx - 1, Math.ceil((Math.max(...xs) + 8 - this.minX) / this.cell));
    const j0 = Math.max(0, Math.floor((Math.min(...zs) - 8 - this.minZ) / this.cell));
    const j1 = Math.min(this.nz - 1, Math.ceil((Math.max(...zs) + 8 - this.minZ) / this.cell));
    for (let j = j0; j <= j1; j++) {
      const z = this.minZ + j * this.cell;
      for (let i = i0; i <= i1; i++) {
        const x = this.minX + i * this.cell;
        const sd = signedDistancePoly(x, z, poly);
        if (sd > -8) this.urban[this.idx(i, j)] = Math.max(this.urban[this.idx(i, j)], smoothstep(-8, 0, sd) * (p.urban ?? 1));
      }
    }
  }

  /** Altura exata (mesma triangulação da malha de maior detalhe). */
  heightAt(x, z) {
    const fx = (x - this.minX) / this.cell;
    const fz = (z - this.minZ) / this.cell;
    let i = Math.floor(fx);
    let j = Math.floor(fz);
    if (i < 0 || j < 0 || i >= this.nx - 1 || j >= this.nz - 1) {
      i = Math.min(Math.max(i, 0), this.nx - 2);
      j = Math.min(Math.max(j, 0), this.nz - 2);
    }
    const u = Math.min(1, Math.max(0, fx - i));
    const v = Math.min(1, Math.max(0, fz - j));
    const h00 = this.h[this.idx(i, j)];
    const h10 = this.h[this.idx(i + 1, j)];
    const h01 = this.h[this.idx(i, j + 1)];
    const h11 = this.h[this.idx(i + 1, j + 1)];
    // diagonal de (i,j) a (i+1,j+1): triângulos (00,11,10) se u>v, (00,01,11) caso contrário
    if (u > v) return h00 + (h10 - h00) * u + (h11 - h10) * v;
    return h00 + (h01 - h00) * v + (h11 - h01) * u;
  }

  /** Normal aproximada do terreno. */
  normalAt(x, z) {
    const e = this.cell;
    const hx = this.heightAt(x + e, z) - this.heightAt(x - e, z);
    const hz = this.heightAt(x, z + e) - this.heightAt(x, z - e);
    return new THREE.Vector3(-hx, 2 * e, -hz).normalize();
  }

  /** Gera as malhas do terreno e devolve um Group. */
  build(quality) {
    const group = new THREE.Group();
    group.name = 'terrain';
    const det = terrainDetailTexture(Math.min(512, quality.textureSize), { seed: 29 });
    det.map.repeat.set(1 / 11, 1 / 11);
    det.normalMap.repeat.set(1 / 11, 1 / 11);
    this.material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      map: det.map,
      normalMap: det.normalMap,
      normalScale: new THREE.Vector2(0.22, 0.22),
      roughness: 0.97,
      metalness: 0,
    });
    const chunkCells = 80; // 320 m
    for (let cj = 0; cj < this.nz - 1; cj += chunkCells) {
      for (let ci = 0; ci < this.nx - 1; ci += chunkCells) {
        const lod = new THREE.LOD();
        const levels = [
          { step: 1, dist: 0 },
          { step: 2, dist: 420 },
          { step: 4, dist: 950 },
        ];
        for (const L of levels) {
          const geo = this.chunkGeometry(ci, cj, Math.min(chunkCells, this.nx - 1 - ci), Math.min(chunkCells, this.nz - 1 - cj), L.step);
          const m = new THREE.Mesh(geo, this.material);
          m.receiveShadow = true;
          m.castShadow = false;
          m.matrixAutoUpdate = false;
          lod.addLevel(m, L.dist);
        }
        // posição do LOD = centro do bloco (para a distância de troca de nível)
        const cx = this.minX + (ci + chunkCells / 2) * this.cell;
        const cz = this.minZ + (cj + chunkCells / 2) * this.cell;
        lod.position.set(cx, 0, cz);
        for (const lv of lod.levels) lv.object.position.set(-cx, 0, -cz);
        for (const lv of lod.levels) lv.object.updateMatrix();
        lod.updateMatrix();
        lod.autoUpdate = true;
        group.add(lod);
      }
    }
    group.add(this.buildRiver());
    this.mesh = group;
    return group;
  }

  /** Superfície da água do Tibre (faixa ao longo da linha central). */
  buildRiver() {
    const path = TIBER.path;
    const w = TIBER.width / 2 + 18;
    const pos = [];
    const uv = [];
    const idx = [];
    // suaviza a polilinha (Chaikin, 3 iterações) e reamostra a cada ~20 m
    let sm = path.map((p) => p.slice());
    for (let it = 0; it < 3; it++) {
      const out = [sm[0]];
      for (let i = 0; i < sm.length - 1; i++) {
        const [ax, az] = sm[i];
        const [bx, bz] = sm[i + 1];
        out.push([ax * 0.75 + bx * 0.25, az * 0.75 + bz * 0.25], [ax * 0.25 + bx * 0.75, az * 0.25 + bz * 0.75]);
      }
      out.push(sm[sm.length - 1]);
      sm = out;
    }
    const pts = [];
    for (let i = 0; i < sm.length - 1; i++) {
      const [x0, z0] = sm[i];
      const [x1, z1] = sm[i + 1];
      const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 20));
      for (let k = 0; k < n; k++) pts.push([x0 + ((x1 - x0) * k) / n, z0 + ((z1 - z0) * k) / n]);
    }
    pts.push(sm[sm.length - 1]);
    let acc = 0;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[Math.max(0, i - 1)];
      const b = pts[Math.min(pts.length - 1, i + 1)];
      const dx = b[0] - a[0];
      const dz = b[1] - a[1];
      const l = Math.hypot(dx, dz) || 1;
      const nx = -dz / l;
      const nz = dx / l;
      if (i > 0) acc += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      pos.push(pts[i][0] + nx * w, TIBER.waterLevel, pts[i][1] + nz * w, pts[i][0] - nx * w, TIBER.waterLevel, pts[i][1] - nz * w);
      uv.push(0, acc, 2 * w, acc);
      if (i > 0) {
        const k = i * 2;
        idx.push(k - 2, k, k - 1, k - 1, k, k + 1);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    // garante normais para cima (o sentido dos triângulos depende da orientação da linha)
    const nrm = g.attributes.normal;
    for (let i = 0; i < nrm.count; i++) nrm.setXYZ(i, 0, 1, 0);
    const mat = new THREE.MeshStandardMaterial({ color: 0x4a6366, roughness: 0.12, metalness: 0.15, transparent: true, opacity: 0.88, side: THREE.DoubleSide });
    const m = new THREE.Mesh(g, mat);
    m.name = 'tibre';
    m.receiveShadow = true;
    return m;
  }

  /** Cor do terreno num vértice (grama seca, terra, rocha de tufo, área urbana). */
  colorAt(x, z, k, slopeY) {
    const n = fbm((x + 9000) / 1280, (z + 9000) / 1280, 16, 4, 11);
    const n2 = fbm((x + 9000) / 1280, (z + 9000) / 1280, 64, 2, 12);
    // grama seca mediterrânea ↔ grama mais verde
    let r = 0.5 + (n - 0.5) * 0.14;
    let g = 0.47 + (n - 0.5) * 0.1;
    let b = 0.29;
    // manchas de vegetação mais verde (transição suave)
    const lush = smoothstep(0.45, 0.7, n2) * 0.6;
    r *= 1 - 0.15 * lush;
    g *= 1 - 0.03 * lush;
    b *= 1 - 0.18 * lush;
    // terra / rocha em encostas íngremes (tufo exposto)
    const steep = smoothstep(0.92, 0.7, slopeY);
    r = r + (0.55 - r) * steep;
    g = g + (0.49 - g) * steep;
    b = b + (0.37 - b) * steep;
    // área urbana: terra batida
    const u = this.urban[k];
    r = r + (0.5 + (n - 0.5) * 0.08 - r) * u;
    g = g + (0.41 + (n - 0.5) * 0.08 - g) * u;
    b = b + (0.3 - b) * u;
    // margens e leito do Tibre: lama
    const hgt = this.h[k];
    if (hgt < -5) {
      const t = smoothstep(-5, -7.5, hgt);
      r = r + (0.36 - r) * t;
      g = g + (0.33 - g) * t;
      b = b + (0.26 - b) * t;
    }
    return [r, g, b];
  }

  /** Geometria de um bloco com passo `step` (em células) e saia nas bordas. */
  chunkGeometry(ci, cj, cw, ch, step) {
    const nxv = Math.floor(cw / step) + 1;
    const nzv = Math.floor(ch / step) + 1;
    const pos = [];
    const nor = [];
    const col = [];
    const uv = [];
    const idx = [];
    const vert = (i, j, yOff = 0) => {
      const gi = Math.min(ci + i * step, this.nx - 1);
      const gj = Math.min(cj + j * step, this.nz - 1);
      const x = this.minX + gi * this.cell;
      const z = this.minZ + gj * this.cell;
      const k = this.idx(gi, gj);
      const y = this.h[k] + yOff;
      pos.push(x, y, z);
      // inclinação estimada por diferenças
      const hx = this.h[this.idx(Math.min(gi + 1, this.nx - 1), gj)] - this.h[this.idx(Math.max(gi - 1, 0), gj)];
      const hz = this.h[this.idx(gi, Math.min(gj + 1, this.nz - 1))] - this.h[this.idx(gi, Math.max(gj - 1, 0))];
      const nl = Math.hypot(hx, 2 * this.cell, hz);
      const ny = (2 * this.cell) / nl;
      // normal analítica (diferenças centrais) — idêntica para o topo e a saia de um vértice
      nor.push(-hx / nl, ny, -hz / nl);
      const c = this.colorAt(x, z, k, ny);
      col.push(...c);
      uv.push(x, -z);
      return pos.length / 3 - 1;
    };
    for (let j = 0; j < nzv; j++) for (let i = 0; i < nxv; i++) vert(i, j);
    for (let j = 0; j < nzv - 1; j++) {
      for (let i = 0; i < nxv - 1; i++) {
        const a = j * nxv + i;
        const b = j * nxv + i + 1;
        const c = (j + 1) * nxv + i + 1;
        const d = (j + 1) * nxv + i;
        // diagonal a–c (igual a heightAt). Sentido anti-horário visto de cima.
        idx.push(a, c, b, a, d, c);
      }
    }
    // saias (paredes verticais nas bordas, 4 m para baixo)
    const skirt = (list) => {
      for (let k = 0; k < list.length - 1; k++) {
        const [i0, j0] = list[k];
        const [i1, j1] = list[k + 1];
        const top0 = j0 * nxv + i0;
        const top1 = j1 * nxv + i1;
        const b0 = vert(i0, j0, -4);
        const b1 = vert(i1, j1, -4);
        idx.push(top0, b0, b1, top0, b1, top1);
        idx.push(top0, b1, b0, top0, top1, b1); // dupla face (barato e evita erros de sentido)
      }
    };
    const north = [];
    const south = [];
    const west = [];
    const east = [];
    for (let i = 0; i < nxv; i++) {
      north.push([i, 0]);
      south.push([i, nzv - 1]);
    }
    for (let j = 0; j < nzv; j++) {
      west.push([0, j]);
      east.push([nxv - 1, j]);
    }
    skirt(north);
    skirt(south);
    skirt(west);
    skirt(east);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    g.setIndex(idx);
    g.computeBoundingSphere();
    return g;
  }
}
