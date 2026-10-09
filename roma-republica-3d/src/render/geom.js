/**
 * Geradores de geometria com UVs em METROS (ou 0–1 com uv:'fit') e atributo de cor.
 *
 * Todas as geometrias devolvidas são NÃO indexadas e possuem exatamente os atributos
 * position, normal, uv e color — requisito para que o Builder possa fundi-las
 * (mergeGeometries) em poucas malhas por material.
 *
 * Convenção: primitivas "de pé" (caixa, cilindro, torno, prisma) têm a BASE em y = 0.
 */
import * as THREE from 'three';

const _v = new THREE.Vector3();

/** Garante atributos padronizados (não indexada, uv e color presentes, sem extras). */
export function normalizeGeometry(g, color = null) {
  // sempre trabalha numa cópia: a geometria de entrada pode ser reutilizada pelo chamador
  let geo = g.index ? g.toNonIndexed() : g.clone();
  if (!geo.attributes.normal) geo.computeVertexNormals();
  const n = geo.attributes.position.count;
  if (!geo.attributes.uv) geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n * 2), 2));
  const c = color ? toColor(color) : null;
  if (!geo.attributes.color || c) {
    const arr = new Float32Array(n * 3);
    const r = c ? c.r : 1;
    const gg = c ? c.g : 1;
    const b = c ? c.b : 1;
    for (let i = 0; i < n; i++) {
      arr[i * 3] = r;
      arr[i * 3 + 1] = gg;
      arr[i * 3 + 2] = b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  }
  for (const name of Object.keys(geo.attributes)) {
    if (!['position', 'normal', 'uv', 'color'].includes(name)) geo.deleteAttribute(name);
  }
  geo.morphAttributes = {};
  return geo;
}

/** Aceita '#hex', número, [r,g,b] (0–1) ou THREE.Color. */
export function toColor(c) {
  if (c instanceof THREE.Color) return c;
  if (Array.isArray(c)) return new THREE.Color(c[0], c[1], c[2]);
  return new THREE.Color(c);
}

/** Constrói uma geometria a partir de listas de triângulos (posições, normais, uvs). */
function fromArrays(pos, nor, uv) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return g;
}

/** Adiciona um quadrilátero (a,b,c,d em sentido anti-horário visto de fora). */
function pushQuad(pos, nor, uv, a, b, c, d, n, ua, ub, uc, ud) {
  pos.push(...a, ...b, ...c, ...a, ...c, ...d);
  for (let i = 0; i < 6; i++) nor.push(n[0], n[1], n[2]);
  uv.push(...ua, ...ub, ...uc, ...ua, ...uc, ...ud);
}

/**
 * Caixa com base em y=0, centrada em x/z.
 * @param {number} w largura (X)  @param {number} h altura (Y)  @param {number} d profundidade (Z)
 * @param {object} o { fit:boolean (UV 0–1 por face), faces:{top,bottom,px,nx,pz,nz}: false para omitir }
 */
