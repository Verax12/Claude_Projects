/**
 * Monumentos da praça do Fórum de César (nota 04 §4):
 *   - Estátua equestre de César (Equus Caesaris) "diante do templo", cavalo com patas dianteiras
 *     "semelhantes às humanas" (Plín. 8.155; Suet. 61; Estácio, Silv. 1.1.84–87: "defronte ao templo").
 *     Tamanho "maior que o natural" e posição no centro do pátio: hipóteses (fonte divulgativa).
 *   - Estátua de César couraçado (loricata), "no seu fórum" (Plín. 34.18) — posição NÃO ENCONTRADA.
 *   - Fonte Appias (ninfas): atestada só em Ovídio (época augustana) — OPCIONAL/hipotética para
 *     44 a.C.; R. Ulrich a põe diretamente diante do pódio [M-ARL-APP].
 *   - Altar diante do templo: NÃO documentado (elemento usual dos templos; hipótese declarada).
 */
import * as THREE from 'three';
import * as G from '../../render/geom.js';
import { statue } from '../../arch/temple.js';
import { prop } from '../../arch/props.js';
import { Y, TPL, ORIGIN, ROT } from './frame.js';
import { mat4 } from './helpers.js';

export const MON = {
  equusZ: 44, // estátua equestre no eixo, voltada para o templo
  altarZ: 27,
  fountainZ0: 17.25,
  fountainZ1: 21.0,
  loricata: [-20, 2],
};

