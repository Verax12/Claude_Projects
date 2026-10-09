/**
 * Circo Máximo — cena ilustrativa: uma quadriga e uma biga treinando na pista, e cavalos
 * parados junto às carceres com seus tratadores.
 *
 * Quadrigas, bigas e cavaleiros correram nos jogos de 46 a.C. (Suet. Iul. 39.2, nota 10 §1);
 * um treino no início de 44 a.C. é CENA HIPOTÉTICA (declarada no painel dos jogos).
 *
 * Desempenho: corpos dos cavalos e pernas são dois InstancedMesh; carros + aurigas um terceiro.
 * As matrizes são atualizadas por quadro só quando a câmera está a menos de ~500 m.
 */
import * as THREE from 'three';
import * as G from '../../render/geom.js';
import { CENTER, ROT, FLOOR, META_X, CARCERES } from './plan.js';

const n = (g, c) => G.normalizeGeometry(g, c);

/** Corpo do cavalo (sem as pernas): +Z = frente, base no chão. */
function horseBodyGeometry() {
  const dark = '#3a2a1e';
  const parts = [];
  const body = G.cylinder(0.3, 0.32, 1.25, 10).rotateX(Math.PI / 2).translate(0, 1.22, -0.62);
  parts.push(n(body));
  parts.push(n(G.sphere(0.36, 10, 7).scale(1, 0.95, 1.1).translate(0, 0.88, 0.55))); // peito
  parts.push(n(G.sphere(0.38, 10, 7).scale(1, 0.95, 1.05).translate(0, 0.86, -0.62))); // garupa
  const neck = G.box(0.24, 0.8, 0.34).translate(0, 0, 0).rotateX(0.62).translate(0, 1.32, 0.78);
  parts.push(n(neck));
  parts.push(n(G.box(0.07, 0.62, 0.1).rotateX(0.62).translate(0, 1.42, 0.68), dark)); // crina
  const head = G.box(0.2, 0.24, 0.58).rotateX(0.55).translate(0, 1.82, 1.16);
  parts.push(n(head));
  for (const s of [-1, 1]) parts.push(n(G.box(0.05, 0.14, 0.05).translate(s * 0.07, 2.08, 1.0), dark)); // orelhas
  parts.push(n(G.box(0.09, 0.62, 0.09).rotateX(-0.35).translate(0, 0.72, -1.15), dark)); // cauda
  // arreio: coleira escura
  parts.push(n(G.box(0.34, 0.12, 0.4).rotateX(0.62).translate(0, 1.18, 0.62), '#2a221b'));
  return G.merge(parts);
}

/** Perna: pivô no topo (y = 0), estende-se para baixo. */
function legGeometry() {
  return G.merge([
    n(G.box(0.13, 0.62, 0.15).translate(0, -0.62, 0)),
    n(G.box(0.09, 0.3, 0.1).translate(0, -0.9, 0.02)),
    n(G.box(0.12, 0.08, 0.14).translate(0, -0.98, 0.03), '#2a221b'), // casco
  ]);
}