export function box(w, h, d, o = {}) {
  const pos = [];
  const nor = [];
  const uv = [];
  const x0 = -w / 2;
  const x1 = w / 2;
  const z0 = -d / 2;
  const z1 = d / 2;
  const fit = !!o.fit;
  const faces = o.faces || {};
  const U = (a, b) => (fit ? [a, b] : null);
  // +Z (frente)
  if (faces.pz !== false)
    pushQuad(pos, nor, uv, [x0, 0, z1], [x1, 0, z1], [x1, h, z1], [x0, h, z1], [0, 0, 1],
      U(0, 0) || [x0, 0], U(1, 0) || [x1, 0], U(1, 1) || [x1, h], U(0, 1) || [x0, h]);
  // -Z (fundo)
  if (faces.nz !== false)
    pushQuad(pos, nor, uv, [x1, 0, z0], [x0, 0, z0], [x0, h, z0], [x1, h, z0], [0, 0, -1],
      U(0, 0) || [-x1, 0], U(1, 0) || [-x0, 0], U(1, 1) || [-x0, h], U(0, 1) || [-x1, h]);
  // +X
  if (faces.px !== false)
    pushQuad(pos, nor, uv, [x1, 0, z1], [x1, 0, z0], [x1, h, z0], [x1, h, z1], [1, 0, 0],
      U(0, 0) || [-z1, 0], U(1, 0) || [-z0, 0], U(1, 1) || [-z0, h], U(0, 1) || [-z1, h]);
  // -X
  if (faces.nx !== false)
    pushQuad(pos, nor, uv, [x0, 0, z0], [x0, 0, z1], [x0, h, z1], [x0, h, z0], [-1, 0, 0],
      U(0, 0) || [z0, 0], U(1, 0) || [z1, 0], U(1, 1) || [z1, h], U(0, 1) || [z0, h]);
  // topo
  if (faces.top !== false)
    pushQuad(pos, nor, uv, [x0, h, z1], [x1, h, z1], [x1, h, z0], [x0, h, z0], [0, 1, 0],
      U(0, 0) || [x0, -z1], U(1, 0) || [x1, -z1], U(1, 1) || [x1, -z0], U(0, 1) || [x0, -z0]);
  // base
  if (faces.bottom !== false)
    pushQuad(pos, nor, uv, [x0, 0, z0], [x1, 0, z0], [x1, 0, z1], [x0, 0, z1], [0, -1, 0],
      U(0, 0) || [x0, z0], U(1, 0) || [x1, z0], U(1, 1) || [x1, z1], U(0, 1) || [x0, z1]);
  return fromArrays(pos, nor, uv);
}

/**
 * Superfície de revolução a partir de um perfil [[raio, y], ...] (de baixo para cima).
 * UV: U = comprimento de arco (m) ou nº de caneluras (se `flutes`), V = comprimento ao longo do perfil (m).
 */
export function lathe(profile, segments = 24, o = {}) {
  const pos = [];
  const nor = [];
  const uv = [];
  const flutes = o.flutes || 0;
  // comprimento acumulado ao longo do perfil
  const acc = [0];
  for (let i = 1; i < profile.length; i++) {
    const dr = profile[i][0] - profile[i - 1][0];
    const dy = profile[i][1] - profile[i - 1][1];
    acc.push(acc[i - 1] + Math.hypot(dr, dy));
  }
  const maxR = Math.max(...profile.map((p) => p[0]));
  for (let i = 0; i < profile.length - 1; i++) {
    const [r0, y0] = profile[i];
    const [r1, y1] = profile[i + 1];
    // normal do segmento no plano (r, y)
    const dr = r1 - r0;
    const dy = y1 - y0;
    const len = Math.hypot(dr, dy) || 1;
    const nr = dy / len;
    const ny = -dr / len;
    for (let s = 0; s < segments; s++) {
      const a0 = (s / segments) * Math.PI * 2;
      const a1 = ((s + 1) / segments) * Math.PI * 2;
      const c0 = Math.cos(a0);
      const s0 = Math.sin(a0);
      const c1 = Math.cos(a1);
      const s1 = Math.sin(a1);
      const p00 = [r0 * s0, y0, r0 * c0];
      const p10 = [r0 * s1, y0, r0 * c1];
      const p11 = [r1 * s1, y1, r1 * c1];
      const p01 = [r1 * s0, y1, r1 * c0];
      const n0 = [nr * s0, ny, nr * c0];
      const n1 = [nr * s1, ny, nr * c1];
      const u0 = flutes ? (s / segments) * flutes : (a0 * maxR);
      const u1 = flutes ? ((s + 1) / segments) * flutes : (a1 * maxR);
      const v0 = o.vByHeight ? y0 : acc[i];
      const v1 = o.vByHeight ? y1 : acc[i + 1];
      pos.push(...p00, ...p10, ...p11, ...p00, ...p11, ...p01);
      nor.push(...n0, ...n1, ...n1, ...n0, ...n1, ...n0);
      uv.push(u0, v0, u1, v0, u1, v1, u0, v0, u1, v1, u0, v1);
    }
  }
  return fromArrays(pos, nor, uv);
}

/** Cilindro (ou tronco de cone) com base em y=0. Tampas opcionais. */
export function cylinder(rBottom, rTop, h, segments = 16, o = {}) {
  const g = lathe([[rBottom, 0], [rTop, h]], segments, { flutes: o.flutes, vByHeight: true });
  const parts = [g];
  if (o.caps !== false) {
    parts.push(disc(rTop, segments, h, true));
    if (o.bottomCap) parts.push(disc(rBottom, segments, 0, false));
  }
  return parts.length === 1 ? g : merge(parts);
}

