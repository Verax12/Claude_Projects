/**
 * Objetos de cena (props): ânforas, dolia, mesas, bancos, bancas de mercado, cestos,
 * braseiros, leitos, arcas, lucernas, altares, fontes etc.
 *
 * Cada objeto existe como geometria (para instanciar em grande quantidade via
 * ctx.world.instances) e pode ser adicionado individualmente com prop(b, nome, ...).
 * As formas são simplificadas mas seguem tipos conhecidos (ex.: ânfora de vinho
 * do tipo Dressel 1, comum no séc. I a.C. — ver docs/pesquisa/08).
 */
import * as THREE from 'three';
import * as G from '../render/geom.js';

const cache = new Map();

/** Material sugerido de cada prop. */
export const PROP_MATS = {
  amphora: 'terracotta',
  dolium: 'terracotta',
  jar: 'terracotta',
  basket: 'woodLight',
  sack: 'cloth',
  crate: 'wood',
  table: 'wood',
  bench: 'wood',
  stool: 'wood',
  brazier: 'bronze',
  lampStand: 'bronze',
  chest: 'woodDark',
  bed: 'wood',
  mattress: 'cloth',
  altar: 'travertine',
  basin: 'travertine',
  puteal: 'marble',
  bread: 'woodLight',
};

function n(g) {
  return G.normalizeGeometry(g);
}

/** Geometria (normalizada, base em y=0) de um prop pelo nome. */
export function propGeometry(name) {
  if (cache.has(name)) return cache.get(name);
  let g;
  switch (name) {
    case 'amphora': // ânfora de vinho (perfil alongado, pé pontiagudo, duas asas)
      g = G.merge([
        n(G.lathe([[0.0, 0.0], [0.04, 0.03], [0.07, 0.15], [0.15, 0.45], [0.16, 0.62], [0.12, 0.75], [0.06, 0.82], [0.055, 1.05], [0.075, 1.1], [0.0, 1.11]], 12)),
        n(G.box(0.03, 0.28, 0.05).translate(0.1, 0.8, 0)),
        n(G.box(0.03, 0.28, 0.05).translate(-0.1, 0.8, 0)),
      ]);
      break;
    case 'dolium': // grande jarro de armazenamento
      g = n(G.lathe([[0.0, 0.0], [0.3, 0.02], [0.5, 0.35], [0.55, 0.65], [0.45, 1.0], [0.3, 1.12], [0.32, 1.18], [0.0, 1.18]], 14));
      break;
    case 'jar':
      g = n(G.lathe([[0.0, 0.0], [0.1, 0.0], [0.16, 0.15], [0.15, 0.28], [0.08, 0.36], [0.09, 0.4], [0.0, 0.4]], 10));
      break;
    case 'basket':
      g = n(G.lathe([[0.0, 0.0], [0.22, 0.0], [0.28, 0.25], [0.27, 0.27], [0.21, 0.04], [0.0, 0.04]], 12));
      break;
    case 'sack':
      g = n(G.sphere(0.28, 8, 6).scale(1, 1.25, 0.9));
      break;
    case 'crate':
      g = n(G.box(0.6, 0.45, 0.45));
      break;
    case 'table': // mesa simples de madeira
      g = G.merge([n(G.box(1.4, 0.06, 0.8).translate(0, 0.74, 0)), ...[[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, c]) => n(G.box(0.07, 0.74, 0.07).translate(a * 0.62, 0, c * 0.33)))]);
      break;
    case 'bench':
      g = G.merge([n(G.box(1.8, 0.06, 0.35).translate(0, 0.42, 0)), n(G.box(0.08, 0.42, 0.3).translate(-0.8, 0, 0)), n(G.box(0.08, 0.42, 0.3).translate(0.8, 0, 0))]);
      break;
    case 'stool': // banquinho de três pés
      g = G.merge([n(G.cylinder(0.18, 0.18, 0.05, 10).translate(0, 0.42, 0)), ...[0, 1, 2].map((i) => n(G.cylinder(0.025, 0.025, 0.42, 5).translate(Math.sin((i * Math.PI * 2) / 3) * 0.12, 0, Math.cos((i * Math.PI * 2) / 3) * 0.12)))]);
      break;
    case 'brazier': // braseiro de bronze sobre tripé
      g = G.merge([n(G.lathe([[0.0, 0.55], [0.3, 0.6], [0.34, 0.72], [0.0, 0.66]], 12)), ...[0, 1, 2].map((i) => n(G.cylinder(0.02, 0.02, 0.6, 5).translate(Math.sin((i * Math.PI * 2) / 3) * 0.22, 0, Math.cos((i * Math.PI * 2) / 3) * 0.22)))]);
      break;
    case 'lampStand': // candelabro alto de bronze
      g = G.merge([n(G.cylinder(0.18, 0.05, 0.12, 8)), n(G.cylinder(0.018, 0.018, 1.25, 6).translate(0, 0.1, 0)), n(G.cylinder(0.1, 0.08, 0.04, 10).translate(0, 1.35, 0))]);
      break;
    case 'chest': // arca
      g = G.merge([n(G.box(1.1, 0.6, 0.55)), n(G.box(1.14, 0.06, 0.59).translate(0, 0.6, 0))]);
      break;
    case 'bed': // leito simples (cama de madeira com estrado)
      g = G.merge([n(G.box(1.9, 0.12, 0.85).translate(0, 0.42, 0)), ...[[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, c]) => n(G.box(0.08, 0.42, 0.08).translate(a * 0.88, 0, c * 0.36))), n(G.box(0.08, 0.35, 0.85).translate(-0.92, 0.5, 0))]);
      break;
    case 'mattress':
      g = n(G.box(1.8, 0.14, 0.78).translate(0, 0.54, 0));
      break;
    case 'altar': // ara de pedra
      g = G.merge([n(G.box(1.1, 0.2, 0.8)), n(G.box(0.9, 0.85, 0.6).translate(0, 0.2, 0)), n(G.box(1.1, 0.2, 0.8).translate(0, 1.05, 0)), n(G.cylinder(0.12, 0.12, 0.7, 8).rotateZ(Math.PI / 2).translate(0.35, 1.37, 0))]);
      break;
    case 'basin': // bacia retangular de fonte (lacus)
      g = G.merge([n(G.box(2.4, 0.7, 0.2).translate(0, 0, 0.6)), n(G.box(2.4, 0.7, 0.2).translate(0, 0, -0.6)), n(G.box(0.2, 0.7, 1.4).translate(1.1, 0, 0)), n(G.box(0.2, 0.7, 1.4).translate(-1.1, 0, 0)), n(G.box(2.0, 0.1, 1.0))]);
      break;
    case 'puteal': // bocal de poço / puteal
      g = n(G.lathe([[0.55, 0], [0.6, 0.05], [0.6, 0.85], [0.55, 0.9], [0.45, 0.9], [0.45, 0.05], [0.0, 0.05]], 16));
      break;
    case 'bread': // pães redondos sobre tábua
      g = G.merge([n(G.box(0.7, 0.04, 0.45)), ...[[-0.2, -0.1], [0.05, 0.1], [0.2, -0.08]].map(([a, c]) => n(G.sphere(0.09, 8, 5).scale(1, 0.5, 1).translate(a, 0.03, c)))]);
      break;
    default:
      throw new Error(`Prop desconhecido: ${name}`);
  }
  cache.set(name, g);
  return g;
}

