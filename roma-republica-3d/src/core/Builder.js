/**
 * Builder — API principal para modelar edifícios.
 *
 * Um Builder acumula geometrias em um "quadro local" (pilha de transformações),
 * agrupa-as por material e, em `finish()`, funde tudo em poucas malhas
 * (poucas draw calls) e registra as geometrias de colisão no World.
 *
 * Convenções (IMPORTANTE para quem escreve sítios):
 *   - Unidades em metros. Primitivas "de pé" posicionadas pela BASE: y é a cota inferior.
 *   - rotY em radianos (positivo = anti-horário visto de cima).
 *   - Use b.push(x, y, z, rotY) para entrar no quadro de um edifício (fachada → +Z local;
 *     veja geo.facingRotY) e b.pop() para sair.
 *   - opts.mat: chave da biblioteca de materiais (render/materials.js).
 *   - opts.collide: true (usa a própria geometria — padrão para caixas), 'box' (caixa
 *     envolvente orientada), false (sem colisão; padrão para detalhes pequenos).
 *   - opts.color: tinge a peça (cor de vértice multiplicada pela textura).
 *
 * Exemplo:
 *   const b = ctx.builder('templo-saturno');
 *   b.push(x, ground, z, facingRotY(60));
 *   b.box(22.5, 9, 40, 0, 0, 0, { mat: 'travertine' });   // pódio
 *   b.pop();
 *   b.finish();
 */
import * as THREE from 'three';
import * as G from '../render/geom.js';
import { materials } from '../render/materials.js';

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3();
const _p = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);

export class Builder {
  /**
   * @param {import('./World.js').World} world
   * @param {string} name   nome (aparece no inspetor / estatísticas)
   * @param {object} o      { interior: bool (materiais @interior), castShadow, receiveShadow,
   *                          maxDistance (m; esconde além disso), chunkSize (m; divide em blocos p/ culling) }
   */
  constructor(world, name, o = {}) {
    this.world = world;
    this.name = name;
    this.opts = { castShadow: true, receiveShadow: true, interior: false, maxDistance: null, chunkSize: 0, ...o };
    this.stack = [new THREE.Matrix4()];
    /** @type {Map<string, THREE.BufferGeometry[]>} chave = material|chunk */
    this.parts = new Map();
    this.colliders = [];
    this.finished = false;
    this.group = new THREE.Group();
    this.group.name = name;
  }

  /** Matriz do quadro atual. */
  get frame() {
    return this.stack[this.stack.length - 1];
  }

  /** Entra num quadro local: translada (x,y,z), gira rotY e (opcional) escala uniforme. */
  push(x = 0, y = 0, z = 0, rotY = 0, scale = 1) {
    _q.setFromAxisAngle(UP, rotY);
    _s.set(scale, scale, scale);
    _p.set(x, y, z);
    _m.compose(_p, _q, _s);
    this.stack.push(this.frame.clone().multiply(_m));
    return this;
  }

  /** Sai do quadro local atual. */
  pop() {
    if (this.stack.length <= 1) throw new Error('Builder.pop() sem push() correspondente');
    this.stack.pop();
    return this;
  }

  /** Executa fn dentro de um quadro local. */
  frameDo(x, y, z, rotY, fn) {
    this.push(x, y, z, rotY);
    try {
      fn(this);
    } finally {
      this.pop();
    }
    return this;
  }

  /** Converte um ponto local (x,y,z) para coordenadas do mundo. */
  toWorld(x, y, z) {
    return new THREE.Vector3(x, y, z).applyMatrix4(this.frame);
  }

  /** Chave de material efetiva (aplica a variante @interior se o builder for de interior). */
  matKey(mat, o) {
    const interior = o.interior ?? this.opts.interior;
    if (interior && !mat.endsWith('@interior')) return mat + '@interior';
    return mat;
  }