/** Carro de corrida leve + auriga. Origem no chão sob o eixo; +Z = frente. */
function chariotGeometry(nHorses) {
  const wood = '#7a5232';
  const tunic = '#d8ccb0';
  const skin = '#b98258';
  const parts = [];
  parts.push(n(G.box(1.0, 0.08, 0.75).translate(0, 0.62, 0.1), wood)); // plataforma
  parts.push(n(G.box(1.0, 0.75, 0.06).translate(0, 0.7, 0.47), '#8e3b2c')); // anteparo frontal (couro pintado)
  for (const s of [-1, 1]) parts.push(n(G.box(0.06, 0.45, 0.6).translate(s * 0.5, 0.7, 0.18), wood));
  parts.push(n(G.cylinder(0.04, 0.04, 1.5, 6).rotateZ(Math.PI / 2).translate(0.75, 0.45, 0), '#4a3120')); // eixo
  for (const s of [-1, 1]) {
    const wheel = G.cylinder(0.45, 0.45, 0.07, 14).rotateZ(Math.PI / 2).translate(s * 0.7 + 0.035, 0.45 - 0.45, 0);
    // o cilindro foi girado em torno do eixo Z: base no eixo x; recentra a altura no cubo
    wheel.translate(0, 0.45, 0);
    parts.push(n(wheel, '#4a3120'));
  }
  // timão até a canga
  const pole = G.box(0.08, 0.08, 2.4).translate(0, 0, 1.2).rotateX(-0.18).translate(0, 0.6, 0.4);
  parts.push(n(pole, wood));
  const yokeW = nHorses === 4 ? 1.0 : 1.0;
  parts.push(n(G.box(yokeW, 0.08, 0.1).translate(0, 1.0, 2.75), wood));
  // auriga em pé (túnica curta cingida, faixas no tronco — tipo de aparência genérico)
  parts.push(n(G.cylinder(0.2, 0.17, 0.75, 8).translate(0, 0.7, 0.05), tunic));
  parts.push(n(G.box(0.36, 0.5, 0.24).translate(0, 1.42, 0.05), tunic));
  parts.push(n(G.sphere(0.12, 8, 6).translate(0, 1.95, 0.08), skin));
  for (const s of [-1, 1]) parts.push(n(G.box(0.08, 0.08, 0.5).translate(s * 0.18, 1.6, 0.3), skin)); // braços para a frente
  // rédeas até as cabeças dos cavalos
  const hx = nHorses === 4 ? [-1.2, -0.4, 0.4, 1.2] : [-0.4, 0.4];
  for (const x of hx) {
    const from = new THREE.Vector3(Math.sign(x) * 0.18, 1.6, 0.55);
    const to = new THREE.Vector3(x, 1.8, 3.45);
    const len = from.distanceTo(to);
    const g = G.box(0.025, 0.025, len).translate(0, 0, len / 2);
    const m = new THREE.Matrix4().lookAt(new THREE.Vector3(), to.clone().sub(from), new THREE.Vector3(0, 1, 0));
    // lookAt orienta −Z para o alvo; inverte para +Z
    g.applyMatrix4(new THREE.Matrix4().makeRotationY(Math.PI)).applyMatrix4(m).translate(from.x, from.y, from.z);
    parts.push(n(g, '#3a2a1e'));
  }
  return G.merge(parts);
}

const HORSE_COLORS = ['#6b3f22', '#8a4b25', '#a59e94', '#2e2622', '#7a5236', '#5a3a26', '#9a8e80', '#6e4a30', '#4a3426'];
const LEGS = [
  [0.16, 0.92, 0.52, 0.0],
  [-0.16, 0.92, 0.52, 0.35],
  [0.17, 0.92, -0.62, 0.6],
  [-0.17, 0.92, -0.62, 0.95],
];

/**
 * @param {object} ctx  contexto do sítio
 * @returns {{ statics: object[] }}  pontos para tratadores (NPCs estáticos)
 */
