/**
 * Utilidades de modelagem do sítio "forum-oeste": quadro do Fórum, vigas entre dois pontos,
 * lajes inclinadas com colisão, andaimes, gruas de roda de tração, blocos empilhados,
 * figuras de Tritão (frontão de Saturno) e escadas orientadas.
 *
 * Componentes novos ficam aqui (ARQUITETURA.md §3.4: "crie-o dentro do seu próprio arquivo").
 */
import * as THREE from 'three';
import * as G from '../../render/geom.js';
import { FORUM_FRAME } from '../../data/layout.js';
import { facingRotY } from '../../core/geo.js';
import { mulberry32 } from '../../render/noise.js';

/** Entra no quadro do Fórum (X local = v, Z local = u, origem em FORUM_FRAME.origin). */
export function pushFF(b, y = 0) {
  b.push(FORUM_FRAME.origin[0], y, FORUM_FRAME.origin[1], facingRotY(119));
}

const _up = new THREE.Vector3(0, 1, 0);
const _alt = new THREE.Vector3(1, 0, 0);

/** Matriz que leva uma caixa (z de 0 a len, centrada em x/y) para o segmento a→b. */
function segmentMatrix(a, b) {
  const A = new THREE.Vector3(...a);
  const B = new THREE.Vector3(...b);
  const dir = new THREE.Vector3().subVectors(B, A);
  const len = dir.length();
  dir.normalize();
  const up = Math.abs(dir.dot(_up)) > 0.95 ? _alt : _up;
  const xA = new THREE.Vector3().crossVectors(up, dir).normalize();
  const yA = new THREE.Vector3().crossVectors(dir, xA).normalize();
  const m = new THREE.Matrix4().makeBasis(xA, yA, dir);
  m.setPosition(A);
  return { m, len };
}

/** Viga (caixa) de seção w × h entre os pontos locais a e b. */
export function beam(b, a, c, w, h, o = {}) {
  const { m, len } = segmentMatrix(a, c);
  const g = G.box(w, h, len);
  g.translate(0, -h / 2, len / 2);
  b.add(g, { mat: o.mat || 'wood', color: o.color, matrix: m, collide: o.collide ?? false });
}

/** Corda/haste fina (cilindro) entre dois pontos. */
export function rod(b, a, c, r, o = {}) {
  const { m, len } = segmentMatrix(a, c);
  const g = G.cylinder(r, r, len, o.segments ?? 5);
  g.rotateX(Math.PI / 2); // y∈[0,len] → z∈[0,len]... (rotateX(+90°) leva +y para +z)
  b.add(g, { mat: o.mat || 'cloth', color: o.color, matrix: m, collide: false });
}

/**
 * Laje inclinada (piso em rampa) dada por 4 cantos locais [x,y,z] no topo, com espessura e
 * colisão. Desenha o topo, as bordas e (opcional) o fundo.
 */