  /**
   * Adiciona uma geometria arbitrária (no quadro local atual).
   * @param {THREE.BufferGeometry} geom
   * @param {object} o { mat, color, collide, matrix (Matrix4 local adicional), colliderGeom }
   */
  add(geom, o = {}) {
    if (this.finished) throw new Error(`Builder "${this.name}" já finalizado`);
    const mat = this.matKey(o.mat || 'stucco', o);
    materials.get(mat); // valida a chave cedo (erro claro se não existir)
    const m = this.frame.clone();
    if (o.matrix) m.multiply(o.matrix);
    const collide = o.collide ?? false;
    // caixa envolvente local calculada ANTES de transformar (normalize pode reutilizar o objeto)
    let localBox = null;
    if (collide === 'box' && !o.colliderGeom) {
      geom.computeBoundingBox();
      localBox = geom.boundingBox.clone();
    }
    const g = G.normalizeGeometry(geom, o.color);
    g.applyMatrix4(m);
    const key = this.chunkKey(mat, g);
    if (!this.parts.has(key)) this.parts.set(key, []);
    this.parts.get(key).push(g);

    if (collide) {
      let cg;
      if (o.colliderGeom) cg = o.colliderGeom.clone().applyMatrix4(m);
      else if (localBox) {
        const size = new THREE.Vector3().subVectors(localBox.max, localBox.min);
        cg = G.box(size.x, size.y, size.z);
        cg.translate((localBox.min.x + localBox.max.x) / 2, localBox.min.y, (localBox.min.z + localBox.max.z) / 2);
        cg.applyMatrix4(m);
      } else cg = g;
      this.colliders.push(cg);
    }
    return this;
  }

  /** Apenas colisão (invisível): geometria no quadro local. */
  collider(geom, matrix = null) {
    const g = geom.index ? geom.toNonIndexed() : geom.clone();
    if (matrix) g.applyMatrix4(matrix);
    g.applyMatrix4(this.frame);
    this.colliders.push(g);
    return this;
  }

  /** Caixa de colisão invisível (base em y). */
  colliderBox(w, h, d, x, y, z, rotY = 0) {
    const g = G.box(w, h, d);
    return this.collider(g, localMatrix(x, y, z, rotY));
  }

  /**
   * Rampa de colisão invisível (para escadas): sobe de y0 (em z = z0) até y1 (em z = z1),
   * largura w centrada em x. Coordenadas locais.
   */
  colliderRamp(w, x, z0, y0, z1, y1) {
    const x0 = x - w / 2;
    const x1 = x + w / 2;
    const pos = [];
    const quad = (a, b, c, d) => pos.push(...a, ...b, ...c, ...a, ...c, ...d);
    const lo = Math.min(y0, y1) - 0.05;
    quad([x0, y0, z0], [x1, y0, z0], [x1, y1, z1], [x0, y1, z1]); // superfície
    quad([x0, y1, z1], [x1, y1, z1], [x1, y0, z0], [x0, y0, z0]); // verso
    quad([x0, lo, z0], [x0, y0, z0], [x0, y1, z1], [x0, lo, z1]); // lateral
    quad([x1, lo, z1], [x1, y1, z1], [x1, y0, z0], [x1, lo, z0]); // lateral
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    return this.collider(g);
  }

  /* ----------------------------------------------------------------------- */
  /*  Primitivas                                                             */
  /* ----------------------------------------------------------------------- */

  /**
   * Caixa: largura w (X), altura h (Y), profundidade d (Z); base em (x, y, z).
   * opts: { mat, rotY, color, collide (padrão true), fit, faces }
   */
  box(w, h, d, x = 0, y = 0, z = 0, o = {}) {
    const g = G.box(w, h, d, { fit: o.fit ?? materials.isFit(o.mat || ''), faces: o.faces });
    return this.add(g, { ...o, collide: o.collide ?? true, matrix: localMatrix(x, y, z, o.rotY || 0) });
  }

