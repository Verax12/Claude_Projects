/**
 * Fórum de César — utilidades de modelagem locais (componentes que a biblioteca src/arch
 * não oferece). Nada aqui representa dado histórico: são ferramentas geométricas.
 */
import * as THREE from 'three';
import * as G from '../../render/geom.js';

/**
 * Quadrilátero com orientação automática: a face visível aponta para `dir` ([x,y,z]).
 * Evita erros de sentido (anti-horário) em superfícies calculadas proceduralmente.
 */
export function quadFacing(b, p0, p1, p2, p3, dir, o = {}) {
  const A = new THREE.Vector3(...p0);
  const n = new THREE.Vector3().subVectors(new THREE.Vector3(...p1), A).cross(new THREE.Vector3().subVectors(new THREE.Vector3(...p2), A));
  const ok = n.x * dir[0] + n.y * dir[1] + n.z * dir[2] >= 0;
  if (ok) b.quad(p0, p1, p2, p3, o);
  else b.quad(p3, p2, p1, p0, o);
}

/**
 * Hexaedro genérico a partir de 8 vértices (4 da base, 4 do topo, mesma ordem), com colisão
 * opcional. Usado para muretas inclinadas (paredes laterais de escadas) e cunhas.
 */
export function hexa(b, bot, top, o = {}) {
  const c = [0, 0, 0];
  for (const p of [...bot, ...top]) for (let k = 0; k < 3; k++) c[k] += p[k] / 8;
  const faces = [
    [bot[0], bot[1], top[1], top[0]],
    [bot[1], bot[2], top[2], top[1]],
    [bot[2], bot[3], top[3], top[2]],
    [bot[3], bot[0], top[0], top[3]],
    [top[0], top[1], top[2], top[3]],
  ];
  for (const f of faces) {
    const fc = [0, 1, 2].map((k) => (f[0][k] + f[1][k] + f[2][k] + f[3][k]) / 4);
    quadFacing(b, f[0], f[1], f[2], f[3], [fc[0] - c[0], fc[1] - c[1], fc[2] - c[2]], o);
  }
}

/**
 * Mureta com topo inclinado ao longo de Z local (ex.: parapeito de escada).
 * x = centro, de z0 (altura h0 acima de y0) a z1 (altura h1), espessura t.
 */
export function slopedWall(b, x, z0, z1, y0, h0, h1, t, o = {}) {
  const xa = x - t / 2;
  const xb = x + t / 2;
  const bot = [
    [xa, y0, z0],
    [xb, y0, z0],
    [xb, y0, z1],
    [xa, y0, z1],
  ];
  const top = [
    [xa, y0 + h0, z0],
    [xb, y0 + h0, z0],
    [xb, y0 + h1, z1],
    [xa, y0 + h1, z1],
  ];
  hexa(b, bot, top, { collide: true, ...o });
}

/**
 * Rampa de colisão invisível que sobe ao longo de X local (de xa, cota ya, até xb, cota yb),
 * cobrindo z de za a zb. (Builder.colliderRamp só sobe ao longo de −Z.)
 */
export function rampX(b, xa, ya, xb, yb, za, zb) {
  b.push(0, 0, (za + zb) / 2, Math.PI / 2); // Z' local → +X do quadro pai
  b.colliderRamp(Math.abs(zb - za), 0, xa, ya, xb, yb);
  b.pop();
}

/**
 * Parede ao longo de Z local (de z0 a z1) em x, com aberturas medidas a partir de z0.
 * (Builder.wall constrói ao longo de X; aqui giramos o quadro em −90°.)
 */
export function wallZ(b, x, z0, z1, h, t, o = {}) {
  b.push(x, 0, 0, -Math.PI / 2); // X' local → +Z do quadro pai
  b.wall(z0, z1, 0, h, t, o);
  b.pop();
}

