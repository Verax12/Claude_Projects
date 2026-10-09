/**
 * Macellum — geometrias dos produtos e utensílios do mercado.
 *
 * Todas as geometrias têm a BASE em y = 0, já normalizadas (cores de vértice embutidas
 * quando a peça tem mais de uma cor) — prontas para o Builder (b.add) ou para lotes
 * instanciados (ctx.world.instances), que multiplicam a cor por instância.
 *
 * Produtos SÓ da lista da nota 08 §7 (atestados até 44 a.C.): atum e peixe grande (cetarii),
 * moreias, ostras, peixe salgado; cordeiro, boi, vitela, porco, javali; galinhas, gansos,
 * tordos, pavão; pão; azeite, vinhos (ânforas e cadi), garum; cerejas (novidade de Lúculo),
 * figos, maçãs, peras, marmelos, romãs, ameixas; couves, cogumelos, ervas, alho-poró,
 * grão-de-bico, espelta; queijos; rosas. NADA de tomate, batata, milho, pimentão, abacate,
 * cacau, peru, feijão Phaseolus, café, laranja/limão, berinjela, espinafre, damasco,
 * pistache, pêssego ou açúcar (nota 08 §7.5 e "Anacronismos a evitar").
 *
 * Balanças: statera de braço desigual com prato pequeno, contrapeso corrediço e pontos no
 * braço (Vitrúvio 10.3.4); balança de dois pratos apenas como hipótese (nota 08 §8.1).
 */
import * as THREE from 'three';
import * as G from '../../render/geom.js';

const cache = new Map();
const N = (g, color) => G.normalizeGeometry(g, color);
const M4 = () => new THREE.Matrix4();

/** Aplica escala, rotações (X, Y, Z) e translação a uma geometria (cópia). */
function T(g, { s = [1, 1, 1], rx = 0, ry = 0, rz = 0, t = [0, 0, 0] } = {}) {
  const m = M4().makeTranslation(t[0], t[1], t[2]);
  m.multiply(M4().makeRotationY(ry));
  m.multiply(M4().makeRotationX(rx));
  m.multiply(M4().makeRotationZ(rz));
  m.multiply(M4().makeScale(s[0], s[1], s[2]));
  const c = g.clone();
  c.applyMatrix4(m);
  return c;
}

/** Elipsoide com base em y = 0 (sphere já tem a base em 0). */
function ellipsoid(rx, ry, rz, w = 10, h = 7) {
  return G.sphere(1, w, h).scale(rx, ry, rz);
}

function memo(key, fn) {
  if (!cache.has(key)) cache.set(key, fn());
  return cache.get(key);
}

/**
 * Peixe deitado de lado (comprimento 0,4 m ao longo de X; use escala para atuns).
 * Corpo fusiforme + cauda + leve dorso escuro.
 */
export function fishGeometry() {
  return memo('fish', () => {
    const body = N(ellipsoid(0.2, 0.045, 0.065, 9, 6), '#ffffff');
    const back = N(T(ellipsoid(0.15, 0.01, 0.03, 7, 4), { t: [0.01, 0.075, 0] }), '#9aa3a8');
    const tail = N(G.triangle([-0.18, 0.045, 0], [-0.3, 0.05, 0.075], [-0.3, 0.05, -0.075]), '#d8dcdc');
    const tail2 = N(G.triangle([-0.18, 0.045, 0], [-0.3, 0.05, -0.075], [-0.3, 0.05, 0.075]), '#d8dcdc');
    const eye = N(T(G.sphere(0.012, 5, 3), { t: [0.14, 0.05, 0.05] }), '#202020');
    return G.merge([body, back, tail, tail2, eye]);
  });
}

/** Moreia (muraena): corpo longo e ondulado, castanho-esverdeado manchado. */
export function eelGeometry() {
  return memo('eel', () => {
    const parts = [];
    const n = 9;
    for (let i = 0; i < n; i++) {
      const x = -0.55 + i * 0.13;
      const z = Math.sin(i * 0.9) * 0.08;
      const r = i === n - 1 ? 0.03 : 0.045 - Math.max(0, i - 6) * 0.006;
      parts.push(N(T(ellipsoid(0.09, r, r, 7, 5), { t: [x, 0, z], ry: Math.cos(i * 0.9) * 0.6 }), i % 2 ? '#4f4a2e' : '#5d5636'));
    }
    return G.merge(parts);
  });
}