  /** Cilindro / tronco de cone com base em (x,y,z). opts: { mat, segments, color, collide, caps } */
  cylinder(rBottom, rTop, h, x = 0, y = 0, z = 0, o = {}) {
    const seg = o.segments ?? 16;
    const g = G.cylinder(rBottom, rTop, h, seg, { caps: o.caps, bottomCap: o.bottomCap, flutes: o.flutes });
    let colliderGeom;
    if (o.collide) colliderGeom = G.cylinder(Math.max(rBottom, rTop), Math.max(rBottom, rTop), h, 8);
    return this.add(g, { ...o, collide: o.collide ?? false, colliderGeom, matrix: localMatrix(x, y, z, o.rotY || 0) });
  }

  /** Superfície de revolução a partir de perfil [[r, y], ...] posicionada em (x,y,z). */
  lathe(profile, x = 0, y = 0, z = 0, o = {}) {
    const g = G.lathe(profile, o.segments ?? 24, { flutes: o.flutes, vByHeight: o.vByHeight });
    return this.add(g, { ...o, collide: o.collide ?? false, matrix: localMatrix(x, y, z, o.rotY || 0) });
  }

  /** Prisma vertical a partir de polígono [[x,z],...] (coords locais), base em y, altura h. */
  prism(points, h, y = 0, o = {}) {
    const g = G.prism(points, h, { top: o.top, bottom: o.bottom, sides: o.sides });
    return this.add(g, { ...o, collide: o.collide ?? true, matrix: localMatrix(0, y, 0, 0) });
  }

  /** Quadrilátero arbitrário (pontos locais [x,y,z], anti-horário visto da face). */
  quad(a, b, c, d, o = {}) {
    const g = G.quad(a, b, c, d, { fit: o.fit ?? materials.isFit(o.mat || '') });
    return this.add(g, { ...o, collide: o.collide ?? false });
  }

  /** Triângulo (pontos locais). */
  tri(a, b, c, o = {}) {
    return this.add(G.triangle(a, b, c), { ...o, collide: o.collide ?? false });
  }

  /** Plano horizontal (piso) de w × d com o topo em y. */
  floor(w, d, x = 0, y = 0, z = 0, o = {}) {
    const t = o.thickness ?? 0.05;
    return this.box(w, t, d, x, y - t, z, { ...o, faces: { bottom: false } });
  }

  /** Esfera com base em y. */
  sphere(r, x = 0, y = 0, z = 0, o = {}) {
    return this.add(G.sphere(r, o.wSeg ?? 12, o.hSeg ?? 8), { ...o, collide: o.collide ?? false, matrix: localMatrix(x, y, z, 0) });
  }

  /**
   * Parede ao longo do eixo X local (de x0 a x1), espessura t, base y, altura h, em z,
   * com aberturas [{ at: posição do centro ao longo da parede, w, h, y: peitoril }].
   * Gera caixas para os trechos cheios (com colisão) — portas atravessáveis.
   */
  wall(x0, x1, z, h, t, o = {}) {
    const y = o.y ?? 0;
    const L = x1 - x0;
    const ops = (o.openings || []).map((op) => ({ a: op.at - op.w / 2, b: op.at + op.w / 2, y0: op.y ?? 0, h: op.h })).sort((p, q) => p.a - q.a);
    let cur = 0;
    const seg = (a, b, yy, hh) => {
      if (b - a < 0.01 || hh < 0.01) return;
      this.box(b - a, hh, t, x0 + (a + b) / 2, y + yy, z, o);
    };
    for (const op of ops) {
      seg(cur, op.a, 0, h); // trecho cheio antes da abertura
      seg(op.a, op.b, 0, op.y0); // peitoril
      seg(op.a, op.b, op.y0 + op.h, h - op.y0 - op.h); // verga até o topo
      cur = op.b;
    }
    seg(cur, L, 0, h);
    return this;
  }