/**
 * Coluna coríntia SIMPLIFICADA (baixo número de triângulos) para instanciar nos pórticos.
 * Devolve { body, shaft }: body = base + capitel (material liso), shaft = fuste (material
 * com caneluras por normal map). Base da coluna em y = 0. ~450 triângulos.
 */
export function liteCorinthianGeoms(D, H) {
  const R = D / 2;
  const capH = D * 1.0;
  const baseH = D * 0.5;
  const shaftH = H - capH - baseH;
  const rTop = R * 0.85;
  const body = [];
  // base ática simplificada: plinto + toro
  body.push(G.normalizeGeometry(G.box(D * 1.34, baseH * 0.32, D * 1.34)));
  body.push(G.normalizeGeometry(G.lathe([[R * 1.3, baseH * 0.32], [R * 1.3, baseH * 0.5], [R * 1.1, baseH * 0.62], [R * 1.14, baseH * 0.8], [R, baseH]], 12)));
  // capitel: cálato + uma coroa de 8 folhas + 4 volutas + ábaco
  const y0 = baseH + shaftH;
  body.push(G.normalizeGeometry(G.lathe([[rTop * 1.04, y0], [rTop, y0 + capH * 0.08], [rTop * 1.02, y0 + capH * 0.5], [R * 1.15, y0 + capH * 0.86]], 10)));
  for (let i = 0; i < 8; i++) {
    const a = ((i + 0.5) / 8) * Math.PI * 2;
    const leaf = G.sphere(D * 0.13, 5, 3);
    leaf.scale(1.1, 2.4, 0.65);
    leaf.rotateX(-0.3);
    leaf.rotateY(a);
    leaf.translate(Math.sin(a) * rTop * 1.05, y0 + capH * 0.06, Math.cos(a) * rTop * 1.05);
    body.push(G.normalizeGeometry(leaf));
  }
  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 4 + (i / 4) * Math.PI * 2;
    const vol = G.sphere(D * 0.11, 5, 3);
    vol.translate(Math.sin(a) * R * 1.22, y0 + capH * 0.62, Math.cos(a) * R * 1.22);
    body.push(G.normalizeGeometry(vol));
  }
  body.push(G.normalizeGeometry(G.box(D * 1.42, capH * 0.14, D * 1.42).translate(0, y0 + capH * 0.86, 0)));
  // fuste com leve êntase (U = caneluras para o material "Fluted")
  const shaft = G.lathe([[R, baseH], [R * 1.01, baseH + shaftH * 0.33], [R * 0.93, baseH + shaftH * 0.7], [rTop, baseH + shaftH]], 14, { flutes: 24, vByHeight: true });
  return { body: G.merge(body), shaft: G.normalizeGeometry(shaft), capH, baseH, shaftH };
}

/** Matriz local (translação + rotação Y + escala opcional). */
export function mat4(x, y, z, rotY = 0, s = 1) {
  return new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotY), new THREE.Vector3(s, s, s));
}

/** Cilindro entre dois pontos locais (vigas, cordas, varas de andaime). */
export function beam(b, a, c, r, o = {}) {
  const A = new THREE.Vector3(...a);
  const B = new THREE.Vector3(...c);
  const len = A.distanceTo(B);
  const g = G.cylinder(r, r, len, o.segments ?? 5, { caps: false });
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize());
  const m = new THREE.Matrix4().compose(A, q, new THREE.Vector3(1, 1, 1));
  b.add(g, { mat: o.mat || 'woodDark', matrix: m, color: o.color, collide: false });
}

/** Caixa entre dois pontos locais (prancha/viga de seção retangular). */
export function plank(b, a, c, w, h, o = {}) {
  const A = new THREE.Vector3(...a);
  const B = new THREE.Vector3(...c);
  const len = A.distanceTo(B);
  const g = G.box(w, len, h); // ao longo de +Y
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize());
  const m = new THREE.Matrix4().compose(A, q, new THREE.Vector3(1, 1, 1));
  b.add(g, { mat: o.mat || 'wood', matrix: m, color: o.color, collide: o.collide ?? false });
}