/** Pernil / quarto de carne pendurado (base = ponta inferior; gancho no topo). */
export function haunchGeometry() {
  return memo('haunch', () => {
    const meat = N(G.lathe([[0.0, 0.0], [0.1, 0.04], [0.15, 0.18], [0.14, 0.36], [0.09, 0.5], [0.04, 0.58], [0.0, 0.6]], 9), '#ffffff');
    const fat = N(T(G.lathe([[0.0, 0.0], [0.105, 0.03], [0.12, 0.12], [0.0, 0.14]], 9), { t: [0, 0.3, 0.02] }), '#e8d6c0');
    const bone = N(G.cylinder(0.018, 0.018, 0.12, 5).translate(0, 0.58, 0), '#efe6d6');
    const hook = N(G.cylinder(0.006, 0.006, 0.16, 4).translate(0, 0.68, 0), '#3a3836');
    return G.merge([meat, fat, bone, hook]);
  });
}

/** Meia carcaça (porco/cordeiro) pendurada pelas patas. */
export function carcassGeometry() {
  return memo('carcass', () => {
    const body = N(T(ellipsoid(0.2, 0.42, 0.09, 9, 7), { t: [0, 0.05, 0] }), '#ffffff');
    const ribs = N(T(ellipsoid(0.17, 0.3, 0.02, 8, 5), { t: [0, 0.18, 0.075] }), '#d9a596');
    const legs = [-1, 1].map((s) => N(G.cylinder(0.035, 0.025, 0.32, 5).translate(s * 0.08, 0.86, 0), '#ffffff'));
    const hook = N(G.cylinder(0.006, 0.006, 0.18, 4).translate(0, 1.16, 0), '#3a3836');
    return G.merge([body, ribs, ...legs, hook]);
  });
}

/** Réstia de salsichas (farcimina dos fartores) pendurada. */
export function sausageGeometry() {
  return memo('sausage', () => {
    const parts = [];
    for (let k = 0; k < 3; k++) {
      for (let i = 0; i < 5; i++) {
        parts.push(N(T(ellipsoid(0.025, 0.06, 0.025, 6, 4), { t: [(k - 1) * 0.07, i * 0.12, 0] }), i % 2 ? '#7a3c26' : '#8a4630'));
      }
    }
    parts.push(N(G.box(0.24, 0.02, 0.02).translate(0, 0.62, 0), '#5a4632'));
    return G.merge(parts);
  });
}

/** Peixes secos/salgados (salsamentum) pendurados em fieira. */
export function driedFishGeometry() {
  return memo('dried', () => {
    const parts = [];
    for (let i = 0; i < 4; i++) {
      const g = T(ellipsoid(0.05, 0.16, 0.012, 6, 5), { t: [(i - 1.5) * 0.12, 0.02, 0] });
      parts.push(N(g, i % 2 ? '#9a8158' : '#8a7149'));
    }
    parts.push(N(G.box(0.55, 0.015, 0.015).translate(0, 0.34, 0), '#5a4632'));
    return G.merge(parts);
  });
}

/** Cesto raso de vime (casca) — o conteúdo é o "monte" (heapGeometry), instanciado à parte. */
export function basketGeometry() {
  return memo('basket', () => N(G.lathe([[0.0, 0.0], [0.2, 0.0], [0.26, 0.2], [0.27, 0.22], [0.25, 0.22], [0.19, 0.03], [0.0, 0.03]], 12), '#a5865a'));
}

/** Monte de produtos (frutas, cogumelos, grãos, ostras...) que enche um cesto (base em 0). */
export function heapGeometry() {
  return memo('heap', () => {
    // domo granulado: esfera achatada + pequenas protuberâncias
    const parts = [N(ellipsoid(0.235, 0.09, 0.235, 12, 6))];
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      const r = i % 3 === 0 ? 0.05 : 0.15;
      parts.push(N(T(G.sphere(0.045, 6, 4), { t: [Math.cos(a) * r, 0.1 - r * 0.25, Math.sin(a) * r] })));
    }
    return G.merge(parts);
  });
}

/** Pão redondo (panis quadratus — marcado em gomos) para empilhar nos balcões. */
export function loafGeometry() {
  return memo('loaf', () => {
    const parts = [N(ellipsoid(0.11, 0.05, 0.11, 10, 5), '#ffffff')];
    for (let i = 0; i < 4; i++) parts.push(N(T(G.box(0.008, 0.012, 0.2), { ry: (i * Math.PI) / 4, t: [0, 0.088, 0] }), '#7a5530'));
    return G.merge(parts);
  });
}