  /**
   * Parede entre dois pontos locais (xa,za) → (xb,zb). Mesmas opções de wall().
   * As aberturas usam `at` medido a partir do ponto A.
   */
  wallAB(xa, za, xb, zb, h, t, o = {}) {
    const len = Math.hypot(xb - xa, zb - za);
    const ang = Math.atan2(-(zb - za), xb - xa);
    this.push(xa, 0, za, ang);
    this.wall(0, len, 0, h, t, o);
    this.pop();
    return this;
  }

  /**
   * Escada reta: largura w, sobe de y até y+h ao longo de -Z local a partir de z0
   * (o primeiro degrau começa em z0 e a escada termina em z0 - depth).
   * Inclui rampa de colisão invisível para subir suavemente.
   */
  stairs(w, depth, h, x = 0, y = 0, z0 = 0, o = {}) {
    const n = o.steps ?? Math.max(1, Math.round(h / 0.22));
    const sh = h / n;
    const sd = depth / n;
    for (let i = 0; i < n; i++) {
      // cada degrau é um bloco que vai do chão até a sua altura (mais estável visualmente)
      this.box(w, sh * (i + 1), sd, x, y, z0 - sd * (i + 0.5), { ...o, collide: false });
    }
    // colisão: bloco cheio sob a rampa + rampa
    this.colliderRamp(w, x, z0 + 0.05, y, z0 - depth, y + h);
    return this;
  }

  /* ----------------------------------------------------------------------- */
  /*  Finalização                                                            */
  /* ----------------------------------------------------------------------- */

  chunkKey(mat, g) {
    const cs = this.opts.chunkSize;
    if (!cs) return mat;
    g.computeBoundingBox();
    const c = g.boundingBox.getCenter(_p);
    return `${mat}|${Math.floor(c.x / cs)},${Math.floor(c.z / cs)}`;
  }

  /** Funde as geometrias por material, cria as malhas e registra colisões. Retorna o Group. */
  finish() {
    if (this.finished) return this.group;
    this.finished = true;
    for (const [key, list] of this.parts) {
      const mat = key.split('|')[0];
      const geo = compactAttributes(G.merge(list));
      geo.computeBoundingSphere();
      geo.computeBoundingBox();
      const mesh = new THREE.Mesh(geo, materials.get(mat));
      mesh.name = `${this.name}:${key}`;
      mesh.castShadow = this.opts.castShadow && !mat.startsWith('water');
      mesh.receiveShadow = this.opts.receiveShadow;
      mesh.matrixAutoUpdate = false;
      mesh.updateMatrix();
      this.group.add(mesh);
      if (this.opts.maxDistance) this.world.culler.add(mesh, this.opts.maxDistance);
      for (const g of list) g.dispose();
    }
    this.parts.clear();
    for (const c of this.colliders) this.world.addCollider(c);
    this.colliders = [];
    this.world.scene.add(this.group);
    this.world.stats.builders++;
    return this.group;
  }
}

/**
 * Reduz a memória da geometria fundida: normais em Int8 normalizado e cores em Uint8
 * normalizado (44 → 26 bytes por vértice). Visualmente idêntico.
 */
function compactAttributes(geo) {
  const n = geo.attributes.normal;
  if (n && n.array instanceof Float32Array) {
    const src = n.array;
    const dst = new Int8Array(src.length);
    for (let i = 0; i < src.length; i++) dst[i] = Math.max(-127, Math.min(127, Math.round(src[i] * 127)));
    geo.setAttribute('normal', new THREE.BufferAttribute(dst, 3, true));
  }
  const c = geo.attributes.color;
  if (c && c.array instanceof Float32Array) {
    const src = c.array;
    const dst = new Uint8Array(src.length);
    for (let i = 0; i < src.length; i++) dst[i] = Math.max(0, Math.min(255, Math.round(src[i] * 255)));
    geo.setAttribute('color', new THREE.BufferAttribute(dst, 3, true));
  }
  return geo;
}

/** Matriz local de translação + rotação Y. */
export function localMatrix(x, y, z, rotY = 0) {
  const m = new THREE.Matrix4().makeRotationY(rotY);
  m.setPosition(x, y, z);
  return m;
}