/** Disco horizontal (tampa). */
export function disc(r, segments = 16, y = 0, up = true) {
  const pos = [];
  const nor = [];
  const uv = [];
  for (let s = 0; s < segments; s++) {
    const a0 = (s / segments) * Math.PI * 2;
    const a1 = ((s + 1) / segments) * Math.PI * 2;
    const p0 = [r * Math.sin(a0), y, r * Math.cos(a0)];
    const p1 = [r * Math.sin(a1), y, r * Math.cos(a1)];
    if (up) pos.push(0, y, 0, ...p0, ...p1);
    else pos.push(0, y, 0, ...p1, ...p0);
    for (let k = 0; k < 3; k++) nor.push(0, up ? 1 : -1, 0);
    uv.push(0, 0, p0[0], -p0[2], p1[0], -p1[2]);
  }
  return fromArrays(pos, nor, uv);
}

/**
 * Prisma vertical a partir de um polígono no plano XZ (pontos [[x,z],...] em sentido
 * anti-horário visto de cima, i.e., com +X à direita e -Z para cima no mapa).
 */
export function prism(points, h, o = {}) {
  const pos = [];
  const nor = [];
  const uv = [];
  const n = points.length;
  // detecta orientação e garante sentido anti-horário (visto de +Y)
  let area = 0;
  for (let i = 0; i < n; i++) {
    const [x0, z0] = points[i];
    const [x1, z1] = points[(i + 1) % n];
    area += x0 * z1 - x1 * z0;
  }
  const pts = area > 0 ? points.slice().reverse() : points.slice();
  let u = 0;
  if (o.sides !== false) {
    for (let i = 0; i < n; i++) {
      const [x0, z0] = pts[i];
      const [x1, z1] = pts[(i + 1) % n];
      const len = Math.hypot(x1 - x0, z1 - z0);
      // normal externa = lado direito do sentido de percurso (contorno anti-horário no mapa)
      const nx = -(z1 - z0) / len;
      const nz = (x1 - x0) / len;
      pushQuad(pos, nor, uv, [x0, 0, z0], [x1, 0, z1], [x1, h, z1], [x0, h, z0], [nx, 0, nz],
        [u, 0], [u + len, 0], [u + len, h], [u, h]);
      u += len;
    }
  }
  // tampas trianguladas (ShapeUtils)
  const contour = pts.map(([x, z]) => new THREE.Vector2(x, -z));
  const tris = THREE.ShapeUtils.triangulateShape(contour, []);
  for (const [a, b, c] of tris) {
    const A = pts[a];
    const B = pts[b];
    const C = pts[c];
    if (o.top !== false) {
      pos.push(A[0], h, A[1], B[0], h, B[1], C[0], h, C[1]);
      nor.push(0, 1, 0, 0, 1, 0, 0, 1, 0);
      uv.push(A[0], -A[1], B[0], -B[1], C[0], -C[1]);
    }
    if (o.bottom) {
      pos.push(A[0], 0, A[1], C[0], 0, C[1], B[0], 0, B[1]);
      nor.push(0, -1, 0, 0, -1, 0, 0, -1, 0);
      uv.push(A[0], A[1], C[0], C[1], B[0], B[1]);
    }
  }
  // corrige o sentido dos triângulos das tampas se necessário
  const g = fromArrays(pos, nor, uv);
  fixWinding(g);
  return g;
}

