/**
 * World — registro central do mundo do jogo.
 *
 * Responsabilidades:
 *   - cena Three.js e grupos estáticos;
 *   - geometria de colisão (unificada numa única BVH — three-mesh-bvh);
 *   - consultas de chão (terreno + edifícios);
 *   - lotes de instâncias (InstancedMesh) para objetos repetidos;
 *   - culling por distância de objetos de detalhe;
 *   - locais de teleporte e pontos de informação histórica;
 *   - callbacks de atualização por quadro (animações simples).
 */
import * as THREE from 'three';
import { MeshBVH } from 'three-mesh-bvh';
import * as G from '../render/geom.js';
import { materials } from '../render/materials.js';
import { Builder } from './Builder.js';

export class World {
  constructor(scene) {
    this.scene = scene;
    /** @type {import('./Terrain.js').Terrain} */
    this.terrain = null;
    this.colliderChunks = [];
    this.colliderTriCount = 0;
    /** Malha de colisão (invisível) com BVH. */
    this.collider = null;
    this.culler = new DistanceCuller();
    this.batches = new Map();
    this.locations = [];
    this.infos = [];
    this.updaters = [];
    this.stats = { builders: 0, colliderTris: 0, instances: 0 };
    this._ray = new THREE.Raycaster();
    this._ray.firstHitOnly = true;
  }

  /** Cria um Builder ligado a este mundo. */
  builder(name, opts) {
    return new Builder(this, name, opts);
  }

  /** Registra geometria de colisão (coordenadas do mundo). Só a posição é usada. */
  addCollider(geom) {
    const g = geom.index ? geom.toNonIndexed() : geom;
    const arr = g.attributes.position.array;
    this.colliderChunks.push(arr instanceof Float32Array ? arr.slice() : Float32Array.from(arr));
    this.colliderTriCount += arr.length / 9;
  }

  /**
   * Lote de instâncias para um objeto repetido (ânforas, árvores, bancas...).
   * @param {string} key  identificador único do lote
   * @param {THREE.BufferGeometry} geometry  geometria em coordenadas locais (base em y=0)
   * @param {string} matKey  material
   * @param {object} o { castShadow, receiveShadow, maxDistance, collide: 'box'|false }
   */
  instances(key, geometry, matKey, o = {}) {
    if (!this.batches.has(key)) this.batches.set(key, new InstanceBatch(this, key, geometry, matKey, o));
    return this.batches.get(key);
  }

  /** Registra um local de teleporte (aparece no menu). */
  addLocation(loc) {
    if (this.locations.some((l) => l.id === loc.id)) throw new Error(`Local duplicado: ${loc.id}`);
    this.locations.push({ group: 'Outros', yaw: 0, ...loc });
  }

  /** Registra um ponto de informação (painel exibido quando o jogador se aproxima). */
  addInfo(info) {
    this.infos.push({ radius: 12, ...info });
  }

  /**
   * Registra uma área nomeada (o nome aparece no topo da tela ao entrar).
   * @param {object} a { name, latin, points | rect | circle (como Terrain.addPad), priority (maior vence) }
   */
  addArea(a) {
    this.areas = this.areas || [];
    this.areas.push({ priority: 0, ...a });
  }

  /** Função chamada a cada quadro: fn(dt, elapsed, camera). */
  onUpdate(fn) {
    this.updaters.push(fn);
  }

  /** Constrói a BVH de colisão e finaliza lotes de instâncias. Chamar uma única vez. */
  finalize() {
    for (const b of this.batches.values()) b.build();
    let total = 0;
    for (const c of this.colliderChunks) total += c.length;
    const pos = new Float32Array(total);
    let off = 0;
    for (const c of this.colliderChunks) {
      pos.set(c, off);
      off += c.length;
    }
    this.colliderChunks = [];
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    if (pos.length === 0) {
      // mundo sem colisores: triângulo degenerado distante para manter a BVH válida
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, -1000, 0, 1, -1000, 0, 0, -1000, 1]), 3));
    }
    geo.boundsTree = new MeshBVH(geo, { maxLeafTris: 8 });
    this.collider = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ wireframe: true, color: 0xff0000 }));
    this.collider.visible = false;
    this.collider.name = 'collider';
    this.stats.colliderTris = pos.length / 9;
  }

  /**
   * Altura do chão em (x,z): o maior entre o terreno e a primeira superfície
   * horizontal (normal.y > 0.5) encontrada abaixo de `fromY`.
   */
  groundAt(x, z, fromY = 400) {
    const t = this.terrain ? this.terrain.heightAt(x, z) : 0;
    if (!this.collider) return t;
    const ray = this._ray.ray;
    ray.origin.set(x, fromY, z);
    ray.direction.set(0, -1, 0);
    const hit = this.collider.geometry.boundsTree.raycastFirst(ray, THREE.DoubleSide);
    if (hit && hit.point.y > t && (!hit.face || Math.abs(hit.face.normal.y) > 0.5)) return hit.point.y;
    return t;
  }

  /** Atualização por quadro (culling e animações registradas). */
  update(dt, elapsed, camera) {
    this.culler.update(camera);
    for (const fn of this.updaters) fn(dt, elapsed, camera);
  }
}