/** Roda de queijo. */
export function cheeseGeometry() {
  return memo('cheese', () => N(G.lathe([[0.0, 0.0], [0.17, 0.0], [0.185, 0.03], [0.185, 0.08], [0.17, 0.11], [0.0, 0.11]], 12)));
}

/** Couve (caulis) / repolho de folhas soltas. */
export function cabbageGeometry() {
  return memo('cabbage', () => {
    const parts = [N(ellipsoid(0.11, 0.1, 0.11, 8, 6), '#ffffff')];
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      parts.push(N(T(ellipsoid(0.08, 0.06, 0.03, 6, 4), { rx: -0.6, ry: a, t: [Math.sin(a) * 0.07, 0.03, Math.cos(a) * 0.07] }), '#d8e8c0'));
    }
    return G.merge(parts);
  });
}

/** Maço de alho-poró (porrum) — branco embaixo, verde em cima. */
export function leekGeometry() {
  return memo('leek', () => {
    const parts = [];
    for (let i = 0; i < 5; i++) {
      const x = (i - 2) * 0.03;
      parts.push(N(G.cylinder(0.014, 0.014, 0.22, 5).rotateZ(Math.PI / 2).translate(0.11, 0.014 + (i % 2) * 0.02, x), '#ece6d0'));
      parts.push(N(G.cylinder(0.016, 0.006, 0.26, 5).rotateZ(-Math.PI / 2).translate(-0.11, 0.014 + (i % 2) * 0.02, x), '#5f8a3a'));
    }
    return G.merge(parts);
  });
}

/** Ave pequena (tordo, codorna) ou, em escala maior, galinha/ganso (instanciar com cor). */
export function birdGeometry() {
  return memo('bird', () => {
    const body = N(ellipsoid(0.08, 0.055, 0.055, 8, 5).translate(0, 0.02, 0));
    const head = N(G.sphere(0.03, 6, 4).translate(0.07, 0.1, 0));
    const beak = N(G.cylinder(0.01, 0.0, 0.03, 4).rotateZ(-Math.PI / 2).translate(0.1, 0.12, 0), '#c49a3a');
    const tail = N(G.box(0.06, 0.015, 0.05).translate(-0.09, 0.07, 0));
    const legs = [-1, 1].map((s) => N(G.cylinder(0.005, 0.005, 0.03, 3).translate(0, 0, s * 0.02), '#c49a3a'));
    return G.merge([body, head, beak, tail, ...legs]);
  });
}

/** Pavão (luxo recente: Hortênsio, Lurcão — Plín. 10.45): corpo azul, cauda verde fechada. */
export function peacockGeometry() {
  return memo('peacock', () => {
    const body = N(ellipsoid(0.17, 0.13, 0.11, 9, 6).translate(0, 0.32, 0), '#1f4f8a');
    const neck = N(G.cylinder(0.04, 0.03, 0.32, 6).rotateZ(-0.35).translate(0.14, 0.5, 0), '#1d5aa0');
    const head = N(G.sphere(0.045, 6, 4).translate(0.25, 0.8, 0), '#1d5aa0');
    const crest = N(G.box(0.01, 0.06, 0.05).translate(0.25, 0.88, 0), '#2a6a5a');
    const tail = N(T(ellipsoid(0.55, 0.05, 0.13, 9, 5), { rz: 0.12, t: [-0.55, 0.3, 0] }), '#2f6a3a');
    const eyes = [];
    for (let i = 0; i < 6; i++) eyes.push(N(G.sphere(0.03, 5, 3).translate(-0.5 - i * 0.09, 0.4 - i * 0.012, (i % 2 ? 1 : -1) * 0.05), '#c4a03a'));
    const legs = [-1, 1].map((s) => N(G.cylinder(0.012, 0.01, 0.24, 4).translate(0.02, 0, s * 0.05), '#8a7a6a'));
    return G.merge([body, neck, head, crest, tail, ...eyes, ...legs]);
  });
}

/** Gaiola de vime (para tordos e codornas). */
export function cageGeometry() {
  return memo('cage', () => {
    const w = 0.6, d = 0.4, h = 0.42;
    const parts = [N(G.box(w, 0.03, d))];
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) parts.push(N(G.box(0.025, h, 0.025).translate((sx * w) / 2, 0, (sz * d) / 2)));
    // barras verticais finas nas faces longas
    for (let i = 1; i < 8; i++) for (const sz of [-1, 1]) parts.push(N(G.box(0.008, h, 0.008).translate(-w / 2 + (i * w) / 8, 0, (sz * d) / 2)));
    for (let i = 1; i < 5; i++) for (const sx of [-1, 1]) parts.push(N(G.box(0.008, h, 0.008).translate((sx * w) / 2, 0, -d / 2 + (i * d) / 5)));
    parts.push(N(G.box(w + 0.03, 0.03, d + 0.03).translate(0, h, 0)));
    return G.merge(parts);
  });
}

