/**
 * Sistema de NPCs: habitantes que caminham por uma rede de caminhos, param para
 * conversar, trabalham em bancas, sentam-se (latrinas, degraus) e respondem ao jogador.
 *
 * Desempenho: cada parte do corpo (coxa, canela, braço, túnica, cabeça…) é um único
 * InstancedMesh compartilhado por todos os NPCs. A cada quadro só os NPCs próximos e
 * dentro do campo de visão são escritos nos buffers (contagem compactada).
 *
 * API para os sítios (via ctx.npcs):
 *   addPath(points, { loop, mix, density, width, name })  — rede de caminhada
 *   addStatic({ x, y?, z, yaw, type, pose: 'stand'|'sit'|'gesture'|'work', look })
 *   addGroup({ path..., leader: 'senator', followers: ['lictor','lictor','slave'] }) — séquito
 */
import * as THREE from 'three';
import * as G from '../render/geom.js';
import { NPC_TYPES, DEFAULT_MIX } from './npcTypes.js';
import { mulberry32 } from '../render/noise.js';

const UP = new THREE.Vector3(0, 1, 0);
const _m = new THREE.Matrix4();
const _m2 = new THREE.Matrix4();
const _m3 = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _v = new THREE.Vector3();
const _s = new THREE.Vector3(1, 1, 1);
const _sphere = new THREE.Sphere();
const _frustum = new THREE.Frustum();
const _pm = new THREE.Matrix4();
const _col = new THREE.Color();
const _rx = new THREE.Matrix4();
const _rz = new THREE.Matrix4();