/**
 * Lote de instâncias: acumula transformações e cria um InstancedMesh por blocos espaciais
 * (para o frustum culling funcionar bem com objetos espalhados pela cidade).
 */
class InstanceBatch {
  constructor(world, key, geometry, matKey, o) {
    this.world = world;
    this.key = key;
    this.geometry = G.normalizeGeometry(geometry);
    this.geometry.computeBoundingBox();
    this.matKey = matKey;
    this.o = { castShadow: true, receiveShadow: true, maxDistance: null, collide: false, chunkSize: 120, ...o };
    this.items = [];
  }

  /**
   * Adiciona uma instância.
   * @param {number} x @param {number} y @param {number} z
   * @param {number} rotY @param {number|number[]} scale  escala uniforme ou [sx,sy,sz]
   * @param {*} color  cor opcional (multiplica a cor de vértice)
   */
  add(x, y, z, rotY = 0, scale = 1, color = null) {
    const s = Array.isArray(scale) ? scale : [scale, scale, scale];
    const m = new THREE.Matrix4().compose(
      new THREE.Vector3(x, y, z),
      new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotY),
      new THREE.Vector3(s[0], s[1], s[2]),
    );
    this.items.push({ m, color: color ? G.toColor(color) : null, x, z });
    if (this.o.collide === 'box') {
      const bb = this.geometry.boundingBox;
      const size = new THREE.Vector3().subVectors(bb.max, bb.min);
      const cg = G.box(size.x, size.y, size.z);
      cg.translate((bb.min.x + bb.max.x) / 2, bb.min.y, (bb.min.z + bb.max.z) / 2);
      cg.applyMatrix4(m);
      this.world.addCollider(cg);
    }
    return this;
  }

  build() {
    if (!this.items.length) return;
    const cs = this.o.chunkSize;
    const chunks = new Map();
    for (const it of this.items) {
      const k = `${Math.floor(it.x / cs)},${Math.floor(it.z / cs)}`;
      if (!chunks.has(k)) chunks.set(k, []);
      chunks.get(k).push(it);
    }
    const mat = materials.get(this.matKey);
    for (const [k, list] of chunks) {
      const im = new THREE.InstancedMesh(this.geometry, mat, list.length);
      im.name = `inst:${this.key}:${k}`;
      list.forEach((it, i) => {
        im.setMatrixAt(i, it.m);
        if (it.color) im.setColorAt(i, it.color);
      });
      if (im.instanceColor) {
        // instâncias sem cor explícita ficam brancas
        list.forEach((it, i) => {
          if (!it.color) im.setColorAt(i, new THREE.Color(1, 1, 1));
        });
        im.instanceColor.needsUpdate = true;
      }
      im.instanceMatrix.needsUpdate = true;
      im.computeBoundingSphere();
      im.computeBoundingBox();
      im.castShadow = this.o.castShadow;
      im.receiveShadow = this.o.receiveShadow;
      this.world.scene.add(im);
      if (this.o.maxDistance) this.world.culler.add(im, this.o.maxDistance);
    }
    this.world.stats.instances += this.items.length;
  }
}

/** Esconde objetos além de uma distância máxima (verificação escalonada a cada poucos quadros). */
class DistanceCuller {
  constructor() {
    this.items = [];
    this.frame = 0;
    this.scale = 1;
    this._c = new THREE.Vector3();
  }

  add(obj, maxDist) {
    this.items.push({ obj, maxDist });
  }

  update(camera) {
    this.frame++;
    if (this.frame % 6 !== 0 || !this.items.length) return;
    const cp = camera.position;
    for (const it of this.items) {
      const o = it.obj;
      const bs = o.isInstancedMesh ? o.boundingSphere : o.geometry?.boundingSphere;
      if (!bs) continue;
      this._c.copy(bs.center).applyMatrix4(o.matrixWorld);
      const d = this._c.distanceTo(cp) - bs.radius;
      o.visible = d < it.maxDist * this.scale;
    }
  }
}