/**
 * Statera (balança romana de braço desigual — Vitrúvio 10.3.4): alça perto da "cabeça",
 * prato pequeno (lancula) pendente, contrapeso (aequipondium) que corre pelos pontos do
 * braço (scapus). Altura total ≈ 0,75 m; base em y = 0 = fundo do prato. Bronze.
 */
export function stateraGeometry() {
  return memo('statera', () => {
    const parts = [];
    const armY = 0.55;
    // braço graduado (pontos = anéis finos)
    parts.push(N(G.cylinder(0.008, 0.008, 0.7, 6).rotateZ(Math.PI / 2).translate(0.5, armY, 0)));
    for (let i = 1; i <= 8; i++) parts.push(N(G.cylinder(0.011, 0.011, 0.006, 6).rotateZ(Math.PI / 2).translate(-0.05 + i * 0.065, armY, 0)));
    // cabeça e alça de suspensão
    parts.push(N(G.box(0.05, 0.05, 0.02).translate(-0.17, armY - 0.025, 0)));
    parts.push(N(G.cylinder(0.004, 0.004, 0.2, 4).translate(-0.14, armY, 0)));
    parts.push(N(T(G.lathe([[0.03, 0], [0.034, 0.005], [0.03, 0.01]], 8), { rx: Math.PI / 2, t: [-0.14, armY + 0.22, 0] })));
    // correntes e prato pequeno
    for (const s of [-1, 1]) parts.push(N(G.cylinder(0.002, 0.002, armY - 0.03, 3).rotateZ(s * 0.12).translate(-0.19 + s * 0.03, 0.03, 0)));
    parts.push(N(G.lathe([[0.0, 0.0], [0.09, 0.01], [0.1, 0.03], [0.095, 0.035], [0.0, 0.02]], 10).translate(-0.19, 0, 0)));
    // contrapeso (pendente do braço)
    parts.push(N(G.cylinder(0.002, 0.002, 0.08, 3).translate(0.42, armY - 0.08, 0)));
    parts.push(N(G.lathe([[0.0, 0.0], [0.035, 0.01], [0.04, 0.05], [0.025, 0.08], [0.0, 0.09]], 8).translate(0.42, armY - 0.17, 0)));
    return G.merge(parts);
  });
}

/** Balança de dois pratos sobre pedestal (hipótese — nota 08 §8.1). Bronze. */
export function libraGeometry() {
  return memo('libra', () => {
    const parts = [];
    parts.push(N(G.cylinder(0.06, 0.07, 0.03, 10)));
    parts.push(N(G.cylinder(0.01, 0.01, 0.42, 6).translate(0, 0.03, 0)));
    parts.push(N(G.box(0.5, 0.012, 0.012).translate(0, 0.44, 0)));
    for (const s of [-1, 1]) {
      for (const k of [-1, 1]) parts.push(N(G.cylinder(0.0015, 0.0015, 0.24, 3).rotateX(k * 0.18).translate(s * 0.24, 0.2, 0)));
      parts.push(N(G.lathe([[0.0, 0.0], [0.08, 0.008], [0.09, 0.025], [0.0, 0.015]], 10).translate(s * 0.24, 0.18, 0)));
    }
    return G.merge(parts);
  });
}

/** Cepo de açougueiro com cutelo cravado. */
export function blockGeometry() {
  return memo('block', () => {
    const parts = [];
    parts.push(N(G.cylinder(0.3, 0.32, 0.78, 12), '#5a3e28'));
    parts.push(N(G.disc(0.3, 12, 0.781, true), '#9a7a58'));
    parts.push(N(T(G.box(0.22, 0.12, 0.012), { rz: 0.2, t: [0.04, 0.76, 0] }), '#6a6866'));
    parts.push(N(T(G.cylinder(0.015, 0.015, 0.14, 5), { rz: 1.37, t: [-0.08, 0.82, 0] }), '#4a3220'));
    return G.merge(parts);
  });
}

/** Caldeirão / panela de bronze (caccabus) dos cozinheiros. */
export function potGeometry() {
  return memo('pot', () => N(G.lathe([[0.0, 0.0], [0.12, 0.01], [0.18, 0.08], [0.19, 0.17], [0.16, 0.22], [0.17, 0.24], [0.15, 0.24], [0.0, 0.18]], 12)));
}