export function slab(b, P, t, o = {}) {
  let [a, c1, c, d] = P;
  // garante normal para cima
  const n = new THREE.Vector3().subVectors(new THREE.Vector3(...c1), new THREE.Vector3(...a)).cross(new THREE.Vector3().subVectors(new THREE.Vector3(...c), new THREE.Vector3(...a)));
  if (n.y < 0) [a, c1, c, d] = [a, d, c, c1];
  const dn = (p) => [p[0], p[1] - t, p[2]];
  b.quad(a, c1, c, d, { mat: o.mat || 'slabs', color: o.color });
  const edges = [[a, c1], [c1, c], [c, d], [d, a]];
  for (const [p, q] of edges) b.quad(dn(p), dn(q), q, p, { mat: o.sideMat || o.mat || 'slabs', color: o.color });
  if (o.collide !== false) {
    const pos = [];
    const tri = (x, y, z) => pos.push(...x, ...y, ...z);
    tri(a, c1, c);
    tri(a, c, d);
    tri(dn(a), dn(c), dn(c1));
    tri(dn(a), dn(d), dn(c));
    for (const [p, q] of edges) {
      tri(dn(p), dn(q), q);
      tri(dn(p), q, p);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    b.collider(g);
  }
}

/**
 * Escada que sobe na direção do ângulo `rot` (rad, no quadro atual; 0 = sobe para −Z local,
 * como Builder.stairs). (x, z) = centro do primeiro degrau (embaixo).
 */
export function stairsRot(b, w, depth, h, x, y, z, rot, o = {}) {
  b.push(x, 0, z, rot);
  b.stairs(w, depth, h, 0, y, 0, o);
  b.pop();
}

/**
 * Andaime de madeira ao longo do eixo X local (de x0 a x1), afastado `off` da parede (em +Z),
 * com `levels` plataformas a cada `lh` metros a partir de y0.
 */
export function scaffold(b, x0, x1, z, y0, levels, o = {}) {
  const lh = o.levelH ?? 1.9;
  const depth = o.depth ?? 1.3;
  const bay = o.bay ?? 2.4;
  const n = Math.max(1, Math.round((x1 - x0) / bay));
  const H = levels * lh + 1.0;
  const pole = 0.11;
  const rnd = mulberry32(o.seed ?? 7);
  for (let i = 0; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n;
    for (const zz of [z, z + depth]) {
      const hh = H - (rnd() * 0.6);
      b.box(pole, hh, pole, x, y0 - 0.3, zz, { mat: 'woodLight', collide: false });
    }
    // diagonais de contraventamento a cada dois vãos
    if (i < n && i % 2 === 0) {
      const xb = x0 + ((x1 - x0) * (i + 1)) / n;
      beam(b, [x, y0, z + depth], [xb, y0 + Math.min(H - 0.5, lh * 2), z + depth], 0.07, 0.07, { mat: 'woodLight' });
    }
  }
  for (let l = 1; l <= levels; l++) {
    const yy = y0 + l * lh;
    // travessas (ledgers) e pranchas
    for (const zz of [z, z + depth]) b.box(x1 - x0, 0.08, 0.08, (x0 + x1) / 2, yy - 0.12, zz, { mat: 'woodLight', collide: false });
    b.box(x1 - x0, 0.06, depth, (x0 + x1) / 2, yy, z + depth / 2, { mat: 'wood', collide: o.collide ?? false });
    // guarda-corpo
    b.box(x1 - x0, 0.06, 0.06, (x0 + x1) / 2, yy + 0.95, z + depth, { mat: 'woodLight', collide: false });
  }
}

/**
 * Andaime ao longo do segmento (xa,za)→(xb,zb) do quadro atual, afastado `off` para o lado
 * esquerdo do sentido de percurso (vetor (−dz, dx) no plano X/Z).
 */
export function scaffoldAlong(b, xa, za, xb, zb, off, y0, levels, o = {}) {
  const dx = xb - xa;
  const dz = zb - za;
  const len = Math.hypot(dx, dz);
  b.push(xa, 0, za, Math.atan2(-dz, dx));
  scaffold(b, 0, len, off, y0, levels, o);
  b.pop();
}

/**
 * Grua romana com roda de tração (polispasto): duas pernas inclinadas, roda de pisar
 * no pé, cordas até o topo e uma carga (bloco) suspensa. Base em (x,y,z), lança para +Z.
 */
export function crane(b, x, y, z, rotY, o = {}) {
  const H = o.height ?? 11;
  const lean = o.lean ?? 3;
  b.push(x, y, z, rotY);
  // pernas (A) inclinadas para +Z
  const top = [0, H, lean];
  for (const s of [-1, 1]) beam(b, [s * 1.4, 0, 0], top, 0.28, 0.28, { mat: 'woodDark' });
  beam(b, [-1.2, H * 0.35, lean * 0.35], [1.2, H * 0.35, lean * 0.35], 0.16, 0.16, { mat: 'woodDark' });
  beam(b, [-0.7, H * 0.7, lean * 0.7], [0.7, H * 0.7, lean * 0.7], 0.14, 0.14, { mat: 'woodDark' });
  // cabeça e roldanas
  b.box(1.0, 0.35, 0.5, 0, H - 0.2, lean, { mat: 'woodDark', collide: false });
  b.add(G.cylinder(0.32, 0.32, 0.12, 12).rotateZ(Math.PI / 2).translate(0.06, H + 0.05, lean + 0.4), { mat: 'wood' });
  // estais traseiros (cordas)
  for (const s of [-1, 1]) rod(b, top, [s * 2.5, 0, -4.5], 0.025, { mat: 'cloth', color: '#8a7a5c' });
  // roda de tração (diâmetro ~4,5 m) junto ao pé
  const R = o.wheelR ?? 2.3;
  const wheelX = 2.6;
  const ring = G.lathe([[R, -0.7], [R + 0.12, -0.7], [R + 0.12, 0.7], [R, 0.7], [R, -0.7]], 28);
  ring.rotateZ(Math.PI / 2);
  ring.translate(wheelX, R + 0.4, 0.4);
  b.add(ring, { mat: 'wood' });
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI;
    const dy = Math.cos(a) * R;
    const dz = Math.sin(a) * R;
    beam(b, [wheelX, R + 0.4 - dy, 0.4 - dz], [wheelX, R + 0.4 + dy, 0.4 + dz], 0.1, 0.1, { mat: 'woodDark' });
  }
  b.box(0.3, R + 0.4, 0.3, wheelX + 0.9, 0, 0.4, { mat: 'woodDark', collide: true });
  b.box(0.3, R + 0.4, 0.3, wheelX - 0.9, 0, 0.4, { mat: 'woodDark', collide: true });
  // corda da carga e bloco suspenso
  const loadY = o.loadY ?? H * 0.45;
  rod(b, [0.06, H, lean + 0.4], [0.06, loadY + 0.9, lean + 0.4], 0.03, { mat: 'cloth', color: '#8a7a5c' });
  rod(b, [0, H - 0.1, lean], [wheelX, R + 0.4, 0.4], 0.025, { mat: 'cloth', color: '#8a7a5c' });
  b.box(1.2, 0.6, 0.6, 0.06, loadY, lean + 0.4, { mat: o.loadMat || 'travertine', collide: false });
  b.pop();
}