/** Adiciona um prop individual ao builder (no quadro atual). */
export function prop(b, name, x, y, z, rotY = 0, scale = 1, o = {}) {
  const m = new THREE.Matrix4().compose(
    new THREE.Vector3(x, y, z),
    new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotY),
    new THREE.Vector3(scale, scale, scale),
  );
  b.add(propGeometry(name), { mat: o.mat || PROP_MATS[name] || 'wood', matrix: m, color: o.color, collide: o.collide ?? false });
}

/**
 * Banca de mercado: tampo de madeira sobre cavaletes, toldo de tecido em armação de madeira
 * e mercadorias (instanciadas pelo chamador ou passadas em `goods`).
 * @param {object} o { w, d, awning (true), awningColor, goods: [{ name, count }] }
 */
export function stall(b, x, y, z, rotY = 0, o = {}) {
  const w = o.w ?? 2.4;
  const d = o.d ?? 1.0;
  b.push(x, y, z, rotY);
  b.box(w, 0.08, d, 0, 0.82, 0, { mat: 'wood', collide: false });
  for (const s of [-1, 1]) b.box(0.08, 0.82, d * 0.9, s * (w / 2 - 0.15), 0, 0, { mat: 'woodDark', collide: false });
  b.colliderBox(w, 0.9, d, 0, 0, 0);
  if (o.awning !== false) {
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) b.box(0.07, 2.3, 0.07, sx * (w / 2), 0, sz * (d / 2 + 0.3), { mat: 'woodDark', collide: false });
    const ah = 2.3;
    b.quad([-w / 2 - 0.1, ah - 0.25, d / 2 + 0.6], [w / 2 + 0.1, ah - 0.25, d / 2 + 0.6], [w / 2 + 0.1, ah, -d / 2 - 0.3], [-w / 2 - 0.1, ah, -d / 2 - 0.3], { mat: o.awningMat || 'clothStriped', color: o.awningColor });
    b.quad([w / 2 + 0.1, ah - 0.27, d / 2 + 0.6], [-w / 2 - 0.1, ah - 0.27, d / 2 + 0.6], [-w / 2 - 0.1, ah - 0.02, -d / 2 - 0.3], [w / 2 + 0.1, ah - 0.02, -d / 2 - 0.3], { mat: o.awningMat || 'clothStriped', color: o.awningColor });
  }
  // mercadorias sobre o tampo
  for (const gd of o.goods || []) {
    for (let i = 0; i < gd.count; i++) {
      const gx = -w / 2 + 0.3 + ((w - 0.6) * (i + 0.5)) / gd.count;
      prop(b, gd.name, gx, 0.9, (gd.row ?? 0) * 0.3, (i * 1.7) % 6.28, gd.scale ?? 1, { color: gd.color });
    }
  }
  b.pop();
}