/** Cadus (ânfora de vinho de Quios, mais bojuda e curta que a Dressel 1). */
export function cadusGeometry() {
  return memo('cadus', () =>
    G.merge([
      N(G.lathe([[0.0, 0.0], [0.05, 0.02], [0.1, 0.1], [0.19, 0.32], [0.19, 0.48], [0.12, 0.6], [0.06, 0.66], [0.055, 0.8], [0.07, 0.84], [0.0, 0.85]], 12)),
      N(G.box(0.03, 0.2, 0.04).translate(0.09, 0.6, 0)),
      N(G.box(0.03, 0.2, 0.04).translate(-0.09, 0.6, 0)),
    ]),
  );
}

/** Frasco pequeno (unguentário de perfume / mel / especiarias). */
export function flaskGeometry() {
  return memo('flask', () => N(G.lathe([[0.0, 0.0], [0.03, 0.0], [0.045, 0.05], [0.04, 0.1], [0.015, 0.14], [0.018, 0.17], [0.0, 0.17]], 8)));
}

/** Saco de grãos aberto (espelta, grão-de-bico) com a boca dobrada. */
export function grainSackGeometry() {
  return memo('gsack', () => {
    const sack = N(G.lathe([[0.0, 0.0], [0.2, 0.0], [0.24, 0.15], [0.23, 0.42], [0.25, 0.48], [0.21, 0.5], [0.0, 0.5]], 10), '#c9b48c');
    return sack;
  });
}

/**
 * Mula de carga com cangalha e dois cestos (o "pangaré do verdureiro", Hor. Ep. 1.18.36).
 * Comprimento ao longo de X (cabeça em +X). Cores embutidas.
 */
export function muleGeometry() {
  return memo('mule', () => {
    const coat = '#5e4a3a';
    const parts = [];
    parts.push(N(T(ellipsoid(0.62, 0.3, 0.26, 10, 7), { t: [0, 0.72, 0] }), coat));
    // pescoço e cabeça
    parts.push(N(T(G.cylinder(0.14, 0.11, 0.55, 8), { rz: -0.75, t: [0.5, 1.05, 0] }), coat));
    parts.push(N(T(ellipsoid(0.24, 0.1, 0.1, 8, 5), { rz: -0.35, t: [0.98, 1.22, 0] }), coat));
    parts.push(N(T(ellipsoid(0.07, 0.06, 0.08, 6, 4), { t: [1.17, 1.14, 0] }), '#3a2e26'));
    for (const s of [-1, 1]) parts.push(N(T(G.cylinder(0.035, 0.01, 0.3, 5), { rx: s * 0.25, t: [0.82, 1.38, s * 0.06] }), coat)); // orelhas compridas
    // pernas
    for (const [lx, lz] of [[0.42, 0.13], [0.42, -0.13], [-0.42, 0.13], [-0.42, -0.13]]) {
      parts.push(N(G.cylinder(0.055, 0.04, 0.82, 6).translate(lx, 0.0, lz), coat));
      parts.push(N(G.cylinder(0.05, 0.05, 0.06, 6).translate(lx, 0.0, lz), '#2a2420'));
    }
    parts.push(N(T(G.cylinder(0.03, 0.01, 0.45, 5), { rz: 2.6, t: [-0.6, 0.95, 0] }), '#3a2e26')); // cauda
    // cangalha (manta + armação) e cestos laterais
    parts.push(N(G.box(0.7, 0.06, 0.62).translate(0, 1.0, 0), '#7a3c2c'));
    parts.push(N(G.box(0.08, 0.2, 0.5).translate(0.25, 1.04, 0), '#5a4632'));
    parts.push(N(G.box(0.08, 0.2, 0.5).translate(-0.25, 1.04, 0), '#5a4632'));
    for (const s of [-1, 1]) {
      parts.push(N(G.lathe([[0.0, 0.0], [0.17, 0.0], [0.22, 0.42], [0.2, 0.42], [0.15, 0.03], [0.0, 0.03]], 10).translate(0, 0.62, s * 0.42), '#a5865a'));
      parts.push(N(T(ellipsoid(0.19, 0.08, 0.19, 8, 4), { t: [0, 1.0, s * 0.42] }), s > 0 ? '#5f8a3a' : '#7b8f45')); // couves e ervas
    }
    return G.merge(parts);
  });
}

/** Galinha/ganso no chão: usa birdGeometry com escala (helper de conveniência). */
export const BIRD_SCALES = { thrush: 1, hen: 2.6, goose: 3.6 };