/** Pilha de blocos de pedra (canteiro de obras). */
export function blockStack(b, x, y, z, rotY, o = {}) {
  const rnd = mulberry32(o.seed ?? 3);
  const n = o.count ?? 6;
  const mat = o.mat || 'travertine';
  b.push(x, y, z, rotY);
  let k = 0;
  for (let layer = 0; layer < 3 && k < n; layer++) {
    const per = Math.max(1, 3 - layer);
    for (let i = 0; i < per && k < n; i++, k++) {
      const w = 1.1 + rnd() * 0.3;
      b.box(w, 0.58, 0.6, (i - (per - 1) / 2) * 1.25 + (rnd() - 0.5) * 0.1, layer * 0.6, (rnd() - 0.5) * 0.15, { mat, collide: layer === 0, color: o.color });
    }
  }
  // calços de madeira
  b.box(3.6, 0.1, 0.15, 0, -0.02, 0.15, { mat: 'woodDark', collide: false });
  b.pop();
}

/**
 * Tritão soprando uma trompa (bucina): torso humano, cauda de peixe enrolada e trompa.
 * Figura de frontão em terracota (Macróbio Sat. 1.8.4 via Platner; "com trompas" segundo a ficha LTU).
 */
export function triton(b, x, y, z, rotY, s = 1, mat = 'terracottaPainted') {
  b.push(x, y, z, rotY, s);
  // cauda: segmentos de esfera em arco
  for (let i = 0; i < 6; i++) {
    const a = (i / 5) * Math.PI * 0.9;
    const r = 0.22 - i * 0.025;
    const sp = G.sphere(r, 8, 6).scale(1.4, 1, 1);
    sp.translate(-0.25 - Math.sin(a) * 0.55, 0.05 + (1 - Math.cos(a)) * 0.35, 0);
    b.add(sp, { mat });
  }
  b.add(G.lathe([[0.0, 0.0], [0.18, 0.05], [0.12, 0.25], [0.0, 0.3]], 6).rotateZ(1.2).translate(-0.8, 0.85, 0), { mat }); // barbatana
  // torso e cabeça
  b.add(G.lathe([[0.2, 0], [0.22, 0.3], [0.17, 0.55], [0.08, 0.62]], 8, { vByHeight: true }).translate(0.05, 0.15, 0), { mat });
  b.sphere(0.12, 0.08, 0.78, 0, { mat });
  // braços segurando a trompa (cone longo apontado para cima e para fora)
  const horn = G.cylinder(0.025, 0.11, 0.7, 8);
  horn.rotateZ(-0.9);
  horn.translate(0.18, 0.88, 0);
  b.add(horn, { mat });
  b.add(G.cylinder(0.035, 0.035, 0.32, 5).rotateZ(-1.2).translate(0.08, 0.66, 0.08), { mat });
  b.pop();
}

/** Figura humana simples (estátua de pé) sem pedestal, para frontões e acrotérios. */
export function figure(b, x, y, z, rotY, s = 1, mat = 'terracottaPainted', pose = 0) {
  b.push(x, y, z, rotY, s);
  b.add(G.lathe([[0.26, 0], [0.22, 0.6], [0.17, 1.1], [0.2, 1.35], [0.1, 1.45]], 8, { vByHeight: true }), { mat });
  b.sphere(0.12, 0, 1.45, 0, { mat });
  if (pose === 1) b.add(G.cylinder(0.045, 0.04, 0.6, 5).rotateZ(0.9).translate(0.2, 1.3, 0), { mat });
  else if (pose === 2) b.add(G.cylinder(0.045, 0.04, 0.6, 5).rotateZ(-0.9).translate(-0.2, 1.3, 0), { mat });
  b.pop();
}

/** Vitória alada (acrotério): figura com duas asas planas. */
export function victory(b, x, y, z, rotY, s = 1, mat = 'terracottaPainted') {
  figure(b, x, y, z, rotY, s, mat, 1);
  b.push(x, y, z, rotY, s);
  for (const sd of [-1, 1]) {
    const wing = G.box(0.6, 0.9, 0.04);
    wing.rotateZ(sd * 0.5);
    wing.translate(sd * 0.32, 0.8, -0.15);
    b.add(wing, { mat });
  }
  b.pop();
}