export function buildQuadrigae(ctx) {
  const mat = ctx.mats.get('flat');
  const teams = [
    { nh: 4, speed: 11.5, s: 0 },
    { nh: 2, speed: 9.5, s: 420 },
  ];
  const staticHorses = [
    // junto ao portão central, do lado de fora (praça ONO) — X, Z, rumo local
    { X: CARCERES.back - 6, Z: -5.5, yaw: Math.PI / 2 },
    { X: CARCERES.back - 7.5, Z: -3.6, yaw: Math.PI / 2 + 0.3 },
    { X: CARCERES.back - 9, Z: 6.5, yaw: -Math.PI / 2 },
  ];
  const nMoving = teams.reduce((s, t) => s + t.nh, 0);
  const nHorses = nMoving + staticHorses.length;
  const group = new THREE.Group();
  group.name = 'circo:quadrigae';
  group.position.set(CENTER.x, 0, CENTER.z);
  group.rotation.y = ROT;
  const bodies = new THREE.InstancedMesh(horseBodyGeometry(), mat, nHorses);
  const legs = new THREE.InstancedMesh(legGeometry(), mat, nHorses * 4);
  const chariots = [new THREE.Mesh(chariotGeometry(4), mat), new THREE.Mesh(chariotGeometry(2), mat)];
  for (const m of [bodies, legs, ...chariots]) {
    m.castShadow = true;
    m.receiveShadow = true;
    m.frustumCulled = false;
    group.add(m);
  }
  const col = new THREE.Color();
  for (let i = 0; i < nHorses; i++) {
    col.set(HORSE_COLORS[i % HORSE_COLORS.length]);
    bodies.setColorAt(i, col);
    for (let k = 0; k < 4; k++) legs.setColorAt(i * 4 + k, col);
  }
  ctx.scene.add(group);

  // pista de treino: retas a Z = ±16 entre as metas, curvas de raio 16 em volta delas (sentido anti-horário visto de cima)
  const r = 16;
  const x0 = META_X[0];
  const x1 = META_X[1];
  const Ls = x1 - x0;
  const Lc = Math.PI * r;
  const total = 2 * Ls + 2 * Lc;
  const at = (s) => {
    s = ((s % total) + total) % total;
    if (s < Ls) return { x: x0 + s, z: r, hx: 1, hz: 0 };
    s -= Ls;
    if (s < Lc) {
      const a = Math.PI / 2 - s / r;
      return { x: x1 + r * Math.cos(a), z: r * Math.sin(a), hx: Math.sin(a), hz: -Math.cos(a) };
    }
    s -= Lc;
    if (s < Ls) return { x: x1 - s, z: -r, hx: -1, hz: 0 };
    s -= Ls;
    const a = -Math.PI / 2 - s / r;
    return { x: x0 + r * Math.cos(a), z: r * Math.sin(a), hx: Math.sin(a), hz: -Math.cos(a) };
  };

  const mTeam = new THREE.Matrix4();
  const mH = new THREE.Matrix4();
  const mL = new THREE.Matrix4();
  const tmp = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const UP = new THREE.Vector3(0, 1, 0);
  const pos = new THREE.Vector3();
  const one = new THREE.Vector3(1, 1, 1);
  const camLocal = new THREE.Vector3();
  const inv = new THREE.Matrix4();

  /** Escreve as matrizes de um cavalo (corpo + 4 pernas) a partir da matriz do cavalo. */
  const writeHorse = (i, m, phase, amp) => {
    bodies.setMatrixAt(i, m);
    for (let k = 0; k < 4; k++) {
      const [lx, ly, lz, off] = LEGS[k];
      const a = Math.sin(phase + off * Math.PI * 2) * amp;
      mL.copy(m).multiply(tmp.makeTranslation(lx, ly, lz)).multiply(tmp.makeRotationX(a));
      legs.setMatrixAt(i * 4 + k, mL);
    }
  };

  // cavalos parados (pernas quase retas, pequena variação)
  staticHorses.forEach((h, j) => {
    q.setFromAxisAngle(UP, h.yaw);
    mH.compose(pos.set(h.X, FLOOR, h.Z), q, one);
    writeHorse(nMoving + j, mH, j * 1.3, 0.06);
  });

  let time = 0;
  const update = (dt, elapsed, camera) => {
    time += dt;
    if (camera) {
      group.updateMatrixWorld();
      inv.copy(group.matrixWorld).invert();
      camLocal.copy(camera.position).applyMatrix4(inv);
      const far = Math.hypot(camLocal.x, camLocal.z) > 520;
      group.visible = !far;
      if (far) return;
    }
    let hi = 0;
    teams.forEach((t, ti) => {
      const s = t.s + time * t.speed;
      const p = at(s);
      const yaw = Math.atan2(p.hx, p.hz);
      q.setFromAxisAngle(UP, yaw);
      mTeam.compose(pos.set(p.x, FLOOR, p.z), q, one);
      chariots[ti].matrix.copy(mTeam);
      chariots[ti].matrixAutoUpdate = false;
      const hxs = t.nh === 4 ? [-1.2, -0.4, 0.4, 1.2] : [-0.4, 0.4];
      const phase = (s / 2.8) * Math.PI * 2;
      hxs.forEach((hx, k) => {
        mH.copy(mTeam).multiply(tmp.makeTranslation(hx, 0, 2.3 + (k % 2) * 0.06));
        writeHorse(hi++, mH, phase + k * 0.4, 0.62);
      });
    });
    bodies.instanceMatrix.needsUpdate = true;
    legs.instanceMatrix.needsUpdate = true;
  };
  update(0, 0, null);
  if (bodies.instanceColor) bodies.instanceColor.needsUpdate = true;
  if (legs.instanceColor) legs.instanceColor.needsUpdate = true;
  ctx.onUpdate(update);

  // pontos para os tratadores junto aos cavalos parados (no quadro do circo)
  return { grooms: staticHorses.map((h) => ({ X: h.X + 0.9 * Math.cos(h.yaw), Z: h.Z - 0.9 * Math.sin(h.yaw) + 0.8 })) };
}