/** Garante que cada triângulo tenha o sentido coerente com a normal armazenada. */
export function fixWinding(g) {
  const p = g.attributes.position.array;
  const nrm = g.attributes.normal.array;
  const uvs = g.attributes.uv.array;
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  for (let i = 0; i < p.length; i += 9) {
    a.set(p[i], p[i + 1], p[i + 2]);
    b.set(p[i + 3], p[i + 4], p[i + 5]);
    c.set(p[i + 6], p[i + 7], p[i + 8]);
    _v.subVectors(b, a).cross(c.clone().sub(a));
    const dot = _v.x * nrm[i] + _v.y * nrm[i + 1] + _v.z * nrm[i + 2];
    if (dot < 0) {
      // troca b e c
      for (let k = 0; k < 3; k++) {
        const t = p[i + 3 + k];
        p[i + 3 + k] = p[i + 6 + k];
        p[i + 6 + k] = t;
        const tn = nrm[i + 3 + k];
        nrm[i + 3 + k] = nrm[i + 6 + k];
        nrm[i + 6 + k] = tn;
      }
      const j = (i / 9) * 6;
      for (let k = 0; k < 2; k++) {
        const t = uvs[j + 2 + k];
        uvs[j + 2 + k] = uvs[j + 4 + k];
        uvs[j + 4 + k] = t;
      }
    }
  }
  return g;
}

/**
 * Quadrilátero arbitrário (4 pontos 3D em sentido anti-horário visto do lado da face).
 * UV em metros a partir das arestas, ou 0–1 com fit.
 */
export function quad(a, b, c, d, o = {}) {
  const pos = [];
  const nor = [];
  const uv = [];
  const A = new THREE.Vector3(...a);
  const B = new THREE.Vector3(...b);
  const C = new THREE.Vector3(...c);
  const n = new THREE.Vector3().subVectors(B, A).cross(new THREE.Vector3().subVectors(C, A)).normalize();
  if (o.fit) {
    pushQuad(pos, nor, uv, a, b, c, d, n.toArray(), [0, 0], [1, 0], [1, 1], [0, 1]);
  } else {
    // base ortonormal no plano: U ao longo de AB, V perpendicular
    const ex = new THREE.Vector3().subVectors(B, A).normalize();
    const ey = new THREE.Vector3().crossVectors(n, ex);
    const proj = (P) => {
      const q = new THREE.Vector3(...P).sub(A);
      return [q.dot(ex) + (o.u0 || 0), q.dot(ey) + (o.v0 || 0)];
    };
    pushQuad(pos, nor, uv, a, b, c, d, n.toArray(), proj(a), proj(b), proj(c), proj(d));
  }
  return fromArrays(pos, nor, uv);
}

/** Triângulo (ex.: tímpano de frontão). UV em metros no plano do triângulo. */
export function triangle(a, b, c) {
  const A = new THREE.Vector3(...a);
  const B = new THREE.Vector3(...b);
  const C = new THREE.Vector3(...c);
  const n = new THREE.Vector3().subVectors(B, A).cross(new THREE.Vector3().subVectors(C, A)).normalize();
  const ex = new THREE.Vector3().subVectors(B, A).normalize();
  const ey = new THREE.Vector3().crossVectors(n, ex);
  const proj = (P) => {
    const q = P.clone().sub(A);
    return [q.dot(ex), q.dot(ey)];
  };
  return fromArrays([...a, ...b, ...c], [...n.toArray(), ...n.toArray(), ...n.toArray()], [...proj(A), ...proj(B), ...proj(C)]);
}

/** Esfera simples (UV em metros aproximados). */
export function sphere(r, wSeg = 12, hSeg = 8) {
  const g = new THREE.SphereGeometry(r, wSeg, hSeg);
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * Math.PI * 2 * r, uv.getY(i) * Math.PI * r);
  g.translate(0, r, 0);
  return g.toNonIndexed();
}

/** Funde geometrias já normalizadas/compatíveis (simples concatenação). */
export function merge(geoms) {
  const list = geoms.map((g) => (g.index ? g.toNonIndexed() : g));
  const names = ['position', 'normal', 'uv', 'color'].filter((n) => list.every((g) => g.attributes[n]));
  const out = new THREE.BufferGeometry();
  for (const name of names) {
    const itemSize = list[0].attributes[name].itemSize;
    let total = 0;
    for (const g of list) total += g.attributes[name].array.length;
    const arr = new Float32Array(total);
    let off = 0;
    for (const g of list) {
      arr.set(g.attributes[name].array, off);
      off += g.attributes[name].array.length;
    }
    out.setAttribute(name, new THREE.BufferAttribute(arr, itemSize));
  }
  return out;
}

/** Aplica uma matriz e (re)normaliza normais. */
export function transformed(g, m) {
  const c = g.clone();
  c.applyMatrix4(m);
  return c;
}