export function buildStatues(ctx) {
  const b = ctx.builder('forum-iulium:monumentos');
  b.push(ORIGIN.x, 0, ORIGIN.z, ROT);
  const base = Y.pave;

  // ---------------- estátua equestre ----------------
  {
    const z = MON.equusZ;
    // pedestal de travertino revestido de mármore, com degrau e molduras
    b.box(4.4, 0.35, 7.0, 0, base, z, { mat: 'travertine' });
    b.box(3.4, 0.35, 6.0, 0, base + 0.35, z, { mat: 'marbleGrey', collide: false });
    b.box(3.0, 2.6, 5.6, 0, base + 0.35, z, { mat: 'marble' });
    b.box(3.4, 0.3, 6.0, 0, base + 2.95, z, { mat: 'marbleGrey', collide: false });
    // tábula (inscrição sugerida: linhas incisas ilegíveis — o texto real não foi encontrado)
    for (const s of [-1, 1]) {
      b.box(0.05, 1.3, 3.2, s * 1.52, base + 0.95, z, { mat: 'marbleGrey', collide: false });
      for (let l = 0; l < 4; l++) b.box(0.03, 0.07, 2.6 - (l % 2) * 0.6, s * 1.555, base + 1.2 + l * 0.27, z, { mat: 'flat', color: '#6a6458', collide: false });
    }
    // cavalo e cavaleiro, de bronze, ~1,6× o natural, voltados para o templo (−Z local)
    b.push(0, base + 3.25, z, Math.PI, 1.6);
    horseAndRider(b);
    b.pop();
  }

  // ---------------- César couraçado ----------------
  {
    const [x, z] = MON.loricata;
    b.box(1.5, 0.3, 1.5, x, base, z, { mat: 'travertine' });
    b.box(1.15, 1.9, 1.15, x, base + 0.3, z, { mat: 'marble' });
    b.box(1.35, 0.22, 1.35, x, base + 2.2, z, { mat: 'marbleGrey', collide: false });
    b.push(x, base + 2.42, z, Math.PI / 2 - 0.35, 1.15); // voltada para a praça (ENE)
    loricataFigure(b);
    b.pop();
  }

  // ---------------- fonte (Appias) diante do pódio ----------------
  {
    const z0 = MON.fountainZ0;
    const z1 = MON.fountainZ1;
    const zc = (z0 + z1) / 2;
    const w = 15;
    const d = z1 - z0;
    const rimH = 0.75;
    b.box(w, 0.25, d, 0, base, zc, { mat: 'marbleGrey', collide: false }); // fundo
    b.box(w, rimH, 0.35, 0, base, z1 - 0.175, { mat: 'marble' });
    for (const s of [-1, 1]) b.box(0.35, rimH, d, s * (w / 2 - 0.175), base, zc, { mat: 'marble' });
    b.box(w + 0.2, 0.12, 0.5, 0, base + rimH, z1 - 0.175, { mat: 'marble', collide: false });
    for (const s of [-1, 1]) b.box(0.5, 0.12, d + 0.1, s * (w / 2 - 0.175), base + rimH, zc, { mat: 'marble', collide: false });
    // espelho d'água
    b.quad([-w / 2 + 0.35, base + 0.55, z1 - 0.35], [w / 2 - 0.35, base + 0.55, z1 - 0.35], [w / 2 - 0.35, base + 0.55, z0], [-w / 2 + 0.35, base + 0.55, z0], { mat: 'water' });
    // bicas de bronze na face do pódio e jatos d'água (Ovídio: "Appias expressis aera pulsat aquis")
    for (const x of [-4.5, 0, 4.5]) {
      const zf = TPL.podZ1; // face frontal do pódio
      b.add(G.cylinder(0.09, 0.07, 0.45, 6).rotateX(Math.PI / 2), { mat: 'bronze', matrix: mat4(x, base + 1.6, zf) });
      b.box(0.55, 0.55, 0.12, x, base + 1.4, zf + 0.06, { mat: 'bronze', collide: false });
      // jato em arco (segmentos de cilindro) da bica até a água
      const pts = [];
      for (let k = 0; k <= 6; k++) {
        const t = k / 6;
        pts.push([x, base + 1.6 - t * t * 1.05 + t * 0.12, zf + 0.45 + t * 1.4]);
      }
      for (let k = 0; k < 6; k++) waterSeg(b, pts[k], pts[k + 1], 0.045);
    }
    for (const x of [-2.25, 2.25]) {
      b.cylinder(0.05, 0.03, 1.3, x, base + 0.55, zc + 0.4, { mat: 'water', segments: 6 });
      b.sphere(0.09, x, base + 1.8, zc + 0.4, { mat: 'water', wSeg: 6, hSeg: 4 });
    }
    // ninfas (Apíades) — marcadores sobre os cantos da borda
    for (const s of [-1, 1]) statue(b, s * (w / 2 - 0.5), base + rimH + 0.12, zc, { scale: 0.85, mat: 'marble', pedestal: false, rotY: s * 0.5 });
  }

  // ---------------- altar (hipótese) ----------------
  {
    const z = MON.altarZ;
    b.box(4.2, 0.3, 3.2, 0, base, z, { mat: 'travertine' });
    b.box(3.0, 0.25, 2.0, 0, base + 0.3, z, { mat: 'marbleGrey', collide: false });
    b.box(2.6, 1.0, 1.6, 0, base + 0.3, z, { mat: 'marble' });
    b.box(3.0, 0.25, 2.0, 0, base + 1.3, z, { mat: 'marbleGrey', collide: false });
    for (const s of [-1, 1]) b.cylinder(0.22, 0.22, 2.0, s * 1.3, base + 1.55, z - 1.0, { mat: 'marble', segments: 10, collide: false, caps: true });
    // pulvini (volutas laterais) deitados
    for (const s of [-1, 1]) {
      const g = G.cylinder(0.22, 0.22, 2.0, 10, { caps: true, bottomCap: true });
      g.rotateX(Math.PI / 2);
      b.add(g, { mat: 'marble', matrix: mat4(s * 1.3, base + 1.77, z - 1.0) });
    }
    b.box(0.9, 0.12, 0.6, 0, base + 1.55, z, { mat: 'bronze', collide: false }); // braseiro
  }

  b.pop();
  b.finish();

  // ---------------- cadeira de ouro no pronaos (cena de 44 a.C.) ----------------
  const d = ctx.builder('forum-iulium:monumentos-detalhe', { maxDistance: 90 });
  d.push(ORIGIN.x, 0, ORIGIN.z, ROT);
  const top = Y.podium;
  const cz = 11.6;
  d.box(3.6, 0.2, 2.6, 0, top, cz - 0.3, { mat: 'cloth', color: '#7a2a2a', collide: false }); // tapete/estrado
  d.box(0.75, 0.08, 0.6, 0, top + 0.42, cz, { mat: 'gold', collide: false });
  for (const s of [-1, 1]) {
    for (const t of [-1, 1]) {
      const leg = G.box(0.06, 0.6, 0.06);
      d.add(leg, { mat: 'gold', matrix: new THREE.Matrix4().makeRotationX(t * 0.6).setPosition(s * 0.32, top + 0.2, cz) });
    }
  }
  d.box(0.6, 0.12, 0.4, 0, top + 0.2, cz + 0.55, { mat: 'gold', collide: false }); // escabelo
  d.pop();
  d.finish();
}

/** Segmento de jato d'água entre dois pontos. */
function waterSeg(b, a, c, r) {
  const A = new THREE.Vector3(...a);
  const B = new THREE.Vector3(...c);
  const g = G.cylinder(r, r, A.distanceTo(B), 5, { caps: false });
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize());
  b.add(g, { mat: 'water', matrix: new THREE.Matrix4().compose(A, q, new THREE.Vector3(1, 1, 1)) });
}

/**
 * Cavalo (tamanho natural, quadro local com a frente em +Z, cascos em y = 0) e cavaleiro.
 * Pata dianteira direita erguida; cascos dianteiros fendidos ("como pés humanos", Plín. 8.155),
 * sugeridos por cascos divididos. Volumes simplificados (marcador).
 */