/* ------------------------------------------------------------------------- */
/*  Geometria das partes (origem nos pés, frente = +Z)                        */
/* ------------------------------------------------------------------------- */
function makePartGeometries() {
  const P = {};
  const n = (g) => G.normalizeGeometry(g);
  // coxa: pivô no quadril, pendurada para baixo (0 → -0.42)
  P.thigh = n(G.cylinder(0.062, 0.078, 0.42, 8).translate(0, -0.42, 0));
  // canela + pé (sandália)
  const shin = G.cylinder(0.045, 0.06, 0.38, 8).translate(0, -0.38, 0);
  const foot = G.box(0.09, 0.05, 0.22).translate(0, -0.43, 0.05);
  P.shin = n(G.merge([n(shin), n(foot)]));
  // tronco com túnica até o joelho
  const torso = G.lathe([[0.17, 0.0], [0.15, 0.2], [0.18, 0.5], [0.19, 0.62], [0.12, 0.7]], 10, { vByHeight: true }).translate(0, 0.78, 0);
  const skirt = G.lathe([[0.245, 0.0], [0.2, 0.25], [0.17, 0.42]], 10, { vByHeight: true }).translate(0, 0.42, 0);
  P.tunic = n(G.merge([n(torso), n(skirt)]));
  // faixa vertical (latus clavus) na frente da túnica
  P.stripe = n(G.box(0.05, 0.62, 0.02).translate(0, 0.78, 0.18));
  // veste longa (toga / stola) até os tornozelos
  P.robe = n(G.lathe([[0.29, 0.0], [0.25, 0.35], [0.2, 0.75], [0.18, 1.0]], 12, { vByHeight: true }).translate(0, 0.06, 0));
  // drapeado da toga: faixa diagonal sobre o ombro esquerdo (frente e costas)
  const sashF = G.box(0.2, 0.85, 0.05);
  sashF.translate(0, -0.42, 0);
  sashF.rotateZ(0.55);
  sashF.translate(0.12, 1.46, 0.17);
  const sashB = sashF.clone().translate(0, 0, -0.36);
  const shoulder = G.box(0.22, 0.12, 0.42).translate(0.13, 1.38, 0);
  P.toga = n(G.merge([n(sashF), n(sashB), n(shoulder)]));
  // borda púrpura da toga praetexta (fina faixa paralela ao drapeado)
  const border = G.box(0.035, 0.85, 0.055);
  border.translate(0, -0.42, 0);
  border.rotateZ(0.55);
  border.translate(0.2, 1.42, 0.18);
  P.togaBorder = n(border);
  // braço: pivô no ombro (0 → -0.62) com mão
  const arm = G.cylinder(0.04, 0.055, 0.56, 7).translate(0, -0.56, 0);
  const hand = G.sphere(0.045, 6, 4).translate(0, -0.66, 0);
  P.arm = n(G.merge([n(arm), n(hand)]));
  // cabeça e pescoço
  const neck = G.cylinder(0.05, 0.05, 0.1, 6).translate(0, 1.44, 0);
  const head = G.sphere(0.105, 12, 8).translate(0, 1.5, 0);
  const nose = G.box(0.03, 0.05, 0.04).translate(0, 1.6, 0.1);
  P.head = n(G.merge([n(neck), n(head), n(nose)]));
  // cabelo (calota) e coque feminino
  const hair = new THREE.SphereGeometry(0.112, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.5);
  hair.translate(0, 1.6, -0.012);
  P.hair = n(hair);
  const bun = G.sphere(0.06, 8, 6).translate(0, 1.62, -0.12);
  P.bun = n(G.merge([n(hair.clone()), n(bun)]));
  // palla sobre a cabeça e ombros
  const veil = G.lathe([[0.27, 0.0], [0.22, 0.25], [0.14, 0.45], [0.125, 0.55], [0.0, 0.62]], 12, { vByHeight: true }).translate(0, 1.08, -0.02);
  P.veil = n(veil);
  // avental de comerciante
  P.apron = n(G.box(0.3, 0.5, 0.03).translate(0, 0.5, 0.22));
  // elmo (calota + botão de crista) e cota de malha
  const helm = new THREE.SphereGeometry(0.125, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.55);
  helm.translate(0, 1.59, 0);
  const knob = G.cylinder(0.015, 0.02, 0.05, 6).translate(0, 1.71, 0);
  P.helmet = n(G.merge([n(helm), n(knob)]));
  P.armor = n(G.lathe([[0.215, 0.0], [0.2, 0.3], [0.21, 0.55], [0.13, 0.68]], 10, { vByHeight: true }).translate(0, 0.72, 0));
  // escudo oval (scutum) no braço esquerdo
  const shield = G.cylinder(0.5, 0.5, 0.04, 14);
  shield.scale(0.62, 1, 1);
  shield.rotateX(Math.PI / 2);
  shield.translate(-0.33, 0.92, 0.12);
  P.shield = n(shield);
  // fasces: feixe de varas com machado, apoiado no ombro esquerdo
  const rods = G.cylinder(0.055, 0.055, 1.25, 8);
  rods.rotateZ(0.18);
  rods.translate(-0.24, 0.45, 0.06);
  const axe = G.box(0.02, 0.14, 0.12).translate(-0.12, 1.62, 0.06);
  P.fasces = n(G.merge([n(rods), n(axe)]));
  // cargas
  const amph = G.lathe([[0.0, 0.0], [0.05, 0.05], [0.13, 0.25], [0.12, 0.45], [0.05, 0.55], [0.04, 0.68], [0.0, 0.7]], 10);
  amph.rotateZ(1.2);
  amph.translate(0.4, 1.32, 0);
  P.amphora = n(amph);
  P.sack = n(G.sphere(0.2, 8, 6).scale(1.2, 0.8, 1).translate(0.15, 1.38, -0.12));
  const basket = G.cylinder(0.16, 0.2, 0.14, 10).translate(0, 1.66, 0);
  P.basket = n(basket);
  return P;
}

/* ------------------------------------------------------------------------- */

export class NPCSystem {
  constructor(world, scene, quality) {
    this.world = world;
    this.scene = scene;
    this.quality = quality;
    this.nodes = []; // { x, y, z, edges: [idx], yResolved }
    this.paths = [];
    this.statics = [];
    this.groups = [];
    this.npcs = [];
    this.enabled = true;
    this.rng = mulberry32(1234);
    this.time = 0;
    this.player = null;
    this.talking = null;
  }

  /* --------------------------- API dos sítios ---------------------------- */