function horseAndRider(b) {
  const mat = 'bronze';
  const add = (g, m) => b.add(g, { mat, matrix: m });
  const ell = (rx, ry, rz, x, y, z, rotX = 0) => {
    const g = G.sphere(1, 12, 8);
    g.translate(0, -1, 0);
    g.scale(rx, ry, rz);
    g.rotateX(rotX);
    g.translate(x, y, z);
    add(g, new THREE.Matrix4());
  };
  const limb = (a, c, r0, r1) => {
    const A = new THREE.Vector3(...a);
    const B = new THREE.Vector3(...c);
    const g = G.cylinder(r0, r1, A.distanceTo(B), 8);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize());
    add(g, new THREE.Matrix4().compose(A, q, new THREE.Vector3(1, 1, 1)));
  };
  // corpo, peito e garupa
  ell(0.34, 0.36, 0.78, 0, 1.18, 0);
  ell(0.32, 0.36, 0.34, 0, 1.22, 0.5);
  ell(0.34, 0.35, 0.36, 0, 1.2, -0.48);
  // pescoço e cabeça (erguida)
  limb([0, 1.35, 0.62], [0, 1.95, 0.98], 0.2, 0.13);
  ell(0.12, 0.13, 0.3, 0, 2.0, 1.12, 0.6);
  limb([0, 2.0, 1.0], [0, 1.82, 1.36], 0.1, 0.07);
  // orelhas e crina
  for (const s of [-1, 1]) limb([s * 0.06, 2.1, 0.98], [s * 0.07, 2.24, 0.95], 0.025, 0.01);
  b.box(0.06, 0.12, 0.6, 0, 1.78, 0.78, { mat, collide: false, rotY: 0 });
  // pernas traseiras (apoiadas)
  for (const s of [-1, 1]) {
    limb([s * 0.17, 1.05, -0.62], [s * 0.18, 0.55, -0.72], 0.1, 0.06);
    limb([s * 0.18, 0.55, -0.72], [s * 0.18, 0.04, -0.62], 0.055, 0.045);
    b.box(0.12, 0.06, 0.15, s * 0.18, 0, -0.62, { mat, collide: false });
  }
  // dianteira esquerda apoiada, direita erguida (dobrada)
  limb([0.16, 1.0, 0.58], [0.16, 0.5, 0.62], 0.09, 0.055);
  limb([0.16, 0.5, 0.62], [0.16, 0.04, 0.64], 0.05, 0.045);
  for (const s of [-1, 1]) b.box(0.05, 0.06, 0.13, 0.16 + s * 0.03, 0, 0.66, { mat, collide: false }); // casco fendido
  limb([-0.16, 1.0, 0.58], [-0.16, 0.72, 0.86], 0.09, 0.055);
  limb([-0.16, 0.72, 0.86], [-0.16, 0.5, 0.72], 0.05, 0.045);
  // cauda
  limb([0, 1.3, -0.82], [0, 0.75, -1.0], 0.07, 0.04);
  // apoio estrutural sob o ventre (comum em estátuas equestres; discreto)
  limb([0, 0.0, 0.1], [0, 0.85, 0.1], 0.07, 0.07);
  // cavaleiro: tronco, cabeça, braço direito erguido (gesto), manto
  limb([0, 1.5, 0.05], [0, 2.18, 0.08], 0.17, 0.14);
  b.sphere(0.12, 0, 2.2, 0.08, { mat });
  for (const s of [-1, 1]) {
    limb([s * 0.14, 1.52, 0.1], [s * 0.3, 1.2, 0.25], 0.07, 0.05); // coxa
    limb([s * 0.3, 1.2, 0.25], [s * 0.32, 0.82, 0.12], 0.05, 0.04); // perna
  }
  limb([0.16, 2.05, 0.08], [0.32, 2.42, 0.32], 0.045, 0.035); // braço direito erguido
  limb([-0.16, 2.05, 0.08], [-0.2, 1.75, 0.35], 0.045, 0.035); // braço esquerdo (rédeas)
  b.box(0.42, 0.55, 0.06, 0, 1.6, -0.12, { mat, collide: false }); // manto (paludamentum)
}

/** César couraçado (figura de pé com couraça e manto) — marcador volumétrico. */
function loricataFigure(b) {
  const mat = 'bronze';
  b.add(G.lathe([[0.26, 0], [0.24, 0.5], [0.2, 0.9], [0.24, 1.0]], 10, { vByHeight: true }), { mat }); // pernas/saiote (pteryges)
  b.add(G.lathe([[0.24, 1.0], [0.27, 1.25], [0.25, 1.45], [0.14, 1.55]], 10, { vByHeight: true }), { mat }); // couraça
  b.sphere(0.125, 0, 1.55, 0, { mat });
  b.box(0.5, 0.9, 0.06, 0.05, 0.75, -0.22, { mat, collide: false }); // manto
  const arm = G.cylinder(0.05, 0.04, 0.62, 6);
  arm.rotateX(-1.2);
  b.add(arm, { mat, matrix: mat4(0.26, 1.38, 0) }); // braço direito estendido
  const arm2 = G.cylinder(0.05, 0.04, 0.55, 6);
  arm2.rotateZ(0.25);
  b.add(arm2, { mat, matrix: mat4(-0.27, 0.9, 0) });
}

/** Objetos pequenos ao redor (vasos de libação junto ao altar). */
export function altarProps(d) {
  prop(d, 'jar', 0.6, Y.pave + 1.55, MON.altarZ + 0.3, 0, 0.6, { mat: 'bronze' });
}