  /**
   * Adiciona um caminho de caminhada.
   * @param {Array<number[]>} points  [[x,z]] ou [[x,y,z]] (y opcional = altura do piso)
   * @param {object} o { loop=false, mix (pesos de tipos), density = NPCs por 100 m, width = largura útil (m), name }
   */
  addPath(points, o = {}) {
    const pts = points.map((p) => (p.length === 3 ? { x: p[0], y: p[1], z: p[2] } : { x: p[0], y: null, z: p[1] }));
    const ids = pts.map((p) => this._node(p));
    for (let i = 0; i < ids.length - 1; i++) this._edge(ids[i], ids[i + 1]);
    if (o.loop && ids.length > 2) this._edge(ids[ids.length - 1], ids[0]);
    let len = 0;
    for (let i = 0; i < pts.length - 1; i++) len += Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].z - pts[i].z);
    this.paths.push({ ids, len, mix: o.mix || DEFAULT_MIX, density: o.density ?? 3, width: o.width ?? 3, name: o.name || '' });
  }

  /** NPC parado (comerciante numa banca, pessoa sentada na latrina, orador…). */
  addStatic(o) {
    this.statics.push({ pose: 'stand', yaw: 0, type: 'citizen', ...o });
  }

  /**
   * Séquito: um líder (ex.: magistrado) seguido por acompanhantes ao longo de um caminho.
   * @param {object} o { points, loop, leader, followers: [tipos] }
   */
  addGroup(o) {
    this.groups.push(o);
  }

  _node(p) {
    for (let i = 0; i < this.nodes.length; i++) {
      const n = this.nodes[i];
      if (Math.abs(n.x - p.x) < 1 && Math.abs(n.z - p.z) < 1 && (p.y == null || n.y == null || Math.abs(n.y - p.y) < 1)) return i;
    }
    this.nodes.push({ x: p.x, y: p.y, z: p.z, edges: [] });
    return this.nodes.length - 1;
  }

  _edge(a, b) {
    if (a === b) return;
    if (!this.nodes[a].edges.includes(b)) this.nodes[a].edges.push(b);
    if (!this.nodes[b].edges.includes(a)) this.nodes[b].edges.push(a);
  }

  /* ------------------------------ Inicialização --------------------------- */

  /** Chamado após World.finalize(): resolve alturas e cria NPCs e instâncias. */
  init() {
    for (const n of this.nodes) {
      if (n.y == null) n.y = this.world.groundAt(n.x, n.z, (this.world.terrain?.heightAt(n.x, n.z) ?? 0) + 3);
    }
    this.parts = makePartGeometries();
    this.material = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.88, metalness: 0, vertexColors: true });
    this.metalMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.45, metalness: 0.7, vertexColors: true });
    const budget = this.quality.npcCount;
    // distribuição proporcional ao comprimento × densidade
    const total = this.paths.reduce((s, p) => s + p.len * p.density, 0) || 1;
    const staticsCount = this.statics.length + this.groups.reduce((s, g) => s + 1 + (g.followers?.length || 0), 0);
    const walkersBudget = Math.max(0, budget - staticsCount);
    for (const path of this.paths) {
      const count = Math.round((path.len * path.density * walkersBudget) / total);
      for (let k = 0; k < count; k++) this._spawnWalker(path);
    }
    for (const s of this.statics) this._spawnStatic(s);
    for (const g of this.groups) this._spawnGroup(g);
    this._createInstances();
  }

  _pickType(mix) {
    const entries = Object.entries(mix);
    const sum = entries.reduce((s, [, w]) => s + w, 0);
    let r = this.rng() * sum;
    for (const [t, w] of entries) {
      r -= w;
      if (r <= 0) return t;
    }
    return entries[0][0];
  }

  _makeNPC(type) {
    const def = NPC_TYPES[type] || NPC_TYPES.citizen;
    const look = def.make(this.rng);
    return {
      type,
      def,
      look,
      x: 0,
      y: 0,
      z: 0,
      yaw: 0,
      speed: 0,
      phase: this.rng() * 10,
      state: 'walk',
      timer: 0,
      pose: 'stand',
      gesture: 0,
      lateral: 0,
      visible: false,
    };
  }

  _spawnWalker(path) {
    if (path.ids.length < 2) return;
    const npc = this._makeNPC(this._pickType(path.mix));
    const seg = Math.floor(this.rng() * (path.ids.length - 1));
    npc.from = path.ids[seg];
    npc.to = path.ids[seg + 1];
    npc.t = this.rng();
    npc.baseSpeed = (npc.type === 'child' ? 1.2 : 0.95) + this.rng() * 0.45;
    npc.lateral = (this.rng() - 0.5) * path.width;
    npc.state = 'walk';
    this._placeOnEdge(npc);
    this.npcs.push(npc);
  }

  _spawnStatic(s) {
    const npc = this._makeNPC(s.type);
    npc.state = 'static';
    npc.pose = s.pose;
    npc.x = s.x;
    npc.z = s.z;
    npc.y = s.y ?? this.world.groundAt(s.x, s.z, (this.world.terrain?.heightAt(s.x, s.z) ?? 0) + 3);
    npc.yaw = s.yaw;
    npc.baseYaw = s.yaw;
    if (s.look) Object.assign(npc.look, s.look);
    this.npcs.push(npc);
  }

  _spawnGroup(g) {
    const ids = g.points.map((p) => this._node(p.length === 3 ? { x: p[0], y: p[1], z: p[2] } : { x: p[0], y: null, z: p[1] }));
    for (let i = 0; i < ids.length - 1; i++) this._edge(ids[i], ids[i + 1]);
    for (const n of this.nodes) if (n.y == null) n.y = this.world.groundAt(n.x, n.z, (this.world.terrain?.heightAt(n.x, n.z) ?? 0) + 3);
    const leader = this._makeNPC(g.leader || 'senator');
    leader.from = ids[0];
    leader.to = ids[1];
    leader.t = 0;
    leader.baseSpeed = 0.8;
    leader.state = 'walk';
    leader.route = ids;
    leader.routeLoop = !!g.loop;
    leader.routeIdx = 1;
    this._placeOnEdge(leader);
    this.npcs.push(leader);
    (g.followers || []).forEach((t, i) => {
      const f = this._makeNPC(t);
      f.state = 'follow';
      f.leader = leader;
      // lictores à frente, demais atrás
      const ahead = t === 'lictor';
      const k = ahead ? i + 1 : -(i + 1);
      f.offsetBack = ahead ? -1.6 * k : 1.4 * -k;
      f.offsetSide = (i % 2 === 0 ? 0.5 : -0.5);
      f.x = leader.x;
      f.z = leader.z;
      f.y = leader.y;
      this.npcs.push(f);
    });
  }

  _placeOnEdge(npc) {
    const a = this.nodes[npc.from];
    const b = this.nodes[npc.to];
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const len = Math.hypot(dx, dz) || 1;
    const px = -dz / len;
    const pz = dx / len;
    npc.x = a.x + dx * npc.t + px * npc.lateral;
    npc.z = a.z + dz * npc.t + pz * npc.lateral;
    npc.y = a.y + (b.y - a.y) * npc.t;
    npc.yaw = Math.atan2(dx, dz);
    npc.edgeLen = len;
  }

  /* ------------------------------ Instâncias ------------------------------ */

  _createInstances() {
    const N = Math.max(1, this.npcs.length);
    const mk = (geo, mat, count = N) => {
      const im = new THREE.InstancedMesh(geo, mat, count);
      im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      im.setColorAt(0, new THREE.Color(1, 1, 1));
      im.instanceColor.setUsage(THREE.DynamicDrawUsage);
      im.castShadow = true;
      im.receiveShadow = false;
      im.frustumCulled = false; // a compactação já faz o culling
      im.count = 0;
      this.scene.add(im);
      return im;
    };
    const P = this.parts;
    this.im = {
      thighL: mk(P.thigh, this.material, N),
      thighR: mk(P.thigh, this.material, N),
      shinL: mk(P.shin, this.material, N),
      shinR: mk(P.shin, this.material, N),
      armL: mk(P.arm, this.material, N),
      armR: mk(P.arm, this.material, N),
      tunic: mk(P.tunic, this.material, N),
      head: mk(P.head, this.material, N),
      hair: mk(P.hair, this.material, N),
      bun: mk(P.bun, this.material, N),
      robe: mk(P.robe, this.material, N),
      toga: mk(P.toga, this.material, N),
      togaBorder: mk(P.togaBorder, this.material, N),
      stripe: mk(P.stripe, this.material, N),
      veil: mk(P.veil, this.material, N),
      apron: mk(P.apron, this.material, N),
      armor: mk(P.armor, this.metalMat, N),
      helmet: mk(P.helmet, this.metalMat, N),
      shield: mk(P.shield, this.material, N),
      fasces: mk(P.fasces, this.material, N),
      amphora: mk(P.amphora, this.material, N),
      sack: mk(P.sack, this.material, N),
      basket: mk(P.basket, this.material, N),
    };
  }

  /* ------------------------------ Atualização ----------------------------- */

  /** Avança a simulação e escreve os buffers de instâncias. */
  update(dt, camera, playerPos) {
    if (!this.im || !this.enabled) return;
    this.time += dt;
    for (const npc of this.npcs) this._think(npc, dt, playerPos);
    this._writeInstances(camera);
  }

  _think(npc, dt, playerPos) {
    // conversa com o jogador: para e olha para ele
    if (this.talking && this.talking.npc === npc) {
      npc.speed = 0;
      npc.yaw = lerpAngle(npc.yaw, Math.atan2(playerPos.x - npc.x, playerPos.z - npc.z), Math.min(1, dt * 5));
      npc.gesture = Math.max(npc.gesture, 0.6);
      if (this.time > this.talking.until) this.talking = null;
      npc.phase += dt * 0.5;
      return;
    }
    npc.gesture = Math.max(0, npc.gesture - dt * 0.5);
    if (npc.state === 'static') {
      npc.speed = 0;
      npc.phase += dt;
      if (npc.pose === 'gesture' || npc.pose === 'work') npc.gesture = 0.5 + 0.5 * Math.sin(this.time * 1.3 + npc.phase);
      return;
    }
    if (npc.state === 'follow') {
      const L = npc.leader;
      const fx = Math.sin(L.yaw);
      const fz = Math.cos(L.yaw);
      const tx = L.x - fx * npc.offsetBack + fz * npc.offsetSide;
      const tz = L.z - fz * npc.offsetBack - fx * npc.offsetSide;
      const dx = tx - npc.x;
      const dz = tz - npc.z;
      const d = Math.hypot(dx, dz);
      const sp = Math.min(2.2, d * 2);
      if (d > 0.05) {
        npc.x += (dx / d) * sp * dt;
        npc.z += (dz / d) * sp * dt;
        npc.yaw = lerpAngle(npc.yaw, Math.atan2(dx, dz), Math.min(1, dt * 6));
      }
      npc.y += (L.y - npc.y) * Math.min(1, dt * 5);
      npc.speed = sp;
      npc.phase += sp * dt * 3.2;
      return;
    }
    if (npc.state === 'idle') {
      npc.timer -= dt;
      npc.speed = 0;
      npc.phase += dt;
      if (npc.chatWith) {
        const o = npc.chatWith;
        npc.yaw = lerpAngle(npc.yaw, Math.atan2(o.x - npc.x, o.z - npc.z), Math.min(1, dt * 3));
        npc.gesture = 0.5 + 0.5 * Math.sin(this.time * 2 + npc.phase);
      }
      if (npc.timer <= 0) {
        npc.state = 'walk';
        npc.chatWith = null;
      }
      return;
    }
    // caminhada ao longo da aresta
    // evita atravessar o jogador: espera se ele estiver logo à frente
    const fx = Math.sin(npc.yaw);
    const fz = Math.cos(npc.yaw);
    const px = playerPos.x - npc.x;
    const pz = playerPos.z - npc.z;
    const ahead = px * fx + pz * fz;
    const side = Math.abs(px * fz - pz * fx);
    const blocked = ahead > 0 && ahead < 1.3 && side < 0.6 && Math.abs(playerPos.y - npc.y - 0.9) < 1.5;
    const target = blocked ? 0 : npc.baseSpeed;
    npc.speed += (target - npc.speed) * Math.min(1, dt * 4);
    npc.t += (npc.speed * dt) / npc.edgeLen;
    if (npc.t >= 1) {
      // chegou ao nó: escolhe a próxima aresta
      const prev = npc.from;
      npc.from = npc.to;
      if (npc.route) {
        npc.routeIdx++;
        if (npc.routeIdx >= npc.route.length) {
          if (npc.routeLoop) npc.routeIdx = 0;
          else {
            npc.route.reverse();
            npc.routeIdx = 1;
          }
        }
        npc.to = npc.route[npc.routeIdx];
      } else {
        const opts = this.nodes[npc.from].edges.filter((e) => e !== prev);
        npc.to = opts.length ? opts[Math.floor(this.rng() * opts.length)] : prev;
      }
      npc.t = 0;
      // às vezes para um pouco; se houver alguém parado perto, conversa
      if (!npc.route && this.rng() < 0.18) {
        npc.state = 'idle';
        npc.timer = 3 + this.rng() * 9;
        const near = this.npcs.find((o) => o !== npc && o.state === 'idle' && !o.chatWith && Math.abs(o.x - npc.x) < 3 && Math.abs(o.z - npc.z) < 3);
        if (near) {
          npc.chatWith = near;
          near.chatWith = npc;
          near.timer = Math.max(near.timer, npc.timer);
        }
      }
    }
    const oldYaw = npc.yaw;
    this._placeOnEdge(npc);
    npc.yaw = lerpAngle(oldYaw, npc.yaw, Math.min(1, dt * 6));
    npc.phase += npc.speed * dt * 3.2;
  }

  _writeInstances(camera) {
    _pm.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    _frustum.setFromProjectionMatrix(_pm);
    const maxD = this.quality.npcDrawDistance;
    const cam = camera.position;
    const counts = {};
    for (const k of Object.keys(this.im)) counts[k] = 0;
    const put = (part, matrix, color) => {
      const im = this.im[part];
      const i = counts[part]++;
      im.setMatrixAt(i, matrix);
      im.setColorAt(i, _col.set(color));
    };
    for (const npc of this.npcs) {
      const dx = npc.x - cam.x;
      const dz = npc.z - cam.z;
      const d2 = dx * dx + dz * dz;
      npc.visible = false;
      if (d2 > maxD * maxD) continue;
      _sphere.center.set(npc.x, npc.y + 0.9, npc.z);
      _sphere.radius = 1.2;
      if (!_frustum.intersectsSphere(_sphere)) continue;
      npc.visible = true;
      const L = npc.look;
      const sc = L.scale || 1;
      const sitting = npc.pose === 'sit';
      // base: posição + rotação + escala
      _q.setFromAxisAngle(UP, npc.yaw);
      _s.set(sc, sc, sc);
      const baseY = npc.y - (sitting ? 0.42 * sc : 0);
      _m.compose(_v.set(npc.x, baseY, npc.z), _q, _s);
      // animação
      const walk = Math.min(1, npc.speed / 1.2);
      const ph = npc.phase;
      const swing = Math.sin(ph) * 0.5 * walk;
      const bob = Math.abs(Math.cos(ph)) * 0.03 * walk;
      _m.multiply(_m2.makeTranslation(0, bob, 0));
      const skin = L.skin;
      // pernas
      const hipY = 0.82;
      const legs = [
        ['thighL', 'shinL', 0.085, swing],
        ['thighR', 'shinR', -0.085, -swing],
      ];
      for (const [th, sh, x, a] of legs) {
        let thighA = -a;
        let knee = Math.max(0, Math.sin(ph + (x > 0 ? 0 : Math.PI) + 1.2)) * 0.75 * walk;
        if (sitting) {
          thighA = -1.5;
          knee = 1.5;
        }
        _m2.copy(_m).multiply(_m3.makeTranslation(x, hipY, 0)).multiply(_rx.makeRotationX(thighA));
        put(th, _m2, L.robe && !sitting ? L.robe : skin);
        _m2.multiply(_m3.makeTranslation(0, -0.42, 0)).multiply(_rx.makeRotationX(knee));
        put(sh, _m2, skin);
      }
      // braços
      const togate = !!L.toga;
      const armSwing = sitting ? 0 : swing * 0.8;
      for (const side of [1, -1]) {
        const x = 0.215 * side;
        let ax = side > 0 ? armSwing : -armSwing;
        let az = 0.08 * side;
        if (side === -1 && (togate || L.fasces || L.shield)) {
          ax = -0.5; // braço esquerdo dobrado segurando a toga / fasces / escudo
          az = -0.25;
        }
        if (side === 1 && npc.gesture > 0) {
          // gesto de conversa: antebraço à frente, sem erguer demais o braço
          ax = -0.35 - npc.gesture * 0.55;
          az = 0.15 + npc.gesture * 0.1;
        }
        if (L.carry && side === 1) {
          // mão erguida apoiando a carga: no ombro (ânfora/saco) ou na cabeça (cesto)
          ax = L.carry === 'basket' ? -2.75 : -2.2;
          az = L.carry === 'basket' ? 0.55 : 0.35;
        }
        if (L.carry === 'basket' && side === -1) {
          ax = -2.75;
          az = -0.55;
        }
        _m2.copy(_m).multiply(_m3.makeTranslation(x, 1.4, 0));
        _m2.multiply(_rx.makeRotationX(ax)).multiply(_rz.makeRotationZ(az));
        put(side > 0 ? 'armR' : 'armL', _m2, L.toga ? L.toga : skin);
      }
      // tronco, cabeça
      put('tunic', _m, L.tunic);
      if (L.tunicStripe) put('stripe', _m, L.tunicStripe);
      put('head', _m, skin);
      if (L.helmet) put('helmet', _m, L.helmet);
      else if (L.veil) put('veil', _m, L.veil);
      else put(L.female ? 'bun' : 'hair', _m, L.hair);
      if (L.robe && !sitting) put('robe', _m, L.robe);
      if (L.toga) put('toga', _m, L.toga);
      if (L.togaBorder) put('togaBorder', _m, L.togaBorder);
      if (L.apron) put('apron', _m, L.apron);
      if (L.armor) put('armor', _m, L.armor);
      if (L.shield) put('shield', _m, L.shield);
      if (L.fasces) put('fasces', _m, '#8a6a42');
      if (L.carry === 'amphora') put('amphora', _m, '#b06a42');
      if (L.carry === 'sack') put('sack', _m, '#b9a57e');
      if (L.carry === 'basket') put('basket', _m, '#a88a56');
    }
    for (const [k, im] of Object.entries(this.im)) {
      im.count = counts[k];
      im.instanceMatrix.needsUpdate = true;
      if (im.instanceColor) im.instanceColor.needsUpdate = true;
    }
  }

  /* ------------------------------ Interação ------------------------------- */

  /** NPC visível mais próximo à frente do jogador (para conversar). */
  nearestFacing(pos, dir, maxDist = 3) {
    let best = null;
    let bestD = maxDist;
    for (const npc of this.npcs) {
      if (!npc.visible) continue;
      const dx = npc.x - pos.x;
      const dz = npc.z - pos.z;
      const d = Math.hypot(dx, dz);
      if (d > bestD || Math.abs(npc.y + 1 - pos.y) > 2.5) continue;
      const dot = (dx * dir.x + dz * dir.z) / (d || 1);
      if (dot < 0.5) continue;
      best = npc;
      bestD = d;
    }
    return best;
  }

  /** Inicia uma conversa: devolve { latin, pt, label }. */
  talk(npc) {
    const lines = npc.def.lines;
    const line = lines[Math.floor(this.rng() * lines.length)];
    this.talking = { npc, until: this.time + 4.5 };
    return { latin: line[0], pt: line[1], label: npc.def.label };
  }

  /** Empurra o jogador para fora dos NPCs (colisão simples por círculos). */
  pushPlayer(pos) {
    for (const npc of this.npcs) {
      if (!npc.visible) continue;
      const dx = pos.x - npc.x;
      const dz = pos.z - npc.z;
      const d = Math.hypot(dx, dz);
      if (d < 0.5 && d > 1e-4 && Math.abs(pos.y - npc.y - 1.2) < 1.2) {
        pos.x += (dx / d) * (0.5 - d);
        pos.z += (dz / d) * (0.5 - d);
      }
    }
  }
}

function lerpAngle(a, b, t) {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}
